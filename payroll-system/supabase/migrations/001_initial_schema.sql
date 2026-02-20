-- =====================================================
-- Migration: 001_initial_schema.sql
-- Description: Create core tables for payroll system
-- Author: Super Prompt Engineer
-- Date: 2026-02-20
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'supervisor');
CREATE TYPE employee_type AS ENUM ('W2', '1099');
CREATE TYPE entry_status AS ENUM ('pending', 'approved', 'rejected', 'locked');
CREATE TYPE period_status AS ENUM ('open', 'closed', 'exported');

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON COLUMN users.role IS 'Access level: owner (full), manager (approvals), supervisor (data entry)';

-- =====================================================
-- WORKERS TABLE
-- =====================================================

CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    employee_type employee_type NOT NULL,
    base_hourly_rate DECIMAL(10,2) NOT NULL CHECK (base_hourly_rate > 0),
    ot_multiplier DECIMAL(3,2) DEFAULT 1.5 CHECK (ot_multiplier >= 1.0),
    min_hourly_guarantee BOOLEAN DEFAULT true,
    piece_rate_enabled BOOLEAN DEFAULT true,
    crew VARCHAR(50),
    active BOOLEAN DEFAULT true,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_ot_multiplier CHECK (
        (employee_type = 'W2' AND ot_multiplier >= 1.5) OR
        (employee_type = '1099' AND ot_multiplier = 1.0)
    )
);

-- Indexes for workers
CREATE INDEX idx_workers_code ON workers(worker_code);
CREATE INDEX idx_workers_employee_type ON workers(employee_type);
CREATE INDEX idx_workers_crew ON workers(crew);
CREATE INDEX idx_workers_active ON workers(active);

COMMENT ON TABLE workers IS 'Worker profiles with compensation settings';
COMMENT ON COLUMN workers.ot_multiplier IS 'W2: 1.5 (time-and-a-half), 1099: 1.0 (no OT premium)';
COMMENT ON COLUMN workers.min_hourly_guarantee IS 'If true, pay max(piece_rate, hourly_rate)';

-- =====================================================
-- PAY ITEM CATALOG
-- =====================================================

CREATE TABLE pay_item_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    category VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pay_item_catalog
CREATE INDEX idx_pay_items_code ON pay_item_catalog(item_code);
CREATE INDEX idx_pay_items_category ON pay_item_catalog(category);
CREATE INDEX idx_pay_items_active ON pay_item_catalog(active);

COMMENT ON TABLE pay_item_catalog IS 'Service/production item definitions';
COMMENT ON COLUMN pay_item_catalog.unit IS 'e.g., FT (feet), EA (each), SF (square feet)';

-- =====================================================
-- RATE TABLE (Time-versioned rates)
-- =====================================================

CREATE TABLE rate_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pay_item_id UUID NOT NULL REFERENCES pay_item_catalog(id) ON DELETE CASCADE,
    rate_amount DECIMAL(10,2) NOT NULL CHECK (rate_amount >= 0),
    effective_from DATE NOT NULL,
    effective_to DATE,
    context_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

-- Indexes for rate_table
CREATE INDEX idx_rates_pay_item ON rate_table(pay_item_id);
CREATE INDEX idx_rates_effective_dates ON rate_table(effective_from, effective_to);

-- Prevent overlapping rate periods for same pay item
CREATE UNIQUE INDEX idx_rates_no_overlap ON rate_table(
    pay_item_id,
    effective_from
) WHERE effective_to IS NULL;

COMMENT ON TABLE rate_table IS 'Time-versioned rates for pay items (supports rate changes)';

-- =====================================================
-- TIME ENTRIES
-- =====================================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    clock_in TIME NOT NULL,
    clock_out TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0 CHECK (break_minutes >= 0),
    total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600 - (break_minutes / 60.0)
    ) STORED,
    crew VARCHAR(50),
    status entry_status DEFAULT 'pending',
    notes TEXT,
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_times CHECK (clock_out > clock_in),
    CONSTRAINT one_entry_per_day UNIQUE (worker_id, entry_date)
);

-- Indexes for time_entries
CREATE INDEX idx_time_worker_date ON time_entries(worker_id, entry_date);
CREATE INDEX idx_time_status ON time_entries(status);
CREATE INDEX idx_time_crew ON time_entries(crew);
CREATE INDEX idx_time_entry_date ON time_entries(entry_date);

COMMENT ON TABLE time_entries IS 'Daily time tracking with clock in/out';
COMMENT ON COLUMN time_entries.total_hours IS 'Computed: (clock_out - clock_in) - break_minutes/60';

-- =====================================================
-- PRODUCTION ENTRIES
-- =====================================================

CREATE TABLE production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    pay_item_id UUID NOT NULL REFERENCES pay_item_catalog(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    crew VARCHAR(50),
    status entry_status DEFAULT 'pending',
    notes TEXT,
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for production_entries
CREATE INDEX idx_prod_worker_date ON production_entries(worker_id, entry_date);
CREATE INDEX idx_prod_pay_item ON production_entries(pay_item_id);
CREATE INDEX idx_prod_status ON production_entries(status);
CREATE INDEX idx_prod_crew ON production_entries(crew);
CREATE INDEX idx_prod_entry_date ON production_entries(entry_date);

COMMENT ON TABLE production_entries IS 'Daily production quantities by pay item';

-- =====================================================
-- PAYROLL CALCULATIONS
-- =====================================================

CREATE TABLE payroll_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours DECIMAL(6,2) DEFAULT 0,
    regular_hours DECIMAL(6,2) DEFAULT 0,
    ot_hours DECIMAL(6,2) DEFAULT 0,
    piece_earnings DECIMAL(10,2) DEFAULT 0,
    hourly_earnings DECIMAL(10,2) DEFAULT 0,
    ot_premium DECIMAL(10,2) DEFAULT 0,
    min_guarantee_applied DECIMAL(10,2) DEFAULT 0,
    total_pay DECIMAL(10,2) NOT NULL CHECK (total_pay >= 0),
    payment_method VARCHAR(100),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT unique_worker_period UNIQUE (worker_id, period_start, period_end)
);

-- Indexes for payroll_calculations
CREATE INDEX idx_payroll_worker ON payroll_calculations(worker_id);
CREATE INDEX idx_payroll_period ON payroll_calculations(period_start, period_end);

COMMENT ON TABLE payroll_calculations IS 'Calculated payroll results for each worker per period';
COMMENT ON COLUMN payroll_calculations.total_pay IS 'Final amount: max(piece_earnings, hourly_earnings) + ot_premium';

-- =====================================================
-- PAY PERIODS
-- =====================================================

CREATE TABLE pay_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status period_status DEFAULT 'open',
    total_payroll DECIMAL(12,2),
    exported_at TIMESTAMP WITH TIME ZONE,
    exported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_period CHECK (end_date >= start_date),
    CONSTRAINT unique_period UNIQUE (start_date, end_date)
);

-- Indexes for pay_periods
CREATE INDEX idx_periods_dates ON pay_periods(start_date, end_date);
CREATE INDEX idx_periods_status ON pay_periods(status);

COMMENT ON TABLE pay_periods IS 'Pay period management and export tracking';

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance (7-year retention)';

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_entries_updated_at
    BEFORE UPDATE ON production_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA / CONSTRAINTS COMPLETE
-- =====================================================

COMMENT ON SCHEMA public IS 'Underground Construction Payroll Management System - v1.0';

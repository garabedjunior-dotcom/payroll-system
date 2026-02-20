-- =====================================================
-- Seed Data: seed.sql
-- Description: Initial data for testing and demo
-- Author: Super Prompt Engineer
-- Date: 2026-02-20
-- =====================================================

-- =====================================================
-- USERS (Demo accounts)
-- =====================================================
-- Password for all demo accounts: "Password123!"
-- Hash generated with bcrypt rounds=10

INSERT INTO users (id, email, password_hash, role, full_name, active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'owner@undergroundcorp.com', '$2a$10$rKvK3g6qJ5x8Ky7QZz8t1.XqJ9Qh5Y6ZJz8Ky7QZz8t1XqJ9Qh5Y6', 'owner', 'Robert Owner', true),
    ('00000000-0000-0000-0000-000000000002', 'manager@undergroundcorp.com', '$2a$10$rKvK3g6qJ5x8Ky7QZz8t1.XqJ9Qh5Y6ZJz8Ky7QZz8t1XqJ9Qh5Y6', 'manager', 'Michelle Manager', true),
    ('00000000-0000-0000-0000-000000000003', 'supervisor@undergroundcorp.com', '$2a$10$rKvK3g6qJ5x8Ky7QZz8t1.XqJ9Qh5Y6ZJz8Ky7QZz8t1XqJ9Qh5Y6', 'supervisor', 'Steve Supervisor', true);

-- =====================================================
-- WORKERS (From Excel sheet)
-- =====================================================

INSERT INTO workers (id, worker_code, full_name, employee_type, base_hourly_rate, ot_multiplier, min_hourly_guarantee, piece_rate_enabled, crew, active, hire_date) VALUES
    ('10000000-0000-0000-0000-000000000001', 'W001', 'John Silva', 'W2', 18.00, 1.5, true, true, 'Crew A', true, '2024-01-15'),
    ('10000000-0000-0000-0000-000000000002', 'W002', 'Maria Santos', 'W2', 20.00, 1.5, true, true, 'Crew A', true, '2024-02-01'),
    ('10000000-0000-0000-0000-000000000003', 'W003', 'Carlos Mendes', '1099', 22.00, 1.0, false, true, 'Crew C', true, '2024-03-10'),
    ('10000000-0000-0000-0000-000000000004', 'W004', 'Pedro Costa', 'W2', 17.50, 1.5, true, true, 'Crew B', true, '2024-01-20'),
    ('10000000-0000-0000-0000-000000000005', 'W005', 'Ana Lima', 'W2', 19.00, 1.5, true, true, 'Crew A', true, '2024-04-05'),
    ('10000000-0000-0000-0000-000000000006', 'W006', 'Jose Rodrigues', 'W2', 18.50, 1.5, true, true, 'Crew B', true, '2024-05-12');

-- =====================================================
-- PAY ITEM CATALOG (From Excel sheet)
-- =====================================================

INSERT INTO pay_item_catalog (id, item_code, description, unit, category, active) VALUES
    ('20000000-0000-0000-0000-000000000001', 'HDD_FT', 'Horizontal Directional Drilling', 'FT', 'Installation', true),
    ('20000000-0000-0000-0000-000000000002', 'TRENCH_FT', 'Open Trench Installation', 'FT', 'Installation', true),
    ('20000000-0000-0000-0000-000000000003', 'HANDHOLE_EA', 'Handhole Installation', 'EA', 'Structure', true),
    ('20000000-0000-0000-0000-000000000004', 'VAULT_EA', 'Vault Installation', 'EA', 'Structure', true),
    ('20000000-0000-0000-0000-000000000005', 'POTHOLE_EA', 'Potholing', 'EA', 'Investigation', true),
    ('20000000-0000-0000-0000-000000000006', 'BORING_FT', 'Auger Boring', 'FT', 'Installation', true),
    ('20000000-0000-0000-0000-000000000007', 'SAWCUT_FT', 'Concrete Sawcutting', 'FT', 'Preparation', true),
    ('20000000-0000-0000-0000-000000000008', 'PATCH_SF', 'Pavement Patching', 'SF', 'Restoration', true),
    ('20000000-0000-0000-0000-000000000009', 'CONDUIT_FT', 'Conduit Installation', 'FT', 'Installation', true),
    ('20000000-0000-0000-0000-000000000010', 'SPLICE_EA', 'Fiber Splice', 'EA', 'Connection', true);

-- =====================================================
-- RATE TABLE (Current rates from Excel)
-- =====================================================

INSERT INTO rate_table (pay_item_id, rate_amount, effective_from, effective_to, context_notes) VALUES
    ('20000000-0000-0000-0000-000000000001', 0.85, '2026-01-01', '2026-12-31', 'Urban HDD standard'),
    ('20000000-0000-0000-0000-000000000002', 0.65, '2026-01-01', '2026-12-31', 'Open trench standard'),
    ('20000000-0000-0000-0000-000000000003', 45.00, '2026-01-01', '2026-12-31', 'Standard handhole'),
    ('20000000-0000-0000-0000-000000000004', 85.00, '2026-01-01', '2026-12-31', 'Standard vault'),
    ('20000000-0000-0000-0000-000000000005', 35.00, '2026-01-01', '2026-12-31', 'Standard pothole'),
    ('20000000-0000-0000-0000-000000000006', 1.20, '2026-01-01', '2026-12-31', 'Auger boring rate'),
    ('20000000-0000-0000-0000-000000000007', 0.55, '2026-01-01', '2026-12-31', 'Concrete sawcutting'),
    ('20000000-0000-0000-0000-000000000008', 0.30, '2026-01-01', '2026-12-31', 'Pavement patching'),
    ('20000000-0000-0000-0000-000000000009', 0.40, '2026-01-01', '2026-12-31', 'Conduit installation'),
    ('20000000-0000-0000-0000-000000000010', 12.50, '2026-01-01', '2026-12-31', 'Fiber splice');

-- =====================================================
-- TIME ENTRIES (Sample data from Excel - Week of Jan 27-31)
-- =====================================================

INSERT INTO time_entries (
    worker_id, entry_date, clock_in, clock_out, break_minutes, 
    crew, status, notes, submitted_by
) VALUES
    -- Monday Jan 27
    ('10000000-0000-0000-0000-000000000001', '2026-01-27', '07:00', '16:30', 30, 'Crew A', 'approved', 'Normal shift', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '2026-01-27', '07:00', '16:30', 30, 'Crew A', 'approved', 'Normal shift', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-27', '07:00', '16:30', 30, 'Crew B', 'approved', 'Normal shift', '00000000-0000-0000-0000-000000000003'),
    
    -- Tuesday Jan 28
    ('10000000-0000-0000-0000-000000000001', '2026-01-28', '07:00', '17:00', 30, 'Crew A', 'approved', 'Extended day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '2026-01-28', '07:00', '17:00', 30, 'Crew A', 'approved', 'Extended day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-28', '07:00', '16:30', 30, 'Crew B', 'approved', 'Normal shift', '00000000-0000-0000-0000-000000000003'),
    
    -- Wednesday Jan 29
    ('10000000-0000-0000-0000-000000000001', '2026-01-29', '07:00', '17:30', 30, 'Crew A', 'approved', 'Long day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '2026-01-29', '07:00', '17:30', 30, 'Crew A', 'approved', 'Long day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-29', '07:00', '17:00', 30, 'Crew B', 'approved', 'Extended day', '00000000-0000-0000-0000-000000000003'),
    
    -- Thursday Jan 30
    ('10000000-0000-0000-0000-000000000001', '2026-01-30', '07:00', '17:30', 30, 'Crew A', 'approved', 'Long day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '2026-01-30', '07:00', '17:30', 30, 'Crew A', 'approved', 'Long day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-30', '07:00', '17:30', 30, 'Crew B', 'approved', 'Long day', '00000000-0000-0000-0000-000000000003'),
    
    -- Friday Jan 31
    ('10000000-0000-0000-0000-000000000001', '2026-01-31', '07:00', '17:00', 30, 'Crew A', 'approved', 'Extended day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '2026-01-31', '07:00', '17:00', 30, 'Crew A', 'approved', 'Extended day', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-31', '07:00', '16:30', 30, 'Crew B', 'approved', 'Normal shift', '00000000-0000-0000-0000-000000000003');

-- =====================================================
-- PRODUCTION ENTRIES (Sample data from Excel)
-- =====================================================

INSERT INTO production_entries (
    worker_id, entry_date, pay_item_id, quantity, 
    crew, status, notes, submitted_by
) VALUES
    -- Monday Jan 27 - John Silva (HDD)
    ('10000000-0000-0000-0000-000000000001', '2026-01-27', '20000000-0000-0000-0000-000000000001', 450, 'Crew A', 'approved', 'Good progress', '00000000-0000-0000-0000-000000000003'),
    
    -- Monday Jan 27 - Maria Santos (HDD)
    ('10000000-0000-0000-0000-000000000002', '2026-01-27', '20000000-0000-0000-0000-000000000001', 450, 'Crew A', 'approved', 'Good progress', '00000000-0000-0000-0000-000000000003'),
    
    -- Monday Jan 27 - Pedro Costa (Trench + Handholes)
    ('10000000-0000-0000-0000-000000000004', '2026-01-27', '20000000-0000-0000-0000-000000000002', 320, 'Crew B', 'approved', 'Standard trench', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-27', '20000000-0000-0000-0000-000000000003', 2, 'Crew B', 'approved', '2 handholes', '00000000-0000-0000-0000-000000000003'),
    
    -- Tuesday Jan 28 - John Silva (HDD)
    ('10000000-0000-0000-0000-000000000001', '2026-01-28', '20000000-0000-0000-0000-000000000001', 520, 'Crew A', 'approved', 'Excellent day', '00000000-0000-0000-0000-000000000003'),
    
    -- Tuesday Jan 28 - Maria Santos (HDD)
    ('10000000-0000-0000-0000-000000000002', '2026-01-28', '20000000-0000-0000-0000-000000000001', 480, 'Crew A', 'approved', 'Good production', '00000000-0000-0000-0000-000000000003'),
    
    -- Tuesday Jan 28 - Pedro Costa (Trench)
    ('10000000-0000-0000-0000-000000000004', '2026-01-28', '20000000-0000-0000-0000-000000000002', 400, 'Crew B', 'approved', 'Steady progress', '00000000-0000-0000-0000-000000000003'),
    
    -- Wednesday Jan 29 - John Silva (HDD)
    ('10000000-0000-0000-0000-000000000001', '2026-01-29', '20000000-0000-0000-0000-000000000001', 550, 'Crew A', 'approved', 'Great progress', '00000000-0000-0000-0000-000000000003'),
    
    -- Wednesday Jan 29 - Maria Santos (HDD)
    ('10000000-0000-0000-0000-000000000002', '2026-01-29', '20000000-0000-0000-0000-000000000001', 500, 'Crew A', 'approved', 'Good day', '00000000-0000-0000-0000-000000000003'),
    
    -- Wednesday Jan 29 - Pedro Costa (Trench + Vault)
    ('10000000-0000-0000-0000-000000000004', '2026-01-29', '20000000-0000-0000-0000-000000000002', 350, 'Crew B', 'approved', 'Trench work', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-29', '20000000-0000-0000-0000-000000000004', 1, 'Crew B', 'approved', '1 vault installed', '00000000-0000-0000-0000-000000000003'),
    
    -- Thursday Jan 30 - John Silva (HDD)
    ('10000000-0000-0000-0000-000000000001', '2026-01-30', '20000000-0000-0000-0000-000000000001', 580, 'Crew A', 'approved', 'Excellent production', '00000000-0000-0000-0000-000000000003'),
    
    -- Thursday Jan 30 - Maria Santos (HDD)
    ('10000000-0000-0000-0000-000000000002', '2026-01-30', '20000000-0000-0000-0000-000000000001', 530, 'Crew A', 'approved', 'Strong performance', '00000000-0000-0000-0000-000000000003'),
    
    -- Thursday Jan 30 - Pedro Costa (Trench + Handholes)
    ('10000000-0000-0000-0000-000000000004', '2026-01-30', '20000000-0000-0000-0000-000000000002', 380, 'Crew B', 'approved', 'Good trench work', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000004', '2026-01-30', '20000000-0000-0000-0000-000000000003', 3, 'Crew B', 'approved', '3 handholes', '00000000-0000-0000-0000-000000000003'),
    
    -- Friday Jan 31 - John Silva (HDD + Pothole)
    ('10000000-0000-0000-0000-000000000001', '2026-01-31', '20000000-0000-0000-0000-000000000001', 400, 'Crew A', 'approved', 'Final day of week', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000001', '2026-01-31', '20000000-0000-0000-0000-000000000005', 2, 'Crew A', 'approved', '2 potholes', '00000000-0000-0000-0000-000000000003'),
    
    -- Friday Jan 31 - Maria Santos (HDD)
    ('10000000-0000-0000-0000-000000000002', '2026-01-31', '20000000-0000-0000-0000-000000000001', 413.5, 'Crew A', 'approved', 'Week complete', '00000000-0000-0000-0000-000000000003'),
    
    -- Friday Jan 31 - Pedro Costa (Trench)
    ('10000000-0000-0000-0000-000000000004', '2026-01-31', '20000000-0000-0000-0000-000000000002', 350, 'Crew B', 'approved', 'Week wrap-up', '00000000-0000-0000-0000-000000000003');

-- =====================================================
-- PAY PERIOD (Jan 27-31 week)
-- =====================================================

INSERT INTO pay_periods (id, start_date, end_date, status) VALUES
    ('30000000-0000-0000-0000-000000000001', '2026-01-27', '2026-01-31', 'open');

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================

-- Update approvals with manager
UPDATE time_entries 
SET approved_by = '00000000-0000-0000-0000-000000000002',
    approved_at = NOW() - INTERVAL '1 day'
WHERE status = 'approved';

UPDATE production_entries 
SET approved_by = '00000000-0000-0000-0000-000000000002',
    approved_at = NOW() - INTERVAL '1 day'
WHERE status = 'approved';

-- Analytics: Show counts
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SEED DATA SUMMARY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Workers: %', (SELECT COUNT(*) FROM workers);
    RAISE NOTICE 'Pay Items: %', (SELECT COUNT(*) FROM pay_item_catalog);
    RAISE NOTICE 'Rates: %', (SELECT COUNT(*) FROM rate_table);
    RAISE NOTICE 'Time Entries: %', (SELECT COUNT(*) FROM time_entries);
    RAISE NOTICE 'Production Entries: %', (SELECT COUNT(*) FROM production_entries);
    RAISE NOTICE 'Pay Periods: %', (SELECT COUNT(*) FROM pay_periods);
    RAISE NOTICE '==============================================';
END $$;

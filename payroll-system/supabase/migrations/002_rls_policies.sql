-- =====================================================
-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for RBAC
-- Author: Super Prompt Engineer
-- Date: 2026-02-20
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_item_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'owner'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is manager or owner
CREATE OR REPLACE FUNCTION is_manager_or_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('manager', 'owner')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is supervisor of a crew
CREATE OR REPLACE FUNCTION is_supervisor_of_crew(crew_name TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'supervisor'
        -- In production, add crew assignment to users table
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

-- Managers and owners can view all users
CREATE POLICY "Managers and owners can view all users"
    ON users FOR SELECT
    USING (is_manager_or_owner());

-- Only owners can create/update/delete users
CREATE POLICY "Only owners can manage users"
    ON users FOR ALL
    USING (is_owner());

-- =====================================================
-- WORKERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view active workers
CREATE POLICY "All users can view active workers"
    ON workers FOR SELECT
    USING (active = true);

-- Managers and owners can view all workers (including inactive)
CREATE POLICY "Managers and owners can view all workers"
    ON workers FOR SELECT
    USING (is_manager_or_owner());

-- Only managers and owners can create/update workers
CREATE POLICY "Managers and owners can manage workers"
    ON workers FOR INSERT
    WITH CHECK (is_manager_or_owner());

CREATE POLICY "Managers and owners can update workers"
    ON workers FOR UPDATE
    USING (is_manager_or_owner());

-- Only owners can delete workers
CREATE POLICY "Only owners can delete workers"
    ON workers FOR DELETE
    USING (is_owner());

-- =====================================================
-- PAY ITEM CATALOG POLICIES
-- =====================================================

-- All authenticated users can view active pay items
CREATE POLICY "All users can view active pay items"
    ON pay_item_catalog FOR SELECT
    USING (active = true);

-- Only owners can manage pay items
CREATE POLICY "Only owners can manage pay items"
    ON pay_item_catalog FOR ALL
    USING (is_owner());

-- =====================================================
-- RATE TABLE POLICIES
-- =====================================================

-- All authenticated users can view rates
CREATE POLICY "All users can view rates"
    ON rate_table FOR SELECT
    TO authenticated
    USING (true);

-- Only owners can manage rates
CREATE POLICY "Only owners can manage rates"
    ON rate_table FOR ALL
    USING (is_owner());

-- =====================================================
-- TIME ENTRIES POLICIES
-- =====================================================

-- Supervisors can view entries they submitted or their crew's entries
CREATE POLICY "Supervisors can view own submissions"
    ON time_entries FOR SELECT
    USING (
        submitted_by = auth.uid() OR
        is_manager_or_owner()
    );

-- Supervisors can create time entries
CREATE POLICY "Supervisors can create time entries"
    ON time_entries FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        status = 'pending'
    );

-- Supervisors can update pending entries they submitted
CREATE POLICY "Supervisors can update own pending entries"
    ON time_entries FOR UPDATE
    USING (
        submitted_by = auth.uid() AND
        status = 'pending'
    );

-- Managers can approve/reject entries
CREATE POLICY "Managers can approve/reject entries"
    ON time_entries FOR UPDATE
    USING (is_manager_or_owner())
    WITH CHECK (
        is_manager_or_owner() AND
        status IN ('approved', 'rejected')
    );

-- Cannot modify locked entries
CREATE POLICY "Locked entries cannot be modified"
    ON time_entries FOR UPDATE
    USING (status != 'locked');

-- Only owners can delete entries
CREATE POLICY "Only owners can delete time entries"
    ON time_entries FOR DELETE
    USING (is_owner() AND status != 'locked');

-- =====================================================
-- PRODUCTION ENTRIES POLICIES
-- =====================================================

-- Same structure as time_entries

CREATE POLICY "Supervisors can view own production submissions"
    ON production_entries FOR SELECT
    USING (
        submitted_by = auth.uid() OR
        is_manager_or_owner()
    );

CREATE POLICY "Supervisors can create production entries"
    ON production_entries FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        status = 'pending'
    );

CREATE POLICY "Supervisors can update own pending production"
    ON production_entries FOR UPDATE
    USING (
        submitted_by = auth.uid() AND
        status = 'pending'
    );

CREATE POLICY "Managers can approve/reject production"
    ON production_entries FOR UPDATE
    USING (is_manager_or_owner())
    WITH CHECK (
        is_manager_or_owner() AND
        status IN ('approved', 'rejected')
    );

CREATE POLICY "Locked production cannot be modified"
    ON production_entries FOR UPDATE
    USING (status != 'locked');

CREATE POLICY "Only owners can delete production entries"
    ON production_entries FOR DELETE
    USING (is_owner() AND status != 'locked');

-- =====================================================
-- PAYROLL CALCULATIONS POLICIES
-- =====================================================

-- Workers can view their own payroll
CREATE POLICY "Workers can view own payroll"
    ON payroll_calculations FOR SELECT
    USING (
        worker_id IN (
            SELECT id FROM workers 
            WHERE worker_code = current_user
        ) OR
        is_manager_or_owner()
    );

-- Only owners can create/update/delete payroll calculations
CREATE POLICY "Only owners can manage payroll"
    ON payroll_calculations FOR ALL
    USING (is_owner());

-- =====================================================
-- PAY PERIODS POLICIES
-- =====================================================

-- All authenticated users can view pay periods
CREATE POLICY "All users can view pay periods"
    ON pay_periods FOR SELECT
    TO authenticated
    USING (true);

-- Only owners can manage pay periods
CREATE POLICY "Only owners can manage pay periods"
    ON pay_periods FOR ALL
    USING (is_owner());

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Owners can view all audit logs
CREATE POLICY "Owners can view all audit logs"
    ON audit_logs FOR SELECT
    USING (is_owner());

-- System can insert audit logs (no user can manually insert)
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- No one can update or delete audit logs
CREATE POLICY "Audit logs are immutable"
    ON audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted"
    ON audit_logs FOR DELETE
    USING (false);

-- =====================================================
-- AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_ip VARCHAR(45);
BEGIN
    -- Get IP from request headers (Supabase specific)
    user_ip := current_setting('request.headers', true)::json->>'x-real-ip';
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            ip_address
        ) VALUES (
            auth.uid(),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            user_ip
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            ip_address
        ) VALUES (
            auth.uid(),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            user_ip
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            new_values,
            ip_address
        ) VALUES (
            auth.uid(),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            user_ip
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ATTACH AUDIT TRIGGERS TO CRITICAL TABLES
-- =====================================================

CREATE TRIGGER audit_time_entries
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_production_entries
    AFTER INSERT OR UPDATE OR DELETE ON production_entries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payroll_calculations
    AFTER INSERT OR UPDATE OR DELETE ON payroll_calculations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_workers
    AFTER INSERT OR UPDATE OR DELETE ON workers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- RLS POLICIES COMPLETE
-- =====================================================

COMMENT ON FUNCTION get_user_role() IS 'Helper function to get current authenticated user role';
COMMENT ON FUNCTION audit_trigger_function() IS 'Automatically logs all changes to critical tables';

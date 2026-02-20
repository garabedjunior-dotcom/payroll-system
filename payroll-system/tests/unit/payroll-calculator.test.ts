// =====================================================
// tests/unit/payroll-calculator.test.ts
// Unit tests for Payroll Calculation Engine
// =====================================================

import { describe, it, expect } from 'vitest';
import { PayrollCalculator } from '@/lib/payroll/calculator';
import type { Worker, TimeEntry, ProductionEntry, PayItem, Rate } from '@/types/database.types';

// Mock data
const mockWorkerW2: Worker = {
  id: 'worker-1',
  worker_code: 'W001',
  full_name: 'John Silva',
  employee_type: 'W2',
  base_hourly_rate: 18.0,
  ot_multiplier: 1.5,
  min_hourly_guarantee: true,
  piece_rate_enabled: true,
  crew: 'Crew A',
  active: true,
  hire_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
};

const mockWorker1099: Worker = {
  ...mockWorkerW2,
  id: 'worker-2',
  worker_code: 'W002',
  full_name: 'Carlos Mendes',
  employee_type: '1099',
  ot_multiplier: 1.0,
  min_hourly_guarantee: false,
};

const mockPayItem: PayItem = {
  id: 'pay-item-1',
  item_code: 'HDD_FT',
  description: 'Horizontal Directional Drilling',
  unit: 'FT',
  category: 'Installation',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const mockRate: Rate = {
  id: 'rate-1',
  pay_item_id: 'pay-item-1',
  rate_amount: 0.85,
  effective_from: '2026-01-01',
  effective_to: null,
  context_notes: 'Urban HDD standard',
  created_at: '2024-01-01T00:00:00Z',
};

const createTimeEntry = (hours: number, status: 'approved' | 'pending' = 'approved'): TimeEntry => ({
  id: `time-${Math.random()}`,
  worker_id: mockWorkerW2.id,
  entry_date: '2026-01-27',
  clock_in: '07:00',
  clock_out: '16:00',
  break_minutes: 30,
  total_hours: hours,
  crew: 'Crew A',
  status,
  notes: 'Test entry',
  submitted_by: 'user-1',
  approved_by: 'user-2',
  approved_at: '2026-01-27T12:00:00Z',
  created_at: '2026-01-27T08:00:00Z',
  updated_at: '2026-01-27T12:00:00Z',
});

const createProductionEntry = (quantity: number, status: 'approved' | 'pending' = 'approved'): ProductionEntry => ({
  id: `prod-${Math.random()}`,
  worker_id: mockWorkerW2.id,
  entry_date: '2026-01-27',
  pay_item_id: 'pay-item-1',
  quantity,
  crew: 'Crew A',
  status,
  notes: 'Test production',
  submitted_by: 'user-1',
  approved_by: 'user-2',
  approved_at: '2026-01-27T12:00:00Z',
  created_at: '2026-01-27T08:00:00Z',
  updated_at: '2026-01-27T12:00:00Z',
});

describe('PayrollCalculator', () => {
  describe('Basic Hourly Pay (No OT, No Production)', () => {
    it('should calculate regular hours correctly for 40 hours', () => {
      const timeEntries = [
        createTimeEntry(8),
        createTimeEntry(8),
        createTimeEntry(8),
        createTimeEntry(8),
        createTimeEntry(8),
      ];

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        timeEntries,
        [],
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.total_hours).toBe(40);
      expect(result.regular_hours).toBe(40);
      expect(result.ot_hours).toBe(0);
      expect(result.hourly_earnings).toBe(720); // 40 × $18
      expect(result.piece_earnings).toBe(0);
      expect(result.ot_premium).toBe(0);
      expect(result.total_pay).toBe(720);
      expect(result.payment_method).toBe('Hourly Only');
    });

    it('should calculate overtime correctly for 48 hours', () => {
      const timeEntries = [
        createTimeEntry(10), // 10 hours each day
        createTimeEntry(10),
        createTimeEntry(10),
        createTimeEntry(10),
        createTimeEntry(8),
      ];

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        timeEntries,
        [],
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.total_hours).toBe(48);
      expect(result.regular_hours).toBe(40);
      expect(result.ot_hours).toBe(8);
      expect(result.hourly_earnings).toBe(720); // 40 × $18
      expect(result.ot_premium).toBe(72); // 8 × $18 × 0.5
      expect(result.total_pay).toBe(792); // 720 + 72
      expect(result.payment_method).toBe('Hourly + OT');
    });
  });

  describe('Piece Rate (No Hourly Guarantee)', () => {
    it('should calculate piece earnings correctly', () => {
      const productionEntries = [createProductionEntry(450)]; // 450 FT @ $0.85

      const result = PayrollCalculator.calculateWorkerPayroll(
        { ...mockWorkerW2, min_hourly_guarantee: false },
        [],
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.piece_earnings).toBe(382.5); // 450 × $0.85
      expect(result.hourly_earnings).toBe(0);
      expect(result.min_guarantee_applied).toBe(0);
      expect(result.total_pay).toBe(382.5);
      expect(result.payment_method).toBe('Piece Rate');
    });

    it('should handle multiple production items', () => {
      const productionEntries = [
        createProductionEntry(450), // 450 FT @ $0.85 = $382.50
        createProductionEntry(300), // 300 FT @ $0.85 = $255.00
      ];

      const result = PayrollCalculator.calculateWorkerPayroll(
        { ...mockWorkerW2, min_hourly_guarantee: false },
        [],
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.piece_earnings).toBe(637.5); // 382.5 + 255
      expect(result.total_pay).toBe(637.5);
    });
  });

  describe('Piece Rate with Minimum Hourly Guarantee', () => {
    it('should apply minimum guarantee when piece rate is low', () => {
      const timeEntries = [createTimeEntry(40)]; // 40 hours
      const productionEntries = [createProductionEntry(100)]; // Only 100 FT = $85

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2, // min_hourly_guarantee = true
        timeEntries,
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.piece_earnings).toBe(85); // 100 × $0.85
      expect(result.hourly_earnings).toBe(720); // 40 × $18
      expect(result.min_guarantee_applied).toBe(635); // 720 - 85
      expect(result.total_pay).toBe(720); // Use hourly instead
      expect(result.payment_method).toBe('Piece Rate + Min Guarantee');
    });

    it('should not apply guarantee when piece rate is higher', () => {
      const timeEntries = [createTimeEntry(40)]; // 40 hours
      const productionEntries = [createProductionEntry(1000)]; // 1000 FT = $850

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        timeEntries,
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.piece_earnings).toBe(850); // 1000 × $0.85
      expect(result.hourly_earnings).toBe(720); // 40 × $18
      expect(result.min_guarantee_applied).toBe(0); // Piece rate higher
      expect(result.total_pay).toBe(850); // Use piece rate
    });
  });

  describe('Piece Rate with Overtime Premium', () => {
    it('should pay piece rate + OT premium for W2 worker', () => {
      const timeEntries = [createTimeEntry(48)]; // 48 hours (8 OT)
      const productionEntries = [createProductionEntry(1000)]; // 1000 FT = $850

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2, // W2 with 1.5x OT multiplier
        timeEntries,
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.total_hours).toBe(48);
      expect(result.ot_hours).toBe(8);
      expect(result.piece_earnings).toBe(850);
      expect(result.ot_premium).toBe(72); // 8 × $18 × 0.5
      expect(result.total_pay).toBe(922); // 850 + 72
      expect(result.payment_method).toBe('Piece Rate + OT');
    });

    it('should NOT pay OT premium for 1099 contractor', () => {
      const timeEntries = [createTimeEntry(48)]; // 48 hours
      const productionEntries = [createProductionEntry(1000)]; // 1000 FT = $850

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorker1099, // 1099 with 1.0x multiplier
        timeEntries,
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.ot_hours).toBe(8);
      expect(result.ot_premium).toBe(0); // No OT for 1099
      expect(result.total_pay).toBe(850); // Only piece rate
    });
  });

  describe('Excel Formula Matching', () => {
    it('should match Excel results exactly for sample week', () => {
      // From Excel: John Silva, Week of Jan 27-31
      const timeEntries = [
        createTimeEntry(9), // Mon
        createTimeEntry(9.5), // Tue
        createTimeEntry(10), // Wed
        createTimeEntry(10), // Thu
        createTimeEntry(9.5), // Fri
      ];

      const productionEntries = [
        createProductionEntry(450), // Mon: $382.50
        createProductionEntry(520), // Tue: $442.00
        createProductionEntry(550), // Wed: $467.50
        createProductionEntry(580), // Thu: $493.00
        createProductionEntry(400), // Fri: $340.00
        // + 2 potholes @ $35 = $70
      ];

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        timeEntries,
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      // Excel totals
      expect(result.total_hours).toBe(48);
      expect(result.regular_hours).toBe(40);
      expect(result.ot_hours).toBe(8);
      expect(result.piece_earnings).toBeCloseTo(2195, 1); // Excel: 2195
      expect(result.ot_premium).toBe(72); // Excel: 72
      expect(result.total_pay).toBeCloseTo(2267, 1); // Excel: 2267
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero hours', () => {
      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        [],
        [],
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.total_hours).toBe(0);
      expect(result.total_pay).toBe(0);
    });

    it('should ignore pending entries', () => {
      const timeEntries = [
        createTimeEntry(8, 'pending'), // Not approved
        createTimeEntry(8, 'approved'),
      ];

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        timeEntries,
        [],
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      expect(result.total_hours).toBe(8); // Only approved
    });

    it('should round to 2 decimal places', () => {
      const productionEntries = [createProductionEntry(333.33)]; // Causes rounding

      const result = PayrollCalculator.calculateWorkerPayroll(
        mockWorkerW2,
        [],
        productionEntries,
        [mockPayItem],
        [mockRate],
        '2026-01-27',
        '2026-01-31'
      );

      // 333.33 × 0.85 = 283.3305 → should round to 283.33
      expect(result.piece_earnings).toBe(283.33);
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate total payroll correctly', () => {
      const results = [
        { ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''), total_pay: 1000 },
        { ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''), total_pay: 1500 },
        { ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''), total_pay: 2000 },
      ];

      const total = PayrollCalculator.calculateTotalPayroll(results);
      expect(total).toBe(4500);
    });

    it('should generate correct summary', () => {
      const results = [
        {
          ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''),
          total_pay: 1000,
          total_hours: 40,
          ot_hours: 0,
          piece_earnings: 800,
          ot_premium: 0,
        },
        {
          ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''),
          total_pay: 1500,
          total_hours: 48,
          ot_hours: 8,
          piece_earnings: 1200,
          ot_premium: 72,
        },
      ];

      const summary = PayrollCalculator.generateSummary(results);

      expect(summary.total_payroll).toBe(2500);
      expect(summary.total_hours).toBe(88);
      expect(summary.total_workers).toBe(2);
      expect(summary.total_ot_hours).toBe(8);
      expect(summary.total_piece_earnings).toBe(2000);
      expect(summary.total_ot_premium).toBe(72);
    });
  });

  describe('Validation', () => {
    it('should validate calculations successfully', () => {
      const results = [
        { ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''), total_pay: 1000, total_hours: 40 },
      ];

      const validation = PayrollCalculator.validateCalculations(results, 1000);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect total mismatch', () => {
      const results = [
        { ...PayrollCalculator.calculateWorkerPayroll(mockWorkerW2, [], [], [], [], '', ''), total_pay: 1000, total_hours: 40 },
      ];

      const validation = PayrollCalculator.validateCalculations(results, 1100);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Total mismatch');
    });
  });
});

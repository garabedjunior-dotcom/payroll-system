// =====================================================
// lib/payroll/calculator.ts
// Payroll Calculation Engine - Core Business Logic
// Matches Excel formulas exactly
// =====================================================

import { Worker, TimeEntry, ProductionEntry, Rate, PayItem } from '@/types/database.types';

/**
 * Payroll calculation result matching Excel output
 */
export interface PayrollResult {
  worker_id: string;
  worker_name: string;
  employee_type: 'W2' | '1099';
  period_start: string;
  period_end: string;
  
  // Hours breakdown
  total_hours: number;
  regular_hours: number;
  ot_hours: number;
  
  // Earnings breakdown
  piece_earnings: number;
  hourly_earnings: number;
  ot_premium: number;
  min_guarantee_applied: number;
  
  // Final pay
  total_pay: number;
  payment_method: string;
  
  // Supporting data
  base_hourly_rate: number;
  ot_multiplier: number;
  production_items: ProductionLineItem[];
}

export interface ProductionLineItem {
  pay_item_code: string;
  pay_item_description: string;
  quantity: number;
  unit: string;
  rate: number;
  earnings: number;
}

/**
 * Main payroll calculation function
 * Implements the exact formulas from the Excel spreadsheet
 */
export class PayrollCalculator {
  /**
   * Calculate payroll for a single worker for a given period
   * 
   * Formula breakdown (matching Excel):
   * 1. regular_hours = MIN(total_hours, 40)
   * 2. ot_hours = MAX(total_hours - 40, 0)
   * 3. piece_earnings = SUM(approved_production × rates)
   * 4. hourly_earnings = regular_hours × base_rate
   * 5. ot_premium = ot_hours × base_rate × (ot_multiplier - 1)
   * 6. guaranteed_pay = MAX(piece_earnings, hourly_earnings) [if min_guarantee enabled]
   * 7. total_pay = guaranteed_pay + ot_premium
   */
  static calculateWorkerPayroll(
    worker: Worker,
    timeEntries: TimeEntry[],
    productionEntries: ProductionEntry[],
    payItems: PayItem[],
    rates: Rate[],
    periodStart: string,
    periodEnd: string
  ): PayrollResult {
    // Step 1: Calculate total hours from approved time entries
    const approvedTimeEntries = timeEntries.filter(
      (entry) => entry.status === 'approved' || entry.status === 'locked'
    );
    
    const totalHours = approvedTimeEntries.reduce(
      (sum, entry) => sum + Number(entry.total_hours),
      0
    );

    // Step 2: Calculate regular hours (capped at 40)
    const regularHours = Math.min(totalHours, 40);

    // Step 3: Calculate overtime hours (anything over 40)
    const otHours = Math.max(totalHours - 40, 0);

    // Step 4: Calculate piece earnings from approved production
    const approvedProduction = productionEntries.filter(
      (entry) => entry.status === 'approved' || entry.status === 'locked'
    );

    const productionLineItems: ProductionLineItem[] = [];
    let totalPieceEarnings = 0;

    for (const prodEntry of approvedProduction) {
      // Find the pay item
      const payItem = payItems.find((item) => item.id === prodEntry.pay_item_id);
      if (!payItem) continue;

      // Find the applicable rate based on entry date
      const rate = this.getApplicableRate(rates, prodEntry.pay_item_id, prodEntry.entry_date);
      if (!rate) continue;

      const earnings = Number(prodEntry.quantity) * Number(rate.rate_amount);
      totalPieceEarnings += earnings;

      productionLineItems.push({
        pay_item_code: payItem.item_code,
        pay_item_description: payItem.description,
        quantity: Number(prodEntry.quantity),
        unit: payItem.unit,
        rate: Number(rate.rate_amount),
        earnings: earnings,
      });
    }

    // Step 5: Calculate hourly earnings (base rate × regular hours)
    const hourlyEarnings = regularHours * Number(worker.base_hourly_rate);

    // Step 6: Calculate OT premium
    // Premium = OT hours × base rate × (multiplier - 1)
    // For W2 with 1.5x multiplier: premium is 0.5x base rate per OT hour
    // For 1099 with 1.0x multiplier: premium is 0 (no OT)
    const otPremium = otHours * Number(worker.base_hourly_rate) * (Number(worker.ot_multiplier) - 1);

    // Step 7: Apply minimum hourly guarantee
    let guaranteedPay = totalPieceEarnings;
    let minGuaranteeApplied = 0;

    if (worker.min_hourly_guarantee && hourlyEarnings > totalPieceEarnings) {
      guaranteedPay = hourlyEarnings;
      minGuaranteeApplied = hourlyEarnings - totalPieceEarnings;
    }

    // Step 8: Calculate final total pay
    const totalPay = guaranteedPay + otPremium;

    // Determine payment method
    let paymentMethod = 'Hourly Only';
    if (worker.piece_rate_enabled && totalPieceEarnings > 0) {
      if (otHours > 0) {
        paymentMethod = 'Piece Rate + OT';
      } else if (minGuaranteeApplied > 0) {
        paymentMethod = 'Piece Rate + Min Guarantee';
      } else {
        paymentMethod = 'Piece Rate';
      }
    } else if (otHours > 0) {
      paymentMethod = 'Hourly + OT';
    }

    return {
      worker_id: worker.id,
      worker_name: worker.full_name,
      employee_type: worker.employee_type,
      period_start: periodStart,
      period_end: periodEnd,
      total_hours: this.roundTo2Decimals(totalHours),
      regular_hours: this.roundTo2Decimals(regularHours),
      ot_hours: this.roundTo2Decimals(otHours),
      piece_earnings: this.roundTo2Decimals(totalPieceEarnings),
      hourly_earnings: this.roundTo2Decimals(hourlyEarnings),
      ot_premium: this.roundTo2Decimals(otPremium),
      min_guarantee_applied: this.roundTo2Decimals(minGuaranteeApplied),
      total_pay: this.roundTo2Decimals(totalPay),
      payment_method: paymentMethod,
      base_hourly_rate: Number(worker.base_hourly_rate),
      ot_multiplier: Number(worker.ot_multiplier),
      production_items: productionLineItems,
    };
  }

  /**
   * Calculate payroll for multiple workers
   */
  static calculatePayroll(
    workers: Worker[],
    timeEntries: TimeEntry[],
    productionEntries: ProductionEntry[],
    payItems: PayItem[],
    rates: Rate[],
    periodStart: string,
    periodEnd: string
  ): PayrollResult[] {
    const results: PayrollResult[] = [];

    for (const worker of workers.filter((w) => w.active)) {
      // Filter entries for this worker within the period
      const workerTimeEntries = timeEntries.filter(
        (entry) =>
          entry.worker_id === worker.id &&
          entry.entry_date >= periodStart &&
          entry.entry_date <= periodEnd
      );

      const workerProductionEntries = productionEntries.filter(
        (entry) =>
          entry.worker_id === worker.id &&
          entry.entry_date >= periodStart &&
          entry.entry_date <= periodEnd
      );

      const result = this.calculateWorkerPayroll(
        worker,
        workerTimeEntries,
        workerProductionEntries,
        payItems,
        rates,
        periodStart,
        periodEnd
      );

      results.push(result);
    }

    return results;
  }

  /**
   * Get the applicable rate for a pay item on a specific date
   * Rates are time-versioned with effective_from and effective_to dates
   */
  private static getApplicableRate(
    rates: Rate[],
    payItemId: string,
    entryDate: string
  ): Rate | null {
    const applicableRates = rates.filter(
      (rate) =>
        rate.pay_item_id === payItemId &&
        rate.effective_from <= entryDate &&
        (rate.effective_to === null || rate.effective_to >= entryDate)
    );

    // If multiple rates match (shouldn't happen), use the most recent one
    if (applicableRates.length === 0) return null;

    return applicableRates.sort(
      (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
    )[0];
  }

  /**
   * Round to 2 decimal places for currency
   */
  private static roundTo2Decimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculate total payroll for a period
   */
  static calculateTotalPayroll(results: PayrollResult[]): number {
    return this.roundTo2Decimals(
      results.reduce((sum, result) => sum + result.total_pay, 0)
    );
  }

  /**
   * Validate calculation results against expected totals
   * Used for QuickBooks export validation
   */
  static validateCalculations(
    results: PayrollResult[],
    expectedTotal?: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for negative values
    for (const result of results) {
      if (result.total_pay < 0) {
        errors.push(`Worker ${result.worker_name}: Negative total pay`);
      }
      if (result.total_hours < 0) {
        errors.push(`Worker ${result.worker_name}: Negative hours`);
      }
    }

    // Check if total matches expected (within $0.01 tolerance)
    if (expectedTotal !== undefined) {
      const calculatedTotal = this.calculateTotalPayroll(results);
      const difference = Math.abs(calculatedTotal - expectedTotal);
      
      if (difference > 0.01) {
        errors.push(
          `Total mismatch: Expected $${expectedTotal.toFixed(2)}, got $${calculatedTotal.toFixed(2)} (diff: $${difference.toFixed(2)})`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate payroll summary report
   */
  static generateSummary(results: PayrollResult[]): {
    total_payroll: number;
    total_hours: number;
    total_workers: number;
    avg_hourly_rate: number;
    total_ot_hours: number;
    total_piece_earnings: number;
    total_ot_premium: number;
  } {
    const totalPayroll = this.calculateTotalPayroll(results);
    const totalHours = results.reduce((sum, r) => sum + r.total_hours, 0);
    const totalOtHours = results.reduce((sum, r) => sum + r.ot_hours, 0);
    const totalPieceEarnings = results.reduce((sum, r) => sum + r.piece_earnings, 0);
    const totalOtPremium = results.reduce((sum, r) => sum + r.ot_premium, 0);

    return {
      total_payroll: this.roundTo2Decimals(totalPayroll),
      total_hours: this.roundTo2Decimals(totalHours),
      total_workers: results.length,
      avg_hourly_rate: this.roundTo2Decimals(totalHours > 0 ? totalPayroll / totalHours : 0),
      total_ot_hours: this.roundTo2Decimals(totalOtHours),
      total_piece_earnings: this.roundTo2Decimals(totalPieceEarnings),
      total_ot_premium: this.roundTo2Decimals(totalOtPremium),
    };
  }
}

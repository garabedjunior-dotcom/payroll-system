// =====================================================
// lib/export/quickbooks-exporter.ts
// QuickBooks Export Generators (IIF and CSV)
// =====================================================

import { PayrollResult } from '@/lib/payroll/calculator';
import { Worker } from '@/types/database.types';

/**
 * QuickBooks IIF (Intuit Interchange Format) Exporter
 * For QuickBooks Desktop
 */
export class QuickBooksIIFExporter {
  /**
   * Generate IIF file content for payroll
   * IIF format: Tab-delimited text with header rows starting with !
   */
  static generateIIF(
    payrollResults: PayrollResult[],
    periodStart: string,
    periodEnd: string
  ): string {
    const lines: string[] = [];

    // IIF Header
    lines.push('!TIMEACT\tDATE\tJOB\tEMP\tITEM\tPITEM\tDURATION\tNOTE');

    for (const result of payrollResults) {
      const formattedDate = this.formatDateForIIF(result.period_end);

      // Regular hours entry (if any)
      if (result.regular_hours > 0) {
        lines.push(
          this.createIIFLine(
            formattedDate,
            result.worker_name,
            'Regular Pay',
            result.regular_hours,
            `Regular hours - ${periodStart} to ${periodEnd}`
          )
        );
      }

      // Overtime entry (if any)
      if (result.ot_hours > 0 && result.ot_premium > 0) {
        lines.push(
          this.createIIFLine(
            formattedDate,
            result.worker_name,
            'Overtime Premium',
            result.ot_hours,
            `OT premium: ${result.ot_hours} hours @ ${result.ot_multiplier}x`
          )
        );
      }

      // Piece rate entries (one per pay item)
      for (const prodItem of result.production_items) {
        const itemName = `Piece Rate - ${prodItem.pay_item_code}`;
        const note = `${prodItem.pay_item_description}: ${prodItem.quantity} ${prodItem.unit} @ $${prodItem.rate}`;
        
        lines.push(
          this.createIIFLine(
            formattedDate,
            result.worker_name,
            itemName,
            prodItem.quantity,
            note
          )
        );
      }

      // Minimum guarantee adjustment (if applied)
      if (result.min_guarantee_applied > 0) {
        lines.push(
          this.createIIFLine(
            formattedDate,
            result.worker_name,
            'Minimum Guarantee Adjustment',
            0,
            `Min guarantee adjustment: $${result.min_guarantee_applied.toFixed(2)}`
          )
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Create a single IIF line (tab-delimited)
   */
  private static createIIFLine(
    date: string,
    employeeName: string,
    itemName: string,
    duration: number,
    note: string
  ): string {
    return [
      'TIMEACT',
      date,
      '', // JOB (empty)
      employeeName,
      itemName,
      '', // PITEM (empty)
      duration.toFixed(2),
      note,
    ].join('\t');
  }

  /**
   * Format date for IIF (MM/DD/YYYY)
   */
  private static formatDateForIIF(dateString: string): string {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Validate IIF export before download
   */
  static validateIIF(
    payrollResults: PayrollResult[],
    expectedTotal?: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required data
    if (payrollResults.length === 0) {
      errors.push('No payroll results to export');
    }

    // Check for empty worker names
    for (const result of payrollResults) {
      if (!result.worker_name?.trim()) {
        errors.push(`Worker ID ${result.worker_id} has no name`);
      }
    }

    // Validate total (if provided)
    if (expectedTotal !== undefined) {
      const calculatedTotal = payrollResults.reduce((sum, r) => sum + r.total_pay, 0);
      const difference = Math.abs(calculatedTotal - expectedTotal);
      
      if (difference > 0.01) {
        errors.push(
          `Total mismatch: Expected $${expectedTotal.toFixed(2)}, got $${calculatedTotal.toFixed(2)}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * QuickBooks CSV Exporter
 * For QuickBooks Online
 */
export class QuickBooksCSVExporter {
  /**
   * Generate CSV file content for payroll
   */
  static generateCSV(
    payrollResults: PayrollResult[],
    periodStart: string,
    periodEnd: string
  ): string {
    const rows: string[][] = [];

    // CSV Header
    rows.push([
      'Employee',
      'Date',
      'Service Item',
      'Quantity/Hours',
      'Rate',
      'Amount',
      'Customer',
      'Billable',
      'Memo',
    ]);

    for (const result of payrollResults) {
      const formattedDate = this.formatDateForCSV(result.period_end);

      // Hourly earnings entry
      if (result.hourly_earnings > 0) {
        rows.push([
          this.escapeCSV(result.worker_name),
          formattedDate,
          'Hourly Labor',
          result.regular_hours.toFixed(2),
          result.base_hourly_rate.toFixed(2),
          result.hourly_earnings.toFixed(2),
          '', // Customer (empty)
          'No',
          `Regular hours: ${periodStart} to ${periodEnd}`,
        ]);
      }

      // Overtime entry
      if (result.ot_premium > 0) {
        const otRate = result.base_hourly_rate * (result.ot_multiplier - 1);
        rows.push([
          this.escapeCSV(result.worker_name),
          formattedDate,
          'Overtime Premium',
          result.ot_hours.toFixed(2),
          otRate.toFixed(2),
          result.ot_premium.toFixed(2),
          '',
          'No',
          `OT premium: ${result.ot_hours} hours @ ${result.ot_multiplier}x`,
        ]);
      }

      // Piece rate entries
      for (const prodItem of result.production_items) {
        rows.push([
          this.escapeCSV(result.worker_name),
          formattedDate,
          this.escapeCSV(prodItem.pay_item_description),
          prodItem.quantity.toFixed(2),
          prodItem.rate.toFixed(2),
          prodItem.earnings.toFixed(2),
          '',
          'No',
          `${prodItem.pay_item_code}: ${prodItem.quantity} ${prodItem.unit}`,
        ]);
      }

      // Minimum guarantee adjustment
      if (result.min_guarantee_applied > 0) {
        rows.push([
          this.escapeCSV(result.worker_name),
          formattedDate,
          'Minimum Guarantee Adjustment',
          '1',
          result.min_guarantee_applied.toFixed(2),
          result.min_guarantee_applied.toFixed(2),
          '',
          'No',
          'Min hourly guarantee applied',
        ]);
      }
    }

    // Convert rows to CSV string
    return rows.map((row) => row.join(',')).join('\n');
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Format date for CSV (MM/DD/YYYY)
   */
  private static formatDateForCSV(dateString: string): string {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Validate CSV export before download
   */
  static validateCSV(payrollResults: PayrollResult[]): { valid: boolean; errors: string[] } {
    // Use same validation as IIF
    return QuickBooksIIFExporter.validateIIF(payrollResults);
  }
}

/**
 * Export helper functions
 */
export class QuickBooksExportHelper {
  /**
   * Separate W2 and 1099 workers for export
   */
  static separateByEmployeeType(
    payrollResults: PayrollResult[]
  ): { w2: PayrollResult[]; contractor: PayrollResult[] } {
    const w2 = payrollResults.filter((r) => r.employee_type === 'W2');
    const contractor = payrollResults.filter((r) => r.employee_type === '1099');
    return { w2, contractor };
  }

  /**
   * Generate export summary for preview
   */
  static generateSummary(payrollResults: PayrollResult[]): {
    totalPay: number;
    totalHours: number;
    workerCount: number;
    w2Count: number;
    contractorCount: number;
    exportDate: string;
  } {
    const separated = this.separateByEmployeeType(payrollResults);
    
    return {
      totalPay: payrollResults.reduce((sum, r) => sum + r.total_pay, 0),
      totalHours: payrollResults.reduce((sum, r) => sum + r.total_hours, 0),
      workerCount: payrollResults.length,
      w2Count: separated.w2.length,
      contractorCount: separated.contractor.length,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Create filename for export
   */
  static generateFilename(
    format: 'iif' | 'csv',
    periodStart: string,
    periodEnd: string
  ): string {
    const start = periodStart.replace(/-/g, '');
    const end = periodEnd.replace(/-/g, '');
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `payroll_${start}_${end}_${timestamp}.${format}`;
  }

  /**
   * Prepare download for browser
   */
  static prepareDownload(content: string, filename: string, format: 'iif' | 'csv'): {
    blob: Blob;
    mimeType: string;
    filename: string;
  } {
    const mimeTypes = {
      iif: 'text/plain',
      csv: 'text/csv',
    };

    return {
      blob: new Blob([content], { type: mimeTypes[format] }),
      mimeType: mimeTypes[format],
      filename,
    };
  }

  /**
   * Preview export content (first 10 lines)
   */
  static generatePreview(content: string, maxLines: number = 10): string {
    const lines = content.split('\n');
    const preview = lines.slice(0, maxLines).join('\n');
    
    if (lines.length > maxLines) {
      return `${preview}\n\n... (${lines.length - maxLines} more lines)`;
    }
    
    return preview;
  }
}

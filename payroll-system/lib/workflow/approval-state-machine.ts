// =====================================================
// lib/workflow/approval-state-machine.ts
// Approval Workflow State Machine
// Handles state transitions with validation
// =====================================================

import { EntryStatus } from '@/types/database.types';

/**
 * Valid state transitions for approval workflow
 */
export const STATE_TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['locked'],
  rejected: ['pending'], // Allow resubmission
  locked: [], // Terminal state - no transitions allowed
};

/**
 * Roles allowed to perform each transition
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'pending->approved': ['manager', 'owner'],
  'pending->rejected': ['manager', 'owner'],
  'approved->locked': ['owner'], // Only owner can lock (during payroll run)
  'rejected->pending': ['supervisor', 'manager', 'owner'], // Resubmission
};

export interface StateTransitionRequest {
  currentStatus: EntryStatus;
  newStatus: EntryStatus;
  userRole: string;
  comments?: string;
}

export interface StateTransitionResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Approval Workflow State Machine
 * Enforces business rules for status transitions
 */
export class ApprovalStateMachine {
  /**
   * Validate if a state transition is allowed
   */
  static canTransition(
    from: EntryStatus,
    to: EntryStatus,
    userRole: string
  ): StateTransitionResult {
    // Check if transition is valid
    const allowedTransitions = STATE_TRANSITIONS[from];
    if (!allowedTransitions.includes(to)) {
      return {
        success: false,
        error: `Cannot transition from '${from}' to '${to}'. Allowed: ${allowedTransitions.join(', ')}`,
      };
    }

    // Check if user role has permission
    const transitionKey = `${from}->${to}`;
    const allowedRoles = ROLE_PERMISSIONS[transitionKey] || [];
    
    if (!allowedRoles.includes(userRole)) {
      return {
        success: false,
        error: `Role '${userRole}' is not authorized to transition from '${from}' to '${to}'. Required: ${allowedRoles.join(', ')}`,
      };
    }

    return { success: true };
  }

  /**
   * Validate state transition request
   */
  static validateTransition(request: StateTransitionRequest): StateTransitionResult {
    const { currentStatus, newStatus, userRole, comments } = request;

    // Check basic transition rules
    const canTransition = this.canTransition(currentStatus, newStatus, userRole);
    if (!canTransition.success) {
      return canTransition;
    }

    // Rejection requires comments
    if (newStatus === 'rejected' && !comments?.trim()) {
      return {
        success: false,
        error: 'Comments are required when rejecting an entry',
      };
    }

    // Locked entries cannot be modified
    if (currentStatus === 'locked') {
      return {
        success: false,
        error: 'Locked entries cannot be modified. Contact system administrator.',
      };
    }

    return { success: true };
  }

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: EntryStatus): string {
    const labels: Record<EntryStatus, string> = {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      locked: 'Locked (Payroll Processed)',
    };
    return labels[status];
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: EntryStatus): string {
    const colors: Record<EntryStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      locked: 'gray',
    };
    return colors[status];
  }

  /**
   * Get available actions for current status and user role
   */
  static getAvailableActions(
    currentStatus: EntryStatus,
    userRole: string
  ): { action: EntryStatus; label: string; requiresComments: boolean }[] {
    const allowedTransitions = STATE_TRANSITIONS[currentStatus];
    const actions: { action: EntryStatus; label: string; requiresComments: boolean }[] = [];

    for (const nextStatus of allowedTransitions) {
      const transitionKey = `${currentStatus}->${nextStatus}`;
      const allowedRoles = ROLE_PERMISSIONS[transitionKey] || [];

      if (allowedRoles.includes(userRole)) {
        actions.push({
          action: nextStatus,
          label: this.getActionLabel(nextStatus),
          requiresComments: nextStatus === 'rejected',
        });
      }
    }

    return actions;
  }

  /**
   * Get action button label
   */
  private static getActionLabel(status: EntryStatus): string {
    const labels: Record<EntryStatus, string> = {
      pending: 'Submit for Approval',
      approved: 'Approve',
      rejected: 'Reject',
      locked: 'Lock',
    };
    return labels[status];
  }

  /**
   * Check if user can edit entry based on status and role
   */
  static canEdit(status: EntryStatus, userRole: string, isOwner: boolean): boolean {
    // Locked entries cannot be edited by anyone
    if (status === 'locked') return false;

    // Supervisors can edit their own pending entries
    if (status === 'pending' && userRole === 'supervisor') return true;

    // Managers and owners can edit pending and rejected
    if (['manager', 'owner'].includes(userRole) && ['pending', 'rejected'].includes(status)) {
      return true;
    }

    // Owners can edit approved (before locking)
    if (isOwner && status === 'approved') return true;

    return false;
  }

  /**
   * Check if user can delete entry
   */
  static canDelete(status: EntryStatus, userRole: string): boolean {
    // Locked entries cannot be deleted
    if (status === 'locked') return false;

    // Only owners can delete entries
    return userRole === 'owner';
  }

  /**
   * Batch approval validation
   */
  static validateBatchApproval(
    entries: { id: string; status: EntryStatus }[],
    userRole: string
  ): { validIds: string[]; invalidIds: string[]; errors: Record<string, string> } {
    const validIds: string[] = [];
    const invalidIds: string[] = [];
    const errors: Record<string, string> = {};

    for (const entry of entries) {
      const result = this.canTransition(entry.status, 'approved', userRole);
      
      if (result.success) {
        validIds.push(entry.id);
      } else {
        invalidIds.push(entry.id);
        errors[entry.id] = result.error || 'Unknown error';
      }
    }

    return { validIds, invalidIds, errors };
  }

  /**
   * Lock entries after payroll is processed
   * Only owner can perform this action
   */
  static lockEntries(
    entryIds: string[],
    userRole: string
  ): StateTransitionResult {
    if (userRole !== 'owner') {
      return {
        success: false,
        error: 'Only owners can lock entries',
      };
    }

    return {
      success: true,
      warnings: [
        `Locking ${entryIds.length} entries. These entries will become read-only.`,
      ],
    };
  }
}

/**
 * Approval workflow helpers
 */
export class ApprovalWorkflowHelper {
  /**
   * Generate notification message for state change
   */
  static getNotificationMessage(
    from: EntryStatus,
    to: EntryStatus,
    entryType: 'time' | 'production',
    workerName: string,
    date: string,
    approverName?: string,
    comments?: string
  ): { subject: string; body: string } {
    const entryTypeLabel = entryType === 'time' ? 'Timesheet' : 'Production Entry';

    if (to === 'approved') {
      return {
        subject: `${entryTypeLabel} Approved - ${workerName} - ${date}`,
        body: `
Your ${entryTypeLabel.toLowerCase()} for ${workerName} on ${date} has been approved by ${approverName}.

You can now proceed with payroll processing for this entry.

${comments ? `Comments: ${comments}` : ''}
        `.trim(),
      };
    }

    if (to === 'rejected') {
      return {
        subject: `${entryTypeLabel} Rejected - ${workerName} - ${date}`,
        body: `
Your ${entryTypeLabel.toLowerCase()} for ${workerName} on ${date} has been rejected by ${approverName}.

Reason: ${comments || 'No reason provided'}

Please review and resubmit with corrections.
        `.trim(),
      };
    }

    if (to === 'locked') {
      return {
        subject: `${entryTypeLabel} Locked - ${workerName} - ${date}`,
        body: `
The ${entryTypeLabel.toLowerCase()} for ${workerName} on ${date} has been locked after payroll processing.

This entry is now read-only and cannot be modified.
        `.trim(),
      };
    }

    return {
      subject: `${entryTypeLabel} Status Changed - ${workerName}`,
      body: `Status changed from ${from} to ${to}`,
    };
  }

  /**
   * Get audit log message for state transition
   */
  static getAuditMessage(
    from: EntryStatus,
    to: EntryStatus,
    userName: string,
    comments?: string
  ): string {
    let message = `Status changed from '${from}' to '${to}' by ${userName}`;
    if (comments) {
      message += ` - Comments: ${comments}`;
    }
    return message;
  }
}

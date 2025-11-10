/**
 * Audit Status Tracker - Tracks review status and reminds about unresolved issues
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Audit status structure
 */
export interface AuditStatus {
  lastReviewed: string | null;          // When user last ran --analyze
  lastTasksCreated: string | null;      // When user last ran --create-tasks
  unreviewedAudits: number;             // Count of audits since last review
  criticalIssuesCount: number;          // Current count of critical issues
  lastAuditRun: string | null;          // When last audit was executed
  reminderShown: boolean;               // Whether reminder was shown today
  lastReminderDate: string | null;      // Last date reminder was shown
}

/**
 * Default audit status
 */
const DEFAULT_STATUS: AuditStatus = {
  lastReviewed: null,
  lastTasksCreated: null,
  unreviewedAudits: 0,
  criticalIssuesCount: 0,
  lastAuditRun: null,
  reminderShown: false,
  lastReminderDate: null,
};

/**
 * Get path to audit status file
 */
function getStatusPath(projectPath: string): string {
  return path.join(projectPath, 'docs', 'audits', 'AUDIT_STATUS.json');
}

/**
 * Load audit status
 */
export function loadAuditStatus(projectPath: string): AuditStatus {
  const statusPath = getStatusPath(projectPath);

  if (!fs.existsSync(statusPath)) {
    return { ...DEFAULT_STATUS };
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { ...DEFAULT_STATUS };
  }
}

/**
 * Save audit status
 */
export function saveAuditStatus(projectPath: string, status: AuditStatus): void {
  const statusPath = getStatusPath(projectPath);
  const dir = path.dirname(statusPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
}

/**
 * Mark audit as run (called after any audit tool execution)
 */
export function markAuditRun(projectPath: string, criticalIssuesCount: number): void {
  const status = loadAuditStatus(projectPath);

  status.lastAuditRun = new Date().toISOString();
  status.unreviewedAudits += 1;
  status.criticalIssuesCount = criticalIssuesCount;

  saveAuditStatus(projectPath, status);
}

/**
 * Mark audits as reviewed (called when user runs --analyze)
 */
export function markAuditsReviewed(projectPath: string): void {
  const status = loadAuditStatus(projectPath);

  status.lastReviewed = new Date().toISOString();
  status.unreviewedAudits = 0;
  status.reminderShown = false;

  saveAuditStatus(projectPath, status);
}

/**
 * Mark tasks as created (called when user runs --create-tasks)
 */
export function markTasksCreated(projectPath: string): void {
  const status = loadAuditStatus(projectPath);

  status.lastTasksCreated = new Date().toISOString();
  status.criticalIssuesCount = 0; // Assume tasks created for all critical issues

  saveAuditStatus(projectPath, status);
}

/**
 * Check if reminder should be shown
 */
export function shouldShowReminder(projectPath: string): boolean {
  const status = loadAuditStatus(projectPath);

  // Don't show if no audits run yet
  if (!status.lastAuditRun) {
    return false;
  }

  // Check if reminder already shown today
  const today = new Date().toISOString().split('T')[0];
  const lastReminderDay = status.lastReminderDate ? status.lastReminderDate.split('T')[0] : null;

  if (lastReminderDay === today && status.reminderShown) {
    return false;
  }

  // Show reminder if:
  // 1. Unreviewed audits > 2
  // 2. Critical issues > 10
  // 3. Last audit > 24 hours ago and not reviewed

  const hasUnreviewedAudits = status.unreviewedAudits > 2;
  const hasCriticalIssues = status.criticalIssuesCount > 10;

  let auditOlderThan24h = false;
  if (status.lastAuditRun && !status.lastReviewed) {
    const auditTime = new Date(status.lastAuditRun).getTime();
    const now = new Date().getTime();
    const hoursSinceAudit = (now - auditTime) / (1000 * 60 * 60);
    auditOlderThan24h = hoursSinceAudit > 24;
  }

  return hasUnreviewedAudits || hasCriticalIssues || auditOlderThan24h;
}

/**
 * Get reminder message
 */
export function getReminderMessage(projectPath: string): string | null {
  const status = loadAuditStatus(projectPath);

  if (!shouldShowReminder(projectPath)) {
    return null;
  }

  const messages: string[] = [];

  if (status.unreviewedAudits > 0) {
    messages.push(`⚠️  ${status.unreviewedAudits} audit${status.unreviewedAudits > 1 ? 's' : ''} need review`);
  }

  if (status.criticalIssuesCount > 0) {
    messages.push(`🚨 ${status.criticalIssuesCount} unresolved critical issue${status.criticalIssuesCount > 1 ? 's' : ''}`);
  }

  if (messages.length === 0) {
    return null;
  }

  return messages.join('\n');
}

/**
 * Mark reminder as shown (so it won't show again today)
 */
export function markReminderShown(projectPath: string): void {
  const status = loadAuditStatus(projectPath);

  status.reminderShown = true;
  status.lastReminderDate = new Date().toISOString();

  saveAuditStatus(projectPath, status);
}

/**
 * Get next steps message after audit
 */
export function getNextStepsMessage(criticalIssuesCount: number): string {
  if (criticalIssuesCount === 0) {
    return '\n✅ No critical issues found!\n';
  }

  return `
💡 Next steps:
  📊 View detailed analysis: mcp audit --analyze
  📋 Create tasks from issues: mcp audit --create-tasks
  ⚡ Or run all at once: mcp audit-and-fix

⚠️  Found ${criticalIssuesCount} critical issue${criticalIssuesCount > 1 ? 's' : ''} that need attention
`;
}

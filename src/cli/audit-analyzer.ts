/**
 * Audit Analyzer - Analyzes audit log history and provides insights
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuditLog, AuditLogEntry } from '../utils/audit-logger.js';

/**
 * Trend data for a specific audit category
 */
export interface TrendData {
  timestamp: Date;
  score: number;
  issues?: number;
  debt?: number;
  avg?: number;
}

/**
 * Trends grouped by tool category
 */
export interface TrendAnalysis {
  security: TrendData[];
  a11y: TrendData[];
  techDebt: TrendData[];
  complexity: TrendData[];
  [key: string]: TrendData[];
}

/**
 * Issue found in audit
 */
export interface Issue {
  tool: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  file?: string;
  line?: number;
  code?: string;
  risk?: string;
  fix?: string;
  message?: string;
}

/**
 * Recommendation for improvement
 */
export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  action: string;
  impact: string;
}

/**
 * Comparison between two audits
 */
export interface Comparison {
  tool: string;
  before: {
    score: number;
    issuesCount: number;
  };
  after: {
    score: number;
    issuesCount: number;
  };
  scoreDelta: number;
  issuesDelta: number;
  fixed: Issue[];
  newIssues: Issue[];
  improved: boolean;
}

/**
 * AuditAnalyzer - Analyzes audit log history
 */
export class AuditAnalyzer {
  private auditLog: AuditLog;

  constructor(auditLog: AuditLog) {
    this.auditLog = auditLog;
  }

  /**
   * Load audit log from file
   */
  static loadFromFile(filePath: string): AuditAnalyzer {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audit log not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const auditLog: AuditLog = JSON.parse(content);

    return new AuditAnalyzer(auditLog);
  }

  /**
   * Analyze trends across all audits
   */
  analyzeTrends(): TrendAnalysis {
    const trends: TrendAnalysis = {
      security: [],
      a11y: [],
      techDebt: [],
      complexity: [],
    };

    this.auditLog.audits.forEach(audit => {
      const timestamp = new Date(audit.timestamp);
      const score = this.extractScore(audit);

      switch (audit.tool) {
        case 'securityAudit':
          trends.security.push({
            timestamp,
            score,
            issues: audit.results.summary?.totalVulnerabilities || 0,
          });
          break;
        case 'a11yAudit':
          trends.a11y.push({
            timestamp,
            score,
            issues: audit.results.summary?.totalIssues || 0,
          });
          break;
        case 'techDebtCalculator':
          trends.techDebt.push({
            timestamp,
            score,
            debt: audit.results.summary?.totalDebt || 0,
          });
          break;
        case 'analyzeComplexity':
          trends.complexity.push({
            timestamp,
            score,
            avg: audit.results.summary?.avgComplexity || 0,
          });
          break;
        default:
          // Create category for unknown tools
          if (!trends[audit.tool]) {
            trends[audit.tool] = [];
          }
          trends[audit.tool].push({
            timestamp,
            score,
            issues: audit.results.summary?.totalIssues || 0,
          });
      }
    });

    return trends;
  }

  /**
   * Find all critical and high severity issues
   */
  findCriticalIssues(): Issue[] {
    const critical: Issue[] = [];

    this.auditLog.audits.forEach(audit => {
      const issues = audit.results.issues || [];
      issues.forEach((issue: any) => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          critical.push({
            tool: audit.tool,
            timestamp: audit.timestamp,
            severity: issue.severity,
            type: issue.type,
            file: issue.file,
            line: issue.line,
            code: issue.code,
            risk: issue.risk,
            fix: issue.fix,
            message: issue.message,
          });
        }
      });
    });

    return critical;
  }

  /**
   * Generate recommendations based on audit history
   */
  generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const criticalIssues = this.findCriticalIssues();

    // Recommendation 1: Fix critical issues
    if (criticalIssues.length > 0) {
      const byTool: Record<string, number> = {};
      criticalIssues.forEach(issue => {
        byTool[issue.tool] = (byTool[issue.tool] || 0) + 1;
      });

      Object.entries(byTool).forEach(([tool, count]) => {
        const toolNames: Record<string, string> = {
          securityAudit: 'Security',
          a11yAudit: 'Accessibility',
          techDebtCalculator: 'Technical Debt',
        };
        recommendations.push({
          priority: 'HIGH',
          category: toolNames[tool] || tool,
          action: `Fix ${count} critical issue${count > 1 ? 's' : ''}`,
          impact: 'Critical for production',
        });
      });
    }

    // Recommendation 2: Improve low scores
    const latestAudits = this.getLatestAudits();
    Object.values(latestAudits).forEach(audit => {
      const score = this.extractScore(audit);
      if (score < 70) {
        recommendations.push({
          priority: 'MEDIUM',
          category: audit.tool,
          action: `Improve score (current: ${score.toFixed(1)})`,
          impact: 'Code quality',
        });
      }
    });

    // Recommendation 3: Run missing audits
    const tools = ['securityAudit', 'a11yAudit', 'techDebtCalculator', 'analyzeComplexity'];
    const auditedTools = new Set(this.auditLog.audits.map(a => a.tool));

    tools.forEach(tool => {
      if (!auditedTools.has(tool)) {
        recommendations.push({
          priority: 'LOW',
          category: tool,
          action: 'Run first audit',
          impact: 'Visibility',
        });
      }
    });

    return recommendations;
  }

  /**
   * Compare audits before and after a specific date
   */
  compareAudits(beforeDate: Date, afterDate: Date): Comparison[] {
    const comparisons: Comparison[] = [];
    const tools = new Set(this.auditLog.audits.map(a => a.tool));

    tools.forEach(tool => {
      const before = this.findAuditClosestTo(tool, beforeDate, 'before');
      const after = this.findAuditClosestTo(tool, afterDate, 'after');

      if (!before || !after) return;

      const beforeScore = this.extractScore(before);
      const afterScore = this.extractScore(after);
      const beforeIssues = before.results.issues || [];
      const afterIssues = after.results.issues || [];

      const scoreDelta = afterScore - beforeScore;
      const issuesDelta = afterIssues.length - beforeIssues.length;

      // Find fixed and new issues
      const beforeIssueKeys = new Set(
        beforeIssues.map((i: any) => `${i.file}:${i.line}:${i.type}`)
      );
      const afterIssueKeys = new Set(
        afterIssues.map((i: any) => `${i.file}:${i.line}:${i.type}`)
      );

      const fixed: Issue[] = [];
      const newIssues: Issue[] = [];

      beforeIssues.forEach((issue: any) => {
        const key = `${issue.file}:${issue.line}:${issue.type}`;
        if (!afterIssueKeys.has(key)) {
          fixed.push({
            tool,
            timestamp: before.timestamp,
            ...issue,
          });
        }
      });

      afterIssues.forEach((issue: any) => {
        const key = `${issue.file}:${issue.line}:${issue.type}`;
        if (!beforeIssueKeys.has(key)) {
          newIssues.push({
            tool,
            timestamp: after.timestamp,
            ...issue,
          });
        }
      });

      comparisons.push({
        tool,
        before: {
          score: beforeScore,
          issuesCount: beforeIssues.length,
        },
        after: {
          score: afterScore,
          issuesCount: afterIssues.length,
        },
        scoreDelta,
        issuesDelta,
        fixed,
        newIssues,
        improved: scoreDelta > 0 && issuesDelta <= 0,
      });
    });

    return comparisons;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalAudits: number;
    byTool: Record<string, { count: number; avgScore: number }>;
    avgDuration: number;
  } {
    const byTool: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
    let totalDuration = 0;

    this.auditLog.audits.forEach(audit => {
      if (!byTool[audit.tool]) {
        byTool[audit.tool] = { count: 0, avgScore: 0, scores: [] };
      }
      byTool[audit.tool].count++;
      const score = this.extractScore(audit);
      byTool[audit.tool].scores.push(score);
      totalDuration += audit.duration_ms || 0;
    });

    // Calculate averages
    Object.keys(byTool).forEach(tool => {
      const scores = byTool[tool].scores;
      byTool[tool].avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      delete (byTool[tool] as any).scores;
    });

    return {
      totalAudits: this.auditLog.audits.length,
      byTool: byTool as Record<string, { count: number; avgScore: number }>,
      avgDuration: this.auditLog.audits.length > 0
        ? totalDuration / this.auditLog.audits.length
        : 0,
    };
  }

  /**
   * Extract numeric score from audit entry
   */
  private extractScore(audit: AuditLogEntry): number {
    const scoreStr = audit.results.score || audit.results.summary?.score || '0';
    const match = scoreStr.toString().match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get latest audit for each tool
   */
  private getLatestAudits(): Record<string, AuditLogEntry> {
    const latest: Record<string, AuditLogEntry> = {};
    this.auditLog.audits.forEach(audit => {
      latest[audit.tool] = audit;
    });
    return latest;
  }

  /**
   * Find audit closest to a specific date
   */
  private findAuditClosestTo(
    tool: string,
    targetDate: Date,
    direction: 'before' | 'after'
  ): AuditLogEntry | null {
    const toolAudits = this.auditLog.audits
      .filter(a => a.tool === tool)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (toolAudits.length === 0) return null;

    const targetTime = targetDate.getTime();

    if (direction === 'before') {
      // Find latest audit before target date
      for (let i = toolAudits.length - 1; i >= 0; i--) {
        const auditTime = new Date(toolAudits[i].timestamp).getTime();
        if (auditTime <= targetTime) {
          return toolAudits[i];
        }
      }
      return toolAudits[0]; // Return earliest if none found
    } else {
      // Find earliest audit after target date
      for (let i = 0; i < toolAudits.length; i++) {
        const auditTime = new Date(toolAudits[i].timestamp).getTime();
        if (auditTime >= targetTime) {
          return toolAudits[i];
        }
      }
      return toolAudits[toolAudits.length - 1]; // Return latest if none found
    }
  }
}

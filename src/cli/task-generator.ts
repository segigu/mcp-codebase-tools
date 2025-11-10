/**
 * Task Generator - Creates tasks from audit log issues
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Issue } from './audit-analyzer.js';

/**
 * Task structure matching BACKLOG.json format
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'refactor' | 'test' | 'chore' | 'ui' | 'docs' | 'performance' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'todo' | 'in-progress' | 'blocked' | 'done';
  tags: string[];
  estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
  relatedFiles: string[];
  blockedBy: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backlog structure
 */
export interface Backlog {
  tasks: Task[];
}

/**
 * TaskGenerator - Generates tasks from audit issues
 */
export class TaskGenerator {
  private backlogPath: string;

  constructor(backlogPath: string) {
    this.backlogPath = backlogPath;
  }

  /**
   * Create tasks from issues
   */
  async createTasksFromIssues(issues: Issue[]): Promise<Task[]> {
    // Load existing backlog
    const backlog = this.loadBacklog();

    // Get next task ID
    let nextId = this.getNextTaskId(backlog);

    // Group issues by file and type to avoid duplicates
    const uniqueIssues = this.deduplicateIssues(issues);

    // Create tasks
    const newTasks: Task[] = [];

    for (const issue of uniqueIssues) {
      const task = this.issueToTask(issue, nextId);
      newTasks.push(task);
      nextId = this.incrementTaskId(nextId);
    }

    // Add new tasks to backlog
    backlog.tasks.push(...newTasks);

    // Save backlog
    this.saveBacklog(backlog);

    return newTasks;
  }

  /**
   * Load backlog from file
   */
  private loadBacklog(): Backlog {
    if (!fs.existsSync(this.backlogPath)) {
      // Create empty backlog
      const emptyBacklog: Backlog = { tasks: [] };
      fs.mkdirSync(path.dirname(this.backlogPath), { recursive: true });
      fs.writeFileSync(this.backlogPath, JSON.stringify(emptyBacklog, null, 2), 'utf-8');
      return emptyBacklog;
    }

    const content = fs.readFileSync(this.backlogPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save backlog to file
   */
  private saveBacklog(backlog: Backlog): void {
    fs.writeFileSync(this.backlogPath, JSON.stringify(backlog, null, 2), 'utf-8');
  }

  /**
   * Get next available task ID
   */
  private getNextTaskId(backlog: Backlog): string {
    if (backlog.tasks.length === 0) {
      return 'TASK-001';
    }

    // Find highest task ID
    const taskIds = backlog.tasks
      .map(t => t.id)
      .filter(id => id.match(/^TASK-\d+$/))
      .map(id => parseInt(id.replace('TASK-', ''), 10));

    if (taskIds.length === 0) {
      return 'TASK-001';
    }

    const maxId = Math.max(...taskIds);
    const nextNum = maxId + 1;
    return `TASK-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Increment task ID
   */
  private incrementTaskId(id: string): string {
    const num = parseInt(id.replace('TASK-', ''), 10);
    return `TASK-${String(num + 1).padStart(3, '0')}`;
  }

  /**
   * Deduplicate issues by file, line, and type
   */
  private deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set<string>();
    const unique: Issue[] = [];

    for (const issue of issues) {
      const key = `${issue.file}:${issue.line}:${issue.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(issue);
      }
    }

    return unique;
  }

  /**
   * Convert issue to task
   */
  private issueToTask(issue: Issue, id: string): Task {
    const now = new Date().toISOString();

    // Determine category based on issue type
    const category = this.issueCategoryMap(issue);

    // Map severity to priority
    const priority = this.severityToPriority(issue.severity);

    // Determine complexity
    const complexity = this.issueComplexity(issue);

    // Generate title
    const title = this.generateTitle(issue);

    // Generate description
    const description = this.generateDescription(issue);

    // Generate tags
    const tags = this.generateTags(issue);

    return {
      id,
      title,
      description,
      category,
      priority,
      status: 'backlog',
      tags,
      estimatedComplexity: complexity,
      relatedFiles: issue.file ? [issue.file] : [],
      blockedBy: [],
      notes: issue.tool ? `Generated from ${issue.tool} audit` : undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Map issue to category
   */
  private issueCategoryMap(issue: Issue): Task['category'] {
    const tool = issue.tool.toLowerCase();

    if (tool.includes('security')) {
      return 'security';
    } else if (tool.includes('a11y') || tool.includes('accessibility')) {
      return 'ui';
    } else if (tool.includes('debt')) {
      return 'refactor';
    } else if (tool.includes('complexity')) {
      return 'refactor';
    }

    return 'bug';
  }

  /**
   * Map severity to priority
   */
  private severityToPriority(severity: Issue['severity']): Task['priority'] {
    switch (severity) {
      case 'critical':
        return 'high'; // Critical issues become high priority tasks
      case 'high':
        return 'medium'; // High issues become medium priority tasks
      case 'medium':
        return 'low';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Determine issue complexity
   */
  private issueComplexity(issue: Issue): Task['estimatedComplexity'] {
    const type = issue.type?.toLowerCase() || '';

    // Security issues often require careful fixes
    if (issue.severity === 'critical' && type.includes('xss')) {
      return 'moderate';
    }

    // Most accessibility issues are simple fixes
    if (type.includes('missing-label') || type.includes('missing-alt')) {
      return 'trivial';
    }

    // Technical debt can be complex
    if (issue.tool?.includes('debt')) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * Generate task title
   */
  private generateTitle(issue: Issue): string {
    const type = issue.type || 'issue';
    const file = issue.file ? path.basename(issue.file) : 'unknown';

    // Create descriptive title based on issue type
    if (type === 'XSS') {
      return `Fix XSS vulnerability in ${file}`;
    } else if (type === 'missing-label') {
      return `Add label to input in ${file}`;
    } else if (type === 'missing-alt') {
      return `Add alt text to image in ${file}`;
    } else if (type === 'SQL Injection') {
      return `Fix SQL injection in ${file}`;
    } else {
      return `Fix ${type} in ${file}`;
    }
  }

  /**
   * Generate task description
   */
  private generateDescription(issue: Issue): string {
    const parts: string[] = [];

    if (issue.file && issue.line) {
      parts.push(`Location: ${issue.file}:${issue.line}`);
    }

    if (issue.risk) {
      parts.push(`Risk: ${issue.risk}`);
    }

    if (issue.fix) {
      parts.push(`Solution: ${issue.fix}`);
    }

    if (issue.code) {
      parts.push(`Code: \`${issue.code}\``);
    }

    return parts.join('\n\n');
  }

  /**
   * Generate tags for task
   */
  private generateTags(issue: Issue): string[] {
    const tags: string[] = [];

    // Add tool-based tag
    if (issue.tool?.includes('security')) {
      tags.push('security');
    } else if (issue.tool?.includes('a11y')) {
      tags.push('a11y', 'accessibility');
    } else if (issue.tool?.includes('debt')) {
      tags.push('tech-debt');
    }

    // Add severity tag
    if (issue.severity === 'critical') {
      tags.push('urgent');
    }

    // Add type-based tags
    if (issue.type) {
      const type = issue.type.toLowerCase();
      if (type.includes('xss')) {
        tags.push('xss', 'security');
      } else if (type.includes('sql')) {
        tags.push('sql-injection', 'security');
      } else if (type.includes('label')) {
        tags.push('forms');
      } else if (type.includes('alt')) {
        tags.push('images');
      }
    }

    return [...new Set(tags)]; // Deduplicate
  }
}

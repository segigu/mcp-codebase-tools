import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { maskPII } from '../../utils/security-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type AuditFilter } from '../../utils/types.js'

export interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  file: string
  line?: number
  code: string
  risk: string
  fix: string
}

export interface SecurityAuditInput extends PaginationInput {
  filter?: AuditFilter
}

export interface SecurityAuditOutput {
  vulnerabilities: SecurityVulnerability[]
  totalVulnerabilities: number
  score: string
  hasMore: boolean
  nextOffset?: number
}

export async function securityAudit(
  input: SecurityAuditInput = {}
): Promise<SecurityAuditOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx,ts,js}'
  const files = findFiles(filePattern)
  const allVulnerabilities: SecurityVulnerability[] = []

  for (const file of files) {
    const code = readFileSafe(file)
    const lines = code.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for XSS
      if (line.includes('dangerouslySetInnerHTML')) {
        allVulnerabilities.push({
          severity: 'critical',
          type: 'XSS',
          file,
          line: i + 1,
          code: line.trim(),
          risk: 'User input rendered without sanitization',
          fix: 'Use DOMPurify.sanitize() or avoid dangerouslySetInnerHTML'
        })
      }

      // Check for hardcoded secrets
      if (line.includes('API_KEY') || line.includes('SECRET') || line.includes('PASSWORD')) {
        if (line.includes('=') && !line.includes('process.env')) {
          allVulnerabilities.push({
            severity: 'high',
            type: 'secret-in-code',
            file,
            line: i + 1,
            code: line.trim(),
            risk: 'Hardcoded secret exposed in code',
            fix: 'Move to environment variable'
          })
        }
      }
    }
  }

  // Apply filters
  let filteredVulnerabilities = allVulnerabilities
  if (filter.severity) {
    filteredVulnerabilities = filteredVulnerabilities.filter(v =>
      filter.severity!.includes(v.severity)
    )
  }
  if (filter.type) {
    filteredVulnerabilities = filteredVulnerabilities.filter(v =>
      filter.type!.includes(v.type)
    )
  }

  // Calculate score based on all vulnerabilities
  const score = allVulnerabilities.length === 0 ? 'A (100/100)' :
                allVulnerabilities.length < 5 ? 'B (80/100)' :
                allVulnerabilities.length < 10 ? 'C (60/100)' : 'D (40/100)'

  // Apply pagination
  const paginatedVulnerabilities = filteredVulnerabilities.slice(offset, offset + limit)

  // Mask PII in code snippets before returning
  const maskedVulnerabilities = paginatedVulnerabilities.map(v => ({
    ...v,
    code: maskPII(v.code)
  }))

  const result = {
    vulnerabilities: maskedVulnerabilities,
    totalVulnerabilities: filteredVulnerabilities.length,
    score,
    hasMore: offset + limit < filteredVulnerabilities.length,
    nextOffset: offset + limit < filteredVulnerabilities.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'securityAudit',
    'mcp:security-audit',
    {
      summary: {
        score,
        totalVulnerabilities: allVulnerabilities.length,
        critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
        high: allVulnerabilities.filter(v => v.severity === 'high').length,
        medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
        low: allVulnerabilities.filter(v => v.severity === 'low').length
      },
      issues: maskedVulnerabilities.slice(0, 10), // Top 10 vulnerabilities
      score
    },
    Date.now() - startTime
  )

  return result
}

/**
 * Documentation Generator - Composite Skill
 *
 * Generates comprehensive project documentation by combining:
 * - Component Inventory (React components catalog)
 * - API Inventory (API endpoints and data models)
 * - i18n Analysis (localization coverage)
 *
 * Outputs markdown documentation with statistics and insights.
 */

import { componentInventory, type ComponentInventoryOutput } from '../analyze/componentInventory.js'
import { apiInventory, type APIInventoryOutput } from '../analyze/apiInventory.js'
import { i18nAnalysis, type I18nAnalysisOutput } from '../analyze/i18nAnalysis.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput } from '../../utils/types.js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface DocumentationGeneratorInput extends PaginationInput {
  /** Output file path (default: docs/GENERATED_DOCUMENTATION.md) */
  outputPath?: string
}

export interface DocumentationStats {
  totalComponents: number
  totalEndpoints: number
  i18nCoverage: number
  documentationScore: number
  completeness: 'complete' | 'good' | 'partial' | 'poor'
}

export interface DocumentationGeneratorOutput {
  stats: DocumentationStats
  outputFile: string
  detailedResults: {
    components: ComponentInventoryOutput
    api: APIInventoryOutput
    i18n: I18nAnalysisOutput
  }
  sections: {
    components: string
    api: string
    i18n: string
  }
  executionTime: number
}

/**
 * Generate project documentation
 */
export async function documentationGenerator(
  input: DocumentationGeneratorInput = {}
): Promise<DocumentationGeneratorOutput> {
  const startTime = Date.now()

  console.log('📚 Generating Project Documentation...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Run all analyses in parallel
  console.log('⚡ Collecting data from multiple sources...')
  const [componentsResult, apiResult, i18nResult] = await Promise.all([
    componentInventory({ limit: 200 }),
    apiInventory({ limit: 200 }),
    i18nAnalysis({})
  ])

  console.log('✅ Data collection completed\n')

  // Calculate stats
  const totalComponents = componentsResult.totalComponents
  const totalEndpoints = apiResult.totalEndpoints

  // Calculate average i18n coverage across all locales
  const coverageValues = Object.values(i18nResult.coverage).map(c => parseFloat(c.percent))
  const i18nCoverage = coverageValues.length > 0
    ? Math.round(coverageValues.reduce((sum, val) => sum + val, 0) / coverageValues.length)
    : 0

  // Documentation score: weighted average
  const componentScore = Math.min(100, totalComponents * 2) // 50+ components = 100
  const apiScore = Math.min(100, totalEndpoints * 5) // 20+ endpoints = 100
  const i18nScore = i18nCoverage

  const documentationScore = Math.round((componentScore + apiScore + i18nScore) / 3)

  // Determine completeness
  let completeness: 'complete' | 'good' | 'partial' | 'poor'
  if (documentationScore >= 90) completeness = 'complete'
  else if (documentationScore >= 70) completeness = 'good'
  else if (documentationScore >= 50) completeness = 'partial'
  else completeness = 'poor'

  const stats: DocumentationStats = {
    totalComponents,
    totalEndpoints,
    i18nCoverage,
    documentationScore,
    completeness
  }

  // Generate markdown sections

  // Components section
  const componentsSection = generateComponentsSection(componentsResult)

  // API section
  const apiSection = generateApiSection(apiResult)

  // i18n section
  const i18nSection = generateI18nSection(i18nResult)

  // Combine all sections
  const fullDocumentation = `# Project Documentation

**Auto-generated:** ${new Date().toISOString()}

## 📊 Documentation Statistics

- **Total Components:** ${totalComponents}
- **Total API Endpoints:** ${totalEndpoints}
- **i18n Coverage:** ${i18nCoverage}%
- **Documentation Score:** ${documentationScore}/100 (${completeness})

---

${componentsSection}

---

${apiSection}

---

${i18nSection}

---

## 🔄 Regeneration

This documentation is auto-generated. To regenerate:

\`\`\`bash
npm run mcp:docs-generator
\`\`\`

**Last updated:** ${new Date().toLocaleString()}
`

  // Write to file
  const outputPath = input.outputPath || path.resolve(__dirname, '..', '..', '..', 'docs', 'GENERATED_DOCUMENTATION.md')
  const docsDir = path.dirname(outputPath)

  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, fullDocumentation, 'utf-8')

  console.log(`✅ Documentation generated: ${outputPath}\n`)

  const executionTime = Date.now() - startTime

  const result: DocumentationGeneratorOutput = {
    stats,
    outputFile: outputPath,
    detailedResults: {
      components: componentsResult,
      api: apiResult,
      i18n: i18nResult
    },
    sections: {
      components: componentsSection,
      api: apiSection,
      i18n: i18nSection
    },
    executionTime
  }

  // Log audit result
  logAuditResult(
    'documentationGenerator',
    'mcp:docs-generator',
    {
      summary: {
        documentationScore,
        completeness,
        totalComponents,
        totalEndpoints,
        i18nCoverage: `${i18nCoverage}%`,
        executionTime: `${executionTime}ms`,
        outputFile: outputPath
      },
      score: completeness,
      stats: {
        documentationScore,
        totalComponents,
        totalEndpoints,
        i18nCoverage
      }
    },
    executionTime
  )

  return result
}

/**
 * Generate components section
 */
function generateComponentsSection(data: ComponentInventoryOutput): string {
  let markdown = `## 🧩 Components Inventory

**Total Components:** ${data.totalComponents}

### Components by Complexity

| Complexity | Count |
|----------|-------|
`

  for (const [complexity, count] of Object.entries(data.complexity)) {
    markdown += `| ${complexity} | ${count} |\n`
  }

  markdown += `\n### Coverage\n\n`
  markdown += `- **With Tests:** ${data.coverage.withTests}%\n`
  markdown += `- **With Storybook:** ${data.coverage.withStorybook}%\n`
  markdown += `- **Documented:** ${data.coverage.documented}%\n`

  markdown += `\n### Component List\n\n`

  for (const component of data.components.slice(0, 50)) {
    markdown += `#### \`${component.name}\`\n`
    markdown += `- **File:** \`${component.path}\`\n`
    markdown += `- **Type:** ${component.type}\n`
    markdown += `- **Complexity:** ${component.complexity}\n`
    markdown += `- **Props:** ${component.props.length}\n`
    markdown += `- **Usage Count:** ${component.usageCount}\n`
    markdown += `- **Lines of Code:** ${component.linesOfCode}\n`

    if (component.hasTests) {
      markdown += `- **Tests:** ✅\n`
    }

    if (component.hasStorybook) {
      markdown += `- **Storybook:** ✅\n`
    }

    markdown += `\n`
  }

  if (data.components.length > 50) {
    markdown += `\n*...and ${data.components.length - 50} more components*\n`
  }

  return markdown
}

/**
 * Generate API section
 */
function generateApiSection(data: APIInventoryOutput): string {
  let markdown = `## 🔌 API Inventory

**Total Endpoints:** ${data.totalEndpoints}

### Endpoints by Method

| Method | Count |
|--------|-------|
`

  for (const [method, count] of Object.entries(data.byMethod)) {
    markdown += `| ${method} | ${count} |\n`
  }

  markdown += `\n### API Endpoints\n\n`

  for (const endpoint of data.endpoints.slice(0, 50)) {
    markdown += `#### \`${endpoint.method} ${endpoint.url}\`\n`
    markdown += `- **Usage Count:** ${endpoint.usageCount}\n`
    markdown += `- **Used In:** ${endpoint.usedIn.length} file(s)\n`

    if (endpoint.requestType) {
      markdown += `- **Request Type:** \`${endpoint.requestType}\`\n`
    }

    if (endpoint.responseType) {
      markdown += `- **Response Type:** \`${endpoint.responseType}\`\n`
    }

    if (endpoint.authentication) {
      markdown += `- **Authentication:** ${endpoint.authentication}\n`
    }

    markdown += `\n`
  }

  if (data.endpoints.length > 50) {
    markdown += `\n*...and ${data.endpoints.length - 50} more endpoints*\n`
  }

  return markdown
}

/**
 * Generate i18n section
 */
function generateI18nSection(data: I18nAnalysisOutput): string {
  // Calculate average coverage across all locales
  const coverageValues = Object.values(data.coverage).map(c => parseFloat(c.percent))
  const avgCoverage = coverageValues.length > 0
    ? Math.round(coverageValues.reduce((sum, val) => sum + val, 0) / coverageValues.length)
    : 0

  let markdown = `## 🌐 Internationalization (i18n)

**Average Coverage:** ${avgCoverage}%

### Translation Keys

- **Total Keys:** ${data.summary.totalKeys}
- **Fully Translated:** ${data.summary.fullyTranslated}
- **Partially Translated:** ${data.summary.partiallyTranslated}
- **Missing Keys:** ${data.missing.length}
- **Unused Keys:** ${data.unused.length}

### Locales

`

  for (const locale of data.locales) {
    const localeCoverage = data.coverage[locale]
    markdown += `- \`${locale}\`: ${localeCoverage.percent}% (${localeCoverage.translated}/${localeCoverage.total})\n`
  }

  if (data.missing.length > 0) {
    markdown += `\n### Missing Translations\n\n`

    for (const missing of data.missing.slice(0, 20)) {
      markdown += `- \`${missing.key}\` (needed in: ${missing.locales.join(', ')})\n`
    }

    if (data.missing.length > 20) {
      markdown += `\n*...and ${data.missing.length - 20} more missing keys*\n`
    }
  }

  if (data.unused.length > 0) {
    markdown += `\n### Unused Keys (can be removed)\n\n`

    for (const unused of data.unused.slice(0, 20)) {
      markdown += `- \`${unused.key}\` (in locale: ${unused.locale})\n`
    }

    if (data.unused.length > 20) {
      markdown += `\n*...and ${data.unused.length - 20} more unused keys*\n`
    }
  }

  return markdown
}

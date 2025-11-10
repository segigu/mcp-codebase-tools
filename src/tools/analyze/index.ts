/**
 * MCP Codebase Tools - Analysis Tools
 *
 * Tools for analyzing project structure, code complexity,
 * duplicates, and unused exports.
 */

export {
  getProjectStructure,
  type GetProjectStructureInput,
  type GetProjectStructureOutput,
  type DirectoryNode,
  type ProjectStructureStats
} from './getProjectStructure.js'

export {
  analyzeComplexity,
  type AnalyzeComplexityInput,
  type AnalyzeComplexityOutput,
  type FileComplexity,
  type ComplexitySummary
} from './analyzeComplexity.js'

export {
  findDuplicates,
  type FindDuplicatesInput,
  type FindDuplicatesOutput,
  type CodeBlock,
  type DuplicateGroup,
  type DuplicateSummary
} from './findDuplicates.js'

export {
  analyzeUnusedExports,
  type AnalyzeUnusedExportsInput,
  type AnalyzeUnusedExportsOutput,
  type UnusedExport,
  type UnusedExportsSummary
} from './analyzeUnusedExports.js'

export {
  callersAnalysis,
  type CallersAnalysisInput,
  type CallersAnalysisOutput,
  type SymbolReference
} from './callersAnalysis.js'

export {
  i18nAnalysis,
  type I18nAnalysisInput,
  type I18nAnalysisOutput,
  type MissingKey,
  type UnusedKey,
  type LocaleCoverage
} from './i18nAnalysis.js'

// New tools - Roadmap v2.0+
export {
  componentInventory,
  type ComponentInventoryInput,
  type ComponentInventoryOutput,
  type EnrichedComponent,
  type PropInfo
} from './componentInventory.js'

export {
  designTokensAnalysis,
  type DesignTokensInput,
  type DesignTokensOutput,
  type TokenUsage
} from './designTokensAnalysis.js'

export {
  apiInventory,
  type APIInventoryInput,
  type APIInventoryOutput,
  type APIEndpoint
} from './apiInventory.js'

export {
  testCoverageGaps,
  type TestCoverageGapsInput,
  type TestCoverageGapsOutput,
  type UncoveredComponent,
  type EdgeCaseGap
} from './testCoverageGaps.js'

export {
  bundleAnalysis,
  type BundleAnalysisInput,
  type BundleAnalysisOutput,
  type BundleItem
} from './bundleAnalysis.js'

export {
  rerendersDetection,
  type RerendersDetectionInput,
  type RerendersDetectionOutput,
  type RerenderIssue
} from './rerendersDetection.js'

export {
  stateManagementAnalysis,
  type StateManagementInput,
  type StateManagementOutput,
  type PropDrillingIssue
} from './stateManagementAnalysis.js'

export {
  securityAudit,
  type SecurityAuditInput,
  type SecurityAuditOutput,
  type SecurityVulnerability
} from './securityAudit.js'

export {
  techDebtCalculator,
  type TechDebtInput,
  type TechDebtOutput
} from './techDebtCalculator.js'

export {
  a11yAudit,
  type A11yAuditInput,
  type A11yAuditOutput,
  type A11yIssue
} from './a11yAudit.js'

export {
  tailwindOptimizer,
  type TailwindOptimizerInput,
  type TailwindOptimizerOutput,
  type TailwindPattern
} from './tailwindOptimizer.js'

export {
  mockGenerator,
  type MockGeneratorInput,
  type MockGeneratorOutput
} from './mockGenerator.js'

export {
  docsGenerator,
  type DocsGeneratorInput,
  type DocsGeneratorOutput
} from './docsGenerator.js'

export {
  gitHotspots,
  type GitHotspotsInput,
  type GitHotspotsOutput,
  type GitHotspot
} from './gitHotspots.js'

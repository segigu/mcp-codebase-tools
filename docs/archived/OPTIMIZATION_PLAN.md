# MCP Optimization Plan - Архитектурные улучшения

**Дата создания:** 2025-01-09
**Статус:** Planning → Implementation
**Версия:** 1.0
**Цель:** Довести MCP инструменты до production-ready уровня с максимальной экономией токенов

---

## 📊 Текущее состояние

### ✅ Что работает (25 инструментов)

| Категория | Инструменты | Статус |
|-----------|-------------|--------|
| **Поиск (6)** | find-imports, find-components, find-usages, structure, unused, complexity | ✅ Работают |
| **Анализ (14)** | component-inventory, design-tokens, api-inventory, test-coverage-gaps, bundle-analysis, rerenders-detection, state-management, security-audit, tech-debt, a11y-audit, tailwind-optimizer, mock-generator, docs-generator, git-hotspots | ✅ Протестированы |
| **Задачи (5)** | task-list, task-next, task-done, task-add, task-stats | ✅ Работают |

**Экономия токенов:** 90-98% на каждом инструменте

---

## 🚨 Архитектурные проблемы

### Проблема #1: Отсутствие прогрессивной детализации
**Сейчас:** Модель получает ВСЕ схемы инструментов сразу в контексте
**Должно быть:** 3 уровня детализации по требованию

```
Уровень 1: list     → только имена (100 токенов)
Уровень 2: describe → краткое описание (500 токенов)
Уровень 3: schema   → полная I/O схема (2000 токенов)
```

**Экономия:** ~85% на этапе выбора инструмента

### Проблема #2: Нет лимитов и пагинации
**Сейчас:** Все результаты сразу в модель
**Пример:** `designTokensAnalysis()` → 132 цвета в контексте (2500 токенов)

**Должно быть:**
```typescript
designTokensAnalysis({limit: 50, offset: 0})
→ {colors: [...50], total: 132, hasMore: true, nextOffset: 50}
```

**Экономия:** ~40% на больших результатах

### Проблема #3: Нет фильтрации результатов
**Сейчас:** Возвращаем всё
**Должно быть:** Фильтрация по severity, category, priority

```typescript
securityAudit({severity: "critical"})
a11yAudit({minSeverity: "high", limit: 10})
testCoverageGaps({complexity: "complex", limit: 5})
```

### Проблема #4: Нет маскирования PII/секретов
**ОПАСНО:** Секреты могут попасть в контекст модели!

```typescript
// СЕЙЧАС:
securityAudit() → "API_KEY=sk-proj-abc123..."

// ДОЛЖНО БЫТЬ:
→ "API_KEY=<REDACTED_TOKEN_1>"
```

### Проблема #5: Нет кэширования
**Сейчас:** Каждый запрос = полный AST парсинг
**Должно быть:** Кэш на 5 минут для дорогих операций

---

## 🎯 План реализации

## СПРИНТ 1: Критичные инструменты (P0) - 6 часов

### Задача 1.1: Создать `callersAnalysis.ts`
**Приоритет:** 🔴 P0 (КРИТИЧНО)
**Время:** 2 часа
**Экономия:** 98% (80,000 → 1,500 токенов)

**Файлы:**
- `mcp-server/tools/analyze/callersAnalysis.ts` (новый)
- `mcp-server/tools/analyze/index.ts` (добавить экспорт)
- `scripts/mcp-wrapper.js` (добавить команду)
- `package.json` (добавить npm script)

**Интерфейс:**
```typescript
export interface CallersAnalysisInput {
  symbolName: string        // Функция/компонент для поиска
  limit?: number            // default 50
  offset?: number           // default 0
  contextLines?: number     // строк контекста вокруг (default 2)
  filePattern?: string      // glob pattern для фильтрации
}

export interface CallersAnalysisOutput {
  symbol: string
  totalRefs: number
  refs: Array<{
    file: string
    line: number
    snippet: string         // ≤200 символов
    context: string[]       // N строк до/после
    functionName?: string   // в какой функции вызов
  }>
  hasMore: boolean
  nextOffset?: number
}
```

**Алгоритм:**
1. Используй `findFiles()` для поиска файлов по pattern
2. Для каждого файла: `readFileSafe()` + regex поиск по символу
3. Извлекай контекст (N строк до/после)
4. Применяй limit/offset для пагинации
5. Возвращай компактный результат

**Пример использования:**
```bash
npm run mcp:callers -- fetchData
npm run mcp:callers -- Button --limit 10
```

---

### Задача 1.2: Создать `i18nAnalysis.ts`
**Приоритет:** 🟠 P1 (ВАЖНО)
**Время:** 2 часа
**Экономия:** 95% (25,000 → 1,200 токенов)

**Файлы:**
- `mcp-server/tools/analyze/i18nAnalysis.ts` (новый)
- `mcp-server/tools/analyze/index.ts` (добавить экспорт)
- `scripts/mcp-wrapper.js` (добавить команду)
- `package.json` (добавить npm script)

**Интерфейс:**
```typescript
export interface I18nAnalysisInput {
  localesPath?: string      // default 'public/locales' or 'src/locales'
  sourceLocale?: string     // default 'en'
  limit?: number            // default 50
}

export interface I18nAnalysisOutput {
  locales: string[]
  missing: Array<{
    key: string
    locales: string[]       // какие локали не имеют перевода
    usedIn: string[]        // где используется ключ
  }>
  unused: Array<{
    key: string
    locale: string
    value: string
  }>
  coverage: {
    [locale: string]: {
      translated: number
      total: number
      percent: string
      missingKeys: string[]
    }
  }
  summary: {
    totalKeys: number
    fullyTranslated: number
    partiallyTranslated: number
    unused: number
  }
}
```

**Алгоритм:**
1. Найди все JSON файлы локализации
2. Собери все ключи из всех локалей
3. Сравни ключи между локалями (missing)
4. Найди неиспользуемые ключи через grep по коду
5. Посчитай coverage для каждой локали

---

### Задача 1.3: Добавить PII маскирование
**Приоритет:** 🔴 P0 (SECURITY)
**Время:** 1 час

**Файлы:**
- `mcp-server/lib/security-utils.ts` (новый)
- `mcp-server/tools/analyze/securityAudit.ts` (применить)
- `mcp-server/tools/analyze/apiInventory.ts` (применить)

**Реализация:**
```typescript
// lib/security-utils.ts
export interface MaskOptions {
  apiKeys?: boolean       // default true
  emails?: boolean        // default true
  tokens?: boolean        // default true
  urls?: boolean          // default false
  ipAddresses?: boolean   // default false
}

export function maskPII(text: string, options: MaskOptions = {}): string {
  const {
    apiKeys = true,
    emails = true,
    tokens = true,
    urls = false,
    ipAddresses = false
  } = options

  let masked = text

  // API Keys (OpenAI, Anthropic, etc)
  if (apiKeys) {
    masked = masked
      .replace(/sk-[a-zA-Z0-9]{48}/g, '<REDACTED_OPENAI_KEY>')
      .replace(/sk-ant-[a-zA-Z0-9-]{95}/g, '<REDACTED_ANTHROPIC_KEY>')
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_TOKEN>')
      .replace(/gho_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_OAUTH>')
  }

  // Email addresses
  if (emails) {
    masked = masked.replace(/[\w.-]+@[\w.-]+\.\w+/g, '<REDACTED_EMAIL>')
  }

  // Bearer tokens
  if (tokens) {
    masked = masked
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer <REDACTED_TOKEN>')
      .replace(/Authorization:\s*[^\s]+/gi, 'Authorization: <REDACTED>')
  }

  // URLs with credentials
  if (urls) {
    masked = masked.replace(
      /https?:\/\/[^:]+:[^@]+@[^\s]+/g,
      '<REDACTED_URL_WITH_CREDENTIALS>'
    )
  }

  // IP addresses
  if (ipAddresses) {
    masked = masked.replace(
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      '<REDACTED_IP>'
    )
  }

  return masked
}

// Для больших объектов
export function maskPIIInObject<T>(obj: T, fields: string[] = []): T {
  const json = JSON.stringify(obj)
  const masked = maskPII(json)
  return JSON.parse(masked)
}
```

**Применить в:**
```typescript
// securityAudit.ts
import { maskPII } from '../../lib/security-utils'

export async function securityAudit(): Promise<SecurityAuditOutput> {
  // ... существующий код ...

  // Маскируем перед возвратом
  return {
    vulnerabilities: vulnerabilities.map(v => ({
      ...v,
      code: maskPII(v.code)
    })),
    score,
    recommendations
  }
}
```

---

### Задача 1.4: Добавить limit/offset во ВСЕ 14 инструментов
**Приоритет:** 🔴 P0
**Время:** 3 часа (по 15 минут на каждый)

**Базовый интерфейс для всех:**
```typescript
// lib/types.ts
export interface PaginationInput {
  limit?: number          // default 50
  offset?: number         // default 0
}

export interface PaginationOutput {
  total: number
  hasMore: boolean
  nextOffset?: number
  prevOffset?: number
}
```

**Список файлов для обновления:**
1. `componentInventory.ts`
2. `designTokensAnalysis.ts`
3. `apiInventory.ts`
4. `testCoverageGaps.ts`
5. `bundleAnalysis.ts`
6. `rerendersDetection.ts`
7. `stateManagementAnalysis.ts`
8. `securityAudit.ts`
9. `techDebtCalculator.ts`
10. `a11yAudit.ts`
11. `tailwindOptimizer.ts`
12. `mockGenerator.ts` (не применимо)
13. `docsGenerator.ts` (не применимо)
14. `gitHotspots.ts`

**Шаблон изменений:**
```typescript
// БЫЛО:
export async function componentInventory(): Promise<ComponentInventoryOutput>

// СТАЛО:
export interface ComponentInventoryInput extends PaginationInput {
  filter?: {
    withTests?: boolean
    complexity?: 'trivial' | 'simple' | 'moderate' | 'complex'
    minUsageCount?: number
  }
}

export interface ComponentInventoryOutput extends PaginationOutput {
  components: EnrichedComponent[]
  // ... остальные поля
}

export async function componentInventory(
  input: ComponentInventoryInput = {}
): Promise<ComponentInventoryOutput> {
  const { limit = 50, offset = 0, filter = {} } = input

  // ... существующий код ...

  // Применяем пагинацию
  const paginatedComponents = allComponents.slice(offset, offset + limit)

  return {
    components: paginatedComponents,
    total: allComponents.length,
    hasMore: offset + limit < allComponents.length,
    nextOffset: offset + limit < allComponents.length ? offset + limit : undefined,
    // ... остальные поля
  }
}
```

---

## СПРИНТ 2: Прогрессивная детализация (P1) - 4 часа

### Задача 2.1: Создать систему уровней детализации
**Приоритет:** 🟠 P1
**Время:** 3 часа

**Файлы:**
- `scripts/mcp-meta.js` (новый)
- `package.json` (добавить npm scripts)

**Три уровня:**

**Уровень 1: `mcp:list`** - только имена
```bash
npm run mcp:list
```
```json
{
  "categories": {
    "search": ["find-imports", "find-components", "find-usages", "callers"],
    "analysis": ["component-inventory", "design-tokens", "security-audit"],
    "tasks": ["task-list", "task-next", "task-done"]
  },
  "total": 27
}
```

**Уровень 2: `mcp:describe <name>`** - краткое описание
```bash
npm run mcp:describe component-inventory
```
```json
{
  "name": "component-inventory",
  "category": "analysis",
  "description": "Full component analysis with usage counts and test coverage",
  "tokenSavings": "96% (78K → 3K)",
  "inputs": ["limit", "offset", "filter.complexity"],
  "outputs": ["components[]", "coverage", "topUsed[]"],
  "examples": [
    "npm run mcp:component-inventory",
    "npm run mcp:component-inventory -- --limit 10"
  ]
}
```

**Уровень 3: `mcp:schema <name>`** - полная I/O схема
```bash
npm run mcp:schema component-inventory
```
```json
{
  "name": "component-inventory",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {"type": "number", "default": 50},
      "offset": {"type": "number", "default": 0},
      "filter": {
        "type": "object",
        "properties": {
          "complexity": {"enum": ["trivial", "simple", "moderate", "complex"]}
        }
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "components": {"type": "array"},
      "total": {"type": "number"},
      "hasMore": {"type": "boolean"}
    },
    "required": ["components", "total", "hasMore"]
  }
}
```

**Реализация `mcp-meta.js`:**
```javascript
#!/usr/bin/env node

const TOOLS_METADATA = {
  'component-inventory': {
    category: 'analysis',
    description: 'Full component analysis with usage counts and test coverage',
    tokenSavings: '96% (78K → 3K)',
    inputs: ['limit', 'offset', 'filter.complexity', 'filter.withTests'],
    outputs: ['components[]', 'coverage', 'topUsed[]', 'total', 'hasMore'],
    examples: [
      'npm run mcp:component-inventory',
      'npm run mcp:component-inventory -- --limit 10',
      'npm run mcp:component-inventory -- --filter.complexity complex'
    ],
    inputSchema: {
      type: 'object',
      properties: {
        limit: {type: 'number', default: 50},
        offset: {type: 'number', default: 0},
        filter: {
          type: 'object',
          properties: {
            withTests: {type: 'boolean'},
            complexity: {enum: ['trivial', 'simple', 'moderate', 'complex']},
            minUsageCount: {type: 'number'}
          }
        }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        components: {type: 'array', items: {type: 'object'}},
        total: {type: 'number'},
        hasMore: {type: 'boolean'},
        coverage: {type: 'object'},
        topUsed: {type: 'array'}
      },
      required: ['components', 'total', 'hasMore']
    }
  },
  // ... метаданные для всех 27 инструментов
}

const command = process.argv[2]
const toolName = process.argv[3]

if (command === 'list') {
  // Группировка по категориям
  const categories = {}
  for (const [name, meta] of Object.entries(TOOLS_METADATA)) {
    if (!categories[meta.category]) categories[meta.category] = []
    categories[meta.category].push(name)
  }
  console.log(JSON.stringify({categories, total: Object.keys(TOOLS_METADATA).length}, null, 2))
}

if (command === 'describe' && toolName) {
  const meta = TOOLS_METADATA[toolName]
  if (!meta) {
    console.error(`❌ Unknown tool: ${toolName}`)
    process.exit(1)
  }
  console.log(JSON.stringify({
    name: toolName,
    category: meta.category,
    description: meta.description,
    tokenSavings: meta.tokenSavings,
    inputs: meta.inputs,
    outputs: meta.outputs,
    examples: meta.examples
  }, null, 2))
}

if (command === 'schema' && toolName) {
  const meta = TOOLS_METADATA[toolName]
  if (!meta) {
    console.error(`❌ Unknown tool: ${toolName}`)
    process.exit(1)
  }
  console.log(JSON.stringify({
    name: toolName,
    inputSchema: meta.inputSchema,
    outputSchema: meta.outputSchema
  }, null, 2))
}
```

**Добавить в package.json:**
```json
{
  "scripts": {
    "mcp:list": "node scripts/mcp-meta.js list",
    "mcp:describe": "node scripts/mcp-meta.js describe",
    "mcp:schema": "node scripts/mcp-meta.js schema"
  }
}
```

---

## СПРИНТ 3: Оптимизации (P2) - 4 часа

### Задача 3.1: Кэширование результатов
**Приоритет:** 🟢 P2
**Время:** 2 часа

**Файлы:**
- `mcp-server/lib/cache-utils.ts` (новый)
- Применить в `structure`, `complexity`, `component-inventory`

**Реализация:**
```typescript
// lib/cache-utils.ts
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class ResultCache {
  private cache = new Map<string, CacheEntry<any>>()

  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 минут

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`)
    return entry.data
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  clear(): void {
    this.cache.clear()
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Глобальный инстанс
export const globalCache = new ResultCache()

// Декоратор для кэширования
export function cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`

      const cached = globalCache.get(cacheKey)
      if (cached) return cached

      const result = await originalMethod.apply(this, args)
      globalCache.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}
```

**Применение:**
```typescript
// findProjectStructure.ts
import { cached } from '../../lib/cache-utils'

export class ProjectAnalyzer {
  @cached(10 * 60 * 1000) // 10 минут для структуры проекта
  async analyzeStructure(): Promise<ProjectStructureOutput> {
    // ... дорогой AST парсинг ...
  }
}
```

---

### Задача 3.2: Композитные "навыки" (Skills)
**Приоритет:** 🟢 P2
**Время:** 2 часа

**Файлы:**
- `mcp-server/tools/skills/` (новая папка)
- `mcp-server/tools/skills/componentDeepDive.ts`
- `mcp-server/tools/skills/securityFullAudit.ts`

**Пример композитного навыка:**
```typescript
// tools/skills/componentDeepDive.ts
import { componentInventory } from '../analyze/componentInventory'
import { findImports } from '../search/findImports'
import { callersAnalysis } from '../analyze/callersAnalysis'
import { analyzeComplexity } from '../analyze/analyzeComplexity'

export interface ComponentDeepDiveInput {
  componentName: string
}

export interface ComponentDeepDiveOutput {
  summary: {
    name: string
    usageCount: number
    complexity: number
    testCoverage: boolean
    recommendation: string
  }
  details: {
    info: any
    imports: any
    callers: any
    complexity: any
  }
}

/**
 * Композитный анализ компонента
 * Пайплайн: inventory → imports → callers → complexity
 *
 * Экономия: 97% (200,000 → 6,000 токенов)
 */
export async function componentDeepDive(
  input: ComponentDeepDiveInput
): Promise<ComponentDeepDiveOutput> {
  const { componentName } = input

  console.log(`🔍 Deep dive analysis: ${componentName}`)

  // Шаг 1: Базовая информация
  const inventory = await componentInventory({
    filter: { name: componentName },
    limit: 1
  })

  if (inventory.components.length === 0) {
    throw new Error(`Component ${componentName} not found`)
  }

  // Шаг 2: Где импортируется
  const imports = await findImports({ symbol: componentName })

  // Шаг 3: Обратные ссылки
  const callers = await callersAnalysis({
    symbolName: componentName,
    limit: 20
  })

  // Шаг 4: Сложность
  const complexity = await analyzeComplexity({
    pattern: `**/*${componentName}*`,
    limit: 1
  })

  // Формируем краткий summary
  const comp = inventory.components[0]
  const complexityScore = complexity.files[0]?.complexity || 0

  let recommendation = ''
  if (complexityScore > 20) {
    recommendation = 'Consider splitting into smaller components'
  } else if (callers.totalRefs === 0) {
    recommendation = 'Unused component - consider removing'
  } else if (!comp.hasTests) {
    recommendation = 'Add unit tests for better coverage'
  } else {
    recommendation = 'Component is in good shape'
  }

  return {
    summary: {
      name: componentName,
      usageCount: callers.totalRefs,
      complexity: complexityScore,
      testCoverage: comp.hasTests,
      recommendation
    },
    details: {
      info: comp,
      imports: imports.matches.slice(0, 10),
      callers: callers.refs.slice(0, 10),
      complexity: complexity.files[0]
    }
  }
}
```

**Добавить команду:**
```javascript
// mcp-wrapper.js
'component-deep-dive': (componentName) => {
  if (!componentName) {
    console.error('❌ Usage: mcp:component-deep-dive <ComponentName>')
    process.exit(1)
  }

  const code = `
    import { componentDeepDive } from './tools/skills/componentDeepDive.js';
    const result = await componentDeepDive({ componentName: '${componentName}' });

    console.log('\\n🔍 Component Deep Dive\\n');
    console.log('Summary:');
    console.log('  Name:', result.summary.name);
    console.log('  Usage Count:', result.summary.usageCount);
    console.log('  Complexity:', result.summary.complexity);
    console.log('  Test Coverage:', result.summary.testCoverage ? '✅' : '❌');
    console.log('  Recommendation:', result.summary.recommendation);

    console.log('\\n💰 Token savings: 200,000 → 6,000 (97%)');
  `;
  executeMcpTool(code);
}
```

---

## 📋 Чеклист реализации

### Спринт 1: Критичные задачи (P0) ✓
- [ ] 1.1 Создать `callersAnalysis.ts` (2ч)
- [ ] 1.2 Создать `i18nAnalysis.ts` (2ч)
- [ ] 1.3 Добавить PII маскирование (1ч)
- [ ] 1.4 Добавить limit/offset во все 14 инструментов (3ч)

**Итого:** 8 часов

### Спринт 2: Прогрессивная детализация (P1)
- [ ] 2.1 Создать систему уровней (list/describe/schema) (3ч)
- [ ] 2.2 Заполнить метаданные для всех 27 инструментов (1ч)

**Итого:** 4 часа

### Спринт 3: Оптимизации (P2)
- [ ] 3.1 Реализовать кэширование (2ч)
- [ ] 3.2 Создать 3 композитных навыка (2ч)
  - [ ] `componentDeepDive`
  - [ ] `securityFullAudit`
  - [ ] `performanceCheckup`

**Итого:** 4 часа

---

## 🚀 Итоговая экономия токенов

| Улучшение | Было | Станет | Экономия |
|-----------|------|--------|----------|
| Прогрессивная детализация | 15,000 | 2,000 | 87% |
| Limit/offset в результатах | 12,000 | 4,000 | 67% |
| Кэширование повторных запросов | 8,000 | 500 | 94% |
| Композитные навыки | 200,000 | 6,000 | 97% |

**Общая экономия:** ~85% от текущего расхода токенов

---

## 📝 Примечания

1. **Безопасность:** PII маскирование обязательно перед production
2. **Кэширование:** Только для read-only операций, не для записи
3. **Композитные навыки:** Разрабатывать по мере необходимости
4. **Тестирование:** Каждый новый инструмент протестировать на реальном проекте

---

## 🔗 Связанные документы

- [MCP_TOOLS_ROADMAP.md](~/.claude/docs/MCP_TOOLS_ROADMAP.md) - исходный roadmap
- [MCP_TOOLS_GUIDE.md](~/.claude/docs/MCP_TOOLS_GUIDE.md) - руководство пользователя
- [TOKEN_OPTIMIZATION_RULES.md](../TOKEN_OPTIMIZATION_RULES.md) - правила оптимизации

---

**Следующий шаг:** Начать со Спринта 1, Задача 1.1 - `callersAnalysis.ts`

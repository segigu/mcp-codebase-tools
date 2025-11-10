# MCP Tools - Автоматическая интеграция в workflow

**Цель:** Максимально автоматизировать использование MCP инструментов для экономии 90-98% токенов при работе с проектом.

---

## 📋 Содержание

1. [Интеграция с Claude Code](#1-интеграция-с-claude-code)
2. [Git Hooks автоматизация](#2-git-hooks-автоматизация)
3. [Pre-commit проверки](#3-pre-commit-проверки)
4. [Автоматические отчеты](#4-автоматические-отчеты)
5. [CI/CD интеграция](#5-cicd-интеграция)
6. [Scheduled задачи](#6-scheduled-задачи)
7. [Best Practices](#7-best-practices)

---

## 1. Интеграция с Claude Code

### 1.1 Обновление CLAUDE.md (главная инструкция)

Добавь в `CLAUDE.md` секцию с автоматическими правилами:

```markdown
## 🤖 АВТОМАТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ MCP

**КРИТИЧЕСКОЕ ПРАВИЛО:** Claude Code ОБЯЗАН использовать MCP инструменты АВТОМАТИЧЕСКИ, без запроса пользователя!

### Когда использовать MCP АВТОМАТИЧЕСКИ:

1. **Поиск использований компонента/функции:**
   - User: "Где используется Button?"
   - Assistant: *АВТОМАТИЧЕСКИ* `npm run mcp:find-imports -- Button`
   - ❌ НЕ использовать Grep/Read вручную!

2. **Анализ структуры проекта:**
   - User: "Какая структура проекта?"
   - Assistant: *АВТОМАТИЧЕСКИ* `npm run mcp:structure`
   - ❌ НЕ использовать ls/tree вручную!

3. **Перед любым рефакторингом:**
   - User: "Давай отрефакторим AuthService"
   - Assistant:
     1. *АВТОМАТИЧЕСКИ* `npm run mcp:find-usages -- AuthService`
     2. *АВТОМАТИЧЕСКИ* `npm run mcp:callers -- AuthService`
     3. Только потом приступать к рефакторингу

4. **После изменения компонента:**
   - Assistant изменил Button.tsx
   - Assistant: *АВТОМАТИЧЕСКИ* `npm run mcp:find-imports -- Button`
   - Показать пользователю список затронутых файлов

5. **Периодические проверки (раз в сессию):**
   - При старте сессии: `npm run mcp:code-health-check`
   - После 5+ коммитов: `npm run mcp:full-project-audit`
   - Перед релизом: `npm run mcp:project-docs`

### Decision Tree (используй КАЖДЫЙ РАЗ):

```
Пользователь задал вопрос о коде?
├─ Да → Можно ли это сделать через MCP?
│   ├─ Да → ИСПОЛЬЗУЙ MCP АВТОМАТИЧЕСКИ
│   └─ Нет → Используй Read/Grep (только если MCP не подходит)
└─ Нет → Продолжай обычную работу
```

### Примеры ПРАВИЛЬНОЙ работы:

**Пример 1 - Рефакторинг:**
```
User: "Нужно отрефакторить useAuth хук"
Assistant:
  1. *Запускаю MCP для анализа использований*
     npm run mcp:find-usages -- useAuth
  2. *Найдено 23 использования в 12 файлах*
  3. *Запускаю анализ зависимостей*
     npm run mcp:callers -- useAuth
  4. *Начинаю рефакторинг с учетом всех использований*

  Экономия: 15,000 → 800 токенов (95%)
```

**Пример 2 - Новая фича:**
```
User: "Добавь валидацию в форму регистрации"
Assistant:
  1. *Анализирую текущую структуру форм*
     npm run mcp:component-inventory
  2. *Проверяю существующие паттерны валидации*
     npm run mcp:find-usages -- useFormValidation
  3. *Добавляю валидацию, следуя существующим паттернам*

  Экономия: 20,000 → 1,200 токенов (94%)
```

**Пример 3 - Код ревью:**
```
User: "Проверь качество кода перед коммитом"
Assistant:
  1. *АВТОМАТИЧЕСКИ запускаю комплексную проверку*
     npm run mcp:code-health-check
  2. *Показываю результаты: Grade B, 3 high-priority issues*
  3. *Исправляю найденные проблемы*
  4. *Повторная проверка: Grade A*

  Экономия: 80,000 → 4,000 токенов (95%)
```
```

### 1.2 Создание MCP-first workflow

Создай файл `.claude/mcp-workflow.md`:

```markdown
# MCP-First Workflow Rules

## Правило #1: Всегда начинай с MCP

ПЕРЕД использованием Read/Grep/Glob - спроси себя:
> "Есть ли MCP команда для этого?"

Если ДА - ИСПОЛЬЗУЙ MCP!

## Правило #2: Кэширование = скорость

- Первый запуск: ~2-3 секунды
- Повторный запуск: ~100-200ms (из кэша!)
- Не бойся переиспользовать команды

## Правило #3: Композитные навыки для сложных задач

Вместо:
- Запускать 5 отдельных проверок вручную
- Читать 50 файлов
- Анализировать результаты

Используй:
- `npm run mcp:full-project-audit` (1 команда = 3 аудита)
- `npm run mcp:code-health-check` (1 команда = 4 анализа)
- `npm run mcp:project-docs` (1 команда = полная документация)

## Правило #4: Audit log = история проекта

- Каждый запуск логируется в `docs/audits/AUDIT_LOG.json`
- Видны тренды (улучшения/регрессии)
- Используй для tracking прогресса
```

---

## 2. Git Hooks автоматизация

### 2.1 Pre-commit hook с MCP проверками

Создай `.husky/pre-commit-mcp`:

```bash
#!/usr/bin/env bash
# .husky/pre-commit-mcp

echo "🔍 Running MCP pre-commit checks..."

# 1. Quick security scan (5 seconds)
echo "🔒 Security scan..."
npm run mcp:security-audit --silent > /tmp/mcp-security.log 2>&1
if grep -q "critical" /tmp/mcp-security.log; then
  echo "❌ Critical security issues found!"
  echo "Run: npm run mcp:security-audit"
  exit 1
fi

# 2. Check for unused exports (3 seconds)
echo "🗑️  Checking for dead code..."
npm run mcp:unused --silent > /tmp/mcp-unused.log 2>&1
UNUSED_COUNT=$(grep -o "totalUnused: [0-9]*" /tmp/mcp-unused.log | awk '{print $2}')
if [ "$UNUSED_COUNT" -gt 50 ]; then
  echo "⚠️  Warning: $UNUSED_COUNT unused exports detected"
  echo "Consider running: npm run mcp:unused"
fi

# 3. Complexity check (2 seconds)
echo "📊 Complexity check..."
npm run mcp:complexity --silent > /tmp/mcp-complexity.log 2>&1

echo "✅ MCP pre-commit checks passed!"
```

Добавь в `package.json`:

```json
{
  "scripts": {
    "pre-commit": ".husky/pre-commit-mcp"
  }
}
```

### 2.2 Pre-push hook с полным аудитом

Создай `.husky/pre-push-mcp`:

```bash
#!/usr/bin/env bash
# .husky/pre-push-mcp

echo "🏥 Running full project audit before push..."

# Run full project audit
npm run mcp:full-project-audit --silent > /tmp/mcp-audit.log 2>&1

# Extract grade
GRADE=$(grep "grade:" /tmp/mcp-audit.log | awk '{print $2}')

if [ "$GRADE" = "F" ] || [ "$GRADE" = "D" ]; then
  echo "❌ Project health is too low: Grade $GRADE"
  echo "Fix critical issues before pushing!"
  echo "Run: npm run mcp:full-project-audit"
  exit 1
fi

echo "✅ Project health: Grade $GRADE - Push allowed!"
```

---

## 3. Pre-commit проверки

### 3.1 Lint-staged интеграция

Добавь в `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm run mcp:check-changed-files"
    ]
  }
}
```

Создай скрипт `scripts/mcp-check-changed.js`:

```javascript
#!/usr/bin/env node
/**
 * Check changed files with MCP tools
 */
import { execSync } from 'child_process';

const changedFiles = process.argv.slice(2);

console.log('🔍 MCP checking changed files:', changedFiles.length);

for (const file of changedFiles) {
  // Extract component/function names from file
  const content = fs.readFileSync(file, 'utf-8');
  const exports = content.match(/export\s+(const|function|class)\s+(\w+)/g) || [];

  for (const exp of exports) {
    const name = exp.split(/\s+/).pop();

    // Check usages
    console.log(`  Checking usages of: ${name}`);
    execSync(`npm run mcp:find-usages -- ${name}`, { stdio: 'inherit' });
  }
}

console.log('✅ MCP checks completed');
```

---

## 4. Автоматические отчеты

### 4.1 Daily report (cron job)

Создай `scripts/daily-mcp-report.sh`:

```bash
#!/bin/bash
# Run daily MCP report

DATE=$(date +%Y-%m-%d)
REPORT_DIR="docs/reports"
mkdir -p "$REPORT_DIR"

echo "📊 Generating daily MCP report for $DATE..."

# 1. Full project audit
npm run mcp:full-project-audit > "$REPORT_DIR/audit-$DATE.log" 2>&1

# 2. Code health check
npm run mcp:code-health-check > "$REPORT_DIR/health-$DATE.log" 2>&1

# 3. Generate documentation
npm run mcp:project-docs > "$REPORT_DIR/docs-$DATE.log" 2>&1

# 4. Summary
cat > "$REPORT_DIR/summary-$DATE.md" <<EOF
# MCP Daily Report - $DATE

## Project Health
$(grep "Health Score:" "$REPORT_DIR/audit-$DATE.log")

## Code Quality
$(grep "Health Metrics:" "$REPORT_DIR/health-$DATE.log")

## Actions Required
$(grep "High Priority:" "$REPORT_DIR/health-$DATE.log")

---
*Generated automatically by MCP Tools*
EOF

echo "✅ Report saved to: $REPORT_DIR/summary-$DATE.md"
```

Добавь в crontab:

```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/Metacell && ./scripts/daily-mcp-report.sh
```

### 4.2 Weekly trend analysis

Создай `scripts/weekly-mcp-trends.js`:

```javascript
#!/usr/bin/env node
/**
 * Analyze weekly trends from audit log
 */
import fs from 'fs';
import path from 'path';

const AUDIT_LOG = 'docs/audits/AUDIT_LOG.json';
const log = JSON.parse(fs.readFileSync(AUDIT_LOG, 'utf-8'));

// Get last 7 days
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const weeklyAudits = log.audits.filter(
  audit => new Date(audit.timestamp) > weekAgo
);

// Group by tool
const byTool = {};
for (const audit of weeklyAudits) {
  if (!byTool[audit.tool]) byTool[audit.tool] = [];
  byTool[audit.tool].push(audit);
}

// Calculate trends
console.log('\n📈 Weekly MCP Trends\n');
console.log('═'.repeat(70));

for (const [tool, audits] of Object.entries(byTool)) {
  const scores = audits.map(a => a.results.score).filter(Boolean);
  if (scores.length < 2) continue;

  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const emoji = delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️';

  console.log(`${emoji} ${tool}: ${first} → ${last} (${delta > 0 ? '+' : ''}${delta})`);
}

console.log('═'.repeat(70));
```

---

## 5. CI/CD интеграция

### 5.1 GitHub Actions workflow

Создай `.github/workflows/mcp-checks.yml`:

```yaml
name: MCP Quality Checks

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  mcp-audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run MCP Full Project Audit
        run: |
          npm run mcp:full-project-audit > mcp-audit.log 2>&1
          cat mcp-audit.log
        continue-on-error: true

      - name: Extract audit results
        id: audit
        run: |
          GRADE=$(grep -o "grade: [A-F]" mcp-audit.log | awk '{print $2}')
          echo "grade=$GRADE" >> $GITHUB_OUTPUT

          CRITICAL=$(grep -o "criticalIssues: [0-9]*" mcp-audit.log | awk '{print $2}')
          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT

      - name: Fail if grade is F or D
        if: steps.audit.outputs.grade == 'F' || steps.audit.outputs.grade == 'D'
        run: |
          echo "❌ Project health grade is too low: ${{ steps.audit.outputs.grade }}"
          exit 1

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const grade = '${{ steps.audit.outputs.grade }}';
            const critical = '${{ steps.audit.outputs.critical }}';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🏥 MCP Project Health Report

**Grade:** ${grade}
**Critical Issues:** ${critical}

${grade === 'A' ? '✅ Excellent!' : grade === 'B' ? '👍 Good!' : '⚠️ Needs improvement'}

<details>
<summary>View full report</summary>

\`\`\`
$(cat mcp-audit.log)
\`\`\`
</details>`
            });

  mcp-code-health:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run MCP Code Health Check
        run: npm run mcp:code-health-check
```

### 5.2 GitLab CI configuration

Создай `.gitlab-ci.yml`:

```yaml
stages:
  - quality

mcp-audit:
  stage: quality
  image: node:18
  cache:
    paths:
      - node_modules/
      - docs/cache/
  script:
    - npm ci
    - npm run mcp:full-project-audit
    - npm run mcp:code-health-check
  artifacts:
    reports:
      junit: mcp-report.xml
    paths:
      - docs/audits/
      - docs/reports/
  only:
    - merge_requests
    - main
```

---

## 6. Scheduled задачи

### 6.1 Автоматическая документация

Создай `scripts/auto-docs.sh`:

```bash
#!/bin/bash
# Auto-generate documentation daily

# Generate docs
npm run mcp:project-docs

# Commit if changed
if git diff --quiet docs/GENERATED_DOCUMENTATION.md; then
  echo "No changes in documentation"
else
  git add docs/GENERATED_DOCUMENTATION.md
  git commit -m "docs: auto-update project documentation [skip ci]"
  git push
fi
```

### 6.2 Periodic health checks

Создай `scripts/health-monitor.js`:

```javascript
#!/usr/bin/env node
/**
 * Continuous health monitoring
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkHealth() {
  try {
    const { stdout } = await execAsync('npm run mcp:code-health-check');

    // Extract grade
    const gradeMatch = stdout.match(/grade: ([A-F])/);
    const grade = gradeMatch ? gradeMatch[1] : 'Unknown';

    console.log(`[${new Date().toISOString()}] Health: ${grade}`);

    // Alert if grade drops below B
    if (grade === 'C' || grade === 'D' || grade === 'F') {
      console.log('⚠️  ALERT: Code health degraded!');
      // Send notification (Slack, email, etc.)
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Run every hour
setInterval(checkHealth, 60 * 60 * 1000);
checkHealth(); // Run immediately
```

---

## 7. Best Practices

### 7.1 Приоритеты использования

**Высокий приоритет (используй ВСЕГДА):**
1. `mcp:find-imports` - перед любым изменением компонента
2. `mcp:find-usages` - перед рефакторингом
3. `mcp:callers` - для анализа зависимостей

**Средний приоритет (используй регулярно):**
4. `mcp:code-health-check` - раз в день
5. `mcp:full-project-audit` - перед релизом
6. `mcp:unused` - раз в неделю

**Низкий приоритет (используй по запросу):**
7. `mcp:project-docs` - при обновлении документации
8. `mcp:component-inventory` - при рефакторинге структуры

### 7.2 Оптимизация производительности

**Кэширование:**
- Первый запуск: ~2-3 секунды
- Из кэша: ~100-200ms
- TTL: 5min (git) / 30min (audit) / 2hrs (i18n)

**Параллельное выполнение:**
```bash
# Запускай несколько проверок параллельно
npm run mcp:security-audit &
npm run mcp:a11y-audit &
npm run mcp:tech-debt &
wait
```

**Использование limit/offset:**
```bash
# Для быстрого preview
npm run mcp:complexity -- --limit 10

# Для полного анализа
npm run mcp:complexity -- --limit 1000
```

### 7.3 Monitoring и алерты

**Slack интеграция:**

Создай `scripts/notify-slack.sh`:

```bash
#!/bin/bash
# Send MCP alerts to Slack

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
MESSAGE="$1"

curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"🤖 MCP Alert: $MESSAGE\"}"
```

Используй в скриптах:

```bash
# In health-monitor.js
if (grade === 'F') {
  exec('./scripts/notify-slack.sh "Code health: Grade F! 🚨"');
}
```

---

## 8. Quick Start Checklist

### Setup (один раз):

- [ ] Скопировать секцию "АВТОМАТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ MCP" в `CLAUDE.md`
- [ ] Создать `.husky/pre-commit-mcp`
- [ ] Создать `.husky/pre-push-mcp`
- [ ] Добавить `lint-staged` в `package.json`
- [ ] Настроить GitHub Actions / GitLab CI
- [ ] Добавить cron jobs для отчетов

### Daily workflow:

- [ ] Начало дня: `npm run mcp:code-health-check`
- [ ] Перед рефакторингом: `npm run mcp:find-usages -- <name>`
- [ ] После изменений: `npm run mcp:find-imports -- <component>`
- [ ] Перед коммитом: автоматически через git hooks
- [ ] Конец недели: `npm run mcp:full-project-audit`

### При работе с Claude Code:

1. **Claude АВТОМАТИЧЕСКИ использует MCP** (настроено в CLAUDE.md)
2. Пользователь НЕ должен просить "используй MCP"
3. Claude сам решает когда запускать MCP команды
4. Экономия токенов: 90-98% автоматически

---

## 9. Troubleshooting

### Проблема: MCP команды медленные

**Решение:**
```bash
# Проверь кэш
npm run mcp:cache-status

# Очисти если слишком большой
npm run mcp:cache-clear

# Проверь размер проекта
du -sh mcp-server/
```

### Проблема: Git hooks блокируют коммиты

**Решение:**
```bash
# Временно отключить
git commit --no-verify

# Или настроить более мягкие проверки в .husky/pre-commit-mcp
```

### Проблема: CI/CD падает на MCP проверках

**Решение:**
```yaml
# Сделать non-blocking
continue-on-error: true

# Или снизить строгость
if: steps.audit.outputs.grade == 'F'  # Only fail on F
```

---

## 10. Метрики успеха

**Отслеживай:**
- Token usage: цель < 5% от обычного
- Время выполнения: цель < 5 секунд для большинства команд
- Cache hit rate: цель > 70%
- Code health grade: цель >= B
- Audit frequency: цель >= 1 раз в день

**Dashboard в terminal:**

```bash
# Quick stats
echo "📊 MCP Stats:"
echo "Cache hit rate: $(npm run mcp:cache-status | grep 'Hit Rate')"
echo "Last audit: $(npm run mcp:audit-summary | grep 'Last Audit')"
echo "Health: $(npm run mcp:code-health-check | grep 'grade:')"
```

---

## 🎯 Итог

После настройки:
- ✅ Claude Code использует MCP автоматически
- ✅ Git hooks блокируют плохой код
- ✅ CI/CD проверяет качество
- ✅ Ежедневные отчеты генерируются автоматически
- ✅ Экономия токенов: 90-98%

**Главное правило:** Используй MCP ПЕРВЫМ, Read/Grep - только если MCP не подходит!

---

*Последнее обновление: 2025-01-09*

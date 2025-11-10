# 🎯 Task: Audit Log Analysis Tools

## 📋 Overview

Добавить инструменты для работы с AUDIT_LOG.json:
- Анализ трендов
- Генерация задач из критичных проблем
- Визуальный дашборд
- Сравнение аудитов
- Автоматические рекомендации

## 🎯 Goal

Сделать Audit Log **полезным** - автоматически анализировать историю, выявлять проблемы и генерировать задачи.

---

## 📊 Context

### Текущая структура AUDIT_LOG.json

```json
{
  "schema_version": "1.0.0",
  "project": "Metacell",
  "audits": [
    {
      "id": "securityAudit-1762747143244",
      "timestamp": "2025-11-10T03:59:03.238Z",
      "command": "mcp:security-audit",
      "tool": "securityAudit",
      "results": {
        "summary": {
          "score": "B (80/100)",
          "totalVulnerabilities": 1,
          "critical": 1,
          "high": 0,
          "medium": 0,
          "low": 0
        },
        "issues": [
          {
            "severity": "critical",
            "type": "XSS",
            "file": "src/components/ui/chart.tsx",
            "line": 83,
            "code": "dangerouslySetInnerHTML={{",
            "risk": "User input rendered without sanitization",
            "fix": "Use DOMPurify.sanitize() or avoid dangerouslySetInnerHTML"
          }
        ],
        "score": "B (80/100)"
      },
      "duration_ms": 56
    }
  ]
}
```

### Где используется

- `docs/audits/AUDIT_LOG.json` - файл логов в каждом проекте
- Создаётся автоматически через `audit-logger.ts`
- Каждый audit tool пишет туда результаты

---

## 🚀 Задачи

### Task 1: Добавить CLI команду `mcp audit analyze`

**Что делает:**
- Читает `docs/audits/AUDIT_LOG.json`
- Анализирует тренды (улучшается/ухудшается качество)
- Показывает критичные проблемы
- Генерирует рекомендации

**Пример вывода:**

```bash
$ mcp audit analyze

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Анализ Audit Log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Сводная статистика
Всего аудитов: 15
Среднее время: 45ms

По инструментам:
  🔒 Безопасность: 5 аудитов, средняя оценка 82.0
  ♿ Доступность: 5 аудитов, средняя оценка 68.0
  💰 Технический долг: 3 аудитов, средняя оценка 75.0
  🧮 Сложность: 2 аудитов, средняя оценка 88.0

📈 Тренды качества кода

🔒 Безопасность
  Последний: 82.0 📈 +2.0
  Проблем: 1 ✅ -1
  Дата: 10.01.2025

♿ Доступность
  Последний: 68.0 📉 -2.0
  Проблем: 14 ⚠️ +3
  Дата: 10.01.2025

🚨 Критичные проблемы (3)

📁 src/components/ui/chart.tsx
  CRITICAL: XSS
    Строка: 83
    Риск: User input rendered without sanitization
    Решение: Use DOMPurify.sanitize()

📁 src/components/LoginForm.tsx
  HIGH: missing-label
    Строка: 45
    Риск: Input without label
    Решение: Add aria-label or <label> element

💡 Рекомендации (5)

🔴 Высокий приоритет
  Безопасность
    Действие: Исправить 1 критичных проблем
    Эффект: Критично для production

  Доступность
    Действие: Исправить 2 критичных проблем
    Эффект: Критично для production

🟡 Средний приоритет
  a11yAudit
    Действие: Улучшить оценку (текущая: 68.0)
    Эффект: Качество кода

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Следующие шаги:

1. Исправить 3 критичных проблем
   mcp audit create-tasks

2. Запустить полный аудит:
   mcp audit --all

3. Посмотреть тренды в деталях:
   mcp audit trends
```

---

### Task 2: Добавить CLI команду `mcp audit create-tasks`

**Что делает:**
- Читает критичные проблемы из AUDIT_LOG.json
- Создаёт задачи в `docs/tasks/BACKLOG.json`
- Автоматически устанавливает приоритет (critical → high, high → medium)
- Добавляет теги (#security, #a11y, #tech-debt)

**Пример:**

```bash
$ mcp audit create-tasks

📋 Генерация задач из критичных проблем...

✅ Создано 3 задачи:

  TASK-042 [HIGH] Fix XSS vulnerability in chart.tsx
    Файл: src/components/ui/chart.tsx:83
    Тег: #security

  TASK-043 [MEDIUM] Add aria-label to LoginForm input
    Файл: src/components/LoginForm.tsx:45
    Тег: #a11y

  TASK-044 [MEDIUM] Fix missing alt text in Avatar
    Файл: src/components/Avatar.tsx:23
    Тег: #a11y

💾 Сохранено в docs/tasks/BACKLOG.json

🚀 Следующий шаг:
  npm run mcp:task-next
```

**Интеграция с существующей системой задач:**
- Использует `docs/tasks/BACKLOG.json` (уже есть в Metacell)
- Совместимо с `/next`, `/done`, `/tasks`
- Автоматически определяет следующий ID (TASK-042, TASK-043...)

---

### Task 3: Добавить CLI команду `mcp audit trends`

**Что делает:**
- Показывает детальные графики трендов
- ASCII charts для терминала
- Сравнение между датами
- Экспорт в Markdown

**Пример:**

```bash
$ mcp audit trends

📈 Тренды: Безопасность (последние 10 аудитов)

Score:
100 ┤
 90 ┤              ╭────╮
 80 ┼──────────────╯    ╰──────────╮
 70 ┤                              ╰───
 60 ┤
    └──────────────────────────────────
    Jan 5  Jan 7  Jan 9  Jan 10

Vulnerabilities:
 5 ┤ ●
 4 ┤   ●
 3 ┤     ●   ●
 2 ┤           ●
 1 ┤             ●   ●   ●   ●
 0 ┤                           ●   ●
   └──────────────────────────────────

Тренд: ↗️ Улучшается (+2.5 points/week)
```

---

### Task 4: Добавить CLI команду `mcp audit compare`

**Что делает:**
- Сравнивает два аудита (до/после изменений)
- Показывает что улучшилось, что ухудшилось
- Diff по проблемам

**Пример:**

```bash
$ mcp audit compare --before=2025-01-09 --after=2025-01-10

🔍 Сравнение аудитов

🔒 Безопасность
  Score: 80 → 82 (+2) ✅
  Vulnerabilities: 2 → 1 (-1) ✅

  Исправлено:
    ✅ src/auth/login.ts:45 - SQL Injection

  Новые проблемы:
    Нет

♿ Доступность
  Score: 70 → 68 (-2) ⚠️
  Issues: 11 → 14 (+3) ⚠️

  Исправлено:
    ✅ src/components/Button.tsx:12 - missing aria-label

  Новые проблемы:
    ❌ src/pages/Dashboard.tsx:34 - img without alt
    ❌ src/pages/Settings.tsx:67 - input without label
    ❌ src/components/Modal.tsx:89 - missing role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Итого:
  ✅ Улучшения: 2
  ⚠️  Ухудшения: 3
  → Нейтрально: 1
```

---

### Task 5: Добавить CLI команду `mcp audit dashboard`

**Что делает:**
- Генерирует HTML дашборд
- Интерактивные графики (Chart.js)
- История всех аудитов
- Экспорт в PDF

**Пример:**

```bash
$ mcp audit dashboard

📊 Генерация дашборда...

✅ Создан HTML дашборд:
   docs/audits/dashboard.html

🌐 Открыть в браузере:
   open docs/audits/dashboard.html

📊 Содержит:
  - Графики трендов для всех метрик
  - Список всех критичных проблем
  - История изменений оценок
  - Сравнение между инструментами
  - Рекомендации по улучшению
```

---

## 🔧 Implementation Plan

### Step 1: Расширить `src/cli/commands/audit.ts`

```typescript
// Добавить новые команды
export interface AuditOptions {
  history?: string;
  summary?: boolean;
  analyze?: boolean;       // NEW
  createTasks?: boolean;   // NEW
  trends?: boolean;        // NEW
  compare?: string;        // NEW
  dashboard?: boolean;     // NEW
}

export async function auditCommand(options: AuditOptions): Promise<void> {
  // ...
  if (options.analyze) {
    await handleAuditAnalyze(auditLogger);
  } else if (options.createTasks) {
    await handleAuditCreateTasks(auditLogger);
  } else if (options.trends) {
    await handleAuditTrends(auditLogger);
  } else if (options.compare) {
    await handleAuditCompare(auditLogger, options.compare);
  } else if (options.dashboard) {
    await handleAuditDashboard(auditLogger);
  }
  // ...
}
```

### Step 2: Создать `src/cli/audit-analyzer.ts`

```typescript
export class AuditAnalyzer {
  constructor(private auditLog: AuditLog) {}

  analyzeTrends(): TrendAnalysis {
    // Анализ трендов
  }

  findCriticalIssues(): Issue[] {
    // Поиск критичных проблем
  }

  generateRecommendations(): Recommendation[] {
    // Генерация рекомендаций
  }

  compareAudits(before: Date, after: Date): Comparison {
    // Сравнение аудитов
  }
}
```

### Step 3: Создать `src/cli/task-generator.ts`

```typescript
export class TaskGenerator {
  constructor(
    private auditLog: AuditLog,
    private backlogPath: string
  ) {}

  async createTasksFromIssues(issues: Issue[]): Promise<Task[]> {
    // Читаем BACKLOG.json
    // Генерируем задачи из issues
    // Определяем следующий ID
    // Сохраняем обратно
  }
}
```

### Step 4: Создать `src/cli/dashboard-generator.ts`

```typescript
export class DashboardGenerator {
  constructor(private auditLog: AuditLog) {}

  async generateHTML(outputPath: string): Promise<void> {
    // Генерируем HTML с Chart.js
    // Встраиваем данные
    // Сохраняем в файл
  }
}
```

### Step 5: Обновить CLI регистрацию

```typescript
// src/cli/index.ts
this.program
  .command('audit')
  .description('Audit log analysis and management')
  .option('--analyze', 'Analyze audit log and show trends')
  .option('--create-tasks', 'Create tasks from critical issues')
  .option('--trends', 'Show detailed trends with charts')
  .option('--compare <dates>', 'Compare two audits (e.g., 2025-01-09,2025-01-10)')
  .option('--dashboard', 'Generate HTML dashboard')
  .option('--history <tool>', 'Show audit history for tool')
  .option('--summary', 'Show audit summary')
  .action(auditCommand);
```

---

## 📚 Integration with Existing Code

### С audit-logger.ts

```typescript
// src/utils/audit-logger.ts уже создаёт AUDIT_LOG.json
// Нужно только добавить методы чтения:

export class AuditLogger {
  // ... existing methods ...

  async getAuditsBetween(start: Date, end: Date): Promise<AuditEntry[]> {
    // NEW
  }

  async getCriticalIssues(): Promise<Issue[]> {
    // NEW
  }

  async getTrends(): Promise<TrendData> {
    // NEW
  }
}
```

### С task system

```typescript
// Использует существующий формат BACKLOG.json из Metacell
// Совместимо с:
// - /add-task
// - /next
// - /done
// - /tasks
```

---

## 🎯 Success Criteria

**Для v1.2:**
- [ ] `mcp audit analyze` работает
- [ ] `mcp audit create-tasks` создаёт задачи в BACKLOG.json
- [ ] `mcp audit trends` показывает ASCII графики
- [ ] Документация обновлена

**Для v1.3:**
- [ ] `mcp audit compare` работает
- [ ] `mcp audit dashboard` генерирует HTML
- [ ] Примеры использования в docs/

**Для v2.0:**
- [ ] Web UI для дашборда
- [ ] Интеграция с CI/CD
- [ ] Автоматические PR комментарии

---

## 📖 Usage Examples

### Daily workflow

```bash
# Утром - посмотреть что исправить
mcp audit analyze

# Создать задачи
mcp audit create-tasks

# Взять задачу
mcp mcp:task-next

# ... работаешь ...

# Вечером - сравнить до/после
mcp audit compare --before=morning --after=now

# Раз в неделю - полный дашборд
mcp audit dashboard
```

### CI/CD integration

```yaml
# .github/workflows/audit.yml
- name: Run audits
  run: |
    mcp audit --all
    mcp audit analyze
    mcp audit create-tasks

- name: Comment PR
  run: |
    mcp audit compare --before=$BASE --after=$HEAD > comment.md
    gh pr comment --body-file comment.md
```

---

## 🚀 Getting Started

**В новом окне VS Code с mcp-codebase-tools:**

1. Прочитай этот файл
2. Начни с Task 1 (`mcp audit analyze`)
3. Создай `src/cli/audit-analyzer.ts`
4. Добавь команду в `src/cli/commands/audit.ts`
5. Тестируй на реальном AUDIT_LOG.json из Metacell
6. Коммить и пушить

**Estimated time:** 4-6 hours total

---

## 💡 Notes

- Используй существующий `AuditLogger` из `src/utils/audit-logger.ts`
- Формат задач должен совпадать с `docs/tasks/BACKLOG.json` в Metacell
- ASCII графики: используй библиотеку `asciichart`
- HTML дашборд: Chart.js для графиков
- Все новые зависимости добавляй в `package.json`

**Ready to implement! 🎯**

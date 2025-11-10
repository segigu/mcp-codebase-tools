# MCP Tools - Troubleshooting Guide

**Решение проблем и ошибок при работе с MCP**

---

## 🚨 Критические ошибки

### 1. ES Module Error: `__dirname is not defined`

**Ошибка:**
```
ReferenceError: __dirname is not defined in ES module scope
    at audit-logger.ts:56
```

**Причина:** MCP server использует ES modules (`"type": "module"`), но код использует CommonJS переменные.

**Решение:**
```typescript
// ❌ НЕПРАВИЛЬНО (CommonJS)
const logPath = path.join(__dirname, '../../../docs/audits/AUDIT_LOG.json');

// ✅ ПРАВИЛЬНО (ES module)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, '../../../docs/audits/AUDIT_LOG.json');
```

**Файлы для проверки:**
- `mcp-server/lib/*.ts`
- `mcp-server/tools/**/*.ts`

---

### 2. TypeError: Cannot read properties of undefined

**Ошибка:**
```
TypeError: Cannot read properties of undefined (reading 'todos')
    at fullProjectAudit.ts:130
```

**Причина:** Неправильный доступ к структуре данных результатов аудита.

**Решение:**
Проверь структуру возвращаемых данных из audit tools:

```typescript
// ❌ НЕПРАВИЛЬНО
const todos = techDebtResult.details.todos.high;

// ✅ ПРАВИЛЬНО (проверь реальную структуру)
const todos = techDebtResult.todos.byPriority['FIXME'] || 0;
```

**Debug workflow:**
```bash
# 1. Запусти инструмент отдельно
npm run mcp:tech-debt

# 2. Проверь вывод (JSON структуру)
cat docs/audits/AUDIT_LOG.json | jq '.tools.techDebt.results[-1]'

# 3. Обнови код согласно реальной структуре
```

---

### 3. MODULE_TYPELESS_PACKAGE_JSON Warning

**Ошибка:**
```
(node:12345) Warning: To load an ES module, set "type": "module" in package.json
```

**Причина:** package.json не указывает тип модулей.

**Решение:**
```json
{
  "name": "your-project",
  "version": "1.0.0",
  "type": "module",  // ← Добавь эту строку
  ...
}
```

**⚠️ Побочные эффекты:**
После добавления `"type": "module"` конфиги тоже должны стать ES модулями:

```javascript
// ❌ commitlint.config.js (до)
module.exports = { ... };

// ✅ commitlint.config.js (после)
export default { ... };
```

---

## ⏱️ Производительность

### 4. Команда зависла / не отвечает

**Симптомы:**
- Команда выполняется > 30 секунд
- Нет вывода в консоль
- Процесс завис

**Решение:**

**Шаг 1: Проверь процессы**
```bash
ps aux | grep mcp-wrapper
# Найди зависший процесс (PID)
```

**Шаг 2: Убей процесс**
```bash
kill <PID>
# Или принудительно:
kill -9 <PID>
```

**Шаг 3: Очисти кэш**
```bash
# Очистить весь кэш
npm run mcp:cache-clear

# Или конкретный инструмент
npm run mcp:cache-clear -- securityAudit
```

**Шаг 4: Попробуй снова**
```bash
npm run mcp:<command>
```

**Если не помогло:**
```bash
# Удали кэш файл полностью
rm docs/cache/MCP_CACHE.json

# Пересоздай
mkdir -p docs/cache
echo '{}' > docs/cache/MCP_CACHE.json
```

---

### 5. Out of Memory (OOM)

**Ошибка:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Причина:** MCP инструмент пытается обработать слишком много файлов одновременно.

**Решение:**

**Опция 1: Увеличь Node.js heap**
```bash
# В package.json
"scripts": {
  "mcp:complexity": "NODE_OPTIONS='--max-old-space-size=4096' node scripts/mcp-wrapper.js analyzeComplexity"
}
```

**Опция 2: Ограничь scope анализа**
```bash
# Вместо всего проекта - только src/
npm run mcp:complexity -- --path src/

# Или с лимитом файлов
npm run mcp:complexity -- --limit 100
```

**Опция 3: Очисти большой кэш**
```bash
# Проверь размер кэша
du -sh docs/cache/MCP_CACHE.json

# Если > 10MB - очисти
npm run mcp:cache-clear
```

---

### 6. Медленное выполнение (> 10 секунд)

**Причины:**
1. Холодный старт (кэш пуст)
2. Большая кодовая база (10,000+ файлов)
3. Тяжелые инструменты (securityAudit, a11yAudit)

**Решения:**

**Проверь cache hit rate:**
```bash
npm run mcp:cache-status
# Hit Rate: 45% ← плохо
# Hit Rate: 75% ← отлично
```

**Оптимизируй TTL (Time To Live):**
```typescript
// mcp-server/lib/cache-manager.ts
const DEFAULT_TTL = {
  gitBased: 5 * 60,     // 5 минут → увеличь до 10
  audits: 30 * 60,      // 30 минут → увеличь до 60
  analysis: 2 * 60 * 60 // 2 часа → OK
};
```

**Используй composite skills:**
```bash
# ❌ Медленно (3 последовательных вызова)
npm run mcp:security-audit  # 5s
npm run mcp:a11y-audit      # 5s
npm run mcp:tech-debt       # 3s
# Итого: 13 секунд

# ✅ Быстро (параллельное выполнение)
npm run mcp:full-project-audit  # 10s (параллельно)
```

---

## 🔍 Результаты и данные

### 7. Странные/неожиданные результаты

**Симптомы:**
- Инструмент находит слишком много/мало результатов
- Результаты не соответствуют ожиданиям
- Данные выглядят устаревшими

**Решение:**

**Шаг 1: Проверь кэш**
```bash
npm run mcp:cache-status
# Последний запуск был 2 часа назад?
```

**Шаг 2: Очисти кэш инструмента**
```bash
npm run mcp:cache-clear -- <tool-name>
```

**Шаг 3: Запусти снова**
```bash
npm run mcp:<command>
```

**Если проблема осталась:**
```bash
# Debug mode (добавь в mcp-wrapper.js)
DEBUG=true npm run mcp:<command>
```

---

### 8. Ошибка парсинга score (Project Health Grade)

**Ошибка:**
```
TypeError: Cannot parse score "90/100"
NaN in grade calculation
```

**Причина:** score приходит в формате строки "90/100", а нужно число.

**Решение:**
```typescript
// ❌ НЕПРАВИЛЬНО
const score = securityResult.score;  // "90/100" (string)

// ✅ ПРАВИЛЬНО
const score = parseInt(securityResult.score.split('/')[0]) || 0;  // 90 (number)
```

**Проверь инструменты:**
- `mcp-server/tools/composite/fullProjectAudit.ts`
- `mcp-server/tools/composite/codeHealthCheck.ts`

---

### 9. Результат отличается от Read/Grep

**Вопрос:** "Почему `mcp:find-imports -- Button` находит 5 файлов, а `Grep "Button" src/` находит 50?"

**Ответ:** MCP использует AST parsing, а Grep - regex!

**Grep (regex):**
```bash
Grep "Button" src/
# Найдет ВСЕ упоминания:
# - import { Button }    ✅ импорт
# - // Button component  ❌ комментарий
# - const buttonText     ❌ переменная
# - <Button />           ✅ использование
# Итого: 50 результатов
```

**MCP (AST):**
```bash
npm run mcp:find-imports -- Button
# Найдет ТОЛЬКО импорты:
# - import { Button } from '@/components/ui/button'  ✅
# Итого: 5 результатов (точнее!)
```

**Вывод:** MCP точнее, но может пропустить нестандартные случаи (dynamic imports, require).

---

## 📝 Audit Log

### 10. Audit Log поврежден

**Ошибка:**
```
SyntaxError: Unexpected token } in JSON at position 1234
```

**Причина:** AUDIT_LOG.json поврежден (прерванная запись, некорректный JSON).

**Решение:**

**Шаг 1: Сделай backup**
```bash
cp docs/audits/AUDIT_LOG.json docs/audits/AUDIT_LOG.json.backup
```

**Шаг 2: Проверь JSON**
```bash
cat docs/audits/AUDIT_LOG.json | jq .
# Если ошибка - файл поврежден
```

**Шаг 3: Восстанови из backup или пересоздай**
```bash
# Вариант 1: Восстановить последнюю версию
git checkout docs/audits/AUDIT_LOG.json

# Вариант 2: Создать новый
echo '{"tools": {}}' > docs/audits/AUDIT_LOG.json
```

**Шаг 4: Запусти audit снова**
```bash
npm run mcp:full-project-audit
```

---

### 11. Audit Log слишком большой (> 10MB)

**Проблема:** AUDIT_LOG.json вырос до > 10MB, замедляет работу.

**Решение:**

**Архивируй старые записи:**
```bash
# 1. Backup текущего лога
cp docs/audits/AUDIT_LOG.json docs/audits/AUDIT_LOG_$(date +%Y%m%d).json

# 2. Очисти старые записи (оставь последние 100)
cat docs/audits/AUDIT_LOG.json | jq '.tools | map_values(.results |= .[-100:])' > docs/audits/AUDIT_LOG_new.json

# 3. Замени
mv docs/audits/AUDIT_LOG_new.json docs/audits/AUDIT_LOG.json
```

**Автоматизируй через cron:**
```bash
# Добавь в crontab
0 0 1 * * cd /path/to/project && bash scripts/rotate-audit-log.sh
```

---

## 🔌 Интеграция

### 12. Claude Code не использует MCP автоматически

**Проблема:** Claude продолжает использовать Read/Grep вместо MCP команд.

**Решение:**

**Шаг 1: Проверь CLAUDE.md**
```bash
grep "MCP DECISION TREE" CLAUDE.md
# Должна быть секция "⚡ MCP DECISION TREE"
```

**Шаг 2: Если нет - добавь**
```bash
cat docs/mcp/CLAUDE_RULES_SNIPPET.md >> CLAUDE.md
```

**Шаг 3: Перезапусти Claude Code**
```bash
# Новая сессия или /reload
```

**Шаг 4: Проверь работу**
```bash
# Спроси Claude: "Где используется Button?"
# Должен использовать: npm run mcp:find-imports -- Button
# А не: Grep "Button" src/
```

---

### 13. Git Hooks не запускаются

**Проблема:** pre-commit/pre-push hooks не выполняют MCP проверки.

**Причина:** Husky не настроен или hooks не executable.

**Решение:**

**Шаг 1: Проверь Husky**
```bash
ls -la .husky/
# Должны быть файлы: pre-commit, pre-push
```

**Шаг 2: Если нет - setup**
```bash
bash scripts/setup-mcp-automation.sh
```

**Шаг 3: Сделай executable**
```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

**Шаг 4: Проверь работу**
```bash
git commit -m "test"
# Должен запуститься: npm run mcp:quick-health
```

**Если не работает - debug:**
```bash
# Запусти hook вручную
.husky/pre-commit
# Смотри ошибки
```

---

### 14. CI/CD: MCP команды падают в GitHub Actions

**Ошибка в CI:**
```
Error: ENOENT: no such file or directory, open 'docs/cache/MCP_CACHE.json'
```

**Причина:** Директории `docs/cache/` и `docs/audits/` не существуют в CI окружении.

**Решение:**

**Вариант 1: Создай директории в workflow**
```yaml
# .github/workflows/mcp-audit.yml
steps:
  - name: Setup MCP directories
    run: |
      mkdir -p docs/cache
      mkdir -p docs/audits
      echo '{}' > docs/cache/MCP_CACHE.json
      echo '{"tools": {}}' > docs/audits/AUDIT_LOG.json

  - name: Run MCP audit
    run: npm run mcp:full-project-audit
```

**Вариант 2: Закоммить пустые файлы**
```bash
# В проекте
mkdir -p docs/cache docs/audits
echo '{}' > docs/cache/MCP_CACHE.json
echo '{"tools": {}}' > docs/audits/AUDIT_LOG.json
git add docs/cache/.gitkeep docs/audits/.gitkeep
git commit -m "chore: add MCP directories for CI"
```

---

## 🛠️ Кастомизация

### 15. Как изменить TTL кэша?

**Файл:** `mcp-server/lib/cache-manager.ts`

```typescript
const DEFAULT_TTL = {
  gitBased: 5 * 60,      // 5 минут → измени здесь
  audits: 30 * 60,       // 30 минут → измени здесь
  analysis: 2 * 60 * 60  // 2 часа → измени здесь
};
```

**После изменения:**
```bash
# Очисти старый кэш
npm run mcp:cache-clear

# Запусти заново
npm run mcp:<command>
```

---

### 16. Как добавить свой инструмент в MCP?

**См. подробное руководство:** [CODE_EXECUTION.md секция 4](CODE_EXECUTION.md#4-создание-собственных-инструментов)

**Краткий workflow:**

1. **Создай файл:** `mcp-server/tools/analyze/myTool.ts`
2. **Экспортируй:** `export async function myTool(args) { ... }`
3. **Зарегистрируй:** В `mcp-server/tools/analyze/index.ts`
4. **Добавь скрипт:** В `package.json`
5. **Тест:** `npm run mcp:my-tool`

---

## 🔍 Debug Mode

### 17. Как включить подробные логи?

**Опция 1: Environment переменная**
```bash
DEBUG=mcp:* npm run mcp:full-project-audit
```

**Опция 2: Добавь логи в код**
```typescript
// mcp-server/tools/analyze/myTool.ts
console.log('[DEBUG] Processing files:', files.length);
console.log('[DEBUG] Results:', JSON.stringify(results, null, 2));
```

**Опция 3: Проверь Audit Log**
```bash
# Последний запуск инструмента
cat docs/audits/AUDIT_LOG.json | jq '.tools.securityAudit.results[-1]'
```

---

## 📞 Получить помощь

### Если ничего не помогло:

1. **Проверь FAQ:** [FAQ.md](FAQ.md)
2. **Проверь документацию:** [README.md](README.md)
3. **Проверь glossary:** [GLOSSARY.md](GLOSSARY.md)
4. **Создай issue:** GitHub Issues (если open source)
5. **Спроси в команде:** Slack/Discord/Email

**При создании issue включи:**
- Версию Node.js (`node --version`)
- Полный текст ошибки
- Команду которую запускал
- Содержимое `docs/cache/MCP_CACHE.json` (first 50 lines)
- Содержимое `docs/audits/AUDIT_LOG.json` (last 20 lines)

---

**Версия:** 1.0.0
**Последнее обновление:** 2025-11-10

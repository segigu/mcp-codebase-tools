# MCP Session Context Manager

## 🎯 Overview

The MCP Session Context Manager solves the problem of **context loss** when Claude Code hits the 200k token budget limit. Instead of expensive full-context summaries (5000-15000 tokens), it provides:

- **Lightweight checkpoints** (~50 tokens each) during work
- **Category-based organization** of work by module/topic
- **Automatic fragmentation detection** to recommend new sessions
- **Structured summaries** (~500 tokens) with only what matters

## 📊 Token Savings

| Operation | Without Session Manager | With Session Manager | Savings |
|-----------|------------------------|---------------------|---------|
| Session tracking | 5000-15000 tokens (Claude summary) | 50-500 tokens (checkpoints + summary) | **90-97%** |
| Context restore | Full conversation replay | Focused summary by category | **95%** |
| Total per session | ~20000 tokens | ~1000 tokens | **95%** |

## 🛠️ Available Tools

### 1. `mcp:checkpoint` - Create Checkpoint

Save progress with a brief note. Auto-detects category from modified files.

**Usage:**
```typescript
import { createCheckpoint } from '@mcp/codebase-tools/tools/session'

const result = await createCheckpoint({
  note: "Fixed login form validation",
  important: true  // optional
})
```

**What it saves:**
- Brief note (1-2 sentences)
- Modified files
- Git commit hash
- Timestamp
- Auto-detected category

**Token cost:** ~40 tokens

---

### 2. `mcp:session-todo` - Add TODO

Add a TODO item to track unfinished work.

**Usage:**
```typescript
import { addSessionTodo } from '@mcp/codebase-tools/tools/session'

const result = await addSessionTodo({
  todo: "Add error handling for token refresh",
  category: "auth"  // optional, uses last checkpoint's category
})
```

**Token cost:** ~20 tokens

---

### 3. `mcp:session-health` - Check Session Health

Analyze session metrics and get recommendation for starting new session.

**Usage:**
```typescript
import { getSessionHealth } from '@mcp/codebase-tools/tools/session'

const result = await getSessionHealth({})

console.log(`Duration: ${result.health.duration} hours`)
console.log(`Fragmentation: ${result.health.fragmentation}`)
console.log(`Recommendation: ${result.health.recommendation}`)
```

**Metrics:**
- Session duration
- Checkpoint count
- Category count
- Commit distribution
- Fragmentation level (low/medium/high)

**Token cost:** ~200 tokens

---

### 4. `mcp:session-summary` - Generate Summary

Create structured markdown summary and archive session.

**Usage:**
```typescript
import { createSessionSummary } from '@mcp/codebase-tools/tools/session'

const result = await createSessionSummary({
  outputPath: './my-session.md'  // optional
})
```

**Generates:**
```markdown
# Session Summary: 2025-11-10

## auth (HIGH priority - unfinished)
✅ Done:
- Fixed login form validation
- Added JWT token handling

⏹️ TODO:
- Add error handling for token refresh
- Test with multiple tabs

📁 Files: src/auth/LoginForm.tsx, src/hooks/useAuth.ts
🔗 Commits: abc123, def456
```

**Default location:** `docs/sessions/by-date/YYYY-MM-DD-session-ID.md`

**Token cost:** ~500 tokens (vs 15000 for Claude's auto-summary)

---

### 5. `mcp:session-continue` - Continue From Last Session

Show unfinished work from previous session.

**Usage:**
```typescript
import { continueSession } from '@mcp/codebase-tools/tools/session'

const result = await continueSession({
  category: "auth"  // optional filter
})

console.log(`Last session ended ${result.hoursAgo} hours ago`)

for (const item of result.unfinished) {
  console.log(`[${item.category}]`)
  console.log(`Done: ${item.done.join(', ')}`)
  console.log(`TODOs: ${item.todos.join(', ')}`)
}
```

**Shows:**
- High-priority items
- Unfinished work
- What was done
- What needs to be finished

**Token cost:** ~300 tokens

---

### 6. `mcp:context-check` - Detect Context Switches

Analyze recent commits for context switching (useful as git hook).

**Usage:**
```typescript
import { checkContext } from '@mcp/codebase-tools/tools/session'

const result = await checkContext({
  recentCommits: 4  // optional, default: 4
})

if (result.result.switchDetected) {
  console.log(result.result.message)
  // ⚠️ Context switch detected.
  // Recent commits span 3 different categories: auth → ui → api
  // 💡 Consider making checkpoint
}
```

**Token cost:** ~100 tokens

---

## 🗂️ Storage Architecture

All session data is stored in `~/.mcp-session-context/`:

```
~/.mcp-session-context/
├── sessions/
│   ├── active/
│   │   └── current.json          # Current session checkpoints
│   ├── archived/
│   │   └── YYYY-MM-DD-session-*.json  # Archived sessions
│   └── summaries/
│       └── YYYY-MM-DD-session-*.md    # Markdown summaries
└── config.json                    # Configuration
```

### Session State Format

```json
{
  "sessionId": "2025-11-10-session-1",
  "startTime": "2025-11-10T14:00:00Z",
  "projectRoot": "/Users/you/project",
  "checkpoints": [
    {
      "id": "checkpoint-1",
      "timestamp": "2025-11-10T14:30:00Z",
      "category": "auth",
      "note": "Fixed login form validation",
      "commit": "abc123",
      "files": ["src/auth/LoginForm.tsx"],
      "importance": "high",
      "todos": ["Add error handling"],
      "status": "unfinished"
    }
  ],
  "categories": {
    "auth": {
      "importance": "high",
      "status": "unfinished",
      "checkpointCount": 1,
      "commitCount": 1,
      "files": ["src/auth/LoginForm.tsx"]
    }
  }
}
```

---

## 🤖 Auto-Categorization

Categories are auto-detected from file paths using pattern matching:

| Pattern | Category |
|---------|----------|
| `/auth/`, `/login/`, `/oauth/` | `auth` |
| `/api/`, `/endpoints/`, `/routes/` | `api` |
| `/ui/`, `/components/`, `/views/` | `ui` |
| `/utils/`, `/helpers/`, `/lib/` | `utils` |
| `/test/`, `/spec/`, `/__tests__/` | `tests` |
| `/docs/`, `/documentation/` | `docs` |
| `/config/`, `/settings/` | `config` |
| `/db/`, `/database/`, `/models/` | `database` |

**Fallback:** Directory name or `general`

You can also specify category manually:
```typescript
await createCheckpoint({
  note: "Added feature",
  category: "my-custom-category"
})
```

---

## 📈 Importance Detection

Checkpoints are automatically marked as `high` or `low` importance:

**High importance if:**
- Has TODO items (score +2)
- Many files changed (>3 files, score +1)
- Work is unfinished (score +2)
- User explicitly marked `--important` (override)

**Score >= 2 → High importance**

---

## 🚦 Fragmentation Detection

Session fragmentation is calculated based on category count:

| Categories | Fragmentation |
|-----------|---------------|
| 1 | **Low** - Focused session |
| 2 | **Medium** - Moderate switching |
| 3+ | **High** - Highly fragmented |

**Recommendations:**
- **Low:** Continue working, session is focused
- **Medium:** Watch for context switches
- **High:** Consider starting new session for next topic

---

## 🔗 Git Hook Integration

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run mcp:context-check

if [ $? -ne 0 ]; then
  echo "⚠️  Context switch detected. Consider making a checkpoint."
  echo "Run: npm run mcp:checkpoint 'Your note here'"
  # Not blocking, just a warning
fi
```

### Post-commit Hook (Auto-checkpoint)

Add to `.husky/post-commit`:

```bash
#!/bin/sh
# Auto-checkpoint after commit (optional)
npm run mcp:checkpoint -- "$(git log -1 --format=%s)" 2>/dev/null || true
```

---

## 📚 Usage Examples

### Example 1: Working Session

```typescript
// Start working on auth
await createCheckpoint({
  note: "Started implementing JWT authentication"
})

// Work... work... work...

// Add TODO for later
await addSessionTodo({
  todo: "Add refresh token rotation"
})

// Switch to UI work
await createCheckpoint({
  note: "Fixed button styling in login form"
})

// Check if session is fragmented
const health = await getSessionHealth({})
if (health.health.fragmentation === 'high') {
  console.log("⚠️  High fragmentation, consider new session")
}

// End session
await createSessionSummary({})
```

---

### Example 2: Continuing Work

```typescript
// Next day, continue from last session
const last = await continueSession({})

console.log(`\n📋 Unfinished from ${last.hoursAgo}h ago:\n`)

for (const item of last.unfinished) {
  console.log(`[${item.category}]`)
  console.log(`✅ Done: ${item.done.join(', ')}`)
  console.log(`⏹️ TODO: ${item.todos.join(', ')}`)
}

// Start new checkpoint for today
await createCheckpoint({
  note: "Continuing auth work - implementing refresh token rotation"
})
```

---

### Example 3: Context Check in Git Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Check for context switch
CONTEXT_CHECK=$(npm run mcp:context-check --silent 2>&1)

if echo "$CONTEXT_CHECK" | grep -q "Context switch detected"; then
  echo "$CONTEXT_CHECK"
  echo ""
  echo "💡 Tip: Make a checkpoint to preserve context"
  echo "   npm run mcp:checkpoint 'Finished <category> work'"
fi
```

---

## ⚙️ Configuration

Create `~/.mcp-session-context/config.json`:

```json
{
  "storageDir": "~/.mcp-session-context",
  "contextSwitchWindow": 4,
  "fragmentationThreshold": 3,
  "autoCheckpointThreshold": 5
}
```

**Options:**
- `storageDir` - Where to store session data
- `contextSwitchWindow` - Number of commits to analyze (default: 4)
- `fragmentationThreshold` - Categories count for high fragmentation (default: 3)
- `autoCheckpointThreshold` - Auto-checkpoint after N commits without manual checkpoint (default: 5)

---

## 🎯 Best Practices

### ✅ DO:
- Make checkpoints frequently (every 30-60 minutes)
- Keep notes brief (1-2 sentences max)
- Add TODOs for unfinished work
- Run `session-health` periodically
- Create summary when switching major topics

### ❌ DON'T:
- Don't write long checkpoint notes (defeats the purpose)
- Don't save "what I tried and failed" (keep it focused)
- Don't mix many unrelated tasks in one session
- Don't forget to create summary before ending session

---

## 🔬 Technical Details

### Token Budget Impact

Claude Code has 200k token budget. When it fills up, Claude creates a summary.

**Without Session Manager:**
- Summary generated by Claude: **15000 tokens**
- Includes entire conversation
- Lost context after summary

**With Session Manager:**
- Checkpoints during work: **50 tokens each × N**
- Final summary: **500 tokens**
- Structured by category
- Easy to restore context

**Example:** 10 checkpoints + summary = **1000 tokens** (vs 15000)

**Savings: 93%**

---

## 🚀 Future Enhancements

Planned for v1.2:

- [ ] Weekly/monthly aggregated summaries
- [ ] Smart category suggestions based on git history
- [ ] Integration with Claude Code `/continue` command
- [ ] Auto-checkpoint on token threshold
- [ ] Session templates for common workflows
- [ ] Export to external tools (Notion, Markdown, etc.)

---

## 🐛 Troubleshooting

### "No previous session found"

**Cause:** First time using session manager or all sessions archived.

**Solution:** Create a new checkpoint to start a session.

### "Note is required for checkpoint"

**Cause:** Missing note parameter.

**Solution:**
```typescript
await createCheckpoint({ note: "Your note here" })
```

### Session data not found

**Cause:** Storage directory not initialized.

**Solution:** Will be auto-created on first checkpoint.

---

## 📖 API Reference

See TypeScript types in `src/utils/session-types.ts` for complete API documentation.

All tools are available via:
```typescript
import {
  createCheckpoint,
  addSessionTodo,
  getSessionHealth,
  createSessionSummary,
  continueSession,
  checkContext
} from '@mcp/codebase-tools/tools/session'
```

---

## 📝 License

MIT - Part of MCP Codebase Tools

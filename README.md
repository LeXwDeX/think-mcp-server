# Think Tool MCP Server

[![npm version](https://img.shields.io/npm/v/think-mcp-tool)](https://www.npmjs.com/package/think-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Implementation of Anthropic's "think" tool as an MCP server** — Structured reasoning that dramatically improves AI performance, with a hard rule that forces deep analysis on any problem with ≥ 3 parallel items.

## What's in this server?

Two tools, served over stdio:

- **`think`** — a structured-reasoning scratchpad. The model pauses, organizes its thoughts in Markdown headings + lists, then proceeds. No side effects; no new information fetched.
- **`recall`** — revisit prior thoughts from the same session, filtered by keyword, so the model builds on earlier reasoning instead of repeating itself.

## What is the Think Tool?

This MCP server implements the "think" tool that Anthropic introduced in their [engineering blog post](https://www.anthropic.com/engineering/claude-think-tool). The Think Tool provides AI assistants with a dedicated space for structured reasoning during complex problem-solving tasks, enabling more thoughtful, accurate, and reliable responses.

## Proven Performance Benefits

Anthropic's research demonstrates remarkable improvements when using the "think" tool:

- **54% improvement** in complex customer service tasks
- **Significantly better adherence** to detailed policies and guidelines
- **Enhanced consistency** across multiple trials of the same task
- **Improved performance** on software engineering benchmarks
- **Minimal implementation overhead** compared to other enhancement techniques

The "think" tool excels where other approaches fall short:
- **Better than extended thinking** for cases requiring complex tool chains
- **More effective than baseline prompting** for policy-heavy scenarios
- **Especially powerful** when paired with optimized prompting

## Quick Install

### Via npm (Recommended)

```bash
npx think-mcp-tool
```

### For Claude Desktop

Add to your Claude Desktop configuration:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "think-tool": {
      "command": "npx",
      "args": ["think-mcp-tool"]
    }
  }
}
```

### For Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "think-tool": {
      "command": "npx",
      "args": ["think-mcp-tool"]
    }
  }
}
```

### For OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "think-tool": {
      "command": "npx",
      "args": ["think-mcp-tool"]
    }
  }
}
```

## How It Works

The "think" tool implements the mechanism described in Anthropic's engineering blog. Unlike extended thinking (which happens before the AI starts responding), the "think" tool allows the AI to pause and reflect during its response generation. The tool performs no external actions and retrieves no new information — it provides a dedicated scratchpad to reason step-by-step, which materially improves performance on complex tasks.

### Hard rule: think before acting on ≥ 3 items

This server ships with a **mandatory** trigger. The model must call `think` before acting when any of these hold:

- **≥ 3 parallel items** — options, candidates, files, fields, steps, search hits, errors (any countable set)
- **≥ 3 affected code points** — files, functions, call sites, config keys
- **A task that decomposes into ≥ 3 ordered steps**

Counting rule: if unsure whether items are "parallel," trigger. Skipping this rule causes missed tradeoffs, missed call-site edits, and wrong step ordering. This rule is injected via the server's MCP `instructions` field and the `think` tool description, so any compliant client will see it automatically.

### When else it helps (soft triggers)

Beyond the hard rule, `think` is valuable after non-trivial tool results, before writing or editing code, when verify fails (trace root cause), and before multi-file edits (plan order, gauge blast radius).

## System Prompt for Optimal Results

Anthropic's research shows that **combining the "think" tool with optimized prompting delivers the strongest performance improvements**. This server already injects the prompt below via the MCP `instructions` field, so most clients (Claude Desktop, Cursor, OpenCode) pick it up automatically. If your client does not surface MCP instructions, paste this into your system prompt:

```
You have two structured-reasoning tools: think and recall.

## MUST think first (hard rule)

Call think before acting when ANY of these hold — no exceptions:
- ≥ 3 parallel items (options, candidates, files, fields, steps, search hits, errors)
- ≥ 3 affected code points (files, functions, call sites, config keys)
- Task decomposes into ≥ 3 ordered steps

Rule: count the items; ≥ 3 → trigger. When unsure if "parallel," trigger.

## When else to think (soft)

- After non-trivial tool results — assess before acting
- Before writing/editing code — validate plan, list affected call sites
- When stuck or verify fails — trace root cause
- Before multi-file edits — plan order, gauge blast radius

## How to structure

Always Markdown headings + lists. No prose dumps. Template:

## Problem
One sentence.

## Constraints
- What's frozen
- Boundaries not to cross

## Options
1. Option A — one-line tradeoff
2. Option B — one-line tradeoff

## Decision
Which, and why.

## Verification
How to confirm correctness.

Skip irrelevant sections on simple problems. Core discipline: boxes, not mush.

## recall — revisit past thoughts

Use recall to view prior thoughts this session, to check if a problem was already analyzed, build on existing reasoning, or review the decision chain.
```

## Manual Installation

If you prefer to run the server locally from source:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LeXwDeX/think-mcp-server.git
   cd think-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

## Development

```bash
npm run dev    # Hot-reload development mode
npm run build  # Compile TypeScript
npm start      # Run compiled output
```

## License

[MIT License](LICENSE)

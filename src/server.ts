#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";

// ── Session-scoped thought store ──────────────────────────────────────
interface ThoughtEntry {
  id: number;
  timestamp: string;
  thought: string;
}

const thoughtStore: ThoughtEntry[] = [];
let nextId = 1;

// ── MCP Server ────────────────────────────────────────────────────────
const server = new FastMCP({
  name: "Think Tool Server",
  version: "1.2.0",
  instructions: `# Structured Thinking Tools

Two structured-reasoning tools this session.

## think — structured reasoning scratchpad

Pause and organize thoughts on complex problems before acting. No side effects; materially improves task performance (τ-Bench +54%).

### MUST think first (hard rule)

Call \`think\` before acting when ANY of these hold — no exceptions:

- **≥ 3 parallel items** — options, candidates, files, fields, steps, search hits, errors (any countable set)
- **≥ 3 affected code points** — files, functions, call sites, config keys
- **Task decomposes into ≥ 3 ordered steps**

Rule: count the items; ≥ 3 → trigger. When unsure if "parallel," trigger.
Skipping this causes missed tradeoffs, missed call-site edits, wrong step ordering.

### When else to use (soft)

- After non-trivial tool results — assess before acting
- Before writing/editing code — validate plan, list affected call sites
- When stuck or verify fails — trace root cause
- Before multi-file edits — plan order, gauge blast radius

### How to structure

Always Markdown headings + lists. No prose dumps. Template:

\`\`\`
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
\`\`\`

Skip irrelevant sections on simple problems; add new ones as needed (Risks, Dependencies, Open questions).
Core discipline: **boxes, not mush.**

## recall — revisit past thoughts

Use \`recall\` to view prior thoughts this session:
- Check if you already analyzed a problem
- Build on existing reasoning instead of repeating
- Review the decision chain before complex operations`,
});

// ── think tool ────────────────────────────────────────────────────────
server.addTool({
  name: "think",
  description:
    "Think before acting. This tool fetches no new information and modifies nothing — it appends your reasoning to the session log. Use it whenever you face ≥ 3 parallel items, ≥ 3 affected code points, or ≥ 3 ordered steps, and in any non-trivial reasoning. Organize with Markdown headings (## Problem, Constraints, Options, Decision, Verification) and lists; skip irrelevant sections on simple problems. Never write unstructured prose.",
  parameters: z.object({
    thought: z
      .string()
      .min(1, "Thought must not be empty")
      .max(10000, "Thought must not exceed 10000 characters")
      .describe(
        "Structured reasoning in Markdown headings + lists. Template: ## Problem, Constraints, Options, Decision, Verification. Skip irrelevant sections on simple problems."
      ),
  }),
  execute: async (args, { log }) => {
    const entry: ThoughtEntry = {
      id: nextId++,
      timestamp: new Date().toISOString(),
      thought: args.thought,
    };
    thoughtStore.push(entry);

    log.info("Thinking process", { id: entry.id, thought: args.thought });

    return args.thought;
  },
});

// ── recall tool ───────────────────────────────────────────────────────
server.addTool({
  name: "recall",
  description:
    "Review prior thoughts this session. Returns timestamped entries. Use to check if a problem was already analyzed, build on existing reasoning instead of repeating, or revisit the decision chain before complex operations.",
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe("Optional keyword to filter by content. Omit for most recent."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max entries to return (default 10)."),
  }),
  execute: async (args) => {
    const limit = args.limit ?? 10;
    const query = args.query?.toLowerCase();

    let entries = thoughtStore;

    // Filter by keyword if provided
    if (query) {
      entries = entries.filter((e) => e.thought.toLowerCase().includes(query));
    }

    // Take the most recent `limit` entries
    const results = entries.slice(-limit);

    if (results.length === 0) {
      return query
        ? `No thoughts matching "${args.query}" this session.`
        : "No thoughts recorded yet this session.";
    }

    // Format as structured Markdown
    const formatted = results
      .map((e) => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return `### Thought #${e.id} (${time})\n\n${e.thought}`;
      })
      .join("\n\n---\n\n");

    const header = query
      ? `## Recall: ${results.length} thoughts matching "${args.query}"\n\n`
      : `## Recall: last ${results.length} thoughts\n\n`;

    return header + formatted;
  },
});

// Keepalive: prevent process exit on stdin EOF.
// fastmcp v4's StdioServerTransport does not handle stdin 'end',
// so when the client closes stdin the event loop can go idle and the process exits.
// A keepalive timer ensures the event loop always has an active handle.
const keepalive = setInterval(() => {}, 1 << 30);

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.error(`Received ${signal}, shutting down...`);
  clearInterval(keepalive);
  try {
    await server.stop();
  } catch {
    // ignore stop errors
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  clearInterval(keepalive);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// Start the server with stdio transport
await server.start({
  transportType: "stdio",
});
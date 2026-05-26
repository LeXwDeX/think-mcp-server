#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";

// Create a new MCP server
const server = new FastMCP({
  name: "Think Tool Server",
  version: "1.0.0",
  instructions: `# 思考

## think tool

You have access to a \`think\` tool — a scratchpad for structured reasoning.
It costs nothing, changes nothing, and measurably improves complex task
performance.

### When to use it

After any non-trivial tool result — explore reports, impact analysis,
web searches, command output — pause and assess before acting.
Before writing or editing code — verify your plan against what you just
read. Enumerate affected call sites. Confirm the change is minimal and no
unrelated "cleanup" is sneaking in.
When stuck or a verify step fails — trace root cause: implement error or
spec error? After two consecutive failures, stop and question assumptions.
Before multi-file edits — plan the sequence, identify shared interfaces
that must stay compatible, and map the blast radius.

### How to use it

1. State the problem in one sentence
2. List constraints: what must NOT change, which interfaces are frozen
3. Enumerate ≥2 options with one-line tradeoffs each
4. Pick the simplest option, justify why
5. Verify against acceptance criteria

### Remember

- If you're about to edit code and haven't used think, ask yourself:
  do I fully understand the blast radius?
- A 5-second structured pause prevents 5-minute reverts.`,
});

// Add the "think" tool
server.addTool({
  name: "think",
  description:
    "Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log. Use it when complex reasoning or some cache memory is needed.",
  parameters: z.object({
    thought: z
      .string()
      .min(1, "Thought must not be empty")
      .max(10000, "Thought must not exceed 10000 characters")
      .describe("A thought to think about."),
  }),
  execute: async (args, { log }) => {
    // Log the thought (this will be visible in the server logs but not to the user)
    log.info("Thinking process", { thought: args.thought });

    // Simply return the thought itself, as per Anthropic's blog post
    return args.thought;
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
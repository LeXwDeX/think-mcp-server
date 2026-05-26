#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";

// Create a new MCP server
const server = new FastMCP({
  name: "Think Tool Server",
  version: "1.0.0",
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
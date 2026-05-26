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
  version: "1.1.0",
  instructions: `# 结构化思考工具

你在当前会话中拥有两个结构化推理工具。

## think — 结构化推理草稿本

用 \`think\` 在复杂问题前暂停、梳理思路。它不产生副作用，但能显著提升任务表现（τ-Bench 提升 54%）。

### 何时使用

- 收到非平凡的 tool 结果后 — 先评估再行动
- 写代码或改代码前 — 验证方案，列出受影响的调用点
- 卡住或验证失败时 — 追溯根因
- 多文件编辑前 — 规划顺序，评估爆炸半径

### 如何结构化思考

始终使用 Markdown 标题和列表，**不要写大段散文**。参考模板：

\`\`\`
## 问题
一句话描述问题。

## 约束
- 不能改什么
- 哪些接口/边界是冻结的

## 方案
1. 方案 A — 一句话权衡
2. 方案 B — 一句话权衡

## 决策
选哪个，为什么。

## 验证
如何确认正确性。
\`\`\`

**简单问题可以跳过不相关的章节**，也可以按需增加新章节（如"风险"、"依赖"、"待确认"）。
核心纪律是：**条条框框，不要糊一坨**。

## recall — 回顾历史思考

用 \`recall\` 查看当前会话中之前的思考记录。适用于：
- 检查是否已经分析过某个问题
- 在已有推理基础上继续，避免重复
- 复杂操作前回顾决策链路`,
});

// ── think tool ────────────────────────────────────────────────────────
server.addTool({
  name: "think",
  description:
    "用这个工具思考问题。它不会获取新信息或修改数据，只会将思考追加到会话日志中。在需要复杂推理或缓存思路时使用。始终用 Markdown 标题（## 问题、## 约束、## 方案、## 决策、## 验证）和列表来组织思考，简单问题可跳过部分章节，但不要写无结构的散文段落。",
  parameters: z.object({
    thought: z
      .string()
      .min(1, "思考内容不能为空")
      .max(10000, "思考内容不能超过 10000 字符")
      .describe(
        "一段结构化思考，使用 Markdown 标题和列表。参考模板：## 问题、## 约束、## 方案、## 决策、## 验证。简单问题可跳过部分章节。"
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
    "回顾当前会话中的历史思考记录。返回带时间戳的思考条目列表。用于回顾推理链路、避免重复分析、或在已有结论基础上继续。",
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe("可选关键词，按内容过滤思考记录。不填则返回最近的思考。"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("最多返回多少条思考记录（默认 10）。"),
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
        ? `当前会话中没有匹配 "${args.query}" 的思考记录。`
        : "当前会话中还没有思考记录。";
    }

    // Format as structured Markdown
    const formatted = results
      .map((e) => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return `### 思考 #${e.id}（${time}）\n\n${e.thought}`;
      })
      .join("\n\n---\n\n");

    const header = query
      ? `## 回顾：${results.length} 条匹配 "${args.query}" 的思考\n\n`
      : `## 回顾：最近 ${results.length} 条思考\n\n`;

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
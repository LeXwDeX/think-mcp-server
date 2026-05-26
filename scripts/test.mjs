#!/usr/bin/env node
/**
 * MCP Protocol Integration Test
 *
 * Spawns the think-mcp-tool server and verifies:
 * 1. initialize handshake
 * 2. tools/list returns the "think" tool
 * 3. tools/call returns the thought correctly
 * 4. Empty thought is rejected by validation
 * 5. Server stays alive after stdin EOF (regression: fastmcp v4 stdio)
 *
 * Exit code 0 = all pass, 1 = any failure
 */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, "..", "dist", "server.js");

const server = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
const testResults = [];

function send(obj) {
  server.stdin.write(JSON.stringify(obj) + "\n");
}

server.stdout.on("data", (data) => {
  buffer += data.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      handleResponse(JSON.parse(line));
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  }
});

server.stderr.on("data", (data) => {
  // Server logs go to stderr — suppress unless debugging
  // process.stderr.write(`[server] ${data}`);
});

function handleResponse(response) {
  const { id } = response;

  if (id === 1) {
    const info = response.result?.serverInfo;
    testResults.push({
      test: "initialize",
      pass: !!info,
      detail: info
        ? `${info.name} v${info.version}, protocol ${response.result.protocolVersion}`
        : "No serverInfo",
    });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", method: "tools/list", params: {}, id: 2 });
  }

  if (id === 2) {
    const tools = response.result?.tools || [];
    const think = tools.find((t) => t.name === "think");
    testResults.push({
      test: "tools/list",
      pass: !!think,
      detail: think ? `Found 'think' tool` : "think tool not found",
    });
    send({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "think", arguments: { thought: "1+1=2 verification" } },
      id: 3,
    });
  }

  if (id === 3) {
    const text = response.result?.content?.[0]?.text;
    testResults.push({
      test: "tools/call (think)",
      pass: text === "1+1=2 verification",
      detail: text ? `Returned: "${text}"` : "No content",
    });
    send({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "think", arguments: { thought: "" } },
      id: 4,
    });
  }

  if (id === 4) {
    const isError =
      response.error || response.result?.isError;
    testResults.push({
      test: "validation (empty thought)",
      pass: !!isError,
      detail: isError ? "Correctly rejected" : "Should have rejected",
    });

    // Test 5: server survives stdin EOF
    server.on("exit", (code) => {
      testResults.push({
        test: "stdin EOF survival",
        pass: false,
        detail: `Server exited with code ${code} after stdin closed`,
      });
      finish();
    });
    server.stdin.end();
    setTimeout(() => {
      testResults.push({
        test: "stdin EOF survival",
        pass: true,
        detail: "Server stayed alive 2s after stdin EOF",
      });
      finish();
    }, 2000);
  }
}

function finish() {
  console.log("\n========== MCP Protocol Tests ==========\n");
  for (const r of testResults) {
    console.log(`  [${r.pass ? "PASS" : "FAIL"}] ${r.test} — ${r.detail}`);
  }
  const passed = testResults.filter((r) => r.pass).length;
  const total = testResults.length;
  console.log(
    `\n  ${passed === total ? "ALL PASSED" : "FAILED"} (${passed}/${total})\n`
  );
  server.kill();
  process.exit(passed === total ? 0 : 1);
}

setTimeout(() => {
  console.error("\nTimeout (10s)");
  finish();
}, 10000);

// Start
send({
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
  id: 1,
});

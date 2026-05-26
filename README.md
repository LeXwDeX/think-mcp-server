# Think Tool MCP Server

[![npm version](https://img.shields.io/npm/v/think-mcp-tool)](https://www.npmjs.com/package/think-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Implementation of Anthropic's "think" tool as an MCP server** — Dramatically improve AI reasoning capabilities with structured thinking.

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

The "think" tool implements the mechanism described in Anthropic's engineering blog. Unlike extended thinking (which happens before the AI starts responding), the "think" tool allows the AI to pause and reflect during its response generation.

**Key mechanism:** The tool doesn't perform any external actions or retrieve new information — it simply provides a dedicated scratchpad to work through reasoning step-by-step, which dramatically improves performance on complex tasks.

When the AI uses the "think" tool:
1. It **pauses to organize thoughts** before continuing a complex reasoning chain
2. It **creates a structured approach** to multi-step problems
3. It **verifies policy compliance** more thoroughly and consistently
4. It **carefully analyzes tool outputs** before deciding next steps
5. It **maintains better context awareness** across long interactions

### When to Use the Think Tool

The "think" tool is especially valuable when:

1. **Working with other MCP tools** — Great for analyzing outputs from databases, filesystems, or APIs
2. **Following complex policies** — Perfect for customer service, legal, or compliance scenarios
3. **Making sequential decisions** — Ideal for workflows where later steps depend on earlier ones
4. **Processing web search results** — Helps synthesize information from multiple sources
5. **Solving coding challenges** — Improves success rates on software engineering tasks

## System Prompt for Optimal Results

Anthropic's research shows that **combining the "think" tool with optimized prompting delivers the strongest performance improvements**. For best results, add the following system prompt:

```
You have access to a "think" tool that provides a dedicated space for structured reasoning. Using this tool significantly improves your performance on complex tasks.

## When to use the think tool

Before taking any action or responding to the user after receiving tool results, use the think tool as a scratchpad to:
- List the specific rules that apply to the current request
- Check if all required information is collected
- Verify that the planned action complies with all policies
- Iterate over tool results for correctness
- Analyze complex information from web searches or other tools
- Plan multi-step approaches before executing them

## How to use the think tool effectively

When using the think tool:
1. Break down complex problems into clearly defined steps
2. Identify key facts, constraints, and requirements
3. Check for gaps in information and plan how to fill them
4. Evaluate multiple approaches before choosing one
5. Verify your reasoning for logical errors or biases
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

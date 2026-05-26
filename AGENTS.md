# AGENTS.md

## Build & Run

```bash
npm install
npm run build    # tsc → dist/server.js
npm start        # node dist/server.js
npm run dev      # ts-node/esm hot-run (no build needed)
```

No tests, linter, or formatter configured — do not attempt to run them.

## Architecture

Single-file app: `src/server.ts` is the entire server. Uses **FastMCP** (`fastmcp`), not the official `@modelcontextprotocol/sdk`.

Transport is **stdio** — stdout is the MCP protocol channel. Never use `console.log` for debug output; use `console.error` (writes to stderr, does not interfere with the protocol).

## TypeScript / ESM Gotchas

- `"type": "module"` in package.json — this is an ESM project.
- `moduleResolution: "NodeNext"` — relative imports in `.ts` source **must** include `.js` extension (e.g. `import { foo } from "./bar.js"`).
- Target is ES2020, output goes to `dist/` (gitignored).

## Gitignored Local Files

Do not commit these — they are per-developer local config:

- `mempalace.yaml`, `entities.json` (MemPalace project config)
- `dist/` (build output)
- `package-lock.json` (listed in .gitignore)

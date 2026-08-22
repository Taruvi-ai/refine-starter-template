# Taruvi Refine Template (Refine v5)

The standard starter template for building Taruvi apps with **Refine v5 + React +
MUI + TypeScript**, pre-wired to the Taruvi providers and MCP server.

## What's included

- Refine v5 + React + TypeScript + MUI app scaffold
- All Taruvi providers configured (`data`, `storage`, `app`, `user`, `auth`,
  `accessControl`) in `src/providers/refineProviders.ts`
- Taruvi MCP configuration for Claude Code, Codex, Kiro, and VS Code
- Two IDE-agnostic skills — **`taruvi-app-developer`** (backend) and
  **`taruvi-refine-providers`** (frontend) — installed automatically on
  `npm install`
- Claude Code subagents (`.claude/agents/`) for coordinated backend/frontend/UX
  workflows

## Getting started

```bash
npm install            # also installs the Taruvi skills (postinstall)
npm run setup          # interactive: writes .env and .mcp.json
npm run dev            # start the Refine dev server (http://localhost:5173)
```

`npm run setup` prompts for your Taruvi values and generates the config files. To
set them by hand, copy `.env.example` → `.env` and `.mcp.example.json` →
`.mcp.json`, then fill in:

```env
TARUVI_SITE_URL=https://<tenant>.taruvi.cloud
TARUVI_API_KEY=<your-api-key>
TARUVI_APP_SLUG=<your-app-slug>
```

Create your app and collect these values in the Taruvi Console first.

## Working with AI agents

- **Any agent/IDE:** start from [`AGENTS.md`](AGENTS.md) — shared rules, preflights,
  Refine v5 + Taruvi specifics, deployment.
- **Claude Code:** [`CLAUDE.md`](CLAUDE.md) adds a coordinator model that delegates
  to the `taruvi-backend`, `taruvi-frontend`, and `ui-ux-reviewer` subagents.
- **Design system:** [`UI_Guidelines.md`](UI_Guidelines.md) + `taruviTokens` from
  [`themeOptions.ts`](themeOptions.ts).

Skills are fetched fresh (latest) into `.agents/skills/` on every `npm install`, so
they are not committed. Install/refresh manually with
`npx skills add Taruvi-ai/taruvi-skills`.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build
npm run start     # serve the build
npm run deploy    # build + upload dist/ to Taruvi frontend workers
```

## Tech stack

[Refine](https://refine.dev) · React + TypeScript · MUI · Taruvi providers + MCP

## License

MIT

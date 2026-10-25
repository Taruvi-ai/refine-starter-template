# Taruvi Refine Starter

React + Refine v5 + MUI starter for building TaruviBase applications.

![Refine](https://img.shields.io/badge/refine-v5-blue) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Install

Create an app and copy its values from **Settings → Connect** in the Taruvi Console, then:

```bash
npm install            # also installs the Taruvi agent skills (postinstall)
npm run setup          # interactive: writes .env and .mcp.json
npm run dev            # http://localhost:5173
```

To configure by hand, copy `.env.example` to `.env` and `.mcp.example.json` to `.mcp.json`, then fill in:

```env
TARUVI_SITE_URL=https://<your-site>.taruvi.cloud
TARUVI_API_KEY=<your-api-key>
TARUVI_APP_SLUG=<your-app-slug>
```

## What's included

- Refine v5 + React + TypeScript + MUI app scaffold
- All Taruvi providers configured (`data`, `storage`, `app`, `user`, `auth`, `accessControl`) in `src/providers/refineProviders.ts`
- Taruvi MCP configuration for Claude Code, Codex, Kiro and VS Code
- Two agent skills, `taruvi-app-developer` (backend) and `taruvi-refine-providers` (frontend), installed on `npm install`
- Claude Code subagents in `.claude/agents/` for backend, frontend and UI review work
- Brand-neutral by default: no Taruvi visual identity is applied until you add your own

## Working with AI agents

- **Any agent:** start from [`AGENTS.md`](AGENTS.md) for shared rules, Refine v5 + Taruvi specifics and deployment.
- **Claude Code:** [`CLAUDE.md`](CLAUDE.md) adds a coordinator that delegates to the `taruvi-backend`, `taruvi-frontend` and `ui-ux-reviewer` subagents.
- **Design:** add a local `DESIGN.md` for your app's brand. Shared UX guidance lives in [Taruvi-ai/ui-guidelines](https://github.com/Taruvi-ai/ui-guidelines), and theme tokens live in [`themeOptions.ts`](themeOptions.ts).

Skills are fetched fresh into `.agents/skills/` on every `npm install` and are not committed. To refresh them manually, run `npx skills add Taruvi-ai/taruvi-skills`.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build
npm run start     # serve the build
npm run deploy    # build and upload dist/ to Taruvi frontend workers
```

## Learn more

[Refine docs](https://docs.taruvibase.com/docs/build/refine) · [Documentation](https://docs.taruvibase.com/) · [Website](https://taruvibase.com/)

## Contributing

Report bugs and suggest changes in [GitHub Issues](https://github.com/Taruvi-ai/refine-starter-template/issues). Pull requests are welcome: follow the conventions in [`AGENTS.md`](AGENTS.md) and check that `npm run build` passes before opening one.

## License

MIT, see [LICENSE](LICENSE).

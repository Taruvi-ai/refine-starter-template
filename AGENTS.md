# AGENTS.md — Taruvi Refine Template

Shared guidance for any AI agent or IDE (Claude Code, Codex, Kiro, …) working in
this repo. Claude Code users: [`CLAUDE.md`](CLAUDE.md) adds the subagent
orchestration layer on top of this.

## Functional app default

If the user asks to build an app, default to a **functional, production-ready**
app — not a mockup, demo, or MVP. That means: create the Taruvi schema, register
Refine resources in `src/App.tsx`, build real list/create/edit/show flows, and
wire dashboards to **live data** (computed from the system, never hardcoded).
Only build a UI-only prototype if the user explicitly asks for one.

This is a **Refine.dev v5** project (React admin/dashboard framework). Even if the
user asks for plain HTML/CSS/JS, always use React + Refine v5 + MUI + TypeScript.

## Plan before building

**Clarify only what changes the shape of the build.** If the request doesn't say
whether it needs role-based access control beyond default auth, scheduled/
automated jobs, external API integrations, or reporting/analytics beyond a
simple filtered list, ask before planning — these decide whether the backend
touches Cerbos policies, roles, functions, or analytics **at all**, and guessing
wrong here costs a rebuild, not a tweak. Don't ask about things a sensible
default already covers (field types, page layout, naming) — that's surveying,
not clarifying.

**Write a short spec before building — save it to `docs/spec.md`.** It lists
each resource, its fields/types/relations, provider `meta` (which
`dataProviderName`, `bucketName`, function slugs), and the page list per resource
(list / show / create-edit / dashboard). This is what prevents rework on a real
build — don't skip it, whether you're building sequentially yourself or
coordinating multiple agents.

**Scope it to what this build needs — not every backend capability that
exists.** Plain datatables + default auth are the baseline; add nothing else
unless clarified as needed:
- **Cerbos policies / custom roles** — only for multi-role access control. The
  template ships `accessControlProvider` commented out in `src/App.tsx` for
  exactly this reason; most apps never uncomment it.
- **Functions** — only when the skill's decision criteria apply (2+ resources at
  runtime, event triggers, cron, external API + a stored secret, >30s work, a
  public endpoint, complex authz, or a function pipeline). A plain CRUD resource
  never needs one.
- **Analytics queries** — only if reporting/dashboards beyond a simple filtered
  list were asked for.

An unrequested policy or function isn't neutral — it's dead weight every future
change has to route around. When genuinely unsure whether something's needed,
ask — don't default to yes.

**This repo has an automated PR review.**
[`.github/workflows/ui-ux-review.yml`](.github/workflows/ui-ux-review.yml) runs
a UI/UX + accessibility check on every PR touching `src/pages/**` or
`src/components/**`, posting findings as a PR comment — informational only,
never blocks merge. You don't need to self-review before pushing; it runs
automatically regardless of which tool wrote the code.

## Mandatory Taruvi preflight

For anything touching Taruvi, `@taruvi/sdk`, or `@taruvi/refine-providers`, **read
the relevant skill before writing code** — do not implement from memory:

- **Backend** (schema, Cerbos policies, roles/users, buckets, secrets, analytics,
  raw SQL, Python functions): `.agents/skills/taruvi-app-developer/SKILL.md`
- **Frontend** (Refine providers, hooks, list/dashboard/form UX, auth, access
  control): `.agents/skills/taruvi-refine-providers/SKILL.md`

Each SKILL.md routes you to its module references. If the skills are missing,
install them: `npx skills add Taruvi-ai/taruvi-skills`. They install automatically
(latest) via `postinstall` on every `npm install`, so they are not committed to
the repo — a bare clone without installing won't have them.

The skills are the source of truth for **Refine v5 syntax**, provider `meta`
options, hook return shapes, and production UX patterns. Don't duplicate that here
— open the skill.

## Mandatory UI / design-system preflight

For anything that renders or styles UI:

1. `WebFetch` the design-system guidelines — the companion to the MUI theme; it
   resolves design decisions the theme can't encode. These are **not** vendored
   into this repo — they're maintained separately so every fork/app reads the
   same current version instead of a copy that drifts. Fetch fresh each time,
   don't rely on a memory of a prior fetch:
   `https://raw.githubusercontent.com/Taruvi-ai/ui-guidelines/main/UI_Guidelines.md`
2. Import design tokens from [`themeOptions.ts`](themeOptions.ts)
   (`import { taruviTokens } from ".../themeOptions"`). **Never** hardcode brand
   hex values.
3. Prefer plain MUI components — the theme already applies sizes, weights, radii,
   padding, shadows, colors via overrides. Don't re-style with `sx`/CSS.
4. Use **`*Rounded`** icon variants from `@mui/icons-material`.
5. **Page anatomy is mandatory** (details in the fetched guidelines + the
   frontend skill): list pages need search + filters + active-filter chips +
   server-side pagination + 4 empty states; show pages need breadcrumb + title +
   status chip + actions + meta + tabs-with-counts; destructive actions need a
   confirmation dialog; never render a blank page during load. Filters push into
   Refine's server-side `filters[]`, never React state.

If the guidelines fetch fails or `themeOptions.ts` is missing, stop and tell the
user.

## Internal-app standard features

Internal Taruvi apps must ship the standard features in
[`docs/standard-tasks.md`](docs/standard-tasks.md) (e.g. the **Report an issue**
Navkit item). Each is an idempotent prompt — apply the ones an app is missing.

## User data access rule (mandatory)

Taruvi provides built-in user management (users, roles, auth). **Never** create
custom identity tables (`users`, `auth_users`, `user_roles`, `passwords`,
`sessions`), never access `auth_user` via datatable routes, and never use
`resource: "auth_user"` in Refine hooks. Always use the `user` provider
(`dataProviderName: "user"`, `resource: "users"`) and the user/role APIs +
MCP tools (`list_users`, `create_user`, `manage_roles`,
`manage_role_assignments`). If identity data isn't available to the current role,
degrade gracefully in the UI.

## Repo-specific rules

- **Notifications:** use the existing `useNotificationProvider` from
  `@refinedev/mui` (configured in `src/App.tsx`). No custom snackbars/toasts.
- **Auth is redirect-based:** keep `/login` wired to `LoginRedirect`; don't
  replace it with a local form. Keep protected Taruvi queries behind auth —
  app-wide settings/nav/theme fetches must skip protected calls until a session
  token exists.
- **Form inputs:** normalize nullable API values before passing to MUI
  (`value={field.value ?? ""}`, boolean `checked`) to avoid controlled warnings.
- **Stable query inputs:** memoize `filters`/`sorters`/`meta`; avoid inline
  `new Date()`/`Date.now()`/`Math.random()` in hook args — unstable inputs change
  the query key and cause repeated datatable requests.
- **Dev server is already running** — do **not** run `npm run dev`/`build`.
  Changes hot-reload. Only build when explicitly asked.
- **Browser errors → `logs/frontend.ndjson`.** When the user reports a browser
  problem, read this file (NDJSON, one event per line) instead of asking them to
  open DevTools. After shipping a fix, truncate it (`: > logs/frontend.ndjson`)
  before asking them to re-test. Missing file = nothing captured yet.

## Quick reference

**Paths:** App `src/App.tsx` · Providers `src/providers/refineProviders.ts` ·
Client `src/taruviClient.ts` · Pages `src/pages/{resource}/` · Components
`src/components/` · Theme `src/theme/themeOptions.ts` · Env `.env`

**Resource dir layout:** `list.tsx` · `create.tsx` · `edit.tsx` · `show.tsx` ·
`index.ts` (barrel). Register in `src/App.tsx` with `name` = the database table
name and `list/create/edit/show` routes + `meta`.

**Environment (`.env`):**
```env
TARUVI_SITE_URL=https://<tenant>.taruvi.cloud
TARUVI_API_KEY=<key>
TARUVI_APP_SLUG=<app-slug>
```
`src/taruviClient.ts` builds the `@taruvi/sdk` `Client` from these; all providers
use it. Run `npm run setup` to generate `.env` + `.mcp.json` interactively.

## Deployment

`npm run deploy` — prompts for the site name, then builds, zips `dist/`, and
uploads to the Taruvi frontend workers API. Requires `TARUVI_API_KEY` and
`TARUVI_APP_SLUG` in `.env`. Inside Docker, `refine build` doesn't work
(symlinked `node_modules`) — `npm run build` already uses
`vite build --configLoader runner`; set `XDG_CONFIG_HOME=/tmp` for refine CLI.

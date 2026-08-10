# CLAUDE.md

Guidance for building on this **Refine v5 + Taruvi** template. Read
[`AGENTS.md`](AGENTS.md) for the shared rules (functional-app default, preflights,
Refine v5 + Taruvi specifics, deployment) — they apply to every agent/IDE.

## You are the coordinator

For a real build, don't implement everything in one thread — but also don't force
a rigid backend→frontend→review chain. That chain is a *dependency line*, not
parallel work: it doesn't save wall-clock, it just adds handoffs. The speed comes
from **planning once, then fanning out across independent resources.**

| Specialist (`.claude/agents/`) | Owns | Loads |
|---|---|---|
| **`taruvi-backend`** | schema, policies, roles, Python functions, SQL | `taruvi-app-developer` skill |
| **`taruvi-frontend`** | Refine/MUI pages, providers, hooks, dashboards, forms | `taruvi-refine-providers` skill + `UI_Guidelines.md` |
| **`ui-ux-reviewer`** | audit built UI vs. design system + WCAG | `UI_Guidelines.md` + theme |

## The flow

**1. Plan once — write the spec yourself (main session).**
Before delegating, produce a short spec and save it to `docs/spec.md`. It is the
**single source of truth** every subagent reads, so parallel builders don't drift.
It lists: each resource, its fields/types/relations, provider `meta` (which
`dataProviderName`, `bucketName`, function slugs), and the page list per resource
(list / show / create-edit / dashboard). This step is what prevents rework —
don't skip it.

**2. Backend once — not per resource.**
Dispatch **one** `taruvi-backend` from `docs/spec.md` to provision *all* schema +
Cerbos in a single pass (schema work is coupled; splitting it causes FK-ordering
pain). It writes the **real table/field/provider names back into `docs/spec.md`**
and reports them.

**3. Frontend fan-out — this is where time is saved.**
Once the schema exists, dispatch `taruvi-frontend` **in parallel, one per
resource** (or per independent page group), each reading `docs/spec.md` +
the real names from step 2. N resources build concurrently instead of serially.
Send them in a single message so they run at once. Each builder writes only its
own `src/pages/{resource}/` dir and returns its Refine `resources` entry —
**you** (the coordinator) then register them all in `src/App.tsx` in one edit,
so the parallel builders never collide on that shared file.

**4. Batch review.**
After the pages land, dispatch `ui-ux-reviewer` over the changed pages; feed its
findings back to the relevant `taruvi-frontend` to fix. Run this while you scope
the next feature — don't block on it.

**5. Relay** a concise summary to the user — subagent reports aren't shown to them.

### When NOT to orchestrate

For a small, single-layer change (tweak one page, add one column, fix one policy)
just do it directly, or dispatch the one relevant specialist. The spec + fan-out
model is for features that span multiple resources or the full schema→UI arc.
Fan out at the **resource** boundary, never the **layer** boundary.

## Two preflights are mandatory (the subagents enforce them)

- **UI / design system:** read [`UI_Guidelines.md`](UI_Guidelines.md), import
  `taruviTokens` from [`themeOptions.ts`](themeOptions.ts), prefer plain MUI,
  use `*Rounded` icons.
- **Taruvi:** read `.agents/skills/taruvi-app-developer/SKILL.md` (backend) or
  `.agents/skills/taruvi-refine-providers/SKILL.md` (frontend) first — never
  implement Taruvi work from memory. Missing? Run `npx -y skills experimental_install`.

Do not run `npm run dev`/`build` — the dev server is already running.

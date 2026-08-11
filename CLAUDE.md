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

**1. Clarify only what changes the shape of the build.**
If the request doesn't say whether it needs role-based access control beyond
default auth, scheduled/automated jobs, external API integrations, or
reporting/analytics beyond a simple filtered list, ask before writing the spec —
these decide whether `taruvi-backend` touches Cerbos policies, roles, functions,
or analytics **at all**, and guessing wrong here costs a rebuild, not a tweak.
Don't ask about things a sensible default already covers (field types, page
layout, naming) — that's surveying, not clarifying.

**2. Plan once — write the spec yourself (main session).**
Before delegating, produce a short spec and save it to `docs/spec.md`. It is the
**single source of truth** every subagent reads, so parallel builders don't drift.
It lists: each resource, its fields/types/relations, provider `meta` (which
`dataProviderName`, `bucketName`, function slugs), and the page list per resource
(list / show / create-edit / dashboard). This step is what prevents rework —
don't skip it.

**Scope the spec to what this build needs — not every capability the backend
skill has.** Plain datatables + default auth are the baseline; add nothing else
unless step 1 confirmed it's needed:
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
change has to route around, and time `taruvi-backend` spends provisioning it.
When genuinely unsure whether something's needed, that's a step-1 question, not
a default-to-yes.

**3. Backend once — not per resource.**
Dispatch **one** `taruvi-backend` from `docs/spec.md` to provision *all* schema +
Cerbos in a single pass (schema work is coupled; splitting it causes FK-ordering
pain). It writes the **real table/field/provider names back into `docs/spec.md`**
and reports them.

**4. Frontend fan-out — this is where time is saved.**
Once the schema exists, dispatch `taruvi-frontend` **in parallel, one per
resource** (or per independent page group), each reading `docs/spec.md` +
the real names from step 3. N resources build concurrently instead of serially.
Send them in a single message so they run at once. Each builder writes only its
own `src/pages/{resource}/` dir and returns its Refine `resources` entry —
**you** (the coordinator) then register them all in `src/App.tsx` in one edit,
so the parallel builders never collide on that shared file.

**5. Offer review — don't run it automatically.**
Once the pages land and are registered, tell the user the build is done and ask
if they want a UI/UX + accessibility review. Only dispatch `ui-ux-reviewer` if
they say yes. It isn't part of the default build loop: since §3/§4.5/§4.6 of
`UI_Guidelines.md` treat a lot of the polish it checks as judgment calls, not
requirements, running it unasked would auto-flag things the user may not want —
and every finding tends to trigger a fix round, which is real time (see the
post-mortem: review itself is cheap, the *fix rounds* it spawns aren't). If they
do want it, feed findings back to the relevant `taruvi-frontend` to fix.

**6. Relay** a concise summary to the user — subagent reports aren't shown to them.

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
  implement Taruvi work from memory. Missing? Run
  `npx skills add Taruvi-ai/taruvi-skills` (they install on `npm install`).

Do not run `npm run dev`/`build` — the dev server is already running.

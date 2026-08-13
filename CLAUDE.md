# CLAUDE.md

@AGENTS.md

Everything above applies to every agent/IDE working in this repo — functional-
app default, plan-before-building discipline, preflights, repo-specific rules,
deployment. What follows is specific to **Claude Code**: how this repo executes
that discipline via a coordinator + subagents, instead of one continuous session.

## You are the coordinator

For a real build, don't implement everything in one thread. Backend runs once.
Frontend also runs once — as a **single agent building every resource
sequentially**, not one agent per resource. Measured comparison: N parallel
frontend agents each pay their preflight (skill + spec) separately — real,
duplicated overhead — while one sequential agent pays it once and stays
consistent across every page it builds (same enum→chip-color mapping, same
patterns, no drift). Plan once so that one agent doesn't have to re-derive
decisions as it moves resource to resource.

| Specialist (`.claude/agents/`) | Owns | Loads |
|---|---|---|
| **`taruvi-backend`** | schema, policies, roles, Python functions, SQL | `taruvi-app-developer` skill |
| **`taruvi-frontend`** | Refine/MUI pages, providers, hooks, dashboards, forms | `taruvi-refine-providers` skill + `UI_Guidelines.md` |
| **`ui-ux-reviewer`** | audit built UI vs. design system + WCAG — runs via CI, not the coordinator (see step 4) | `UI_Guidelines.md` + theme |

## The flow

**1. Plan once — write the spec yourself (main session), not a subagent.**
Per `AGENTS.md` above: clarify first, then write `docs/spec.md`, scoped to what
this build actually needs. Do this yourself in the coordinator session — don't
delegate spec-writing to `taruvi-backend`/`taruvi-frontend`. It's the single
source of truth both agents read, so they agree on exact names instead of
guessing at each other.

**2. Backend once — not per resource.**
Dispatch **one** `taruvi-backend` from `docs/spec.md` to provision *all* schema +
Cerbos in a single pass (schema work is coupled; splitting it causes FK-ordering
pain). It writes the **real table/field/provider names back into `docs/spec.md`**
and reports them.

**3. Frontend — one agent, sequentially, the whole thing.**
Once the schema exists, dispatch **one** `taruvi-frontend` for the entire
frontend — every resource's list/show/create-edit pages plus the dashboard —
in a single continuous session, reading `docs/spec.md` + the real names from
step 2. It registers resources in `src/App.tsx` directly as it goes; there's no
parallel-builder collision to avoid, so no separate batching-at-the-end step.

**4. Don't run review yourself — it happens in CI.**
Review is **not** a coordinator step anymore. `.github/workflows/ui-ux-review.yml`
runs `ui-ux-reviewer`'s checklist automatically on every PR that touches
`src/pages/**` or `src/components/**`, and posts findings as a PR comment —
informational only, it never blocks merge. So: don't dispatch `ui-ux-reviewer`
as part of a build, and don't ask the user if they want one. If a PR isn't open
yet, there's nothing to review; the check runs once they push and open the PR.
(`ui-ux-reviewer.md` still exists as the criteria source the workflow reads —
you can also dispatch it manually if a user explicitly asks for an ad hoc local
review before pushing.)

**5. Relay** a concise summary to the user — subagent reports aren't shown to them.

### When NOT to orchestrate

For a small, single-layer change (tweak one page, add one column, fix one policy)
just do it directly, or dispatch the one relevant specialist. The spec + backend/
frontend split is for features that span the full schema→UI arc — not every
small change needs both agents dispatched.

Preflights (UI/design-system, Taruvi skills), repo-specific rules, and the
dev-server rule are all in `AGENTS.md` above — the subagents enforce them the
same way regardless of which one is dispatched.

# Taruvi UI/UX Guidelines

What the **Taruvi design system** specifies that the MUI theme cannot enforce — page anatomy, ambiguous color choices, accessibility, and the behavior and copy that go with each pattern.

Raw tokens (colors, sizes, radii, shadows, spacing) live in [themeOptions.ts](themeOptions.ts):

```ts
// relative import — adjust the depth to your file; src/theme re-exports the root tokens
import { taruviTokens } from "../../theme/themeOptions";
```

**How this file is organized.** §1–§3 are reference: what the theme already handles, which color to reach for, the accessibility floor. §4 is the working section — one part per thing you build, covering structure, behavior, and copy together. §5–§8 cover icons, navigation, charts, and where files live. §9 is product-level guidance for scoping conversations, not for code.

Each pattern in §4 states what's **required** first, then a short **judgment** note for the calls that depend on context. Required means required — a list page without a search input is incomplete, not a stylistic variation.

---

## 1. Already handled — don't rebuild it

Two kinds of things are already solved. Re-implementing either is the most common defect in generated apps.

**The theme styles components automatically.** Use plain MUI components; don't reproduce these with `sx`.

> **Radii** run ~50% softer than raw design-system values (cards 10px not 16px, buttons 4px not 8px). Values below are what actually renders; "design spec says X" comments in `themeOptions.ts` refer to the original.

| Surface | Spec |
|---|---|
| Type | Open Sans 13px/1.6 body · Quicksand headings (H1 800, H2–H6 700) |
| Buttons | Quicksand 700 UPPERCASE, 4px radius, min-h 28/36/44 — **44px on `(pointer: coarse)`** |
| Chips | Pill, Quicksand 700 UPPERCASE · 4 pastel `tagBlue/tagPurple/tagGreen/tagOrange` variants |
| Cards / Dialogs | 10px radius, 28px padding · card title Quicksand 600 12px UPPERCASE |
| Inputs | 6px radius, `#F3F3F5` fill, 12×16 padding, **16px font** (blocks iOS zoom-on-focus), 2px focus ring, 11px helper/error |
| Tables + DataGrid | 8px wrapper, head 11px Quicksand 700 UPPERCASE, cells 13px 12×16, hover `primary-50`, selected = `primary-50` + 2px primary left border |
| Everything else | Accordion (flat, 6px) · Alert (4px left border) · Tabs (3px indicator) · Sidebar active `#1976d2` · Tooltip `#121414` · Skeleton wave · Avatar 34×34 |

**One repo behavior belongs here** — the rest (notifications, unsaved-changes
guard, URL-synced filters, server-side search, browser-error logs) are
architecture/wiring facts, not design-system ones; they live in
`taruvi-frontend.md` and `AGENTS.md` so they're stated once, not duplicated.

| Behavior | Wire it through |
|---|---|
| Page padding | A consistent page-padding wrapper applied once — don't hand-roll a `<Container>` per page. |

---

## 2. Color — three greens, three blues, two oranges

Intentional separation of *brand* tones, *operational status* tones, and *chart* tones.

| Family | Token | Hex | Use for |
|---|---|---|---|
| Green | `success[500]` | `#10B981` | Brand emerald — illustrations, swatches |
| | chip/alert success | `#388e3c` | Status chips, success alerts (already wired) |
| | `status.resolved` | `#008751` | **Charts only** |
| Blue | `primary[700]` | `#1AB3E6` | Brand sky — illustrations, accents |
| | `button.primaryDefault` | `#1E88E5` | Primary buttons + focus ring (see §3 gaps) |
| | `status.inProgress` | `#1976d2` | Status chips, sidebar active, info alerts, links |
| | `status.chartPrimary` | `#1e88f5` | **Charts only** |
| | `surface.navBlue` / `navDark` | `#2b97ff` / `#004369` | Hero gradient, NavKit variants, footer |
| Orange | `status.review` | `#f57c00` | Status chips, warning alerts |
| | `status.underReview` | `#FF8C00` | **Charts only** |

**Rule of thumb:** UI affordances (chips, alerts, buttons, sidebar) use the `chip/status` tone; charts use the `chart` tone. Import `taruviTokens` — never hardcode a brand hex.

### Status & tag chips

| Status | Usage |
|---|---|
| COMPLETE / ACTIVE | `<Chip color="success" label="COMPLETE" />` |
| IN PROGRESS | `<Chip color="info" label="IN PROGRESS" />` |
| REVIEW / PLANNING | `<Chip color="warning" label="REVIEW" />` |
| DELAYED / CANCELLED | `<Chip color="error" label="DELAYED" />` |
| ON HOLD | `<Chip label="ON HOLD" sx={{ bgcolor: taruviTokens.status.onHold, color: '#fff' }} />` (white on `#7b1fa2` = 8.20:1) |
| TO DO | `<Chip label="TO DO" sx={{ bgcolor: taruviTokens.status.todo, color: taruviTokens.text.primary }} />` — **dark** label: `#00acc1` is a light fill, and white on it is only 2.74:1 |

> **Both `sx` chips carry a measured label color, not a reflexive `#fff`.** A mid-light fill needs a dark label. If you add a fill here, measure it — don't pattern-match the row above.

**Priority** — outlined: `<Chip variant="outlined" color="error|warning|success" label="HIGH|MEDIUM|LOW" />`. The theme supplies the outlined label/border tone per color and per mode; don't set `color` or `borderColor` by hand.

**Category / tag** — pastel rotation, no `sx` needed: `<Chip variant="tagBlue" label="Design" />` (+ `tagPurple` / `tagGreen` / `tagOrange` / `tagTeal` / `tagPink` / `tagLime` / `tagRose`). Eight variants, so a tenant with more than four categories still gets a distinct preset each. For deterministic rotation, hash the tag name to an index into those eight with a small `tagVariant()` helper whose order matches `taruviTokens.tagPalette[i]`. Only ever **append** to that palette; reordering repaints every existing tag.

Every chip carries a text label — status is never a colored dot or bare fill. Deletable chips name their delete control: `deleteIcon={<CloseRoundedIcon aria-label="Remove Status filter" />}`.

> **Judgment** — don't use the tag rotation palette for status. Rotation means "different from each other"; status means "different in severity."

---

## 3. Accessibility floor

Every page satisfies these. They're the WCAG items MUI does *not* give you free.

- **Semantic element for the job** — `<button>` for actions, `<a>`/`<Link>` for navigation. Never a click handler on `Box`/`div`.
- **One `<h1>` per page.** `variant` is visual, `component` is semantic — `<Typography variant="h2" component="h1">` for a page title, `component="p"` for a stat number. Never skip levels.
- **Icon-only controls carry a real name** — `<IconButton aria-label="Delete project">`. A `<Tooltip>` is not an accessible name.
- **Color never carries meaning alone.** Status chips carry text, charts carry labels or patterns, errors carry icon + text.
- **Content text never uses `text.disabled`** (2.8:1, fails AA). Use `text.secondary`. `text.disabled` is for genuinely disabled controls.
- **Errors announce** — `role="alert"` on error messages so failures aren't silent to screen readers.
- **Never remove focus outlines** without a `:focus-visible` replacement.
- **Touch targets ≥ 24px, primary actions ≥ 44px.** `size="small"` `IconButton` is 30px — fine in a dense table row, not for a primary mobile action.
- **Landmarks present** (`<main>`, `<nav>`, `<header>`), `document.title` updates on route change.
- **Modals** get `aria-labelledby` pointing at the `DialogTitle` id. MUI handles the focus trap and Esc; it does not wire the label.

> **Beyond the floor — judgment, not required.** Worth it on tools that warrant the polish, optional on everyday internal apps: `aria-live="polite"` announcements for toasts / save confirmations / result & selection counts, and a skip link first in tab order. Dropping these means an app isn't *strictly* WCAG-AA on status messages (4.1.3) and bypass-blocks (2.4.1) — a fine trade for internal tooling, but make it a deliberate one.

**Token-level contrast is handled.** `themeOptions.ts` tokens meet WCAG AA —
use them as-is, don't re-patch contrast per component.

**Two things to know about the blue accent and fill/label pairing:**

- The blue accent has **three** jobs, and they are not interchangeable. `button.primaryDefault` (`#1E88E5`) is **non-text only** — rings, borders, tab indicator, control fills, where 3:1 is the bar. `button.primaryFill` (`#1976d2`) is the **fill** behind white text — contained primary buttons, `palette.primary.main`. `button.primaryHover` (`#1565C0`) is the **foreground** tone — link text, text/outlined button labels, selected tabs, focused field labels — with a light `primary[300]`-class tone standing in for it in dark mode. The theme already routes all three; don't reach past them.
- **Pick a foreground tone that passes on the page background and on a hovered row, not just on paper.** `#1976d2` is 4.60:1 on `paper` but 4.18:1 on `background.default` and 4.39:1 on a hovered `primary[50]` row — and in-row links, chart-legend links and toolbar text buttons all live on those surfaces. A tone that only passes on paper is a latent failure that reappears on hover, which is exactly what a one-off audit won't catch twice.
- A **fill's** contrast requirement depends on the label sitting on it, and a light-to-mid fill (`status.todo`, `status.review`) needs a **dark** label. Measure the pair; don't default to `#fff`.

Full accessibility auditing is handled by the **ui-ux-reviewer** agent ([`.claude/agents/ui-ux-reviewer.md`](.claude/agents/ui-ux-reviewer.md)) — it runs automatically as a GitHub Action ([`.github/workflows/ui-ux-review.yml`](.github/workflows/ui-ux-review.yml)) on every PR touching `src/pages/**` or `src/components/**`, posting these WCAG items (plus mobile targets) as a PR comment. Informational only, never blocks merge.

---

## 4. Patterns

### 4.1 List page

```
┌────────────────────────────────────────────────────────────────────┐
│  H1 "Projects" ……………………………………………………  [+ Create New]  │
├────────────────────────────────────────────────────────────────────┤
│  [ 🔍  Search…              ]   [Status ▾] [Owner ▾]      ⋮       │
├────────────────────────────────────────────────────────────────────┤
│  [Status: Active ×]  [Owner: me ×]                     Clear all   │
├────────────────────────────────────────────────────────────────────┤
│  …rows…                                                            │
│             Rows per page: 10  ·  1–10 of 234   <  >               │
└────────────────────────────────────────────────────────────────────┘
```

**A list page is not just a styled `<Table>`.** Required, no exceptions even for small datasets:

1. **Page heading** `<Typography variant="h2" component="h1">` + primary action right-aligned. Visually H2, semantically the page's only H1.
2. **Search input**, bound to a server-side `search` filter, debounced 300–500ms. It needs a real `label` even when the design shows none (visually hidden is fine) — a placeholder is not a label. Full width on `xs`, 280–320px on `sm+`.
3. **At least one filter control**, pushed into Refine's `filters[]`.
4. **Active-filter chip row** when ≥1 filter is set — `<field>: <value>`, `×` removes one, "Clear all" resets filters and keeps search.
5. **Server-side pagination**, default 10 rows, via `useTable`/`useDataGrid`.
6. **All four empty states** (§4.5), selected via `totalCount === 0 && filters.length === 0 && !search`.
7. *(Judgment, not required — see §3 "Beyond the floor")* **Result count announced** — an `aria-live="polite"` region reporting `{total} results` so search and filter changes aren't silent to screen readers. Recommended on tools that warrant it; optional on internal apps.

Row hover and selected states are theme-wired; leave them alone.

**Composition — one section, not three.** Everything above lives inside a *single*
card: heading and primary action in the header, then the toolbar row, then the
active-filter chip row, then the rows. Do **not** split the toolbar and the grid
into separate `<Paper>` blocks, and do not leave the toolbar or grid with no
container at all.

**Grid height: `autoHeight`, never a fixed pixel height.** The grid grows with
its rows so the page scrolls as one document, rather than nesting a scroll area
inside an already-scrolling page. One catch, already handled centrally: MUI
collapses DataGrid *overlays* to 0px under `autoHeight`, which silently hides the
loading skeleton and every empty state rendered via `slots.noRowsOverlay`. The
theme's `MuiDataGrid` override reserves `--DataGrid-overlayHeight`, so don't set
it per page — and don't "fix" a blank-looking overlay by pinning a height.

**Use `<ListPageShell>`** from [`src/components/ListPageShell.tsx`](src/components/ListPageShell.tsx),
which wraps Refine's `<List>` from `@refinedev/mui` and owns the page padding,
the H1, the create button, the toolbar row and the chip-row spacing. Pass the
search/filter controls as `toolbar` and the grid as `children`:

```tsx
<ListPageShell
  title="Contacts"
  createLabel="New contact"
  toolbar={<>{searchField}{statusFilter}{companyFilter}</>}
  activeFilters={activeChips}      // omit/null when no filter is set
>
  {gridOrEmptyState}
</ListPageShell>
```

Don't wrap the toolbar controls in your own `<Stack>` or `<Paper>` — the shell
supplies the row layout so every list wraps identically at every breakpoint.

**Toolbar** — search `<TextField size="small">` with `SearchRoundedIcon` start adornment (`aria-hidden`) + clear `<IconButton aria-label="Clear search">`; filters `<Button variant="outlined" startIcon={<FilterListRoundedIcon />}>`; active chip `<Chip variant="outlined" color="primary" onDelete>`; "Clear all" as `<Button size="small" variant="text">`. Don't override the theme's 16px input font.

**Implementation — defer to the skill.** This file owns the visual contract. Refine wiring (`useDataGrid` vs `useList`, server-side `filters[]`, `meta.search`, pagination, `noRowsOverlay`) lives in [`taruvi-refine-providers`](.agents/skills/taruvi-refine-providers/SKILL.md).

> **Judgment** — the search placeholder should describe scope ("Search projects by name or owner…") so the user knows what's being matched. Applied filters and result counts stay visible while browsing, so nobody wonders why the list is short. Any list a user can't scan in one screen earns search; structured data earns filters. Sort and column preferences are worth persisting if users return to the same view repeatedly.

### 4.2 Detail / show page

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📁 Projects / Website Redesign                                      │ ← Breadcrumb (current = bold)
│ H1 Website Redesign    [IN PROGRESS]      [Edit] [Delete] [⋮]      │ ← Title · status · actions
│ Mar 1 – Jun 30, 2026 · Owner: Sarah Johnson                         │ ← Meta line, body2 secondary
│ [ Overview ]  [ Tasks (12) ]  [ Files (4) ]  [ Activity ]          │ ← Tabs (label + count)
└─────────────────────────────────────────────────────────────────────┘
```

Required: breadcrumb in `<nav aria-label="Breadcrumb">` with the current item marked `aria-current="page"` · H1 title (`variant="h2" component="h1"`) with the status chip beside it · Edit/Delete/More right-aligned, Delete routing through §4.4 · meta line below the title (`body2`, `text.secondary`) · tabs labelled `Label (count)` for related data, each tab body carrying its own empty state (§4.5) and loading state (§4.6).

Use Refine's `<Show>` from `@refinedev/mui` for the header scaffold.

**Anti-pattern**: a bare `<Stack>` of `Name: …` / `Status: …` rows. That's a field dump, not a detail page.

### 4.3 Forms

Single-column by default; two columns only for genuinely paired inputs (Start/End, City/Country).

**Vertical rhythm** (`taruviTokens.spacing.*`): label→input 8 · input→helper 4 · field↔field 16 · section↔section 32 · actions mt 24 · Cancel↔Save gap 10.

**Section title** — Quicksand 600 13px UPPERCASE 0.05em, `color: 'text.secondary'`, **`component="h2"`** so it lands in the heading outline, `mt: 4, mb: 1.75`.

> **Why `h2` and not `h3`.** A form page's only other heading is its `<h1>` page title — Refine's `<Create>` / `<Edit>` card contributes none — so the section titles are peers sitting *directly* under that `<h1>`. They all belong at the same level, and that level is `h2`; an `h3` here skips a level, which §3 forbids. Reach for `h3` only when there is a genuine intervening `h2` above it (a subsection inside an already-`h2`-titled section).

**Two-column row** — `<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>` (stacks on mobile).

**Actions** — Cancel outlined left, primary contained right, right-aligned.

Required:

- Every input has a **visible label above it**. Placeholder is never the only label, and never an instruction — it's an example (`e.g. jane@acme.com`).
- Correct **`type` / `inputmode`** so mobile opens the right keyboard — `email`, `tel`, `url`, `inputmode="numeric"` for codes. Set `autocomplete` tokens; mobile autofill is a motor accommodation.
- Related radios/checkboxes wrapped in `<FormControl component="fieldset">` + `<FormLabel component="legend">`.
- **Validate on blur** — not per keystroke, not only on submit.
- **Entered data survives a failed submit.** Clearing fields on error is never acceptable.
- Errors name the fix, not just the problem: "Enter a date after today", never "Invalid input". Invalid fields carry `aria-invalid`; on submit, focus moves to the first error and a summary announces via `role="alert"`.
- Optional fields marked `(Optional)`; required marked in text, not asterisk-color alone.
- Tab order matches visual order; `Enter` submits.
- The submit button **names the outcome** — "Create account", not "Submit" — and disables once the request starts so double-submit is impossible.
- A disabled submit explains what's missing, or stays enabled and validates on click. A dead button with no reason given is a bug.

`<TextField label>` wires `htmlFor`; `helperText` + `required` give `aria-describedby` + `aria-required`. Wire those by hand only for custom fields. Collapsible groups use a plain `<Accordion>`.

> **Judgment** — constrain before validating: date pickers over free text, selects for finite sets, masks for known formats. Ask only for what's needed now and defer optional collection. Long forms chunk into labeled sections or steps with the count visible — multi-step beats one long scroll on mobile. Advanced options belong behind progressive disclosure. Smart defaults are worth the effort on any field the app can reasonably guess. Field width can signal expected length.
>
> Taruvi auth is redirect-based via `LoginRedirect`. If you're building credential forms, password strength meters, or username-availability checks, check the auth provider first — you've probably taken a wrong turn.

### 4.4 Destructive actions

**Every destructive action — delete, archive, force-remove, bulk-delete — goes through a confirmation dialog.** `useDelete` wired straight to an icon click is a bug, and `window.confirm()` is never the answer.

```tsx
<Dialog open={confirmOpen} onClose={close} maxWidth="xs" fullWidth aria-labelledby="confirm-title">
  <DialogTitle id="confirm-title">Delete project?</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete <strong>"{project.name}"</strong>? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button variant="outlined" onClick={close}>Cancel</Button>
    <Button variant="contained" color="error" startIcon={<DeleteRoundedIcon />} onClick={handleDelete}>
      Delete project
    </Button>
  </DialogActions>
</Dialog>
```

Required: `aria-labelledby` points at the title id · title is the real question ending in `?`, not "Confirm" or a statement · body names the specific item or the exact count, states the consequence, and ends "This action cannot be undone" · cascades are named ("…and its 12 tasks") · primary button is `color="error"` labelled with the verb, never "OK" or "Yes" · Cancel is outlined, on the left.

**Bulk variant**: title `Delete 5 projects?`, CTA `Delete 5 projects` — the count gets re-read immediately before the click.

> **Judgment** — friction should scale with severity. Type-to-confirm is for irreversible bulk or account-level actions, not routine deletes. For frequent reversible actions, an undo window beats a dialog; confirmation fatigue defeats confirmation.

### 4.5 Empty states

**Required (floor):** never a blank list — every list has at least an *empty* state (nothing here yet) and an *error* state (couldn't load), each with a heading and a next action.

**Judgment — the full four-variant treatment.** Distinguishing the states below by trigger is better UX where it's worth it; a single generic "no data" for all four is a defect *once you've opted into the distinction*. Two states (empty / error) is an acceptable floor for internal apps.

| Variant | When | Icon | CTA |
|---|---|---|---|
| **No data yet** | `total===0 && !search && !filters` | `FolderOpenRounded` | contained `+ Create <resource>` |
| **No results found** | search active, 0 rows | `SearchOffRounded` | outlined `Clear search` |
| **No matching items** | filters active, 0 rows | `FilterListRounded` | outlined `Clear all filters` |
| **Unable to load** | `isError` | `ErrorRounded` (error color) | contained `Try again` |

```tsx
<Box role="status" sx={{ textAlign: 'center', py: 5, px: 2.5, color: 'text.secondary' }}>
  <Icon aria-hidden="true" sx={{ fontSize: 48, mb: 1.5, display: 'block', mx: 'auto' }} />
  <Typography variant="h5" component="p" sx={{ mb: 0.75 }}>{heading}</Typography>
  <Typography variant="body2" sx={{ mb: 2 }}>{body}</Typography>
  {cta}
</Box>
```

`role="status"` announces the transition; the error variant uses `role="alert"`. The icon is decorative — `aria-hidden`, since the heading already says it. The heading uses `component="p"` (or a heading level that fits the outline), not a floating `variant="h5"`.

**Anti-pattern**: a search miss followed by a "+ Create" CTA. Telling someone with 400 records that they have none is worse than saying nothing.

> **Judgment** — the first-run empty state should teach: what this area is for, plus the action that fills it. "No invoices yet — Create your first invoice." The error variant says what failed and offers retry, not a generic apology.

### 4.6 Loading states

**Required (floor):** never leave a region blank while data loads — show *something* (a skeleton or a spinner).

**Judgment — which variant.** The mapping below is the recommended default; picking skeleton vs. spinner overlay vs. inline is a judgment call, not a mandate.

| Variant | Use when | How |
|---|---|---|
| **Skeleton** | Initial load (`isLoading`) | `<Skeleton variant="text" />` per cell, or `variant="rounded" height={180}` per card |
| **Spinner overlay** | Refetch >300ms (`isFetching`) | Centered `<CircularProgress />` inside the card, not full-screen |
| **Inline button spinner** | Async submit | `<Button disabled={isSubmitting} startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}>` |

Skeletons are invisible to screen readers — put `aria-busy="true"` on the container and let the result-count live region (§4.1) announce completion. The wave animation respects `prefers-reduced-motion`.

**Anti-patterns**: `"Loading..."` text alone · a full-screen `<Backdrop>` for a 400ms query · a spinner over data already fetched.

> **Judgment** — anything past ~2s should indicate progress; past ~10s, determinate progress or a step count. Skeletons that match the final layout shape prevent the content jolting into place. Waiting copy that sets expectation ("This can take a minute…") is worth adding on genuinely slow operations. Background or async work needs a findable status somewhere — a toast that vanished is not a record.

### 4.7 Tables

| Column type | Align | Format / behavior |
|---|---|---|
| **Text** | Left | Ellipsis + `<Tooltip>` with full value |
| **Number / Currency / Percentage** | Left | `$5,000,000` · `87%` · `1,234` |
| **Date** | Left | `MMM DD, YYYY` — never raw ISO, never two formats in one table |
| **Status** | Left | `<Chip>` from §2 — never a colored dot or bare text |
| **Selection** | **Left** edge | First column, fixed narrow |
| **Actions** | **Right** edge | Last column, fixed narrow |
| **Avatar + name** | Left | 30px avatar + name on one line; link to the show page rather than a row click |

**List rows are left-aligned horizontally and centered vertically.** Values hug
the leading edge of their column, headers sit on the same edge as the values
under them, and everything — text, chips, multi-element cells — sits in the
middle of the row height. Don't set `align`/`headerAlign` per column to achieve
this; it's the default. Set them only to deviate: the actions column at the
trailing edge, selection at the leading edge.

**How the vertical centering works, and the one thing it costs you.** DataGrid v7
makes `.MuiDataGrid-cell` a flex *item* of the row, not a flex container. The
theme's `cell` slot adds `display: flex; align-items: center; line-height:
inherit` to every cell — the same thing MUI's own `column.display: "flex"` does,
applied once instead of per column — which is what centers a cell's contents
vertically, **including block-level children**: several `renderCell`s return a
`<Stack>`, which would otherwise sit at the top of the row. Horizontal alignment
is left entirely to v7's own `justify-content` on
`cell--textLeft/Center/Right`, so left is the default and `align: "center"` or
`"right"` still work per column.

Cells carry **horizontal padding only** (`0 16px`, matching `MuiTableCell`). v7
centers inline content with `line-height: calc(var(--height) - 1px)`, so vertical
padding on a cell pushes its text *down* rather than centering it.

The cost of flex cells: a cell no longer lends its own `text-overflow: ellipsis`
to a bare string child. **Any column whose text can outgrow its width must
ellipsize in its own element** — wrap it in `<Box component="span" sx={{
overflow: "hidden", textOverflow: "ellipsis" }}>` or use `<Typography noWrap>`.
Fixed-width short values (dates, counts, chips) need nothing. Without a wrapper,
long text hard-clips at the cell edge with no ellipsis.

> **Judgment** — left-aligned text is the convention because a common leading
> edge is what makes a column scannable: the eye tracks one vertical line instead
> of re-finding each value's start. Centering was tried here and reverted for
> exactly that reason — with ragged-length values (subjects, emails) every row
> starts somewhere different, and ellipsized text starts at a different offset on
> every row. If you have several numeric columns meant for magnitude comparison,
> right-aligning those is a defensible deviation — but apply it to that whole
> table, not one column in isolation.

```tsx
const columns: GridColDef[] = [
  // A flexible text column truncates in its own element — see the note above
  { field: "name", flex: 1.2, renderCell: (p) => (
    <Tooltip title={p.value}>
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.value}</Box>
    </Tooltip>) },
  { field: "due", width: 140, valueFormatter: (v) => v ? format(new Date(v), "MMM dd, yyyy") : "—" },
  { field: "amount", width: 140, align: "right", headerAlign: "right",
    valueFormatter: (v) => v != null ? `$${v.toLocaleString()}` : "—" },
  { field: "actions", type: "actions", width: 120, align: "right",
    // `label` is the accessible name — required, not optional
    getActions: (p) => [<GridActionsCellItem icon={<EditRoundedIcon />} label="Edit project" onClick={…} />] },
];
```

Every action in the actions column needs an accessible name — `GridActionsCellItem`'s `label`, or `aria-label` on a hand-rolled `IconButton`. A tooltip doesn't count. Empty cells render an em-dash `—`, never `null` or blank.

A table that collapses to `<div>` cards below `sm` loses its header association — either keep table semantics and scroll horizontally, or render each card as a definition list with visible field labels.

> **Judgment** — 5–6 visible columns is the sweet spot. Beyond that, add a column picker or move secondary data to the detail page.

### 4.8 Bulk actions toolbar

**A list with selection checkboxes needs a bulk-actions toolbar.** Checkboxes without one are dead controls.

```
┌────────────────────────────────────────────────────────────────────┐
│  3 items selected                          [ Export ] [ Delete ] × │
└────────────────────────────────────────────────────────────────────┘
```

```tsx
{selectedIds.length > 0 && (
  <Box aria-live="polite" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText',
    borderRadius: 1.25, px: 2, py: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Typography sx={{ flex: 1, fontWeight: 600 }}>{selectedIds.length} items selected</Typography>
    {/* actions… outlined, borderColor rgba(255,255,255,0.7) */}
    <IconButton aria-label="Clear selection" sx={{ color: 'inherit' }} onClick={clear}>
      <CloseRoundedIcon />
    </IconButton>
  </Box>
)}
```

Appears only when ≥1 row is selected · always shows the count, in an `aria-live="polite"` region · clear-selection control has `aria-label` · destructive bulk actions route through §4.4 with the count in the dialog body · outlined-on-blue borders use `rgba(255,255,255,0.7)`, since `0.5` fails 3:1.

> **Judgment** — three actions max before overflowing to `⋮`. The bar sits above or below the list, not floating. Offer select-all and per-item deselect. If the bar lives inside a card and full-blue feels loud, swap `primary.main` for `primary.50` with text buttons.

### 4.9 Entity card

Same data as a row, different framing. Use when records are mobile-first, drag-ordered, or richer than scalars.

```
┌────────────────────────────────────┐
│  Title (H5)                      ⋮ │
│  Short description (body2 muted)   │
│  [IN PROGRESS] [HIGH] [Design]     │ ← status + priority + tag chips
│  Due: Mar 30, 2026     ✎ 🗑        │
└────────────────────────────────────┘
```

Structure: `<Card><CardContent>` → title row (`Typography variant="h5"` + overflow `IconButton`) → description (`body2`, `text.secondary`) → chip `Stack` with `flexWrap` → footer row (due date + edit/delete `IconButton`s).

Every card `IconButton` names its record — `aria-label="Delete Website Redesign"`, not just "Delete". The card title uses a `component` that fits the page outline (under the H1, `component="h3"`). If the whole card navigates, wrap it in `<CardActionArea>` and nest no other buttons inside. Drag-to-reorder needs a keyboard and tap alternative — move up/down in the overflow menu.

> **Judgment** — rows for scanning many records by column where sort and filter are primary; cards for one-at-a-time context, kanban, drag-and-drop, or records with images and long text. Pick one per view; don't mix.

### 4.10 Stat / KPI card

A plain themed `<Card>`: number is the hero, label above, left-aligned. **No colored accent border** (the 4px left border is `<Alert>`-only) and **no decorative icon puck**.

```tsx
<Card>
  <Typography variant="body2" color="text.secondary" id="open-rcas-label">Open RCAs</Typography>
  <Typography variant="h3" component="p" aria-labelledby="open-rcas-label"
    sx={{ fontFamily: 'Quicksand', fontWeight: 700 }}>{openRcas}</Typography>
</Card>
```

`component="p"` — a KPI number is not a heading. If the number's color carries meaning (red = over threshold), the label or a chip says so in text. If the tile navigates, wrap in `<CardActionArea>`; the only icon is a trailing chevron.

### 4.11 Mutations — the feedback arc

Every create, update, and delete follows the same arc: **acknowledge → in-flight → outcome**. A missing stage is a bug.

- Acknowledge within ~100ms — pressed state, spinner, or optimistic change. Nothing feels dead.
- Anything past ~300ms shows a loading state; the button enters in-flight ("Saving…" + spinner) and disables for the duration.
- Every mutation confirms visibly — notification, inline state change, or a redirect readable as success. Silent success is a defect.
- Failures say what happened and what to do next. Never a raw error code, stack trace, or HTTP status to an end user.

Feedback goes through `useNotificationProvider`. Confirmation copy states the outcome, not the mechanism: "Invoice sent to 3 recipients", not "Mutation successful".

> **Judgment** — optimistic UI suits high-success, low-stakes mutations (toggle, reorder, like) with rollback on failure. Long user-initiated operations — upload, export, slow search — should be cancellable.

### 4.12 Flow & navigation

- **Every flow has a visible exit** — cancel, close, or working back navigation.
- **Browser back behaves.** Modals and drawers close, wizard steps step back, no broken intermediate state.
- **Multi-step flows go backward without losing entered data.**
- **Session expiry preserves work** — draft retained, re-auth in place, no silent data loss.
- **Current location always clear** — active nav state, breadcrumbs on deep hierarchies, accurate page title.
- **Never a modal opened from a modal.** Stacked dialogs have no coherent escape.
- **Nothing auto-advances, auto-plays, or auto-refreshes** without user control.
- **Error and 404 pages offer a path forward** — home link, search, or a relevant suggestion.

> **Judgment** — one pattern per job across the app; don't mix modal-confirm and undo-toast for the same class of action. One primary action per screen, with secondary actions visually subordinate. Destructive actions visually distinct and physically separated from the primary. Interactive things look interactive and static things don't. Disabled controls explain themselves. Surface recently and frequently used items where history exists.

---

## 5. Icons

**Icons are affordances, not decoration.** Add one only when it's tied to an action or control — button, link, menu, sort toggle, search adornment. Decorative glyphs on stat tiles, section headers, and card corners are what make a page read as machine-generated. The one exception is the empty-state illustration (§4.5).

```tsx
import EditRoundedIcon from '@mui/icons-material/EditRounded';   // ✅
import EditIcon from '@mui/icons-material/Edit';                  // ❌ filled, wrong weight
```

**Sizes**: inline 20px · standard 24px (MUI default) · feature/empty-state 32px+.

Decorative icons are `aria-hidden`; meaningful ones carry `titleAccess` or a labelled parent. Pair icons with labels unless universally understood (search, close, trash), and never let the same icon mean two things.

---

## 6. NavKit & sidebar

NavKit (`@taruvi/navkit`) ships three variants — Blue `#2b97ff` (default), White (`#fff` + `#e5e7eb` border), Dark `#004369` (accent `#9de5fd`). Pick it in NavKit's `getTheme` callback in [`src/App.tsx`](src/App.tsx), not the MUI theme.

Sidebar widths are constants in [`src/components/sidenav/MuiSidenav.tsx`](src/components/sidenav/MuiSidenav.tsx): collapsed 72px, expanded 240px. NavKit profile-menu items each need a unique `title`, an `icon`, and a `callBackFunc` — wire them through `<Navkit profileMenuItems={…} />`. Internal apps must include the standard **Report an issue** item ([`docs/standard-tasks.md`](docs/standard-tasks.md)).

Required: nav wrapped in `<nav aria-label="Main">` with the active item `aria-current="page"` · collapsed icon-only items keep their text as accessible name · the closed mobile drawer leaves the a11y tree (`inert` or `display:none`, not translated off-screen) · the hamburger carries `aria-expanded`, `aria-controls`, and a name · when desktop and mobile nav both exist in the DOM, only one is exposed to assistive tech at a time.

---

## 7. Charts

```tsx
// taruviTokens.status — never hardcode these
const chartColors = {
  open: '#19b3e5', inProgress: '#1976d2', underReview: '#FF8C00', resolved: '#008751',
  delayed: taruviTokens.status.delayedAlt, onHold: taruviTokens.status.onHoldAlt,
  primary: taruviTokens.status.chartPrimary,
};
```

**Labeling**: legend top-right or bottom-center, Open Sans 12px, 12×12 markers · axis labels Open Sans 11px, Y starts at 0 · gridlines `#e0e0e0` 1px dashed · title Quicksand 600 16–18px top-left · subtitle Open Sans 12–13px `#666`.

A chart is a complex image and color-coded data, so:

- Wrap it in `role="img"` with an `aria-label` stating the takeaway, not the chart type — "Ticket status, Q2 2026: 42% resolved, 31% in progress".
- Provide the underlying data as a `<table>` below the chart (collapsible via an Accordion) or a `<figcaption>` summary. This is the accessible alternative, and it's usually what users wanted anyway.
- Distinguish series by a second channel besides color — direct labels, dash patterns, texture/pattern fills, distinct marker shapes. A legend that only maps color to name fails for color-blind users. Repeat the second channel **in the legend swatch**, or the mapping doesn't close.
- Keep each series at **3:1 against the background**. Do **not** try to hold 3:1 between every pair of series fills — WCAG contrast is luminance-only, so forcing that across 5+ categorical series forces a light-to-dark luminance ramp, which is by definition a *sequential* palette and destroys the hue coding that makes a categorical chart readable. It is unsatisfiable rather than merely difficult: no choice of hues fixes it. Separate series with the non-color channel above instead, and pick the texture/overlay tone for contrast against its own fill.

> **Judgment** — don't "fix" a categorical palette by nudging hues toward each other's families either. Hue-aligning two statuses to match their chip tones can *lower* the pair's ratio and simultaneously put them in the one hue family a deuteranope can least separate — worse on both counts. Measure before swapping.
- Never put data in a hover tooltip that exists nowhere else; tooltips are unreachable on touch.

---

## 8. Where things live

| What | Where |
|---|---|
| Color ramps, sizes, radii, paddings, shadows | [themeOptions.ts](themeOptions.ts) — `taruviTokens` |
| MUI component overrides | [themeOptions.ts](themeOptions.ts) — `componentOverrides(mode)` |
| Active theme provider | [src/contexts/color-mode/index.tsx](src/contexts/color-mode/index.tsx) |
| Global font loading | [index.html](index.html) |
| Global body / scrollbar styles | [src/App.tsx](src/App.tsx) — `<GlobalStyles>` |
| Page padding | Applied once at the app shell — keep it consistent, don't hand-roll per page |
| Sidebar geometry | [src/components/sidenav/MuiSidenav.tsx](src/components/sidenav/MuiSidenav.tsx) |
| Brand cover (Home) | [src/pages/home/index.tsx](src/pages/home/index.tsx) |
| Refine wiring for lists | `.agents/skills/taruvi-refine-providers/SKILL.md` |
| Accessibility audit | **ui-ux-reviewer** · `.claude/agents/ui-ux-reviewer.md` · runs via `.github/workflows/ui-ux-review.yml` on every PR |

When you need a value the theme doesn't surface, import `taruviTokens` rather than hardcoding hex — it keeps the design system traceable.

---

## 9. Product-level guidance

Not evaluable from a component file. These belong in scoping conversations and design review — and they're worth pushing back with when a request conflicts with them.

**Trust** — pricing, limits, and consequences visible before commitment, never a surprise at the final step · accept and decline get equal prominence, no giant "Yes" beside a hidden "no thanks" link · cancellation as easy as signup, no forced chat or call · no confirm-shaming ("No thanks, I hate saving money") · pre-checked boxes never used for consent, marketing, or paid add-ons · data collection explained at the point of asking · opt-outs honored immediately and granularly · countdown timers and scarcity claims only when literally true.

**Information architecture** — top-level nav ≤7 items, labelled with nouns users recognize rather than internal terms · core tasks reachable in three clicks, frequent tasks one click from home · account, billing, and logout findable within two clicks · settings organized by user goal and searchable when extensive · onboarding skippable and resumable, never forced · value shown before forced account creation where the domain allows it.

Basis: Nielsen's usability heuristics, platform HIG conventions, standing industry practice.

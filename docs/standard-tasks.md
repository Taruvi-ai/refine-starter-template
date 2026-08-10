# Standard Tasks for Internal Apps

Features every **internal** Taruvi app should ship. Each task below is a
self-contained, **idempotent** prompt — safe to run more than once. When building
or maintaining an internal app, apply the ones that aren't present yet.

> New apps built from the current template inherit these by default (see each
> task's "Template baseline" note). The prompts exist to **retrofit** apps that
> predate the feature.

---

## 1. Report an issue (Navkit profile menu)

Adds a **Report an issue** item to the Navkit avatar dropdown that opens the
Taruvi helpdesk in a new tab so users can file a support ticket.

**Template baseline:** the base template currently wires `<Navkit client=… getTheme=… />`
**without** `profileMenuItems`, and has no `src/navkit/useNavkitProfileMenuItems.tsx`.
So this prompt **creates** that file and adds the `profileMenuItems` prop to
`src/App.tsx` (step 4's "do not change App.tsx" applies only once the wiring
already exists). Bake it into the template and every new app inherits it.

### Goal

Add a **Report an issue** item to the Navkit avatar dropdown. Clicking it opens
the Taruvi helpdesk in a new browser tab so the user can create a support ticket.

### Prerequisites

This app is based on the Taruvi Refine template and wires Navkit via
`useNavkitProfileMenuItems` → `<Navkit profileMenuItems={...} />` in `src/App.tsx`.

### Steps

1. **Ensure `@taruvi/navkit` supports `profileMenuItems`**
   - Check `package.json` for `@taruvi/navkit`.
   - If the version is below `0.0.49` (or missing / not resolving to ≥ `0.0.49`),
     upgrade: `npm install @taruvi/navkit@latest`
   - Confirm the installed version is **≥ 0.0.49**.

2. **Add the menu item (only if missing)**
   - Edit `src/navkit/useNavkitProfileMenuItems.tsx`.
   - If an item with `title: "Report an issue"` (case-insensitive) already exists
     in the returned array, **do not add another** — leave it as-is unless it
     clearly needs the URL/icon wiring below.
   - Otherwise, add a `ProfileMenuItem` that:
     - `title`: `"Report an issue"`
     - `icon`: Font Awesome `["fas", "comments"]` (available via Navkit peer deps)
     - `callBackFunc`: opens the helpdesk URL in a new tab with `noopener,noreferrer`

3. **Keep the URL easy to change**
   - Define a constant at the top of that file:
     `const SUPPORT_TICKET_URL = "https://support.taruvi.app/";`
   - Use `SUPPORT_TICKET_URL` in `callBackFunc`. Do **not** use env vars for this.

4. **Do not change**
   - `src/App.tsx` wiring (it should already pass `profileMenuItems` into `<Navkit />`)
   - Navkit internals
   - Auth / login flows

### Expected result

Avatar menu order: user name → Dark Mode (if enabled) → **Report an issue** → Logout.
Clicking **Report an issue** opens <https://support.taruvi.app/> in a new tab.
Running this prompt again must **not** create a duplicate menu item.

### Reference shape

```tsx
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ProfileMenuItem } from "@taruvi/navkit";

const SUPPORT_TICKET_URL = "https://support.taruvi.app/";

export function useNavkitProfileMenuItems(): ProfileMenuItem[] {
  return useMemo(
    () => [
      {
        title: "Report an issue",
        icon: <FontAwesomeIcon icon={["fas", "comments"]} />,
        callBackFunc: () => {
          window.open(SUPPORT_TICKET_URL, "_blank", "noopener,noreferrer");
        },
      },
    ],
    [],
  );
}
```

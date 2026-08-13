import type { ReactNode } from "react";
import { CreateButton, List } from "@refinedev/mui";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

/**
 * The standard list-page shell — see the "List page" section of the UI
 * guidelines (Taruvi-ai/ui-guidelines).
 *
 * Every list page renders as **one** card section: heading + primary action,
 * then the toolbar row, then the active-filter chip row, then the rows. Use this
 * component rather than hand-rolling the scaffold.
 *
 * Why it exists: the guidelines mandate the *elements* of a list page (search,
 * filters, chip row, pagination, empty states) but never said what
 * **contained** them. Three list pages
 * were built in parallel against that spec and produced three different
 * compositions: one Refine `<List>` card, one pair of detached `<Paper>` blocks,
 * and one with no container and a fixed-height grid. All three satisfied the
 * checklist; none of them matched each other. This component removes the
 * ambiguity so composition can't drift again.
 *
 * Page-level padding lives here too — `ThemedLayout` is deliberately `p: 0` in
 * this template, so pages own their own padding, and having it in one place
 * keeps every list identical.
 */
export type ListPageShellProps = {
  /** Page heading. Rendered `variant="h2" component="h1"` — the page's only H1. */
  title: string;
  /**
   * Label for the primary create action, e.g. "New ticket". Omit to render no
   * create button (for a resource the current role can't create).
   */
  createLabel?: string;
  /**
   * Search input and filter controls. Supplied as children of the standard
   * toolbar row, so every page gets identical toolbar layout and wrapping —
   * don't add your own wrapping `<Stack>` or `<Paper>` around them.
   */
  toolbar: ReactNode;
  /**
   * Active-filter chip row (§4.1 item 4). Render `null`/`undefined` when no
   * filter is set and the row disappears along with its spacing.
   */
  activeFilters?: ReactNode;
  /** The grid or list body, including its own empty and loading states. */
  children: ReactNode;
};

export const ListPageShell = ({
  title,
  createLabel,
  toolbar,
  activeFilters,
  children,
}: ListPageShellProps) => (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    <List
      title={
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      }
      headerButtons={
        createLabel ? (
          <CreateButton variant="contained" startIcon={<AddRoundedIcon />}>
            {createLabel}
          </CreateButton>
        ) : null
      }
    >
      {/*
        Becomes a row at `sm`, not `md`: §4.1 sizes the search input to 280–320px
        from `sm` up, so switching at `md` left the controls stacked at fixed
        widths between the two breakpoints instead of full width.
      */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 2, flexWrap: "wrap", rowGap: 1.5 }}
      >
        {toolbar}
      </Stack>

      {activeFilters ? <Box sx={{ mb: 1.5 }}>{activeFilters}</Box> : null}

      {children}
    </List>
  </Box>
);

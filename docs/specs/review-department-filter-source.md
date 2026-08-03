# Review Department Filter Source

## Objective

Show active organizational departments in the Team Review Queue instead of the limited Kaizen-local department master.

## Data mapping

- Load active records from the shared `departments` resource.
- Sort by department name and deduplicate repeated names.
- Store the selected department name in filter state.
- Filter `kaizen_ideas.department_name` because organizational department IDs and Kaizen-local department IDs are different.

## Affected file

- `src/pages/reviews/index.tsx`

## Verification

- The dropdown contains all unique active organizational department names.
- Selecting `Managed Services` still returns the two current Kaizens.
- Clearing the filter restores the full role-scoped review queue.
- TypeScript validation passes.

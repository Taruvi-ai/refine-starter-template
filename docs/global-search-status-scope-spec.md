# Global Kaizen Search Status Scope

## Requirement

Global Kaizen Search should not display Kaizens with `Draft` or `Withdrawn` status.

## Implementation

- The Global Search list query adds permanent backend filters for `status__ne: "Draft"` and `status__ne: "Withdrawn"`.
- The exclusion is applied before search text, date, department, client, process, category, impact, and pagination filters.
- Draft and withdrawn records remain available in their intended owner/admin flows, but are not surfaced in Global Kaizen Search.

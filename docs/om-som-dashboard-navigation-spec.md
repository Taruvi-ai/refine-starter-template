# Team's Dashboard Navigation Spec

## Goal

Create an OM/SOM workspace that mirrors the Lead/Manager team dashboard pattern and move the Review Queue under that workspace for OM/SOM users.

## Scope

- Add `/om-som-dashboard` as a Refine resource backed by live `kaizen_ideas` data.
- Show the dashboard only for OM/SOM reviewers who are not Admin or PE/QA.
- Move `Reviews` under `Team's Dashboard` in the sidebar for OM/SOM users.
- Keep `Reviews` top-level for Admin and PE/QA.
- Default OM/SOM Review Queue users to `In Review` items at `current_stage = "OM/SOM Review"`.
- Treat both `OM/SOM` and `OM/SMO` role naming as the same OM/SOM reviewer group.

## Data Rules

- OM/SOM review queue: `current_stage = "OM/SOM Review"`.
- Pending high-impact nominations: `high_impact_nomination_status = "Nominated"`.
- OM/SOM approved history: `status = "Approved"` and `om_som_comments` is not null.
- OM/SOM rejected history: `status = "Rejected"` and `om_som_comments` is not null.

The current backend does not assign a specific OM/SOM username when a Lead/Manager approves a Kaizen, so the dashboard uses the recorded workflow stage as the OM/SOM ownership boundary.

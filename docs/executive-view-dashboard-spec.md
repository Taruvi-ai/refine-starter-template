# Executive View Dashboard Spec

## Goal

Stakeholder users assigned the admin role should see the dashboard as an executive/program-wide view, not as an admin-branded workspace.

## Changes

- Keep the underlying `kaizen_prasun-admin` role slug and `isAdmin` permission checks unchanged.
- Show `Executive View Dashboard` in the sidebar, mobile dashboard tab, and home dashboard hero for admin users.
- Show the admin role option as `Executive View` in user role management.
- Store reviewer role metadata as `Executive View` when an admin/stakeholder user performs a review.
- Remove Kaizen submission capability from Executive View users; they keep program visibility and review capability but do not see submit/create actions.
- Give Executive View a stakeholder KPI card design focused on:
  - Kaizens Completed
  - Hours Saved from completed Kaizens only.
  - FTE Saving from completed Kaizens only.
  - Quality Improvement, using completed Quality-category Kaizens and average rework reduction when available.
  - High Impact Kaizens, counting approved high-impact nominations among completed Kaizens.
  - Cost Saved, calculated as the sum of each completed Kaizen's FTE Saving multiplied by the FTE Cost entered by OM/SOM during approval.
- Hide the hero "next best action" panel for Executive View so the dashboard opens directly into stakeholder KPIs.
- Hide the hero summary chips for Executive View so duplicated headline counts do not compete with the KPI cards.
- Hide Reviews and Notification from the Executive View navigation while keeping program visibility routes intact.
- Hide the lower Program Impact and Certificates cards for Executive View; the top stakeholder KPI cards remain the source for impact and certificate-adjacent metrics.
- Replace the lower Recent Kaizens card with separate Executive View cards for client-level and employee-level leaderboards.
- Redesign Executive View leaderboard cards with a highlighted top performer, compact ranked rows, and visible Kaizen, hours-saved, and FTE metrics from completed Kaizens only.

## Notes

The existing program-wide dashboard data path already applies to admin users because admin inherits PE/QA-style program visibility. This change is a wording and stakeholder-facing presentation update.

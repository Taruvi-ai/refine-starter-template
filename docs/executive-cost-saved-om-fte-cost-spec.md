# Executive Cost Saved from OM FTE Cost

## Objective

Calculate the Executive View Dashboard Cost Saved KPI from the FTE Cost entered
by OM/SOM while approving each Kaizen.

## Formula

```text
Cost Saved = sum(Kaizen FTE Saved × Kaizen OM-approved FTE Cost)
```

Each completed Kaizen is calculated independently because OM/SOM may approve a
different `fte_cost_usd` for each Kaizen. Records without either value
contribute zero.

## Scope

- Use the existing Executive Dashboard completed-Kaizen filter.
- Do not use the global Super Admin Cost per FTE configuration for this KPI.
- Keep the displayed total FTE Saved helper unchanged.

## Affected file

- `src/pages/home/index.tsx`

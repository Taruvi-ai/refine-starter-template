# FTE Cost Enhancement – OM Review

## Data contract

- Add nullable `fte_cost_usd` to `kaizen_ideas` for historical compatibility.
- OM/SOM review requires a positive per-Kaizen `fte_cost_usd`.
- Persist `cost_saved = fte_saving * fte_cost_usd` with the Kaizen.
- Lead review continues calculating impact but cannot set the OM override.
- Super Admin continues maintaining `cost_saved_per_fte` as the default.

## UI contract

- Prefill OM review from the Kaizen override, falling back to the Super Admin default.
- Show mandatory editable `FTE Cost (USD)` only for OM/SOM review.
- Show read-only `Cost Saved`, recalculated immediately from the displayed FTE saving.

## Audit contract

- Existing Kaizen review field-diff audit records OM changes to `fte_cost_usd` and `cost_saved`.
- Super Admin default changes execute through an audited serverless function.
- Activity labels identify `FTE Cost (USD)` and `Cost Saved` under Impact.

## Affected resources

- Live schema: `kaizen_ideas`
- Live functions: `kaizen-review-benefits`, new `kaizen-update-fte-cost-config`
- Frontend: review dialog, Kaizen detail, settings save flow, shared types, activity labels

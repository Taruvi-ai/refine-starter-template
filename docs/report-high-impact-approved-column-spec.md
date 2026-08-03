# Report High Impact Approval Column

## Requirement

Generated Kaizen reports must include a column that clearly shows whether each Kaizen has an approved High Impact nomination.

## Implementation

- Updated Taruvi function: `kaizen-generate-report`
- Added standard report column: `High Impact Kaizen Approved`
- The column is included in generated CSV output and the printable HTML report.
- Value mapping:
  - `Yes` when `kaizen_ideas.high_impact_nomination_status` is `Approved`
  - `No` for all other values or when the field is blank

## Notes

- The Reports page already downloads the function's returned `csv_data`, so no frontend CSV builder change is required.
- Archived reports will include the new column for newly generated reports after this function update.

# Super Admin Settings

## Request

Create a Super Admin-only Settings menu where administrators can manage Kaizen dropdown values, configurable form fields, view fields, benefit calculations, role dashboard pages, and delete Kaizens only from this Settings page.

## Implementation Notes

- New datatables:
  - `kaizen_dropdown_options`: active dropdown values by `group_key`.
  - `kaizen_form_field_configs`: core and custom form field metadata.
  - `kaizen_view_field_configs`: configurable view/list fields.
  - `kaizen_custom_field_values`: per-Kaizen values for custom form fields.
  - `kaizen_benefit_calculation_configs`: category-level FTE saving formulas, denominator, multiplier, helper text, and active state.
  - `kaizen_dashboard_widget_configs`: role-level dashboard widget/card labels, helper text, visibility, type, and display order.
- `kaizen_app_configs`: app-level configurable values such as the Executive dashboard Cost Saved per FTE multiplier.
- Settings page access is gated by `useKaizenRoles().isSuperAdmin`.
- Kaizen deletion is exposed only on the Settings page with a confirmation dialog.
- Kaizen form Category and Effort Type dropdowns read managed values and fall back to existing defaults if settings data is unavailable.
- Custom form fields configured in Settings render on the Kaizen form and are saved to `kaizen_custom_field_values`.
- The Kaizen list reads `kaizen_view_field_configs` for the `kaizen_list` view and displays configured core columns.
- Benefit calculation settings default to the existing Productivity, Quality, and Other formulas using denominator `9600`.
- Cost Settings lets a Super Admin edit `cost_saved_per_fte`, defaulting to `$2,200`.
- The Kaizen form, Kaizen list fallback, detail page fallback, and dashboard fallback totals use the active benefit calculation settings.
- Existing saved Kaizen `fte_saving` values are not overwritten when a Super Admin changes calculation settings.
- Dashboard Pages settings seed and edit Executive, Employee, PE/QA, Lead/Manager, and OM/SOM dashboard widgets.
- Dashboard pages read `kaizen_dashboard_widget_configs` to resolve KPI/section labels, helper text, visibility, and KPI order.
- Certificate settings edit certificate template metadata, upload replacement assets, edit generated certificate records, and regenerate completed Kaizen certificates through `kaizen-cert-template-lite`.

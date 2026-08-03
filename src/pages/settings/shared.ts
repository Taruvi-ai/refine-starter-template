import { useMemo } from "react";
import { useList, type CrudFilters } from "@refinedev/core";
import {
  FTE_SAVING_DENOMINATOR,
  KAIZEN_CATEGORIES,
  calculateFteSaving,
  normalizeKaizenCategory,
  toNumber,
  type KaizenIdea,
} from "../kaizens/shared";

export const SETTINGS_PAGE_SIZE = { currentPage: 1, pageSize: 100 };
export const ACTIVE_DROPDOWN_FILTERS: CrudFilters = [{ field: "is_active", operator: "eq", value: true }];

export const CORE_KAIZEN_FORM_FIELDS = new Set([
  "title",
  "problem_statement",
  "proposed_solution",
  "expected_benefit",
  "category",
  "effort_type",
  "department_id",
  "client_id",
  "process_id",
  "project_members",
  "tat_before",
  "tat_after",
  "monthly_transaction_volume",
  "monthly_time_saved",
  "tat_improvement_percent",
  "revenue_generated_usd",
]);

export const DEFAULT_DROPDOWN_OPTIONS: Record<string, string[]> = {
  category: [...KAIZEN_CATEGORIES],
  effort_type: ["Individual", "Team"],
};

export const DROPDOWN_VALUE_LIMITS: Record<string, number> = {
  category: 19,
  effort_type: 10,
};

export const DASHBOARD_ROLE_OPTIONS = [
  { value: "executive", label: "Executive View Dashboard" },
  { value: "employee", label: "Employee Dashboard" },
  { value: "pe_qa", label: "PE/QA Dashboard" },
  { value: "lead_manager", label: "Lead/Manager Dashboard" },
  { value: "om_som", label: "OM/SOM Dashboard" },
] as const;

export const DASHBOARD_WIDGET_TYPES = ["kpi", "section", "table", "chart"] as const;

export type DashboardRoleKey = (typeof DASHBOARD_ROLE_OPTIONS)[number]["value"];
export type DashboardWidgetType = (typeof DASHBOARD_WIDGET_TYPES)[number];

export const COST_SAVED_PER_FTE_CONFIG_KEY = "cost_saved_per_fte";
export const DEFAULT_COST_SAVED_PER_FTE = 2200;

export const BENEFIT_FORMULA_TYPES = [
  { value: "volume_time", label: "Volume x Time Saved" },
  { value: "quality_rework", label: "Quality Rework Reduction" },
  { value: "total_time", label: "Total Time Saved" },
] as const;

export type BenefitFormulaType = (typeof BENEFIT_FORMULA_TYPES)[number]["value"];

export const DEFAULT_BENEFIT_CALCULATION_CONFIGS = [
  {
    category: "Productivity",
    metric_label: "FTE Saving",
    formula_type: "volume_time" as BenefitFormulaType,
    denominator: FTE_SAVING_DENOMINATOR,
    multiplier: 1,
    help_text: "Impacted month volume x time saved x multiplier / denominator",
    sort_order: 10,
    is_active: true,
  },
  {
    category: "Quality",
    metric_label: "FTE Saving",
    formula_type: "quality_rework" as BenefitFormulaType,
    denominator: FTE_SAVING_DENOMINATOR,
    multiplier: 1,
    help_text: "(Error before - error after) x rework time x multiplier / denominator",
    sort_order: 20,
    is_active: true,
  },
  {
    category: "Other",
    metric_label: "FTE Saving",
    formula_type: "total_time" as BenefitFormulaType,
    denominator: FTE_SAVING_DENOMINATOR,
    multiplier: 1,
    help_text: "Total time saved x multiplier / denominator",
    sort_order: 30,
    is_active: true,
  },
] as const;

export const DEFAULT_KAIZEN_LIST_FIELDS = [
  "title",
  "status",
  "category",
  "submitted_at",
  "fte_saving",
] as const;

export const KAIZEN_LIST_FIELD_LABELS: Record<string, string> = {
  title: "Kaizen",
  status: "Status",
  category: "Category",
  submitted_at: "Submitted",
  department_name: "Department",
  client_name: "Client",
  process_name: "Process",
  fte_saving: "FTE Saving",
  hours_saved: "Hours Saved",
  submitted_by_name: "Submitted By",
  submitted_by_username: "Submitted By",
  current_stage: "Stage",
};

export type DropdownOption = {
  id: string;
  group_key?: string | null;
  label?: string | null;
  value?: string | null;
  sort_order?: number | string | null;
  is_active?: boolean | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FormFieldConfig = {
  id: string;
  field_key?: string | null;
  label?: string | null;
  field_type?: string | null;
  section?: string | null;
  options_group_key?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | string | null;
  help_text?: string | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ViewFieldConfig = {
  id: string;
  view_key?: string | null;
  field_key?: string | null;
  label?: string | null;
  is_visible?: boolean | null;
  sort_order?: number | string | null;
  width?: number | string | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BenefitCalculationConfig = {
  id?: string;
  category?: string | null;
  metric_label?: string | null;
  formula_type?: BenefitFormulaType | string | null;
  denominator?: number | string | null;
  multiplier?: number | string | null;
  help_text?: string | null;
  sort_order?: number | string | null;
  is_active?: boolean | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardWidgetConfig = {
  id: string;
  dashboard_key?: string | null;
  dashboard_label?: string | null;
  widget_key?: string | null;
  widget_type?: DashboardWidgetType | string | null;
  label?: string | null;
  helper_text?: string | null;
  is_visible?: boolean | null;
  sort_order?: number | string | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AppConfig = {
  id: string;
  config_key?: string | null;
  label?: string | null;
  number_value?: number | string | null;
  string_value?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  created_by_username?: string | null;
  updated_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CertificateTemplateConfig = {
  id: string;
  template_key?: string | null;
  name?: string | null;
  certificate_type?: string | null;
  version?: number | string | null;
  status?: string | null;
  is_default?: boolean | null;
  page_size?: string | null;
  orientation?: string | null;
  background_path?: string | null;
  logo_config?: Record<string, unknown> | null;
  text_fields?: Record<string, unknown> | null;
  signature_config?: Record<string, unknown> | null;
  style_config?: Record<string, unknown> | null;
  placeholders?: string[] | null;
  preview_html?: string | null;
  backup_json?: Record<string, unknown> | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CustomFieldValue = {
  id: string;
  idea_id?: string | null;
  field_key?: string | null;
  field_label?: string | null;
  value?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const sortByOrderThenLabel = <T extends { sort_order?: number | string | null; label?: string | null; value?: string | null; field_key?: string | null }>(rows: T[]) =>
  [...rows].sort((first, second) => {
    const orderDiff = Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return String(first.label ?? first.value ?? first.field_key ?? "").localeCompare(String(second.label ?? second.value ?? second.field_key ?? ""));
  });

const sortBenefitConfigs = (rows: BenefitCalculationConfig[]) =>
  [...rows].sort((first, second) => {
    const orderDiff = Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return String(first.category ?? "").localeCompare(String(second.category ?? ""));
  });

const sortDashboardWidgetConfigs = (rows: DashboardWidgetConfig[]) =>
  [...rows].sort((first, second) => {
    const orderDiff = Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return String(first.label ?? first.widget_key ?? "").localeCompare(String(second.label ?? second.widget_key ?? ""));
  });

export const dropdownOptionLabel = (row: DropdownOption) => String(row.label || row.value || "").trim();
export const dropdownOptionValue = (row: DropdownOption) => String(row.value || row.label || "").trim();

export const formulaTypeLabel = (formulaType?: string | null) =>
  BENEFIT_FORMULA_TYPES.find((formula) => formula.value === formulaType)?.label ?? emptyFormulaLabel(formulaType);

const emptyFormulaLabel = (formulaType?: string | null) => String(formulaType || "Formula").replace(/_/g, " ");

export const getBenefitCalculationConfig = (
  category: string | null | undefined,
  configs: BenefitCalculationConfig[] = DEFAULT_BENEFIT_CALCULATION_CONFIGS as unknown as BenefitCalculationConfig[],
) => {
  const rawCategory = String(category ?? "").trim();
  const normalizedCategory = normalizeKaizenCategory(rawCategory);
  const activeConfigs = configs.filter((config) => config.is_active !== false);
  return (
    activeConfigs.find((config) => String(config.category ?? "").trim() === rawCategory) ??
    activeConfigs.find((config) => String(config.category ?? "").trim() === normalizedCategory) ??
    activeConfigs.find((config) => String(config.category ?? "").trim() === "Other")
  );
};

export const calculateConfiguredFteSaving = (
  idea: Pick<KaizenIdea, "category" | "impacted_volume" | "time_saved" | "error_before" | "error_after" | "rework_time" | "total_time_saved" | "tat_before" | "tat_after" | "monthly_transaction_volume">,
  configs: BenefitCalculationConfig[],
) => {
  if (normalizeKaizenCategory(idea.category) === "TAT") return calculateFteSaving(idea);
  const config = getBenefitCalculationConfig(idea.category, configs);
  if (!config) return calculateFteSaving(idea);

  const denominatorValue = toNumber(config.denominator);
  const denominator = denominatorValue > 0 ? denominatorValue : FTE_SAVING_DENOMINATOR;
  const multiplier = toNumber(config.multiplier) || 1;

  if (config.formula_type === "volume_time") {
    return (toNumber(idea.impacted_volume) * toNumber(idea.time_saved) * multiplier) / denominator;
  }
  if (config.formula_type === "quality_rework") {
    return ((toNumber(idea.error_before) - toNumber(idea.error_after)) * toNumber(idea.rework_time) * multiplier) / denominator;
  }
  if (config.formula_type === "total_time") {
    return (toNumber(idea.total_time_saved) * multiplier) / denominator;
  }
  return calculateFteSaving(idea);
};

export const benefitCalculationHelperText = (category: string | null | undefined, configs: BenefitCalculationConfig[]) => {
  if (normalizeKaizenCategory(category) === "TAT") return "((TAT Before - TAT After) / TAT Before) x 100.";
  const config = getBenefitCalculationConfig(category, configs);
  if (!config) return "Configured benefit calculation unavailable.";
  const denominatorValue = toNumber(config.denominator);
  const denominator = denominatorValue > 0 ? denominatorValue : FTE_SAVING_DENOMINATOR;
  const multiplier = toNumber(config.multiplier) || 1;
  const baseText = String(config.help_text || formulaTypeLabel(config.formula_type)).trim();
  return `${baseText}. Denominator: ${denominator}. Multiplier: ${multiplier}.`;
};

export const resolveDashboardWidget = (
  configs: DashboardWidgetConfig[],
  widgetKey: string,
  fallback: { label: string; helper?: string; sortOrder?: number; visible?: boolean },
) => {
  const row = configs.find((config) => config.widget_key === widgetKey);
  return {
    label: String(row?.label || fallback.label),
    helper: String(row?.helper_text || fallback.helper || ""),
    sortOrder: Number(row?.sort_order ?? fallback.sortOrder ?? 0),
    visible: row ? row.is_visible !== false : fallback.visible !== false,
  };
};

export const readPositiveConfigNumber = (row: AppConfig | undefined, fallback: number) => {
  const parsed = toNumber(row?.number_value);
  return parsed > 0 ? parsed : fallback;
};

export const useAppConfigValue = (configKey: string, fallback: number, enabled = true) => {
  const filters = useMemo<CrudFilters>(
    () => [
      { field: "config_key", operator: "eq", value: configKey },
      { field: "is_active", operator: "eq", value: true },
    ],
    [configKey],
  );

  const { result, query } = useList<AppConfig>({
    resource: "kaizen_app_configs",
    filters,
    pagination: { currentPage: 1, pageSize: 1 },
    queryOptions: { enabled },
  });

  const row = result.data?.[0];
  const value = readPositiveConfigNumber(row, fallback);
  return { value, row, query };
};

export const useDropdownOptions = (groupKey: string, fallback: string[] = DEFAULT_DROPDOWN_OPTIONS[groupKey] ?? []) => {
  const filters = useMemo<CrudFilters>(
    () => [
      { field: "group_key", operator: "eq", value: groupKey },
      ...ACTIVE_DROPDOWN_FILTERS,
    ],
    [groupKey],
  );

  const { result, query } = useList<DropdownOption>({
    resource: "kaizen_dropdown_options",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });

  const options = useMemo(() => {
    const liveOptions = sortByOrderThenLabel(result.data ?? [])
      .map((row) => ({ label: dropdownOptionLabel(row), value: dropdownOptionValue(row) }))
      .filter((row) => row.label && row.value);

    if (liveOptions.length > 0) return liveOptions;
    return fallback.map((value) => ({ label: value, value }));
  }, [fallback, result.data]);

  return { options, query };
};

export const useFormFieldConfigs = () => {
  const filters = useMemo<CrudFilters>(() => [{ field: "is_visible", operator: "eq", value: true }], []);
  const { result, query } = useList<FormFieldConfig>({
    resource: "kaizen_form_field_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });

  const fields = useMemo(() => sortByOrderThenLabel(result.data ?? []), [result.data]);
  const customFields = useMemo(
    () => fields.filter((field) => {
      const key = String(field.field_key ?? "").trim();
      return key && !CORE_KAIZEN_FORM_FIELDS.has(key);
    }),
    [fields],
  );

  return { fields, customFields, query };
};

export const useViewFieldConfigs = (viewKey: string, fallbackFields: readonly string[] = DEFAULT_KAIZEN_LIST_FIELDS) => {
  const filters = useMemo<CrudFilters>(
    () => [
      { field: "view_key", operator: "eq", value: viewKey },
      { field: "is_visible", operator: "eq", value: true },
    ],
    [viewKey],
  );

  const { result, query } = useList<ViewFieldConfig>({
    resource: "kaizen_view_field_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });

  const fields = useMemo(() => {
    const configured = sortByOrderThenLabel(result.data ?? [])
      .map((field) => String(field.field_key ?? "").trim())
      .filter(Boolean);
    return configured.length > 0 ? configured : [...fallbackFields];
  }, [fallbackFields, result.data]);

  const labels = useMemo(() => {
    const next: Record<string, string> = { ...KAIZEN_LIST_FIELD_LABELS };
    (result.data ?? []).forEach((row) => {
      const key = String(row.field_key ?? "").trim();
      const label = String(row.label ?? "").trim();
      if (key && label) next[key] = label;
    });
    return next;
  }, [result.data]);

  return { fields, labels, query };
};

export const useBenefitCalculationConfigs = () => {
  const filters = useMemo<CrudFilters>(() => [{ field: "is_active", operator: "eq", value: true }], []);
  const { result, query } = useList<BenefitCalculationConfig>({
    resource: "kaizen_benefit_calculation_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });

  const configs = useMemo(() => {
    const liveConfigs = sortBenefitConfigs(result.data ?? []);
    return liveConfigs.length > 0
      ? liveConfigs
      : [...DEFAULT_BENEFIT_CALCULATION_CONFIGS] as unknown as BenefitCalculationConfig[];
  }, [result.data]);

  return { configs, query };
};

export const useDashboardWidgetConfigs = (dashboardKey: string) => {
  const filters = useMemo<CrudFilters>(() => [{ field: "dashboard_key", operator: "eq", value: dashboardKey }], [dashboardKey]);
  const { result, query } = useList<DashboardWidgetConfig>({
    resource: "kaizen_dashboard_widget_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });

  const widgets = useMemo(() => sortDashboardWidgetConfigs(result.data ?? []), [result.data]);
  return { widgets, query };
};

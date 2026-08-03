import { useEffect, useMemo, useState } from "react";
import { useList, useNotification, type CrudFilters } from "@refinedev/core";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { taruviDataProvider } from "../../providers/refineProviders";
import { executeFunction } from "../../utils/functionHelpers";
import {
  AccessDenied,
  ActiveFilterChips,
  EmptyState,
  KAIZEN_STATUSES,
  StatusChip,
  emptyValue,
  formatCurrency,
  formatDate,
  toNumber,
  useDebouncedValue,
  useKaizenRoles,
  type CertificateRow,
  type KaizenIdea,
} from "../kaizens/shared";
import {
  BENEFIT_FORMULA_TYPES,
  DASHBOARD_ROLE_OPTIONS,
  DASHBOARD_WIDGET_TYPES,
  DEFAULT_BENEFIT_CALCULATION_CONFIGS,
  DEFAULT_COST_SAVED_PER_FTE,
  DROPDOWN_VALUE_LIMITS,
  KAIZEN_LIST_FIELD_LABELS,
  SETTINGS_PAGE_SIZE,
  COST_SAVED_PER_FTE_CONFIG_KEY,
  formulaTypeLabel,
  type AppConfig,
  type BenefitCalculationConfig,
  type BenefitFormulaType,
  type CertificateTemplateConfig,
  type DashboardRoleKey,
  type DashboardWidgetConfig,
  type DashboardWidgetType,
  type DropdownOption,
  type FormFieldConfig,
  type ViewFieldConfig,
} from "./shared";

type ConfirmAction =
  | { type: "dropdown"; row: DropdownOption }
  | { type: "form-field"; row: FormFieldConfig }
  | { type: "view-field"; row: ViewFieldConfig }
  | { type: "kaizen"; row: KaizenIdea }
  | null;

type FormFieldDraft = {
  id?: string;
  field_key: string;
  label: string;
  field_type: string;
  section: string;
  options_group_key: string;
  is_required: boolean;
  is_visible: boolean;
  sort_order: string;
  help_text: string;
};

type ViewFieldDraft = {
  id?: string;
  view_key: string;
  field_key: string;
  label: string;
  is_visible: boolean;
  sort_order: string;
  width: string;
};

type BenefitCalculationDraft = {
  id?: string;
  category: string;
  metric_label: string;
  formula_type: BenefitFormulaType;
  denominator: string;
  multiplier: string;
  help_text: string;
  sort_order: string;
  is_active: boolean;
};

type DashboardWidgetDraft = {
  id?: string;
  dashboard_key: DashboardRoleKey;
  dashboard_label: string;
  widget_key: string;
  widget_type: DashboardWidgetType;
  label: string;
  helper_text: string;
  is_visible: boolean;
  sort_order: string;
};

type CertificateTemplateDraft = {
  id?: string;
  template_key: string;
  name: string;
  certificate_type: string;
  version: string;
  status: string;
  is_default: boolean;
  page_size: string;
  orientation: string;
  background_path: string;
  placeholders: string;
  logo_config: string;
  text_fields: string;
  signature_config: string;
  style_config: string;
};

type CertificateRecordDraft = {
  id?: string;
  certificate_number: string;
  recipient_name: string;
  recipient_username: string;
  recipient_email: string;
  status: string;
  reward_amount: string;
  issued_at: string;
  certificate_path: string;
};

type CertificateFunctionResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  path?: string;
  template?: CertificateTemplateConfig;
  certificate?: CertificateRow;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const FIELD_TYPES = ["text", "textarea", "number", "date", "select"];
const DROPDOWN_GROUPS = [
  { value: "category", label: "Category" },
  { value: "effort_type", label: "Effort Type" },
];
const VIEW_KEYS = [
  { value: "kaizen_list", label: "Kaizen list" },
  { value: "kaizen_show_overview", label: "Kaizen detail overview" },
];
const VIEW_FIELD_OPTIONS = Object.entries(KAIZEN_LIST_FIELD_LABELS).map(([value, label]) => ({ value, label }));
const DEFAULT_BENEFIT_DRAFT: BenefitCalculationDraft = {
  category: "Productivity",
  metric_label: "FTE Saving",
  formula_type: "volume_time",
  denominator: "9600",
  multiplier: "1",
  help_text: "Impacted month volume x time saved x multiplier / denominator",
  sort_order: "10",
  is_active: true,
};
const DEFAULT_DASHBOARD_WIDGET_DRAFT: DashboardWidgetDraft = {
  dashboard_key: "executive",
  dashboard_label: "Executive View Dashboard",
  widget_key: "",
  widget_type: "kpi",
  label: "",
  helper_text: "",
  is_visible: true,
  sort_order: "100",
};
const CERTIFICATE_HELPER_FUNCTION = "kaizen-cert-template-lite";
const CERTIFICATE_TYPES = ["Standard Kaizen Certificate", "High Impact Kaizen Certificate", "Team Kaizen Certificate"];
const CERTIFICATE_TEMPLATE_STATUSES = ["Active", "Inactive"];
const CERTIFICATE_RECORD_STATUSES = ["Generated", "Downloaded", "Revoked"];
const CERTIFICATE_READY_STATUSES = ["Certificate Generated", "Closed", "Audit Closed", "Approved"];
const DEFAULT_CERTIFICATE_TEMPLATE_DRAFT: CertificateTemplateDraft = {
  template_key: "kaizen-certificate-2026",
  name: "Kaizen Certificate 2026",
  certificate_type: "Standard Kaizen Certificate",
  version: "1",
  status: "Active",
  is_default: true,
  page_size: "A4",
  orientation: "Landscape",
  background_path: "certificate-templates/kaizen-certificate-2026.png",
  placeholders: "Employee_Name, Kaizen_Title, Issue_Date",
  logo_config: "{}",
  text_fields: JSON.stringify({
    recipient_name: { placeholder: "Employee_Name", x: 110, y: 245, font_size: 38 },
    kaizen_title: { placeholder: "Kaizen_Title", x: 420, y: 327, font_size: 18 },
    issue_date: { placeholder: "Issue_Date", x: 175, y: 420, font_size: 18 },
  }, null, 2),
  signature_config: "{}",
  style_config: "{}",
};
const DEFAULT_CERTIFICATE_RECORD_DRAFT: CertificateRecordDraft = {
  certificate_number: "",
  recipient_name: "",
  recipient_username: "",
  recipient_email: "",
  status: "Generated",
  reward_amount: "0",
  issued_at: "",
  certificate_path: "",
};

const nowIso = () => new Date().toISOString();

const numberOrZero = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const valueLengthLimitText = (groupKey: string) => {
  const limit = DROPDOWN_VALUE_LIMITS[groupKey];
  return limit ? `${limit} character maximum for this Kaizen field.` : "Keep values short and user-facing.";
};

const jsonText = (value: unknown, fallback: Record<string, unknown> = {}) =>
  JSON.stringify(value && typeof value === "object" ? value : fallback, null, 2);

const parseJsonText = (label: string, value: string, fallback: Record<string, unknown> = {}) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : fallback;
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
};

const placeholdersFromText = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

const placeholdersToText = (value?: string[] | null) =>
  Array.isArray(value) ? value.filter(Boolean).join(", ") : "";

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const certificateUrl = (path?: string | null) =>
  path ? `${__TARUVI_SITE_URL__}/api/apps/${__TARUVI_APP_SLUG__}/storage/buckets/kaizen-attachments/objects/${path}` : "";

const certificateDownloadName = (certificate: CertificateRow) =>
  `${(certificate.certificate_number || "kaizen-certificate").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.svg`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const confirmTitle = (action: ConfirmAction) => {
  if (!action) return "";
  if (action.type === "kaizen") return "Delete Kaizen?";
  if (action.type === "dropdown") return "Delete dropdown value?";
  if (action.type === "form-field") return "Remove form field?";
  return "Remove view field?";
};

const confirmBody = (action: ConfirmAction) => {
  if (!action) return "";
  if (action.type === "kaizen") {
    return `Are you sure you want to delete "${action.row.kaizen_id || action.row.title || action.row.id}"? This action cannot be undone.`;
  }
  if (action.type === "dropdown") {
    return `Are you sure you want to delete "${action.row.label || action.row.value}"? This action cannot be undone.`;
  }
  if (action.type === "form-field") {
    return `Are you sure you want to remove "${action.row.label || action.row.field_key}" from configured form fields? This action cannot be undone.`;
  }
  return `Are you sure you want to remove "${action.row.label || action.row.field_key}" from this view? This action cannot be undone.`;
};

const resourceForConfirm = (action: ConfirmAction) => {
  if (!action) return "";
  if (action.type === "kaizen") return "kaizen_ideas";
  if (action.type === "dropdown") return "kaizen_dropdown_options";
  if (action.type === "form-field") return "kaizen_form_field_configs";
  return "kaizen_view_field_configs";
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
    <Box>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Box>
  </Stack>
);

export const SettingsPage = () => {
  const roles = useKaizenRoles();
  const { open } = useNotification();
  const [tab, setTab] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchAfterDelete = () => setRefreshKey((current) => current + 1);

  const deleteConfirmed = async () => {
    if (!confirm?.row.id) return;
    setIsDeleting(true);
    try {
      await taruviDataProvider.deleteOne({
        resource: resourceForConfirm(confirm),
        id: confirm.row.id,
        meta: {},
      });
      open?.({
        type: "success",
        message: confirm.type === "kaizen" ? "Kaizen deleted" : "Record deleted",
        description: "The Settings list has been refreshed.",
      });
      setConfirm(null);
      refetchAfterDelete();
    } catch (error) {
      open?.({
        type: "error",
        message: confirm.type === "kaizen" ? "Unable to delete Kaizen" : "Unable to delete record",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (roles.isLoading) {
    return (
      <Stack spacing={1} alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">Loading settings access...</Typography>
      </Stack>
    );
  }

  if (!roles.isSuperAdmin) return <AccessDenied title="Super Admin settings" />;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader
          title="Settings"
          subtitle="Super Admin controls for dropdown values, custom fields, views, benefits, dashboards, certificates, and controlled Kaizen deletion."
        />
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, next) => setTab(next)}>
              <Tab label="Dropdown Values" />
              <Tab label="Form Fields" />
              <Tab label="View Fields" />
              <Tab label="Benefit Calculation" />
              <Tab label="Cost Settings" />
              <Tab label="Dashboard Pages" />
              <Tab label="Certificates" />
              <Tab label="Delete Kaizen" />
            </Tabs>
          </CardContent>
        </Card>
        {tab === 0 ? <DropdownValuesPanel refreshKey={refreshKey} onDelete={(row) => setConfirm({ type: "dropdown", row })} /> : null}
        {tab === 1 ? <FormFieldsPanel refreshKey={refreshKey} onDelete={(row) => setConfirm({ type: "form-field", row })} /> : null}
        {tab === 2 ? <ViewFieldsPanel refreshKey={refreshKey} onDelete={(row) => setConfirm({ type: "view-field", row })} /> : null}
        {tab === 3 ? <BenefitCalculationPanel refreshKey={refreshKey} /> : null}
        {tab === 4 ? <CostSettingsPanel refreshKey={refreshKey} /> : null}
        {tab === 5 ? <DashboardPagesPanel refreshKey={refreshKey} /> : null}
        {tab === 6 ? <CertificateSettingsPanel refreshKey={refreshKey} /> : null}
        {tab === 7 ? <KaizenDeletePanel refreshKey={refreshKey} onDelete={(row) => setConfirm({ type: "kaizen", row })} /> : null}
      </Stack>
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmTitle(confirm)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmBody(confirm)}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon />} disabled={isDeleting} onClick={deleteConfirmed}>
            {isDeleting ? "Deleting..." : confirm?.type === "kaizen" ? "Delete Kaizen" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const DropdownValuesPanel = ({ refreshKey, onDelete }: { refreshKey: number; onDelete: (row: DropdownOption) => void }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [groupKey, setGroupKey] = useState("category");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sortOrder, setSortOrder] = useState("100");
  const [isSaving, setIsSaving] = useState(false);

  const filters = useMemo<CrudFilters>(() => [{ field: "group_key", operator: "eq", value: groupKey }], [groupKey, refreshKey]);
  const { result, query } = useList<DropdownOption>({
    resource: "kaizen_dropdown_options",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const rows = result.data ?? [];

  const save = async () => {
    const cleanLabel = label.trim();
    const cleanValue = value.trim() || cleanLabel;
    const limit = DROPDOWN_VALUE_LIMITS[groupKey];
    if (!cleanLabel || !cleanValue) {
      open?.({ type: "error", message: "Dropdown value required", description: "Enter a label and value before saving." });
      return;
    }
    if (limit && cleanValue.length > limit) {
      open?.({ type: "error", message: `Value must be ${limit} characters or less`, description: "This limit comes from the Kaizen idea field schema." });
      return;
    }
    setIsSaving(true);
    try {
      await taruviDataProvider.create({
        resource: "kaizen_dropdown_options",
        variables: {
          group_key: groupKey,
          label: cleanLabel,
          value: cleanValue,
          sort_order: numberOrZero(sortOrder),
          is_active: true,
          created_by_username: roles.identity?.username,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
        meta: {},
      });
      setLabel("");
      setValue("");
      setSortOrder("100");
      open?.({ type: "success", message: "Dropdown value added", description: `${cleanLabel} is now available.` });
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to add dropdown value", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h3">Dropdown Values</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr 1fr 120px auto" }, gap: 2, alignItems: "start" }}>
            <FormControl>
              <InputLabel>Dropdown</InputLabel>
              <Select label="Dropdown" value={groupKey} onChange={(event) => setGroupKey(event.target.value)}>
                {DROPDOWN_GROUPS.map((group) => <MenuItem key={group.value} value={group.value}>{group.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Label" value={label} onChange={(event) => setLabel(event.target.value)} helperText={valueLengthLimitText(groupKey)} />
            <TextField label="Value" value={value} onChange={(event) => setValue(event.target.value)} helperText="Leave blank to reuse the label." />
            <TextField label="Sort" type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />} disabled={isSaving} onClick={save}>
              Add
            </Button>
          </Box>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={rows} onRetry={() => query.refetch()} />
          {rows.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="right">Sort</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{emptyValue(row.label)}</TableCell>
                      <TableCell>{emptyValue(row.value)}</TableCell>
                      <TableCell align="right">{emptyValue(row.sort_order)}</TableCell>
                      <TableCell><StatusChip status={row.is_active ? "Approved" : "Rejected"} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => onDelete(row)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const FormFieldsPanel = ({ refreshKey, onDelete }: { refreshKey: number; onDelete: (row: FormFieldConfig) => void }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [draft, setDraft] = useState<FormFieldDraft>({
    field_key: "",
    label: "",
    field_type: "text",
    section: "Custom Fields",
    options_group_key: "",
    is_required: false,
    is_visible: true,
    sort_order: "200",
    help_text: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const filters = useMemo<CrudFilters>(() => [], [refreshKey]);
  const { result, query } = useList<FormFieldConfig>({
    resource: "kaizen_form_field_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const rows = result.data ?? [];

  const edit = (row: FormFieldConfig) => {
    setDraft({
      id: row.id,
      field_key: row.field_key ?? "",
      label: row.label ?? "",
      field_type: row.field_type ?? "text",
      section: row.section ?? "Custom Fields",
      options_group_key: row.options_group_key ?? "",
      is_required: Boolean(row.is_required),
      is_visible: row.is_visible !== false,
      sort_order: String(row.sort_order ?? 200),
      help_text: row.help_text ?? "",
    });
  };

  const reset = () => {
    setDraft({
      field_key: "",
      label: "",
      field_type: "text",
      section: "Custom Fields",
      options_group_key: "",
      is_required: false,
      is_visible: true,
      sort_order: "200",
      help_text: "",
    });
  };

  const save = async () => {
    const cleanKey = draft.field_key.trim();
    const cleanLabel = draft.label.trim();
    if (!cleanKey || !cleanLabel) {
      open?.({ type: "error", message: "Field key and label required", description: "Add both values before saving the form field." });
      return;
    }
    setIsSaving(true);
    try {
      const variables = {
        field_key: cleanKey,
        label: cleanLabel,
        field_type: draft.field_type,
        section: draft.section || "Custom Fields",
        options_group_key: draft.field_type === "select" ? draft.options_group_key || null : null,
        is_required: draft.is_required,
        is_visible: draft.is_visible,
        sort_order: numberOrZero(draft.sort_order),
        help_text: draft.help_text || null,
        created_by_username: roles.identity?.username,
        updated_at: nowIso(),
        created_at: nowIso(),
      };
      if (draft.id) {
        await taruviDataProvider.update({ resource: "kaizen_form_field_configs", id: draft.id, variables, meta: {} });
      } else {
        await taruviDataProvider.create({ resource: "kaizen_form_field_configs", variables, meta: {} });
      }
      open?.({ type: "success", message: "Form field saved", description: `${cleanLabel} was updated.` });
      reset();
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save form field", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h3">Form Fields</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 160px 160px" }, gap: 2 }}>
            <TextField label="Field key" value={draft.field_key} onChange={(event) => setDraft((current) => ({ ...current, field_key: event.target.value }))} helperText="Use a unique key. Custom fields render on the Kaizen form." />
            <TextField label="Label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={draft.field_type} onChange={(event) => setDraft((current) => ({ ...current, field_type: event.target.value }))}>
                {FIELD_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Sort" type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
            <TextField label="Section" value={draft.section} onChange={(event) => setDraft((current) => ({ ...current, section: event.target.value }))} />
            <TextField label="Help text" value={draft.help_text} onChange={(event) => setDraft((current) => ({ ...current, help_text: event.target.value }))} />
            {draft.field_type === "select" ? (
              <TextField label="Options group key" value={draft.options_group_key} onChange={(event) => setDraft((current) => ({ ...current, options_group_key: event.target.value }))} />
            ) : null}
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel control={<Switch checked={draft.is_required} onChange={(event) => setDraft((current) => ({ ...current, is_required: event.target.checked }))} />} label="Required" />
              <FormControlLabel control={<Switch checked={draft.is_visible} onChange={(event) => setDraft((current) => ({ ...current, is_visible: event.target.checked }))} />} label="Visible" />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.25} justifyContent="flex-end">
            <Button variant="outlined" onClick={reset}>Reset</Button>
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSaving} onClick={save}>
              {isSaving ? "Saving..." : "Save Field"}
            </Button>
          </Stack>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={rows} onRetry={() => query.refetch()} />
          {rows.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.label)}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.field_key)}</Typography>
                      </TableCell>
                      <TableCell>{emptyValue(row.field_type)}</TableCell>
                      <TableCell>{emptyValue(row.section)}</TableCell>
                      <TableCell><StatusChip status={row.is_visible === false ? "Rejected" : "Approved"} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => edit(row)}>Edit</Button>
                          <Button size="small" color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => onDelete(row)}>Remove</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const ViewFieldsPanel = ({ refreshKey, onDelete }: { refreshKey: number; onDelete: (row: ViewFieldConfig) => void }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [draft, setDraft] = useState<ViewFieldDraft>({
    view_key: "kaizen_list",
    field_key: "title",
    label: "Kaizen",
    is_visible: true,
    sort_order: "100",
    width: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const filters = useMemo<CrudFilters>(() => [{ field: "view_key", operator: "eq", value: draft.view_key }], [draft.view_key, refreshKey]);
  const { result, query } = useList<ViewFieldConfig>({
    resource: "kaizen_view_field_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const rows = result.data ?? [];

  const edit = (row: ViewFieldConfig) => {
    setDraft({
      id: row.id,
      view_key: row.view_key ?? "kaizen_list",
      field_key: row.field_key ?? "title",
      label: row.label ?? KAIZEN_LIST_FIELD_LABELS[row.field_key ?? ""] ?? "",
      is_visible: row.is_visible !== false,
      sort_order: String(row.sort_order ?? 100),
      width: row.width ? String(row.width) : "",
    });
  };

  const save = async () => {
    const cleanKey = draft.field_key.trim();
    const cleanLabel = draft.label.trim() || KAIZEN_LIST_FIELD_LABELS[cleanKey] || cleanKey;
    if (!cleanKey || !cleanLabel) {
      open?.({ type: "error", message: "View field required", description: "Choose a field and label before saving." });
      return;
    }
    setIsSaving(true);
    try {
      const variables = {
        view_key: draft.view_key,
        field_key: cleanKey,
        label: cleanLabel,
        is_visible: draft.is_visible,
        sort_order: numberOrZero(draft.sort_order),
        width: draft.width ? numberOrZero(draft.width) : null,
        created_by_username: roles.identity?.username,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      if (draft.id) {
        await taruviDataProvider.update({ resource: "kaizen_view_field_configs", id: draft.id, variables, meta: {} });
      } else {
        await taruviDataProvider.create({ resource: "kaizen_view_field_configs", variables, meta: {} });
      }
      open?.({ type: "success", message: "View field saved", description: `${cleanLabel} was updated.` });
      setDraft((current) => ({ ...current, id: undefined, sort_order: "100", width: "" }));
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save view field", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h3">View Fields</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr 1fr 120px 120px" }, gap: 2 }}>
            <FormControl>
              <InputLabel>View</InputLabel>
              <Select label="View" value={draft.view_key} onChange={(event) => setDraft((current) => ({ ...current, view_key: event.target.value }))}>
                {VIEW_KEYS.map((view) => <MenuItem key={view.value} value={view.value}>{view.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Field</InputLabel>
              <Select
                label="Field"
                value={draft.field_key}
                onChange={(event) => {
                  const fieldKey = event.target.value;
                  setDraft((current) => ({ ...current, field_key: fieldKey, label: KAIZEN_LIST_FIELD_LABELS[fieldKey] ?? current.label }));
                }}
              >
                {VIEW_FIELD_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <TextField label="Sort" type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
            <TextField label="Width" type="number" value={draft.width} onChange={(event) => setDraft((current) => ({ ...current, width: event.target.value }))} />
          </Box>
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" alignItems="center">
            <FormControlLabel control={<Switch checked={draft.is_visible} onChange={(event) => setDraft((current) => ({ ...current, is_visible: event.target.checked }))} />} label="Visible" />
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSaving} onClick={save}>
              {isSaving ? "Saving..." : "Save View Field"}
            </Button>
          </Stack>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={rows} onRetry={() => query.refetch()} />
          {rows.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>View</TableCell>
                    <TableCell align="right">Sort</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.label)}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.field_key)}</Typography>
                      </TableCell>
                      <TableCell>{emptyValue(row.view_key)}</TableCell>
                      <TableCell align="right">{emptyValue(row.sort_order)}</TableCell>
                      <TableCell><StatusChip status={row.is_visible === false ? "Rejected" : "Approved"} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => edit(row)}>Edit</Button>
                          <Button size="small" color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => onDelete(row)}>Remove</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const BenefitCalculationPanel = ({ refreshKey }: { refreshKey: number }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [draft, setDraft] = useState<BenefitCalculationDraft>(DEFAULT_BENEFIT_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const filters = useMemo<CrudFilters>(() => [], [refreshKey]);
  const { result, query } = useList<BenefitCalculationConfig>({
    resource: "kaizen_benefit_calculation_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const rows = result.data ?? [];
  const displayedRows = rows.length > 0
    ? rows
    : [...DEFAULT_BENEFIT_CALCULATION_CONFIGS] as unknown as BenefitCalculationConfig[];

  const edit = (row: BenefitCalculationConfig) => {
    setDraft({
      id: row.id,
      category: String(row.category ?? ""),
      metric_label: String(row.metric_label ?? "FTE Saving"),
      formula_type: (row.formula_type || "volume_time") as BenefitFormulaType,
      denominator: String(row.denominator ?? 9600),
      multiplier: String(row.multiplier ?? 1),
      help_text: String(row.help_text ?? ""),
      sort_order: String(row.sort_order ?? 100),
      is_active: row.is_active !== false,
    });
  };

  const resetDraft = () => setDraft(DEFAULT_BENEFIT_DRAFT);

  const save = async () => {
    const category = draft.category.trim();
    const metricLabel = draft.metric_label.trim() || "FTE Saving";
    const denominator = Number(draft.denominator);
    const multiplier = Number(draft.multiplier);
    if (!category) {
      open?.({ type: "error", message: "Category required", description: "Enter the Kaizen category this calculation applies to." });
      return;
    }
    if (!Number.isFinite(denominator) || denominator <= 0) {
      open?.({ type: "error", message: "Invalid denominator", description: "Denominator must be greater than 0." });
      return;
    }
    if (!Number.isFinite(multiplier) || multiplier < 0) {
      open?.({ type: "error", message: "Invalid multiplier", description: "Multiplier must be 0 or higher." });
      return;
    }

    setIsSaving(true);
    try {
      const variables = {
        category,
        metric_label: metricLabel,
        formula_type: draft.formula_type,
        denominator,
        multiplier,
        help_text: draft.help_text.trim(),
        sort_order: numberOrZero(draft.sort_order),
        is_active: draft.is_active,
        created_by_username: roles.identity?.username,
        created_at: draft.id ? undefined : nowIso(),
        updated_at: nowIso(),
      };
      if (draft.id) {
        await taruviDataProvider.update({ resource: "kaizen_benefit_calculation_configs", id: draft.id, variables, meta: {} });
      } else {
        await taruviDataProvider.create({ resource: "kaizen_benefit_calculation_configs", variables, meta: {} });
      }
      open?.({ type: "success", message: "Benefit calculation saved", description: `${category} calculation was updated.` });
      resetDraft();
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save benefit calculation", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3">Benefit Calculation</Typography>
            <Typography variant="body2" color="text.secondary">
              Edit the FTE saving formula used while submitting Kaizens. Existing saved Kaizen values are not overwritten.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 140px 140px 120px" }, gap: 2 }}>
            <TextField label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
            <TextField label="Metric Label" value={draft.metric_label} onChange={(event) => setDraft((current) => ({ ...current, metric_label: event.target.value }))} />
            <FormControl>
              <InputLabel>Formula</InputLabel>
              <Select
                label="Formula"
                value={draft.formula_type}
                onChange={(event) => setDraft((current) => ({ ...current, formula_type: event.target.value as BenefitFormulaType }))}
              >
                {BENEFIT_FORMULA_TYPES.map((formula) => (
                  <MenuItem key={formula.value} value={formula.value}>{formula.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Denominator" type="number" value={draft.denominator} onChange={(event) => setDraft((current) => ({ ...current, denominator: event.target.value }))} inputProps={{ min: 0.0001, step: 0.01 }} />
            <TextField label="Multiplier" type="number" value={draft.multiplier} onChange={(event) => setDraft((current) => ({ ...current, multiplier: event.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
            <TextField label="Sort" type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
          </Box>
          <TextField
            label="Helper Text"
            value={draft.help_text}
            onChange={(event) => setDraft((current) => ({ ...current, help_text: event.target.value }))}
            helperText="Shown below the calculated FTE Saving field on the Kaizen form."
            multiline
            minRows={2}
          />
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" alignItems="center">
            <FormControlLabel control={<Switch checked={draft.is_active} onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))} />} label="Active" />
            <Button variant="outlined" onClick={resetDraft}>Reset</Button>
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSaving} onClick={save}>
              {isSaving ? "Saving..." : "Save Calculation"}
            </Button>
          </Stack>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={displayedRows} onRetry={() => query.refetch()} />
          {displayedRows.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Formula</TableCell>
                    <TableCell align="right">Denominator</TableCell>
                    <TableCell align="right">Multiplier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRows.map((row) => (
                    <TableRow key={row.id ?? row.category} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.category)}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.metric_label)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formulaTypeLabel(row.formula_type)}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.help_text)}</Typography>
                      </TableCell>
                      <TableCell align="right">{emptyValue(row.denominator)}</TableCell>
                      <TableCell align="right">{emptyValue(row.multiplier)}</TableCell>
                      <TableCell><StatusChip status={row.is_active === false ? "Rejected" : "Approved"} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => edit(row)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const CostSettingsPanel = ({ refreshKey }: { refreshKey: number }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [amount, setAmount] = useState(String(DEFAULT_COST_SAVED_PER_FTE));
  const [isSaving, setIsSaving] = useState(false);
  const filters = useMemo<CrudFilters>(
    () => [{ field: "config_key", operator: "eq", value: COST_SAVED_PER_FTE_CONFIG_KEY }],
    [refreshKey],
  );
  const { result, query } = useList<AppConfig>({
    resource: "kaizen_app_configs",
    filters,
    pagination: { currentPage: 1, pageSize: 1 },
  });
  const row = result.data?.[0];
  const savedAmount = toNumber(row?.number_value) > 0 ? toNumber(row?.number_value) : DEFAULT_COST_SAVED_PER_FTE;
  const previewAmount = Number(amount);
  const effectivePreviewAmount = Number.isFinite(previewAmount) && previewAmount > 0 ? previewAmount : savedAmount;

  useEffect(() => {
    setAmount(String(savedAmount));
  }, [savedAmount]);

  const save = async () => {
    if (!roles.isSuperAdmin) {
      open?.({ type: "error", message: "Super Admin access required", description: "Only Super Admin users can change the Cost Saved multiplier." });
      return;
    }
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      open?.({ type: "error", message: "Invalid Cost per FTE", description: "Enter an amount greater than 0." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-update-fte-cost-config", {
        fte_cost_usd: parsed,
      });
      if (!response.success) throw new Error(response.error || "Unable to update FTE Cost");
      open?.({ type: "success", message: "Cost setting saved", description: `Cost Saved now uses ${formatCurrency(parsed)} per FTE.` });
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save cost setting", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3">Cost Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Set the dollar amount used by the Executive dashboard Cost Saved card.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 320px) minmax(240px, 320px) auto" }, gap: 2, alignItems: "start" }}>
            <TextField
              label="Cost per FTE"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              helperText="Formula: completed FTE Saving x Cost per FTE."
              inputProps={{ min: 0.01, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Preview"
              value={`1 FTE = ${formatCurrency(effectivePreviewAmount)}`}
              InputProps={{ readOnly: true }}
              helperText={`Current saved value: ${formatCurrency(savedAmount)}.`}
            />
            <Button
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              disabled={isSaving || query.isLoading}
              onClick={save}
            >
              {isSaving ? "Saving..." : "Save Amount"}
            </Button>
          </Box>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={row ? [row] : []} onRetry={() => query.refetch()} />
          {row ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Setting</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.label)}</Typography>
                      <Typography variant="caption" color="text.secondary">{emptyValue(row.description)}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(savedAmount)}</TableCell>
                    <TableCell><StatusChip status={row.is_active === false ? "Rejected" : "Approved"} /></TableCell>
                    <TableCell>{formatDate(row.updated_at || row.created_at)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const DashboardPagesPanel = ({ refreshKey }: { refreshKey: number }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [dashboardKey, setDashboardKey] = useState<DashboardRoleKey>("executive");
  const [draft, setDraft] = useState<DashboardWidgetDraft>(DEFAULT_DASHBOARD_WIDGET_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const filters = useMemo<CrudFilters>(() => [{ field: "dashboard_key", operator: "eq", value: dashboardKey }], [dashboardKey, refreshKey]);
  const { result, query } = useList<DashboardWidgetConfig>({
    resource: "kaizen_dashboard_widget_configs",
    filters,
    sorters: [{ field: "sort_order", order: "asc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const rows = result.data ?? [];
  const dashboardLabel = DASHBOARD_ROLE_OPTIONS.find((role) => role.value === dashboardKey)?.label ?? dashboardKey;

  const edit = (row: DashboardWidgetConfig) => {
    setDraft({
      id: row.id,
      dashboard_key: (row.dashboard_key || dashboardKey) as DashboardRoleKey,
      dashboard_label: String(row.dashboard_label || dashboardLabel),
      widget_key: String(row.widget_key ?? ""),
      widget_type: (row.widget_type || "kpi") as DashboardWidgetType,
      label: String(row.label ?? ""),
      helper_text: String(row.helper_text ?? ""),
      is_visible: row.is_visible !== false,
      sort_order: String(row.sort_order ?? 100),
    });
  };

  const resetDraft = () => {
    setDraft({
      ...DEFAULT_DASHBOARD_WIDGET_DRAFT,
      dashboard_key: dashboardKey,
      dashboard_label: dashboardLabel,
    });
  };

  const save = async () => {
    const cleanLabel = draft.label.trim();
    const cleanWidgetKey = draft.widget_key.trim();
    if (!draft.id || !cleanWidgetKey) {
      open?.({ type: "error", message: "Select a dashboard widget", description: "Use Edit on an existing widget before saving changes." });
      return;
    }
    if (!cleanLabel) {
      open?.({ type: "error", message: "Widget label required", description: "Enter the label that should appear on the dashboard." });
      return;
    }
    setIsSaving(true);
    try {
      await taruviDataProvider.update({
        resource: "kaizen_dashboard_widget_configs",
        id: draft.id,
        variables: {
          dashboard_key: draft.dashboard_key,
          dashboard_label: draft.dashboard_label.trim() || dashboardLabel,
          widget_key: cleanWidgetKey,
          widget_type: draft.widget_type,
          label: cleanLabel,
          helper_text: draft.helper_text.trim(),
          is_visible: draft.is_visible,
          sort_order: numberOrZero(draft.sort_order),
          created_by_username: roles.identity?.username,
          updated_at: nowIso(),
        },
        meta: {},
      });
      open?.({ type: "success", message: "Dashboard widget saved", description: `${cleanLabel} was updated.` });
      resetDraft();
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save dashboard widget", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3">Dashboard Pages</Typography>
            <Typography variant="body2" color="text.secondary">
              Modify dashboard card labels, helper text, order, and visibility by role.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr 1fr 120px 120px" }, gap: 2 }}>
            <FormControl>
              <InputLabel>Dashboard Role</InputLabel>
              <Select
                label="Dashboard Role"
                value={dashboardKey}
                onChange={(event) => {
                  const nextKey = event.target.value as DashboardRoleKey;
                  const nextLabel = DASHBOARD_ROLE_OPTIONS.find((role) => role.value === nextKey)?.label ?? nextKey;
                  setDashboardKey(nextKey);
                  setDraft({ ...DEFAULT_DASHBOARD_WIDGET_DRAFT, dashboard_key: nextKey, dashboard_label: nextLabel });
                }}
              >
                {DASHBOARD_ROLE_OPTIONS.map((role) => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Widget Key" value={draft.widget_key} InputProps={{ readOnly: true }} helperText="Select Edit from the table below." />
            <TextField label="Dashboard Label" value={draft.dashboard_label} onChange={(event) => setDraft((current) => ({ ...current, dashboard_label: event.target.value }))} />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={draft.widget_type} onChange={(event) => setDraft((current) => ({ ...current, widget_type: event.target.value as DashboardWidgetType }))}>
                {DASHBOARD_WIDGET_TYPES.map((type) => <MenuItem key={type} value={type}>{type.toUpperCase()}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Sort" type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" }, gap: 2 }}>
            <TextField label="Dashboard Display Label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <TextField label="Helper Text" value={draft.helper_text} onChange={(event) => setDraft((current) => ({ ...current, helper_text: event.target.value }))} />
          </Box>
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" alignItems="center">
            <FormControlLabel control={<Switch checked={draft.is_visible} onChange={(event) => setDraft((current) => ({ ...current, is_visible: event.target.checked }))} />} label="Visible on dashboard" />
            <Button variant="outlined" onClick={resetDraft}>Reset</Button>
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSaving || !draft.id} onClick={save}>
              {isSaving ? "Saving..." : "Save Dashboard Widget"}
            </Button>
          </Stack>
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={rows} onRetry={() => query.refetch()} />
          {rows.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Widget</TableCell>
                    <TableCell>Helper Text</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Sort</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover selected={draft.id === row.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.label)}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.widget_key)}</Typography>
                      </TableCell>
                      <TableCell>{emptyValue(row.helper_text)}</TableCell>
                      <TableCell>{String(row.widget_type ?? "").toUpperCase()}</TableCell>
                      <TableCell align="right">{emptyValue(row.sort_order)}</TableCell>
                      <TableCell><StatusChip status={row.is_visible === false ? "Rejected" : "Approved"} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => edit(row)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const CertificateSettingsPanel = ({ refreshKey }: { refreshKey: number }) => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [templateDraft, setTemplateDraft] = useState<CertificateTemplateDraft>(DEFAULT_CERTIFICATE_TEMPLATE_DRAFT);
  const [certificateDraft, setCertificateDraft] = useState<CertificateRecordDraft>(DEFAULT_CERTIFICATE_RECORD_DRAFT);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [defaultingTemplateId, setDefaultingTemplateId] = useState("");
  const [regeneratingIdeaId, setRegeneratingIdeaId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const templatesListing = useList<CertificateTemplateConfig>({
    resource: "kaizen_certificate_templates",
    filters: useMemo<CrudFilters>(() => [], [refreshKey]),
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const templates = templatesListing.result.data ?? [];
  const defaultTemplate = templates.find((row) => row.is_default) ?? templates[0];
  const effectiveTemplateId = selectedTemplateId || defaultTemplate?.id || "";

  const certificateListing = useList<CertificateRow>({
    resource: "kaizen_certificates",
    filters: useMemo<CrudFilters>(() => [], [refreshKey]),
    sorters: [{ field: "issued_at", order: "desc" }],
    pagination: SETTINGS_PAGE_SIZE,
  });
  const certificates = certificateListing.result.data ?? [];
  const certificateByIdeaId = useMemo(() => {
    const next = new Map<string, CertificateRow>();
    certificates.forEach((certificate) => {
      if (certificate.idea_id && !next.has(certificate.idea_id)) next.set(certificate.idea_id, certificate);
    });
    return next;
  }, [certificates]);

  const ideaFilters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [{ field: "status", operator: "in", value: CERTIFICATE_READY_STATUSES }];
    const term = debouncedSearch.trim();
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (term) {
      next.push({
        field: "filters",
        operator: "eq",
        value: JSON.stringify({
          or: [
            { kaizen_id__icontains: term },
            { title__icontains: term },
            { submitted_by_username__icontains: term },
            { submitted_by_name__icontains: term },
          ],
        }),
      });
    }
    return next;
  }, [debouncedSearch, refreshKey, status]);

  const ideaListing = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: ideaFilters,
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });
  const ideas = ideaListing.result.data ?? [];
  const totalIdeas = ideaListing.result.total ?? 0;
  const activeFilters = [
    status ? { key: "status", label: `Status: ${status}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const editTemplate = (row: CertificateTemplateConfig) => {
    setTemplateDraft({
      id: row.id,
      template_key: String(row.template_key || ""),
      name: String(row.name || ""),
      certificate_type: String(row.certificate_type || "Standard Kaizen Certificate"),
      version: String(row.version ?? 1),
      status: String(row.status || "Active"),
      is_default: Boolean(row.is_default),
      page_size: String(row.page_size || "A4"),
      orientation: String(row.orientation || "Landscape"),
      background_path: String(row.background_path || ""),
      placeholders: placeholdersToText(row.placeholders),
      logo_config: jsonText(row.logo_config),
      text_fields: jsonText(row.text_fields),
      signature_config: jsonText(row.signature_config),
      style_config: jsonText(row.style_config),
    });
    setSelectedTemplateId(row.id);
    setPreviewHtml(String(row.preview_html || ""));
  };

  const resetTemplateDraft = () => {
    setTemplateDraft(DEFAULT_CERTIFICATE_TEMPLATE_DRAFT);
    setPreviewHtml("");
  };

  const saveTemplate = async () => {
    const name = templateDraft.name.trim();
    const templateKey = templateDraft.template_key.trim();
    if (!name || !templateKey) {
      open?.({ type: "error", message: "Template name and key required", description: "Enter the certificate template name and unique key before saving." });
      return;
    }
    setIsSavingTemplate(true);
    try {
      const payload = {
        action: "save",
        id: templateDraft.id,
        template_key: templateKey,
        name,
        certificate_type: templateDraft.certificate_type,
        version: numberOrZero(templateDraft.version) || 1,
        status: templateDraft.status,
        is_default: templateDraft.is_default,
        page_size: templateDraft.page_size,
        orientation: templateDraft.orientation,
        background_path: templateDraft.background_path.trim(),
        placeholders: placeholdersFromText(templateDraft.placeholders),
        logo_config: parseJsonText("Logo config", templateDraft.logo_config),
        text_fields: parseJsonText("Text fields", templateDraft.text_fields),
        signature_config: parseJsonText("Signature config", templateDraft.signature_config),
        style_config: parseJsonText("Style config", templateDraft.style_config),
        created_by_username: roles.identity?.username,
      };
      const response = await executeFunction<CertificateFunctionResponse>(CERTIFICATE_HELPER_FUNCTION, payload);
      if (response.success === false) throw new Error(response.error || response.message || "Unable to save template.");
      open?.({ type: "success", message: "Certificate template saved", description: `${name} is ready for generation.` });
      if (response.template?.id) setSelectedTemplateId(response.template.id);
      templatesListing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save certificate template", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const previewTemplate = async () => {
    setIsPreviewing(true);
    try {
      const response = await executeFunction<CertificateFunctionResponse & { preview_html?: string }>(CERTIFICATE_HELPER_FUNCTION, {
        action: "preview",
        name: templateDraft.name.trim() || DEFAULT_CERTIFICATE_TEMPLATE_DRAFT.name,
        background_path: templateDraft.background_path.trim(),
        text_fields: parseJsonText("Text fields", templateDraft.text_fields),
        signature_config: parseJsonText("Signature config", templateDraft.signature_config),
        style_config: parseJsonText("Style config", templateDraft.style_config),
        sample: {
          Employee_Name: "QA Employee",
          Kaizen_Title: "Sample Kaizen Title",
          Issue_Date: formatDate(nowIso()),
        },
      });
      if (response.success === false) throw new Error(response.error || response.message || "Unable to preview template.");
      setPreviewHtml(String(response.preview_html || ""));
      open?.({ type: "success", message: "Preview refreshed", description: "The sample certificate preview was generated." });
    } catch (error) {
      open?.({ type: "error", message: "Unable to preview certificate", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsPreviewing(false);
    }
  };

  const uploadTemplateAsset = async (file?: File) => {
    if (!file) return;
    const cleanName = file.name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const path = templateDraft.background_path.trim() || `certificate-templates/${cleanName || "certificate-template.png"}`;
    setIsUploadingAsset(true);
    try {
      const fileBase64 = await readFileAsDataUrl(file);
      const response = await executeFunction<CertificateFunctionResponse>(CERTIFICATE_HELPER_FUNCTION, {
        action: "upload_template",
        path,
        file_base64: fileBase64,
        content_type: file.type || "application/octet-stream",
      });
      if (response.success === false) throw new Error(response.error || response.message || "Unable to upload template asset.");
      setTemplateDraft((current) => ({ ...current, background_path: response.path || path }));
      open?.({ type: "success", message: "Template asset uploaded", description: response.path || path });
    } catch (error) {
      open?.({ type: "error", message: "Unable to upload template asset", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const setDefaultTemplate = async (row: CertificateTemplateConfig) => {
    if (!row.id) return;
    setDefaultingTemplateId(row.id);
    try {
      const response = await executeFunction<CertificateFunctionResponse>(CERTIFICATE_HELPER_FUNCTION, {
        action: "set_default",
        id: row.id,
      });
      if (response.success === false) throw new Error(response.error || response.message || "Unable to set default template.");
      open?.({ type: "success", message: "Default template updated", description: `${row.name || row.template_key} is now the default.` });
      templatesListing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to set default template", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setDefaultingTemplateId("");
    }
  };

  const editCertificate = (row: CertificateRow) => {
    setCertificateDraft({
      id: row.id,
      certificate_number: String(row.certificate_number || ""),
      recipient_name: String(row.recipient_name || ""),
      recipient_username: String(row.recipient_username || ""),
      recipient_email: String(row.recipient_email || ""),
      status: String(row.status || "Generated"),
      reward_amount: String(row.reward_amount ?? 0),
      issued_at: toDateInputValue(row.issued_at),
      certificate_path: String(row.certificate_path || ""),
    });
  };

  const resetCertificateDraft = () => setCertificateDraft(DEFAULT_CERTIFICATE_RECORD_DRAFT);

  const saveCertificate = async () => {
    if (!certificateDraft.id) {
      open?.({ type: "error", message: "Select a certificate", description: "Use Edit on a generated certificate before saving metadata." });
      return;
    }
    if (!certificateDraft.certificate_number.trim()) {
      open?.({ type: "error", message: "Certificate number required", description: "Enter a certificate number before saving." });
      return;
    }
    setIsSavingCertificate(true);
    try {
      await taruviDataProvider.update({
        resource: "kaizen_certificates",
        id: certificateDraft.id,
        variables: {
          certificate_number: certificateDraft.certificate_number.trim(),
          recipient_name: certificateDraft.recipient_name.trim(),
          recipient_username: certificateDraft.recipient_username.trim(),
          recipient_email: certificateDraft.recipient_email.trim(),
          status: certificateDraft.status,
          reward_amount: toNumber(certificateDraft.reward_amount),
          issued_at: certificateDraft.issued_at ? new Date(`${certificateDraft.issued_at}T00:00:00`).toISOString() : null,
          certificate_path: certificateDraft.certificate_path.trim(),
        },
        meta: {},
      });
      open?.({ type: "success", message: "Certificate metadata saved", description: certificateDraft.certificate_number.trim() });
      certificateListing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save certificate", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const regenerateCertificate = async (idea: KaizenIdea) => {
    if (!idea.id) return;
    setRegeneratingIdeaId(idea.id);
    try {
      const response = await executeFunction<CertificateFunctionResponse>(CERTIFICATE_HELPER_FUNCTION, {
        action: "regenerate",
        idea_id: idea.id,
        template_id: effectiveTemplateId || undefined,
      });
      if (response.success === false) throw new Error(response.error || response.message || "Unable to regenerate certificate.");
      open?.({
        type: "success",
        message: "Certificate regenerated",
        description: response.certificate?.certificate_number || idea.kaizen_id || idea.title || "Kaizen certificate updated.",
      });
      certificateListing.query.refetch();
      ideaListing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to regenerate certificate", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setRegeneratingIdeaId("");
    }
  };

  const clearIdeaFilters = () => {
    setStatus("");
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h3">Certificate Templates</Typography>
              <Typography variant="body2" color="text.secondary">
                Modify template metadata, placeholder mappings, and the background asset used for certificate generation.
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 220px 140px 140px" }, gap: 2 }}>
              <TextField label="Template Name" value={templateDraft.name} onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))} />
              <TextField label="Template Key" value={templateDraft.template_key} onChange={(event) => setTemplateDraft((current) => ({ ...current, template_key: event.target.value }))} />
              <FormControl>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={templateDraft.certificate_type} onChange={(event) => setTemplateDraft((current) => ({ ...current, certificate_type: event.target.value }))}>
                  {CERTIFICATE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Version" type="number" value={templateDraft.version} onChange={(event) => setTemplateDraft((current) => ({ ...current, version: event.target.value }))} />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={templateDraft.status} onChange={(event) => setTemplateDraft((current) => ({ ...current, status: event.target.value }))}>
                  {CERTIFICATE_TEMPLATE_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "120px 160px 1fr auto" }, gap: 2, alignItems: "start" }}>
              <TextField label="Page Size" value={templateDraft.page_size} onChange={(event) => setTemplateDraft((current) => ({ ...current, page_size: event.target.value }))} />
              <FormControl>
                <InputLabel>Orientation</InputLabel>
                <Select label="Orientation" value={templateDraft.orientation} onChange={(event) => setTemplateDraft((current) => ({ ...current, orientation: event.target.value }))}>
                  <MenuItem value="Landscape">Landscape</MenuItem>
                  <MenuItem value="Portrait">Portrait</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Background Asset Path" value={templateDraft.background_path} onChange={(event) => setTemplateDraft((current) => ({ ...current, background_path: event.target.value }))} helperText="Stored in the kaizen-attachments bucket." />
              <Button component="label" variant="outlined" startIcon={isUploadingAsset ? <CircularProgress size={16} color="inherit" /> : <UploadFileRoundedIcon />} disabled={isUploadingAsset}>
                Upload
                <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" onChange={(event) => uploadTemplateAsset(event.target.files?.[0])} />
              </Button>
            </Box>
            <TextField label="Placeholders" value={templateDraft.placeholders} onChange={(event) => setTemplateDraft((current) => ({ ...current, placeholders: event.target.value }))} helperText="Comma-separated names used by generation." />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
              <TextField label="Text Fields JSON" value={templateDraft.text_fields} onChange={(event) => setTemplateDraft((current) => ({ ...current, text_fields: event.target.value }))} multiline minRows={7} />
              <TextField label="Logo Config JSON" value={templateDraft.logo_config} onChange={(event) => setTemplateDraft((current) => ({ ...current, logo_config: event.target.value }))} multiline minRows={7} />
              <TextField label="Signature Config JSON" value={templateDraft.signature_config} onChange={(event) => setTemplateDraft((current) => ({ ...current, signature_config: event.target.value }))} multiline minRows={7} />
              <TextField label="Style Config JSON" value={templateDraft.style_config} onChange={(event) => setTemplateDraft((current) => ({ ...current, style_config: event.target.value }))} multiline minRows={7} />
            </Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
              <FormControlLabel control={<Switch checked={templateDraft.is_default} onChange={(event) => setTemplateDraft((current) => ({ ...current, is_default: event.target.checked }))} />} label="Default template" />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="flex-end">
                <Button variant="outlined" onClick={resetTemplateDraft}>New Template</Button>
                <Button variant="outlined" startIcon={isPreviewing ? <CircularProgress size={16} color="inherit" /> : <VisibilityRoundedIcon />} disabled={isPreviewing} onClick={previewTemplate}>
                  Preview
                </Button>
                <Button variant="contained" startIcon={isSavingTemplate ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSavingTemplate} onClick={saveTemplate}>
                  {isSavingTemplate ? "Saving..." : "Save Template"}
                </Button>
              </Stack>
            </Stack>
            <SettingsTableState isLoading={templatesListing.query.isLoading} isError={templatesListing.query.isError} rows={templates} onRetry={() => templatesListing.query.refetch()} />
            {templates.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Template</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Asset</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map((row) => (
                      <TableRow key={row.id} hover selected={templateDraft.id === row.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.name)}</Typography>
                          <Typography variant="caption" color="text.secondary">{emptyValue(row.template_key)}{row.is_default ? " - Default" : ""}</Typography>
                        </TableCell>
                        <TableCell>{emptyValue(row.certificate_type)}</TableCell>
                        <TableCell><StatusChip status={row.status || "Active"} /></TableCell>
                        <TableCell>{emptyValue(row.background_path)}</TableCell>
                        <TableCell>{formatDate(row.updated_at || row.created_at)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => editTemplate(row)}>Edit</Button>
                            <Button size="small" variant="contained" disabled={row.is_default || defaultingTemplateId === row.id} onClick={() => setDefaultTemplate(row)}>
                              {defaultingTemplateId === row.id ? "Saving..." : "Default"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : null}
            {previewHtml ? (
              <Box
                component="iframe"
                title="Certificate template preview"
                srcDoc={previewHtml}
                sx={{ width: "100%", minHeight: 420, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default" }}
              />
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h3">Generated Certificates</Typography>
              <Typography variant="body2" color="text.secondary">
                Modify generated certificate metadata and open existing certificate files.
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 180px" }, gap: 2 }}>
              <TextField label="Certificate Number" value={certificateDraft.certificate_number} onChange={(event) => setCertificateDraft((current) => ({ ...current, certificate_number: event.target.value }))} />
              <TextField label="Recipient Name" value={certificateDraft.recipient_name} onChange={(event) => setCertificateDraft((current) => ({ ...current, recipient_name: event.target.value }))} />
              <TextField label="Recipient Username" value={certificateDraft.recipient_username} onChange={(event) => setCertificateDraft((current) => ({ ...current, recipient_username: event.target.value }))} />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={certificateDraft.status} onChange={(event) => setCertificateDraft((current) => ({ ...current, status: event.target.value }))}>
                  {CERTIFICATE_RECORD_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Recipient Email" value={certificateDraft.recipient_email} onChange={(event) => setCertificateDraft((current) => ({ ...current, recipient_email: event.target.value }))} />
              <TextField label="Reward Amount" type="number" value={certificateDraft.reward_amount} onChange={(event) => setCertificateDraft((current) => ({ ...current, reward_amount: event.target.value }))} />
              <TextField label="Issued" type="date" value={certificateDraft.issued_at} onChange={(event) => setCertificateDraft((current) => ({ ...current, issued_at: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Certificate Path" value={certificateDraft.certificate_path} onChange={(event) => setCertificateDraft((current) => ({ ...current, certificate_path: event.target.value }))} />
            </Box>
            <Stack direction="row" spacing={1.25} justifyContent="flex-end">
              <Button variant="outlined" onClick={resetCertificateDraft}>Clear</Button>
              <Button variant="contained" startIcon={isSavingCertificate ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSavingCertificate || !certificateDraft.id} onClick={saveCertificate}>
                {isSavingCertificate ? "Saving..." : "Save Certificate"}
              </Button>
            </Stack>
            <SettingsTableState isLoading={certificateListing.query.isLoading} isError={certificateListing.query.isError} rows={certificates} onRetry={() => certificateListing.query.refetch()} />
            {certificates.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Certificate</TableCell>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Issued</TableCell>
                      <TableCell align="right">Reward</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificates.map((row) => {
                      const url = certificateUrl(row.certificate_path);
                      return (
                        <TableRow key={row.id} hover selected={certificateDraft.id === row.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.certificate_number)}</Typography>
                            <Typography variant="caption" color="text.secondary">{emptyValue(row.certificate_path)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{emptyValue(row.recipient_name || row.recipient_username)}</Typography>
                            <Typography variant="caption" color="text.secondary">{emptyValue(row.recipient_email)}</Typography>
                          </TableCell>
                          <TableCell><StatusChip status={row.status || "Generated"} /></TableCell>
                          <TableCell>{formatDate(row.issued_at)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.reward_amount)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => editCertificate(row)}>Edit</Button>
                              {url ? (
                                <>
                                  <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} href={url} target="_blank" rel="noreferrer">View</Button>
                                  <Button size="small" variant="contained" startIcon={<DownloadRoundedIcon />} href={url} download={certificateDownloadName(row)}>Download</Button>
                                </>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h3">Regenerate Certificates</Typography>
              <Typography variant="body2" color="text.secondary">
                Regenerate certificate files for completed Kaizens using the selected template.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { md: 320 } }}
              />
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Template</InputLabel>
                <Select label="Template" value={effectiveTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                  {templates.map((template) => <MenuItem key={template.id} value={template.id}>{template.name || template.template_key}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
                  <MenuItem value="">All eligible statuses</MenuItem>
                  {CERTIFICATE_READY_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <ActiveFilterChips filters={activeFilters} onDelete={clearIdeaFilters} onClear={clearIdeaFilters} />
            <SettingsTableState
              isLoading={ideaListing.query.isLoading}
              isError={ideaListing.query.isError}
              rows={ideas}
              hasSearch={Boolean(debouncedSearch.trim())}
              hasFilters={Boolean(status)}
              onRetry={() => ideaListing.query.refetch()}
              onClear={() => {
                setSearch("");
                clearIdeaFilters();
              }}
            />
            {ideas.length > 0 ? (
              <>
                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Kaizen</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Certificate</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ideas.map((idea) => {
                        const certificate = certificateByIdeaId.get(idea.id);
                        const url = certificateUrl(certificate?.certificate_path || idea.certificate_path);
                        const isRegenerating = regeneratingIdeaId === idea.id;
                        return (
                          <TableRow key={idea.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(idea.title)}</Typography>
                              <Typography variant="caption" color="text.secondary">{idea.kaizen_id || "Draft"}</Typography>
                            </TableCell>
                            <TableCell><StatusChip status={idea.status} /></TableCell>
                            <TableCell>{emptyValue(idea.submitted_by_name || idea.submitted_by_username)}</TableCell>
                            <TableCell>{formatDate(idea.closed_at || idea.updated_at || idea.created_at)}</TableCell>
                            <TableCell>{certificate?.certificate_number || idea.certificate_path || "-"}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                {url ? <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} href={url} target="_blank" rel="noreferrer">View</Button> : null}
                                <Button size="small" variant="contained" startIcon={isRegenerating ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />} disabled={isRegenerating} onClick={() => regenerateCertificate(idea)}>
                                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
                <TablePagination
                  component="div"
                  count={totalIdeas}
                  page={page}
                  rowsPerPage={pageSize}
                  rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                  onPageChange={(_, next) => setPage(next)}
                  onRowsPerPageChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(0);
                  }}
                />
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

const KaizenDeletePanel = ({ refreshKey, onDelete }: { refreshKey: number; onDelete: (row: KaizenIdea) => void }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search, 350);
  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    const term = debouncedSearch.trim();
    if (term) {
      next.push({
        field: "filters",
        operator: "eq",
        value: JSON.stringify({
          and: [
            {
              or: [
                { kaizen_id__icontains: term },
                { title__icontains: term },
                { submitted_by_username__icontains: term },
                { submitted_by_name__icontains: term },
              ],
            },
          ],
        }),
      });
    }
    if (status) next.push({ field: "status", operator: "eq", value: status });
    return next;
  }, [debouncedSearch, refreshKey, status]);

  const { result, query } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters,
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });
  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const hasFilters = Boolean(status);
  const activeFilters = [
    status ? { key: "status", label: `Status: ${status}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilters = () => {
    setStatus("");
    setPage(0);
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h3">Delete Kaizen</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              size="small"
              label="Search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { md: 320 } }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
                <MenuItem value="">All statuses</MenuItem>
                {KAIZEN_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <ActiveFilterChips filters={activeFilters} onDelete={clearFilters} onClear={clearFilters} />
          <SettingsTableState isLoading={query.isLoading} isError={query.isError} rows={rows} hasSearch={Boolean(debouncedSearch.trim())} hasFilters={hasFilters} onRetry={() => query.refetch()} onClear={() => { setSearch(""); clearFilters(); }} />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kaizen</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted By</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Tooltip title={row.title || ""}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(row.title)}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.kaizen_id || "Draft"} - {row.id}</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell><StatusChip status={row.status} /></TableCell>
                        <TableCell>{emptyValue(row.submitted_by_name || row.submitted_by_username)}</TableCell>
                        <TableCell>{formatDate(row.updated_at || row.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" color="error" variant="contained" startIcon={<DeleteRoundedIcon />} onClick={() => onDelete(row)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination
                component="div"
                count={total}
                page={page}
                rowsPerPage={pageSize}
                rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                onPageChange={(_, next) => setPage(next)}
                onRowsPerPageChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(0);
                }}
              />
            </>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

const SettingsTableState = ({
  isLoading,
  isError,
  rows,
  hasSearch = false,
  hasFilters = false,
  onRetry,
  onClear,
}: {
  isLoading?: boolean;
  isError?: boolean;
  rows: unknown[];
  hasSearch?: boolean;
  hasFilters?: boolean;
  onRetry: () => void;
  onClear?: () => void;
}) => {
  if (isLoading) {
    return (
      <Stack spacing={1} alignItems="center" sx={{ py: 4 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">Loading settings...</Typography>
      </Stack>
    );
  }
  if (isError) {
    return <EmptyState kind="error" title="Unable to load data" body="Refresh the page or retry the request." action={<Button variant="contained" onClick={onRetry}>Retry</Button>} />;
  }
  if (rows.length > 0) return null;
  if (hasSearch) {
    return <EmptyState kind="no-results" title="No results found" body="Try adjusting your search" action={onClear ? <Button variant="outlined" onClick={onClear}>Clear search</Button> : undefined} />;
  }
  if (hasFilters) {
    return <EmptyState kind="no-matches" title="No matching items" body="No records match the current filters" action={onClear ? <Button variant="outlined" onClick={onClear}>Clear filters</Button> : undefined} />;
  }
  return <EmptyState kind="no-data" title="No settings yet" body="Create the first setting value to begin configuration." />;
};

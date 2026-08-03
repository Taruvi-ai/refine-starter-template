import { useEffect, useMemo, useRef, useState } from "react";
import { useList, useNotification, type BaseRecord, type CrudFilters } from "@refinedev/core";
import { Database, type BackendFilterNode, type BackendFilterTreeRoot } from "@taruvi/sdk";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import NewspaperRoundedIcon from "@mui/icons-material/NewspaperRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { taruviTokens } from "../../theme/themeOptions";
import { taruviClient } from "../../taruviClient";
import { executeFunction } from "../../utils/functionHelpers";
import {
  ActiveFilterChips,
  CategoryChip,
  EmptyState,
  KAIZEN_CATEGORIES,
  StatusChip,
  emptyValue,
  formatCurrency,
  formatDate,
  formatInteger,
  toNumber,
  useDebouncedValue,
  useKaizenRoles,
  type KaizenIdea,
  type TaruviIdentity,
} from "../kaizens/shared";
import { KpiCard, PageHeader, csvFromObjects, downloadText, openPrintableHtml } from "../program/shared";

type Sorter = { field: string; order: "asc" | "desc" };
type JsonMap = Record<string, unknown>;
type AuditLogScope = "all" | "mine" | "team";
type AuditLogScopeSelection = AuditLogScope | "auto";

type FormulaConfig = {
  id: string;
  config_key: string;
  version?: number | string | null;
  status?: string | null;
  effective_date?: string | null;
  applies_retroactively?: boolean | null;
  cost_per_hour_saved?: number | string | null;
  rework_reduction_weight?: number | string | null;
  category_multipliers?: Record<string, number>;
  effort_rules?: JsonMap;
  high_impact_thresholds?: JsonMap;
  formula?: JsonMap;
  backup_json?: JsonMap;
  change_notes?: string | null;
  created_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HighImpactAnalysis = {
  id: string;
  quarter: string;
  year: number;
  title: string;
  status?: string | null;
  top_n?: number | string | null;
  selected_count?: number | string | null;
  total_candidates?: number | string | null;
  report_html?: string | null;
  report_markdown?: string | null;
  csv_data?: string | null;
  generated_by_username?: string | null;
  created_at?: string | null;
};

type HighImpactItem = {
  id: string;
  analysis_id?: string | null;
  idea_id?: string | null;
  rank?: number | string | null;
  kaizen_id?: string | null;
  title?: string | null;
  submitter_username?: string | null;
  department_name?: string | null;
  category?: string | null;
  hours_saved?: number | string | null;
  cost_saved?: number | string | null;
  weighted_score?: number | string | null;
  award_status?: string | null;
  selected_for_award?: boolean | null;
};

type AuditLog = {
  id: string;
  timestamp?: string | null;
  user_username?: string | null;
  user_display_name?: string | null;
  user_role?: string | null;
  action_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  kaizen_id?: string | null;
  department_name?: string | null;
  severity?: string | null;
  source?: string | null;
  old_value?: JsonMap | null;
  new_value?: JsonMap | null;
  created_at?: string | null;
};

type DuplicateCheck = {
  id: string;
  idea_id?: string | null;
  candidate_idea_id?: string | null;
  kaizen_id?: string | null;
  candidate_kaizen_id?: string | null;
  check_status?: string | null;
  similarity_percent?: number | string | null;
  classification?: string | null;
  matched_meaning?: string | null;
  scoring_method?: string | null;
  matched_fields?: string[] | null;
  threshold?: number | string | null;
  justification?: string | null;
  action_taken?: string | null;
  reviewed_by_username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TaxonomyRow = {
  id: string;
  taxonomy_type?: string | null;
  parent_id?: string | null;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  incentive_formula_key?: string | null;
  keywords?: string[] | null;
  usage_count?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EmailTemplate = {
  id: string;
  template_key: string;
  name?: string | null;
  notification_type?: string | null;
  subject?: string | null;
  body_html?: string | null;
  body_text?: string | null;
  placeholders?: string[] | null;
  cc?: string[] | null;
  bcc?: string[] | null;
  footer_html?: string | null;
  language?: string | null;
  version?: number | string | null;
  status?: string | null;
  is_default?: boolean | null;
  updated_by_username?: string | null;
  created_at?: string | null;
};

type NewsletterRow = {
  id: string;
  month: number;
  year: number;
  title: string;
  status?: string | null;
  sections?: JsonMap;
  html_content?: string | null;
  markdown_content?: string | null;
  printable_html?: string | null;
  summary?: JsonMap;
  download_count?: number | string | null;
  generated_by_username?: string | null;
  published_at?: string | null;
  emailed_at?: string | null;
  created_at?: string | null;
};

type HealthSnapshot = {
  id: string;
  snapshot_at?: string | null;
  active_users?: number | string | null;
  total_users?: number | string | null;
  avg_page_load_ms?: number | string | null;
  uptime_pct?: number | string | null;
  storage_used_mb?: number | string | null;
  failed_login_attempts?: number | string | null;
  error_rate_24h?: number | string | null;
  api_response_ms?: number | string | null;
  email_sent?: number | string | null;
  email_failed?: number | string | null;
  email_pending?: number | string | null;
  backup_status?: string | null;
  cache_status?: string | null;
  scheduled_jobs?: JsonMap;
  created_at?: string | null;
};

type SystemAlertRow = {
  id: string;
  alert_type?: string | null;
  severity?: string | null;
  status?: string | null;
  metric_key?: string | null;
  message?: string | null;
  threshold_value?: number | string | null;
  actual_value?: number | string | null;
  resolved_by_username?: string | null;
  resolved_at?: string | null;
  created_at?: string | null;
};

const SMALL_PAGE = { currentPage: 1, pageSize: 100 };
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const CREATED_DESC: Sorter[] = [{ field: "created_at", order: "desc" }];
const UPDATED_DESC: Sorter[] = [{ field: "updated_at", order: "desc" }];
const AUDIT_TIMESTAMP_DESC: Sorter[] = [{ field: "timestamp", order: "desc" }];
const HIGH_IMPACT_APPROVED_SORTERS: Sorter[] = [{ field: "high_impact_decision_at", order: "desc" }];
const CHART_COLOR = taruviTokens.status.chartPrimary;
const SECONDARY_CHART_COLOR = taruviTokens.status.resolved;
const HIGH_IMPACT_APPROVED_PAGE = { currentPage: 1, pageSize: 1000 };

type HighImpactFilterNode =
  | Record<string, unknown>
  | { and: HighImpactFilterNode[] }
  | { or: HighImpactFilterNode[] };

const highImpactFilterTree = (nodes: HighImpactFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const ALL_QUARTERS = "All";
const QUARTER_OPTIONS = [ALL_QUARTERS, "Q1", "Q2", "Q3", "Q4"] as const;

const currentQuarter = () => `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

const yearRange = (year: number) => {
  if (!Number.isFinite(year)) return null;
  const format = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}T00:00:00`;
  };
  return { start: format(new Date(year, 0, 1)), end: format(new Date(year + 1, 0, 1)) };
};

const quarterRange = (year: number, quarter: string) => {
  const quarterNumber = Number(String(quarter).replace(/^Q/i, ""));
  if (!Number.isFinite(year) || !Number.isFinite(quarterNumber) || quarterNumber < 1 || quarterNumber > 4) {
    return null;
  }
  const start = new Date(year, (quarterNumber - 1) * 3, 1);
  const end = new Date(year, quarterNumber * 3, 1);
  const format = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}T00:00:00`;
  };
  return { start: format(start), end: format(end) };
};

const highImpactPeriodRange = (year: number, quarter: string) =>
  quarter === ALL_QUARTERS ? yearRange(year) : quarterRange(year, quarter);

const usePagedResource = <T extends BaseRecord>(resource: string, filters: CrudFilters, sorters: Sorter[] = CREATED_DESC) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [filters, resource]);

  const { result, query } = useList<T>({
    resource,
    filters,
    sorters,
    pagination: { currentPage: page + 1, pageSize },
  });

  return {
    rows: result.data ?? [],
    total: result.total ?? result.data?.length ?? 0,
    query,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
};

const useAuditLogRows = (filters: BackendFilterTreeRoot, sorters: Sorter[], pageSize = 1000) => {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);
  const filterKey = useMemo(() => JSON.stringify({ filters, sorters, pageSize }), [filters, sorters, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(!hasLoadedRef.current);
    setIsError(false);

    let query = new Database(taruviClient).from("kaizen_audit_logs");
    if (filters.length > 0) {
      query = query.filters(filters);
    }
    sorters.forEach((sorter) => {
      query = query.sort(sorter.field, sorter.order);
    });

    query
      .page(1)
      .pageSize(pageSize)
      .execute()
      .then((response) => {
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setRows(data as AuditLog[]);
        setTotal(response.total ?? data.length);
        hasLoadedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setIsError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filterKey, refreshKey]);

  return {
    rows,
    total,
    query: {
      isLoading,
      isError,
      refetch: () => setRefreshKey((current) => current + 1),
    },
  };
};

const searchFilter = (debouncedSearch: string): CrudFilters =>
  debouncedSearch.trim().length > 1 ? [{ field: "search", operator: "eq", value: debouncedSearch.trim() }] : [];

type AuditBackendFilterNode =
  | Record<string, unknown>
  | { and: AuditBackendFilterNode[] }
  | { or: AuditBackendFilterNode[] };

const auditSearchFields = ["user_username", "action_type", "entity_type", "entity_id", "source", "kaizen_id", "department_name"];

const auditFilterTree = (nodes: AuditBackendFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const auditLogFilterTree = (nodes: BackendFilterNode[]): BackendFilterTreeRoot =>
  nodes.length > 0 ? [{ operator: "and", value: nodes }] : [];

const buildAuditLogFilters = ({
  activeScope,
  canViewTeamScope,
  currentUsernames,
  dateFrom,
  dateTo,
  debouncedSearch,
  employeeIdeaIds,
  employeeIdeaKaizenIds,
  isAuditAccessReady,
  isEmployeeAuditRestricted,
  matchingIdeaIds,
  matchingIdeaKaizenIds,
  teamUsernames,
  username,
}: {
  activeScope: AuditLogScope;
  canViewTeamScope: boolean;
  currentUsernames: string[];
  dateFrom: string;
  dateTo: string;
  debouncedSearch: string;
  employeeIdeaIds: string[];
  employeeIdeaKaizenIds: string[];
  isAuditAccessReady: boolean;
  isEmployeeAuditRestricted: boolean;
  matchingIdeaIds: string[];
  matchingIdeaKaizenIds: string[];
  teamUsernames: string[];
  username: string;
}): BackendFilterTreeRoot => {
  if (!isAuditAccessReady) {
    return auditLogFilterTree([{ field: "id", operator: "eq", value: "__identity_loading__" }]);
  }

  const nodes: BackendFilterNode[] = [];
  const searchTerm = debouncedSearch.trim();

  if (searchTerm.length > 1) {
    const searchNodes: BackendFilterNode[] = auditSearchFields.map((field) => ({ field, operator: "icontains", value: searchTerm }));
    if (matchingIdeaIds.length > 0) searchNodes.push({ field: "entity_id", operator: "in", value: matchingIdeaIds });
    if (matchingIdeaKaizenIds.length > 0) searchNodes.push({ field: "kaizen_id", operator: "in", value: matchingIdeaKaizenIds });
    nodes.push({
      operator: "or",
      value: searchNodes,
    });
  }

  if (isEmployeeAuditRestricted) {
    const employeeKaizenNodes: BackendFilterNode[] = [];
    if (employeeIdeaIds.length > 0) employeeKaizenNodes.push({ field: "entity_id", operator: "in", value: employeeIdeaIds });
    if (employeeIdeaKaizenIds.length > 0) employeeKaizenNodes.push({ field: "kaizen_id", operator: "in", value: employeeIdeaKaizenIds });

    nodes.push(
      employeeKaizenNodes.length > 0
        ? { operator: "or", value: employeeKaizenNodes }
        : { field: "entity_id", operator: "eq", value: "__no_employee_kaizen_scope__" },
    );
  } else if (activeScope === "team" && canViewTeamScope) {
    nodes.push(
      teamUsernames.length > 0
        ? { field: "user_username", operator: "in", value: teamUsernames }
        : { field: "user_username", operator: "eq", value: "__no_team_scope__" },
    );
  } else if (activeScope !== "all") {
    nodes.push(
      currentUsernames.length > 1
        ? { field: "user_username", operator: "in", value: currentUsernames }
        : { field: "user_username", operator: "eq", value: username || "__no_user_scope__" },
    );
  }

  if (dateFrom) nodes.push({ field: "timestamp", operator: "gte", value: `${dateFrom}T00:00:00` });
  if (dateTo) nodes.push({ field: "timestamp", operator: "lte", value: `${dateTo}T23:59:59` });

  return auditLogFilterTree(nodes);
};

const emailLocalPart = (value?: string | null) => {
  const email = String(value ?? "").trim();
  return email.includes("@") ? email.split("@")[0] : "";
};

const uniqueIdentityValues = (values: Array<unknown>) => {
  const aliases = new Set<string>();
  values.forEach((value) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    aliases.add(text);
    aliases.add(text.toLowerCase());
  });
  return Array.from(aliases);
};

const uniqueStrings = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const isJsonMap = (value: unknown): value is JsonMap =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const auditFieldLabels: Record<string, string> = {
  id: "Record ID",
  kaizen_id: "Kaizen ID",
  title: "Kaizen Title",
  status: "Status",
  current_stage: "Current Stage",
  department_name: "Department",
  category: "Category",
  effort_type: "Effort Type",
  dependency: "Dependency",
  submitted_by_username: "Submitted By",
  reporting_manager_username: "Reporting Manager",
  impacted_volume: "Monthly Impacted Volume",
  time_saved: "Time Saved",
  fte_saving: "FTE Saved",
  fte_cost_usd: "FTE Cost (USD)",
  hours_saved: "Hours Saved",
  cost_saved: "Cost Saved",
  rework_reduced_percent: "Rework Reduction (%)",
  error_before: "Before Error Count",
  error_after: "After Error Count",
  rework_time: "Rework Time",
  total_time_saved: "Total Time Saved",
  advanced_impact_score: "Advanced Impact Score",
  impact_validation_status: "Impact Validation Status",
  evidence_status: "Evidence Status",
  updated_at: "Updated At",
};

const impactAuditFields = new Set([
  "impacted_volume",
  "time_saved",
  "fte_saving",
  "fte_cost_usd",
  "hours_saved",
  "cost_saved",
  "rework_reduced_percent",
  "error_before",
  "error_after",
  "rework_time",
  "total_time_saved",
  "advanced_impact_score",
  "impact_validation_status",
  "evidence_status",
]);

const auditFieldSection = (field: string) =>
  impactAuditFields.has(field) ? "Impact" : field === "dependency" ? "Idea Details" : "Kaizen Details";

const auditFieldLabel = (field: string) =>
  auditFieldLabels[field] ??
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const auditValueText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.map(auditValueText).join(", ") : "-";
  if (isJsonMap(value)) return JSON.stringify(value, null, 2);
  return String(value);
};

const auditValuesMatch = (first: unknown, second: unknown) =>
  JSON.stringify(first ?? null) === JSON.stringify(second ?? null);

const auditRoleText = (row?: AuditLog | null) => {
  if (!row) return "-";
  if (row.user_role) return row.user_role;
  const context = `${row.action_type ?? ""} ${row.user_username ?? ""}`.toLowerCase();
  if (context.includes("lead/manager") || context.includes("leadmanager")) return "Lead/Manager";
  if (context.includes("om/som") || context.includes("omsom")) return "OM/SOM";
  if (context.includes("pe/qa") || context.includes("peqa")) return "PE/QA";
  if (context.includes("employee")) return "Employee";
  if (context.includes("admin")) return "Admin";
  return "-";
};

const auditChangedFields = (row?: AuditLog | null) => {
  if (!row) return [];
  const oldValue = isJsonMap(row.old_value) ? row.old_value : {};
  const newValue = isJsonMap(row.new_value) ? row.new_value : {};
  return uniqueStrings([...Object.keys(oldValue), ...Object.keys(newValue)])
    .filter((field) => !auditValuesMatch(oldValue[field], newValue[field]))
    .map((field) => ({
      field,
      label: auditFieldLabel(field),
      section: auditFieldSection(field),
      before: oldValue[field],
      after: newValue[field],
      timestamp: row.timestamp ?? row.created_at,
      updatedBy: row.user_display_name || row.user_username,
      role: auditRoleText(row),
      eventId: row.id,
    }));
};

const auditPayloadString = (row: AuditLog, field: string) => {
  const oldValue = isJsonMap(row.old_value) ? row.old_value : {};
  const newValue = isJsonMap(row.new_value) ? row.new_value : {};
  const value = newValue[field] ?? oldValue[field];
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

const normalizeAuditKeyPart = (value?: string | null) => String(value ?? "").trim().toLowerCase();

const auditEventTime = (row: AuditLog) => {
  const time = new Date(row.timestamp ?? row.created_at ?? "").getTime();
  return Number.isFinite(time) ? time : 0;
};

const auditKaizenGroupingKey = (row: AuditLog, lookup?: Map<string, KaizenIdea>) => {
  if (String(row.entity_type ?? "").toLowerCase() !== "kaizen") return `event:${row.id}`;
  const idea = lookup?.get(row.entity_id ?? "") ?? lookup?.get(row.kaizen_id ?? "");
  const title = idea?.title || auditPayloadString(row, "title");
  const department = idea?.department_name || row.department_name || auditPayloadString(row, "department_name");
  const submitter = auditPayloadString(row, "submitted_by_username") || row.user_username || "";
  if (title) {
    return `kaizen-title:${normalizeAuditKeyPart(title)}|department:${normalizeAuditKeyPart(department)}|submitter:${normalizeAuditKeyPart(submitter)}`;
  }
  const kaizenId = idea?.kaizen_id || row.kaizen_id || auditPayloadString(row, "kaizen_id");
  if (kaizenId) return `kaizen-id:${normalizeAuditKeyPart(kaizenId)}`;
  return `kaizen-entity:${normalizeAuditKeyPart(row.entity_id)}`;
};

const latestAuditRowsByKaizen = (rows: AuditLog[], lookup?: Map<string, KaizenIdea>) => {
  const latest = new Map<string, AuditLog>();
  [...rows]
    .sort((first, second) => auditEventTime(second) - auditEventTime(first))
    .forEach((row) => {
      const key = auditKaizenGroupingKey(row, lookup);
      if (!latest.has(key)) latest.set(key, row);
    });
  return Array.from(latest.values());
};

const formatAuditDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const AuditDetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box>
    <Typography variant="overline" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
      {value || "-"}
    </Typography>
  </Box>
);

const identityUsernameAliases = (identity?: TaruviIdentity | null) => {
  const attrs = identity?.attributes ?? {};
  return uniqueIdentityValues([
    identity?.username,
    identity?.email,
    emailLocalPart(identity?.email),
    attrs.username,
    attrs.user_username,
    attrs.preferred_username,
    attrs.employee_username,
    attrs.email,
    emailLocalPart(typeof attrs.email === "string" ? attrs.email : ""),
  ]);
};

const statusColor = (status?: string | null) =>
  status === "Open" || status === "Review Required" || status === "Critical" || status === "Failed"
    ? "error"
    : status === "Generated" || status === "Queued" || status === "Warning" || status === "Pending"
      ? "warning"
      : status === "Published" || status === "Resolved" || status === "Active" || status === "Enabled" || status === "Recommended"
        ? "success"
        : "default";

const StatusPill = ({ status }: { status?: string | null }) => (
  <Chip size="small" color={statusColor(status)} label={status || "Unknown"} />
);

const PageContainer = ({ children }: { children: React.ReactNode }) => (
  <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
    <Stack spacing={3}>{children}</Stack>
  </Container>
);

const TablePager = ({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}) => (
  <TablePagination
    component="div"
    count={total}
    page={page}
    rowsPerPage={pageSize}
    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
    onPageChange={(_, next) => onPage(next)}
    onRowsPerPageChange={(event) => {
      onPageSize(Number(event.target.value));
      onPage(0);
    }}
  />
);

const QueryState = ({
  isLoading,
  isError,
  rows,
  emptyTitle,
  emptyBody,
  onRetry,
}: {
  isLoading?: boolean;
  isError?: boolean;
  rows: unknown[];
  emptyTitle: string;
  emptyBody: string;
  onRetry?: () => void;
}) => {
  if (isLoading) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError) {
    return <EmptyState kind="error" title="Unable to load data" body="Refresh the page or retry the request." action={<Button onClick={onRetry}>Retry</Button>} />;
  }
  if (rows.length === 0) {
    return <EmptyState kind="no-data" title={emptyTitle} body={emptyBody} />;
  }
  return null;
};

const splitList = (value?: string | string[] | null) =>
  Array.isArray(value)
    ? value.map(String).filter(Boolean)
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const ExportButton = ({ onClick, label = "Export" }: { onClick: () => void; label?: string }) => (
  <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onClick}>
    {label}
  </Button>
);

export const IncentiveRulesPage = () => {
  const { open } = useNotification();
  const [sample, setSample] = useState({ category: "Productivity", effort_type: "Team", hours_saved: "18", cost_saved: "900", rework_reduced_percent: "8" });
  const [preview, setPreview] = useState<JsonMap | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const filters = useMemo<CrudFilters>(() => [], []);
  const listing = usePagedResource<FormulaConfig>("kaizen_incentive_formula_configs", filters, [{ field: "version", order: "desc" }]);
  const rows = listing.rows;
  const active = rows.find((row) => row.status === "Active") ?? rows[0];

  const runPreview = async () => {
    setIsRunning(true);
    try {
      const response = await executeFunction<{ success: boolean; errors?: string[]; preview?: JsonMap }>("kaizen-incentive-rules", {
        action: "preview",
        sample: {
          category: sample.category,
          effort_type: sample.effort_type,
          hours_saved: Number(sample.hours_saved),
          cost_saved: Number(sample.cost_saved),
          rework_reduced_percent: Number(sample.rework_reduced_percent),
        },
      });
      if (!response.success) throw new Error(response.errors?.join(", ") || "Preview failed");
      setPreview(response.preview ?? null);
    } catch (error) {
      open?.({ type: "error", message: "Unable to preview formula", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const exportActive = async () => {
    const response = await executeFunction<{ success: boolean; json?: string; config?: JsonMap }>("kaizen-incentive-rules", { action: "export" });
    downloadText("kaizen-incentive-formula.json", response.json || JSON.stringify(response.config ?? active ?? {}, null, 2), "application/json;charset=utf-8");
  };

  const saveVersion = async () => {
    if (!active) return;
    setIsRunning(true);
    try {
      const config = { ...(active.backup_json ?? active), change_notes: changeNotes || active.change_notes };
      const response = await executeFunction<{ success: boolean; errors?: string[] }>("kaizen-incentive-rules", { action: "save", config, change_notes: changeNotes || "Saved from incentive rules page" });
      if (!response.success) throw new Error(response.errors?.join(", ") || "Save failed");
      open?.({ type: "success", message: "Formula version saved", description: "The active incentive formula was versioned." });
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save formula", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const importVersion = async () => {
    setIsRunning(true);
    try {
      const config = JSON.parse(importJson);
      const response = await executeFunction<{ success: boolean; errors?: string[] }>("kaizen-incentive-rules", { action: "import", config, change_notes: "Imported from incentive rules page" });
      if (!response.success) throw new Error(response.errors?.join(", ") || "Import failed");
      setImportOpen(false);
      setImportJson("");
      open?.({ type: "success", message: "Formula imported", description: "A new formula version was created." });
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to import formula", description: error instanceof Error ? error.message : "Check the JSON and try again." });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Incentive Formula Rules"
        subtitle="Configure versioned reward formulas, preview payouts, and import/export active rules."
        action={
          <Stack direction="row" spacing={1}>
            <ExportButton onClick={exportActive} />
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={!active || isRunning} onClick={saveVersion}>Save Version</Button>
          </Stack>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard label="Active Version" value={active?.version ?? "-"} helper={active?.config_key} icon={<RuleRoundedIcon />} isLoading={listing.query.isLoading} />
        <KpiCard label="Cost / Hour" value={formatCurrency(active?.cost_per_hour_saved ?? 0)} helper="Saved hour value" icon={<WorkspacePremiumRoundedIcon />} isLoading={listing.query.isLoading} />
        <KpiCard label="Rework Weight" value={formatInteger(active?.rework_reduction_weight ?? 0)} helper="Impact formula input" icon={<RuleRoundedIcon />} isLoading={listing.query.isLoading} />
        <KpiCard label="Formula Status" value={active?.status ?? "-"} helper={active?.effective_date ? `Effective ${formatDate(active.effective_date)}` : "No date"} icon={<CheckCircleRoundedIcon />} isLoading={listing.query.isLoading} />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Preview Calculator</Typography>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={sample.category} onChange={(event) => setSample((current) => ({ ...current, category: event.target.value }))}>
                {KAIZEN_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Effort</InputLabel>
              <Select label="Effort" value={sample.effort_type} onChange={(event) => setSample((current) => ({ ...current, effort_type: event.target.value }))}>
                {["Individual", "Team", "Project Lead", "Project Member"].map((effort) => <MenuItem key={effort} value={effort}>{effort}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Hours Saved" type="number" value={sample.hours_saved} onChange={(event) => setSample((current) => ({ ...current, hours_saved: event.target.value }))} />
            <TextField size="small" label="Cost Saved" type="number" value={sample.cost_saved} onChange={(event) => setSample((current) => ({ ...current, cost_saved: event.target.value }))} />
            <TextField size="small" label="Rework %" type="number" value={sample.rework_reduced_percent} onChange={(event) => setSample((current) => ({ ...current, rework_reduced_percent: event.target.value }))} />
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <PreviewRoundedIcon />} disabled={isRunning} onClick={runPreview}>Preview</Button>
          </Stack>
          {preview ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
              <Chip color="primary" label={`Incentive ${formatCurrency(preview.calculated_incentive)}`} />
              <Chip color={preview.high_impact ? "success" : "default"} label={preview.high_impact ? "High impact" : "Standard impact"} />
              <Chip variant="outlined" label={`Award ${formatCurrency(preview.award_amount)}`} />
              <Chip variant="outlined" label={`Total ${formatCurrency(preview.total_reward)}`} />
            </Stack>
          ) : null}
          <TextField label="Change notes" value={changeNotes} onChange={(event) => setChangeNotes(event.target.value)} fullWidth multiline minRows={2} sx={{ mt: 2 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Version History</Typography>
          <QueryState isLoading={listing.query.isLoading} isError={listing.query.isError} rows={rows} emptyTitle="No formulas yet" emptyBody="Save or import a formula to start version history." onRetry={() => listing.query.refetch()} />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell align="right">Version</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Effective</TableCell>
                      <TableCell align="right">Cost / Hour</TableCell>
                      <TableCell>Updated By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.config_key}</TableCell>
                        <TableCell align="right">{row.version}</TableCell>
                        <TableCell><StatusPill status={row.status} /></TableCell>
                        <TableCell>{formatDate(row.effective_date)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.cost_per_hour_saved)}</TableCell>
                        <TableCell>{emptyValue(row.created_by_username)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePager total={listing.total} page={listing.page} pageSize={listing.pageSize} onPage={listing.setPage} onPageSize={listing.setPageSize} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Import incentive formula?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Paste a previously exported JSON formula. A new active version will be created after validation.</DialogContentText>
          <TextField label="Formula JSON" value={importJson} onChange={(event) => setImportJson(event.target.value)} multiline minRows={12} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button color="primary" variant="contained" disabled={isRunning || !importJson.trim()} onClick={importVersion}>Import</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export const HighImpactAnalysisPage = () => {
  const { open } = useNotification();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState(currentQuarter);
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedYear = Number(year);
  const hasSelectedYear = Boolean(year.trim()) && Number.isFinite(selectedYear);
  const isAllQuarters = quarter === ALL_QUARTERS;
  const selectedPeriodLabel = isAllQuarters
    ? `all quarters in ${hasSelectedYear ? year.trim() : "selected year"}`
    : `${quarter} ${hasSelectedYear ? year.trim() : "selected year"}`;
  const selectedRange = useMemo(() => (hasSelectedYear ? highImpactPeriodRange(selectedYear, quarter) : null), [hasSelectedYear, quarter, selectedYear]);
  const analysisFilters = useMemo<CrudFilters>(() => {
    const filters: CrudFilters = [];
    if (!isAllQuarters) filters.push({ field: "quarter", operator: "eq", value: quarter });
    if (hasSelectedYear) filters.push({ field: "year", operator: "eq", value: selectedYear });
    return filters;
  }, [hasSelectedYear, isAllQuarters, quarter, selectedYear]);
  const approvedHighImpactFilters = useMemo<CrudFilters>(() => {
    if (!selectedRange) return [{ field: "id", operator: "eq", value: "__invalid_high_impact_period__" }];
    return highImpactFilterTree([
      { high_impact_nomination_status__eq: "Approved" },
      { kaizen_id__nnull: true },
      { kaizen_id__ne: "" },
      { status__ne: "Draft" },
      {
        or: [
          { and: [{ high_impact_decision_at__gte: selectedRange.start }, { high_impact_decision_at__lt: selectedRange.end }] },
          {
            and: [
              { high_impact_decision_at__null: true },
              { submitted_at__gte: selectedRange.start },
              { submitted_at__lt: selectedRange.end },
            ],
          },
          {
            and: [
              { high_impact_decision_at__null: true },
              { submitted_at__null: true },
              { created_at__gte: selectedRange.start },
              { created_at__lt: selectedRange.end },
            ],
          },
        ],
      },
    ]);
  }, [selectedRange]);
  const listing = usePagedResource<HighImpactAnalysis>("kaizen_high_impact_analyses", analysisFilters, CREATED_DESC);
  const analyses = useMemo(
    () =>
      listing.rows.filter(
        (analysis) => (isAllQuarters || analysis.quarter === quarter) && (!hasSelectedYear || Number(analysis.year) === selectedYear),
      ),
    [hasSelectedYear, isAllQuarters, listing.rows, quarter, selectedYear],
  );
  const activeAnalysis = analyses[0];
  const analysisIds = useMemo(() => analyses.map((analysis) => analysis.id).filter(Boolean), [analyses]);
  const itemFilters = useMemo<CrudFilters>(() => {
    if (analysisIds.length === 0) return [];
    return [
      {
        field: "analysis_id",
        operator: analysisIds.length > 1 ? "in" : "eq",
        value: analysisIds.length > 1 ? analysisIds : analysisIds[0],
      },
    ];
  }, [analysisIds]);
  const { result: itemsResult, query: itemsQuery } = useList<HighImpactItem>({
    resource: "kaizen_high_impact_analysis_items",
    filters: itemFilters,
    sorters: [{ field: "rank", order: "asc" }],
    pagination: SMALL_PAGE,
    queryOptions: { enabled: analysisIds.length > 0 },
  });
  const items = analysisIds.length > 0 ? itemsResult.data ?? [] : [];
  const approvedHighImpactQueryOptions = useMemo(() => ({ enabled: Boolean(selectedRange) }), [selectedRange]);
  const approvedHighImpact = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: approvedHighImpactFilters,
    sorters: HIGH_IMPACT_APPROVED_SORTERS,
    pagination: HIGH_IMPACT_APPROVED_PAGE,
    queryOptions: approvedHighImpactQueryOptions,
  });
  const displayItems = useMemo<HighImpactItem[]>(() => {
    const generatedKeys = new Set(
      items.flatMap((item) => [item.idea_id, item.kaizen_id].filter(Boolean).map(String)),
    );
    const approvedRows = (approvedHighImpact.result.data ?? [])
      .filter((idea) => !generatedKeys.has(String(idea.id)) && !generatedKeys.has(String(idea.kaizen_id ?? "")))
      .sort((first, second) => {
        const firstScore = toNumber(first.advanced_impact_score ?? first.hours_saved ?? first.cost_saved);
        const secondScore = toNumber(second.advanced_impact_score ?? second.hours_saved ?? second.cost_saved);
        if (secondScore !== firstScore) return secondScore - firstScore;
        return (
          Date.parse(second.high_impact_decision_at || second.submitted_at || second.created_at || "") -
          Date.parse(first.high_impact_decision_at || first.submitted_at || first.created_at || "")
        );
      })
      .map<HighImpactItem>((idea, index) => ({
        id: `approved-${idea.id}`,
        analysis_id: activeAnalysis?.id ?? null,
        idea_id: idea.id,
        rank: items.length + index + 1,
        kaizen_id: idea.kaizen_id,
        title: idea.title,
        submitter_username: idea.submitted_by_username,
        department_name: idea.department_name,
        category: idea.category,
        hours_saved: idea.hours_saved,
        cost_saved: idea.cost_saved,
        weighted_score: idea.advanced_impact_score ?? idea.hours_saved ?? idea.cost_saved ?? 0,
        award_status: "Approved",
        selected_for_award: true,
      }));
    return [...items, ...approvedRows]
      .sort((first, second) => {
        const firstScore = toNumber(first.weighted_score ?? first.hours_saved ?? first.cost_saved);
        const secondScore = toNumber(second.weighted_score ?? second.hours_saved ?? second.cost_saved);
        if (secondScore !== firstScore) return secondScore - firstScore;
        return toNumber(first.rank) - toNumber(second.rank);
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [activeAnalysis?.id, approvedHighImpact.result.data, items]);

  const generate = async () => {
    if (!hasSelectedYear) {
      open?.({ type: "error", message: "Year is required", description: "Select a valid year before generating high impact Kaizens." });
      return;
    }

    setIsGenerating(true);
    try {
      const quartersToGenerate = isAllQuarters ? ["Q1", "Q2", "Q3", "Q4"] : [quarter];

      for (const selectedQuarter of quartersToGenerate) {
        const response = await executeFunction<{ success: boolean; error?: string; analysis?: HighImpactAnalysis }>("kaizen-high-impact-analysis", {
          action: "generate",
          year: selectedYear,
          quarter: selectedQuarter,
          top_n: 5,
          minimum_threshold: 0,
        });
        if (!response.success) throw new Error(response.error || `Generation failed for ${selectedQuarter}`);
      }

      open?.({
        type: "success",
        message: "High impact Kaizen list generated",
        description: isAllQuarters ? "The latest ranked lists are ready for all quarters." : "The latest ranked list is ready.",
      });
      listing.query.refetch();
      if (analysisIds.length > 0) itemsQuery.refetch();
      approvedHighImpact.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to generate analysis", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="High Impact Kaizen" subtitle="Generate and review ranked high impact Kaizens." />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField size="small" label="Year" type="number" value={year} onChange={(event) => setYear(event.target.value)} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Quarter</InputLabel>
              <Select label="Quarter" value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                {QUARTER_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <WorkspacePremiumRoundedIcon />} disabled={isGenerating} onClick={generate}>Generate</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="h3">Ranked Kaizens</Typography>
                <Typography variant="body2" color="text.secondary">
                  {displayItems.length > 0
                    ? `Showing high impact Kaizens for ${selectedPeriodLabel}.`
                    : `No approved high impact Kaizens found for ${selectedPeriodLabel}.`}
                </Typography>
              </Box>
            </Stack>

            <QueryState
              isLoading={listing.query.isLoading || approvedHighImpact.query.isLoading || (analysisIds.length > 0 && itemsQuery.isLoading)}
              isError={listing.query.isError || approvedHighImpact.query.isError || (analysisIds.length > 0 && itemsQuery.isError)}
              rows={displayItems}
              emptyTitle="No high impact Kaizens yet"
              emptyBody={`Approved high impact Kaizens or generated ranked items for ${selectedPeriodLabel} will appear here.`}
              onRetry={() => {
                listing.query.refetch();
                if (analysisIds.length > 0) itemsQuery.refetch();
                approvedHighImpact.query.refetch();
              }}
            />

            {displayItems.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">Rank</TableCell>
                      <TableCell>Kaizen</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell align="right">{item.rank}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.kaizen_id}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.title}</Typography>
                        </TableCell>
                        <TableCell>{item.department_name}</TableCell>
                        <TableCell><CategoryChip category={item.category} /></TableCell>
                        <TableCell align="right">{formatInteger(item.weighted_score)}</TableCell>
                        <TableCell><StatusPill status={item.award_status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export const AuditLogsPage = () => {
  const roles = useKaizenRoles();
  const [scope, setScope] = useState<AuditLogScopeSelection>("auto");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const currentUsernames = useMemo(() => identityUsernameAliases(roles.identity), [roles.identity]);
  const username = currentUsernames[0] ?? "";
  const isIdentityReady = Boolean(roles.identity?.id || currentUsernames.length > 0);
  const isAuditAccessReady = isIdentityReady && !roles.isLoading;
  const isEmployeeAuditRestricted =
    roles.canSubmitKaizen && !roles.isManager && !roles.isOmSomRole && !roles.isPeQaRole && !roles.isAdmin && !roles.isSuperAdmin;
  const canViewAllAuditLogs = isAuditAccessReady && !isEmployeeAuditRestricted;
  const leadManagerOnly = roles.isManager && !roles.isAdmin && !roles.isOmSom && !roles.isPeQa;
  const employeeIdeaFilters = useMemo<CrudFilters>(
    () =>
      currentUsernames.length > 0
        ? [{ field: "submitted_by_username", operator: "in", value: currentUsernames }]
        : [{ field: "id", operator: "eq", value: "__no_employee_identity__" }],
    [currentUsernames],
  );
  const employeeIdeas = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: employeeIdeaFilters,
    pagination: { currentPage: 1, pageSize: 1000 },
    queryOptions: { enabled: isAuditAccessReady && isEmployeeAuditRestricted && currentUsernames.length > 0 },
  });
  const employeeIdeaIds = useMemo(
    () => uniqueStrings((employeeIdeas.result.data ?? []).map((idea) => idea.id)),
    [employeeIdeas.result.data],
  );
  const employeeIdeaKaizenIds = useMemo(
    () => uniqueStrings((employeeIdeas.result.data ?? []).map((idea) => idea.kaizen_id)),
    [employeeIdeas.result.data],
  );
  const teamIdeaFilters = useMemo<CrudFilters>(
    () =>
      currentUsernames.length > 0
        ? [
            { field: "reporting_manager_username", operator: "in", value: currentUsernames },
            { field: "submitted_by_username", operator: "nin", value: currentUsernames },
          ]
        : [{ field: "id", operator: "eq", value: "__no_team_scope__" }],
    [currentUsernames],
  );
  const teamIdeas = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: teamIdeaFilters,
    pagination: { currentPage: 1, pageSize: 1000 },
    queryOptions: { enabled: canViewAllAuditLogs && currentUsernames.length > 0 },
  });
  const teamUsernames = useMemo(() => {
    const names = new Set<string>();
    (teamIdeas.result.data ?? []).forEach((idea) => {
      if (idea.submitted_by_username && !currentUsernames.includes(idea.submitted_by_username)) {
        names.add(idea.submitted_by_username);
      }
    });
    return Array.from(names);
  }, [currentUsernames, teamIdeas.result.data]);
  const canViewTeamScope = canViewAllAuditLogs && (leadManagerOnly || teamUsernames.length > 0);
  const scopeOptions = useMemo<Array<{ value: AuditLogScope; label: string }>>(() => {
    if (!canViewAllAuditLogs) return [{ value: "mine", label: "My Kaizen logs" }];

    const options: Array<{ value: AuditLogScope; label: string }> = [{ value: "all", label: "All logs" }];
    if (!roles.isAdmin && currentUsernames.length > 0) options.push({ value: "mine", label: "My logs" });
    if (canViewTeamScope) options.push({ value: "team", label: "Team logs" });
    return options;
  }, [canViewAllAuditLogs, canViewTeamScope, currentUsernames.length, roles.isAdmin]);
  const defaultScope: AuditLogScope = canViewAllAuditLogs ? "all" : "mine";
  const activeScope = scopeOptions.some((option) => option.value === scope)
    ? (scope as AuditLogScope)
    : scopeOptions.some((option) => option.value === defaultScope)
      ? defaultScope
      : scopeOptions[0]?.value ?? "mine";
  const auditSearchTerm = debouncedSearch.trim();
  const matchingIdeaFilters = useMemo<CrudFilters>(
    () => {
      if (auditSearchTerm.length <= 1) return [];

      const nodes: AuditBackendFilterNode[] = [
        {
          or: [
            { title__icontains: auditSearchTerm },
            { kaizen_id__icontains: auditSearchTerm },
            { department_name__icontains: auditSearchTerm },
            { status__icontains: auditSearchTerm },
          ],
        },
      ];

      if (isEmployeeAuditRestricted) {
        nodes.push(
          currentUsernames.length > 0
            ? { submitted_by_username__in: currentUsernames }
            : { id__eq: "__no_employee_identity__" },
        );
      }

      return auditFilterTree(nodes);
    },
    [auditSearchTerm, currentUsernames, isEmployeeAuditRestricted],
  );
  const matchingIdeas = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: matchingIdeaFilters,
    pagination: { currentPage: 1, pageSize: 1000 },
    queryOptions: { enabled: isAuditAccessReady && auditSearchTerm.length > 1 },
  });
  const matchingIdeaIds = useMemo(
    () => uniqueStrings((matchingIdeas.result.data ?? []).map((idea) => idea.id)),
    [matchingIdeas.result.data],
  );
  const matchingIdeaKaizenIds = useMemo(
    () => uniqueStrings((matchingIdeas.result.data ?? []).map((idea) => idea.kaizen_id)),
    [matchingIdeas.result.data],
  );
  const filters = useMemo<BackendFilterTreeRoot>(() => {
    return buildAuditLogFilters({
      activeScope,
      canViewTeamScope,
      currentUsernames,
      dateFrom,
      dateTo,
      debouncedSearch,
      employeeIdeaIds,
      employeeIdeaKaizenIds,
      isAuditAccessReady,
      isEmployeeAuditRestricted,
      matchingIdeaIds,
      matchingIdeaKaizenIds,
      teamUsernames,
      username,
    });
  }, [
    activeScope,
    canViewTeamScope,
    currentUsernames,
    dateFrom,
    dateTo,
    debouncedSearch,
    employeeIdeaIds,
    employeeIdeaKaizenIds,
    isAuditAccessReady,
    isEmployeeAuditRestricted,
    matchingIdeaIds,
    matchingIdeaKaizenIds,
    teamUsernames,
    username,
  ]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const auditFiltersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    setPage(0);
  }, [auditFiltersKey]);

  const allAuditLogsQuery = useAuditLogRows(filters, AUDIT_TIMESTAMP_DESC);
  const allAuditRows = allAuditLogsQuery.rows;
  const auditIdeaEntityIds = useMemo(
    () =>
      uniqueStrings(
        allAuditRows
          .filter((row) => String(row.entity_type ?? "").toLowerCase() === "kaizen")
          .map((row) => row.entity_id),
      ),
    [allAuditRows],
  );
  const auditIdeaKaizenIds = useMemo(() => uniqueStrings(allAuditRows.map((row) => row.kaizen_id)), [allAuditRows]);
  const auditIdeaEntityFilters = useMemo<CrudFilters>(
    () => (auditIdeaEntityIds.length > 0 ? [{ field: "id", operator: "in", value: auditIdeaEntityIds }] : []),
    [auditIdeaEntityIds],
  );
  const auditIdeaKaizenFilters = useMemo<CrudFilters>(
    () => (auditIdeaKaizenIds.length > 0 ? [{ field: "kaizen_id", operator: "in", value: auditIdeaKaizenIds }] : []),
    [auditIdeaKaizenIds],
  );
  const auditIdeasByEntity = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: auditIdeaEntityFilters,
    pagination: { currentPage: 1, pageSize: 1000 },
    queryOptions: { enabled: auditIdeaEntityIds.length > 0 },
  });
  const auditIdeasByKaizenId = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: auditIdeaKaizenFilters,
    pagination: { currentPage: 1, pageSize: 1000 },
    queryOptions: { enabled: auditIdeaKaizenIds.length > 0 },
  });
  const auditIdeaLookup = useMemo(() => {
    const lookup = new Map<string, KaizenIdea>();
    [...(auditIdeasByEntity.result.data ?? []), ...(auditIdeasByKaizenId.result.data ?? []), ...(matchingIdeas.result.data ?? [])].forEach((idea) => {
      if (idea.id) lookup.set(idea.id, idea);
      if (idea.kaizen_id) lookup.set(idea.kaizen_id, idea);
    });
    return lookup;
  }, [auditIdeasByEntity.result.data, auditIdeasByKaizenId.result.data, matchingIdeas.result.data]);
  const groupedAuditRows = useMemo(() => latestAuditRowsByKaizen(allAuditRows, auditIdeaLookup), [allAuditRows, auditIdeaLookup]);
  const rows = useMemo(
    () => groupedAuditRows.slice(page * pageSize, page * pageSize + pageSize),
    [groupedAuditRows, page, pageSize],
  );
  const selectedAuditIdea = selectedAudit ? auditIdeaLookup.get(selectedAudit.entity_id ?? "") ?? auditIdeaLookup.get(selectedAudit.kaizen_id ?? "") : undefined;
  const selectedAuditHistory = useMemo(() => {
    if (!selectedAudit) return [];
    const selectedKey = auditKaizenGroupingKey(selectedAudit, auditIdeaLookup);
    return allAuditRows
      .filter((row) => auditKaizenGroupingKey(row, auditIdeaLookup) === selectedKey)
      .sort((first, second) => auditEventTime(second) - auditEventTime(first));
  }, [allAuditRows, auditIdeaLookup, selectedAudit]);
  const selectedAuditChanges = useMemo(
    () => selectedAuditHistory.flatMap((event) => auditChangedFields(event)),
    [selectedAuditHistory],
  );
  const scopeLabel = scopeOptions.find((option) => option.value === activeScope)?.label ?? "My logs";
  const isIdentityLoading = !isAuditAccessReady;
  const isTeamLookupLoading = activeScope === "team" && teamIdeas.query.isLoading;
  const isEmployeeIdeaLookupLoading = isEmployeeAuditRestricted && employeeIdeas.query.isLoading;
  const isSearchIdeaLookupLoading = auditSearchTerm.length > 1 && matchingIdeas.query.isLoading;
  const chips = [
    { key: "scope", label: `Scope: ${scopeLabel}` },
    search ? { key: "search", label: `Search: ${search}` } : null,
    dateFrom ? { key: "dateFrom", label: `From: ${dateFrom}` } : null,
    dateTo ? { key: "dateTo", label: `To: ${dateTo}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const removeChip = (key: string) => {
    if (key === "scope") return;
    if (key === "search") setSearch("");
    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
  };

  const renderAuditEntity = (row: AuditLog) => {
    const idea = auditIdeaLookup.get(row.entity_id ?? "") ?? auditIdeaLookup.get(row.kaizen_id ?? "");
    const entityLabel = row.entity_type || "Entity";
    const fallbackReference = row.kaizen_id || (row.entity_id ? `#${row.entity_id.slice(0, 8)}` : "");

    if (idea) {
      return (
        <Button
          variant="text"
          onClick={() => setSelectedAudit(row)}
          sx={{ justifyContent: "flex-start", minWidth: 0, p: 0, textAlign: "left", textTransform: "none" }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {idea.title || idea.kaizen_id || "Draft Kaizen"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {idea.kaizen_id || entityLabel}
              {idea.status ? ` - ${idea.status}` : ""}
              {idea.department_name ? ` - ${idea.department_name}` : ""}
            </Typography>
          </Box>
        </Button>
      );
    }

    return (
      <Button
        variant="text"
        onClick={() => setSelectedAudit(row)}
        sx={{ justifyContent: "flex-start", minWidth: 0, p: 0, textAlign: "left", textTransform: "none" }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {entityLabel} {fallbackReference}
          </Typography>
          {row.department_name ? (
            <Typography variant="caption" color="text.secondary">
              {row.department_name}
            </Typography>
          ) : null}
        </Box>
      </Button>
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Audit Log & Activity Trail" subtitle="Search immutable activity records, choose a scope, and review evidence." />
      <Card>
        <CardContent>
          {scopeOptions.length > 1 ? (
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs
                value={activeScope}
                onChange={(_, nextScope: AuditLogScope) => {
                  setScope(nextScope);
                  setPage(0);
                }}
                aria-label="Audit log scope"
              >
                {scopeOptions.map((option) => (
                  <Tab key={option.value} value={option.value} label={option.label} />
                ))}
              </Tabs>
            </Box>
          ) : null}
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { lg: 300 } }} />
            <TextField size="small" label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} />
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                if (isEmployeeAuditRestricted) employeeIdeas.query.refetch();
                if (activeScope === "team") teamIdeas.query.refetch();
                if (auditSearchTerm.length > 1) matchingIdeas.query.refetch();
                allAuditLogsQuery.query.refetch();
              }}
            >
              Refresh
            </Button>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <ActiveFilterChips filters={chips} onDelete={removeChip} onClear={() => { setSearch(""); setDateFrom(""); setDateTo(""); }} />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <QueryState
            isLoading={isIdentityLoading || allAuditLogsQuery.query.isLoading || isEmployeeIdeaLookupLoading || isTeamLookupLoading || isSearchIdeaLookupLoading}
            isError={
              allAuditLogsQuery.query.isError ||
              (isEmployeeAuditRestricted && employeeIdeas.query.isError) ||
              (activeScope === "team" && teamIdeas.query.isError) ||
              (auditSearchTerm.length > 1 && matchingIdeas.query.isError)
            }
            rows={groupedAuditRows}
            emptyTitle={isEmployeeAuditRestricted ? "No audit events for your Kaizens" : activeScope === "team" ? "No team audit events" : "No audit events"}
            emptyBody={
              isEmployeeAuditRestricted
                ? "Activity history for your submitted Kaizens will appear here after workflow changes are recorded."
                : activeScope === "team"
                  ? "Team member activity records will appear here once your team interacts with the system."
                  : "Activity records will appear as users interact with the system."
            }
            onRetry={() => {
              if (isEmployeeAuditRestricted) employeeIdeas.query.refetch();
              if (activeScope === "team") teamIdeas.query.refetch();
              if (auditSearchTerm.length > 1) matchingIdeas.query.refetch();
              allAuditLogsQuery.query.refetch();
            }}
          />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Kaizen / ID</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDate(row.timestamp)}</TableCell>
                        <TableCell>{emptyValue(row.user_display_name || row.user_username)}</TableCell>
                        <TableCell>{auditRoleText(row)}</TableCell>
                        <TableCell>{emptyValue(row.action_type)}</TableCell>
                        <TableCell>{renderAuditEntity(row)}</TableCell>
                        <TableCell>{emptyValue(row.source)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePager total={groupedAuditRows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
            </>
          ) : null}
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedAudit)} onClose={() => setSelectedAudit(null)} fullWidth maxWidth="md">
        <DialogTitle>Audit event details</DialogTitle>
        <DialogContent>
          {selectedAudit ? (
            <Stack spacing={2.5}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                <AuditDetailItem label="Who" value={emptyValue(selectedAudit.user_username)} />
                <AuditDetailItem label="Role" value={auditRoleText(selectedAudit)} />
                <AuditDetailItem label="When" value={formatAuditDateTime(selectedAudit.timestamp ?? selectedAudit.created_at)} />
                <AuditDetailItem label="Action" value={emptyValue(selectedAudit.action_type)} />
                <AuditDetailItem label="Source" value={emptyValue(selectedAudit.source)} />
                <AuditDetailItem label="Kaizen" value={selectedAuditIdea?.title || selectedAudit.kaizen_id || "Draft Kaizen"} />
                <AuditDetailItem label="Kaizen ID" value={selectedAudit.kaizen_id || selectedAuditIdea?.kaizen_id || "-"} />
                <AuditDetailItem label="Record ID" value={selectedAudit.entity_id || selectedAudit.id} />
                <AuditDetailItem label="Department" value={selectedAudit.department_name || selectedAuditIdea?.department_name || "-"} />
              </Box>
              {selectedAuditHistory.length > 1 ? (
                <Box>
                  <Typography variant="h3" sx={{ mb: 1.5 }}>
                    Activity History
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>When</TableCell>
                          <TableCell>Who</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Source</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAuditHistory.map((event) => (
                          <TableRow
                            key={event.id}
                            hover
                            selected={event.id === selectedAudit.id}
                            onClick={() => setSelectedAudit(event)}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell>{formatAuditDateTime(event.timestamp ?? event.created_at)}</TableCell>
                            <TableCell>{emptyValue(event.user_display_name || event.user_username)}</TableCell>
                            <TableCell>{auditRoleText(event)}</TableCell>
                            <TableCell>{emptyValue(event.action_type)}</TableCell>
                            <TableCell>{emptyValue(event.source)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              ) : null}
              <Divider />
              <Box>
                <Typography variant="h3" sx={{ mb: 1.5 }}>
                  Changes Made
                </Typography>
                {selectedAuditChanges.length > 0 ? (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date &amp; Time</TableCell>
                          <TableCell>Updated By</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Section</TableCell>
                          <TableCell>Field</TableCell>
                          <TableCell>Before</TableCell>
                          <TableCell>After</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAuditChanges.map((change) => (
                          <TableRow key={`${change.eventId}-${change.field}`}>
                            <TableCell>{formatAuditDateTime(change.timestamp)}</TableCell>
                            <TableCell>{emptyValue(change.updatedBy)}</TableCell>
                            <TableCell>{emptyValue(change.role)}</TableCell>
                            <TableCell>{change.section}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{change.label}</TableCell>
                            <TableCell sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 320 }}>
                              {auditValueText(change.before)}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 320 }}>
                              {auditValueText(change.after)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Alert severity="info">No field-level values were captured for this audit event.</Alert>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedAudit(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export const DuplicateManagementPage = () => {
  const { open } = useNotification();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState<{ row: DuplicateCheck; action: string } | null>(null);
  const [justification, setJustification] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const filters = useMemo<CrudFilters>(() => {
    const next = searchFilter(debouncedSearch);
    if (status) next.push({ field: "check_status", operator: "eq", value: status });
    return next;
  }, [debouncedSearch, search, status]);
  const listing = usePagedResource<DuplicateCheck>("kaizen_duplicate_checks", filters, UPDATED_DESC);
  const rows = listing.rows;

  const confirmDecision = async () => {
    if (!decision) return;
    try {
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-duplicate-detection", {
        action: decision.action,
        check_id: decision.row.id,
        justification,
      });
      if (!response.success) throw new Error(response.error || "Decision failed");
      open?.({ type: "success", message: "Duplicate decision saved", description: `${decision.action} was recorded.` });
      setDecision(null);
      setJustification("");
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to update duplicate check", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Duplicate Detection"
        subtitle="Review potential duplicate Kaizens, capture decisions, and export prevention records."
        action={<ExportButton onClick={() => downloadText("duplicate-checks.csv", csvFromObjects(rows as unknown as Array<Record<string, unknown>>, ["created_at", "kaizen_id", "candidate_kaizen_id", "similarity_percent", "classification", "matched_meaning", "scoring_method", "check_status", "action_taken"]), "text/csv;charset=utf-8")} />}
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 300 } }} />
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {["Review Required", "Warning", "Linked", "Merged", "Dismissed", "Proceed Justified"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <QueryState isLoading={listing.query.isLoading} isError={listing.query.isError} rows={rows} emptyTitle="No duplicate checks" emptyBody="Submission-time duplicate checks will appear here." onRetry={() => listing.query.refetch()} />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Original</TableCell>
                      <TableCell>Candidate</TableCell>
                      <TableCell align="right">Similarity</TableCell>
                      <TableCell>Matched Fields</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{emptyValue(row.kaizen_id || row.idea_id)}</TableCell>
                        <TableCell>
                          {emptyValue(row.candidate_kaizen_id || row.candidate_idea_id)}
                          {row.matched_meaning ? <Typography variant="caption" color="text.secondary" display="block">{row.matched_meaning}</Typography> : null}
                        </TableCell>
                        <TableCell align="right">
                          {formatInteger(row.similarity_percent)}%
                          {row.classification ? <Typography variant="caption" color="text.secondary" display="block">{row.classification}</Typography> : null}
                        </TableCell>
                        <TableCell>{(row.matched_fields ?? []).join(", ") || "-"}</TableCell>
                        <TableCell><StatusPill status={row.check_status} /></TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {["link", "merge", "dismiss", "proceed"].map((action) => (
                              <Button key={action} size="small" variant="outlined" onClick={() => setDecision({ row, action })}>{action}</Button>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePager total={listing.total} page={listing.page} pageSize={listing.pageSize} onPage={listing.setPage} onPageSize={listing.setPageSize} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(decision)} onClose={() => setDecision(null)} fullWidth maxWidth="sm">
        <DialogTitle>Record duplicate decision?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will mark the check as {decision?.action}. Add a short justification so future audit reviews understand the decision.
          </DialogContentText>
          <TextField label="Justification" value={justification} onChange={(event) => setJustification(event.target.value)} multiline minRows={3} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)}>Cancel</Button>
          <Button variant="contained" color={decision?.action === "dismiss" || decision?.action === "merge" ? "error" : "primary"} disabled={!justification.trim()} onClick={confirmDecision}>
            Save Decision
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export const TaxonomyPage = () => {
  const { open } = useNotification();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Partial<TaxonomyRow> | null>(null);
  const [suggestText, setSuggestText] = useState("");
  const [suggestions, setSuggestions] = useState<TaxonomyRow[]>([]);
  const [trending, setTrending] = useState<Array<{ name: string; count: number }>>([]);
  const debouncedSearch = useDebouncedValue(search, 350);
  const filters = useMemo<CrudFilters>(() => {
    const next = searchFilter(debouncedSearch);
    if (type) next.push({ field: "taxonomy_type", operator: "eq", value: type });
    if (status) next.push({ field: "status", operator: "eq", value: status });
    return next;
  }, [debouncedSearch, search, status, type]);
  const listing = usePagedResource<TaxonomyRow>("kaizen_taxonomy", filters, [{ field: "name", order: "asc" }]);
  const rows = listing.rows;

  const save = async () => {
    if (!editing?.name) return;
    try {
      const payload = { ...editing, keywords: splitList(editing.keywords as string[] | string | null) };
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-taxonomy-action", { action: "save", ...payload });
      if (!response.success) throw new Error(response.error || "Save failed");
      open?.({ type: "success", message: "Taxonomy saved", description: `${editing.name} was updated.` });
      setEditing(null);
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save taxonomy", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const deactivate = async (row: TaxonomyRow) => {
    const response = await executeFunction<{ success: boolean }>("kaizen-taxonomy-action", { action: "deactivate", ...row });
    if (response.success) {
      open?.({ type: "success", message: "Taxonomy deactivated", description: `${row.name} is now inactive.` });
      listing.query.refetch();
    }
  };

  const suggest = async () => {
    const response = await executeFunction<{ success: boolean; suggestions?: TaxonomyRow[] }>("kaizen-taxonomy-action", { action: "suggest", text: suggestText });
    setSuggestions(response.suggestions ?? []);
  };

  const loadAnalytics = async () => {
    const response = await executeFunction<{ success: boolean; trending_tags?: Array<{ name: string; count: number }> }>("kaizen-taxonomy-action", { action: "analytics" });
    setTrending(response.trending_tags ?? []);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Category & Tag Management"
        subtitle="Maintain categories, subcategories, tags, suggestions, formula mappings, and usage analytics."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing({ taxonomy_type: "Tag", status: "Active", color: taruviTokens.primary[700], keywords: [] })}>New Taxonomy</Button>}
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { lg: 260 } }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
                <MenuItem value="">All types</MenuItem>
                {["Category", "Subcategory", "Tag"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<CategoryRoundedIcon />} onClick={loadAnalytics}>Analytics</Button>
          </Stack>
          {trending.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
              {trending.map((tag) => <Chip key={tag.name} label={`${tag.name}: ${tag.count}`} />)}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>Suggestion Tester</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Idea text" value={suggestText} onChange={(event) => setSuggestText(event.target.value)} fullWidth />
            <Button variant="outlined" onClick={suggest}>Suggest Tags</Button>
          </Stack>
          {suggestions.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
              {suggestions.map((item) => <Chip key={item.id} label={item.name} variant="tagBlue" />)}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <QueryState isLoading={listing.query.isLoading} isError={listing.query.isError} rows={rows} emptyTitle="No taxonomy records" emptyBody="Create categories and tags to improve classification." onRetry={() => listing.query.refetch()} />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Keywords</TableCell>
                      <TableCell align="right">Usage</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: row.color || taruviTokens.primary[700] }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{row.taxonomy_type}</TableCell>
                        <TableCell><StatusPill status={row.status} /></TableCell>
                        <TableCell>{(row.keywords ?? []).join(", ") || "-"}</TableCell>
                        <TableCell align="right">{formatInteger(row.usage_count)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" onClick={() => setEditing(row)}>Edit</Button>
                            {row.status === "Active" ? <Button size="small" color="error" variant="outlined" onClick={() => deactivate(row)}>Deactivate</Button> : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePager total={listing.total} page={listing.page} pageSize={listing.pageSize} onPage={listing.setPage} onPageSize={listing.setPageSize} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>{editing?.id ? "Edit taxonomy" : "Create taxonomy"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={editing?.name ?? ""} onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))} fullWidth />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={editing?.taxonomy_type ?? "Tag"} onChange={(event) => setEditing((current) => ({ ...current, taxonomy_type: event.target.value }))}>
                  {["Category", "Subcategory", "Tag"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={editing?.status ?? "Active"} onChange={(event) => setEditing((current) => ({ ...current, status: event.target.value }))}>
                  {["Active", "Inactive"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Slug" value={editing?.slug ?? ""} onChange={(event) => setEditing((current) => ({ ...current, slug: event.target.value }))} />
            <TextField label="Keywords" helperText="Comma-separated keywords for suggestions" value={(editing?.keywords ?? []).join(", ")} onChange={(event) => setEditing((current) => ({ ...current, keywords: splitList(event.target.value) }))} />
            <TextField label="Description" value={editing?.description ?? ""} onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))} multiline minRows={3} />
            <TextField label="Color" value={editing?.color ?? ""} onChange={(event) => setEditing((current) => ({ ...current, color: event.target.value }))} />
            <TextField label="Incentive Formula Key" value={editing?.incentive_formula_key ?? ""} onChange={(event) => setEditing((current) => ({ ...current, incentive_formula_key: event.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export const EmailTemplatesPage = () => {
  const { open } = useNotification();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);
  const [preview, setPreview] = useState<{ subject?: string; body_html?: string; body_text?: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const filters = useMemo<CrudFilters>(() => {
    const next = searchFilter(debouncedSearch);
    if (status) next.push({ field: "status", operator: "eq", value: status });
    return next;
  }, [debouncedSearch, search, status]);
  const listing = usePagedResource<EmailTemplate>("kaizen_email_templates", filters, [{ field: "created_at", order: "desc" }]);
  const rows = listing.rows;

  const previewTemplate = async (template: EmailTemplate | Partial<EmailTemplate>) => {
    const response = await executeFunction<{ success: boolean; preview?: { subject?: string; body_html?: string; body_text?: string } }>("kaizen-email-template-action", {
      action: "preview",
      template_key: template.template_key,
      template,
    });
    setPreview(response.preview ?? null);
  };

  const save = async () => {
    if (!editing?.template_key) return;
    try {
      const payload = { ...editing, placeholders: splitList(editing.placeholders as string[] | string | null), cc: splitList(editing.cc as string[] | string | null), bcc: splitList(editing.bcc as string[] | string | null) };
      const response = await executeFunction<{ success: boolean; error?: string; preview?: { subject?: string; body_html?: string; body_text?: string } }>("kaizen-email-template-action", { action: "save", ...payload });
      if (!response.success) throw new Error(response.error || "Save failed");
      setPreview(response.preview ?? null);
      setEditing(null);
      open?.({ type: "success", message: "Template version saved", description: "A new email template version was created." });
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save template", description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const resetDefaults = async () => {
    const response = await executeFunction<{ success: boolean; created_count?: number }>("kaizen-email-template-action", { action: "reset_defaults" });
    if (response.success) {
      open?.({ type: "success", message: "Default templates restored", description: `${response.created_count ?? 0} versions were created.` });
      listing.query.refetch();
    }
  };

  const sendTest = async () => {
    if (!editing?.template_key && !rows[0]?.template_key) return;
    const template = editing ?? rows[0];
    const response = await executeFunction<{ success: boolean; error?: string; preview?: { subject?: string; body_html?: string; body_text?: string } }>("kaizen-email-template-action", {
      action: "test",
      template_key: template.template_key,
      template,
      test_email: testEmail,
    });
    if (!response.success) {
      open?.({ type: "error", message: "Unable to queue test email", description: response.error || "Please try again." });
      return;
    }
    setPreview(response.preview ?? null);
    open?.({ type: "success", message: "Test email queued", description: testEmail || "Notification was queued for review." });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Email Template Management"
        subtitle="Version, preview, test, enable, disable, and reset notification templates."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={resetDefaults}>Reset Defaults</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing({ template_key: "custom_template", name: "Custom Template", status: "Enabled", language: "en", placeholders: ["Employee_Name", "Kaizen_ID", "Kaizen_Title", "Status", "Comments", "Link"] })}>New Template</Button>
          </Stack>
        }
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField size="small" label="Search" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 300 } }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {["Enabled", "Disabled", "Archived"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Test Email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} sx={{ minWidth: { md: 260 } }} />
            <Button variant="outlined" startIcon={<SendRoundedIcon />} onClick={sendTest}>Send Test</Button>
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
        <Card>
          <CardContent>
            <QueryState isLoading={listing.query.isLoading} isError={listing.query.isError} rows={rows} emptyTitle="No email templates" emptyBody="Reset defaults or create a new template." onRetry={() => listing.query.refetch()} />
            {rows.length > 0 ? (
              <>
                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Template</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Version</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Updated By</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.template_key}</Typography>
                          </TableCell>
                          <TableCell>{row.notification_type}</TableCell>
                          <TableCell align="right">{row.version}</TableCell>
                          <TableCell><StatusPill status={row.status} /></TableCell>
                          <TableCell>{emptyValue(row.updated_by_username)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="outlined" onClick={() => previewTemplate(row)}>Preview</Button>
                              <Button size="small" variant="contained" onClick={() => setEditing(row)}>Edit</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <TablePager total={listing.total} page={listing.page} pageSize={listing.pageSize} onPage={listing.setPage} onPageSize={listing.setPageSize} />
              </>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>Preview</Typography>
            {preview ? (
              <Stack spacing={2}>
                <Alert severity="info">{preview.subject}</Alert>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }} dangerouslySetInnerHTML={{ __html: preview.body_html || preview.body_text || "" }} />
              </Stack>
            ) : (
              <EmptyState kind="no-data" title="No preview selected" body="Choose a template to preview its rendered output." />
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>{editing?.id ? "Edit template version" : "Create template"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Template Key" value={editing?.template_key ?? ""} onChange={(event) => setEditing((current) => ({ ...current, template_key: event.target.value }))} fullWidth />
              <TextField label="Name" value={editing?.name ?? ""} onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Notification Type" value={editing?.notification_type ?? "Reminder"} onChange={(event) => setEditing((current) => ({ ...current, notification_type: event.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={editing?.status ?? "Enabled"} onChange={(event) => setEditing((current) => ({ ...current, status: event.target.value }))}>
                  {["Enabled", "Disabled", "Archived"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Subject" value={editing?.subject ?? ""} onChange={(event) => setEditing((current) => ({ ...current, subject: event.target.value }))} />
            <TextField label="Body HTML" value={editing?.body_html ?? ""} onChange={(event) => setEditing((current) => ({ ...current, body_html: event.target.value }))} multiline minRows={7} />
            <TextField label="Body Text" value={editing?.body_text ?? ""} onChange={(event) => setEditing((current) => ({ ...current, body_text: event.target.value }))} multiline minRows={3} />
            <TextField label="Placeholders" value={(editing?.placeholders ?? []).join(", ")} onChange={(event) => setEditing((current) => ({ ...current, placeholders: splitList(event.target.value) }))} helperText="Comma-separated placeholder names" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="CC" value={(editing?.cc ?? []).join(", ")} onChange={(event) => setEditing((current) => ({ ...current, cc: splitList(event.target.value) }))} fullWidth />
              <TextField label="BCC" value={(editing?.bcc ?? []).join(", ")} onChange={(event) => setEditing((current) => ({ ...current, bcc: splitList(event.target.value) }))} fullWidth />
            </Stack>
            <TextField label="Footer HTML" value={editing?.footer_html ?? ""} onChange={(event) => setEditing((current) => ({ ...current, footer_html: event.target.value }))} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="outlined" onClick={() => previewTemplate(editing ?? {})}>Preview</Button>
          <Button variant="contained" onClick={save}>Save Version</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export const NewslettersPage = () => {
  const { open } = useNotification();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [title, setTitle] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const listing = usePagedResource<NewsletterRow>("kaizen_newsletters", useMemo<CrudFilters>(() => [], []), CREATED_DESC);
  const rows = listing.rows;

  const generate = async () => {
    setIsRunning(true);
    try {
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-newsletter-generate", {
        action: "generate",
        month: Number(month),
        year: Number(year),
        title: title || undefined,
      });
      if (!response.success) throw new Error(response.error || "Generate failed");
      open?.({ type: "success", message: "Newsletter generated", description: "The newsletter archive is ready." });
      listing.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to generate newsletter", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const action = async (row: NewsletterRow, nextAction: "publish" | "email" | "download") => {
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-newsletter-generate", { action: nextAction, newsletter_id: row.id });
    if (!response.success) {
      open?.({ type: "error", message: "Newsletter action failed", description: response.error || "Please try again." });
      return;
    }
    if (nextAction === "download") {
      downloadText(`${row.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`, row.html_content || "", "text/html;charset=utf-8");
    } else {
      open?.({ type: "success", message: `Newsletter ${nextAction} recorded`, description: row.title });
    }
    listing.query.refetch();
  };

  return (
    <PageContainer>
      <PageHeader title="Monthly Newsletters" subtitle="Generate monthly digest content, publish, email, print, and track downloads." action={<Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <NewspaperRoundedIcon />} disabled={isRunning} onClick={generate}>Generate</Button>} />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField size="small" label="Month" type="number" value={month} onChange={(event) => setMonth(event.target.value)} />
            <TextField size="small" label="Year" type="number" value={year} onChange={(event) => setYear(event.target.value)} />
            <TextField size="small" label="Title" value={title} onChange={(event) => setTitle(event.target.value)} sx={{ minWidth: { md: 360 } }} />
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <QueryState isLoading={listing.query.isLoading} isError={listing.query.isError} rows={rows} emptyTitle="No newsletters yet" emptyBody="Generate a monthly newsletter to create the first archive." onRetry={() => listing.query.refetch()} />
          {rows.length > 0 ? (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Newsletter</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Submissions</TableCell>
                      <TableCell align="right">Downloads</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const summary = row.summary ?? {};
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatDate(row.created_at)} by {emptyValue(row.generated_by_username)}</Typography>
                          </TableCell>
                          <TableCell>{row.month}/{row.year}</TableCell>
                          <TableCell><StatusPill status={row.status} /></TableCell>
                          <TableCell align="right">{formatInteger(summary.submissions)}</TableCell>
                          <TableCell align="right">{formatInteger(row.download_count)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="outlined" onClick={() => openPrintableHtml(row.printable_html || row.html_content || "")}>Print</Button>
                              <Button size="small" variant="outlined" onClick={() => action(row, "download")}>Download</Button>
                              <Button size="small" variant="outlined" onClick={() => action(row, "publish")}>Publish</Button>
                              <Button size="small" variant="contained" onClick={() => action(row, "email")}>Email</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
              <TablePager total={listing.total} page={listing.page} pageSize={listing.pageSize} onPage={listing.setPage} onPageSize={listing.setPageSize} />
            </>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export const SystemHealthPage = () => {
  const { open } = useNotification();
  const [isRunning, setIsRunning] = useState(false);
  const snapshots = usePagedResource<HealthSnapshot>("kaizen_system_health_snapshots", useMemo<CrudFilters>(() => [], []), [{ field: "snapshot_at", order: "desc" }]);
  const { result: alertsResult, query: alertsQuery } = useList<SystemAlertRow>({
    resource: "kaizen_system_alerts",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: SMALL_PAGE,
  });
  const rows = snapshots.rows;
  const latest = rows[0];
  const alerts = alertsResult.data ?? [];

  const snapshot = async (exportOnly = false) => {
    setIsRunning(true);
    try {
      const response = await executeFunction<{ success: boolean; error?: string; csv_data?: string; html_report?: string }>("kaizen-system-health", { action: exportOnly ? "export" : "snapshot" });
      if (!response.success) throw new Error(response.error || "Snapshot failed");
      if (exportOnly) {
        downloadText("kaizen-system-health.csv", response.csv_data || "", "text/csv;charset=utf-8");
      } else {
        open?.({ type: "success", message: "Health snapshot captured", description: "Latest system metrics were stored." });
      }
      snapshots.query.refetch();
      alertsQuery.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to capture health snapshot", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const control = async (action: "cache_clear" | "maintenance_window" | "force_logout") => {
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-system-health", { action });
    if (response.success) open?.({ type: "success", message: "System control recorded", description: action.replace("_", " ") });
    else open?.({ type: "error", message: "Control failed", description: response.error || "Please try again." });
  };

  const resolveAlert = async (alert: SystemAlertRow) => {
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-system-health", { action: "resolve_alert", alert_id: alert.id });
    if (response.success) {
      open?.({ type: "success", message: "Alert resolved", description: alert.message || alert.metric_key || "Resolved" });
      alertsQuery.refetch();
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="System Health"
        subtitle="Monitor platform performance, queued notifications, alerts, jobs, and admin controls."
        action={
          <Stack direction="row" spacing={1}>
            <ExportButton onClick={() => snapshot(true)} />
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <MonitorHeartRoundedIcon />} disabled={isRunning} onClick={() => snapshot(false)}>Run Snapshot</Button>
          </Stack>
        }
      />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
        <KpiCard label="Uptime" value={`${latest?.uptime_pct ?? "-"}%`} helper="Latest snapshot" icon={<MonitorHeartRoundedIcon />} isLoading={snapshots.query.isLoading} />
        <KpiCard label="API Response" value={`${latest?.api_response_ms ?? "-"} ms`} helper="Average" icon={<RuleRoundedIcon />} isLoading={snapshots.query.isLoading} />
        <KpiCard label="Page Load" value={`${latest?.avg_page_load_ms ?? "-"} ms`} helper="Average" icon={<MonitorHeartRoundedIcon />} isLoading={snapshots.query.isLoading} />
        <KpiCard label="Queued Email" value={latest?.email_pending ?? 0} helper={`Failed ${latest?.email_failed ?? 0}`} icon={<MarkEmailReadRoundedIcon />} isLoading={snapshots.query.isLoading} />
        <KpiCard label="Open Alerts" value={alerts.filter((alert) => alert.status === "Open").length} helper={latest?.cache_status || "Cache status"} icon={<WarningAmberRoundedIcon />} isLoading={alertsQuery.isLoading} />
      </Box>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Button variant="outlined" onClick={() => control("cache_clear")}>Clear Cache</Button>
            <Button variant="outlined" onClick={() => control("maintenance_window")}>Record Maintenance</Button>
            <Button variant="outlined" color="error" onClick={() => control("force_logout")}>Force Logout Event</Button>
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>Performance Trend</Typography>
            <QueryState isLoading={snapshots.query.isLoading} isError={snapshots.query.isError} rows={rows} emptyTitle="No health snapshots" emptyBody="Run a snapshot to begin trend tracking." onRetry={() => snapshots.query.refetch()} />
            {rows.length > 0 ? (
              <>
                <Box sx={{ height: 260, mb: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...rows].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshot_at" tickFormatter={(value) => formatDate(String(value))} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg_page_load_ms" stroke={CHART_COLOR} />
                      <Line type="monotone" dataKey="api_response_ms" stroke={SECONDARY_CHART_COLOR} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Snapshot</TableCell>
                        <TableCell align="right">Users</TableCell>
                        <TableCell align="right">Page Load</TableCell>
                        <TableCell align="right">API</TableCell>
                        <TableCell align="right">Errors</TableCell>
                        <TableCell>Backup</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{formatDate(row.snapshot_at)}</TableCell>
                          <TableCell align="right">{formatInteger(row.active_users)} / {formatInteger(row.total_users)}</TableCell>
                          <TableCell align="right">{formatInteger(row.avg_page_load_ms)} ms</TableCell>
                          <TableCell align="right">{formatInteger(row.api_response_ms)} ms</TableCell>
                          <TableCell align="right">{formatInteger(row.error_rate_24h)}</TableCell>
                          <TableCell>{row.backup_status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>Alerts</Typography>
            <QueryState isLoading={alertsQuery.isLoading} isError={alertsQuery.isError} rows={alerts} emptyTitle="No alerts" emptyBody="System alerts will appear when thresholds are exceeded." onRetry={() => alertsQuery.refetch()} />
            <Stack spacing={1.5}>
              {alerts.map((alert) => (
                <Box key={alert.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{alert.alert_type}</Typography>
                      <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
                    </Box>
                    <StatusPill status={alert.status} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <Chip size="small" label={alert.severity || "Info"} />
                    {alert.status !== "Resolved" ? <Button size="small" variant="outlined" onClick={() => resolveAlert(alert)}>Resolve</Button> : null}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

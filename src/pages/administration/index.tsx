import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useList, useNotification, type CrudFilters } from "@refinedev/core";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { taruviTokens } from "../../theme/themeOptions";
import { executeFunction } from "../../utils/functionHelpers";
import { downloadPresentationPptx, type PresentationSlide, type PresentationTheme } from "../../utils/pptxExport";
import {
  ActiveFilterChips,
  EmptyState,
  StatusChip,
  emptyValue,
  formatCurrency,
  formatDate,
  formatInteger,
  toNumber,
  useDebouncedValue,
} from "../kaizens/shared";
import { KpiCard, PageHeader, csvFromObjects, downloadText } from "../program/shared";

const DEFAULT_YEAR = new Date().getFullYear();
const DEFAULT_START = `${DEFAULT_YEAR}-01-01`;
const DEFAULT_END = `${DEFAULT_YEAR}-12-31`;
const DEFAULT_PAGE_SIZE = 10;
const SMALL_PAGE = { currentPage: 1, pageSize: 100 };
const PERMISSION_LEVELS = ["No Access", "View Only", "Create/Edit", "Approve/Reject", "Delete", "Configure"];
const PRESENTATION_TYPES = ["Monthly Innovation Review", "Quarterly Innovation Day", "Annual Innovation Summit", "Custom Presentation"];

type Sorter = { field: string; order: "asc" | "desc" };
type JsonMap = Record<string, unknown>;

type RoConfig = {
  id?: string;
  rewards_enabled?: boolean;
  formula_type?: string | null;
  fixed_standard_amount?: number | string | null;
  fixed_high_impact_amount?: number | string | null;
  fixed_team_lead_amount?: number | string | null;
  percentage_of_submitter_incentive?: number | string | null;
  high_impact_bonus_amount?: number | string | null;
  min_reportees?: number | string | null;
  min_closures?: number | string | null;
  effective_from?: string | null;
  change_notes?: string | null;
};

type RoDashboardRow = {
  ro_username: string;
  ro_name?: string | null;
  reportee_count?: number | string | null;
  closed_kaizens?: number | string | null;
  participation_rate?: number | string | null;
  incentive_amount?: number | string | null;
  mentorship_score?: number | string | null;
};

type RoDashboardResponse = {
  success: boolean;
  config?: RoConfig;
  rows?: RoDashboardRow[];
  summary?: {
    reporting_officers?: number;
    reportees?: number;
    closed_kaizens?: number;
    incentive_amount?: number;
  };
  csv_data?: string;
  count?: number;
};

type RoIncentive = {
  id: string;
  kaizen_id?: string | null;
  ro_username?: string | null;
  ro_name?: string | null;
  employee_username?: string | null;
  employee_name?: string | null;
  calculation_type?: string | null;
  formula_type?: string | null;
  incentive_amount?: number | string | null;
  status?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  created_at?: string | null;
};

type HierarchyAssignment = {
  id: string;
  employee_username?: string | null;
  employee_name?: string | null;
  employee_id?: string | null;
  manager_username?: string | null;
  manager_employee_id?: string | null;
  reporting_line_type?: string | null;
  status?: string | null;
  validation_status?: string | null;
  department_name?: string | null;
  location?: string | null;
  start_date?: string | null;
  updated_at?: string | null;
};

type HierarchySpanRow = {
  manager_username: string;
  direct_reports?: number;
  matrix_reports?: number;
  total_span?: number;
  departments_text?: string;
};

type HierarchyReport = {
  success: boolean;
  rows?: HierarchySpanRow[];
  assignments?: HierarchyAssignment[];
  validation?: { status?: string; warnings?: string[]; errors?: string[]; span_counts?: Record<string, number> };
  csv_data?: string;
  created_positions?: number;
  created_assignments?: number;
  imported_count?: number;
};

type RbacRole = {
  id: string;
  role_slug: string;
  role_name?: string | null;
  role_group?: string | null;
  data_scope?: string | null;
  status?: string | null;
  is_system?: boolean | null;
};

type RbacPermission = {
  id?: string;
  role_slug: string;
  module_key: string;
  feature_key: string;
  permission_level?: string | null;
  data_scope?: string | null;
  conflict_flag?: boolean | null;
};

type RbacFeature = {
  module_key: string;
  feature_key: string;
};

type RbacMatrix = {
  success: boolean;
  roles?: RbacRole[];
  permissions?: RbacPermission[];
  features?: RbacFeature[];
  compliance?: { conflicts?: string[]; risk_level?: string; permission_count?: number };
  csv_data?: string;
  summary?: JsonMap;
};

type RbacAudit = {
  id: string;
  target_role_slug?: string | null;
  target_username?: string | null;
  action_type?: string | null;
  risk_level?: string | null;
  changed_by_username?: string | null;
  created_at?: string | null;
};

type PresentationTemplate = {
  id: string;
  template_key: string;
  name: string;
  presentation_type?: string | null;
  design_theme?: string | null;
  status?: string | null;
  is_default?: boolean | null;
  slide_config?: string[] | null;
  color_scheme?: PresentationTheme | null;
  usage_count?: number | string | null;
};

type PresentationExport = {
  id: string;
  title: string;
  presentation_type?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  template_key?: string | null;
  status?: string | null;
  slide_count?: number | string | null;
  pptx_file_name?: string | null;
  download_count?: number | string | null;
  generated_by_username?: string | null;
  generated_at?: string | null;
  quality_checks?: JsonMap | null;
  generation_params?: { slides?: PresentationSlide[]; summary?: JsonMap; template?: PresentationTemplate } | null;
};

type PresentationResponse = {
  success: boolean;
  templates?: PresentationTemplate[];
  exports?: PresentationExport[];
  export?: PresentationExport;
  slides?: PresentationSlide[];
  file_name?: string;
  summary?: {
    exports?: number;
    downloads?: number;
    templates?: number;
    total?: number;
    closed?: number;
    hours?: number;
    cost?: number;
    by_type?: Array<{ name: string; count: number }>;
  };
  template?: PresentationTemplate;
  error?: string;
};

const PageShell = ({ children }: { children: ReactNode }) => (
  <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
    <Stack spacing={3}>{children}</Stack>
  </Container>
);

const LoadingRows = ({ columns, rows = 4 }: { columns: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <TableRow key={index}>
        <TableCell colSpan={columns}>
          <Skeleton height={32} />
        </TableCell>
      </TableRow>
    ))}
  </>
);

const TableEmptyState = ({
  isLoading,
  isError,
  rows,
  colSpan,
  hasSearch,
  hasFilters,
  onRetry,
}: {
  isLoading?: boolean;
  isError?: boolean;
  rows: unknown[];
  colSpan: number;
  hasSearch?: boolean;
  hasFilters?: boolean;
  onRetry?: () => void;
}) => {
  if (isLoading) return <LoadingRows columns={colSpan} />;
  if (rows.length > 0) return null;
  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan}>
          <EmptyState kind="error" title="Unable to load" body="Refresh the table or adjust the filters." action={<Button onClick={onRetry}>Retry</Button>} />
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <EmptyState
          kind={hasSearch ? "no-results" : hasFilters ? "no-matches" : "no-data"}
          title={hasSearch ? "No results" : hasFilters ? "No matching items" : "No data yet"}
          body={hasSearch ? "Try a different search term." : hasFilters ? "Clear filters to see more rows." : "Run the relevant sync or generation action to create records."}
        />
      </TableCell>
    </TableRow>
  );
};

const ExportButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => (
  <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onClick} disabled={disabled}>
    Export
  </Button>
);

const activeChips = (items: Array<{ key: string; label: string; value?: string }>) =>
  items.filter((item) => item.value).map((item) => ({ key: item.key, label: `${item.label}: ${item.value}` }));

const downloadRows = (fileName: string, rows: Array<Record<string, unknown>>, headers: string[]) => {
  downloadText(fileName, csvFromObjects(rows, headers), "text/csv;charset=utf-8");
};

const normalizeTheme = (theme?: PresentationTheme | null): PresentationTheme => ({
  primary: theme?.primary ?? taruviTokens.button.primaryDefault,
  accent: theme?.accent ?? taruviTokens.success[500],
  background: theme?.background ?? "FFFFFF",
});

export const RoRewardsPage = () => {
  const { open } = useNotification();
  const [dashboard, setDashboard] = useState<RoDashboardResponse | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [periodStart, setPeriodStart] = useState(DEFAULT_START);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_END);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [configForm, setConfigForm] = useState({
    formula_type: "Hybrid",
    fixed_standard_amount: "50",
    percentage_of_submitter_incentive: "15",
    high_impact_bonus_amount: "100",
    fixed_team_lead_amount: "75",
    change_notes: "",
  });

  const loadDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const result = await executeFunction<RoDashboardResponse>("kaizen-ro-rewards", { action: "dashboard" });
      setDashboard(result);
    } catch (error) {
      open?.({ type: "error", message: "Unable to load RO dashboard", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsDashboardLoading(false);
    }
  }, [open]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!dashboard?.config) return;
    setConfigForm({
      formula_type: dashboard.config.formula_type ?? "Hybrid",
      fixed_standard_amount: String(dashboard.config.fixed_standard_amount ?? "50"),
      percentage_of_submitter_incentive: String(dashboard.config.percentage_of_submitter_incentive ?? "15"),
      high_impact_bonus_amount: String(dashboard.config.high_impact_bonus_amount ?? "100"),
      fixed_team_lead_amount: String(dashboard.config.fixed_team_lead_amount ?? "75"),
      change_notes: dashboard.config.change_notes ?? "",
    });
  }, [dashboard?.config]);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (debouncedSearch) next.push({ field: "ro_name", operator: "contains", value: debouncedSearch });
    return next;
  }, [debouncedSearch, status]);

  const incentives = useList<RoIncentive>({
    resource: "kaizen_ro_incentives",
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });

  const runAction = async (action: "sync_assignments" | "calculate" | "export" | "save_config") => {
    setIsRunning(true);
    try {
      const params =
        action === "save_config"
          ? { action, config: { ...configForm, rewards_enabled: true } }
          : { action, period_start: periodStart, period_end: periodEnd };
      const result = await executeFunction<RoDashboardResponse>("kaizen-ro-rewards", params);
      if (!result.success) throw new Error("RO reward action failed");
      if (action === "export") {
        downloadText("ro-incentive-sheet.csv", result.csv_data ?? "", "text/csv;charset=utf-8");
      }
      open?.({ type: "success", message: action === "save_config" ? "RO reward rules saved" : "RO reward action complete" });
      incentives.query.refetch();
      void loadDashboard();
    } catch (error) {
      open?.({ type: "error", message: "RO reward action failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const roRows = dashboard?.rows ?? [];
  const incentiveRows = incentives.result.data ?? [];
  const chips = activeChips([
    { key: "search", label: "Search", value: search },
    { key: "status", label: "Status", value: status },
  ]);

  return (
    <PageShell>
      <PageHeader
        title="RO Rewards"
        subtitle="Reporting Officer assignment, reward formulas, incentive calculations, payroll export, and audit-ready dashboards."
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button variant="outlined" startIcon={isRunning ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} disabled={isRunning} onClick={() => runAction("sync_assignments")}>
              Sync RO
            </Button>
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <CalculateRoundedIcon />} disabled={isRunning} onClick={() => runAction("calculate")}>
              Calculate
            </Button>
            <ExportButton disabled={isRunning} onClick={() => runAction("export")} />
          </Stack>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard label="Reporting Officers" value={formatInteger(dashboard?.summary?.reporting_officers ?? 0)} icon={<SupervisorAccountRoundedIcon />} isLoading={isDashboardLoading} />
        <KpiCard label="Reportees" value={formatInteger(dashboard?.summary?.reportees ?? 0)} icon={<AccountTreeRoundedIcon />} isLoading={isDashboardLoading} />
        <KpiCard label="Closed Kaizens" value={formatInteger(dashboard?.summary?.closed_kaizens ?? 0)} icon={<CheckCircleRoundedIcon />} isLoading={isDashboardLoading} />
        <KpiCard label="RO Incentive" value={formatCurrency(dashboard?.summary?.incentive_amount ?? 0)} icon={<AssessmentRoundedIcon />} isLoading={isDashboardLoading} />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Reward Formula
          </Typography>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Formula</InputLabel>
              <Select label="Formula" value={configForm.formula_type} onChange={(event) => setConfigForm((current) => ({ ...current, formula_type: event.target.value }))}>
                {["Fixed", "Percentage", "Hybrid"].map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Fixed Amount" type="number" value={configForm.fixed_standard_amount} onChange={(event) => setConfigForm((current) => ({ ...current, fixed_standard_amount: event.target.value }))} />
            <TextField size="small" label="Submitter %" type="number" value={configForm.percentage_of_submitter_incentive} onChange={(event) => setConfigForm((current) => ({ ...current, percentage_of_submitter_incentive: event.target.value }))} />
            <TextField size="small" label="High Impact Bonus" type="number" value={configForm.high_impact_bonus_amount} onChange={(event) => setConfigForm((current) => ({ ...current, high_impact_bonus_amount: event.target.value }))} />
            <TextField size="small" label="Team Lead Bonus" type="number" value={configForm.fixed_team_lead_amount} onChange={(event) => setConfigForm((current) => ({ ...current, fixed_team_lead_amount: event.target.value }))} />
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isRunning} onClick={() => runAction("save_config")}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            RO Dashboard
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reporting Officer</TableCell>
                  <TableCell align="right">Reportees</TableCell>
                  <TableCell align="right">Closed</TableCell>
                  <TableCell align="right">Participation</TableCell>
                  <TableCell align="right">Incentive</TableCell>
                  <TableCell align="right">Mentorship</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDashboardLoading ? <LoadingRows columns={6} /> : roRows.map((row) => (
                  <TableRow key={row.ro_username} hover>
                    <TableCell>{row.ro_name || row.ro_username}</TableCell>
                    <TableCell align="right">{formatInteger(row.reportee_count ?? 0)}</TableCell>
                    <TableCell align="right">{formatInteger(row.closed_kaizens ?? 0)}</TableCell>
                    <TableCell align="right">{formatInteger(row.participation_rate ?? 0)}%</TableCell>
                    <TableCell align="right">{formatCurrency(row.incentive_amount ?? 0)}</TableCell>
                    <TableCell align="right">{formatInteger(row.mentorship_score ?? 0)}</TableCell>
                  </TableRow>
                ))}
                <TableEmptyState isLoading={isDashboardLoading} rows={roRows} colSpan={6} />
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField size="small" label="Search RO" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 240 } }} />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <MenuItem value="">All statuses</MenuItem>
                  {["Pending Approval", "Approved", "Rejected", "Paid"].map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField size="small" label="Start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="End" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} InputLabelProps={{ shrink: true }} />
            </Stack>
            <ActiveFilterChips
              filters={chips}
              onDelete={(key) => {
                if (key === "status") setStatus("");
                if (key === "search") setSearch("");
              }}
              onClear={() => {
                setStatus("");
                setSearch("");
              }}
            />
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kaizen</TableCell>
                    <TableCell>RO</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incentiveRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{emptyValue(row.kaizen_id)}</TableCell>
                      <TableCell>{row.ro_name || row.ro_username}</TableCell>
                      <TableCell>{row.employee_name || row.employee_username}</TableCell>
                      <TableCell>{emptyValue(row.calculation_type)}</TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell align="right">{formatCurrency(row.incentive_amount ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableEmptyState isLoading={incentives.query.isLoading} isError={incentives.query.isError} rows={incentiveRows} colSpan={6} hasSearch={Boolean(search)} hasFilters={Boolean(status)} onRetry={() => incentives.query.refetch()} />
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={incentives.result.total ?? 0}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export const HierarchyPage = () => {
  const { open } = useNotification();
  const [report, setReport] = useState<HierarchyReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [lineType, setLineType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [form, setForm] = useState({ employee_username: "", manager_username: "", reporting_line_type: "Primary", department_name: "" });

  const loadReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      setReport(await executeFunction<HierarchyReport>("kaizen-hierarchy-management", { action: "report" }));
    } catch (error) {
      open?.({ type: "error", message: "Unable to load hierarchy report", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsReportLoading(false);
    }
  }, [open]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (lineType) next.push({ field: "reporting_line_type", operator: "eq", value: lineType });
    if (debouncedSearch) next.push({ field: "employee_username", operator: "contains", value: debouncedSearch });
    return next;
  }, [debouncedSearch, lineType, status]);

  const assignments = useList<HierarchyAssignment>({
    resource: "kaizen_hierarchy_assignments",
    filters,
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });

  const runHierarchyAction = async (action: "sync" | "validate" | "export") => {
    setIsRunning(true);
    try {
      const result = await executeFunction<HierarchyReport>("kaizen-hierarchy-management", { action });
      if (!result.success) throw new Error("Hierarchy action failed");
      if (action === "export") downloadText("hierarchy-span-report.csv", result.csv_data ?? "", "text/csv;charset=utf-8");
      open?.({ type: "success", message: action === "sync" ? "Hierarchy synced" : action === "validate" ? "Hierarchy validated" : "Hierarchy exported" });
      assignments.query.refetch();
      void loadReport();
    } catch (error) {
      open?.({ type: "error", message: "Hierarchy action failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const saveAssignment = async () => {
    if (!form.employee_username || !form.manager_username) {
      open?.({ type: "error", message: "Employee and manager are required" });
      return;
    }
    setIsRunning(true);
    try {
      const result = await executeFunction<HierarchyReport>("kaizen-hierarchy-management", { action: "save_assignment", ...form });
      if (!result.success) throw new Error("Assignment save failed");
      setForm({ employee_username: "", manager_username: "", reporting_line_type: "Primary", department_name: "" });
      open?.({ type: "success", message: "Hierarchy assignment saved" });
      assignments.query.refetch();
      void loadReport();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save assignment", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const assignmentRows = assignments.result.data ?? [];
  const spanRows = report?.rows ?? [];
  const warnings = report?.validation?.warnings ?? [];
  const errors = report?.validation?.errors ?? [];
  const chips = activeChips([
    { key: "search", label: "Search", value: search },
    { key: "status", label: "Status", value: status },
    { key: "lineType", label: "Line", value: lineType },
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Hierarchy & Span"
        subtitle="Configure primary and matrix reporting lines, validate hierarchy health, and export span-of-control reports."
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button variant="outlined" startIcon={isRunning ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} disabled={isRunning} onClick={() => runHierarchyAction("sync")}>
              Sync Users
            </Button>
            <Button variant="outlined" startIcon={<FactCheckRoundedIcon />} disabled={isRunning} onClick={() => runHierarchyAction("validate")}>
              Validate
            </Button>
            <ExportButton disabled={isRunning} onClick={() => runHierarchyAction("export")} />
          </Stack>
        }
      />

      {(errors.length > 0 || warnings.length > 0) && (
        <Alert severity={errors.length > 0 ? "error" : "warning"}>
          {errors.length > 0 ? `${errors.length} hierarchy errors require attention.` : `${warnings.length} hierarchy warnings found.`}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard label="Managers" value={formatInteger(spanRows.length)} icon={<SupervisorAccountRoundedIcon />} isLoading={isReportLoading} />
        <KpiCard label="Assignments" value={formatInteger(report?.assignments?.length ?? 0)} icon={<AccountTreeRoundedIcon />} isLoading={isReportLoading} />
        <KpiCard label="Warnings" value={formatInteger(warnings.length)} icon={<FactCheckRoundedIcon />} isLoading={isReportLoading} />
        <KpiCard label="Status" value={report?.validation?.status ?? "Unknown"} icon={<CheckCircleRoundedIcon />} isLoading={isReportLoading} />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Manual Assignment
          </Typography>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <TextField size="small" label="Employee Username" value={form.employee_username} onChange={(event) => setForm((current) => ({ ...current, employee_username: event.target.value }))} />
            <TextField size="small" label="Manager Username" value={form.manager_username} onChange={(event) => setForm((current) => ({ ...current, manager_username: event.target.value }))} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Reporting Line</InputLabel>
              <Select label="Reporting Line" value={form.reporting_line_type} onChange={(event) => setForm((current) => ({ ...current, reporting_line_type: event.target.value }))}>
                {["Primary", "Matrix", "Delegated", "Temporary"].map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Department" value={form.department_name} onChange={(event) => setForm((current) => ({ ...current, department_name: event.target.value }))} />
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isRunning} onClick={saveAssignment}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Span Report
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Manager</TableCell>
                  <TableCell align="right">Direct</TableCell>
                  <TableCell align="right">Matrix</TableCell>
                  <TableCell align="right">Total Span</TableCell>
                  <TableCell>Departments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isReportLoading ? <LoadingRows columns={5} /> : spanRows.map((row) => (
                  <TableRow key={row.manager_username} hover>
                    <TableCell>{row.manager_username}</TableCell>
                    <TableCell align="right">{formatInteger(row.direct_reports ?? 0)}</TableCell>
                    <TableCell align="right">{formatInteger(row.matrix_reports ?? 0)}</TableCell>
                    <TableCell align="right">{formatInteger(row.total_span ?? 0)}</TableCell>
                    <TableCell>{emptyValue(row.departments_text)}</TableCell>
                  </TableRow>
                ))}
                <TableEmptyState isLoading={isReportLoading} rows={spanRows} colSpan={5} />
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField size="small" label="Search employee" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 240 } }} />
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <MenuItem value="">All statuses</MenuItem>
                  {["Active", "Inactive", "Expired"].map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Line Type</InputLabel>
                <Select label="Line Type" value={lineType} onChange={(event) => setLineType(event.target.value)}>
                  <MenuItem value="">All line types</MenuItem>
                  {["Primary", "Matrix", "Delegated", "Temporary"].map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <ActiveFilterChips
              filters={chips}
              onDelete={(key) => {
                if (key === "status") setStatus("");
                if (key === "lineType") setLineType("");
                if (key === "search") setSearch("");
              }}
              onClear={() => {
                setStatus("");
                setLineType("");
                setSearch("");
              }}
            />
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>Line</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Valid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.employee_name || row.employee_username}</TableCell>
                      <TableCell>{emptyValue(row.manager_username)}</TableCell>
                      <TableCell>{emptyValue(row.reporting_line_type)}</TableCell>
                      <TableCell>{emptyValue(row.department_name)}</TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell><StatusChip status={row.validation_status} /></TableCell>
                    </TableRow>
                  ))}
                  <TableEmptyState isLoading={assignments.query.isLoading} isError={assignments.query.isError} rows={assignmentRows} colSpan={6} hasSearch={Boolean(search)} hasFilters={Boolean(status || lineType)} onRetry={() => assignments.query.refetch()} />
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={assignments.result.total ?? 0}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export const RbacMatrixPage = () => {
  const { open } = useNotification();
  const [matrix, setMatrix] = useState<RbacMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [testUsername, setTestUsername] = useState("");
  const [testSummary, setTestSummary] = useState<JsonMap | null>(null);
  const audits = useList<RbacAudit>({ resource: "kaizen_rbac_audits", sorters: [{ field: "created_at", order: "desc" }], pagination: SMALL_PAGE });

  const loadMatrix = useCallback(async () => {
    setIsLoading(true);
    try {
      setMatrix(await executeFunction<RbacMatrix>("kaizen-rbac-matrix", { action: "matrix" }));
    } catch (error) {
      open?.({ type: "error", message: "Unable to load RBAC matrix", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  const roles = matrix?.roles ?? [];
  const permissions = matrix?.permissions ?? [];
  const features = useMemo(() => {
    const all = matrix?.features ?? [];
    return all.filter((feature) => {
      const matchesModule = !moduleFilter || feature.module_key === moduleFilter;
      const textMatch = `${feature.module_key} ${feature.feature_key}`.toLowerCase().includes(search.toLowerCase());
      return matchesModule && textMatch;
    });
  }, [matrix?.features, moduleFilter, search]);
  const modules = useMemo(() => Array.from(new Set((matrix?.features ?? []).map((feature) => feature.module_key))).sort(), [matrix?.features]);
  const permissionMap = useMemo(() => {
    const map = new Map<string, RbacPermission>();
    permissions.forEach((permission) => map.set(`${permission.role_slug}|${permission.module_key}|${permission.feature_key}`, permission));
    return map;
  }, [permissions]);

  const savePermission = async (roleSlug: string, feature: RbacFeature, permissionLevel: string) => {
    const key = `${roleSlug}|${feature.module_key}|${feature.feature_key}`;
    setSavingKey(key);
    try {
      const result = await executeFunction<{ success: boolean; error?: string }>("kaizen-rbac-matrix", {
        action: "save_permission",
        role_slug: roleSlug,
        module_key: feature.module_key,
        feature_key: feature.feature_key,
        permission_level: permissionLevel,
        data_scope: roles.find((role) => role.role_slug === roleSlug)?.data_scope ?? "Own",
      });
      if (!result.success) throw new Error(result.error || "Permission save failed");
      open?.({ type: "success", message: "Permission saved" });
      void loadMatrix();
      audits.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save permission", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSavingKey("");
    }
  };

  const runRbacAction = async (action: "seed" | "compliance" | "export") => {
    setIsRunning(true);
    try {
      const result = await executeFunction<RbacMatrix>("kaizen-rbac-matrix", { action });
      if (!result.success) throw new Error("RBAC action failed");
      if (action === "export") downloadText("kaizen-rbac-matrix.csv", result.csv_data ?? "", "text/csv;charset=utf-8");
      open?.({ type: "success", message: action === "compliance" ? "Compliance check complete" : "RBAC action complete" });
      void loadMatrix();
      audits.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "RBAC action failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const testUser = async () => {
    if (!testUsername) {
      open?.({ type: "error", message: "Username is required" });
      return;
    }
    setIsRunning(true);
    try {
      const result = await executeFunction<{ success: boolean; summary?: JsonMap; error?: string }>("kaizen-rbac-matrix", { action: "test_user", username: testUsername });
      if (!result.success) throw new Error(result.error || "Permission test failed");
      setTestSummary(result.summary ?? null);
      open?.({ type: "success", message: "Permission test complete" });
      audits.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to test user", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const chips = activeChips([
    { key: "search", label: "Search", value: search },
    { key: "module", label: "Module", value: moduleFilter },
  ]);

  return (
    <PageShell>
      <PageHeader
        title="RBAC Matrix"
        subtitle="Review predefined/custom role permissions, inheritance metadata, compliance checks, permission testing, and audit history."
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button variant="outlined" startIcon={isRunning ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} disabled={isRunning} onClick={() => runRbacAction("seed")}>
              Refresh Defaults
            </Button>
            <Button variant="outlined" startIcon={<SecurityRoundedIcon />} disabled={isRunning} onClick={() => runRbacAction("compliance")}>
              Compliance
            </Button>
            <ExportButton disabled={isRunning} onClick={() => runRbacAction("export")} />
          </Stack>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard label="Roles" value={formatInteger(roles.length)} icon={<AdminPanelSettingsRoundedIcon />} isLoading={isLoading} />
        <KpiCard label="Features" value={formatInteger(matrix?.features?.length ?? 0)} icon={<SecurityRoundedIcon />} isLoading={isLoading} />
        <KpiCard label="Permissions" value={formatInteger(matrix?.compliance?.permission_count ?? permissions.length)} icon={<FactCheckRoundedIcon />} isLoading={isLoading} />
        <KpiCard label="Risk" value={matrix?.compliance?.risk_level ?? "Unknown"} icon={<CheckCircleRoundedIcon />} isLoading={isLoading} />
      </Box>

      {matrix?.compliance?.conflicts?.length ? (
        <Alert severity="error">{matrix.compliance.conflicts.length} permission conflicts detected.</Alert>
      ) : (
        <Alert severity="success">No RBAC conflicts detected in the current matrix.</Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField size="small" label="Search feature" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 260 } }} />
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Module</InputLabel>
                <Select label="Module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
                  <MenuItem value="">All modules</MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module} value={module}>
                      {module}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <ActiveFilterChips
              filters={chips}
              onDelete={(key) => {
                if (key === "module") setModuleFilter("");
                if (key === "search") setSearch("");
              }}
              onClear={() => {
                setModuleFilter("");
                setSearch("");
              }}
            />
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Feature</TableCell>
                    {roles.map((role) => (
                      <TableCell key={role.role_slug}>{role.role_name || role.role_slug}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={`${feature.module_key}-${feature.feature_key}`} hover>
                      <TableCell>
                        <Typography variant="body2">{feature.feature_key}</Typography>
                        <Typography variant="caption" color="text.secondary">{feature.module_key}</Typography>
                      </TableCell>
                      {roles.map((role) => {
                        const key = `${role.role_slug}|${feature.module_key}|${feature.feature_key}`;
                        const permission = permissionMap.get(key);
                        return (
                          <TableCell key={role.role_slug} sx={{ minWidth: 170 }}>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={permission?.permission_level ?? "No Access"}
                                onChange={(event) => savePermission(role.role_slug, feature, event.target.value)}
                                disabled={savingKey === key}
                              >
                                {PERMISSION_LEVELS.map((level) => (
                                  <MenuItem key={level} value={level}>
                                    {level}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  <TableEmptyState isLoading={isLoading} rows={features} colSpan={roles.length + 1} hasSearch={Boolean(search)} hasFilters={Boolean(moduleFilter)} onRetry={loadMatrix} />
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Test As User
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField size="small" label="Username" value={testUsername} onChange={(event) => setTestUsername(event.target.value)} sx={{ minWidth: { md: 280 } }} />
            <Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <SecurityRoundedIcon />} disabled={isRunning} onClick={testUser}>
              Test Access
            </Button>
          </Stack>
          {testSummary ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
              <Chip color="primary" label={`Roles: ${Array.isArray(testSummary.role_slugs) ? testSummary.role_slugs.join(", ") : "-"}`} />
              <Chip color="info" label={`Allowed features: ${String(testSummary.allowed_features ?? 0)}`} />
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Audit History
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Changed By</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(audits.result.data ?? []).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{emptyValue(row.action_type)}</TableCell>
                    <TableCell>{emptyValue(row.target_role_slug)}</TableCell>
                    <TableCell>{emptyValue(row.target_username)}</TableCell>
                    <TableCell><StatusChip status={row.risk_level} /></TableCell>
                    <TableCell>{emptyValue(row.changed_by_username)}</TableCell>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                  </TableRow>
                ))}
                <TableEmptyState isLoading={audits.query.isLoading} isError={audits.query.isError} rows={audits.result.data ?? []} colSpan={6} onRetry={() => audits.query.refetch()} />
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export const InnovationPresentationsPage = () => {
  const { open } = useNotification();
  const [templates, setTemplates] = useState<PresentationTemplate[]>([]);
  const [analytics, setAnalytics] = useState<PresentationResponse["summary"] | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [form, setForm] = useState({
    title: "Innovation Day Review",
    presentation_type: "Quarterly Innovation Day",
    period_start: DEFAULT_START,
    period_end: DEFAULT_END,
    template_key: "",
    email_recipients: "",
    scheduled_for: "",
  });

  const loadPresentationMeta = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await executeFunction<PresentationResponse>("kaizen-presentation-export", { action: "analytics" });
      setTemplates(response.templates ?? []);
      setAnalytics(response.summary ?? null);
      const defaultTemplate = (response.templates ?? []).find((template) => template.is_default) ?? response.templates?.[0];
      if (defaultTemplate) {
        setForm((current) => ({ ...current, template_key: current.template_key || defaultTemplate.template_key }));
      }
    } catch (error) {
      open?.({ type: "error", message: "Unable to load presentation metadata", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [open]);

  useEffect(() => {
    void loadPresentationMeta();
  }, [loadPresentationMeta]);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (type) next.push({ field: "presentation_type", operator: "eq", value: type });
    if (debouncedSearch) next.push({ field: "title", operator: "contains", value: debouncedSearch });
    return next;
  }, [debouncedSearch, status, type]);

  const exportsList = useList<PresentationExport>({
    resource: "kaizen_presentation_exports",
    filters,
    sorters: [{ field: "generated_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });

  const templateByKey = useMemo(() => {
    const map = new Map<string, PresentationTemplate>();
    templates.forEach((template) => map.set(template.template_key, template));
    return map;
  }, [templates]);

  const generate = async () => {
    setIsRunning(true);
    try {
      const emailRecipients = form.email_recipients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await executeFunction<PresentationResponse>("kaizen-presentation-export", {
        action: "generate",
        title: form.title,
        presentation_type: form.presentation_type,
        period_start: form.period_start,
        period_end: form.period_end,
        template_key: form.template_key,
        email_recipients: emailRecipients,
        scheduled_for: form.scheduled_for || undefined,
      });
      if (!response.success) throw new Error(response.error || "Presentation generation failed");
      const template = templateByKey.get(response.export?.template_key ?? form.template_key) ?? response.template;
      downloadPresentationPptx(response.file_name ?? `${form.title}.pptx`, response.slides ?? [], {
        title: response.export?.title ?? form.title,
        theme: normalizeTheme(template?.color_scheme),
      });
      open?.({ type: "success", message: "Presentation generated", description: `${response.slides?.length ?? 0} editable slides downloaded.` });
      exportsList.query.refetch();
      void loadPresentationMeta();
    } catch (error) {
      open?.({ type: "error", message: "Unable to generate presentation", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadExisting = async (row: PresentationExport) => {
    setIsRunning(true);
    try {
      const response = await executeFunction<PresentationResponse>("kaizen-presentation-export", { action: "download", export_id: row.id });
      if (!response.success) throw new Error(response.error || "Download failed");
      const slides = response.slides ?? row.generation_params?.slides ?? [];
      downloadPresentationPptx(response.file_name ?? row.pptx_file_name ?? `${row.title}.pptx`, slides, {
        title: row.title,
        theme: normalizeTheme(templateByKey.get(row.template_key ?? "")?.color_scheme),
      });
      open?.({ type: "success", message: "Presentation downloaded" });
      exportsList.query.refetch();
      void loadPresentationMeta();
    } catch (error) {
      open?.({ type: "error", message: "Unable to download presentation", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  const exportRows = exportsList.result.data ?? [];
  const chips = activeChips([
    { key: "search", label: "Search", value: search },
    { key: "status", label: "Status", value: status },
    { key: "type", label: "Type", value: type },
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Innovation Presentations"
        subtitle="Generate editable Innovation Day PowerPoint decks from Kaizen data, templates, date ranges, filters, archives, and usage analytics."
        action={<Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <SlideshowRoundedIcon />} disabled={isRunning} onClick={generate}>Generate PPTX</Button>}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard label="Exports" value={formatInteger(analytics?.exports ?? exportsList.result.total ?? 0)} icon={<SlideshowRoundedIcon />} isLoading={isLoadingTemplates} />
        <KpiCard label="Downloads" value={formatInteger(analytics?.downloads ?? 0)} icon={<FileDownloadRoundedIcon />} isLoading={isLoadingTemplates} />
        <KpiCard label="Templates" value={formatInteger(analytics?.templates ?? templates.length)} icon={<AssessmentRoundedIcon />} isLoading={isLoadingTemplates} />
        <KpiCard label="Archive Rows" value={formatInteger(exportsList.result.total ?? 0)} icon={<FactCheckRoundedIcon />} isLoading={exportsList.query.isLoading} />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Generate Deck
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr repeat(3, 1fr)" }, gap: 2 }}>
              <TextField label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <FormControl>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={form.presentation_type} onChange={(event) => setForm((current) => ({ ...current, presentation_type: event.target.value }))}>
                  {PRESENTATION_TYPES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Start" type="date" value={form.period_start} onChange={(event) => setForm((current) => ({ ...current, period_start: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="End" type="date" value={form.period_end} onChange={(event) => setForm((current) => ({ ...current, period_end: event.target.value }))} InputLabelProps={{ shrink: true }} />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <FormControl>
                <InputLabel>Template</InputLabel>
                <Select label="Template" value={form.template_key} onChange={(event) => setForm((current) => ({ ...current, template_key: event.target.value }))}>
                  {templates.map((template) => (
                    <MenuItem key={template.template_key} value={template.template_key}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Email Recipients" value={form.email_recipients} onChange={(event) => setForm((current) => ({ ...current, email_recipients: event.target.value }))} placeholder="name@example.com, team@example.com" />
              <TextField label="Schedule For" type="datetime-local" value={form.scheduled_for} onChange={(event) => setForm((current) => ({ ...current, scheduled_for: event.target.value }))} InputLabelProps={{ shrink: true }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2 }}>
        {templates.map((template) => (
          <Card key={template.template_key}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="h3">{template.name}</Typography>
                  {template.is_default ? <Chip size="small" color="primary" label="Default" /> : null}
                </Stack>
                <Typography variant="body2" color="text.secondary">{template.presentation_type}</Typography>
                <Typography variant="caption" color="text.secondary">{formatInteger(template.slide_config?.length ?? 0)} slides</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField size="small" label="Search title" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: { md: 260 } }} />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <MenuItem value="">All statuses</MenuItem>
                  {["Draft", "Generated", "Emailed", "Archived", "Failed"].map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 230 }}>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
                  <MenuItem value="">All types</MenuItem>
                  {PRESENTATION_TYPES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ExportButton onClick={() => downloadRows("presentation-archive.csv", exportRows as unknown as Array<Record<string, unknown>>, ["title", "presentation_type", "period_start", "period_end", "status", "slide_count", "download_count", "generated_by_username"])} />
            </Stack>
            <ActiveFilterChips
              filters={chips}
              onDelete={(key) => {
                if (key === "search") setSearch("");
                if (key === "status") setStatus("");
                if (key === "type") setType("");
              }}
              onClear={() => {
                setSearch("");
                setStatus("");
                setType("");
              }}
            />
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Slides</TableCell>
                    <TableCell align="right">Downloads</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2">{row.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{emptyValue(row.generated_by_username)} | {formatDate(row.generated_at)}</Typography>
                      </TableCell>
                      <TableCell>{row.presentation_type}</TableCell>
                      <TableCell>{formatDate(row.period_start)} - {formatDate(row.period_end)}</TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell align="right">{formatInteger(row.slide_count ?? 0)}</TableCell>
                      <TableCell align="right">{formatInteger(row.download_count ?? 0)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<FileDownloadRoundedIcon />} disabled={isRunning} onClick={() => downloadExisting(row)}>
                          PPTX
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableEmptyState isLoading={exportsList.query.isLoading} isError={exportsList.query.isError} rows={exportRows} colSpan={7} hasSearch={Boolean(search)} hasFilters={Boolean(status || type)} onRetry={() => exportsList.query.refetch()} />
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={exportsList.result.total ?? 0}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
};

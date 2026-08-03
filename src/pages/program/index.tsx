import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useList, useNotification, type CrudFilters, type CrudSorting } from "@refinedev/core";
import { useNavigate } from "react-router";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
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
import MuiTooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { taruviTokens } from "../../theme/themeOptions";
import { executeFunction } from "../../utils/functionHelpers";
import { taruviDataProvider } from "../../providers/refineProviders";
import {
  ActiveFilterChips,
  CategoryChip,
  EmptyState,
  FTE_SAVING_DENOMINATOR,
  KAIZEN_CATEGORIES,
  KAIZEN_STATUSES,
  StatusChip,
  emptyValue,
  employeeDisplayLabel,
  formatCurrency,
  formatDate,
  formatFteSaving,
  formatInteger,
  toNumber,
  useDebouncedValue,
  useKaizenRoles,
  type Client,
  type Department,
  type KaizenIdea,
  type PeopleEmployee,
} from "../kaizens/shared";
import {
  calculateConfiguredFteSaving,
  getBenefitCalculationConfig,
  useBenefitCalculationConfigs,
  type BenefitCalculationConfig,
} from "../settings/shared";
import {
  KpiCard,
  PageHeader,
  ProgramFiltersBar,
  csvFromObjects,
  defaultProgramFilters,
  downloadText,
  formatImpact,
  openPrintableHtml,
  useAnalyticsSummary,
  type AnalyticsRow,
  type LeaderboardRow,
  type ProgramFilters,
  type ProgramProcessOption,
} from "./shared";

type ReportArchive = {
  id: string;
  report_type: string;
  title: string;
  period_start?: string | null;
  period_end?: string | null;
  summary?: Record<string, unknown>;
  csv_data?: string | null;
  html_report?: string | null;
  generated_by_username?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type TrainingResource = {
  id: string;
  title: string;
  category: string;
  format: string;
  summary?: string | null;
  content_url?: string | null;
  storage_path?: string | null;
  version?: string | null;
  status?: string | null;
  view_count?: number | string | null;
  download_count?: number | string | null;
  updated_at?: string | null;
};

type ReminderRow = {
  id: string;
  idea_id?: string | null;
  reminder_type: string;
  recipient_username?: string | null;
  status?: string | null;
  due_at?: string | null;
  snoozed_until?: string | null;
  message?: string | null;
  direct_link?: string | null;
};

type ReminderSetting = {
  id: string;
  trigger_key: string;
  trigger_label: string;
  days_after: number;
  escalation_days: number;
  recipient_role?: string | null;
  frequency?: string | null;
  enabled?: boolean;
};

type IncentiveBatch = {
  id: string;
  title: string;
  period_start?: string | null;
  period_end?: string | null;
  status?: string | null;
  total_employees?: number | string | null;
  total_kaizens?: number | string | null;
  total_incentive_amount?: number | string | null;
  approver_username?: string | null;
  approved_at?: string | null;
};

type IncentiveItem = {
  id: string;
  batch_id: string;
  employee_username: string;
  employee_name?: string | null;
  department_name?: string | null;
  kaizen_count?: number | string | null;
  total_hours_saved?: number | string | null;
  total_cost_saved?: number | string | null;
  calculated_incentive?: number | string | null;
  status?: string | null;
  anomaly_flag?: boolean;
};

type ReportArchiveFilters = {
  kaizen: string;
  owner: string;
  department: string;
  client: string;
  process: string;
};

const CATEGORY_OPTIONS = [...KAIZEN_CATEGORIES];
const STATUS_OPTIONS = Array.from(new Set([...KAIZEN_STATUSES]));
const CHART_COLORS = [taruviTokens.status.chartPrimary, taruviTokens.status.resolved, taruviTokens.status.underReview, taruviTokens.status.delayedAlt, taruviTokens.status.onHoldAlt, taruviTokens.primary[500]];
const SMALL_PAGE = { currentPage: 1, pageSize: 100 };
const PROCESS_PAGE = { currentPage: 1, pageSize: 1000 };
const NAME_ASC_SORTERS = [{ field: "name", order: "asc" as const }];
const PROCESS_NAME_ASC_SORTERS = [{ field: "display_name", order: "asc" as const }];
const ACTIVE_PEOPLE_DEPARTMENT_FILTERS: CrudFilters = [{ field: "is_active", operator: "eq", value: true }];
const ACTIVE_PEOPLE_EMPLOYEE_FILTERS: CrudFilters = [{ field: "employment_status", operator: "eq", value: "active" }];
const ACTIVE_PROCESS_FILTERS: CrudFilters = [{ field: "status", operator: "eq", value: "Active" }];
const EMPLOYEE_PAGINATION = { currentPage: 1, pageSize: 1000 };
const EMPLOYEE_NAME_ASC_SORTERS = [
  { field: "first_name", order: "asc" as const },
  { field: "last_name", order: "asc" as const },
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentDateInput = () => formatDateInput(new Date());

const getMonthStartInput = () => {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
};

const DATE_RANGE_OPTIONS = [
  { value: "current_month", label: "Current month" },
  { value: "previous_month", label: "Previous month" },
  { value: "current_quarter", label: "Current quarter" },
  { value: "year_to_date", label: "Year to date" },
  { value: "custom", label: "Custom range" },
] as const;
const MONTHLY_REPORT_TYPE = "Monthly Kaizen Report";
const MONTHLY_REPORT_TITLE = "Kaizen Report";
const DEFAULT_REPORT_ARCHIVE_FILTERS: ReportArchiveFilters = {
  kaizen: "",
  owner: "",
  department: "",
  client: "",
  process: "",
};

type DateRangeOption = (typeof DATE_RANGE_OPTIONS)[number]["value"];

const getPreviousMonthRangeInput = () => {
  const now = new Date();
  return {
    start: formatDateInput(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    end: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
};

const getCurrentQuarterStartInput = () => {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return formatDateInput(new Date(now.getFullYear(), quarterStartMonth, 1));
};

const getDateRangeForOption = (option: DateRangeOption) => {
  switch (option) {
    case "current_month":
      return { start: getMonthStartInput(), end: getCurrentDateInput() };
    case "previous_month":
      return getPreviousMonthRangeInput();
    case "current_quarter":
      return { start: getCurrentQuarterStartInput(), end: getCurrentDateInput() };
    case "year_to_date":
      return { start: `${new Date().getFullYear()}-01-01`, end: getCurrentDateInput() };
    case "custom":
      return null;
  }
};

const getDefaultReportRange = () => getDateRangeForOption("current_month") ?? { start: getMonthStartInput(), end: getCurrentDateInput() };

const dateInputStart = (value: string) => value ? `${value}T00:00:00` : "";

const dateInputNextDayStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  const date = new Date(year, month - 1, day + 1);
  return formatDateInput(date) + "T00:00:00";
};

type ReportArchiveFilterNode =
  | Record<string, unknown>
  | { and: ReportArchiveFilterNode[] }
  | { or: ReportArchiveFilterNode[] };

const reportArchiveFilterTree = (nodes: ReportArchiveFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const submittedReportFilters = (
  periodStart: string,
  periodEnd: string,
  filters: ReportArchiveFilters = DEFAULT_REPORT_ARCHIVE_FILTERS,
): CrudFilters => {
  const nodes: ReportArchiveFilterNode[] = [
    { kaizen_id__nnull: true },
    { kaizen_id__ne: "" },
    { submitted_at__nnull: true },
    { status__ne: "Draft" },
  ];
  const fromStart = dateInputStart(periodStart);
  const toNextStart = dateInputNextDayStart(periodEnd);

  if (fromStart) nodes.push({ submitted_at__gte: fromStart });
  if (toNextStart) nodes.push({ submitted_at__lt: toNextStart });

  const kaizenQuery = filters.kaizen.trim();
  if (kaizenQuery) {
    nodes.push({ or: [{ kaizen_id__icontains: kaizenQuery }, { title__icontains: kaizenQuery }] });
  }

  const ownerQuery = filters.owner.trim();
  if (ownerQuery) {
    nodes.push({
      or: [
        { submitted_by_name__icontains: ownerQuery },
        { submitted_by_username__icontains: ownerQuery },
        { submitted_by_email__icontains: ownerQuery },
      ],
    });
  }

  const departmentQuery = filters.department.trim();
  if (departmentQuery) {
    nodes.push({ or: [{ department_name__icontains: departmentQuery }, { department_code__icontains: departmentQuery }] });
  }

  const clientQuery = filters.client.trim();
  if (clientQuery) {
    nodes.push({ client_name__icontains: clientQuery });
  }

  const processQuery = filters.process.trim();
  if (processQuery) {
    nodes.push({ process_name__icontains: processQuery });
  }

  return reportArchiveFilterTree(nodes);
};

const useClients = () => {
  const clients = useList<Client>({ resource: "kaizen_clients", sorters: NAME_ASC_SORTERS, pagination: SMALL_PAGE });
  return clients.result.data ?? [];
};

const useProcesses = () => {
  const processes = useList<ProgramProcessOption>({
    resource: "kaizen_processes",
    filters: ACTIVE_PROCESS_FILTERS,
    sorters: PROCESS_NAME_ASC_SORTERS,
    pagination: PROCESS_PAGE,
  });
  return processes.result.data ?? [];
};

const normalizeDepartmentOptionName = (value: unknown) => String(value ?? "").trim().toLowerCase();

const useKaizenDepartments = () => {
  const departments = useList<Department>({ resource: "kaizen_departments", sorters: NAME_ASC_SORTERS, pagination: SMALL_PAGE });
  return departments.result.data ?? [];
};

const useMasters = () => {
  const departments = useKaizenDepartments();
  const clients = useClients();
  return { departments, clients };
};

const usePeopleDepartments = () => {
  const departments = useList<Department>({
    resource: "departments",
    filters: ACTIVE_PEOPLE_DEPARTMENT_FILTERS,
    sorters: NAME_ASC_SORTERS,
    pagination: SMALL_PAGE,
    meta: { populate: ["lead_id"] },
  });
  return departments.result.data ?? [];
};

const buildLeaderboardDepartmentOptions = (peopleDepartments: Department[], kaizenDepartments: Department[]) => {
  const kaizenByName = new Map<string, Department>();
  kaizenDepartments.forEach((department) => {
    const name = String(department.name ?? "").trim();
    if (!name) return;
    kaizenByName.set(normalizeDepartmentOptionName(name), department);
  });

  const options = new Map<string, { id: string; name: string }>();
  peopleDepartments.forEach((department) => {
    const name = String(department.name ?? "").trim();
    if (!name) return;
    const key = normalizeDepartmentOptionName(name);
    const mappedKaizenDepartment = kaizenByName.get(key);
    options.set(key, { id: mappedKaizenDepartment?.id || name, name });
  });

  kaizenDepartments.forEach((department) => {
    const name = String(department.name ?? "").trim();
    if (!name) return;
    const key = normalizeDepartmentOptionName(name);
    if (!options.has(key)) {
      options.set(key, { id: department.id, name });
    }
  });

  return Array.from(options.values()).sort((left, right) => left.name.localeCompare(right.name));
};

const exportRows = (name: string, rows: Array<Record<string, unknown>>, headers: string[]) =>
  downloadText(`${name}.csv`, csvFromObjects(rows, headers), "text/csv;charset=utf-8");

const reportFilename = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";

const AnalyticsKpis = ({ data, isLoading }: { data?: ReturnType<typeof useAnalyticsSummary>["data"]; isLoading: boolean }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
    <KpiCard label="Total Kaizens" value={data?.totals.total ?? 0} helper={`Delta ${data?.comparison.total?.delta ?? 0}`} icon={<AnalyticsRoundedIcon />} isLoading={isLoading} />
    <KpiCard label="Approved" value={data?.totals.approved ?? 0} helper={`Rejected ${data?.totals.rejected ?? 0}`} icon={<FactCheckRoundedIcon />} isLoading={isLoading} />
    <KpiCard label="In Progress" value={data?.totals.in_progress ?? 0} helper={`Closed ${data?.totals.closed ?? 0}`} icon={<NotificationsActiveRoundedIcon />} isLoading={isLoading} />
    <KpiCard label="Hours Saved" value={formatInteger(data?.totals.hours_saved ?? 0)} helper={`Delta ${formatInteger(data?.comparison.hours_saved?.delta ?? 0)}`} icon={<AnalyticsRoundedIcon />} isLoading={isLoading} />
    <KpiCard label="Cost Saved" value={formatCurrency(data?.totals.cost_saved ?? 0)} helper={`High impact ${data?.totals.high_impact ?? 0}`} icon={<PaidRoundedIcon />} isLoading={isLoading} />
  </Box>
);

const PerformanceTable = ({ rows, title }: { rows: AnalyticsRow[]; title: string }) => (
  <Card>
    <CardContent>
      <Typography variant="h3" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Approved</TableCell>
              <TableCell align="right">Closed</TableCell>
              <TableCell align="right">Impact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{row.total ?? 0}</TableCell>
                <TableCell align="right">{row.approved ?? 0}</TableCell>
                <TableCell align="right">{row.closed ?? 0}</TableCell>
                <TableCell align="right">{formatImpact(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </CardContent>
  </Card>
);

export const AnalyticsPage = () => {
  const { departments, clients } = useMasters();
  const [filters, setFilters] = useState<ProgramFilters>(defaultProgramFilters);
  const analytics = useAnalyticsSummary(filters);
  const data = analytics.data;

  const exportDashboard = async () => {
    const result = await executeFunction<{ csv_data: string; html_report: string }>("kaizen-generate-report", {
      report_type: "Analytics Dashboard",
      title: "Kaizen Analytics Dashboard",
      period_start: filters.date_from,
      period_end: filters.date_to,
      department_ids: filters.department_id ? [filters.department_id] : [],
    });
    downloadText("kaizen-analytics-dashboard.csv", result.csv_data, "text/csv;charset=utf-8");
    openPrintableHtml(result.html_report);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Analytics Overview" subtitle="Program-wide KPIs, distribution, trend, comparison, and department/client performance." action={<Button variant="contained" startIcon={<FileDownloadRoundedIcon />} onClick={exportDashboard}>Export Report</Button>} />
        <ProgramFiltersBar filters={filters} onChange={setFilters} departments={departments} clients={clients} categories={CATEGORY_OPTIONS} statuses={STATUS_OPTIONS} onRefresh={analytics.refresh} isRefreshing={analytics.isRefreshing} />
        <AnalyticsKpis data={data} isLoading={analytics.isLoading} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Submission Trend</Typography>
              {analytics.isLoading ? <Skeleton variant="rounded" height={280} /> : (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={data?.submission_trend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="submitted" stroke={taruviTokens.status.chartPrimary} strokeWidth={2} />
                      <Line type="monotone" dataKey="closed" stroke={taruviTokens.status.resolved} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Status Distribution</Typography>
              {analytics.isLoading ? <Skeleton variant="rounded" height={280} /> : (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data?.status_distribution ?? []} dataKey="total" nameKey="name" outerRadius={95} label>
                        {(data?.status_distribution ?? []).map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <PerformanceTable title="Department Performance" rows={data?.department_performance ?? []} />
          <PerformanceTable title="Client Performance" rows={data?.client_performance ?? []} />
        </Box>
      </Stack>
    </Container>
  );
};

const LEADERBOARD_CLOSED_STATUSES = new Set(["Closed", "Certificate Generated", "Audit Closed", "Incentive Approved"]);

const visibleLeaderboardIdeas = (ideas: LeaderboardRow["ideas"]) => {
  const submitted = (ideas ?? []).filter((idea) => Boolean(idea.kaizen_id) && idea.status !== "Draft");
  return Array.from(new Map(submitted.map((idea) => [idea.kaizen_id ?? idea.id, idea])).values());
};

const normalizeLeaderboardRow = (row: LeaderboardRow) => {
  if (!row.ideas) return row;
  const ideas = visibleLeaderboardIdeas(row.ideas);
  return {
    ...row,
    total_kaizens: ideas.length,
    closed_kaizens: ideas.filter((idea) => LEADERBOARD_CLOSED_STATUSES.has(idea.status ?? "")).length,
    ideas,
  };
};

export const LeaderboardPage = () => {
  const kaizenDepartments = useKaizenDepartments();
  const peopleDepartments = usePeopleDepartments();
  const [period, setPeriod] = useState("Year");
  const [filters, setFilters] = useState<ProgramFilters>(defaultProgramFilters);
  const analytics = useAnalyticsSummary(filters);
  const [portfolio, setPortfolio] = useState<LeaderboardRow | null>(null);
  const departments = useMemo(
    () => buildLeaderboardDepartmentOptions(peopleDepartments, kaizenDepartments),
    [kaizenDepartments, peopleDepartments],
  );
  const selectedDepartmentAvailable = !filters.department_id || departments.some((department) => department.id === filters.department_id);

  useEffect(() => {
    if (!selectedDepartmentAvailable) {
      setFilters((current) => ({ ...current, department_id: "" }));
    }
  }, [selectedDepartmentAvailable]);

  const leaderboardRows = useMemo(
    () =>
      (analytics.data?.top_performers ?? [])
        .map(normalizeLeaderboardRow)
        .filter((row) => row.total_kaizens > 0)
        .map((row, index) => ({ ...row, rank: index + 1 })),
    [analytics.data?.top_performers],
  );
  const myRank = useMemo(
    () => (analytics.data?.my_rank ? normalizeLeaderboardRow(analytics.data.my_rank) : null),
    [analytics.data?.my_rank],
  );

  const setPeriodRange = (next: string) => {
    setPeriod(next);
    const now = new Date();
    if (next === "Month") setFilters({ ...filters, date_from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, date_to: now.toISOString().slice(0, 10) });
    if (next === "Quarter") {
      const startMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      setFilters({ ...filters, date_from: `${now.getFullYear()}-${String(startMonth).padStart(2, "0")}-01`, date_to: now.toISOString().slice(0, 10) });
    }
    if (next === "Year") setFilters(defaultProgramFilters());
    if (next === "All") setFilters({});
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Leaderboard" subtitle="Top performers by total submissions, closed Kaizens, and combined impact score." />
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Period</InputLabel>
                <Select label="Period" value={period} onChange={(event) => setPeriodRange(event.target.value)}>
                  {["Month", "Quarter", "Year", "All"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel shrink>Department</InputLabel>
                <Select
                  label="Department"
                  value={selectedDepartmentAvailable ? filters.department_id ?? "" : ""}
                  displayEmpty
                  renderValue={(selected) => {
                    const value = String(selected ?? "");
                    return value ? departments.find((department) => department.id === value)?.name ?? value : "All departments";
                  }}
                  onChange={(event) => setFilters({ ...filters, department_id: event.target.value })}
                >
                  <MenuItem value="">All departments</MenuItem>
                  {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Kaizens</TableCell>
                    <TableCell align="right">Closed</TableCell>
                    <TableCell align="right">Impact Score</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : leaderboardRows.map((row) => (
                    <TableRow key={`${row.username}-${row.department_id ?? row.department_name ?? row.rank}`} hover>
                      <TableCell>{row.rank <= 3 ? <Chip color={row.rank === 1 ? "warning" : row.rank === 2 ? "info" : "success"} icon={<EmojiEventsRoundedIcon />} label={`#${row.rank}`} /> : `#${row.rank}`}</TableCell>
                      <TableCell>{row.employee_name}</TableCell>
                      <TableCell>{row.department_name}</TableCell>
                      <TableCell align="right">{row.total_kaizens}</TableCell>
                      <TableCell align="right">{row.closed_kaizens}</TableCell>
                      <TableCell align="right">{formatInteger(row.impact_score)}</TableCell>
                      <TableCell align="right"><Button size="small" variant="text" onClick={() => setPortfolio(row)}>Portfolio</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {myRank && myRank.rank > 10 ? (
              <Typography variant="body2" sx={{ mt: 2 }}>My Rank: #{myRank.rank} - {myRank.employee_name}</Typography>
            ) : null}
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={Boolean(portfolio)} onClose={() => setPortfolio(null)} maxWidth="md" fullWidth>
        <DialogTitle>{portfolio?.employee_name} Portfolio</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {(portfolio?.ideas ?? []).map((idea) => (
              <Stack key={idea.id} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">{idea.kaizen_id || "Draft"} - {idea.title}</Typography>
                <StatusChip status={idea.status} />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button variant="outlined" onClick={() => setPortfolio(null)}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { open } = useNotification();
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("current_month");
  const [periodStart, setPeriodStart] = useState<string>(() => getDefaultReportRange().start);
  const [periodEnd, setPeriodEnd] = useState<string>(() => getDefaultReportRange().end);
  const [archiveFieldFilters, setArchiveFieldFilters] = useState<ReportArchiveFilters>(DEFAULT_REPORT_ARCHIVE_FILTERS);
  const [generatingReportType, setGeneratingReportType] = useState<string | null>(null);
  const [archivePage, setArchivePage] = useState(0);
  const [archivePageSize, setArchivePageSize] = useState(10);
  const debouncedArchiveFieldFilters = useDebouncedValue(archiveFieldFilters);
  const isGenerating = Boolean(generatingReportType);
  const isPeriodMissing = !periodStart || !periodEnd;
  const isPeriodInvalid = Boolean(periodStart && periodEnd && periodStart > periodEnd);
  const periodErrorText = isPeriodMissing ? "Select both start and end dates." : isPeriodInvalid ? "Start date must be on or before end date." : "";
  const canGenerateReport = !isGenerating && !isPeriodMissing && !isPeriodInvalid;
  const canLoadArchives = !isPeriodMissing && !isPeriodInvalid;
  const archiveFilters = useMemo<CrudFilters>(() => {
    if (!canLoadArchives) return [];
    return submittedReportFilters(periodStart, periodEnd, debouncedArchiveFieldFilters);
  }, [canLoadArchives, debouncedArchiveFieldFilters, periodEnd, periodStart]);
  const archiveSorters = useMemo<CrudSorting>(() => [{ field: "submitted_at", order: "desc" }], []);
  const archivePagination = useMemo(() => ({ currentPage: archivePage + 1, pageSize: archivePageSize }), [archivePage, archivePageSize]);
  const archiveQueryOptions = useMemo(() => ({ enabled: canLoadArchives }), [canLoadArchives]);
  const { result: archiveResult, query: archiveQuery } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: archiveFilters,
    sorters: archiveSorters,
    pagination: archivePagination,
    queryOptions: archiveQueryOptions,
  });
  const archiveRows = canLoadArchives ? archiveResult.data ?? [] : [];

  const updateArchiveFieldFilters = (nextFilters: ReportArchiveFilters) => {
    setArchiveFieldFilters(nextFilters);
    setArchivePage(0);
  };

  const updateDateRangeOption = (nextOption: DateRangeOption) => {
    setDateRangeOption(nextOption);
    setArchivePage(0);
    const range = getDateRangeForOption(nextOption);

    if (range) {
      setPeriodStart(range.start);
      setPeriodEnd(range.end);
    }
  };

  const updatePeriodStart = (nextStart: string) => {
    setDateRangeOption("custom");
    setArchivePage(0);
    setPeriodStart(nextStart);
    if (nextStart && periodEnd && nextStart > periodEnd) {
      setPeriodEnd(nextStart);
    }
  };

  const updatePeriodEnd = (nextEnd: string) => {
    setDateRangeOption("custom");
    setArchivePage(0);
    setPeriodEnd(nextEnd);
    if (nextEnd && periodStart && nextEnd < periodStart) {
      setPeriodStart(nextEnd);
    }
  };

  const generate = async (reportType = MONTHLY_REPORT_TYPE) => {
    if (!canGenerateReport) {
      open?.({ type: "error", message: "Invalid reporting period", description: periodErrorText || "Select a valid reporting period." });
      return;
    }

    setGeneratingReportType(reportType);
    try {
      const displayTitle = reportType === MONTHLY_REPORT_TYPE ? MONTHLY_REPORT_TITLE : reportType;
      const title = `${displayTitle} ${periodStart} to ${periodEnd}`;
      const response = await executeFunction<{ success: boolean; csv_data?: string }>("kaizen-generate-report", { report_type: reportType, title, period_start: periodStart, period_end: periodEnd });
      if (!response.success) throw new Error("Report generation failed");
      downloadText(`${reportFilename(title)}.csv`, response.csv_data ?? "", "text/csv;charset=utf-8");
      open?.({ type: "success", message: "Report generated", description: "The report was archived and downloaded as a CSV file." });
      archiveQuery.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to generate report", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setGeneratingReportType(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Reports" subtitle="Generate monthly, analytics, and productivity report archives." />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: 2, alignItems: "stretch" }}>
          <Card>
            <CardContent sx={{ height: "100%" }}>
              <Stack spacing={2} sx={{ height: "100%" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ReportIconFrame color={taruviTokens.status.inProgress}>
                    <AnalyticsRoundedIcon fontSize="small" />
                  </ReportIconFrame>
                  <Box>
                    <Typography variant="h4">Reporting Period</Typography>
                    <Typography variant="body2" color="text.secondary">Choose the date range used to generate and filter reports.</Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr", xl: "1.2fr 1fr 1fr" }, gap: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      label="Date Range"
                      value={dateRangeOption}
                      onChange={(event) => updateDateRangeOption(event.target.value as DateRangeOption)}
                    >
                      {DATE_RANGE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Start"
                    type="date"
                    value={periodStart}
                    onChange={(event) => updatePeriodStart(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: periodEnd || undefined }}
                    error={Boolean(periodErrorText)}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="End"
                    type="date"
                    value={periodEnd}
                    onChange={(event) => updatePeriodEnd(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: periodStart || undefined }}
                    error={Boolean(periodErrorText)}
                    fullWidth
                  />
                </Box>
                <Typography variant="caption" color={periodErrorText ? "error" : "text.secondary"}>
                  {periodErrorText || `${DATE_RANGE_OPTIONS.find((option) => option.value === dateRangeOption)?.label ?? "Selected range"}: ${formatDate(periodStart)} - ${formatDate(periodEnd)}.`}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>Auto-generation runs on the first of each month through this archive workflow.</Typography>
              </Stack>
            </CardContent>
          </Card>
          <ReportGenerateCard
            icon={<FileDownloadRoundedIcon fontSize="small" />}
            iconColor={taruviTokens.button.primaryDefault}
            title="Report"
            body="Generate a full Kaizen archive in CSV format for the selected period."
            action={
              <Button
                variant="contained"
                startIcon={generatingReportType === MONTHLY_REPORT_TYPE ? <CircularProgress color="inherit" size={16} /> : <FileDownloadRoundedIcon />}
                onClick={() => generate(MONTHLY_REPORT_TYPE)}
                disabled={!canGenerateReport}
                fullWidth
              >
                Generate Report
              </Button>
            }
          />
        </Box>
        <ReportKaizenArchiveTable
          rows={archiveRows}
          total={canLoadArchives ? archiveResult.total ?? 0 : 0}
          page={archivePage}
          pageSize={archivePageSize}
          onPageChange={setArchivePage}
          onPageSizeChange={(nextPageSize) => {
            setArchivePageSize(nextPageSize);
            setArchivePage(0);
          }}
          isLoading={canLoadArchives && archiveQuery.isLoading}
          isError={canLoadArchives && archiveQuery.isError}
          onRetry={() => archiveQuery.refetch()}
          periodStart={periodStart}
          periodEnd={periodEnd}
          periodErrorText={periodErrorText}
          filters={archiveFieldFilters}
          onFiltersChange={updateArchiveFieldFilters}
          onOpen={(id) => navigate(`/kaizens/show/${id}`)}
        />
      </Stack>
    </Container>
  );
};

const ReportIconFrame = ({ children, color }: { children: ReactNode; color: string }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      flex: "0 0 40px",
      borderRadius: 1.5,
      display: "grid",
      placeItems: "center",
      color,
      bgcolor: `${color}14`,
    }}
  >
    {children}
  </Box>
);

const ReportGenerateCard = ({
  icon,
  iconColor,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  iconColor: string;
  title: string;
  body: string;
  action: ReactNode;
}) => (
  <Card>
    <CardContent sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ReportIconFrame color={iconColor}>{icon}</ReportIconFrame>
          <Typography variant="h4">{title}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {body}
        </Typography>
        {action}
      </Stack>
    </CardContent>
  </Card>
);

const ReportArchiveText = ({
  value,
  variant = "body2",
  color,
  fontWeight,
}: {
  value?: string | number | null;
  variant?: "body2" | "caption";
  color?: string;
  fontWeight?: number;
}) => {
  const text = emptyValue(value);

  return (
    <MuiTooltip title={text}>
      <Typography
        component="span"
        variant={variant}
        color={color}
        noWrap
        sx={{ display: "block", fontWeight, maxWidth: "100%" }}
      >
        {text}
      </Typography>
    </MuiTooltip>
  );
};

const reportArchiveHasFilters = (filters: ReportArchiveFilters) =>
  Object.values(filters).some((value) => String(value ?? "").trim() !== "");

const reportArchiveFilterChips = (filters: ReportArchiveFilters) => {
  const chips: Array<{ key: keyof ReportArchiveFilters; label: string }> = [];
  if (filters.kaizen.trim()) chips.push({ key: "kaizen", label: `Kaizen: ${filters.kaizen.trim()}` });
  if (filters.owner.trim()) chips.push({ key: "owner", label: `Owner: ${filters.owner.trim()}` });
  if (filters.department.trim()) chips.push({ key: "department", label: `Department: ${filters.department.trim()}` });
  if (filters.client.trim()) chips.push({ key: "client", label: `Client: ${filters.client.trim()}` });
  if (filters.process.trim()) chips.push({ key: "process", label: `Process: ${filters.process.trim()}` });
  return chips;
};

const ReportKaizenArchiveTable = ({
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  isError = false,
  onRetry,
  periodStart,
  periodEnd,
  periodErrorText,
  filters,
  onFiltersChange,
  onOpen,
}: {
  rows: KaizenIdea[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  periodStart?: string;
  periodEnd?: string;
  periodErrorText?: string;
  filters: ReportArchiveFilters;
  onFiltersChange: (filters: ReportArchiveFilters) => void;
  onOpen: (id: string) => void;
}) => {
  const activeFilterChips = reportArchiveFilterChips(filters);
  const hasActiveFilters = reportArchiveHasFilters(filters);

  const updateFilter = <K extends keyof ReportArchiveFilters>(key: K, value: ReportArchiveFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const deleteFilter = (key: string) => {
    if (!(key in DEFAULT_REPORT_ARCHIVE_FILTERS)) return;
    onFiltersChange({ ...filters, [key]: "" } as ReportArchiveFilters);
  };

  return (
    <Card>
      <CardContent>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h3">Report Archive</Typography>
          <Typography variant="body2" color="text.secondary">
            Showing submitted Kaizens from {periodStart && periodEnd ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}` : "the selected reporting period"}.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
          <TextField
            size="small"
            label="Kaizen"
            placeholder="ID or title"
            value={filters.kaizen}
            onChange={(event) => updateFilter("kaizen", event.target.value)}
          />
          <TextField
            size="small"
            label="Owner"
            placeholder="Name, username, or email"
            value={filters.owner}
            onChange={(event) => updateFilter("owner", event.target.value)}
          />
          <TextField
            size="small"
            label="Department"
            placeholder="Department name or code"
            value={filters.department}
            onChange={(event) => updateFilter("department", event.target.value)}
          />
          <TextField
            size="small"
            label="Client"
            placeholder="Client name"
            value={filters.client}
            onChange={(event) => updateFilter("client", event.target.value)}
          />
          <TextField
            size="small"
            label="Process"
            placeholder="Process name"
            value={filters.process}
            onChange={(event) => updateFilter("process", event.target.value)}
          />
        </Box>
        <ActiveFilterChips
          filters={activeFilterChips}
          onDelete={deleteFilter}
          onClear={() => onFiltersChange(DEFAULT_REPORT_ARCHIVE_FILTERS)}
        />
      </Stack>
      <Box sx={{ overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Table
          stickyHeader
          size="small"
          sx={{
            minWidth: 1500,
            tableLayout: "fixed",
            "& th": { whiteSpace: "nowrap" },
            "& td": { verticalAlign: "middle" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 280 }}>Kaizen</TableCell>
              <TableCell sx={{ width: 120 }}>Status</TableCell>
              <TableCell sx={{ width: 170 }}>Owner</TableCell>
              <TableCell sx={{ width: 160 }}>Department</TableCell>
              <TableCell sx={{ width: 160 }}>Client</TableCell>
              <TableCell sx={{ width: 180 }}>Process</TableCell>
              <TableCell sx={{ width: 130 }}>Submitted</TableCell>
              <TableCell align="right" sx={{ width: 180 }}>Impact</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={9}><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : periodErrorText ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState kind="no-matches" title="Select a valid reporting period" body={periodErrorText} />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    kind="error"
                    title="Unable to load Kaizens"
                    body="Refresh the archive or retry the request."
                    action={onRetry ? <Button variant="contained" onClick={onRetry}>Retry</Button> : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    kind="no-matches"
                    title={hasActiveFilters ? "No matching Kaizens" : "No Kaizens for this period"}
                    body={hasActiveFilters ? "No Kaizens match the selected report filters." : "No Kaizens were submitted in the selected date range."}
                  />
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <ReportArchiveText value={row.title || "Untitled Kaizen"} fontWeight={700} />
                  <ReportArchiveText value={row.kaizen_id || "Draft"} variant="caption" color="text.secondary" />
                </TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell><ReportArchiveText value={row.submitted_by_name || row.submitted_by_username} /></TableCell>
                <TableCell><ReportArchiveText value={row.department_name} /></TableCell>
                <TableCell><ReportArchiveText value={row.client_name} /></TableCell>
                <TableCell><ReportArchiveText value={row.process_name} /></TableCell>
                <TableCell><ReportArchiveText value={formatDate(row.submitted_at)} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{formatImpact({ hours_saved: toNumber(row.hours_saved), cost_saved: toNumber(row.cost_saved) })}</TableCell>
                <TableCell align="right">
                  <MuiTooltip title="Open Kaizen">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={`Open ${row.title || row.kaizen_id || "Kaizen"}`}
                      onClick={() => onOpen(row.id)}
                    >
                      <VisibilityRoundedIcon fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
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
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
      />
    </CardContent>
  </Card>
  );
};

const ReportArchiveTable = ({
  rows,
  isLoading,
  isError = false,
  onRetry,
  periodStart,
  periodEnd,
  periodErrorText,
}: {
  rows: ReportArchive[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  periodStart?: string;
  periodEnd?: string;
  periodErrorText?: string;
}) => (
  <Card>
    <CardContent>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h3">Report Archive</Typography>
        <Typography variant="body2" color="text.secondary">
          Showing monthly reports for {periodStart && periodEnd ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}` : "the selected reporting period"}.
        </Typography>
      </Stack>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Generated By</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}><Skeleton /></TableCell></TableRow> : periodErrorText ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    kind="no-matches"
                    title="Select a valid reporting period"
                    body={periodErrorText}
                  />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    kind="error"
                    title="Unable to load reports"
                    body="Refresh the archive or retry the request."
                    action={onRetry ? <Button variant="contained" onClick={onRetry}>Retry</Button> : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    kind="no-matches"
                    title="No reports for this period"
                    body="Generate a monthly report for the selected dates."
                  />
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.report_type}</Typography>
                </TableCell>
                <TableCell>{formatDate(row.period_start)} - {formatDate(row.period_end)}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell>{emptyValue(row.generated_by_username)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ minWidth: 180 }}>
                    <Button size="small" variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => downloadText(`${reportFilename(row.title)}.csv`, row.csv_data ?? "", "text/csv;charset=utf-8")}>CSV</Button>
                    <Button size="small" variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => openPrintableHtml(row.html_report ?? "")}>Print</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </CardContent>
  </Card>
);

export const ScorecardsPage = () => {
  const { departments } = useMasters();
  const [filters, setFilters] = useState<ProgramFilters>(defaultProgramFilters);
  const analytics = useAnalyticsSummary(filters);
  const exportScorecard = () => exportRows("department-scorecard", (analytics.data?.scorecards ?? []) as unknown as Array<Record<string, unknown>>, ["name", "total", "approved", "closed", "participation_pct", "approval_rate", "hours_saved", "cost_saved", "indicator"]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Department Scorecards" subtitle="Department performance, participation, impact, benchmarking, contributors, and rejection analysis." action={<Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={exportScorecard}>Export CSV</Button>} />
        <ProgramFiltersBar filters={filters} onChange={setFilters} departments={departments} categories={CATEGORY_OPTIONS} onRefresh={analytics.refresh} isRefreshing={analytics.isRefreshing} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          {(analytics.data?.scorecards ?? []).map((card) => (
            <Card key={card.name}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h3">{card.name}</Typography>
                  <Chip color={card.indicator === "Green" ? "success" : card.indicator === "Yellow" ? "warning" : "error"} label={card.indicator ?? "Red"} />
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <KpiCard label="Participation" value={`${card.participation_pct ?? 0}%`} />
                  <KpiCard label="Approval Rate" value={`${card.approval_rate ?? 0}%`} />
                  <KpiCard label="Submitted" value={card.total ?? 0} />
                  <KpiCard label="Impact" value={formatImpact(card)} />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>Top Contributors</Typography>
                {(card.top_contributors ?? []).slice(0, 5).map((person) => (
                  <Stack key={person.username} direction="row" justifyContent="space-between">
                    <Typography variant="body2">{person.employee_name}</Typography>
                    <Typography variant="body2">{formatInteger(person.impact_score)}</Typography>
                  </Stack>
                ))}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
};

const useKaizenFilters = (filters: ProgramFilters, search?: string): CrudFilters =>
  useMemo(() => {
    const next: CrudFilters = [];
    const query = search ?? filters.search;
    if (query?.trim()) next.push({ field: "search", operator: "eq", value: query.trim() });
    if (filters.status) next.push({ field: "status", operator: "eq", value: filters.status });
    if (filters.category) next.push({ field: "category", operator: "eq", value: filters.category });
    if (filters.department_id) next.push({ field: "department_id", operator: "eq", value: filters.department_id });
    if (filters.client_id) next.push({ field: "client_id", operator: "eq", value: filters.client_id });
    if (filters.date_from) next.push({ field: "submitted_at", operator: "gte", value: filters.date_from });
    if (filters.date_to) next.push({ field: "submitted_at", operator: "lte", value: `${filters.date_to}T23:59:59` });
    if (filters.min_hours) next.push({ field: "hours_saved", operator: "gte", value: Number(filters.min_hours) });
    if (filters.min_cost) next.push({ field: "cost_saved", operator: "gte", value: Number(filters.min_cost) });
    return next;
  }, [filters, search]);

type KaizenBackendFilterNode =
  | Record<string, unknown>
  | { and: KaizenBackendFilterNode[] }
  | { or: KaizenBackendFilterNode[] };

const GLOBAL_SEARCH_FIELDS = [
  "kaizen_id",
  "title",
  "status",
  "current_stage",
  "department_name",
  "department_code",
  "client_name",
  "category",
  "effort_type",
  "process_name",
  "submitted_by_username",
  "submitted_by_name",
  "submitted_by_email",
  "team_lead_username",
  "team_lead_name",
] as const;

const kaizenFilterTree = (nodes: KaizenBackendFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const UUID_VALUE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GLOBAL_SEARCH_EXCLUDED_STATUSES = ["Draft", "Withdrawn"] as const;

const useGlobalKaizenFilters = (filters: ProgramFilters, search?: string): CrudFilters =>
  useMemo(() => {
    const nodes: KaizenBackendFilterNode[] = GLOBAL_SEARCH_EXCLUDED_STATUSES.map((status) => ({ status__ne: status }));
    const query = (search ?? filters.search)?.trim();

    if (query) {
      nodes.push({
        or: GLOBAL_SEARCH_FIELDS.map((field) => ({ [`${field}__icontains`]: query })),
      });
    }
    if (filters.category) nodes.push({ category__eq: filters.category });
    if (filters.department_id?.trim()) {
      const departmentValue = filters.department_id.trim();
      const departmentFilters: KaizenBackendFilterNode[] = [
        { department_name__eq: departmentValue },
        { department_name__icontains: departmentValue },
        { department_code__eq: departmentValue },
        { department_code__icontains: departmentValue },
      ];

      if (UUID_VALUE_PATTERN.test(departmentValue)) {
        departmentFilters.unshift({ department_id__eq: departmentValue });
      }

      nodes.push({
        or: departmentFilters,
      });
    }
    if (filters.client_id) nodes.push({ client_id__eq: filters.client_id });
    if (filters.process_id?.trim()) {
      const processValue = filters.process_id.trim();
      const processFilters: KaizenBackendFilterNode[] = [
        { process_name__eq: processValue },
        { process_name__icontains: processValue },
      ];

      if (UUID_VALUE_PATTERN.test(processValue)) {
        processFilters.unshift({ process_id__eq: processValue });
      }

      nodes.push({
        or: processFilters,
      });
    }
    if (filters.date_from) nodes.push({ submitted_at__gte: filters.date_from });
    if (filters.date_to) nodes.push({ submitted_at__lte: `${filters.date_to}T23:59:59` });
    if (filters.min_hours) nodes.push({ hours_saved__gte: Number(filters.min_hours) });
    if (filters.min_cost) nodes.push({ cost_saved__gte: Number(filters.min_cost) });

    return kaizenFilterTree(nodes);
  }, [filters, search]);

const normalizeGlobalSearchFilters = (values: ProgramFilters = {}): ProgramFilters => {
  const { search: _search, status: _status, ...rest } = values;
  return rest;
};

const normalizeGlobalSearchKeyPart = (value?: string | null) => value?.trim().toLowerCase() || "";

const globalSearchSubmissionFingerprint = (row: KaizenIdea) => {
  const title = normalizeGlobalSearchKeyPart(row.title);
  const submitter = normalizeGlobalSearchKeyPart(row.submitted_by_username || row.submitted_by_email || row.submitted_by_name);
  if (!title || !submitter) return "";
  const department = normalizeGlobalSearchKeyPart(row.department_id || row.department_name);
  const client = normalizeGlobalSearchKeyPart(row.client_id || row.client_name);
  return [submitter, department, client, title].join("|");
};

const rowFreshness = (row: KaizenIdea) =>
  Date.parse(row.updated_at || row.submitted_at || row.created_at || "") || 0;

const rowStatusProgress = (row: KaizenIdea) => {
  const order = [
    "Draft",
    "Submitted",
    "Resubmitted",
    "In Review",
    "In Feasibility Review",
    "Approved",
    "Impact Updated",
    "Pending Audit",
    "Audit In Progress",
    "Audit Pass",
    "Audit Closed",
    "Certificate Generated",
    "Incentive Approved",
    "Closed",
  ];
  const index = order.indexOf(row.status || "");
  return index === -1 ? 0 : index + 1;
};

const isNewerGlobalSearchRow = (candidate: KaizenIdea, current: KaizenIdea) => {
  const candidateHasNumber = Boolean(candidate.kaizen_id?.trim());
  const currentHasNumber = Boolean(current.kaizen_id?.trim());
  if (candidateHasNumber !== currentHasNumber) {
    const candidateProgress = rowStatusProgress(candidate);
    const currentProgress = rowStatusProgress(current);
    if (candidateProgress >= currentProgress) return candidateHasNumber;
  }
  const freshnessDelta = rowFreshness(candidate) - rowFreshness(current);
  if (freshnessDelta !== 0) return freshnessDelta > 0;
  return rowStatusProgress(candidate) >= rowStatusProgress(current);
};

const dedupeGlobalSearchRows = (rows: KaizenIdea[]) => {
  const latestNumberedByFingerprint = new Map<string, KaizenIdea>();
  rows.forEach((row) => {
    const fingerprint = globalSearchSubmissionFingerprint(row);
    if (!fingerprint || !row.kaizen_id?.trim()) return;
    const existing = latestNumberedByFingerprint.get(fingerprint);
    if (!existing || isNewerGlobalSearchRow(row, existing)) {
      latestNumberedByFingerprint.set(fingerprint, row);
    }
  });

  const byKaizen = new Map<string, KaizenIdea>();
  rows.forEach((row) => {
    const kaizenId = normalizeGlobalSearchKeyPart(row.kaizen_id);
    const fingerprint = globalSearchSubmissionFingerprint(row);
    const linkedNumberedRow = !kaizenId && fingerprint ? latestNumberedByFingerprint.get(fingerprint) : null;
    const linkedKaizenId = normalizeGlobalSearchKeyPart(linkedNumberedRow?.kaizen_id);
    const key = linkedKaizenId
      ? `kaizen:${linkedKaizenId}`
      : kaizenId
        ? `kaizen:${kaizenId}`
        : fingerprint
          ? `draft:${fingerprint}`
          : `record:${row.id}`;
    const existing = byKaizen.get(key);
    if (!existing || isNewerGlobalSearchRow(row, existing)) {
      byKaizen.set(key, row);
    }
  });
  return Array.from(byKaizen.values()).sort((first, second) => {
    const freshnessDelta = rowFreshness(second) - rowFreshness(first);
    if (freshnessDelta !== 0) return freshnessDelta;
    return rowStatusProgress(second) - rowStatusProgress(first);
  });
};

const globalProcessLabel = (process: ProgramProcessOption) =>
  process.display_name || process.name || process.process_name || "Unnamed process";

const selectRenderValue =
  (fallback: string, getLabel: (value: string) => string | undefined) =>
  (value: unknown) => {
    const selectedValue = String(value ?? "");
    return selectedValue ? getLabel(selectedValue) ?? selectedValue : fallback;
  };

const compactFilterSx = { minWidth: 0 };

const GlobalSearchToolbar = ({
  filters,
  onChange,
  onClearAll,
  departments,
  clients,
  processes,
  categories,
}: {
  filters: ProgramFilters;
  onChange: (next: ProgramFilters) => void;
  onClearAll: () => void;
  departments: Array<{ id: string; name: string }>;
  clients: Client[];
  processes: ProgramProcessOption[];
  categories: string[];
}) => {
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const update = (key: keyof ProgramFilters, value: string) => onChange({ ...filters, [key]: value });
  const processOptions = processes ?? [];
  const selectedDepartment = departments.find((department) => department.id === filters.department_id);
  const selectedClient = clients.find((client) => client.id === filters.client_id);
  const selectedProcess = processOptions.find((process) => process.id === filters.process_id);

  const activeFilters = [
    filters.search?.trim() ? { key: "search" as const, label: `Search: ${filters.search.trim()}` } : null,
    filters.date_from ? { key: "date_from" as const, label: `From: ${filters.date_from}` } : null,
    filters.date_to ? { key: "date_to" as const, label: `To: ${filters.date_to}` } : null,
    filters.department_id ? { key: "department_id" as const, label: `Department: ${selectedDepartment?.name ?? filters.department_id}` } : null,
    filters.client_id ? { key: "client_id" as const, label: `Client: ${selectedClient?.name ?? filters.client_id}` } : null,
    filters.process_id ? { key: "process_id" as const, label: `Process: ${selectedProcess ? globalProcessLabel(selectedProcess) : filters.process_id}` } : null,
    filters.category ? { key: "category" as const, label: `Category: ${filters.category}` } : null,
  ].filter(Boolean) as Array<{ key: keyof ProgramFilters; label: string }>;
  const filtersOpen = Boolean(filterAnchorEl);
  const appliedFilterCount = activeFilters.filter((filter) => filter.key !== "search").length;
  const closeFilters = () => setFilterAnchorEl(null);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="flex-end">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "stretch", md: "flex-end" }}>
          <TextField
            size="small"
            value={filters.search ?? ""}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Search Kaizen ID or title"
            sx={{ flex: { xs: 1, md: "0 0 auto" }, width: { xs: "100%", md: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton aria-label="Clear search" size="small" edge="end" onClick={() => update("search", "")}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <MuiTooltip title={filtersOpen ? "Hide filters" : "Show filters"}>
            <IconButton
              aria-label="Show filters"
              onClick={(event) => setFilterAnchorEl(filtersOpen ? null : event.currentTarget)}
              sx={{
                width: 40,
                height: 40,
                border: 1,
                borderColor: appliedFilterCount ? "primary.main" : "divider",
                color: appliedFilterCount ? "primary.main" : "text.secondary",
                borderRadius: 1,
                bgcolor: filtersOpen ? "action.hover" : "transparent",
              }}
            >
              <FilterListRoundedIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Stack>

      <Popover
        open={filtersOpen}
        anchorEl={filterAnchorEl}
        onClose={closeFilters}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2,
            width: { xs: "calc(100vw - 32px)", sm: 640, md: 780 },
            maxWidth: "calc(100vw - 32px)",
          },
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Filters</Typography>
            {appliedFilterCount > 0 ? <Button size="small" variant="text" onClick={onClearAll}>Clear all</Button> : null}
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              label="From"
              type="date"
              value={filters.date_from ?? ""}
              onChange={(event) => update("date_from", event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              size="small"
              label="To"
              type="date"
              value={filters.date_to ?? ""}
              onChange={(event) => update("date_to", event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl size="small" sx={compactFilterSx} fullWidth>
              <InputLabel shrink>Department</InputLabel>
              <Select
                label="Department"
                value={filters.department_id ?? ""}
                displayEmpty
                renderValue={selectRenderValue("", (value) => departments.find((department) => department.id === value)?.name)}
                onChange={(event) => update("department_id", event.target.value)}
              >
                <MenuItem value="">All departments</MenuItem>
                {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={compactFilterSx} fullWidth>
              <InputLabel shrink>Client</InputLabel>
              <Select
                label="Client"
                value={filters.client_id ?? ""}
                displayEmpty
                renderValue={selectRenderValue("", (value) => clients.find((client) => client.id === value)?.name)}
                onChange={(event) => update("client_id", event.target.value)}
              >
                <MenuItem value="">All clients</MenuItem>
                {clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={compactFilterSx} fullWidth>
              <InputLabel shrink>Process</InputLabel>
              <Select
                label="Process"
                value={filters.process_id ?? ""}
                displayEmpty
                renderValue={selectRenderValue("", (value) => {
                  const option = processOptions.find((process) => process.id === value);
                  return option ? globalProcessLabel(option) : undefined;
                })}
                onChange={(event) => update("process_id", event.target.value)}
              >
                <MenuItem value="">All processes</MenuItem>
                {processOptions.map((process) => <MenuItem key={process.id} value={process.id}>{globalProcessLabel(process)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={compactFilterSx} fullWidth>
              <InputLabel shrink>Category</InputLabel>
              <Select
                label="Category"
                value={filters.category ?? ""}
                displayEmpty
                renderValue={selectRenderValue("", (value) => categories.find((category) => category === value))}
                onChange={(event) => update("category", event.target.value)}
              >
                <MenuItem value="">All categories</MenuItem>
                {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Popover>

      {activeFilters.length > 0 ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          {activeFilters.map((filter) => (
            <Chip
              key={filter.key}
              color="primary"
              label={filter.label}
              onDelete={() => update(filter.key, "")}
              variant="outlined"
            />
          ))}
          <Button size="small" variant="text" onClick={onClearAll}>Clear all</Button>
        </Stack>
      ) : null}
    </Stack>
  );
};

export const GlobalSearchPage = () => {
  const navigate = useNavigate();
  const clients = useClients();
  const processes = useProcesses();
  const peopleDepartments = usePeopleDepartments();
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const [filters, setFilters] = useState<ProgramFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search);
  const globalFilters = useMemo(() => normalizeGlobalSearchFilters(filters), [filters]);
  const filtersWithSearch = useMemo(() => ({ ...globalFilters, search }), [globalFilters, search]);
  const refineFilters = useGlobalKaizenFilters(globalFilters, debouncedSearch);
  const { result, query } = useList<KaizenIdea>({ resource: "kaizen_ideas", filters: refineFilters, sorters: [{ field: "submitted_at", order: "desc" }], pagination: { currentPage: page + 1, pageSize } });
  const rows = useMemo(() => dedupeGlobalSearchRows(result.data ?? []), [result.data]);
  const globalSearchDepartmentOptions = useMemo(
    () =>
      Array.from(
        new Map(
          peopleDepartments
            .map((department) => department.name.trim())
            .filter(Boolean)
            .map((name) => [name.toLowerCase(), { id: name, name }]),
        ).values(),
      ),
    [peopleDepartments],
  );
  const globalSearchProcessOptions = useMemo(() => {
    const options = new Map<string, ProgramProcessOption>();

    processes.forEach((process) => {
      const label = (process.display_name || process.name || process.process_name || "").trim();
      if (!label) return;

      const key = label.toLowerCase();
      if (!options.has(key)) {
        options.set(key, { id: label, name: label, display_name: label, process_name: label });
      }
    });

    return Array.from(options.values());
  }, [processes]);
  const updateGlobalFilters = (next: ProgramFilters) => {
    setSearch(next.search ?? "");
    setFilters(normalizeGlobalSearchFilters(next));
    setPage(0);
  };
  const clearGlobalFilters = () => {
    setSearch("");
    setFilters({});
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <PageHeader title="Global Kaizen Search" subtitle="Search all Kaizens with date, department, client, process, and category filters." />
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
            <GlobalSearchToolbar
              filters={filtersWithSearch}
              onChange={updateGlobalFilters}
              onClearAll={clearGlobalFilters}
              departments={globalSearchDepartmentOptions}
              clients={clients}
              processes={globalSearchProcessOptions}
              categories={CATEGORY_OPTIONS}
            />
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <KaizenResultTable rows={rows} isLoading={query.isLoading} showClient benefitCalculationConfigs={benefitCalculationConfigs} onOpen={(id) => navigate(`/kaizens/show/${id}`)} />
            </Box>
            <TablePagination component="div" count={result.total ?? 0} page={page} rowsPerPage={pageSize} rowsPerPageOptions={[10, 20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} />
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

const resultTextSx = {
  display: "block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ResultCellText = ({ value }: { value?: string | null }) => {
  const displayValue = emptyValue(value);
  const hasValue = typeof value === "string" ? value.trim().length > 0 : Boolean(value);

  return (
    <MuiTooltip title={hasValue ? displayValue : ""}>
      <Typography component="span" variant="body2" sx={resultTextSx}>
        {displayValue}
      </Typography>
    </MuiTooltip>
  );
};

const formatHoursSaved = (value: unknown) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(toNumber(value));

const formatCompactImpactNumber = (value: unknown) => {
  const numericValue = toNumber(value);
  if (Math.abs(numericValue) >= 10000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(numericValue);
  }
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
};

const calculateSavedMinutes = (row: KaizenIdea, configs: BenefitCalculationConfig[]) => {
  const config = getBenefitCalculationConfig(row.category, configs);
  const formulaType = config?.formula_type;
  const multiplier = toNumber(config?.multiplier) || 1;

  if (formulaType === "volume_time") {
    return toNumber(row.impacted_volume) * toNumber(row.time_saved) * multiplier;
  }
  if (formulaType === "quality_rework") {
    return (toNumber(row.error_before) - toNumber(row.error_after)) * toNumber(row.rework_time) * multiplier;
  }
  if (formulaType === "total_time") {
    return toNumber(row.total_time_saved) * multiplier;
  }

  const denominatorValue = toNumber(config?.denominator);
  const denominator = denominatorValue > 0 ? denominatorValue : FTE_SAVING_DENOMINATOR;
  return calculateConfiguredFteSaving(row, configs) * denominator;
};

const formatKaizenBenefitImpact = (row: KaizenIdea, configs: BenefitCalculationConfig[]) => {
  const calculatedHours = calculateSavedMinutes(row, configs) / 60;
  const hoursSaved = toNumber(row.hours_saved) > 0 ? toNumber(row.hours_saved) : calculatedHours;
  const calculatedFteSaving = calculateConfiguredFteSaving(row, configs);
  const fteSaving = toNumber(row.fte_saving) > 0 ? toNumber(row.fte_saving) : calculatedFteSaving;

  return {
    hours: `${formatCompactImpactNumber(hoursSaved)} hrs`,
    fte: `${formatCompactImpactNumber(fteSaving)} FTE`,
    full: `${formatHoursSaved(hoursSaved)} hrs / ${formatFteSaving(fteSaving)} FTE`,
  };
};

const KaizenImpactCell = ({ row, configs }: { row: KaizenIdea; configs: BenefitCalculationConfig[] }) => {
  const impact = formatKaizenBenefitImpact(row, configs);

  return (
    <MuiTooltip title={impact.full}>
      <Stack spacing={0.25} sx={{ alignItems: "flex-end", minWidth: 0, maxWidth: "100%" }}>
        <Typography component="span" variant="body2" sx={{ ...resultTextSx, textAlign: "right" }}>
          {impact.hours}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ...resultTextSx, textAlign: "right" }}>
          {impact.fte}
        </Typography>
      </Stack>
    </MuiTooltip>
  );
};

const KaizenResultTable = ({
  rows,
  isLoading,
  selectedIds,
  setSelectedIds,
  showClient = false,
  benefitCalculationConfigs = [],
  onOpen,
}: {
  rows: KaizenIdea[];
  isLoading: boolean;
  selectedIds?: string[];
  setSelectedIds?: (ids: string[]) => void;
  showClient?: boolean;
  benefitCalculationConfigs?: BenefitCalculationConfig[];
  onOpen: (id: string) => void;
}) => {
  const canSelect = Boolean(selectedIds && setSelectedIds);
  const selected = selectedIds ?? [];
  const columnCount = (canSelect ? 7 : 6) + (showClient ? 1 : 0);
  const tableMinWidth = showClient ? 1180 : 1040;
  const kaizenColumnWidth = showClient ? "36%" : "44%";

  return (
    <Box sx={{ overflowX: "auto", width: "100%" }}>
      <Table size="small" sx={{ tableLayout: "fixed", minWidth: tableMinWidth }}>
        <TableHead>
          <TableRow>
            {canSelect ? <TableCell padding="checkbox" sx={{ width: 48 }} /> : null}
            <TableCell sx={{ width: kaizenColumnWidth }}>Kaizen</TableCell>
            <TableCell sx={{ width: 140 }}>Status</TableCell>
            <TableCell sx={{ width: 170 }}>Department</TableCell>
            {showClient ? <TableCell sx={{ width: 170 }}>Client</TableCell> : null}
            <TableCell sx={{ width: 130 }}>Submitted</TableCell>
            <TableCell align="right" sx={{ width: 150 }}>Impact</TableCell>
            <TableCell align="right" sx={{ width: 112 }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={columnCount}><Skeleton /></TableCell></TableRow> : rows.map((row) => (
            <TableRow key={row.id} hover selected={canSelect && selected.includes(row.id)}>
              {canSelect ? (
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(row.id)} onChange={(event) => setSelectedIds?.(event.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))} />
                </TableCell>
              ) : null}
              <TableCell>
                <MuiTooltip title={row.title || "Untitled Kaizen"}>
                  <Typography variant="body2" sx={{ ...resultTextSx, fontWeight: 700 }}>{row.title || "Untitled Kaizen"}</Typography>
                </MuiTooltip>
                <MuiTooltip title={row.kaizen_id || "Draft"}>
                  <Typography variant="caption" color="text.secondary" sx={resultTextSx}>{row.kaizen_id || "Draft"}</Typography>
                </MuiTooltip>
              </TableCell>
              <TableCell><StatusChip status={row.status} /></TableCell>
              <TableCell><ResultCellText value={row.department_name} /></TableCell>
              {showClient ? <TableCell><ResultCellText value={row.client_name} /></TableCell> : null}
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.submitted_at)}</TableCell>
              <TableCell align="right" sx={{ overflow: "hidden" }}>
                <KaizenImpactCell row={row} configs={benefitCalculationConfigs} />
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}><Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => onOpen(row.id)}>Open</Button></TableCell>
            </TableRow>
          ))}
          {!isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={columnCount}><EmptyState kind="no-results" title="No results found" body="Try adjusting your search or filters" /></TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </Box>
  );
};

export const AuditPage = () => {
  const navigate = useNavigate();
  const { departments, clients } = useMasters();
  const [filters, setFilters] = useState<ProgramFilters>({ status: "Approved", min_cost: "0" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [auditAction, setAuditAction] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const refineFilters = useKaizenFilters(filters);
  const { result, query } = useList<KaizenIdea>({ resource: "kaizen_ideas", filters: refineFilters, sorters: [{ field: "submitted_at", order: "desc" }], pagination: { currentPage: page + 1, pageSize } });
  const analytics = useAnalyticsSummary(filters);
  const { open } = useNotification();

  const runAudit = async (action: string) => {
    const response = await executeFunction<{ success: boolean; error?: string; updated_count?: number }>("kaizen-bulk-action", { action, ids: selectedIds, comments: `${action} from PE/QA audit queue` });
    if (response.success) {
      open?.({ type: "success", message: "Audit action complete", description: `${response.updated_count ?? 0} rows updated.` });
      setSelectedIds([]);
      query.refetch();
      analytics.refresh();
    } else {
      open?.({ type: "error", message: "Audit action failed", description: response.error });
    }
    setAuditAction(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="PE/QA Audit Workbench" subtitle="View all Kaizens, filter audit pipeline, highlight aging items, bulk process, and export compliance details." action={<Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => exportRows("peqa-audit-list", (result.data ?? []) as unknown as Array<Record<string, unknown>>, ["kaizen_id", "title", "status", "department_name", "client_name", "hours_saved", "cost_saved"])}>Export</Button>} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2 }}>
          {Object.entries(analytics.data?.audit_pipeline.counts ?? {}).map(([key, value]) => <KpiCard key={key} label={key.replace(/_/g, " ")} value={value} isLoading={analytics.isLoading} />)}
        </Box>
        <ProgramFiltersBar filters={filters} onChange={setFilters} departments={departments} clients={clients} categories={CATEGORY_OPTIONS} statuses={["Approved", "Pending Audit", "Audit In Progress", "Audit Pass", "Audit Fail"]} onRefresh={analytics.refresh} isRefreshing={analytics.isRefreshing} />
        <Card>
          <CardContent>
            {selectedIds.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" onClick={() => setAuditAction("Audit In Progress")}>Start Audit</Button>
                <Button variant="contained" onClick={() => setAuditAction("Audit Pass")}>Audit Pass</Button>
                <Button color="error" variant="contained" onClick={() => setAuditAction("Audit Fail")}>Audit Fail</Button>
                <Button color="error" variant="contained" onClick={() => setAuditAction("Close")}>Close Kaizen</Button>
              </Stack>
            ) : null}
            <KaizenResultTable rows={result.data ?? []} isLoading={query.isLoading} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpen={(id) => navigate(`/kaizens/show/${id}`)} />
            <TablePagination component="div" count={result.total ?? 0} page={page} rowsPerPage={pageSize} rowsPerPageOptions={[10, 20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} />
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={Boolean(auditAction)} onClose={() => setAuditAction(null)}>
        <DialogTitle>Apply audit action?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedIds.length} Kaizens will be updated to {auditAction}. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAuditAction(null)}>Cancel</Button>
          <Button color={auditAction === "Audit Fail" || auditAction === "Close" ? "error" : "primary"} variant="contained" onClick={() => auditAction && runAudit(auditAction)}>Apply {auditAction}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export const ResourcesPage = () => {
  const roles = useKaizenRoles();
  const { open } = useNotification();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TrainingResource | null>(null);
  const [draft, setDraft] = useState({ title: "", category: "Quick Start Guide", format: "PDF", summary: "", content_url: "", version: "1.0" });
  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [{ field: "status", operator: "eq", value: "Published" }];
    if (search.trim()) next.push({ field: "search", operator: "eq", value: search.trim() });
    if (category) next.push({ field: "category", operator: "eq", value: category });
    return next;
  }, [category, search]);
  const { result, query } = useList<TrainingResource>({ resource: "kaizen_training_resources", filters, sorters: [{ field: "updated_at", order: "desc" }], pagination: SMALL_PAGE });
  const categories = ["Kaizen Process Guide", "Video Tutorials", "FAQ", "Best Practices & Tips", "Sample Kaizen Templates", "Success Stories", "Posters & Communications", "Quick Start Guide", "Role-Specific Guides"];

  const openResourceDialog = (resource?: TrainingResource) => {
    setEditingResource(resource ?? null);
    setDraft({
      title: resource?.title ?? "",
      category: resource?.category ?? "Quick Start Guide",
      format: resource?.format ?? "PDF",
      summary: resource?.summary ?? "",
      content_url: resource?.content_url ?? "",
      version: resource?.version ?? "1.0",
    });
    setDialogOpen(true);
  };

  const saveResource = async () => {
    const payload = { ...draft, tags_text: draft.category, status: "Published", updated_at: new Date().toISOString() };
    if (editingResource) {
      await taruviDataProvider.update({ resource: "kaizen_training_resources", id: editingResource.id, variables: payload, meta: {} });
    } else {
      await taruviDataProvider.create({ resource: "kaizen_training_resources", variables: { id: crypto.randomUUID(), ...payload, bucket: "kaizen-resources", storage_path: "", role_scope: ["Employee", "Lead/Manager", "PE/QA"], tags: [], uploaded_by_username: roles.identity?.username ?? "system", view_count: 0, download_count: 0, created_at: new Date().toISOString() }, meta: {} });
    }
    setDialogOpen(false);
    setEditingResource(null);
    query.refetch();
    open?.({ type: "success", message: editingResource ? "Resource updated" : "Resource published" });
  };

  const trackResourceUse = async (resource: TrainingResource, action: "view" | "download") => {
    const field = action === "view" ? "view_count" : "download_count";
    await taruviDataProvider.update({
      resource: "kaizen_training_resources",
      id: resource.id,
      variables: { [field]: toNumber(resource[field]) + 1, updated_at: new Date().toISOString() },
      meta: {},
    });
    query.refetch();
    if (resource.content_url) window.open(resource.content_url, "_blank", "noopener,noreferrer");
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Help & Resources" subtitle="Kaizen guides, tutorials, FAQs, templates, success stories, and downloadable communication material." action={roles.isAdmin ? <Button variant="contained" startIcon={<LibraryBooksRoundedIcon />} onClick={() => openResourceDialog()}>Add Resource</Button> : undefined} />
        <Card><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField size="small" label="Search resources" value={search} onChange={(event) => setSearch(event.target.value)} /><FormControl size="small" sx={{ minWidth: 240 }}><InputLabel>Category</InputLabel><Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}><MenuItem value="">All categories</MenuItem>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => downloadText("kaizen-resources.zip.txt", "Resource bundle request captured. Download individual materials from the repository.", "text/plain")}>Download All</Button></Stack></CardContent></Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
          {query.isLoading ? <Skeleton variant="rounded" height={180} /> : (result.data ?? []).map((resource) => (
            <Card key={resource.id}>
              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center"><CategoryChip category={resource.category} /><StatusChip status={resource.status} /></Stack>
                  <Typography variant="h3">{resource.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{resource.summary}</Typography>
                  <Typography variant="caption" color="text.secondary">Version {resource.version} - Views {resource.view_count ?? 0} - Downloads {resource.download_count ?? 0}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => trackResourceUse(resource, "view")}>Open</Button>
                    <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => trackResourceUse(resource, "download")}>Download</Button>
                    {roles.isAdmin ? <Button size="small" onClick={() => openResourceDialog(resource)}>Edit</Button> : null}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingResource ? "Update resource" : "Add resource"}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} fullWidth /><FormControl fullWidth><InputLabel>Category</InputLabel><Select label="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField label="Format" value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value })} /><TextField label="URL" value={draft.content_url} onChange={(event) => setDraft({ ...draft, content_url: event.target.value })} /><TextField label="Summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} multiline rows={3} /></Stack></DialogContent>
        <DialogActions><Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveResource}>{editingResource ? "Update" : "Publish"}</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export const RemindersPage = () => {
  const { open } = useNotification();
  const reminders = useList<ReminderRow>({ resource: "kaizen_reminders", sorters: [{ field: "due_at", order: "desc" }], pagination: SMALL_PAGE });
  const settings = useList<ReminderSetting>({ resource: "kaizen_reminder_settings", sorters: [{ field: "trigger_key", order: "asc" }], pagination: SMALL_PAGE });
  const [isRunning, setIsRunning] = useState(false);

  const run = async (dry_run: boolean) => {
    setIsRunning(true);
    try {
      const result = await executeFunction<{ success: boolean; created_count: number }>("kaizen-run-reminders", { dry_run });
      open?.({ type: "success", message: dry_run ? "Reminder preview ready" : "Reminders generated", description: `${result.created_count} reminders matched.` });
      reminders.query.refetch();
    } finally {
      setIsRunning(false);
    }
  };

  const action = async (reminder_id: string, nextAction: string) => {
    await executeFunction("kaizen-reminder-action", { reminder_id, action: nextAction, days: 3 });
    reminders.query.refetch();
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Automated Reminders" subtitle="Pending approval, implementation, impact validation, audit, digest, snooze, escalation, and reminder history." action={<Stack direction="row" spacing={1}><Button variant="outlined" disabled={isRunning} onClick={() => run(true)}>Preview</Button><Button variant="contained" disabled={isRunning} startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <NotificationsActiveRoundedIcon />} onClick={() => run(false)}>Run Reminders</Button></Stack>} />
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Active Reminder Settings</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Trigger</TableCell><TableCell>Days</TableCell><TableCell>Escalation</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(settings.result.data ?? []).map((row) => <TableRow key={row.id}><TableCell>{row.trigger_label}</TableCell><TableCell>{row.days_after}</TableCell><TableCell>{row.escalation_days}</TableCell><TableCell>{row.frequency}</TableCell><TableCell><StatusChip status={row.enabled ? "Approved" : "Rejected"} /></TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Reminder History</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Reminder</TableCell><TableCell>Recipient</TableCell><TableCell>Status</TableCell><TableCell>Due</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{(reminders.result.data ?? []).map((row) => <TableRow key={row.id}><TableCell>{row.message || row.reminder_type}</TableCell><TableCell>{emptyValue(row.recipient_username)}</TableCell><TableCell><StatusChip status={row.status} /></TableCell><TableCell>{formatDate(row.due_at)}</TableCell><TableCell align="right"><Button size="small" onClick={() => action(row.id, "snooze")}>Snooze</Button><Button size="small" onClick={() => action(row.id, "resolve")}>Resolve</Button></TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
      </Stack>
    </Container>
  );
};

export const IncentivesPage = () => {
  const { open } = useNotification();
  const [periodStart, setPeriodStart] = useState("2026-04-01");
  const [periodEnd, setPeriodEnd] = useState("2026-04-30");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<{ action: "approve_all" | "approve_item" | "reject_item" | "send_back"; batchId: string; itemId?: string; label: string } | null>(null);
  const batches = useList<IncentiveBatch>({ resource: "kaizen_incentive_batches", sorters: [{ field: "created_at", order: "desc" }], pagination: SMALL_PAGE });
  const items = useList<IncentiveItem>({ resource: "kaizen_incentive_items", filters: selectedBatch ? [{ field: "batch_id", operator: "eq", value: selectedBatch }] : [], pagination: SMALL_PAGE });

  const generate = async () => {
    const result = await executeFunction<{ success: boolean; batch?: IncentiveBatch }>("kaizen-incentive-batch", { action: "generate", title: `${periodStart} Incentive Sheet`, period_start: periodStart, period_end: periodEnd });
    if (result.success) {
      setSelectedBatch(result.batch?.id ?? "");
      batches.query.refetch();
      items.query.refetch();
      open?.({ type: "success", message: "Incentive sheet generated" });
    }
  };

  const runIncentiveAction = async () => {
    if (!pendingAction) return;
    const result = await executeFunction<{ success: boolean; updated_count?: number }>("kaizen-incentive-batch", {
      action: pendingAction.action,
      batch_id: pendingAction.batchId,
      item_id: pendingAction.itemId,
      comments: `${pendingAction.label} by steering committee`,
    });
    if (result.success) {
      open?.({ type: "success", message: "Incentive action complete", description: `${result.updated_count ?? 0} rows updated.` });
      batches.query.refetch();
      items.query.refetch();
    }
    setPendingAction(null);
  };

  const rows = items.result.data ?? [];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Bulk Incentive Approval" subtitle="Monthly incentive calculation, anomaly review, bulk approval, finance export, and employee notifications." action={<Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => exportRows("incentive-items", rows as unknown as Array<Record<string, unknown>>, ["employee_name", "department_name", "kaizen_count", "total_hours_saved", "total_cost_saved", "calculated_incentive", "status"])}>Export CSV</Button>} />
        <Card><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField size="small" label="Start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} InputLabelProps={{ shrink: true }} /><TextField size="small" label="End" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} InputLabelProps={{ shrink: true }} /><Button variant="contained" onClick={generate}>Generate Sheet</Button><FormControl size="small" sx={{ minWidth: 260 }}><InputLabel>Batch</InputLabel><Select label="Batch" value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)}><MenuItem value="">Choose batch</MenuItem>{(batches.result.data ?? []).map((batch) => <MenuItem key={batch.id} value={batch.id}>{batch.title}</MenuItem>)}</Select></FormControl>{selectedBatch ? <Button color="error" variant="contained" onClick={() => setPendingAction({ action: "approve_all", batchId: selectedBatch, label: "Approve all incentives" })}>Approve All</Button> : null}</Stack></CardContent></Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          <KpiCard label="Employees" value={rows.length} />
          <KpiCard label="Kaizens" value={formatInteger(rows.reduce((sum, row) => sum + toNumber(row.kaizen_count), 0))} />
          <KpiCard label="Total Incentive" value={formatCurrency(rows.reduce((sum, row) => sum + toNumber(row.calculated_incentive), 0))} />
        </Box>
        <Card><CardContent><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Department</TableCell><TableCell align="right">Kaizens</TableCell><TableCell align="right">Impact</TableCell><TableCell align="right">Incentive</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.employee_name}{row.anomaly_flag ? <Chip color="warning" size="small" label="Anomaly" sx={{ ml: 1 }} /> : null}</TableCell><TableCell>{row.department_name}</TableCell><TableCell align="right">{row.kaizen_count}</TableCell><TableCell align="right">{formatImpact({ hours_saved: toNumber(row.total_hours_saved), cost_saved: toNumber(row.total_cost_saved) })}</TableCell><TableCell align="right">{formatCurrency(row.calculated_incentive)}</TableCell><TableCell><StatusChip status={row.status} /></TableCell><TableCell align="right"><Button size="small" onClick={() => setPendingAction({ action: "approve_item", batchId: row.batch_id, itemId: row.id, label: `Approve ${row.employee_name || row.employee_username}` })}>Approve</Button><Button size="small" color="error" onClick={() => setPendingAction({ action: "reject_item", batchId: row.batch_id, itemId: row.id, label: `Reject ${row.employee_name || row.employee_username}` })}>Reject</Button><Button size="small" onClick={() => setPendingAction({ action: "send_back", batchId: row.batch_id, itemId: row.id, label: `Send back ${row.employee_name || row.employee_username}` })}>Send Back</Button></TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
      </Stack>
      <Dialog open={Boolean(pendingAction)} onClose={() => setPendingAction(null)}>
        <DialogTitle>{pendingAction?.label}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingAction?.action === "approve_all" ? rows.length : 1} incentive rows will be updated. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPendingAction(null)}>Cancel</Button>
          <Button color={pendingAction?.action === "reject_item" ? "error" : "primary"} variant="contained" onClick={runIncentiveAction}>
            {pendingAction?.label}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export const ProductivityPage = () => {
  const { result: employeesResult } = useList<PeopleEmployee>({
    resource: "employees",
    filters: ACTIVE_PEOPLE_EMPLOYEE_FILTERS,
    sorters: EMPLOYEE_NAME_ASC_SORTERS,
    pagination: EMPLOYEE_PAGINATION,
  });
  const { result: reportsResult, query } = useList<ReportArchive>({ resource: "kaizen_report_archives", filters: [{ field: "report_type", operator: "eq", value: "Employee Productivity" }], sorters: [{ field: "created_at", order: "desc" }], pagination: SMALL_PAGE });
  const [employee, setEmployee] = useState("");
  const [periodStart, setPeriodStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const { open } = useNotification();
  const employees = employeesResult.data ?? [];

  const generate = async () => {
    const selectedEmployees = employee ? [employee] : [];
    const result = await executeFunction<{ success: boolean }>("kaizen-generate-report", {
      report_type: "Employee Productivity",
      title: "Employee Productivity Impact Report",
      period_start: periodStart,
      period_end: periodEnd,
      employee_usernames: selectedEmployees,
      employee_emails: selectedEmployees,
    });
    if (result.success) {
      open?.({ type: "success", message: "Productivity report generated" });
      query.refetch();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Employee Productivity Reports" subtitle="Generate appraisal-ready individual or bulk productivity impact reports with benchmarking data." />
        <Card><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}><FormControl size="small" sx={{ minWidth: 260 }}><InputLabel>Employee</InputLabel><Select label="Employee" value={employee} onChange={(event) => setEmployee(event.target.value)}><MenuItem value="">All employees</MenuItem>{employees.map((row) => { const value = row.email || row.employee_number || row.id; return <MenuItem key={row.id} value={value}>{employeeDisplayLabel(row)}</MenuItem>; })}</Select></FormControl><TextField size="small" label="Start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} InputLabelProps={{ shrink: true }} /><TextField size="small" label="End" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} InputLabelProps={{ shrink: true }} /><Button variant="contained" onClick={generate}>Generate Report</Button><Button variant="outlined" onClick={() => downloadText("bulk-productivity-export.zip.txt", "Bulk ZIP export request captured. Use archived printable reports for PDF generation.", "text/plain")}>Bulk ZIP</Button></Stack></CardContent></Card>
        <ReportArchiveTable rows={reportsResult.data ?? []} isLoading={query.isLoading} />
      </Stack>
    </Container>
  );
};

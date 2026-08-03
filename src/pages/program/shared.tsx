import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNotification } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MuiTooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { executeFunction } from "../../utils/functionHelpers";
import { formatCurrency, formatInteger } from "../kaizens/shared";

export type AnalyticsRow = {
  name: string;
  total?: number;
  approved?: number;
  rejected?: number;
  closed?: number;
  in_progress?: number;
  hours_saved?: number;
  cost_saved?: number;
  high_impact?: number;
  approval_rate?: number;
  participation_pct?: number;
  indicator?: string;
  top_contributors?: LeaderboardRow[];
};

export type LeaderboardRow = {
  rank: number;
  username: string;
  employee_name: string;
  department_id?: string | null;
  department_name: string;
  total_kaizens: number;
  closed_kaizens: number;
  hours_saved: number;
  cost_saved: number;
  impact_score: number;
  ideas?: Array<{ id: string; kaizen_id?: string | null; title?: string | null; status?: string | null; department_id?: string | null; department_name?: string | null }>;
};

export type AnalyticsSummary = {
  success: boolean;
  totals: {
    total: number;
    submitted: number;
    approved: number;
    rejected: number;
    in_progress: number;
    closed: number;
    high_impact: number;
    hours_saved: number;
    cost_saved: number;
  };
  comparison: Record<string, { current: number; previous: number; delta: number }>;
  department_performance: AnalyticsRow[];
  client_performance: AnalyticsRow[];
  category_distribution: AnalyticsRow[];
  status_distribution: Array<{ name: string; total: number }>;
  submission_trend: Array<{ key: string; month: string; submitted: number; closed: number; hours_saved: number; cost_saved: number }>;
  leaderboard: LeaderboardRow[];
  top_performers: LeaderboardRow[];
  my_rank?: LeaderboardRow | null;
  scorecards: AnalyticsRow[];
  rejection_reasons: AnalyticsRow[];
  audit_pipeline: {
    counts: Record<string, number>;
    items: Array<{ id: string; kaizen_id?: string | null; title?: string | null; status?: string | null; department_name?: string | null; submitted_by_username?: string | null; aging_days: number; impact_score: number }>;
  };
};

export type ProgramFilters = {
  date_from?: string;
  date_to?: string;
  department_id?: string;
  client_id?: string;
  process_id?: string;
  category?: string;
  status?: string;
  min_hours?: string;
  min_cost?: string;
  search?: string;
};

export type ProgramProcessOption = {
  id: string;
  name?: string | null;
  display_name?: string | null;
  process_name?: string | null;
  client_id?: string | null;
};

export const defaultProgramFilters = (): ProgramFilters => ({
  date_from: `${new Date().getFullYear()}-01-01`,
  date_to: `${new Date().getFullYear()}-12-31`,
});

export const useAnalyticsSummary = (filters: ProgramFilters) => {
  const { open } = useNotification();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(!hasLoadedRef.current);
    setIsRefreshing(hasLoadedRef.current);
    executeFunction<AnalyticsSummary>("kaizen-analytics-summary", { filters: stableFilters })
      .then((result) => {
          if (!cancelled) {
            setData(result);
            hasLoadedRef.current = true;
          }
      })
      .catch((error) => {
        if (!cancelled) {
          open?.({ type: "error", message: "Unable to load analytics", description: error instanceof Error ? error.message : "Please try again." });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey, stableFilters]);

  return { data, isLoading, isRefreshing, refresh: () => setRefreshKey((value) => value + 1) };
};

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) => (
  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
    <Box>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Box>
    {action}
  </Stack>
);

export const KpiCard = ({ label, value, helper, icon, isLoading }: { label: string; value: ReactNode; helper?: string; icon?: ReactNode; isLoading?: boolean }) => (
  <Card>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        {icon ? <Box sx={{ color: "primary.main" }}>{icon}</Box> : null}
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h3">{isLoading ? <Skeleton width={80} /> : value}</Typography>
          {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const ProgramFiltersBar = ({
  filters,
  onChange,
  departments,
  clients,
  processes,
  categories,
  statuses,
  showSearch = true,
  onRefresh,
  isRefreshing,
}: {
  filters: ProgramFilters;
  onChange: (next: ProgramFilters) => void;
  departments?: Array<{ id: string; name: string }>;
  clients?: Array<{ id: string; name: string }>;
  processes?: ProgramProcessOption[];
  categories?: string[];
  statuses?: string[];
  showSearch?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) => {
  const update = (key: keyof ProgramFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };
  const processLabel = (process: ProgramProcessOption) => process.display_name || process.name || process.process_name || "Unnamed process";
  const visibleProcesses = processes ?? [];
  const controlSx = { minWidth: 0 };
  const renderSelectValue = (fallback: string, getLabel: (value: string) => string | undefined) => (value: unknown) => {
    const selectedValue = String(value ?? "");
    return selectedValue ? getLabel(selectedValue) ?? selectedValue : fallback;
  };
  const clearDateAdornment = (key: "date_from" | "date_to", label: string) =>
    filters[key] ? (
      <InputAdornment position="end">
        <MuiTooltip title={`Clear ${label} date`}>
          <IconButton
            aria-label={`Clear ${label} date`}
            edge="end"
            size="small"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => update(key, "")}
          >
            <ClearRoundedIcon fontSize="small" />
          </IconButton>
        </MuiTooltip>
      </InputAdornment>
    ) : undefined;

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "minmax(260px, 1.4fr) repeat(6, minmax(150px, 1fr))",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          {showSearch ? (
            <TextField size="small" label="Search" value={filters.search ?? ""} onChange={(event) => update("search", event.target.value)} fullWidth />
          ) : null}
          <TextField size="small" label="From" type="date" value={filters.date_from ?? ""} onChange={(event) => update("date_from", event.target.value)} InputLabelProps={{ shrink: true }} InputProps={{ endAdornment: clearDateAdornment("date_from", "From") }} fullWidth />
          <TextField size="small" label="To" type="date" value={filters.date_to ?? ""} onChange={(event) => update("date_to", event.target.value)} InputLabelProps={{ shrink: true }} InputProps={{ endAdornment: clearDateAdornment("date_to", "To") }} fullWidth />
          {departments ? (
            <FormControl size="small" sx={controlSx} fullWidth>
              <InputLabel shrink>Department</InputLabel>
              <Select label="Department" value={filters.department_id ?? ""} displayEmpty renderValue={renderSelectValue("", (value) => departments.find((department) => department.id === value)?.name)} onChange={(event) => update("department_id", event.target.value)}>
                <MenuItem value="">All departments</MenuItem>
                {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {clients ? (
            <FormControl size="small" sx={controlSx} fullWidth>
              <InputLabel shrink>Client</InputLabel>
              <Select label="Client" value={filters.client_id ?? ""} displayEmpty renderValue={renderSelectValue("", (value) => clients.find((client) => client.id === value)?.name)} onChange={(event) => update("client_id", event.target.value)}>
                <MenuItem value="">All clients</MenuItem>
                {clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {processes ? (
            <FormControl size="small" sx={controlSx} fullWidth>
              <InputLabel shrink>Process</InputLabel>
              <Select label="Process" value={filters.process_id ?? ""} displayEmpty renderValue={renderSelectValue("", (value) => { const selectedProcess = visibleProcesses.find((process) => process.id === value); return selectedProcess ? processLabel(selectedProcess) : undefined; })} onChange={(event) => update("process_id", event.target.value)}>
                <MenuItem value="">All processes</MenuItem>
                {visibleProcesses.map((process) => <MenuItem key={process.id} value={process.id}>{processLabel(process)}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {categories ? (
            <FormControl size="small" sx={controlSx} fullWidth>
              <InputLabel shrink>Category</InputLabel>
              <Select label="Category" value={filters.category ?? ""} displayEmpty renderValue={renderSelectValue("", (value) => categories.find((category) => category === value))} onChange={(event) => update("category", event.target.value)}>
                <MenuItem value="">All categories</MenuItem>
                {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {statuses ? (
            <FormControl size="small" sx={controlSx} fullWidth>
              <InputLabel shrink>Status</InputLabel>
              <Select label="Status" value={filters.status ?? ""} displayEmpty renderValue={renderSelectValue("All statuses", (value) => statuses.find((status) => status === value))} onChange={(event) => update("status", event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {onRefresh ? (
            <Button variant="outlined" startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} onClick={onRefresh} fullWidth sx={{ minHeight: 40 }}>
              Refresh
            </Button>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
};

export const downloadText = (filename: string, contents: string, mimeType = "text/plain;charset=utf-8") => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const csvFromObjects = (rows: Array<Record<string, unknown>>, headers: string[]) => {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
};

export const openPrintableHtml = (html: string) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
};

export const formatImpact = (row: { hours_saved?: number; cost_saved?: number }) =>
  `${formatInteger(row.hours_saved ?? 0)} hrs / ${formatCurrency(row.cost_saved ?? 0)}`;

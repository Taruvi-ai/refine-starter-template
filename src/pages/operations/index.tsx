import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useList, useNotification, type CrudFilters } from "@refinedev/core";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Alert from "@mui/material/Alert";
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
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
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
import MuiTooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { taruviTokens } from "../../theme/themeOptions";
import { executeFunction } from "../../utils/functionHelpers";
import {
  ActiveFilterChips,
  AccessDenied,
  EmptyState,
  StatusChip,
  emptyValue,
  formatCurrency,
  formatDate,
  formatInteger,
  toNumber,
  useDebouncedValue,
  useKaizenRoles,
  type CertificateRow,
  type Client,
  type Department,
  type KaizenIdea,
} from "../kaizens/shared";

const SMALL_PAGE = { currentPage: 1, pageSize: 100 };
const LIST_PAGE_SIZE = 10;
const NAME_SORT = [{ field: "name", order: "asc" as const }];
const CREATED_DESC = [{ field: "created_at", order: "desc" as const }];
const STATUS_OPTIONS = ["Active", "Inactive"];

type ProcessRow = {
  id: string;
  name: string;
  display_name?: string | null;
  category?: string | null;
  department_id?: string | null;
  client_id?: string | null;
  complexity_level?: string | null;
  status?: string | null;
  usage_count?: number | string | null;
};

type MasterDataKind = "department" | "client" | "process";
type MasterDataRow = Department | Client | ProcessRow;

const MASTER_DATA_LABELS: Record<MasterDataKind, string> = {
  department: "department",
  client: "client",
  process: "process",
};

const MASTER_DATA_DELETE_ACTIONS: Record<MasterDataKind, string> = {
  department: "deactivate_department",
  client: "deactivate_client",
  process: "deactivate_process",
};

const masterDataKindForTab = (tab: number): MasterDataKind => (tab === 0 ? "department" : tab === 1 ? "client" : "process");

const masterDataName = (row?: MasterDataRow | null) => {
  if (!row) return "";
  return "display_name" in row && row.display_name ? row.display_name : row.name;
};

const certificateUrl = (path?: string | null) =>
  path ? `${__TARUVI_SITE_URL__}/api/apps/${__TARUVI_APP_SLUG__}/storage/buckets/kaizen-attachments/objects/${path}` : "";

const isCertificatePreviewImagePath = (path?: string | null) => /\.(svg|png|jpe?g|webp|gif)$/i.test(String(path ?? ""));

const certificateDownloadName = (certificate: CertificateRow) =>
  `${(certificate.certificate_number || "kaizen-certificate").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.svg`;

type WithdrawalRow = {
  id: string;
  idea_id: string;
  kaizen_id?: string | null;
  reason?: string | null;
  comments?: string | null;
  status?: string | null;
  previous_status?: string | null;
  submitted_by_username?: string | null;
  created_at?: string | null;
};

type SlaConfigRow = {
  id: string;
  stage: string;
  sla_days?: number | string | null;
  approaching_percent?: number | string | null;
  responsible_role?: string | null;
  escalation_role?: string | null;
  status?: string | null;
};

type SlaSnapshotRow = {
  id: string;
  idea_id: string;
  kaizen_id?: string | null;
  title?: string | null;
  current_stage?: string | null;
  days_in_stage?: number | string | null;
  sla_days?: number | string | null;
  sla_status?: string | null;
  aging_bucket?: string | null;
  responsible_username?: string | null;
  department_name?: string | null;
  snapshot_at?: string | null;
};

type BulkOperationRow = {
  id: string;
  operation_type: string;
  status?: string | null;
  success_count?: number | string | null;
  failure_count?: number | string | null;
  requested_by_username?: string | null;
  created_at?: string | null;
  result_csv?: string | null;
};

type NotificationPreference = {
  id?: string;
  username?: string;
  email_preferences?: Record<string, boolean>;
  in_app_preferences?: Record<string, boolean>;
  frequency?: string;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone?: string;
  browser_push_enabled?: boolean;
};

type ImpactCalculationRow = {
  id: string;
  idea_id: string;
  kaizen_id?: string | null;
  title?: string | null;
  calculation_type?: string | null;
  annual_hours_saved?: number | string | null;
  annual_cost_saved?: number | string | null;
  verification_status?: string | null;
  submitted_by_username?: string | null;
  created_at?: string | null;
};

type EvidenceRow = {
  id: string;
  idea_id: string;
  kaizen_id?: string | null;
  file_name?: string | null;
  evidence_type?: string | null;
  verification_status?: string | null;
  quality_score?: number | string | null;
  uploaded_by_username?: string | null;
  uploaded_at?: string | null;
};

type WidgetLayout = {
  id?: string;
  owner_username?: string;
  role_slug?: string;
  template_name?: string;
  layout_template?: string;
  widgets?: Array<{ key: string; title: string; enabled?: boolean; order?: number; size?: string }>;
  available_widgets?: Array<{ key: string; title: string; size?: string; roles?: string[] }>;
  settings?: Record<string, unknown>;
  is_shared_template?: boolean;
  shared_with_roles?: string[];
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadText = (fileName: string, text: string, type = "text/plain;charset=utf-8") => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) => (
  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
    <Box>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Box>
    {action}
  </Stack>
);

const KpiCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card>
    <CardContent>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h3">{value}</Typography>
    </CardContent>
  </Card>
);

const LoadingRows = ({ columns }: { columns: number }) => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        {Array.from({ length: columns }).map((__, cell) => (
          <TableCell key={cell}><Skeleton /></TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const tableEmpty = (isError: boolean, hasSearch: boolean, hasFilters: boolean, onRetry: () => void, onClear: () => void) => {
  if (isError) return <EmptyState kind="error" title="Unable to load data" body="There was a problem loading this list" action={<Button variant="contained" onClick={onRetry}>Try again</Button>} />;
  if (hasSearch) return <EmptyState kind="no-results" title="No results found" body="Try adjusting your search or filter" action={<Button variant="outlined" onClick={onClear}>Clear search</Button>} />;
  if (hasFilters) return <EmptyState kind="no-matches" title="No matching items" body="No records match the current filters" action={<Button variant="outlined" onClick={onClear}>Clear filters</Button>} />;
  return <EmptyState kind="no-data" title="No data yet" body="Records will appear here after they are created" />;
};

const useMasterData = () => {
  const departments = useList<Department>({ resource: "kaizen_departments", sorters: NAME_SORT, pagination: SMALL_PAGE });
  const clients = useList<Client>({ resource: "kaizen_clients", sorters: NAME_SORT, pagination: SMALL_PAGE });
  const ideas = useList<KaizenIdea>({ resource: "kaizen_ideas", sorters: CREATED_DESC, pagination: SMALL_PAGE });
  return {
    departments: departments.result.data ?? [],
    clients: clients.result.data ?? [],
    ideas: ideas.result.data ?? [],
    departmentQuery: departments.query,
    clientQuery: clients.query,
    ideasQuery: ideas.query,
    isLoading: departments.query.isLoading || clients.query.isLoading || ideas.query.isLoading,
  };
};

export const MasterDataPage = () => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const { departments, clients, departmentQuery, clientQuery } = useMasterData();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ status: "Active", complexity_level: "Medium" });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: MasterDataKind; row: MasterDataRow } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const processes = useList<ProcessRow>({ resource: "kaizen_processes", sorters: NAME_SORT, pagination: SMALL_PAGE });
  const kind = masterDataKindForTab(tab);
  const rows = (tab === 0 ? departments : tab === 1 ? clients : processes.result.data ?? []) as MasterDataRow[];
  const isDataLoading = tab === 0 ? departmentQuery.isLoading : tab === 1 ? clientQuery.isLoading : processes.query.isLoading;
  const deleteLabel = deleteTarget ? MASTER_DATA_LABELS[deleteTarget.kind] : "record";
  const deleteName = masterDataName(deleteTarget?.row);

  const refreshMasterData = () => {
    departmentQuery.refetch();
    clientQuery.refetch();
    processes.query.refetch();
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const action = tab === 0 ? "save_department" : tab === 1 ? "save_client" : "save_process";
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-master-data-action", { action, ...form });
      if (!response.success) throw new Error(response.error || "Save failed");
      setForm({ status: "Active", complexity_level: "Medium" });
      open?.({ type: "success", message: "Master data saved", description: "The record is available for Kaizen routing." });
      refreshMasterData();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-master-data-action", {
        action: MASTER_DATA_DELETE_ACTIONS[deleteTarget.kind],
        id: deleteTarget.row.id,
        archive_reason: "Deleted by Super Admin",
      });
      if (!response.success) throw new Error(response.error || "Delete failed");
      open?.({
        type: "success",
        message: `${MASTER_DATA_LABELS[deleteTarget.kind][0].toUpperCase()}${MASTER_DATA_LABELS[deleteTarget.kind].slice(1)} deleted`,
        description: "It is inactive and removed from active dropdowns.",
      });
      setDeleteTarget(null);
      refreshMasterData();
    } catch (error) {
      open?.({ type: "error", message: "Unable to delete", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const exportData = async () => {
    const response = await executeFunction<{ csv_data?: Record<string, string> }>("kaizen-master-data-action", { action: "export" });
    const key = tab === 0 ? "departments" : tab === 1 ? "clients" : "processes";
    downloadText(`kaizen-${key}.csv`, response.csv_data?.[key] ?? "", "text/csv;charset=utf-8");
  };

  if (!roles.isSuperAdmin) {
    return <AccessDenied title="Super Admin access required" />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader
          title="Master Data"
          subtitle="Maintain departments, clients, and department/client process mappings used during Kaizen submission."
          action={<Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={exportData}>Export</Button>}
        />
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, next) => { setTab(next); setForm({ status: "Active", complexity_level: "Medium" }); setDeleteTarget(null); }} sx={{ mb: 3 }}>
              <Tab label={`Departments (${departments.length})`} />
              <Tab label={`Clients (${clients.length})`} />
              <Tab label={`Processes (${processes.result.total ?? 0})`} />
            </Tabs>
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: tab === 2 ? "repeat(4, 1fr)" : "repeat(3, 1fr)" }, gap: 2 }}>
                {tab !== 2 && <TextField label="Code" value={form.code ?? ""} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />}
                <TextField label={tab === 2 ? "Process name" : "Name"} value={form.name ?? ""} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                {tab === 0 && <TextField label="Business Unit" value={form.business_unit ?? ""} onChange={(event) => setForm((current) => ({ ...current, business_unit: event.target.value }))} />}
                {tab === 1 && <TextField label="Industry" value={form.industry ?? ""} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} />}
                {tab === 2 && (
                  <>
                    <FormControl>
                      <InputLabel>Department</InputLabel>
                      <Select label="Department" value={form.department_id ?? ""} onChange={(event) => setForm((current) => ({ ...current, department_id: event.target.value }))}>
                        {departments.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <InputLabel>Client</InputLabel>
                      <Select label="Client" value={form.client_id ?? ""} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value }))}>
                        {clients.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <InputLabel>Complexity</InputLabel>
                      <Select label="Complexity" value={form.complexity_level ?? "Medium"} onChange={(event) => setForm((current) => ({ ...current, complexity_level: event.target.value }))}>
                        {["Low", "Medium", "High"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </>
                )}
                <FormControl>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status ?? "Active"} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                    {STATUS_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} disabled={isSaving} onClick={save}>
                  Save
                </Button>
              </Box>
              <Divider />
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Code / Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Owner / Scope</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isDataLoading ? <LoadingRows columns={5} /> : rows.map((row) => {
                      const status = (row as Department).status;
                      const isInactive = String(status ?? "").toLowerCase() === "inactive";
                      const process = row as ProcessRow;
                      const scope = tab === 2
                        ? `${departments.find((item) => item.id === process.department_id)?.name ?? "-"} / ${clients.find((item) => item.id === process.client_id)?.name ?? "-"}`
                        : emptyValue((row as Department).manager_username);
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell>{emptyValue(masterDataName(row))}</TableCell>
                          <TableCell>{emptyValue((row as Department).code ?? process.category)}</TableCell>
                          <TableCell><StatusChip status={status} /></TableCell>
                          <TableCell>{scope}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteRoundedIcon />}
                              disabled={isInactive}
                              onClick={() => setDeleteTarget({ kind, row })}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!isDataLoading && rows.length === 0 && <TableRow><TableCell colSpan={5}><EmptyState kind="no-data" title="No data yet" body="Create records using the form above" /></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={Boolean(deleteTarget)} onClose={() => !isDeleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{`Delete ${deleteLabel}?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>&quot;{deleteName || "this record"}&quot;</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon />}
            onClick={deleteRecord}
            disabled={isDeleting}
          >
            {isDeleting ? `Deleting ${deleteLabel}...` : `Delete ${deleteLabel}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export const WithdrawalsPage = () => {
  const { open } = useNotification();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (debouncedSearch) next.push({ field: "search", operator: "eq", value: debouncedSearch });
    return next;
  }, [debouncedSearch, status]);
  const { result, query } = useList<WithdrawalRow>({ resource: "kaizen_withdrawals", filters, sorters: CREATED_DESC, pagination: { currentPage: page + 1, pageSize: LIST_PAGE_SIZE } });
  const rows = result.data ?? [];

  const reactivate = async (row: WithdrawalRow) => {
    const reason = window.prompt("Admin reactivation justification");
    if (!reason) return;
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-withdrawal-action", { action: "reactivate", idea_id: row.idea_id, admin_justification: reason });
    if (!response.success) {
      open?.({ type: "error", message: "Unable to reactivate", description: response.error || "Please try again." });
      return;
    }
    open?.({ type: "success", message: "Kaizen reactivated", description: "The item returned to its previous workflow stage." });
    query.refetch();
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Withdrawals" subtitle="Audit withdrawn Kaizens, reasons, approver consent, and admin reactivation decisions." />
        <Card><CardContent><Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField size="small" placeholder="Search withdrawal records" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} sx={{ width: { xs: "100%", md: 320 } }} />
            <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><MenuItem value="">All statuses</MenuItem>{["Withdrawn", "Reactivated", "Rejected"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
          </Stack>
          <ActiveFilterChips filters={status ? [{ key: "status", label: `Status: ${status}` }] : []} onDelete={() => setStatus("")} onClear={() => setStatus("")} />
          <Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Kaizen</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell>Submitted By</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
            {query.isLoading ? <LoadingRows columns={6} /> : rows.map((row) => <TableRow key={row.id} hover><TableCell>{row.kaizen_id}</TableCell><TableCell>{row.reason}<Typography variant="caption" display="block" color="text.secondary">{row.comments}</Typography></TableCell><TableCell><StatusChip status={row.status} /></TableCell><TableCell>{row.submitted_by_username}</TableCell><TableCell>{formatDate(row.created_at)}</TableCell><TableCell align="right">{row.status === "Withdrawn" && <Button size="small" onClick={() => reactivate(row)}>Reactivate</Button>}</TableCell></TableRow>)}
            {!query.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6}>{tableEmpty(query.isError, Boolean(debouncedSearch), Boolean(status), query.refetch, () => { setSearch(""); setStatus(""); })}</TableCell></TableRow>}
          </TableBody></Table></Box>
          <TablePagination component="div" count={result.total ?? 0} page={page} rowsPerPage={LIST_PAGE_SIZE} rowsPerPageOptions={[LIST_PAGE_SIZE]} onPageChange={(_, next) => setPage(next)} />
        </Stack></CardContent></Card>
      </Stack>
    </Container>
  );
};

export const SlaTrackingPage = () => {
  const { open } = useNotification();
  const [isRunning, setIsRunning] = useState(false);
  const snapshots = useList<SlaSnapshotRow>({ resource: "kaizen_sla_snapshots", sorters: [{ field: "snapshot_at", order: "desc" }], pagination: SMALL_PAGE });
  const configs = useList<SlaConfigRow>({ resource: "kaizen_sla_configs", sorters: [{ field: "stage", order: "asc" }], pagination: SMALL_PAGE });
  const rows = snapshots.result.data ?? [];
  const counts = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.sla_status || "Green"]: (acc[row.sla_status || "Green"] ?? 0) + 1 }), {});

  const runSnapshot = async () => {
    setIsRunning(true);
    try {
      const response = await executeFunction<{ success: boolean; counts?: Record<string, number>; csv_data?: string }>("kaizen-sla-tracking", { action: "snapshot", persist: true, notify: false });
      if (!response.success) throw new Error("SLA snapshot failed");
      open?.({ type: "success", message: "SLA snapshot updated", description: `Red ${response.counts?.Red ?? 0}, Yellow ${response.counts?.Yellow ?? 0}, Green ${response.counts?.Green ?? 0}` });
      snapshots.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to run SLA snapshot", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="SLA Tracking" subtitle="Monitor stage aging, red/yellow/green SLA status, configured thresholds, and escalation ownership." action={<Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />} onClick={runSnapshot} disabled={isRunning}>Run Snapshot</Button>} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <KpiCard label="Red" value={counts.Red ?? 0} />
          <KpiCard label="Yellow" value={counts.Yellow ?? 0} />
          <KpiCard label="Green" value={counts.Green ?? 0} />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2 }}>
          <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Aging Snapshot</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Kaizen</TableCell><TableCell>Stage</TableCell><TableCell align="right">Days</TableCell><TableCell>Status</TableCell><TableCell>Owner</TableCell><TableCell>Snapshot</TableCell></TableRow></TableHead><TableBody>
            {snapshots.query.isLoading ? <LoadingRows columns={6} /> : rows.slice(0, 20).map((row) => <TableRow key={row.id} hover><TableCell>{row.kaizen_id}<Typography variant="caption" display="block" color="text.secondary">{row.title}</Typography></TableCell><TableCell>{row.current_stage}</TableCell><TableCell align="right">{row.days_in_stage}</TableCell><TableCell><StatusChip status={row.sla_status} /></TableCell><TableCell>{row.responsible_username}</TableCell><TableCell>{formatDate(row.snapshot_at)}</TableCell></TableRow>)}
            {!snapshots.query.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState kind="no-data" title="No snapshots yet" body="Run a snapshot to calculate aging" /></TableCell></TableRow>}
          </TableBody></Table></Box></CardContent></Card>
          <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>SLA Configs</Typography><Stack spacing={1.25}>{(configs.result.data ?? []).map((row) => <Stack key={row.id} direction="row" justifyContent="space-between"><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{row.stage}</Typography><Typography variant="caption" color="text.secondary">{row.responsible_role} to {row.escalation_role}</Typography></Box><Chip label={`${row.sla_days} days`} size="small" /></Stack>)}</Stack></CardContent></Card>
        </Box>
      </Stack>
    </Container>
  );
};

export const CertificateTemplatesPage = () => {
  const roles = useKaizenRoles();
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(null);
  const [actionCertificate, setActionCertificate] = useState<CertificateRow | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<CertificateRow | null>(null);
  const username = roles.identity?.username ?? "";
  const isTeamCertificateScope = roles.isOmSomRole && !roles.isAdmin && !roles.isPeQa;
  const isProgramScope = roles.isAdmin || roles.isPeQa;
  const canShowRecipient = isProgramScope || isTeamCertificateScope;
  const certificateFilters = useMemo<CrudFilters>(() => {
    if (isProgramScope) return [];
    if (isTeamCertificateScope && username) return [{ field: "recipient_username", operator: "ne", value: username }];
    if (username) return [{ field: "recipient_username", operator: "eq", value: username }];
    return [{ field: "id", operator: "eq", value: "__missing_identity__" }];
  }, [isProgramScope, isTeamCertificateScope, username]);

  const { result, query } = useList<CertificateRow>({
    resource: "kaizen_certificates",
    filters: certificateFilters,
    sorters: [{ field: "issued_at", order: "desc" }],
    pagination: SMALL_PAGE,
    queryOptions: { enabled: isProgramScope || Boolean(username) },
  });
  const certificates = result.data ?? [];
  const actionCertificateUrl = certificateUrl(actionCertificate?.certificate_path);
  const previewCertificateUrl = certificateUrl(previewCertificate?.certificate_path);

  const openCertificateActions = (anchorEl: HTMLElement, certificate: CertificateRow) => {
    setActionAnchorEl(anchorEl);
    setActionCertificate(certificate);
  };

  const closeCertificateActions = () => {
    setActionAnchorEl(null);
    setActionCertificate(null);
  };

  const downloadCertificate = (certificate: CertificateRow | null) => {
    const url = certificateUrl(certificate?.certificate_path);
    if (!url || !certificate) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = certificateDownloadName(certificate);
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const previewSelectedCertificate = () => {
    const certificate = actionCertificate;
    closeCertificateActions();
    if (certificate && certificateUrl(certificate.certificate_path)) {
      setPreviewCertificate(certificate);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader
          title="Certificates"
          subtitle={
            isProgramScope
              ? "View and download generated Kaizen certificates."
              : isTeamCertificateScope
                ? "View and download certificates generated for your Kaizen team."
                : "View and download your completed Kaizen certificates."
          }
        />
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">Generated Certificates</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Certificate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Issued</TableCell>
                      <TableCell align="right">Reward</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.isLoading ? <LoadingRows columns={5} /> : certificates.map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={(event) => openCertificateActions(event.currentTarget, row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openCertificateActions(event.currentTarget, row);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.certificate_number || row.id}</Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {canShowRecipient ? emptyValue(row.recipient_name || row.recipient_username) : "Kaizen completion certificate"}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusChip status={row.status || "Issued"} /></TableCell>
                        <TableCell>{formatDate(row.issued_at)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.reward_amount)}</TableCell>
                        <TableCell align="right">
                          <MuiTooltip title="Certificate options">
                            <IconButton
                              aria-label={`Options for ${row.certificate_number || "certificate"}`}
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                openCertificateActions(event.currentTarget, row);
                              }}
                            >
                              <MoreVertRoundedIcon fontSize="small" />
                            </IconButton>
                          </MuiTooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!query.isLoading && certificates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          {query.isError ? (
                            <EmptyState kind="error" title="Unable to load certificates" body="Refresh the page or retry the request." action={<Button variant="contained" onClick={() => query.refetch()}>Retry</Button>} />
                          ) : (
                            <EmptyState kind="no-data" title="No certificates yet" body={isTeamCertificateScope ? "Completed team Kaizen certificates will appear here after project completion." : "Completed Kaizen certificates will appear here after project completion."} />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeCertificateActions}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem disabled={!actionCertificateUrl} onClick={previewSelectedCertificate}>
          <VisibilityRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem
          disabled={!actionCertificateUrl}
          onClick={() => {
            downloadCertificate(actionCertificate);
            closeCertificateActions();
          }}
        >
          <DownloadRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
      </Menu>
      <Dialog open={Boolean(previewCertificate)} onClose={() => setPreviewCertificate(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Certificate Preview</DialogTitle>
        <DialogContent dividers>
          {previewCertificateUrl && previewCertificate ? (
            isCertificatePreviewImagePath(previewCertificate.certificate_path) ? (
              <Box
                component="img"
                alt={`${previewCertificate.certificate_number || "Kaizen certificate"} preview`}
                src={previewCertificateUrl}
                sx={{ width: "100%", maxHeight: "70vh", objectFit: "contain", bgcolor: "background.default" }}
              />
            ) : (
              <Box
                component="iframe"
                title={`${previewCertificate.certificate_number || "Kaizen certificate"} preview`}
                src={previewCertificateUrl}
                sx={{ width: "100%", minHeight: "70vh", border: 0, bgcolor: "background.default" }}
              />
            )
          ) : (
            <EmptyState kind="no-data" title="No certificate file" body="The certificate file is not available for preview." />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPreviewCertificate(null)}>Close</Button>
          {previewCertificateUrl && previewCertificate ? (
            <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => downloadCertificate(previewCertificate)}>
              Download
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export const BulkOperationsPage = () => {
  const { open } = useNotification();
  const [idsText, setIdsText] = useState("abbf1330-6334-44a5-a9a4-8e686e881d69");
  const [operationType, setOperationType] = useState("Export");
  const [status, setStatus] = useState("Submitted");
  const [isRunning, setIsRunning] = useState(false);
  const operations = useList<BulkOperationRow>({ resource: "kaizen_bulk_operations", sorters: CREATED_DESC, pagination: SMALL_PAGE });

  const run = async () => {
    setIsRunning(true);
    try {
      const ids = idsText.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
      const response = await executeFunction<{ success: boolean; operation?: BulkOperationRow; result_csv?: string; error?: string }>("kaizen-bulk-operations", { action: "run", operation_type: operationType, ids, values: { status }, common_comment: "Bulk operation from admin console" });
      if (!response.success) throw new Error(response.error || "Bulk operation failed");
      open?.({ type: "success", message: "Bulk operation completed", description: `${operationType} processed.` });
      if (response.result_csv) downloadText("kaizen-bulk-result.csv", response.result_csv, "text/csv;charset=utf-8");
      operations.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Bulk operation failed", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Bulk Operations" subtitle="Run selected-item operations and review result history, counts, CSV output, and errors." />
        <Card><CardContent><Stack spacing={2}><Stack direction={{ xs: "column", md: "row" }} spacing={2}><FormControl sx={{ minWidth: 240 }}><InputLabel>Operation</InputLabel><Select label="Operation" value={operationType} onChange={(event) => setOperationType(event.target.value)}>{["Export", "Status Update", "Tag Assignment", "Email", "Reviewer Assignment", "Certificate Regeneration", "Attachment Download"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>{operationType === "Status Update" && <TextField label="New Status" value={status} onChange={(event) => setStatus(event.target.value)} />}<Button variant="contained" startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowRoundedIcon />} onClick={run} disabled={isRunning}>Run</Button></Stack><TextField label="Selected Kaizen IDs" helperText="Comma or line separated idea UUIDs." value={idsText} onChange={(event) => setIdsText(event.target.value)} multiline rows={3} fullWidth /></Stack></CardContent></Card>
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>History</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Operation</TableCell><TableCell>Status</TableCell><TableCell align="right">Success</TableCell><TableCell align="right">Failed</TableCell><TableCell>User</TableCell><TableCell>Created</TableCell></TableRow></TableHead><TableBody>{operations.query.isLoading ? <LoadingRows columns={6} /> : (operations.result.data ?? []).map((row) => <TableRow key={row.id} hover><TableCell>{row.operation_type}</TableCell><TableCell><StatusChip status={row.status} /></TableCell><TableCell align="right">{row.success_count}</TableCell><TableCell align="right">{row.failure_count}</TableCell><TableCell>{row.requested_by_username}</TableCell><TableCell>{formatDate(row.created_at)}</TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
      </Stack>
    </Container>
  );
};

export const NotificationSettingsPage = () => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const username = roles.identity?.username;
  const types = ["Submission", "Approval", "Rejection", "Reminder", "SLA Breach", "Evidence Request", "Evidence Verification", "Certificate Generation", "Bulk Operation"];

  useEffect(() => {
    if (!username) return;
    executeFunction<{ preferences?: NotificationPreference }>("kaizen-notification-preferences", { action: "get", username }).then((response) => setPrefs(response.preferences ?? null)).catch(() => setPrefs(null));
  }, [username]);

  const toggle = (channel: "email_preferences" | "in_app_preferences", type: string) => {
    setPrefs((current) => ({ ...(current ?? {}), [channel]: { ...(current?.[channel] ?? {}), [type]: !(current?.[channel]?.[type] ?? true) } }));
  };

  const save = async () => {
    setIsSaving(true);
    const response = await executeFunction<{ success: boolean; preferences?: NotificationPreference }>("kaizen-notification-preferences", { action: "save", username, ...prefs });
    setPrefs(response.preferences ?? prefs);
    setIsSaving(false);
    open?.({ type: "success", message: "Preferences saved", description: "Notification delivery settings were updated." });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Notification Settings" subtitle="Control email, in-app, digest frequency, quiet hours, browser push, and temporary mute settings." action={<Button variant="contained" startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} onClick={save} disabled={!prefs || isSaving}>Save</Button>} />
        <Card><CardContent>{!prefs ? <Skeleton variant="rounded" height={260} /> : <Stack spacing={3}><Stack direction={{ xs: "column", md: "row" }} spacing={2}><FormControl fullWidth><InputLabel>Frequency</InputLabel><Select label="Frequency" value={prefs.frequency ?? "Real-time"} onChange={(event) => setPrefs((current) => ({ ...(current ?? {}), frequency: event.target.value }))}>{["Real-time", "Daily Digest", "Weekly Digest", "Disabled"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField label="Quiet Start" type="time" value={(prefs.quiet_hours_start ?? "18:00:00").slice(0, 5)} onChange={(event) => setPrefs((current) => ({ ...(current ?? {}), quiet_hours_start: `${event.target.value}:00` }))} InputLabelProps={{ shrink: true }} /><TextField label="Quiet End" type="time" value={(prefs.quiet_hours_end ?? "08:00:00").slice(0, 5)} onChange={(event) => setPrefs((current) => ({ ...(current ?? {}), quiet_hours_end: `${event.target.value}:00` }))} InputLabelProps={{ shrink: true }} /></Stack><Divider /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>{["email_preferences", "in_app_preferences"].map((channel) => <Card key={channel} variant="outlined"><CardContent><Typography variant="h3" sx={{ mb: 1 }}>{channel === "email_preferences" ? "Email" : "In App"}</Typography>{types.map((type) => <FormControlLabel key={type} control={<Checkbox checked={prefs[channel as "email_preferences"]?.[type] ?? true} onChange={() => toggle(channel as "email_preferences" | "in_app_preferences", type)} />} label={type} />)}</CardContent></Card>)}</Box></Stack>}</CardContent></Card>
      </Stack>
    </Container>
  );
};

export const ImpactCalculationsPage = () => {
  const { open } = useNotification();
  const { ideas } = useMasterData();
  const [ideaId, setIdeaId] = useState("");
  const [inputs, setInputs] = useState({ baseline_minutes: 20, improved_minutes: 12, volume: 500, periods_per_year: 12, labor_rate: 15, direct_cost_avoidance: 1000, baseline_rework_percent: 8, improved_rework_percent: 3, baseline_quality_score: 80, improved_quality_score: 92 });
  const [computed, setComputed] = useState<Record<string, number> | null>(null);
  const calculations = useList<ImpactCalculationRow>({ resource: "kaizen_impact_calculations", sorters: CREATED_DESC, pagination: SMALL_PAGE });

  const calculate = async (submit = false) => {
    const payload = { action: submit ? "submit" : "calculate", idea_id: ideaId, hours_inputs: inputs, cost_inputs: inputs, rework_inputs: inputs, quality_inputs: inputs, calculation_type: "Expected" };
    const response = await executeFunction<{ success: boolean; computed?: Record<string, number>; error?: string }>("kaizen-impact-calculation", payload);
    if (!response.success) {
      open?.({ type: "error", message: "Calculation failed", description: response.error || "Please try again." });
      return;
    }
    setComputed(response.computed ?? null);
    if (submit) {
      open?.({ type: "success", message: "Impact submitted", description: "The calculation is queued for validation." });
      calculations.query.refetch();
    }
  };

  const updateInput = (key: keyof typeof inputs, value: string) => setInputs((current) => ({ ...current, [key]: Number(value) }));

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Impact Calculations" subtitle="Calculate expected and actual impact with formula breakdown, variance, and verification state." />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <Card><CardContent><Stack spacing={2}><FormControl fullWidth><InputLabel>Kaizen</InputLabel><Select label="Kaizen" value={ideaId} onChange={(event) => setIdeaId(event.target.value)}>{ideas.map((idea) => <MenuItem key={idea.id} value={idea.id}>{idea.kaizen_id || "Draft"} - {idea.title}</MenuItem>)}</Select></FormControl><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>{Object.keys(inputs).map((key) => <TextField key={key} label={key.replace(/_/g, " ")} type="number" value={inputs[key as keyof typeof inputs]} onChange={(event) => updateInput(key as keyof typeof inputs, event.target.value)} />)}</Box><Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<BoltRoundedIcon />} onClick={() => calculate(false)}>Calculate</Button><Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={!ideaId} onClick={() => calculate(true)}>Submit</Button></Stack></Stack></CardContent></Card>
          <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Result</Typography>{computed ? <Stack spacing={1}><KpiCard label="Annual Hours Saved" value={formatInteger(computed.annual_hours_saved)} /><KpiCard label="Annual Cost Saved" value={formatCurrency(computed.annual_cost_saved)} /><KpiCard label="Impact Score" value={formatInteger(computed.advanced_impact_score)} /></Stack> : <EmptyState kind="no-data" title="No calculation yet" body="Enter inputs and calculate impact" />}</CardContent></Card>
        </Box>
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Calculation History</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Kaizen</TableCell><TableCell>Type</TableCell><TableCell align="right">Hours</TableCell><TableCell align="right">Cost</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell></TableRow></TableHead><TableBody>{(calculations.result.data ?? []).map((row) => <TableRow key={row.id}><TableCell>{row.kaizen_id}<Typography variant="caption" display="block">{row.title}</Typography></TableCell><TableCell>{row.calculation_type}</TableCell><TableCell align="right">{formatInteger(row.annual_hours_saved)}</TableCell><TableCell align="right">{formatCurrency(row.annual_cost_saved)}</TableCell><TableCell><StatusChip status={row.verification_status} /></TableCell><TableCell>{formatDate(row.created_at)}</TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
      </Stack>
    </Container>
  );
};

export const ComparativeAnalysisPage = () => {
  const { open } = useNotification();
  const [type, setType] = useState("Department");
  const [chartData, setChartData] = useState<Array<Record<string, unknown>>>([]);
  const [csv, setCsv] = useState("");
  const generate = async (saveView = false) => {
    const response = await executeFunction<{ success: boolean; chart_data?: Array<Record<string, unknown>>; csv_data?: string; error?: string }>("kaizen-comparative-analysis", { action: saveView ? "save_view" : "generate", comparison_type: type, benchmark_type: "Organizational Average" });
    if (!response.success) {
      open?.({ type: "error", message: "Analysis failed", description: response.error || "Please try again." });
      return;
    }
    setChartData(response.chart_data ?? []);
    setCsv(response.csv_data ?? "");
    open?.({ type: "success", message: saveView ? "View saved" : "Analysis generated", description: `${response.chart_data?.length ?? 0} comparison rows.` });
  };
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Comparative Analysis" subtitle="Benchmark Kaizen performance by department, client, category, time period, or custom dimension." action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={!csv} onClick={() => downloadText("kaizen-comparison.csv", csv, "text/csv;charset=utf-8")}>Export</Button><Button variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={() => generate(false)}>Generate</Button></Stack>} />
        <Card><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={2}><FormControl sx={{ minWidth: 240 }}><InputLabel>Comparison</InputLabel><Select label="Comparison" value={type} onChange={(event) => setType(event.target.value)}>{["Department", "Client", "Category", "Time Period", "Custom"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={() => generate(true)}>Save View</Button></Stack></CardContent></Card>
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Benchmark</Typography>{chartData.length === 0 ? <EmptyState kind="no-data" title="No analysis yet" body="Generate a comparison to see benchmark rows" /> : <Box sx={{ height: 320 }}><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="cost_saved" fill={taruviTokens.status.chartPrimary} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Box>}</CardContent></Card>
      </Stack>
    </Container>
  );
};

export const EvidenceRepositoryPage = () => {
  const { open } = useNotification();
  const { ideas } = useMasterData();
  const [form, setForm] = useState({ idea_id: "", evidence_type: "Metrics", file_name: "", path: "" });
  const evidence = useList<EvidenceRow>({ resource: "kaizen_impact_evidence", sorters: [{ field: "uploaded_at", order: "desc" }], pagination: SMALL_PAGE });

  const register = async () => {
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-evidence-action", { action: "register", ...form, file_size: 0 });
    if (!response.success) {
      open?.({ type: "error", message: "Evidence registration failed", description: response.error || "Please try again." });
      return;
    }
    open?.({ type: "success", message: "Evidence registered", description: "The repository was updated." });
    setForm({ idea_id: "", evidence_type: "Metrics", file_name: "", path: "" });
    evidence.query.refetch();
  };

  const verify = async (row: EvidenceRow, status: string) => {
    await executeFunction("kaizen-evidence-action", { action: "verify", evidence_id: row.id, verification_status: status, quality_score: row.quality_score ?? 80 });
    evidence.query.refetch();
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Evidence Repository" subtitle="Register, inspect, verify, and track impact-validation evidence for high-impact Kaizens." />
        <Card><CardContent><Stack spacing={2}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" }, gap: 2 }}><FormControl fullWidth><InputLabel>Kaizen</InputLabel><Select label="Kaizen" value={form.idea_id} onChange={(event) => setForm((current) => ({ ...current, idea_id: event.target.value }))}>{ideas.map((idea) => <MenuItem key={idea.id} value={idea.id}>{idea.kaizen_id || "Draft"} - {idea.title}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Type</InputLabel><Select label="Type" value={form.evidence_type} onChange={(event) => setForm((current) => ({ ...current, evidence_type: event.target.value }))}>{["Screenshot", "Report", "Metrics", "Customer Feedback", "Time Study", "Cost Breakdown", "Before After", "Other"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><Button variant="contained" startIcon={<UploadFileRoundedIcon />} disabled={!form.idea_id || !form.file_name} onClick={register}>Register</Button></Box><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="File name" value={form.file_name} onChange={(event) => setForm((current) => ({ ...current, file_name: event.target.value }))} fullWidth /><TextField label="Storage path" value={form.path} onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))} fullWidth /></Stack></Stack></CardContent></Card>
        <Card><CardContent><Typography variant="h3" sx={{ mb: 2 }}>Evidence</Typography><Box sx={{ overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>File</TableCell><TableCell>Kaizen</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Quality</TableCell><TableCell>Uploaded</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{evidence.query.isLoading ? <LoadingRows columns={7} /> : (evidence.result.data ?? []).map((row) => <TableRow key={row.id} hover><TableCell>{row.file_name}</TableCell><TableCell>{row.kaizen_id}</TableCell><TableCell>{row.evidence_type}</TableCell><TableCell><StatusChip status={row.verification_status} /></TableCell><TableCell align="right">{formatInteger(row.quality_score)}</TableCell><TableCell>{formatDate(row.uploaded_at)}</TableCell><TableCell align="right"><Button size="small" onClick={() => verify(row, "Verified")}>Verify</Button><Button size="small" color="error" onClick={() => verify(row, "Rejected")}>Reject</Button></TableCell></TableRow>)}</TableBody></Table></Box></CardContent></Card>
      </Stack>
    </Container>
  );
};

export const DashboardWidgetsPage = () => {
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [layout, setLayout] = useState<WidgetLayout | null>(null);
  const username = roles.identity?.username;
  useEffect(() => {
    if (!username) return;
    executeFunction<{ layout?: WidgetLayout; available_widgets?: WidgetLayout["available_widgets"] }>("kaizen-dashboard-widgets", { action: "get", username, role_slug: roles.isAdmin ? "admin" : roles.isManager ? "manager" : "user" }).then((response) => setLayout({ ...(response.layout ?? {}), available_widgets: response.available_widgets })).catch(() => setLayout(null));
  }, [roles.isAdmin, roles.isManager, username]);

  const widgets = layout?.widgets ?? [];
  const toggleWidget = (key: string) => setLayout((current) => ({ ...(current ?? {}), widgets: (current?.widgets ?? []).map((item) => item.key === key ? { ...item, enabled: !item.enabled } : item) }));
  const save = async () => {
    const response = await executeFunction<{ layout?: WidgetLayout }>("kaizen-dashboard-widgets", { action: "save", username, ...layout });
    setLayout(response.layout ?? layout);
    open?.({ type: "success", message: "Dashboard saved", description: "Your widget layout was updated." });
  };
  const reset = async () => {
    const response = await executeFunction<{ layout?: WidgetLayout }>("kaizen-dashboard-widgets", { action: "reset", username, role_slug: roles.isAdmin ? "admin" : roles.isManager ? "manager" : "user" });
    setLayout(response.layout ?? layout);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <PageHeader title="Dashboard Widgets" subtitle="Customize dashboard widgets, density, layout template, role defaults, and shared views." action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={reset}>Reset</Button><Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={save} disabled={!layout}>Save</Button></Stack>} />
        {!layout ? <Skeleton variant="rounded" height={320} /> : <Card><CardContent><Stack spacing={3}><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Template Name" value={layout.template_name ?? ""} onChange={(event) => setLayout((current) => ({ ...(current ?? {}), template_name: event.target.value }))} fullWidth /><FormControl fullWidth><InputLabel>Layout</InputLabel><Select label="Layout" value={layout.layout_template ?? "grid"} onChange={(event) => setLayout((current) => ({ ...(current ?? {}), layout_template: event.target.value }))}>{["1 column", "2 columns", "grid"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl></Stack><Divider /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>{widgets.map((widget) => <Card key={widget.key} variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{widget.title}</Typography><Typography variant="caption" color="text.secondary">{widget.size} widget</Typography></Box><Checkbox checked={widget.enabled !== false} onChange={() => toggleWidget(widget.key)} /></Stack></CardContent></Card>)}</Box></Stack></CardContent></Card>}
      </Stack>
    </Container>
  );
};

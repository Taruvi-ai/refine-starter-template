import React, { useState } from "react";
import { useList } from "@refinedev/core";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { executeFunction } from "../../utils/functionHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IngestionRun {
  id: string;
  run_type: string;
  status: string;
  total_fetched: number | null;
  total_inserted: number | null;
  total_updated: number | null;
  total_skipped: number | null;
  total_errors: number | null;
  error_details: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

interface FnResult {
  task_id?: string;
  invocation_id?: number;
  run_id?: string;
  status?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDateTime = (v: string | null | undefined): string => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
};

const fmtNum = (v: number | null | undefined): string =>
  v != null ? v.toLocaleString() : "—";

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: number | string | null;
  icon: React.ReactNode;
  loading?: boolean;
  color?: string;
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, loading, color = "primary.main", sub }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ color, opacity: 0.85, mt: 0.25 }}>{icon}</Box>
        {loading ? (
          <Skeleton variant="text" width={60} height={48} />
        ) : (
          <Typography sx={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: { xs: 26, sm: 30 }, lineHeight: 1, color }}>
            {value != null ? (typeof value === "number" ? value.toLocaleString() : value) : "—"}
          </Typography>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
        {label}
      </Typography>
      {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Run status chip
// ---------------------------------------------------------------------------

const RunStatusChip: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: "success" | "info" | "warning" | "error" | "default"; icon: React.ReactNode }> = {
    completed: { color: "success", icon: <CheckCircleOutlineRoundedIcon style={{ fontSize: 13 }} /> },
    running:   { color: "warning", icon: <SyncRoundedIcon style={{ fontSize: 13 }} /> },
    failed:    { color: "error",   icon: <ErrorOutlineRoundedIcon style={{ fontSize: 13 }} /> },
  };
  const cfg = map[status] ?? { color: "default" as const, icon: null };
  return (
    <Chip
      size="small"
      label={status.toUpperCase()}
      color={cfg.color}
      icon={cfg.icon as React.ReactElement | undefined}
      variant={status === "running" ? "outlined" : "filled"}
    />
  );
};

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.disabled", mb: 1.5 }}>
    {children}
  </Typography>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const CENSUS_SLUG = "sync_company_census";
const SAFER_SLUG = "enrich_carriers_with_safer";
const SAFER_MAX_LIMIT = 50;

export const DataSync: React.FC = () => {
  // ── Census panel state ──────────────────────────────────────────────────
  const [censusLimit, setCensusLimit] = useState(500);
  const [censusOffset, setCensusOffset] = useState(0);
  const [censusMaxPages, setCensusMaxPages] = useState(1);
  const [censusMinDrivers, setCensusMinDrivers] = useState(20);
  const [censusRunning, setCensusRunning] = useState(false);
  const [censusResult, setCensusResult] = useState<FnResult | null>(null);
  const [censusError, setCensusError] = useState<string | null>(null);

  // ── SAFER panel state ───────────────────────────────────────────────────
  const [saferLimit, setSaferLimit] = useState(25);
  const [saferMinDrivers, setSaferMinDrivers] = useState(20);
  const [saferOnlyUnenriched, setSaferOnlyUnenriched] = useState(true);
  const [saferState, setSaferState] = useState("");
  const [saferDelay, setSaferDelay] = useState(0.5);
  const [saferRunning, setSaferRunning] = useState(false);
  const [saferResult, setSaferResult] = useState<FnResult | null>(null);
  const [saferError, setSaferError] = useState<string | null>(null);

  // ── Summary counts ──────────────────────────────────────────────────────
  const { result: totalCarriersResult, query: totalCarriersQ } = useList({
    resource: "carriers",
    filters: [{ field: "census_status", operator: "eq", value: "A" }],
    pagination: { pageSize: 1 },
  });

  const { result: enrichedResult, query: enrichedQ } = useList({
    resource: "carriers",
    filters: [{ field: "safer_enriched", operator: "eq", value: true }],
    pagination: { pageSize: 1 },
  });

  const { result: pendingResult, query: pendingQ } = useList({
    resource: "carriers",
    filters: [
      { field: "census_status", operator: "eq", value: "A" },
      { field: "safer_enriched", operator: "ne", value: true },
    ],
    pagination: { pageSize: 1 },
  });

  const { result: censusSnapResult, query: censusSnapQ } = useList({
    resource: "carrier_census_snapshots",
    pagination: { pageSize: 1 },
  });

  const { result: saferSnapResult, query: saferSnapQ } = useList({
    resource: "safer_snapshots",
    pagination: { pageSize: 1 },
  });

  // ── Latest run status ───────────────────────────────────────────────────
  const { result: latestCensusRunResult, query: latestCensusRunQ } = useList<IngestionRun>({
    resource: "carrier_ingestion_runs",
    filters: [{ field: "run_type", operator: "eq", value: "census_sync" }],
    sorters: [{ field: "started_at", order: "desc" }],
    pagination: { pageSize: 1 },
  });

  const { result: latestSaferRunResult, query: latestSaferRunQ } = useList<IngestionRun>({
    resource: "carrier_ingestion_runs",
    filters: [{ field: "run_type", operator: "eq", value: "safer_enrichment" }],
    sorters: [{ field: "started_at", order: "desc" }],
    pagination: { pageSize: 1 },
  });

  // ── Ingestion runs table ─────────────────────────────────────────────────
  const { result: runsResult, query: runsQ } = useList<IngestionRun>({
    resource: "carrier_ingestion_runs",
    sorters: [{ field: "started_at", order: "desc" }],
    pagination: { pageSize: 25 },
  });

  const latestCensusRun = latestCensusRunResult.data?.[0];
  const latestSaferRun = latestSaferRunResult.data?.[0];
  const runs = runsResult.data ?? [];

  const summaryLoading =
    totalCarriersQ.isLoading || enrichedQ.isLoading || pendingQ.isLoading ||
    censusSnapQ.isLoading || saferSnapQ.isLoading;

  // ── Refresh all ─────────────────────────────────────────────────────────
  const handleRefresh = () => {
    totalCarriersQ.refetch();
    enrichedQ.refetch();
    pendingQ.refetch();
    censusSnapQ.refetch();
    saferSnapQ.refetch();
    latestCensusRunQ.refetch();
    latestSaferRunQ.refetch();
    runsQ.refetch();
  };

  // ── Census sync ─────────────────────────────────────────────────────────
  const handleCensusSync = async () => {
    if (censusRunning) return;
    setCensusRunning(true);
    setCensusResult(null);
    setCensusError(null);
    try {
      const result = await executeFunction<FnResult>(
        CENSUS_SLUG,
        { limit: censusLimit, offset: censusOffset, min_drivers: censusMinDrivers, max_pages: censusMaxPages },
        { kind: "function", async: true }
      );
      setCensusResult(result);
    } catch (err: unknown) {
      setCensusError(err instanceof Error ? err.message : "Function invocation failed.");
    } finally {
      setCensusRunning(false);
    }
  };

  // ── SAFER enrichment ────────────────────────────────────────────────────
  const handleSaferEnrich = async () => {
    if (saferRunning) return;
    const clampedLimit = Math.min(saferLimit, SAFER_MAX_LIMIT);
    setSaferRunning(true);
    setSaferResult(null);
    setSaferError(null);
    try {
      const result = await executeFunction<FnResult>(
        SAFER_SLUG,
        {
          usdot_numbers: [],
          limit: clampedLimit,
          only_unenriched: saferOnlyUnenriched,
          min_drivers: saferMinDrivers,
          state: saferState.trim() || null,
          sort_by: "drivers_desc",
          delay_seconds: saferDelay,
        },
        { kind: "function", async: true }
      );
      setSaferResult(result);
    } catch (err: unknown) {
      setSaferError(err instanceof Error ? err.message : "Function invocation failed.");
    } finally {
      setSaferRunning(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.25 }}>Data Sync</Typography>
          <Typography variant="body2" color="text.secondary">
            Platform Census Sync · Platform SAFER Enrichment · Run history
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Stack>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Total Carriers"
            value={totalCarriersResult.total ?? null}
            icon={<LocalShippingRoundedIcon />}
            loading={summaryLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="SAFER Enriched"
            value={enrichedResult.total ?? null}
            icon={<VerifiedRoundedIcon />}
            loading={summaryLoading}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Pending Enrichment"
            value={pendingResult.total ?? null}
            icon={<HourglassEmptyRoundedIcon />}
            loading={summaryLoading}
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Census Snapshots"
            value={censusSnapResult.total ?? null}
            icon={<SyncRoundedIcon />}
            loading={summaryLoading}
            color="text.secondary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="SAFER Snapshots"
            value={saferSnapResult.total ?? null}
            icon={<SecurityRoundedIcon />}
            loading={summaryLoading}
            color="text.secondary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionLabel>Latest Status</SectionLabel>
              {latestCensusRun && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 50 }}>Census</Typography>
                  <RunStatusChip status={latestCensusRun.status} />
                </Stack>
              )}
              {latestSaferRun && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 50 }}>SAFER</Typography>
                  <RunStatusChip status={latestSaferRun.status} />
                </Stack>
              )}
              {!latestCensusRun && !latestSaferRun && !latestCensusRunQ.isLoading && (
                <Typography variant="caption" color="text.disabled">No runs yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Action panels ─────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Census Sync panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SyncRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="h5">Sync Company Census</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fetches active carriers from the FMCSA Company Census API and upserts into <code>carriers</code>.
                Runs from Platform runtime.
              </Typography>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Limit"
                    type="number"
                    fullWidth
                    value={censusLimit}
                    onChange={(e) => setCensusLimit(Math.max(1, Number(e.target.value)))}
                    inputProps={{ min: 1, max: 10000 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Offset"
                    type="number"
                    fullWidth
                    value={censusOffset}
                    onChange={(e) => setCensusOffset(Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Max Pages"
                    type="number"
                    fullWidth
                    value={censusMaxPages}
                    onChange={(e) => setCensusMaxPages(Math.max(1, Number(e.target.value)))}
                    inputProps={{ min: 1, max: 20 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Min Drivers"
                    type="number"
                    fullWidth
                    value={censusMinDrivers}
                    onChange={(e) => setCensusMinDrivers(Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="small"
                startIcon={censusRunning ? <CircularProgress size={14} color="inherit" /> : <SyncRoundedIcon />}
                onClick={handleCensusSync}
                disabled={censusRunning}
                sx={{ mb: censusResult || censusError ? 2 : 0 }}
              >
                {censusRunning ? "Starting…" : "Run Census Sync"}
              </Button>

              {censusError && (
                <Alert severity="error" onClose={() => setCensusError(null)} sx={{ mt: 1 }}>
                  {censusError}
                </Alert>
              )}
              {censusResult && (
                <Alert severity="success" icon={<CheckCircleOutlineRoundedIcon fontSize="small" />} onClose={() => setCensusResult(null)} sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Job started</Typography>
                  {censusResult.invocation_id && (
                    <Typography variant="caption" color="text.secondary">
                      Invocation ID: {censusResult.invocation_id}
                      {censusResult.task_id ? ` · Task: ${String(censusResult.task_id).slice(0, 16)}…` : ""}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="text.disabled">
                    Click Refresh to see the run status below.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SAFER Enrichment panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SecurityRoundedIcon sx={{ color: "success.main", fontSize: 20 }} />
                <Typography variant="h5">Run SAFER Enrichment</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fetches SAFER Company Snapshots for unenriched carriers and patches SAFER fields.
                Runs from Platform runtime. Max 50 per run.
              </Typography>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Tooltip title="Maximum 50 per run" placement="top">
                    <TextField
                      size="small"
                      label="Limit (max 50)"
                      type="number"
                      fullWidth
                      value={saferLimit}
                      onChange={(e) => setSaferLimit(Math.min(SAFER_MAX_LIMIT, Math.max(1, Number(e.target.value))))}
                      inputProps={{ min: 1, max: SAFER_MAX_LIMIT }}
                      InputLabelProps={{ shrink: true }}
                      error={saferLimit > SAFER_MAX_LIMIT}
                      helperText={saferLimit > SAFER_MAX_LIMIT ? `Capped at ${SAFER_MAX_LIMIT}` : undefined}
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Min Drivers"
                    type="number"
                    fullWidth
                    value={saferMinDrivers}
                    onChange={(e) => setSaferMinDrivers(Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="State (optional)"
                    placeholder="e.g. TX"
                    fullWidth
                    value={saferState}
                    onChange={(e) => setSaferState(e.target.value.slice(0, 2).toUpperCase())}
                    inputProps={{ maxLength: 2, style: { textTransform: "uppercase" } }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    size="small"
                    label="Delay (seconds)"
                    type="number"
                    fullWidth
                    value={saferDelay}
                    onChange={(e) => setSaferDelay(Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0, step: 0.1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={saferOnlyUnenriched}
                        onChange={(e) => setSaferOnlyUnenriched(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Only unenriched carriers</Typography>}
                    sx={{ ml: 0 }}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={saferRunning ? <CircularProgress size={14} color="inherit" /> : <SecurityRoundedIcon />}
                onClick={handleSaferEnrich}
                disabled={saferRunning}
                sx={{ mb: saferResult || saferError ? 2 : 0 }}
              >
                {saferRunning ? "Starting…" : "Run SAFER Enrichment"}
              </Button>

              {saferError && (
                <Alert severity="error" onClose={() => setSaferError(null)} sx={{ mt: 1 }}>
                  {saferError}
                </Alert>
              )}
              {saferResult && (
                <Alert severity="success" icon={<CheckCircleOutlineRoundedIcon fontSize="small" />} onClose={() => setSaferResult(null)} sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Job started</Typography>
                  {saferResult.invocation_id && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Invocation ID: {saferResult.invocation_id}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="text.disabled">
                    Click Refresh to see the run status below.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Ingestion run history ──────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5">Ingestion Run History</Typography>
            <Typography variant="caption" color="text.disabled">
              {runsResult.total != null ? `${runsResult.total} total runs` : ""}
            </Typography>
          </Stack>

          {runsQ.isLoading ? (
            <Stack spacing={1}>
              {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={36} />)}
            </Stack>
          ) : runs.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "text.disabled" }}>
              <SyncRoundedIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">No ingestion runs yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell align="right">Fetched</TableCell>
                    <TableCell align="right">Inserted</TableCell>
                    <TableCell align="right">Updated</TableCell>
                    <TableCell align="right">Skipped</TableCell>
                    <TableCell align="right">Errors</TableCell>
                    <TableCell>Error Detail</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={run.run_type === "census_sync" ? "Census" : "SAFER"}
                          variant="outlined"
                          color={run.run_type === "census_sync" ? "primary" : "success"}
                        />
                      </TableCell>
                      <TableCell>
                        <RunStatusChip status={run.status} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {fmtDateTime(run.started_at)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {fmtDateTime(run.completed_at)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{fmtNum(run.total_fetched)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{fmtNum(run.total_inserted)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{fmtNum(run.total_updated)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{fmtNum(run.total_skipped)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: 12, color: (run.total_errors ?? 0) > 0 ? "error.main" : "text.primary" }}
                      >
                        {fmtNum(run.total_errors)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, maxWidth: 200 }}>
                        {run.error_details ? (
                          <Tooltip title={run.error_details} placement="left">
                            <Typography
                              variant="caption"
                              color="error.main"
                              sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}
                            >
                              {run.error_details}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.disabled">
        Runs from Platform runtime · Data Sync is admin-facing · No sales data is modified here
      </Typography>
    </Container>
  );
};

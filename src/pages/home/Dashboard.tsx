import React, { useMemo } from "react";
import { useList } from "@refinedev/core";
import { useNavigate } from "react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierRow {
  id: string;
  usdot_number: string;
  legal_name: string | null;
  dba_name: string | null;
  census_status: string | null;
  phy_state: string | null;
  email: string | null;
  drivers: number | null;
  power_units: number | null;
  safer_enriched: boolean | null;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: number | string | null;
  icon: React.ReactNode;
  loading?: boolean;
  color?: string;
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  loading,
  color = "primary.main",
  sub,
}) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ color, opacity: 0.85, mt: 0.25 }}>{icon}</Box>
        {loading ? (
          <Skeleton variant="text" width={60} height={48} />
        ) : (
          <Typography
            sx={{
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 700,
              fontSize: { xs: 28, sm: 32 },
              lineHeight: 1,
              color,
            }}
          >
            {value != null ? (typeof value === "number" ? value.toLocaleString() : value) : "—"}
          </Typography>
        )}
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1.5, fontWeight: 500 }}
      >
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.disabled">
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch all carriers — 25 rows, client-side aggregation is fine at this scale.
  // pageSize: 1000 is a safe upper bound; production ingestion will need server aggregation.
  const {
    result,
    query: { isLoading, isError, refetch },
  } = useList<CarrierRow>({
    resource: "carriers",
    pagination: { current: 1, pageSize: 1000 },
    sorters: [{ field: "drivers", order: "desc" }],
  });

  const carriers = result.data ?? [];
  const totalFromApi = result.total ?? 0;

  // ---------------------------------------------------------------------------
  // Client-side aggregations
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const active20 = carriers.filter(
      (c) => c.census_status === "A" && (c.drivers ?? 0) >= 20
    ).length;
    const withEmail = carriers.filter((c) => !!c.email).length;
    const enriched = carriers.filter((c) => !!c.safer_enriched).length;
    const states = new Set(
      carriers.map((c) => c.phy_state).filter(Boolean)
    ).size;
    return { active20, withEmail, enriched, states };
  }, [carriers]);

  const topStates = useMemo(() => {
    const counts: Record<string, number> = {};
    carriers.forEach((c) => {
      if (c.phy_state) counts[c.phy_state] = (counts[c.phy_state] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));
  }, [carriers]);

  const topCarriers = carriers.slice(0, 10);

  const coverage = useMemo(() => {
    const n = carriers.length;
    if (!n) return null;
    const withEmail = carriers.filter((c) => !!c.email).length;
    const enriched = carriers.filter((c) => !!c.safer_enriched).length;
    const pct = (v: number) => ((v / n) * 100).toFixed(0) + "%";
    return {
      total: n,
      withEmail,
      withEmailPct: pct(withEmail),
      missingEmail: n - withEmail,
      enriched,
      enrichedPct: pct(enriched),
      pendingEnrichment: n - enriched,
    };
  }, [carriers]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 4 }}
        spacing={2}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Carrier Sales Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            FMCSA Company Census — active carrier leads
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SearchRoundedIcon />}
          onClick={() => navigate("/carriers")}
        >
          Search Carriers
        </Button>
      </Stack>

      {/* Error */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button size="small" color="error" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load carrier data.
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Total Carriers"
            value={isLoading ? null : totalFromApi}
            icon={<LocalShippingRoundedIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Active, 20+ Drivers"
            value={isLoading ? null : kpis.active20}
            icon={<PeopleAltRoundedIcon />}
            loading={isLoading}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="With Email"
            value={isLoading ? null : kpis.withEmail}
            icon={<EmailRoundedIcon />}
            loading={isLoading}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="SAFER Enriched"
            value={isLoading ? null : kpis.enriched}
            icon={<VerifiedRoundedIcon />}
            loading={isLoading}
            color={kpis.enriched > 0 ? "success.main" : "text.disabled"}
            sub="Pending enrichment from RDC"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="States Covered"
            value={isLoading ? null : kpis.states}
            icon={<MapRoundedIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <KpiCard
            label="Email Coverage"
            value={
              isLoading || !coverage
                ? null
                : coverage.withEmailPct
            }
            icon={<AssignmentTurnedInRoundedIcon />}
            loading={isLoading}
            color="warning.main"
            sub={coverage ? `${coverage.missingEmail} missing` : undefined}
          />
        </Grid>
      </Grid>

      {/* Quick actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            sx={{
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "text.disabled",
              mb: 1.75,
            }}
          >
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SearchRoundedIcon />}
              onClick={() => navigate("/carriers")}
            >
              All Carriers
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PeopleAltRoundedIcon />}
              onClick={() => navigate("/carriers?census_status=A&min_drivers=20")}
            >
              Active 20+ Drivers
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EmailRoundedIcon />}
              onClick={() => navigate("/carriers?has_email=true")}
            >
              Carriers with Email
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VerifiedRoundedIcon />}
              onClick={() => navigate("/carriers?safer_enriched=false")}
            >
              Not SAFER Enriched
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LocalShippingRoundedIcon />}
              onClick={() => navigate("/carriers?sort=drivers_desc")}
            >
              Largest Fleets
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Bottom two-column section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Top states */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                sx={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "text.disabled",
                  mb: 1.75,
                }}
              >
                Top States by Carrier Count
              </Typography>
              {isLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={28} />
                  ))}
                </Stack>
              ) : topStates.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  No data
                </Typography>
              ) : (
                <Table size="small">
                  <TableBody>
                    {topStates.map(({ state, count }) => (
                      <TableRow
                        key={state}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/carriers")}
                      >
                        <TableCell sx={{ border: 0, pl: 0 }}>
                          <Chip
                            label={state}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 44 }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ border: 0, pr: 0, fontWeight: 600 }}
                        >
                          {count}
                        </TableCell>
                        <TableCell sx={{ border: 0, width: 80, pr: 0 }}>
                          <Box
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "primary.main",
                              opacity: 0.6,
                              width: `${(count / (topStates[0]?.count || 1)) * 100}%`,
                              minWidth: 4,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top carriers by drivers */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography
                sx={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "text.disabled",
                  mb: 1.75,
                }}
              >
                Top 10 Carriers by Drivers
              </Typography>
              {isLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={36} />
                  ))}
                </Stack>
              ) : topCarriers.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  No data
                </Typography>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Legal Name</TableCell>
                        <TableCell>USDOT</TableCell>
                        <TableCell align="center">State</TableCell>
                        <TableCell align="right">Drivers</TableCell>
                        <TableCell align="right">Power Units</TableCell>
                        <TableCell>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCarriers.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 500, maxWidth: 200 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.legal_name || "—"}
                            </Typography>
                            {c.dba_name && (
                              <Typography variant="caption" color="text.secondary">
                                {c.dba_name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "text.secondary",
                              }}
                            >
                              {c.usdot_number}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {c.phy_state ? (
                              <Chip
                                label={c.phy_state}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {c.drivers != null
                              ? c.drivers.toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {c.power_units != null
                              ? c.power_units.toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={c.email ? "primary.main" : "text.disabled"}
                              sx={{
                                fontSize: 11,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 160,
                              }}
                            >
                              {c.email ? c.email.toLowerCase() : "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data coverage section */}
      {coverage && (
        <Card>
          <CardContent>
            <Typography
              sx={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "text.disabled",
                mb: 2,
              }}
            >
              Data Coverage
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Records
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {coverage.total.toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email Coverage
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "info.main",
                  }}
                >
                  {coverage.withEmailPct}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {coverage.withEmail} of {coverage.total} ·{" "}
                  {coverage.missingEmail} missing
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SAFER Enriched
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color:
                      coverage.enriched > 0 ? "success.main" : "text.disabled",
                  }}
                >
                  {coverage.enrichedPct}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {coverage.enriched} enriched · {coverage.pendingEnrichment}{" "}
                  pending
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Enrichment Source
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label="Census"
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label="SAFER pending"
                    color="default"
                    variant="outlined"
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  SAFER enrichment runs from RDC
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Loading overlay for initial load */}
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "background.paper",
            px: 2,
            py: 1,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 9999,
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption">Loading data…</Typography>
        </Box>
      )}
    </Container>
  );
};

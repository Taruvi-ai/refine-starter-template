import React, { useState } from "react";
import { useShow } from "@refinedev/core";
import { useNavigate } from "react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierRecord {
  id: string;
  usdot_number: string | null;
  legal_name: string | null;
  dba_name: string | null;
  entity_type: string | null;
  census_status: string | null;
  usdot_status: string | null;
  operating_authority_status: string | null;
  out_of_service_date: string | null;
  mc_mx_ff_numbers: string | null;
  duns_number: string | null;
  state_carrier_id: string | null;
  phy_street: string | null;
  phy_city: string | null;
  phy_state: string | null;
  phy_zip: string | null;
  mailing_street: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  phone: string | null;
  email: string | null;
  power_units: number | null;
  drivers: number | null;
  business_org_type: string | null;
  hm_ind: string | null;
  carrier_operation_code: string | null;
  carrier_operation: string[] | null;
  operation_classification: string[] | null;
  cargo_carried: string[] | null;
  classdef: string | null;
  crgo_genfreight: string | null;
  mcs150_date: string | null;
  mcs150_mileage: number | null;
  mcs150_mileage_year: number | null;
  census_add_date: string | null;
  us_inspections_total: number | null;
  us_crashes_fatal: number | null;
  us_crashes_injury: number | null;
  us_crashes_tow: number | null;
  us_crashes_total: number | null;
  canada_inspections_total: number | null;
  canada_crashes_fatal: number | null;
  canada_crashes_injury: number | null;
  canada_crashes_tow: number | null;
  canada_crashes_total: number | null;
  safety_rating: string | null;
  safety_rating_date: string | null;
  safety_review_date: string | null;
  safety_review_type: string | null;
  safer_enriched: boolean | null;
  safer_enriched_at: string | null;
  census_fetched_at: string | null;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const fmtNum = (v: number | null | undefined) =>
  v != null ? v.toLocaleString() : null;

const fmtPhone = (v: string | null | undefined) => {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1")
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return v;
};

const saferUrl = (dot: string | null) =>
  dot
    ? `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`
    : null;

const saferRatingColor = (
  rating: string | null
): "success" | "warning" | "error" | "default" => {
  if (rating === "Satisfactory") return "success";
  if (rating === "Conditional") return "warning";
  if (rating === "Unsatisfactory") return "error";
  return "default";
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontFamily: "'Quicksand', sans-serif",
      fontWeight: 600,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "text.disabled",
      mb: 1.5,
    }}
  >
    {children}
  </Typography>
);

interface FieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, mono }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="caption"
      sx={{
        display: "block",
        color: "text.disabled",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontWeight: 600,
        mb: 0.4,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontFamily: mono ? "monospace" : undefined,
        fontSize: mono ? 12 : undefined,
        color: value ? "text.primary" : "text.disabled",
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

// Tag-chip rotation (per UI_Guidelines §3)
const TAG_VARIANTS = ["tagBlue", "tagPurple", "tagGreen", "tagOrange"] as const;
type TagVariant = (typeof TAG_VARIANTS)[number];
const variantForTag = (name: string): TagVariant => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TAG_VARIANTS[Math.abs(h) % TAG_VARIANTS.length];
};

const TagChipList: React.FC<{ items: string[] | null }> = ({ items }) => {
  if (!items?.length)
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {items.map((v, i) => (
        <Chip key={i} size="small" label={v} variant={variantForTag(v) as never} />
      ))}
    </Stack>
  );
};

interface MetricTileProps {
  label: string;
  value: number | null;
  sub?: string;
  warn?: boolean;
}

const MetricTile: React.FC<MetricTileProps> = ({ label, value, sub, warn }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: warn && value != null && value > 0 ? "warning.light" : "divider",
      borderRadius: 1.25,
      py: 2,
      px: 1.5,
      textAlign: "center",
      bgcolor:
        warn && value != null && value > 0 ? "warning.50" : "background.paper",
      height: "100%",
    }}
  >
    <Typography
      sx={{
        fontFamily: "'Quicksand', sans-serif",
        fontWeight: 700,
        fontSize: 30,
        lineHeight: 1.15,
        color:
          warn && value != null && value > 0 ? "warning.dark" : "text.primary",
      }}
    >
      {value != null ? value.toLocaleString() : "—"}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "text.secondary",
        mt: 0.5,
      }}
    >
      {label}
    </Typography>
    {sub && (
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.disabled", mt: 0.25, fontSize: 10 }}
      >
        {sub}
      </Typography>
    )}
  </Box>
);

// SAFER-pending banner shown inside tabs that rely on SAFER data
const SaferPendingBanner: React.FC = () => (
  <Alert
    severity="info"
    icon={<HourglassEmptyRoundedIcon fontSize="small" />}
    sx={{ mb: 2 }}
  >
    This carrier has not been SAFER enriched yet. Fields below will populate
    after SAFER enrichment runs for this DOT.
  </Alert>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const CarrierShow: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const {
    result: carrier,
    query: { isLoading, isError, refetch },
  } = useShow<CarrierRecord>({ resource: "carriers" });

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading carrier…
          </Typography>
        </Stack>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="45%" height={44} />
            <Skeleton variant="text" width="28%" height={24} sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="20%" height={20} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={14} width="40%" sx={{ mb: 1.5 }} />
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} variant="text" height={32} sx={{ mb: 0.5 }} />
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={36} width="60%" sx={{ mb: 2 }} />
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} variant="text" height={28} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Alert
          severity="error"
          icon={<ErrorRoundedIcon />}
          action={
            <Button size="small" color="error" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load carrier data.
        </Alert>
        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/carriers")}
        >
          Back to Carriers
        </Button>
      </Container>
    );
  }

  if (!carrier) return null;

  // ── Derived values ───────────────────────────────────────────────────────

  const isSaferEnriched = !!carrier.safer_enriched;
  const saferLink = saferUrl(carrier.usdot_number);

  const censusStatusColor =
    carrier.census_status === "A"
      ? "success"
      : carrier.census_status === "I"
      ? "error"
      : "default";
  const censusStatusLabel =
    carrier.census_status === "A"
      ? "ACTIVE"
      : carrier.census_status === "I"
      ? "INACTIVE"
      : carrier.census_status || "UNKNOWN";

  const hasPhone = !!carrier.phone;
  const hasEmail = !!carrier.email;
  const dialPhone = carrier.phone?.replace(/\D/g, "") ?? "";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <Breadcrumbs sx={{ mb: 2, fontSize: 13 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/carriers"
          onClick={(e) => { e.preventDefault(); navigate("/carriers"); }}
          sx={{ cursor: "pointer" }}
        >
          Carriers
        </Link>
        {carrier.phy_state && (
          <Link
            underline="hover"
            color="inherit"
            href={`/carriers?phy_state=${carrier.phy_state}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/carriers?phy_state=${carrier.phy_state}`);
            }}
            sx={{ cursor: "pointer" }}
          >
            {carrier.phy_state}
          </Link>
        )}
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {carrier.legal_name ?? carrier.usdot_number ?? "Carrier"}
        </Typography>
      </Breadcrumbs>

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "flex-start" }}
            spacing={2}
          >
            {/* Left — identity */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Company name */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                <LocalShippingRoundedIcon sx={{ color: "primary.main", fontSize: 26, flexShrink: 0 }} />
                <Typography variant="h2" sx={{ lineHeight: 1.2, wordBreak: "break-word" }}>
                  {carrier.legal_name || "Unnamed Carrier"}
                </Typography>
              </Stack>

              {/* DBA */}
              {carrier.dba_name && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: "38px", mb: 1 }}
                >
                  <Box component="span" sx={{ fontWeight: 600, color: "text.disabled", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", mr: 0.75 }}>DBA:</Box>
                  {carrier.dba_name}
                </Typography>
              )}

              {/* USDOT + SAFER link */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ ml: "38px", mb: 1.25 }}
                flexWrap="wrap"
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: 12, color: "text.secondary" }}
                >
                  USDOT {carrier.usdot_number}
                </Typography>
                {saferLink && (
                  <Link
                    href={saferLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 0.4 }}
                  >
                    SAFER Listing
                    <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                  </Link>
                )}
              </Stack>

              {/* Status chips + enrichment */}
              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                useFlexGap
                sx={{ ml: "38px", mb: 1.5 }}
              >
                <Tooltip title="Carrier is active in the FMCSA Company Census.">
                  <Chip
                    size="small"
                    label={censusStatusLabel}
                    color={censusStatusColor as "success" | "error" | "default"}
                  />
                </Tooltip>
                <Tooltip title={isSaferEnriched ? "SAFER Company Snapshot data has been fetched and applied." : "SAFER enrichment has not run for this carrier yet."}>
                  <Chip
                    size="small"
                    label={isSaferEnriched ? "SAFER ENRICHED" : "SAFER PENDING"}
                    color={isSaferEnriched ? "success" : "default"}
                    variant={isSaferEnriched ? "filled" : "outlined"}
                    icon={
                      isSaferEnriched ? (
                        <CheckCircleOutlineRoundedIcon style={{ fontSize: 13 }} />
                      ) : (
                        <HourglassEmptyRoundedIcon style={{ fontSize: 13 }} />
                      )
                    }
                  />
                </Tooltip>
                {carrier.operation_classification?.map((v, i) => (
                  <Tooltip key={i} title="Operating classification reported by SAFER.">
                    <Chip size="small" label={v} color="info" variant="outlined" />
                  </Tooltip>
                ))}
                {carrier.carrier_operation?.map((v, i) => (
                  <Tooltip key={i} title="Carrier operation reported by SAFER.">
                    <Chip size="small" label={v} color="info" variant="outlined" />
                  </Tooltip>
                ))}
                {carrier.safety_rating && (
                  <Tooltip title="Federal safety rating from SAFER, when available.">
                    <Chip
                      size="small"
                      label={carrier.safety_rating}
                      color={saferRatingColor(carrier.safety_rating)}
                      icon={<SecurityRoundedIcon style={{ fontSize: 13 }} />}
                    />
                  </Tooltip>
                )}
              </Stack>

              {/* Fleet at a glance */}
              {(carrier.drivers != null || carrier.power_units != null) && (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ ml: "38px" }}
                  divider={
                    <Typography variant="body2" color="text.disabled">
                      ·
                    </Typography>
                  }
                >
                  {carrier.drivers != null && (
                    <Typography variant="body2" color="text.secondary">
                      <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {carrier.drivers.toLocaleString()}
                      </Box>{" "}
                      Drivers
                    </Typography>
                  )}
                  {carrier.power_units != null && (
                    <Typography variant="body2" color="text.secondary">
                      <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {carrier.power_units.toLocaleString()}
                      </Box>{" "}
                      Power Units
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>

            {/* Right — actions */}
            <Stack
              direction={{ xs: "row", md: "column" }}
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ flexShrink: 0 }}
            >
              {hasPhone && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PhoneRoundedIcon />}
                  href={`tel:${dialPhone}`}
                  component="a"
                  sx={{ minWidth: 110 }}
                >
                  Call
                </Button>
              )}
              {hasEmail && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EmailRoundedIcon />}
                  href={`mailto:${carrier.email}`}
                  component="a"
                  sx={{ minWidth: 110 }}
                >
                  Email
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/carriers")}
                sx={{ minWidth: 110 }}
              >
                All Carriers
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Contact / address row ──────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Contact info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionLabel>Contact</SectionLabel>
              {hasPhone ? (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, display: "block", mb: 0.4 }}>
                    Phone
                  </Typography>
                  <Link href={`tel:${dialPhone}`} underline="hover" variant="body2" sx={{ fontWeight: 500 }}>
                    {fmtPhone(carrier.phone)}
                  </Link>
                </Box>
              ) : (
                <Field label="Phone" value={null} />
              )}
              {hasEmail ? (
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, display: "block", mb: 0.4 }}>
                    Email
                  </Typography>
                  <Link href={`mailto:${carrier.email}`} underline="hover" variant="body2" sx={{ fontSize: 12, wordBreak: "break-all" }}>
                    {carrier.email?.toLowerCase()}
                  </Link>
                </Box>
              ) : (
                <Field label="Email" value={null} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Physical address */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionLabel>Physical Address</SectionLabel>
              {carrier.phy_street || carrier.phy_city ? (
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  {carrier.phy_street && <Box component="span" sx={{ display: "block" }}>{carrier.phy_street}</Box>}
                  {(carrier.phy_city || carrier.phy_state || carrier.phy_zip) && (
                    <Box component="span" sx={{ display: "block" }}>
                      {[carrier.phy_city, carrier.phy_state].filter(Boolean).join(", ")}
                      {carrier.phy_zip ? ` ${carrier.phy_zip}` : ""}
                    </Box>
                  )}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.disabled">—</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mailing address */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionLabel>Mailing Address</SectionLabel>
              {carrier.mailing_street || carrier.mailing_city ? (
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  {carrier.mailing_street && (
                    <Box component="span" sx={{ display: "block" }}>{carrier.mailing_street}</Box>
                  )}
                  {(carrier.mailing_city || carrier.mailing_state || carrier.mailing_zip) && (
                    <Box component="span" sx={{ display: "block" }}>
                      {[carrier.mailing_city, carrier.mailing_state].filter(Boolean).join(", ")}
                      {carrier.mailing_zip ? ` ${carrier.mailing_zip}` : ""}
                    </Box>
                  )}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.disabled">—</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Tabbed profile sections ────────────────────────────────────── */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab label="Fleet" />
            <Tab label="Operations" />
            <Tab label="Safety" />
            <Tab label="Crashes & Inspections" />
          </Tabs>
        </Box>

        <CardContent sx={{ pt: 3 }}>
          {/* ── Tab 0: Overview ─────────────────────────────────── */}
          {activeTab === 0 && (
            <Box>
              {!isSaferEnriched && <SaferPendingBanner />}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Entity Type" value={carrier.entity_type} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="USDOT Status" value={carrier.usdot_status} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="MC / MX / FF Numbers" value={carrier.mc_mx_ff_numbers} mono />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    label="Operating Authority"
                    value={carrier.operating_authority_status}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Census Status" value={
                    carrier.census_status ? (
                      <Chip
                        size="small"
                        label={censusStatusLabel}
                        color={censusStatusColor as "success" | "error" | "default"}
                      />
                    ) : null
                  } />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Business Org Type" value={carrier.business_org_type} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    label="Hazmat"
                    value={
                      carrier.hm_ind === "Y" ? (
                        <Chip size="small" label="YES" color="warning" />
                      ) : carrier.hm_ind === "N" ? (
                        "No"
                      ) : null
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    label="Out of Service Date"
                    value={
                      carrier.out_of_service_date ? (
                        <Chip size="small" label={carrier.out_of_service_date} color="error" />
                      ) : null
                    }
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="MCS-150 Form Date" value={carrier.mcs150_date} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    label="MCS-150 Mileage"
                    value={fmtNum(carrier.mcs150_mileage)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field
                    label="Mileage Year"
                    value={carrier.mcs150_mileage_year?.toString() ?? null}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Census Added" value={carrier.census_add_date} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="DUNS Number" value={carrier.duns_number} mono />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="State Carrier ID" value={carrier.state_carrier_id} mono />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Tab 1: Fleet ────────────────────────────────────── */}
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="Drivers"
                    value={carrier.drivers}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="Power Units"
                    value={carrier.power_units}
                  />
                </Grid>
                {carrier.mcs150_mileage != null && (
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <MetricTile
                      label={`MCS-150 Mileage${carrier.mcs150_mileage_year ? ` (${carrier.mcs150_mileage_year})` : ""}`}
                      value={carrier.mcs150_mileage}
                    />
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={0}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="MCS-150 Form Date" value={carrier.mcs150_date} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field
                    label="Mileage Year"
                    value={carrier.mcs150_mileage_year?.toString() ?? null}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Tab 2: Operations ───────────────────────────────── */}
          {activeTab === 2 && (
            <Box>
              {!isSaferEnriched && <SaferPendingBanner />}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    <SectionLabel>Carrier Operation</SectionLabel>
                    <TagChipList items={carrier.carrier_operation} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    <SectionLabel>Operation Classification</SectionLabel>
                    <TagChipList items={carrier.operation_classification} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    <SectionLabel>Cargo Carried</SectionLabel>
                    <TagChipList items={carrier.cargo_carried} />
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={0}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field
                    label="Carrier Operation Code (Census)"
                    value={carrier.carrier_operation_code}
                    mono
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field
                    label="General Freight"
                    value={
                      carrier.crgo_genfreight === "X" ? (
                        <Chip size="small" label="YES" color="info" />
                      ) : (
                        "No"
                      )
                    }
                  />
                </Grid>
                <Grid size={12}>
                  <Field label="Classification (Census)" value={carrier.classdef} />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Tab 3: Safety ───────────────────────────────────── */}
          {activeTab === 3 && (
            <Box>
              {!isSaferEnriched && <SaferPendingBanner />}
              {/* Safety rating prominent display */}
              {carrier.safety_rating && (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    p: 2.5,
                    mb: 2.5,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <SecurityRoundedIcon
                    sx={{ color: `${saferRatingColor(carrier.safety_rating)}.main`, fontSize: 32 }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block" }}>
                      Safety Rating
                    </Typography>
                    <Chip
                      label={carrier.safety_rating}
                      color={saferRatingColor(carrier.safety_rating)}
                      sx={{ mt: 0.5, fontWeight: 700 }}
                    />
                  </Box>
                </Box>
              )}
              <Grid container spacing={0}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="Rating Date" value={carrier.safety_rating_date} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="Review Date" value={carrier.safety_review_date} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="Review Type" value={carrier.safety_review_type} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field
                    label="Out of Service Date"
                    value={
                      carrier.out_of_service_date ? (
                        <Chip size="small" label={carrier.out_of_service_date} color="error" />
                      ) : null
                    }
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="DUNS Number" value={carrier.duns_number} mono />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Field label="State Carrier ID" value={carrier.state_carrier_id} mono />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Tab 4: Crashes & Inspections ────────────────────── */}
          {activeTab === 4 && (
            <Box>
              {!isSaferEnriched && <SaferPendingBanner />}
              <SectionLabel>United States — 24-Month</SectionLabel>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="US Inspections"
                    value={carrier.us_inspections_total}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="US Crashes"
                    value={carrier.us_crashes_total}
                    sub={
                      carrier.us_crashes_total != null && carrier.us_crashes_total > 0
                        ? `fatal ${carrier.us_crashes_fatal ?? 0} · injury ${carrier.us_crashes_injury ?? 0} · tow ${carrier.us_crashes_tow ?? 0}`
                        : undefined
                    }
                    warn
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="US Crashes — Fatal"
                    value={carrier.us_crashes_fatal}
                    warn
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="US Crashes — Injury"
                    value={carrier.us_crashes_injury}
                    warn
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <SectionLabel>Canada — 24-Month</SectionLabel>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="CA Inspections"
                    value={carrier.canada_inspections_total}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="CA Crashes"
                    value={carrier.canada_crashes_total}
                    sub={
                      carrier.canada_crashes_total != null && carrier.canada_crashes_total > 0
                        ? `fatal ${carrier.canada_crashes_fatal ?? 0} · injury ${carrier.canada_crashes_injury ?? 0} · tow ${carrier.canada_crashes_tow ?? 0}`
                        : undefined
                    }
                    warn
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="CA Crashes — Fatal"
                    value={carrier.canada_crashes_fatal}
                    warn
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <MetricTile
                    label="CA Crashes — Injury"
                    value={carrier.canada_crashes_injury}
                    warn
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

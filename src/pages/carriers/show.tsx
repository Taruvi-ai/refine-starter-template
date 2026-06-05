import React from "react";
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
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";

// ---------------------------------------------------------------------------
// Full carrier record type
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
// Small display components
// ---------------------------------------------------------------------------

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    {children}
  </Typography>
);

interface FieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  loading?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, mono, loading }) => (
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
    {loading ? (
      <Skeleton variant="text" width={160} height={20} />
    ) : (
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
    )}
  </Box>
);

const fmtNum = (v: number | null | undefined) =>
  v != null ? v.toLocaleString() : null;

const fmtPhone = (v: string | null | undefined) => {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return v;
};

const fmtAddress = (
  street: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
) => {
  const parts = [street, [city, state].filter(Boolean).join(", "), zip].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
};

// ---------------------------------------------------------------------------
// Carrier Show page
// ---------------------------------------------------------------------------

export const CarrierShow: React.FC = () => {
  const navigate = useNavigate();

  const {
    result: carrier,
    query: { isLoading, isError, refetch },
  } = useShow<CarrierRecord>({ resource: "carriers" });

  const isSaferEnriched = !!carrier?.safer_enriched;

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

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
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="text" width="25%" height={24} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={16} width="50%" sx={{ mb: 2 }} />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} variant="text" height={36} sx={{ mb: 0.5 }} />
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------

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

  const statusChipColor =
    carrier.census_status === "A"
      ? "success"
      : carrier.census_status === "I"
      ? "error"
      : "default";
  const statusLabel =
    carrier.census_status === "A"
      ? "ACTIVE"
      : carrier.census_status === "I"
      ? "INACTIVE"
      : carrier.census_status || "UNKNOWN";

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2, fontSize: 13 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          sx={{ cursor: "pointer" }}
        >
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/carriers"
          onClick={(e) => { e.preventDefault(); navigate("/carriers"); }}
          sx={{ cursor: "pointer" }}
        >
          Carriers
        </Link>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {carrier.legal_name ?? carrier.usdot_number ?? "Carrier"}
        </Typography>
      </Breadcrumbs>

      {/* Header card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            {/* Title + chips */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <LocalShippingRoundedIcon
                  sx={{ color: "text.disabled", fontSize: 22 }}
                />
                <Typography variant="h2" sx={{ lineHeight: 1.2 }}>
                  {carrier.legal_name || "Unnamed Carrier"}
                </Typography>
              </Stack>
              {carrier.dba_name && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, ml: "30px" }}
                >
                  DBA: {carrier.dba_name}
                </Typography>
              )}
              {/* Meta line */}
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mt: 1.25, ml: "30px" }}
                flexWrap="wrap"
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", fontSize: 11 }}
                >
                  USDOT {carrier.usdot_number}
                </Typography>
                <Chip
                  size="small"
                  label={statusLabel}
                  color={statusChipColor as "success" | "error" | "default"}
                />
                <Chip
                  size="small"
                  label={isSaferEnriched ? "SAFER ENRICHED" : "SAFER PENDING"}
                  color={isSaferEnriched ? "success" : "default"}
                  variant={isSaferEnriched ? "filled" : "outlined"}
                  icon={
                    isSaferEnriched ? (
                      <CheckCircleOutlineRoundedIcon style={{ fontSize: 14 }} />
                    ) : (
                      <HourglassEmptyRoundedIcon style={{ fontSize: 14 }} />
                    )
                  }
                />
                {carrier.entity_type && (
                  <Typography variant="caption" color="text.disabled">
                    {carrier.entity_type}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Actions — back only (read-only page) */}
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate("/carriers")}
              sx={{ flexShrink: 0 }}
            >
              Back to Carriers
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Content grid */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Contact & Location */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionTitle>Contact &amp; Location</SectionTitle>
              <Field label="Phone" value={fmtPhone(carrier.phone)} />
              <Field
                label="Email"
                value={
                  carrier.email ? (
                    <Typography
                      component="a"
                      href={`mailto:${carrier.email}`}
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        fontSize: 12,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {carrier.email.toLowerCase()}
                    </Typography>
                  ) : null
                }
              />
              <Divider sx={{ my: 1.5 }} />
              <Field
                label="Physical Address"
                value={fmtAddress(
                  carrier.phy_street,
                  carrier.phy_city,
                  carrier.phy_state,
                  carrier.phy_zip
                )}
              />
              <Field
                label="Mailing Address"
                value={fmtAddress(
                  carrier.mailing_street,
                  carrier.mailing_city,
                  carrier.mailing_state,
                  carrier.mailing_zip
                )}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Fleet */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <SectionTitle>Fleet</SectionTitle>
              <Grid container spacing={0}>
                <Grid size={6}>
                  <Field label="Drivers" value={fmtNum(carrier.drivers)} />
                </Grid>
                <Grid size={6}>
                  <Field label="Power Units" value={fmtNum(carrier.power_units)} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Field label="MCS-150 Form Date" value={carrier.mcs150_date} />
              <Grid container spacing={0}>
                <Grid size={6}>
                  <Field
                    label="MCS-150 Mileage"
                    value={fmtNum(carrier.mcs150_mileage)}
                  />
                </Grid>
                <Grid size={6}>
                  <Field
                    label="Mileage Year"
                    value={carrier.mcs150_mileage_year?.toString() ?? null}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operations */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <SectionTitle>Operations</SectionTitle>
          <Grid container spacing={0}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="Business Org Type" value={carrier.business_org_type} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Hazmat"
                value={
                  carrier.hm_ind === "Y" ? (
                    <Chip size="small" label="YES" color="warning" />
                  ) : carrier.hm_ind === "N" ? (
                    <Typography variant="body2" color="text.secondary">
                      No
                    </Typography>
                  ) : null
                }
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Carrier Operation Code"
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
                    <Typography variant="body2" color="text.disabled">
                      No
                    </Typography>
                  )
                }
              />
            </Grid>
            <Grid size={12}>
              <Field label="Classification (Census)" value={carrier.classdef} />
            </Grid>
            {carrier.census_add_date && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Field label="Census Added" value={carrier.census_add_date} />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* SAFER Enrichment */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <SectionTitle>SAFER Enrichment</SectionTitle>
            {!isSaferEnriched && (
              <Chip
                size="small"
                icon={<HourglassEmptyRoundedIcon style={{ fontSize: 14 }} />}
                label="Pending SAFER enrichment"
                variant="outlined"
              />
            )}
          </Stack>

          {!isSaferEnriched && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This carrier has not been SAFER enriched yet. Fields below will
              populate after SAFER enrichment runs for this DOT.
            </Alert>
          )}

          {/* Identity / authority */}
          <Grid container spacing={0}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="USDOT Status" value={carrier.usdot_status} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Operating Authority"
                value={carrier.operating_authority_status}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="MC/MX/FF Numbers" value={carrier.mc_mx_ff_numbers} mono />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Out of Service Date"
                value={
                  carrier.out_of_service_date ? (
                    <Chip
                      size="small"
                      label={carrier.out_of_service_date}
                      color="error"
                    />
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

          <Divider sx={{ my: 1.5 }} />

          {/* Operations arrays */}
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.disabled",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                    mb: 0.75,
                  }}
                >
                  Operation Classification
                </Typography>
                {carrier.operation_classification?.length ? (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {carrier.operation_classification.map((v, i) => (
                      <Chip key={i} size="small" label={v} variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    —
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.disabled",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                    mb: 0.75,
                  }}
                >
                  Carrier Operation
                </Typography>
                {carrier.carrier_operation?.length ? (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {carrier.carrier_operation.map((v, i) => (
                      <Chip key={i} size="small" label={v} variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    —
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.disabled",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                    mb: 0.75,
                  }}
                >
                  Cargo Carried
                </Typography>
                {carrier.cargo_carried?.length ? (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {carrier.cargo_carried.map((v, i) => (
                      <Chip key={i} size="small" label={v} variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    —
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          {/* Safety rating */}
          <Grid container spacing={0}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Safety Rating"
                value={
                  carrier.safety_rating ? (
                    <Chip
                      size="small"
                      label={carrier.safety_rating}
                      color={
                        carrier.safety_rating === "Satisfactory"
                          ? "success"
                          : carrier.safety_rating === "Conditional"
                          ? "warning"
                          : carrier.safety_rating === "Unsatisfactory"
                          ? "error"
                          : "default"
                      }
                    />
                  ) : null
                }
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="Rating Date" value={carrier.safety_rating_date} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="Review Date" value={carrier.safety_review_date} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field label="Review Type" value={carrier.safety_review_type} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          {/* Inspections & crashes */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            24-Month Inspection &amp; Crash Data
          </Typography>
          <Grid container spacing={0}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="US Inspections"
                value={fmtNum(carrier.us_inspections_total)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="US Crashes (Total)"
                value={
                  carrier.us_crashes_total != null ? (
                    <Typography
                      variant="body2"
                      color={
                        carrier.us_crashes_total > 0
                          ? "warning.main"
                          : "text.primary"
                      }
                      sx={{ fontWeight: carrier.us_crashes_total > 0 ? 600 : 400 }}
                    >
                      {carrier.us_crashes_total.toLocaleString()}
                      {carrier.us_crashes_total > 0 && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          (fatal:{carrier.us_crashes_fatal ?? 0} · injury:
                          {carrier.us_crashes_injury ?? 0} · tow:
                          {carrier.us_crashes_tow ?? 0})
                        </Typography>
                      )}
                    </Typography>
                  ) : null
                }
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Canada Inspections"
                value={fmtNum(carrier.canada_inspections_total)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Field
                label="Canada Crashes (Total)"
                value={fmtNum(carrier.canada_crashes_total)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDataGrid } from "@refinedev/mui";
import { useDataProvider } from "@refinedev/core";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate, useSearchParams } from "react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { CrudFilter } from "@refinedev/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierRow {
  id: string;
  usdot_number: string;
  legal_name: string | null;
  dba_name: string | null;
  census_status: string | null;
  phy_city: string | null;
  phy_state: string | null;
  phone: string | null;
  email: string | null;
  drivers: number | null;
  power_units: number | null;
  safer_enriched: boolean | null;
  // SAFER enrichment fields (populated for enriched carriers)
  safety_rating: string | null;
  operating_authority_status: string | null;
  carrier_operation: string[] | null;
  operation_classification: string[] | null;
  cargo_carried: string[] | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtNum = (v: number | null | undefined) =>
  v != null ? v.toLocaleString() : "—";

const fmtPhone = (v: string | null | undefined) => {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return v;
};

// ---------------------------------------------------------------------------
// CSV export helpers
// ---------------------------------------------------------------------------

const SAFER_SNAPSHOT_URL = (dot: string) =>
  `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`;

const CSV_HEADERS = [
  "Legal Name",
  "DBA Name",
  "USDOT",
  "City",
  "State",
  "Drivers",
  "Power Units",
  "Phone",
  "Email",
  "Census Status",
  "SAFER Enriched",
  "Safety Rating",
  "Operating Authority",
  "Carrier Operation",
  "Operation Classification",
  "Cargo Carried",
  "SAFER Listing URL",
];

const escCsv = (v: unknown): string => {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const joinArr = (v: string[] | null | undefined): string =>
  Array.isArray(v) ? v.join("; ") : "";

const rowToCsvLine = (c: CarrierRow): string => {
  const fields: unknown[] = [
    c.legal_name,
    c.dba_name,
    c.usdot_number,
    c.phy_city,
    c.phy_state,
    c.drivers,
    c.power_units,
    c.phone,
    c.email,
    c.census_status === "A" ? "ACTIVE" : c.census_status === "I" ? "INACTIVE" : (c.census_status ?? ""),
    c.safer_enriched ? "Yes" : "No",
    c.safety_rating,
    c.operating_authority_status,
    joinArr(c.carrier_operation),
    joinArr(c.operation_classification),
    joinArr(c.cargo_carried),
    c.usdot_number ? SAFER_SNAPSHOT_URL(c.usdot_number) : "",
  ];
  return fields.map(escCsv).join(",");
};

const triggerCsvDownload = (rows: CarrierRow[]) => {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    CSV_HEADERS.map(escCsv).join(","),
    ...rows.map(rowToCsvLine),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carrier-sales-leads-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: GridColDef<CarrierRow>[] = [
  {
    field: "legal_name",
    headerName: "Legal Name",
    flex: 1.5,
    minWidth: 180,
    renderCell: ({ value }) => (
      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
        {value || "—"}
      </Typography>
    ),
  },
  {
    field: "dba_name",
    headerName: "DBA",
    flex: 1,
    minWidth: 100,
    renderCell: ({ value }) => (
      <Typography
        variant="body2"
        color={value ? "text.primary" : "text.disabled"}
      >
        {value || "—"}
      </Typography>
    ),
  },
  {
    field: "usdot_number",
    headerName: "USDOT",
    width: 90,
    renderCell: ({ value }) => (
      <Typography
        variant="body2"
        sx={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 0.3 }}
      >
        {value}
      </Typography>
    ),
  },
  {
    field: "phy_city",
    headerName: "City",
    width: 120,
    renderCell: ({ value }) => value || "—",
  },
  {
    field: "phy_state",
    headerName: "State",
    width: 70,
    align: "center",
    headerAlign: "center",
    renderCell: ({ value }) =>
      value ? (
        <Chip label={value} size="small" variant="outlined" />
      ) : (
        <Typography color="text.disabled">—</Typography>
      ),
  },
  {
    field: "drivers",
    headerName: "Drivers",
    width: 90,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: ({ value }) => fmtNum(value),
  },
  {
    field: "power_units",
    headerName: "Power Units",
    width: 105,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: ({ value }) => fmtNum(value),
  },
  {
    field: "phone",
    headerName: "Phone",
    width: 140,
    renderCell: ({ value }) => (
      <Typography
        variant="body2"
        color={value ? "text.primary" : "text.disabled"}
        sx={{ fontSize: 12 }}
      >
        {fmtPhone(value)}
      </Typography>
    ),
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1.2,
    minWidth: 160,
    renderCell: ({ value }) => (
      <Typography
        variant="body2"
        color={value ? "primary.main" : "text.disabled"}
        sx={{ fontSize: 12, textOverflow: "ellipsis", overflow: "hidden" }}
      >
        {value ? value.toLowerCase() : "—"}
      </Typography>
    ),
  },
  {
    field: "census_status",
    headerName: "Status",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: ({ value }) => (
      <Chip
        size="small"
        label={value === "A" ? "ACTIVE" : value === "I" ? "INACTIVE" : value || "—"}
        color={value === "A" ? "success" : value === "I" ? "error" : "default"}
      />
    ),
  },
  {
    field: "safer_enriched",
    headerName: "SAFER",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: ({ value }) => (
      <Chip
        size="small"
        label={value ? "ENRICHED" : "PENDING"}
        color={value ? "success" : "default"}
        variant={value ? "filled" : "outlined"}
      />
    ),
  },
];

// ---------------------------------------------------------------------------
// Empty state overlays
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  variant: "empty" | "search" | "filters" | "error";
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

const EmptyOverlay: React.FC<EmptyStateProps> = ({
  variant,
  onClearSearch,
  onClearFilters,
  onRetry,
}) => {
  const configs = {
    empty: {
      Icon: LocalShippingRoundedIcon,
      heading: "No carriers yet",
      body: "No carriers have been loaded into the database.",
      cta: null,
    },
    search: {
      Icon: SearchOffRoundedIcon,
      heading: "No results found",
      body: "Try adjusting your search term.",
      cta: (
        <Button variant="outlined" size="small" onClick={onClearSearch}>
          Clear search
        </Button>
      ),
    },
    filters: {
      Icon: FilterAltOffRoundedIcon,
      heading: "No matching carriers",
      body: "No carriers match the current filters.",
      cta: (
        <Button variant="outlined" size="small" onClick={onClearFilters}>
          Clear all filters
        </Button>
      ),
    },
    error: {
      Icon: ErrorRoundedIcon,
      heading: "Unable to load data",
      body: "There was a problem loading carrier data.",
      cta: (
        <Button variant="contained" size="small" onClick={onRetry}>
          Try again
        </Button>
      ),
    },
  };

  const { Icon, heading, body, cta } = configs[variant];

  return (
    <Box
      sx={{
        textAlign: "center",
        py: 5,
        px: 2.5,
        color: "text.disabled",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        sx={{
          fontSize: 48,
          mb: 1.5,
          color: variant === "error" ? "error.main" : "text.disabled",
        }}
      />
      <Typography
        variant="h5"
        sx={{ color: "text.secondary", mb: 0.75, fontWeight: 600 }}
      >
        {heading}
      </Typography>
      <Typography variant="body2" sx={{ mb: cta ? 2 : 0 }}>
        {body}
      </Typography>
      {cta}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const CarrierList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialise filter state from URL params (read-once on mount).
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState(
    () => searchParams.get("state") ?? ""
  );
  const [minDrivers, setMinDrivers] = useState<number | "">(
    () => {
      const v = searchParams.get("min_drivers");
      return v !== null ? Math.max(0, Number(v)) : 20;
    }
  );
  const [emailOnly, setEmailOnly] = useState(
    () => searchParams.get("has_email") === "true"
  );
  // safer_enriched=false → show only not-yet-enriched carriers (server-side eq:false)
  const [saferUnenriched, setSaferUnenriched] = useState(
    () => searchParams.get("safer_enriched") === "false"
  );

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { dataGridProps, tableQuery, setFilters } = useDataGrid<CarrierRow>({
    resource: "carriers",
    filters: {
      initial: [
        { field: "census_status", operator: "eq", value: "A" },
        { field: "drivers", operator: "gte", value: 20 },
        ...(emailOnly ? [{ field: "email", operator: "nnull", value: null } as const] : []),
        ...(saferUnenriched ? [{ field: "safer_enriched", operator: "eq", value: false } as const] : []),
      ],
    },
    // sort=drivers_desc is the default; honour it explicitly when param is set
    sorters: { initial: [{ field: "drivers", order: "desc" }] },
    pagination: { pageSize: 20 },
  });

  // ── Export — paginated via data provider ─────────────────────────────────
  const getDataProvider = useDataProvider();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportFilters = useMemo((): CrudFilter[] => {
    const f: CrudFilter[] = [
      { field: "census_status", operator: "eq", value: "A" },
    ];
    if (minDrivers !== "" && Number(minDrivers) > 0)
      f.push({ field: "drivers", operator: "gte", value: Number(minDrivers) });
    if (stateFilter.trim())
      f.push({ field: "phy_state", operator: "eq", value: stateFilter.trim().toUpperCase() });
    if (emailOnly)
      f.push({ field: "email", operator: "nnull", value: null });
    if (saferUnenriched)
      f.push({ field: "safer_enriched", operator: "eq", value: false });
    if (debouncedSearch.trim())
      f.push({ field: "search", operator: "eq", value: debouncedSearch.trim() });
    return f;
  }, [stateFilter, minDrivers, emailOnly, saferUnenriched, debouncedSearch]);

  const EXPORT_PAGE_SIZE = 1000;
  const EXPORT_MAX_ROWS = 10000;

  const handleExport = async () => {
    if (rowCount === 0 || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const provider = getDataProvider();
      const allRows: CarrierRow[] = [];
      let page = 1;

      while (allRows.length < EXPORT_MAX_ROWS) {
        const result = await provider.getList<CarrierRow>({
          resource: "carriers",
          filters: exportFilters,
          sorters: [{ field: "drivers", order: "desc" }],
          pagination: { current: page, pageSize: EXPORT_PAGE_SIZE, mode: "server" },
        });
        const rows = result.data ?? [];
        if (rows.length === 0) break;
        allRows.push(...rows);
        if (rows.length < EXPORT_PAGE_SIZE) break; // last page
        page++;
      }

      const capped = allRows.slice(0, EXPORT_MAX_ROWS);
      if (capped.length > 0) {
        triggerCsvDownload(capped);
      }
      if (allRows.length >= EXPORT_MAX_ROWS) {
        setExportError(
          `Export capped at ${EXPORT_MAX_ROWS.toLocaleString()} rows. Apply filters to narrow your results.`
        );
      }
    } catch (err) {
      console.error("CSV export failed:", err);
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Sync controlled filter state → Refine hook ───────────────────────────
  const mountRef = useRef(false);
  useEffect(() => {
    if (!mountRef.current) {
      // Skip the first synchronous render; initial filters above handle it.
      mountRef.current = true;
      return;
    }
    const next: CrudFilter[] = [
      { field: "census_status", operator: "eq", value: "A" },
    ];
    if (minDrivers !== "" && Number(minDrivers) > 0) {
      next.push({ field: "drivers", operator: "gte", value: Number(minDrivers) });
    }
    if (stateFilter.trim()) {
      next.push({ field: "phy_state", operator: "eq", value: stateFilter.trim().toUpperCase() });
    }
    if (emailOnly) {
      next.push({ field: "email", operator: "nnull", value: null });
    }
    // safer_enriched=false: server-side eq:false filter.
    // Note: matches rows where safer_enriched IS false; rows with NULL are excluded
    // by this filter. All current seeded rows use explicit false, so this is safe.
    if (saferUnenriched) {
      next.push({ field: "safer_enriched", operator: "eq", value: false });
    }
    if (debouncedSearch.trim()) {
      next.push({ field: "search", operator: "eq", value: debouncedSearch.trim() });
    }
    setFilters(next, "replace");
  }, [debouncedSearch, stateFilter, minDrivers, emailOnly, saferUnenriched, setFilters]);

  // Active filter chips (user-set non-default ones)
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];
    if (stateFilter)
      chips.push({
        key: "state",
        label: `State: ${stateFilter.toUpperCase()}`,
        onDelete: () => setStateFilter(""),
      });
    if (emailOnly)
      chips.push({
        key: "email",
        label: "Email: available only",
        onDelete: () => setEmailOnly(false),
      });
    if (minDrivers !== "" && Number(minDrivers) !== 20)
      chips.push({
        key: "drivers",
        label: `Drivers ≥ ${minDrivers}`,
        onDelete: () => setMinDrivers(20),
      });
    if (saferUnenriched)
      chips.push({
        key: "safer",
        label: "SAFER: not enriched",
        onDelete: () => setSaferUnenriched(false),
      });
    return chips;
  }, [stateFilter, emailOnly, minDrivers, saferUnenriched]);

  const clearAllFilters = () => {
    setStateFilter("");
    setEmailOnly(false);
    setMinDrivers(20);
    setSaferUnenriched(false);
  };

  const clearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
  };

  const hasSearch = !!debouncedSearch.trim();
  const hasUserFilters = activeChips.length > 0;

  const { isLoading, isError } = tableQuery;
  const rowCount = dataGridProps.rowCount ?? 0;

  const emptyVariant: EmptyStateProps["variant"] = isError
    ? "error"
    : hasSearch
    ? "search"
    : hasUserFilters
    ? "filters"
    : "empty";

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Page header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.25 }}>
            Carrier Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoading
              ? "Loading…"
              : `${rowCount.toLocaleString()} carrier${rowCount !== 1 ? "s" : ""} found`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadRoundedIcon />}
          onClick={handleExport}
          disabled={isLoading || rowCount === 0 || exporting}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </Stack>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 1.5 }}
        flexWrap="wrap"
      >
        {/* Full-text search */}
        <TextField
          size="small"
          placeholder="Search company name or USDOT…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />

        {/* State filter */}
        <TextField
          size="small"
          label="State"
          placeholder="e.g. TX"
          value={stateFilter}
          onChange={(e) =>
            setStateFilter(e.target.value.slice(0, 2).toUpperCase())
          }
          sx={{ width: { xs: "100%", sm: 90 } }}
          inputProps={{ maxLength: 2, style: { textTransform: "uppercase" } }}
        />

        {/* Min drivers */}
        <TextField
          size="small"
          label="Min Drivers"
          type="number"
          value={minDrivers}
          onChange={(e) =>
            setMinDrivers(
              e.target.value === "" ? "" : Math.max(0, Number(e.target.value))
            )
          }
          sx={{ width: { xs: "100%", sm: 110 } }}
          inputProps={{ min: 0 }}
        />

        {/* Email toggle */}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={emailOnly}
              onChange={(e) => setEmailOnly(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">Email available</Typography>
          }
          sx={{ ml: 0.5, whiteSpace: "nowrap" }}
        />
      </Stack>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              variant="outlined"
              color="primary"
              size="small"
              label={chip.label}
              onDelete={chip.onDelete}
            />
          ))}
          <Button
            size="small"
            variant="text"
            onClick={clearAllFilters}
            sx={{ ml: 0.5 }}
          >
            Clear all
          </Button>
        </Stack>
      )}

      {/* Export error */}
      {exportError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          onClose={() => setExportError(null)}
        >
          {exportError}
        </Alert>
      )}

      {/* Error alert */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              color="error"
              onClick={() => tableQuery.refetch()}
            >
              Retry
            </Button>
          }
        >
          Unable to load carrier data.
        </Alert>
      )}

      {/* Data grid */}
      <Box
        sx={{
          height: "calc(100vh - 280px)",
          minHeight: 400,
          width: "100%",
        }}
      >
        <DataGrid
          {...dataGridProps}
          columns={COLUMNS}
          disableRowSelectionOnClick
          disableColumnMenu
          pageSizeOptions={[10, 20, 50, 100]}
          density="compact"
          onRowClick={({ row }) => navigate(`/carriers/show/${row.id}`)}
          slots={{
            noRowsOverlay: () => (
              <EmptyOverlay
                variant={emptyVariant}
                onClearSearch={clearSearch}
                onClearFilters={clearAllFilters}
                onRetry={() => tableQuery.refetch()}
              />
            ),
            ...dataGridProps.slots,
          }}
          sx={{
            border: 0,
            borderRadius: 1,
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: 1,
              borderColor: "divider",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: 1,
              borderColor: "divider",
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
          }}
        />
      </Box>
    </Container>
  );
};

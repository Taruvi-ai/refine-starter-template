import { useEffect, useMemo, useState } from "react";
import { useList, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
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
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  ActiveFilterChips,
  CategoryChip,
  EMPLOYEE_EDIT_RESUBMIT_STATUSES,
  EmptyState,
  KAIZEN_STATUSES,
  KaizenTitleText,
  StatusChip,
  emptyValue,
  formatDate,
  formatFteSaving,
  kaizenReferenceLabel,
  useDebouncedValue,
  useKaizenRoles,
  type KaizenIdea,
} from "./shared";
import { calculateConfiguredFteSaving, useBenefitCalculationConfigs, useDropdownOptions, useViewFieldConfigs } from "../settings/shared";

const SUBMITTED_KAIZEN_FILTERS: CrudFilters = [
  { field: "kaizen_id", operator: "nnull", value: true },
  { field: "status", operator: "ne", value: "Draft" },
];

const PROGRAM_HIDDEN_STATUS_FILTERS = new Set(["Draft", "Withdrawn"]);

const PROGRAM_STATUS_OPTIONS = KAIZEN_STATUSES.filter((item) => !PROGRAM_HIDDEN_STATUS_FILTERS.has(item));

type KaizenBackendFilterNode =
  | Record<string, unknown>
  | { and: KaizenBackendFilterNode[] }
  | { or: KaizenBackendFilterNode[] };

const KAIZEN_LIST_SEARCH_FIELDS = ["kaizen_id", "title"] as const;

const backendFilterTree = (nodes: KaizenBackendFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const dateInputStart = (value: string) => value ? `${value}T00:00:00` : "";

const dateInputNextDayStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  const date = new Date(year, month - 1, day + 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}T00:00:00`;
};

const formatDateInputLabel = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "-";
  return formatDate(new Date(year, month - 1, day).toISOString());
};

const displayedDateRangeNodes = (dateFrom: string, dateTo: string): KaizenBackendFilterNode[] => {
  const fromStart = dateInputStart(dateFrom);
  const toNextStart = dateInputNextDayStart(dateTo);
  const nodes: KaizenBackendFilterNode[] = [];

  if (fromStart) {
    nodes.push({
      or: [
        { submitted_at__gte: fromStart },
        { and: [{ submitted_at__null: true }, { created_at__gte: fromStart }] },
      ],
    });
  }

  if (toNextStart) {
    nodes.push({
      or: [
        { submitted_at__lt: toNextStart },
        { and: [{ submitted_at__null: true }, { created_at__lt: toNextStart }] },
      ],
    });
  }

  return nodes;
};

const kaizenListBackendFilters = (term: string, dateFrom: string, dateTo: string): CrudFilters => {
  const nodes: KaizenBackendFilterNode[] = [];
  const query = term.trim();

  if (query) {
    nodes.push({
      or: KAIZEN_LIST_SEARCH_FIELDS.map((field) => ({ [`${field}__icontains`]: query })),
    });
  }

  nodes.push(...displayedDateRangeNodes(dateFrom, dateTo));

  return backendFilterTree(nodes);
};

const isRowControlTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest("button,a,input,select,textarea,[role='button']"));

const canEmployeeEditFromList = (row: KaizenIdea) =>
  Boolean(row.is_draft || EMPLOYEE_EDIT_RESUBMIT_STATUSES.includes(row.status as (typeof EMPLOYEE_EDIT_RESUBMIT_STATUSES)[number]));

const employeeEditActionTitle = (row: KaizenIdea) =>
  row.status === "Withdrawn"
    ? "Edit and resubmit withdrawn Kaizen"
    : row.status === "Rejected" || row.status === "Resubmitted"
      ? "Resubmit"
      : "Edit draft";

export const KaizenList = () => {
  const navigate = useNavigate();
  const roles = useKaizenRoles();
  const { identity } = roles;
  const isProgramList = roles.isPeQa || roles.isOmSom;
  const canSubmitKaizen = roles.canSubmitKaizen;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search);
  const { options: categoryOptions } = useDropdownOptions("category");
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const { fields: listFields, labels: listFieldLabels } = useViewFieldConfigs("kaizen_list");
  const statusOptions = isProgramList ? PROGRAM_STATUS_OPTIONS : KAIZEN_STATUSES;

  useEffect(() => {
    if (status && !(statusOptions as readonly string[]).includes(status)) {
      setStatus("");
      setPage(0);
    }
  }, [status, statusOptions]);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (isProgramList) {
      next.push(...SUBMITTED_KAIZEN_FILTERS);
    } else {
      if (identity?.username) {
        next.push({ field: "submitted_by_username", operator: "eq", value: identity.username });
      } else {
        next.push({ field: "id", operator: "eq", value: "__missing_identity__" });
      }
    }
    next.push(...kaizenListBackendFilters(debouncedSearch, dateFrom, dateTo));
    if (status) next.push({ field: "status", operator: "eq", value: status });
    if (category) next.push({ field: "category", operator: "eq", value: category });
    return next;
  }, [category, dateFrom, dateTo, debouncedSearch, identity?.username, isProgramList, status]);

  const { result, query } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
  });

  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const tableColumnCount = listFields.length + 1;
  const hasFilter = Boolean(status || category || dateFrom || dateTo);
  const activeFilters = [
    status ? { key: "status", label: `Status: ${status}` } : null,
    category ? { key: "category", label: `Category: ${category}` } : null,
    dateFrom ? { key: "dateFrom", label: `From: ${formatDateInputLabel(dateFrom)}` } : null,
    dateTo ? { key: "dateTo", label: `To: ${formatDateInputLabel(dateTo)}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilter = (key: string) => {
    if (key === "status") setStatus("");
    if (key === "category") setCategory("");
    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
    setPage(0);
  };

  const clearAllFilters = () => {
    setStatus("");
    setCategory("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const openKaizen = (id: string) => {
    navigate(`/kaizens/show/${id}`);
  };

  const emptyState = () => {
    if (query.isError) {
      return (
        <EmptyState
          kind="error"
          title="Unable to load data"
          body={isProgramList ? "There was a problem loading Kaizen submissions" : "There was a problem loading your submissions"}
          action={<Button variant="contained" onClick={() => query.refetch()}>Try again</Button>}
        />
      );
    }
    if (debouncedSearch.trim()) {
      return (
        <EmptyState
          kind="no-results"
          title="No results found"
          body="Try adjusting your search or filter"
          action={<Button variant="outlined" onClick={() => setSearch("")}>Clear search</Button>}
        />
      );
    }
    if (hasFilter) {
      return (
        <EmptyState
          kind="no-matches"
          title="No matching items"
          body="No submissions match the current filters"
          action={<Button variant="outlined" onClick={clearAllFilters}>Clear all filters</Button>}
        />
      );
    }
    return (
      <EmptyState
        kind="no-data"
        title="No Kaizens yet"
        body={isProgramList ? "Submitted Kaizens will appear here" : "Get started by submitting your first improvement idea"}
        action={canSubmitKaizen ? <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/kaizens/create")}>Create Kaizen</Button> : undefined}
      />
    );
  };

  const numericListFields = new Set(["fte_saving", "hours_saved"]);
  const renderListCell = (field: string, row: KaizenIdea) => {
    if (field === "title") {
      return (
        <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
          <KaizenTitleText title={row.title} />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {kaizenReferenceLabel(row)}
          </Typography>
        </Box>
      );
    }
    if (field === "status") return <StatusChip status={row.status} />;
    if (field === "category") return <CategoryChip category={row.category} />;
    if (field === "submitted_at") return formatDate(row.submitted_at || row.created_at);
    if (field === "fte_saving") return formatFteSaving(row.fte_saving ?? calculateConfiguredFteSaving(row, benefitCalculationConfigs));
    if (field === "hours_saved") return formatFteSaving(row.hours_saved);
    const value = (row as unknown as Record<string, unknown>)[field];
    return emptyValue(value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h2">{isProgramList ? "All Kaizens" : "My Kaizens"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isProgramList
              ? "Search and inspect every Kaizen submission, approval, rejection, reward, and certificate."
              : "Track drafts, submissions, approvals, rejections, rewards, and certificates."}
          </Typography>
        </Box>
        {canSubmitKaizen ? (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/kaizens/create")}>
            Create Kaizen
          </Button>
        ) : null}
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
              <TextField
                size="small"
                placeholder="Search Kaizen ID or title"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")}>
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{ width: { xs: "100%", md: 320 } }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel shrink>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  displayEmpty
                  renderValue={(selected) => {
                    const value = String(selected ?? "");
                    return value || "All statuses";
                  }}
                  onChange={(event) => { setStatus(event.target.value); setPage(0); }}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  {statusOptions.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel shrink>Category</InputLabel>
                <Select
                  label="Category"
                  value={category}
                  displayEmpty
                  renderValue={(selected) => {
                    const value = String(selected ?? "");
                    return categoryOptions.find((item) => item.value === value)?.label || "All categories";
                  }}
                  onChange={(event) => { setCategory(event.target.value); setPage(0); }}
                >
                  <MenuItem value="">All categories</MenuItem>
                  {categoryOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="From"
                type="date"
                value={dateFrom}
                onChange={(event) => { setDateFrom(event.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="To"
                type="date"
                value={dateTo}
                onChange={(event) => { setDateTo(event.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <ActiveFilterChips filters={activeFilters} onDelete={clearFilter} onClear={clearAllFilters} />

            {query.isFetching && !query.isLoading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Loading data...</Typography>
              </Stack>
            )}

            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {listFields.map((field) => (
                      <TableCell key={field} align={numericListFields.has(field) ? "right" : "left"} sx={field === "title" ? { width: { xs: 280, md: "42%" }, maxWidth: 520 } : undefined}>
                        {listFieldLabels[field] ?? field}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ width: 96, whiteSpace: "nowrap" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.isLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: tableColumnCount }).map((__, cellIndex) => (
                            <TableCell key={cellIndex}><Skeleton variant="text" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    : rows.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          onDoubleClick={(event) => {
                            if (isRowControlTarget(event.target)) return;
                            openKaizen(row.id);
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          {listFields.map((field) => (
                            <TableCell key={field} align={numericListFields.has(field) ? "right" : "left"} sx={field === "title" ? { minWidth: 260, maxWidth: 520 } : undefined}>
                              {renderListCell(field, row)}
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ width: 96, whiteSpace: "nowrap" }}>
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => openKaizen(row.id)}>
                                <VisibilityRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canSubmitKaizen && canEmployeeEditFromList(row) ? (
                              <Tooltip title={employeeEditActionTitle(row)}>
                                <IconButton size="small" onClick={() => navigate(`/kaizens/edit/${row.id}`)}>
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                  {!query.isLoading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={tableColumnCount}>{emptyState()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[10, 20, 50, 100]}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

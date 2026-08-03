import { useMemo, useState } from "react";
import { useList, useNotification, type CrudFilters } from "@refinedev/core";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
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
import Typography from "@mui/material/Typography";
import { executeFunction } from "../../utils/functionHelpers";
import {
  AccessDenied,
  ActiveFilterChips,
  EmptyState,
  StatusChip,
  emptyValue,
  formatDate,
  useDebouncedValue,
  useKaizenRoles,
} from "../kaizens/shared";

type UserRow = {
  id: string;
  username: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_staff?: boolean;
  date_joined?: string | null;
  attributes?: Record<string, unknown>;
};

type RoleOption = {
  label: string;
  slug: string;
};

type RoleAuditRow = {
  id: string;
  target_username?: string | null;
  target_email?: string | null;
  previous_roles?: string[] | null;
  new_roles?: string[] | null;
  admin_username?: string | null;
  change_type?: string | null;
  comments?: string | null;
  created_at?: string | null;
};

const ROLE_OPTIONS: RoleOption[] = [
  { label: "Employee", slug: "kaizen_prasun-employee" },
  { label: "Lead/Manager", slug: "kaizen_prasun-leadmanager" },
  { label: "OM/SOM", slug: "kaizen_prasun-omsom" },
  { label: "PE/QA", slug: "kaizen_prasun-peqa" },
  { label: "Executive View", slug: "kaizen_prasun-admin" },
];

const AUDIT_PAGINATION = { currentPage: 1, pageSize: 10 };
const AUDIT_SORTERS = [{ field: "created_at", order: "desc" as const }];

const formatTimestamp = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatRoleList = (roles?: string[] | null) => {
  if (!roles || roles.length === 0) return "-";
  return roles.join(", ");
};

const parseCsv = (text: string) => {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim());
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
    return {
      username: row.username,
      role_slugs: row.role_slugs.split(/[|;]/).map((role) => role.trim()).filter(Boolean),
      is_active: row.is_active ? row.is_active.toLowerCase() !== "false" : undefined,
      attributes: {
        employee_id: row.employee_id,
        department_code: row.department_code,
        department_name: row.department_name,
        manager_username: row.manager_username,
        manager_email: row.manager_email,
        reporting_manager_username: row.manager_username,
        reporting_manager_email: row.manager_email,
        client_code: row.client_code,
        client_name: row.client_name,
        designation: row.designation,
        process_name: row.process_name,
        kaizen_role: row.kaizen_role,
        is_profile_complete: true,
      },
      comments: "Bulk CSV role assignment",
      change_type: "Bulk CSV",
    };
  });
};

export const AdminUsersPage = () => {
  const roles = useKaizenRoles();
  const { open } = useNotification();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [roleSlug, setRoleSlug] = useState(ROLE_OPTIONS[0].slug);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const adminQueryOptions = useMemo(() => ({ enabled: roles.isAdmin }), [roles.isAdmin]);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (debouncedSearch.trim()) next.push({ field: "search", operator: "eq", value: debouncedSearch.trim() });
    if (activeFilter !== "all") next.push({ field: "is_active", operator: "eq", value: activeFilter === "true" });
    return next;
  }, [activeFilter, debouncedSearch]);

  const { result, query } = useList<UserRow>({
    resource: "users",
    dataProviderName: "user",
    filters,
    sorters: [{ field: "username", order: "asc" }],
    pagination: { currentPage: page + 1, pageSize },
    queryOptions: adminQueryOptions,
  });

  const { result: auditResult, query: auditQuery } = useList<RoleAuditRow>({
    resource: "kaizen_role_change_audits",
    sorters: AUDIT_SORTERS,
    pagination: AUDIT_PAGINATION,
    queryOptions: adminQueryOptions,
  });

  if (!roles.isAdmin) return <AccessDenied title="Executive view access required" />;

  const users = result.data ?? [];
  const total = result.total ?? 0;
  const activeFilters = activeFilter !== "all" ? [{ key: "active", label: `Status: ${activeFilter === "true" ? "Active" : "Inactive"}` }] : [];

  const openManage = (user: UserRow) => {
    const userAttrs = user.attributes ?? {};
    setSelected(user);
    setIsActive(Boolean(user.is_active));
    setRoleSlug(String(userAttrs.role_slugs instanceof Array ? userAttrs.role_slugs[0] : ROLE_OPTIONS[0].slug));
    setAttributes({
      employee_id: String(userAttrs.employee_id ?? ""),
      department_code: String(userAttrs.department_code ?? ""),
      department_name: String(userAttrs.department_name ?? ""),
      manager_username: String(userAttrs.manager_username ?? userAttrs.reporting_manager_username ?? ""),
      manager_email: String(userAttrs.manager_email ?? userAttrs.reporting_manager_email ?? ""),
      client_code: String(userAttrs.client_code ?? ""),
      client_name: String(userAttrs.client_name ?? ""),
      designation: String(userAttrs.designation ?? ""),
      process_name: String(userAttrs.process_name ?? ""),
      kaizen_role: String(userAttrs.kaizen_role ?? "Employee"),
    });
  };

  const saveSingle = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-update-user-role", {
        username: selected.username,
        email: selected.email,
        role_slugs: [roleSlug],
        is_active: isActive,
        attributes: {
          ...attributes,
          reporting_manager_username: attributes.manager_username,
          reporting_manager_email: attributes.manager_email,
          role_slugs: [roleSlug],
          is_profile_complete: true,
        },
        comments: "Updated from Kaizen executive role manager",
        portal_base_url: window.location.origin + "/admin/users",
      });
      if (!response.success) throw new Error(response.error || "Role update failed");
      open?.({ type: "success", message: "User updated", description: `${selected.username} was updated.` });
      setSelected(null);
      query.refetch();
      auditQuery.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to update user", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveBulk = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      open?.({ type: "error", message: "CSV is empty", description: "Upload a CSV with a username column." });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await executeFunction<{ success_count: number; failed_count: number }>("kaizen-update-user-role", { rows });
      open?.({ type: "success", message: "Bulk assignment complete", description: `${response.success_count} updated, ${response.failed_count} failed.` });
      setCsvText("");
      query.refetch();
      auditQuery.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to process CSV", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2">User Roles</Typography>
          <Typography variant="body2" color="text.secondary">Search platform users, map profile attributes, assign Kaizen roles, and audit every change.</Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  size="small"
                  placeholder="Search users"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
                    endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><CloseRoundedIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
                  }}
                  sx={{ width: { xs: "100%", md: 320 } }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(0); }}>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                    <MenuItem value="all">All users</MenuItem>
                  </Select>
                </FormControl>
                <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
                  Upload CSV
                  <input
                    hidden
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      file.text().then(setCsvText);
                    }}
                  />
                </Button>
              </Stack>
              <ActiveFilterChips filters={activeFilters} onDelete={() => setActiveFilter("all")} onClear={() => setActiveFilter("all")} />

              {csvText && (
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                  <TextField label="CSV Preview" value={csvText} onChange={(event) => setCsvText(event.target.value)} multiline rows={4} fullWidth />
                  <Stack direction="row" spacing={1.25} sx={{ justifyContent: "flex-end", mt: 2 }}>
                    <Button variant="outlined" onClick={() => setCsvText("")}>Cancel</Button>
                    <Button variant="contained" startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : <UploadFileRoundedIcon />} disabled={isSubmitting} onClick={saveBulk}>
                      Apply CSV
                    </Button>
                  </Stack>
                </Box>
              )}

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Kaizen Role</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.isLoading ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>
                    )) : users.map((user) => {
                      const userAttrs = user.attributes ?? {};
                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.username}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                          </TableCell>
                          <TableCell><StatusChip status={user.is_active ? "Approved" : "Rejected"} /></TableCell>
                          <TableCell>{emptyValue(userAttrs.kaizen_role)}</TableCell>
                          <TableCell>{emptyValue(userAttrs.department_name)}</TableCell>
                          <TableCell>{emptyValue(userAttrs.manager_username)}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" startIcon={<ManageAccountsRoundedIcon />} onClick={() => openManage(user)}>Manage</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!query.isLoading && users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          {query.isError ? (
                            <EmptyState kind="error" title="Unable to load data" body="There was a problem loading users" action={<Button variant="contained" onClick={() => query.refetch()}>Try again</Button>} />
                          ) : debouncedSearch ? (
                            <EmptyState kind="no-results" title="No results found" body="Try adjusting your search or filter" action={<Button variant="outlined" onClick={() => setSearch("")}>Clear search</Button>} />
                          ) : activeFilters.length > 0 ? (
                            <EmptyState kind="no-matches" title="No matching items" body="No users match the current filters" action={<Button variant="outlined" onClick={() => setActiveFilter("all")}>Clear all filters</Button>} />
                          ) : (
                            <EmptyState kind="no-data" title="No users yet" body="Registered users will appear here" />
                          )}
                        </TableCell>
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
                onPageChange={(_, next) => setPage(next)}
                onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h3">Role Change Audit</Typography>
                <Typography variant="body2" color="text.secondary">
                  Timestamped history of profile, status, and role changes made from the Kaizen role manager.
                </Typography>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Changed User</TableCell>
                      <TableCell>Change Type</TableCell>
                      <TableCell>New Roles</TableCell>
                      <TableCell>Changed By</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditQuery.isLoading ? Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>{Array.from({ length: 5 }).map((__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>
                    )) : (auditResult.data ?? []).map((audit) => (
                      <TableRow key={audit.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyValue(audit.target_username)}</Typography>
                          <Typography variant="caption" color="text.secondary">{emptyValue(audit.target_email)}</Typography>
                        </TableCell>
                        <TableCell><StatusChip status={audit.change_type || "Single"} /></TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatRoleList(audit.new_roles)}</Typography>
                          <Typography variant="caption" color="text.secondary">Previous: {formatRoleList(audit.previous_roles)}</Typography>
                        </TableCell>
                        <TableCell>{emptyValue(audit.admin_username)}</TableCell>
                        <TableCell>{formatTimestamp(audit.created_at)}</TableCell>
                      </TableRow>
                    ))}
                    {!auditQuery.isLoading && (auditResult.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          {auditQuery.isError ? (
                            <EmptyState kind="error" title="Unable to load data" body="There was a problem loading role-change audits" action={<Button variant="contained" onClick={() => auditQuery.refetch()}>Try again</Button>} />
                          ) : (
                            <EmptyState kind="no-data" title="No role changes yet" body="Role assignment and profile updates will appear here" />
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

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage user role</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">{selected?.username}</Typography>
            <FormControl fullWidth>
              <InputLabel>Kaizen Role</InputLabel>
              <Select label="Kaizen Role" value={roleSlug} onChange={(event) => {
                const nextRole = ROLE_OPTIONS.find((role) => role.slug === event.target.value);
                setRoleSlug(event.target.value);
                setAttributes((current) => ({ ...current, kaizen_role: nextRole?.label ?? current.kaizen_role }));
              }}>
                {ROLE_OPTIONS.map((role) => <MenuItem key={role.slug} value={role.slug}>{role.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={String(isActive)} onChange={(event) => setIsActive(event.target.value === "true")}>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Employee ID" value={attributes.employee_id ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, employee_id: event.target.value }))} fullWidth />
              <TextField label="Designation" value={attributes.designation ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, designation: event.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Department Code" value={attributes.department_code ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, department_code: event.target.value }))} fullWidth />
              <TextField label="Department Name" value={attributes.department_name ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, department_name: event.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Manager Username" value={attributes.manager_username ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, manager_username: event.target.value }))} fullWidth />
              <TextField label="Manager Email" type="email" value={attributes.manager_email ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, manager_email: event.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Client Code" value={attributes.client_code ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, client_code: event.target.value }))} fullWidth />
              <TextField label="Client Name" value={attributes.client_name ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, client_name: event.target.value }))} fullWidth />
            </Stack>
            <TextField label="Process Name" value={attributes.process_name ?? ""} onChange={(event) => setAttributes((current) => ({ ...current, process_name: event.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelected(null)}>Cancel</Button>
          <Button variant="contained" startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : <ManageAccountsRoundedIcon />} disabled={isSubmitting} onClick={saveSingle}>
            Save user
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

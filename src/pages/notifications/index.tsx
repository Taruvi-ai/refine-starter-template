import { useMemo, useState } from "react";
import { useList, useNotification, useUpdate, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
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
import {
  ActiveFilterChips,
  EmptyState,
  StatusChip,
  emptyValue,
  formatDate,
  useDebouncedValue,
  useKaizenRoles,
  type NotificationRow,
} from "../kaizens/shared";

const NOTIFICATION_TYPES = [
  "Submission",
  "Approval",
  "Rejection",
  "Impact Update",
  "Audit Closure",
  "Certificate Generation",
  "Role Change",
  "Reminder",
  "Report",
  "Incentive Approval",
  "Resource Update",
  "Withdrawal",
  "Reactivation",
  "SLA Breach",
  "Bulk Operation",
  "Preference Test",
  "Evidence Request",
  "Evidence Verification",
  "Benchmark Report",
  "Dashboard Update",
];

const DELETED_NOTIFICATION_STATUS = "Deleted";
const NOTIFICATION_STATUS_OPTIONS = ["Unread", "Read", DELETED_NOTIFICATION_STATUS, "Queued", "Sent", "Failed", "Skipped"];
const HIDDEN_NOTIFICATION_KAIZEN_STATUSES = ["Draft", "Withdrawn"] as const;

type NotificationBackendFilterNode =
  | Record<string, unknown>
  | { and: NotificationBackendFilterNode[] }
  | { or: NotificationBackendFilterNode[] };

const notificationBackendFilterTree = (nodes: NotificationBackendFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { open } = useNotification();
  const { mutate: updateNotification, mutation: updateMutation } = useUpdate();
  const roles = useKaizenRoles();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search);
  const canLoadNotifications = roles.isAdmin || Boolean(roles.identity?.username);

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [
      ...notificationBackendFilterTree([
        {
          or: [
            { idea_id__null: true },
            { "idea_id.status__nin": HIDDEN_NOTIFICATION_KAIZEN_STATUSES },
          ],
        },
      ]),
    ];
    if (!roles.isAdmin) {
      next.push({
        field: "recipient_username",
        operator: "eq",
        value: roles.identity?.username ?? "__missing_authenticated_user__",
      });
    }
    if (debouncedSearch.trim()) next.push({ field: "search", operator: "eq", value: debouncedSearch.trim() });
    if (type) next.push({ field: "notification_type", operator: "eq", value: type });
    if (status) {
      next.push({ field: "status", operator: "eq", value: status });
    } else {
      next.push({ field: "status", operator: "ne", value: DELETED_NOTIFICATION_STATUS });
    }
    return next;
  }, [debouncedSearch, roles.identity?.username, roles.isAdmin, status, type]);

  const { result, query } = useList<NotificationRow>({
    resource: "kaizen_notifications",
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { currentPage: page + 1, pageSize },
    queryOptions: { enabled: canLoadNotifications },
  });

  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const activeFilters = [
    type ? { key: "type", label: `Type: ${type}` } : null,
    status ? { key: "status", label: `Status: ${status}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilter = (key: string) => {
    if (key === "type") setType("");
    if (key === "status") setStatus("");
    setPage(0);
  };

  const clearAllFilters = () => {
    setType("");
    setStatus("");
    setPage(0);
  };

  const updateNotificationStatus = (row: NotificationRow, nextStatus: string) => {
    updateNotification(
      {
        resource: "kaizen_notifications",
        id: row.id,
        values: { status: nextStatus },
      },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Notification updated", description: `Status changed to ${nextStatus}.` });
          query.refetch();
        },
        onError: (error) => {
          open?.({ type: "error", message: "Unable to update notification", description: error.message });
        },
      },
    );
  };

  const deleteNotification = () => {
    if (!deleteTarget) return;
    updateNotification(
      {
        resource: "kaizen_notifications",
        id: deleteTarget.id,
        values: { status: DELETED_NOTIFICATION_STATUS },
      },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Notification deleted", description: "The notification was removed from the active list." });
          setDeleteTarget(null);
          if (status === DELETED_NOTIFICATION_STATUS || rows.length > 1 || page === 0) {
            query.refetch();
          } else {
            setPage((current) => Math.max(0, current - 1));
          }
        },
        onError: (error) => {
          open?.({ type: "error", message: "Unable to delete notification", description: error.message });
        },
      },
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h2">Notifications</Typography>
            <Typography variant="body2" color="text.secondary">Deduplicated notification outbox for Kaizen status changes, SLA breaches, withdrawals, evidence, and dashboard updates.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<SettingsRoundedIcon />} onClick={() => navigate("/notification-settings")}>
            Settings
          </Button>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  size="small"
                  placeholder="Search notifications"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
                    endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><CloseRoundedIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
                  }}
                  sx={{ width: { xs: "100%", md: 320 } }}
                />
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}>
                    <MenuItem value="">All types</MenuItem>
                    {NOTIFICATION_TYPES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
                    <MenuItem value="">Active statuses</MenuItem>
                    {NOTIFICATION_STATUS_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <ActiveFilterChips filters={activeFilters} onDelete={clearFilter} onClear={clearAllFilters} />

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.isLoading ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>
                    )) : rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.subject}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.direct_link}</Typography>
                        </TableCell>
                        <TableCell>{emptyValue(row.recipient_email || row.recipient_username)}</TableCell>
                        <TableCell>{emptyValue(row.notification_type)}</TableCell>
                        <TableCell><StatusChip status={row.status} /></TableCell>
                        <TableCell>{formatDate(row.created_at)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {row.idea_id ? (
                              <Button size="small" variant="text" onClick={() => navigate(`/kaizens/show/${row.idea_id}`)}>Open</Button>
                            ) : null}
                            {row.status !== DELETED_NOTIFICATION_STATUS ? (
                              <>
                                {row.status !== "Read" ? (
                                  <Button size="small" variant="text" startIcon={<MarkEmailReadRoundedIcon />} disabled={updateMutation.isPending} onClick={() => updateNotificationStatus(row, "Read")}>Read</Button>
                                ) : (
                                  <Button size="small" variant="text" startIcon={<MarkEmailUnreadRoundedIcon />} disabled={updateMutation.isPending} onClick={() => updateNotificationStatus(row, "Unread")}>Unread</Button>
                                )}
                                <Button size="small" color="error" variant="text" startIcon={<DeleteRoundedIcon />} disabled={updateMutation.isPending} onClick={() => setDeleteTarget(row)}>Delete</Button>
                              </>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!query.isLoading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          {query.isError ? (
                            <EmptyState kind="error" title="Unable to load data" body="There was a problem loading notifications" action={<Button variant="contained" onClick={() => query.refetch()}>Try again</Button>} />
                          ) : debouncedSearch ? (
                            <EmptyState kind="no-results" title="No results found" body="Try adjusting your search or filter" action={<Button variant="outlined" onClick={() => setSearch("")}>Clear search</Button>} />
                          ) : activeFilters.length > 0 ? (
                            <EmptyState kind="no-matches" title="No matching items" body="No notifications match the current filters" action={<Button variant="outlined" onClick={clearAllFilters}>Clear all filters</Button>} />
                          ) : (
                            <EmptyState kind="no-data" title="No notifications yet" body="Active submission, approval, rejection, impact, audit, certificate, and role messages will appear here" />
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
      </Stack>
      <Dialog open={Boolean(deleteTarget)} onClose={() => !updateMutation.isPending && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete notification?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>&quot;{deleteTarget?.subject || "this notification"}&quot;</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={updateMutation.isPending}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={updateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon />}
            onClick={deleteNotification}
            disabled={updateMutation.isPending}
          >
            Delete notification
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

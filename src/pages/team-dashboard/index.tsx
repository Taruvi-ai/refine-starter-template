import { useMemo, type ReactNode } from "react";
import { useList, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { taruviTokens } from "../../theme/themeOptions";
import {
  AccessDenied,
  CategoryChip,
  EmptyState,
  KaizenTitleText,
  StatusChip,
  emptyValue,
  formatDate,
  formatFteSaving,
  formatInteger,
  hierarchyEmployeeUsernames,
  toNumber,
  useKaizenRoles,
  type HierarchyAssignment,
  type KaizenIdea,
} from "../kaizens/shared";
import {
  calculateConfiguredFteSaving,
  resolveDashboardWidget,
  useBenefitCalculationConfigs,
  useDashboardWidgetConfigs,
  type BenefitCalculationConfig,
} from "../settings/shared";

const COUNT_PAGINATION = { currentPage: 1, pageSize: 1 };
const PENDING_PAGINATION = { currentPage: 1, pageSize: 5 };
const RECENT_PAGINATION = { currentPage: 1, pageSize: 8 };
const SNAPSHOT_PAGINATION = { currentPage: 1, pageSize: 100 };
const SUBMITTED_DESC_SORTERS = [
  { field: "submitted_at", order: "desc" as const },
  { field: "created_at", order: "desc" as const },
];
const TEAM_TABLE_COLUMN_WIDTHS = {
  kaizen: "34%",
  status: "16%",
  category: "12%",
  submitted: "12%",
  fte: "10%",
  actions: "16%",
};
const HIDDEN_TEAM_DASHBOARD_KAIZEN_STATUSES = ["Draft", "Withdrawn"] as const;

type TeamDashboardFilterNode =
  | Record<string, unknown>
  | { and: TeamDashboardFilterNode[] }
  | { or: TeamDashboardFilterNode[] };

const teamDashboardFilterTree = (nodes: TeamDashboardFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

const leadManagerTeamFilterNodes = (
  managerUsername?: string | null,
  assignedEmployeeUsernames: string[] = [],
): TeamDashboardFilterNode[] | null => {
  const manager = String(managerUsername ?? "").trim();
  if (!manager) return null;

  const employeeUsernames = Array.from(new Set(assignedEmployeeUsernames.filter((username) => username && username !== manager)));
  const scope: TeamDashboardFilterNode[] = [{ reporting_manager_username__eq: manager }];
  if (employeeUsernames.length > 0) scope.push({ submitted_by_username__in: employeeUsernames });

  return [
    { or: scope },
    { submitted_by_username__ne: manager },
    { status__nin: HIDDEN_TEAM_DASHBOARD_KAIZEN_STATUSES },
  ];
};

const leadManagerTeamFilters = (
  managerUsername?: string | null,
  assignedEmployeeUsernames: string[] = [],
  extraNodes: TeamDashboardFilterNode[] = [],
): CrudFilters => {
  const baseNodes = leadManagerTeamFilterNodes(managerUsername, assignedEmployeeUsernames);
  if (!baseNodes) return [{ field: "id", operator: "eq", value: "__no_manager__" }];
  return teamDashboardFilterTree([...baseNodes, ...extraNodes]);
};

const isLeadManagerOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isManager && !roles.isAdmin && !roles.isOmSom && !roles.isPeQa;

const ideaFteSaving = (idea: KaizenIdea, benefitCalculationConfigs: BenefitCalculationConfig[]) =>
  toNumber(idea.fte_saving ?? calculateConfiguredFteSaving(idea, benefitCalculationConfigs));

const KpiCard = ({
  label,
  value,
  icon,
  accent,
  helper,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: string;
  helper: string;
  isLoading?: boolean;
}) => (
  <Card sx={{ height: "100%", minHeight: 112, border: `1px solid ${taruviTokens.surface.borderLight}`, overflow: "hidden" }}>
    <CardContent sx={{ height: "100%", p: 2, "&:last-child": { pb: 2 } }}>
      <Stack spacing={1.5} sx={{ height: "100%", minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              flex: "0 0 auto",
              borderRadius: 1.25,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}14`,
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.3, minWidth: 0 }}>
            {label}
          </Typography>
        </Stack>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" sx={{ lineHeight: 1.05, mb: 0.25 }}>
            {isLoading ? <Skeleton width={52} /> : value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>
            {helper}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const MetricLine = ({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.25,
        display: "grid",
        placeItems: "center",
        color: "primary.main",
        bgcolor: taruviTokens.primary[50],
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </Box>
  </Stack>
);

const TeamIdeaRow = ({
  idea,
  actionLabel,
  onAction,
  benefitCalculationConfigs,
}: {
  idea: KaizenIdea;
  actionLabel: string;
  onAction: () => void;
  benefitCalculationConfigs: BenefitCalculationConfig[];
}) => (
  <TableRow hover>
    <TableCell sx={{ minWidth: 0 }}>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <KaizenTitleText title={idea.title || "Untitled Kaizen"} />
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {emptyValue(idea.kaizen_id)} - {emptyValue(idea.submitted_by_username)}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell sx={{ minWidth: 0 }}>
      <Stack spacing={0.75} alignItems="flex-start">
        <StatusChip status={idea.status} />
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
          {emptyValue(idea.current_stage)}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell sx={{ minWidth: 0 }}>
      <CategoryChip category={idea.category} />
    </TableCell>
    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(idea.submitted_at || idea.created_at)}</TableCell>
    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{formatFteSaving(ideaFteSaving(idea, benefitCalculationConfigs))}</TableCell>
    <TableCell align="right" sx={{ whiteSpace: "nowrap", overflow: "visible", px: 1 }}>
      <Button
        size="small"
        variant="outlined"
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{
          minWidth: 92,
          px: 1.25,
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
          "& .MuiButton-endIcon": { ml: 0.75, mr: 0 },
        }}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </TableCell>
  </TableRow>
);

export const TeamDashboardPage = () => {
  const navigate = useNavigate();
  const roles = useKaizenRoles();
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const { widgets: dashboardWidgetConfigs } = useDashboardWidgetConfigs("lead_manager");
  const managerUsername = roles.identity?.username;
  const managerName = roles.identity?.first_name || roles.identity?.username || "Lead";
  const canUseTeamDashboard = isLeadManagerOnly(roles);
  const assignmentFilters = useMemo<CrudFilters>(
    () =>
      managerUsername
        ? [
            { field: "manager_username", operator: "eq", value: managerUsername },
            { field: "status", operator: "eq", value: "Active" },
          ]
        : [{ field: "id", operator: "eq", value: "__no_manager__" }],
    [managerUsername],
  );
  const assignmentQueryOptions = useMemo(
    () => ({ enabled: canUseTeamDashboard && Boolean(managerUsername) }),
    [canUseTeamDashboard, managerUsername],
  );
  const assignments = useList<HierarchyAssignment>({
    resource: "kaizen_hierarchy_assignments",
    filters: assignmentFilters,
    pagination: { currentPage: 1, pageSize: 500 },
    queryOptions: assignmentQueryOptions,
  });
  const assignedUsernames = useMemo(
    () => hierarchyEmployeeUsernames(assignments.result.data ?? [], managerUsername),
    [assignments.result.data, managerUsername],
  );
  const teamFilters = useMemo<CrudFilters>(
    () => leadManagerTeamFilters(managerUsername, assignedUsernames),
    [assignedUsernames, managerUsername],
  );
  const pendingFilters = useMemo<CrudFilters>(
    () =>
      leadManagerTeamFilters(managerUsername, assignedUsernames, [
        { current_stage__eq: "Lead/Manager Review" },
        { status__in: ["Submitted", "Resubmitted"] },
      ]),
    [assignedUsernames, managerUsername],
  );
  const approvedFilters = useMemo<CrudFilters>(
    () => leadManagerTeamFilters(managerUsername, assignedUsernames, [{ approved_at__nnull: true }]),
    [assignedUsernames, managerUsername],
  );
  const rejectedFilters = useMemo<CrudFilters>(
    () => leadManagerTeamFilters(managerUsername, assignedUsernames, [{ status__eq: "Rejected" }]),
    [assignedUsernames, managerUsername],
  );
  const highImpactFilters = useMemo<CrudFilters>(
    () => leadManagerTeamFilters(managerUsername, assignedUsernames, [{ high_impact_nomination_status__in: ["Nominated", "Approved"] }]),
    [assignedUsernames, managerUsername],
  );
  const recentTeamFilters = useMemo<CrudFilters>(
    () => leadManagerTeamFilters(managerUsername, assignedUsernames),
    [assignedUsernames, managerUsername],
  );
  const queryOptions = useMemo(
    () => ({ enabled: canUseTeamDashboard && Boolean(managerUsername) }),
    [canUseTeamDashboard, managerUsername],
  );

  const total = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: teamFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const pending = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: pendingFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const approved = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: approvedFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const rejected = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: rejectedFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const highImpact = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: highImpactFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const pendingIdeas = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: pendingFilters,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: PENDING_PAGINATION,
    queryOptions,
  });
  const recentIdeas = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: recentTeamFilters,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: RECENT_PAGINATION,
    queryOptions,
  });
  const impactSnapshot = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: teamFilters,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: SNAPSHOT_PAGINATION,
    queryOptions,
  });

  if (!canUseTeamDashboard) {
    return <AccessDenied title="Team dashboard access required" />;
  }

  const pendingRows = pendingIdeas.result.data ?? [];
  const recentRows = recentIdeas.result.data ?? [];
  const snapshotRows = impactSnapshot.result.data ?? [];
  const pendingReviewCount = pending.result.total ?? 0;
  const totalHoursSaved = snapshotRows.reduce((sum, idea) => sum + toNumber(idea.hours_saved), 0);
  const totalFteSaving = snapshotRows.reduce((sum, idea) => sum + ideaFteSaving(idea, benefitCalculationConfigs), 0);
  const reworkRows = snapshotRows.filter((idea) => toNumber(idea.rework_reduced_percent) > 0);
  const averageReworkReduced =
    reworkRows.length > 0
      ? reworkRows.reduce((sum, idea) => sum + toNumber(idea.rework_reduced_percent), 0) / reworkRows.length
      : 0;
  const isAnyCountLoading =
    total.query.isLoading ||
    pending.query.isLoading ||
    approved.query.isLoading ||
    rejected.query.isLoading ||
    highImpact.query.isLoading;
  const widget = (key: string, fallback: { label: string; helper?: string; sortOrder?: number; visible?: boolean }) =>
    resolveDashboardWidget(dashboardWidgetConfigs, key, fallback);
  const kpiWidgets = [
    {
      key: "team_ideas",
      config: widget("team_ideas", { label: "Team Ideas", helper: "Submitted under your team", sortOrder: 10 }),
      value: formatInteger(total.result.total ?? 0),
      icon: <AssignmentTurnedInRoundedIcon />,
      accent: taruviTokens.button.primaryDefault,
      isLoading: total.query.isLoading,
    },
    {
      key: "needs_review",
      config: widget("needs_review", { label: "Needs Review", helper: "Waiting for lead decision", sortOrder: 20 }),
      value: formatInteger(pendingReviewCount),
      icon: <HourglassTopRoundedIcon />,
      accent: taruviTokens.status.underReview,
      isLoading: pending.query.isLoading,
    },
    {
      key: "approved",
      config: widget("approved", { label: "Approved", helper: "Approved by review", sortOrder: 30 }),
      value: formatInteger(approved.result.total ?? 0),
      icon: <CheckCircleRoundedIcon />,
      accent: taruviTokens.status.resolved,
      isLoading: approved.query.isLoading,
    },
    {
      key: "rejected",
      config: widget("rejected", { label: "Rejected", helper: "Rejected by review", sortOrder: 40 }),
      value: formatInteger(rejected.result.total ?? 0),
      icon: <CloseRoundedIcon />,
      accent: taruviTokens.error[600],
      isLoading: rejected.query.isLoading,
    },
    {
      key: "high_impact",
      config: widget("high_impact", { label: "High Impact", helper: "Nominated or approved", sortOrder: 50 }),
      value: formatInteger(highImpact.result.total ?? 0),
      icon: <WorkspacePremiumRoundedIcon />,
      accent: taruviTokens.success[500],
      isLoading: highImpact.query.isLoading,
    },
  ].filter((item) => item.config.visible).sort((first, second) => first.config.sortOrder - second.config.sortOrder);
  const needsReviewWidget = widget("needs_review_table", { label: "Needs Your Review", helper: "New ideas submitted by your team.", sortOrder: 60 });
  const teamImpactWidget = widget("team_impact", { label: "Team Impact", helper: "Savings captured from team Kaizens.", sortOrder: 70 });
  const recentTeamIdeasWidget = widget("recent_team_ideas", { label: "Recent Team Ideas", helper: "Latest submitted Kaizens across your team.", sortOrder: 80 });

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - var(--nav-height, 64px))" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Card
            sx={{
              overflow: "hidden",
              color: taruviTokens.text.onDark,
              background: `linear-gradient(135deg, ${taruviTokens.secondary[900]} 0%, ${taruviTokens.secondary[700]} 56%, ${taruviTokens.primary[700]} 100%)`,
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, "&:last-child": { pb: { xs: 3, md: 4 } } }}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
                <Box sx={{ maxWidth: 760 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                    <SupervisorAccountRoundedIcon />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)", textTransform: "uppercase", fontWeight: 700 }}>
                      Lead/Manager Workspace
                    </Typography>
                  </Stack>
                  <Typography variant="h1" sx={{ color: "inherit", mb: 1 }}>
                    Team Dashboard
                  </Typography>
                  <Typography variant="body1" sx={{ maxWidth: 660, color: "rgba(255,255,255,0.82)" }}>
                    Monitor {managerName}'s team ideas, review new submissions, and track improvement impact from one place.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: { xs: "100%", lg: 360 },
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 2,
                    p: 2.25,
                    bgcolor: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box sx={{ color: taruviTokens.primary[300], display: "grid", placeItems: "center" }}>
                        <RateReviewRoundedIcon />
                      </Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.74)", textTransform: "uppercase", fontWeight: 700 }}>
                        Review Focus
                      </Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ color: "inherit" }}>
                      {pending.query.isLoading ? (
                        <Skeleton width={170} sx={{ bgcolor: "rgba(255,255,255,0.22)" }} />
                      ) : (
                        `${formatInteger(pendingReviewCount)} item${pendingReviewCount === 1 ? "" : "s"} waiting`
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                      Keep the improvement pipeline moving by clearing the newest team review work.
                    </Typography>
                    <Button variant="contained" startIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                      Open Reviews
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(145px, 1fr))",
              },
              gap: { xs: 1.5, md: 2 },
              alignItems: "stretch",
            }}
          >
            {kpiWidgets.map((item) => (
              <KpiCard
                key={item.key}
                label={item.config.label}
                value={item.value}
                icon={item.icon}
                accent={item.accent}
                helper={item.config.helper}
                isLoading={item.isLoading}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {needsReviewWidget.visible ? (
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h3">{needsReviewWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {needsReviewWidget.helper}
                    </Typography>
                  </Box>
                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                    Review Queue
                  </Button>
                </Stack>
                {pendingIdeas.query.isError ? (
                  <EmptyState kind="error" title="Unable to load reviews" body="There was a problem loading your team review queue." />
                ) : pendingIdeas.query.isLoading ? (
                  <Stack spacing={1.25}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" height={62} />
                    ))}
                  </Stack>
                ) : pendingRows.length === 0 ? (
                  <EmptyState
                    kind="no-data"
                    title="No reviews waiting"
                    body="New team submissions will appear here."
                    action={
                      <Button variant="outlined" onClick={() => navigate("/reviews")}>
                        Open Review Queue
                      </Button>
                    }
                  />
                ) : (
                  <Box sx={{ width: "100%", overflowX: "hidden" }}>
                    <Table size="small" aria-label="Team ideas waiting for review" sx={{ tableLayout: "fixed", width: "100%" }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.kaizen }}>Kaizen</TableCell>
                          <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.status }}>Status</TableCell>
                          <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.category }}>Category</TableCell>
                          <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.submitted, whiteSpace: "nowrap" }}>Submitted</TableCell>
                          <TableCell align="right" sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.fte, whiteSpace: "nowrap" }}>FTE</TableCell>
                          <TableCell align="right" sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.actions, whiteSpace: "nowrap" }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingRows.map((idea) => (
                          <TeamIdeaRow key={idea.id} idea={idea} actionLabel="Review" benefitCalculationConfigs={benefitCalculationConfigs} onAction={() => navigate("/reviews")} />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
            ) : null}

            {teamImpactWidget.visible ? (
            <Card>
              <CardContent>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h3">{teamImpactWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {teamImpactWidget.helper}
                    </Typography>
                  </Box>
                  {impactSnapshot.query.isLoading || isAnyCountLoading ? (
                    <Stack spacing={1.25}>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} variant="rounded" height={48} />
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      <MetricLine icon={<HourglassTopRoundedIcon fontSize="small" />} label="Hours Saved" value={formatInteger(totalHoursSaved)} />
                      <MetricLine icon={<InsightsRoundedIcon fontSize="small" />} label="FTE Saving" value={formatFteSaving(totalFteSaving)} />
                      <MetricLine icon={<CheckCircleRoundedIcon fontSize="small" />} label="Avg Rework Reduced" value={`${formatFteSaving(averageReworkReduced)}%`} />
                    </Stack>
                  )}
                  <Divider />
                  <Button variant="contained" startIcon={<RateReviewRoundedIcon />} onClick={() => navigate("/reviews")} fullWidth>
                    Open Review Queue
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            ) : null}
          </Box>

          {recentTeamIdeasWidget.visible ? (
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h3">{recentTeamIdeasWidget.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recentTeamIdeasWidget.helper}
                  </Typography>
                </Box>
                <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                  View Reviews
                </Button>
              </Stack>
              {recentIdeas.query.isError ? (
                <EmptyState kind="error" title="Unable to load ideas" body="There was a problem loading recent team ideas." />
              ) : recentIdeas.query.isLoading ? (
                <Stack spacing={1.25}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={62} />
                  ))}
                </Stack>
              ) : recentRows.length === 0 ? (
                <EmptyState kind="no-data" title="No team ideas yet" body="Submitted team Kaizens will appear here." />
              ) : (
                <Box sx={{ width: "100%", overflowX: "hidden" }}>
                  <Table size="small" aria-label="Recent team ideas" sx={{ tableLayout: "fixed", width: "100%" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.kaizen }}>Kaizen</TableCell>
                        <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.status }}>Status</TableCell>
                        <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.category }}>Category</TableCell>
                        <TableCell sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.submitted, whiteSpace: "nowrap" }}>Submitted</TableCell>
                        <TableCell align="right" sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.fte, whiteSpace: "nowrap" }}>FTE</TableCell>
                        <TableCell align="right" sx={{ width: TEAM_TABLE_COLUMN_WIDTHS.actions, whiteSpace: "nowrap" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentRows.map((idea) => (
                        <TeamIdeaRow key={idea.id} idea={idea} actionLabel="Open" benefitCalculationConfigs={benefitCalculationConfigs} onAction={() => navigate(`/kaizens/show/${idea.id}`)} />
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

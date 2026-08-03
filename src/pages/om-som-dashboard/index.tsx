import { useMemo, type ReactNode } from "react";
import { useList, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
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
  StatusChip,
  calculateHoursSaved,
  emptyValue,
  formatDate,
  formatCurrency,
  formatFteSaving,
  formatInteger,
  toNumber,
  useKaizenRoles,
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
const QUEUE_PAGINATION = { currentPage: 1, pageSize: 5 };
const RECENT_PAGINATION = { currentPage: 1, pageSize: 8 };
const SNAPSHOT_PAGINATION = { currentPage: 1, pageSize: 100 };
const SUBMITTED_DESC_SORTERS = [
  { field: "submitted_at", order: "desc" as const },
  { field: "created_at", order: "desc" as const },
];
const UPDATED_DESC_SORTERS = [{ field: "updated_at", order: "desc" as const }];
const OM_SOM_APPROVED_STATUSES = [
  "Approved",
  "Pending Audit",
  "Audit In Progress",
  "Audit Pass",
  "Audit Fail",
  "Audit Closed",
  "Implementation Not Started",
  "Implementation In Progress",
  "Implementation Complete",
  "Impact Validation Pending",
  "Incentive Approved",
  "Certificate Generated",
  "Closed",
] as const;
const ALL_SUBMITTED_IMPACT_FILTERS: CrudFilters = [
  { field: "kaizen_id", operator: "nnull", value: true },
  { field: "status", operator: "ne", value: "Draft" },
];

const isOmSomOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isOmSom && !roles.isAdmin && !roles.isPeQa;

const ideaFteSaving = (idea: KaizenIdea, benefitCalculationConfigs: BenefitCalculationConfig[]) =>
  toNumber(idea.fte_saving ?? calculateConfiguredFteSaving(idea, benefitCalculationConfigs));

const ideaReworkReduction = (idea: KaizenIdea) => {
  const storedReduction = toNumber(idea.rework_reduced_percent);
  if (storedReduction > 0) return storedReduction;
  const errorBefore = toNumber(idea.error_before);
  const errorAfter = toNumber(idea.error_after);
  if (errorBefore <= 0 || errorAfter >= errorBefore) return 0;
  return ((errorBefore - errorAfter) / errorBefore) * 100;
};

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
  <Card sx={{ height: "100%", border: `1px solid ${taruviTokens.surface.borderLight}` }}>
    <CardContent sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}14`,
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right", lineHeight: 1.35 }}>
            {label}
          </Typography>
        </Stack>
        <Box sx={{ mt: "auto" }}>
          <Typography variant="h3">{isLoading ? <Skeleton width={72} /> : value}</Typography>
          <Typography variant="caption" color="text.secondary">
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

const OmSomIdeaRow = ({
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
    <TableCell>
      <Stack spacing={0.5} sx={{ minWidth: 220 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {idea.title || "Untitled Kaizen"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {emptyValue(idea.kaizen_id)} - {emptyValue(idea.submitted_by_username)}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell>
      <Stack spacing={0.75} alignItems="flex-start">
        <StatusChip status={idea.status} />
        <Typography variant="caption" color="text.secondary">
          {emptyValue(idea.current_stage)}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell>
      <CategoryChip category={idea.category} />
    </TableCell>
    <TableCell>{formatDate(idea.submitted_at || idea.created_at)}</TableCell>
    <TableCell align="right">{formatFteSaving(ideaFteSaving(idea, benefitCalculationConfigs))}</TableCell>
    <TableCell align="right">
      <Button size="small" variant="outlined" endIcon={<ArrowForwardRoundedIcon />} onClick={onAction}>
        {actionLabel}
      </Button>
    </TableCell>
  </TableRow>
);

export const OmSomDashboardPage = () => {
  const navigate = useNavigate();
  const roles = useKaizenRoles();
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const { widgets: dashboardWidgetConfigs } = useDashboardWidgetConfigs("om_som");
  const omSomName = roles.identity?.first_name || roles.identity?.username || "OM/SOM";
  const canUseOmSomDashboard = isOmSomOnly(roles);

  const omSomReviewFilters = useMemo<CrudFilters>(
    () => [{ field: "current_stage", operator: "eq", value: "OM/SOM Review" }],
    [],
  );
  const highImpactPendingFilters = useMemo<CrudFilters>(
    () => [{ field: "high_impact_nomination_status", operator: "eq", value: "Nominated" }],
    [],
  );
  const approvedFilters = useMemo<CrudFilters>(
    () => [
      { field: "status", operator: "in", value: [...OM_SOM_APPROVED_STATUSES] },
      { field: "om_som_comments", operator: "nnull", value: true },
    ],
    [],
  );
  const rejectedFilters = useMemo<CrudFilters>(
    () => [
      { field: "status", operator: "eq", value: "Rejected" },
      { field: "om_som_comments", operator: "nnull", value: true },
    ],
    [],
  );
  const decisionFilters = useMemo<CrudFilters>(
    () => [{ field: "om_som_comments", operator: "nnull", value: true }],
    [],
  );
  const queryOptions = useMemo(
    () => ({ enabled: canUseOmSomDashboard }),
    [canUseOmSomDashboard],
  );

  const needsReview = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: omSomReviewFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const highImpact = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: highImpactPendingFilters,
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
  const decisions = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: decisionFilters,
    pagination: COUNT_PAGINATION,
    queryOptions,
  });
  const reviewQueue = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: omSomReviewFilters,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: QUEUE_PAGINATION,
    queryOptions,
  });
  const highImpactQueue = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: highImpactPendingFilters,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: QUEUE_PAGINATION,
    queryOptions,
  });
  const recentDecisions = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: decisionFilters,
    sorters: UPDATED_DESC_SORTERS,
    pagination: RECENT_PAGINATION,
    queryOptions,
  });
  const impactSnapshot = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: ALL_SUBMITTED_IMPACT_FILTERS,
    sorters: SUBMITTED_DESC_SORTERS,
    pagination: SNAPSHOT_PAGINATION,
    queryOptions,
  });

  if (!canUseOmSomDashboard) {
    return <AccessDenied title="Team's Dashboard access required" />;
  }

  const reviewRows = reviewQueue.result.data ?? [];
  const highImpactRows = highImpactQueue.result.data ?? [];
  const decisionRows = recentDecisions.result.data ?? [];
  const snapshotRows = impactSnapshot.result.data ?? [];
  const totalHoursSaved = snapshotRows.reduce((sum, idea) => sum + calculateHoursSaved(idea), 0);
  const totalFteSaving = snapshotRows.reduce((sum, idea) => sum + ideaFteSaving(idea, benefitCalculationConfigs), 0);
  const totalCostSaved = snapshotRows.reduce((sum, idea) => sum + toNumber(idea.cost_saved), 0);
  const reworkRows = snapshotRows.map(ideaReworkReduction).filter((reduction) => reduction > 0);
  const averageReworkReduced =
    reworkRows.length > 0
      ? reworkRows.reduce((sum, reduction) => sum + reduction, 0) / reworkRows.length
      : 0;
  const isAnyCountLoading =
    needsReview.query.isLoading ||
    highImpact.query.isLoading ||
    approved.query.isLoading ||
    rejected.query.isLoading ||
    decisions.query.isLoading;
  const widget = (key: string, fallback: { label: string; helper?: string; sortOrder?: number; visible?: boolean }) =>
    resolveDashboardWidget(dashboardWidgetConfigs, key, fallback);
  const kpiWidgets = [
    {
      key: "total_submissions",
      config: widget("total_submissions", { label: "Total Kaizens Submitted", helper: "All submitted Kaizens", sortOrder: 5 }),
      value: formatInteger(impactSnapshot.result.total ?? 0),
      icon: <AssignmentTurnedInRoundedIcon />,
      accent: taruviTokens.secondary[700],
      isLoading: impactSnapshot.query.isLoading,
    },
    {
      key: "om_som_review",
      config: widget("om_som_review", { label: "OM/SOM Review", helper: "Waiting for OM/SOM decision", sortOrder: 10 }),
      value: formatInteger(needsReview.result.total ?? 0),
      icon: <AssignmentTurnedInRoundedIcon />,
      accent: taruviTokens.button.primaryDefault,
      isLoading: needsReview.query.isLoading,
    },
    {
      key: "high_impact_pending",
      config: widget("high_impact_pending", { label: "High Impact Pending", helper: "Nominations awaiting decision", sortOrder: 20 }),
      value: formatInteger(highImpact.result.total ?? 0),
      icon: <WorkspacePremiumRoundedIcon />,
      accent: taruviTokens.success[500],
      isLoading: highImpact.query.isLoading,
    },
    {
      key: "approved",
      config: widget("approved", { label: "Approved", helper: "Moved to PE/QA audit", sortOrder: 30 }),
      value: formatInteger(approved.result.total ?? 0),
      icon: <CheckCircleRoundedIcon />,
      accent: taruviTokens.status.resolved,
      isLoading: approved.query.isLoading,
    },
    {
      key: "rejected",
      config: widget("rejected", { label: "Rejected", helper: "Closed by OM/SOM", sortOrder: 40 }),
      value: formatInteger(rejected.result.total ?? 0),
      icon: <CloseRoundedIcon />,
      accent: taruviTokens.error[600],
      isLoading: rejected.query.isLoading,
    },
    {
      key: "cost_saved",
      config: widget("cost_saved", { label: "Cost Saved", helper: "Total savings across submitted Kaizens", sortOrder: 45 }),
      value: formatCurrency(totalCostSaved),
      icon: <PaidRoundedIcon />,
      accent: taruviTokens.success[500],
      isLoading: impactSnapshot.query.isLoading,
    },
    {
      key: "recent_decisions",
      config: widget("recent_decisions", { label: "Recent Decisions", helper: "Approved or rejected by OM/SOM", sortOrder: 50 }),
      value: formatInteger(decisions.result.total ?? 0),
      icon: <RateReviewRoundedIcon />,
      accent: taruviTokens.status.underReview,
      isLoading: decisions.query.isLoading,
    },
  ].filter((item) => item.config.visible).sort((first, second) => first.config.sortOrder - second.config.sortOrder);
  const reviewTableWidget = widget("om_som_review_table", { label: "Needs OM/SOM Review", helper: "Ideas approved by Lead/Manager and waiting for your decision.", sortOrder: 60 });
  const reviewImpactWidget = {
    ...widget("review_impact", { label: "Kaizen Impact", helper: "Combined impact across all submitted Kaizens.", sortOrder: 70 }),
    label: "Kaizen Impact",
    helper: "Combined impact across all submitted Kaizens.",
  };
  const highImpactNominationsWidget = widget("high_impact_nominations", { label: "High Impact Nominations", helper: "Lead/Manager nominations pending OM/SOM decision.", sortOrder: 80 });
  const recentDecisionsWidget = widget("recent_om_som_decisions", { label: "Recent OM/SOM Decisions", helper: "Latest Kaizens reviewed by OM/SOM.", sortOrder: 90 });

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
                      OM/SOM Workspace
                    </Typography>
                  </Stack>
                  <Typography variant="h1" sx={{ color: "inherit", mb: 1 }}>
                    Team&apos;s Dashboard
                  </Typography>
                  <Typography variant="body1" sx={{ maxWidth: 680, color: "rgba(255,255,255,0.82)" }}>
                    Monitor {omSomName}'s OM/SOM review queue, decide high-impact nominations, and move viable Kaizens to PE/QA audit.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Button variant="contained" startIcon={<RateReviewRoundedIcon />} onClick={() => navigate("/reviews")}>
                    Open Review Queue
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(auto-fit, minmax(170px, 1fr))" }, gap: 2 }}>
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
            {reviewTableWidget.visible ? (
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h3">{reviewTableWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reviewTableWidget.helper}
                    </Typography>
                  </Box>
                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                    Review Queue
                  </Button>
                </Stack>
                {reviewQueue.query.isError ? (
                  <EmptyState kind="error" title="Unable to load reviews" body="There was a problem loading the OM/SOM review queue." />
                ) : reviewQueue.query.isLoading ? (
                  <Stack spacing={1.25}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" height={62} />
                    ))}
                  </Stack>
                ) : reviewRows.length === 0 ? (
                  <EmptyState
                    kind="no-data"
                    title="No OM/SOM reviews waiting"
                    body="Lead/Manager approved ideas will appear here."
                    action={
                      <Button variant="outlined" onClick={() => navigate("/reviews")}>
                        Open Review Queue
                      </Button>
                    }
                  />
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" aria-label="OM/SOM ideas waiting for review">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kaizen</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="right">FTE Saving</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reviewRows.map((idea) => (
                          <OmSomIdeaRow key={idea.id} idea={idea} actionLabel="Review" benefitCalculationConfigs={benefitCalculationConfigs} onAction={() => navigate("/reviews")} />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
            ) : null}

            {reviewImpactWidget.visible ? (
            <Card>
              <CardContent>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h3">{reviewImpactWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reviewImpactWidget.helper}
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
                      <MetricLine icon={<HourglassTopRoundedIcon fontSize="small" />} label="Total Hours Saved" value={formatFteSaving(totalHoursSaved)} />
                      <MetricLine icon={<InsightsRoundedIcon fontSize="small" />} label="Total FTE Saving" value={formatFteSaving(totalFteSaving)} />
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {highImpactNominationsWidget.visible ? (
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h3">{highImpactNominationsWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {highImpactNominationsWidget.helper}
                    </Typography>
                  </Box>
                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                    Review
                  </Button>
                </Stack>
                {highImpactQueue.query.isError ? (
                  <EmptyState kind="error" title="Unable to load nominations" body="There was a problem loading high-impact nominations." />
                ) : highImpactQueue.query.isLoading ? (
                  <Stack spacing={1.25}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" height={62} />
                    ))}
                  </Stack>
                ) : highImpactRows.length === 0 ? (
                  <EmptyState kind="no-data" title="No nominations waiting" body="High-impact nominations will appear here." />
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" aria-label="High impact nominations">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kaizen</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="right">FTE Saving</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {highImpactRows.map((idea) => (
                          <OmSomIdeaRow key={idea.id} idea={idea} actionLabel="Review" benefitCalculationConfigs={benefitCalculationConfigs} onAction={() => navigate("/reviews")} />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
            ) : null}

            {recentDecisionsWidget.visible ? (
            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h3">{recentDecisionsWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recentDecisionsWidget.helper}
                    </Typography>
                  </Box>
                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/reviews")}>
                    View Reviews
                  </Button>
                </Stack>
                {recentDecisions.query.isError ? (
                  <EmptyState kind="error" title="Unable to load decisions" body="There was a problem loading recent OM/SOM decisions." />
                ) : recentDecisions.query.isLoading ? (
                  <Stack spacing={1.25}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" height={62} />
                    ))}
                  </Stack>
                ) : decisionRows.length === 0 ? (
                  <EmptyState kind="no-data" title="No OM/SOM decisions yet" body="Approved and rejected OM/SOM reviews will appear here." />
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" aria-label="Recent OM/SOM decisions">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kaizen</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="right">FTE Saving</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {decisionRows.map((idea) => (
                          <OmSomIdeaRow key={idea.id} idea={idea} actionLabel="Open" benefitCalculationConfigs={benefitCalculationConfigs} onAction={() => navigate(`/kaizens/show/${idea.id}`)} />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
            ) : null}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

import { useMemo, type ReactNode } from "react";
import { useList, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { taruviTokens } from "../../theme/themeOptions";
import {
  EmptyState,
  StatusChip,
  calculateHoursSaved,
  formatCurrency,
  formatDate,
  formatFteSaving,
  formatInteger,
  kaizenReferenceLabel,
  normalizeKaizenCategory,
  toNumber,
  useKaizenRoles,
  type CertificateRow,
  type KaizenIdea,
} from "../kaizens/shared";
import {
  calculateConfiguredFteSaving,
  resolveDashboardWidget,
  useBenefitCalculationConfigs,
  useDashboardWidgetConfigs,
} from "../settings/shared";

const COUNT_PAGINATION = { currentPage: 1, pageSize: 1 };
const MY_IDEAS_PAGINATION = { currentPage: 1, pageSize: 100 };
const CERTIFICATES_PAGINATION = { currentPage: 1, pageSize: 5 };
const CREATED_DESC_SORTERS = [{ field: "created_at", order: "desc" as const }];
const ISSUED_DESC_SORTERS = [{ field: "issued_at", order: "desc" as const }];
const SUBMITTED_KAIZEN_FILTERS: CrudFilters = [
  { field: "kaizen_id", operator: "nnull", value: true },
  { field: "status", operator: "ne", value: "Draft" },
];
const COMPLETED_KAIZEN_STATUSES = ["Closed", "Certificate Generated", "Audit Closed", "Incentive Approved"];

const certificateUrl = (path?: string | null) =>
  path ? `${__TARUVI_SITE_URL__}/api/apps/${__TARUVI_APP_SLUG__}/storage/buckets/kaizen-attachments/objects/${path}` : "";

const formatHoursSaved = (value: unknown) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(toNumber(value));

const isApprovedHighImpactIdea = (idea: KaizenIdea) =>
  String(idea.high_impact_nomination_status ?? "").trim().toLowerCase() === "approved";

type LeaderboardEntry = {
  key: string;
  label: string;
  count: number;
  hoursSaved: number;
  fteSaving: number;
};

const certificateDownloadName = (certificate: CertificateRow) => {
  const pathName = certificate.certificate_path?.split("/").pop() || "kaizen-certificate.svg";
  const extension = pathName.includes(".") ? pathName.slice(pathName.lastIndexOf(".")) : ".svg";
  const baseName = (certificate.certificate_number || pathName.replace(/\.[^.]+$/, "") || "kaizen-certificate")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseName || "kaizen-certificate"}${extension}`;
};

const useCount = (filters: CrudFilters) =>
  useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters,
    pagination: COUNT_PAGINATION,
  });

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
  helper?: string;
  isLoading?: boolean;
}) => (
  <Card
    sx={{
      height: "100%",
      border: `1px solid ${taruviTokens.surface.borderLight}`,
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
      },
    }}
  >
    <CardContent sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
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
          <Typography variant="h3">{isLoading ? <Skeleton width={76} /> : value}</Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const ExecutiveKpiCard = ({
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
  <Card
    sx={{
      height: "100%",
      minHeight: { xs: 168, md: 176, xl: 188 },
      position: "relative",
      overflow: "hidden",
      border: `1px solid ${accent}33`,
      borderLeft: `4px solid ${accent}`,
      bgcolor: `${accent}0D`,
      boxShadow: "0 10px 24px rgba(0,0,0,0.07)",
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.11)",
      },
    }}
  >
    <CardContent sx={{ height: "100%" }}>
      <Stack spacing={2.25} sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}1A`,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "right", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.35 }}
          >
            {label}
          </Typography>
        </Stack>
        <Box sx={{ mt: "auto" }}>
          <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 32 }, lineHeight: 1.05, overflowWrap: "anywhere" }}>
            {isLoading ? <Skeleton width={96} /> : value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const LeaderboardSection = ({
  title,
  description,
  entries,
  isLoading,
  gridArea,
  onViewAll,
}: {
  title: string;
  description: string;
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  gridArea?: string;
  onViewAll?: () => void;
}) => {
  const maxCount = Math.max(...entries.map((entry) => entry.count), 1);
  const topEntry = entries[0];
  const remainingEntries = entries.slice(1, 5);
  const renderMetric = (label: string, value: string | number) => (
    <Box
      sx={{
        minWidth: 0,
        border: `1px solid ${taruviTokens.surface.borderLight}`,
        borderRadius: 1,
        px: 1.25,
        py: 0.75,
        bgcolor: taruviTokens.surface.inputBg,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Card
      sx={{
        gridArea,
        height: "100%",
      }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={2.25} sx={{ height: "100%" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3">{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
            {onViewAll ? (
              <Button variant="text" onClick={onViewAll} endIcon={<ArrowForwardRoundedIcon />}>
                View
              </Button>
            ) : null}
          </Stack>

          {isLoading ? (
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={142} />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : topEntry ? (
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              <Box
                sx={{
                  border: `1px solid ${taruviTokens.primary[100]}`,
                  borderRadius: 1.5,
                  p: 1.75,
                  bgcolor: taruviTokens.primary[50],
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                  <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 1.5,
                        display: "grid",
                        placeItems: "center",
                        color: taruviTokens.status.review,
                        bgcolor: taruviTokens.surface.paper,
                      }}
                    >
                      <EmojiEventsRoundedIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        Rank #1
                      </Typography>
                      <Typography variant="h4" noWrap>
                        {topEntry.label}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip color="warning" label={`${formatInteger(topEntry.count)} Kaizen${topEntry.count === 1 ? "" : "s"}`} />
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, mt: 1.5 }}>
                  {renderMetric("Hours Saved", `${formatHoursSaved(topEntry.hoursSaved)} hrs`)}
                  {renderMetric("FTE Saving", formatFteSaving(topEntry.fteSaving))}
                </Box>
              </Box>

              <Stack spacing={1.25}>
                {remainingEntries.map((entry, index) => {
                  const rank = index + 2;
                  return (
                    <Box
                      key={entry.key}
                      sx={{
                        border: `1px solid ${taruviTokens.surface.borderLight}`,
                        borderRadius: 1.25,
                        px: 1.5,
                        py: 1.25,
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                          <Chip label={`#${rank}`} size="small" />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                              {entry.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatHoursSaved(entry.hoursSaved)} hrs - {formatFteSaving(entry.fteSaving)} FTE
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                          {formatInteger(entry.count)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(entry.count / maxCount) * 100}
                        aria-label={`${title} rank ${rank}`}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          ) : (
            <EmptyState kind="no-data" title="No leaderboard yet" body="Submitted Kaizens will build this ranking." />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const MetricLine = ({
  icon,
  label,
  value,
  isLoading = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  isLoading?: boolean;
}) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box
      sx={{
        width: 34,
        height: 34,
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
      <Typography variant="h4">{isLoading ? <Skeleton width={72} /> : value}</Typography>
    </Box>
  </Stack>
);

const ClickableRow = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    sx={{
      border: `1px solid ${taruviTokens.surface.borderLight}`,
      borderRadius: 1.25,
      px: 1.75,
      py: 1.5,
      cursor: "pointer",
      transition: "background-color 0.15s ease, border-color 0.15s ease",
      "&:hover": {
        bgcolor: taruviTokens.primary[50],
        borderColor: taruviTokens.primary[200],
      },
      "&:focus-visible": {
        outline: "none",
        boxShadow: taruviTokens.shadow.focusRing,
      },
    }}
  >
    {children}
  </Box>
);

export const Home = () => {
  const navigate = useNavigate();
  const roles = useKaizenRoles();
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const username = roles.identity?.username;
  const displayName = roles.identity?.first_name || roles.identity?.username || "there";
  const isProgramDashboard = roles.isPeQa;
  const isExecutiveDashboard = roles.isAdmin;
  const isTeamCertificateDashboard = roles.isOmSomRole && !roles.isAdmin && !roles.isPeQa;
  const canSubmitKaizen = roles.canSubmitKaizen;
  const dashboardKey = isExecutiveDashboard ? "executive" : isProgramDashboard ? "pe_qa" : "employee";
  const { widgets: dashboardWidgetConfigs } = useDashboardWidgetConfigs(dashboardKey);

  const dashboardFilter = useMemo<CrudFilters>(
    () =>
      isProgramDashboard
        ? []
        : username
          ? [{ field: "submitted_by_username", operator: "eq", value: username }]
          : [{ field: "id", operator: "eq", value: "__missing_identity__" }],
    [isProgramDashboard, username],
  );
  const submittedDashboardFilter = useMemo<CrudFilters>(
    () => [...dashboardFilter, ...SUBMITTED_KAIZEN_FILTERS],
    [dashboardFilter],
  );
  const approvedFilter = useMemo<CrudFilters>(
    () => [...submittedDashboardFilter, { field: "status", operator: "eq", value: "Approved" }],
    [submittedDashboardFilter],
  );
  const rejectedFilter = useMemo<CrudFilters>(
    () => [...submittedDashboardFilter, { field: "status", operator: "eq", value: "Rejected" }],
    [submittedDashboardFilter],
  );
  const inProgressFilter = useMemo<CrudFilters>(
    () => [...submittedDashboardFilter, { field: "status", operator: "in", value: ["Submitted", "In Review", "Impact Updated"] }],
    [submittedDashboardFilter],
  );
  const completedDashboardFilter = useMemo<CrudFilters>(
    () => [...submittedDashboardFilter, { field: "status", operator: "in", value: COMPLETED_KAIZEN_STATUSES }],
    [submittedDashboardFilter],
  );
  const closedFilter = completedDashboardFilter;
  const certificateFilter = useMemo<CrudFilters>(
    () =>
      isProgramDashboard
        ? []
        : isTeamCertificateDashboard && username
          ? [{ field: "recipient_username", operator: "ne", value: username }]
        : username
          ? [{ field: "recipient_username", operator: "eq", value: username }]
          : [{ field: "id", operator: "eq", value: "__missing_identity__" }],
    [isProgramDashboard, isTeamCertificateDashboard, username],
  );
  const total = useCount(submittedDashboardFilter);
  const approved = useCount(approvedFilter);
  const rejected = useCount(rejectedFilter);
  const inProgress = useCount(inProgressFilter);
  const closed = useCount(closedFilter);

  const { result: dashboardIdeasResult, query: dashboardIdeasQuery } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: isExecutiveDashboard ? completedDashboardFilter : isProgramDashboard ? submittedDashboardFilter : dashboardFilter,
    sorters: CREATED_DESC_SORTERS,
    pagination: MY_IDEAS_PAGINATION,
  });
  const { result: impactIdeasResult, query: impactIdeasQuery } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: isExecutiveDashboard ? completedDashboardFilter : submittedDashboardFilter,
    sorters: CREATED_DESC_SORTERS,
    pagination: MY_IDEAS_PAGINATION,
  });
  const { result: certificatesResult, query: certificatesQuery } = useList<CertificateRow>({
    resource: "kaizen_certificates",
    filters: certificateFilter,
    sorters: ISSUED_DESC_SORTERS,
    pagination: CERTIFICATES_PAGINATION,
  });
  const ideas = dashboardIdeasResult.data ?? [];
  const impactIdeas = impactIdeasResult.data ?? [];
  const certificates = certificatesResult.data ?? [];
  const totalCount = total.result.total ?? 0;
  const approvedCount = approved.result.total ?? 0;
  const rejectedCount = rejected.result.total ?? 0;
  const inProgressCount = inProgress.result.total ?? 0;
  const closedCount = closed.result.total ?? 0;
  const totalHours = impactIdeas.reduce((sum, idea) => sum + calculateHoursSaved(idea), 0);
  const totalFteSaving = impactIdeas.reduce(
    (sum, idea) => sum + toNumber(idea.fte_saving ?? calculateConfiguredFteSaving(idea, benefitCalculationConfigs)),
    0,
  );
  const qualityIdeas = ideas.filter((idea) => normalizeKaizenCategory(idea.category) === "Quality");
  const qualityReworkRows = qualityIdeas.filter((idea) => toNumber(idea.rework_reduced_percent) > 0);
  const averageQualityImprovement =
    qualityReworkRows.length > 0
      ? qualityReworkRows.reduce((sum, idea) => sum + toNumber(idea.rework_reduced_percent), 0) / qualityReworkRows.length
      : 0;
  const highImpactIdeas = ideas.filter(isApprovedHighImpactIdea);
  const executiveCostSaved = ideas.reduce(
    (sum, idea) => sum + toNumber(idea.fte_saving) * toNumber(idea.fte_cost_usd),
    0,
  );
  const executiveCostSavedHelper = `${formatFteSaving(totalFteSaving)} FTE saved`;
  const completionRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;
  const clientLeaderboard = useMemo(() => {
    const groups = new Map<string, LeaderboardEntry>();
    ideas.forEach((idea) => {
      const label = String(idea.client_name || "").trim() || "Unassigned Client";
      const key = label.toLowerCase();
      const current = groups.get(key) ?? { key, label, count: 0, hoursSaved: 0, fteSaving: 0 };
      current.count += 1;
      current.hoursSaved += calculateHoursSaved(idea);
      current.fteSaving += toNumber(idea.fte_saving ?? calculateConfiguredFteSaving(idea, benefitCalculationConfigs));
      groups.set(key, current);
    });
    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count || b.hoursSaved - a.hoursSaved || a.label.localeCompare(b.label))
      .slice(0, 5);
  }, [benefitCalculationConfigs, ideas]);
  const userLeaderboard = useMemo(() => {
    const groups = new Map<string, LeaderboardEntry>();
    ideas.forEach((idea) => {
      const label = String(idea.submitted_by_name || idea.submitted_by_username || "").trim() || "Unassigned User";
      const key = String(idea.submitted_by_username || label).trim().toLowerCase();
      const current = groups.get(key) ?? { key, label, count: 0, hoursSaved: 0, fteSaving: 0 };
      current.count += 1;
      current.hoursSaved += calculateHoursSaved(idea);
      current.fteSaving += toNumber(idea.fte_saving ?? calculateConfiguredFteSaving(idea, benefitCalculationConfigs));
      groups.set(key, current);
    });
    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count || b.hoursSaved - a.hoursSaved || a.label.localeCompare(b.label))
      .slice(0, 5);
  }, [benefitCalculationConfigs, ideas]);

  const focusAction = useMemo(() => {
    if (ideas.length === 0) {
      return {
        icon: canSubmitKaizen ? <AutoAwesomeRoundedIcon /> : <InsightsRoundedIcon />,
        eyebrow: isProgramDashboard ? "Program pipeline" : canSubmitKaizen ? "Good first step" : "Kaizen activity",
        title: isProgramDashboard ? "No Kaizens submitted yet" : canSubmitKaizen ? "Submit your first Kaizen" : "No Kaizens yet",
        body: isProgramDashboard
          ? "Submitted Kaizens across the program will appear here as teams start sharing improvements."
          : canSubmitKaizen
            ? "Capture a problem, propose the fix, and start tracking impact from one place."
            : "Kaizens you can access will appear here when activity starts.",
        label: canSubmitKaizen ? null : "View Kaizens",
        to: canSubmitKaizen ? "/kaizens/create" : "/kaizens",
      };
    }
    return {
      icon: <InsightsRoundedIcon />,
      eyebrow: "Next best action",
      title: isProgramDashboard ? "Review program activity" : "Update impact evidence",
      body: isProgramDashboard
        ? "Open the Kaizen list to inspect submissions, impact evidence, and review status across the program."
        : "Add hours saved, savings, or supporting details so reviewers can close the loop faster.",
      label: isProgramDashboard ? "View All Kaizens" : "View My Kaizens",
      to: "/kaizens",
    };
  }, [canSubmitKaizen, ideas.length, isProgramDashboard]);

  const trend = useMemo(() => {
    const buckets = new Map<string, number>();
    ideas.forEach((idea) => {
      const date = new Date(idea.created_at || idea.submitted_at || "");
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).slice(0, 6).reverse().map(([month, count]) => ({ month, count }));
  }, [ideas]);

  const widget = (key: string, fallback: { label: string; helper?: string; sortOrder?: number; visible?: boolean }) =>
    resolveDashboardWidget(dashboardWidgetConfigs, key, fallback);
  const completionHelper = (helper: string) => helper.startsWith("%") ? `${formatInteger(completionRate)}${helper}` : helper;
  const executiveKpis = [
    {
      key: "kaizens_completed",
      config: widget("kaizens_completed", { label: "Kaizens Completed", helper: `${formatInteger(completionRate)}% closure progress`, sortOrder: 10 }),
      value: formatInteger(closedCount),
      icon: <EmojiEventsRoundedIcon />,
      accent: taruviTokens.status.resolved,
      isLoading: closed.query.isLoading,
      helperTransform: completionHelper,
    },
    {
      key: "hours_saved",
      config: widget("hours_saved", { label: "Hours Saved", helper: "Total verified benefit hours", sortOrder: 20 }),
      value: `${formatHoursSaved(totalHours)} hrs`,
      icon: <HourglassTopRoundedIcon />,
      accent: taruviTokens.button.primaryDefault,
      isLoading: impactIdeasQuery.isLoading,
    },
    {
      key: "fte_saving",
      config: widget("fte_saving", { label: "FTE Saving", helper: "Annualized capacity released", sortOrder: 30 }),
      value: formatFteSaving(totalFteSaving),
      icon: <InsightsRoundedIcon />,
      accent: taruviTokens.status.underReview,
      isLoading: impactIdeasQuery.isLoading,
    },
    {
      key: "high_impact_kaizens",
      config: widget("high_impact_kaizens", { label: "High Impact Kaizens", helper: "Approved high-impact improvements", sortOrder: 50 }),
      value: formatInteger(highImpactIdeas.length),
      icon: <EmojiEventsRoundedIcon />,
      accent: taruviTokens.success[700],
      isLoading: dashboardIdeasQuery.isLoading,
    },
    {
      key: "high_impact_saving",
      config: widget("high_impact_saving", { label: "Cost Saved", helper: executiveCostSavedHelper, sortOrder: 60 }),
      value: formatCurrency(executiveCostSaved),
      icon: <PaidRoundedIcon />,
      accent: taruviTokens.error[600],
      isLoading: dashboardIdeasQuery.isLoading,
    },
  ].filter((item) => item.config.visible).sort((first, second) => first.config.sortOrder - second.config.sortOrder);
  const standardKpis = [
    {
      key: "total_submissions",
      config: widget("total_submissions", { label: "Total Submissions", helper: isProgramDashboard ? "All Kaizen submissions" : "All ideas you submitted", sortOrder: 10 }),
      value: formatInteger(totalCount),
      icon: <AssignmentTurnedInRoundedIcon />,
      accent: taruviTokens.button.primaryDefault,
      isLoading: total.query.isLoading,
    },
    {
      key: "in_progress",
      config: widget("in_progress", { label: "In Progress", helper: "Moving through review", sortOrder: 20 }),
      value: formatInteger(inProgressCount),
      icon: <HourglassTopRoundedIcon />,
      accent: taruviTokens.status.underReview,
      isLoading: inProgress.query.isLoading,
    },
    {
      key: "approved",
      config: widget("approved", { label: "Approved", helper: "Ready for implementation", sortOrder: 30 }),
      value: formatInteger(approvedCount),
      icon: <CheckCircleRoundedIcon />,
      accent: taruviTokens.status.resolved,
      isLoading: approved.query.isLoading,
    },
    {
      key: "closed",
      config: widget("closed", { label: "Closed", helper: `${formatInteger(completionRate)}% completion rate`, sortOrder: 40 }),
      value: formatInteger(closedCount),
      icon: <EmojiEventsRoundedIcon />,
      accent: taruviTokens.success[500],
      isLoading: closed.query.isLoading,
      helperTransform: completionHelper,
    },
    {
      key: "rejected",
      config: widget("rejected", { label: "Rejected", helper: "Needs rethink or closure", sortOrder: 50 }),
      value: formatInteger(rejectedCount),
      icon: <CancelRoundedIcon />,
      accent: taruviTokens.error[600],
      isLoading: rejected.query.isLoading,
    },
  ].filter((item) => item.config.visible).sort((first, second) => first.config.sortOrder - second.config.sortOrder);
  const recentWidget = widget("recent_ideas", {
    label: isProgramDashboard ? "Recent Kaizens" : "Recent Ideas",
    helper: isProgramDashboard ? "Open a row to inspect any Kaizen in the program." : "Open a row to continue where you left off.",
    sortOrder: 60,
  });
  const impactWidget = widget("impact", {
    label: isProgramDashboard ? "Program Impact" : "My Impact",
    helper: isProgramDashboard ? "Hours saved and closure progress across all Kaizens." : "Hours saved and closure progress from your submitted ideas.",
    sortOrder: 70,
  });
  const certificatesWidget = widget("certificates", {
    label: isTeamCertificateDashboard ? "Team Certificates" : "Certificates",
    helper: isTeamCertificateDashboard ? "Generated proof of completed Kaizens from your team." : "Awards and generated proof of completed impact.",
    sortOrder: 80,
  });
  const trendWidget = widget("activity_trend", {
    label: "Submission Trend",
    helper: isProgramDashboard ? "Last six active months across all Kaizen activity." : "Last six active months from your Kaizen activity.",
    sortOrder: 90,
  });
  const clientLeaderboardWidget = widget("process_leaderboard", {
    label: "Client Leaderboard",
    helper: "Top clients by submitted Kaizens and verified impact.",
    sortOrder: 70,
  });
  const userLeaderboardWidget = widget("user_leaderboard", {
    label: "Employee Leaderboard",
    helper: "Top employees by submitted Kaizens and verified impact.",
    sortOrder: 80,
  });

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - var(--nav-height, 64px))" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Card
            sx={{
              overflow: "hidden",
              p: 0,
              color: taruviTokens.text.onDark,
              background: `linear-gradient(135deg, ${taruviTokens.secondary[900]} 0%, ${taruviTokens.secondary[700]} 54%, ${taruviTokens.primary[700]} 100%)`,
              boxShadow: "0 18px 42px rgba(0,67,105,0.22)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, "&:last-child": { pb: { xs: 3, md: 4 } } }}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
                <Box sx={{ maxWidth: isExecutiveDashboard ? 880 : 680 }}>
                  <Chip
                    size="small"
                    icon={<TrendingUpRoundedIcon />}
                    label={isExecutiveDashboard ? "Executive View Dashboard" : "Continuous Improvement Workspace"}
                    sx={{
                      mb: 2,
                      bgcolor: "rgba(255,255,255,0.16)",
                      color: taruviTokens.text.onDark,
                      "& .MuiChip-icon": { color: taruviTokens.text.onDark },
                    }}
                  />
                  <Typography variant="h1" sx={{ maxWidth: 760, color: "inherit", mb: 1 }}>
                    Welcome back, {displayName}
                  </Typography>
                  <Typography variant="body1" sx={{ maxWidth: 640, color: "rgba(255,255,255,0.82)" }}>
                    {isExecutiveDashboard
                      ? "Stakeholder view across completed Kaizens, closure progress, hours saved, FTE saving, and quality improvement."
                      : isProgramDashboard
                      ? "Monitor every Kaizen, track continuous improvement impact, and fast-track ideas from submission to reward."
                      : "Identify waste, measure your continuous improvement impact, and fast-track ideas from submission to reward."}
                  </Typography>
                  {!isExecutiveDashboard ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1.25, mt: 2.5 }}>
                      <Chip label={`${formatInteger(totalCount)} submissions`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "inherit" }} />
                      <Chip label={`${formatInteger(completionRate)}% closed`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "inherit" }} />
                    </Stack>
                  ) : null}
                </Box>

                {!isExecutiveDashboard ? (
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
                        <Box sx={{ color: taruviTokens.primary[300], display: "grid", placeItems: "center" }}>{focusAction.icon}</Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.74)", textTransform: "uppercase", fontWeight: 700 }}>
                          {focusAction.eyebrow}
                        </Typography>
                      </Stack>
                      <Typography variant="h4" sx={{ color: "inherit" }}>
                        {focusAction.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                        {focusAction.body}
                      </Typography>
                      <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1.25}>
                        {canSubmitKaizen ? (
                          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/kaizens/create")}>
                            Submit Kaizen
                          </Button>
                        ) : null}
                        {focusAction.label ? (
                          <Button
                            variant={canSubmitKaizen ? "outlined" : "contained"}
                            startIcon={<ArrowForwardRoundedIcon />}
                            onClick={() => navigate(focusAction.to)}
                            sx={canSubmitKaizen ? {
                              color: taruviTokens.text.onDark,
                              borderColor: "rgba(255,255,255,0.56)",
                              "&:hover": { borderColor: taruviTokens.text.onDark, bgcolor: "rgba(255,255,255,0.10)" },
                            } : undefined}
                          >
                            {focusAction.label}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          {isExecutiveDashboard ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" }, gap: 2 }}>
              {executiveKpis.map((item) => (
                <ExecutiveKpiCard
                  key={item.key}
                  label={item.key === "high_impact_saving" ? "Cost Saved" : item.config.label}
                  value={item.value}
                  icon={item.icon}
                  accent={item.accent}
                  helper={item.key === "high_impact_saving" ? executiveCostSavedHelper : item.helperTransform ? item.helperTransform(item.config.helper) : item.config.helper}
                  isLoading={item.isLoading}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" }, gap: 2 }}>
              {standardKpis.map((item) => (
                <KpiCard
                  key={item.key}
                  label={item.config.label}
                  value={item.value}
                  icon={item.icon}
                  accent={item.accent}
                  helper={item.helperTransform ? item.helperTransform(item.config.helper) : item.config.helper}
                  isLoading={item.isLoading}
                />
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isExecutiveDashboard
                ? { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }
                : { xs: "1fr", lg: "minmax(0, 1.45fr) minmax(320px, 0.85fr)" },
              gridTemplateAreas: isExecutiveDashboard
                ? {
                    xs: `"clientLeaderboard" "userLeaderboard" "trend"`,
                    lg: `"clientLeaderboard userLeaderboard" "trend trend"`,
                    xl: `"clientLeaderboard userLeaderboard trend"`,
                  }
                : {
                    xs: `"recent" "impact" "certificates" "trend"`,
                    lg: `"recent impact" "trend certificates"`,
                  },
              gap: 2,
              alignItems: isExecutiveDashboard ? "stretch" : "start",
            }}
          >
            {isExecutiveDashboard ? (
              <>
                {clientLeaderboardWidget.visible ? (
                  <LeaderboardSection
                    title="Client Leaderboard"
                    description="Top clients by submitted Kaizens and verified impact."
                    entries={clientLeaderboard}
                    isLoading={dashboardIdeasQuery.isLoading}
                    gridArea="clientLeaderboard"
                    onViewAll={() => navigate("/leaderboard")}
                  />
                ) : null}
                {userLeaderboardWidget.visible ? (
                  <LeaderboardSection
                    title="Employee Leaderboard"
                    description="Top employees by submitted Kaizens and verified impact."
                    entries={userLeaderboard}
                    isLoading={dashboardIdeasQuery.isLoading}
                    gridArea="userLeaderboard"
                    onViewAll={() => navigate("/leaderboard")}
                  />
                ) : null}
              </>
            ) : (
              recentWidget.visible ? (
              <Card sx={{ gridArea: "recent" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h3">{recentWidget.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recentWidget.helper}
                      </Typography>
                    </Box>
                    <Button variant="text" onClick={() => navigate("/kaizens")} endIcon={<ArrowForwardRoundedIcon />}>
                      View all
                    </Button>
                  </Stack>
                  <Stack spacing={1.25}>
                    {dashboardIdeasQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={66} />)
                    ) : ideas.length > 0 ? (
                      ideas.slice(0, 5).map((idea) => (
                        <ClickableRow key={idea.id} onClick={() => navigate(`/kaizens/show/${idea.id}`)}>
                          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                {idea.title || "Untitled Kaizen"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {kaizenReferenceLabel(idea)} - {formatDate(idea.created_at)}
                              </Typography>
                            </Box>
                            <StatusChip status={idea.status} />
                          </Stack>
                        </ClickableRow>
                      ))
                    ) : (
                      <EmptyState
                        kind="no-data"
                        title={isProgramDashboard ? "No Kaizens yet" : "No ideas yet"}
                        body={isProgramDashboard ? "Submitted Kaizens will appear here." : "Create your first Kaizen and it will appear here."}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
              ) : null
            )}

            {!isExecutiveDashboard && impactWidget.visible ? (
              <Card sx={{ gridArea: "impact" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h3">{impactWidget.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {impactWidget.helper}
                      </Typography>
                    </Box>
                    <Stack spacing={2}>
                      <MetricLine icon={<HourglassTopRoundedIcon fontSize="small" />} label="Total Hours Saved" value={formatInteger(totalHours)} isLoading={impactIdeasQuery.isLoading} />
                      <MetricLine icon={<InsightsRoundedIcon fontSize="small" />} label="Total FTE Saving" value={formatFteSaving(totalFteSaving)} isLoading={impactIdeasQuery.isLoading} />
                      {isProgramDashboard ? (
                        <MetricLine
                          icon={<AutoAwesomeRoundedIcon fontSize="small" />}
                          label="Avg Rework Reduced"
                          value={`${formatHoursSaved(averageQualityImprovement)}%`}
                        />
                      ) : null}
                    </Stack>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary">
                          Closure Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatInteger(completionRate)}%
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={completionRate} aria-label="Closure progress" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {!isExecutiveDashboard && certificatesWidget.visible ? (
              <Card sx={{ gridArea: "certificates" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h3">{certificatesWidget.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {certificatesWidget.helper}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={1.25}>
                    {certificatesQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} variant="rounded" height={66} />)
                    ) : certificates.length > 0 ? (
                      certificates.map((certificate) => {
                        const url = certificateUrl(certificate.certificate_path);
                        return (
                        <Box
                          key={certificate.id}
                          sx={{
                            border: `1px solid ${taruviTokens.surface.borderLight}`,
                            borderRadius: 1.25,
                            px: 1.75,
                            py: 1.5,
                          }}
                        >
                          <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 700, minWidth: 0 }}>
                                {certificate.certificate_number}
                              </Typography>
                              <Box sx={{ flexShrink: 0 }}>
                                <StatusChip status={certificate.status} />
                              </Box>
                            </Stack>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.25}
                              alignItems={{ xs: "stretch", sm: "center" }}
                              justifyContent="space-between"
                              sx={{ minWidth: 0 }}
                            >
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
                                {formatDate(certificate.issued_at)} - {formatCurrency(certificate.reward_amount)}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                                sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}
                              >
                              {url ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VisibilityRoundedIcon />}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ minWidth: 96 }}
                                >
                                  View
                                </Button>
                              ) : null}
                              {url ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<DownloadRoundedIcon />}
                                  href={url}
                                  download={certificateDownloadName(certificate)}
                                  sx={{ minWidth: 122 }}
                                >
                                  Download
                                </Button>
                              ) : null}
                              </Stack>
                            </Stack>
                          </Stack>
                        </Box>
                        );
                      })
                    ) : (
                      <EmptyState
                        kind="no-data"
                        title="No certificates yet"
                        body="Completed and rewarded Kaizens will show up here."
                        action={
                          <Button variant="outlined" onClick={() => navigate("/kaizens")}>
                            {isProgramDashboard ? "View All Kaizens" : "View My Kaizens"}
                          </Button>
                        }
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {trendWidget.visible ? (
            <Card sx={{ gridArea: "trend", height: isExecutiveDashboard ? "100%" : undefined }}>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h3">{trendWidget.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trendWidget.helper}
                    </Typography>
                  </Box>
                </Stack>
                {dashboardIdeasQuery.isLoading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : trend.length === 0 ? (
                  <EmptyState
                    kind="no-data"
                    title="No trend yet"
                    body={isProgramDashboard ? "Submitted Kaizens will build the monthly activity trend." : "Submit Kaizens to see monthly activity."}
                    action={
                      canSubmitKaizen ? (
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/kaizens/create")}>
                          Submit Kaizen
                        </Button>
                      ) : (
                        <Button variant="outlined" onClick={() => navigate("/kaizens")}>
                          View Kaizens
                        </Button>
                      )
                    }
                  />
                ) : (
                  <Box sx={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke={taruviTokens.neutral[200]} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: taruviTokens.text.secondary }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: taruviTokens.text.secondary }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: taruviTokens.primary[50] }} />
                        <Bar dataKey="count" name="Submissions" fill={taruviTokens.status.chartPrimary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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

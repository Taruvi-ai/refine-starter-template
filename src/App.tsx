import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  RefineSnackbarProvider,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/mui";
import Navkit from "./vendor/taruvi-navkit/App";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import routerProvider, { DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { taruviClient } from "./taruviClient";
import {
  taruviDataProvider,
  taruviAuthProvider,
  taruviStorageProvider,
  taruviAppProvider,
  taruviUserProvider,
  // taruviAccessControlProvider, // Uncomment to enable Cerbos-based access control
} from "./providers/refineProviders";
import { CustomSider, ErrorBoundary, UnsavedChangesDialog } from "./components";
import { LoginRedirect } from "./components/auth/LoginRedirect";
import { ColorModeContextProvider, ColorModeContext } from "./contexts/color-mode";
import {AppSettingsProvider, useAppSettings} from "./contexts/app-settings";
import { useContext, useEffect, useRef } from "react";
import { Home } from "./pages/home";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { KaizenCreate, KaizenEdit, KaizenList, KaizenShow } from "./pages/kaizens";
import { useKaizenRoles } from "./pages/kaizens/shared";
import { ReviewsPage } from "./pages/reviews";
import { TeamDashboardPage } from "./pages/team-dashboard";
import { OmSomDashboardPage } from "./pages/om-som-dashboard";
import { NotificationsPage } from "./pages/notifications";
import { AdminUsersPage } from "./pages/admin/users";
import { SettingsPage } from "./pages/settings";
import {
  AnalyticsPage,
  AuditPage,
  GlobalSearchPage,
  IncentivesPage,
  LeaderboardPage,
  ProductivityPage,
  RemindersPage,
  ReportsPage,
  ResourcesPage,
  ScorecardsPage,
} from "./pages/program";
import {
  AuditLogsPage,
  DuplicateManagementPage,
  EmailTemplatesPage,
  HighImpactAnalysisPage,
  IncentiveRulesPage,
  NewslettersPage,
  SystemHealthPage,
  TaxonomyPage,
} from "./pages/governance";
import {
  BulkOperationsPage,
  CertificateTemplatesPage,
  ComparativeAnalysisPage,
  DashboardWidgetsPage,
  EvidenceRepositoryPage,
  ImpactCalculationsPage,
  MasterDataPage,
  NotificationSettingsPage,
  SlaTrackingPage,
  WithdrawalsPage,
} from "./pages/operations";
import {
  HierarchyPage,
  InnovationPresentationsPage,
  RbacMatrixPage,
  RoRewardsPage,
} from "./pages/administration";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import NewspaperRoundedIcon from "@mui/icons-material/NewspaperRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import CancelScheduleSendRoundedIcon from "@mui/icons-material/CancelScheduleSendRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import DynamicFeedRoundedIcon from "@mui/icons-material/DynamicFeedRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";

const isLeadManagerLandingRole = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isManager && !roles.isAdmin && !roles.isOmSom && !roles.isPeQa;

const LandingPage = () => {
  const roles = useKaizenRoles();

  if (roles.isLoading) {
    return (
      <Box sx={{ minHeight: "calc(100vh - var(--nav-height, 64px))", display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Loading dashboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (isLeadManagerLandingRole(roles)) {
    return <Navigate to="/team-dashboard" replace />;
  }

  return <Home />;
};

const AppContent = () => {
  const { setMode } = useContext(ColorModeContext);
  const navRef = useRef<HTMLDivElement>(null);
  const { settings } = useAppSettings()

  useEffect(() => {
    const updateNavHeight = () => {
      if (!navRef.current) return;
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    };

    updateNavHeight();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateNavHeight) : null;
    if (navRef.current) resizeObserver?.observe(navRef.current);
    window.addEventListener("resize", updateNavHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateNavHeight);
    };
  }, []);

  return (
    <>
      <div
        ref={navRef}
        data-nav-container
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          width: '100%',
        }}
      >
        <Navkit
          client={taruviClient}
          getTheme={(theme) => setMode(theme)}
        />
      </div>
      <Box
        sx={{
          pt: "var(--nav-height, 64px)",
          height: "100vh",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
      <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={{
                  default: taruviDataProvider,
                  storage: taruviStorageProvider,
                  app: taruviAppProvider,
                  user: taruviUserProvider,
                }}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                authProvider={taruviAuthProvider}
                // accessControlProvider={taruviAccessControlProvider} // Uncomment to enable Cerbos-based access control
                resources={[
                  {
                    name: "kaizen_ideas",
                    list: "/kaizens",
                    create: "/kaizens/create",
                    edit: "/kaizens/edit/:id",
                    show: "/kaizens/show/:id",
                    meta: {
                      label: "Kaizen",
                      canDelete: false,
                      icon: <LightbulbRoundedIcon />,
                      aclResource: "datatable:kaizen_ideas",
                    },
                  },
                  {
                    name: "kaizen_team_dashboard",
                    list: "/team-dashboard",
                    meta: {
                      label: "Team Dashboard",
                      icon: <GroupsRoundedIcon />,
                      aclResource: "datatable:kaizen_ideas",
                    },
                  },
                  {
                    name: "kaizen_om_som_dashboard",
                    list: "/om-som-dashboard",
                    meta: {
                      label: "Team's Dashboard",
                      icon: <GroupsRoundedIcon />,
                      aclResource: "datatable:kaizen_ideas",
                    },
                  },
                  {
                    name: "kaizen_reviews",
                    list: "/reviews",
                    meta: {
                      label: "Reviews",
                      icon: <RateReviewRoundedIcon />,
                      aclResource: "datatable:kaizen_reviews",
                    },
                  },
                  {
                    name: "kaizen_notifications",
                    list: "/notifications",
                    meta: {
                      label: "Notification",
                      icon: <NotificationsRoundedIcon />,
                      aclResource: "datatable:kaizen_notifications",
                    },
                  },
                  {
                    name: "program_analytics",
                    list: "/analytics",
                    meta: {
                      label: "Analytics",
                      icon: <AnalyticsRoundedIcon />,
                      aclResource: "function:kaizen-analytics-summary",
                    },
                  },
                  {
                    name: "kaizen_leaderboard",
                    list: "/leaderboard",
                    meta: {
                      label: "Leaderboard",
                      icon: <EmojiEventsRoundedIcon />,
                      aclResource: "function:kaizen-analytics-summary",
                    },
                  },
                  {
                    name: "kaizen_reports",
                    list: "/reports",
                    meta: {
                      label: "Report",
                      icon: <AssessmentRoundedIcon />,
                      aclResource: "datatable:kaizen_report_archives",
                    },
                  },
                  {
                    name: "kaizen_scorecards",
                    list: "/scorecards",
                    meta: {
                      label: "Scorecards",
                      icon: <ScoreboardRoundedIcon />,
                      aclResource: "function:kaizen-analytics-summary",
                    },
                  },
                  {
                    name: "kaizen_global_search",
                    list: "/search",
                    meta: {
                      label: "Global Search",
                      icon: <SearchRoundedIcon />,
                      aclResource: "datatable:kaizen_ideas",
                    },
                  },
                  {
                    name: "kaizen_audit",
                    list: "/audit",
                    meta: {
                      label: "PE/QA Audit",
                      icon: <FactCheckRoundedIcon />,
                      aclResource: "datatable:kaizen_ideas",
                    },
                  },
                  {
                    name: "kaizen_training_resources",
                    list: "/resources",
                    meta: {
                      label: "Resources",
                      icon: <LibraryBooksRoundedIcon />,
                      aclResource: "datatable:kaizen_training_resources",
                    },
                  },
                  {
                    name: "kaizen_reminders",
                    list: "/reminders",
                    meta: {
                      label: "Reminders",
                      icon: <NotificationsActiveRoundedIcon />,
                      aclResource: "datatable:kaizen_reminders",
                    },
                  },
                  {
                    name: "kaizen_incentive_batches",
                    list: "/incentives",
                    meta: {
                      label: "Incentives",
                      icon: <PaidRoundedIcon />,
                      aclResource: "datatable:kaizen_incentive_batches",
                    },
                  },
                  {
                    name: "kaizen_incentive_formula_configs",
                    list: "/incentive-rules",
                    meta: {
                      label: "Incentive Rules",
                      icon: <RuleRoundedIcon />,
                      aclResource: "datatable:kaizen_incentive_formula_configs",
                    },
                  },
                  {
                    name: "kaizen_high_impact_analyses",
                    list: "/high-impact-analysis",
                    meta: {
                      label: "High Impact Kaizen",
                      icon: <WorkspacePremiumRoundedIcon />,
                      aclResource: "datatable:kaizen_high_impact_analyses",
                    },
                  },
                  {
                    name: "kaizen_audit_logs",
                    list: "/audit-logs",
                    meta: {
                      label: "Audit Logs",
                      icon: <HistoryRoundedIcon />,
                      aclResource: "datatable:kaizen_audit_logs",
                    },
                  },
                  {
                    name: "kaizen_duplicate_checks",
                    list: "/duplicates",
                    meta: {
                      label: "Duplicates",
                      icon: <ContentCopyRoundedIcon />,
                      aclResource: "datatable:kaizen_duplicate_checks",
                    },
                  },
                  {
                    name: "kaizen_taxonomy",
                    list: "/taxonomy",
                    meta: {
                      label: "Taxonomy",
                      icon: <CategoryRoundedIcon />,
                      aclResource: "datatable:kaizen_taxonomy",
                    },
                  },
                  {
                    name: "kaizen_email_templates",
                    list: "/email-templates",
                    meta: {
                      label: "Email Templates",
                      icon: <MarkEmailReadRoundedIcon />,
                      aclResource: "datatable:kaizen_email_templates",
                    },
                  },
                  {
                    name: "kaizen_newsletters",
                    list: "/newsletters",
                    meta: {
                      label: "Newsletters",
                      icon: <NewspaperRoundedIcon />,
                      aclResource: "datatable:kaizen_newsletters",
                    },
                  },
                  {
                    name: "kaizen_system_health_snapshots",
                    list: "/system-health",
                    meta: {
                      label: "System Health",
                      icon: <MonitorHeartRoundedIcon />,
                      aclResource: "datatable:kaizen_system_health_snapshots",
                    },
                  },
                  {
                    name: "kaizen_productivity_reports",
                    list: "/productivity",
                    meta: {
                      label: "Productivity",
                      icon: <BadgeRoundedIcon />,
                      aclResource: "datatable:kaizen_report_archives",
                    },
                  },
                  {
                    name: "kaizen_master_data",
                    list: "/master-data",
                    meta: {
                      label: "Master Data",
                      icon: <AccountTreeRoundedIcon />,
                      aclResource: "datatable:kaizen_processes",
                    },
                  },
                  {
                    name: "kaizen_withdrawals",
                    list: "/withdrawals",
                    meta: {
                      label: "Withdrawals",
                      icon: <CancelScheduleSendRoundedIcon />,
                      aclResource: "datatable:kaizen_withdrawals",
                    },
                  },
                  {
                    name: "kaizen_sla_snapshots",
                    list: "/sla-tracking",
                    meta: {
                      label: "SLA Tracking",
                      icon: <TimerRoundedIcon />,
                      aclResource: "datatable:kaizen_sla_snapshots",
                    },
                  },
                  {
                    name: "kaizen_certificates",
                    list: "/certificates",
                    meta: {
                      label: "Certificate",
                      icon: <DynamicFeedRoundedIcon />,
                      aclResource: "datatable:kaizen_certificates",
                    },
                  },
                  {
                    name: "kaizen_bulk_operations",
                    list: "/bulk-operations",
                    meta: {
                      label: "Bulk Operations",
                      icon: <DynamicFeedRoundedIcon />,
                      aclResource: "datatable:kaizen_bulk_operations",
                    },
                  },
                  {
                    name: "kaizen_notification_preferences",
                    list: "/notification-settings",
                    meta: {
                      label: "Notification Settings",
                      icon: <TuneRoundedIcon />,
                      aclResource: "datatable:kaizen_notification_preferences",
                    },
                  },
                  {
                    name: "kaizen_impact_calculations",
                    list: "/impact-calculations",
                    meta: {
                      label: "Impact Calculations",
                      icon: <FunctionsRoundedIcon />,
                      aclResource: "datatable:kaizen_impact_calculations",
                    },
                  },
                  {
                    name: "kaizen_comparison_views",
                    list: "/comparative-analysis",
                    meta: {
                      label: "Comparison",
                      icon: <CompareArrowsRoundedIcon />,
                      aclResource: "datatable:kaizen_comparison_views",
                    },
                  },
                  {
                    name: "kaizen_impact_evidence",
                    list: "/evidence-repository",
                    meta: {
                      label: "Evidence",
                      icon: <FolderCopyRoundedIcon />,
                      aclResource: "datatable:kaizen_impact_evidence",
                    },
                  },
                  {
                    name: "kaizen_dashboard_widget_layouts",
                    list: "/dashboard-widgets",
                    meta: {
                      label: "Dashboard Widgets",
                      icon: <DashboardCustomizeRoundedIcon />,
                      aclResource: "datatable:kaizen_dashboard_widget_layouts",
                    },
                  },
                  {
                    name: "kaizen_ro_incentives",
                    list: "/ro-rewards",
                    meta: {
                      label: "RO Rewards",
                      icon: <SupervisorAccountRoundedIcon />,
                      aclResource: "datatable:kaizen_ro_incentives",
                    },
                  },
                  {
                    name: "kaizen_hierarchy_assignments",
                    list: "/hierarchy",
                    meta: {
                      label: "Hierarchy",
                      icon: <AccountTreeRoundedIcon />,
                      aclResource: "datatable:kaizen_hierarchy_assignments",
                    },
                  },
                  {
                    name: "kaizen_rbac_permissions",
                    list: "/rbac-matrix",
                    meta: {
                      label: "RBAC Matrix",
                      icon: <AdminPanelSettingsRoundedIcon />,
                      aclResource: "datatable:kaizen_rbac_permissions",
                    },
                  },
                  {
                    name: "kaizen_presentation_exports",
                    list: "/innovation-presentations",
                    meta: {
                      label: "Presentations",
                      icon: <SlideshowRoundedIcon />,
                      aclResource: "datatable:kaizen_presentation_exports",
                    },
                  },
                  {
                    name: "kaizen_settings",
                    list: "/settings",
                    meta: {
                      label: "Settings",
                      icon: <SettingsRoundedIcon />,
                      aclResource: "datatable:kaizen_dropdown_options",
                    },
                  },
                  {
                    name: "users",
                    list: "/admin/users",
                    meta: {
                      label: "User Roles",
                      icon: <ManageAccountsRoundedIcon />,
                      aclResource: "datatable:kaizen_role_change_audits",
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "obEpHJ-M7JimA-31GF1J",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="login-route"
                        fallback={<Outlet />}
                      >
                        <Navigate to="/" replace />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<LoginRedirect />}
                      >
                        <ThemedLayout
                          Header={() => null}
                          Sider={CustomSider}
                          initialSiderCollapsed={true}
                          childrenBoxProps={{
                            sx: {
                              p: 0,
                              height: "calc(100vh - var(--nav-height, 64px))",
                              overflowX: "hidden",
                              overflowY: "auto",
                              overscrollBehavior: "contain",
                            },
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <ErrorBoundary>
                              <Outlet />
                            </ErrorBoundary>
                          </Box>
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<LandingPage />} />
                    <Route path="/kaizens" element={<KaizenList />} />
                    <Route path="/kaizens/create" element={<KaizenCreate />} />
                    <Route path="/kaizens/edit/:id" element={<KaizenEdit />} />
                    <Route path="/kaizens/show/:id" element={<KaizenShow />} />
                    <Route path="/kaizen" element={<KaizenList />} />
                    <Route path="/kaizen/create" element={<KaizenCreate />} />
                    <Route path="/kaizen/edit/:id" element={<KaizenEdit />} />
                    <Route path="/kaizen/show/:id" element={<KaizenShow />} />
                    <Route path="/team-dashboard" element={<TeamDashboardPage />} />
                    <Route path="/om-som-dashboard" element={<OmSomDashboardPage />} />
                    <Route path="/reviews" element={<ReviewsPage />} />
                    <Route path="/review" element={<ReviewsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/notification" element={<NotificationsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/report" element={<ReportsPage />} />
                    <Route path="/scorecards" element={<ScorecardsPage />} />
                    <Route path="/search" element={<GlobalSearchPage />} />
                    <Route path="/global-search" element={<GlobalSearchPage />} />
                    <Route path="/audit" element={<AuditPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/reminders" element={<RemindersPage />} />
                    <Route path="/incentives" element={<IncentivesPage />} />
                    <Route path="/incentive-rules" element={<IncentiveRulesPage />} />
                    <Route path="/high-impact-analysis" element={<HighImpactAnalysisPage />} />
                    <Route path="/high-impact" element={<HighImpactAnalysisPage />} />
                    <Route path="/high-impact-kaizen" element={<HighImpactAnalysisPage />} />
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                    <Route path="/audit-log" element={<AuditLogsPage />} />
                    <Route path="/duplicates" element={<DuplicateManagementPage />} />
                    <Route path="/taxonomy" element={<TaxonomyPage />} />
                    <Route path="/email-templates" element={<EmailTemplatesPage />} />
                    <Route path="/newsletters" element={<NewslettersPage />} />
                    <Route path="/system-health" element={<SystemHealthPage />} />
                    <Route path="/productivity" element={<ProductivityPage />} />
                    <Route path="/master-data" element={<MasterDataPage />} />
                    <Route path="/withdrawals" element={<WithdrawalsPage />} />
                    <Route path="/sla-tracking" element={<SlaTrackingPage />} />
                    <Route path="/certificates" element={<CertificateTemplatesPage />} />
                    <Route path="/certificate" element={<CertificateTemplatesPage />} />
                    <Route path="/certificate-templates" element={<CertificateTemplatesPage />} />
                    <Route path="/bulk-operations" element={<BulkOperationsPage />} />
                    <Route path="/notification-settings" element={<NotificationSettingsPage />} />
                    <Route path="/impact-calculations" element={<ImpactCalculationsPage />} />
                    <Route path="/comparative-analysis" element={<ComparativeAnalysisPage />} />
                    <Route path="/evidence-repository" element={<EvidenceRepositoryPage />} />
                    <Route path="/dashboard-widgets" element={<DashboardWidgetsPage />} />
                    <Route path="/ro-rewards" element={<RoRewardsPage />} />
                    <Route path="/hierarchy" element={<HierarchyPage />} />
                    <Route path="/rbac-matrix" element={<RbacMatrixPage />} />
                    <Route path="/innovation-presentations" element={<InnovationPresentationsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesDialog />
                <DocumentTitleHandler handler={() => settings?.displayName || ""}/>
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </RefineSnackbarProvider>
      </Box>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AppSettingsProvider>
            <CssBaseline />
            <GlobalStyles
              styles={{
                html: { WebkitFontSmoothing: 'antialiased' },
                "html, body, #root": {
                  height: "100%",
                  overflow: "hidden",
                },
                body: { fontFamily: "'Open Sans', sans-serif" },
                'h1, h2, h3, h4, h5, h6': { fontFamily: "'Quicksand', sans-serif" },
                '*::-webkit-scrollbar': { width: 8, height: 8 },
                '*::-webkit-scrollbar-track': { background: 'transparent' },
                '*::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.18)',
                  borderRadius: 8,
                },
                '*::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.32)' },
                '[data-theme="dark"] *::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.18)',
                },
              }}
            />
            <AppContent />
          </AppSettingsProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;

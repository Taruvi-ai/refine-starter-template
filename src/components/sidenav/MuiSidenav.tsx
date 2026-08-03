import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import {
  useMenu,
  useTranslate,
  type TreeMenuItem,
} from "@refinedev/core";

import { MenuItem } from "./MenuItem";
import { MobileBottomNav } from "./MobileBottomNav";
import { DRAWER_COLLAPSED_LABEL_MAX_WIDTH, DRAWER_WIDTH_COLLAPSED, DRAWER_WIDTH_EXPANDED } from "./constants";
import { useKaizenRoles } from "../../pages/kaizens/shared";
import { formatMenuLabel } from "./labels";
import "./sidenav.css";

const MY_KAIZEN_RESOURCE_NAME = "kaizen_ideas";
const MY_KAIZEN_ROUTE = "/kaizens";
const KAIZEN_CREATE_ROUTE = "/kaizens/create";
const REVIEW_RESOURCE_NAME = "kaizen_reviews";
const REVIEW_ROUTE = "/reviews";
const NOTIFICATION_RESOURCE_NAME = "kaizen_notifications";
const NOTIFICATION_ROUTE = "/notifications";
const SETTINGS_RESOURCE_NAME = "kaizen_settings";
const SETTINGS_ROUTE = "/settings";
const CERTIFICATE_RESOURCE_NAME = "kaizen_certificates";
const CERTIFICATE_ROUTES = new Set(["/certificates", "/certificate", "/certificate-templates"]);
const TEAM_DASHBOARD_RESOURCE_NAME = "kaizen_team_dashboard";
const TEAM_DASHBOARD_ROUTE = "/team-dashboard";
const OM_SOM_DASHBOARD_RESOURCE_NAME = "kaizen_om_som_dashboard";
const OM_SOM_DASHBOARD_ROUTE = "/om-som-dashboard";
const SIDENAV_RESOURCE_NAMES = new Set([
  "kaizen_ideas",
  "kaizen_team_dashboard",
  "kaizen_om_som_dashboard",
  "kaizen_reviews",
  "kaizen_notifications",
  "kaizen_leaderboard",
  "kaizen_reports",
  "kaizen_global_search",
  "kaizen_high_impact_analyses",
  "kaizen_certificates",
  "kaizen_settings",
]);
const SIDENAV_ROUTES = new Set([
  "/kaizens",
  "/team-dashboard",
  "/om-som-dashboard",
  "/reviews",
  "/notifications",
  "/leaderboard",
  "/reports",
  "/search",
  "/high-impact-analysis",
  "/certificates",
  "/certificate",
  "/certificate-templates",
  "/settings",
]);

const isReviewsMenuItem = (item: TreeMenuItem) =>
  item.name === REVIEW_RESOURCE_NAME ||
  item.key === REVIEW_RESOURCE_NAME ||
  item.route === REVIEW_ROUTE ||
  item.label === "Reviews";

const isNotificationsMenuItem = (item: TreeMenuItem) =>
  item.name === NOTIFICATION_RESOURCE_NAME ||
  item.key === NOTIFICATION_RESOURCE_NAME ||
  item.route === NOTIFICATION_ROUTE ||
  item.label === "Notification" ||
  item.label === "Notifications";

const isSettingsMenuItem = (item: TreeMenuItem) =>
  item.name === SETTINGS_RESOURCE_NAME ||
  item.key === SETTINGS_RESOURCE_NAME ||
  item.route === SETTINGS_ROUTE ||
  item.label === "Settings";

const isCertificateMenuItem = (item: TreeMenuItem) =>
  item.name === CERTIFICATE_RESOURCE_NAME ||
  item.key === CERTIFICATE_RESOURCE_NAME ||
  CERTIFICATE_ROUTES.has(item.route ?? "") ||
  item.label === "Certificate" ||
  item.label === "Certificates";

const isMyKaizenMenuItem = (item: TreeMenuItem) =>
  item.name === MY_KAIZEN_RESOURCE_NAME ||
  item.key === MY_KAIZEN_RESOURCE_NAME ||
  item.route === MY_KAIZEN_ROUTE ||
  item.label === "My Kaizen" ||
  item.label === "Kaizen";

const isKaizenCreateMenuItem = (item: TreeMenuItem) =>
  item.route === KAIZEN_CREATE_ROUTE ||
  item.key === KAIZEN_CREATE_ROUTE ||
  item.name === "kaizen_ideas.create" ||
  item.label === "Create Kaizen" ||
  item.label === "Submit Kaizen";

const isTeamDashboardMenuItem = (item: TreeMenuItem) =>
  item.name === TEAM_DASHBOARD_RESOURCE_NAME ||
  item.key === TEAM_DASHBOARD_RESOURCE_NAME ||
  item.route === TEAM_DASHBOARD_ROUTE ||
  item.label === "Team Dashboard";

const isOmSomDashboardMenuItem = (item: TreeMenuItem) =>
  item.name === OM_SOM_DASHBOARD_RESOURCE_NAME ||
  item.key === OM_SOM_DASHBOARD_RESOURCE_NAME ||
  item.route === OM_SOM_DASHBOARD_ROUTE ||
  item.label === "OM/SOM Dashboard" ||
  item.label === "Team's Dashboard";

const isSidenavMenuItem = (item: TreeMenuItem) =>
  SIDENAV_RESOURCE_NAMES.has(item.name ?? "") ||
  SIDENAV_RESOURCE_NAMES.has(item.key ?? "") ||
  SIDENAV_ROUTES.has(item.route ?? "");

const isLeadManagerOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isManager && !roles.isAdmin && !roles.isOmSom && !roles.isPeQa;

const isOmSomOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isOmSom && !roles.isAdmin && !roles.isPeQa;

const orderOmSomMenuItems = (items: TreeMenuItem[]) => {
  const reviewIndex = items.findIndex(isReviewsMenuItem);
  const kaizenIndex = items.findIndex(isMyKaizenMenuItem);
  if (reviewIndex < 0 || kaizenIndex < 0 || kaizenIndex === reviewIndex + 1) return items;

  const ordered = [...items];
  const [kaizenItem] = ordered.splice(kaizenIndex, 1);
  const nextReviewIndex = ordered.findIndex(isReviewsMenuItem);
  ordered.splice(nextReviewIndex + 1, 0, kaizenItem);
  return ordered;
};

const filterSidenavMenuItems = (items: TreeMenuItem[], roles: ReturnType<typeof useKaizenRoles>): TreeMenuItem[] => {
  const leadManagerOnly = isLeadManagerOnly(roles);
  const omSomOnly = isOmSomOnly(roles);

  return items.flatMap((item) => {
    if (!roles.canSubmitKaizen && isKaizenCreateMenuItem(item)) return [];
    if (roles.isAdmin && (isReviewsMenuItem(item) || isNotificationsMenuItem(item))) return [];
    if (!roles.isSuperAdmin && isSettingsMenuItem(item)) return [];
    if (leadManagerOnly && isMyKaizenMenuItem(item)) return [];
    if (!roles.isSuperAdmin && isCertificateMenuItem(item)) return [];

    if (isTeamDashboardMenuItem(item)) {
      if (!leadManagerOnly) return [];

      const children = item.children?.length
        ? filterSidenavMenuItems(item.children, roles)
            .filter((child) => !isReviewsMenuItem(child))
        : [];

      return [{ ...item, children }];
    }

    if (isOmSomDashboardMenuItem(item)) {
      if (!omSomOnly) return [];

      const children = item.children?.length
        ? filterSidenavMenuItems(item.children, roles)
            .filter((child) => !isReviewsMenuItem(child))
        : [];

      return [{ ...item, children }];
    }

    if (!roles.canReview && isReviewsMenuItem(item)) return [];

    const children = item.children?.length
      ? filterSidenavMenuItems(item.children, roles)
      : [];

    if (isSidenavMenuItem(item)) {
      return item.children?.length || children.length ? [{ ...item, children }] : [item];
    }

    if (children.length > 0) {
      return [{ ...item, children }];
    }

    return [];
  });
};

interface MuiSidenavProps {
  meta?: Record<string, unknown>;
}

export const MuiSidenav: React.FC<MuiSidenavProps> = ({ meta }) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslate();

  const { menuItems, selectedKey } = useMenu({ meta });
  const roles = useKaizenRoles();
  const omSomOnly = isOmSomOnly(roles);
  const leadManagerOnly = isLeadManagerOnly(roles);

  const roleFilteredMenuItems = useMemo(
    () => {
      const filteredItems = filterSidenavMenuItems(menuItems, roles);
      return omSomOnly ? orderOmSomMenuItems(filteredItems) : filteredItems;
    },
    [menuItems, omSomOnly, roles],
  );

  const handleToggle = () => {
    if (expanded) setSearchQuery("");
    setExpanded(!expanded);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (text?: string) =>
    !normalizedQuery || (text ?? "").toLowerCase().includes(normalizedQuery);

  const itemMatchesQuery = (item: TreeMenuItem): boolean => {
    if (matchesQuery(item.label || item.name)) return true;
    return Boolean(item.children?.some(itemMatchesQuery));
  };

  const filteredMenuItems = normalizedQuery
    ? roleFilteredMenuItems.filter(itemMatchesQuery)
    : roleFilteredMenuItems;

  const dashboardLabel = roles.isAdmin ? "Executive View Dashboard" : t("dashboard.title", "Dashboard");
  const dashboardRoute = leadManagerOnly ? TEAM_DASHBOARD_ROUTE : "/";
  const showDashboard = !leadManagerOnly && !omSomOnly && (!normalizedQuery || matchesQuery(dashboardLabel));

  const handleNavigate = useCallback(
    (route: string) => {
      navigate(route);
    },
    [navigate]
  );

  const isDashboardSelected = location.pathname === dashboardRoute;
  const drawerWidth = expanded ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  const dashboardButtonContent = (
    <ListItemButton
      aria-label={dashboardLabel}
      onClick={() => handleNavigate(dashboardRoute)}
      selected={isDashboardSelected}
      sx={{
        minHeight: expanded ? 48 : 64,
        flexDirection: expanded ? "row" : "column",
        justifyContent: expanded ? "initial" : "center",
        alignItems: "center",
        borderRadius: 1.25,
        mx: 1,
        mb: 0.5,
        py: expanded ? 1 : 0.75,
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: expanded ? 2 : 0,
          justifyContent: "center",
        }}
      >
        <DashboardRoundedIcon />
      </ListItemIcon>
      <ListItemText
        primary={formatMenuLabel(dashboardLabel, expanded)}
        sx={{
          m: 0,
          mt: expanded ? 0 : 0.5,
          textAlign: expanded ? "left" : "center",
          width: expanded ? "auto" : "100%",
          "& .MuiListItemText-primary": {
            display: "block",
            maxWidth: expanded ? "100%" : DRAWER_COLLAPSED_LABEL_MAX_WIDTH,
            overflow: "hidden",
            textOverflow: expanded ? "ellipsis" : "clip",
            fontFamily: "'Quicksand', sans-serif",
            fontSize: expanded ? 12 : 10.5,
            fontWeight: isDashboardSelected ? 700 : 600,
            lineHeight: expanded ? 1.35 : 1.12,
            letterSpacing: 0,
          },
        }}
        primaryTypographyProps={{
          noWrap: expanded,
          whiteSpace: expanded ? "nowrap" : "pre-line",
        }}
      />
    </ListItemButton>
  );

  const dashboardButton = expanded ? (
    dashboardButtonContent
  ) : (
    <Tooltip title={dashboardLabel} placement="right">
      {dashboardButtonContent}
    </Tooltip>
  );

  return (
    <>
      {/* Desktop Sidenav */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          flexShrink: 0,
          width: drawerWidth,
          transition: "width 0.2s ease-in-out",
          "& .MuiDrawer-paper": {
            position: "fixed",
            top: "var(--nav-height, 60px)",
            left: 0,
            height: "calc(100vh - var(--nav-height, 60px))",
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "divider",
            transition: "width 0.2s ease-in-out",
            overflowX: "hidden",
            zIndex: 1200,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Toggle + Search */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            {expanded && (
              <TextField
                size="small"
                placeholder={t("search.placeholder", "Search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Clear menu search" onClick={() => setSearchQuery("")}>
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": { fontSize: 13 },
                }}
              />
            )}
            <IconButton aria-label={expanded ? "Collapse navigation" : "Expand navigation"} onClick={handleToggle}>
              {expanded ? <ChevronLeftRoundedIcon /> : <MenuRoundedIcon />}
            </IconButton>
          </Box>

          <Divider />

          {/* Menu Items */}
          <List sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", py: 1 }}>
            {/* Dashboard */}
            {showDashboard && dashboardButton}

            {/* Resource Menu Items */}
            {filteredMenuItems.map((item, index) => (
              <MenuItem
                key={`${item.key || item.route || item.name || "menu-item"}-${index}`}
                item={item}
                selectedKey={selectedKey || location.pathname}
                expanded={expanded}
                onNavigate={handleNavigate}
              />
            ))}

            {expanded && normalizedQuery && !showDashboard && filteredMenuItems.length === 0 && (
              <Box sx={{ px: 2, py: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("search.empty", "No matches")}
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        menuItems={roleFilteredMenuItems}
        selectedKey={selectedKey || location.pathname}
        onNavigate={handleNavigate}
        showDashboard={!leadManagerOnly && !omSomOnly}
        dashboardLabel={dashboardLabel}
        dashboardRoute={dashboardRoute}
      />
    </>
  );
};

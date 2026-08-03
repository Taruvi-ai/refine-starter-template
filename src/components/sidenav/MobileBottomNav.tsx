import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ListRoundedIcon from "@mui/icons-material/ListRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useTranslate, type TreeMenuItem, CanAccess } from "@refinedev/core";
import { getAclResource } from "../../utils/aclResource";

interface MobileBottomNavProps {
  menuItems: TreeMenuItem[];
  selectedKey: string;
  onNavigate: (route: string) => void;
  showDashboard?: boolean;
  dashboardLabel?: string;
  dashboardRoute?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  menuItems,
  selectedKey,
  onNavigate,
  showDashboard = true,
  dashboardLabel,
  dashboardRoute = "/",
}) => {
  const t = useTranslate();
  const resolvedDashboardLabel = dashboardLabel ?? t("dashboard.title", "Dashboard");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // Show first 3 items in bottom nav, rest in "More" menu
  const visibleItems = menuItems.slice(0, 3);
  const moreItems = menuItems.slice(3);

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setAnchorEl(null);
  };

  const handleMoreItemClick = (route: string) => {
    onNavigate(route);
    handleMoreClose();
  };

  // Determine which value is selected
  const getSelectedValue = () => {
    if (showDashboard && (selectedKey === dashboardRoute || selectedKey === "dashboard")) return dashboardRoute;
    const visibleItem = visibleItems.find(
      (item) => item.route === selectedKey || item.key === selectedKey
    );
    if (visibleItem) return visibleItem.route || visibleItem.key || "";
    return "";
  };

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: "block", md: "none" },
          zIndex: 1200,
          borderTop: 1,
          borderColor: "divider",
          pb: "env(safe-area-inset-bottom)",
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getSelectedValue()}
          showLabels
        >
          {showDashboard ? (
            <BottomNavigationAction
              label={resolvedDashboardLabel}
              icon={<DashboardRoundedIcon />}
              value={dashboardRoute}
              onClick={() => onNavigate(dashboardRoute)}
            />
          ) : null}

          {/* Visible menu items */}
          {visibleItems.map((item, index) => {
            const route = item.route || item.key || "";
            return (
              <CanAccess
                key={`visible-${item.key || item.route || item.name || "menu-item"}-${index}`}
                resource={getAclResource(item)}
                action="read"
                params={{ resource: item }}
              >
                <BottomNavigationAction
                  label={item.label || item.name}
                  icon={item.icon || <ListRoundedIcon />}
                  value={route}
                  onClick={() => onNavigate(route)}
                />
              </CanAccess>
            );
          })}

          {moreItems.length > 0 ? (
            <BottomNavigationAction
              label={t("buttons.more", "More")}
              icon={<MenuRoundedIcon />}
              value="more"
              onClick={handleMoreClick}
            />
          ) : null}
        </BottomNavigation>
      </Paper>

      {/* More menu popup */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        {moreItems.map((item, index) => (
          <CanAccess
            key={`more-${item.key || item.route || item.name || "menu-item"}-${index}`}
            resource={getAclResource(item)}
            action="read"
            params={{ resource: item }}
          >
            <MenuItem
              onClick={() => handleMoreItemClick(item.route || "/")}
              selected={item.route === selectedKey || item.key === selectedKey}
            >
              <ListItemIcon>{item.icon || <ListRoundedIcon />}</ListItemIcon>
              <ListItemText primary={item.label || item.name} />
            </MenuItem>
          </CanAccess>
        ))}
      </Menu>
    </>
  );
};

import React, { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import Tooltip from "@mui/material/Tooltip";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ListRoundedIcon from "@mui/icons-material/ListRounded";
import { CanAccess, type TreeMenuItem } from "@refinedev/core";
import { getAclResource } from "../../utils/aclResource";
import { DRAWER_COLLAPSED_LABEL_MAX_WIDTH } from "./constants";
import { formatMenuLabel } from "./labels";

const isSelectedMenuItem = (item: TreeMenuItem, selectedKey: string): boolean =>
  item.key === selectedKey ||
  item.route === selectedKey ||
  Boolean(item.children?.some((child) => isSelectedMenuItem(child, selectedKey)));

interface MenuItemProps {
  item: TreeMenuItem;
  selectedKey: string;
  expanded: boolean;
  depth?: number;
  onNavigate: (route: string) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  item,
  selectedKey,
  expanded,
  depth = 0,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);

  const hasChildren = item.children && item.children.length > 0;
  const hasSelectedChild = Boolean(item.children?.some((child) => isSelectedMenuItem(child, selectedKey)));
  const isSelected = item.key === selectedKey || item.route === selectedKey || hasSelectedChild;
  const paddingLeft = expanded ? 2 + depth * 2 : 1;
  const label = item.label || item.name || "Menu item";

  useEffect(() => {
    if (expanded && hasSelectedChild) {
      setOpen(true);
    }
  }, [expanded, hasSelectedChild]);

  const handleClick = () => {
    if (item.route) {
      onNavigate(item.route);
    } else if (hasChildren) {
      setOpen(!open);
    }
  };

  const button = (
    <ListItemButton
      aria-label={label}
      onClick={handleClick}
      selected={isSelected}
      sx={{
        pl: expanded ? paddingLeft : undefined,
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
        {item.icon || <ListRoundedIcon />}
      </ListItemIcon>
      <ListItemText
        primary={formatMenuLabel(label, expanded)}
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
            fontWeight: isSelected ? 700 : 600,
            lineHeight: expanded ? 1.35 : 1.12,
            letterSpacing: 0,
          },
        }}
        primaryTypographyProps={{
          noWrap: expanded,
          whiteSpace: expanded ? "nowrap" : "pre-line",
        }}
      />
      {hasChildren && expanded && (
        <IconButton
          size="small"
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          sx={{ ml: "auto", p: 0.5 }}
        >
          {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
        </IconButton>
      )}
    </ListItemButton>
  );

  const wrappedButton = expanded ? button : (
    <Tooltip title={label} placement="right">
      {button}
    </Tooltip>
  );

  return (
    <CanAccess
      resource={getAclResource(item)}
      action="read"
      params={{ resource: item }}
    >
      {wrappedButton}
      {hasChildren && (
        <Collapse in={open && expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child, index) => (
              <MenuItem
                key={`${child.key || child.route || child.name || "menu-child"}-${depth + 1}-${index}`}
                item={child}
                selectedKey={selectedKey}
                expanded={expanded}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </CanAccess>
  );
};

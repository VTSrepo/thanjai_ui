import React, { useEffect, useState } from "react";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, ROLE, canUse } from "../utilities/UserContext";
import { getReceivablesSummary } from "../utilities/service";

// One menu; each item shows only when the user's role can open its screen (Role Master).
const MENU = [
  { label: "Admin Home", to: "/admin", screen: "DASHBOARD" },
  { label: "Home", to: "/home", screen: "HOME" },
  { label: "Indents", to: "/indents", screen: "INDENTS", labelFor: { X: "Orders" } },
  { label: "Batches", to: "/batches", screen: "BATCHES" },
  { label: "Inventory", to: "/inventory", screen: "INVENTORY" },
  { label: "Payments", to: "/payments", screen: "PAYMENTS", badge: "overdue" },
  { label: "My invoices", to: "/my-invoices", screen: "MY_INVOICES", badge: "overdue" },
  {
    label: "Reports",
    children: [
      { label: "Invoices", to: "/invoices", screen: "R_INVOICES" },
      { label: "Batches & wastage", to: "/batch-reports", screen: "R_BATCH" },
      { label: "Production", to: "/reports", screen: "R_PRODUCTION" },
      { label: "Indent", to: "/indent", screen: "R_INDENT" },
    ],
  },
  { label: "Timesheet", to: "/ts", screen: "TIMESHEET" },
  {
    label: "Online",
    children: [
      { label: "Online orders", to: "/online/orders", screen: "SUB_ORDERS" },
      { label: "Weekly menu", to: "/online/menu", screen: "SUB_SETUP" },
      { label: "Subscribers", to: "/online/customers", screen: "SUB_CUSTOMERS" },
      { label: "Shop setup", to: "/online/setup", screen: "SUB_SETUP" },
    ],
  },
  {
    label: "Master",
    children: [
      { label: "Product", to: "/product-master", screen: "M_PRODUCT" },
      { label: "Product list import", to: "/product-import", screen: "M_PRODUCT", edit: true },
      { label: "Employee", to: "/employee", screen: "M_EMPLOYEE" },
      { label: "User", to: "/user", screen: "M_USER" },
      { label: "Role", to: "/roles", screen: "M_ROLE" },
      { label: "Category", to: "/category", screen: "M_CATEGORY" },
      { label: "Branch", to: "/branch", screen: "M_BRANCH" },
      { label: "Opening stock import", to: "/stock-import", screen: "STOCK_IMPORT" },
    ],
  },
  // Production Monitor is hidden for now - Batch entry replaces it.
];

export const menuFor = (user) => {
  // Home / My invoices are the branch & customer views; head-office users have their own screens
  const headOffice = ["A", "O"].includes(user?.user_type);
  const ok = (i) => canUse(user, i.screen, !!i.edit) && !(headOffice && ["HOME", "MY_INVOICES"].includes(i.screen));
  return MENU.map((i) => (i.children ? { ...i, children: i.children.filter(ok) } : i))
    .filter((i) => (i.children ? i.children.length : ok(i)))
    .map((i) => ({ ...i, label: i.labelFor?.[user?.user_type] || i.label }));
};

// Overdue count for the badge, cached for a minute across page changes
let badgeCache = { at: 0, value: 0, user: null };
const useOverdueBadge = (user) => {
  const [count, setCount] = useState(badgeCache.user === user?.user_id ? badgeCache.value : 0);
  useEffect(() => {
    if (!user || user.user_type === ROLE.KITCHEN || !(canUse(user, "PAYMENTS") || canUse(user, "MY_INVOICES"))) return;
    if (badgeCache.user === user.user_id && Date.now() - badgeCache.at < 60000) return;
    getReceivablesSummary()
      .then((s) => {
        badgeCache = { at: Date.now(), value: s?.totals?.overdue_count || 0, user: user.user_id };
        setCount(badgeCache.value);
      })
      .catch(() => {});
  }, [user]);
  return count;
};

const ResponsiveAppBar = ({ onLogout }) => {
  const { user, logoutReset } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [drawer, setDrawer] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [anchor, setAnchor] = useState({ el: null, key: null });
  const overdue = useOverdueBadge(user);
  const items = menuFor(user);

  const logout = () => {
    badgeCache = { at: 0, value: 0, user: null };
    logoutReset();
    setAnchor({ el: null, key: null });
    if (onLogout) onLogout();
    navigate("/login");
  };

  const withBadge = (item, node) =>
    item.badge === "overdue" && overdue > 0 ? (
      <Badge color="error" badgeContent={overdue} max={99}>{node}</Badge>
    ) : (
      node
    );

  const active = (to) => location.pathname === to;

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: "primary.main" }}>
      <Toolbar sx={{ gap: 1 }}>
        {isMobile && (
          <IconButton color="inherit" edge="start" aria-label="Menu" onClick={() => setDrawer(true)}>
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ lineHeight: 1.1 }}>Thanjai Caterers</Typography>
          {user?.user_name && (
            <Typography variant="caption" noWrap sx={{ display: "block", opacity: 0.9 }}>
              {user.user_name}{user.branch_id ? ` · ${user.branch_id}` : ""}
            </Typography>
          )}
        </Box>

        {!isMobile &&
          items.map((item) =>
            item.children ? (
              <React.Fragment key={item.label}>
                <Button color="inherit" endIcon={<ExpandMore />} onClick={(e) => setAnchor({ el: e.currentTarget, key: item.label })}>
                  {item.label}
                </Button>
                <Menu anchorEl={anchor.el} open={anchor.key === item.label} onClose={() => setAnchor({ el: null, key: null })}>
                  {item.children.map((c) => (
                    <MenuItem key={c.to} component={Link} to={c.to} selected={active(c.to)}
                      onClick={() => setAnchor({ el: null, key: null })}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Menu>
              </React.Fragment>
            ) : (
              <Button key={item.to} color="inherit" component={Link} to={item.to}
                sx={{ fontWeight: active(item.to) ? 800 : 600, textDecoration: active(item.to) ? "underline" : "none" }}>
                {withBadge(item, <span>{item.label}</span>)}
              </Button>
            )
          )}

        {user && (
          <>
            <IconButton color="inherit" aria-label="Account" onClick={(e) => setAnchor({ el: e.currentTarget, key: "account" })}>
              <AccountCircle />
            </IconButton>
            <Menu anchorEl={anchor.el} open={anchor.key === "account"} onClose={() => setAnchor({ el: null, key: null })}>
              <MenuItem disabled sx={{ opacity: "1 !important" }}>
                <ListItemText primary={user.user_name} secondary={user.user_id} />
              </MenuItem>
              <Divider />
              <MenuItem component={Link} to="/change-password" onClick={() => setAnchor({ el: null, key: null })}>
                Change password
              </MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>

      {/* Phone navigation drawer */}
      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Box sx={{ width: 270 }} role="navigation">
          <Box sx={{ p: 2, bgcolor: "primary.main", color: "#fff" }}>
            <Typography fontWeight={700}>Thanjai Caterers</Typography>
            <Typography variant="caption">{user?.user_name}</Typography>
          </Box>
          <List>
            {items.map((item) =>
              item.children ? (
                <React.Fragment key={item.label}>
                  <ListItemButton onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}>
                    <ListItemText primary={item.label} />
                    {openGroup === item.label ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={openGroup === item.label}>
                    {item.children.map((c) => (
                      <ListItemButton key={c.to} sx={{ pl: 4 }} component={Link} to={c.to} selected={active(c.to)}
                        onClick={() => setDrawer(false)}>
                        <ListItemText primary={c.label} />
                      </ListItemButton>
                    ))}
                  </Collapse>
                </React.Fragment>
              ) : (
                <ListItemButton key={item.to} component={Link} to={item.to} selected={active(item.to)} onClick={() => setDrawer(false)}>
                  <ListItemText primary={withBadge(item, <span>{item.label}</span>)} />
                </ListItemButton>
              )
            )}
            <Divider sx={{ my: 1 }} />
            <ListItemButton component={Link} to="/change-password" onClick={() => setDrawer(false)}>
              <ListItemText primary="Change password" />
            </ListItemButton>
            <ListItemButton onClick={logout}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default ResponsiveAppBar;

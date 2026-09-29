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
import { useUser, ROLE } from "../utilities/UserContext";
import { getReceivablesSummary } from "../utilities/service";

// One menu definition per role. Items with `children` render as a dropdown.
export const MENUS = {
  [ROLE.ADMIN]: [
    { label: "Admin Home", to: "/admin" },
    { label: "Indents", to: "/indents" },
    { label: "Payments", to: "/payments", badge: "overdue" },
    {
      label: "Reports",
      children: [
        { label: "Invoices", to: "/invoices" },
        { label: "Production", to: "/reports" },
        { label: "Indent", to: "/indent" },
      ],
    },
    { label: "Production Monitor", to: "/production-monitor" },
    { label: "Timesheet", to: "/ts" },
    {
      label: "Master",
      children: [
        { label: "Product", to: "/product-master" },
        { label: "Employee", to: "/employee" },
        { label: "User", to: "/user" },
        { label: "Category", to: "/category" },
        { label: "Branch", to: "/branch" },
      ],
    },
  ],
  [ROLE.BRANCH]: [
    { label: "Home", to: "/home" },
    { label: "Indents", to: "/indents" },
    { label: "My invoices", to: "/my-invoices", badge: "overdue" },
  ],
  [ROLE.KITCHEN]: [{ label: "Indents", to: "/indents" }],
  [ROLE.EXTERNAL]: [
    { label: "Home", to: "/home" },
    { label: "Orders", to: "/indents" },
    { label: "My invoices", to: "/my-invoices", badge: "overdue" },
  ],
};

// Overdue count for the badge, cached for a minute across page changes
let badgeCache = { at: 0, value: 0, user: null };
const useOverdueBadge = (user) => {
  const [count, setCount] = useState(badgeCache.user === user?.user_id ? badgeCache.value : 0);
  useEffect(() => {
    if (!user || user.user_type === ROLE.KITCHEN) return;
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
  const items = MENUS[user?.user_type] || [];

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

import React, { useState } from "react";
import {
  Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, Container, Dialog, DialogContent, DialogTitle, Grid,
  IconButton, List, ListItem, ListItemIcon, ListItemText, Stack, Tab, Tabs, Tooltip, Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { CONFIG } from "../config-global";
import { useUser } from "../utilities/UserContext";
import { FEATURES } from "../utilities/features";

// ---------------------------------------------------------------- content
const ROLES = {
  admin: {
    name: "Admin", color: "#6a1b9a", Icon: AdminPanelSettingsIcon,
    short: "Owner / head office. Sets everything up and can do every task.",
    screens: ["Master → Branch, User, Role, Product", "Indents → To finalize", "Payments", "Reports", "Admin Home (alerts)"],
    tips: [
      "Set up kitchens first and give each a 2-letter short code (e.g. CK, TS) – batch numbers start with it.",
      "Give every person their own login. Their role decides which screens they see.",
      "Someone forgot their password? Master → User → key icon gives them a temporary one.",
      "Watch Admin Home every morning: stock shortfalls, overdue invoices and indents waiting for you.",
    ],
  },
  ops: {
    name: "Operations Manager", chip: "Ops Manager", color: "#1565c0", Icon: ManageAccountsIcon,
    short: "Runs the day: finalizes invoices, watches stock and batches, follows up payments.",
    screens: ["Indents → To finalize", "Batches", "Inventory", "Payments", "Reports"],
    tips: [
      "Finalize accepted indents quickly – the kitchen cannot dispatch until you do.",
      "Taxable or not is decided per item when you finalize, not on the final total.",
      "A red stock alert means the kitchen cannot dispatch: make sure today's batch is entered.",
      "Record part payments as they come in; the overdue badge shows who to call.",
    ],
  },
  kitchen: {
    name: "Kitchen", color: "#e65100", Icon: SoupKitchenIcon,
    short: "Cooks, enters batches, accepts and dispatches orders.",
    screens: ["Indents (accept, dispatch)", "Batches (enter what you cooked)", "Inventory"],
    tips: [
      "Accept new indents as soon as they arrive and set the delivery date.",
      "Enter each batch when it is cooked and stick the printed label on the tray.",
      "At dispatch the app picks the oldest batch first – you can change the split if needed.",
      "If the app says 'not enough stock', enter the batch first, then dispatch.",
    ],
  },
  branch: {
    name: "Branch / Restaurant", chip: "Branch", color: "#2e7d32", Icon: StorefrontIcon,
    short: "Orders food from the kitchen and confirms what arrived.",
    screens: ["Home", "Indents → New indent", "Indents → Receive", "My invoices"],
    tips: [
      "Order before the kitchen's cut-off so it can plan the cooking.",
      "When food arrives, enter the quantity you actually received – the invoice uses it.",
      "Note any damage or shortage while receiving; it stays on the record.",
      "Your invoices and what is still due are under My invoices.",
    ],
  },
  franchise: {
    name: "Franchise / External customer", chip: "Franchise", color: "#00838f", Icon: HandshakeIcon,
    short: "Outside customer who buys from the kitchen, receives and pays invoices.",
    screens: ["Home", "Indents → New indent", "Indents → Receive", "My invoices"],
    tips: [
      "Works exactly like a branch: order, receive, then the invoice appears.",
      "Payment terms (e.g. Net 30) are set by head office and shown on each invoice.",
      "Download any invoice as PDF from My invoices.",
    ],
  },
  customer: {
    name: "Online customer", chip: "Customer", color: "#ad1457", Icon: ShoppingBagIcon, online: true,
    short: "Buys a weekly meal plan on the website and picks meals each week.",
    screens: ["Website: Plans, This week's menu", "My account: Upcoming, Orders, Payments, My plan"],
    tips: [
      "Choose meals before the weekly cut-off – otherwise the chef's picks are sent.",
      "Skip a week, pause or cancel any time before the cut-off.",
      "All past orders, deliveries and receipts are under My account.",
    ],
  },
};

const SETUP = [
  { role: "admin", title: "Add your kitchens, restaurants and franchise customers", where: "Master → Branch", hint: "Kitchens get a 2-letter short code. Franchises are 'External customer'." },
  { role: "admin", title: "Create logins for your team", where: "Master → Role and Master → User", hint: "Pick what each role can see, then give each person a User ID." },
  { role: "admin", title: "Load your products", where: "Master → Product list import", hint: "Upload your product list: code, unit, price, kitchen, Veg/Non-veg." },
  { role: "kitchen", title: "Load today's stock once", where: "Master → Opening stock import", hint: "One time only, so the stock starts from the right number." },
  { role: "admin", title: "Set up the online shop", where: "Online → Shop setup", hint: "Plans, delivery areas and the hub branch.", online: true },
];

const ORDER_DAY = [
  { role: "branch", title: "Branch orders food", where: "Indents → New indent", alt: "franchise" },
  { role: "kitchen", title: "Kitchen accepts and sets the delivery date", where: "Indents" },
  { role: "ops", title: "Head office finalizes the invoice", where: "Indents → To finalize", hint: "Tax per item, payment terms, extra charges" },
  { role: "kitchen", title: "Kitchen cooks, enters the batch and dispatches", where: "Batches, then Indents → Dispatch" },
  { role: "branch", title: "Branch receives – invoice is created", where: "Indents → Receive", alt: "franchise" },
  { role: "ops", title: "Payment is recorded", where: "Payments" },
];

const ONLINE_WEEK = [
  { role: "ops", title: "Publish next week's menu", where: "Online → Weekly menu" },
  { role: "customer", title: "Customers choose plan and meals, and pay", where: "Website /meals" },
  { role: "ops", title: "At cut-off: run cut-off, send to kitchen", where: "Online → Online orders", hint: "Becomes a normal indent to each kitchen" },
  { role: "kitchen", title: "Kitchen cooks and dispatches as usual", where: "Batches, Indents" },
  { role: "ops", title: "Print packing slips, deliver, mark delivered", where: "Online → Online orders" },
];

// ---------------------------------------------------------------- pieces
const RoleChip = ({ id, onOpen, size = "small" }) => {
  const r = ROLES[id];
  return (
    <Tooltip arrow title={<><b>{r.name}</b><br />{r.short}<br /><i>Click for tips</i></>}>
      <Chip size={size} onClick={() => onOpen(id)} icon={<r.Icon style={{ color: "#fff" }} />} label={r.chip || r.name}
        sx={{ bgcolor: r.color, color: "#fff", fontWeight: 600, "&:hover": { bgcolor: r.color, filter: "brightness(1.1)" } }} />
    </Tooltip>
  );
};

/** One step as a card; steps sit side by side on wide screens and stack on phones. */
const Journey = ({ steps, onOpen }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
    {steps.map((s, i) => {
      const r = ROLES[s.role];
      return (
        <React.Fragment key={i}>
          <Card sx={{ flex: 1, minWidth: 0, borderTop: 4, borderTopColor: r.color }}>
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: r.color, fontSize: 14, fontWeight: 700 }}>{i + 1}</Avatar>
                <RoleChip id={s.role} onOpen={onOpen} />
              </Stack>
              <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>{s.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.where}</Typography>
              {s.hint && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{s.hint}</Typography>}
              {s.alt && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Franchises do the same.</Typography>}
            </CardContent>
          </Card>
          {i < steps.length - 1 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled" }} aria-hidden>
              <ArrowForwardIcon sx={{ display: { xs: "none", md: "block" } }} />
              <ArrowDownwardIcon sx={{ display: { xs: "block", md: "none" } }} />
            </Box>
          )}
        </React.Fragment>
      );
    })}
  </Stack>
);

const RoleDialog = ({ id, onClose }) => {
  if (!id) return null;
  const r = ROLES[id];
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: r.color, color: "#fff" }}>
        <r.Icon /> {r.name}
        <IconButton onClick={onClose} sx={{ ml: "auto", color: "#fff" }} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <Typography sx={{ mb: 2 }}>{r.short}</Typography>
        <Typography fontWeight={700}>Your main screens</Typography>
        <List dense>
          {r.screens.map((s) => (
            <ListItem key={s} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleOutlineIcon fontSize="small" sx={{ color: r.color }} /></ListItemIcon>
              <ListItemText primary={s} />
            </ListItem>
          ))}
        </List>
        <Typography fontWeight={700}>Tips</Typography>
        <List dense>
          {r.tips.map((t) => (
            <ListItem key={t} disableGutters alignItems="flex-start">
              <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}><LightbulbIcon fontSize="small" sx={{ color: "#f9a825" }} /></ListItemIcon>
              <ListItemText primary={t} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------- page
const Help = () => {
  document.title = `How to use | ${CONFIG.title.name}`;
  const { user } = useUser();
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState("daily");
  const online = FEATURES.online;
  const roleIds = Object.keys(ROLES).filter((k) => online || !ROLES[k].online);

  return (
    <>
      {user ? <ResponsiveAppBar /> : null}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: 26, sm: 34 } }}>How this app works</Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
          Kitchens cook, branches and franchises order, head office checks and invoices
          {online ? ", and online customers buy weekly meal plans" : ""}. Everyone works in the same app and sees only their part.
        </Typography>

        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Who does what</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Point at a role for a summary, or tap it for that role's screens and tips.</Typography>
        <Grid container spacing={1.5} sx={{ mb: 4 }}>
          {roleIds.map((id) => {
            const r = ROLES[id];
            return (
              <Grid item xs={6} sm={4} md={12 / Math.min(roleIds.length, 6)} key={id}>
                <Tooltip arrow placement="top" title={r.short}>
                  <Card sx={{ height: "100%", borderTop: 4, borderTopColor: r.color }}>
                    <CardActionArea onClick={() => setOpen(id)} sx={{ height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1.5 }}>
                        <Avatar sx={{ bgcolor: r.color, mx: "auto", mb: 1, width: 48, height: 48 }}><r.Icon /></Avatar>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>{r.name}</Typography>
                        <Typography variant="caption" color="primary.dark">Tips →</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>

        <Card sx={{ mb: 4, bgcolor: "#fff8f0" }}><CardContent>
          <Typography variant="h6" fontWeight={800}>Getting started (first week)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Do these once, in this order, before the first order.</Typography>
          <Stack spacing={1.25}>
            {SETUP.filter((s) => online || !s.online).map((s, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar sx={{ width: 30, height: 30, bgcolor: ROLES[s.role].color, fontSize: 15, fontWeight: 700 }}>{i + 1}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Typography fontWeight={700}>{s.title}</Typography>
                    <RoleChip id={s.role} onOpen={setOpen} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary"><b>{s.where}</b> · {s.hint}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </CardContent></Card>

        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>How an order moves</Typography>
        {online && (
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab value="daily" label="Branch & franchise orders (every day)" />
            <Tab value="online" label="Online weekly meals (every week)" />
          </Tabs>
        )}
        <Box sx={{ mb: 2 }}>
          <Journey steps={tab === "online" && online ? ONLINE_WEEK : ORDER_DAY} onOpen={setOpen} />
        </Box>
        <Alert severity="info" icon={<LightbulbIcon />} sx={{ mb: 4 }}>
          {tab === "online" && online
            ? "Online orders reach the kitchen as one normal indent per kitchen, so cooking, batches and dispatch work exactly like branch orders."
            : "The invoice is made from what the branch actually received, so shortages are never charged."}
        </Alert>

        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Good to know</Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            ["Forgot your password?", "Ask your admin. They open Master → User and use the key icon to give you a temporary password."],
            ["Not seeing a screen?", "Your role decides what you see. An admin can change it in Master → Role."],
            ["Works on your phone", "Every screen works on a phone. Tap the menu icon at the top left."],
            ["Batch numbers", "Kitchen code + product code + date + number, e.g. CKSAM1018260004. It shows where every tray went."],
          ].map(([t, d]) => (
            <Grid item xs={12} sm={6} md={3} key={t}>
              <Card sx={{ height: "100%" }}><CardContent>
                <Typography fontWeight={700}>{t}</Typography>
                <Typography variant="body2" color="text.secondary">{d}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
        {!user && <Button component={Link} to="/login" variant="contained">Go to login</Button>}
      </Container>
      <RoleDialog id={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default Help;

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid,
  InputLabel, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { getSubPlans, getSubSettings, getSubZones, saveSubPlan, saveSubSettings, saveSubZone } from "../../utilities/service";
import { cad, WEEKDAY } from "../../utilities/shopApi";

const EditDialog = ({ title, fields, value, onClose, onSave }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (!value || !v) return null;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {fields.map(([k, label, opts = {}]) => opts.select ? (
            <FormControl key={k}><InputLabel>{label}</InputLabel>
              <Select label={label} value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })}>
                {opts.select.map(([val, l]) => <MenuItem key={val} value={val}>{l}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField key={k} label={label} value={v[k] ?? ""} disabled={opts.lockOnEdit && !value.isNew} multiline={!!opts.multiline}
              helperText={opts.help} type={opts.type || "text"} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => onSave(v)}>Save</Button></DialogActions>
    </Dialog>
  );
};

const STATUS_OPTS = [["A", "Active"], ["I", "Inactive (hidden)"]];

const Plans = ({ canEdit }) => {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => getSubPlans().then((r) => setRows(r.plans)).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);
  const save = async (v) => { try { const r = await saveSubPlan(v); toast.success(r.message); setEdit(null); load(); } catch (e) { toast.error(e.message); } };
  if (!rows) return <Loader inline />;
  return (
    <>
      {canEdit && <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEdit({ isNew: true, status: "A", sort_order: rows.length + 1 })}>Add plan</Button>}
      <Card sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead><TableRow>{["Code", "Plan", "Meals / week", "Price", "Per meal", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.plan_id}>
              <TableCell>{p.plan_id}</TableCell><TableCell>{p.plan_name}</TableCell><TableCell>{p.meals_per_week}</TableCell>
              <TableCell>{cad(p.price)}</TableCell><TableCell>{cad(p.price / p.meals_per_week)}</TableCell>
              <TableCell><Chip size="small" label={p.status === "A" ? "Active" : "Inactive"} color={p.status === "A" ? "success" : "default"} /></TableCell>
              <TableCell>{canEdit && <Button size="small" onClick={() => setEdit(p)}>Edit</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Prices are before delivery and tax. A price change applies to orders created after it.</Typography>
      <EditDialog title={edit?.isNew ? "New plan" : `Edit ${edit?.plan_name}`} value={edit} onClose={() => setEdit(null)} onSave={save}
        fields={[["plan_id", "Code (e.g. STARTER)", { lockOnEdit: true }], ["plan_name", "Name"], ["meals_per_week", "Meals per week", { type: "number" }],
          ["price", "Price per week (CAD, before tax)", { type: "number" }], ["description", "Short description", { multiline: true }],
          ["sort_order", "Order on the page", { type: "number" }], ["status", "Status", { select: STATUS_OPTS }]]} />
    </>
  );
};

const Zones = ({ canEdit }) => {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => getSubZones().then((r) => setRows(r.zones)).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);
  const save = async (v) => { try { const r = await saveSubZone(v); toast.success(r.message); setEdit(null); load(); } catch (e) { toast.error(e.message); } };
  if (!rows) return <Loader inline />;
  return (
    <>
      {canEdit && <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEdit({ isNew: true, status: "A", delivery_fee: 0, sort_order: rows.length + 1 })}>Add zone</Button>}
      {!rows.length && <Alert severity="warning" sx={{ mb: 2 }}>No delivery zones yet. Customers cannot sign up until at least one zone exists.</Alert>}
      <Card sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead><TableRow>{["Code", "Zone", "Postal codes starting with", "Delivery fee", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((z) => (
            <TableRow key={z.zone_id}>
              <TableCell>{z.zone_id}</TableCell><TableCell>{z.zone_name}</TableCell>
              <TableCell sx={{ maxWidth: 360 }}>{z.postal_prefixes.split(",").join(", ")}</TableCell>
              <TableCell>{z.delivery_fee ? cad(z.delivery_fee) : "Free"}</TableCell>
              <TableCell><Chip size="small" label={z.status === "A" ? "Active" : "Inactive"} color={z.status === "A" ? "success" : "default"} /></TableCell>
              <TableCell>{canEdit && <Button size="small" onClick={() => setEdit(z)}>Edit</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>
      <EditDialog title={edit?.isNew ? "New delivery zone" : `Edit ${edit?.zone_name}`} value={edit} onClose={() => setEdit(null)} onSave={save}
        fields={[["zone_id", "Code (e.g. LAVAL)", { lockOnEdit: true }], ["zone_name", "Name shown to customers"],
          ["postal_prefixes", "Postal codes starting with", { multiline: true, help: "Comma separated, 1-3 characters each: H7 = all of Laval, H3B = one area. The first matching zone wins." }],
          ["delivery_fee", "Delivery fee per week (CAD)", { type: "number" }], ["sort_order", "Order", { type: "number" }], ["status", "Status", { select: STATUS_OPTS }]]} />
    </>
  );
};

const Settings = ({ canEdit }) => {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [branches, setBranches] = useState([]);
  const [mode, setMode] = useState("");
  useEffect(() => {
    getSubSettings().then((r) => { setS(r.settings); setBranches(r.branches); setMode(r.payment_mode); }).catch((e) => toast.error(e.message));
  }, [toast]);
  if (!s) return <Loader inline />;
  const f = (k, label, extra = {}) => (
    <TextField fullWidth size="small" label={label} value={s[k] ?? ""} disabled={!canEdit} onChange={(e) => setS({ ...s, [k]: e.target.value })} {...extra} />
  );
  const save = async () => { try { const r = await saveSubSettings(s); toast.success(r.message); } catch (e) { toast.error(e.message); } };
  return (
    <Card><CardContent>
      <Alert severity={mode === "stripe" ? "success" : "warning"} sx={{ mb: 2 }}>
        {mode === "stripe" ? "Card payments: Stripe is connected." : "Card payments are in TEST MODE (no Stripe key on the server). Orders are marked paid without charging a card."}
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>{f("shop_name", "Shop name")}</Grid>
        <Grid item xs={12} sm={3}>{f("support_phone", "Support phone")}</Grid>
        <Grid item xs={12} sm={3}>{f("support_email", "Support e-mail")}</Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small"><InputLabel>Delivery day</InputLabel>
            <Select label="Delivery day" value={s.delivery_weekday} disabled={!canEdit} onChange={(e) => setS({ ...s, delivery_weekday: e.target.value })}>
              {WEEKDAY.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4}>{f("cutoff_days_before", "Order cutoff: days before delivery", { type: "number" })}</Grid>
        <Grid item xs={6} sm={4}>{f("cutoff_time", "Cutoff time (HH:MM)", { type: "time", InputLabelProps: { shrink: true } })}</Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small"><InputLabel>Charge GST/QST</InputLabel>
            <Select label="Charge GST/QST" value={s.taxable} disabled={!canEdit} onChange={(e) => setS({ ...s, taxable: e.target.value })}>
              <MenuItem value="Y">Yes</MenuItem><MenuItem value="N">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4}>{f("gst_rate", "GST %", { type: "number" })}</Grid>
        <Grid item xs={6} sm={4}>{f("qst_rate", "QST %", { type: "number" })}</Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small"><InputLabel>Hub branch (raises the weekly kitchen indent)</InputLabel>
            <Select label="Hub branch (raises the weekly kitchen indent)" value={s.hub_branch_id || ""} disabled={!canEdit} onChange={(e) => setS({ ...s, hub_branch_id: e.target.value })}>
              <MenuItem value="">Not set</MenuItem>
              {branches.filter((b) => b.branch_type !== "K").map((b) => <MenuItem key={b.branch_id} value={b.branch_id}>{b.branch_name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Tip: create a branch called "Online subscriptions" in Branch Master and use it as the hub, so online meals are tracked separately from the restaurants.
      </Typography>
      {canEdit && <Button variant="contained" sx={{ mt: 2 }} onClick={save}>Save settings</Button>}
    </CardContent></Card>
  );
};

const OnlineSetup = () => {
  document.title = `Shop setup | ${CONFIG.title.name}`;
  const { can } = useUser();
  const canEdit = can("SUB_SETUP", true);
  const [tab, setTab] = useState("plans");
  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1100, mx: "auto" }}>
        <PageHeader title="Shop setup" subtitle="Plans, delivery zones and settings for the online weekly meals" />
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="plans" label="Plans" /><Tab value="zones" label="Delivery zones" /><Tab value="settings" label="Settings" />
        </Tabs>
        {tab === "plans" && <Plans canEdit={canEdit} />}
        {tab === "zones" && <Zones canEdit={canEdit} />}
        {tab === "settings" && <Settings canEdit={canEdit} />}
      </Box>
    </>
  );
};

export default OnlineSetup;

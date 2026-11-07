import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid,
  InputAdornment, InputLabel, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { getSubDishes, getSubPlans, getSubSettings, getSubZones, saveSubPlan, saveSubSettings, saveSubZone } from "../../utilities/service";
import DishPrices from "./DishPrices";
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

const TYPE = { V: ["Veg", "success"], N: ["Non-Veg", "error"], C: ["Combo", "warning"] };
const allowedIn = (type, d) => (type === "C" ? true : type === "V" ? d.diet === "V" : ["N", "E"].includes(d.diet));

const PlanDialog = ({ value, dishes, onClose, onSave }) => {
  const [v, setV] = useState(null);
  useEffect(() => setV(value ? { ...value, max_costly: value.max_costly ?? "", rows: Object.entries(value.overrides || {}).map(([product_id, discount_pct]) => ({ product_id, discount_pct })) } : null), [value]);
  if (!value || !v) return null;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const own = dishes.filter((d) => allowedIn(v.plan_type, d) && d.price !== null);
  const pct = Number(v.discount_pct || 0);
  const ex = own.slice(0, 3);
  const fixed = (v.plan_type || "V") !== "C";
  const meals = Number(v.meals_per_week) || 0;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{value.isNew ? "New plan" : `Edit ${value.plan_name}`}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Code (e.g. VEG5)" value={v.plan_id || ""} disabled={!value.isNew} onChange={set("plan_id")} /></Grid>
          <Grid item xs={12} sm={8}><TextField fullWidth label="Name shown to customers" value={v.plan_name || ""} onChange={set("plan_name")} /></Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth><InputLabel>Type</InputLabel>
              <Select label="Type" value={v.plan_type || "V"} onChange={set("plan_type")}>
                <MenuItem value="V">Veg - veg dishes</MenuItem><MenuItem value="N">Non-Veg - non-veg and egg dishes</MenuItem><MenuItem value="C">Combo - customer mixes veg and non-veg</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Meals per week" type="number" value={v.meals_per_week || ""} onChange={set("meals_per_week")} /></Grid>
          {fixed ? (
            <Grid item xs={6} sm={4}><TextField fullWidth label="Weekly price (CAD)" type="number" value={v.price || ""} onChange={set("price")} inputProps={{ step: 0.01, min: 0 }}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} helperText={Number(v.price) > 0 && meals ? `${cad(Number(v.price) / meals)} a meal` : "Fixed price for the week"} /></Grid>
          ) : (
            <Grid item xs={6} sm={4}><TextField fullWidth label="Discount off regular prices" type="number" value={v.discount_pct ?? 0} onChange={set("discount_pct")} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>
          )}
          <Grid item xs={12} sm={6}><TextField fullWidth label="Costly dishes allowed per week" type="number" value={v.max_costly} onChange={set("max_costly")} helperText={`Leave empty for no limit. e.g. 2 = at most 2 of the ${v.meals_per_week || "N"} meals can be costly dishes.`} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Order on the page" type="number" value={v.sort_order ?? 0} onChange={set("sort_order")} /></Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth><InputLabel>Status</InputLabel>
              <Select label="Status" value={v.status || "A"} onChange={set("status")}>{STATUS_OPTS.map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}</Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Short description" multiline value={v.description || ""} onChange={set("description")} /></Grid>
          {fixed ? (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Customers pay <b>{Number(v.price) > 0 ? cad(v.price) : "the weekly price"}</b> and choose any {meals || "N"} {v.plan_type === "N" ? "non-veg / egg" : "veg"} dishes from the week's menu{v.max_costly !== "" ? ` (at most ${v.max_costly} costly)` : ""}. Delivery and tax are added.
              </Alert>
            </Grid>
          ) : (<>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Customers pay the sum of the dishes they choose{pct ? `, each ${pct}% off its regular price` : " at regular prices"}.
              {ex.length > 0 && <> e.g. {ex.map((d) => `${d.product_name.toLowerCase()} ${cad(d.price)} → ${cad(d.price * (1 - (Number(v.rows.find((r) => r.product_id === d.product_id)?.discount_pct ?? (d.dish_discount !== null && d.dish_discount !== undefined ? d.dish_discount : pct))) / 100))}`).join(" · ")}</>}
              {!own.length && " No priced dishes of this type yet (Dish prices tab)."}
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Typography fontWeight={700} sx={{ mb: 0.5 }}>Different discount for particular dishes (optional)</Typography>
            {v.rows.map((r, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Autocomplete sx={{ flexGrow: 1 }} size="small" options={own} value={own.find((d) => d.product_id === r.product_id) || null}
                  getOptionLabel={(d) => `${d.product_name} (${cad(d.price)})`} isOptionEqualToValue={(a, b) => a.product_id === b.product_id}
                  onChange={(e, d) => setV({ ...v, rows: v.rows.map((x, j) => (j === i ? { ...x, product_id: d?.product_id } : x)) })}
                  renderInput={(p) => <TextField {...p} placeholder="Dish" />} />
                <TextField size="small" type="number" sx={{ width: 120 }} value={r.discount_pct} onChange={(e) => setV({ ...v, rows: v.rows.map((x, j) => (j === i ? { ...x, discount_pct: e.target.value } : x)) })} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                <Button size="small" color="error" onClick={() => setV({ ...v, rows: v.rows.filter((x, j) => j !== i) })}>Remove</Button>
              </Stack>
            ))}
            <Button size="small" onClick={() => setV({ ...v, rows: [...v.rows, { product_id: null, discount_pct: "" }] })}>Add dish discount</Button>
          </Grid>
          </>)}
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ ...v, overrides: v.rows.filter((r) => r.product_id && r.discount_pct !== "") })}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const Plans = ({ canEdit }) => {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => {
    getSubPlans().then((r) => setRows(r.plans)).catch((e) => toast.error(e.message));
    getSubDishes().then((r) => setDishes(r.dishes)).catch(() => {});
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const save = async (v) => { try { const r = await saveSubPlan(v); toast.success(r.message); setEdit(null); load(); } catch (e) { toast.error(e.message); } };
  if (!rows) return <Loader inline />;
  return (
    <>
      {canEdit && <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEdit({ isNew: true, plan_type: "V", status: "A", discount_pct: 0, price: "", sort_order: rows.length + 1 })}>Add plan</Button>}
      {rows.some((p) => p.status === "A" && !p.ready) && <Alert severity="warning" sx={{ mb: 2 }}>Plans marked "set the weekly price" are hidden from customers until they have a price.</Alert>}
      <Card sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead><TableRow>{["Plan", "Type", "Meals / week", "Price", "Costly allowed", "Customers see", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.plan_id}>
              <TableCell><b>{p.plan_name}</b> <Typography component="span" variant="caption" color="text.secondary">{p.plan_id}</Typography></TableCell>
              <TableCell><Chip size="small" variant="outlined" color={TYPE[p.plan_type]?.[1]} label={TYPE[p.plan_type]?.[0] || p.plan_type} /></TableCell>
              <TableCell>{p.meals_per_week}</TableCell>
              <TableCell>{p.plan_type !== "C" ? (Number(p.price) > 0 ? <b>{cad(p.price)} / week</b> : <Typography variant="caption" color="error">set the weekly price</Typography>)
                : (() => { const n = Object.keys(p.overrides || {}).length; const base = p.discount_pct ? `${p.discount_pct}% off` : "Regular prices"; return n ? `${base} + ${n} dish discount${n === 1 ? "" : "s"}` : base; })()}</TableCell>
              <TableCell>{p.max_costly === null ? "No limit" : `${p.max_costly} of ${p.meals_per_week}`}</TableCell>
              <TableCell>{p.from_price === null ? <Typography variant="caption" color="warning.dark">{p.plan_type !== "C" ? "hidden - no price" : "no priced dishes"}</Typography> : p.plan_type !== "C" ? `${cad(p.from_price)} (${cad(p.from_per_meal)} / meal), any dish` : `from ${cad(p.from_price)} (${cad(p.from_per_meal)} / meal)`}</TableCell>
              <TableCell><Chip size="small" label={p.status === "A" ? "Active" : "Inactive"} color={p.status === "A" ? "success" : "default"} /></TableCell>
              <TableCell>{canEdit && <Button size="small" onClick={() => setEdit(p)}>Edit</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Veg / Non-Veg plans: fixed weekly price, any dishes of that kind (costly limit applies). Combo plans: sum of the chosen dishes at regular price less the discount. Delivery and tax are added. Price changes apply to orders not yet charged.
      </Typography>
      <PlanDialog value={edit} dishes={dishes} onClose={() => setEdit(null)} onSave={save} />
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
        <PageHeader title="Shop setup" subtitle="Plans, dish prices, delivery zones and settings for the online weekly meals" />
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="plans" label="Plans" /><Tab value="prices" label="Dish prices" /><Tab value="zones" label="Delivery zones" /><Tab value="settings" label="Settings" />
        </Tabs>
        {tab === "plans" && <Plans canEdit={canEdit} />}
        {tab === "prices" && <DishPrices canEdit={canEdit} />}
        {tab === "zones" && <Zones canEdit={canEdit} />}
        {tab === "settings" && <Settings canEdit={canEdit} />}
      </Box>
    </>
  );
};

export default OnlineSetup;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  Grid, InputLabel, Link as MuiLink, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
  TextField, Typography,
} from "@mui/material";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import MealPicker from "../../components/shop/MealPicker";
import AddressFields, { emptyAddress } from "../../components/shop/AddressFields";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import {
  cad, changeShopPassword, confirmCard, manageSubscription, niceDate, niceDateTime, saveMeals, saveProfile, shopMe,
  shopSession, skipWeek, updateCard,
} from "../../utilities/shopApi";
import { TestModeNote } from "./ShopOrder";

const STATUS_COLOR = { O: "info", P: "warning", C: "success", F: "error", K: "success", D: "default", S: "default", X: "default" };
const SUB_LABEL = { A: "Active", P: "Paused", N: "Awaiting first payment", C: "Cancelled" };

const OrderLines = ({ o }) => (
  <>
    {o.items.map((i) => (
      <Stack key={i.product_id} direction="row" justifyContent="space-between">
        <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{i.name.toLowerCase()}</Typography>
        <Typography variant="body2">× {i.qty}</Typography>
      </Stack>
    ))}
  </>
);

// ---- This week ----
const ThisWeek = ({ me, reload }) => {
  const toast = useToast();
  const { week, menu, subscription } = me;
  const order = week && me.orders.find((o) => o.delivery_date === week.delivery_date);
  const meals = order?.meals || subscription?.meals_per_week || 0;
  const initial = useMemo(() => Object.fromEntries((order?.items || []).map((i) => [i.product_id, i.qty])), [order]);
  const [counts, setCounts] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setCounts(initial), [initial]);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const run = async (fn) => { setBusy(true); try { const r = await fn(); toast.success(r.message); setEditing(false); await reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };

  if (!subscription || subscription.status === "C") return (
    <Card><CardContent>
      <Typography fontWeight={700}>You don't have an active plan</Typography>
      <Button component={Link} to="/meals/order" variant="contained" sx={{ mt: 2 }}>Start a plan</Button>
    </CardContent></Card>
  );
  if (subscription.status === "N") return (
    <Alert severity="warning" action={<Button component={Link} to="/meals/order" color="inherit">Complete order</Button>}>
      Your first payment is not complete yet.
    </Alert>
  );
  const upcoming = me.orders.filter((o) => ["C", "K"].includes(o.status) && o.delivery_date !== week?.delivery_date);
  return (
    <Stack spacing={2}>
      {upcoming.map((o) => (
        <Card key={o.order_id}><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography fontWeight={700}>Coming {niceDate(o.delivery_date)}</Typography>
            <Chip size="small" color={STATUS_COLOR[o.status]} label={o.status_label} />
          </Stack>
          <OrderLines o={o} />
        </CardContent></Card>
      ))}
      {!week ? (
        <Alert severity="info">Next week's menu is not published yet. We'll fill your plan with the chef's picks if you don't choose.</Alert>
      ) : (
        <Card><CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 1 }}>
            <Box>
              <Typography fontWeight={700}>Delivery {niceDate(week.delivery_date)}</Typography>
              <Typography variant="body2" color="text.secondary">Change or skip until {niceDateTime(week.cutoff_at)}</Typography>
            </Box>
            {order && <Chip color={STATUS_COLOR[order.status]} label={order.status === "O" && order.items.length ? "Meals chosen – charged at cutoff" : order.status_label} />}
          </Stack>
          {subscription.status === "P" && <Alert severity="info" sx={{ mb: 1 }}>Your plan is paused until {niceDate(subscription.paused_until)}.</Alert>}
          {order?.status === "S" ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ flexGrow: 1 }}>You're skipping this week – no charge.</Typography>
              <Button variant="contained" disabled={busy} onClick={() => run(() => skipWeek(week.delivery_date, false))}>Un-skip</Button>
            </Stack>
          ) : editing ? (
            <>
              <Card sx={{ position: "sticky", top: 64, zIndex: 2, mb: 2 }}><CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ flexGrow: 1 }}>Chosen <b>{total} of {meals}</b></Typography>
                  <Button onClick={() => { setCounts(initial); setEditing(false); }}>Cancel</Button>
                  <Button variant="contained" disabled={busy || total !== meals}
                    onClick={() => run(() => saveMeals(week.delivery_date, Object.entries(counts).filter(([, n]) => n).map(([product_id, qty]) => ({ product_id, qty }))))}>
                    Save meals
                  </Button>
                </Stack>
              </CardContent></Card>
              <MealPicker menu={menu} counts={counts} onChange={setCounts} meals={meals} />
            </>
          ) : (
            <>
              {order?.items.length ? <OrderLines o={order} /> : <Typography color="text.secondary">You haven't chosen yet. If you don't, we'll send the chef's picks{me.customer.diet_pref === "V" ? " (vegetarian)" : ""}.</Typography>}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {(!order || ["O", "P", "F", "C"].includes(order.status)) && <Button variant="contained" onClick={() => setEditing(true)}>{order?.items.length ? "Change meals" : "Choose meals"}</Button>}
                {(!order || ["O", "P", "F"].includes(order.status)) && subscription.status === "A" && (
                  <Button disabled={busy} onClick={() => run(() => skipWeek(week.delivery_date, true))}>Skip this week</Button>
                )}
              </Stack>
            </>
          )}
        </CardContent></Card>
      )}
    </Stack>
  );
};

// ---- Orders ----
const Orders = ({ orders }) => (
  <Stack spacing={1.5}>
    {!orders.length && <Typography color="text.secondary">No orders yet.</Typography>}
    {orders.map((o) => (
      <Card key={o.order_id}><CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Typography fontWeight={700}>{niceDate(o.delivery_date)}</Typography>
            <Typography variant="caption" color="text.secondary">Order {o.order_id}{o.picked_by === "A" ? " · chef's picks" : ""}</Typography>
          </Box>
          <Chip size="small" color={STATUS_COLOR[o.status]} label={o.status_label} />
        </Stack>
        {o.status !== "S" && (
          <>
            <Divider sx={{ my: 1 }} />
            <OrderLines o={o} />
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {o.delivery_fee ? `Delivery ${cad(o.delivery_fee)} · ` : ""}GST {cad(o.gst_amount)} · QST {cad(o.qst_amount)}
              </Typography>
              <Typography fontWeight={700}>{cad(o.total)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Deliver to {o.ship_address} {o.ship_postal}</Typography>
          </>
        )}
      </CardContent></Card>
    ))}
  </Stack>
);

// ---- Payments ----
const PAY_STATUS = { S: ["Paid", "success"], F: ["Failed", "error"], P: ["Pending", "warning"], R: ["Refunded", "default"] };
const Payments = ({ payments }) => (
  <Card sx={{ overflowX: "auto" }}>
    <Table size="small">
      <TableHead><TableRow>{["Date", "Order", "Amount", "Card", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
      <TableBody>
        {!payments.length && <TableRow><TableCell colSpan={6} sx={{ color: "text.secondary" }}>No payments yet.</TableCell></TableRow>}
        {payments.map((p, i) => (
          <TableRow key={i}>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(p.created_date).toLocaleDateString("en-CA", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
            <TableCell>{p.order_id}</TableCell>
            <TableCell>{cad(p.amount)}</TableCell>
            <TableCell sx={{ textTransform: "capitalize" }}>{p.card_last4 ? `${p.card_brand} •••• ${p.card_last4}` : p.provider === "manual" ? "Paid offline" : "-"}</TableCell>
            <TableCell>
              <Chip size="small" color={(PAY_STATUS[p.status] || [])[1]} label={(PAY_STATUS[p.status] || [p.status])[0]} />
              {p.status === "F" && p.failure_message && <Typography variant="caption" color="error" display="block">{p.failure_message}</Typography>}
            </TableCell>
            <TableCell>{p.receipt_url && <MuiLink href={p.receipt_url} target="_blank" rel="noopener">Receipt</MuiLink>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

// ---- Plan ----
const Plan = ({ me, reload }) => {
  const toast = useToast();
  const s = me.subscription;
  const [planId, setPlanId] = useState(s?.plan_id || "");
  const [weeks, setWeeks] = useState(1);
  const [cancel, setCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (body) => { setBusy(true); try { const r = await manageSubscription(body); toast.success(r.message); setCancel(null); await reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const card = async () => { try { const r = await updateCard(); window.location.assign(r.url); } catch (e) { toast.error(e.message); } };
  if (!s) return <Card><CardContent><Typography>No plan yet.</Typography><Button component={Link} to="/meals/order" variant="contained" sx={{ mt: 2 }}>Start a plan</Button></CardContent></Card>;
  return (
    <Stack spacing={2}>
      <Card><CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={700}>{s.plan_name}</Typography>
            <Typography color="text.secondary">{s.meals_per_week} meals a week · {cad(s.price)} + delivery and tax</Typography>
          </Box>
          <Chip label={SUB_LABEL[s.status] || s.status} color={s.status === "A" ? "success" : "default"} />
        </Stack>
      </CardContent></Card>
      {s.status !== "N" && (
        <Card><CardContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Change plan</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Plan</InputLabel>
              <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                {me.plans.map((p) => <MenuItem key={p.plan_id} value={p.plan_id}>{p.plan_name} – {p.meals_per_week} meals, {cad(p.price)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" disabled={busy || planId === s.plan_id} onClick={() => run({ action: "change_plan", plan_id: planId })}>Change plan</Button>
          </Stack>
        </CardContent></Card>
      )}
      {s.status !== "N" && (
        <Card><CardContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Pause or cancel</Typography>
          {s.status === "P" ? (
            <Button variant="contained" disabled={busy} onClick={() => run({ action: "resume" })}>Resume my plan</Button>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Pause for</InputLabel>
                <Select label="Pause for" value={weeks} onChange={(e) => setWeeks(e.target.value)}>
                  {[1, 2, 3, 4, 6, 8].map((w) => <MenuItem key={w} value={w}>{w} week{w > 1 ? "s" : ""}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="outlined" disabled={busy} onClick={() => run({ action: "pause", weeks })}>Pause</Button>
              <Button color="error" onClick={() => setCancel({ reason: "" })}>Cancel plan</Button>
            </Stack>
          )}
        </CardContent></Card>
      )}
      <Card><CardContent>
        <Typography fontWeight={700} sx={{ mb: 1 }}>Payment card</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ flexGrow: 1, textTransform: "capitalize" }}>{me.customer.card ? `${me.customer.card.brand} •••• ${me.customer.card.last4}` : "No card saved"}</Typography>
          <Button variant="outlined" onClick={card}>Update card</Button>
        </Stack>
        <TestModeNote mode={me.payment_mode} />
      </CardContent></Card>
      <Dialog open={!!cancel} onClose={() => setCancel(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel your plan?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Deliveries already paid will still arrive. You can start again any time.</Typography>
          <TextField fullWidth label="Tell us why (optional)" value={cancel?.reason || ""} onChange={(e) => setCancel({ reason: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancel(null)}>Keep my plan</Button>
          <Button color="error" disabled={busy} onClick={() => run({ action: "cancel", reason: cancel.reason })}>Cancel plan</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ---- Details ----
const Details = ({ me, reload }) => {
  const toast = useToast();
  const [v, setV] = useState({ ...emptyAddress, ...me.customer });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const save = async () => { try { const r = await saveProfile(v); toast.success(r.message); await reload(); } catch (e) { toast.error(e.message); } };
  const changePw = async () => { try { const r = await changeShopPassword(pw); toast.success(r.message); setPw({ current_password: "", new_password: "" }); } catch (e) { toast.error(e.message); } };
  return (
    <Stack spacing={2}>
      <Card><CardContent>
        <Typography fontWeight={700} sx={{ mb: 2 }}>Delivery details · {me.customer.email}</Typography>
        <AddressFields value={v} onChange={setV} />
        <Button variant="contained" sx={{ mt: 2 }} onClick={save}>Save details</Button>
        {me.zone && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Delivery area: {me.zone.zone_name}{me.zone.delivery_fee ? ` (${cad(me.zone.delivery_fee)} per delivery)` : " (free delivery)"}</Typography>}
      </CardContent></Card>
      <Card><CardContent>
        <Typography fontWeight={700} sx={{ mb: 2 }}>Change password</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth type="password" label="Current password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="password" label="New password (8+ characters)" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Grid>
        </Grid>
        <Button variant="outlined" sx={{ mt: 2 }} disabled={!pw.current_password || pw.new_password.length < 8} onClick={changePw}>Change password</Button>
      </CardContent></Card>
    </Stack>
  );
};

const ShopAccount = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const tab = params.get("tab") || "week";
  const reload = useCallback(async () => {
    try { setMe(await shopMe()); } catch (e) { if (e.authExpired) navigate("/meals/login"); else setError(e.message); }
  }, [navigate]);
  useEffect(() => {
    const ref = params.get("card_ref");
    (async () => {
      if (ref) {
        try { const r = await confirmCard(ref); toast.success(r.message); } catch (e) { toast.error(e.message); }
        params.delete("card_ref"); setParams(params, { replace: true });
      }
      await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!shopSession.token()) return <Navigate to="/meals/login" replace />;
  if (!me) return error ? <ShopLayout><Alert severity="error">{error}</Alert></ShopLayout> : <Loader />;
  document.title = "My account";
  return (
    <ShopLayout>
      <Typography variant="h5" fontWeight={800}>Hi {me.customer.full_name.split(" ")[0]}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {me.subscription ? `${me.subscription.plan_name} · ${SUB_LABEL[me.subscription.status] || ""}` : "No plan yet"}
      </Typography>
      <Tabs value={tab} onChange={(e, v) => setParams({ tab: v })} variant="scrollable" sx={{ mb: 2 }}>
        <Tab value="week" label="Upcoming" />
        <Tab value="orders" label="Orders & deliveries" />
        <Tab value="payments" label="Payments" />
        <Tab value="plan" label="My plan" />
        <Tab value="details" label="My details" />
      </Tabs>
      {tab === "week" && <ThisWeek me={me} reload={reload} />}
      {tab === "orders" && <Orders orders={me.orders} />}
      {tab === "payments" && <Payments payments={me.payments} />}
      {tab === "plan" && <Plan me={me} reload={reload} />}
      {tab === "details" && <Details me={me} reload={reload} />}
    </ShopLayout>
  );
};

export default ShopAccount;

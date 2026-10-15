import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  Grid, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { chargeSubOrder, getSubOrders, getSubWeeks, runSubCutoff, sendSubKitchen, setSubOrderStatus } from "../../utilities/service";
import { cad, niceDate, niceDateTime } from "../../utilities/shopApi";

const STATUS = { O: ["Choosing", "info"], P: ["Awaiting payment", "warning"], C: ["Paid", "success"], F: ["Payment failed", "error"], K: ["In kitchen", "primary"], D: ["Delivered", "default"], S: ["Skipped", "default"], X: ["Cancelled", "default"] };
const WEEK = { D: "Draft", P: "Open for orders", C: "Cut off", K: "Sent to kitchen" };

const Tile = ({ label, value, color }) => (
  <Card sx={{ height: "100%" }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
  </CardContent></Card>
);

// Packing slips (one per page) and a route sheet grouped by zone
const printSlips = async (week, orders, shopName) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const list = orders.filter((o) => ["C", "K", "D"].includes(o.status));
  list.forEach((o, i) => {
    if (i) doc.addPage();
    doc.setFontSize(14); doc.setFont(undefined, "bold"); doc.text(shopName, 10, 14);
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(`Delivery ${niceDate(week.delivery_date)}   ·   Order ${o.order_id}   ·   ${o.zone_name || ""}`, 10, 21);
    doc.setFontSize(13); doc.setFont(undefined, "bold"); doc.text(o.ship_name || "", 10, 32);
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(doc.splitTextToSize(`${o.ship_address || ""} ${o.ship_postal || ""}`, 128), 10, 38);
    doc.text(`Phone: ${o.ship_phone || ""}`, 10, 48);
    if (o.delivery_notes) doc.text(doc.splitTextToSize(`Note: ${o.delivery_notes}`, 128), 10, 54);
    let y = 66;
    doc.setFont(undefined, "bold"); doc.text(`Meals (${o.meals})`, 10, y); doc.setFont(undefined, "normal");
    o.items.forEach((it) => { y += 7; doc.text(`${it.qty}  ×  ${it.name}`, 14, y); doc.rect(130, y - 4, 4, 4); });
  });
  if (!list.length) doc.text("No paid orders.", 10, 20);
  // route sheet
  doc.addPage("a4", "landscape");
  doc.setFontSize(14); doc.setFont(undefined, "bold"); doc.text(`Route sheet – ${niceDate(week.delivery_date)}`, 10, 14);
  doc.setFontSize(9); doc.setFont(undefined, "normal");
  let y = 24; let zone = null;
  list.forEach((o) => {
    if (o.zone_name !== zone) { zone = o.zone_name; y += 3; doc.setFont(undefined, "bold"); doc.text(zone || "No zone", 10, y); doc.setFont(undefined, "normal"); y += 6; }
    if (y > 195) { doc.addPage("a4", "landscape"); y = 16; }
    doc.text([o.order_id, (o.ship_name || "").slice(0, 26), `${o.ship_address || ""} ${o.ship_postal || ""}`.slice(0, 70), o.ship_phone || "", `${o.meals} meals`].join("    "), 12, y);
    doc.rect(280, y - 3.5, 4, 4);
    y += 6;
  });
  doc.save(`packing-${week.delivery_date}.pdf`);
};

const OnlineOrders = () => {
  document.title = `Online orders | ${CONFIG.title.name}`;
  const toast = useToast();
  const { can } = useUser();
  const canEdit = can("SUB_ORDERS", true);
  const [weeks, setWeeks] = useState(null);
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [manual, setManual] = useState(null);

  useEffect(() => {
    getSubWeeks().then((r) => {
      setWeeks(r.weeks);
      const open = [...r.weeks].reverse().find((w) => w.status !== "K") || r.weeks[0];
      if (open) setDate(open.delivery_date);
    }).catch((e) => toast.error(e.message));
  }, [toast]);
  const load = useCallback(() => {
    if (!date) return;
    setData(null); setSel([]);
    getSubOrders(date).then(setData).catch((e) => toast.error(e.message));
  }, [date, toast]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    setBusy(true);
    try { const r = await fn(); toast.success(r.message); setConfirm(null); setManual(null); load(); getSubWeeks().then((x) => setWeeks(x.weeks)); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const orders = useMemo(() => (data?.orders || []).filter((o) => !filter || o.status === filter), [data, filter]);
  if (!weeks) return <><ResponsiveAppBar /><Loader /></>;
  const w = data?.week;

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Online orders" subtitle="Weekly meal subscriptions: cutoff, kitchen and delivery" />
        {!weeks.length ? <Alert severity="info">No menu weeks yet. Create one under Online → Weekly menu.</Alert> : (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Delivery</InputLabel>
                <Select label="Delivery" value={date} onChange={(e) => setDate(e.target.value)}>
                  {weeks.map((x) => <MenuItem key={x.delivery_date} value={x.delivery_date}>{niceDate(x.delivery_date)} – {WEEK[x.status]}</MenuItem>)}
                </Select>
              </FormControl>
              {w && <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Cutoff {niceDateTime(w.cutoff_at)} · {WEEK[w.status]}{data.indent_numbers ? ` · indents ${data.indent_numbers}` : ""}</Typography>}
              {canEdit && w && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" disabled={busy || !["P"].includes(w.status)} onClick={() => setConfirm("cutoff")}>Run cutoff</Button>
                  <Button variant="contained" disabled={busy || w.status !== "C"} onClick={() => setConfirm("kitchen")}>Send to kitchen</Button>
                </Stack>
              )}
              {w && <Button startIcon={<PrintIcon />} onClick={() => printSlips(w, data.orders, data.shop_name || CONFIG.title.name)}>Packing slips</Button>}
            </Stack>
            {!data ? <Loader inline /> : (
              <>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Paid orders" value={data.summary.paid} /></Grid>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Meals to cook" value={data.summary.meals} /></Grid>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Revenue (incl. tax)" value={cad(data.summary.revenue)} /></Grid>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Not yet paid" value={data.summary.open} /></Grid>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Payment failed" value={data.summary.failed} color={data.summary.failed ? "error.main" : undefined} /></Grid>
                  <Grid item xs={6} sm={4} md={2}><Tile label="Skipped" value={data.summary.skipped} /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card><CardContent>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>Kitchen totals (paid)</Typography>
                      {!data.totals.length && <Typography variant="body2" color="text.secondary">No paid meals yet.</Typography>}
                      {data.totals.map((t) => (
                        <Stack key={t.product_id} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                          <Typography variant="body2">{t.name}</Typography><Typography variant="body2" fontWeight={700}>{t.qty}</Typography>
                        </Stack>
                      ))}
                    </CardContent></Card>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Status</InputLabel>
                        <Select label="Status" value={filter} onChange={(e) => setFilter(e.target.value)}>
                          <MenuItem value="">All</MenuItem>
                          {Object.entries(STATUS).map(([k, [l]]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Box sx={{ flexGrow: 1 }} />
                      {canEdit && sel.length > 0 && (
                        <>
                          <Button variant="outlined" disabled={busy} onClick={() => act(() => setSubOrderStatus({ order_ids: sel, status: "D" }))}>Mark {sel.length} delivered</Button>
                          <Button color="error" disabled={busy} onClick={() => setConfirm("cancel")}>Cancel {sel.length}</Button>
                        </>
                      )}
                    </Stack>
                    <TableContainer component={Card}>
                      <Table size="small">
                        <TableHead><TableRow>
                          {canEdit && <TableCell padding="checkbox"><Checkbox checked={!!orders.length && sel.length === orders.length} onChange={(e) => setSel(e.target.checked ? orders.map((o) => o.order_id) : [])} /></TableCell>}
                          {["Order", "Customer", "Zone", "Meals", "Total", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                        </TableRow></TableHead>
                        <TableBody>
                          {!orders.length && <TableRow><TableCell colSpan={8} sx={{ color: "text.secondary" }}>No orders.</TableCell></TableRow>}
                          {orders.map((o) => (
                            <TableRow key={o.order_id} hover>
                              {canEdit && <TableCell padding="checkbox"><Checkbox checked={sel.includes(o.order_id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.order_id] : sel.filter((x) => x !== o.order_id))} /></TableCell>}
                              <TableCell>{o.order_id}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{o.ship_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{o.ship_phone} · {o.ship_postal}</Typography>
                              </TableCell>
                              <TableCell>{o.zone_name}</TableCell>
                              <TableCell title={o.items.map((i) => `${i.qty} × ${i.name}`).join("\n")}>{o.status === "S" ? "-" : `${o.meals}${o.picked_by === "A" ? " (chef)" : ""}`}</TableCell>
                              <TableCell>{o.status === "S" ? "-" : cad(o.total)}</TableCell>
                              <TableCell><Chip size="small" color={STATUS[o.status][1]} label={STATUS[o.status][0]} /></TableCell>
                              <TableCell>
                                {canEdit && o.status === "F" && (
                                  <Stack direction="row" spacing={0.5}>
                                    <Button size="small" disabled={busy} onClick={() => act(() => chargeSubOrder({ order_id: o.order_id }))}>Retry card</Button>
                                    <Button size="small" onClick={() => setManual({ order_id: o.order_id, note: "" })}>Mark paid</Button>
                                  </Stack>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </>
            )}
          </>
        )}
      </Box>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{{ cutoff: "Run cutoff now?", kitchen: "Send to kitchen?", cancel: "Cancel orders?" }[confirm]}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirm === "cutoff" && "Subscribers who did not choose get the chef's picks, saved cards are charged and the week locks. Customers can no longer change meals."}
            {confirm === "kitchen" && "Paid meals are totalled per dish and an indent is raised to each producing kitchen. It then follows the normal indent flow."}
            {confirm === "cancel" && `${sel.length} order(s) will be cancelled. Refund any card payment from the Stripe dashboard.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Back</Button>
          <Button variant="contained" color={confirm === "cancel" ? "error" : "primary"} disabled={busy} onClick={() => act(() => (
            confirm === "cutoff" ? runSubCutoff(date) : confirm === "kitchen" ? sendSubKitchen(date) : setSubOrderStatus({ order_ids: sel, status: "X" })
          ))}>Confirm</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!manual} onClose={() => setManual(null)} fullWidth maxWidth="xs">
        <DialogTitle>Mark {manual?.order_id} as paid</DialogTitle>
        <DialogContent>
          <TextField fullWidth sx={{ mt: 1 }} label="How was it paid? (e.g. e-Transfer ref)" value={manual?.note || ""} onChange={(e) => setManual({ ...manual, note: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManual(null)}>Back</Button>
          <Button variant="contained" disabled={busy || !manual?.note} onClick={() => act(() => chargeSubOrder({ order_id: manual.order_id, manual: true, note: manual.note }))}>Mark paid</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OnlineOrders;

import React, { useEffect, useState } from "react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { getSubCustomer, getSubCustomers, resetSubCustomerPassword } from "../../utilities/service";
import { useUser } from "../../utilities/UserContext";
import { cad, niceDate } from "../../utilities/shopApi";

const SUB = { A: ["Active", "success"], P: ["Paused", "warning"], N: ["Unpaid start", "default"], C: ["Cancelled", "default"] };
const ORDER = { O: "Choosing", P: "Awaiting payment", C: "Paid", F: "Payment failed", K: "In kitchen", D: "Delivered", S: "Skipped", X: "Cancelled" };

const tempPassword = () => `Meals-${Math.floor(1000 + Math.random() * 9000)}`;

/** Staff sets a temporary password for a subscriber who forgot theirs. */
const ResetCustomerPassword = ({ customer, onClose }) => {
  const toast = useToast();
  const [pwd, setPwd] = useState(tempPassword());
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await resetSubCustomerPassword(customer.customer_id, pwd);
      toast.success(r.message || "Password reset");
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {customer.full_name} ({customer.email}) will log in to the meals page with this password. Ask them to change it under My details.
        </Typography>
        <TextField fullWidth label="Temporary password" value={pwd} onChange={(e) => setPwd(e.target.value)}
          helperText="At least 8 characters. Share it with the customer directly (phone or in person)." />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || pwd.length < 8}>Reset</Button>
      </DialogActions>
    </Dialog>
  );
};

const Detail = ({ id, onClose }) => {
  const toast = useToast();
  const { can } = useUser();
  const [d, setD] = useState(null);
  const [reset, setReset] = useState(false);
  useEffect(() => { setD(null); if (id) getSubCustomer(id).then(setD).catch((e) => toast.error(e.message)); }, [id, toast]);
  if (!id) return null;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{d ? d.customer.full_name : "Subscriber"}</DialogTitle>
      <DialogContent>
        {!d ? <Loader inline /> : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">{d.customer.email} · {d.customer.phone}</Typography>
                <Typography variant="body2" color="text.secondary">{d.customer.address_line1}{d.customer.address_line2 ? `, ${d.customer.address_line2}` : ""}, {d.customer.city} {d.customer.postal_code}</Typography>
                {d.customer.delivery_notes && <Typography variant="body2" color="text.secondary">Note: {d.customer.delivery_notes}</Typography>}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">Preference: {{ V: "Vegetarian", N: "Non-veg" }[d.customer.diet_pref] || "None"}{d.customer.allergies ? ` · Allergies: ${d.customer.allergies}` : ""}</Typography>
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>Card: {d.customer.card ? `${d.customer.card.brand} •••• ${d.customer.card.last4}` : "none"}</Typography>
                {d.subscriptions[0] && <Typography variant="body2">Plan {d.subscriptions[0].plan_id} · {SUB[d.subscriptions[0].status]?.[0]}{d.subscriptions[0].cancel_reason ? ` (“${d.subscriptions[0].cancel_reason}”)` : ""}</Typography>}
              </Grid>
            </Grid>
            <Typography fontWeight={700}>Orders</Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead><TableRow>{["Delivery", "Order", "Meals", "Total", "Status"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {d.orders.map((o) => (
                  <TableRow key={o.order_id} title={o.items.map((i) => `${i.qty} × ${i.name}`).join("\n")}>
                    <TableCell>{niceDate(o.delivery_date)}</TableCell><TableCell>{o.order_id}</TableCell>
                    <TableCell>{o.status === "S" ? "-" : o.meals}</TableCell><TableCell>{o.status === "S" ? "-" : cad(o.total)}</TableCell><TableCell>{ORDER[o.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider sx={{ mb: 1 }} />
            <Typography fontWeight={700}>Payments</Typography>
            <Table size="small">
              <TableHead><TableRow>{["Date", "Order", "Amount", "Via", "Status"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {d.payments.map((p) => (
                  <TableRow key={p.payment_id}>
                    <TableCell>{new Date(p.created_date).toLocaleDateString("en-CA")}</TableCell><TableCell>{p.order_id}</TableCell><TableCell>{cad(p.amount)}</TableCell>
                    <TableCell>{p.provider}{p.card_last4 ? ` •••• ${p.card_last4}` : ""}</TableCell>
                    <TableCell>{{ S: "Paid", F: "Failed", P: "Pending", R: "Refunded" }[p.status]}{p.failure_message ? ` – ${p.failure_message}` : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {d && can("SUB_CUSTOMERS", true) && <Button onClick={() => setReset(true)}>Reset password</Button>}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      {reset && d && <ResetCustomerPassword customer={d.customer} onClose={() => setReset(false)} />}
    </Dialog>
  );
};

const OnlineCustomers = () => {
  document.title = `Subscribers | ${CONFIG.title.name}`;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => getSubCustomers(q.trim()).then((r) => setRows(r.customers)).catch((e) => toast.error(e.message)), 300);
    return () => clearTimeout(t);
  }, [q, toast]);
  const active = (rows || []).filter((r) => r.sub_status === "A").length;
  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Subscribers" subtitle={rows ? `${rows.length} customers · ${active} active plans` : ""} />
        <TextField size="small" label="Search name, e-mail or phone" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 2, minWidth: 320 }} />
        {!rows ? <Loader inline /> : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead><TableRow>{["Customer", "Area", "Plan", "Status", "Paid orders", "Total paid", "Last delivery", "Joined"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {!rows.length && <TableRow><TableCell colSpan={8} sx={{ color: "text.secondary" }}>No subscribers yet.</TableCell></TableRow>}
                {rows.map((r) => (
                  <TableRow key={r.customer_id} hover sx={{ cursor: "pointer" }} onClick={() => setOpen(r.customer_id)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.email} · {r.phone}</Typography>
                    </TableCell>
                    <TableCell>{r.city} {r.postal_code}</TableCell>
                    <TableCell>{r.plan_id || "-"}</TableCell>
                    <TableCell>{r.sub_status ? <Chip size="small" color={SUB[r.sub_status]?.[1]} label={SUB[r.sub_status]?.[0]} /> : "-"}</TableCell>
                    <TableCell>{r.paid_orders}</TableCell>
                    <TableCell>{cad(r.total_paid)}</TableCell>
                    <TableCell>{r.last_delivery ? niceDate(r.last_delivery) : "-"}</TableCell>
                    <TableCell>{new Date(r.created_date).toLocaleDateString("en-CA")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Stack sx={{ mt: 1 }} />
      </Box>
      <Detail id={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default OnlineCustomers;

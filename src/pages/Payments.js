import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";
import HistoryIcon from "@mui/icons-material/History";
import EventIcon from "@mui/icons-material/Event";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import InvoiceDialog from "../components/InvoiceDialog";
import { useToast } from "../components/ToastProvider";
import {
  changeInvoiceTerms, getAllBranches, getInvoicePayments, getReceivables, getReceivablesSummary, recordPayment, voidPayment,
} from "../utilities/service";
import {
  CREDIT_TERMS, FormattedDate, PAYMENT_MODES, formatDate, modeLabel, money, payStatus, termLabel,
} from "../utilities/helpers";

const StatusChip = ({ inv }) => {
  const s = payStatus(inv);
  return <Chip size="small" color={s.color} variant={s.color === "default" ? "outlined" : "filled"} label={s.label} />;
};

const Due = ({ inv }) => (
  <Box>
    {formatDate(inv.due_date)}
    {inv.days_overdue > 0 && inv.balance_due > 0 && (
      <Typography variant="caption" color="error.main" display="block">{inv.days_overdue} days overdue</Typography>
    )}
  </Box>
);

// ---------- Payment detail (record a payment) ----------
const RecordPaymentDialog = ({ open, invoices, onClose, onSaved }) => {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const toast = useToast();
  const balance = invoices.reduce((s, i) => s + i.balance_due, 0);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ amount: balance.toFixed(2), payment_date: FormattedDate(new Date()), mode: "INTERAC", reference: "", note: "" });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amount = Number(form.amount || 0);
  // oldest due first, the same way the server applies it
  const allocation = useMemo(() => {
    let left = amount;
    return [...invoices]
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
      .map((i) => {
        const part = Math.max(0, Math.min(left, i.balance_due));
        left -= part;
        return { ...i, part };
      });
  }, [invoices, amount]);
  const invalid = !(amount > 0) || amount > balance + 0.004 || !form.mode || !form.payment_date;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await recordPayment({ ...form, amount, invoice_numbers: invoices.map((i) => i.invoice_number) });
      toast.success(res.message);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>Payment detail</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {invoices[0]?.bill_to_name} · {invoices.length} invoice(s) · balance {money(balance, true)}
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Amount" name="amount" type="number" value={form.amount || ""} onChange={set} fullWidth
              inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              error={amount > balance + 0.004} helperText={amount > balance + 0.004 ? `More than the balance (${money(balance, true)})` : "Part payments are fine"} />
            <TextField label="Payment date" name="payment_date" type="date" value={form.payment_date || ""} onChange={set}
              fullWidth InputLabelProps={{ shrink: true }} inputProps={{ max: FormattedDate(new Date()) }} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select label="Mode" name="mode" value={form.mode || ""} onChange={set} fullWidth>
              {PAYMENT_MODES.map((m) => <MenuItem key={m.code} value={m.code}>{m.label}</MenuItem>)}
            </TextField>
            <TextField label="Reference (cheque / e-Transfer no.)" name="reference" value={form.reference || ""} onChange={set} fullWidth />
          </Stack>
          <TextField label="Note" name="note" value={form.note || ""} onChange={set} multiline minRows={2} />
          {invoices.length > 1 && (
            <Box>
              <Typography variant="subtitle2">Applied oldest first</Typography>
              {allocation.map((a) => (
                <Stack key={a.invoice_number} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{a.invoice_number} (due {formatDate(a.due_date)})</Typography>
                  <Typography variant="body2">{money(a.part, true)} of {money(a.balance_due, true)}</Typography>
                </Stack>
              ))}
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={invalid || saving} onClick={save}>{saving ? "Saving..." : "Save payment"}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Payment history (+ void) ----------
const HistoryDialog = ({ invoiceNumber, onClose, onChanged }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [voiding, setVoiding] = useState(null);
  const [reason, setReason] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);

  const load = useCallback(async () => {
    if (!invoiceNumber) return;
    setData(null);
    try {
      setData(await getInvoicePayments(invoiceNumber));
    } catch (e) {
      toast.error(e.message);
    }
  }, [invoiceNumber, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const doVoid = async () => {
    try {
      await voidPayment(voiding.payment_id, reason);
      toast.success("Payment voided");
      setVoiding(null);
      setReason("");
      load();
      onChanged();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const inv = data?.invoice;
  return (
    <>
      <Dialog open={!!invoiceNumber} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Payments · {invoiceNumber}</DialogTitle>
        <DialogContent>
          {!data ? <Loader inline /> : (
            <>
              <Typography variant="body2" color="text.secondary">
                {inv.bill_to_name} · invoiced {formatDate(inv.invoice_date)} · {termLabel(inv.credit_term)} · due {formatDate(inv.due_date)}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ my: 1.5 }}>
                <Box><Typography variant="caption">Total</Typography><Typography fontWeight={700}>{money(inv.total_amount, true)}</Typography></Box>
                <Box><Typography variant="caption">Paid</Typography><Typography fontWeight={700}>{money(inv.amount_paid, true)}</Typography></Box>
                <Box><Typography variant="caption">Balance</Typography><Typography fontWeight={700}>{money(inv.balance_due, true)}</Typography></Box>
                <Box sx={{ alignSelf: "center" }}><StatusChip inv={inv} /></Box>
              </Stack>
              <Divider />
              {!data.payments.length && <Typography color="text.secondary" sx={{ py: 2 }}>No payments yet.</Typography>}
              {data.payments.map((p) => (
                <Stack key={p.payment_id} direction="row" alignItems="center" spacing={1} sx={{ py: 1, borderBottom: 1, borderColor: "divider", opacity: p.voided === "Y" ? 0.55 : 1 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ textDecoration: p.voided === "Y" ? "line-through" : "none" }}>
                      {formatDate(p.payment_date)} · {modeLabel(p.mode)}{p.reference ? ` · ${p.reference}` : ""} · {p.receipt_no}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.voided === "Y" ? `Voided by ${p.voided_by}: ${p.void_reason}` : `Entered by ${p.created_by} ${p.created_at || ""}`}
                      {p.note ? ` · ${p.note}` : ""}
                    </Typography>
                  </Box>
                  <Typography fontWeight={700}>{money(p.amount, true)}</Typography>
                  {p.voided !== "Y" && <Button size="small" color="error" onClick={() => setVoiding(p)}>Void</Button>}
                </Stack>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowInvoice(true)} disabled={!data}>Invoice PDF</Button>
          <Button variant="contained" onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!voiding} onClose={() => setVoiding(null)} fullWidth maxWidth="xs">
        <DialogTitle>Void payment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Void {money(voiding?.amount, true)} ({voiding?.receipt_no})? It stays in the history marked as voided and the balance goes back up.
          </Typography>
          <TextField autoFocus fullWidth label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setVoiding(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={reason.trim().length < 3} onClick={doVoid}>Void</Button>
        </DialogActions>
      </Dialog>

      <InvoiceDialog open={showInvoice} invoiceNumber={invoiceNumber} onClose={() => setShowInvoice(false)} />
    </>
  );
};

// ---------- Change terms ----------
const TermsDialog = ({ inv, onClose, onSaved }) => {
  const toast = useToast();
  const [term, setTerm] = useState(inv?.credit_term || "EOM");
  useEffect(() => setTerm(inv?.credit_term || "EOM"), [inv]);
  const save = async () => {
    try {
      await changeInvoiceTerms(inv.invoice_number, term);
      toast.success("Terms updated");
      onSaved();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <Dialog open={!!inv} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Credit term · {inv?.invoice_number}</DialogTitle>
      <DialogContent>
        <TextField select fullWidth label="Credit term" value={term} onChange={(e) => setTerm(e.target.value)} sx={{ mt: 1 }}
          helperText="The due date is recalculated from the invoice date">
          {CREDIT_TERMS.map((t) => <MenuItem key={t.code} value={t.code}>{t.label} ({t.printed})</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Page ----------
const Payments = () => {
  document.title = `Payments | ${CONFIG.title.name}`;
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [tab, setTab] = useState("open");
  const [customer, setCustomer] = useState("");
  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [payInvoices, setPayInvoices] = useState(null); // invoices in the Record payment dialog
  const [pickOpen, setPickOpen] = useState(false);
  const toast = useToast();
  const [history, setHistory] = useState(null);
  const [termsFor, setTermsFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, sum] = await Promise.all([
        tab === "aging" ? Promise.resolve([]) : getReceivables({ branch_id: customer || undefined, status: tab === "open" ? "open" : tab === "overdue" ? "overdue" : "all" }),
        getReceivablesSummary(),
      ]);
      setRows(list);
      setSummary(sum);
      setSelected([]);
      setPage(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, customer]);

  useEffect(() => {
    getAllBranches().then((b) => setCustomers(b.filter((x) => x.branch_type !== "K"))).catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const selectedRows = rows.filter((r) => selected.includes(r.invoice_number));
  const sameCustomer = new Set(selectedRows.map((r) => r.branch_id)).size <= 1;
  const toggle = (inv) => {
    if (inv.balance_due <= 0) return;
    setSelected((s) => (s.includes(inv.invoice_number) ? s.filter((x) => x !== inv.invoice_number) : [...s, inv.invoice_number]));
  };
  const pageRows = rows.slice(page * perPage, page * perPage + perPage);

  // Record a payment for a customer: all of their open invoices, applied oldest first
  const payCustomer = async (branch_id) => {
    setPickOpen(false);
    try {
      const open = (await getReceivables({ branch_id, status: "open" })).filter((i) => i.balance_due > 0);
      if (!open.length) return toast.info("This customer has nothing to pay.");
      setPayInvoices(open);
    } catch (e) {
      toast.error(e.message);
    }
  };
  const startPayment = () => (customer ? payCustomer(customer) : setPickOpen(true));
  const t = summary?.totals;

  const tiles = t ? [
    ["Outstanding", money(t.outstanding, true), `${t.open_count} invoices`],
    ["Overdue", money(t.overdue_amt, true), `${t.overdue_count} invoices`, "error.main"],
    ["Due in 7 days", money(t.due_soon_amt, true), `${t.due_soon_count} invoices`, "warning.dark"],
    ["Over 60 days", money(t.d60_plus, true), "overdue", t.d60_plus > 0 ? "error.main" : undefined],
  ] : [];

  const actions = (inv) => (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
      <Tooltip title="Payments"><IconButton size="small" onClick={() => setHistory(inv.invoice_number)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
      {inv.amount_paid <= 0 && (
        <Tooltip title="Change credit term"><IconButton size="small" onClick={() => setTermsFor(inv)}><EventIcon fontSize="small" /></IconButton></Tooltip>
      )}
      {inv.balance_due > 0 && (
        <Button size="small" variant="contained" onClick={() => setPayInvoices([inv])} sx={{ minWidth: 56, ml: 0.5 }}>Pay</Button>
      )}
    </Stack>
  );

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto", pb: selected.length ? 12 : 2 }}>
        <PageHeader title="Payments" subtitle="Record customer payments and track what is owed"
          action={<Button variant="contained" startIcon={<PaymentsIcon />} onClick={startPayment}>Payment Detail</Button>} />

        <Box sx={{ display: "grid", gap: 1.5, mb: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          {tiles.map(([k, v, sub, color]) => (
            <Card key={k}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{k}</Typography>
                <Typography variant="h6" fontWeight={700} color={color}>{v}</Typography>
                <Typography variant="caption" color="text.secondary">{sub}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ flexGrow: 1 }}>
            <Tab value="open" label="Open" />
            <Tab value="overdue" label="Overdue" />
            <Tab value="all" label="All invoices" />
            <Tab value="aging" label="By customer" />
          </Tabs>
          {tab !== "aging" && (
            <TextField select size="small" label="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)}
              sx={{ minWidth: 240 }} InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">All customers</MenuItem>
              {customers.map((c) => <MenuItem key={c.branch_id} value={c.branch_id}>{c.legal_name || c.branch_name}</MenuItem>)}
            </TextField>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {tab !== "aging" && rows.some((r) => r.balance_due > 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Press <b>Pay</b> on an invoice, or tick several invoices of one customer and press <b>Payment Detail</b> at the bottom.
          </Typography>
        )}
        {loading ? <Loader inline /> : tab === "aging" ? (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Customer", "Open", "Current", "1-30 days", "31-60 days", "60+ days", "Outstanding", ""].map((h, i) => (
                    <TableCell key={h} align={i ? "right" : "left"} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(summary?.aging || []).map((a) => (
                  <TableRow key={a.branch_id} hover sx={{ cursor: "pointer" }} onClick={() => { setCustomer(a.branch_id); setTab("open"); }}>
                    <TableCell>{a.name}{a.branch_type === "X" ? " (Customer)" : ""}</TableCell>
                    <TableCell align="right">{a.open_count}</TableCell>
                    <TableCell align="right">{money(a.current_amt)}</TableCell>
                    <TableCell align="right" sx={{ color: a.d1_30 ? "warning.dark" : undefined }}>{money(a.d1_30)}</TableCell>
                    <TableCell align="right" sx={{ color: a.d31_60 ? "error.main" : undefined }}>{money(a.d31_60)}</TableCell>
                    <TableCell align="right" sx={{ color: a.d60_plus ? "error.main" : undefined }}>{money(a.d60_plus)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(a.outstanding)}</TableCell>
                    <TableCell align="right">
                      {a.outstanding > 0 && (
                        <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); payCustomer(a.branch_id); }}>Pay</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!summary?.aging?.length && (
                  <TableRow><TableCell colSpan={8} align="center">Nothing outstanding.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : !rows.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            No invoices here. An invoice is created when a branch or customer confirms receipt of an indent.
          </Typography>
        ) : isMobile ? (
          <Stack spacing={1.25}>
            {pageRows.map((inv) => (
              <Card key={inv.invoice_number} sx={{ borderColor: selected.includes(inv.invoice_number) ? "primary.main" : undefined }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {inv.balance_due > 0 && <Checkbox edge="start" checked={selected.includes(inv.invoice_number)} onChange={() => toggle(inv)} />}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700}>{inv.invoice_number}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{inv.bill_to_name}</Typography>
                    </Box>
                    <StatusChip inv={inv} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Box><Typography variant="caption">Due</Typography><Due inv={inv} /></Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption">Balance / total</Typography>
                      <Typography fontWeight={700}>{money(inv.balance_due)} <Typography component="span" variant="caption">/ {money(inv.total_amount)}</Typography></Typography>
                    </Box>
                    {actions(inv)}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  {["Invoice", "Customer", "Invoiced", "Due", "Terms", "Total", "Paid", "Balance", "Status", ""].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align={["Total", "Paid", "Balance"].includes(h) ? "right" : "left"}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((inv) => (
                  <TableRow key={inv.invoice_number} hover selected={selected.includes(inv.invoice_number)}>
                    <TableCell padding="checkbox">
                      {inv.balance_due > 0 && <Checkbox checked={selected.includes(inv.invoice_number)} onChange={() => toggle(inv)} />}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {inv.invoice_number}
                      <Typography variant="caption" color="text.secondary" display="block">{inv.indent_number}</Typography>
                    </TableCell>
                    <TableCell>{inv.bill_to_name}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}><Due inv={inv} /></TableCell>
                    <TableCell>{termLabel(inv.credit_term)}</TableCell>
                    <TableCell align="right">{money(inv.total_amount)}</TableCell>
                    <TableCell align="right">{money(inv.amount_paid)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(inv.balance_due)}</TableCell>
                    <TableCell><StatusChip inv={inv} /></TableCell>
                    <TableCell>{actions(inv)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {tab !== "aging" && rows.length > 0 && (
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(e, p) => setPage(p)}
            rowsPerPage={perPage} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Per page"
            onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        )}
      </Box>

      {selected.length > 0 && (
        <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10, p: 1.5, pb: "calc(12px + env(safe-area-inset-bottom))",
          bgcolor: "background.paper", borderTop: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }} color={sameCustomer ? "text.primary" : "error.main"}>
            {sameCustomer
              ? `${selected.length} selected · balance ${money(selectedRows.reduce((s, r) => s + r.balance_due, 0), true)}`
              : "Pick invoices of one customer only"}
          </Typography>
          <Button color="secondary" onClick={() => setSelected([])}>Clear</Button>
          <Button variant="contained" startIcon={<PaymentsIcon />} disabled={!sameCustomer} onClick={() => setPayInvoices(selectedRows)}>
            Payment Detail
          </Button>
        </Box>
      )}

      <RecordPaymentDialog open={!!payInvoices} invoices={payInvoices || []} onClose={() => setPayInvoices(null)}
        onSaved={() => { setPayInvoices(null); load(); }} />

      <Dialog open={pickOpen} onClose={() => setPickOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Who paid?</DialogTitle>
        <DialogContent>
          {(summary?.aging || []).filter((a) => a.outstanding > 0).length ? (
            <Stack spacing={1} sx={{ pt: 0.5 }}>
              {(summary?.aging || []).filter((a) => a.outstanding > 0).map((a) => (
                <Button key={a.branch_id} variant="outlined" onClick={() => payCustomer(a.branch_id)}
                  sx={{ justifyContent: "space-between", textTransform: "none" }}>
                  <span>{a.name}</span><b>{money(a.outstanding, true)}</b>
                </Button>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Nobody owes anything right now. Invoices appear here once a branch or customer confirms receipt of an indent.
            </Typography>
          )}
        </DialogContent>
        <DialogActions><Button color="secondary" onClick={() => setPickOpen(false)}>Cancel</Button></DialogActions>
      </Dialog>
      <HistoryDialog invoiceNumber={history} onClose={() => setHistory(null)} onChanged={load} />
      <TermsDialog inv={termsFor} onClose={() => setTermsFor(null)} onSaved={() => { setTermsFor(null); load(); }} />
    </>
  );
};

export default Payments;

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TermPicker from "./TermPicker";
import Loader from "./Loader";
import { useToast } from "./ToastProvider";
import { getInvoiceSetup, saveInvoiceSetup } from "../utilities/service";
import { money, termLabel } from "../utilities/helpers";

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Admin step between kitchen accept and dispatch: per-item tax, payment terms and extra charges.
 * The invoice itself is still issued when the branch confirms receipt (on received qty) using these settings.
 */
const InvoiceSetup = ({ indentNumber, onDone }) => {
  const toast = useToast();
  const [setup, setSetup] = useState(null);
  const [items, setItems] = useState([]);
  const [charges, setCharges] = useState([]);
  const [term, setTerm] = useState("EOM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  const apply = (s) => {
    setSetup(s);
    setItems(s.items.map((i) => ({ ...i })));
    setCharges(s.charges.map((c) => ({ ...c, amount: String(c.amount) })));
    setTerm(s.credit_term);
  };

  useEffect(() => {
    (async () => {
      try {
        apply(await getInvoiceSetup(indentNumber));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [indentNumber]);

  // Live estimate on ordered qty: GST/QST only on taxable lines
  const totals = useMemo(() => {
    if (!setup) return null;
    const lines = [
      ...items.map((i) => ({ amount: i.amount || 0, taxable: i.taxable })),
      ...charges.map((c) => ({ amount: Number(c.amount) || 0, taxable: c.taxable })),
    ];
    const sub = r2(lines.reduce((s, l) => s + l.amount, 0));
    const taxable = r2(lines.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0));
    const gst = r2((taxable * (setup.gst_rate || 0)) / 100);
    const qst = r2((taxable * (setup.qst_rate || 0)) / 100);
    return { sub, taxable, gst, qst, total: r2(sub + gst + qst) };
  }, [setup, items, charges]);

  const chargeErrors = charges.map((c) =>
    !c.description.trim() ? "Description needed" : !(Number(c.amount) > 0) ? "Enter an amount" : ""
  );
  const invalid = !term || chargeErrors.some(Boolean);

  const save = async (finalize) => {
    setConfirm(false);
    setSaving(true);
    setError("");
    try {
      const res = await saveInvoiceSetup({
        indent_number: indentNumber,
        credit_term: term,
        finalize,
        items: items.map((i) => ({ item_code: i.item_code, taxable: i.taxable })),
        charges: charges.map((c) => ({ description: c.description.trim(), amount: Number(c.amount), taxable: c.taxable })),
      });
      apply(res.setup);
      toast.success(res.message);
      if (finalize) onDone?.(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader inline />;
  if (!setup) return error ? <Alert severity="error">{error}</Alert> : null;

  const finalized = setup.status === "F";
  const taxName = `${setup.gst_label || "GST"}${Number(setup.qst_rate) > 0 ? "/QST" : ""}`;

  return (
    <Card sx={{ mb: 2, borderColor: "primary.main" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Invoice setup</Typography>
          {finalized && <Chip size="small" color="success" label="Finalized" />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bill to <b>{setup.bill_to_name}</b>. Decide tax per item, payment terms and any extra charges. The kitchen can
          dispatch only after you finalize. The invoice is issued when the branch confirms receipt.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!!setup.price_missing?.length && (
          <Alert severity="warning" sx={{ mb: 2 }}>No price in Product Master for: {setup.price_missing.join(", ")}</Alert>
        )}

        <TermPicker value={term} onChange={setTerm} sx={{ mb: 2, maxWidth: 420 }}
          helperText={`Customer default: ${termLabel(setup.default_term)}. Due date counts from the invoice date.`} />

        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Items</Typography>
        <Stack divider={<Divider flexItem />} sx={{ mb: 2 }}>
          {items.map((it, idx) => (
            <Stack key={it.item_code} direction="row" alignItems="center" spacing={1} sx={{ py: 0.75 }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{it.item_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {it.qty} {it.uom || ""} × {it.rate === null ? "no price" : money(it.rate, true)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ width: 80, textAlign: "right" }}>{it.amount === null ? "-" : money(it.amount, true)}</Typography>
              <FormControlLabel
                sx={{ m: 0, width: 128, justifyContent: "flex-end" }}
                labelPlacement="start"
                label={<Typography variant="caption" color={it.taxable ? "text.primary" : "text.secondary"}>{it.taxable ? taxName : "Non-taxable"}</Typography>}
                control={<Switch size="small" checked={it.taxable} disabled={!setup.editable}
                  onChange={(e) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, taxable: e.target.checked } : x)))} />}
              />
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Extra charges</Typography>
          <Button size="small" startIcon={<AddIcon />} disabled={!setup.editable || charges.length >= 20}
            onClick={() => setCharges((cs) => [...cs, { description: "Delivery Charge", amount: "", taxable: false }])}>
            Add charge
          </Button>
        </Stack>
        {!charges.length && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            None. Use Add charge for delivery or other charges.
          </Typography>
        )}
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          {charges.map((c, idx) => {
            const upd = (patch) => setCharges((cs) => cs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
            return (
              <Stack key={idx} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <TextField size="small" label="Description" value={c.description} onChange={(e) => upd({ description: e.target.value })}
                  sx={{ flexGrow: 1 }} inputProps={{ maxLength: 200 }} disabled={!setup.editable} error={!!chargeErrors[idx] && !c.description.trim()} />
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Amount" value={c.amount} sx={{ width: 130 }} disabled={!setup.editable}
                    onChange={(e) => upd({ amount: e.target.value.replace(/[^\d.]/g, "") })}
                    inputProps={{ inputMode: "decimal" }} error={!!chargeErrors[idx] && !!c.description.trim()}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                  <FormControlLabel sx={{ m: 0 }} label={<Typography variant="caption">{c.taxable ? taxName : "Non-taxable"}</Typography>}
                    control={<Switch size="small" checked={c.taxable} disabled={!setup.editable} onChange={(e) => upd({ taxable: e.target.checked })} />} />
                  <IconButton size="small" aria-label="Remove charge" disabled={!setup.editable} onClick={() => setCharges((cs) => cs.filter((_, i) => i !== idx))}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            );
          })}
        </Stack>

        {totals && (
          <Box sx={{ maxWidth: 360, ml: "auto", mb: 2 }}>
            {[
              ["Sub total", totals.sub],
              ...(totals.taxable !== totals.sub ? [["Taxable amount", totals.taxable]] : []),
              [`${setup.gst_label || "GST"} (${Number(setup.gst_rate)}%)`, totals.gst],
              ...(Number(setup.qst_rate) > 0 ? [[`QST (${Number(setup.qst_rate)}%)`, totals.qst]] : []),
            ].map(([k, v]) => (
              <Stack key={k} direction="row" justifyContent="space-between">
                <Typography variant="body2">{k}</Typography>
                <Typography variant="body2">{money(v, true)}</Typography>
              </Stack>
            ))}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography fontWeight={700}>Estimated total</Typography>
              <Typography fontWeight={700}>{money(totals.total, true)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              On ordered quantities. The final invoice uses the quantities the branch receives.
            </Typography>
          </Box>
        )}

        {setup.editable && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {!finalized && (
              <Button variant="outlined" disabled={invalid || saving} onClick={() => save(false)}>Save draft</Button>
            )}
            <Button variant="contained" disabled={invalid || saving}
              onClick={() => (finalized ? save(true) : setConfirm(true))}>
              {saving ? "Saving..." : finalized ? "Save changes" : "Finalize invoice"}
            </Button>
          </Stack>
        )}
      </CardContent>

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Finalize invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Terms: <b>{termLabel(term)}</b>. {items.filter((i) => !i.taxable).length} non-taxable item(s), {charges.length} extra charge(s).
            The kitchen will then be able to dispatch. You can still change these until dispatch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => save(true)}>Finalize</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default InvoiceSetup;

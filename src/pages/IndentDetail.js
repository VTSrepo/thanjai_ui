import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReplyIcon from "@mui/icons-material/Reply";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import InvoiceDialog from "../components/InvoiceDialog";
import InvoiceSetup from "../components/InvoiceSetup";
import ItemPickerDialog from "../components/ItemPickerDialog";
import BatchPicker, { DispatchedBatches } from "../components/BatchPicker";
import {
  getIndentDetail, createNewIndent, requestIndentChange, resubmitIndent, getProducts, productsForKitchen,
  getIndentBatches, getAllBranches,
} from "../utilities/service";
import { downloadPackingSlip } from "../utilities/packingSlipPdf";
import { useUser, canUse } from "../utilities/UserContext";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import IndentHeaderCard from "../components/IndentHeaderCard";
import IndentItems, { itemError } from "../components/IndentItems";
import { statusLabel } from "../components/StatusChip";
import { FormattedDate } from "../utilities/helpers";

/*
 * Flow: C requested -> (Q sent back to branch for changes -> C again) -> A accepted -> D dispatched (packing slip)
 *       -> R received -> I invoiced (head office finalizes the invoice after receipt).
 * F = finalized under the old flow (before dispatch); treated like A.
 */
const ACTIONS = {
  C: { roles: ["K"], next: "A", label: "Accept indent", confirm: "Accept this indent? The branch will see it as accepted." },
  A: { roles: ["K"], next: "D", label: "Dispatch", confirm: "Dispatch with the agreed quantities?" },
  F: { roles: ["K"], next: "D", label: "Dispatch", confirm: "Dispatch with the agreed quantities?" },
  D: { roles: ["B", "X"], next: "R", label: "Confirm receipt", confirm: "Confirm the received quantities? Head office then finalizes the invoice on what you received." },
};

const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// Kitchen: tell the branch which items are short (C -> Q)
const SendBackDialog = ({ open, rows, onClose, onSend, busy }) => {
  const [note, setNote] = useState("");
  const [lines, setLines] = useState({});
  useEffect(() => {
    if (open) { setNote(""); setLines({}); }
  }, [open]);
  const set = (code, patch) => setLines((l) => ({ ...l, [code]: { ...l[code], ...patch } }));
  const flagged = Object.entries(lines).filter(([, v]) => (v.available ?? "") !== "" || (v.remark || "").trim());
  const bad = flagged.some(([, v]) => v.available !== undefined && v.available !== "" && !(Number(v.available) >= 0));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send back to branch</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          For each item you cannot supply in full, enter what you have (0 if none) and a short note. The branch can then
          change the quantity, remove the item or add another item, and send the indent again.
        </Typography>
        <Stack spacing={1.5}>
          {rows.map((r) => (
            <Box key={r.item_code} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 90px", sm: "1fr 100px 1.2fr" }, alignItems: "center" }}>
              <Typography variant="body2" fontWeight={600}>{r.item_name}<br />
                <Typography component="span" variant="caption" color="text.secondary">ordered {r.qty_ordered} {r.uom || ""}</Typography>
              </Typography>
              <TextField size="small" label="Available" value={lines[r.item_code]?.available ?? ""}
                onChange={(e) => set(r.item_code, { available: e.target.value.replace(/[^\d.]/g, "") })} inputProps={{ inputMode: "decimal" }} />
              <TextField size="small" label="Note" value={lines[r.item_code]?.remark ?? ""} sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
                onChange={(e) => set(r.item_code, { remark: e.target.value })} />
            </Box>
          ))}
          <TextField label="Message to the branch" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2}
            placeholder="e.g. No lamb today - please choose chicken instead" inputProps={{ maxLength: 500 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || bad || (!flagged.length && !note.trim())}
          onClick={() => onSend({
            note: note.trim(),
            items: flagged.map(([item_code, v]) => ({ item_code, qty_available: v.available === "" ? null : v.available, remark: (v.remark || "").trim() })),
          })}>
          {busy ? "Sending..." : "Send back"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const IndentDetail = ({ indentNumber, sendToParent }) => {
  const { user } = useUser();
  const [indent, setIndent] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [sendBack, setSendBack] = useState(false);
  const [picker, setPicker] = useState({ open: false, item: null });
  const [products, setProducts] = useState([]);
  const [batchState, setBatchState] = useState({ alloc: {}, problems: [], ready: true });
  const [deliveryDate, setDeliveryDate] = useState(() => FormattedDate(new Date())); // kitchen enters when accepting

  useEffect(() => {
    (async () => {
      try {
        const result = await getIndentDetail(indentNumber);
        const data = result.data.indent;
        setIndent(data);
        setRows(
          (data.indent_details || []).map((item, index) => ({
            ...item,
            id: item.item_code || item.id || index + 1,
            // Full-qty items: kitchen agreed qty is fixed to the requested qty (BRD)
            qty_agreed_kitchen:
              ["A", "F"].includes(data.status) && item.mandatory_status === "Y" && (item.qty_agreed_kitchen ?? null) === null
                ? item.qty_ordered
                : item.qty_agreed_kitchen,
          }))
        );
      } catch (err) {
        setError(err.response?.data?.message || "Could not load this indent");
      } finally {
        setLoading(false);
      }
    })();
  }, [indentNumber]);

  const isBranchUser = ["B", "X"].includes(user?.user_type);
  const editing = indent?.status === "Q" && isBranchUser; // branch changes the items the kitchen flagged
  useEffect(() => {
    if (editing && !products.length) getProducts().then((p) => setProducts(p?.products || [])).catch(() => {});
  }, [editing, products.length]);
  const kitchenProducts = useMemo(() => productsForKitchen(products, indent?.kitchen_id), [products, indent?.kitchen_id]);

  const action = indent ? ACTIONS[indent.status] : null;
  const canAct = !!action && action.roles.includes(user?.user_type);
  const mode = editing ? "create"
    : canAct && ["A", "F"].includes(indent.status) ? "kitchen" : canAct && indent.status === "D" ? "receive" : "view";
  const accepting = canAct && indent.status === "C";
  const batchErrors = batchState.problems.filter((p) => !p.warning);
  const batchWarnings = batchState.problems.filter((p) => p.warning);
  const invalidCount = useMemo(
    () => rows.filter((r) => itemError(r, mode)).length + (accepting && !deliveryDate ? 1 : 0)
      + (mode === "kitchen" ? batchErrors.length : 0),
    [rows, mode, accepting, deliveryDate, batchErrors.length]
  );
  // dispatch quantities for the batch picker
  const qtyByItem = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.item_code, toNum(r.qty_agreed_kitchen) ?? 0])),
    [rows]
  );

  const patchRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const copyAll = () =>
    setRows((rs) =>
      rs.map((r) =>
        mode === "kitchen"
          ? { ...r, qty_agreed_kitchen: r.qty_ordered }
          : { ...r, qty_received: r.qty_agreed_kitchen ?? r.qty_ordered }
      )
    );

  const submit = async () => {
    setConfirmOpen(false);
    setSaving(true);
    setError("");
    const payload = { ...indent, status: action.next };
    if (action.next === "A") payload.delivery_date = deliveryDate;
    if (action.next === "D") payload.batch_alloc = batchState.alloc;
    if (indent.status !== "C") {
      payload.indent_details = rows.map((r) => ({
        ...r,
        qty_agreed_kitchen: toNum(r.qty_agreed_kitchen),
        qty_received: toNum(r.qty_received),
      }));
    }
    const res = await createNewIndent(payload);
    setSaving(false);
    if (res?.status === 200) {
      if (action.next === "R") {
        return sendToParent?.({ message: `Indent ${indent.indent_number} received. Head office will issue the invoice.` });
      }
      const warning = res.warning || res.data?.warning;
      sendToParent?.({
        message: `Indent ${indent.indent_number} ${statusLabel(action.next).toLowerCase()}${warning ? `. ${warning}` : ""}`,
      });
    } else {
      setError(res?.response?.data?.message || "Update failed. Please try again.");
    }
  };

  const doSendBack = async (body) => {
    setSaving(true);
    setError("");
    try {
      const r = await requestIndentChange({ indent_number: indent.indent_number, ...body });
      setSendBack(false);
      sendToParent?.({ message: r.message });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doResubmit = async () => {
    setConfirmOpen(false);
    setSaving(true);
    setError("");
    try {
      const r = await resubmitIndent({
        indent_number: indent.indent_number,
        items: rows.map((x) => ({ item_code: x.item_code, qty_ordered: Number(x.qty_ordered), mandatory_status: x.mandatory_status })),
      });
      sendToParent?.({ message: r.message });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveItem = (item) => {
    setRows((rs) => {
      const exists = rs.find((r) => r.item_code === item.item_code);
      if (exists) return rs.map((r) => (r.item_code === item.item_code ? { ...r, ...item } : r));
      return [...rs, { ...item, id: item.item_code }];
    });
    setPicker({ open: false, item: null });
  };

  const packingSlip = async () => {
    try {
      const [a, branches] = await Promise.all([getIndentBatches(indent.indent_number), getAllBranches().catch(() => [])]);
      downloadPackingSlip({ indent, items: rows, alloc: a.allocations || {}, branches });
    } catch (e) {
      setError(e.message || "Could not prepare the packing slip");
    }
  };

  if (loading) return <Loader />;

  const showBar = canAct || editing;
  const footerText = editing
    ? rows.length ? `${rows.length} item(s) - change, remove or add items, then send again` : "Keep at least one item"
    : mode === "kitchen" && batchWarnings.length && !invalidCount
      ? "Some items have no batch stock - you can still dispatch"
      : invalidCount ? `${invalidCount} item(s) need attention` : "Ready";

  return (
    <Box sx={{ pb: showBar ? 10 : 2 }}>
      <PageHeader
        title="Indent detail"
        subtitle={indent ? `${statusLabel(indent.status)} · ${rows.length} items` : ""}
        onBack={() => sendToParent?.()}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <IndentHeaderCard indent={indent} itemCount={rows.length} />

      {indent?.status === "Q" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <b>Kitchen asked for changes.</b> {indent.kitchen_note ? `"${indent.kitchen_note}".` : "Some items are short - see the notes on each item."}
          {editing ? " Change the quantity, remove the item or add another item, then send the indent again." : " Waiting for the branch to update the indent."}
        </Alert>
      )}
      {indent?.status === "C" && indent?.kitchen_note && (
        <Alert severity="info" sx={{ mb: 2 }}>Updated by the branch after the kitchen's note: "{indent.kitchen_note}"</Alert>
      )}
      {indent?.status === "R" && !["A", "O"].includes(user?.user_type) && (
        <Alert severity="info" sx={{ mb: 2 }}>Receipt confirmed. Head office will finalize and issue the invoice.</Alert>
      )}

      {canUse(user, "INVOICE_SETUP") && ["A", "O"].includes(user?.user_type) && ["R", "I"].includes(indent?.status) && (
        <InvoiceSetup indentNumber={indent.indent_number} onDone={(message) => sendToParent?.({ message: `${indent.indent_number}: ${message}` })} />
      )}

      {accepting && (
        <TextField
          type="date"
          label="Delivery date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          error={!deliveryDate}
          helperText={!deliveryDate ? "Enter the delivery date" : "Date the goods are delivered to the branch"}
          sx={{ mb: 2, width: { xs: "100%", sm: 260 } }}
        />
      )}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          Items
        </Typography>
        {["D", "R", "I"].includes(indent?.status) && (
          <Button size="small" variant="outlined" startIcon={<InventoryIcon />} onClick={packingSlip}>
            Packing slip
          </Button>
        )}
        {indent?.status === "I" && user?.user_type !== "K" && (
          <Button size="small" variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => setInvoiceOpen(true)}>
            Invoice
          </Button>
        )}
        {(mode === "kitchen" || mode === "receive") && (
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyAll}>
            {mode === "kitchen" ? "Agree all as required" : "Receive all as agreed"}
          </Button>
        )}
        {editing && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setPicker({ open: true, item: null })}>
            Add item
          </Button>
        )}
      </Stack>
      <IndentItems
        items={rows}
        mode={mode}
        onChange={patchRow}
        onEdit={(it) => setPicker({ open: true, item: it })}
        onDelete={(it) => setRows((rs) => rs.filter((r) => r.item_code !== it.item_code))}
      />

      {mode === "kitchen" && (
        <Box sx={{ mt: 2 }}>
          <BatchPicker indentNumber={indent.indent_number} qtyByItem={qtyByItem} onChange={setBatchState} />
        </Box>
      )}
      {["D", "R", "I"].includes(indent?.status) && (
        <Box sx={{ mt: 2 }}><DispatchedBatches indentNumber={indent.indent_number} items={rows.map((r) => ({ item_code: r.item_code, product_name: r.item_name }))} /></Box>
      )}

      {showBar && (
        <Box
          sx={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10,
            p: 1.5, pb: "calc(12px + env(safe-area-inset-bottom))",
            bgcolor: "background.paper", borderTop: 1, borderColor: "divider",
            display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color={invalidCount || batchWarnings.length ? "warning.dark" : "text.secondary"} sx={{ flexGrow: 1, minWidth: 160 }}>
            {footerText}
          </Typography>
          <Button variant="outlined" color="secondary" onClick={() => sendToParent?.()}>
            Back
          </Button>
          {accepting && (
            <Button variant="outlined" color="warning" startIcon={<ReplyIcon />} disabled={saving} onClick={() => setSendBack(true)}>
              Send back
            </Button>
          )}
          {editing ? (
            <Button variant="contained" disabled={!rows.length || saving} onClick={() => setConfirmOpen(true)}>
              {saving ? "Sending..." : "Send to kitchen again"}
            </Button>
          ) : (
            <Button variant="contained" disabled={!!invalidCount || saving} onClick={() => setConfirmOpen(true)}>
              {saving ? "Saving..." : action.label}
            </Button>
          )}
        </Box>
      )}

      <InvoiceDialog open={invoiceOpen} indentNumber={indent?.indent_number} title="Invoice" onClose={() => setInvoiceOpen(false)} />

      <SendBackDialog open={sendBack} rows={rows} busy={saving} onClose={() => setSendBack(false)} onSend={doSendBack} />

      {editing && (
        <ItemPickerDialog
          open={picker.open}
          initial={picker.item}
          products={kitchenProducts}
          existingCodes={rows.map((r) => r.item_code)}
          onClose={() => setPicker({ open: false, item: null })}
          onSave={saveItem}
        />
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{editing ? "Send to kitchen again" : action?.label}</DialogTitle>
        <DialogContent>
          <Typography>{editing ? `Send the updated indent (${rows.length} item(s)) to the kitchen?` : action?.confirm}</Typography>
          {mode === "kitchen" && batchWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Not enough batch stock for: {batchWarnings.map((p) => `${p.item.product_name} (${p.short} ${p.item.uom || ""})`).join(", ")}.
              These go out as "NO BATCH". Enter the batches later so stock stays right.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={editing ? doResubmit : submit}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IndentDetail;

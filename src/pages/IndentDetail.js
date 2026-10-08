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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InvoiceDialog from "../components/InvoiceDialog";
import InvoiceSetup from "../components/InvoiceSetup";
import { getIndentDetail, createNewIndent } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import IndentHeaderCard from "../components/IndentHeaderCard";
import IndentItems, { itemError } from "../components/IndentItems";
import { statusLabel } from "../components/StatusChip";
import { FormattedDate } from "../utilities/helpers";

const ACTIONS = {
  // current status -> who may act, the next status, and wording
  C: { roles: ["K"], next: "A", label: "Accept indent", confirm: "Accept this indent? The branch will see it as accepted." },
  // A -> F is the admin's invoice setup (InvoiceSetup); the kitchen dispatches only after that
  F: { roles: ["K"], next: "D", label: "Dispatch", confirm: "Dispatch with the agreed quantities?" },
  D: { roles: ["B", "X"], next: "R", label: "Confirm receipt", confirm: "Confirm the received quantities? This closes the indent and generates the kitchen's invoice." },
};

const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

const IndentDetail = ({ indentNumber, sendToParent }) => {
  const { user } = useUser();
  const [indent, setIndent] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [justReceived, setJustReceived] = useState(false);
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
            id: item.id || index + 1,
            // Full-qty items: kitchen agreed qty is fixed to the requested qty (BRD)
            qty_agreed_kitchen:
              data.status === "F" && item.mandatory_status === "Y" && (item.qty_agreed_kitchen ?? null) === null
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

  const action = indent ? ACTIONS[indent.status] : null;
  const canAct = !!action && action.roles.includes(user?.user_type);
  const mode = canAct && indent.status === "F" ? "kitchen" : canAct && indent.status === "D" ? "receive" : "view";
  const accepting = canAct && indent.status === "C";
  const invalidCount = useMemo(
    () => rows.filter((r) => itemError(r, mode)).length + (accepting && !deliveryDate ? 1 : 0),
    [rows, mode, accepting, deliveryDate]
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
        // Receipt closes the indent: generate the invoice and offer the PDF right away
        setJustReceived(true);
        setInvoiceOpen(true);
        return;
      }
      sendToParent?.({ message: `Indent ${indent.indent_number} ${statusLabel(action.next).toLowerCase()}` });
    } else {
      setError(res?.response?.data?.message || "Update failed. Please try again.");
    }
  };

  if (loading) return <Loader />;

  return (
    <Box sx={{ pb: canAct ? 10 : 2 }}>
      <PageHeader
        title="Indent detail"
        subtitle={indent ? `${statusLabel(indent.status)} · ${rows.length} items` : ""}
        onBack={() => sendToParent?.()}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <IndentHeaderCard indent={indent} itemCount={rows.length} />

      {user?.user_type === "A" && ["A", "F"].includes(indent?.status) && (
        <InvoiceSetup indentNumber={indent.indent_number} onDone={(message) => sendToParent?.({ message: `${indent.indent_number}: ${message}` })} />
      )}
      {user?.user_type === "K" && indent?.status === "A" && (
        <Alert severity="info" sx={{ mb: 2 }}>Accepted. Waiting for admin to finalize the invoice; you can dispatch after that.</Alert>
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

      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          Items
        </Typography>
        {indent?.status === "R" && user?.user_type !== "K" && (
          <Button size="small" variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => setInvoiceOpen(true)}>
            Invoice
          </Button>
        )}
        {(mode === "kitchen" || mode === "receive") && (
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyAll}>
            {mode === "kitchen" ? "Agree all as required" : "Receive all as agreed"}
          </Button>
        )}
      </Stack>
      <IndentItems items={rows} mode={mode} onChange={patchRow} />

      {canAct && (
        <Box
          sx={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10,
            p: 1.5, pb: "calc(12px + env(safe-area-inset-bottom))",
            bgcolor: "background.paper", borderTop: 1, borderColor: "divider",
            display: "flex", alignItems: "center", gap: 1,
          }}
        >
          <Typography variant="body2" color={invalidCount ? "warning.dark" : "text.secondary"} sx={{ flexGrow: 1 }}>
            {invalidCount ? `${invalidCount} item(s) need attention` : "Ready"}
          </Typography>
          <Button variant="outlined" color="secondary" onClick={() => sendToParent?.()}>
            Back
          </Button>
          <Button variant="contained" disabled={!!invalidCount || saving} onClick={() => setConfirmOpen(true)}>
            {saving ? "Saving..." : action.label}
          </Button>
        </Box>
      )}

      <InvoiceDialog
        open={invoiceOpen}
        indentNumber={indent?.indent_number}
        title={justReceived ? "Receipt confirmed" : "Invoice"}
        intro={justReceived ? `Indent ${indent?.indent_number} is closed. The kitchen's invoice is below.` : null}
        onClose={() => {
          setInvoiceOpen(false);
          if (justReceived) sendToParent?.({ message: `Indent ${indent.indent_number} received` });
        }}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{action?.label}</DialogTitle>
        <DialogContent>
          <Typography>{action?.confirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IndentDetail;

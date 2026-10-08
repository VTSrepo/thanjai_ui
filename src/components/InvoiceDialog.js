import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { generateInvoice, getInvoice } from "../utilities/service";
import { downloadInvoicePdf } from "../utilities/invoicePdf";

const money = (n) => `$${Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Row = ({ label, value, bold }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.4 }}>
    <Typography variant="body2" fontWeight={bold ? 700 : 400}>{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400}>{value}</Typography>
  </Stack>
);

/**
 * Opens for an indent (generates the invoice if needed) or for an existing invoice number.
 * props: open, indentNumber | invoiceNumber, title, intro, onClose(invoice?)
 */
const InvoiceDialog = ({ open, indentNumber, invoiceNumber, title = "Invoice", intro, onClose }) => {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInvoice(null);
    setError("");
    setLoading(true);
    (async () => {
      try {
        setInvoice(invoiceNumber ? await getInvoice(invoiceNumber) : await generateInvoice(indentNumber));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, indentNumber, invoiceNumber]);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose?.(invoice)} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {intro && <Typography sx={{ mb: 1.5 }}>{intro}</Typography>}
        {loading && (
          <Stack alignItems="center" sx={{ py: 3 }} spacing={1}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">Preparing invoice...</Typography>
          </Stack>
        )}
        {error && <Alert severity="warning">{error}</Alert>}
        {invoice && (
          <Box>
            <Typography variant="h6" fontWeight={700}>{invoice.invoice_number}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {invoice.seller?.name} → {invoice.bill_to?.name} · {invoice.invoice_date} · Indent {invoice.indent_number}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {invoice.lines.map((l) => (
              <Row key={l.line_no} label={`${l.item_name} × ${Number(l.qty)} @ ${Number(l.rate).toFixed(2)}${l.taxable === false ? " · non-taxable" : ""}`} value={money(l.amount)} />
            ))}
            <Divider sx={{ my: 1 }} />
            <Row label="Sub total" value={money(invoice.sub_total)} />
            {invoice.lines.some((l) => l.taxable === false) && (
              <Row label="Taxable amount" value={money(invoice.lines.filter((l) => l.taxable !== false).reduce((a, l) => a + Number(l.amount || 0), 0))} />
            )}
            <Row label={`${invoice.gst_label || "GST"} (${Number(invoice.gst_rate)}%)`} value={money(invoice.gst_amount)} />
            {Number(invoice.qst_rate) > 0 && <Row label={`QST (${Number(invoice.qst_rate)}%)`} value={money(invoice.qst_amount)} />}
            <Row label="Total" value={money(invoice.total_amount)} bold />
            {(invoice.payments || []).map((p) => (
              <Row key={p.payment_id} label={`Paid ${p.payment_date} (${p.receipt_no})`} value={`- ${money(p.amount)}`} />
            ))}
            <Row label={`Balance due${invoice.due_date ? ` by ${invoice.due_date}` : ""}`} value={money(invoice.balance_due)} bold />
            <Typography variant="caption" color="text.secondary">Terms: {invoice.terms}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={() => onClose?.(invoice)}>Close</Button>
        <Button variant="contained" startIcon={<PictureAsPdfIcon />} disabled={!invoice || downloading} onClick={download}>
          {downloading ? "Preparing..." : "Download PDF"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDialog;

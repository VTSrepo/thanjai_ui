import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import StatusChip from "../components/StatusChip";
import InvoiceDialog from "../components/InvoiceDialog";
import { getAllBranches, getInvoiceReport } from "../utilities/service";
import { FormattedDate, formatDate, money, payStatus } from "../utilities/helpers";

const firstOfMonth = () => {
  const d = new Date();
  return FormattedDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const Amount = ({ row, field, bold }) => (
  <Box component="span" sx={{ fontStyle: row.preview ? "italic" : "normal", color: row.preview ? "text.secondary" : "text.primary", fontWeight: bold ? 700 : 400 }}>
    {money(row[field])}
  </Box>
);

// Total with the tax breakdown in a tooltip (keeps the table narrow)
const TotalCell = ({ row }) => (
  <Tooltip arrow title={
    <Box sx={{ fontSize: 12 }}>
      Sub total {money(row.sub_total)}<br />GST/HST {money(row.gst_amount)}<br />QST {money(row.qst_amount)}
      {row.preview ? <><br /><i>Estimate - fixed when invoiced</i></> : null}
    </Box>
  }>
    <span><Amount row={row} field="total_amount" bold /></span>
  </Tooltip>
);

const PaymentCell = ({ row }) => {
  if (!row.invoice_number) return <Typography variant="caption" color="text.secondary">-</Typography>;
  const s = payStatus(row);
  return (
    <Stack spacing={0.25} alignItems="flex-start">
      <Chip size="small" color={s.color} label={s.label} variant={s.color === "default" ? "outlined" : "filled"} />
      {s.label !== "Paid" && <Typography variant="caption">Bal {money(row.balance_due)}</Typography>}
    </Stack>
  );
};

const Action = ({ row, onOpen }) => {
  if (row.invoice_number) {
    return (
      <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={() => onOpen({ invoiceNumber: row.invoice_number })} sx={{ whiteSpace: "nowrap" }}>
        {row.invoice_number}
      </Button>
    );
  }
  if (row.status !== "R") return <Typography variant="caption" color="text.secondary">After receipt</Typography>;
  const blocked = row.price_missing?.length > 0;
  return (
    <Tooltip title={blocked ? `Price missing: ${row.price_missing.join(", ")}` : ""}>
      <span>
        <Button size="small" variant="contained" startIcon={<ReceiptLongIcon />} disabled={blocked}
          onClick={() => onOpen({ indentNumber: row.indent_number })}>
          Generate
        </Button>
      </span>
    </Tooltip>
  );
};

const InvoiceReport = () => {
  document.title = `Invoices | ${CONFIG.title.name}`;
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [filters, setFilters] = useState({ from_date: firstOfMonth(), to_date: FormattedDate(new Date()), branch_id: "" });
  const [branches, setBranches] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const search = async (f = filters) => {
    if (!f.from_date || !f.to_date) return;
    setLoading(true);
    setError("");
    try {
      setRows(await getInvoiceReport(f));
      setPage(0);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBranches()
      .then((list) => setBranches(list.filter((b) => b.branch_type !== "K").sort((a, b) => a.branch_name.localeCompare(b.branch_name))))
      .catch(() => {});
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const inv = rows.filter((r) => r.invoice_number);
    const pending = rows.filter((r) => !r.invoice_number && r.status === "R");
    const sum = (list, k = "total_amount") => list.reduce((s, r) => s + Number(r[k] || 0), 0);
    return {
      count: rows.length, invoiced: inv.length, invoicedTotal: sum(inv),
      unpaid: sum(inv, "balance_due"), pending: pending.length, pendingTotal: sum(pending),
    };
  }, [rows]);

  const pageRows = rows.slice(page * perPage, page * perPage + perPage);
  const set = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const pager = (
    <TablePagination component="div" count={rows.length} page={page} onPageChange={(e, p) => setPage(p)}
      rowsPerPage={perPage} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Per page"
      onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
  );

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
        <PageHeader title="Invoices" subtitle="Indents by date and ordering branch" />

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "180px 180px 1fr auto" }, alignItems: "center" }}>
              <TextField type="date" label="From" name="from_date" value={filters.from_date} onChange={set} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="To" name="to_date" value={filters.to_date} onChange={set} InputLabelProps={{ shrink: true }} />
              <TextField select label="Ordering branch / customer" name="branch_id" value={filters.branch_id} onChange={set}
                InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }} sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                <MenuItem value="">All</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}{b.branch_type === "X" ? " (Customer)" : b.ownership_type === "F" ? " (Franchise)" : ""}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={() => search()}
                disabled={!filters.from_date || !filters.to_date || loading} sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                Show
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 1.5, mb: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          {[
            ["Indents", summary.count],
            ["Invoiced", `${summary.invoiced} · ${money(summary.invoicedTotal, true)}`],
            ["Unpaid on these invoices", money(summary.unpaid, true)],
            ["Received, not invoiced", `${summary.pending} · ${money(summary.pendingTotal, true)}`],
          ].map(([k, v]) => (
            <Card key={k}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{k}</Typography>
                <Typography variant="h6" fontWeight={700}>{v}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {rows.some((r) => r.preview) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Amounts in italics are estimates from current prices; they are fixed when the invoice is generated. Hover a total for the tax split.
          </Typography>
        )}

        {loading ? (
          <Loader inline />
        ) : !rows.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>No indents for these filters.</Typography>
        ) : isMobile ? (
          <>
            <Stack spacing={1.25}>
              {pageRows.map((r) => (
                <Card key={`${r.indent_number}-${r.kitchen_id}`}>
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                        {r.indent_number} {r.priority_flag === "Y" && <Chip size="small" color="error" label="P" sx={{ height: 18 }} />}
                      </Typography>
                      <StatusChip status={r.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>{r.branch_name} → {r.kitchen_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(r.indent_date)}{r.received_date ? ` · received ${formatDate(r.received_date)}` : ""} · {r.item_count} items
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary">Total incl. tax</Typography>
                        <Typography><Amount row={r} field="total_amount" bold /></Typography>
                      </Box>
                      <PaymentCell row={r} />
                      <Action row={r} onOpen={setDialog} />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            {pager}
          </>
        ) : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Indent #", "Dates", "Branch → Kitchen", "For", "Status", "Items", "Total", "Payment", "Invoice"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align={["Items", "Total"].includes(h) ? "right" : "left"}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={`${r.indent_number}-${r.kitchen_id}`} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.indent_number}
                      {r.priority_flag === "Y" && <Chip size="small" color="error" label="P" sx={{ ml: 0.5, height: 18 }} />}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(r.indent_date)}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {r.received_date ? `Received ${formatDate(r.received_date)}` : "Not received"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {r.branch_name}
                      <Typography variant="caption" color="text.secondary" display="block">→ {r.kitchen_name}</Typography>
                    </TableCell>
                    <TableCell>{r.self_customer === "C" ? r.customer_name || "Customer" : "Self"}</TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right">{r.item_count}</TableCell>
                    <TableCell align="right"><TotalCell row={r} /></TableCell>
                    <TableCell><PaymentCell row={r} /></TableCell>
                    <TableCell><Action row={r} onOpen={setDialog} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pager}
          </TableContainer>
        )}
      </Box>

      <InvoiceDialog
        open={!!dialog}
        indentNumber={dialog?.indentNumber}
        invoiceNumber={dialog?.invoiceNumber}
        onClose={(inv) => {
          const generated = dialog?.indentNumber && inv;
          setDialog(null);
          if (generated) search();
        }}
      />
    </>
  );
};

export default InvoiceReport;

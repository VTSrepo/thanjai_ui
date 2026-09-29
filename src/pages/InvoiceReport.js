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
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import StatusChip from "../components/StatusChip";
import InvoiceDialog from "../components/InvoiceDialog";
import { useUser } from "../utilities/UserContext";
import { getAllBranches, getInvoiceReport } from "../utilities/service";
import { FormattedDate, formatDate } from "../utilities/helpers";

const money = (n) =>
  n === null || n === undefined ? "-" : Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const firstOfMonth = () => {
  const d = new Date();
  return FormattedDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const Amount = ({ row, field }) => (
  <Box component="span" sx={{ fontStyle: row.preview ? "italic" : "normal", color: row.preview ? "text.secondary" : "text.primary" }}>
    {money(row[field])}
  </Box>
);

const Action = ({ row, onOpen }) => {
  if (row.invoice_number) {
    return (
      <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={() => onOpen({ invoiceNumber: row.invoice_number })}>
        {row.invoice_number}
      </Button>
    );
  }
  if (row.status !== "R") {
    return <Typography variant="caption" color="text.secondary">After receipt</Typography>;
  }
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
  const navigate = useNavigate();
  const { user } = useUser();
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [filters, setFilters] = useState({ from_date: firstOfMonth(), to_date: FormattedDate(new Date()), branch_id: "" });
  const [branches, setBranches] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const search = async (f = filters) => {
    if (!f.from_date || !f.to_date) return;
    setLoading(true);
    setError("");
    try {
      setRows(await getInvoiceReport(f));
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setBranches((await getAllBranches("B")).sort((a, b) => a.branch_name.localeCompare(b.branch_name)));
      } catch (e) {}
    })();
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const inv = rows.filter((r) => r.invoice_number);
    const pending = rows.filter((r) => !r.invoice_number && r.status === "R");
    const sum = (list) => list.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    return { count: rows.length, invoiced: inv.length, invoicedTotal: sum(inv), pending: pending.length, pendingTotal: sum(pending) };
  }, [rows]);

  const set = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      <ResponsiveAppBar onLogout={() => navigate("/login")} user={user} />
      <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
        <PageHeader title="Invoices" subtitle="Indents by date and ordering branch" />

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "180px 180px 1fr auto" }, alignItems: "center" }}>
              <TextField type="date" label="From" name="from_date" value={filters.from_date} onChange={set} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="To" name="to_date" value={filters.to_date} onChange={set} InputLabelProps={{ shrink: true }} />
              <TextField select label="Ordering branch" name="branch_id" value={filters.branch_id} onChange={set}
                InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}
                sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                <MenuItem value="">All branches</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}{b.ownership_type === "F" ? " (Franchise)" : ""}
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
            ["Invoiced", summary.invoiced],
            ["Invoiced value", `$${money(summary.invoicedTotal)}`],
            ["Received, not invoiced", `${summary.pending} · $${money(summary.pendingTotal)}`],
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
            Amounts in italics are estimates from current prices; they are fixed when the invoice is generated.
          </Typography>
        )}

        {loading ? (
          <Loader inline />
        ) : !rows.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>No indents for these filters.</Typography>
        ) : isMobile ? (
          <Stack spacing={1.25}>
            {rows.map((r) => (
              <Card key={`${r.indent_number}-${r.kitchen_id}`}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={700} sx={{ flexGrow: 1 }} noWrap>{r.indent_number}</Typography>
                    <StatusChip status={r.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {r.branch_name} → {r.kitchen_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(r.indent_date)}
                    {r.received_date ? ` · received ${formatDate(r.received_date)}` : ""} · {r.item_count} items
                    {r.self_customer === "C" ? ` · ${r.customer_name || "customer"}` : ""}
                  </Typography>
                  <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">Total incl. tax</Typography>
                      <Typography fontWeight={700}><Amount row={r} field="total_amount" /></Typography>
                    </Box>
                    <Action row={r} onOpen={setDialog} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Card}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {["Indent #", "Indent date", "Received", "Ordering branch", "Kitchen", "For", "Status", "Items",
                    "Sub total", "GST/HST", "QST", "Total", "Invoice"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                      align={["Items", "Sub total", "GST/HST", "QST", "Total"].includes(h) ? "right" : "left"}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.indent_number}-${r.kitchen_id}`} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.indent_number}
                      {r.priority_flag === "Y" && <Chip size="small" color="error" label="P" sx={{ ml: 0.5, height: 18 }} />}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.indent_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.received_date) || "-"}</TableCell>
                    <TableCell>{r.branch_name}</TableCell>
                    <TableCell>{r.kitchen_name}</TableCell>
                    <TableCell>{r.self_customer === "C" ? r.customer_name || "Customer" : "Self"}</TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell align="right">{r.item_count}</TableCell>
                    <TableCell align="right"><Amount row={r} field="sub_total" /></TableCell>
                    <TableCell align="right"><Amount row={r} field="gst_amount" /></TableCell>
                    <TableCell align="right"><Amount row={r} field="qst_amount" /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}><Amount row={r} field="total_amount" /></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}><Action row={r} onOpen={setDialog} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

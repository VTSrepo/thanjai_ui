import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Tab,
  TablePagination,
  Tabs,
  Typography,
} from "@mui/material";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import InvoiceDialog from "../components/InvoiceDialog";
import InvoiceAlerts from "../components/InvoiceAlerts";
import { getReceivables, getReceivablesSummary } from "../utilities/service";
import { formatDate, money, payStatus, termLabel } from "../utilities/helpers";

// Branch / external customer view of their own invoices, payments and balance
const MyInvoices = () => {
  document.title = `My invoices | ${CONFIG.title.name}`;
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, sum] = await Promise.all([getReceivables({ status: tab }), getReceivablesSummary()]);
      setRows(tab === "all" ? [...list].reverse() : list);
      setTotals(sum?.totals || null);
      setPage(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const pageRows = rows.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
        <PageHeader title="My invoices" subtitle={totals ? `Balance due ${money(totals.outstanding, true)}` : ""} />
        <InvoiceAlerts compact />
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="open" label="To pay" />
          <Tab value="paid" label="Paid" />
          <Tab value="all" label="All" />
        </Tabs>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <Loader inline /> : !rows.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            {tab === "open" ? "Nothing to pay right now." : "No invoices yet."}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {pageRows.map((inv) => {
              const s = payStatus(inv);
              return (
                <Card key={inv.invoice_number}>
                  <CardActionArea onClick={() => setOpen(inv.invoice_number)}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{inv.invoice_number}</Typography>
                        <Chip size="small" color={s.color} variant={s.color === "default" ? "outlined" : "filled"} label={s.label} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(inv.invoice_date)} · {inv.kitchen_name} · indent {inv.indent_number}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{termLabel(inv.credit_term)} · due</Typography>
                          <Typography variant="body2" color={inv.days_overdue > 0 && inv.balance_due > 0 ? "error.main" : "text.primary"}>
                            {formatDate(inv.due_date)}{inv.days_overdue > 0 && inv.balance_due > 0 ? ` (${inv.days_overdue} days overdue)` : ""}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="text.secondary">Balance / total</Typography>
                          <Typography fontWeight={700}>
                            {money(inv.balance_due, true)} <Typography component="span" variant="caption">/ {money(inv.total_amount, true)}</Typography>
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
            <TablePagination component="div" count={rows.length} page={page} onPageChange={(e, p) => setPage(p)}
              rowsPerPage={perPage} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Per page"
              onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
          </Stack>
        )}
      </Box>
      <InvoiceDialog open={!!open} invoiceNumber={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default MyInvoices;

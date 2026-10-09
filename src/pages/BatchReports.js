import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { getBatches, getWastage } from "../utilities/service";
import { FormattedDate, formatDate, money } from "../utilities/helpers";
import { TraceDialog, ExpiryChip } from "./Batches";

const n = (v) => Number(v || 0).toLocaleString("en-CA", { maximumFractionDigits: 3 });
const monthStart = () => { const d = new Date(); d.setDate(1); return FormattedDate(d); };

const Range = ({ range, setRange }) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
    <TextField type="date" size="small" label="From" value={range.from_date} InputLabelProps={{ shrink: true }}
      onChange={(e) => setRange({ ...range, from_date: e.target.value })} />
    <TextField type="date" size="small" label="To" value={range.to_date} InputLabelProps={{ shrink: true }}
      onChange={(e) => setRange({ ...range, to_date: e.target.value })} />
  </Stack>
);

// Batches made in a period: produced, dispatched, written off, left
const Production = ({ onTrace }) => {
  const [range, setRange] = useState({ from_date: monthStart(), to_date: FormattedDate(new Date()) });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setRows(null);
    getBatches(range).then((r) => setRows(r.batches)).catch((e) => { setError(e.message); setRows([]); });
  }, [range]);
  useEffect(() => { load(); }, [load]);
  const byProduct = useMemo(() => {
    const m = {};
    (rows || []).forEach((b) => {
      const x = (m[b.product_id] = m[b.product_id] || { product_name: b.product_name, uom: b.uom, batches: 0, produced: 0, dispatched: 0, written_off: 0, left: 0 });
      x.batches++; x.produced += b.qty_produced; x.dispatched += b.qty_dispatched; x.written_off += b.qty_written_off; x.left += b.qty_remaining;
    });
    return Object.values(m).sort((a, b) => a.product_name.localeCompare(b.product_name));
  }, [rows]);
  return (
    <>
      <Range range={range} setRange={setRange} />
      {error && <Alert severity="error">{error}</Alert>}
      {!rows ? <Loader inline /> : !rows.length ? <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No batches made in this period.</Typography> : (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>By product</Typography>
          <TableContainer component={Card} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead><TableRow>{["Product", "Batches", "Produced", "Dispatched", "Written off", "Left"].map((h, i) => <TableCell key={h} align={i ? "right" : "left"} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {byProduct.map((p) => (
                  <TableRow key={p.product_name}>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell align="right">{p.batches}</TableCell>
                    <TableCell align="right">{n(p.produced)} {p.uom}</TableCell>
                    <TableCell align="right">{n(p.dispatched)}</TableCell>
                    <TableCell align="right" sx={{ color: p.written_off ? "warning.dark" : undefined }}>{n(p.written_off)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{n(p.left)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Batches (click one to see where it went)</Typography>
          <TableContainer component={Card} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead><TableRow>{["Batch", "Product", "Made", "Best before", "Produced", "Dispatched", "Written off", "Left"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.batch_no} hover sx={{ cursor: "pointer" }} onClick={() => onTrace(b.batch_no)}>
                    <TableCell sx={{ fontFamily: "monospace" }}>{b.batch_no}</TableCell>
                    <TableCell>{b.product_name}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(b.mfg_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(b.best_before) || "-"} <ExpiryChip b={b} /></TableCell>
                    <TableCell>{n(b.qty_produced)}</TableCell>
                    <TableCell>{n(b.qty_dispatched)}</TableCell>
                    <TableCell>{b.qty_written_off ? n(b.qty_written_off) : "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{n(b.qty_remaining)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
};

const Wastage = ({ onTrace }) => {
  const [range, setRange] = useState({ from_date: monthStart(), to_date: FormattedDate(new Date()) });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setRows(null);
    getWastage(range).then((r) => setRows(r.rows)).catch((e) => { setError(e.message); setRows([]); });
  }, [range]);
  const value = (rows || []).reduce((s, r) => s + (r.value || 0), 0);
  return (
    <>
      <Range range={range} setRange={setRange} />
      {error && <Alert severity="error">{error}</Alert>}
      {!rows ? <Loader inline /> : !rows.length ? <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No write-offs in this period.</Typography> : (
        <TableContainer component={Card} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>{["Date", "Batch", "Product", "Qty", "Reason / note", "Cost value", "By"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} hover sx={{ cursor: "pointer" }} onClick={() => onTrace(r.batch_no)}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.move_date)}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{r.batch_no}</TableCell>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell>{n(r.qty)} {r.uom || ""}</TableCell>
                  <TableCell>{r.note}</TableCell>
                  <TableCell>{r.value !== null ? money(r.value, true) : "-"}</TableCell>
                  <TableCell>{r.created_by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} sx={{ fontWeight: 700 }}>Total cost value (where cost was entered)</TableCell>
                <TableCell colSpan={2} sx={{ fontWeight: 700 }}>{money(value, true)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

const Trace = ({ onTrace }) => {
  const [q, setQ] = useState("");
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
      <TextField size="small" label="Batch number" value={q} onChange={(e) => setQ(e.target.value.toUpperCase().trim())} sx={{ minWidth: 260 }}
        helperText="Shows every branch, indent and invoice the batch went to (for recalls)" />
      <Button variant="contained" disabled={q.length < 6} onClick={() => onTrace(q)}>Trace</Button>
    </Stack>
  );
};

const BatchReports = () => {
  document.title = `Batch reports | ${CONFIG.title.name}`;
  const [tab, setTab] = useState("production");
  const [trace, setTrace] = useState(null);
  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Batch reports" subtitle="Production, traceability and wastage" />
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
          <Tab value="production" label="Batch production" />
          <Tab value="trace" label="Traceability" />
          <Tab value="wastage" label="Wastage" />
        </Tabs>
        {tab === "production" && <Production onTrace={setTrace} />}
        {tab === "trace" && <Trace onTrace={setTrace} />}
        {tab === "wastage" && <Wastage onTrace={setTrace} />}
      </Box>
      <TraceDialog batchNo={trace} onClose={() => setTrace(null)} />
    </>
  );
};

export default BatchReports;

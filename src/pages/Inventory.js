import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import StockAlerts from "../components/StockAlerts";
import { getAllBranches, getStock, getStockDaily } from "../utilities/service";
import { FormattedDate, formatDate } from "../utilities/helpers";
import { useUser } from "../utilities/UserContext";

const n = (v) => Number(v || 0).toLocaleString("en-CA", { maximumFractionDigits: 3 });

const CurrentStock = ({ branchId }) => {
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setRows(null);
    getStock({ branch_id: branchId }).then((r) => setRows(r.stock)).catch((e) => setError(e.message));
  }, [branchId]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!rows) return <Loader inline />;
  if (!rows.length) return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No batch-tracked products. Give products a short code in Product Master.</Typography>;
  const flag = (s) => (s.short > 0 ? <Chip size="small" color="error" label={`Short ${n(s.short)}`} />
    : s.low ? <Chip size="small" color="warning" label="Reorder" /> : <Chip size="small" color="success" variant="outlined" label="OK" />);
  if (isMobile) {
    return (
      <Stack spacing={1.25}>
        {rows.map((s) => (
          <Card key={s.product_id}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{s.product_name} <Typography component="span" variant="caption">({s.short_code})</Typography></Typography>
                {flag(s)}
              </Stack>
              <Typography variant="body2">In stock <b>{n(s.on_hand)} {s.uom}</b> · needed for accepted indents {n(s.reserved)} · reorder at {s.reorder_level ?? "-"}</Typography>
              <Typography variant="caption" color="text.secondary">{s.open_batches} open batch(es){s.next_best_before ? ` · next best-before ${formatDate(s.next_best_before)}` : ""}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }
  return (
    <TableContainer component={Card}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Product", "Producing branch", "In stock", "Needed (accepted)", "Free", "Reorder level", "Open batches", "Next best-before", ""].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700 }} align={["In stock", "Needed (accepted)", "Free", "Reorder level", "Open batches"].includes(h) ? "right" : "left"}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.product_id} hover>
              <TableCell>{s.product_name} <Typography component="span" variant="caption" color="text.secondary">({s.short_code})</Typography></TableCell>
              <TableCell>{s.branch_name}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{n(s.on_hand)} {s.uom}</TableCell>
              <TableCell align="right">{n(s.reserved)}</TableCell>
              <TableCell align="right" sx={{ color: s.free < 0 ? "error.main" : undefined }}>{n(s.free)}</TableCell>
              <TableCell align="right">{s.reorder_level ?? "-"}</TableCell>
              <TableCell align="right">{s.open_batches}</TableCell>
              <TableCell>{formatDate(s.next_best_before) || "-"}</TableCell>
              <TableCell>{flag(s)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Daily = ({ branchId }) => {
  const today = FormattedDate(new Date());
  const weekAgo = FormattedDate(new Date(Date.now() - 6 * 86400000));
  const [range, setRange] = useState({ from_date: weekAgo, to_date: today });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setRows(null);
    setError("");
    getStockDaily({ ...range, branch_id: branchId }).then((r) => setRows(r.rows)).catch((e) => { setError(e.message); setRows([]); });
  }, [range, branchId]);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField type="date" size="small" label="From" value={range.from_date} InputLabelProps={{ shrink: true }}
          onChange={(e) => setRange({ ...range, from_date: e.target.value })} />
        <TextField type="date" size="small" label="To" value={range.to_date} InputLabelProps={{ shrink: true }}
          onChange={(e) => setRange({ ...range, to_date: e.target.value })} />
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!rows ? <Loader inline /> : !rows.length ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No stock movement in this period.</Typography>
      ) : (
        <TableContainer component={Card} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Date", "Product", "Opening", "Added", "Dispatched", "Written off", "Correction", "Closing"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align={["Date", "Product"].includes(h) ? "left" : "right"}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.date}-${r.product_id}`} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.date)}</TableCell>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell align="right">{n(r.opening)}</TableCell>
                  <TableCell align="right" sx={{ color: r.added ? "success.main" : undefined }}>{r.added ? `+${n(r.added)}` : "-"}</TableCell>
                  <TableCell align="right">{r.dispatched ? n(r.dispatched) : "-"}</TableCell>
                  <TableCell align="right" sx={{ color: r.written_off ? "warning.dark" : undefined }}>{r.written_off ? n(r.written_off) : "-"}</TableCell>
                  <TableCell align="right">{r.adjusted ? n(r.adjusted) : "-"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{n(r.closing)} {r.uom || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

const Inventory = () => {
  document.title = `Inventory | ${CONFIG.title.name}`;
  const { user, can } = useUser();
  const [tab, setTab] = useState("stock");
  const [branchId, setBranchId] = useState("");
  const [kitchens, setKitchens] = useState([]);
  const kitchenUser = user?.user_type === "K";
  useEffect(() => {
    if (!kitchenUser) getAllBranches().then((b) => setKitchens(b.filter((x) => x.branch_type === "K"))).catch(() => {});
  }, [kitchenUser]);
  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Inventory" subtitle="Batch stock: opening, added, dispatched, written off, closing"
          action={can("BATCHES") && <Button variant="outlined" component={Link} to="/batches">Batches</Button>} />
        <StockAlerts />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ flexGrow: 1 }}>
            <Tab value="stock" label="Current stock" />
            <Tab value="daily" label="Daily movement" />
          </Tabs>
          {!kitchenUser && (
            <TextField select size="small" label="Producing branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}
              sx={{ minWidth: 240 }} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value="">All kitchens</MenuItem>
              {kitchens.map((k) => <MenuItem key={k.branch_id} value={k.branch_id}>{k.branch_name}</MenuItem>)}
            </TextField>
          )}
        </Stack>
        {tab === "stock" ? <CurrentStock branchId={branchId} /> : <Daily branchId={branchId} />}
      </Box>
    </>
  );
};

export default Inventory;

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  InputAdornment,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PrintIcon from "@mui/icons-material/Print";
import TimelineIcon from "@mui/icons-material/Timeline";
import SearchIcon from "@mui/icons-material/Search";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import StockAlerts from "../components/StockAlerts";
import { useToast } from "../components/ToastProvider";
import { useUser } from "../utilities/UserContext";
import {
  closeBatch, createBatch, getAllBranches, getBatchTrace, getBatches, getProductSettings, updateBatch,
} from "../utilities/service";
import { FormattedDate, formatDate } from "../utilities/helpers";
import { printBatchLabels } from "../utilities/batchLabel";

const addDays = (d, n) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return FormattedDate(x);
};
const qty = (n, uom) => `${Number(n).toLocaleString("en-CA", { maximumFractionDigits: 3 })}${uom ? ` ${uom}` : ""}`;

export const ExpiryChip = ({ b }) =>
  b.expiry === "expired" ? <Chip size="small" color="error" label="Expired" />
    : b.expiry === "soon" ? <Chip size="small" color="warning" label="Best before soon" /> : null;

const StatusChip = ({ b }) =>
  b.status === "O" ? <Chip size="small" color="success" variant="outlined" label="Open" />
    : <Chip size="small" label={b.close_reason === "USED" ? "Closed · used" : `Closed · ${b.close_reason_label || ""}`} />;

// ---------- new batch ----------
const NewBatchDialog = ({ open, products, branches, onClose, onSaved }) => {
  const toast = useToast();
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const [f, setF] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [printAfter, setPrintAfter] = useState(0);
  useEffect(() => {
    if (open) { setF({ product_id: "", qty: "", mfg_date: FormattedDate(new Date()), best_before: "", unit_cost: "", note: "" }); setError(""); setPrintAfter(0); }
  }, [open]);
  const p = products.find((x) => x.product_id === f.product_id);
  const br = p && branches[p.producing_branch_id];
  const autoBest = p?.shelf_life_days ? addDays(f.mfg_date, Number(p.shelf_life_days)) : "";
  const preview = p && br?.short_code ? `${br.short_code}${p.short_code}${(f.mfg_date || "").slice(5, 7)}${(f.mfg_date || "").slice(8, 10)}${(f.mfg_date || "").slice(2, 4)}####` : null;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await createBatch({ ...f, best_before: f.best_before || autoBest || null, unit_cost: f.unit_cost === "" ? null : f.unit_cost });
      toast.success(r.message);
      if (printAfter > 0) await printBatchLabels({ ...r.batch, product_name: p.product_name, branch_name: br?.branch_name }, printAfter);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const tracked = products.filter((x) => x.short_code);
  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>New batch</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!tracked.length && (
          <Alert severity="info" sx={{ mb: 2 }}>No product has a short code yet. Set short codes and producing branches in Product Master.</Alert>
        )}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Product" value={f.product_id || ""} onChange={set("product_id")} fullWidth>
            {tracked.map((x) => (
              <MenuItem key={x.product_id} value={x.product_id}>{x.product_name} ({x.short_code})</MenuItem>
            ))}
          </TextField>
          {p && !br?.short_code && <Alert severity="warning">Set a 2-letter short code for the producing branch in Branch Master.</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Quantity produced" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value.replace(/[^\d.]/g, "") })}
              fullWidth inputProps={{ inputMode: "decimal" }}
              InputProps={{ endAdornment: p?.uom ? <InputAdornment position="end">{p.uom}</InputAdornment> : null }} />
            <TextField type="date" label="Manufacturing date" value={f.mfg_date} onChange={set("mfg_date")} fullWidth
              InputLabelProps={{ shrink: true }} inputProps={{ max: FormattedDate(new Date()) }} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField type="date" label="Best before" value={f.best_before || autoBest} onChange={set("best_before")} fullWidth
              InputLabelProps={{ shrink: true }}
              helperText={p?.shelf_life_days ? `Shelf life ${p.shelf_life_days} day(s)` : "Set shelf life in Product Master to fill this"} />
            <TextField label="Cost per unit (optional)" value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value.replace(/[^\d.]/g, "") })}
              fullWidth inputProps={{ inputMode: "decimal" }} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          </Stack>
          <TextField label="Note" value={f.note} onChange={set("note")} multiline minRows={2} inputProps={{ maxLength: 500 }} />
          <TextField select label="Print labels after saving" value={printAfter} onChange={(e) => setPrintAfter(Number(e.target.value))} sx={{ maxWidth: 260 }}>
            {[0, 1, 2, 4, 6, 10, 20].map((n) => <MenuItem key={n} value={n}>{n ? `${n} label(s)` : "No labels"}</MenuItem>)}
          </TextField>
          {preview && <Typography variant="body2" color="text.secondary">Batch number will be like <b>{preview}</b></Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving || !p || !(Number(f.qty) > 0) || !br?.short_code} onClick={save}>
          {saving ? "Saving..." : "Create batch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- edit ----------
const EditDialog = ({ batch, onClose, onSaved }) => {
  const toast = useToast();
  const [f, setF] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (batch) setF({ qty_produced: String(batch.qty_produced), best_before: batch.best_before || "", unit_cost: batch.unit_cost ?? "", note: batch.note || "" });
    setError("");
  }, [batch]);
  if (!batch) return null;
  const used = batch.qty_produced - batch.qty_remaining;
  const save = async () => {
    try {
      const r = await updateBatch({ batch_no: batch.batch_no, ...f, unit_cost: f.unit_cost === "" ? null : f.unit_cost });
      toast.success(r.message);
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit {batch.batch_no}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Quantity produced" value={f.qty_produced} onChange={(e) => setF({ ...f, qty_produced: e.target.value.replace(/[^\d.]/g, "") })}
            helperText={used > 0 ? `${qty(used, batch.uom)} already used; cannot go below that` : "Correct a counting mistake"} />
          <TextField type="date" label="Best before" value={f.best_before} onChange={(e) => setF({ ...f, best_before: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Cost per unit" value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value.replace(/[^\d.]/g, "") })} />
          <TextField label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- close ----------
const CloseDialog = ({ batch, reasons, onClose, onSaved }) => {
  const toast = useToast();
  const [reason, setReason] = useState("WASTED");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setReason("WASTED"); setNote(""); setError(""); }, [batch]);
  if (!batch) return null;
  const save = async () => {
    try {
      const r = await closeBatch({ batch_no: batch.batch_no, reason, note });
      toast.success(r.message);
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Close {batch.batch_no}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>
          {batch.qty_remaining > 0
            ? <>The remaining <b>{qty(batch.qty_remaining, batch.uom)}</b> will be written off and recorded as wastage.</>
            : "Nothing is left in this batch."}
        </Typography>
        <Stack spacing={2}>
          <TextField select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {Object.entries(reasons || {}).filter(([k]) => k !== "USED").map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField label={reason === "OTHER" ? "Note (required)" : "Note"} value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" disabled={reason === "OTHER" && !note.trim()} onClick={save}>Close batch</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- trace ----------
const MOVE = { PRODUCE: "Produced", OPENING: "Opening stock", DISPATCH: "Dispatched", WRITEOFF: "Written off", ADJUST: "Correction", REVERSAL: "Returned" };
export const TraceDialog = ({ batchNo, onClose }) => {
  const [t, setT] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!batchNo) return;
    setT(null); setError("");
    getBatchTrace(batchNo).then(setT).catch((e) => setError(e.message));
  }, [batchNo]);
  const fullScreen = useMediaQuery((th) => th.breakpoints.down("sm"));
  return (
    <Dialog open={!!batchNo} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>Batch {batchNo}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {!t && !error && <Loader inline />}
        {t && (
          <>
            <Typography fontWeight={700}>{t.batch.product_name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t.batch.branch_name} · made {formatDate(t.batch.mfg_date)} · best before {formatDate(t.batch.best_before) || "-"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
              <Chip label={`Produced ${qty(t.batch.qty_produced, t.batch.uom)}`} />
              <Chip label={`Dispatched ${qty(t.batch.qty_dispatched)}`} />
              {t.batch.qty_written_off > 0 && <Chip color="warning" label={`Written off ${qty(t.batch.qty_written_off)}`} />}
              <Chip color="success" variant="outlined" label={`Left ${qty(t.batch.qty_remaining)}`} />
            </Stack>
            <Typography variant="subtitle2">Where it went</Typography>
            {!t.dispatches.length && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Not dispatched yet.</Typography>}
            {t.dispatches.map((d) => (
              <Stack key={d.indent_number} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{d.branch_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {d.indent_number}{d.delivery_date ? ` · delivery ${formatDate(d.delivery_date)}` : ""}{d.invoice_number ? ` · ${d.invoice_number}` : ""}
                  </Typography>
                </Box>
                <Typography variant="body2">{qty(d.qty)}</Typography>
              </Stack>
            ))}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>History</Typography>
            {t.movements.map((m) => (
              <Stack key={m.movement_id} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                <Typography variant="body2">{formatDate(m.move_date)} · {MOVE[m.move_type] || m.move_type}{m.ref_no ? ` · ${m.ref_no}` : ""}{m.note ? ` · ${m.note}` : ""}</Typography>
                <Typography variant="body2" color={m.qty < 0 ? "error.main" : "success.main"}>{m.qty > 0 ? "+" : ""}{qty(m.qty)}</Typography>
              </Stack>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
};

// ---------- page ----------
const Batches = () => {
  document.title = `Batches | ${CONFIG.title.name}`;
  const { can } = useUser();
  const canEdit = can("BATCHES", true);
  const isMobile = useMediaQuery((t) => t.breakpoints.down("md"));
  const [filter, setFilter] = useState({ status: "O", product_id: "", q: "" });
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState({});
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState({ type: null, batch: null });

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getBatches({ ...filter, status: filter.status === "ALL" ? "" : filter.status }));
      setPage(0);
    } catch (e) {
      setError(e.message);
    }
  }, [filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getProductSettings().then((r) => setProducts(r.products || [])).catch(() => {});
    getAllBranches().then((b) => setBranches(Object.fromEntries(b.map((x) => [x.branch_id, x])))).catch(() => {});
  }, []);

  const rows = useMemo(() => data?.batches || [], [data]);
  const pageRows = rows.slice(page * perPage, page * perPage + perPage);
  const close = () => setDialog({ type: null, batch: null });
  const saved = () => { close(); load(); };
  const label = (b) => printBatchLabels(b, 1);

  const actions = (b) => (
    <Stack direction="row" spacing={0.25} justifyContent="flex-end">
      <Tooltip title="Where it went"><IconButton size="small" onClick={() => setDialog({ type: "trace", batch: b })}><TimelineIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Print label"><IconButton size="small" onClick={() => label(b)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
      {canEdit && b.status === "O" && (
        <>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => setDialog({ type: "edit", batch: b })}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Close batch"><IconButton size="small" onClick={() => setDialog({ type: "close", batch: b })}><LockIcon fontSize="small" /></IconButton></Tooltip>
        </>
      )}
    </Stack>
  );

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Batches" subtitle="Production batches; stock is what is left in open batches"
          action={canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "new" })}>New batch</Button>} />
        <StockAlerts compact />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField select size="small" label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} sx={{ minWidth: 140 }}>
            <MenuItem value="O">Open</MenuItem>
            <MenuItem value="C">Closed</MenuItem>
            <MenuItem value="ALL">All</MenuItem>
          </TextField>
          <TextField select size="small" label="Product" value={filter.product_id} onChange={(e) => setFilter({ ...filter, product_id: e.target.value })}
            sx={{ minWidth: 220 }} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
            <MenuItem value="">All products</MenuItem>
            {products.filter((p) => p.short_code).map((p) => <MenuItem key={p.product_id} value={p.product_id}>{p.product_name}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Batch number" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value.toUpperCase() })}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!data ? <Loader inline /> : !rows.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>No batches here.</Typography>
        ) : isMobile ? (
          <Stack spacing={1.25}>
            {pageRows.map((b) => (
              <Card key={b.batch_no}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ fontFamily: "monospace" }}>{b.batch_no}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{b.product_name}</Typography>
                    </Box>
                    <StatusChip b={b} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography variant="caption">Made {formatDate(b.mfg_date)}</Typography>
                    {b.best_before && <Typography variant="caption">· best before {formatDate(b.best_before)}</Typography>}
                    <ExpiryChip b={b} />
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Left <b>{qty(b.qty_remaining, b.uom)}</b> of {qty(b.qty_produced)}</Typography>
                    {actions(b)}
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
                  {["Batch", "Product", "Made", "Best before", "Produced", "Dispatched", "Written off", "Left", "Status", ""].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                      align={["Produced", "Dispatched", "Written off", "Left"].includes(h) ? "right" : "left"}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((b) => (
                  <TableRow key={b.batch_no} hover>
                    <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{b.batch_no}{b.source === "I" && <Typography variant="caption" color="text.secondary" display="block">Opening stock</Typography>}</TableCell>
                    <TableCell>{b.product_name}<Typography variant="caption" color="text.secondary" display="block">{b.branch_name}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(b.mfg_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(b.best_before) || "-"} <ExpiryChip b={b} /></TableCell>
                    <TableCell align="right">{qty(b.qty_produced)}</TableCell>
                    <TableCell align="right">{qty(b.qty_dispatched)}</TableCell>
                    <TableCell align="right">{b.qty_written_off ? qty(b.qty_written_off) : "-"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{qty(b.qty_remaining, b.uom)}</TableCell>
                    <TableCell><StatusChip b={b} /></TableCell>
                    <TableCell>{actions(b)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {rows.length > 0 && (
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(e, p) => setPage(p)}
            rowsPerPage={perPage} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Per page"
            onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        )}
      </Box>
      <NewBatchDialog open={dialog.type === "new"} products={products} branches={branches} onClose={close} onSaved={saved} />
      <EditDialog batch={dialog.type === "edit" ? dialog.batch : null} onClose={close} onSaved={saved} />
      <CloseDialog batch={dialog.type === "close" ? dialog.batch : null} reasons={data?.close_reasons} onClose={close} onSaved={saved} />
      <TraceDialog batchNo={dialog.type === "trace" ? dialog.batch?.batch_no : null} onClose={close} />
    </>
  );
};

export default Batches;

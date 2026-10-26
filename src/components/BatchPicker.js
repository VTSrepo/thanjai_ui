import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getBatchSuggest, getIndentBatches } from "../utilities/service";
import { formatDate } from "../utilities/helpers";

const q3 = (n) => Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
const sum = (a) => q3((a || []).reduce((s, x) => s + (Number(x.qty) || 0), 0));

// Problems per item. Stock is not enforced: quantity without batch stock is a warning (it is dispatched as
// "NO BATCH"); picking more than the dispatch qty or more than a batch holds is an error.
export const allocationProblems = (items, alloc) =>
  items.filter((i) => i.qty > 0).map((i) => {
    const a = alloc[i.item_code] || [];
    const over = a.find((x) => Number(x.qty) > (i.batches.find((b) => b.batch_no === x.batch_no)?.qty_remaining || 0));
    if (over) return { item: i, message: `batch ${over.batch_no} does not have ${over.qty}` };
    const picked = sum(a);
    if (picked > q3(i.qty)) return { item: i, message: `batches add up to ${picked}, dispatch qty is ${i.qty}` };
    if (picked < q3(i.qty)) {
      return { item: i, warning: true, short: q3(i.qty - picked),
        message: `${q3(i.qty - picked)} ${i.uom || ""} without batch stock${i.available < i.qty ? ` (only ${i.available} in stock)` : ""}` };
    }
    return null;
  }).filter(Boolean);

const EditSplit = ({ item, value, onClose, onSave }) => {
  const [rows, setRows] = useState({});
  useEffect(() => {
    if (item) setRows(Object.fromEntries((value || []).map((a) => [a.batch_no, String(a.qty)])));
  }, [item, value]);
  if (!item) return null;
  const total = q3(Object.values(rows).reduce((s, v) => s + (Number(v) || 0), 0));
  const oldestFirst = () => setRows(Object.fromEntries(item.suggested.map((a) => [a.batch_no, String(a.qty)])));
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Batches for {item.product_name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Dispatch qty <b>{item.qty} {item.uom || ""}</b>. Picked <b style={{ color: total === q3(item.qty) ? undefined : "#c62828" }}>{total}</b>.
        </Typography>
        <Stack spacing={1}>
          {item.batches.map((b) => (
            <Stack key={b.batch_no} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{b.batch_no}</Typography>
                <Typography variant="caption" color="text.secondary">
                  made {formatDate(b.mfg_date)}{b.best_before ? ` · best before ${formatDate(b.best_before)}` : ""} · {b.qty_remaining} left
                </Typography>
              </Box>
              <TextField size="small" label="Take" value={rows[b.batch_no] || ""} sx={{ width: 110 }}
                error={Number(rows[b.batch_no]) > b.qty_remaining}
                onChange={(e) => setRows({ ...rows, [b.batch_no]: e.target.value.replace(/[^\d.]/g, "") })}
                inputProps={{ inputMode: "decimal" }} />
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={oldestFirst} sx={{ mr: "auto" }}>Oldest first</Button>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(Object.entries(rows).map(([batch_no, qty]) => ({ batch_no, qty: q3(qty) })).filter((a) => a.qty > 0))}>
          Use these
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Kitchen dispatch: for each batch-tracked item shows which batches the stock comes from
 * (oldest first by default; editable). qtyByItem: { item_code: dispatch qty }.
 * onChange({ alloc, problems }) whenever the split or quantities change.
 */
const BatchPicker = ({ indentNumber, qtyByItem, onChange }) => {
  const [items, setItems] = useState(null);
  const [alloc, setAlloc] = useState({});
  const [edited, setEdited] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState("");
  const key = JSON.stringify(qtyByItem);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      getBatchSuggest(indentNumber, qtyByItem)
        .then((r) => {
          setItems(r.items);
          // keep manual splits for items whose qty did not change; otherwise use the oldest-first suggestion
          setAlloc((prev) => Object.fromEntries(r.items.map((i) => [i.item_code,
            edited[i.item_code] === i.qty && prev[i.item_code] ? prev[i.item_code] : i.suggested])));
        })
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indentNumber, key]);

  const problems = useMemo(() => (items ? allocationProblems(items, alloc) : []), [items, alloc]);
  useEffect(() => {
    if (items) onChange?.({ alloc, problems, ready: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alloc, problems, items]);

  if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  if (!items || !items.length) return null;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>Pick from batches</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Oldest batches first. Use Change to pick differently. Items without enough batch stock can still be dispatched.</Typography>
        <Stack spacing={1}>
          {items.filter((i) => i.qty > 0).map((i) => {
            const p = problems.find((x) => x.item.item_code === i.item_code);
            return (
              <Box key={i.item_code} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>{i.product_name} · {i.qty} {i.uom || ""}</Typography>
                  {i.batches.length > 0 && <Button size="small" onClick={() => setEditItem(i)}>Change</Button>}
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, mt: 0.5 }}>
                  {(alloc[i.item_code] || []).map((a) => (
                    <Chip key={a.batch_no} size="small" variant="outlined" label={`${a.batch_no} × ${a.qty}`} sx={{ fontFamily: "monospace" }} />
                  ))}
                </Stack>
                {p && <Typography variant="caption" color={p.warning ? "warning.dark" : "error.main"}>
                  {p.warning ? `Warning: ${p.message}. You can still dispatch; it is recorded as NO BATCH.` : p.message}
                </Typography>}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
      <EditSplit item={editItem} value={editItem ? alloc[editItem.item_code] : null} onClose={() => setEditItem(null)}
        onSave={(a) => {
          setAlloc((x) => ({ ...x, [editItem.item_code]: a }));
          setEdited((x) => ({ ...x, [editItem.item_code]: editItem.qty }));
          setEditItem(null);
        }} />
    </Card>
  );
};

// Read-only: batches an indent was dispatched from
export const DispatchedBatches = ({ indentNumber, items }) => {
  const [alloc, setAlloc] = useState(null);
  useEffect(() => {
    getIndentBatches(indentNumber).then((r) => setAlloc(r.allocations)).catch(() => {});
  }, [indentNumber]);
  if (!alloc || !Object.keys(alloc).length) return null;
  const name = (code) => items.find((i) => i.item_code === code)?.product_name || code;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Batches dispatched</Typography>
        {Object.entries(alloc).map(([code, a]) => (
          <Box key={code} sx={{ mb: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>{name(code)}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
              {a.map((x) => <Chip key={x.batch_no} size="small" variant="outlined" label={`${x.batch_no} × ${x.qty}`} sx={{ fontFamily: "monospace" }} />)}
            </Stack>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default BatchPicker;

import React, { useEffect, useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import { getStockAlerts } from "../utilities/service";
import { formatDate } from "../utilities/helpers";
import { useUser } from "../utilities/UserContext";

// Traffic-light colours shared by the home tiles
export const LIGHT = {
  green: { color: "#2e7d32", bg: "#e8f5e9", label: "OK" },
  amber: { color: "#b26a00", bg: "#fff4e0", label: "Check" },
  red: { color: "#c62828", bg: "#fdecea", label: "Action" },
};

/**
 * Stock status from the alerts API, summarised as traffic lights:
 *  batch  - accepted indents needing more than the batch stock (dispatch still allowed): 0 green, 1-5 amber, 6+ red
 *  reorder - products at or below their reorder level (level 0 = not tracked): 0 green, 1-10 amber, 11+ red
 *  expiry  - open batches near best-before (amber) or past it (red)
 */
export const stockLights = (a) => {
  if (!a) return null;
  const expired = a.expiring.filter((e) => e.expired).length;
  const indents = new Set(a.shortfall.flatMap((s) => s.indents || []));
  return {
    batch: {
      light: !a.shortfall.length ? "green" : a.shortfall.length > 5 ? "red" : "amber",
      title: "Batch stock",
      summary: a.shortfall.length ? `${a.shortfall.length} product(s) short` : "All accepted indents covered",
      sub: a.shortfall.length ? `for ${indents.size} accepted indent(s) - dispatch still allowed` : "Enough batch stock",
    },
    reorder: {
      light: !a.reorder.length ? "green" : a.reorder.length > 10 ? "red" : "amber",
      title: "Reorder",
      summary: a.reorder.length ? `${a.reorder.length} product(s) at or below reorder level` : "Stock above reorder levels",
      sub: a.reorder.length ? "Plan cooking for these" : "Only products with a reorder level are checked",
    },
    expiry: {
      light: expired ? "red" : a.expiring.length ? "amber" : "green",
      title: "Best-before",
      summary: expired ? `${expired} batch(es) past best-before` : a.expiring.length ? `${a.expiring.length} batch(es) expire within 2 days` : "No batches near best-before",
      sub: expired ? "Close them as Expired" : a.expiring.length ? "Dispatch these first" : "",
    },
  };
};

export const useStockAlerts = () => {
  const [a, setA] = useState(null);
  useEffect(() => {
    getStockAlerts().then(setA).catch(() => {});
  }, []);
  return a;
};

const Dot = ({ light, size = 12 }) => (
  <Box component="span" sx={{ width: size, height: size, borderRadius: "50%", bgcolor: LIGHT[light].color, display: "inline-block", flexShrink: 0 }} />
);
export { Dot };

/** Detail list for one light: kind = batch | reorder | expiry */
export const StockDetailsDialog = ({ kind, alerts, onClose }) => {
  const { can } = useUser();
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  if (!kind || !alerts) return null;
  const head = (cols) => <TableHead><TableRow>{cols.map((c) => <TableCell key={c} sx={{ fontWeight: 700 }}>{c}</TableCell>)}</TableRow></TableHead>;
  let title = "";
  let body = null;
  let action = null;
  if (kind === "batch") {
    title = "Batch stock short for accepted indents";
    body = !alerts.shortfall.length ? <Typography>All accepted indents are covered by batch stock.</Typography> : (
      <Table size="small">
        {head(["Product", "Need", "Have", "Short", "Indents"])}
        <TableBody>
          {alerts.shortfall.map((s) => (
            <TableRow key={s.product_id}>
              <TableCell>{s.product_name}</TableCell><TableCell>{s.reserved}</TableCell><TableCell>{s.on_hand}</TableCell>
              <TableCell sx={{ fontWeight: 700, color: LIGHT.red.color }}>{s.short} {s.uom || ""}</TableCell>
              <TableCell sx={{ fontSize: 12 }}>{(s.indents || []).join(", ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (can("BATCHES", true)) action = <Button component={Link} to="/batches" onClick={onClose}>Add batch</Button>;
  }
  if (kind === "reorder") {
    title = "At or below reorder level";
    body = !alerts.reorder.length ? <Typography>No product is at or below its reorder level.</Typography> : (
      <Table size="small">
        {head(["Product", "In stock", "Reorder level", "Kitchen"])}
        <TableBody>
          {alerts.reorder.map((s) => (
            <TableRow key={s.product_id}>
              <TableCell>{s.product_name}</TableCell><TableCell>{s.on_hand} {s.uom || ""}</TableCell>
              <TableCell>{s.reorder_level}</TableCell><TableCell>{s.branch_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (can("INVENTORY")) action = <Button component={Link} to="/inventory" onClick={onClose}>Open inventory</Button>;
  }
  if (kind === "expiry") {
    title = "Batches near or past best-before";
    body = !alerts.expiring.length ? <Typography>No open batch is near its best-before date.</Typography> : (
      <Table size="small">
        {head(["Batch", "Product", "Left", "Best before"])}
        <TableBody>
          {alerts.expiring.map((e) => (
            <TableRow key={e.batch_no}>
              <TableCell sx={{ fontFamily: "monospace" }}>{e.batch_no}</TableCell><TableCell>{e.product_name}</TableCell>
              <TableCell>{e.qty_remaining} {e.uom || ""}</TableCell>
              <TableCell sx={{ color: e.expired ? LIGHT.red.color : undefined, fontWeight: e.expired ? 700 : 400 }}>
                {formatDate(e.best_before)}{e.expired ? " (past)" : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    if (can("BATCHES")) action = <Button component={Link} to="/batches" onClick={onClose}>Open batches</Button>;
  }
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ overflowX: "auto" }}>{body}</DialogContent>
      <DialogActions>{action}<Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
};

/**
 * Compact stock status for kitchen / batch / inventory screens: a traffic-light chip for each area that needs a
 * look (nothing when all is green); tap one for the detail list.
 */
const StockAlerts = () => {
  const a = useStockAlerts();
  const [open, setOpen] = useState(null);
  const lights = stockLights(a);
  if (!lights) return null;
  const show = ["batch", "reorder", "expiry"].filter((k) => lights[k].light !== "green"); // only what needs a look
  if (!show.length) return null;
  return (
    <>
      <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2, flexWrap: "wrap" }}>
        {show.map((k) => {
          const l = lights[k];
          return (
            <Chip key={k} clickable onClick={() => setOpen(k)}
              icon={<Box sx={{ pl: 1, display: "flex" }}><Dot light={l.light} size={10} /></Box>}
              label={<span><b>{l.title}:</b> {l.summary}</span>}
              sx={{ bgcolor: LIGHT[l.light].bg, color: LIGHT[l.light].color, fontWeight: 500, height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }} />
          );
        })}
      </Stack>
      <StockDetailsDialog kind={open} alerts={a} onClose={() => setOpen(null)} />
    </>
  );
};

export default StockAlerts;

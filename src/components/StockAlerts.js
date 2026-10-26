import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { getStockAlerts } from "../utilities/service";
import { formatDate } from "../utilities/helpers";
import { useUser } from "../utilities/UserContext";

/**
 * Stock alerts for home screens:
 *  - shortfall: accepted indents need more than the batch stock (dispatch is blocked until a batch is entered)
 *  - reorder: stock at or below the product's reorder level
 *  - expiring: open batches at / near best-before
 * Kitchen users only see products their branch produces (server side).
 */
const StockAlerts = ({ compact = false, link = "/inventory", batchLink = "/batches" }) => {
  const [a, setA] = useState(null);
  const { can } = useUser();
  const btn = (screen, to, text) => (can(screen) ? <Button color="inherit" size="small" component={Link} to={to}>{text}</Button> : null);
  useEffect(() => {
    getStockAlerts().then(setA).catch(() => {});
  }, []);
  if (!a) return null;
  const items = [];
  if (a.shortfall.length) {
    items.push(
      <Alert key="s" severity="warning" action={can("BATCHES", true) ? btn("BATCHES", batchLink, "Add batch") : btn("INVENTORY", link, "Stock")}>
        <AlertTitle sx={{ mb: 0.5 }}>Not enough batch stock for accepted indents (dispatch is still allowed)</AlertTitle>
        {a.shortfall.map((s) => (
          <Typography key={s.product_id} variant="body2">
            {s.product_name}: need {s.reserved}, have {s.on_hand} — short <b>{s.short} {s.uom || ""}</b>
            {s.indents?.length ? ` (${s.indents.join(", ")})` : ""}
          </Typography>
        ))}
      </Alert>
    );
  }
  if (a.reorder.length) {
    items.push(
      <Alert key="r" severity="warning" action={btn("INVENTORY", link, "Stock")}>
        <AlertTitle sx={{ mb: compact ? 0 : 0.5 }}>Reorder: {a.reorder.length} product(s) at or below reorder level</AlertTitle>
        {!compact && (
          <Typography variant="body2">
            {a.reorder.map((s) => `${s.product_name} (${s.on_hand} / ${s.reorder_level})`).join(" · ")}
          </Typography>
        )}
      </Alert>
    );
  }
  if (a.expiring.length) {
    const expired = a.expiring.filter((e) => e.expired).length;
    items.push(
      <Alert key="e" severity={expired ? "error" : "info"} action={btn("BATCHES", batchLink, "Batches") || btn("INVENTORY", link, "Stock")}>
        <AlertTitle sx={{ mb: compact ? 0 : 0.5 }}>
          {expired ? `${expired} batch(es) past best-before` : `${a.expiring.length} batch(es) near best-before`}
        </AlertTitle>
        {!compact && (
          <Typography variant="body2">
            {a.expiring.slice(0, 6).map((e) => `${e.batch_no} ${e.product_name} ${e.qty_remaining} left, best before ${formatDate(e.best_before)}`).join(" · ")}
            {a.expiring.length > 6 ? ` · +${a.expiring.length - 6} more` : ""}
          </Typography>
        )}
      </Alert>
    );
  }
  if (!items.length) return null;
  return <Stack spacing={1} sx={{ mb: 2 }}>{items}</Stack>;
};

export default StockAlerts;

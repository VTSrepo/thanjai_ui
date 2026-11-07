import React, { useEffect, useState } from "react";
import { Box, Grid2, Stack, Typography } from "@mui/material";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { LIGHT, Dot, stockLights, useStockAlerts, StockDetailsDialog } from "../components/StockAlerts";
import { money } from "../utilities/helpers";
import { fetchIndents, getReceivablesSummary } from "../utilities/service";
import { useNavigate } from "react-router-dom";
import { useUser } from "../utilities/UserContext";
import Tile from "../components/StatusTile";
import { useReservationTiles } from "../components/ReservationTiles";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Admin / Operations home: one tile per area, each a green / amber / red light with a one-line summary.
 * Click a tile for the detail (a list, or the screen that handles it).
 */
const Admin = () => {
  document.title = `Admin | ${CONFIG.title.name}`;
  const { user, can } = useUser();
  const navigate = useNavigate();
  const showStock = can("INVENTORY") || can("BATCHES") || can("DASHBOARD");
  const stock = useStockAlerts();
  const lights = showStock ? stockLights(stock) : null;
  const [detail, setDetail] = useState(null);
  const [ind, setInd] = useState(null);
  const [money_, setMoney] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [accept, dispatch, onWay, toInvoice] = await Promise.all([
          fetchIndents(["C"], {}), fetchIndents(["A", "F"], {}), fetchIndents(["D"], {}), fetchIndents(["R"], {}),
        ]);
        const old = toInvoice.filter((i) => i.received_date && Date.now() - new Date(i.received_date).getTime() > 2 * DAY).length;
        setInd({ accept: accept.length, dispatch: dispatch.length, onWay: onWay.length, toInvoice: toInvoice.length, oldInvoice: old });
      } catch (e) {
        setInd(null);
      }
    })();
    if (can("PAYMENTS")) getReceivablesSummary().then((s) => setMoney(s?.totals || null)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resTiles = useReservationTiles();
  const tiles = [];
  if (ind) {
    const waiting = ind.accept + ind.dispatch;
    tiles.push(
      <Tile key="ind" title="Indents" light={waiting ? "amber" : "green"}
        summary={waiting ? `${ind.accept} to accept · ${ind.dispatch} to dispatch` : "Nothing waiting at the kitchens"}
        sub={`${ind.onWay} on the way to branches`} action="Open"
        onClick={() => navigate("/indents", { state: { tab: ind.accept ? "accept" : "dispatch" } })} />
    );
    if (can("INVOICE_SETUP")) {
      tiles.push(
        <Tile key="inv" title="Invoices to issue" light={!ind.toInvoice ? "green" : ind.oldInvoice ? "red" : "amber"}
          summary={ind.toInvoice ? `${ind.toInvoice} received indent(s) to invoice` : "All received indents invoiced"}
          sub={ind.oldInvoice ? `${ind.oldInvoice} waiting more than 2 days` : ind.toInvoice ? "Finalize under Indents → To invoice" : ""}
          action="Open" onClick={() => navigate("/indents", { state: { tab: "invoice" } })} />
      );
    }
  }
  if (money_) {
    const light = money_.overdue_count > 0 ? "red" : money_.due_soon_count > 0 ? "amber" : "green";
    tiles.push(
      <Tile key="pay" title="Payments" light={light}
        summary={money_.overdue_count > 0 ? `${money_.overdue_count} overdue · ${money(money_.overdue_amt, true)}`
          : money_.due_soon_count > 0 ? `${money_.due_soon_count} due in 7 days · ${money(money_.due_soon_amt, true)}` : "Nothing overdue"}
        sub={money_.overdue_count > 0 && money_.due_soon_count > 0 ? `${money_.due_soon_count} more due in 7 days · ${money(money_.due_soon_amt, true)}` : ""}
        action="Open" onClick={() => navigate("/payments")} />
    );
  }
  tiles.push(...resTiles);
  if (lights) {
    ["batch", "reorder", "expiry"].forEach((k) => {
      const l = lights[k];
      tiles.push(<Tile key={k} title={l.title} light={l.light} summary={l.summary} sub={l.sub} onClick={() => setDetail(k)} />);
    });
  }

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h6" fontWeight={700}>Welcome, {user?.user_name}</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2, color: "text.secondary", flexWrap: "wrap" }}>
          {Object.entries(LIGHT).map(([k, v]) => (
            <Stack key={k} direction="row" alignItems="center" spacing={0.5}>
              <Dot light={k} size={10} /><Typography variant="caption">{k === "green" ? "All good" : k === "amber" ? "Check" : "Needs action"}</Typography>
            </Stack>
          ))}
        </Stack>
        <Grid2 container spacing={2}>
          {tiles.map((t) => <Grid2 key={t.key} size={{ xs: 12, sm: 6, md: 4 }}>{t}</Grid2>)}
        </Grid2>
        {!tiles.length && <Typography color="text.secondary">Loading…</Typography>}
      </Box>
      <StockDetailsDialog kind={detail} alerts={stock} onClose={() => setDetail(null)} />
    </>
  );
};

export default Admin;

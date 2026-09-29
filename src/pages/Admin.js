import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Grid2, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import InvoiceAlerts from "../components/InvoiceAlerts";
import ProductionDataChart from "../components/ProductionDataChart";
import { FormattedDate } from "../utilities/helpers";
import { getProductSummary } from "../utilities/service";
import { useUser } from "../utilities/UserContext";

const rangeFor = (key) => {
  const today = new Date();
  const d = new Date(today);
  if (key === "7d") d.setDate(d.getDate() - 6);
  if (key === "month") d.setDate(1);
  return { start_date: FormattedDate(d), end_date: FormattedDate(today) };
};

const ChartCard = ({ title, loading, children }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography fontWeight={700} sx={{ mb: 1 }}>{title}</Typography>
      {loading ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack> : children}
    </CardContent>
  </Card>
);

const Admin = () => {
  document.title = `Admin | ${CONFIG.title.name}`;
  const { user } = useUser();
  const [quick, setQuick] = useState("today");
  const [range, setRange] = useState(rangeFor("today"));
  const [loading, setLoading] = useState(false);
  const [byProduct, setByProduct] = useState({});
  const [byEmployee, setByEmployee] = useState({});

  const load = useCallback(async (r) => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        getProductSummary({ ...r, type: "productwise" }).catch(() => null),
        getProductSummary({ ...r, type: "employeewise" }).catch(() => null),
      ]);
      setByProduct(p?.dashboard || {});
      setByEmployee(e?.dashboard || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(rangeFor("today"));
  }, [load]);

  const pickQuick = (e, v) => {
    if (!v) return;
    setQuick(v);
    const r = rangeFor(v);
    setRange(r);
    load(r);
  };

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Welcome, {user?.user_name}</Typography>
        <InvoiceAlerts />

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography fontWeight={700} sx={{ mb: 1.5 }}>Production: made vs damaged</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <ToggleButtonGroup exclusive size="small" color="primary" value={quick} onChange={pickQuick}>
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="7d">7 days</ToggleButton>
                <ToggleButton value="month">This month</ToggleButton>
              </ToggleButtonGroup>
              <TextField type="date" size="small" label="From" value={range.start_date} InputLabelProps={{ shrink: true }}
                onChange={(e) => { setQuick(null); setRange((r) => ({ ...r, start_date: e.target.value })); }} />
              <TextField type="date" size="small" label="To" value={range.end_date} InputLabelProps={{ shrink: true }}
                onChange={(e) => { setQuick(null); setRange((r) => ({ ...r, end_date: e.target.value })); }} />
              <Button variant="contained" disabled={!range.start_date || !range.end_date || loading} onClick={() => load(range)}>
                Show
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <ChartCard title="By product" loading={loading}>
              <ProductionDataChart filterBy="product" summary={byProduct} />
            </ChartCard>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <ChartCard title="By employee" loading={loading}>
              <ProductionDataChart filterBy="employee" summary={byEmployee} />
            </ChartCard>
          </Grid2>
        </Grid2>
      </Box>
    </>
  );
};

export default Admin;

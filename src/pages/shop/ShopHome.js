import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import MealPicker from "../../components/shop/MealPicker";
import Loader from "../../components/Loader";
import { cad, niceDate, niceDateTime, shopInfo, WEEKDAY, zoneCheck } from "../../utilities/shopApi";

const STEPS = [
  ["Choose a plan", "5, 10 or 15 meals a week. Skip, pause or cancel any time."],
  ["Pick your meals", "A new menu every week. Not sure? We fill in the chef's picks."],
  ["Cooked fresh", "Prepared in our kitchen and sealed for freshness."],
  ["Delivered to you", "Heat and enjoy. Delivered to your door every week."],
];

const PostalCheck = () => {
  const [postal, setPostal] = useState("");
  const [res, setRes] = useState(null);
  const check = async () => {
    try { setRes(await zoneCheck(postal)); } catch (e) { setRes({ delivers: false, message: e.message }); }
  };
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
      <TextField size="small" label="Your postal code" value={postal} onChange={(e) => { setPostal(e.target.value); setRes(null); }}
        onKeyDown={(e) => e.key === "Enter" && check()} inputProps={{ maxLength: 7, style: { textTransform: "uppercase" } }} />
      <Button variant="outlined" onClick={check} disabled={postal.trim().length < 6}>Check delivery</Button>
      {res && (
        <Alert severity={res.delivers ? "success" : "warning"} sx={{ py: 0 }}>
          {res.delivers ? `We deliver to ${res.zone_name}${res.delivery_fee ? ` (delivery ${cad(res.delivery_fee)})` : " – free delivery"}.` : res.message}
        </Alert>
      )}
    </Stack>
  );
};

const ShopHome = () => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    shopInfo().then((r) => { setInfo(r); document.title = r.shop.name; }).catch((e) => setError(e.message));
  }, []);
  if (error) return <ShopLayout><Alert severity="error">{error}</Alert></ShopLayout>;
  if (!info) return <Loader />;
  const { shop, plans, zones, week, menu } = info;
  return (
    <ShopLayout shop={shop}>
      <Box sx={{ textAlign: "center", py: { xs: 3, sm: 6 } }}>
        <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: 32, sm: 44 } }}>Home-style Indian meals, every week</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 1, fontWeight: 400 }}>
          Freshly cooked, delivered every {WEEKDAY[shop.delivery_weekday]}. Halal, no preservatives.
        </Typography>
        <Button component={Link} to="/meals/order" size="large" variant="contained" sx={{ mt: 3, px: 5 }}>Start your plan</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 5 }}>
        {STEPS.map(([t, d], i) => (
          <Grid item xs={12} sm={6} md={3} key={t}>
            <Card sx={{ height: "100%" }}><CardContent>
              <Typography variant="overline" color="primary.dark" fontWeight={700}>Step {i + 1}</Typography>
              <Typography fontWeight={700}>{t}</Typography>
              <Typography variant="body2" color="text.secondary">{d}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>Plans</Typography>
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {plans.map((p) => (
          <Grid item xs={12} sm={4} key={p.plan_id}>
            <Card sx={{ height: "100%", textAlign: "center" }}><CardContent>
              <Typography fontWeight={700}>{p.plan_name}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>{cad(p.price)}</Typography>
              <Typography color="text.secondary">{p.meals_per_week} meals a week · {cad(p.price / p.meals_per_week)} per meal</Typography>
              {p.description && <Typography variant="body2" sx={{ mt: 1 }}>{p.description}</Typography>}
              <Button component={Link} to={`/meals/order?plan=${p.plan_id}`} variant="outlined" sx={{ mt: 2 }}>Choose</Button>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      {shop.taxable === "Y" && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -4, mb: 5 }}>Prices before GST and QST.</Typography>}

      <Box id="menu" sx={{ mb: 5, scrollMarginTop: 80 }}>
        <Typography variant="h5" fontWeight={800}>This week's menu</Typography>
        {week ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Delivery {niceDate(week.delivery_date)} · order by {niceDateTime(week.cutoff_at)}
            </Typography>
            <MealPicker menu={menu} />
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>Next week's menu is being prepared. Check back soon.</Alert>
        )}
      </Box>

      <Card sx={{ mb: 3 }}><CardContent>
        <Typography variant="h6" fontWeight={800}>Where we deliver</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {zones.length ? zones.map((z) => `${z.zone_name}${z.delivery_fee ? ` (${cad(z.delivery_fee)})` : ""}`).join(" · ") : "Delivery areas are being set up."}
        </Typography>
        <PostalCheck />
      </CardContent></Card>
    </ShopLayout>
  );
};

export default ShopHome;

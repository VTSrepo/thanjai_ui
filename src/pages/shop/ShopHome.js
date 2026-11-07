import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Grid, Stack, Tab, Tabs,
  TextField, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Link } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import { DishImage, Premium, PriceTag } from "../../components/shop/MealPicker";
import Loader from "../../components/Loader";
import { DIET, PLAN_TYPE, allowedIn, cad, niceDate, niceDateTime, shopInfo, WEEKDAY, zoneCheck } from "../../utilities/shopApi";

const SERIF = "'Playfair Display', Georgia, serif";
const BRAND = "#e07800";

const PostalCheck = () => {
  const [postal, setPostal] = useState("");
  const [res, setRes] = useState(null);
  const check = async () => {
    try { setRes(await zoneCheck(postal)); } catch (e) { setRes({ delivers: false, message: e.message }); }
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField size="small" label="Your postal code" value={postal} onChange={(e) => { setPostal(e.target.value); setRes(null); }} sx={{ bgcolor: "#fff" }}
          onKeyDown={(e) => e.key === "Enter" && check()} inputProps={{ maxLength: 7, style: { textTransform: "uppercase", fontSize: 16 } }} />
        <Button variant="contained" onClick={check} disabled={postal.trim().length < 6}>Check delivery</Button>
      </Stack>
      {res && (
        <Alert severity={res.delivers ? "success" : "warning"} sx={{ py: 0 }}>
          {res.delivers ? `Yes - we deliver to ${res.zone_name}${res.delivery_fee ? ` (delivery ${cad(res.delivery_fee)} a week)` : " with free delivery"}.` : res.message}
        </Alert>
      )}
    </Stack>
  );
};

const Section = ({ id, eyebrow, title, sub, children, sx }) => (
  <Box id={id} sx={{ py: { xs: 5, sm: 7 }, scrollMarginTop: 72, ...sx }}>
    {eyebrow && <Typography sx={{ color: BRAND, fontWeight: 800, letterSpacing: ".18em", fontSize: 12, textTransform: "uppercase", textAlign: "center" }}>{eyebrow}</Typography>}
    {title && <Typography component="h2" sx={{ fontFamily: SERIF, fontSize: { xs: 30, sm: 40 }, fontWeight: 700, textAlign: "center", mt: 1, lineHeight: 1.15 }}>{title}</Typography>}
    {sub && <Typography color="text.secondary" sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mt: 1.5 }}>{sub}</Typography>}
    <Box sx={{ mt: title ? { xs: 3, sm: 4 } : 0 }}>{children}</Box>
  </Box>
);

const ShopHome = () => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("V");
  useEffect(() => {
    shopInfo().then((r) => { setInfo(r); document.title = r.shop.name; }).catch((e) => setError(e.message));
    if (!document.getElementById("shop-fonts")) {
      const l = document.createElement("link");
      l.id = "shop-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  // one card per plan type: cheapest per-meal price, the sizes on offer, best discount
  const types = useMemo(() => {
    if (!info) return [];
    return ["V", "N", "C"].map((t) => {
      const ps = info.plans.filter((p) => p.plan_type === t);
      if (!ps.length) return null;
      const priced = ps.filter((p) => p.from_per_meal !== null);
      return {
        type: t, plans: ps, sizes: [...new Set(ps.map((p) => p.meals_per_week))].sort((a, b) => a - b),
        from: priced.length ? Math.min(...priced.map((p) => p.from_per_meal)) : null,
        fixed: t !== "C",
        discount: t === "C" ? Math.max(0, ...ps.map((p) => p.discount_pct || 0)) : 0,
        costly: ps.find((p) => p.max_costly !== null),
      };
    }).filter(Boolean);
  }, [info]);

  if (error) return <ShopLayout><Alert severity="error">{error}</Alert></ShopLayout>;
  if (!info) return <Loader />;
  const { shop, zones, week, menu, showcase } = info;
  const dishes = menu.length ? menu : showcase || [];
  const minFrom = types.filter((t) => t.from !== null).reduce((m, t) => Math.min(m, t.from), Infinity);
  const bestOff = Math.max(0, ...types.map((t) => t.discount));
  const day = WEEKDAY[shop.delivery_weekday];
  const tabPlan = types.find((t) => t.type === tab)?.plans[0];
  const tabDishes = dishes.filter((m) => allowedIn({ plan_type: tab }, m));
  const photos = dishes.filter((m) => m.image_url).slice(0, 4);

  return (
    <ShopLayout shop={shop}>
      {/* ---------- hero ---------- */}
      <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center" sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: 4, sm: 6 } }}>
        <Grid item xs={12} md={6}>
          {bestOff > 0 && <Chip label={`${bestOff}% off regular prices on weekly plans`} sx={{ bgcolor: "#fff1df", color: "#8a4a00", fontWeight: 700, mb: 2 }} />}
          <Typography component="h1" sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: { xs: 38, sm: 54 }, lineHeight: 1.08 }}>
            Real South Indian meals. <Box component="span" sx={{ color: BRAND }}>Cooked fresh every week.</Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: 17, sm: 19 }, color: "text.secondary", mt: 2, maxWidth: 520 }}>
            Choose Veg, Non-Veg or Combo (mix of both) meals from {shop.name}'s kitchen and get them delivered every {day}. Skip, pause or cancel any time.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 3 }}>
            <Button component={Link} to="/meals/order" size="large" variant="contained" sx={{ px: 4, py: 1.5, fontSize: 17, borderRadius: 99 }}>Build your plan</Button>
            {Number.isFinite(minFrom) && <Typography sx={{ fontWeight: 700 }}>from <Box component="span" sx={{ fontSize: 22, color: BRAND }}>{cad(minFrom)}</Box> a meal</Typography>}
          </Stack>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{ mt: 3, color: "text.secondary", fontSize: 14 }}>
            {["Halal", "No preservatives", "New menu every week", "Skip or pause any time"].map((t) => (
              <Stack key={t} direction="row" spacing={0.5} alignItems="center"><CheckCircleIcon sx={{ fontSize: 18, color: "#2e7d32" }} /><span>{t}</span></Stack>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {(photos.length >= 2 ? photos : types.map((t) => ({ type: t.type }))).slice(0, 4).map((x, i) => (
              x.image_url ? (
                <Box key={i} component="img" src={x.image_url} alt={x.name} sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 4, mt: i % 2 ? 4 : 0 }} />
              ) : (
                <Box key={i} sx={{ aspectRatio: "1", borderRadius: 4, mt: i % 2 ? 4 : 0, bgcolor: PLAN_TYPE[x.type].tint, display: "flex", flexDirection: "column", justifyContent: "flex-end", p: 2.5 }}>
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: { xs: 22, sm: 28 }, color: PLAN_TYPE[x.type].color }}>{PLAN_TYPE[x.type].label}</Typography>
                  <Typography variant="body2" color="text.secondary">{PLAN_TYPE[x.type].blurb}</Typography>
                </Box>
              )
            ))}
            {photos.length < 2 && types.length < 4 && (
              <Box sx={{ aspectRatio: "1", borderRadius: 4, mt: types.length % 2 ? 4 : 0, bgcolor: "#2b2b2b", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "flex-end", p: 2.5 }}>
                <LocalShippingIcon sx={{ fontSize: 36, color: "#fcb12a", mb: 1 }} />
                <Typography sx={{ fontWeight: 800, fontSize: 20 }}>Delivered every {day}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{zones.map((z) => z.zone_name).slice(0, 3).join(" · ")}</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ---------- feature strip ---------- */}
      <Box sx={{ mx: { xs: -2, sm: -3 }, px: 2, py: 2, bgcolor: "#2b2b2b", color: "#fff", borderRadius: { sm: 3 } }}>
        <Grid container spacing={2} justifyContent="center">
          {[[RestaurantMenuIcon, "New menu every week"], [SoupKitchenIcon, "Cooked in our kitchen"], [LocalShippingIcon, `Delivered every ${day}`], [EventRepeatIcon, "Skip, pause, cancel any time"]].map(([I, t]) => (
            <Grid item xs={6} md={3} key={t}><Stack direction="row" spacing={1} alignItems="center" justifyContent="center"><I sx={{ color: "#fcb12a" }} /><Typography variant="body2" fontWeight={700}>{t}</Typography></Stack></Grid>
          ))}
        </Grid>
      </Box>

      {/* ---------- plans ---------- */}
      <Section id="plans" eyebrow="Plans" title="Pick your kind of meal" sub="Veg and Non-Veg: one weekly price - pick any dishes you like. Combo: mix veg and non-veg and pay for what you pick, with the plan discount taken off.">
        <Grid container spacing={2.5}>
          {types.map((t) => {
            const T = PLAN_TYPE[t.type];
            return (
              <Grid item xs={12} md={4} key={t.type}>
                <Card sx={{ height: "100%", borderRadius: 4, borderTop: `6px solid ${T.color}`, position: "relative" }}>
                  <CardActionArea component={Link} to={`/meals/order?type=${t.type}`} sx={{ height: "100%" }}>
                    <CardContent sx={{ p: 3 }}>
                      {t.discount > 0 && <Chip size="small" label={`Save ${t.discount}%`} sx={{ position: "absolute", top: 16, right: 16, bgcolor: T.tint, color: T.color, fontWeight: 800 }} />}
                      <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, color: T.color }}>{T.label}</Typography>
                      <Typography color="text.secondary" sx={{ minHeight: 48 }}>{T.blurb}</Typography>
                      <Typography sx={{ mt: 2 }}>
                        {t.from !== null ? <>{t.fixed ? "From" : "Starting from"} <Box component="span" sx={{ fontWeight: 800, fontSize: 26 }}>{cad(t.from)}</Box> a meal</> : "Prices coming soon"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        {t.fixed ? t.plans.map((p) => <Chip key={p.plan_id} label={`${p.meals_per_week} meals · ${cad(p.price)}`} variant="outlined" />)
                          : t.sizes.map((n) => <Chip key={n} label={`${n} meals`} variant="outlined" />)}
                      </Stack>
                      {t.costly && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Premium dishes limited per week (e.g. {t.costly.max_costly} in {t.costly.plan_name}).</Typography>}
                      <Box sx={{ mt: 2.5, py: 1.25, textAlign: "center", borderRadius: 99, bgcolor: T.color, color: "#fff", fontWeight: 800 }}>Choose {T.label}</Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        {shop.taxable === "Y" && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, textAlign: "center" }}>Prices before delivery, GST and QST.</Typography>}
      </Section>

      {/* ---------- menu preview ---------- */}
      <Section id="menu" eyebrow={week ? `Delivery ${niceDate(week.delivery_date)}` : "Our dishes"} title={week ? "This week's menu" : "A taste of the menu"}
        sub={week ? `Order by ${niceDateTime(week.cutoff_at)}. Not sure what to pick? We fill your plan with the chef's picks.` : "The weekly menu is published a few days before each delivery."}
        sx={{ bgcolor: "#fff", mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, borderRadius: { sm: 4 } }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} centered sx={{ mb: 3 }}>
          {types.map((t) => <Tab key={t.type} value={t.type} label={PLAN_TYPE[t.type].long} />)}
        </Tabs>
        {!tabDishes.length ? (
          <Typography color="text.secondary" textAlign="center">Dishes for this plan are coming soon.</Typography>
        ) : (
          <Box sx={{ display: "grid", gridAutoFlow: { xs: "column", md: "row" }, gridAutoColumns: { xs: "78%", sm: "40%" }, gridTemplateColumns: { md: "repeat(4, 1fr)" }, gap: 2, overflowX: { xs: "auto", md: "visible" }, pb: 1, scrollSnapType: "x mandatory" }}>
            {tabDishes.slice(0, 12).map((m) => (
              <Card key={m.product_id} sx={{ borderRadius: 3, scrollSnapAlign: "start", display: "flex", flexDirection: "column" }}>
                <DishImage m={m} height={160} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
                    {DIET[m.diet] && <Chip size="small" variant="outlined" color={DIET[m.diet].color} label={DIET[m.diet].label} />}
                    {m.costly === "Y" && <Premium />}
                  </Stack>
                  <Typography fontWeight={700} sx={{ textTransform: "capitalize", lineHeight: 1.25 }}>{String(m.name).toLowerCase()}</Typography>
                  {m.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.description}</Typography>}
                </CardContent>
                <Box sx={{ px: 2, pb: 2 }}><PriceTag plan={tabPlan} m={m} /></Box>
              </Card>
            ))}
          </Box>
        )}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button component={Link} to={`/meals/order?type=${tab}`} variant="contained" size="large" sx={{ borderRadius: 99, px: 4 }}>Build your {PLAN_TYPE[tab]?.label} plan</Button>
        </Box>
      </Section>

      {/* ---------- how it works ---------- */}
      <Section eyebrow="How it works" title="Dinner sorted in four steps">
        <Grid container spacing={2}>
          {[["Choose a plan", "Veg, Non-Veg or Combo - 5, 10 or 15 meals a week."],
            ["Pick your dishes", "A new menu every week. Your total adds up as you choose."],
            ["We cook it fresh", "Prepared in our kitchen for your delivery day."],
            ["Delivered to you", `To your door every ${day}. Change, skip or pause before the weekly cutoff.`]].map(([t, d], i) => (
            <Grid item xs={12} sm={6} md={3} key={t}>
              <Box sx={{ p: 3, height: "100%", borderRadius: 4, bgcolor: "#fff", border: "1px solid #f0e4d4" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: BRAND, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>{i + 1}</Box>
                <Typography fontWeight={800}>{t}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{d}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ---------- delivery ---------- */}
      <Box sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: "#fff1df" }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: { xs: 26, sm: 32 } }}>Do we deliver to you?</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {zones.length ? `We deliver every ${day} to ${zones.map((z) => `${z.zone_name}${z.delivery_fee ? ` (${cad(z.delivery_fee)})` : " (free)"}`).join(", ")}.` : "Delivery areas are being set up."}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}><PostalCheck /></Grid>
        </Grid>
      </Box>

      {/* ---------- FAQ ---------- */}
      <Section eyebrow="Questions" title="Good to know">
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
          {[["Is it a subscription?", `Yes - your plan renews every week so you never miss a delivery. You can change your dishes, skip a week, pause or cancel from your account before each week's order cutoff.`],
            ["How is the price worked out?", `Veg and Non-Veg plans have one weekly price - choose any dishes of that kind (a few premium dishes may be limited). Combo plans add up the dishes you choose at their regular price${bestOff ? `, less up to ${bestOff}%` : ""}. Delivery and tax are added at checkout, and you see the total before you pay.`],
            ["What are Premium dishes?", "Some dishes cost us more to make (for example paneer, mutton or fish). Your plan lets you pick a few of them each week - the menu shows how many."],
            ["When do I need to order?", week ? `For ${niceDate(week.delivery_date)}, order by ${niceDateTime(week.cutoff_at)}. Each week's menu has its own cutoff.` : "Each week's menu has an order cutoff a few days before delivery."],
            ["What if I don't choose my dishes?", "We fill your plan with the chef's picks for that week (Veg customers get veg dishes)."],
            ["Can I change my plan?", "Yes - switch between Veg, Non-Veg and Combo or change the number of meals from your account. It applies from the next week you have not ordered yet."]].map(([q, a]) => (
            <Accordion key={q} disableGutters elevation={0} sx={{ borderBottom: "1px solid #eadfce", bgcolor: "transparent", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>{q}</Typography></AccordionSummary>
              <AccordionDetails><Typography color="text.secondary">{a}</Typography></AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Section>

      {/* ---------- closing ---------- */}
      <Box sx={{ textAlign: "center", p: { xs: 4, sm: 6 }, mb: { xs: 8, md: 2 }, borderRadius: 4, bgcolor: "#2b2b2b", color: "#fff" }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: { xs: 28, sm: 38 } }}>Your week of meals, sorted.</Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>{Number.isFinite(minFrom) ? `From ${cad(minFrom)} a meal. ` : ""}Skip or cancel any time.</Typography>
        <Button component={Link} to="/meals/order" size="large" variant="contained" sx={{ mt: 3, borderRadius: 99, px: 5 }}>Build your plan</Button>
      </Box>

      {/* phones: sticky order bar */}
      <Box sx={{ display: { xs: "flex", md: "none" }, position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, alignItems: "center", gap: 1.5, px: 2, pt: 1.25, pb: "calc(10px + env(safe-area-inset-bottom))", bgcolor: "#fff", borderTop: "1px solid #eadfce", boxShadow: "0 -6px 20px rgba(0,0,0,.08)" }}>
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: 14 }}>{Number.isFinite(minFrom) ? <>From <b style={{ color: BRAND }}>{cad(minFrom)}</b> a meal</> : shop.name}</Typography>
        <Button component={Link} to="/meals/order" variant="contained" sx={{ borderRadius: 99, px: 3 }}>Build your plan</Button>
      </Box>
    </ShopLayout>
  );
};

export default ShopHome;

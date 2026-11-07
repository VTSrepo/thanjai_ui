import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Divider, Grid, Stack, Step, StepLabel, Stepper,
  Tab, Tabs, TextField, Typography,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import MealPicker from "../../components/shop/MealPicker";
import AddressFields, { emptyAddress } from "../../components/shop/AddressFields";
import Loader from "../../components/Loader";
import {
  PLAN_TYPE, cad, niceDate, niceDateTime, priceFor, quote, saveProfile, shopInfo, shopLogin, shopMe, shopSession, shopSignup, startPlan, unitPrice, isFixed,
} from "../../utilities/shopApi";

const STEPS = ["Plan", "Meals", "Your details", "Review & pay"];

export const TestModeNote = ({ mode }) =>
  mode === "mock" ? <Alert severity="info" sx={{ mb: 2 }}>Test mode: no card is charged. Payments are confirmed automatically.</Alert> : null;

const Totals = ({ p }) => (
  <Box sx={{ "& > div": { display: "flex", justifyContent: "space-between", py: 0.25 } }}>
    <div><span>Meals</span><span>{cad(p.subtotal)}</span></div>
    <div><span>Delivery</span><span>{p.fee ? cad(p.fee) : "Free"}</span></div>
    {p.gst > 0 && <div><span>GST</span><span>{cad(p.gst)}</span></div>}
    {p.qst > 0 && <div><span>QST</span><span>{cad(p.qst)}</span></div>}
    <Divider sx={{ my: 0.5 }} />
    <div><Typography fontWeight={800}>Total this week</Typography><Typography fontWeight={800}>{cad(p.total)}</Typography></div>
  </Box>
);

const ShopOrder = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [me, setMe] = useState(null);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(null);
  const [type, setType] = useState(null);
  const [counts, setCounts] = useState({});
  const [diet, setDiet] = useState("");
  const [authTab, setAuthTab] = useState("new");
  const [acct, setAcct] = useState({ email: "", password: "", ...emptyAddress });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadMe = async () => {
    if (!shopSession.token()) return null;
    try { const m = await shopMe(); setMe(m); return m; } catch (e) { setMe(null); return null; }
  };
  useEffect(() => {
    (async () => {
      try {
        const r = await shopInfo();
        setInfo(r);
        document.title = `Start your plan | ${r.shop.name}`;
        const want = r.plans.find((p) => p.plan_id === params.get("plan"));
        if (want) { setPlan(want); setType(want.plan_type); setStep(1); }
        else if (["V", "N", "C"].includes(params.get("type"))) setType(params.get("type"));
        const m = await loadMe();
        if (m?.subscription && ["A", "P"].includes(m.subscription.status)) navigate("/meals/account", { replace: true });
      } catch (e) { setError(e.message); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const tax = info ? { taxable: info.shop.taxable, gst_rate: info.shop.gst_rate, qst_rate: info.shop.qst_rate } : null;
  const q = quote(plan, info?.menu || [], counts);
  const price = priceFor(q.subtotal, me?.zone?.delivery_fee, tax);
  const costlyOver = plan && plan.max_costly !== null && plan.max_costly !== undefined && q.costly > plan.max_costly;
  if (!info) return error ? <ShopLayout><Alert severity="error">{error}</Alert></ShopLayout> : <Loader />;
  const { shop, plans, week, menu } = info;
  if (!week) return (
    <ShopLayout shop={shop}><Alert severity="info">Ordering is closed right now – next week's menu is being prepared. Please check back soon.</Alert></ShopLayout>
  );

  const go = (n) => { setError(""); setStep(n); window.scrollTo(0, 0); };
  const run = async (fn) => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };

  const afterAuth = async () => {
    const m = await loadMe();
    if (m?.subscription && ["A", "P"].includes(m.subscription.status)) { navigate("/meals/account"); return; }
    go(3);
  };
  const doSignup = () => run(async () => { await shopSignup(acct); await afterAuth(); });
  const doLogin = () => run(async () => { await shopLogin(login); await afterAuth(); });
  const pay = () => run(async () => {
    const items = Object.entries(counts).filter(([, n]) => n > 0).map(([product_id, qty]) => ({ product_id, qty }));
    const r = await startPlan(plan.plan_id, items);
    window.location.assign(r.checkout_url);
  });

  return (
    <ShopLayout shop={shop} maxWidth="md">
      <Typography variant="h5" fontWeight={800}>Start your plan</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>First delivery {niceDate(week.delivery_date)} · order by {niceDateTime(week.cutoff_at)}</Typography>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>{STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}</Stepper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 0 && (
        <>
          <Typography fontWeight={700} sx={{ mb: 1.5 }}>1. What would you like?</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {["V", "N", "C"].filter((t) => plans.some((p) => p.plan_type === t)).map((t) => {
              const T = PLAN_TYPE[t];
              const from = Math.min(...plans.filter((p) => p.plan_type === t && p.from_per_meal !== null).map((p) => p.from_per_meal));
              const sel = type === t;
              return (
                <Grid item xs={12} sm={4} key={t}>
                  <Card sx={{ height: "100%", borderRadius: 3, border: 2, borderColor: sel ? T.color : "divider", bgcolor: sel ? T.tint : "#fff" }}>
                    <CardActionArea sx={{ height: "100%" }} onClick={() => { setType(t); setPlan(null); setCounts({}); }}>
                      <CardContent>
                        <Typography fontWeight={800} fontSize={22} sx={{ color: T.color }}>{T.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{T.blurb}</Typography>
                        {Number.isFinite(from) && <Typography sx={{ mt: 1 }}>from <b>{cad(from)}</b> a meal</Typography>}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {type && (
            <>
              <Typography fontWeight={700} sx={{ mb: 1.5 }}>2. How many meals a week?</Typography>
              <Grid container spacing={2}>
                {plans.filter((p) => p.plan_type === type).map((p) => (
                  <Grid item xs={12} sm={4} key={p.plan_id}>
                    <Card sx={{ borderRadius: 3, borderColor: plan?.plan_id === p.plan_id ? "primary.main" : undefined, borderWidth: plan?.plan_id === p.plan_id ? 2 : 1 }}>
                      <CardActionArea onClick={() => { setPlan(p); setCounts({}); go(1); }} disabled={!p.dishes}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography fontWeight={700}>{p.plan_name}</Typography>
                          <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>{p.meals_per_week} <Typography component="span" color="text.secondary">meals</Typography></Typography>
                          <Typography color="text.secondary">{!p.dishes ? "No dishes this week" : p.fixed ? <><b>{cad(p.price)}</b> a week · any {p.meals_per_week} dishes</> : <>from <b>{cad(p.from_price)}</b> a week</>}</Typography>
                          {!p.fixed && p.discount_pct > 0 && <Chip size="small" label={`${p.discount_pct}% off regular prices`} sx={{ mt: 1, bgcolor: "#fff1df" }} />}
                          {p.max_costly !== null && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Up to {p.max_costly} premium dish{p.max_costly === 1 ? "" : "es"}</Typography>}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}

      {step === 1 && plan && (
        <>
          <Card sx={{ position: "sticky", top: 64, zIndex: 2, mb: 2 }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography>
                    <b>{plan.plan_name}</b> – chosen <b style={{ color: total === plan.meals_per_week ? "#2e7d32" : undefined }}>{total} of {plan.meals_per_week}</b> meals · <b>{cad(q.subtotal)}</b>
                  </Typography>
                  {plan.max_costly !== null && <Typography variant="caption" sx={{ color: costlyOver ? "error.main" : "text.secondary" }}>Premium dishes: {q.costly} of {plan.max_costly} allowed</Typography>}
                </Box>
                {plan.plan_type === "C" && (
                  <Stack direction="row" spacing={1}>
                    {[["", "All"], ["V", "Veg"], ["N", "Non-veg"]].map(([v, l]) => (
                      <Chip key={l} label={l} onClick={() => setDiet(v)} color={diet === v ? "primary" : "default"} variant={diet === v ? "filled" : "outlined"} />
                    ))}
                  </Stack>
                )}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button onClick={() => go(0)}>Back</Button>
                  <Button variant="contained" disabled={total !== plan.meals_per_week || costlyOver} onClick={() => go(me ? 3 : 2)} sx={{ flexGrow: { xs: 1, sm: 0 } }}>Continue</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <MealPicker menu={menu} counts={counts} onChange={setCounts} meals={plan.meals_per_week} diet={plan.plan_type === "C" ? diet : ""} plan={plan} />
        </>
      )}

      {step === 2 && (
        <Card><CardContent>
          <Tabs value={authTab} onChange={(e, v) => setAuthTab(v)} sx={{ mb: 2 }}>
            <Tab value="new" label="I'm new" />
            <Tab value="login" label="I have an account" />
          </Tabs>
          {authTab === "new" ? (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="E-mail" type="email" autoComplete="email" value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Password (8+ characters)" type="password" autoComplete="new-password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} /></Grid>
              </Grid>
              <AddressFields value={acct} onChange={(v) => setAcct({ ...acct, ...v })} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => go(1)}>Back</Button>
                <Button variant="contained" disabled={busy} onClick={doSignup}>Create account & continue</Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ maxWidth: 420 }}>
              <TextField label="E-mail" type="email" autoComplete="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
              <TextField label="Password" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && doLogin()} />
              <Stack direction="row" spacing={1}>
                <Button onClick={() => go(1)}>Back</Button>
                <Button variant="contained" disabled={busy} onClick={doLogin}>Log in & continue</Button>
              </Stack>
            </Stack>
          )}
        </CardContent></Card>
      )}

      {step === 3 && me && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 2 }}><CardContent>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Your meals for {niceDate(week.delivery_date)}</Typography>
              {menu.filter((m) => counts[m.product_id]).map((m) => (
                <Stack key={m.product_id} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.25 }}>
                  <Typography sx={{ textTransform: "capitalize" }}>{m.name.toLowerCase()} <Typography component="span" color="text.secondary">× {counts[m.product_id]}</Typography></Typography>
                  {!isFixed(plan) && <Typography>{cad(counts[m.product_id] * unitPrice(plan, m))}</Typography>}
                </Stack>
              ))}
              {isFixed(plan) && (
                <Stack direction="row" justifyContent="space-between" sx={{ pt: 1, mt: 0.5, borderTop: 1, borderColor: "divider" }}>
                  <Typography fontWeight={600}>{plan.plan_name} - weekly price</Typography><Typography fontWeight={600}>{cad(plan.price)}</Typography>
                </Stack>
              )}
              <Button size="small" sx={{ mt: 1 }} onClick={() => go(1)}>Change meals</Button>
            </CardContent></Card>
            <Card><CardContent>
              <Typography fontWeight={700}>Deliver to</Typography>
              {me.zone ? (
                <Typography color="text.secondary">
                  {me.customer.full_name}, {me.customer.address_line1}{me.customer.address_line2 ? `, ${me.customer.address_line2}` : ""}, {me.customer.city} {me.customer.postal_code} ({me.zone.zone_name})
                </Typography>
              ) : (
                <AddressStep me={me} onSaved={loadMe} />
              )}
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card><CardContent>
              <Typography fontWeight={700} sx={{ mb: 1 }}>{plan.plan_name} · {plan.meals_per_week} meals</Typography>
              <Totals p={price} />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ my: 1 }}>
                Your plan renews every week and your card is charged at each week's order cutoff. Skip, pause or cancel any time before the cutoff from your account.
              </Typography>
              <TestModeNote mode={info.shop.payment_mode} />
              <Button fullWidth size="large" variant="contained" disabled={busy || !me.zone} onClick={pay}>Pay {cad(price.total)} securely</Button>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}
      {step === 3 && !me && <Alert severity="warning">Please log in first. <Link to="/meals/login">Log in</Link></Alert>}
    </ShopLayout>
  );
};

const AddressStep = ({ me, onSaved }) => {
  const [v, setV] = useState({ ...emptyAddress, ...me.customer });
  const [err, setErr] = useState("");
  const save = async () => { setErr(""); try { await saveProfile(v); await onSaved(); } catch (e) { setErr(e.message); } };
  return (
    <Box sx={{ mt: 1 }}>
      {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}
      <AddressFields value={v} onChange={setV} />
      <Button variant="contained" sx={{ mt: 2 }} onClick={save}>Save address</Button>
    </Box>
  );
};

export default ShopOrder;

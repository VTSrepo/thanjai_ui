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
  cad, niceDate, niceDateTime, priceFor, saveProfile, shopInfo, shopLogin, shopMe, shopSession, shopSignup, startPlan,
} from "../../utilities/shopApi";

const STEPS = ["Plan", "Meals", "Your details", "Review & pay"];

export const TestModeNote = ({ mode }) =>
  mode === "mock" ? <Alert severity="info" sx={{ mb: 2 }}>Test mode: no card is charged. Payments are confirmed automatically.</Alert> : null;

const Totals = ({ p }) => (
  <Box sx={{ "& > div": { display: "flex", justifyContent: "space-between", py: 0.25 } }}>
    <div><span>Plan</span><span>{cad(p.subtotal)}</span></div>
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
        if (want) { setPlan(want); setStep(1); }
        const m = await loadMe();
        if (m?.subscription && ["A", "P"].includes(m.subscription.status)) navigate("/meals/account", { replace: true });
      } catch (e) { setError(e.message); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const tax = info ? { taxable: info.shop.taxable, gst_rate: info.shop.gst_rate, qst_rate: info.shop.qst_rate } : null;
  const price = priceFor(plan, me?.zone?.delivery_fee, tax);
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
        <Grid container spacing={2}>
          {plans.map((p) => (
            <Grid item xs={12} sm={4} key={p.plan_id}>
              <Card sx={{ borderColor: plan?.plan_id === p.plan_id ? "primary.main" : undefined, borderWidth: plan?.plan_id === p.plan_id ? 2 : 1 }}>
                <CardActionArea onClick={() => { setPlan(p); setCounts({}); go(1); }}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography fontWeight={700}>{p.plan_name}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ my: 1 }}>{cad(p.price)}</Typography>
                    <Typography color="text.secondary">{p.meals_per_week} meals a week</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {step === 1 && plan && (
        <>
          <Card sx={{ position: "sticky", top: 64, zIndex: 2, mb: 2 }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <Typography sx={{ flexGrow: 1 }}>
                  <b>{plan.plan_name}</b> – chosen <b style={{ color: total === plan.meals_per_week ? "#2e7d32" : undefined }}>{total} of {plan.meals_per_week}</b> meals
                </Typography>
                <Stack direction="row" spacing={1}>
                  {[["", "All"], ["V", "Veg"], ["N", "Non-veg"]].map(([v, l]) => (
                    <Chip key={l} label={l} onClick={() => setDiet(v)} color={diet === v ? "primary" : "default"} variant={diet === v ? "filled" : "outlined"} />
                  ))}
                </Stack>
                <Button onClick={() => go(0)}>Back</Button>
                <Button variant="contained" disabled={total !== plan.meals_per_week} onClick={() => go(me ? 3 : 2)}>Continue</Button>
              </Stack>
            </CardContent>
          </Card>
          <MealPicker menu={menu} counts={counts} onChange={setCounts} meals={plan.meals_per_week} diet={diet} />
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
                <Stack key={m.product_id} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                  <Typography sx={{ textTransform: "capitalize" }}>{m.name.toLowerCase()}</Typography><Typography>× {counts[m.product_id]}</Typography>
                </Stack>
              ))}
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

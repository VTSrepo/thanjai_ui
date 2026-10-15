import React, { useState } from "react";
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import { shopLogin } from "../../utilities/shopApi";

const ShopLogin = () => {
  const navigate = useNavigate();
  const [v, setV] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError("");
    try { await shopLogin(v); navigate("/meals/account"); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <ShopLayout maxWidth="xs">
      <Card><CardContent>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>Log in</Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="E-mail" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          <TextField label="Password" type="password" autoComplete="current-password" value={v.password}
            onChange={(e) => setV({ ...v, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <Button variant="contained" size="large" disabled={busy || !v.email || !v.password} onClick={submit}>Log in</Button>
          <Typography variant="body2" color="text.secondary">New here? <Link to="/meals/order">Start a plan</Link></Typography>
        </Stack>
      </CardContent></Card>
    </ShopLayout>
  );
};

export default ShopLogin;

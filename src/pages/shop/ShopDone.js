import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Link, useSearchParams } from "react-router-dom";
import ShopLayout from "../../components/shop/ShopLayout";
import { confirmPayment } from "../../utilities/shopApi";

/** Return page after the payment page: confirms the payment with the server. */
const ShopDone = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    const ref = params.get("ref");
    let tries = 0;
    const check = async () => {
      try {
        const r = await confirmPayment(ref);
        if (r.paid) setState({ paid: true, order_id: r.order_id });
        else if (++tries < 5) setTimeout(check, 2000);
        else setState({ error: "We could not confirm the payment yet. If you completed it, it will show in your account in a few minutes." });
      } catch (e) { setState({ error: e.message }); }
    };
    if (ref) check(); else setState({ error: "Missing payment reference." });
  }, [params]);

  return (
    <ShopLayout maxWidth="sm">
      <Card><CardContent sx={{ textAlign: "center", py: 5 }}>
        {state.loading && <Stack alignItems="center" spacing={2}><CircularProgress /><Typography>Confirming your payment…</Typography></Stack>}
        {state.paid && (
          <Stack alignItems="center" spacing={1.5}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h5" fontWeight={800}>You're all set!</Typography>
            <Typography color="text.secondary">Order {state.order_id} is confirmed. You can change next week's meals, skip or pause from your account.</Typography>
            <Button component={Link} to="/meals/account" variant="contained" size="large">Go to my account</Button>
          </Stack>
        )}
        {state.error && (
          <Stack spacing={2}>
            <Alert severity="warning">{state.error}</Alert>
            <Button component={Link} to="/meals/account" variant="outlined">My account</Button>
          </Stack>
        )}
      </CardContent></Card>
    </ShopLayout>
  );
};

export default ShopDone;

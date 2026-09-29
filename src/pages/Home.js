import React, { useEffect, useState } from "react";
import { Box, Button, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import InvoiceAlerts from "../components/InvoiceAlerts";
import { useUser, ROLE } from "../utilities/UserContext";
import { fetchIndents } from "../utilities/service";

// Home for branch and external-customer users: what needs attention today.
const Home = () => {
  document.title = `Home | ${CONFIG.title.name}`;
  const { user } = useUser();
  const navigate = useNavigate();
  const [counts, setCounts] = useState(null);
  const isExternal = user?.user_type === ROLE.EXTERNAL;

  useEffect(() => {
    const scope = { branch_id: user?.branch_id };
    Promise.all([fetchIndents(["D"], scope), fetchIndents(["C", "A"], scope)])
      .then(([toReceive, open]) =>
        setCounts({
          toReceive: toReceive.length,
          open: open.length,
          priority: [...toReceive, ...open].filter((i) => i.priority_flag === "Y").length,
        })
      )
      .catch(() => setCounts({ toReceive: 0, open: 0, priority: 0 }));
  }, [user]);

  const tiles = [
    { label: "On the way - to receive", value: counts?.toReceive, go: "/indents" },
    { label: isExternal ? "Open orders" : "Open requests", value: counts?.open, go: "/indents" },
    { label: "Priority", value: counts?.priority, go: "/indents" },
  ];

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Welcome, {user?.user_name}
        </Typography>
        <InvoiceAlerts />
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
          {tiles.map((t) => (
            <Card key={t.label}>
              <CardActionArea onClick={() => navigate(t.go)}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">{t.label}</Typography>
                  <Typography variant="h5" fontWeight={700}>{counts ? t.value : "-"}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="contained" size="large" startIcon={<AddShoppingCartIcon />} onClick={() => navigate("/indents", { state: { tab: "create" } })}>
            {isExternal ? "Place an order" : "New indent"}
          </Button>
          <Button variant="outlined" size="large" startIcon={<ReceiptLongIcon />} onClick={() => navigate("/my-invoices")}>
            My invoices
          </Button>
        </Stack>
      </Box>
    </>
  );
};

export default Home;

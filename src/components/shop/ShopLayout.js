import React, { useEffect, useState } from "react";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { shopInfo, shopSession } from "../../utilities/shopApi";

let cachedShop = null; // shop name / contact, loaded once per visit for pages that don't pass it

/** Public shop frame: simple header (brand, Menu, Account / Log in) and footer. */
const ShopLayout = ({ shop: given, children, maxWidth = "lg" }) => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(cachedShop);
  useEffect(() => {
    if (given) { cachedShop = given; return; }
    if (!cachedShop) shopInfo().then((r) => { cachedShop = r.shop; setLoaded(r.shop); }).catch(() => {});
  }, [given]);
  const shop = given || loaded;
  const customer = shopSession.customer();
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fffaf3" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography component={Link} to="/meals" variant="h6" fontWeight={800} sx={{ flexGrow: 1, color: "primary.dark", textDecoration: "none" }}>
            {shop?.name || "Weekly Meals"}
          </Typography>
          <Button component={Link} to="/meals#menu" color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>This week's menu</Button>
          {customer ? (
            <>
              <Button component={Link} to="/meals/account" variant="outlined">My account</Button>
              <Button color="inherit" onClick={() => { shopSession.clear(); navigate("/meals"); }}>Log out</Button>
            </>
          ) : (
            <>
              <Button component={Link} to="/meals/login" color="inherit">Log in</Button>
              <Button component={Link} to="/meals/order" variant="contained">Start now</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth={maxWidth} sx={{ flexGrow: 1, py: { xs: 2, sm: 4 } }}>{children}</Container>
      <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 3, px: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">
          {shop?.name || "Weekly Meals"}
          {shop?.support_phone ? ` · ${shop.support_phone}` : ""}
          {shop?.support_email ? ` · ${shop.support_email}` : ""}
        </Typography>
      </Box>
    </Box>
  );
};

export default ShopLayout;

import React, { useEffect } from "react";
import { AppBar, Box, Button, Container, CssBaseline, Link as MLink, Stack, ThemeProvider, Toolbar, Typography, createTheme } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";

// Public reservation pages: dark Thanjai look (charcoal, orange #FF8A00, gold #FCB12A), white header with the logo.
export const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
export const GOLD = "#FCB12A";
export const ORANGE = "#FF8A00";
export const GRAD = "linear-gradient(135deg,#FCB12A 0%,#FF8A00 100%)";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: ORANGE, dark: "#e07800", contrastText: "#fff" },
    secondary: { main: GOLD },
    background: { default: "#141414", paper: "#1e1e1e" },
    text: { primary: "#ffffff", secondary: "#a9a9a9" },
    divider: "rgba(255,255,255,.08)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Montserrat', 'Helvetica', 'Arial', sans-serif",
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 42 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTextField: { defaultProps: { variant: "standard", fullWidth: true } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 12, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD } } },
  },
});

const LOGO = `${process.env.PUBLIC_URL || ""}/logo.png`;
const HOME = "https://thanjaigroup.com/index.html";

/** Small gold label with dots, e.g. "• RESERVATIONS •" */
export const Eyebrow = ({ children }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center"
    sx={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: ".4em", textTransform: "uppercase" }}>
    <Box sx={{ width: 30, height: "1px", bgcolor: GOLD, opacity: 0.6 }} />
    <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: GRAD }} />
    <span>{children}</span>
    <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: GRAD }} />
    <Box sx={{ width: 30, height: "1px", bgcolor: GOLD, opacity: 0.6 }} />
  </Stack>
);

export const Card = ({ children, sx }) => (
  <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: { xs: "20px", sm: "26px" }, p: { xs: 2.5, sm: 4 }, ...sx }}>{children}</Box>
);

const ReserveLayout = ({ restaurant, children }) => {
  useEffect(() => {
    if (document.getElementById("reserve-fonts")) return;
    const l = document.createElement("link");
    l.id = "reserve-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  const phone = restaurant?.phone;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#fff", color: "#333", boxShadow: "0 1px 0 rgba(0,0,0,.06)" }}>
          <Toolbar sx={{ gap: 1, minHeight: { xs: 64, sm: 72 } }}>
            <Box component="a" href={HOME} sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Box component="img" src={LOGO} alt={restaurant?.name || "Thanjai"} sx={{ height: { xs: 38, sm: 46 } }} />
            </Box>
            {phone && (
              <Button href={`tel:${phone.replace(/[^\d+]/g, "")}`} startIcon={<PhoneIcon />} sx={{ color: "#5c5c5c", display: { xs: "none", sm: "inline-flex" } }}>{phone}</Button>
            )}
            <Button href={HOME} sx={{ color: "#5c5c5c", fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" }}>Home</Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ flexGrow: 1, px: { xs: 2, sm: 3 } }}>{children}</Container>
        <Box component="footer" sx={{ bgcolor: "#fff", color: "#555", borderTop: `4px solid ${ORANGE}`, py: 4, px: 2, mt: 6 }}>
          <Container maxWidth="lg">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 4 }} alignItems={{ xs: "center", sm: "center" }} justifyContent="space-between">
              <Box component="img" src={LOGO} alt="" sx={{ height: 54 }} />
              <Stack spacing={0.75} sx={{ fontFamily: SERIF, fontStyle: "italic", textAlign: { xs: "center", sm: "left" } }}>
                {restaurant?.address && <Stack direction="row" spacing={1} alignItems="center"><PlaceIcon sx={{ color: ORANGE, fontSize: 18 }} /><span>{restaurant.address}</span></Stack>}
                {phone && <Stack direction="row" spacing={1} alignItems="center"><PhoneIcon sx={{ color: ORANGE, fontSize: 18 }} /><MLink href={`tel:${phone.replace(/[^\d+]/g, "")}`} color="inherit" underline="hover">{phone}</MLink></Stack>}
              </Stack>
              <Typography variant="caption" sx={{ color: "#999", letterSpacing: ".2em", textTransform: "uppercase" }}>© {new Date().getFullYear()} Thanjai Group</Typography>
            </Stack>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ReserveLayout;

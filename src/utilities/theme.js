import { createTheme } from "@mui/material/styles";

export const BRAND = {
  primary: "#ffa133",
  primaryDark: "#e8861a",
  ink: "#2b2b2b",
  surface: "#fff8f0",
};

// One app-wide theme (mobile-first: larger touch targets, readable type).
const theme = createTheme({
  palette: {
    primary: { main: BRAND.primary, dark: BRAND.primaryDark, contrastText: "#fff" },
    secondary: { main: "#5c6770", contrastText: "#fff" },
    background: { default: "#f6f6f4" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 42 } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTextField: { defaultProps: { size: "medium" } },
  },
});

export default theme;

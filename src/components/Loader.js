// Loader.js - full-screen by default; `inline` for use inside a section.
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const Loader = ({ inline = false, label = "Loading..." }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 1.5,
      height: inline ? "auto" : "70vh",
      py: inline ? 5 : 0,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export default Loader;

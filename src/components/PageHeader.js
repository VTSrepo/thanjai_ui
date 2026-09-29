import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Title row used by the redesigned screens: optional back arrow, title/subtitle, right-side action.
const PageHeader = ({ title, subtitle, onBack, action }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
    {onBack && (
      <IconButton onClick={onBack} aria-label="Back" edge="start">
        <ArrowBackIcon />
      </IconButton>
    )}
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="h6" fontWeight={700} noWrap>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);

export default PageHeader;

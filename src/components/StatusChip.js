import React from "react";
import { Chip } from "@mui/material";

export const INDENT_STATUS = {
  C: { label: "Requested", color: "#1e6fd9", bg: "#e7f0fc" },
  A: { label: "Accepted", color: "#8a5a00", bg: "#fff3d6" },
  D: { label: "Dispatched", color: "#6b3fd4", bg: "#efe9fc" },
  R: { label: "Received", color: "#1b7f4b", bg: "#e4f5ec" },
};

export const statusLabel = (s) => INDENT_STATUS[s]?.label || s || "-";

const StatusChip = ({ status, size = "small" }) => {
  const s = INDENT_STATUS[status] || { label: status || "-", color: "#555", bg: "#eee" };
  return (
    <Chip
      size={size}
      label={s.label}
      sx={{ color: s.color, bgcolor: s.bg, fontWeight: 600 }}
    />
  );
};

export default StatusChip;

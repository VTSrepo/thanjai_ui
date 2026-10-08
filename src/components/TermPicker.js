import React, { useEffect, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { CREDIT_TERMS, netDays } from "../utilities/helpers";

// Payment terms: preset list plus "Custom (Net N days)". value/onChange use API codes (POI, EOM, EONM, N<days>).
const TermPicker = ({ value, onChange, label = "Payment terms", helperText, fullWidth = true, sx }) => {
  const preset = CREDIT_TERMS.some((t) => t.code === value);
  const [custom, setCustom] = useState(!preset && !!netDays(value));
  const [days, setDays] = useState(!preset && netDays(value) ? String(netDays(value)) : "");

  useEffect(() => {
    const isPreset = CREDIT_TERMS.some((t) => t.code === value);
    if (!isPreset && netDays(value)) {
      setCustom(true);
      setDays(String(netDays(value)));
    } else if (isPreset) {
      setCustom(false);
    }
  }, [value]);

  const pick = (v) => {
    if (v === "CUSTOM") {
      setCustom(true);
      if (netDays(`N${days}`)) onChange(`N${days}`);
      return;
    }
    setCustom(false);
    onChange(v);
  };
  const typeDays = (v) => {
    const clean = v.replace(/\D/g, "").slice(0, 3);
    setDays(clean);
    onChange(netDays(`N${clean}`) ? `N${clean}` : "");
  };
  const badDays = custom && !netDays(`N${days}`);

  return (
    <Stack direction="row" spacing={1} sx={sx}>
      <TextField select label={label} value={custom ? "CUSTOM" : value || ""} onChange={(e) => pick(e.target.value)}
        fullWidth={fullWidth} helperText={!custom ? helperText : undefined}>
        {CREDIT_TERMS.map((t) => <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>)}
        <MenuItem value="CUSTOM">Custom (Net N days)</MenuItem>
      </TextField>
      {custom && (
        <TextField label="Days" value={days} onChange={(e) => typeDays(e.target.value)} sx={{ width: 110, flexShrink: 0 }}
          inputProps={{ inputMode: "numeric" }} error={badDays} helperText={badDays ? "1-365" : `Net ${days}`} />
      )}
    </Stack>
  );
};

export default TermPicker;

import React from "react";
import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";

export const emptyAddress = { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", postal_code: "", delivery_notes: "", diet_pref: "", allergies: "" };

/** Name, phone, delivery address and food preferences (sign-up and profile). */
const AddressFields = ({ value, onChange }) => {
  const f = (k) => ({ value: value[k] || "", onChange: (e) => onChange({ ...value, [k]: e.target.value }), fullWidth: true });
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}><TextField label="Full name" required autoComplete="name" {...f("full_name")} /></Grid>
      <Grid item xs={12} sm={6}><TextField label="Phone" required autoComplete="tel" inputProps={{ inputMode: "tel" }} {...f("phone")} /></Grid>
      <Grid item xs={12}><TextField label="Street address" required autoComplete="address-line1" {...f("address_line1")} /></Grid>
      <Grid item xs={12} sm={6}><TextField label="Apartment, unit (optional)" autoComplete="address-line2" {...f("address_line2")} /></Grid>
      <Grid item xs={7} sm={3}><TextField label="City" required autoComplete="address-level2" {...f("city")} /></Grid>
      <Grid item xs={5} sm={3}><TextField label="Postal code" required autoComplete="postal-code" inputProps={{ maxLength: 7, style: { textTransform: "uppercase" } }} {...f("postal_code")} /></Grid>
      <Grid item xs={12}><TextField label="Delivery notes (buzzer, where to leave it)" {...f("delivery_notes")} /></Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Food preference</InputLabel>
          <Select label="Food preference" value={value.diet_pref || ""} onChange={(e) => onChange({ ...value, diet_pref: e.target.value })}>
            <MenuItem value="">No preference</MenuItem>
            <MenuItem value="V">Vegetarian</MenuItem>
            <MenuItem value="N">Non-vegetarian</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}><TextField label="Allergies (optional)" {...f("allergies")} /></Grid>
    </Grid>
  );
};

export default AddressFields;

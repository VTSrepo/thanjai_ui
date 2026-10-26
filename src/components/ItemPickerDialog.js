import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
} from "@mui/material";

// Add / edit one indent line. Full-screen on phones. Product list is searchable.
const ItemPickerDialog = ({ open, products, initial, existingCodes = [], onClose, onSave }) => {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [fullQty, setFullQty] = useState(false);
  // A-Z; typing matches any part of the name or the product code
  const options = useMemo(() => [...(products || [])].sort((a, b) =>
    String(a.product_name || "").localeCompare(String(b.product_name || ""), undefined, { sensitivity: "base" })), [products]);
  const filterOptions = (opts, { inputValue }) => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return opts;
    return opts.filter((p) => String(p.product_name || "").toLowerCase().includes(q) || String(p.short_code || "").toLowerCase() === q);
  };

  useEffect(() => {
    if (!open) return;
    setProduct(initial ? products.find((p) => p.product_id === initial.item_code) || null : null);
    setQty(initial?.qty_ordered ?? "");
    setFullQty(initial?.mandatory_status === "Y");
  }, [open, initial, products]);

  const duplicate = product && !initial && existingCodes.includes(product.product_id);
  const qtyNum = Number(qty);
  const valid = product && qty !== "" && qtyNum > 0 && !duplicate;

  const save = () =>
    onSave({
      item_code: product.product_id,
      item_name: product.product_name,
      uom: product.uom,
      item_cost: product.product_price ?? null,
      qty_ordered: qtyNum,
      mandatory_status: fullQty ? "Y" : "N",
    });

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit item" : "Add item"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={options}
            filterOptions={filterOptions}
            autoHighlight
            openOnFocus
            noOptionsText={products?.length ? "No item matches" : "This kitchen has no items set up"}
            value={product}
            onChange={(e, v) => setProduct(v)}
            disabled={!!initial}
            getOptionLabel={(p) => p?.product_name || ""}
            isOptionEqualToValue={(a, b) => a.product_id === b.product_id}
            renderOption={(props, p) => (
              <li {...props} key={p.product_id}>
                {p.product_name}
                {p.short_code ? <span style={{ color: "#888", marginLeft: 8, fontFamily: "monospace" }}>{p.short_code}</span> : null}
                {p.uom ? <span style={{ color: "#888", marginLeft: 8 }}>{p.uom}</span> : null}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Item"
                placeholder="Type part of the name or the code"
                error={!!duplicate}
                helperText={duplicate ? "Already in this indent - edit that line instead" : " "}
              />
            )}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Quantity"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputProps={{ min: 0, inputMode: "decimal" }}
              error={qty !== "" && qtyNum <= 0}
              sx={{ flex: 1 }}
            />
            <TextField label="Unit" value={product?.uom || ""} disabled sx={{ flex: 1 }} />
          </Stack>
          <FormControlLabel
            control={<Switch checked={fullQty} onChange={(e) => setFullQty(e.target.checked)} />}
            label="Full quantity required (kitchen cannot reduce)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={save}>
          {initial ? "Update" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemPickerDialog;

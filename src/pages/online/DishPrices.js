import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  InputAdornment, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { getSubDishes, importSubDishPrices } from "../../utilities/service";
import { DIET, cad } from "../../utilities/shopApi";
import { DishDialog } from "./OnlineMenu";

const NONVEG = /chicken|mutton|fish|egg|prawn|shrimp|lamb|goat|beef|keema/i;
const KIND = { C: "Curry", M: "Combo meal" };

/**
 * Reads a price list workbook: one sheet per group ("Veg", "Non Veg", "Combo"). Each sheet: dish name in the first
 * column, regular price in the column titled "Regular price" (or the first number). A heading like "After 25% off"
 * is read as that group's plan discount.
 */
export const parsePriceWorkbook = (sheets) => {
  const rows = [];
  const discounts = {};
  sheets.forEach(({ sheet, data }) => {
    const nm = sheet.toLowerCase();
    const kind = /combo/.test(nm) ? "M" : "C";
    const group = kind === "M" ? "C" : /non/.test(nm) ? "N" : /veg/.test(nm) ? "V" : null;
    let nameCol = 0;
    let priceCol = -1;
    let start = 0;
    data.forEach((r, i) => {
      const cells = r.map((c) => String(c ?? "").trim());
      const hp = cells.findIndex((c) => /regular|price|rate/i.test(c) && !/after|off/i.test(c));
      if (hp >= 0 && priceCol < 0) {
        priceCol = hp;
        nameCol = Math.max(cells.findIndex((c) => /curry|dish|item|name|combo/i.test(c)), 0);
        start = i + 1;
        const off = cells.map((c) => c.match(/(\d+(?:\.\d+)?)\s*%\s*off/i)).find(Boolean);
        if (off && group) discounts[group] = Number(off[1]);
      }
    });
    data.slice(start).forEach((r) => {
      const name = String(r[nameCol] ?? "").trim();
      if (!name || /^as on\b/i.test(name) || /^(curry|dish|item|name)$/i.test(name)) return;
      let price = priceCol >= 0 ? r[priceCol] : r.slice(1).find((c) => typeof c === "number");
      price = price === undefined || price === null || price === "" || isNaN(Number(price)) ? null : Number(price);
      const nonveg = group === "N" || (group !== "V" && NONVEG.test(name));
      rows.push({ name, price, kind, diet: nonveg ? (/\begg\b/i.test(name) && !/chicken|mutton|fish/i.test(name) ? "E" : "N") : "V", sheet });
    });
  });
  return { rows, discounts };
};

const ImportDialog = ({ open, onClose, onDone }) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [preview, setPreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [useDisc, setUseDisc] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setFile(null); setParsed(null); setPreview(null); } }, [open]);
  useEffect(() => { if (open) getSubDishes().then((r) => setProducts(r.dishes)).catch(() => {}); }, [open]);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const p = parsePriceWorkbook(await readXlsxFile(f));
      if (!p.rows.length) throw new Error("No dishes found. Each sheet needs dish names in the first column.");
      setFile(f.name); setParsed(p);
      setUseDisc(Object.fromEntries(Object.keys(p.discounts).map((k) => [k, true])));
      const r = await importSubDishPrices({ rows: p.rows, preview: true });
      setPreview(r.rows);
    } catch (x) { toast.error(x.message || "Could not read the file"); } finally { setBusy(false); }
  };
  const choose = (i, product) => setPreview((rows) => rows.map((r, j) => (j === i ? { ...r, product_id: product?.product_id || null, product_name: product?.product_name || null, how: product ? "chosen" : null } : r)));
  const apply = async () => {
    setBusy(true);
    try {
      const discounts = Object.fromEntries(Object.entries(parsed.discounts).filter(([k]) => useDisc[k]));
      const r = await importSubDishPrices({ rows: preview.map((x) => ({ name: x.name, price: x.price, kind: x.kind, diet: x.diet, product_id: x.product_id })), preview: false, discounts });
      toast.success(r.message); onDone();
    } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  const matched = (preview || []).filter((r) => r.product_id).length;
  const GROUP = { V: "Veg plans", N: "Non-Veg plans", C: "Combo plans" };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Import dish prices from Excel</DialogTitle>
      <DialogContent>
        {!preview ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">Use a workbook with one sheet per group - <b>Veg</b>, <b>Non Veg</b>, <b>Combo</b> - dish names in the first column and the price in a column titled <b>Regular price</b> (like the "Weekly Meal Curry prices" sheet). A heading like <b>After 25% off</b> sets that plan discount.</Typography>
            <Button variant="contained" component="label" startIcon={<UploadFileIcon />} disabled={busy} sx={{ alignSelf: "flex-start" }}>
              {busy ? "Reading..." : "Choose Excel file"}<input hidden type="file" accept=".xlsx" onChange={pick} />
            </Button>
          </Stack>
        ) : (
          <>
            <Alert severity={matched === preview.length ? "success" : "warning"} sx={{ mb: 2 }}>
              {file}: {preview.length} dishes - <b>{matched} matched</b> to products{matched < preview.length ? `, ${preview.length - matched} not matched: pick the product, or leave empty to skip` : ""}.
            </Alert>
            {Object.keys(parsed.discounts).length > 0 && (
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
                {Object.entries(parsed.discounts).map(([k, pct]) => (
                  <FormControlLabel key={k} control={<Checkbox checked={!!useDisc[k]} onChange={(e) => setUseDisc({ ...useDisc, [k]: e.target.checked })} />} label={`Set ${pct}% discount on all ${GROUP[k]}`} />
                ))}
              </Stack>
            )}
            <Box sx={{ maxHeight: "55vh", overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead><TableRow>{["Sheet", "Dish in the file", "Kind", "Diet", "Regular price", "Product", "Now"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i} sx={{ bgcolor: r.product_id ? undefined : "#fff8e1" }}>
                      <TableCell>{parsed.rows[i]?.sheet}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell>{KIND[r.kind]}</TableCell>
                      <TableCell>{DIET[r.diet]?.label || "-"}</TableCell>
                      <TableCell>{r.price === null ? <Typography variant="caption" color="text.secondary">no price</Typography> : cad(r.price)}</TableCell>
                      <TableCell sx={{ minWidth: 260 }}>
                        <Autocomplete size="small" options={products} value={products.find((p) => p.product_id === r.product_id) || null}
                          getOptionLabel={(p) => p.product_name} isOptionEqualToValue={(a, b) => a.product_id === b.product_id}
                          onChange={(e, p) => choose(i, p)}
                          renderInput={(p) => <TextField {...p} placeholder={r.suggestions?.length ? `e.g. ${r.suggestions[0].name}` : "Not matched - choose"} helperText={r.how && r.how !== "same name" ? `matched by ${r.how}` : ""} />} />
                      </TableCell>
                      <TableCell>{r.old_price !== null && r.old_price !== undefined ? cad(r.old_price) : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {preview && <Button variant="contained" disabled={busy || !matched} onClick={apply}>Update {matched} dish{matched === 1 ? "" : "es"}</Button>}
      </DialogActions>
    </Dialog>
  );
};

/** Regular prices, kind (curry / combo meal) and "costly" flag of every online dish. */
const DishPrices = ({ canEdit }) => {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const [imp, setImp] = useState(false);
  const [tab, setTab] = useState("C");
  const [q, setQ] = useState("");
  const load = useCallback(() => getSubDishes().then((r) => setRows(r.dishes)).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);
  const list = useMemo(() => (rows || []).filter((d) => (d.sub_enabled === "Y" || d.price !== null) && (tab === "ALL" || d.kind === tab)
    && (!q || d.product_name.toLowerCase().includes(q.toLowerCase()))), [rows, tab, q]);
  if (!rows) return <Loader inline />;
  const online = rows.filter((d) => d.sub_enabled === "Y" || d.price !== null);
  const missing = online.filter((d) => d.sub_enabled === "Y" && d.price === null).length;
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>Regular price of one meal. Each plan takes its discount off this price; <b>Costly</b> dishes are limited per plan (customers see them as "Premium").</Typography>
        {canEdit && <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => setImp(true)}>Import from Excel</Button>}
      </Stack>
      {missing > 0 && <Alert severity="warning" sx={{ mb: 2 }}>{missing} online dish{missing > 1 ? "es have" : " has"} no price yet - they cannot be published on a weekly menu.</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ flexGrow: 1 }}>
          <Tab value="C" label={`Curries (${online.filter((d) => d.kind === "C").length})`} />
          <Tab value="M" label={`Combo meals (${online.filter((d) => d.kind === "M").length})`} />
          <Tab value="ALL" label="All" />
        </Tabs>
        <TextField size="small" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">🔍</InputAdornment> }} />
      </Stack>
      <Card sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead><TableRow>{["Dish", "Kind", "Diet", "Regular price", "Costly", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {!list.length && <TableRow><TableCell colSpan={6} sx={{ color: "text.secondary" }}>No dishes here yet. Import the price list, or tick "Available on the online weekly menu" in Product Master.</TableCell></TableRow>}
          {list.map((d) => (
            <TableRow key={d.product_id} hover>
              <TableCell sx={{ textTransform: "capitalize", fontWeight: 600 }}>{d.product_name.toLowerCase()}</TableCell>
              <TableCell>{KIND[d.kind]}</TableCell>
              <TableCell>{DIET[d.diet] ? <Chip size="small" variant="outlined" color={DIET[d.diet].color} label={DIET[d.diet].label} /> : <Typography variant="caption" color="warning.dark">not set</Typography>}</TableCell>
              <TableCell>{d.price === null ? <Typography variant="caption" color="warning.dark">no price</Typography> : cad(d.price)}</TableCell>
              <TableCell>{d.costly === "Y" ? <Chip size="small" color="secondary" label="Costly" /> : ""}</TableCell>
              <TableCell>{canEdit && <Button size="small" onClick={() => setEdit(d)}>Edit</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>
      <DishDialog dish={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
      <ImportDialog open={imp} onClose={() => setImp(false)} onDone={() => { setImp(false); load(); }} />
    </>
  );
};

export default DishPrices;

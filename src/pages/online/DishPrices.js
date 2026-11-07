import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  InputAdornment, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { getSubDishes, importSubDishPrices, saveSubDishPricing, saveSubPlanDefaults } from "../../utilities/service";
import { DIET, cad } from "../../utilities/shopApi";
import { DishDialog } from "./OnlineMenu";

const NONVEG = /chicken|mutton|fish|egg|prawn|shrimp|lamb|goat|beef|keema/i;

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
                <TableHead><TableRow>{["Sheet", "Dish in the file", "Diet", "Regular price", "Product", "Now"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i} sx={{ bgcolor: r.product_id ? undefined : "#fff8e1" }}>
                      <TableCell>{parsed.rows[i]?.sheet}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
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

const DIET_OPTS = [["", "-"], ["V", "Veg"], ["N", "Non-veg"], ["E", "Egg"]];
const defaultFor = (defaults, diet) => (diet === "V" ? defaults.V : ["N", "E"].includes(diet) ? defaults.N : undefined);
const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

/** One product row; price and discount save when the field is left, switches save at once. */
const DishRow = ({ d, defaults, canEdit, onSave, onEdit }) => {
  const [price, setPrice] = useState(d.price ?? "");
  const [disc, setDisc] = useState(d.dish_discount ?? "");
  useEffect(() => { setPrice(d.price ?? ""); setDisc(d.dish_discount ?? ""); }, [d.price, d.dish_discount]);
  const def = defaultFor(defaults, d.diet);
  const pct = num(disc) !== null ? num(disc) : def;
  const after = num(price) !== null && pct !== undefined ? num(price) * (1 - pct / 100) : null;
  const blurSave = (field, value, old) => { if (String(value ?? "") !== String(old ?? "")) onSave(d, { [field]: value === "" ? null : value }); };
  return (
    <TableRow hover sx={{ opacity: d.sub_enabled === "Y" ? 1 : 0.75 }}>
      <TableCell sx={{ minWidth: 200 }}>
        <Typography fontWeight={600} sx={{ textTransform: "capitalize" }}>{d.product_name.toLowerCase()}</Typography>
        <Typography variant="caption" color="text.secondary">{d.product_id}{d.short_code ? ` · ${d.short_code}` : ""}</Typography>
      </TableCell>
      <TableCell>
        <Switch size="small" checked={d.sub_enabled === "Y"} disabled={!canEdit} onChange={(e) => onSave(d, { sub_enabled: e.target.checked ? "Y" : "N" })} inputProps={{ "aria-label": `Online ${d.product_name}` }} />
      </TableCell>
      <TableCell sx={{ minWidth: 110 }}>
        <TextField select size="small" variant="standard" value={d.diet || ""} disabled={!canEdit} onChange={(e) => onSave(d, { diet: e.target.value || null })} SelectProps={{ native: true }}
          error={d.sub_enabled === "Y" && !d.diet}>
          {DIET_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </TextField>
      </TableCell>
      <TableCell sx={{ width: 120 }}>
        <TextField size="small" variant="standard" type="number" value={price} disabled={!canEdit} placeholder="no price" onChange={(e) => setPrice(e.target.value)}
          onBlur={() => blurSave("price", price, d.price)} inputProps={{ step: 0.01, min: 0, "aria-label": `Price ${d.product_name}` }}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} error={d.sub_enabled === "Y" && num(price) === null} />
      </TableCell>
      <TableCell sx={{ width: 120 }}>
        <TextField size="small" variant="standard" type="number" value={disc} disabled={!canEdit || !["V", "N", "E"].includes(d.diet)}
          placeholder={def !== undefined ? String(def) : "-"} onChange={(e) => setDisc(e.target.value)}
          onBlur={() => blurSave("dish_discount", disc, d.dish_discount)} inputProps={{ step: 1, min: 0, max: 90, "aria-label": `Discount ${d.product_name}` }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
      </TableCell>
      <TableCell>{after === null ? "" : <><b>{cad(after)}</b>{num(disc) !== null && <Typography component="span" variant="caption" color="primary.dark"> own %</Typography>}</>}</TableCell>
      <TableCell>
        <Checkbox size="small" checked={d.costly === "Y"} disabled={!canEdit} onChange={(e) => onSave(d, { costly: e.target.checked ? "Y" : "N" })} inputProps={{ "aria-label": `Costly ${d.product_name}` }} />
      </TableCell>
      <TableCell>{canEdit && <Button size="small" onClick={() => onEdit(d)}>Details</Button>}</TableCell>
    </TableRow>
  );
};

/** Default discounts for Veg / Non-Veg plans (Combo plans charge regular prices). */
const Defaults = ({ defaults, canEdit, onSaved }) => {
  const toast = useToast();
  const [v, setV] = useState({ V: "", N: "" });
  useEffect(() => setV({ V: defaults.V ?? "", N: defaults.N ?? "" }), [defaults]);
  const save = async () => {
    try { const r = await saveSubPlanDefaults({ V: v.V, N: v.N }); toast.success(r.message); onSaved(); } catch (e) { toast.error(e.message); }
  };
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography fontWeight={700} sx={{ mb: 1 }}>Default discount</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <TextField size="small" label="Veg plans" type="number" value={v.V} disabled={!canEdit} onChange={(e) => setV({ ...v, V: e.target.value })} sx={{ width: 150 }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
        <TextField size="small" label="Non-Veg plans" type="number" value={v.N} disabled={!canEdit} onChange={(e) => setV({ ...v, N: e.target.value })} sx={{ width: 150 }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
        {canEdit && <Button variant="contained" onClick={save}>Save defaults</Button>}
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          Taken off every dish's regular price in all Veg / Non-Veg plans. Enter a dish's own % in the list to override it. Combo plans (customer mixes veg and non-veg) charge the regular price.
        </Typography>
      </Stack>
    </Card>
  );
};

/** Every product from Product Master with its online price, own discount, diet and "costly" flag. */
const DishPrices = ({ canEdit }) => {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [defaults, setDefaults] = useState({});
  const [edit, setEdit] = useState(null);
  const [imp, setImp] = useState(false);
  const [tab, setTab] = useState("ON");
  const [diet, setDiet] = useState("");
  const [q, setQ] = useState("");
  const load = useCallback(() => getSubDishes().then((r) => { setRows(r.dishes); setDefaults(r.defaults || {}); }).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);
  const save = async (d, change) => {
    const before = rows;
    setRows((rs) => rs.map((x) => (x.product_id === d.product_id ? { ...x, ...change } : x)));
    try { await saveSubDishPricing({ product_id: d.product_id, ...change }); } catch (e) { toast.error(e.message); setRows(before); }
  };
  const list = useMemo(() => (rows || []).filter((d) => (tab === "ALL" || (tab === "ON" ? d.sub_enabled === "Y" : d.sub_enabled === "Y" && (d.price === null || !d.diet)))
    && (!diet || d.diet === diet || (diet === "N" && d.diet === "E"))
    && (!q || `${d.product_name} ${d.product_id} ${d.short_code || ""}`.toLowerCase().includes(q.toLowerCase()))), [rows, tab, diet, q]);
  if (!rows) return <Loader inline />;
  const online = rows.filter((d) => d.sub_enabled === "Y");
  const missing = online.filter((d) => d.price === null || !d.diet).length;
  return (
    <>
      <Defaults defaults={defaults} canEdit={canEdit} onSaved={load} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          All products from Product Master. Switch <b>Online</b> on for dishes sold on the weekly menu, enter the regular price of one meal, and tick <b>Costly</b> for dishes limited per plan (customers see "Premium"). Changes save as you go.
        </Typography>
        {canEdit && <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImp(true)}>Import prices from Excel</Button>}
      </Stack>
      {missing > 0 && <Alert severity="warning" sx={{ mb: 1.5 }}>{missing} online dish{missing > 1 ? "es need" : " needs"} a price or diet - they cannot be published on a weekly menu. See the "Needs price / diet" tab.</Alert>}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 1 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ flexGrow: 1 }}>
          <Tab value="ON" label={`On the online menu (${online.length})`} />
          <Tab value="MISSING" label={`Needs price / diet (${missing})`} />
          <Tab value="ALL" label={`All products (${rows.length})`} />
        </Tabs>
        <TextField select size="small" label="Diet" value={diet} onChange={(e) => setDiet(e.target.value)} SelectProps={{ native: true }} sx={{ width: 130 }}>
          <option value="">All</option><option value="V">Veg</option><option value="N">Non-veg / egg</option>
        </TextField>
        <TextField size="small" placeholder="Search name or code" value={q} onChange={(e) => setQ(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">🔍</InputAdornment> }} />
      </Stack>
      <Card sx={{ overflowX: "auto" }}><Table size="small">
        <TableHead><TableRow>{["Product", "Online", "Diet", "Regular price", "Own discount (blank = default)", "Veg / Non-Veg plan price", "Costly", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {!list.length && <TableRow><TableCell colSpan={8} sx={{ color: "text.secondary" }}>{tab === "ON" ? 'No dishes on the online menu yet - open "All products" and switch Online on, or import the price list.' : "Nothing here."}</TableCell></TableRow>}
          {list.map((d) => <DishRow key={d.product_id} d={d} defaults={defaults} canEdit={canEdit} onSave={save} onEdit={setEdit} />)}
        </TableBody>
      </Table></Card>
      <DishDialog dish={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
      <ImportDialog open={imp} onClose={() => setImp(false)} onDone={() => { setImp(false); load(); }} />
    </>
  );
};

export default DishPrices;

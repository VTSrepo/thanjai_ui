import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/ToastProvider";
import { getAllBranches, getBu, getCategoryList, getProductSettings, importProducts } from "../utilities/service";
import { FormattedDate } from "../utilities/helpers";

// Column names accepted (case-insensitive). The business list uses "Item Name / Unit Size / COST / CODE".
const ALIASES = {
  name: ["item name", "product name", "product", "item"],
  code: ["code", "short code", "product code"],
  uom: ["unit size", "uom", "unit"],
  price: ["cost", "price", "selling price", "rate"],
  kitchen: ["kitchen", "producing kitchen", "producing branch"],
  shelf_life_days: ["shelf life", "shelf life (days)", "shelf life days"],
  taxable: ["taxable", "tax"],
  diet: ["diet", "veg / non-veg", "veg/non-veg", "veg or non-veg"],
  online: ["online menu", "online", "online weekly menu", "subscriber menu"],
  description: ["description", "menu description"],
  allergens: ["allergens", "allergen"],
};
const TEMPLATE_COLS = ["Item Name", "Unit Size", "COST", "CODE", "Kitchen", "Shelf life (days)", "Taxable", "Diet", "Online menu", "Description", "Allergens"];
const norm = (v) => String(v ?? "").trim().toLowerCase();

// Finds the header row (the business file has a title row above it) and maps the columns
const parseSheet = (sheet) => {
  const h = sheet.findIndex((r) => r.some((c) => ALIASES.name.includes(norm(c))) && r.some((c) => ALIASES.code.includes(norm(c))));
  if (h < 0) throw new Error("Could not find the header row. The file needs at least an Item Name and a CODE column.");
  const header = sheet[h].map(norm);
  const col = Object.fromEntries(Object.entries(ALIASES).map(([k, names]) => [k, header.findIndex((c) => names.includes(c))]));
  const val = (r, k) => (col[k] >= 0 ? r[col[k]] : null);
  return sheet.slice(h + 1)
    .map((r, i) => ({
      excel_row: h + i + 2,
      name: val(r, "name") ? String(val(r, "name")).trim() : "",
      code: val(r, "code") ? String(val(r, "code")).trim().toUpperCase() : "",
      uom: val(r, "uom") ? String(val(r, "uom")).trim() : null,
      price: val(r, "price") ?? null,
      kitchen: val(r, "kitchen") ? String(val(r, "kitchen")).trim() : null,
      shelf_life_days: val(r, "shelf_life_days") ?? null,
      taxable: val(r, "taxable") ? String(val(r, "taxable")).trim() : null,
      diet: val(r, "diet") ? String(val(r, "diet")).trim() : null,
      online: val(r, "online") ? String(val(r, "online")).trim() : null,
      description: val(r, "description") ? String(val(r, "description")).trim() : null,
      allergens: val(r, "allergens") ? String(val(r, "allergens")).trim() : null,
    }))
    .filter((r) => r.name || r.code);
};

const ACTION = {
  new: { label: "New", color: "success" },
  update: { label: "Update", color: "warning" },
  same: { label: "No change", color: "default" },
};

/** Product Master clean-up: upload the business product list, preview what changes, then apply. */
const ProductImport = () => {
  document.title = `Product list import | ${CONFIG.title.name}`;
  const toast = useToast();
  const [kitchens, setKitchens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bus, setBus] = useState([]);
  const [defaults, setDefaults] = useState({ producing_branch_id: "", category_code: "", bu_id: "" });
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null); // preview or applied response
  const [applied, setApplied] = useState(false);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("changes");

  useEffect(() => {
    getAllBranches().then((b) => {
      const k = b.filter((x) => x.branch_type === "K");
      setKitchens(k);
      if (k.length === 1) setDefaults((d) => ({ ...d, producing_branch_id: k[0].branch_id }));
    }).catch(() => {});
    getCategoryList().then((r) => setCategories(r?.categories || [])).catch(() => {});
    getBu().then((r) => setBus(r?.businesses || [])).catch(() => {});
  }, []);

  const kitchenName = (id) => {
    const k = kitchens.find((x) => x.branch_id === id);
    return k ? `${k.branch_name}${k.short_code ? ` (${k.short_code})` : ""}` : id || "-";
  };

  const run = async (preview, list = rows, d = defaults) => {
    setBusy(true); setError(""); setErrors([]);
    try {
      const r = await importProducts({ rows: list, defaults: d, preview });
      setResult(r);
      setApplied(!preview);
      if (!preview) { toast.success(r.message); setRows(null); }
    } catch (e) {
      setError(e.message);
      setErrors(e.data?.errors || []);
      if (e.data?.plan) setResult(e.data);
    } finally {
      setBusy(false);
    }
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setErrors([]); setResult(null); setApplied(false);
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const parsed = parseSheet(await readSheet(file));
      if (!parsed.length) throw new Error("No product rows were found in the file.");
      setRows(parsed);
      setFileName(file.name);
      run(true, parsed);
    } catch (err) {
      setRows(null);
      setError(err.message || "Could not read the file");
    }
  };

  // Kitchen chosen on the screen for one row (the business list has no kitchen column)
  const setRowKitchen = (excel_row, kitchen) => {
    const next = rows.map((r) => (r.excel_row === excel_row ? { ...r, kitchen: kitchen || null } : r));
    setRows(next);
    run(true, next);
  };
  const setDefault = (k, v) => {
    const d = { ...defaults, [k]: v };
    setDefaults(d);
    if (rows && k === "producing_branch_id") run(true, rows, d);
  };

  const template = async () => {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const r = await getProductSettings().catch(() => ({ products: [] }));
    const head = TEMPLATE_COLS.map((c) => ({ value: c, fontWeight: "bold", backgroundColor: "#FFE0B2" }));
    const kCode = (id) => kitchens.find((k) => k.branch_id === id)?.short_code || id || "";
    const data = [head, ...(r.products || []).map((p) => [
      { value: p.product_name || "", type: String }, { value: p.uom || "", type: String },
      p.product_price !== null && p.product_price !== undefined ? { value: Number(p.product_price), type: Number } : null,
      { value: p.short_code || "", type: String }, { value: kCode(p.producing_branch_id), type: String },
      p.shelf_life_days ? { value: Number(p.shelf_life_days), type: Number } : null,
      { value: p.default_taxable === "N" ? "N" : "Y", type: String },
      { value: { V: "Veg", N: "Non-veg", E: "Egg" }[p.sub_diet] || "", type: String },
      { value: p.sub_enabled === "Y" ? "Y" : "N", type: String },
      { value: p.sub_description || "", type: String },
      { value: p.sub_allergens || "", type: String },
    ])];
    await writeXlsxFile(data, { sheet: "Products", columns: [{ width: 32 }, { width: 12 }, { width: 10 }, { width: 8 }, { width: 10 }, { width: 16 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 40 }, { width: 20 }] })
      .toFile(`product-list-${FormattedDate(new Date())}.xlsx`);
  };

  const plan = useMemo(() => result?.plan || [], [result]);
  const visible = tab === "changes" ? plan.filter((p) => p.action !== "same") : tab === "all" ? plan : [];
  const needKitchen = !applied && plan.some((p) => p.action === "new" && !p.producing_branch_id);
  const rowFor = (excel_row) => rows?.find((r) => r.excel_row === excel_row);
  const s = result?.summary;

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
        <PageHeader title="Product list import" subtitle="Update Product Master from the business product list (codes become batch prefixes)" />
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Accepted columns: <b>Item Name</b>, <b>CODE</b> (2-3 characters), Unit Size, COST (selling price), and optionally Kitchen, Shelf life (days), Taxable,
              Diet (Veg / Non-veg / Egg), Online menu (Y / N), Description, Allergens. A blank cell leaves that value unchanged.
              Products are matched by code, then by name. Nothing is deleted. A price change starts a new price from today, so older indents keep their price.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                Choose product list
                <input hidden type="file" accept=".xlsx" onChange={pick} />
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={template}>Download current products</Button>
              {fileName && <Typography variant="caption" sx={{ alignSelf: "center" }}>{fileName}</Typography>}
            </Stack>
          </CardContent>
        </Card>

        {rows && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Defaults for new products</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: 260 }} error={needKitchen}>
                  <InputLabel>Producing kitchen</InputLabel>
                  <Select label="Producing kitchen" value={defaults.producing_branch_id} onChange={(e) => setDefault("producing_branch_id", e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {kitchens.map((k) => <MenuItem key={k.branch_id} value={k.branch_id}>{kitchenName(k.branch_id)}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" value={defaults.category_code} onChange={(e) => setDefault("category_code", e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {categories.map((c) => <MenuItem key={c.category_code} value={c.category_code}>{c.category_name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Business unit</InputLabel>
                  <Select label="Business unit" value={defaults.bu_id} onChange={(e) => setDefault("bu_id", e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {bus.map((b) => <MenuItem key={b.bu_id} value={b.bu_id}>{b.bu_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Change the kitchen for a single product in the list below (for example snacks made at Thanjai Snacks).
              </Typography>
            </CardContent>
          </Card>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!!errors.length && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.map((e, i) => <div key={i}>Row {e.row}: {e.message}</div>)}
          </Alert>
        )}
        {applied && result && <Alert severity="success" sx={{ mb: 2 }}>{result.message}. Check Product Master and fill category / business unit where missing.</Alert>}

        {s && (
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: "wrap", rowGap: 1 }}>
                  <Chip color="success" label={`${s.new} new`} />
                  <Chip color="warning" label={`${s.update} to update`} />
                  <Chip label={`${s.same} unchanged`} />
                  <Chip variant="outlined" label={`${s.not_in_file} not in file`} />
                </Stack>
                {!applied && rows && (
                  <Button variant="contained" disabled={busy || !!errors.length || needKitchen || (!s.new && !s.update)} onClick={() => run(false)}>
                    {busy ? "Working..." : `Apply ${s.new + s.update} change(s)`}
                  </Button>
                )}
              </Stack>
              {needKitchen && <Alert severity="info" sx={{ mb: 1 }}>Choose a producing kitchen for the new products (default above or per row).</Alert>}
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 1 }} variant="scrollable">
                <Tab value="changes" label="Changes" />
                <Tab value="all" label="All rows" />
                <Tab value="missing" label="Not in file" />
              </Tabs>
              {tab === "missing" ? (
                result.not_in_file?.length ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      These products are in Product Master but not in the file. They are left as they are (old indents and invoices use them).
                    </Typography>
                    <Table size="small">
                      <TableHead><TableRow>{["Product ID", "Name", "Code"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                      <TableBody>
                        {result.not_in_file.map((p) => (
                          <TableRow key={p.product_id}><TableCell>{p.product_id}</TableCell><TableCell>{p.product_name}</TableCell><TableCell>{p.short_code || "-"}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : <Typography color="text.secondary" sx={{ py: 2 }}>Every product in Product Master is in the file.</Typography>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>{["Row", "", "Code", "Product", "Unit", "Price", "Kitchen", "What changes"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>)}</TableRow>
                    </TableHead>
                    <TableBody>
                      {visible.map((p) => (
                        <TableRow key={p.row}>
                          <TableCell>{p.row}</TableCell>
                          <TableCell><Chip size="small" color={ACTION[p.action].color} label={ACTION[p.action].label} /></TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>{p.code}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.uom || "-"}</TableCell>
                          <TableCell>{p.price ?? "-"}</TableCell>
                          <TableCell sx={{ minWidth: 190 }}>
                            {!applied && rows ? (
                              <Select size="small" fullWidth displayEmpty value={rowFor(p.row)?.kitchen || ""}
                                onChange={(e) => setRowKitchen(p.row, e.target.value)}
                                renderValue={(v) => (v ? kitchenName(v) : <span style={{ color: "#888" }}>{p.producing_branch_id ? `${kitchenName(p.producing_branch_id)}` : "default"}</span>)}>
                                <MenuItem value="">{p.action === "new" ? "Default kitchen" : "Keep current"}</MenuItem>
                                {kitchens.map((k) => <MenuItem key={k.branch_id} value={k.branch_id}>{kitchenName(k.branch_id)}</MenuItem>)}
                              </Select>
                            ) : kitchenName(p.producing_branch_id)}
                          </TableCell>
                          <TableCell>
                            {p.changes.length ? p.changes.join(" · ") : "-"}
                            {p.note && <Typography variant="caption" color="warning.dark" display="block">{p.note}</Typography>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!visible.length && (
                        <TableRow><TableCell colSpan={8} sx={{ color: "text.secondary", textAlign: "center", py: 3 }}>Nothing to change.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};

export default ProductImport;

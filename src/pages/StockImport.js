import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/ToastProvider";
import { getProductSettings, importOpeningStock } from "../utilities/service";
import { FormattedDate } from "../utilities/helpers";

const COLS = ["Product code", "Product name", "UOM", "Quantity", "Manufacturing date", "Best before", "Cost per unit", "Note"];

// Excel dates arrive as Date objects; text dates are accepted as YYYY-MM-DD or DD/MM/YYYY
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return FormattedDate(new Date(v.getTime() + v.getTimezoneOffset() * 60000));
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s; // the server reports it as invalid
};

/** One-time opening stock load: download the template, fill quantities, upload. */
const StockImport = () => {
  document.title = `Opening stock | ${CONFIG.title.name}`;
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    getProductSettings().then((r) => setProducts(r.products || [])).catch((e) => setError(e.message));
  }, []);
  const tracked = products.filter((p) => p.short_code);

  const template = async () => {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const head = COLS.map((c) => ({ value: c, fontWeight: "bold", backgroundColor: "#FFE0B2" }));
    const data = [head, ...tracked.map((p) => [
      { value: p.short_code, type: String }, { value: p.product_name, type: String }, { value: p.uom || "", type: String },
      null, null, null, null, null,
    ])];
    const help = [
      [{ value: "How to fill", fontWeight: "bold" }],
      [{ value: "One row per batch you have in stock today. Copy a product row if it has more than one batch." }],
      [{ value: "Quantity: units left in that batch. Rows without a quantity are skipped." }],
      [{ value: "Manufacturing date: when the batch was made (YYYY-MM-DD). Blank = today." }],
      [{ value: "Best before: optional; blank = manufacturing date + the product's shelf life." }],
      [{ value: "Do not change the Product code column. Only products with a short code are listed." }],
    ];
    await writeXlsxFile([
      { sheet: "Opening stock", data, columns: [{ width: 14 }, { width: 32 }, { width: 10 }, { width: 12 }, { width: 20 }, { width: 14 }, { width: 14 }, { width: 30 }] },
      { sheet: "Help", data: help, columns: [{ width: 100 }] },
    ]).toFile(`opening-stock-template-${FormattedDate(new Date())}.xlsx`);
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setErrors([]); setDone(null);
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const sheet = await readSheet(file);
      const [header, ...body] = sheet;
      const idx = (name) => (header || []).findIndex((h) => String(h || "").trim().toLowerCase() === name.toLowerCase());
      const ci = { code: idx("Product code"), qty: idx("Quantity"), mfg: idx("Manufacturing date"), best: idx("Best before"), cost: idx("Cost per unit"), note: idx("Note"), name: idx("Product name") };
      if (ci.code < 0 || ci.qty < 0) throw new Error("This does not look like the template (Product code and Quantity columns are needed)");
      const parsed = body
        .map((r, i) => ({
          excel_row: i + 2,
          product_code: r[ci.code] ? String(r[ci.code]).trim() : "",
          product_name: ci.name >= 0 ? r[ci.name] : "",
          qty: r[ci.qty] === null || r[ci.qty] === undefined || r[ci.qty] === "" ? null : Number(r[ci.qty]),
          mfg_date: ci.mfg >= 0 ? toDate(r[ci.mfg]) : null,
          best_before: ci.best >= 0 ? toDate(r[ci.best]) : null,
          unit_cost: ci.cost >= 0 && r[ci.cost] !== null && r[ci.cost] !== "" ? Number(r[ci.cost]) : null,
          note: ci.note >= 0 && r[ci.note] ? String(r[ci.note]) : null,
        }))
        .filter((r) => r.product_code && r.qty !== null);
      setRows(parsed);
      setFileName(file.name);
      if (!parsed.length) setError("No rows with a quantity were found in the file.");
    } catch (err) {
      setRows(null);
      setError(err.message || "Could not read the file");
    }
  };

  const load = async () => {
    setBusy(true); setError(""); setErrors([]);
    try {
      const r = await importOpeningStock(rows);
      toast.success(r.message);
      setDone(r.created || []);
      setRows(null);
    } catch (e) {
      setError(e.message);
      setErrors(e.data?.errors || []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1000, mx: "auto" }}>
        <PageHeader title="Opening stock import" subtitle="One-time load of the stock you have today, as opening batches" />
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography fontWeight={700}>1. Download the template</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              It lists every product that has a short code ({tracked.length}). Fill one row per batch you hold.
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!tracked.length} onClick={template}>Download Excel template</Button>
            {!tracked.length && <Alert severity="info" sx={{ mt: 1 }}>Give products a short code and producing branch in Product Master first.</Alert>}
          </CardContent>
        </Card>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography fontWeight={700}>2. Upload the filled file</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>All rows are checked first; nothing is loaded if any row has a problem.</Typography>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Choose file
              <input hidden type="file" accept=".xlsx" onChange={pick} />
            </Button>
            {fileName && <Typography variant="caption" sx={{ ml: 1 }}>{fileName}</Typography>}
          </CardContent>
        </Card>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!!errors.length && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.map((e) => <div key={e.row}>Row {e.row}: {e.message}</div>)}
          </Alert>
        )}
        {done && <Alert severity="success" sx={{ mb: 2 }}>Loaded {done.length} opening batch(es): {done.join(", ")}</Alert>}
        {rows && rows.length > 0 && (
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography fontWeight={700} sx={{ flexGrow: 1 }}>3. Check and load ({rows.length} row(s))</Typography>
                <Button variant="contained" disabled={busy} onClick={load}>{busy ? "Loading..." : "Load opening stock"}</Button>
              </Stack>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>{["Code", "Product", "Quantity", "Made", "Best before", "Cost", "Note"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.product_code}</TableCell>
                        <TableCell>{r.product_name}</TableCell>
                        <TableCell>{r.qty}</TableCell>
                        <TableCell>{r.mfg_date || "today"}</TableCell>
                        <TableCell>{r.best_before || "auto"}</TableCell>
                        <TableCell>{r.unit_cost ?? "-"}</TableCell>
                        <TableCell>{r.note || ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};

export default StockImport;

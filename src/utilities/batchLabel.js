import jsPDF from "jspdf";
import { savePdf } from "./invoicePdf";
import { formatDate } from "./helpers";

// Code 128 (set B) bar patterns, index = symbol value 0..106
const C128 = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];

const code128B = (text) => {
  const vals = [104, ...[...text].map((ch) => ch.charCodeAt(0) - 32)];
  const check = vals.reduce((s, v, i) => s + v * (i || 1), 0) % 103;
  return [...vals, check, 106].map((v) => C128[v]).join("");
};

// Draw a Code 128 barcode; widths alternate bar/space starting with a bar
const drawBarcode = (doc, text, x, y, width, height) => {
  const pattern = code128B(text);
  const modules = [...pattern].reduce((s, d) => s + Number(d), 0);
  const unit = width / modules;
  let cx = x;
  [...pattern].forEach((d, i) => {
    const w = Number(d) * unit;
    if (i % 2 === 0) doc.rect(cx, y, w, height, "F");
    cx += w;
  });
};

/** 4" x 2" labels (one per page) for batch containers. */
export const printBatchLabels = async (batch, copies = 1) => {
  const W = 288, H = 144;
  const doc = new jsPDF({ unit: "pt", format: [W, H], orientation: "landscape" });
  for (let i = 0; i < Math.max(1, Math.min(copies, 200)); i++) {
    if (i) doc.addPage([W, H], "landscape");
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(20);
    doc.text(String(batch.product_name || batch.product_id).slice(0, 34), 12, 22);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(90);
    doc.text(String(batch.branch_name || batch.branch_id || ""), 12, 34);
    doc.setTextColor(20).setFontSize(9);
    doc.text(`Made: ${formatDate(batch.mfg_date)}`, 12, 50);
    doc.setFont("helvetica", "bold");
    doc.text(`Best before: ${batch.best_before ? formatDate(batch.best_before) : "-"}`, 12, 63);
    doc.setFont("helvetica", "normal");
    doc.text(`Qty: ${batch.qty_produced} ${batch.uom || ""}`, W - 12, 50, { align: "right" });
    drawBarcode(doc, batch.batch_no, 12, 72, W - 24, 42);
    doc.setFont("courier", "bold").setFontSize(12);
    doc.text(batch.batch_no, W / 2, 130, { align: "center" });
  }
  await savePdf(doc, `${batch.batch_no}-label.pdf`);
};

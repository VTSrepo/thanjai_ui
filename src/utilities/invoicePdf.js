// Builds the indent invoice PDF (layout follows the Zoho invoice Thanjai uses today).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (n) =>
  Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qtyFmt = (n) => Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const pct = (n) => `${Number(n || 0).toString()}%`;
const ymd = (s) => (s ? String(s).replace(/-/g, "/") : "");

let logoCache;
const loadLogo = async () => {
  if (logoCache !== undefined) return logoCache;
  try {
    const res = await fetch(`${process.env.PUBLIC_URL}/logo.png`);
    const blob = await res.blob();
    logoCache = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch (e) {
    logoCache = null;
  }
  return logoCache;
};

const addressLines = (p) =>
  [
    p?.address,
    [p?.city, p?.province, p?.postal_code].filter(Boolean).join(", "),
    p?.country,
    p?.email,
    p?.phone,
  ].filter(Boolean);

export const buildInvoicePdf = async (inv) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const L = 48;
  const R = W - 48;
  const grey = [110, 110, 110];
  let y = 60;

  // Logo (left) + INVOICE title (right)
  const logo = await loadLogo();
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const h = 50;
      doc.addImage(logo, "PNG", L, 45, (props.width / props.height) * h, h);
    } catch (e) {}
  }
  doc.setFont("helvetica", "normal").setFontSize(28).setTextColor(20);
  doc.text("INVOICE", R, y + 10, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(10);
  doc.text(`# ${inv.invoice_number}`, R, y + 28, { align: "right" });
  doc.setFontSize(8).text("Balance Due", R, y + 52, { align: "right" });
  doc.setFontSize(13).text(`$${money(inv.balance_due)}`, R, y + 68, { align: "right" });

  // Seller block
  y = 125;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(20);
  doc.text(inv.seller?.name || "", L, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...grey);
  const sellerLines = addressLines(inv.seller);
  if (inv.seller?.gst_hst_reg_no) sellerLines.push(`${inv.gst_label || "GST"} # ${inv.seller.gst_hst_reg_no}`);
  if (inv.seller?.qst_reg_no) sellerLines.push(`QST # ${inv.seller.qst_reg_no}`);
  sellerLines.forEach((t, i) => doc.text(t, L, y + 14 + i * 12));

  // Dates (right) + Bill To (left)
  y = Math.max(y + 24 + sellerLines.length * 12, 205);
  const labelX = R - 120;
  const rows = [
    ["Invoice Date :", ymd(inv.invoice_date)],
    ["Terms :", inv.terms || ""],
    ["Due Date :", ymd(inv.due_date)],
  ];
  doc.setFontSize(10);
  rows.forEach(([k, v], i) => {
    doc.setTextColor(...grey).text(k, labelX, y + i * 20, { align: "right" });
    doc.setTextColor(40).text(v, R, y + i * 20, { align: "right" });
  });
  doc.setTextColor(...grey).setFontSize(10).text("Bill To", L, y + 16);
  doc.setFont("helvetica", "bold").setTextColor(20).text(inv.bill_to?.name || "", L, y + 30);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...grey);
  const billLines = addressLines(inv.bill_to).filter((t) => t !== inv.bill_to?.email && t !== inv.bill_to?.phone);
  billLines.forEach((t, i) => doc.text(t, L, y + 43 + i * 12));

  // Items
  const tableTop = Math.max(y + 70, y + 50 + billLines.length * 12);
  autoTable(doc, {
    startY: tableTop,
    margin: { left: L, right: W - R },
    head: [["#", "Item & Description", "Qty", "Rate", "Amount"]],
    body: inv.lines.map((l, i) => [
      i + 1,
      l.uom ? `${l.item_name}\n${l.uom}` : l.item_name,
      qtyFmt(l.qty),
      money(l.rate),
      money(l.amount),
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: { top: 9, bottom: 9, left: 6, right: 6 }, textColor: 60, lineColor: 225 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "normal" },
    bodyStyles: { lineWidth: { bottom: 0.6 } },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      2: { halign: "right", cellWidth: 70 },
      3: { halign: "right", cellWidth: 60 },
      4: { halign: "right", cellWidth: 80 },
    },
  });

  // Totals
  let ty = doc.lastAutoTable.finalY + 22;
  const tLabel = R - 110;
  const totals = [
    ["Sub Total", money(inv.sub_total)],
    [`${inv.gst_label || "GST"} (${pct(inv.gst_rate)})`, money(inv.gst_amount)],
  ];
  if (Number(inv.qst_rate) > 0) totals.push([`QST (${pct(inv.qst_rate)})`, money(inv.qst_amount)]);
  doc.setFontSize(9.5).setFont("helvetica", "normal").setTextColor(40);
  totals.forEach(([k, v]) => {
    doc.text(k, tLabel, ty, { align: "right" });
    doc.text(v, R - 6, ty, { align: "right" });
    ty += 20;
  });
  doc.setFont("helvetica", "bold");
  doc.text("Total", tLabel, ty, { align: "right" });
  doc.text(`$${money(inv.total_amount)}`, R - 6, ty, { align: "right" });
  ty += 14;
  doc.setFillColor(245, 245, 245).rect(R - 220, ty, 220, 26, "F");
  doc.text("Balance Due", tLabel, ty + 17, { align: "right" });
  doc.text(`$${money(inv.balance_due)}`, R - 6, ty + 17, { align: "right" });

  // Notes
  if (inv.notes) {
    ty += 60;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(40).text("Notes", L, ty);
    doc.setFontSize(8.5).setTextColor(...grey);
    doc.text(doc.splitTextToSize(inv.notes, R - L), L, ty + 15);
  }
  return doc;
};

export const downloadInvoicePdf = async (inv) => {
  const doc = await buildInvoicePdf(inv);
  doc.save(`${inv.invoice_number}.pdf`);
};

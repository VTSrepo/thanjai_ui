// Packing slip for a dispatched indent: what goes in the delivery (items, quantities, batch numbers) - no prices.
// Printed by the kitchen at dispatch; the branch / customer checks it on receipt.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const qtyFmt = (n) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("en-CA", { maximumFractionDigits: 3 }));
const addr = (b) =>
  b ? [b.legal_name || b.branch_name, b.branch_address, [b.branch_city, b.province_code, b.postal_code].filter(Boolean).join(", "), b.branch_contact_num]
    .filter(Boolean) : [];

/**
 * indent: indent header (indent_number, indent_date, delivery_date, branch_id, kitchen_id, branch_name, kitchen_name, customer_*)
 * items:  [{ item_code, item_name, uom, qty_ordered, qty_agreed_kitchen, kitchen_remarks }]
 * alloc:  { item_code: [{ batch_no, qty }] }   (from the dispatch)
 * branches: branch list (for addresses)
 */
export const buildPackingSlip = ({ indent, items, alloc = {}, branches = [] }) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const L = 40;
  const R = W - 40;
  const kitchen = branches.find((b) => b.branch_id === indent.kitchen_id);
  const branch = branches.find((b) => b.branch_id === indent.branch_id);

  doc.setFont("helvetica", "bold").setFontSize(20).text("PACKING SLIP", R, 50, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Indent # ${indent.indent_number}`, R, 68, { align: "right" });
  doc.text(`Indent date: ${indent.indent_date || ""}`, R, 82, { align: "right" });
  if (indent.delivery_date) doc.text(`Delivery date: ${indent.delivery_date}`, R, 96, { align: "right" });

  doc.setFont("helvetica", "bold").text("From (kitchen)", L, 50);
  doc.setFont("helvetica", "normal");
  (addr(kitchen).length ? addr(kitchen) : [indent.kitchen_name]).forEach((t, i) => doc.text(String(t), L, 64 + i * 13));

  let y = 140;
  doc.setFont("helvetica", "bold").text("Deliver to", L, y);
  doc.setFont("helvetica", "normal");
  const to = indent.self_customer === "C" && indent.customer_name
    ? [indent.customer_name, indent.customer_address, indent.customer_pin, indent.customer_phone, `(order via ${indent.branch_name || indent.branch_id})`].filter(Boolean)
    : addr(branch).length ? addr(branch) : [indent.branch_name];
  to.forEach((t, i) => doc.text(String(t), L, y + 14 + i * 13));
  y += 22 + to.length * 13;

  const body = items.map((it, i) => {
    const qty = it.qty_agreed_kitchen ?? it.qty_ordered;
    const batches = (alloc[it.item_code] || []).map((a) => `${a.batch_no} (${qtyFmt(a.qty)})`).join("\n");
    return [i + 1, it.item_name || it.item_code, it.uom || "", qtyFmt(it.qty_ordered), qtyFmt(qty), batches, it.kitchen_remarks || "", ""];
  });
  autoTable(doc, {
    startY: y + 6,
    head: [["#", "Item", "Unit", "Ordered", "Sent", "Batch no.", "Kitchen note", "Received"]],
    body,
    styles: { fontSize: 9, cellPadding: 4, valign: "top" },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: { 0: { cellWidth: 22 }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" }, 5: { font: "courier", fontSize: 8 }, 7: { cellWidth: 60 } },
    margin: { left: L, right: 40 },
  });
  let end = doc.lastAutoTable.finalY + 30;
  const total = items.length;
  doc.setFontSize(10).text(`${total} item line(s). Check each item on delivery and note any shortage or damage when you confirm receipt in the app.`, L, end, { maxWidth: R - L });
  end += 50;
  doc.line(L, end, L + 200, end).line(R - 200, end, R, end);
  doc.setFontSize(9).text("Packed by (kitchen)", L, end + 12).text("Received by (name / signature)", R - 200, end + 12);
  return doc;
};

export const downloadPackingSlip = (args) => buildPackingSlip(args).save(`packing-slip-${args.indent.indent_number}.pdf`);

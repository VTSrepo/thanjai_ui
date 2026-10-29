// Reservation reports as PDF (A4 landscape - easy to read on the staff board).
//   statusPdf:   summary of every seating, then one page per seating: floor plan with names + table list
//   customerPdf: bookings by customer for each seating (who, how many, which tables, request)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { longDate, time12 } from "./reserveApi";

const ORANGE = [255, 138, 0];
const INK = [43, 43, 43];
const STATUS = { C: "Confirmed", A: "Arrived", N: "No-show", X: "Cancelled" };
const COLORS = {
  free: { fill: [236, 248, 241], line: [59, 178, 115], text: [29, 92, 58] },
  booked: { fill: [255, 241, 222], line: [255, 138, 0], text: [138, 74, 0] },
  arrived: { fill: [227, 240, 253], line: [25, 118, 210], text: [13, 60, 115] },
  noshow: { fill: [253, 234, 234], line: [211, 47, 47], text: [142, 28, 28] },
  blocked: { fill: [239, 227, 245], line: [123, 31, 162], text: [91, 20, 120] },
};

const live = (b) => b.status !== "X";
export const seatingRows = (day, seating) => {
  const bookings = day.bookings.filter((b) => b.seating_id === seating.seating_id && live(b));
  const byBooking = Object.fromEntries(bookings.map((b) => [b.booking_id, b]));
  return day.tables.filter((t) => t.status === "A" || seating.taken[t.table_id]).map((t) => {
    const b = byBooking[seating.taken[t.table_id]];
    const state = !b ? "free" : b.kind === "B" ? "blocked" : b.status === "A" ? "arrived" : b.status === "N" ? "noshow" : "booked";
    return { table: t, booking: b || null, state };
  });
};

const header = (doc, title, day, sub) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...INK); doc.rect(0, 0, w, 20, "F");
  doc.setFillColor(...ORANGE); doc.rect(0, 20, w, 1.4, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(`${day.settings.restaurant_name || "Thanjai Restaurant"} - ${title}`, 10, 12.5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(longDate(day.date), w - 10, 12.5, { align: "right" });
  doc.setTextColor(...INK);
  if (sub) { doc.setFontSize(10); doc.text(sub, 10, 28); }
};

const footer = (doc) => {
  const n = doc.internal.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`Printed ${stamp}`, 10, h - 6);
    doc.text(`Page ${i} of ${n}`, w - 10, h - 6, { align: "right" });
  }
  doc.setTextColor(...INK);
};

const summaryRows = (day, seatings) => {
  const total = day.tables.filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);
  return seatings.map((s) => {
    const rows = seatingRows(day, s);
    return [
      `${s.label} ${time12(s.start_time)}${s.closed ? `\n(closed online: ${s.closed})` : ""}`,
      `${s.reserved_seats} / ${s.max_reserved_seats}`, String(s.seats_left), String(Math.max(total - s.reserved_seats, 0)),
      String(s.bookings), String(s.guests), String(s.blocked_seats),
      `${rows.filter((r) => r.booking).length} / ${rows.length}`,
    ];
  });
};
export const SUMMARY_HEAD = ["Seating", "Reserved seats", "Can still book", "Free for walk-ins", "Bookings", "Guests", "Blocked chairs", "Tables taken"];

/** Floor plan drawing inside the box (x, y, w) - height follows the floor proportions. */
const drawFloor = (doc, day, seating, x, y, w) => {
  const h = w * (875 / 1280);
  doc.setDrawColor(200); doc.setLineWidth(0.3); doc.setFillColor(251, 250, 248); doc.roundedRect(x, y, w, h, 2, 2, "FD");
  (day.decor || []).forEach((d) => {
    const dx = x + (d.x / 100) * w; const dy = y + (d.y / 100) * h; const dw = (d.w / 100) * w; const dh = (d.h / 100) * h;
    if (d.kind === "entrance") { doc.setLineDashPattern([1.5, 1.2], 0); doc.setDrawColor(180); doc.rect(dx, dy, dw, dh); doc.setLineDashPattern([], 0); doc.setTextColor(...ORANGE); }
    else { doc.setFillColor(236, 236, 236); doc.rect(dx, dy, dw, dh, "F"); doc.setTextColor(150); }
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(d.label.toUpperCase(), dx + dw / 2, dy + dh / 2 + 1, { align: "center" });
  });
  seatingRows(day, seating).forEach(({ table: t, booking: b, state }) => {
    const c = COLORS[state];
    const tw = (t.width / 100) * w; const th = (t.height / 100) * h;
    const tx = x + (t.pos_x / 100) * w - tw / 2; const ty = y + (t.pos_y / 100) * h - th / 2;
    doc.setFillColor(...c.fill); doc.setDrawColor(...c.line); doc.setLineWidth(0.5);
    doc.roundedRect(tx, ty, tw, th, 1.2, 1.2, "FD");
    doc.setTextColor(...c.text); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(t.table_id, tx + tw / 2, ty + th / 2 - (b ? 0.6 : -1), { align: "center" });
    if (b) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      // narrow tables only have room for the guest count; names are in the list beside the plan
      const name = b.kind === "B" ? "BLOCK" : t.width < 6 ? `${b.guests} ppl` : `${String(b.customer_name || "").split(" ")[0].slice(0, 6)} ${b.guests}`;
      doc.text(name, tx + tw / 2, ty + th / 2 + 2.6, { align: "center" });
    }
  });
  doc.setTextColor(...INK); doc.setLineWidth(0.2);
  return h;
};

const tableList = (day, seating) => seatingRows(day, seating).map(({ table: t, booking: b, state }) => [
  t.table_id, String(t.seats),
  { free: "Free", booked: "Booked", arrived: "Arrived", noshow: "No-show", blocked: "Staff block" }[state],
  b ? b.booking_id : "",
  b ? (b.kind === "B" ? b.customer_name : b.customer_name) : "",
  b && b.kind !== "B" ? `${b.guests}${b.tables.length > 1 ? ` (${b.tables.join("+")})` : ""}` : "",
  b ? b.phone || "" : "",
  b ? [b.notes, b.staff_note].filter(Boolean).join(" / ") : "",
]);
export const TABLE_HEAD = ["Table", "Chairs", "Status", "Booking", "Name", "Guests (tables together)", "Phone", "Request / note"];

export const statusPdf = (day, seatings) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  header(doc, "Reservation status", day, "Summary - reserved seats count the chairs of booked tables, staff blocks included.");
  autoTable(doc, {
    startY: 32, head: [SUMMARY_HEAD], body: summaryRows(day, seatings), theme: "grid",
    styles: { fontSize: 11, cellPadding: 2.5, valign: "middle" }, headStyles: { fillColor: ORANGE, textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
  });
  seatings.forEach((s) => {
    doc.addPage();
    header(doc, `${s.label} ${time12(s.start_time)}`, day,
      `Reserved ${s.reserved_seats}/${s.max_reserved_seats} seats · ${s.bookings} bookings · ${s.guests} guests · ${s.blocked_seats} chairs blocked by staff${s.closed ? ` · closed online: ${s.closed}` : ""}`);
    const fh = drawFloor(doc, day, s, 10, 32, 125);
    doc.setFontSize(8);
    [["Free", "free"], ["Booked", "booked"], ["Arrived", "arrived"], ["No-show", "noshow"], ["Staff block", "blocked"]].forEach(([l, k], i) => {
      const c = COLORS[k]; doc.setFillColor(...c.fill); doc.setDrawColor(...c.line); doc.rect(10 + i * 25, 35 + fh, 4, 4, "FD"); doc.text(l, 15.5 + i * 25, 38.2 + fh);
    });
    autoTable(doc, {
      startY: 32, margin: { left: 140, right: 10 }, head: [TABLE_HEAD.slice(0, 6)], body: tableList(day, s).map((r) => r.slice(0, 6)), theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 1.4 }, headStyles: { fillColor: ORANGE, textColor: 255 },
      columnStyles: { 0: { fontStyle: "bold" } },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 2 && d.cell.raw === "Free") d.cell.styles.textColor = [59, 140, 90]; },
    });
  });
  footer(doc);
  return doc;
};

export const customerRows = (day, seating) => day.bookings
  .filter((b) => b.seating_id === seating.seating_id && live(b) && b.kind !== "B")
  .sort((a, b) => String(a.customer_name).localeCompare(String(b.customer_name)))
  .map((b) => [b.customer_name, String(b.guests), b.tables.join(" + "), b.phone || "", b.email || "", b.notes || "", STATUS[b.status], b.booking_id, b.source === "S" ? "Staff" : "Online"]);
export const CUSTOMER_HEAD = ["Customer", "Guests", "Table(s)", "Phone", "E-mail", "Request", "Status", "Booking", "By"];

export const customerPdf = (day, seatings) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  header(doc, "Bookings by customer", day);
  let y = 30;
  seatings.forEach((s, i) => {
    const rows = customerRows(day, s);
    const blocks = day.bookings.filter((b) => b.seating_id === s.seating_id && live(b) && b.kind === "B");
    if (i && y > 160) { doc.addPage(); header(doc, "Bookings by customer", day); y = 30; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(`${s.label} ${time12(s.start_time)}  -  ${rows.length} bookings · ${s.guests} guests · ${s.reserved_seats}/${s.max_reserved_seats} seats reserved`, 10, y + 4);
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y + 7, head: [CUSTOMER_HEAD], body: rows.length ? rows : [["No bookings", "", "", "", "", "", "", "", ""]], theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 }, headStyles: { fillColor: ORANGE, textColor: 255 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 }, 1: { halign: "center", cellWidth: 18 }, 2: { fontStyle: "bold", cellWidth: 26 }, 3: { cellWidth: 31 },
        4: { cellWidth: 50 }, 6: { cellWidth: 23 }, 7: { cellWidth: 24 }, 8: { cellWidth: 15 },
      },
    });
    y = doc.lastAutoTable.finalY + 4;
    if (blocks.length) {
      doc.setFontSize(9); doc.setTextColor(91, 20, 120);
      doc.text(`Staff blocks: ${blocks.map((b) => `${b.tables.join("+")} (${b.customer_name})`).join(", ")}`, 10, y + 2);
      doc.setTextColor(...INK); y += 6;
    }
    y += 6;
  });
  footer(doc);
  return doc;
};

/** Opens the PDF with the print dialog (falls back to download if pop-ups are blocked). */
export const printPdf = (doc, filename) => {
  doc.autoPrint();
  const w = window.open(doc.output("bloburl"), "_blank");
  if (!w) doc.save(filename);
};

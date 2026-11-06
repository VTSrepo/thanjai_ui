// Reservation reports as PDF (A4 landscape - easy to read on the staff board).
//   statusPdf:   summary per start time, then one page per session: timeline of every table (who holds it when)
//   customerPdf: bookings by arrival time for each session (who, how many, which tables, request)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { longDate, time12 } from "./reserveApi";

const ORANGE = [255, 138, 0];
const INK = [43, 43, 43];
const STATUS = { C: "Confirmed", A: "Arrived", N: "No-show", X: "Cancelled" };
const FILL = { booked: [255, 241, 222], arrived: [227, 240, 253], noshow: [253, 234, 234], blocked: [239, 227, 245] };
const toMin = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + m; };
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const live = (b) => b.status !== "X";
const stateOf = (b) => (b.kind === "B" ? "blocked" : b.status === "A" ? "arrived" : b.status === "N" ? "noshow" : "booked");
const short = (b) => (b.kind === "B" ? "BLOCK" : `${String(b.customer_name || "").split(" ")[0].slice(0, 10)} ${b.guests}`);

export const sessionBookings = (day, session) => day.bookings.filter((b) => b.seating_id === session.seating_id && live(b)).sort((a, b) => a.start_time.localeCompare(b.start_time));

/** Columns every 30 minutes from the first start time until the last table is free. */
export const timelineCols = (day, session) => {
  const end = Math.max(toMin(session.end_time) + (day.settings.seating_minutes || 90), ...sessionBookings(day, session).map((b) => toMin(b.end_time)));
  const cols = [];
  for (let m = toMin(session.start_time); m < end; m += 30) cols.push(hhmm(m));
  return cols;
};

/** Rows: one per table; cells: { booking, first } for the 30 minutes starting at each column. */
export const timelineRows = (day, session) => {
  const cols = timelineCols(day, session);
  const books = sessionBookings(day, session);
  return day.tables.filter((t) => t.status === "A" || books.some((b) => b.tables.includes(t.table_id))).map((t) => ({
    table: t,
    cells: cols.map((c) => {
      const from = toMin(c);
      const b = books.find((x) => x.tables.includes(t.table_id) && toMin(x.start_time) < from + 30 && toMin(x.end_time) > from);
      return b ? { booking: b, first: toMin(b.start_time) >= from && toMin(b.start_time) < from + 30 } : null;
    }),
  }));
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

export const SUMMARY_HEAD = ["Time", "Reserved chairs at this time", "Can still book from this time", "Free for walk-ins", "Arriving bookings", "Guests arriving"];
export const summaryRows = (day, session) => {
  const total = day.tables.filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);
  return session.slots.map((z) => [time12(z.time), `${z.reserved_seats} / ${session.max_reserved_seats}`, String(z.seats_left), String(Math.max(total - z.reserved_seats, 0)), String(z.bookings), String(z.guests)]);
};

export const statusPdf = (day, sessions) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  header(doc, "Reservation status", day, "Reserved chairs count every booked table's chairs (staff blocks too) for the whole table time.");
  let y = 32;
  sessions.forEach((s) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`${s.label} ${time12(s.start_time)} - ${time12(s.end_time)}  ·  ${s.bookings} bookings · ${s.guests} guests${s.to_allocate ? ` · ${s.to_allocate} waiting for tables` : ""}${s.closed ? ` · closed online: ${s.closed}` : ""}`, 10, y + 3);
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y + 6, head: [SUMMARY_HEAD], body: summaryRows(day, s), theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 1.6, halign: "center" }, headStyles: { fillColor: ORANGE, textColor: 255 },
      columnStyles: { 0: { fontStyle: "bold", halign: "left" } },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 2 && d.cell.raw === "0") d.cell.styles.textColor = [200, 40, 40]; },
    });
    y = doc.lastAutoTable.finalY + 8;
    if (y > 170) { doc.addPage(); header(doc, "Reservation status", day); y = 30; }
  });
  sessions.forEach((s) => {
    doc.addPage("a4", "landscape");
    const books = sessionBookings(day, s);
    header(doc, `${s.label} - table timeline`, day, `Who holds each table, every 30 minutes. Name and guests where a booking starts; shaded while held.`);
    const cols = timelineCols(day, s);
    const rows = timelineRows(day, s);
    autoTable(doc, {
      startY: 32, head: [["Table", ...cols.map((c) => time12(c).replace(" ", "\n"))]],
      body: rows.map((r) => [`${r.table.table_id} (${r.table.seats})`, ...r.cells.map((c) => (c && c.first ? short(c.booking) : ""))]),
      theme: "grid", styles: { fontSize: cols.length > 14 ? 6.5 : 7.5, cellPadding: 1, halign: "center", valign: "middle", minCellHeight: 6.5 },
      headStyles: { fillColor: ORANGE, textColor: 255, fontSize: 7 }, columnStyles: { 0: { fontStyle: "bold", halign: "left", cellWidth: 18 } },
      didParseCell: (d) => {
        if (d.section !== "body" || d.column.index === 0) return;
        const c = rows[d.row.index].cells[d.column.index - 1];
        if (c) { d.cell.styles.fillColor = FILL[stateOf(c.booking)]; if (c.first) d.cell.styles.fontStyle = "bold"; }
      },
    });
    const waiting = books.filter((b) => b.needs_tables);
    let y2 = doc.lastAutoTable.finalY + 6;
    if (waiting.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(178, 94, 0);
      doc.text("Waiting for tables:", 10, y2);
      doc.setFont("helvetica", "normal");
      doc.text(waiting.map((b) => `${time12(b.start_time)} ${b.customer_name} (${b.guests} guests, ${b.phone || "no phone"})`).join("   ·   "), 45, y2, { maxWidth: 240 });
      doc.setTextColor(...INK); y2 += 8;
    }
    doc.setFontSize(8);
    [["Booked", "booked"], ["Arrived", "arrived"], ["No-show", "noshow"], ["Staff block", "blocked"]].forEach(([l, k], i) => {
      doc.setFillColor(...FILL[k]); doc.setDrawColor(180); doc.rect(10 + i * 28, y2, 4, 4, "FD"); doc.text(l, 15.5 + i * 28, y2 + 3.2);
    });
  });
  footer(doc);
  return doc;
};

export const CUSTOMER_HEAD = ["Time", "Customer", "Guests", "Table(s)", "Phone", "E-mail", "Request", "Status", "Booking", "By"];
export const customerRows = (day, session) => sessionBookings(day, session).filter((b) => b.kind !== "B")
  .map((b) => [time12(b.start_time), b.customer_name, String(b.guests), b.needs_tables ? "TO ALLOCATE" : b.tables.join(" + "), b.phone || "", b.email || "", b.notes || "", STATUS[b.status], b.booking_id, b.source === "S" ? "Staff" : "Online"]);

export const customerPdf = (day, sessions) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  header(doc, "Bookings by customer", day);
  let y = 30;
  sessions.forEach((s, i) => {
    const rows = customerRows(day, s);
    const blocks = sessionBookings(day, s).filter((b) => b.kind === "B");
    if (i && y > 160) { doc.addPage(); header(doc, "Bookings by customer", day); y = 30; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(`${s.label}  -  ${rows.length} bookings · ${s.guests} guests${s.to_allocate ? ` · ${s.to_allocate} waiting for tables` : ""}`, 10, y + 4);
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: y + 7, head: [CUSTOMER_HEAD], body: rows.length ? rows : [["", "No bookings", "", "", "", "", "", "", "", ""]], theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 1.8 }, headStyles: { fillColor: ORANGE, textColor: 255 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 19 }, 1: { fontStyle: "bold", cellWidth: 38 }, 2: { halign: "center", cellWidth: 17 }, 3: { fontStyle: "bold", cellWidth: 26 },
        4: { cellWidth: 29 }, 5: { cellWidth: 46 }, 7: { cellWidth: 21 }, 8: { cellWidth: 22 }, 9: { cellWidth: 14 },
      },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 3 && d.cell.raw === "TO ALLOCATE") d.cell.styles.textColor = [178, 94, 0]; },
    });
    y = doc.lastAutoTable.finalY + 4;
    if (blocks.length) {
      doc.setFontSize(9); doc.setTextColor(91, 20, 120);
      doc.text(`Staff blocks: ${blocks.map((b) => `${time12(b.start_time)} ${b.tables.join("+")} (${b.customer_name})`).join(", ")}`, 10, y + 2, { maxWidth: 270 });
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

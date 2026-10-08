export const FormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
};

// Display helpers (safe for null / invalid input)
export const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
};

export const formatDate = (value) => {
  if (!value) return "";
  // "YYYY-MM-DD" strings are shown as-is in local form without timezone shifting
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleDateString("en-CA", { dateStyle: "medium" });
};

export const dateFromString = (str) => {
  const [year, month, day] = str.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

// Money: 1234.5 -> "1,234.50" (prefix "$" with withSign)
export const money = (n, withSign = false) => {
  if (n === null || n === undefined || n === "") return "-";
  const s = Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withSign ? `$${s}` : s;
};

// Payment terms (same codes as the API): POI, EOM, EONM, N<days>
export const CREDIT_TERMS = [
  { code: "POI", label: "Due on receipt" },
  { code: "EOM", label: "Due end of the month" },
  { code: "EONM", label: "Due end of next month" },
  { code: "N7", label: "Net 7" },
  { code: "N10", label: "Net 10" },
  { code: "N15", label: "Net 15" },
  { code: "N30", label: "Net 30" },
  { code: "N45", label: "Net 45" },
];
export const netDays = (c) => {
  const m = /^N(\d{1,3})$/.exec(c || "");
  const d = m ? parseInt(m[1], 10) : 0;
  return d >= 1 && d <= 365 ? d : null;
};
export const isTerm = (c) => ["POI", "EOM", "EONM"].includes(c) || netDays(c) !== null;
export const termLabel = (c) =>
  CREDIT_TERMS.find((t) => t.code === c)?.label || (netDays(c) ? `Net ${netDays(c)}` : c || "-");

export const PAYMENT_MODES = [
  { code: "INTERAC", label: "Interac e-Transfer" },
  { code: "CASH", label: "Cash" },
  { code: "CHEQUE", label: "Cheque" },
  { code: "CARD", label: "Card" },
  { code: "BANK", label: "Bank transfer" },
  { code: "INTERNAL", label: "Internal settlement" },
];
export const modeLabel = (c) => PAYMENT_MODES.find((m) => m.code === c)?.label || c;

// Invoice payment status for display
export const payStatus = (inv) => {
  if (!inv) return null;
  const bal = Number(inv.balance_due);
  if (bal <= 0.004) return { label: "Paid", color: "success" };
  if (Number(inv.days_overdue) > 0 || inv.overdue) return { label: "Overdue", color: "error" };
  if (Number(inv.amount_paid) > 0) return { label: "Part paid", color: "warning" };
  return { label: "Open", color: "default" };
};

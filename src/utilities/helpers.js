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

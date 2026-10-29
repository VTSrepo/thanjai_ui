// Table reservations - public API (no staff login) and shared helpers for the booking page and staff screens.
import axios from "axios";
import { API_URL } from "./service";

// separate axios instance: never sends a staff token, never redirects to the staff login
const http = axios.create();
const err = (e, fallback) => {
  const d = e.response?.data;
  const x = new Error(d?.message || fallback || "Something went wrong. Please try again.");
  x.status = e.response?.status;
  x.refresh = !!d?.refresh;
  return x;
};
const get = async (path, fallback) => { try { return (await http.get(`${API_URL}${path}`)).data; } catch (e) { throw err(e, fallback); } };
const post = async (path, body, fallback) => { try { return (await http.post(`${API_URL}${path}`, body)).data; } catch (e) { throw err(e, fallback); } };

export const reserveInfo = () => get("/rsv/info", "Could not load the booking page");
export const reserveAvailability = (date) => get(`/rsv/availability?date=${encodeURIComponent(date)}`, "Could not load free tables");
export const reserveBook = (b) => post("/rsv/book", b, "Could not make the booking");
export const reserveView = (token) => get(`/rsv/booking/${encodeURIComponent(token)}`, "Could not load the booking");
export const reserveCancel = (token) => post(`/rsv/booking/${encodeURIComponent(token)}/cancel`, {}, "Could not cancel the booking");

// ---- dates & times ----
export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dayOfWeek = (ymd) => new Date(`${ymd}T12:00:00`).getDay();
export const longDate = (ymd) => (ymd ? new Date(`${ymd}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "");
export const shortDate = (ymd) => (ymd ? new Date(`${ymd}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "");
export const time12 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// ---- choosing tables ----
const chairsOf = (list) => list.reduce((n, t) => n + t.seats, 0);
const dist = (a, b) => Math.hypot(a.pos_x - b.pos_x, (a.pos_y - b.pos_y) * 0.68); // floor is ~1.46 : 1

/** Every chosen table is needed (no spare table for the party). */
export const isMinimal = (list, guests) =>
  list.length <= 1 || chairsOf(list) - Math.min(...list.map((t) => t.seats)) < guests;

/**
 * Best tables for a party: enough chairs, fits the seats left, no spare table; prefers the fewest spare chairs,
 * then fewest tables, then tables in the same row and close together (easy for staff to push together).
 * free: tables that can be chosen. Returns an array of tables or null.
 */
export const bestTables = (free, guests, seatsLeft, maxTables = 4) => {
  if (!guests) return null;
  const list = [...free].sort((a, b) => a.sort_order - b.sort_order);
  let best = null;
  let bestScore = null;
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };
  const walk = (start, combo, chairs) => {
    if (chairs >= guests) {
      if (chairs <= seatsLeft && isMinimal(combo, guests)) {
        let spread = 0;
        for (let i = 0; i < combo.length; i++) for (let j = i + 1; j < combo.length; j++) spread += dist(combo[i], combo[j]);
        const rows = new Set(combo.map((t) => t.table_row)).size;
        const score = [chairs - guests, combo.length, rows, Math.round(spread)];
        if (!bestScore || better(score, bestScore)) { best = [...combo]; bestScore = score; }
      }
      return;
    }
    if (combo.length >= maxTables) return;
    for (let i = start; i < list.length; i++) {
      if (chairs + list[i].seats > seatsLeft) continue;
      combo.push(list[i]);
      walk(i + 1, combo, chairs + list[i].seats);
      combo.pop();
    }
  };
  walk(0, [], 0);
  return best;
};

/** What the chosen tables mean for the party: { ok, chairs, message } */
export const selectionStatus = (chosen, guests) => {
  const chairs = chairsOf(chosen);
  if (!chosen.length) return { ok: false, chairs, message: "Choose a table on the floor plan" };
  if (chairs < guests) {
    const more = guests - chairs;
    return { ok: false, chairs, message: `Add another table: ${more} more chair${more === 1 ? "" : "s"} needed for ${guests} guests` };
  }
  if (!isMinimal(chosen, guests)) {
    const spare = [...chosen].sort((a, b) => a.seats - b.seats)[0];
    return { ok: false, chairs, message: `You have more tables than you need - remove ${spare.table_id}` };
  }
  return { ok: true, chairs, message: `${chosen.length > 1 ? `${chosen.length} tables, ` : ""}${chairs} chairs for ${guests} guest${guests === 1 ? "" : "s"}` };
};

export const STATUS = {
  C: { label: "Confirmed", color: "warning" },
  A: { label: "Arrived", color: "info" },
  N: { label: "No-show", color: "error" },
  X: { label: "Cancelled", color: "default" },
};

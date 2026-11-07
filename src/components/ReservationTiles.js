import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tile from "./StatusTile";
import { useUser } from "../utilities/UserContext";
import { getResSummary } from "../utilities/service";

const time12 = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const dayLabel = (d, today) => {
  if (d === today) return "today";
  const t = new Date(`${today}T12:00:00`); t.setDate(t.getDate() + 1);
  if (d === t.toISOString().slice(0, 10)) return "tomorrow";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
};

/**
 * Reservation status tiles for the staff home (anyone with the Reservations bookings or reports screen):
 * today (late guests not yet marked = red), tables to allocate (today / tomorrow = red), online booking paused (amber).
 */
export const useReservationTiles = () => {
  const { can } = useUser();
  const navigate = useNavigate();
  const allowed = can("RES_BOOKINGS") || can("RES_REPORTS");
  const [r, setR] = useState(null);

  useEffect(() => {
    if (!allowed) return undefined;
    const load = () => getResSummary().then(setR).catch(() => setR(null));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [allowed]);

  if (!allowed || !r) return [];
  const go = (date) => navigate(`/reservations?date=${date}`);
  const late = r.late || [];
  const paused = r.booking_open !== "Y";
  const full = r.full_times || [];
  const sessions = (r.sessions || []).filter((s) => s.bookings).map((s) => `${s.label} ${s.bookings}`).join(" · ");
  const todayLight = late.length ? "red" : paused || full.length ? "amber" : "green";
  const todaySub = late.length
    ? `${late.length} late, not marked arrived: ${late.slice(0, 2).map((b) => `${time12(b.start_time)} ${b.customer_name}`).join(", ")}${late.length > 2 ? "…" : ""}`
    : paused ? "Online booking is paused (Reservation setup)"
      : full.length ? `Full at ${full.slice(0, 3).map(time12).join(", ")}${full.length > 3 ? "…" : ""}`
        : r.next ? `Next: ${time12(r.next.start_time)} ${r.next.customer_name} (${r.next.guests})` : sessions || "";

  const wait = r.to_allocate || [];
  const soon = wait.filter((b) => ["today", "tomorrow"].includes(dayLabel(b.booking_date, r.today)));
  const first = wait[0];
  return [
    <Tile key="res-today" title="Reservations today" light={todayLight}
      summary={r.bookings ? `${r.bookings} booking${r.bookings === 1 ? "" : "s"} · ${r.guests} guests${r.arrived ? ` · ${r.arrived} arrived` : ""}` : "No bookings today"}
      sub={todaySub} action="Open" onClick={() => go(r.today)} />,
    <Tile key="res-alloc" title="Tables to allocate" light={!wait.length ? "green" : soon.length ? "red" : "amber"}
      summary={wait.length ? `${wait.length} booking${wait.length === 1 ? "" : "s"} waiting for tables` : "All bookings have tables"}
      sub={first ? `First: ${dayLabel(first.booking_date, r.today)} ${time12(first.start_time)} · ${first.customer_name} (${first.guests})`
        : `Next 7 days: ${r.next_7_days.bookings} bookings · ${r.next_7_days.guests} guests`}
      action="Open" onClick={() => go(first ? first.booking_date : r.today)} />,
  ];
};

/** The reservation tiles in a grid, for homes that do not have their own tile grid. */
export const ReservationTilesGrid = ({ sx }) => {
  const tiles = useReservationTiles();
  if (!tiles.length) return null;
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: 16, ...sx }}>
      {tiles}
    </div>
  );
};

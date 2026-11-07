import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tile from "./StatusTile";
import { useUser } from "../utilities/UserContext";
import { getSubSummary } from "../utilities/service";

const short = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "");
const when = (dt) => {
  if (!dt) return "";
  const [d, t] = dt.split(" ");
  const [h, m] = t.split(":").map(Number);
  return `${short(d)} ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/**
 * Online weekly-meals status tiles for the staff home (roles with Online orders, Shop setup or Subscribers):
 * next week's menu, orders and the weekly steps due (cutoff, kitchen, delivery, failed payments), shop setup gaps.
 */
export const useOnlineTiles = () => {
  const { can } = useUser();
  const navigate = useNavigate();
  const orders = can("SUB_ORDERS");
  const setup = can("SUB_SETUP");
  const allowed = orders || setup || can("SUB_CUSTOMERS");
  const [r, setR] = useState(null);

  useEffect(() => {
    if (!allowed) return undefined;
    const load = () => getSubSummary().then(setR).catch(() => setR(null));
    load();
    const id = setInterval(load, 120000);
    return () => clearInterval(id);
  }, [allowed]);

  if (!allowed || !r) return [];
  const tiles = [];
  const m = r.menu || {};

  // 1. this week's menu
  if (setup || orders) {
    const soon = m.hours_to_cutoff !== null && m.hours_to_cutoff <= 72;
    tiles.push(
      <Tile key="sub-menu" title="Online menu" action="Open"
        light={m.published ? "green" : soon ? "red" : "amber"}
        summary={m.published ? `Menu for ${short(m.delivery_date)} is live` : m.delivery_date ? `Menu for ${short(m.delivery_date)} not published${m.draft ? " (draft saved)" : ""}` : "No delivery day set"}
        sub={m.cutoff_at ? `Customers order until ${when(m.cutoff_at)}` : ""}
        onClick={() => navigate("/online/menu")} />
    );
  }

  // 2. orders and the weekly steps
  if (orders) {
    const o = r.orders;
    const steps = [];
    if (r.cutoff_due.length) steps.push(`Run cutoff for ${short(r.cutoff_due[0])}`);
    if (r.failed.count) steps.push(`${r.failed.count} payment${r.failed.count > 1 ? "s" : ""} failed`);
    if (r.kitchen_due.length) steps.push(`Send ${short(r.kitchen_due[0])} to kitchen`);
    if (r.to_deliver.count) steps.push(`${r.to_deliver.count} to mark delivered`);
    const red = r.cutoff_due.length || r.failed.count;
    const goDate = r.cutoff_due[0] || (r.failed.count && r.failed.first) || r.kitchen_due[0] || (r.to_deliver.count && r.to_deliver.first) || (o && o.delivery_date) || "";
    tiles.push(
      <Tile key="sub-orders" title="Online orders" action="Open"
        light={red ? "red" : steps.length ? "amber" : "green"}
        summary={steps.length ? steps.slice(0, 2).join(" · ") : o ? `${o.orders} order${o.orders === 1 ? "" : "s"} · ${o.meals} meals for ${short(o.delivery_date)}` : "No open week"}
        sub={steps.length && o ? `${short(o.delivery_date)}: ${o.orders} order${o.orders === 1 ? "" : "s"} · ${o.meals} meals`
          : o ? `${o.paid} paid${o.unpaid ? ` · ${o.unpaid} to charge at cutoff` : ""}${o.not_chosen ? ` · ${o.not_chosen} not chosen yet (chef's choice)` : ""} · ${r.subscribers.active} active subscribers`
            : `${r.subscribers.active} active subscribers${r.subscribers.paused ? ` · ${r.subscribers.paused} paused` : ""}`}
        onClick={() => navigate(`/online/orders${goDate ? `?date=${goDate}` : ""}`)} />
    );
  }

  // 3. shop setup gaps
  if (setup) {
    const gaps = [];
    const np = r.setup.plans_without_price;
    if (np.length) gaps.push(`${np.length} plan${np.length > 1 ? "s" : ""} without weekly price`);
    if (r.setup.dishes_missing) gaps.push(`${r.setup.dishes_missing} online dish${r.setup.dishes_missing > 1 ? "es" : ""} without price / diet`);
    tiles.push(
      <Tile key="sub-setup" title="Online shop setup" action="Open" light={gaps.length ? "amber" : "green"}
        summary={gaps.length ? gaps.join(" · ") : "Plans and dish prices complete"}
        sub={np.length ? `Hidden from customers: ${np.slice(0, 3).join(", ")}${np.length > 3 ? "…" : ""}` : ""}
        onClick={() => navigate("/online/setup")} />
    );
  }
  return tiles;
};

export const OnlineTilesGrid = () => {
  const tiles = useOnlineTiles();
  if (!tiles.length) return null;
  return <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: 16 }}>{tiles}</div>;
};

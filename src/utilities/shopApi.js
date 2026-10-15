// Online shop (weekly meals) API. Separate axios instance + token so a subscriber login never mixes with a staff login.
import axios from "axios";
import { API_URL } from "./service";

const KEY = "shopToken";
const CUST = "shopCustomer";

export const shopSession = {
  token: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
  customer: () => { try { return JSON.parse(localStorage.getItem(CUST)); } catch (e) { return null; } },
  set: (token, customer) => { try { localStorage.setItem(KEY, token); localStorage.setItem(CUST, JSON.stringify(customer)); } catch (e) {} },
  clear: () => { try { localStorage.removeItem(KEY); localStorage.removeItem(CUST); } catch (e) {} },
};

const http = axios.create();
http.interceptors.request.use((config) => {
  const t = shopSession.token();
  if (t) config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
  return config;
});

const err = (e, fallback) => {
  const d = e.response?.data;
  const x = new Error(d?.message || fallback || "Something went wrong. Please try again.");
  x.status = e.response?.status;
  x.authExpired = e.response?.status === 401 && d?.code === "AUTH_REQUIRED";
  if (x.authExpired) shopSession.clear();
  return x;
};
const get = async (path, fallback) => { try { return (await http.get(`${API_URL}${path}`)).data; } catch (e) { throw err(e, fallback); } };
const post = async (path, body, fallback) => { try { return (await http.post(`${API_URL}${path}`, body)).data; } catch (e) { throw err(e, fallback); } };

// where the payment pages come back to (works under /v1 on the web)
const base = () => `${window.location.origin}${(process.env.REACT_APP_ROUTER_BASENAME || "/v1").replace(/\/$/, "")}`;

export const shopInfo = () => get("/shop/info", "Could not load the menu");
export const zoneCheck = (postal) => get(`/shop/zone-check?postal=${encodeURIComponent(postal)}`, "Could not check the postal code");
export const shopSignup = async (b) => { const r = await post("/shop/signup", b, "Could not create the account"); shopSession.set(r.token, r.customer); return r; };
export const shopLogin = async (b) => { const r = await post("/shop/login", b, "Could not log in"); shopSession.set(r.token, r.customer); return r; };
export const shopMe = () => get("/shop/me", "Could not load your account");
export const saveProfile = (b) => post("/shop/profile", b, "Could not save your details");
export const changeShopPassword = (b) => post("/shop/password", b, "Could not change the password");
export const startPlan = (plan_id, items) =>
  post("/shop/start", { plan_id, items, success_url: `${base()}/meals/done`, cancel_url: `${base()}/meals/order` }, "Could not start the order");
export const confirmPayment = (ref) => get(`/shop/pay/confirm?ref=${encodeURIComponent(ref)}`, "Could not confirm the payment");
export const saveMeals = (delivery_date, items) => post("/shop/meals", { delivery_date, items }, "Could not save your meals");
export const skipWeek = (delivery_date, skip = true) => post("/shop/skip", { delivery_date, skip }, "Could not update the week");
export const manageSubscription = (b) => post("/shop/subscription", b, "Could not update your plan");
export const updateCard = () => post("/shop/card", { success_url: `${base()}/meals/account?tab=plan`, cancel_url: `${base()}/meals/account?tab=plan` }, "Could not open the card page");
export const confirmCard = (ref) => get(`/shop/card/confirm?ref=${encodeURIComponent(ref)}`, "Could not save the card");

export const DIET = { V: { label: "Veg", color: "success" }, N: { label: "Non-veg", color: "error" }, E: { label: "Egg", color: "warning" } };
export const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const cad = (n) => Number(n || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
export const niceDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", day: "numeric", month: "long" }) : "");
export const niceDateTime = (d) => {
  if (!d) return "";
  const [day, time] = String(d).split(" ");
  const t = new Date(`${day}T${time || "00:00"}:00`);
  return t.toLocaleString("en-CA", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};
/** Price for a plan + delivery fee with GST/QST (same formula as the server). */
export const priceFor = (plan, fee, tax) => {
  const r = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const base = Number(plan?.price || 0) + Number(fee || 0);
  const gst = tax?.taxable === "Y" ? r((base * Number(tax.gst_rate)) / 100) : 0;
  const qst = tax?.taxable === "Y" ? r((base * Number(tax.qst_rate)) / 100) : 0;
  return { subtotal: Number(plan?.price || 0), fee: Number(fee || 0), gst, qst, total: r(base + gst + qst) };
};

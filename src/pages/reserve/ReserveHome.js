import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, ButtonBase, CircularProgress, Grid, Stack, TextField, Typography } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useNavigate } from "react-router-dom";
import ReserveLayout, { Card, Eyebrow, GOLD, GRAD, ORANGE, SERIF } from "../../components/reserve/ReserveLayout";
import FloorMap from "../../components/reserve/FloorMap";
import {
  addDays, bestTables, dayOfWeek, longDate, reserveAvailability, reserveBook, reserveInfo, selectionStatus, time12,
} from "../../utilities/reserveApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (s) => String(s || "").replace(/\D/g, "");

const Step = ({ n, title, hint, children, innerRef }) => (
  <Box ref={innerRef} sx={{ "& + &": { mt: 4, pt: 4, borderTop: 1, borderColor: "divider" }, scrollMarginTop: 90 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box sx={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: "50%", background: GRAD, color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</Box>
      <Typography sx={{ fontFamily: SERIF, fontSize: 22, flexGrow: 1 }}>{title}</Typography>
      {hint && <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", display: { xs: "none", sm: "block" } }}>{hint}</Typography>}
    </Stack>
    {children}
  </Box>
);

const Label = ({ children, sx }) => (
  <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: ".3em", textTransform: "uppercase", color: GOLD, mb: 1.25, ...sx }}>{children}</Typography>
);

const Legend = ({ items }) => (
  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{ mb: 2, fontSize: 11, color: "text.secondary" }}>
    {items.map(([label, sx]) => (
      <Stack key={label} direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: "4px", ...sx }} /><span>{label}</span>
      </Stack>
    ))}
  </Stack>
);
const LG = {
  free: { bgcolor: "rgba(59,178,115,.18)", border: "1px solid #3BB273" },
  few: { bgcolor: "rgba(252,177,42,.16)", border: `1px solid ${GOLD}` },
  full: { background: "repeating-linear-gradient(45deg,#333 0 3px,#2a2a2a 3px 6px)", border: "1px solid #444" },
  sel: { background: GRAD },
  na: { bgcolor: "#222", border: "1px dashed #555" },
};

const ReserveHome = () => {
  document.title = "Reserve a table | Thanjai Restaurant";
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [date, setDate] = useState(null);
  const [guests, setGuests] = useState(2);
  const [avail, setAvail] = useState(null);
  const [seatingId, setSeatingId] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [pickNote, setPickNote] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", notes: "", website: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tablesRef = useRef(null);
  const timeRef = useRef(null);
  // phones: after each choice, glide to the next step so nobody has to hunt for it
  const isPhone = () => window.innerWidth < 900;
  const glide = (ref) => { if (isPhone()) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); };
  const detailsRef = useRef(null);

  useEffect(() => {
    reserveInfo().then((r) => { setInfo(r); setDate(r.today); }).catch((e) => setLoadErr(e.message));
  }, []);

  const loadAvail = useCallback(async (d) => {
    const r = await reserveAvailability(d);
    setAvail((prev) => (d === r.date ? r : prev));
    return r;
  }, []);

  // new date: load free tables, forget the time and tables
  useEffect(() => {
    if (!date) return;
    setAvail(null); setSeatingId(null); setChosen([]); setPickNote(""); setError("");
    loadAvail(date).catch((e) => setError(e.message));
  }, [date, loadAvail]);

  // live: refresh every 30 seconds and when the page comes back into view; drop tables someone else just took
  useEffect(() => {
    if (!date) return undefined;
    const refresh = () => { if (document.visibilityState === "visible") loadAvail(date).catch(() => {}); };
    const id = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(id); window.removeEventListener("focus", refresh); };
  }, [date, loadAvail]);

  const tables = useMemo(() => info?.tables || [], [info]);
  const byId = useMemo(() => Object.fromEntries(tables.map((t) => [t.table_id, t])), [tables]);
  const slot = avail?.seatings.find((s) => s.seating_id === seatingId) || null;
  const maxParty = info?.restaurant.max_party_online || 12;
  const bigParty = guests > maxParty;

  const freeFor = useCallback((s) => tables.filter((t) => !s.taken.includes(t.table_id)), [tables]);
  const fits = useCallback((s, g) => s.state === "open" && !!bestTables(freeFor(s), g, s.seats_left), [freeFor]);

  useEffect(() => {
    if (!slot) return;
    const lost = chosen.filter((id) => slot.taken.includes(id));
    if (lost.length) {
      setChosen((c) => c.filter((id) => !slot.taken.includes(id)));
      setNotice(`Sorry - ${lost.join(", ")} was just booked by someone else. Please choose another table.`);
    }
    if (slot.state !== "open") { setNotice(`${time12(slot.start_time)} is no longer available. Please choose another time.`); setSeatingId(null); setChosen([]); }
  }, [slot, chosen]);

  const suggest = (s, g) => {
    const best = bestTables(freeFor(s), g, s.seats_left);
    setChosen(best ? best.map((t) => t.table_id) : []);
    setPickNote(best ? `We picked ${best.map((t) => t.table_id).join(" + ")} for you${best.length > 1 ? " - our staff will put them together" : ""}. Tap the floor plan to change.` : "");
  };

  const pickSlot = (s) => {
    setSeatingId(s.seating_id); setNotice(""); setError("");
    suggest(s, guests);
    glide(tablesRef);
  };

  const pickGuests = (g) => {
    setGuests(g); setNotice(""); setError("");
    if (slot && g <= maxParty && fits(slot, g)) suggest(slot, g);
    else { setSeatingId(null); setChosen([]); setPickNote(""); if (g <= maxParty) glide(timeRef); }
  };

  const chosenTables = chosen.map((id) => byId[id]).filter(Boolean);
  const chairs = chosenTables.reduce((n, t) => n + t.seats, 0);
  const status = selectionStatus(chosenTables, guests);

  const stateOf = (t) => {
    if (!slot) return "disabled";
    if (slot.taken.includes(t.table_id)) return "taken";
    if (chosen.includes(t.table_id)) return "selected";
    if (t.seats > slot.seats_left) return "disabled";
    return "free";
  };
  const tipOf = (t, st) => ({
    taken: `${t.table_id} - already booked`,
    selected: `${t.table_id} · ${t.seats} chairs - your table (tap to remove)`,
    disabled: slot ? `${t.table_id} - not enough reservable seats left at this time` : "Choose a time first",
    free: `${t.table_id} · ${t.seats} chairs - tap to choose`,
  }[st]);

  const toggle = (t) => {
    setNotice(""); setPickNote("");
    if (chosen.includes(t.table_id)) { setChosen(chosen.filter((id) => id !== t.table_id)); return; }
    if (chairs >= guests) {
      if (t.seats >= guests && t.seats <= slot.seats_left) { setChosen([t.table_id]); return; } // swap to this table
      setNotice("You already have enough chairs. Tap one of your tables to remove it first.");
      return;
    }
    if (chairs + t.seats > slot.seats_left) { setNotice(`Only ${slot.seats_left} reservable seats are left at this time.`); return; }
    setChosen([...chosen, t.table_id]);
  };

  const fieldErr = {
    customer_name: !form.customer_name.trim() && "Enter your name",
    phone: digits(form.phone).length < 10 && "Enter a phone number we can reach you on",
    email: !EMAIL_RE.test(form.email.trim()) && "Enter a valid e-mail - your confirmation goes there",
  };
  const ready = !!slot && slot.state === "open" && status.ok && !bigParty;

  const submit = async () => {
    setTried(true); setError("");
    if (!ready) { setError(slot ? status.message : "Choose a time and a table first"); return; }
    if (Object.values(fieldErr).some(Boolean)) { detailsRef.current?.scrollIntoView({ behavior: "smooth" }); return; }
    setBusy(true);
    try {
      const r = await reserveBook({ booking_date: date, seating_id: seatingId, guests, table_ids: chosen, ...form });
      navigate(`/reserve/booking/${r.booking.manage_token}?new=1${r.email_sent ? "" : "&nomail=1"}`);
    } catch (e) {
      setError(e.message);
      if (e.refresh) loadAvail(date).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) return <ReserveLayout><Box sx={{ py: 8 }}><Alert severity="error">{loadErr}</Alert></Box></ReserveLayout>;
  if (!info) return <ReserveLayout><Box sx={{ py: 12, textAlign: "center" }}><CircularProgress /></Box></ReserveLayout>;
  const R = info.restaurant;
  const tel = (R.phone || "").replace(/[^\d+]/g, "");

  // dates the restaurant takes bookings
  const closedDays = Object.fromEntries(info.closed_days.map((c) => [c.date, c.reason]));
  const dates = [];
  for (let d = info.today; d <= info.last_date; d = addDays(d, 1)) dates.push(d);
  const dayOpen = (d) => !closedDays[d] && info.seatings.some((s) => s.weekdays.includes(String(dayOfWeek(d))));

  // seatings grouped (Lunch / Dinner)
  const groups = [];
  (avail?.seatings || []).forEach((s) => {
    const g = groups.find((x) => x.label === s.label);
    if (g) g.items.push(s); else groups.push({ label: s.label, items: [s] });
  });
  const openCount = (avail?.seatings || []).filter((s) => !bigParty && fits(s, guests)).length;

  return (
    <ReserveLayout restaurant={R}>
      <Box sx={{ textAlign: "center", pt: { xs: 5, sm: 8 }, pb: { xs: 4, sm: 5 } }}>
        <Eyebrow>Reservations</Eyebrow>
        <Typography component="h1" sx={{ fontFamily: SERIF, fontSize: { xs: 36, sm: 54 }, lineHeight: 1.15, mt: 2, mb: 1.5 }}>Choose Your Table</Typography>
        <Typography sx={{ color: "text.secondary", fontStyle: "italic", fontWeight: 300, maxWidth: 640, mx: "auto" }}>
          The authentic taste of South India. Pick a date and time, then choose your table on our floor plan - live, just like booking a seat.
        </Typography>
      </Box>

      {R.booking_open !== "Y" && <Alert severity="warning" sx={{ mb: 3 }}>Online booking is paused right now. Please call us at <a href={`tel:${tel}`} style={{ color: "inherit" }}>{R.phone}</a>.</Alert>}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          <Card>
            <Step n={1} title="When & how many?">
              <Label>Date</Label>
              <Box sx={{ display: "flex", gap: 1.25, overflowX: "auto", pb: 1, mx: { xs: -0.5, sm: 0 }, px: { xs: 0.5, sm: 0 } }}>
                {dates.map((d, i) => {
                  const open = dayOpen(d);
                  const sel = d === date;
                  const dt = new Date(`${d}T12:00:00`);
                  return (
                    <ButtonBase key={d} disabled={!open} onClick={() => setDate(d)} title={closedDays[d] || (open ? "" : "Closed")}
                      sx={{ flex: "0 0 66px", flexDirection: "column", borderRadius: "14px", py: 1.25, border: 1,
                        borderColor: sel ? "transparent" : "divider", background: sel ? GRAD : "#262626", color: sel ? "#fff" : "text.secondary",
                        opacity: open ? 1 : 0.35, "&:hover": { borderColor: open && !sel ? ORANGE : undefined } }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase" }}>{i === 0 ? "Today" : dt.toLocaleDateString("en-CA", { weekday: "short" })}</Typography>
                      <Typography sx={{ fontFamily: SERIF, fontSize: 24, lineHeight: 1.2, color: sel ? "#fff" : "text.primary", textDecoration: open ? "none" : "line-through" }}>{dt.getDate()}</Typography>
                      <Typography sx={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase" }}>{dt.toLocaleDateString("en-CA", { month: "short" })}</Typography>
                    </ButtonBase>
                  );
                })}
              </Box>
              <Label sx={{ mt: 3 }}>Guests</Label>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(7, 1fr)", sm: `repeat(${maxParty + 1}, 1fr)` }, gap: 1 }}>
                {Array.from({ length: maxParty + 1 }, (_, i) => i + 1).map((g) => (
                  <ButtonBase key={g} onClick={() => pickGuests(g)} aria-pressed={g === guests}
                    sx={{ aspectRatio: "1", minWidth: 0, borderRadius: "10px", fontWeight: 700, fontSize: 14, border: 1,
                      borderColor: g === guests ? "transparent" : "divider", background: g === guests ? GRAD : "#262626", "&:hover": { borderColor: g === guests ? undefined : ORANGE } }}>
                    {g > maxParty ? `${maxParty}+` : g}
                  </ButtonBase>
                ))}
              </Box>
              {bigParty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  For more than {maxParty} guests please call us at <a href={`tel:${tel}`} style={{ color: "inherit", fontWeight: 700 }}>{R.phone}</a> and we will arrange it,
                  or book our <a href="https://thanjaigroup.com/thanjai_montreal/party-hall-booking/" style={{ color: "inherit", fontWeight: 700 }}>Party Hall</a> (up to 70 guests).
                </Alert>
              )}
            </Step>

            <Step n={2} title="Pick a time" innerRef={timeRef} hint={avail && !bigParty ? `${openCount} time${openCount === 1 ? "" : "s"} open for ${guests} guest${guests === 1 ? "" : "s"} on ${longDate(date).split(",")[0]}` : ""}>
              <Legend items={[["Available", LG.free], ["Few seats left", LG.few], ["Fully booked / closed", LG.full], ["Your choice", LG.sel]]} />
              {!avail ? <CircularProgress size={24} /> : !avail.seatings.length ? (
                <Typography color="text.secondary">We are closed on this day. Please choose another date.</Typography>
              ) : groups.map((g) => (
                <Box key={g.label} sx={{ "& + &": { mt: 2.5 } }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: ".25em", textTransform: "uppercase", color: "text.secondary", mb: 1.25 }}>{g.label}</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" }, gap: 1 }}>
                    {g.items.map((s) => {
                      const ok = !bigParty && fits(s, guests);
                      const few = ok && s.seats_left <= 8;
                      const sel = s.seating_id === seatingId;
                      const sub = bigParty ? "Call us" : s.state === "full" ? "Full" : s.state !== "open" ? (s.state === "past" ? "Closed" : (s.reason || "Closed")) : !ok ? `Not for ${guests}` : few ? `${s.seats_left} seats left` : "Available";
                      const color = sel ? "#fff" : ok ? (few ? GOLD : "#3BB273") : "#666";
                      return (
                        <ButtonBase key={s.seating_id} disabled={!ok} onClick={() => pickSlot(s)} aria-pressed={sel}
                          sx={{ flexDirection: "column", borderRadius: "10px", py: 1.4, px: 0.5, border: "1px solid",
                            borderColor: sel ? "transparent" : ok ? (few ? GOLD : "#3BB273") : "#3a3a3a",
                            background: sel ? GRAD : ok ? (few ? "rgba(252,177,42,.08)" : "rgba(59,178,115,.10)") : "repeating-linear-gradient(45deg,#2b2b2b 0 4px,#252525 4px 8px)",
                            boxShadow: sel ? "0 8px 20px rgba(255,138,0,.35)" : "none", transition: "transform .15s",
                            "&:hover": { transform: ok ? "translateY(-2px)" : "none" } }}>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: ok || sel ? "#fff" : "#6a6a6a", textDecoration: s.state === "full" ? "line-through" : "none" }}>{time12(s.start_time)}</Typography>
                          <Typography sx={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color, mt: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{sub}</Typography>
                        </ButtonBase>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Step>

            <Step n={3} title="Choose your table" innerRef={tablesRef}
              hint={slot ? `${slot.seats_left} reservable seats left at ${time12(slot.start_time)}` : ""}>
              <Legend items={[["Free", LG.free], ["Booked", LG.full], ["Selected", LG.sel]]} />
              <Box sx={{ position: "relative" }}>
                <FloorMap dark tables={tables} decor={info.decor} stateOf={stateOf} onTableClick={slot ? toggle : undefined} tipOf={tipOf} />
                {!slot && (
                  <Box sx={{ position: "absolute", inset: 0, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(20,20,20,.72)", backdropFilter: "blur(2px)", color: "text.secondary", fontStyle: "italic", textAlign: "center", p: 2 }}>
                    Pick a time above to see which tables are free.
                  </Box>
                )}
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ color: status.ok ? "#3BB273" : slot ? GOLD : "text.secondary", fontWeight: 600 }}>
                  {slot ? status.message : "Tip: on a phone, slide the floor plan sideways to see every table."}
                </Typography>
                <Button variant="outlined" color="secondary" size="small" startIcon={<AutoFixHighIcon />} disabled={!slot} onClick={() => slot && suggest(slot, guests)} sx={{ borderRadius: 99, flexShrink: 0 }}>
                  Choose the best table for me
                </Button>
              </Stack>
              {pickNote && <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", fontStyle: "italic" }}>{pickNote}</Typography>}
              {slot && status.ok && (
                <Button fullWidth variant="outlined" color="secondary" onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  sx={{ display: { xs: "flex", md: "none" }, mt: 2, borderRadius: "10px" }}>Next: your details ↓</Button>
              )}
              {notice && <Alert severity="warning" sx={{ mt: 1.5 }} onClose={() => setNotice("")}>{notice}</Alert>}
            </Step>

            <Step n={4} title="Your details" innerRef={detailsRef}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><TextField label="Full name *" autoComplete="name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} error={tried && !!fieldErr.customer_name} helperText={tried && fieldErr.customer_name} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Phone *" type="tel" autoComplete="tel" placeholder="514 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={tried && !!fieldErr.phone} helperText={tried && fieldErr.phone} /></Grid>
                <Grid item xs={12}><TextField label="E-mail *" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={tried && !!fieldErr.email} helperText={(tried && fieldErr.email) || "We send your confirmation here"} /></Grid>
                <Grid item xs={12}><TextField label="Special requests (optional)" multiline minRows={2} placeholder="Birthday, high chair, allergies..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, 500) })} /></Grid>
              </Grid>
              {/* hidden from people; bots fill it in */}
              <Box component="input" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                sx={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0, fontSize: 16 }} />
            </Step>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3} sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
            <Card>
              <Typography sx={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: GOLD, pb: 1.5, mb: 1, borderBottom: 1, borderColor: "divider" }}>Your Booking</Typography>
              {[["Date", date ? longDate(date).replace(/, \d{4}$/, "") : null, "Choose a date"],
                ["Guests", bigParty ? `${maxParty}+ - please call` : `${guests} guest${guests === 1 ? "" : "s"}`],
                ["Time", slot ? `${time12(slot.start_time)} · ${slot.label}` : null, "Choose a time"],
                ["Table", chosen.length ? `${chosen.join(" + ")} · ${chairs} chairs` : null, "Choose a table"]].map(([k, v, ph]) => (
                <Box key={k} sx={{ py: 1.2, borderBottom: "1px dashed", borderColor: "divider" }}>
                  <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "text.secondary" }}>{k}</Typography>
                  <Typography sx={{ fontWeight: v ? 600 : 400, fontStyle: v ? "normal" : "italic", color: v ? "text.primary" : "#666" }}>{v || ph}</Typography>
                </Box>
              ))}
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button fullWidth size="large" onClick={submit} disabled={busy || R.booking_open !== "Y"}
                sx={{ mt: 2.5, py: 2, borderRadius: 3, background: GRAD, color: "#fff", fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", fontSize: 12,
                  boxShadow: "0 10px 26px rgba(255,138,0,.28)", opacity: ready ? 1 : 0.55, "&:hover": { background: GRAD } }}>
                {busy ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Reserve now"}
              </Button>
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "text.secondary", mt: 1.25 }}>
                Confirmed instantly · free to cancel online until {info.restaurant.cancel_notice_minutes >= 60 ? `${Math.round(info.restaurant.cancel_notice_minutes / 60)} hour${info.restaurant.cancel_notice_minutes >= 120 ? "s" : ""}` : `${info.restaurant.cancel_notice_minutes} minutes`} before
              </Typography>
            </Card>
            <Card>
              <Typography sx={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: GOLD, pb: 1.5, mb: 2, borderBottom: 1, borderColor: "divider" }}>Guest Information</Typography>
              <Stack spacing={1.5} sx={{ color: "text.secondary", fontSize: 13.5, fontWeight: 300 }}>
                {[`Your table is yours for about ${R.seating_minutes} minutes.`, ...R.guest_notes].map((t) => (
                  <Stack key={t} direction="row" spacing={1.5}><Box sx={{ width: 6, height: 6, mt: "8px", flex: "0 0 6px", borderRadius: "50%", bgcolor: ORANGE }} /><span>{t}</span></Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {/* phones: summary + Reserve always in reach */}
      {slot && (
        <Box sx={{ display: { xs: "flex", md: "none" }, position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, gap: 1.5, alignItems: "center",
          px: 2, pt: 1.25, pb: "calc(10px + env(safe-area-inset-bottom))", bgcolor: "rgba(20,20,20,.96)", borderTop: `1px solid ${ORANGE}`, backdropFilter: "blur(6px)" }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>{new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {time12(slot.start_time)} · {guests} guests</Typography>
            <Typography noWrap sx={{ fontSize: 12, color: status.ok ? "#3BB273" : GOLD }}>{chosen.length ? `Table ${chosen.join(" + ")}` : "Choose a table"}</Typography>
          </Box>
          <Button onClick={submit} disabled={busy} sx={{ px: 3, borderRadius: "10px", background: GRAD, color: "#fff", fontWeight: 800, "&:hover": { background: GRAD }, opacity: ready ? 1 : 0.6 }}>
            {busy ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Reserve"}
          </Button>
        </Box>
      )}
      {slot && <Box sx={{ height: { xs: 72, md: 0 } }} />}
    </ReserveLayout>
  );
};

export default ReserveHome;

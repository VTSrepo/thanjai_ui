import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, ButtonBase, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  FormControl, FormControlLabel, Grid, IconButton, InputAdornment, InputLabel, LinearProgress, List, ListItemButton, Menu, MenuItem,
  Select, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import PhoneIcon from "@mui/icons-material/Phone";
import BlockIcon from "@mui/icons-material/Block";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { Link, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import FloorMap from "../../components/reserve/FloorMap";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { createRes, getResDay, searchRes, setResStatus, updateRes } from "../../utilities/service";
import { STATUS, addDays, longDate, shortDate, time12 } from "../../utilities/reserveApi";

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const chairsOf = (ids, byId) => ids.reduce((n, id) => n + (byId[id]?.seats || 0), 0);
const toMin = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + m; };
/** Tables held at any 15-minute step between start and start + minutes (from the day's bookings). */
export const busyTables = (day, date, start, minutes, except) => {
  const busy = {};
  const from = toMin(start);
  const to = from + minutes;
  (day?.bookings || []).filter((b) => b.booking_date === date && b.status !== "X" && b.booking_id !== except).forEach((b) => {
    const bs = toMin(b.start_time);
    if (bs < to && bs + b.duration_min > from) b.tables.forEach((t) => { busy[t] = b.booking_id; });
  });
  return busy;
};

export const Tile = ({ label, value, sub, color, progress }) => (
  <Card sx={{ height: "100%" }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
    {progress !== undefined && <LinearProgress variant="determinate" value={Math.min(progress, 100)} color={progress >= 100 ? "error" : progress >= 80 ? "warning" : "success"} sx={{ mt: 0.75, height: 6, borderRadius: 3 }} />}
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
  </CardContent></Card>
);

// ---------------------------------------------------------------- booking dialog (new / change)
const BookingDialog = ({ open, mode, day, seating, time, initial, onClose, onSaved }) => {
  const toast = useToast();
  const [v, setV] = useState(null);
  const [target, setTarget] = useState(null); // day data for the chosen date (a change can move to another date)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setTarget(day);
    setV({
      kind: initial.kind || "C", booking_date: initial.booking_date || day.date, seating_id: initial.seating_id || seating.seating_id,
      start_time: initial.start_time || time, duration_min: initial.duration_min || day.settings.seating_minutes,
      guests: initial.guests || "", table_ids: initial.tables || [], customer_name: initial.customer_name || "", phone: initial.phone || "",
      email: initial.email || "", notes: initial.notes || "", staff_note: initial.staff_note || "", send_email: true, notify: true,
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !v || v.booking_date === target?.date) return;
    getResDay(v.booking_date).then(setTarget).catch((e) => setErr(e.message));
  }, [open, v, target]);

  if (!open || !v) return null;
  const d = target || day;
  const tables = d.tables.filter((t) => t.status === "A" || v.table_ids.includes(t.table_id));
  const byId = Object.fromEntries(tables.map((t) => [t.table_id, t]));
  const sess = d.seatings.find((s) => s.seating_id === v.seating_id);
  const times = sess ? sess.slots.map((z) => z.time) : [];
  if (v.start_time && !times.includes(v.start_time)) times.push(v.start_time);
  const takenBy = d.date === v.booking_date ? busyTables(d, v.booking_date, v.start_time, Number(v.duration_min) || 90, mode === "edit" ? initial.booking_id : null) : {};
  const chairs = chairsOf(v.table_ids, byId);
  const block = v.kind === "B";
  const allocating = mode === "edit" && initial.needs_tables && v.table_ids.length > 0;
  const soloPicked = v.table_ids.length > 1 ? v.table_ids.filter((id) => byId[id]?.joinable === "N") : [];

  const save = async () => {
    setErr("");
    setBusy(true);
    try {
      const body = { ...v, guests: block ? undefined : Number(v.guests), duration_min: Number(v.duration_min) };
      const r = mode === "edit" ? await updateRes({ ...body, booking_id: initial.booking_id }) : await createRes(body);
      toast.success(r.message);
      onSaved();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "edit" ? (initial.needs_tables ? `Allocate tables - ${initial.booking_id}` : `Change ${initial.booking_id}`) : block ? "Block tables" : "New booking"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {mode === "create" && (
            <ToggleButtonGroup exclusive size="small" value={v.kind} onChange={(e, k) => k && setV({ ...v, kind: k })}>
              <ToggleButton value="C"><PhoneIcon fontSize="small" sx={{ mr: 0.75 }} />Customer booking (phone / walk-up)</ToggleButton>
              <ToggleButton value="B"><BlockIcon fontSize="small" sx={{ mr: 0.75 }} />Staff block</ToggleButton>
            </ToggleButtonGroup>
          )}
          {block && <Alert severity="info" sx={{ py: 0 }}>A block holds these tables so no one can book them online. It counts toward the reservation limit.</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Date" type="date" value={v.booking_date} onChange={(e) => setV({ ...v, booking_date: e.target.value, table_ids: [] })} InputLabelProps={{ shrink: true }} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Session</InputLabel>
              <Select label="Session" value={d.seatings.some((s) => s.seating_id === v.seating_id) ? v.seating_id : ""}
                onChange={(e) => { const s2 = d.seatings.find((s) => s.seating_id === e.target.value); setV({ ...v, seating_id: e.target.value, start_time: s2?.slots[0]?.time, table_ids: [] }); }}>
                {d.seatings.map((s) => <MenuItem key={s.seating_id} value={s.seating_id}>{s.label}{s.closed ? ` · closed online (${s.closed})` : ""}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Time</InputLabel>
              <Select label="Time" value={v.start_time || ""} onChange={(e) => setV({ ...v, start_time: e.target.value })}>
                {times.map((t) => <MenuItem key={t} value={t}>{time12(t)}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            {!block && <TextField label="Guests" type="number" value={v.guests} onChange={set("guests")} inputProps={{ min: 1, max: 200 }} sx={{ width: 120 }} />}
            <TextField label="Table time (minutes)" type="number" value={v.duration_min} onChange={set("duration_min")} inputProps={{ min: 15, step: 15 }} sx={{ width: 180 }} helperText="How long the tables are held" />
          </Stack>
          <Autocomplete multiple options={tables.map((t) => t.table_id)} value={v.table_ids} disableCloseOnSelect
            onChange={(e, ids) => setV({ ...v, table_ids: ids })}
            getOptionDisabled={(id) => !!takenBy[id]}
            getOptionLabel={(id) => `${id} · ${byId[id]?.seats || "?"} chairs${takenBy[id] ? " (booked)" : ""}${byId[id]?.joinable === "N" ? " · cannot be joined" : ""}${byId[id]?.online === "N" ? " · staff only" : ""}`}
            renderInput={(p) => <TextField {...p} label={block ? "Tables" : "Tables (leave empty to allocate later)"}
              helperText={soloPicked.length ? `${soloPicked.join(", ")} cannot be joined with other tables` : `${chairs} chairs chosen${!block && v.guests ? ` for ${v.guests} guests` : ""}`}
              error={!!soloPicked.length || (!block && v.guests && v.table_ids.length > 0 && chairs < Number(v.guests))} />}
          />
          <Divider />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label={block ? "What is it for? (e.g. Office party hold)" : "Name *"} value={v.customer_name} onChange={set("customer_name")} fullWidth />
            <TextField label="Phone" value={v.phone} onChange={set("phone")} fullWidth />
          </Stack>
          {!block && <TextField label="E-mail (confirmation goes here)" value={v.email} onChange={set("email")} />}
          {!block && <TextField label="Customer's request" value={v.notes} onChange={set("notes")} multiline />}
          <TextField label="Staff note (not shown to the customer)" value={v.staff_note} onChange={set("staff_note")} multiline />
          {mode === "create" && !block && (
            <FormControlLabel control={<Checkbox checked={v.send_email} onChange={(e) => setV({ ...v, send_email: e.target.checked })} />} label="E-mail the confirmation (customer, if e-mail given, and the restaurant)" />
          )}
          {allocating && (
            <FormControlLabel control={<Checkbox checked={v.notify} onChange={(e) => setV({ ...v, notify: e.target.checked })} />} label={`E-mail ${v.email || "the guest"} their table number(s)`} disabled={!v.email} />
          )}
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" onClick={save} disabled={busy || (block && !v.table_ids.length)}>{mode === "edit" ? (allocating ? "Allocate tables" : "Save changes") : block ? "Block tables" : "Book"}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------- one booking in the list
const BookingRow = ({ b, canEdit, onAction, highlight, onAllocate }) => {
  const [anchor, setAnchor] = useState(null);
  const block = b.kind === "B";
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: highlight ? "primary.main" : b.needs_tables && b.status !== "X" ? "warning.main" : "divider", bgcolor: block ? "#faf5fc" : b.status === "X" ? "#fafafa" : "background.paper", opacity: b.status === "X" ? 0.6 : 1 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${time12(b.start_time)}-${time12(b.end_time)}`} variant="outlined" />
            <Typography fontWeight={700} noWrap>{block ? `Block · ${b.customer_name}` : b.customer_name}</Typography>
            {!block && <Chip size="small" label={`${b.guests} guests`} />}
            {block ? <Chip size="small" color="secondary" variant="outlined" label="Staff block" /> : <Chip size="small" color={STATUS[b.status].color} label={STATUS[b.status].label} />}
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {b.needs_tables ? <b style={{ color: "#b25e00" }}>Tables to allocate</b> : <b>{b.tables.join(" + ")}</b>}{b.needs_tables ? "" : ` · ${b.seats} chairs`} · {b.booking_id}{b.source === "S" ? " · by staff" : " · online"}
          </Typography>
          {(b.phone || b.email) && <Typography variant="caption" color="text.secondary" component="div">{[b.phone, b.email].filter(Boolean).join(" · ")}</Typography>}
          {b.notes && <Typography variant="caption" component="div" sx={{ color: "#8a4a00" }}>Request: {b.notes}</Typography>}
          {b.staff_note && <Typography variant="caption" component="div" color="text.secondary">Staff: {b.staff_note}</Typography>}
          {b.status === "X" && <Typography variant="caption" component="div" color="text.secondary">Cancelled by {b.cancelled_by}{b.cancel_reason ? ` - ${b.cancel_reason}` : ""}</Typography>}
          {canEdit && b.needs_tables && b.status !== "X" && (
            <Button size="small" variant="contained" color="warning" startIcon={<TableRestaurantIcon />} sx={{ mt: 1 }} onClick={() => onAllocate(b)}>Allocate tables</Button>
          )}
        </Box>
        {canEdit && b.status !== "X" && (
          <>
            <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Actions"><MoreVertIcon /></IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              {!block && b.status !== "A" && <MenuItem onClick={() => { setAnchor(null); onAction("A", b); }}>Arrived (seated)</MenuItem>}
              {!block && b.status !== "N" && <MenuItem onClick={() => { setAnchor(null); onAction("N", b); }}>No-show</MenuItem>}
              {!block && b.status !== "C" && <MenuItem onClick={() => { setAnchor(null); onAction("C", b); }}>Back to confirmed</MenuItem>}
              <MenuItem onClick={() => { setAnchor(null); onAction("edit", b); }}>Change date / time / tables / details</MenuItem>
              <MenuItem onClick={() => { setAnchor(null); onAction("X", b); }} sx={{ color: "error.main" }}>{block ? "Remove block (free tables)" : "Cancel booking"}</MenuItem>
            </Menu>
          </>
        )}
      </Stack>
    </Box>
  );
};

// ---------------------------------------------------------------- screen
const Reservations = () => {
  document.title = `Reservations | ${CONFIG.title.name}`;
  const toast = useToast();
  const { can } = useUser();
  const canEdit = can("RES_BOOKINGS", true);
  const [params, setParams] = useSearchParams();
  const [date, setDate] = useState(params.get("date") || localToday());
  const [seatingId, setSeatingId] = useState(params.get("seating") || null);
  const [time, setTime] = useState(params.get("time") || null);
  const [day, setDay] = useState(null);
  const [selected, setSelected] = useState([]);
  const [allocating, setAllocating] = useState(null); // booking waiting for tables, being allocated on the plan
  const [focus, setFocus] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [cancelAsk, setCancelAsk] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [q, setQ] = useState("");
  const [found, setFound] = useState(null);

  const load = useCallback((quiet) => {
    if (!quiet) setDay(null);
    return getResDay(date).then((d) => {
      setDay(d);
      setSeatingId((cur) => {
        const keep = d.seatings.find((s) => s.seating_id === cur);
        const pick = keep || d.seatings.find((s) => s.peak_seats > 0) || d.seatings[0];
        setTime((t) => (pick && pick.slots.some((z) => z.time === t) ? t : (pick?.slots.find((z) => z.reserved_seats > 0) || pick?.slots[0])?.time || null));
        return pick?.seating_id || null;
      });
    }).catch((e) => toast.error(e.message));
  }, [date, toast]);
  useEffect(() => { load(); setSelected([]); setAllocating(null); }, [load]);
  useEffect(() => { const id = setInterval(() => document.visibilityState === "visible" && load(true), 30000); return () => clearInterval(id); }, [load]);
  useEffect(() => { setParams({ date, ...(seatingId ? { seating: seatingId } : {}), ...(time ? { time } : {}) }, { replace: true }); }, [date, seatingId, time, setParams]);

  const session = day?.seatings.find((s) => s.seating_id === seatingId) || null;
  const slot = session?.slots.find((z) => z.time === time) || null;
  const dur = allocating ? allocating.duration_min : day?.settings.seating_minutes || 90;
  const byId = useMemo(() => Object.fromEntries((day?.tables || []).map((t) => [t.table_id, t])), [day]);
  const byBooking = useMemo(() => Object.fromEntries((day?.bookings || []).map((b) => [b.booking_id, b])), [day]);
  const sessionBookings = useMemo(() => (day?.bookings || []).filter((b) => b.seating_id === seatingId).sort((a, b) => a.start_time.localeCompare(b.start_time)), [day, seatingId]);
  const toAllocate = (day?.bookings || []).filter((b) => b.needs_tables && b.status !== "X" && b.kind === "C");
  const totalChairs = (day?.tables || []).filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);
  // tables not free for a booking starting at the chosen time (for its table time)
  const busyNow = useMemo(() => (slot ? busyTables(day, date, time, dur, allocating?.booking_id) : {}), [day, date, time, dur, slot, allocating]);

  const bookingAt = (t) => (slot?.at[t.table_id] ? byBooking[slot.at[t.table_id]] : null);
  const stateOf = (t) => {
    if (!slot) return "disabled";
    const b = bookingAt(t);
    if (b) return b.kind === "B" ? "blocked" : b.status === "A" ? "arrived" : b.status === "N" ? "noshow" : "booked";
    if (selected.includes(t.table_id)) return "selected";
    if (t.status !== "A" || busyNow[t.table_id]) return "disabled";
    if (allocating && selected.length && (t.joinable === "N" || selected.some((x) => byId[x]?.joinable === "N"))) return "disabled";
    return "free";
  };
  const captionOf = (t) => {
    const b = bookingAt(t);
    if (b) return b.kind === "B" ? "Block" : `${String(b.customer_name || "").split(" ")[0]} · ${b.guests}`;
    const later = busyNow[t.table_id] && byBooking[busyNow[t.table_id]];
    return later ? `from ${later.start_time}` : null;
  };
  const tipOf = (t, st) => {
    const b = bookingAt(t);
    if (b) return `${t.table_id}: ${b.kind === "B" ? `Staff block - ${b.customer_name}` : `${b.customer_name}, ${b.guests} guests (${b.tables.join("+")})`} · ${time12(b.start_time)}-${time12(b.end_time)}`;
    const later = busyNow[t.table_id] && byBooking[busyNow[t.table_id]];
    if (later) return `${t.table_id} is free now but booked from ${time12(later.start_time)} (${later.customer_name}) - not free for ${dur} minutes`;
    if (st === "selected") return `${t.table_id} selected - click to remove`;
    return `${t.table_id} · ${t.seats} chairs${t.joinable === "N" ? " · cannot be joined" : ""}${t.online === "N" ? " · staff only" : ""} - ${canEdit ? "click to select" : "free"}`;
  };
  const clickTable = (t) => {
    const b = bookingAt(t);
    if (b) { setFocus(b.booking_id); document.getElementById(`bk-${b.booking_id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    if (!canEdit) return;
    setSelected((s) => {
      if (s.includes(t.table_id)) return s.filter((x) => x !== t.table_id);
      if (t.joinable === "N" || s.some((x) => byId[x]?.joinable === "N")) { if (s.length) toast.info(`${t.joinable === "N" ? t.table_id : s.find((x) => byId[x]?.joinable === "N")} cannot be joined with other tables`); return [t.table_id]; }
      return [...s, t.table_id];
    });
  };

  const startAllocate = (b) => {
    setAllocating(b); setSelected([]); setDate(b.booking_date); setSeatingId(b.seating_id); setTime(b.start_time); setFocus(b.booking_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saveAllocate = async () => {
    try {
      const r = await updateRes({ booking_id: allocating.booking_id, table_ids: selected, notify: true });
      toast.success(r.message); setAllocating(null); setSelected([]); load(true);
    } catch (e) { toast.error(e.message); }
  };

  const act = async (what, b) => {
    if (what === "edit") { setDialog({ mode: "edit", initial: b }); return; }
    if (what === "X") { setCancelAsk({ b, reason: "", notify: !!b.email }); return; }
    try { const r = await setResStatus({ booking_id: b.booking_id, status: what }); toast.success(r.message); load(true); }
    catch (e) { toast.error(e.message); }
  };
  const doCancel = async () => {
    try {
      const r = await setResStatus({ booking_id: cancelAsk.b.booking_id, status: "X", reason: cancelAsk.reason, notify: cancelAsk.notify });
      toast.success(r.message); setCancelAsk(null); load(true);
    } catch (e) { toast.error(e.message); }
  };
  const search = async () => {
    if (q.trim().length < 2) { setFound(null); return; }
    try { setFound((await searchRes(q.trim())).bookings); } catch (e) { toast.error(e.message); }
  };

  const selChairs = chairsOf(selected, byId);
  const listed = sessionBookings.filter((b) => showCancelled || b.status !== "X");
  const atNow = (b) => slot && b.status !== "X" && toMin(b.start_time) <= toMin(time) && toMin(b.start_time) + b.duration_min > toMin(time);
  const nowChairs = slot ? slot.reserved_seats : 0;

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
        <PageHeader title="Reservations" subtitle="Floor plan by time, bookings, staff blocks and tables to allocate - updates every 30 seconds"
          action={<Stack direction="row" spacing={1}>
            {canEdit && session && slot && !allocating && (
              <Button variant="contained" startIcon={<EventSeatIcon />} onClick={() => setDialog({ mode: "create", initial: { kind: "C", tables: [], guests: "" } })}>New booking</Button>
            )}
            <Button component={Link} to={`/reservations/reports?date=${date}`} startIcon={<PrintIcon />}>Reports</Button>
          </Stack>} />
        {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>View only - your role cannot add or change bookings (Master → Role: give RES_BOOKINGS edit rights).</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeftIcon /></IconButton>
            <TextField type="date" size="small" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} sx={{ width: 170 }} />
            <IconButton onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRightIcon /></IconButton>
            <Button size="small" onClick={() => setDate(localToday())}>Today</Button>
          </Stack>
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{longDate(date)}</Typography>
          <TextField size="small" placeholder="Find booking: name, phone, e-mail, no." value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()} sx={{ minWidth: { md: 320 } }}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={search}><SearchIcon /></IconButton></InputAdornment> }} />
        </Stack>

        {found && (
          <Card sx={{ mb: 2 }}><CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700}>{found.length} booking(s) found</Typography><Button size="small" onClick={() => setFound(null)}>Close</Button></Stack>
            <List dense>
              {found.map((b) => (
                <ListItemButton key={b.booking_id} onClick={() => { setDate(b.booking_date); setSeatingId(b.seating_id); setTime(b.start_time); setFocus(b.booking_id); setFound(null); }}>
                  <Typography variant="body2"><b>{b.customer_name}</b> · {shortDate(b.booking_date)} {time12(b.start_time)} · {b.guests} guests · {b.needs_tables ? "tables to allocate" : b.tables.join("+")} · {b.booking_id} · {STATUS[b.status].label}</Typography>
                </ListItemButton>
              ))}
            </List>
          </CardContent></Card>
        )}

        {day && toAllocate.length > 0 && !allocating && (
          <Alert severity="warning" icon={<TableRestaurantIcon />} sx={{ mb: 2 }}>
            <b>{toAllocate.length} booking{toAllocate.length > 1 ? "s" : ""} waiting for tables:</b>{" "}
            {toAllocate.map((b) => (
              <Button key={b.booking_id} size="small" color="warning" onClick={() => startAllocate(b)} sx={{ ml: 0.5 }}>{time12(b.start_time)} {b.customer_name} ({b.guests})</Button>
            ))}
          </Alert>
        )}

        {!day ? <Loader inline /> : !day.seatings.length ? <Alert severity="info">No sessions on this day. Add or change sessions in Reservations → Reservation setup.</Alert> : (
          <>
            <Tabs value={seatingId || false} onChange={(e, v) => { const s2 = day.seatings.find((s) => s.seating_id === v); setSeatingId(v); setTime(s2?.slots[0]?.time); setSelected([]); setFocus(null); }} sx={{ mb: 1.5, borderBottom: 1, borderColor: "divider" }}>
              {day.seatings.map((s) => (
                <Tab key={s.seating_id} value={s.seating_id} sx={{ alignItems: "flex-start", textAlign: "left" }} label={
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>{s.label} {time12(s.start_time)}-{time12(s.end_time)}</Typography>
                    <Typography fontSize={12} color="text.secondary">{s.bookings} bookings · {s.guests} guests{s.to_allocate ? ` · ${s.to_allocate} to allocate` : ""}{s.closed ? " · closed online" : ""}</Typography>
                  </Box>} />
              ))}
            </Tabs>

            {session && (
              <>
                {/* start times: reserved chairs at each time */}
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2 }}>
                  {session.slots.map((z) => {
                    const sel = z.time === time;
                    const pct = z.reserved_seats / session.max_reserved_seats;
                    return (
                      <ButtonBase key={z.time} onClick={() => { setTime(z.time); if (!allocating) setSelected([]); }}
                        sx={{ flex: "0 0 82px", flexDirection: "column", py: 1, borderRadius: 2, border: 2, borderColor: sel ? "primary.main" : "divider",
                          bgcolor: sel ? "#fff4e6" : pct >= 1 ? "#fdeaea" : pct >= 0.8 ? "#fff8e1" : "background.paper" }}>
                        <Typography fontWeight={800} fontSize={14}>{time12(z.time)}</Typography>
                        <Typography fontSize={11} color={pct >= 1 ? "error.main" : "text.secondary"}>{z.reserved_seats}/{session.max_reserved_seats}</Typography>
                        {z.bookings > 0 && <Typography fontSize={10} color="primary.dark">{z.bookings} arriving</Typography>}
                      </ButtonBase>
                    );
                  })}
                </Box>
                {session.closed && <Alert severity="warning" sx={{ mb: 2 }}>Closed for online booking: {session.closed}. Staff can still add bookings.</Alert>}
                {allocating && (
                  <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => { setAllocating(null); setSelected([]); }}>Stop</Button>}>
                    Allocating tables for <b>{allocating.customer_name}</b> - {allocating.guests} guests at {time12(allocating.start_time)} ({allocating.booking_id}). Click free tables on the plan, then <b>Allocate</b> below. The guest is e-mailed the table numbers.
                  </Alert>
                )}
                {slot && (
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid item xs={6} md={3}><Tile label={`Reserved at ${time12(time)}`} value={`${nowChairs} / ${session.max_reserved_seats}`} progress={(nowChairs / session.max_reserved_seats) * 100} sub={slot.seats_left ? `${slot.seats_left} can still be booked from ${time12(time)}` : `Full for a booking from ${time12(time)}`} /></Grid>
                    <Grid item xs={6} md={3}><Tile label="Free for walk-ins now" value={Math.max(totalChairs - nowChairs, 0)} sub={`of ${totalChairs} chairs in the room`} /></Grid>
                    <Grid item xs={6} md={3}><Tile label={`Arriving at ${time12(time)}`} value={`${slot.bookings} · ${slot.guests} guests`} /></Grid>
                    <Grid item xs={6} md={3}><Tile label={`${session.label} total`} value={`${session.bookings} · ${session.guests} guests`} sub={session.to_allocate ? `${session.to_allocate} waiting for tables` : `${session.blocked_seats} chairs blocked by staff`} /></Grid>
                  </Grid>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} lg={8}>
                    <FloorMap tables={day.tables.filter((t) => t.status === "A" || slot?.at[t.table_id])} decor={day.decor} stateOf={stateOf} captionOf={captionOf} tipOf={tipOf} onTableClick={clickTable} />
                    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                      {[["Free", "#ecf8f1", "#3BB273"], ["Booked", "#fff1de", "#ff8a00"], ["Arrived", "#e3f0fd", "#1976d2"], ["No-show", "#fdeaea", "#d32f2f"], ["Staff block", "#efe3f5", "#7b1fa2"], ["Selected", "#ffb347", "#ff8a00"], ["Booked later (from …)", "#f5f5f5", "#c8c8c8"]].map(([l, bg, bd]) => (
                        <Stack key={l} direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 14, bgcolor: bg, border: `1.5px solid ${bd}`, borderRadius: 1 }} /><span>{l}</span></Stack>
                      ))}
                    </Stack>
                    {canEdit && slot && (
                      <Card sx={{ mt: 1.5, borderColor: selected.length ? "primary.main" : "divider" }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                          <Typography sx={{ flexGrow: 1 }} variant="body2">
                            {selected.length
                              ? <><b>{selected.join(" + ")}</b> selected · {selChairs} chairs{allocating ? ` for ${allocating.guests} guests` : ""} · {time12(time)} for {dur} min</>
                              : allocating ? `Click free tables for ${allocating.guests} guests.` : `Click free tables to book them at ${time12(time)} for a phone guest or block them - or book without tables and allocate later.`}
                          </Typography>
                          {allocating ? (
                            <Button variant="contained" color="warning" startIcon={<TableRestaurantIcon />} disabled={!selected.length || selChairs < allocating.guests} onClick={saveAllocate}>Allocate &amp; e-mail guest</Button>
                          ) : (
                            <>
                              <Button variant="contained" startIcon={<EventSeatIcon />} onClick={() => setDialog({ mode: "create", initial: { kind: "C", tables: selected, guests: selChairs || "" } })}>{selected.length ? "Book these tables" : "Book without tables"}</Button>
                              <Button variant="outlined" color="secondary" startIcon={<BlockIcon />} disabled={!selected.length} onClick={() => setDialog({ mode: "create", initial: { kind: "B", tables: selected } })}>Block</Button>
                            </>
                          )}
                          {selected.length > 0 && <Button onClick={() => setSelected([])}>Clear</Button>}
                        </Stack>
                      </CardContent></Card>
                    )}
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{session.label} bookings</Typography>
                      <FormControlLabel control={<Checkbox size="small" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />} label={<Typography variant="body2">Show cancelled</Typography>} />
                    </Stack>
                    <Stack spacing={1}>
                      {!listed.length && <Typography variant="body2" color="text.secondary">No bookings yet for this session.</Typography>}
                      {listed.map((b) => (
                        <Box key={b.booking_id} id={`bk-${b.booking_id}`}>
                          <BookingRow b={b} canEdit={canEdit} onAction={act} onAllocate={startAllocate} highlight={focus === b.booking_id || atNow(b)} />
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </>
            )}
          </>
        )}
      </Box>

      {day && session && dialog && (
        <BookingDialog open mode={dialog.mode} day={day} seating={session} time={time} initial={dialog.initial}
          onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setSelected([]); load(true); }} />
      )}
      <Dialog open={!!cancelAsk} onClose={() => setCancelAsk(null)} fullWidth maxWidth="xs">
        <DialogTitle>{cancelAsk?.b.kind === "B" ? "Remove this block?" : `Cancel ${cancelAsk?.b.booking_id}?`}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{cancelAsk?.b.tables.length ? `Tables ${cancelAsk.b.tables.join(" + ")} become free for other guests.` : "The seats become free for other guests."}</Typography>
          {cancelAsk?.b.kind !== "B" && (
            <>
              <TextField fullWidth label="Reason (optional)" value={cancelAsk?.reason || ""} onChange={(e) => setCancelAsk({ ...cancelAsk, reason: e.target.value })} />
              {cancelAsk?.b.email && (
                <Tooltip title={cancelAsk.b.email}><FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={cancelAsk.notify} onChange={(e) => setCancelAsk({ ...cancelAsk, notify: e.target.checked })} />} label="E-mail the customer" /></Tooltip>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelAsk(null)}>Back</Button>
          <Button color="error" variant="contained" onClick={doCancel}>{cancelAsk?.b.kind === "B" ? "Remove block" : "Cancel booking"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Reservations;

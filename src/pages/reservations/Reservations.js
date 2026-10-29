import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
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

export const Tile = ({ label, value, sub, color, progress }) => (
  <Card sx={{ height: "100%" }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
    {progress !== undefined && <LinearProgress variant="determinate" value={Math.min(progress, 100)} color={progress >= 100 ? "error" : progress >= 80 ? "warning" : "success"} sx={{ mt: 0.75, height: 6, borderRadius: 3 }} />}
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
  </CardContent></Card>
);

// ---------------------------------------------------------------- booking dialog (new / change)
const BookingDialog = ({ open, mode, day, seating, initial, onClose, onSaved }) => {
  const toast = useToast();
  const [v, setV] = useState(null);
  const [target, setTarget] = useState(null); // day data for the chosen date (edit can move to another date)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setTarget(day);
    setV({
      kind: initial.kind || "C", booking_date: initial.booking_date || day.date, seating_id: initial.seating_id || seating.seating_id,
      guests: initial.guests || "", table_ids: initial.tables || [], customer_name: initial.customer_name || "", phone: initial.phone || "",
      email: initial.email || "", notes: initial.notes || "", staff_note: initial.staff_note || "", send_email: true,
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !v || v.booking_date === target?.date) return;
    getResDay(v.booking_date).then(setTarget).catch((e) => setErr(e.message));
  }, [open, v, target]);

  if (!open || !v) return null;
  const tables = (target || day).tables.filter((t) => t.status === "A" || v.table_ids.includes(t.table_id));
  const byId = Object.fromEntries(tables.map((t) => [t.table_id, t]));
  const slot = (target || day).seatings.find((s) => s.seating_id === v.seating_id);
  const takenBy = slot?.taken || {};
  const freeFor = (id) => !takenBy[id] || (mode === "edit" && takenBy[id] === initial.booking_id);
  const chairs = chairsOf(v.table_ids, byId);
  const ownSeats = mode === "edit" && slot && initial.seating_id === v.seating_id && initial.booking_date === v.booking_date ? initial.seats : 0;
  const left = slot ? slot.seats_left + ownSeats : 0;
  const block = v.kind === "B";

  const save = async () => {
    setErr("");
    setBusy(true);
    try {
      const body = { ...v, guests: block ? undefined : Number(v.guests) };
      const r = mode === "edit" ? await updateRes({ ...body, booking_id: initial.booking_id }) : await createRes(body);
      toast.success(r.message);
      onSaved();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "edit" ? `Change ${initial.booking_id}` : block ? "Block tables" : "New booking"}</DialogTitle>
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
              <InputLabel>Seating</InputLabel>
              <Select label="Seating" value={(target || day).seatings.some((s) => s.seating_id === v.seating_id) ? v.seating_id : ""} onChange={(e) => setV({ ...v, seating_id: e.target.value, table_ids: [] })}>
                {(target || day).seatings.map((s) => <MenuItem key={s.seating_id} value={s.seating_id}>{s.label} {time12(s.start_time)} · {s.seats_left} left{s.closed ? ` · closed online (${s.closed})` : ""}</MenuItem>)}
              </Select>
            </FormControl>
            {!block && <TextField label="Guests" type="number" value={v.guests} onChange={set("guests")} inputProps={{ min: 1, max: 200 }} sx={{ minWidth: 110 }} />}
          </Stack>
          <Autocomplete multiple options={tables.map((t) => t.table_id)} value={v.table_ids} disableCloseOnSelect
            onChange={(e, ids) => setV({ ...v, table_ids: ids })}
            getOptionDisabled={(id) => !freeFor(id)}
            getOptionLabel={(id) => `${id} · ${byId[id]?.seats || "?"} chairs${!freeFor(id) ? " (booked)" : ""}${byId[id]?.online === "N" ? " · staff only" : ""}`}
            renderInput={(p) => <TextField {...p} label="Tables" helperText={`${chairs} chairs chosen${!block && v.guests ? ` for ${v.guests} guests` : ""} · ${left} reservable seats left at this seating`} error={chairs > left || (!block && v.guests && chairs < Number(v.guests))} />}
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
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" onClick={save} disabled={busy || !v.table_ids.length}>{mode === "edit" ? "Save changes" : block ? "Block tables" : "Book"}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------- one booking in the list
const BookingRow = ({ b, canEdit, onAction, highlight }) => {
  const [anchor, setAnchor] = useState(null);
  const block = b.kind === "B";
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: highlight ? "primary.main" : "divider", bgcolor: block ? "#faf5fc" : b.status === "X" ? "#fafafa" : "background.paper", opacity: b.status === "X" ? 0.6 : 1 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography fontWeight={700} noWrap>{block ? `Block · ${b.customer_name}` : b.customer_name}</Typography>
            {!block && <Chip size="small" label={`${b.guests} guests`} />}
            {block ? <Chip size="small" color="secondary" variant="outlined" label="Staff block" /> : <Chip size="small" color={STATUS[b.status].color} label={STATUS[b.status].label} />}
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.25 }}>
            <b>{b.tables.join(" + ")}</b> · {b.seats} chairs · {b.booking_id}{b.source === "S" ? " · by staff" : " · online"}
          </Typography>
          {(b.phone || b.email) && <Typography variant="caption" color="text.secondary" component="div">{[b.phone, b.email].filter(Boolean).join(" · ")}</Typography>}
          {b.notes && <Typography variant="caption" component="div" sx={{ color: "#8a4a00" }}>Request: {b.notes}</Typography>}
          {b.staff_note && <Typography variant="caption" component="div" color="text.secondary">Staff: {b.staff_note}</Typography>}
          {b.status === "X" && <Typography variant="caption" component="div" color="text.secondary">Cancelled by {b.cancelled_by}{b.cancel_reason ? ` - ${b.cancel_reason}` : ""}</Typography>}
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
  const [day, setDay] = useState(null);
  const [selected, setSelected] = useState([]);
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
      setSeatingId((cur) => (d.seatings.some((s) => s.seating_id === cur) ? cur : (d.seatings.find((s) => s.reserved_seats > 0) || d.seatings[0])?.seating_id || null));
    }).catch((e) => toast.error(e.message));
  }, [date, toast]);
  useEffect(() => { load(); setSelected([]); }, [load]);
  useEffect(() => { const id = setInterval(() => document.visibilityState === "visible" && load(true), 30000); return () => clearInterval(id); }, [load]);
  useEffect(() => { setParams({ date, ...(seatingId ? { seating: seatingId } : {}) }, { replace: true }); }, [date, seatingId, setParams]);

  const slot = day?.seatings.find((s) => s.seating_id === seatingId) || null;
  const byId = useMemo(() => Object.fromEntries((day?.tables || []).map((t) => [t.table_id, t])), [day]);
  const bookings = useMemo(() => (day?.bookings || []).filter((b) => b.seating_id === seatingId), [day, seatingId]);
  const bookingOf = (t) => (slot?.taken[t.table_id] ? bookings.find((b) => b.booking_id === slot.taken[t.table_id]) : null);
  const totalChairs = (day?.tables || []).filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);

  const stateOf = (t) => {
    if (!slot) return "disabled";
    const b = bookingOf(t);
    if (b) return b.kind === "B" ? "blocked" : b.status === "A" ? "arrived" : b.status === "N" ? "noshow" : "booked";
    if (selected.includes(t.table_id)) return "selected";
    if (t.status !== "A") return "disabled";
    return "free";
  };
  const captionOf = (t) => {
    const b = bookingOf(t);
    if (!b) return null;
    return b.kind === "B" ? "Block" : `${String(b.customer_name || "").split(" ")[0]} · ${b.guests}`;
  };
  const tipOf = (t, st) => {
    const b = bookingOf(t);
    if (b) return `${t.table_id}: ${b.kind === "B" ? `Staff block - ${b.customer_name}` : `${b.customer_name}, ${b.guests} guests (${b.tables.join("+")}) - ${STATUS[b.status].label}`}`;
    if (st === "selected") return `${t.table_id} selected - click to remove`;
    return `${t.table_id} · ${t.seats} chairs${t.online === "N" ? " · staff only" : ""} - ${canEdit ? "click to select" : "free"}`;
  };
  const clickTable = (t) => {
    const b = bookingOf(t);
    if (b) { setFocus(b.booking_id); document.getElementById(`bk-${b.booking_id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    if (!canEdit) return;
    setSelected((s) => (s.includes(t.table_id) ? s.filter((x) => x !== t.table_id) : [...s, t.table_id]));
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
  const listed = bookings.filter((b) => showCancelled || b.status !== "X");

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
        <PageHeader title="Reservations" subtitle="Floor plan, bookings and staff blocks - updates every 30 seconds"
          action={<Button component={Link} to={`/reservations/reports?date=${date}`} startIcon={<PrintIcon />}>Reports</Button>} />

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
                <ListItemButton key={b.booking_id} onClick={() => { setDate(b.booking_date); setSeatingId(b.seating_id); setFocus(b.booking_id); setFound(null); }}>
                  <Typography variant="body2"><b>{b.customer_name}</b> · {shortDate(b.booking_date)} {time12(b.start_time)} · {b.guests} guests · {b.tables.join("+")} · {b.booking_id} · {STATUS[b.status].label}</Typography>
                </ListItemButton>
              ))}
            </List>
          </CardContent></Card>
        )}

        {!day ? <Loader inline /> : !day.seatings.length ? <Alert severity="info">No seatings on this day. Add or change seatings in Reservations → Reservation setup.</Alert> : (
          <>
            <Tabs value={seatingId || false} onChange={(e, v) => { setSeatingId(v); setSelected([]); setFocus(null); }} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
              {day.seatings.map((s) => (
                <Tab key={s.seating_id} value={s.seating_id} sx={{ alignItems: "flex-start", textAlign: "left" }} label={
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>{s.label} {time12(s.start_time)}</Typography>
                    <Typography fontSize={12} color={s.seats_left === 0 ? "error.main" : "text.secondary"}>{s.reserved_seats}/{s.max_reserved_seats} reserved{s.closed ? " · closed online" : ""}</Typography>
                  </Box>} />
              ))}
            </Tabs>

            {slot && (
              <>
                {slot.closed && <Alert severity="warning" sx={{ mb: 2 }}>Closed for online booking: {slot.closed}. Staff can still add bookings.</Alert>}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}><Tile label="Reserved seats" value={`${slot.reserved_seats} / ${slot.max_reserved_seats}`} progress={(slot.reserved_seats / slot.max_reserved_seats) * 100} sub={slot.seats_left ? `${slot.seats_left} can still be booked` : "Reservations full"} /></Grid>
                  <Grid item xs={6} md={3}><Tile label="Free for walk-ins" value={Math.max(totalChairs - slot.reserved_seats, 0)} sub={`of ${totalChairs} chairs in the room`} /></Grid>
                  <Grid item xs={6} md={3}><Tile label="Bookings · guests" value={`${slot.bookings} · ${slot.guests}`} /></Grid>
                  <Grid item xs={6} md={3}><Tile label="Staff blocks" value={`${slot.blocked_seats} chairs`} /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} lg={8}>
                    <FloorMap tables={day.tables.filter((t) => t.status === "A" || slot.taken[t.table_id])} decor={day.decor} stateOf={stateOf} captionOf={captionOf} tipOf={tipOf} onTableClick={clickTable} />
                    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                      {[["Free", "#ecf8f1", "#3BB273"], ["Booked", "#fff1de", "#ff8a00"], ["Arrived", "#e3f0fd", "#1976d2"], ["No-show", "#fdeaea", "#d32f2f"], ["Staff block", "#efe3f5", "#7b1fa2"], ["Selected", "#ffb347", "#ff8a00"]].map(([l, bg, bd]) => (
                        <Stack key={l} direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 14, bgcolor: bg, border: `1.5px solid ${bd}`, borderRadius: 1 }} /><span>{l}</span></Stack>
                      ))}
                    </Stack>
                    {canEdit && (
                      <Card sx={{ mt: 1.5, borderColor: selected.length ? "primary.main" : "divider" }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                          <Typography sx={{ flexGrow: 1 }} variant="body2">
                            {selected.length ? <><b>{selected.join(" + ")}</b> selected · {selChairs} chairs{selChairs > slot.seats_left ? ` - only ${slot.seats_left} can be reserved` : ""}</> : "Click free tables on the plan to book them for a phone guest or block them."}
                          </Typography>
                          <Button variant="contained" startIcon={<EventSeatIcon />} disabled={!selected.length} onClick={() => setDialog({ mode: "create", initial: { kind: "C", tables: selected, guests: selChairs } })}>Book</Button>
                          <Button variant="outlined" color="secondary" startIcon={<BlockIcon />} disabled={!selected.length} onClick={() => setDialog({ mode: "create", initial: { kind: "B", tables: selected } })}>Block</Button>
                          {selected.length > 0 && <Button onClick={() => setSelected([])}>Clear</Button>}
                        </Stack>
                      </CardContent></Card>
                    )}
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{time12(slot.start_time)} bookings</Typography>
                      <FormControlLabel control={<Checkbox size="small" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />} label={<Typography variant="body2">Show cancelled</Typography>} />
                    </Stack>
                    <Stack spacing={1}>
                      {!listed.length && <Typography variant="body2" color="text.secondary">No bookings yet for this seating.</Typography>}
                      {listed.map((b) => (
                        <Box key={b.booking_id} id={`bk-${b.booking_id}`}>
                          <BookingRow b={b} canEdit={canEdit} onAction={act} highlight={focus === b.booking_id} />
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

      {day && slot && dialog && (
        <BookingDialog open mode={dialog.mode} day={day} seating={slot} initial={dialog.initial}
          onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setSelected([]); load(true); }} />
      )}
      <Dialog open={!!cancelAsk} onClose={() => setCancelAsk(null)} fullWidth maxWidth="xs">
        <DialogTitle>{cancelAsk?.b.kind === "B" ? "Remove this block?" : `Cancel ${cancelAsk?.b.booking_id}?`}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Tables {cancelAsk?.b.tables.join(" + ")} become free for other guests.</Typography>
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

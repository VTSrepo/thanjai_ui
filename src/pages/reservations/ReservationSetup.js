import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import FloorMap from "../../components/reserve/FloorMap";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { deleteResClosure, getResSetup, saveResClosure, saveResSeating, saveResSettings, saveResTable } from "../../utilities/service";
import { longDate, time12 } from "../../utilities/reserveApi";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Num = ({ label, value, onChange, helper, disabled }) => (
  <TextField label={label} type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} helperText={helper} disabled={disabled} fullWidth />
);

const SeatingDialog = ({ value, onClose, onSave }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (!value || !v) return null;
  const toggleDay = (d) => setV({ ...v, weekdays: v.weekdays.includes(d) ? v.weekdays.replace(d, "") : `${v.weekdays}${d}` });
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{v.seating_id ? `Seating ${v.label} ${v.start_time}` : "New seating"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Name (e.g. Lunch, Dinner, Brunch)" value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} />
          <TextField label="Start time" type="time" value={v.start_time} onChange={(e) => setV({ ...v, start_time: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Box>
            <Typography variant="caption" color="text.secondary">Days it runs</Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
              {DAYS.map((d, i) => <Chip key={d} label={d} color={v.weekdays.includes(String(i)) ? "primary" : "default"} onClick={() => toggleDay(String(i))} />)}
            </Stack>
          </Box>
          <FormControlLabel control={<Switch checked={v.status !== "I"} onChange={(e) => setV({ ...v, status: e.target.checked ? "A" : "I" })} />} label="In use" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" onClick={() => onSave(v)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const TableDialog = ({ value, all, decor, onClose, onSave }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (!value || !v) return null;
  const set = (k) => (x) => setV({ ...v, [k]: x });
  const preview = [...all.filter((t) => t.table_id !== v.table_id), { ...v, seats: Number(v.seats) || 1, pos_x: Number(v.pos_x), pos_y: Number(v.pos_y), width: Number(v.width), height: Number(v.height) }];
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{value.isNew ? "New table" : `Table ${v.table_id}`}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <TextField label="Table no." value={v.table_id} onChange={(e) => setV({ ...v, table_id: e.target.value.toUpperCase() })} disabled={!value.isNew} />
              <Num label="Chairs" value={v.seats} onChange={set("seats")} />
              <FormControl fullWidth><InputLabel>Chairs placed</InputLabel>
                <Select label="Chairs placed" value={v.orient} onChange={(e) => setV({ ...v, orient: e.target.value })}>
                  <MenuItem value="H">Above and below</MenuItem><MenuItem value="V">Left and right</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1}><Num label="Across %" value={v.pos_x} onChange={set("pos_x")} /><Num label="Down %" value={v.pos_y} onChange={set("pos_y")} /></Stack>
              <Stack direction="row" spacing={1}><Num label="Width %" value={v.width} onChange={set("width")} /><Num label="Height %" value={v.height} onChange={set("height")} /></Stack>
              <Num label="Order in lists" value={v.sort_order} onChange={set("sort_order")} />
              <FormControlLabel control={<Switch checked={v.online !== "N"} onChange={(e) => setV({ ...v, online: e.target.checked ? "Y" : "N" })} />} label="Customers can book it online" />
              <FormControlLabel control={<Switch checked={v.status !== "I"} onChange={(e) => setV({ ...v, status: e.target.checked ? "A" : "I" })} />} label="In use" />
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="caption" color="text.secondary">Preview - this table is highlighted</Typography>
            <FloorMap tables={preview} decor={decor} minWidth={420} stateOf={(t) => (t.table_id === v.table_id ? "selected" : t.status === "I" ? "disabled" : "free")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" onClick={() => onSave(v)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const ReservationSetup = () => {
  document.title = `Reservation setup | ${CONFIG.title.name}`;
  const toast = useToast();
  const { can } = useUser();
  const canEdit = can("RES_SETUP", true);
  const [tab, setTab] = useState("settings");
  const [data, setData] = useState(null);
  const [s, setS] = useState(null);
  const [seating, setSeating] = useState(null);
  const [table, setTable] = useState(null);
  const [closure, setClosure] = useState({ closed_date: "", seating_id: "", reason: "" });

  const load = useCallback(() => getResSetup().then((r) => { setData(r); setS(r.settings); }).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, after) => {
    try { const r = await fn(); toast.success(r.message); if (after) after(); load(); return true; }
    catch (e) {
      if (e.data?.needs_confirm && window.confirm(e.message)) return run(() => fn(true), after);
      toast.error(e.message); return false;
    }
  };
  if (!data || !s) return <><ResponsiveAppBar /><Loader /></>;
  const chairs = data.tables.filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);
  const set = (k) => (v) => setS({ ...s, [k]: v });

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
        <PageHeader title="Reservation setup" subtitle="Limits, seatings, tables and closed dates" />
        <Card sx={{ mb: 2 }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>Customer booking page: <b>{data.public_url}</b></Typography>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard?.writeText(data.public_url); toast.success("Link copied"); }}>Copy link</Button>
            <Button size="small" href={data.public_url} target="_blank">Open</Button>
          </Stack>
        </CardContent></Card>
        {!data.mail_configured && (
          <Alert severity="warning" sx={{ mb: 2 }}>E-mail is not set up on the server yet: bookings work, but no confirmations are sent. Add the SMTP settings to the server's .env file (see RESERVATIONS.md).</Alert>
        )}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="settings" label="Limits & contact" /><Tab value="seatings" label={`Seatings (${data.seatings.filter((x) => x.status === "A").length})`} />
          <Tab value="tables" label={`Tables (${data.tables.filter((t) => t.status === "A").length} · ${chairs} chairs)`} /><Tab value="closed" label={`Closed dates (${data.closures.length})`} />
        </Tabs>

        {tab === "settings" && (
          <Card><CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={s.booking_open === "Y"} onChange={(e) => set("booking_open")(e.target.checked ? "Y" : "N")} disabled={!canEdit} />} label={s.booking_open === "Y" ? "Online booking is ON" : "Online booking is PAUSED (staff can still book)"} /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Reservable chairs per seating" value={s.max_reserved_seats} onChange={set("max_reserved_seats")} disabled={!canEdit} helper={`The rest of the ${chairs} chairs are kept for walk-ins (${Math.max(chairs - (Number(s.max_reserved_seats) || 0), 0)} now)`} /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Biggest group online" value={s.max_party_online} onChange={set("max_party_online")} disabled={!canEdit} helper="Bigger groups are asked to call" /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Book up to (days ahead)" value={s.days_ahead} onChange={set("days_ahead")} disabled={!canEdit} /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Online booking closes (minutes before)" value={s.min_notice_minutes} onChange={set("min_notice_minutes")} disabled={!canEdit} /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Customer can cancel online until (minutes before)" value={s.cancel_notice_minutes} onChange={set("cancel_notice_minutes")} disabled={!canEdit} /></Grid>
              <Grid item xs={12} sm={6} md={4}><Num label="Table held for (minutes)" value={s.seating_minutes} onChange={set("seating_minutes")} disabled={!canEdit} helper="Shown to customers" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Restaurant name" value={s.restaurant_name || ""} onChange={(e) => set("restaurant_name")(e.target.value)} disabled={!canEdit} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={s.phone || ""} onChange={(e) => set("phone")(e.target.value)} disabled={!canEdit} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Address" value={s.address || ""} onChange={(e) => set("address")(e.target.value)} disabled={!canEdit} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Restaurant e-mail - gets a copy of every booking (comma separated)" value={s.notify_email || ""} onChange={(e) => set("notify_email")(e.target.value)} disabled={!canEdit} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Guest information on the booking page (one point per line)" value={s.guest_notes || ""} onChange={(e) => set("guest_notes")(e.target.value)} disabled={!canEdit} /></Grid>
            </Grid>
            {canEdit && <Button variant="contained" sx={{ mt: 2 }} onClick={() => run(() => saveResSettings(s))}>Save settings</Button>}
          </CardContent></Card>
        )}

        {tab === "seatings" && (
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Each seating is booked separately and has its own limit of {s.max_reserved_seats} reservable chairs.</Typography>
            <Table size="small">
              <TableHead><TableRow>{["Name", "Start", "Days", "Status", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {data.seatings.map((x) => (
                  <TableRow key={x.seating_id} sx={{ opacity: x.status === "I" ? 0.5 : 1 }}>
                    <TableCell>{x.label}</TableCell><TableCell>{time12(x.start_time)}</TableCell>
                    <TableCell>{x.weekdays.length === 7 ? "Every day" : x.weekdays.split("").map((d) => DAYS[d]).join(", ")}</TableCell>
                    <TableCell>{x.status === "I" ? "Not in use" : "In use"}</TableCell>
                    <TableCell align="right">{canEdit && <IconButton size="small" onClick={() => setSeating({ ...x })}><EditIcon fontSize="small" /></IconButton>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {canEdit && <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setSeating({ seating_id: "", label: "Dinner", start_time: "18:00", weekdays: "0123456", status: "A" })}>Add seating</Button>}
          </CardContent></Card>
        )}

        {tab === "tables" && (
          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <FloorMap tables={data.tables} decor={data.decor} stateOf={(t) => (t.status === "I" ? "disabled" : t.online === "N" ? "blocked" : "free")}
                onTableClick={canEdit ? (t) => setTable({ ...t }) : undefined} tipOf={(t) => `${t.table_id} · ${t.seats} chairs${t.online === "N" ? " · staff only" : ""}${t.status === "I" ? " · not in use" : ""}${canEdit ? " - click to edit" : ""}`} />
              <Typography variant="caption" color="text.secondary">Green: bookable online · purple: staff only · faded: not in use. Click a table to edit it.</Typography>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Card><CardContent>
                <Table size="small">
                  <TableHead><TableRow>{["Table", "Chairs", "Online", "In use", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {data.tables.map((t) => (
                      <TableRow key={t.table_id} hover sx={{ opacity: t.status === "I" ? 0.5 : 1 }}>
                        <TableCell sx={{ fontWeight: 700 }}>{t.table_id}</TableCell><TableCell>{t.seats}</TableCell>
                        <TableCell>{t.online === "N" ? "Staff only" : "Yes"}</TableCell><TableCell>{t.status === "I" ? "No" : "Yes"}</TableCell>
                        <TableCell align="right">{canEdit && <IconButton size="small" onClick={() => setTable({ ...t })}><EditIcon fontSize="small" /></IconButton>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {canEdit && <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setTable({ isNew: true, table_id: "", seats: 4, orient: "H", pos_x: 50, pos_y: 60, width: 7, height: 6.5, online: "Y", status: "A", sort_order: 99 })}>Add table</Button>}
              </CardContent></Card>
            </Grid>
          </Grid>
        )}

        {tab === "closed" && (
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Stop online booking for a holiday, a private event or a closed day. Bookings already made are kept - staff can still add bookings.</Typography>
            {canEdit && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField type="date" label="Date" value={closure.closed_date} onChange={(e) => setClosure({ ...closure, closed_date: e.target.value })} InputLabelProps={{ shrink: true }} />
                <FormControl sx={{ minWidth: 200 }}><InputLabel>Seating</InputLabel>
                  <Select label="Seating" value={closure.seating_id} onChange={(e) => setClosure({ ...closure, seating_id: e.target.value })}>
                    <MenuItem value="">Whole day</MenuItem>
                    {data.seatings.filter((x) => x.status === "A").map((x) => <MenuItem key={x.seating_id} value={x.seating_id}>{x.label} {time12(x.start_time)}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Reason (shown to customers)" value={closure.reason} onChange={(e) => setClosure({ ...closure, reason: e.target.value })} sx={{ flexGrow: 1 }} />
                <Button variant="contained" disabled={!closure.closed_date} onClick={() => run(() => saveResClosure(closure), () => setClosure({ closed_date: "", seating_id: "", reason: "" }))}>Close</Button>
              </Stack>
            )}
            <Table size="small">
              <TableHead><TableRow>{["Date", "Seating", "Reason", ""].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {!data.closures.length && <TableRow><TableCell colSpan={4} sx={{ color: "text.secondary" }}>No closed dates coming up.</TableCell></TableRow>}
                {data.closures.map((c) => {
                  const x = data.seatings.find((z) => z.seating_id === c.seating_id);
                  return (
                    <TableRow key={`${c.closed_date}-${c.seating_id}`}>
                      <TableCell>{longDate(c.closed_date)}</TableCell><TableCell>{x ? `${x.label} ${time12(x.start_time)}` : "Whole day"}</TableCell><TableCell>{c.reason}</TableCell>
                      <TableCell align="right">{canEdit && <IconButton size="small" onClick={() => run(() => deleteResClosure(c))} aria-label="Open again"><DeleteIcon fontSize="small" /></IconButton>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}
      </Box>
      <SeatingDialog value={seating} onClose={() => setSeating(null)} onSave={(v) => run((confirm) => saveResSeating({ ...v, confirm }), () => setSeating(null))} />
      <TableDialog value={table} all={data.tables} decor={data.decor} onClose={() => setTable(null)} onSave={(v) => run(() => saveResTable(v), () => setTable(null))} />
    </>
  );
};

export default ReservationSetup;

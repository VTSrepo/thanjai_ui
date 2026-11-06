import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, FormControl, InputLabel, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import { useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { getResDay } from "../../utilities/service";
import { longDate, time12 } from "../../utilities/reserveApi";
import {
  CUSTOMER_HEAD, SUMMARY_HEAD, customerPdf, customerRows, printPdf, sessionBookings, statusPdf, summaryRows, timelineCols, timelineRows,
} from "../../utilities/reservationPdf";

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const FILL = { booked: "#fff1de", arrived: "#e3f0fd", noshow: "#fdeaea", blocked: "#efe3f5" };
const stateOf = (b) => (b.kind === "B" ? "blocked" : b.status === "A" ? "arrived" : b.status === "N" ? "noshow" : "booked");

const Grid = ({ head, rows, bold = [0], minWidth = 700, warn }) => (
  <TableContainer component={Card} sx={{ mb: 2 }}>
    <Table size="small" sx={{ minWidth }}>
      <TableHead><TableRow>{head.map((h) => <TableCell key={h} sx={{ fontWeight: 700, bgcolor: "#fff4e6" }}>{h}</TableCell>)}</TableRow></TableHead>
      <TableBody>
        {!rows.length && <TableRow><TableCell colSpan={head.length} sx={{ color: "text.secondary" }}>Nothing to show.</TableCell></TableRow>}
        {rows.map((r, i) => (
          <TableRow key={i} hover>
            {r.map((c, j) => <TableCell key={j} sx={{ fontWeight: bold.includes(j) ? 700 : 400, color: warn && c === warn ? "#b25e00" : undefined }}>{c}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

/** Tables down the side, times across: who holds each table when. */
const Timeline = ({ day, session }) => {
  const cols = timelineCols(day, session);
  const rows = timelineRows(day, session);
  return (
    <TableContainer component={Card} sx={{ mb: 2 }}>
      <Table size="small" sx={{ minWidth: 120 + cols.length * 64, "& td, & th": { px: 0.5, py: 0.5, borderRight: "1px solid #eee" } }}>
        <TableHead><TableRow>
          <TableCell sx={{ fontWeight: 700, bgcolor: "#fff4e6", position: "sticky", left: 0, zIndex: 2 }}>Table</TableCell>
          {cols.map((c) => <TableCell key={c} align="center" sx={{ fontWeight: 700, bgcolor: "#fff4e6", fontSize: 12, whiteSpace: "nowrap" }}>{time12(c)}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.table.table_id}>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", position: "sticky", left: 0, bgcolor: "#fff", zIndex: 1 }}>{r.table.table_id} <Typography component="span" variant="caption" color="text.secondary">({r.table.seats})</Typography></TableCell>
              {r.cells.map((c, i) => (
                <TableCell key={i} align="center" title={c ? `${c.booking.customer_name} · ${c.booking.guests} guests · ${time12(c.booking.start_time)}-${time12(c.booking.end_time)}` : ""}
                  sx={{ bgcolor: c ? FILL[stateOf(c.booking)] : undefined, fontSize: 11, fontWeight: c?.first ? 700 : 400, whiteSpace: "nowrap", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c?.first ? (c.booking.kind === "B" ? "Block" : `${String(c.booking.customer_name).split(" ")[0]} ${c.booking.guests}`) : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ReservationReports = () => {
  document.title = `Reservation reports | ${CONFIG.title.name}`;
  const toast = useToast();
  const [params] = useSearchParams();
  const [date, setDate] = useState(params.get("date") || localToday());
  const [seatingId, setSeatingId] = useState("ALL");
  const [tab, setTab] = useState("status");
  const [day, setDay] = useState(null);

  useEffect(() => {
    setDay(null);
    getResDay(date).then(setDay).catch((e) => toast.error(e.message));
  }, [date, toast]);

  const sessions = useMemo(() => (day?.seatings || []).filter((s) => seatingId === "ALL" || s.seating_id === seatingId), [day, seatingId]);
  const file = `reservations-${tab === "status" ? "status" : "customers"}-${date}${seatingId !== "ALL" ? `-${seatingId}` : ""}.pdf`;
  const pdf = () => (tab === "status" ? statusPdf(day, sessions) : customerPdf(day, sessions));

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
        <PageHeader title="Reservation reports" subtitle="Status by time with a table timeline, and bookings by customer - print for the board" />
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 1 }}>
          <TextField type="date" size="small" label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Session</InputLabel>
            <Select label="Session" value={seatingId} onChange={(e) => setSeatingId(e.target.value)}>
              <MenuItem value="ALL">Lunch and dinner</MenuItem>
              {(day?.seatings || []).map((s) => <MenuItem key={s.seating_id} value={s.seating_id}>{s.label} {time12(s.start_time)}-{time12(s.end_time)}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{longDate(date)}</Typography>
          <Button variant="contained" startIcon={<PrintIcon />} disabled={!day || !sessions.length} onClick={() => printPdf(pdf(), file)}>Print</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!day || !sessions.length} onClick={() => pdf().save(file)}>PDF</Button>
        </Stack>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="status" label="Reservation status (by time + table timeline)" />
          <Tab value="customers" label="Bookings by customer" />
        </Tabs>
        {!day ? <Loader inline /> : !sessions.length ? <Alert severity="info">No sessions on this day.</Alert> : tab === "status" ? (
          sessions.map((s) => {
            const waiting = sessionBookings(day, s).filter((b) => b.needs_tables);
            return (
              <Box key={s.seating_id} sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={800}>{s.label} {time12(s.start_time)} - {time12(s.end_time)}
                  <Typography component="span" color="text.secondary" sx={{ ml: 1.5, fontSize: 14 }}>{s.bookings} bookings · {s.guests} guests{s.closed ? ` · closed online: ${s.closed}` : ""}</Typography>
                </Typography>
                <Typography fontWeight={700} sx={{ mt: 1.5, mb: 1 }}>By time</Typography>
                <Grid head={SUMMARY_HEAD} rows={summaryRows(day, s)} />
                <Typography fontWeight={700} sx={{ mb: 1 }}>Table timeline</Typography>
                <Timeline day={day} session={s} />
                {waiting.length > 0 && (
                  <Alert severity="warning">Waiting for tables: {waiting.map((b) => `${time12(b.start_time)} ${b.customer_name} (${b.guests})`).join(" · ")} - allocate them in Floor plan &amp; bookings.</Alert>
                )}
              </Box>
            );
          })
        ) : (
          sessions.map((s) => {
            const rows = customerRows(day, s);
            const blocks = sessionBookings(day, s).filter((b) => b.kind === "B");
            return (
              <Box key={s.seating_id} sx={{ mb: 3 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>{s.label}
                  <Typography component="span" color="text.secondary" sx={{ ml: 1.5, fontSize: 14 }}>{rows.length} bookings · {s.guests} guests{s.to_allocate ? ` · ${s.to_allocate} waiting for tables` : ""}</Typography>
                </Typography>
                <Grid head={CUSTOMER_HEAD} rows={rows} bold={[0, 1, 3]} minWidth={1100} warn="TO ALLOCATE" />
                {blocks.length > 0 && <Typography variant="body2" sx={{ color: "#6a1b9a", mt: -1 }}>Staff blocks: {blocks.map((b) => `${time12(b.start_time)} ${b.tables.join("+")} (${b.customer_name})`).join(", ")}</Typography>}
              </Box>
            );
          })
        )}
      </Box>
    </>
  );
};

export default ReservationReports;

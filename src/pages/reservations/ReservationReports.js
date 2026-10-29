import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell,
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
  CUSTOMER_HEAD, SUMMARY_HEAD, TABLE_HEAD, customerPdf, customerRows, printPdf, seatingRows, statusPdf,
} from "../../utilities/reservationPdf";

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const STATE_LABEL = { free: "Free", booked: "Booked", arrived: "Arrived", noshow: "No-show", blocked: "Staff block" };
const STATE_COLOR = { free: "#2e7d32", booked: "#b25e00", arrived: "#1565c0", noshow: "#c62828", blocked: "#6a1b9a" };

const Grid = ({ head, rows, bold = [0], colorCol, minWidth = 700 }) => (
  <TableContainer component={Card} sx={{ mb: 2 }}>
    <Table size="small" sx={{ minWidth }}>
      <TableHead><TableRow>{head.map((h) => <TableCell key={h} sx={{ fontWeight: 700, bgcolor: "#fff4e6" }}>{h}</TableCell>)}</TableRow></TableHead>
      <TableBody>
        {!rows.length && <TableRow><TableCell colSpan={head.length} sx={{ color: "text.secondary" }}>Nothing to show.</TableCell></TableRow>}
        {rows.map((r, i) => (
          <TableRow key={i} hover>
            {r.map((c, j) => (
              <TableCell key={j} sx={{ fontWeight: bold.includes(j) ? 700 : 400, whiteSpace: j === 0 ? "pre-line" : "normal", color: colorCol === j ? STATE_COLOR[Object.keys(STATE_LABEL).find((k) => STATE_LABEL[k] === c)] : undefined }}>{c}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

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

  const seatings = useMemo(() => (day?.seatings || []).filter((s) => seatingId === "ALL" || s.seating_id === seatingId), [day, seatingId]);
  const total = (day?.tables || []).filter((t) => t.status === "A").reduce((n, t) => n + t.seats, 0);
  const file = `reservations-${tab === "status" ? "status" : "customers"}-${date}${seatingId !== "ALL" ? `-${seatingId}` : ""}.pdf`;
  const pdf = () => (tab === "status" ? statusPdf(day, seatings) : customerPdf(day, seatings));

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Reservation reports" subtitle="Status of every table and bookings by customer - print for the board" />
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 1 }}>
          <TextField type="date" size="small" label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Seating</InputLabel>
            <Select label="Seating" value={seatingId} onChange={(e) => setSeatingId(e.target.value)}>
              <MenuItem value="ALL">All seatings</MenuItem>
              {(day?.seatings || []).map((s) => <MenuItem key={s.seating_id} value={s.seating_id}>{s.label} {time12(s.start_time)}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{longDate(date)}</Typography>
          <Button variant="contained" startIcon={<PrintIcon />} disabled={!day || !seatings.length} onClick={() => printPdf(pdf(), file)}>Print</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!day || !seatings.length} onClick={() => pdf().save(file)}>PDF</Button>
        </Stack>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="status" label="Reservation status (summary + tables)" />
          <Tab value="customers" label="Bookings by customer" />
        </Tabs>
        {!day ? <Loader inline /> : !seatings.length ? <Alert severity="info">No seatings on this day.</Alert> : tab === "status" ? (
          <>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Summary</Typography>
            <Grid head={SUMMARY_HEAD} rows={seatings.map((s) => {
              const rows = seatingRows(day, s);
              return [`${s.label} ${time12(s.start_time)}${s.closed ? `\nclosed online: ${s.closed}` : ""}`, `${s.reserved_seats} / ${s.max_reserved_seats}`, s.seats_left, Math.max(total - s.reserved_seats, 0),
                s.bookings, s.guests, s.blocked_seats, `${rows.filter((r) => r.booking).length} / ${rows.length}`];
            })} />
            {seatings.map((s) => (
              <Box key={s.seating_id} sx={{ mt: 3 }}>
                <Card sx={{ mb: 1, bgcolor: "#2b2b2b", color: "#fff" }}><CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                  <Typography fontWeight={800}>{s.label} {time12(s.start_time)}
                    <Typography component="span" sx={{ ml: 1.5, opacity: 0.8, fontSize: 14 }}>{s.reserved_seats}/{s.max_reserved_seats} reserved · {s.bookings} bookings · {s.guests} guests</Typography>
                  </Typography>
                </CardContent></Card>
                <Grid head={TABLE_HEAD} colorCol={2} minWidth={900} rows={seatingRows(day, s).map(({ table: t, booking: b, state }) => [
                  t.table_id, t.seats, STATE_LABEL[state], b ? b.booking_id : "", b ? b.customer_name : "",
                  b && b.kind !== "B" ? `${b.guests}${b.tables.length > 1 ? ` (${b.tables.join("+")})` : ""}` : "", b ? b.phone || "" : "",
                  b ? [b.notes, b.staff_note].filter(Boolean).join(" / ") : ""])} />
              </Box>
            ))}
          </>
        ) : (
          seatings.map((s) => {
            const rows = customerRows(day, s);
            const blocks = day.bookings.filter((b) => b.seating_id === s.seating_id && b.status !== "X" && b.kind === "B");
            return (
              <Box key={s.seating_id} sx={{ mb: 3 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>{s.label} {time12(s.start_time)}
                  <Typography component="span" color="text.secondary" sx={{ ml: 1.5, fontSize: 14 }}>{rows.length} bookings · {s.guests} guests · {s.reserved_seats}/{s.max_reserved_seats} seats reserved</Typography>
                </Typography>
                <Grid head={CUSTOMER_HEAD} rows={rows} bold={[0, 2]} minWidth={1000} />
                {blocks.length > 0 && <Typography variant="body2" sx={{ color: "#6a1b9a", mt: -1 }}>Staff blocks: {blocks.map((b) => `${b.tables.join("+")} (${b.customer_name})`).join(", ")}</Typography>}
              </Box>
            );
          })
        )}
      </Box>
    </>
  );
};

export default ReservationReports;

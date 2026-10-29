import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { Link, useLocation, useParams } from "react-router-dom";
import ReserveLayout, { Card, Eyebrow, GOLD, GRAD, SERIF } from "../../components/reserve/ReserveLayout";
import { longDate, reserveCancel, reserveView, time12 } from "../../utilities/reserveApi";

/** Confirmation after booking, and the "view or cancel" page linked from the e-mail. */
const ReserveBooking = () => {
  document.title = "Your booking | Thanjai Restaurant";
  const { token } = useParams();
  const q = new URLSearchParams(useLocation().search);
  const isNew = q.get("new") === "1";
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => reserveView(token).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async () => {
    setBusy(true);
    try { const r = await reserveCancel(token); setMsg(r.message); setAsk(false); await load(); }
    catch (e) { setErr(e.message); setAsk(false); }
    finally { setBusy(false); }
  };

  const b = data?.booking;
  const R = data?.restaurant;
  const cancelled = b?.status === "X";
  const tel = (R?.phone || "").replace(/[^\d+]/g, "");
  return (
    <ReserveLayout restaurant={R}>
      <Box sx={{ maxWidth: 620, mx: "auto", pt: { xs: 5, sm: 8 } }}>
        {err && !b && <Alert severity="error">{err}</Alert>}
        {!b && !err && <Box sx={{ textAlign: "center", py: 10 }}><CircularProgress /></Box>}
        {b && (
          <>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box sx={{ width: 72, height: 72, mx: "auto", mb: 2.5, borderRadius: "50%", background: cancelled ? "#3a3a3a" : GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {cancelled ? <EventBusyIcon sx={{ fontSize: 34 }} /> : <CheckIcon sx={{ fontSize: 36 }} />}
              </Box>
              <Eyebrow>{cancelled ? "Cancelled" : isNew ? "Confirmed" : "Your booking"}</Eyebrow>
              <Typography component="h1" sx={{ fontFamily: SERIF, fontSize: { xs: 32, sm: 44 }, mt: 1.5 }}>
                {cancelled ? "Booking cancelled" : isNew ? "Your table is booked!" : "See you soon"}
              </Typography>
              {!cancelled && (
                <Typography sx={{ color: "text.secondary", fontStyle: "italic", mt: 1 }}>
                  {isNew && q.get("nomail") !== "1" ? `A confirmation is on its way to ${b.email}.` : `Booking number ${b.booking_id}`}
                </Typography>
              )}
            </Box>
            {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <Card>
              {[["Booking no.", b.booking_id], ["Date", longDate(b.booking_date)], ["Time", `${time12(b.start_time)} · ${b.seating_label}`],
                ["Guests", `${b.guests}`], ["Table", `${b.tables.join(" + ")}${b.tables.length > 1 ? " (placed together for you)" : ""}`],
                ["Name", b.customer_name], ["Phone", b.phone], ["E-mail", b.email], ["Request", b.notes]].filter(([, v]) => v).map(([k, v]) => (
                <Stack key={k} direction="row" spacing={2} sx={{ py: 1.1, borderBottom: "1px dashed", borderColor: "divider" }}>
                  <Typography sx={{ width: 110, flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: ".25em", textTransform: "uppercase", color: GOLD, pt: 0.4 }}>{k}</Typography>
                  <Typography sx={{ fontWeight: 600, textDecoration: cancelled && ["Date", "Time", "Table"].includes(k) ? "line-through" : "none", wordBreak: "break-word" }}>{v}</Typography>
                </Stack>
              ))}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                {data.can_cancel && <Button variant="outlined" color="inherit" onClick={() => setAsk(true)} sx={{ borderRadius: 99, borderColor: "#555" }}>Cancel this booking</Button>}
                <Button component={Link} to="/reserve" sx={{ borderRadius: 99, background: GRAD, color: "#fff", px: 3, "&:hover": { background: GRAD } }}>
                  {cancelled ? "Book another time" : "Make another booking"}
                </Button>
              </Stack>
              {!cancelled && !data.can_cancel && b.status === "C" && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
                  To change or cancel now, please call us at <a href={`tel:${tel}`} style={{ color: GOLD }}>{R.phone}</a>.
                </Typography>
              )}
              {!cancelled && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 2, fontStyle: "italic" }}>
                  Your table is held for about {R.seating_minutes} minutes. Running late? Call us at <a href={`tel:${tel}`} style={{ color: GOLD }}>{R.phone}</a>.
                </Typography>
              )}
            </Card>
          </>
        )}
      </Box>
      <Dialog open={ask} onClose={() => setAsk(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel your booking?</DialogTitle>
        <DialogContent><Typography variant="body2">Your table(s) will be released for other guests. You can book again any time.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setAsk(false)} color="inherit">Keep it</Button>
          <Button onClick={cancel} disabled={busy} variant="contained" color="error">{busy ? "Cancelling..." : "Yes, cancel"}</Button>
        </DialogActions>
      </Dialog>
    </ReserveLayout>
  );
};

export default ReserveBooking;

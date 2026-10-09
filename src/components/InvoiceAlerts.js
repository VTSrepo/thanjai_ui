import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, Box, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { getReceivablesSummary } from "../utilities/service";
import { money, formatDate } from "../utilities/helpers";
import { useUser, ROLE } from "../utilities/UserContext";

/**
 * Pending-invoice alerts.
 * Admin: overdue, due in 7 days, received-but-not-invoiced (all customers).
 * Branch / external: their own overdue or next payment due.
 */
const InvoiceAlerts = ({ compact = false }) => {
  const { user } = useUser();
  const [t, setT] = useState(null);
  const isAdmin = user?.user_type === ROLE.ADMIN || user?.user_type === ROLE.OPS;

  useEffect(() => {
    if (!user || user.user_type === ROLE.KITCHEN || (user.user_type === ROLE.OPS && !user.screens?.PAYMENTS)) return;
    getReceivablesSummary().then((s) => setT(s?.totals || null)).catch(() => {});
  }, [user]);

  if (!t) return null;
  const link = isAdmin ? "/payments" : "/my-invoices";
  const items = [];
  if (t.overdue_count > 0) {
    items.push(
      <Alert key="o" severity="error" action={<Button color="inherit" size="small" component={Link} to={link}>View</Button>}>
        <AlertTitle sx={{ mb: 0 }}>
          {t.overdue_count} invoice{t.overdue_count > 1 ? "s" : ""} overdue · {money(t.overdue_amt, true)}
        </AlertTitle>
        {!compact && (isAdmin ? "Payments are past their due date." : "Please arrange payment as soon as possible.")}
      </Alert>
    );
  }
  if (t.due_soon_count > 0) {
    items.push(
      <Alert key="d" severity="warning" action={<Button color="inherit" size="small" component={Link} to={link}>View</Button>}>
        <AlertTitle sx={{ mb: 0 }}>
          {isAdmin
            ? `${t.due_soon_count} due in the next 7 days · ${money(t.due_soon_amt, true)}`
            : `Next payment due ${formatDate(t.next_due_date)} · ${money(t.due_soon_amt, true)}`}
        </AlertTitle>
      </Alert>
    );
  }
  if (isAdmin && t.not_invoiced_count > 0) {
    items.push(
      <Alert key="n" severity="info" action={<Button color="inherit" size="small" component={Link} to="/invoices">Invoice</Button>}>
        {t.not_invoiced_count} received indent{t.not_invoiced_count > 1 ? "s are" : " is"} not invoiced yet
      </Alert>
    );
  }
  if (!items.length) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack spacing={1}>{items}</Stack>
    </Box>
  );
};

export default InvoiceAlerts;

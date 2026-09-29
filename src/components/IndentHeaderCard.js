import React from "react";
import { Box, Card, CardContent, Chip, Divider, Link, Stack, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import StatusChip from "./StatusChip";
import { formatDateTime, formatDate } from "../utilities/helpers";

const Info = ({ label, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
      {children || "-"}
    </Typography>
  </Box>
);

// Read-only indent header: compact grid (2 columns on phones, 4 on desktop) + customer block when for a customer.
const IndentHeaderCard = ({ indent, itemCount }) => {
  if (!indent) return null;
  const forCustomer = indent.self_customer === "C";
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mr: "auto" }}>
            {indent.indent_number}
          </Typography>
          {indent.priority_flag === "Y" && <Chip size="small" color="error" label="Priority" />}
          <StatusChip status={indent.status} />
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <Info label="From branch">{indent.branch_name || indent.branch_id}</Info>
          <Info label="To kitchen">{indent.kitchen_name || indent.kitchen_id}</Info>
          <Info label="Indent date">{formatDate(indent.indent_date)}</Info>
          <Info label="Deliver by">{formatDateTime(indent.delivery_by_datetime)}</Info>
          <Info label="Requested for">{forCustomer ? "Customer" : "Self (branch)"}</Info>
          {itemCount !== undefined && <Info label="Items">{itemCount}</Info>}
        </Box>

        {forCustomer && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <PersonIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700}>
                Customer
              </Typography>
            </Stack>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
              <Info label="Name">{indent.customer_name}</Info>
              <Info label="Phone">
                {indent.customer_phone ? (
                  <Link href={`tel:${indent.customer_phone}`} underline="hover">
                    {indent.customer_phone}
                  </Link>
                ) : null}
              </Info>
              <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}>
                <Info label="Address">
                  {[indent.customer_address, indent.customer_pin].filter(Boolean).join(", ")}
                </Info>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IndentHeaderCard;

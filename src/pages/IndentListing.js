import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InboxIcon from "@mui/icons-material/Inbox";
import IndentDetail from "./IndentDetail";
import Loader from "../components/Loader";
import StatusChip from "../components/StatusChip";
import { fetchIndents } from "../utilities/service";
import { formatDateTime } from "../utilities/helpers";

/**
 * statuses: indent statuses to show, e.g. ["C"] or ["C","A"]
 * scope:    { branch_id } or { kitchen_id } limiting to the user's own indents
 */
const IndentListing = ({ statuses, scope, title, emptyText, onChanged }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [indents, setIndents] = useState([]);
  const [openIndent, setOpenIndent] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setIndents(await fetchIndents(statuses, scope));
    } catch (e) {
      setError("Could not load indents. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(statuses), JSON.stringify(scope)]);

  useEffect(() => {
    load();
  }, [load]);

  const closeDetail = (result) => {
    setOpenIndent(null);
    if (result?.message) {
      setToast(result.message);
      load();
      onChanged?.();
    }
  };

  if (openIndent) {
    return <IndentDetail indentNumber={openIndent} sendToParent={closeDetail} />;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          {title}
          {!loading && ` (${indents.length})`}
        </Typography>
        <IconButton aria-label="Refresh" onClick={load}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Loader inline />
      ) : indents.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <InboxIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          <Typography>{emptyText || "Nothing pending."}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {indents.map((it) => (
            <Card key={`${it.indent_number}-${it.kitchen_id}`}>
              <CardActionArea onClick={() => setOpenIndent(it.indent_number)}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                      {it.indent_number}
                    </Typography>
                    {it.priority_flag === "Y" && <Chip size="small" color="error" label="Priority" />}
                    <StatusChip status={it.status} />
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "text.secondary" }}>
                    <Typography variant="body2" noWrap>{it.branch_name || it.branch_id}</Typography>
                    <ArrowForwardIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" noWrap>{it.kitchen_name || it.kitchen_id}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Deliver by <b>{formatDateTime(it.delivery_by_datetime) || "-"}</b>
                  </Typography>
                  {it.self_customer === "C" && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      Customer: {it.customer_name || "-"}
                      {it.customer_phone ? ` · ${it.customer_phone}` : ""}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
};

export default IndentListing;

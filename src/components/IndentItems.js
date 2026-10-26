import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// Business rules from the BRD / previous ItemAdd screen.
export const itemError = (item, mode) => {
  if (mode === "kitchen") {
    const agreed = num(item.qty_agreed_kitchen);
    if (agreed === null || isNaN(agreed) || agreed < 0) return "Enter agreed qty";
    if (agreed > Number(item.qty_ordered)) return `Max ${item.qty_ordered}`;
    if (agreed < Number(item.qty_ordered) && !item.kitchen_remarks) return "Add a remark for the shortfall";
  }
  if (mode === "receive") {
    const rec = num(item.qty_received);
    const agreed = num(item.qty_agreed_kitchen) ?? Number(item.qty_ordered);
    if (rec === null || isNaN(rec) || rec < 0) return "Enter received qty";
    if (rec > agreed) return `Max ${agreed}`;
    if (rec < agreed && !item.discrepancy_notes) return "Add a discrepancy note";
  }
  return "";
};

const Qty = ({ label, value, highlight }) => (
  <Box sx={{ textAlign: "center", minWidth: 64 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography fontWeight={700} color={highlight ? "error.main" : "text.primary"}>
      {value ?? "-"}
    </Typography>
  </Box>
);

/**
 * mode: "create"  - branch building a new indent (edit / delete)
 *       "kitchen" - kitchen fills agreed qty + remarks (status A)
 *       "receive" - branch fills received qty + notes (status D)
 *       "view"    - read only
 */
const IndentItems = ({ items, mode = "view", onChange, onEdit, onDelete }) => {
  if (!items?.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        No items yet.
      </Typography>
    );
  }
  return (
    <Stack spacing={1.25}>
      {items.map((it) => {
        const err = itemError(it, mode);
        const hasAgreed = it.qty_agreed_kitchen !== null && it.qty_agreed_kitchen !== undefined && it.qty_agreed_kitchen !== "";
        const showAgreed = mode === "receive" || (mode === "view" && hasAgreed);
        const showReceived = mode === "receive" || (mode === "view" && it.qty_received !== null && it.qty_received !== undefined);
        const short = num(it.qty_agreed_kitchen) !== null && num(it.qty_agreed_kitchen) < Number(it.qty_ordered);
        return (
          <Card key={it.id ?? it.item_code} sx={{ borderColor: err ? "warning.light" : undefined }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ wordBreak: "break-word" }}>
                    {it.item_name || it.item_code}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.25, flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {it.uom || ""}
                    </Typography>
                    {it.mandatory_status === "Y" && <Chip size="small" label="Full qty" color="primary" variant="outlined" />}
                  </Stack>
                </Box>
                {mode === "create" && (
                  <>
                    <IconButton aria-label="Edit item" onClick={() => onEdit?.(it)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label="Remove item" onClick={() => onDelete?.(it)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </>
                )}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Qty label="Required" value={it.qty_ordered} />
                {showAgreed && mode !== "kitchen" && <Qty label="Agreed" value={it.qty_agreed_kitchen} highlight={short} />}
                {showReceived && mode !== "receive" && <Qty label="Received" value={it.qty_received} />}
              </Stack>

              {mode === "create" && it.kitchen_remarks && (
                <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                  Kitchen: {it.kitchen_remarks}{num(it.qty_agreed_kitchen) !== null ? ` (available ${it.qty_agreed_kitchen})` : ""}
                </Typography>
              )}

              {mode === "view" && (it.kitchen_remarks || it.discrepancy_notes || it.damage_notes) && (
                <Box sx={{ mt: 1 }}>
                  {it.kitchen_remarks && <Typography variant="body2">Kitchen: {it.kitchen_remarks}</Typography>}
                  {it.discrepancy_notes && <Typography variant="body2">Discrepancy: {it.discrepancy_notes}</Typography>}
                  {it.damage_notes && <Typography variant="body2">Damage: {it.damage_notes}</Typography>}
                </Box>
              )}

              {mode === "kitchen" && (
                <Box sx={{ display: "grid", gap: 1, mt: 1.5, gridTemplateColumns: { xs: "110px 1fr", sm: "140px 1fr" } }}>
                  <TextField
                    label="Agreed qty"
                    type="number"
                    size="small"
                    inputProps={{ min: 0, inputMode: "decimal" }}
                    value={it.qty_agreed_kitchen ?? ""}
                    disabled={it.mandatory_status === "Y"}
                    helperText={it.mandatory_status === "Y" ? "Full qty requested" : null}
                    onChange={(e) => onChange?.(it.id, { qty_agreed_kitchen: e.target.value })}
                  />
                  <TextField
                    label="Kitchen remark"
                    size="small"
                    value={it.kitchen_remarks ?? ""}
                    onChange={(e) => onChange?.(it.id, { kitchen_remarks: e.target.value })}
                  />
                </Box>
              )}

              {mode === "receive" && (
                <Box sx={{ display: "grid", gap: 1, mt: 1.5, gridTemplateColumns: { xs: "110px 1fr", sm: "140px 1fr" } }}>
                  <TextField
                    label="Received"
                    type="number"
                    size="small"
                    inputProps={{ min: 0, inputMode: "decimal" }}
                    value={it.qty_received ?? ""}
                    onChange={(e) => onChange?.(it.id, { qty_received: e.target.value })}
                  />
                  <TextField
                    label="Discrepancy note"
                    size="small"
                    value={it.discrepancy_notes ?? ""}
                    onChange={(e) => onChange?.(it.id, { discrepancy_notes: e.target.value })}
                  />
                  <TextField
                    label="Damage note"
                    size="small"
                    value={it.damage_notes ?? ""}
                    onChange={(e) => onChange?.(it.id, { damage_notes: e.target.value })}
                    sx={{ gridColumn: "1 / -1" }}
                  />
                  {it.kitchen_remarks && (
                    <Typography variant="body2" color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
                      Kitchen remark: {it.kitchen_remarks}
                    </Typography>
                  )}
                </Box>
              )}

              {err && (mode === "kitchen" || mode === "receive") && (
                <Typography variant="caption" color="warning.dark" sx={{ display: "block", mt: 0.75 }}>
                  {err}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default IndentItems;

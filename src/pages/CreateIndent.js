import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import IndentItems from "../components/IndentItems";
import ItemPickerDialog from "../components/ItemPickerDialog";
import Loader from "../components/Loader";
import { createNewIndent, getAllBranches, getProducts } from "../utilities/service";
import { useUser } from "../utilities/UserContext";

// Canadian phone: 514-555-1234, (514) 555-1234, 5145551234
const PHONE_RE = /^(\(\d{3}\)\s?|\d{3}[-\s]?)\d{3}[-\s]?\d{4}$/;

// Default delivery: 2 hours from now, rounded up to the next 15 minutes
const defaultDelivery = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d;
};

const emptyForm = (kitchenId) => ({
  self_customer: "S",
  priority_flag: "N",
  delivery_by_datetime: defaultDelivery(),
  kitchen_id: kitchenId || "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  customer_pin: "",
});

const CreateIndent = ({ onCreated }) => {
  const { user } = useUser();
  const [kitchens, setKitchens] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [rows, setRows] = useState([]);
  const [picker, setPicker] = useState({ open: false, item: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [minDelivery] = useState(() => new Date(Date.now() - 60 * 1000));

  useEffect(() => {
    (async () => {
      try {
        const [k, p] = await Promise.all([getAllBranches("K"), getProducts()]);
        const activeKitchens = k.filter((b) => b.branch_status !== "I");
        setKitchens(activeKitchens);
        setProducts(p?.products || []);
        setForm(emptyForm(activeKitchens[0]?.branch_id));
      } catch (e) {
        setError("Could not load kitchens or products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const forCustomer = form.self_customer === "C";
  const phoneInvalid = forCustomer && form.customer_phone && !PHONE_RE.test(form.customer_phone.trim());
  const canSubmit =
    rows.length > 0 &&
    form.kitchen_id &&
    form.delivery_by_datetime &&
    (!forCustomer || (form.customer_name.trim() && form.customer_phone.trim() && !phoneInvalid)) &&
    !saving;

  const saveItem = (item) => {
    setRows((rs) => {
      const exists = rs.find((r) => r.item_code === item.item_code);
      if (exists) return rs.map((r) => (r.item_code === item.item_code ? { ...r, ...item } : r));
      return [...rs, { ...item, id: item.item_code }];
    });
    setPicker({ open: false, item: null });
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      customer_name: forCustomer ? form.customer_name.trim() : null,
      customer_phone: forCustomer ? form.customer_phone.trim() : null,
      customer_address: forCustomer ? form.customer_address.trim() || null : null,
      customer_pin: forCustomer ? form.customer_pin.trim() || null : null,
      org_id: user?.org_id,
      branch_id: user?.branch_id,
      user_id: user?.user_id,
      status: "C",
      indent_details: rows.map(({ id, uom, ...r }) => r),
    };
    const res = await createNewIndent(payload);
    setSaving(false);
    if (res?.status === 200) {
      const no = res.indent?.indent_number;
      setToast(no ? `Indent ${no} sent to kitchen` : "Indent sent to kitchen");
      setRows([]);
      setForm(emptyForm(form.kitchen_id));
      setTimeout(() => onCreated?.(), 1200);
    } else {
      setError(res?.response?.data?.message || "Could not create the indent. Please try again.");
    }
  };

  if (loading) return <Loader inline />;

  return (
    <Box sx={{ pb: 10 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 1.5 }}>Request details</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
            <TextField select label="Kitchen" value={form.kitchen_id} onChange={(e) => set("kitchen_id", e.target.value)} required>
              {kitchens.map((k) => (
                <MenuItem key={k.branch_id} value={k.branch_id}>{k.branch_name}</MenuItem>
              ))}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Deliver by"
                value={form.delivery_by_datetime}
                onChange={(v) => set("delivery_by_datetime", v)}
                minDateTime={minDelivery}
                slotProps={{ textField: { required: true } }}
              />
            </LocalizationProvider>
            <Box>
              <Typography variant="caption" color="text.secondary">Requested for</Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" color="primary" value={form.self_customer}
                onChange={(e, v) => v && set("self_customer", v)}>
                <ToggleButton value="S">Self</ToggleButton>
                <ToggleButton value="C">Customer</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Priority</Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" color="primary" value={form.priority_flag}
                onChange={(e, v) => v && set("priority_flag", v)}>
                <ToggleButton value="N">Normal</ToggleButton>
                <ToggleButton value="Y">Priority</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {forCustomer && (
            <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField label="Customer name" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} required />
              <TextField label="Customer phone" type="tel" value={form.customer_phone}
                onChange={(e) => set("customer_phone", e.target.value)} required error={!!phoneInvalid}
                helperText={phoneInvalid ? "e.g. 514-555-1234 or (514) 555-1234" : " "} />
              <TextField label="Customer address" value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} />
              <TextField label="Postal code" value={form.customer_pin} onChange={(e) => set("customer_pin", e.target.value)}
                inputProps={{ style: { textTransform: "uppercase" } }} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          Items ({rows.length})
        </Typography>
        <Button startIcon={<AddIcon />} onClick={() => setPicker({ open: true, item: null })}>
          Add item
        </Button>
      </Stack>
      <IndentItems
        items={rows}
        mode="create"
        onEdit={(it) => setPicker({ open: true, item: it })}
        onDelete={(it) => setRows((rs) => rs.filter((r) => r.item_code !== it.item_code))}
      />

      <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10, p: 1.5,
        pb: "calc(12px + env(safe-area-inset-bottom))", bgcolor: "background.paper",
        borderTop: 1, borderColor: "divider", display: "flex", gap: 1, alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {rows.length ? `${rows.length} item(s)` : "Add at least one item"}
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setPicker({ open: true, item: null })}>
          Item
        </Button>
        <Button variant="contained" disabled={!canSubmit} onClick={submit}>
          {saving ? "Sending..." : forCustomer ? "Submit for customer" : "Submit indent"}
        </Button>
      </Box>

      <ItemPickerDialog
        open={picker.open}
        initial={picker.item}
        products={products}
        existingCodes={rows.map((r) => r.item_code)}
        onClose={() => setPicker({ open: false, item: null })}
        onSave={saveItem}
      />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
};

export default CreateIndent;

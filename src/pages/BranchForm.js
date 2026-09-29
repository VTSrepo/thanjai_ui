import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid2,
  InputAdornment,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { useUser } from "../utilities/UserContext";
import { getBranch, saveBranch } from "../utilities/service";
import { PROVINCES, provinceByCode, GST_PATTERN, QST_PATTERN } from "../utilities/tax";
import { CREDIT_TERMS } from "../utilities/helpers";

const EMPTY = {
  branch_id: "",
  branch_name: "",
  branch_type: "B",
  ownership_type: "O",
  branch_status: "A",
  branch_opendate: "",
  branch_address: "",
  branch_city: "",
  province_code: "",
  postal_code: "",
  branch_contact_num: "",
  branch_email_id: "",
  branch_cont_pers: "",
  branch_cont_pers_phone: "",
  branch_Cont_pers_email: "",
  legal_name: "",
  gst_hst_reg_no: "",
  qst_reg_no: "",
  gst_hst_rate: "",
  qst_rate: "",
  invoice_notes: "",
  credit_term: "EOM",
};

const Section = ({ title, hint, children }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography fontWeight={700}>{title}</Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {hint}
        </Typography>
      )}
      <Divider sx={{ my: 1.5 }} />
      <Grid2 container spacing={2}>
        {children}
      </Grid2>
    </CardContent>
  </Card>
);

const Field = ({ md = 6, ...props }) => (
  <Grid2 size={{ xs: 12, md }}>
    <TextField fullWidth {...props} />
  </Grid2>
);

const BranchForm = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const branchId = useLocation().state?.branchId;
  const isNew = !branchId;
  document.title = `${isNew ? "New" : "Edit"} Branch | ${CONFIG.title.name}`;

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const b = await getBranch(branchId);
        const next = { ...EMPTY };
        Object.keys(EMPTY).forEach((k) => {
          if (b?.[k] !== null && b?.[k] !== undefined) next[k] = String(b[k]);
        });
        setForm(next);
      } catch (e) {
        setError("Could not load this branch");
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId, isNew]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.value);

  // Picking a province pre-fills the standard rates (still editable).
  const onProvince = (e) => {
    const p = provinceByCode(e.target.value);
    setForm((f) => ({
      ...f,
      province_code: e.target.value,
      gst_hst_rate: p ? String(p.gst) : f.gst_hst_rate,
      qst_rate: p ? String(p.qst ?? 0) : f.qst_rate,
    }));
  };

  const prov = provinceByCode(form.province_code);
  const gstLabel = prov?.gstLabel || "GST/HST";
  const gstInvalid = form.gst_hst_reg_no && !GST_PATTERN.test(form.gst_hst_reg_no.replace(/\s/g, ""));
  const qstInvalid = form.qst_reg_no && !QST_PATTERN.test(form.qst_reg_no.replace(/\s/g, ""));
  const canSave = form.branch_name.trim() && !gstInvalid && !qstInvalid && !saving;

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await saveBranch(form);
      if (res?.status !== 200) throw new Error(res?.message || "Could not save branch");
      setToast(res.message);
      setForm((f) => ({ ...f, branch_id: res.branch.branch_id }));
      setTimeout(() => navigate("/branch"), 900);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <ResponsiveAppBar onLogout={() => navigate("/login")} user={user} />
      <Box sx={{ p: 2, maxWidth: 900, mx: "auto", pb: 12 }}>
        <PageHeader
          title={isNew ? "New Branch" : form.branch_name || "Edit Branch"}
          subtitle={isNew ? "Branch ID is assigned on save" : form.branch_id}
          onBack={() => navigate("/branch")}
        />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Section title="Basic details">
          <Field md={12} label="Branch name" name="branch_name" value={form.branch_name} onChange={onChange} required />
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Type</Typography>
            <ToggleButtonGroup exclusive fullWidth color="primary" value={form.branch_type}
              onChange={(e, v) => v && set("branch_type", v)}>
              <ToggleButton value="B">Branch</ToggleButton>
              <ToggleButton value="K">Kitchen</ToggleButton>
              <ToggleButton value="X">External</ToggleButton>
            </ToggleButtonGroup>
          </Grid2>
          {form.branch_type === "X" ? (
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                External customer: can place orders, track them, confirm receipt and see their invoices. Create their login in User Master with type External.
              </Typography>
            </Grid2>
          ) : (
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Ownership</Typography>
            <ToggleButtonGroup exclusive fullWidth color="primary" value={form.ownership_type}
              onChange={(e, v) => v && set("ownership_type", v)}>
              <ToggleButton value="O">Own</ToggleButton>
              <ToggleButton value="F">Franchise</ToggleButton>
            </ToggleButtonGroup>
          </Grid2>
          )}
          {form.branch_type !== "K" && (
            <Field select label="Default credit term" name="credit_term" value={form.credit_term || "EOM"} onChange={onChange}
              helperText="Copied onto each invoice billed to this customer">
              {CREDIT_TERMS.map((t) => <MenuItem key={t.code} value={t.code}>{t.label} ({t.printed})</MenuItem>)}
            </Field>
          )}
          <Field select label="Status" name="branch_status" value={form.branch_status} onChange={onChange}>
            <MenuItem value="A">Active</MenuItem>
            <MenuItem value="I">Inactive</MenuItem>
          </Field>
          <Field type="date" label="Opening date" name="branch_opendate" value={form.branch_opendate}
            onChange={onChange} InputLabelProps={{ shrink: true }} />
        </Section>

        <Section title="Address">
          <Field md={12} label="Street address" name="branch_address" value={form.branch_address} onChange={onChange} multiline minRows={2} />
          <Field md={5} label="City" name="branch_city" value={form.branch_city} onChange={onChange} />
          <Field md={4} select label="Province" name="province_code" value={form.province_code} onChange={onProvince}>
            <MenuItem value="">Not set</MenuItem>
            {PROVINCES.map((p) => (
              <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>
            ))}
          </Field>
          <Field md={3} label="Postal code" name="postal_code" value={form.postal_code} onChange={onChange}
            inputProps={{ style: { textTransform: "uppercase" } }} />
        </Section>

        <Section title="Contact">
          <Field label="Branch phone" name="branch_contact_num" value={form.branch_contact_num} onChange={onChange} type="tel" />
          <Field label="Branch email" name="branch_email_id" value={form.branch_email_id} onChange={onChange} type="email" />
          <Field md={4} label="Contact person" name="branch_cont_pers" value={form.branch_cont_pers} onChange={onChange} />
          <Field md={4} label="Contact phone" name="branch_cont_pers_phone" value={form.branch_cont_pers_phone} onChange={onChange} type="tel" />
          <Field md={4} label="Contact email" name="branch_Cont_pers_email" value={form.branch_Cont_pers_email} onChange={onChange} type="email" />
        </Section>

        <Section
          title="Tax & invoicing"
          hint="Printed on invoices. For a kitchen these are the taxes it charges. Choosing a province fills the standard rates (Quebec: GST 5% + QST 9.975%); you can edit them."
        >
          <Field md={12} label="Legal / billing name" name="legal_name" value={form.legal_name} onChange={onChange}
            helperText={form.ownership_type === "F" ? "Franchise's registered business name" : "Leave blank to use the branch name"} />
          <Field label={`${gstLabel} registration no.`} name="gst_hst_reg_no" value={form.gst_hst_reg_no}
            onChange={onChange} placeholder="123456789RT0001" error={!!gstInvalid}
            helperText={gstInvalid ? "Format: 9 digits + RT + 4 digits" : " "}
            inputProps={{ style: { textTransform: "uppercase" } }} />
          <Field label={`${gstLabel} rate`} name="gst_hst_rate" value={form.gst_hst_rate} onChange={onChange}
            type="number" inputProps={{ step: "0.001", min: 0, max: 20 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText=" " />
          <>
              <Field label="QST registration no." name="qst_reg_no" value={form.qst_reg_no} onChange={onChange}
                placeholder="1234567890TQ0001" error={!!qstInvalid}
                helperText={qstInvalid ? "Format: 10 digits + TQ + 4 digits" : " "}
                inputProps={{ style: { textTransform: "uppercase" } }} />
              <Field label="QST rate" name="qst_rate" value={form.qst_rate} onChange={onChange}
                type="number" inputProps={{ step: "0.001", min: 0, max: 20 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                helperText={form.province_code && form.province_code !== "QC" ? "QST applies in Quebec only - usually 0" : " "} />
            </>
          <Field md={12} label="Invoice notes" name="invoice_notes" value={form.invoice_notes} onChange={onChange}
            multiline minRows={2} placeholder="e.g. Thanks for your business. Please send the payment by Interac: info@thanjaisnacks.com"
            helperText="Printed at the bottom of invoices this kitchen issues" />
        </Section>
      </Box>

      {/* Sticky action bar: thumb-reachable on phones */}
      <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, p: 1.5, bgcolor: "background.paper",
        borderTop: 1, borderColor: "divider", display: "flex", gap: 1, justifyContent: "flex-end",
        pb: "calc(12px + env(safe-area-inset-bottom))", zIndex: 10 }}>
        <Button variant="outlined" color="secondary" onClick={() => navigate("/branch")}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!canSave} sx={{ minWidth: 140 }}>
          {saving ? "Saving..." : isNew ? "Create branch" : "Save changes"}
        </Button>
      </Box>
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast("")} message={toast} />
    </>
  );
};

export default BranchForm;

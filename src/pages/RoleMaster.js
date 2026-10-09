import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { useToast } from "../components/ToastProvider";
import { deleteRole, getRoles, saveRole } from "../utilities/service";
import { useUser } from "../utilities/UserContext";

const LEVELS = [
  ["", "None"],
  ["V", "View"],
  ["E", "Edit"],
];

const RoleDialog = ({ role, meta, onClose, onSaved }) => {
  const toast = useToast();
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (role) setForm({ role_id: role.role_id || null, role_name: role.role_name || "", description: role.description || "",
      scope: role.scope || "O", status: role.status || "A", screens: { ...(role.screens || {}) } });
    setError("");
  }, [role]);
  const groups = useMemo(() => {
    const g = {};
    (meta?.screens || []).forEach((s) => (g[s.group] = g[s.group] || []).push(s));
    return g;
  }, [meta]);
  if (!form) return null;
  const locked = form.role_id === "ADMIN";
  const setLevel = (code, lvl) =>
    setForm((f) => {
      const screens = { ...f.screens };
      if (lvl) screens[code] = lvl; else delete screens[code];
      return { ...f, screens };
    });
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await saveRole(form);
      toast.success(r.message || "Role saved");
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={!!role} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md">
      <DialogTitle>{form.role_id ? `Role · ${form.role_name}` : "New role"}</DialogTitle>
      <DialogContent>
        {locked && <Alert icon={<LockIcon />} severity="info" sx={{ mb: 2 }}>The Admin role always has full access.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1, mb: 2 }}>
          <TextField label="Role name" value={form.role_name} disabled={locked} fullWidth inputProps={{ maxLength: 100 }}
            onChange={(e) => setForm({ ...form, role_name: e.target.value })} />
          <TextField select label="For user type" value={form.scope} disabled={locked} sx={{ minWidth: 220 }}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            helperText="Decides whose data they see">
            {Object.entries(meta?.user_types || {}).filter(([k]) => k !== "A").map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={form.status} disabled={locked} sx={{ minWidth: 130 }}
            onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <MenuItem value="A">Active</MenuItem>
            <MenuItem value="I">Inactive</MenuItem>
          </TextField>
        </Stack>
        <TextField label="Description" value={form.description} disabled={locked} fullWidth sx={{ mb: 2 }}
          onChange={(e) => setForm({ ...form, description: e.target.value })} inputProps={{ maxLength: 500 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Screens</Typography>
        {Object.entries(groups).map(([group, screens]) => (
          <Box key={group} sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>{group}</Typography>
            {screens.map((s) => (
              <Stack key={s.code} direction="row" alignItems="center" spacing={1} sx={{ py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>{s.label}</Typography>
                <ToggleButtonGroup size="small" exclusive disabled={locked} value={locked ? "E" : form.screens[s.code] || ""}
                  onChange={(e, v) => v !== null && setLevel(s.code, v)}>
                  {LEVELS.map(([v, l]) => <ToggleButton key={l} value={v} sx={{ px: 1.25, py: 0.25 }}>{l}</ToggleButton>)}
                </ToggleButtonGroup>
              </Stack>
            ))}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        {!locked && <Button variant="contained" disabled={saving || !form.role_name.trim()} onClick={save}>{saving ? "Saving..." : "Save"}</Button>}
      </DialogActions>
    </Dialog>
  );
};

const RoleMaster = () => {
  document.title = `Roles | ${CONFIG.title.name}`;
  const toast = useToast();
  const { can } = useUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => getRoles().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const canEdit = can("M_ROLE", true);

  const remove = async (r) => {
    try {
      const res = await deleteRole(r.role_id);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1000, mx: "auto" }}>
        <PageHeader title="Roles" subtitle="Which screens each role can open. Assign roles in User Master."
          action={canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEdit({})}>New role</Button>} />
        {error && <Alert severity="error">{error}</Alert>}
        {!data ? <Loader inline /> : (
          <Stack spacing={1.25}>
            {data.roles.map((r) => (
              <Card key={r.role_id}>
                <CardActionArea onClick={() => setEdit(r)}>
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                      <Typography fontWeight={700} sx={{ mr: "auto" }}>{r.role_name}</Typography>
                      <Chip size="small" label={r.scope_label} />
                      {r.is_system === "Y" && <Chip size="small" variant="outlined" label="Built-in" />}
                      {r.status !== "A" && <Chip size="small" color="warning" label="Inactive" />}
                      <Chip size="small" variant="outlined" label={`${r.user_count} user(s)`} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {r.role_id === "ADMIN" ? "All screens" : `${Object.keys(r.screens).length} screen(s)`}{r.description ? ` · ${r.description}` : ""}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                {canEdit && r.is_system !== "Y" && r.user_count === 0 && (
                  <Box sx={{ px: 2, pb: 1 }}><Button size="small" color="error" onClick={() => remove(r)}>Delete</Button></Box>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Box>
      <RoleDialog role={edit} meta={data} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
    </>
  );
};

export default RoleMaster;

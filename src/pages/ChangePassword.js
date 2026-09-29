import React, { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/ToastProvider";
import { useUser } from "../utilities/UserContext";
import { changePassword } from "../utilities/service";
import { landingFor } from "../utilities/routes";

const MIN = 6;

// Used by everyone from the account menu, and forced after an admin password reset.
const ChangePassword = () => {
  document.title = `Change password | ${CONFIG.title.name}`;
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const forced = !!user?.must_change_pwd;
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const tooShort = form.next && form.next.length < MIN;
  const mismatch = form.confirm && form.next !== form.confirm;
  const canSave = form.current && form.next.length >= MIN && form.next === form.confirm && !busy;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await changePassword(form.current, form.next);
      updateUser({ must_change_pwd: false });
      toast.success("Password changed");
      navigate(landingFor(user), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!forced && <ResponsiveAppBar />}
      <Box sx={{ p: 2, maxWidth: 480, mx: "auto", mt: forced ? 6 : 0 }}>
        <PageHeader title="Change password" subtitle={user?.user_id} onBack={forced ? null : () => navigate(-1)} />
        {forced && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your password was reset by the admin. Please choose a new password to continue.
          </Alert>
        )}
        <Card>
          <CardContent>
            <Stack component="form" spacing={2} onSubmit={save}>
              <TextField type="password" label={forced ? "Temporary password" : "Current password"} name="current"
                value={form.current} onChange={set} autoComplete="current-password" required />
              <TextField type="password" label="New password" name="next" value={form.next} onChange={set}
                autoComplete="new-password" required error={!!tooShort}
                helperText={tooShort ? `At least ${MIN} characters` : `At least ${MIN} characters`} />
              <TextField type="password" label="Confirm new password" name="confirm" value={form.confirm} onChange={set}
                autoComplete="new-password" required error={!!mismatch} helperText={mismatch ? "Does not match" : " "} />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={!canSave}>{busy ? "Saving..." : "Change password"}</Button>
              {forced && (
                <Typography variant="caption" color="text.secondary">Forgot the temporary password? Ask your admin to reset it again.</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default ChangePassword;

import React, { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, IconButton, TextField, Typography } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { resetUserPassword } from "../utilities/service";
import { useToast } from "./ToastProvider";

// Readable temporary password, e.g. "Thanjai-4821"
const makeTemp = () => `Thanjai-${Math.floor(1000 + Math.random() * 9000)}`;

// Admin sets a temporary password for a user who forgot theirs; they must change it at next login.
const ResetPasswordDialog = ({ open, userId, userName, onClose }) => {
  const toast = useToast();
  const [temp, setTemp] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTemp(makeTemp());
      setDone(false);
      setError("");
    }
  }, [open]);

  const reset = async () => {
    setBusy(true);
    setError("");
    try {
      await resetUserPassword(userId, temp);
      setDone(true);
      toast.success("Password reset");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {userName || userId} will log in with this temporary password and must choose a new one.
        </Typography>
        <TextField fullWidth label="Temporary password" value={temp} onChange={(e) => setTemp(e.target.value)} disabled={done}
          helperText="At least 6 characters. Share it with the user directly."
          InputProps={{ endAdornment: !done && (
            <InputAdornment position="end">
              <IconButton aria-label="New suggestion" onClick={() => setTemp(makeTemp())}><AutorenewIcon /></IconButton>
            </InputAdornment>
          ) }} />
        {done && <Alert severity="success" sx={{ mt: 2 }}>Done. Tell {userName || "the user"} the temporary password: <b>{temp}</b></Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>{done ? "Close" : "Cancel"}</Button>
        {!done && <Button variant="contained" disabled={busy || temp.length < 6} onClick={reset}>{busy ? "Resetting..." : "Reset"}</Button>}
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordDialog;

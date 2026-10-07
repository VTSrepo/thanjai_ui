import React, { useState } from "react";
import { Alert, Box, Button, Container, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../utilities/UserContext";
import { API_URL } from "../utilities/service";
import { landingFor } from "../utilities/routes";

const Login = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) return setError("Enter your user ID and password");
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/login`, { user: { user_id: username.trim(), pwd: password } });
      login(data.user, data.token);
      navigate(data.user.must_change_pwd ? "/change-password" : landingFor(data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        component="form"
        sx={{ mt: 8, p: 2 }}
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Thanjai" style={{ maxWidth: "70%" }} />
        </Box>
        <TextField label="User ID" fullWidth sx={{ mt: 2 }} value={username} autoComplete="username"
          autoCapitalize="none" onChange={(e) => setUsername(e.target.value)} />
        <TextField label="Password" type="password" fullWidth sx={{ mt: 2 }} value={password}
          autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button variant="contained" fullWidth sx={{ mt: 2 }} type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Login"}
        </Button>
      </Box>
    </Container>
  );
};

export default Login;

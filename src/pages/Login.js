import React, { useState } from "react";
import {
  Grid2,
  Container,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { purple } from '@mui/material/colors';
import axios from "axios";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  // Define the base URL for your API
  const API_URL = "http://localhost:4002/v1/"; // Change this to your actual API URL

  const theme = createTheme({
    palette: {
      primary: {
        main: '#ffa133',
      },
      secondary: {
        main: '#f44336',
      },
    },    
  });

  // Login function to make the POST request
  const login = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        user: {
          user_id: username,
          pwd: password,
        },
      });
      // Check if the response contains the token (JWT or similar)
      if (response.data && response.data) {
        // You could store the token in localStorage, sessionStorage, or a global state management solution (like Redux or Context API)
        localStorage.setItem("user", response.data.user);
        return response.data.data; // Return the response data (which may include user info and token)
      } else {
        throw new Error("Login failed: No token received");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      throw error; // Propagate the error so the caller can handle it (e.g., show error message)
    }
  };

  const handleChange = (event) => {
    setUsername(event.target.value);
  };

  const handleLogin = async () => {
    const res = await login();

    if (res.user.user_type === "A") {
      setUser({ username, role: "admin" });
      navigate("/admin");
    } else if (res.user.user_type === "B") {
      setUser({ username, role: "branch" });
      navigate("/home");
    } else {
      setUser({ username, role: "kitchen" });
      navigate("/home");
    }
  };

  return (
    <ThemeProvider theme={theme}>
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, padding: 2 }}>
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="Logo" />
        </div>

        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          value={username}
          onChange={handleChange}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          sx={{ mt: 2 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </Container>
    </ThemeProvider>
  );
};

export default Login;

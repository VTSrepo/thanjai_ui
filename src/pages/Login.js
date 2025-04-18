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
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { purple } from "@mui/material/colors";
import axios from "axios";
import { useUser } from "../utilities/UserContext";
import { API_URL } from "../utilities/service";

const Login = ({ setUser }) => {
  const { login } = useUser(); // Destructure login function from context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  const theme = createTheme({
    palette: {
      primary: {
        main: "#ffa133",
      },
      secondary: {
        main: "#f44336",
      },
    },
  });

  // Login function to make the POST request
  const loginApi = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        user: {
          user_id: username,
          pwd: password,
        },
      });
      if (response.data && response.data) {
        if (response.data.status === 401) {
          setError("Invalid Credentials");
          return null;
        } else {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          return response.data; // Return the response data (which may include user info and token)
        }
      } else {
        throw new Error("Login failed: No token received");
      }
    } catch (error) {
      setError("Invalid Credentials");
    }
  };

  const handleChange = (event) => {
    setUsername(event.target.value);
  };

  const handleLogin = async () => {
    const res = await loginApi();
    if(res){
      login(res.user); // Send data to context
      if (res.user.user_type === "A") {
        setUser({ username, role: "admin" });
        navigate("/admin");
      } else if (res.user.user_type === "B") {
        setUser({ username, role: "branch" });
        navigate("/indents");
      } else {
        setUser({ username, role: "kitchen" });
        navigate("/indents");
      }
    }    
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, padding: 2 }}>
          <div style={{ textAlign: "center" }}>
            <img src="/v1/logo.png" alt="Logo" />
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
            <Typography sx={{marginTop:2}} color="error" align="center">
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

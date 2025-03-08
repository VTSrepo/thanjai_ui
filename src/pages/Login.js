import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  // Define the base URL for your API
  const API_URL = "http://localhost:4003/v1/"; // Change this to your actual API URL

  // Login function to make the POST request
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        user: {
          user_id: "NRK00010001",
          pwd: "nrkadmin",
        },
      });      
      // Check if the response contains the token (JWT or similar)
      if (response.data && response.data) {
        // You could store the token in localStorage, sessionStorage, or a global state management solution (like Redux or Context API)
        localStorage.setItem("user", response.data.user);
        return response.data; // Return the response data (which may include user info and token)
      } else {
        throw new Error("Login failed: No token received");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      throw error; // Propagate the error so the caller can handle it (e.g., show error message)
    }
  };

  const handleLogin = async () => {
    const res = await login();
    if(res.user.user_type === 'E'){
        setUser({ username, role: "admin" });
        navigate("/admin"); // Use navigate to go to the admin page
    }
    // Simple validation for demonstration purposes
    // if (username === "admin" && password === "admin123") {
    //   setUser({ username, role: "admin" });
    //   navigate("/admin"); // Use navigate to go to the admin page
    // } else if (username === "user" && password === "user123") {
    //   setUser({ username, role: "user" });
    //   navigate("/home"); // Use navigate to go to the user page
    // } else {
    //   setError("Invalid username or password");
    // }
  };

  return (
    <Box sx={{ mt: 8, padding:2 }}>
      <Typography variant="h4" align="center">
        Login
      </Typography>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
  );
};

export default Login;

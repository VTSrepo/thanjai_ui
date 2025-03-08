import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";  // Import useNavigate

const Home = () => {
  const navigate = useNavigate();  // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login");  // Use navigate to go to the login page
  };

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant="h4">Welcome, User!</Typography>
      <Button
        variant="contained"
        color="secondary"
        sx={{ mt: 2 }}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Box>
  );
};

export default Home;

import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { CONFIG } from "../../src/config-global"
import ResponsiveAppBar from "../components/ResponsiveAppBar";

const Home = ({ user }) => {
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };
  document.title =`Home | ${CONFIG.title.name}`

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Typography variant="h4">Welcome, {user?.username}!</Typography>            
    </>
  );
};

export default Home;

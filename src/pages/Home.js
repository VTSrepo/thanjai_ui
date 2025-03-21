import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import NavTab from "../components/NavTab";
import IndentItemTable from "../components/IndentItemTable";

const Home = ({ user }) => {
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Typography variant="h4">Welcome, {user?.username}!</Typography>
      <NavTab />
    </>
  );
};

export default Home;

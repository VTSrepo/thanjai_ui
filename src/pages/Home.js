import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import IndentTable from "../components/IndentTable";

const Home = ({user}) => {
  const navigate = useNavigate();  // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login");  // Use navigate to go to the login page
  };

  
  return (
    <>
    <ResponsiveAppBar onLogout={handleLogout} user={user}/>
    <Box sx={{ mt: 8 }}>
      <Typography variant="h4">Welcome, User!</Typography>
     
      
    </Box>

     <Box sx={{ mt: 2, padding:2 }}> <IndentTable user={user}/></Box>
    </>
  );
};

export default Home;

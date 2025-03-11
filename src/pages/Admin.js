import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import IndentTable from "../components/IndentTable";

const Admin = ({ user }) => {
  console.log(user);
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createIndent = () => {
    navigate("/indent-create");
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 8, padding: 2 }}>
        <Typography variant="h4">Welcome, Admin!</Typography>

        {/* <Box sx={{ mt: 2, padding: 2 }}>
          
          <IndentTable user={user} />
        </Box> */}
      </Box>
    </>
  );
};

export default Admin;

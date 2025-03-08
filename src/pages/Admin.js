import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import IncidentTable from "../components/IncidentTable";

const Admin = ({ user }) => {
  const navigate = useNavigate();  // Replace useHistory with useNavigate

  const handleLogout = () => {
    navigate("/login");  // Use navigate to go to the login page
  };

  const createIndent = () =>{
    navigate("/indent-create");
  }

  return (
    <>    
    <ResponsiveAppBar onLogout={handleLogout} user={user}/> {/* Show AdminAppBar */}
    <Box sx={{ mt: 8, padding:2 }}>
      <Typography variant="h4">Welcome, Admin!</Typography>
      {/* <Button
        variant="contained"
        color="secondary"
        sx={{ mt: 2 }}
        onClick={handleLogout}
      >
        Logout
      </Button> */}

      <Button
        variant="contained"
        color="secondary"
        sx={{ mt: 2 }}
        onClick={createIndent}
      >
        Create Indent
      </Button>
      <Box sx={{ mt: 2, padding:2 }}> <IncidentTable/></Box>
     
    </Box>
    </>
  );
};

export default Admin;

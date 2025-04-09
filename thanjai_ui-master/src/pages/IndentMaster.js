import React  from "react";
import { Box  } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import NavTab from "../components/NavTab";
const IndentMaster = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };
  

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      <Box sx={{ mt: 4, padding: 2 }}>
        <NavTab />
      </Box>
    </>
  );
};

export default IndentMaster;

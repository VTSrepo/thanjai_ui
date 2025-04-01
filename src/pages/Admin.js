import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import IndentItemTable from "../components/IndentItemTable";
import { getProductSummary } from "../utilities/service";

import ProductionDataChart from "../components/ProductionDataChart";

const Admin = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productSummary, setProductSummary] = useState({});

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  useEffect(() => {
    const getProductSummaryListing = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        console.log(today);
        const result = await getProductSummary({ date: "2025-03-28" });

        setProductSummary(result.businesses);
      } catch (err) {
        alert("No data for today");
      } finally {
        setLoading(false);
      }
    };
    getProductSummaryListing();
  }, []);
  if (loading) return <Loader />; // Show loader while data is being fetched
  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 8, padding: 2 }}>
        <Typography variant="h4">Welcome, Admin!</Typography>

        {/* <Box sx={{ mt: 2, padding: 2 }}>
          
          
        </Box> */}
      </Box>
    </>
  );
};

export default Admin;

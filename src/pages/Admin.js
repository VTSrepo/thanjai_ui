import React, { useState, useEffect } from "react";
import { Typography, Box, Grid2 } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import { FormattedDate } from "../utilities/helpers";
import { getProductSummary } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import { TextField, Button } from "@mui/material";

import ProductionDataChart from "../components/ProductionDataChart";

const Admin = () => {
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const today = FormattedDate(new Date());
  const [loading, setLoading] = useState(false);
  const [productSummary, setProductSummary] = useState({});
  const [empSummary, setEmpSummary] = useState({});
  const [formData, setFormData] = useState({
    start_date: today,
    end_date: today,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const retrievePMDashboard = () =>{
    getProductSummaryByProduct();
    getProductSummaryByEmployee();
  }

  const getProductSummaryByProduct = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];      
      const result = await getProductSummary({
        start_date: formData.start_date,
        end_date: formData.end_date,
        type:'productwise'
      });

      setProductSummary(result.dashboard);
    } catch (err) {
      console.log('NO data')
    } finally {
      setLoading(false);
    }
  };

  const getProductSummaryByEmployee = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      console.log(today);
      const result = await getProductSummary({
        start_date: formData.start_date,
        end_date: formData.end_date,
        type:'employeewise'
      });

      setEmpSummary(result.dashboard);
    } catch (err) {
      console.log('NO data')
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  useEffect(() => {
    getProductSummaryByProduct();
    getProductSummaryByEmployee();
  }, []);
  if (loading) return <Loader />; // Show loader while data is being fetched
  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      <Box sx={{ mt: 2, padding: 2 }}>
        <Typography variant="h4">Welcome, {user?.user_name}!</Typography>

        <Box sx={{ mt: 2, padding: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 item size={6}>
              <TextField
                type="date"
                fullWidth
                label="Start Date"
                name="start_date"
                value={formData.start_date}
                InputLabelProps={{ shrink: true }}
                onChange={handleChange}
              ></TextField>
            </Grid2>{" "}
            <Grid2 item size={6}>
              <TextField
                label="End Date"
                fullWidth
                type="date"
                name="end_date"
                value={formData.end_date}
                InputLabelProps={{ shrink: true }}
                onChange={handleChange}
              ></TextField>
            </Grid2>
            <Grid2 item size={2}>
              <Button
                variant="contained"
                color="success"
                disabled={!formData.start_date || !formData.end_date}
                onClick={retrievePMDashboard}
              >
                Search
              </Button>
            </Grid2>
          </Grid2>
          <h3>Production Qty vs Damaged Qty</h3>
          <Grid2 container spacing={3}>
            <Grid2 item size={{ xs: 12, md: 6 }} sx={{ border: "1px solid #ffa133" }}>
              <ProductionDataChart filterBy={'product'} summary={productSummary} />
            </Grid2>
            <Grid2 item size={{ xs: 12, md: 6 }} sx={{ border: "1px solid #ffa133" }}>
            <ProductionDataChart filterBy={'employee'} summary={empSummary} />
            </Grid2>
          </Grid2>
        </Box>
      </Box>
    </>
  );
};

export default Admin;

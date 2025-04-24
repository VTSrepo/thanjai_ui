import React, { useState, useEffect } from "react";
import { Typography, Box, Grid2 } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import { FormattedDate } from "../utilities/helpers";
import {
  getProductReport,
  getProducts,
  getEmployees,
} from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import ProductionMonitorTable from "../components/ProductionMonitorTable";
import { dateFromString } from "../utilities/helpers";

const Reports = () => {
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const today = FormattedDate(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});
  const [empList, setEmpList] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    start_date: today,
    end_date: today,
    product_id: null,
    product_name: null,
    emp_id: null,
    emp_name: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const retrieveReport = () => {
    getProductSummaryReport();
  };

  const getProductSummaryReport = async () => {
    try {
      setLoading(true);
      const result = await getProductReport({
        start_date: formData.start_date,
        end_date: formData.end_date,
        product_id: formData.product_id,
        emp_id: formData.emp_id,
      });
      const updatedData = result.dashboard.map((item, index) => ({
        ...item,
        id: item.id || index + 1, // Appending a unique ID if it doesn't exist
        production_date: dateFromString(item.production_date)
      }));
      setReportData(updatedData);
    } catch (err) {
      if (err.response.data && err.response.data.code === 4001) {
        setReportData([]);
      }
      console.log("NO data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getProductList = async () => {
      try {
        const result = await getProducts();
        const snackItems = result.products.filter(
          (item) => item.bu_id === "TR002"
        );
        setProducts(snackItems);
      } catch (err) {
        console.log(err);
      }
    };

    const getEmployeesList = async () => {
      try {
        const result = await getEmployees();
        setEmpList(result.employees);
      } catch (err) {
        console.log(err);
      }
    };

    getEmployeesList();
    getProductList();
  }, []);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const resetFields = () => {
    setFormData({
      ...formData,
      start_date: today,
      end_date: today,
      product_id: null,
      product_name: null,
      emp_id: null,
      emp_name: null,
    });
  };

  if (loading) return <Loader />; // Show loader while data is being fetched
  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      <Box sx={{ mt: 2, padding: 2 }}>
        <Typography variant="h4">Production Reports</Typography>

        <Box sx={{ mt: 2, padding: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 item size={{ xs: 12, md: 3 }}>
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
            <Grid2 item size={{ xs: 12, md: 3 }}>
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
            {products && (
              <Grid2 item size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth required>
                  <InputLabel>Product Name</InputLabel>
                  <Select
                    label="Product Name"
                    name="product_id"
                    value={formData.product_id || ""}
                    onChange={handleChange}
                  >
                    {products?.map((prod) => (
                      <MenuItem key={prod.product_id} value={prod.product_id}>
                        {prod.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
            )}
            {empList && (
              <Grid2 item size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth required>
                  <InputLabel>Emp Name</InputLabel>
                  <Select
                    label="Emp Name"
                    name="emp_id"
                    value={formData.emp_id || ""}
                    onChange={handleChange}
                  >
                    {empList?.map((mode) => (
                      <MenuItem key={mode.emp_id} value={mode.emp_id}>
                        {mode.emp_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
            )}
            <Grid2 item size={{ xs: 6, md: 3 }}>
              <Button
                variant="contained"
                fullWidth
                color="success"
                disabled={!formData.start_date || !formData.end_date}
                onClick={retrieveReport}
              >
                Search
              </Button>
            </Grid2>
            <Grid2 item size={{ xs: 6, md: 3 }}>
              <Button
                variant="contained"
                fullWidth
                color="success"
                onClick={resetFields}
              >
                Reset
              </Button>
            </Grid2>
          </Grid2>
          <h3>Production Report</h3>
          <Box sx={{ mt: 2, padding: 2 }}>
            {" "}
            <ProductionMonitorTable list={reportData} />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Reports;

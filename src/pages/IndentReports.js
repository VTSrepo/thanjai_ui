import React, { useState, useEffect } from "react";
import { Typography, Box, Grid2 } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import { FormattedDate } from "../utilities/helpers";
import {
    getIndentReport,
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
import IndentReportsTable from "../components/IndentReportsTable";

const IndentReports = () => {
  const location = useLocation(); // Access the location object
  const { user, login, logout } = useUser();
  const { selectedRow } = location.state || {};  
  const navigate = useNavigate();
  const today = FormattedDate(new Date());
  const [loading, setLoading] = useState(false);
  const [indentReportData, setIndentReportData] = useState({});
  const [empList, setEmpList] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    from_date: today,
    to_date: today,
    status: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const statusOptions = [
    { value: "C", label: "Created" },
    { value: "A", label: "Accepted" },
    { value: "D", label: "Dispatched" },
    { value: "R", label: "Received" },
  ];
  
  const retrieveReport = () => {
    getIndentSummaryReport(formData);
  };

  const getIndentSummaryReport = async (payload) => {
    console.log("payload_payload", payload);
    try {
      setLoading(true);      
      const result = await getIndentReport({
        from_date: payload.from_date,
        to_date: payload.to_date,
        status: payload.status,
      });
      console.log("result_indent", result);
      const updatedData = result.indents.map((item, index) => ({
        ...item,
        id: item.id || index + 1, // Appending a unique ID if it doesn't exist
        indent_date: dateFromString(item.indent_date),
      }));
      setIndentReportData(updatedData);
    } catch (err) {
        console.log("err_indent", err);
      if (err.response.data && err.response.data.code === 4001) {
        setIndentReportData([]);
      }
      console.log("NO data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRow) {
      setFormData({
        ...formData,
        from_date: selectedRow.from_date,
        to_date: today,
        status: null
      });
      getIndentSummaryReport(selectedRow)
    }
  }, []);
  

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const resetFields = () => {
    setFormData({
      ...formData,
      from_date: today,
      to_date: today,
      status: null,
    });
  };

  if (loading) return <Loader />; // Show loader while data is being fetched
  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      <Box sx={{ mt: 2, padding: 2 }}>
        <Typography variant="h4">Indent</Typography>

        <Box sx={{ mt: 2, padding: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 item size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                fullWidth
                label="Start Date"
                name="from_date"
                value={formData.from_date}
                InputLabelProps={{ shrink: true }}
                onChange={handleChange}
              ></TextField>
            </Grid2>{" "}
            <Grid2 item size={{ xs: 12, md: 3 }}>
              <TextField
                label="End Date"
                fullWidth
                type="date"
                name="to_date"
                value={formData.to_date}
                InputLabelProps={{ shrink: true }}
                onChange={handleChange}
              ></TextField>
            </Grid2>

            <Grid2 item size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth >
                <InputLabel>Status</InputLabel>
                <Select
                label="Status"
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                >
                {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                    {option.label}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>
            </Grid2>
            <Grid2 item size={{ xs: 12, md: 3 }}>
            </Grid2>

            <Grid2 item size={{ xs: 6, md: 3 }}>
              <Button
                variant="contained"
                fullWidth
                color="success"
                disabled={!formData.from_date || !formData.to_date}
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
          <h3>Indent Report</h3>
          <Box sx={{ mt: 2, padding: 2 }}>
            {" "}
            <IndentReportsTable list={indentReportData} formData={formData} />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default IndentReports;

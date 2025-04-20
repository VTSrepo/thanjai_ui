import React, { useState, useEffect } from "react";

import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Grid2,
  Typography,
  Box,
  Container,
} from "@mui/material";
import ResponsiveAppBar from "../components/ResponsiveAppBar";

import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import { format, utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { parseISO } from "date-fns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import InfoDialog from "../components/InfoDialog";
import { getProducts, getEmployees, saveJob } from "../utilities/service";

function FormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

const DisabledFormWrapper = ({ children, disabled }) => {
  return (
    <div
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
};

function ProductionMonitorForm({ user }) {
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const currentDate = FormattedDate(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
  const [empList, setEmpList] = useState([]);
  const [uom, setUOM] = useState([]);
  const [products, setProducts] = useState([]);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [heading, setHeading] = useState("Job Create");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    product_id: null,
    product_name: null,
    production_date: currentDate,
    start_time: null,
    display_start_time: null,
    display_end_time: null,
    end_time: null,
    production_qty: 0,
    damaged_qty: 0,
    emp_name: null,
    emp_id: null,
    remarks: null,
  });

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

  const convertTimeStringToDate = (timeStr) => {
    const [hours, minutes, seconds] = timeStr.split("-").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0); // Set the hours, minutes, and seconds
    return date;
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const openSuccess = (message) => {
    setMessage(message);
    setOpenDialog(true);
  };

  useEffect(() => {
    if (selectedRow) {
      setIsFormDisabled(true);
      setHeading("View Job");
      setFormData({
        product_id: selectedRow.product_id,
        product_name: selectedRow.product_name,
        production_date: selectedRow.production_date,
        start_time: selectedRow.start_time,
        display_end_time: convertTimeStringToDate(selectedRow.end_time),
        display_start_time: convertTimeStringToDate(selectedRow.start_time),
        end_time: selectedRow.end_time,
        production_qty: selectedRow.production_qty,
        damaged_qty: selectedRow.damaged_qty,
        emp_name: selectedRow.emp_name,
        emp_id: selectedRow.emp_id,
        remarks: selectedRow.remarks,
      });
    }
  }, [selectedRow]);

  const handleChangeStartTime = (e) => {
    const formattedTime = format(e, "HH-mm-ss");

    setFormData({
      ...formData,
      start_time: formattedTime,
      display_start_time: e,
    });
  };

  const handleChangeEndTime = (e) => {
    const formattedTime = format(e, "HH-mm-ss");
    setFormData({
      ...formData,
      end_time: formattedTime,
      display_end_time: e,
    });
  };

  const saveJobHandler = async () => {
    setLoading(true);
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
    const payload = {
      production: {
        org_id: org_id,
        branch_id: branch_id,
        emp_id: formData.emp_id,
        product_id: formData.product_id,
        production_date: formData.production_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        production_qty: formData.production_qty,
        damaged_qty: formData.damaged_qty,
        remarks: formData.remarks,
        user_id: user_id,
      },
    };

    const res = await saveJob(payload);

    if (res.production) {
      setLoading(false);
      openSuccess("Job saved successfully.");
      resetForm();
    } else {
      openSuccess(res.response.data.message);
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      product_id: null,
      product_name: null,
      start_time: null,
      display_start_time: null,
      display_end_time: null,
      end_time: null,
      production_qty: 0,
      damaged_qty: 0,
      remarks: null,
    });
  };

  const handleProdQtyChange = (e) => {
    const min = 1;
    const { name, value } = e.target;
    const val = String(Number(value));

    if (Number(val) <= 0 || isNaN(val)) {
      setError(`Value must be at least ${min}`);
    } else {
      setError("");
    }

    setFormData({
      ...formData,
      production_qty: val,
      damaged_qty: 0,
    });
  };

  const handleDamagedQtyChange = (e) => {
    const min = formData.production_qty;
    const { name, value } = e.target;
    const val = String(Number(value));

    if (Number(val) < 0 || Number(val) > min || isNaN(val)) {
      setError(`Value must be between 0 and ${min}`);
    } else {
      setError("");
    }

    setFormData({
      ...formData,
      [name]: val,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCancel = () => {
    navigate("/production-monitor");
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            {heading}
          </Typography>

          <form className="example-form" noValidate>
            <DisabledFormWrapper disabled={isFormDisabled}>
              <Grid2 container spacing={2}>
                <Grid2 item size={12}>
                  <TextField
                    type="date"
                    name="production_date"
                    value={formData.production_date}
                    onChange={handleChange}
                  ></TextField>
                </Grid2>
                <Grid2 item size={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Start Time"
                      value={formData.display_start_time}
                      onChange={handleChangeStartTime}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </Grid2>                
                <Grid2 item size={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="End Time"
                      value={formData.display_end_time}                      
                      onChange={handleChangeEndTime}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </Grid2>
                {empList && (
                  <Grid2 item size={12}>
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

                {products && (
                  <Grid2 item size={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Product Name</InputLabel>
                      <Select
                        label="Product Name"
                        name="product_id"
                        value={formData.product_id || ""}
                        onChange={handleChange}
                      >
                        {products?.map((prod) => (
                          <MenuItem
                            key={prod.product_id}
                            value={prod.product_id}
                          >
                            {prod.product_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>
                )}

                <Grid2 item size={12}>
                  <TextField
                    label="Production Qty"
                    name="production_qty"
                    value={formData.production_qty}
                    onChange={handleProdQtyChange}
                    fullWidth
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <Grid2 item size={12}>
                  <TextField
                    label="Damaged Qty"
                    name="damaged_qty"
                    value={formData.damaged_qty}
                    onChange={handleDamagedQtyChange}
                    fullWidth
                    type="number"
                    onWheel={(event) => {
                      event.preventDefault();
                    }}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      inputProps: { min: 0, max: formData.production_date },
                    }}
                  />
                </Grid2>
              </Grid2>
            </DisabledFormWrapper>
            <div style={{ marginTop: 20 }}>
              {!selectedRow && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={
                    !formData.emp_id ||
                    !formData.product_id ||
                    !formData.production_date ||
                    !formData.production_qty ||
                    !formData.start_time ||
                    !formData.end_time ||
                    error !== ""
                  }
                  onClick={saveJobHandler}
                >
                  Save & Add
                </Button>
              )}

              <Button
                variant="contained"
                color="success"
                onClick={handleCancel}
                sx={{ ml: 2 }}
              >
                Exit
              </Button>
            </div>
          </form>
        </Box>
        <InfoDialog
          open={openDialog}
          onClose={handleDialogClose}
          title="Information"
          message={message}
        />
      </Container>
    </>
  );
}

export default ProductionMonitorForm;

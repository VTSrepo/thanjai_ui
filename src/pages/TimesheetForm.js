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
import { format } from "date-fns-tz";
import Loader from "../components/Loader";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import InfoDialog from "../components/InfoDialog";
import { getEmployees, saveTs } from "../utilities/service";
import { useUser } from "../utilities/UserContext";

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

function TimesheetForm() {
  const { user, login, logout } = useUser();
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const currentDate = FormattedDate(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [empList, setEmpList] = useState([]);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [heading, setHeading] = useState("Job Create");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    product_id: null,
    product_name: null,
    cur_date: currentDate,
    start_time: null,
    display_start_time: null,
    display_end_time: null,
    end_time: null,
    emp_name: null,
    emp_id: null,
  });

  useEffect(() => {
    const getEmployeesList = async () => {
      try {
        const result = await getEmployees();
        setEmpList(result.employees);
      } catch (err) {
        console.log(err);
      }
    };

    getEmployeesList();
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
      setHeading("View Timesheet");
      setFormData({
        cur_date: selectedRow.cur_date.toISOString().slice(0, 10),
        start_time: selectedRow.start_time,
        display_end_time: convertTimeStringToDate(selectedRow.end_time),
        display_start_time: convertTimeStringToDate(selectedRow.start_time),
        end_time: selectedRow.end_time,
        emp_name: selectedRow.emp_name,
        emp_id: selectedRow.emp_id,
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
      timesheet: {
        org_id: org_id,
        branch_id: branch_id,
        emp_id: formData.emp_id,
        cur_date: formData.cur_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        user_id: user_id,
      },
    };
    console.log(payload);
    try {
      const res = await saveTs(payload);
      if (res.data.timesheet) {
        setLoading(false);
        openSuccess("TS saved successfully.");
        resetForm();
      } else {
        setLoading(false);
        openSuccess("TS saved failed.");
      }
    } catch (error) {
      setLoading(false);
      openSuccess(error.response.data.message);
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      start_time: null,
      display_start_time: null,
      display_end_time: null,
      end_time: null,
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
    navigate("/ts");
  };

  if (loading) return <Loader />;

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
                    name="cur_date"
                    value={formData.cur_date}
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
              </Grid2>
            </DisabledFormWrapper>
            <div style={{ marginTop: 20 }}>
              {!selectedRow && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={
                    !formData.emp_id ||
                    !formData.cur_date ||
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
                Close
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

export default TimesheetForm;

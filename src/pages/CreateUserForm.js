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
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";

import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate

import { createNewEmployee, getBranchLists } from "../utilities/service";

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

function CreateUserForm({ user }) {
  document.title = `Create Employee | ${CONFIG.title.name}`;
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [branchList, setBranchList] = useState([]);
  const [empStatus, setEmpStatus] = useState(null);
  const [contactError, setContactError] = useState(false);
  const [formData, setFormData] = useState({
    emp_name: null,
    emp_id: null,
    contact: null,
  });

  useEffect(() => {
    const getBranchList = async () => {
      try {
        const result = await getBranchLists();
        setBranchList(result.branches);
      } catch (err) {
        console.log(err);
      }
    };
    getBranchList();
  }, []);

  const saveEmployeeHandler = async () => {
    setLoading(true);
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
    console.log("empStatus", empStatus);
    const employee_status = empStatus === "active" ? "Y" : "N";
    const payload = {
      employee: {
        org_id: org_id,
        branch_id: branch_id,
        emp_name: formData.emp_name,
        active: employee_status,
        contact: formData.contact,
        user_id: user_id,
      },
    };

    const res = await createNewEmployee(payload);
    console.log("cre_res", res);

    if (res.employee) {
      setLoading(false);
      navigate("/user");
    } else {
      throw new Error("Add Employee failed");
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      const isValid = /^(\+1)?[ -]?(\(?\d{3}\)?)[ -]?\d{3}[ -]?\d{4}$/.test(
        value
      );
      setContactError(!isValid);
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCancel = () => {
    navigate("/user");
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Create User
          </Typography>

          <form className="example-form" noValidate>
            {/* <DisabledFormWrapper disabled={isFormDisabled}> */}
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="User Name*"
                  name="user_name"
                  value={formData.emp_name || ""}
                  onChange={handleChange}
                  fullWidth
                  type="text"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>

              <Grid2 item size={12}>
                <FormControl fullWidth required>
                  <InputLabel>Organization Name</InputLabel>
                  <Select
                    label="Organization Name"
                    name="org_id"
                    value={formData.branch_id || ""}
                    onChange={handleChange}
                  >
                    {branchList?.map((branch) => (
                      <MenuItem key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              <Grid2 item size={12}>
                <FormControl fullWidth required>
                  <InputLabel>Branch Name</InputLabel>
                  <Select
                    label="Branch Name"
                    name="branch_id"
                    value={formData.branch_id || ""}
                    onChange={handleChange}
                  >
                    {branchList?.map((branch) => (
                      <MenuItem key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              <Grid2 item xs={12} style={{ width: "100%" }}>
              <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDateFns}  >
                <DatePicker
                    label="Date of Birth"
                    value={formData.dob}
                    onChange={(newValue) => {
                    setFormData({ ...formData, dob: newValue });
                    }}
                    renderInput={(params) => <TextField {...params} />}
                    // slotProps={{
                    //     textField: {
                    //       fullWidth: true,
                    //     },
                    //   }}
                />
                </LocalizationProvider>
                </FormControl>
                </Grid2>

                <Grid2 item xs={12} style={{ width: "100%" }}>
              <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDateFns}  >
                <DatePicker
                    label="Date of Join"
                    value={formData.doj}
                    onChange={(newValue) => {
                    setFormData({ ...formData, doj: newValue });
                    }}
                    renderInput={(params) => <TextField {...params} />}
                    // slotProps={{
                    //     textField: {
                    //       fullWidth: true,
                    //     },
                    //   }}
                />
                </LocalizationProvider>
                </FormControl>
                </Grid2>

              <TextField
                label="Mobile"
                variant="outlined"
                fullWidth
                name="contact"
                value={formData.contact || ""}
                onChange={handleChange}
                error={contactError}
                helperText={
                  contactError ? "Enter a valid Canadian phone number" : ""
                }
              />

              <FormControl>
                <FormLabel id="demo-row-radio-buttons-group-label">
                  Status
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value)}
                >
                  <FormControlLabel
                    value="active"
                    control={<Radio />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="inactive"
                    control={<Radio />}
                    label="Inactive"
                  />
                </RadioGroup>
              </FormControl>
            </Grid2>
            {/* </DisabledFormWrapper> */}
            <div style={{ marginTop: 20 }}>
              {/* {!selectedRow && ( */}
              <Button
                variant="contained"
                color="success"
                disabled={
                  !formData.emp_name || !formData.branch_id || contactError
                }
                onClick={saveEmployeeHandler}
              >
                Save
              </Button>
              {/* )} */}

              <Button
                variant="contained"
                color="success"
                onClick={handleCancel}
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Box>
      </Container>
    </>
  );
}

export default CreateUserForm;

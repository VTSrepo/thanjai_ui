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
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import { createNewEmployee, getBranchLists } from "../utilities/service";

function ViewEmployee({ user }) {
  document.title = `Create Employee | ${CONFIG.title.name}`;
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [branchList, setBranchList] = useState([]);
  const [empStatus, setEmpStatus] = useState(null);
  const [contactError, setContactError] = useState(false);
  const [formData, setFormData] = useState({
    emp_name: null,
    emp_id: null,
    active: null,
    contact: null,
    branch_id: null,
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

  useEffect(() => {
    console.log("selectedRow_emp", selectedRow);
    const selectedEmpStatus = selectedRow.active;
    setEmpStatus(selectedEmpStatus);
    if (selectedRow) {
      //   setHeading("View Employee");
      setFormData({
        emp_name: selectedRow.emp_name,
        emp_id: selectedRow.emp_id,
        active: empStatus,
        contact: selectedRow.contact,
        branch_id: selectedRow.branch_id,
        branch_name: selectedRow.branch_name
      });
    }
  }, [selectedRow]);

  const updateEmployeeHandler = async () => {
    setLoading(true);
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
    console.log("empStatus", empStatus);
    const employee_status = empStatus === "Active" ? "A" : "I";
    const payload = {
      employee: {
        org_id: org_id,
        branch_id: formData.branch_id,
        emp_name: formData.emp_name,
        active: employee_status,
        contact: formData.contact,
        user_id: user_id,
        emp_id: formData.emp_id,
        branch_name: formData.branch_name
      },
    };
    console.log("update_emp",payload)
    const res = await createNewEmployee(payload);
    console.log("up_us_res",res)

    if (res.employee) {
      setLoading(false);
      navigate("/employee");
    } else {
      throw new Error("Update Employee failed");
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
    navigate("/employee");
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            View Employee
          </Typography>

          <form className="example-form" noValidate>
            {/* <DisabledFormWrapper disabled={isFormDisabled}> */}
            <Grid2 container spacing={2}>
              <Grid2  size={12}>
                <TextField
                  label="Employee Name*"
                  name="emp_name"
                  value={formData.emp_name || ""}
                  onChange={handleChange}
                  fullWidth
                  type="text"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>

              <Grid2  size={12}>
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

              <TextField
                label="Contact"
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
                    value="Active"
                    control={<Radio />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="Inactive"
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
                onClick={updateEmployeeHandler}
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

export default ViewEmployee;

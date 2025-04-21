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
  Autocomplete,
} from "@mui/material";
import { parseISO, format } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useUser } from "../utilities/UserContext";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate

import { createNewUser, getBranchLists } from "../utilities/service";
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

function CreateUserForm() {
  const { user } = useUser();
  document.title = `Create User | ${CONFIG.title.name}`;
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [branchList, setBranchList] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [userType, setUserType] = useState(null);
  const [mobileError, setMobileError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [formData, setFormData] = useState({
    user_name: null,
    dob: null,
    doj: null,
    mobile_no: null,
    home_contact_no: null,
    residence_address: null,
    email_id: null,
    pwd: null,
  });

  console.log("userStatus==", userStatus, "userType==", userType);

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

  const saveUserHandler = async () => {
    setLoading(true);
    try {
      const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
      const user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
      const user_status = userStatus === "Active" ? "A" : "I";
      const user_type =
        userType === "admin"
          ? "A"
          : userType === "kitchen"
          ? "K"
          : userType === "branch"
          ? "B"
          : "";

      const payload = {
        user: {
          user_id: formData.email_id,
          org_id: org_id,
          branch_id: formData.branch_id,
          user_name: formData.user_name,
          dob: formData.dob,
          doj: formData.doj,
          mobile_no: formData.mobile_no,
          home_contact_no: formData.home_contact_no,
          residence_address: formData.residence_address,
          email_id: formData.email_id,
          user_type: user_type,
          user_status: user_status,
          pwd: formData.pwd,
        },
      };
      console.log("create_use_payload", payload);
      const res = await createNewUser(payload);

      if (res) {
        console.log("create_user_res", res);
        navigate("/user");
      } else {
        alert("Something went wrong while creating the user.");
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message;
      if (
        error.response?.status === 401 &&
        errorMsg?.includes("User ID Already Exist")
      ) {
        alert("User ID already exists. Try another name.");
      } else {
        alert(errorMsg || "Error creating user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isValid = /^(\+1)?[ -]?(\(?\d{3}\)?)[ -]?\d{3}[ -]?\d{4}$/.test(
      value
    );
    if (name === "home_contact_no") {
      setContactError(!isValid);
    } else if (name === "mobile_no") {
      setMobileError(!isValid);
    }

    if (name === "email_id") {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setEmailError(!isValidEmail);
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

          <form className="example-form" autoComplete="off" noValidate>
            {/* <DisabledFormWrapper disabled={isFormDisabled}> */}
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="User Name*"
                  name="user_name"
                  value={formData.user_name || ""}
                  onChange={handleChange}
                  // onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  fullWidth
                  type="text"
                  // inputProps={{
                  //   inputProps: { min: 0 },
                  //   autoComplete: 'off',
                  //   form: {
                  //     autoComplete: 'off',
                  //   },
                  // }}
                />
              </Grid2>

              <TextField
                label="Email*"
                name="email_id"
                value={formData.email_id || ""}
                onChange={handleChange}
                fullWidth
                type="text"
                error={emailError}
                helperText={emailError ? "Enter a valid email address" : ""}
                inputProps={{
                  inputProps: { min: 0 },
                  autoComplete: "off",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />

              {/* <Grid2 item size={12}>
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
              </Grid2> */}

              {/* <Grid2 item size={12}>
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
              </Grid2> */}

              <Grid2 item xs={12} style={{ width: "100%" }}>
                <Autocomplete
                  options={branchList || []}
                  getOptionLabel={(option) => option.branch_name || ""}
                  value={
                    branchList?.find(
                      (branch) => branch.branch_id === formData.branch_id
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    setFormData({
                      ...formData,
                      branch_id: newValue ? newValue.branch_id : "",
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Branch Name"
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid2>

              <Grid2 item xs={12} style={{ width: "100%" }}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date of Birth"
                      value={formData.dob ? parseISO(formData.dob) : null}
                      onChange={(newValue) => {
                        const formattedDate = newValue
                          ? format(newValue, "yyyy-MM-dd")
                          : "";
                        setFormData({ ...formData, dob: formattedDate });
                      }}
                      format="yyyy-MM-dd"
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
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {/* preventing it from autofilling the actual user input fields in the form. */}
                    <input
                      type="text"
                      name="fake_user"
                      autoComplete="username"
                      style={{ display: "none" }}
                    />
                    <input
                      type="password"
                      name="fake_pass"
                      autoComplete="new-password"
                      style={{ display: "none" }}
                    />
                    <DatePicker
                      label="Date of Join"
                      value={formData.doj ? parseISO(formData.doj) : null}
                      onChange={(newValue) => {
                        const formattedDate = newValue
                          ? format(newValue, "yyyy-MM-dd")
                          : "";
                        setFormData({ ...formData, doj: formattedDate });
                      }}
                      format="yyyy-MM-dd"
                      // renderInput={(params) => <TextField {...params} />}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="random_doj_field" // Important: name must NOT look like a date
                          autoComplete="off"
                          // fullWidth
                          inputProps={{
                            ...params.inputProps,
                            autoComplete: "off",
                            name: "random_doj_field", // override again inside inputProps
                            type: "text", // force text, not date
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid2>

              <TextField
                label="Mobile"
                variant="outlined"
                fullWidth
                name="mobile_no"
                value={formData.mobile_no || ""}
                onChange={handleChange}
                error={mobileError}
                helperText={
                  mobileError ? "Enter a valid Canadian phone number" : ""
                }
                inputProps={{
                  inputProps: { min: 0 },
                  autoComplete: "off",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />

              <TextField
                label="Home Contact"
                variant="outlined"
                fullWidth
                name="home_contact_no"
                value={formData.home_contact_no || ""}
                onChange={handleChange}
                error={contactError}
                helperText={
                  contactError ? "Enter a valid Canadian phone number" : ""
                }
                inputProps={{
                  autoComplete: "off",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />

              <TextField
                label="Password"
                name="pwd"
                value={formData.pwd || ""}
                onChange={handleChange}
                fullWidth
                type="password"
                InputProps={{ inputProps: { min: 0 } }}
              />

              <TextField
                label="Address"
                variant="outlined"
                fullWidth
                multiline
                minRows={3} // you can adjust the height
                name="residence_address"
                value={formData.residence_address || ""}
                onChange={handleChange}
              />

              <Grid2 item size={12}>
                <FormControl>
                  <FormLabel id="demo-row-radio-buttons-group-label">
                    Type
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <FormControlLabel
                      value="admin"
                      control={<Radio />}
                      label="Admin"
                    />
                    <FormControlLabel
                      value="kitchen"
                      control={<Radio />}
                      label="Kitchen"
                    />
                    <FormControlLabel
                      value="branch"
                      control={<Radio />}
                      label="Branch"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid2>

              <FormControl>
                <FormLabel id="demo-row-radio-buttons-group-label">
                  Status
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
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
                  !formData.user_name ||
                  !formData.email_id ||
                  contactError ||
                  mobileError
                }
                onClick={saveUserHandler}
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

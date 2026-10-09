import React, { useState, useEffect } from "react";

import {
  TextField,
  
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
  MenuItem } from "@mui/material";
import { parseISO, format } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useUser } from "../utilities/UserContext";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate

import { createNewUser, getBranchLists, getRoles, updateUser } from "../utilities/service";
import { useToast } from "../components/ToastProvider";
import ResetPasswordDialog from "../components/ResetPasswordDialog";

// Radio label -> user type code (the user list shows these labels)
const TYPE_CODE = { Admin: "A", "Operations Manager": "O", Kitchen: "K", Branch: "B", External: "X" };

const USER_ID_OK = /^[A-Za-z0-9._@-]{3,50}$/;

function CreateUserForm() {
  const { user } = useUser();
  document.title = `Create User | ${CONFIG.title.name}`;
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [heading, setHeading] = useState("Create User");
  const [, setLoading] = useState(false);
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const navigate = useNavigate();
  const [branchList, setBranchList] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [userType, setUserType] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [mobileError, setMobileError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    user_name: null,
    dob: null,
    doj: null,
    mobile_no: null,
    home_contact_no: null,
    residence_address: null,
    email_id: null,
    pwd: null,
  });

  useEffect(() => {
    getRoles().then((r) => setRoles(r.roles || [])).catch(() => {});
  }, []);
  // roles available for the chosen type; pick the built-in one when the current choice does not fit
  const typeCode = TYPE_CODE[userType] || "";
  const roleOptions = roles.filter((r) => r.scope === typeCode && r.status === "A");
  useEffect(() => {
    if (!typeCode || !roles.length) return;
    if (!roleOptions.some((r) => r.role_id === roleId)) {
      const own = selectedRow && selectedRow.role_id && roleOptions.find((r) => r.role_id === selectedRow.role_id);
      setRoleId(own ? own.role_id : (roleOptions.find((r) => r.is_system === "Y") || roleOptions[0] || {}).role_id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeCode, roles]);

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
      if (selectedRow) {
      setHeading("View User");
      const selectedUserStatus = selectedRow.user_status
      const selectedUserType = selectedRow.user_type 
      setUserStatus(selectedUserStatus);
      setUserType(selectedUserType);
        setFormData({
          user_id: selectedRow.user_id,
          branch_id: selectedRow.branch_id,
          user_name: selectedRow.user_name,
          dob: selectedRow.dob,
          doj: selectedRow.doj,
          mobile_no: selectedRow.mobile_no,
          home_contact_no: selectedRow.home_contact_no,
          residence_address: selectedRow.residence_address,
          email_id: selectedRow.email_id,
          user_type: userType,
          user_status: userStatus,
          pwd: "",
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intended to run once on open
    }, [selectedRow]);

  const saveUserHandler = async () => {
    setLoading(true);
                    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
                    const user_status = userStatus === "Active" ? "A" : "I";
                    const user_type = TYPE_CODE[userType] || "";
    
          if(selectedRow){
            try {
                    const user_id = selectedRow.user_id
                    const payload = {
                      user: {
                        user_id: user_id,
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
                        role_id: roleId || undefined,
                        user_status: user_status,
                        // password is not changed here; use Reset password
                      },
                    };
                    const res = await updateUser(payload);
                    if (res) {
                      navigate("/user");
                    } else {
                      toast.error("Something went wrong while updating the user.");
                    }
                  } catch (error) {
                    toast.error(error?.response?.data?.message || "Could not update the user")
                  } finally {
                    setLoading(false);
                  }
          }
          else{
            try {
                  const payload = {
                    user: {
                      user_id: (formData.user_id || "").trim(),
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
                      role_id: roleId || undefined,
                      user_status: user_status,
                      pwd: formData.pwd,
                    },
                  };
                  const res = await createNewUser(payload);
            
                  if (res) {
                    navigate("/user");
                  } else {
                    toast.error("Something went wrong while creating the user.");
                  }
                } catch (error) {
                  const errorMsg = error?.response?.data?.message;
                  if (
                    error.response?.status === 401 &&
                    errorMsg?.includes("User ID Already Exist")
                  ) {
                    toast.error("User ID already exists. Try another name.");
                  } else {
                    toast.error(errorMsg || "Error creating user. Please try again.");
                  }
                } finally {
                  setLoading(false);
                }
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
      setEmailError(value !== "" && !isValidEmail);
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
            {heading}
          </Typography>

          <form className="example-form" autoComplete="off" noValidate>
            {/* <DisabledFormWrapper disabled={isFormDisabled}> */}
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="User Name*"
                  name="user_name"
                  inputProps={{ maxLength: 150 }}
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
                label="User ID*"
                name="user_id"
                value={formData.user_id || ""}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value.replace(/\s/g, "") })}
                fullWidth
                disabled={!!selectedRow}
                error={!!formData.user_id && !USER_ID_OK.test(formData.user_id)}
                helperText={selectedRow ? "User ID cannot be changed" : "Used to log in. 3-50 characters: letters, numbers, . _ - @"}
                inputProps={{ maxLength: 50, autoComplete: "off" }}
              />

              <TextField
                label="Email"
                name="email_id"
                value={formData.email_id || ""}
                onChange={handleChange}
                fullWidth
                type="text"
                error={emailError}
                helperText={emailError ? "Enter a valid email address" : ""}
                inputProps={{
                  maxLength: 50,
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
                  maxLength: 15,
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
                  maxLength: 15,
                  autoComplete: "off",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />

              {!selectedRow ? (
                <TextField
                  label="Initial password"
                  name="pwd"
                  value={formData.pwd || ""}
                  onChange={handleChange}
                  fullWidth
                  type="password"
                  helperText="At least 6 characters. The user can change it from the account menu."
                />
              ) : (
                <Button variant="outlined" onClick={() => setResetOpen(true)} sx={{ alignSelf: "flex-start" }}>
                  Reset password
                </Button>
              )}

              <TextField
                label="Address"
                variant="outlined"
                fullWidth
                multiline
                minRows={3} // you can adjust the height
                name="residence_address"
                  inputProps={{ maxLength: 500 }}
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
                    name="user-type"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <FormControlLabel
                      value="Admin"
                      control={<Radio />}
                      label="Admin"
                    />
                    <FormControlLabel
                      value="Operations Manager"
                      control={<Radio />}
                      label="Operations Manager"
                    />
                    <FormControlLabel
                      value="Kitchen"
                      control={<Radio />}
                      label="Kitchen"
                    />
                    <FormControlLabel
                      value="Branch"
                      control={<Radio />}
                      label="Branch"
                    />
                    <FormControlLabel
                      value="External"
                      control={<Radio />}
                      label="External customer"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid2>

              {typeCode && typeCode !== "A" && (
                <TextField select fullWidth label="Role" value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  helperText="Decides which screens this user can open (Master > Role)">
                  {roleOptions.map((r) => <MenuItem key={r.role_id} value={r.role_id}>{r.role_name}</MenuItem>)}
                </TextField>
              )}

              <FormControl>
                <FormLabel id="demo-row-radio-buttons-group-label">
                  Status
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="user-status"
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
                  (!selectedRow && !USER_ID_OK.test(formData.user_id || "")) ||
                  emailError ||
                  contactError ||
                  mobileError||
                  !formData.branch_id||
                  (!selectedRow && (!formData.pwd || formData.pwd.length < 6)) ||
                  !userType||
                  !userStatus
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
      <ResetPasswordDialog open={resetOpen} userId={selectedRow?.user_id} userName={selectedRow?.user_name} onClose={() => setResetOpen(false)} />
    </>
  );
}

export default CreateUserForm;

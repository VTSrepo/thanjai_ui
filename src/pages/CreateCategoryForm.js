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
import { useUser } from "../utilities/UserContext";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import { createNewCategory } from "../utilities/service";

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

function CreateCategoryForm() {
  const { user } = useUser();
  document.title = `Create Category | ${CONFIG.title.name}`;
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [heading, setHeading] = useState("Create Category");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [categoryStatus, setCategoryStatus] = useState(null);
  const [formData, setFormData] = useState({
    category_name: null,
    category_code: null,
  });

   useEffect(() => {
      if (selectedRow) {
        const selectedCatStatus = selectedRow.active 
        setCategoryStatus(selectedCatStatus);
        setHeading("View Category");
        setFormData({
          category_name: selectedRow.category_name,
          category_code: selectedRow.category_code,
          active: categoryStatus,
        });
      }
    }, [selectedRow]);

  const saveCategoryHandler = async () => {
    setLoading(true);
    const user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
    const category_status = categoryStatus === "Active" ? "A" : "I";
    const payload = {
      category: {
        category_name: formData.category_name,
        active: category_status,
        user_id: user_id,
        category_code: formData.category_code
      },
    };

    const res = await createNewCategory(payload);
    if (res.category) {
      setLoading(false);
      navigate("/category");
    } else {
      throw new Error("Add Category failed");
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCancel = () => {
    navigate("/category");
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
            {/* <DisabledFormWrapper disabled={isFormDisabled}> */}
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="Category Name*"
                  name="category_name"
                  value={formData.category_name || ""}
                  onChange={handleChange}
                  fullWidth
                  type="text"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>

              <FormControl>
                <FormLabel id="demo-row-radio-buttons-group-label">
                  Status
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={categoryStatus}
                  onChange={(e) => setCategoryStatus(e.target.value)}
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
                disabled={!formData.category_name}
                onClick={saveCategoryHandler}
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

export default CreateCategoryForm;

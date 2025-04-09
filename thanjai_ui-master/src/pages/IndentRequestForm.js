import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid2,
  Box,
  Typography,
} from "@mui/material";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import { getProducts } from "../utilities/service";

import axios from "axios";

const IndentRequestForm = ({ user }) => {
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [loading, setLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  const navigate = useNavigate();
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;

  const [formData, setFormData] = useState({
    item_code: null,
    unitOfMeasure: null,
    qty_ordered: null,
    mandatory_status: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
  };

  const handleBack = () => {
    // if (user.role === "admin") {
    //   navigate("/admin");
    // } else {
    //   navigate("/home");
    // }
    navigate("/home");
  };

  const addItem = () => {
    
  }

  useEffect(() => {
    const getitems = async () => {
      try {
        const result = await getProducts();
        setProductList(result.products);
      } catch (err) {
        console.log(err);
      }
    };

    getitems();
  }, []);

  useEffect(() => {
    if (selectedRow) {
      setFormData({
        item_code: selectedRow.item_code,
        unitOfMeasure: "",
        qty_ordered: selectedRow.qty_ordered,
        mandatory_status: selectedRow.mandatory_status,
        org_id: org_id,
        branch_id: branch_id,
      });
    }
  }, [selectedRow]);

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      {/* Show AdminAppBar */}
      <Container maxWidth="sm">
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Indent Request Form
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <FormControl fullWidth>
                  <InputLabel>Item Name</InputLabel>
                  <Select
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleChange}
                    label="Item Name"
                    required
                  >
                    {productList.map((item, index) => (
                      <MenuItem key={index} value={item.product_id}>
                        {item.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              {/* Unit of Measure */}
              {/* <Grid2 item size={12}>
                <TextField
                  label="Unit of Measure"
                  variant="outlined"
                  fullWidth
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  required
                />
              </Grid2> */}

              <Grid2 item size={12}>
                <TextField
                  label="Quantity Ordered"
                  variant="outlined"
                  fullWidth
                  name="qty_ordered"
                  value={formData.qty_ordered}
                  onChange={handleChange}
                  type="number"
                  required
                />
              </Grid2>

              {/* Quantity Received */}

              <Grid2 item size={6}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleBack}
                >
                  Back
                </Button>
              </Grid2>

              {/* Submit Button */}
              <Grid2 item size={6}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={formData.item_code === null || formData.qty_ordered === null}
                  fullWidth
                  onClick={addItem}
                >
                  Submit
                </Button>
              </Grid2>
            </Grid2>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default IndentRequestForm;

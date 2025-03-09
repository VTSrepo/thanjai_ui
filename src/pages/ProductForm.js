import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Grid2,
  Typography, Box, Container
} from "@mui/material";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Padding } from "@mui/icons-material";

function ProductForm({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product_name: "",
    uom: "",
    bu_id: "",
    stock_in_hand: "",
    min_stock: "",
    max_stock: "",
    reorder_level: "",
    billing_flag: "",
    product_price: "",
    gst_value: "",
    prod_name_invoice: "",
    account_code: "",
  });

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const [bu, setBu] = useState([
    { bu_id: "1", bu_name: "BU 1" },
    { bu_id: "2", bu_name: "BU 2" },
  ]);

  const [prdTypes, setPrdTypes] = useState([
    { ref_code: "1", ref_desc: "Type 1" },
    { ref_code: "2", ref_desc: "Type 2" },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    // Logic to save the form data
    console.log("Form data saved:", formData);
  };

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Product Create
          </Typography>
          <form className="example-form" noValidate>
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="Product Name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="UOM"
                  name="uom"
                  value={formData.uom}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid2>
              <Grid2 item size={12}>
                <FormControl fullWidth required>
                  <InputLabel>BU</InputLabel>
                  <Select
                    label="BU"
                    name="bu_id"
                    value={formData.bu_id}
                    onChange={handleChange}
                  >
                    {bu.map((mode) => (
                      <MenuItem key={mode.bu_id} value={mode.bu_id}>
                        {mode.bu_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
           
            
              <Grid2 item size={12}>
                <TextField
                  label="Stock In Hand"
                  name="stock_in_hand"
                  value={formData.stock_in_hand}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Min"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Max"
                  name="max_stock"
                  value={formData.max_stock}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Reorder Level"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>

              <Grid2 item size={12}>
                <FormControl fullWidth>
                  <InputLabel>Part Of Billing</InputLabel>
                  <Select
                    label="Part Of Billing"
                    name="billing_flag"
                    value={formData.billing_flag}
                    onChange={handleChange}
                  >
                    {prdTypes.map((type) => (
                      <MenuItem key={type.ref_code} value={type.ref_code}>
                        {type.ref_desc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
           

          
              <Grid2 item size={12}>
                <TextField
                  label="Product Price"
                  name="product_price"
                  value={formData.product_price}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="GST"
                  name="gst_value"
                  value={formData.gst_value}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Name for Invoice"
                  name="prod_name_invoice"
                  value={formData.prod_name_invoice}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Account Code"
                  name="account_code"
                  value={formData.account_code}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid2>
              </Grid2>
            <div style={{ marginTop: 20 }}>
              <Button
                variant="contained"
                color="success"
                disabled={!formData.product_name || !formData.bu_id}
                onClick={handleSave}
              >
                <i className="fa-solid fa-paper-plane mar5r"></i> Save
              </Button>
            </div>
          </form>
        </Box>
      </Container>
    </>
  );
}

export default ProductForm;

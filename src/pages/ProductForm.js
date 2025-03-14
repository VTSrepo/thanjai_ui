import React, { useState, useEffect } from "react";
import axios from "axios";
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
import Loader from "../components/Loader";

import { getBu, referenceRecord, getCategoryList } from "../utilities/service";

function ProductForm({ user }) {
  const location = useLocation(); // Access the location object
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
  const [bu, setBu] = useState([]);
  const [uom, setUOM] = useState([]);
  const [categoryList, setcategoryList] = useState([]);
  const [formData, setFormData] = useState({
    product_id: null,
    product_name: null,
    uom: null,
    bu_id: null,
    category_code:null,
    stock_in_hand: null,
    min_stock: null,
    max_stock: null,
    reorder_level: null,
    billing_flag: null,
    product_price: null,
    gst_value: null,
    prod_name_invoice: null,
    account_code: null,
    org_id: org_id,
    branch_id: branch_id,
  });

  useEffect(() => {
    const getBuData = async () => {
      try {
        const result = await getBu();
        setBu(result.businesses);
      } catch (err) {
        console.log(err);
      }
    };

    const getUOM  =  async() =>{
      try {
        const result = await referenceRecord('UOM');
        setUOM(result.refences);
      } catch (err) {
        console.log(err);
      }
    }

    const getCategory  =  async() =>{
      try {
        const result = await getCategoryList('UOM');
        setcategoryList(result.categories);
      } catch (err) {
        console.log(err);
      }
    }

    getBuData();
    getUOM();
    getCategory();
  }, []);

  useEffect(() => {   
    if (selectedRow) {
      setFormData({
        product_id: selectedRow.product_id,
        product_name: selectedRow.product_name,
        uom: selectedRow.uom,
        bu_id: selectedRow.bu_id,
        category_code:selectedRow.category_code,
        stock_in_hand: selectedRow.stock_in_hand,
        min_stock: selectedRow.min_stock,
        max_stock: selectedRow.max_stock,
        reorder_level: selectedRow.reorder_level,
        billing_flag: selectedRow.billing_flag,
        product_price: selectedRow.product_price,
        gst_value: selectedRow.gst_value,
        prod_name_invoice: selectedRow.prod_name_invoice,
        account_code: selectedRow.account_code,
        org_id: org_id,
        branch_id: branch_id,
      });
    }    
  }, [selectedRow]);

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
  const API_URL = "http://localhost:4002/v1"; // Change this to your actual API URL

  const handleSave = async () => {
    setLoading(true);
    const response = await axios.post(`${API_URL}/product`, {
      product: formData,
    });
    if (response.data && response.data) {
      setLoading(false);
      navigate("/product-master");
    } else {
      throw new Error("Product Creation failed: No token received");
    }
  };

  const handleCancel = () => {
    navigate("/product-master");
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
              {uom && <Grid2 item size={12}>
              <FormControl fullWidth required>
                  <InputLabel>UOM</InputLabel>
                  <Select
                    label="UOM"
                    name="uom"
                    value={formData.uom  || ''}
                    onChange={handleChange}
                  >
                    {uom?.map((mode) => (
                      <MenuItem key={mode.ref_code} value={mode.ref_code}>
                        {mode.ref_desc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>}

              {categoryList && <Grid2 item size={12}>
              <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category Code"
                    name="category_code"
                    value={formData.category_code || ''}
                    onChange={handleChange}
                  >
                    {categoryList?.map((mode) => (
                      <MenuItem key={mode.category_code} value={mode.category_code}>
                        {mode.category_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>}
              <Grid2 item size={12}>
                <FormControl fullWidth required>
                  <InputLabel>BU</InputLabel>
                  <Select
                    label="BU"
                    name="bu_id"
                    value={formData.bu_id || ''}
                    onChange={handleChange}                    
                  >
                    {bu?.map((mode) => (
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
                <TextField
                  label="Product Price"
                  name="product_price"
                  value={formData.product_price}
                  onChange={handleChange}
                  fullWidth
                  type="number"
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
                //disabled={!formData.product_name || !formData.bu_id}
                onClick={handleSave}
              >
                Save
              </Button>

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

export default ProductForm;

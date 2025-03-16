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

const ItemAdd = (props) => {
  const { sendToParent } = props;
  const [productList, setProductList] = useState([]);

  const [formData, setFormData] = useState({
    item:null,
    //item_code: null,
    uom: null,
    qty_ordered: null,
    mandatory_status: null,
  });

  const [uom, setUom] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProductNameChange = (e) => {
    const { name, value } = e.target;    
    setFormData({
      ...formData,
      item:value,
     // item_code: value.product_id,
      uom:value.uom
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
  };

  const handleBack = () => {    
    sendToParent(`Child clicked`);
  };

  const addItem = () => {
    sendToParent(formData);
  };

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

  // useEffect(() => {
  //   if (selectedRow) {
  //     setFormData({
  //       item_code: selectedRow.item_code,
  //       unitOfMeasure: "",
  //       qty_ordered: selectedRow.qty_ordered,
  //       mandatory_status: selectedRow.mandatory_status,
  //       org_id: org_id,
  //       branch_id: branch_id,
  //     });
  //   }
  // }, [selectedRow]);

  return (
    <>
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
                    name="item"
                    value={formData.item || ''}
                    onChange={handleProductNameChange}
                    label="Item Name"
                    required
                  >
                    {productList.map((item, index) => (
                      <MenuItem key={index} value={item}>
                        {item.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>              

              {/* Unit of Measure */}
              <Grid2 item size={12}>
                <TextField
                  label="Unit of Measure"
                  variant="outlined"
                  fullWidth
                  name="unitOfMeasure"
                  value={formData.uom || ''}                  
                  disabled
                />
              </Grid2>

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
                  disabled={
                    formData.item_code === null || formData.qty_ordered === null
                  }
                  fullWidth
                  onClick={addItem}
                >
                  Save
                </Button>
              </Grid2>
            </Grid2>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default ItemAdd;

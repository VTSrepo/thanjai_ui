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
import { getProducts } from "../utilities/service";

const ItemAdd = (props) => {
  const { sendToParent, data } = props;
  const [productList, setProductList] = useState([]);

  const [formData, setFormData] = useState({
    item: null,
    item_code: null,
    uom: null,
    qty_ordered: null,
    mandatory_status: "N",
    item_cost: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProductNameChange = (e) => {
    const { name, value } = e.target;
    console.log(getUOM(value));
    setFormData({
      ...formData,
      item_code: value,
      item: getItem(value),
      uom: getUOM(value),
      item_cost: getItem(value).product_price,
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

  const getUOM = (prodID) => {
    return productList.find((item) => item.product_id === prodID)?.uom;
  };

  const getItem = (prodID) => {
    return productList.find((item) => item.product_id === prodID);
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
    if (data) {
      setFormData({
        item: data.item,
        item_code: data.item.product_id,
        uom: data.uom,
        qty_ordered: data.qty_ordered,
      });
    }
  }, []);

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
                    value={formData.item_code || ""}
                    onChange={handleProductNameChange}
                    label="Item Name"
                    required
                  >
                    {productList.map((item, index) => (
                      <MenuItem key={item.product_id} value={item.product_id}>
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
                  value={formData.uom || ""}
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

              <Grid2 item size={12}>
                <FormControl fullWidth>
                  <InputLabel>Mandatory Status</InputLabel>
                  <Select
                    name="mandatory_status"
                    value={formData.mandatory_status || ""}
                    onChange={handleChange}
                    label="Mandatory Status"
                    required
                  >
                    <MenuItem value="Y">Yes</MenuItem>
                    <MenuItem value="N">No</MenuItem>
                  </Select>
                </FormControl>
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
                  disabled={formData.qty_ordered === null}
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

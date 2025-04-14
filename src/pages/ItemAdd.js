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
import { useUser } from "../utilities/UserContext";

const ItemAdd = (props) => {
  const { user, login, logout } = useUser();
  const { sendToParent, data, indent_status } = props;
  const [productList, setProductList] = useState([]);
  const [disableAction, setDisableAction] = useState(true);

  const [formData, setFormData] = useState({
    id: null,
    item: null,
    item_code: null,
    uom: null,
    qty_ordered: null,
    mandatory_status: "N",
    item_cost: null,
    qty_agreed_kitchen: null,
    kitchen_remarks: null,
    qty_received: null,
    discrepancy_notes: null,
    damage_notes: null,
  });

  useEffect(() => {
    if (data) {
      const itemObj = getItem(data.item_code);
      setFormData({
        item: itemObj,
        id: data.id,
        item_code: itemObj?.product_id,
        mandatory_status:data.mandatory_status,
        uom: data.uom,
        qty_ordered: data.qty_ordered,
        qty_agreed_kitchen: data.qty_agreed_kitchen,
        kitchen_remarks: data.kitchen_remarks,
        qty_received: data.qty_received,
        discrepancy_notes: data.discrepancy_notes,
        damage_notes: data.damage_notes,
      });
    }
  }, [productList]);

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

  //Save an Item in Indent
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
                    disabled={indent_status != undefined}
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
                  disabled={indent_status != undefined}
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
                    disabled={indent_status != undefined}
                    onChange={handleChange}
                    label="Mandatory Status"
                    required
                  >
                    <MenuItem value="Y">Yes</MenuItem>
                    <MenuItem value="N">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              {indent_status && (
                <Grid2 item size={12}>
                  <TextField
                    label="Kitchen Agreed Quantity"
                    variant="outlined"
                    fullWidth
                    name="qty_agreed_kitchen"
                    value={formData.qty_agreed_kitchen}
                    disabled={indent_status === "A" || indent_status === "D"}
                    onChange={handleChange}
                    type="number"
                    required
                  />
                </Grid2>
              )}
              {indent_status && (
                <Grid2 item size={12}>
                  <TextField
                    label="Kitchen Remarks"
                    variant="outlined"
                    fullWidth
                    name="kitchen_remarks"
                    value={formData.kitchen_remarks}
                    disabled={indent_status === "A" || indent_status === "D"}
                    onChange={handleChange}
                    required
                  />
                </Grid2>
              )}
              {indent_status === "D" && (
                <Grid2 item size={12}>
                  <TextField
                    label="Quantity Received"
                    variant="outlined"
                    fullWidth
                    name="qty_received"
                    value={formData.qty_received}
                    onChange={handleChange}
                    type="number"
                    required
                  />
                </Grid2>
              )}
              {indent_status === "D" && (
                <Grid2 item size={12}>
                  <TextField
                    label="Discrepancy Notes"
                    variant="outlined"
                    fullWidth
                    name="discrepancy_notes"
                    value={formData.discrepancy_notes}
                    onChange={handleChange}
                    required
                  />
                </Grid2>
              )}
              {indent_status === "D" && (
                <Grid2 item size={12}>
                  <TextField
                    label="Damage Notes"
                    variant="outlined"
                    fullWidth
                    name="damage_notes"
                    value={formData.damage_notes}
                    onChange={handleChange}
                    required
                  />
                </Grid2>
              )}
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
              {user && user?.user_type === "B" && !indent_status && (
                <Grid2 item size={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={!formData.qty_ordered}
                    fullWidth
                    onClick={addItem}
                  >
                    Save
                  </Button>
                </Grid2>
              )}
              
              {user && user?.user_type === "K" && indent_status === "C" && (
                <Grid2 item size={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={!formData.qty_agreed_kitchen}
                    fullWidth
                    onClick={addItem}
                  >
                    Save
                  </Button>
                </Grid2>
              )}

              {user && user?.user_type === "B" && indent_status === "D" && (
                <Grid2 item size={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={!formData.qty_received}
                    fullWidth
                    onClick={addItem}
                  >
                    Save
                  </Button>
                </Grid2>
              )}
            </Grid2>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default ItemAdd;

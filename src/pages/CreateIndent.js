import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Loader from "../components/Loader";
import {
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
} from "@mui/material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import axios from "axios";
import IndentTable from "../components/IndentTable";
import ItemAdd from "./ItemAdd";

const CreateIndent = ({ user }) => {
  const navigate = useNavigate();
  //const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    self_customer: "Self",
    delivery_by_datetime: null,
    customer_name: null,
  });

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const addItem = () => {
    //navigate("/indents-item");
    setShowAdd(true);
  };

  const createIndent = () => {
    //submit api
    console.log(formData)
    const payload = formData;
    payload.details = rows;
    console.log(payload)
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if(name === 'self_customer'){
      setFormData({
        ...formData,
        [name]: value,
        customer_name:null,
        customer_address:null,
        customer_phone:null,
        customer_pin:null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
  };

  const handleChangeDeliveryTime = (e) => {
    setFormData({
      ...formData,
      delivery_by_datetime: e,
    });
  };

  const handleBack = () => {
    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/home");
    }
  };
  const [rows, setRows] = useState([]);

  const addRow = (item) => {
    // Define the object structure to be added
    const newRow = {
      id: rows.length + 1,
      item_name: item.item.product_name,
      item_code: item.item.product_id,
      ...item,
    };
    // Step 3: Update the rows state to add the new row
    setRows([...rows, newRow]);
  };

  const updateShowAdd = (item) => {
    if (item?.qty_ordered) {
      addRow(item);
    }    
    setShowAdd(false);
  };

  const alterRows = (item) => {
    const updatedRows = rows.filter(
      (row) => row.product_id !== item.product_id
    );
    // Update the state with the new array (without the deleted item)
    setRows(updatedRows);
  };

  const currentDate = new Date();

  //if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!showAdd && (
        <Box>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Create Indent
          </Typography>

          <Box sx={{ mt: 2 }}>
            <form >
              <Grid2 container spacing={6}>
                {/* Requested For */}
                <Grid2 item size={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Select Date"
                      value={formData.delivery_by_datetime || ""}
                      onChange={handleChangeDeliveryTime}
                      minDateTime={currentDate} // Disable all previous dates
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </Grid2>

                <Grid2 item size={12}>
                  <FormControl>
                    <InputLabel>Requested For</InputLabel>
                    <Select
                      name="self_customer"
                      value={formData.self_customer}
                      onChange={handleChange}
                      label="Requested For"
                      required
                    >
                      <MenuItem value="Self">Self</MenuItem>
                      <MenuItem value="Customer">Customer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid2>

                {formData.self_customer === "Customer" && (
                  <Grid2 item size={12}>
                    <TextField
                      label="Customer Name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}
                {formData.self_customer === "Customer" && (
                  <Grid2 item size={12}>
                    <TextField
                      label="Customer Address"
                      name="customer_address"
                      value={formData.customer_address}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}

                {formData.self_customer === "Customer" && (
                  <Grid2 item size={12}>
                    <TextField
                      label="Customer Phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      type="number"
                    />
                  </Grid2>
                )}
                {formData.self_customer === "Customer" && (
                  <Grid2 item size={12}>
                    <TextField
                      label="Customer Pin"
                      name="customer_pin"
                      value={formData.customer_pin}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}

                <Grid2 item size={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={addItem}
                  >
                    Add Item
                  </Button>
                </Grid2>
              </Grid2>
            </form>
          </Box>
          <Box sx={{ mt: 2 }}>
            <IndentTable data={rows} sendToParent={alterRows} />

            <Button
            sx={{ mt: 2 }}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={createIndent}
                  >
                    Submit
                  </Button>
          </Box>

          
        </Box>
      )}
      {showAdd && (
        <Box sx={{ mt: 2 }}>
          <ItemAdd data={rows} sendToParent={updateShowAdd} />
        </Box>
      )}
    </>
  );
};

export default CreateIndent;

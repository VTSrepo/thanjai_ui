import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Loader from "../components/Loader";
import {
  Container,
  TextField,
  FormHelperText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
} from "@mui/material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import IndentItemTable from "../components/IndentItemTable";
import ItemAdd from "./ItemAdd";
import { createNewIndent } from "../utilities/service";
import { FilePresent } from "@mui/icons-material";

const CreateIndent = ({ user, sendToParent }) => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState({
    customer_phone: '',
  });
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState({
    self_customer: "S",
    delivery_by_datetime: currentDate,
    kitchen_id: "TR002",
  });

  const addItem = () => {
    setShowAdd(true);
  };

  const createIndent = async () => {
    setLoading(true);
    const payload = formData;
    payload.indent_details = rows;
    payload.indent_details.forEach((element) => {
      delete element.item;
      delete element.id;
      delete element.uom;
    });
    payload.org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    payload.kitchen_id = "TR001";
    payload.branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    payload.status = "C";
    payload.user_id = JSON.parse(localStorage.getItem("user"))?.user_id;
    console.log(payload);

    const res = await createNewIndent(payload);
    if (res) {
      setLoading(false);
      alert("Indent created");
      setRows([]);
      setFormData({
        self_customer: "S",
        delivery_by_datetime: null,
        kitchen_id: null,
      });
      sendToParent(3);
    } else {
      setLoading(false);
      console.log("error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "self_customer") {
      setFormData({
        ...formData,
        [name]: value,
        customer_name: null,
        customer_address: null,
        customer_phone: null,
        customer_pin: null,
      });
    } else { 
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

      if (name === 'customer_phone') {
        // Validate phone number
        if (phoneRegex.test(value)) {
          setErrors({ ...errors, customer_phone: '' });
        } else {
          setErrors({
            ...errors,
            customer_phone: 'Please enter a valid Canadian phone number (XXX-XXX-XXXX or (XXX) XXX-XXXX)',
          });
        }
      }     
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
    if (item.qty_ordered) {
      addRow(item);
    }
    setShowAdd(false);
  };

  const alterRows = (item) => {
    if (!item.delete) {
      setSelectedRow(item);
      setShowAdd(true);
    } else {
      const updatedRows = rows.filter(
        (row) => row.item_code !== item.item_code
      );
      // Update the state with the new array (without the deleted item)
      setRows(updatedRows);
    }
  };



  /**
   * 
   * phone number canada validation
   * const phoneRegex = /^(?:\(\d{3}\)\s?|\d{3}[-\s])?\d{3}[-\s]?\d{4}$/;
   * if (phoneRegex.test(value)) {
      setError('');
    } else {
      setError('Invalid phone number format');
    }
      {error && <p style={{ color: 'red' }}>{error}</p>}
   */

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!showAdd && (
        <Box>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Create Indent
          </Typography>

          <Box sx={{ mt: 2 }}>
            <form>
              <Grid2 container spacing={4}>
                <Grid2
                  item
                  sx={{
                    width: { xs: "100%", sm: "30%", lg:"30%" },
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Delivery By Date"
                      value={formData.delivery_by_datetime || ""}
                      onChange={handleChangeDeliveryTime}
                      minDateTime={currentDate} // Disable all previous dates
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </Grid2>

                <Grid2 item sx={{
                    width: { xs: "100%", sm: "30%", lg:"30%" },
                  }}>
                  <FormControl >
                    <InputLabel>Requested For</InputLabel>
                    <Select
                      name="self_customer"
                      value={formData.self_customer}
                      onChange={handleChange}
                      label="Requested For"
                      required
                    >
                      <MenuItem value="S">Self</MenuItem>
                      <MenuItem value="C">Customer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid2>

                <Grid2 item sx={{
                      width: { xs: "100%", sm: "30%" , lg:"30%"},
                    }} >
                  <FormControl style={{ minWidth: 120 }}>
                    <InputLabel>Kitchen Id</InputLabel>
                    <Select
                    
                      name="kitchen_id"
                      value={formData.kitchen_id}
                      onChange={handleChange}
                      label="Kitchen Id"
                      required
                    >
                      <MenuItem value="TR002">TR002</MenuItem>
                    </Select>
                  </FormControl>
                </Grid2>

                {formData.self_customer === "C" && (
                  <Grid2
                    item
                    sx={{
                      width: { xs: "100%", sm: "40%" , lg:"20%"},
                    }}
                  >
                    <TextField
                      label="Customer Name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}
                {formData.self_customer === "C" && (
                  <Grid2
                    item
                    sx={{
                      width: { xs: "100%", sm: "40%", lg:"20%" },
                    }}
                  >
                    <TextField
                      label="Customer Address"
                      name="customer_address"
                      value={formData.customer_address}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}

                {formData.self_customer === "C" && (
                  <Grid2
                    item
                    sx={{
                      width: { xs: "100%", sm: "40%",lg:"20%" },
                    }}
                  >
                    <TextField
                      label="Customer Phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      type="text"
                    />
                    {errors.customer_phone && <FormHelperText>{errors.customer_phone}</FormHelperText>}
                  </Grid2>
                )}
                {formData.self_customer === "C" && (
                  <Grid2
                    item
                    sx={{
                      width: { xs: "100%", sm: "40%",lg:"20%"},
                    }}
                  >
                    <TextField
                      label="Customer Pin"
                      name="customer_pin"
                      value={formData.customer_pin}
                      onChange={handleChange}
                      type="text"
                    />
                  </Grid2>
                )}

                <Grid2 item size={6}>
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
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <IndentItemTable data={rows} sendToParent={alterRows} />

            {formData.self_customer === "S" && (
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                color="primary"
                type="submit"
                onClick={createIndent}
                disabled={rows && rows.length === 0}
              >
                Submit
              </Button>
            )}
            {formData.self_customer === "C" && (
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                color="primary"
                type="submit"
                onClick={createIndent}
                disabled={rows?.length === 0 || formData.customer_name === null || formData.customer_phone === null}
              >
                Submit For Customer
              </Button>
            )}
          </Box>
        </Box>
      )}
      {showAdd && (
        <Box sx={{ mt: 2 }}>
          <ItemAdd data={selectedRow} sendToParent={updateShowAdd} />
        </Box>
      )}
    </>
  );
};

export default CreateIndent;

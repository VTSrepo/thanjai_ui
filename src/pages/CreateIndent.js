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
  });

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createIndent = () => {
    //navigate("/indents-item");
    setShowAdd(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      item_name:item.item.product_name,
      item_code:item.item.product_id,
      ...item
    };

    // Step 3: Update the rows state to add the new row
    setRows([...rows, newRow]);
  };

  const updateShowAdd = (item) => {
    if(item?.qty_ordered){
      addRow(item);
    } 
    console.log(item);
    setShowAdd(false);
  };

  const alterRows = (item)=>{    
    const updatedRows = rows.filter((row) => row.product_id !== item.product_id);

    // Update the state with the new array (without the deleted item)
    setRows(updatedRows);
  }

  //if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!showAdd && (
        <Box>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Create Indent
          </Typography>

          <Box sx={{ mt: 2 }}>
            <form onSubmit={handleSubmit}>
              <Grid2 container spacing={4}>
                {/* Requested For */}
                <Grid2 item size={3}>
                  <FormControl fullWidth>
                    <InputLabel>Requested For</InputLabel>
                    <Select
                      name="requestedFor"
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

                <Grid2 item size={3}>
                  <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="delivery_by_datetime"
                    name="delivery_by_datetime"
                    label="Delivery By"
                    fullWidth
                    type="date"
                    InputLabelProps={{
                      shrink: true
                   }}
                    value={formData.delivery_by_datetime || ''}
                    variant="standard"
                    onChange={handleChange}
                  />
                </Grid2>
                <Grid2 item size={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={createIndent}
                  >
                    Add Item
                  </Button>
                </Grid2>

                <Grid2 item size={6}>
                  {/* <Button
                        variant="contained"
                        color="primary"                                  
                        fullWidth
                        onClick={handleBack}
                      >
                        Back
                      </Button> */}
                </Grid2>
              </Grid2>
            </form>
          </Box>
          <IndentTable data={rows} sendToParent={alterRows}/>
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

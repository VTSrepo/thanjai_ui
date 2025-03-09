import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom"; // Import useNavigate

const IndentRequestForm = ({ user }) => {
  const navigate = useNavigate(); // Replace useHistory with useNavigate
  const [formData, setFormData] = useState({
    itemName: "",
    unitOfMeasure: "",
    qtyReceived: "",
    qtyRequired: "",
    qtyAgreed: "",
    note1: "",
    note2: "",
    requestedFor: "Self",
  });

  console.log(user);

  const [items, setItems] = useState([
    { itemCode: 1, itemName: "Samosa", itemCost: 10 },
  ]);

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

  const handleBack = () =>{
    if(user.role === "admin"){
      navigate("/admin")
    } else {
      navigate("/home")
    }    
  }

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
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    label="Item Name"
                    required
                  >
                    {items.map((item, index) => (
                      <MenuItem key={index} value={item.itemCode}>
                        {item.itemName}
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
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  required
                />
              </Grid2>
              {user && (user.role === "kitchen" || user.role === "admin") && (
                <Grid2 item size={12}>
                  <TextField
                    label="Quantity Received"
                    variant="outlined"
                    fullWidth
                    name="qtyReceived"
                    value={formData.qtyReceived}
                    onChange={handleChange}
                    type="number"
                    required
                  />
                </Grid2>
              )}
              {/* Quantity Received */}

              {/* Quantity Required */}
              <Grid2 item size={12}>
                <TextField
                  label="Qty Required"
                  variant="outlined"
                  fullWidth
                  name="qtyRequired"
                  value={formData.qtyRequired}
                  onChange={handleChange}
                  type="number"
                  required
                />
              </Grid2>

              {user && (user.role === "kitchen" || user.role === "admin") && (
              <Grid2 item size={12}>
                <TextField
                  label="Qty Agreed by Kitchen"
                  variant="outlined"
                  fullWidth
                  name="qtyAgreed"
                  value={formData.qtyAgreed}
                  onChange={handleChange}
                  type="number"
                  required
                />
              </Grid2>)}

              {/* Requested For */}
              <Grid2 item size={12}>
                <FormControl fullWidth>
                  <InputLabel>Requested For</InputLabel>
                  <Select
                    name="requestedFor"
                    value={formData.requestedFor}
                    onChange={handleChange}
                    label="Requested For"
                    required
                  >
                    <MenuItem value="Self">Self</MenuItem>
                    <MenuItem value="Customer">Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>

              {user && (user.role === "branch" || user.role === "admin") && (
              <Grid2 item size={12}>
                <TextField
                  label="Branch Notes"
                  variant="outlined"
                  fullWidth
                  name="note1"
                  value={formData.note1}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid2>)}


              {/* Note 2 */}
              {user && (user.role === "kitchen" || user.role === "admin") && (
              <Grid2 item size={12}>
                <TextField
                  label="Kitchen Notes"
                  variant="outlined"
                  fullWidth
                  name="note2"
                  value={formData.note2}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid2>)}

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
                  disabled="true"
                  fullWidth
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

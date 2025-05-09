import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate,useLocation } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import ProductTable from "../components/ProductTable";
import Loader from "../components/Loader";
import { API_URL } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import axios from "axios";

const ProductMaster = () => {
  const navigate = useNavigate();  
  const { user, login, logout } = useUser();
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState([]);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createIndent = () => {
    navigate("/product-create");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
        const response = await axios.get(`${API_URL}/products/${org_id}`);
        const updatedData = response.data.products.map((item, index) => ({
          ...item,
          id: item.id || index + 1, // Appending a unique ID if it doesn't exist
        }));
        setLoading(false);
        // Set loading to false once data is loaded
        setProductList(updatedData); // Set the response data into state
      } catch (err) {
        //setError(err.message);   // Handle any errors
        //setLoading(false);
      }
    };

    fetchData(); // Call the function to fetch data
  }, []);

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createIndent}>
          Add Product
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <ProductTable list={productList} />
        </Box>
      </Box>
    </>
  );
};

export default ProductMaster;

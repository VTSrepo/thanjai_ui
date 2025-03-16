import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import ProductTable from "../components/ProductTable";
import Loader from "../components/Loader";
import NavTab from "../components/NavTab";

import axios from "axios";

const IndentMaster = ({ user }) => {
  const navigate = useNavigate();
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
        const API_URL = "http://localhost:4002/v1"; // Change this to your actual API URL
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
      <Box sx={{ mt: 4, padding: 2 }}>
        <NavTab />
      </Box>
    </>
  );
};

export default IndentMaster;

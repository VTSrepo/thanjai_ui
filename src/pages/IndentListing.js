import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; 
import IndentListingtable from "../components/IndentListingTable";
import Loader from "../components/Loader";

import axios from "axios";
import IndentDetail from "./IndentDetail";

const IndentListing = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDetailView, setIsDetailView] = useState(false);
  const [productList, setProductList] = useState([]);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const viewDetail = () =>{
    setIsDetailView(true);
  }

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
       {!isDetailView && (<Box sx={{ mt: 4, padding: 2 }}>
        <IndentListingtable list={productList} sendToParent={viewDetail}/>
      </Box>)}

      {isDetailView && (<Box sx={{ mt: 4, padding: 2 }}>
        <IndentDetail />
      </Box>)}
    </>
  );
};

export default IndentListing;

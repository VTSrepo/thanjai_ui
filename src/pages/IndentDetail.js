import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import IndentItemTable from "../components/IndentItemTable";
import Loader from "../components/Loader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ItemAdd from "./ItemAdd";

import axios from "axios";

const IndentDetail = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         const API_URL = "http://localhost:4002/v1"; // Change this to your actual API URL
  //         const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  //         const response = await axios.get(`${API_URL}/products/${org_id}`);
  //         const updatedData = response.data.products.map((item, index) => ({
  //           ...item,
  //           id: item.id || index + 1, // Appending a unique ID if it doesn't exist
  //         }));
  //         setLoading(false);
  //         // Set loading to false once data is loaded
  //         setProductList(updatedData); // Set the response data into state
  //       } catch (err) {
  //         //setError(err.message);   // Handle any errors
  //         //setLoading(false);
  //       }
  //     };

  //     fetchData(); // Call the function to fetch data
  //   }, []);
  const rows = [
    {
      id: 1,
      item_name: "MEDU VADA ",
      item_code: "PROD0008",
      item: {
        org_id: "TR",
        branch_id: "TR002",
        product_id: "PROD0008",
        product_name: "MEDU VADA ",
        uom: "piece",
        bu_id: "TR001",
        stock_in_hand: null,
        min_stock: null,
        max_stock: null,
        reorder_level: null,
        price_deviation: null,
        billing_flag: null,
        account_code: null,
        updated_by: null,
        updated_date: null,
        created_by: null,
        created_date: null,
        product_price: 0.7,
        prod_name_invoice: null,
        gst_value: null,
        category_code: null,
        bu_name: "Food Items",
        category_name: null,
      },
      uom: "piece",
      qty_ordered: "12",
      mandatory_status: null,
    },
  ];

  const navigateBack = () => {
    setShowAdd(false);
  };

  const updateShowAdd = (item) => {
    if (!item.delete) {
      setSelectedItem(item);
      setShowAdd(true);
    }
  };
  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!showAdd && (
        <>
          <Box>
            <Typography variant="h4" component="h2">
              Indent Detail
            </Typography>
            <List
              sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
            >
              <ListItem>
                <ListItemText primary="Indent Number" secondary="1234" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Requested For" secondary="Self" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Status" secondary="Created" />
              </ListItem>
            </List>
          </Box>
          <Box sx={{ mt: 2 }}>
            <IndentItemTable data={rows} sendToParent={updateShowAdd} />
          </Box>
        </>
      )}

      {showAdd && (
        <Box sx={{ mt: 2 }}>
          <ItemAdd data={selectedItem} sendToParent={navigateBack} />
        </Box>
      )}
    </>
  );
};

export default IndentDetail;

import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import IndentListingtable from "../components/IndentListingTable";
import Loader from "../components/Loader";

import axios from "axios";
import IndentDetail from "./IndentDetail";
import { getListing, getIndentDetail } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import InfoDialog from "../components/InfoDialog";

const IndentListing = ({ tabValue }) => {
  const { user, login, logout } = useUser();
  const [openDialog, setOpenDialog] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDetailView, setIsDetailView] = useState(false);
  const [indentList, setIndentList] = useState([]);
  const [indentNumber, setIndentNumber] = useState(null);
  const [listingLabel, setListingLabel] = useState(null);

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const openCustomDialog = () => {
    setOpenDialog(true);
  };

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const viewDetail = (record) => {
    setIsDetailView(true);
    setIndentNumber(record.indent_number);
  };

  const closeDetail = () => {
    
    getitems()
    setIsDetailView(false);
  };

  const getStatus = () => {
    switch (tabValue) {
      case 1:
        setListingLabel("Acknowledge by Kitchen")
        return "C";
      case 2:
        setListingLabel("Dispatch by Kitchen")
        return "A";
      case 3:
        setListingLabel("Receive by Branch")
        return "D";
    }
  };

  const getitems = async () => {
    try {
      const status = getStatus();
      const params = { status: status };
      const result = await getListing(params);
      const updatedData = result.data.indents.map((item, index) => ({
        ...item,
        id: item.id || index + 1, // Appending a unique ID if it doesn't exist
      }));
      setIndentList(updatedData);
    } catch (err) {
      setMessage(err.response?.data?.message);
      openCustomDialog();
      setIndentList([])
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getitems(); // Call the function to fetch data
  }, []);

  
  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Indent Listings to {listingLabel}
      </Typography>
      {!isDetailView && (
        <Box sx={{ mt: 4, padding: 2 }}>
          <IndentListingtable list={indentList} sendToParent={viewDetail} />
        </Box>
      )}

      {isDetailView && (
        <Box sx={{ mt: 4, padding: 2 }}>
          <IndentDetail
            indentNumber={indentNumber}
            sendToParent={closeDetail}
          />
        </Box>
      )}

      <InfoDialog
        open={openDialog}
        onClose={handleDialogClose}
        title="Information"
        message={message}
      />
    </>
  );
};

export default IndentListing;

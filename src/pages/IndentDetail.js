import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { getIndentDetail, createNewIndent } from "../utilities/service";
import IndentItemTable from "../components/IndentItemTable";
import Loader from "../components/Loader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ItemAdd from "./ItemAdd";
import { format } from "date-fns";
import InfoDialog from "../components/InfoDialog";

const IndentDetail = ({ indentNumber, sendToParent }) => {
  const [indentDetail, setIndentDetail] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [message, setMessage] = useState(null);
  const [enableAccept, setEnableAccept] = useState(true);

  useEffect(() => {
    const getDetail = async () => {
      try {
        const result = await getIndentDetail(indentNumber);
        setIndentDetail(result.data.indent);
        const updatedData = result.data.indent.indent_details.map(
          (item, index) => ({
            ...item,
            id: item.id || index + 1, // Appending a unique ID if it doesn't exist
          })
        );
        setRows(updatedData);
      } catch (err) {
        // setMessage(err.response?.data?.message);
        // openCustomDialog();
      } finally {
        setLoading(false);
      }
    };

    getDetail(); // Call the function to fetch data
  }, []);

  const navigateBack = (item) => {
    setShowAdd(false);
    //On Save Action
    if (item.id) {
      rows.forEach((i) => {
        if (i.id === item.id) {
          i.qty_agreed_kitchen = item.qty_agreed_kitchen;
          i.kitchen_remarks = item.kitchen_remarks;
          i.qty_received = item.qty_received;
          i.discrepancy_notes = item.discrepancy_notes;
          i.damage_notes = item.damage_notes;
        }
      });
      setRows(rows);
    }
  };

  const navigateBackToListing = () => {
    sendToParent();
  };

  const formatDeliveryByTime = (date) => {
    return format(new Date(date), "PPpp");
  };

  const updateShowAdd = (item) => {
    if (!item.delete) {
      setSelectedItem(item);
      setShowAdd(true);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    sendToParent();
  };

  const updateIndent = async (payload) => {
    const res = await createNewIndent(payload);
    if (res) {
      setMessage("Indent Updated");
      setOpenDialog(true);
    } else {
      setMessage("Indent Acknowledgement Failure");
      setOpenDialog(true);
    }
  };

  const actionIndent = async (action) => {
    let payload = indentDetail;
    if (action === "accept") {
      payload.indent_details = rows;
      payload.status = "A";
    }
    if (action === "dispatch") {
      payload.status = "D";
    }
    if (action === "receive") {
      payload.indent_details = rows;
      payload.status = "R";
    }

    await updateIndent(payload);
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
            {indentDetail && (
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                }}
              >
                <ListItem>
                  <ListItemText
                    primary="Indent Number"
                    secondary={indentDetail?.indent_number}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Requested For"
                    secondary={formatDeliveryByTime(
                      indentDetail?.delivery_by_datetime
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={indentDetail?.status}
                  />
                </ListItem>
              </List>
            )}
          </Box>
          {indentDetail?.customer_name && (<Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ pl: 2 }}>
                <Typography>Customer</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box x={{ ml: 2 }}>{indentDetail?.customer_name}</Box>               
              </AccordionDetails>
            </Accordion>
          </Box>)}
          <Box sx={{ mt: 2 }}>
            <IndentItemTable
              data={rows}
              sendToParent={updateShowAdd}
              status={indentDetail?.status}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={navigateBackToListing}
            >
              Back
            </Button>

            {indentDetail?.status === "C" && (
              <Button
                variant="contained"
                color="primary"
                sx={{ marginLeft: 2 }}
                onClick={() => actionIndent("accept")}
                disabled={!enableAccept}
              >
                Accept
              </Button>
            )}

            {indentDetail?.status === "A" && (
              <Button
                variant="contained"
                color="primary"
                sx={{ marginLeft: 2 }}
                onClick={() => actionIndent("dispatch")}
              >
                Dispatch
              </Button>
            )}

            {indentDetail?.status === "D" && (
              <Button
                variant="contained"
                color="primary"
                sx={{ marginLeft: 2 }}
                onClick={() => actionIndent("receive")}
              >
                Update
              </Button>
            )}
          </Box>
        </>
      )}

      {showAdd && (
        <Box sx={{ mt: 2 }}>
          <ItemAdd
            data={selectedItem}
            sendToParent={navigateBack}
            indent_status={indentDetail.status}
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

export default IndentDetail;

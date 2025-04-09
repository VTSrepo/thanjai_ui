import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  TextField,
} from "@mui/material";

import Paper from "@mui/material/Paper";
import { getSellingPriceRecord, setSellingPrice } from "../utilities/service";
import { useNavigate } from "react-router-dom";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import { alignProperty } from "@mui/material/styles/cssUtils";
export default function ProductTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/product-create", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);
  const [sp, SetSp] = useState({});

  const handleClickOpen = async (row) => {
    const res = await getSellingPriceRecord(row.product_id);
    SetSp(res.sellingprice);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  

  const handleSave = async() => {
   // const payload = {}
    const res = await setSellingPrice(sp);
    alert('Data saved');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    SetSp({
      ...sp,
      [name]: value,
    });
  };

  const columns = [
    { field: "product_id", headerName: "Product Id", width: 200 },
    { field: "product_name", headerName: "Product Name", width: 200 },
    { field: "uom", headerName: "UOM", width: 130 },
    { field: "bu_name", headerName: "BU", width: 130 },
    { field: "category_name", headerName: "Category", width: 130 },
    {
      field: "stock_in_hand",
      headerName: "Stock In Hand",
      type: "number",
      width: 120,
    },
    {
      field: "product_price",
      headerName: "Product Price",
      type: "number",
      width: 120,
    },
    {
      field: "action",
      headerName: "Edit",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Edit">
          <EditNoteIcon
            style={{ cursor: "pointer" }}
            onClick={() => handleEdit(params.row)}
          />
        </Tooltip>
      ),
    },

    {
      field: "Selling Price",
      headerName: "Selling Price",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Selling Price">
          <PriceChangeIcon
            style={{ cursor: "pointer" }}
            onClick={()=>handleClickOpen(params.row)}
          />
        </Tooltip>
      ),
    },
  ];
  return (
    <Paper sx={{ height: "100%", width: "100%" }}>
      <DataGrid
        rows={list}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries(formData.entries());
              const email = formJson.email;
              console.log(email);
              handleClose();
            },
          },
        }}
      >
        <DialogTitle>Selling Price Update</DialogTitle>
        <DialogContent>
          {/* <DialogContentText>
                  To subscribe to this website, please enter your email address here. We
                  will send updates occasionally.
                </DialogContentText> */}
          <TextField
            autoFocus
            required
            margin="dense"
            id="eff_from"
            name="eff_from"
            label="Effective Date"
            fullWidth
            type="date"
            value={sp.eff_from}
            variant="standard"
            onChange={handleChange}
          />

          <TextField
            autoFocus
            required
            margin="dense"
            id="product_price"
            name="product_price"
            label="Selling Price"
            fullWidth
            type="number"
            value={sp.product_price}
            variant="standard"
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

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
import PriceChangeIcon from "@mui/icons-material/PriceChange";

export default function IndentListingtable({ list, sendToParent }) {
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

  const handleSave = async () => {
    // const payload = {}
    const res = await setSellingPrice(sp);
    alert("Data saved");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    SetSp({
      ...sp,
      [name]: value,
    });
  };

  const handleView = (row) => {
    sendToParent(row);
  };

  const columns = [
    {
      field: "indent_number",
      headerName: "Indent Id",
      width: 200,
      renderCell: (params) => (
        <span
          style={{ textDecoration: "underline", color: "#ffa133" }}
          onClick={() => handleView(params.row)}
        >
          {params.row.indent_number}
        </span>
      ),
    },
    { field: "indent_date", headerName: "Indent Status", width: 200 },
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
    </Paper>
  );
}

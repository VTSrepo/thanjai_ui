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
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ProductionMonitorTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/job-create", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const columns = [
    { field: "product_name", headerName: "Product Name", width: 200 },
    { field: "emp_name", headerName: "Emp Name", width: 200 },
    { field: "production_qty", headerName: "Production Qty", width: 130 },
    { field: "damaged_qty", headerName: "Damaged Qty", width: 130, type: 'number', },
    { field: "production_date", headerName: "Date", width: 130 },
    {
      field: "remarks",
      headerName: "Remarks",
      type: "number",
      width: 120,
    },
    {
      field: "action",
      headerName: "View",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="View">
          <VisibilityIcon
            style={{ cursor: "pointer" }}
            onClick={() => handleEdit(params.row)}
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
    </Paper>
  );
}

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { Tooltip, Button } from "@mui/material";
import { FormattedDate } from "../utilities/helpers";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { exportPDF } from "../utilities/fileHelper";

function CustomToolbar({ columns, rows }) {
  const pdfColumns = [
    { field: "product_name", headerName: "Product Name", width: 200 },
    { field: "emp_name", headerName: "Emp Name", width: 200 },
    { field: "production_qty", headerName: "Production Qty", width: 130 },
    {
      field: "damaged_qty",
      headerName: "Damaged Qty",
      width: 130,
      type: "number",
    },
    {
      field: "production_date",
      headerName: "Date",
      width: 130,
      render: (value) => {
        const date = new Date(value);
        if (isNaN(date)) return "";
        return `${FormattedDate(date)}`;
      },
    },
    { field: "start_time", headerName: "Start Time", width: 130 },
    { field: "end_time", headerName: "End Time", width: 130 },
    {
      field: "remarks",
      headerName: "Remarks",
      type: "number",
      width: 120,
    },
    { field: "", width: 130, headerName: "Signature" }, // shown only in PDF
  ];

  const handlePDFExport = () => {
    exportPDF(pdfColumns, rows, "ProductionReport");
  };

  return (
    <GridToolbarContainer>
      <Button
        disabled={Object.entries(rows)?.length === 0}
        variant="contained"
        color="success"
        onClick={handlePDFExport}
      >
        Download as PDF
      </Button>
    </GridToolbarContainer>
  );
}

export default function TSTable({ list }) {
  const location = useLocation();
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/ts-create", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const columns = [
    { field: "emp_name", headerName: "Emp Name", width: 200 },
    {
      field: "cur_date",
      headerName: "Date",
      width: 130,
      valueFormatter: (value) => value.toISOString().slice(0, 10),
    },
    { field: "start_time", headerName: "Start Time", width: 130 },
    { field: "end_time", headerName: "End Time", width: 130 },
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

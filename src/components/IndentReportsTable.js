import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { Tooltip, Button } from "@mui/material";
import { dateFromString } from "../utilities/helpers";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { exportPDF } from "../utilities/fileHelper";

function CustomToolbar({ columns, rows }) {
  const pdfColumns = [
    { field: "branch_name", headerName: "Branch Name", width: 200 },
    {
      field: "indent_number",
      headerName: "Indent Number",
      width: 130,
      type: "number",
    },
    {
      field: "indent_date",
      headerName: "Indent Date",
      width: 130,
      render: (value) => {
        return value.toISOString().slice(0, 10);
      },
    },
    { field: "indent_number", headerName: "Indent Number", width: 130 },
    { field: "kitchen_name", headerName: "Kitchen Name", width: 130 },
    { field: "product_name", headerName: "Product Name", width: 130 },
    {
      field: "qty_ordered",
      headerName: "Qty Ordered",
      type: "number",
      width: 120,
    },
    {
      field: "qty_agreed_kitchen",
      headerName: "Qty Agreed Kitchen",
      type: "number",
      width: 120,
    },
    {
      field: "qty_received",
      headerName: "Qty Received",
      type: "number",
      width: 120,
    },
    
    { field: "", width: 130, headerName: "Signature" }, // shown only in PDF
  ];

  const handlePDFExport = () => {
    exportPDF(pdfColumns, rows, "IndentReport");
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

export default function IndentReportsTable({ list, formData }) {
  const location = useLocation();
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/job-create", { state: { selectedRow: row, backPath: location.pathname, parentFormData:formData} });
  };
  const navigate = useNavigate();

  const columns = [
    // {
    //   field: "action",
    //   headerName: "View",
    //   width: 150,
    //   align: "center",
    //   headerAlign: "center",
    //   renderCell: (params) => (
    //     <Tooltip title="View">
    //       <VisibilityIcon
    //         style={{ cursor: "pointer" }}
    //         onClick={() => handleEdit(params.row)}
    //       />
    //     </Tooltip>
    //   ),
    // },
   
    { field: "branch_name", headerName: "Branch Name", width: 200 },
    {
      field: "indent_date",
      headerName: "Indent Date",
      width: 130,
      valueFormatter: (value) => value.toISOString().slice(0, 10),
    },
    { field: "indent_number", headerName: "Indent Number", width: 130 },
    { field: "indent_value", headerName: "Indent Value", width: 130 },
    { field: "kitchen_name", headerName: "Kitchen Name", width: 130 },
    { field: "kitchen_remarks", headerName: "Kitchen Remarks", width: 130 },
    { field: "discrepancy_notes", headerName: "Discrepancy Notes", width: 130 },
    { field: "product_name", headerName: "Product Name", width: 130 },
    { field: "item_cost", headerName: "Item Cost", width: 130 },
    { field: "damage_notes", headerName: "Damage Notes", width: 130 },
    {
      field: "qty_ordered",
      headerName: "Qty Ordered",
      type: "number",
      width: 120,
    },
    {
      field: "qty_agreed_kitchen",
      headerName: "Qty Agreed Kitchen",
      type: "number",
      width: 120,
    },
    {
      field: "qty_received",
      headerName: "Qty Received",
      type: "number",
      width: 120,
    },
  ];
  return (
    <Paper sx={{ height: "100%", width: "100%" }}>
      <DataGrid
        rows={list}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        sx={{ border: 0 }}
        slots={{
          toolbar:
            location.pathname === "/indent"
              ? () => <CustomToolbar columns={columns} rows={list} />
              : null,
        }}
      />
    </Paper>
  );
}

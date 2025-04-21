import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";

import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function EmployeeTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/view-employee", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const columns = [
    {
      field: "action",
      headerName: "View",
      width: 200,
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
    { field: "emp_id", headerName: "Employee ID", width: 250 },
    { field: "emp_name", headerName: "Employee Name", width: 250 },
    { field: "branch_name", headerName: "Branch Name", width: 250 },
    // { field: "org_name", headerName: "Org Name", width: 200 },
    { field: "contact", headerName: "Contact", width: 250 },
    { field: "active", headerName: "Active", width: 250 },
   
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

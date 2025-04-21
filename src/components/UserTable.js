import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";

import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function UserTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/view-user", { state: { selectedRow: row } });
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
    { field: "user_name", headerName: "User Name", width: 200 },
    { field: "user_id", headerName: "User Id", width: 200 },
    { field: "dob", headerName: "Date of Birth", width: 200 },
    { field: "doj", headerName: "Date of Join", width: 200 },
    { field: "mobile_no", headerName: "Mobile No", width: 200 },
    { field: "home_contact_no", headerName: "Home Contact No", width: 200 },
    { field: "branch_name", headerName: "Branch Name", width: 220 },
    // { field: "org_name", headerName: "Org Name", width: 200 },
    { field: "residence_address", headerName: "Residence Address", width: 200 },
    { field: "email_id", headerName: "Email Id", width: 200 },
    { field: "user_type", headerName: "User Type", width: 200 },
    { field: "user_status", headerName: "User Status", width: 200 },
   
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

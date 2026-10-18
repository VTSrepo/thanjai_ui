import React, { useState } from "react";
import ResponsiveGrid from "./ResponsiveGrid";
import { Tooltip } from "@mui/material";

import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyIcon from "@mui/icons-material/Key";
import ResetPasswordDialog from "./ResetPasswordDialog";
import { useUser, USER_TYPE_LABEL } from "../utilities/UserContext";

export default function UserTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/create-user", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();
  const { can } = useUser();
  const [reset, setReset] = useState(null);

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
    ...(can("M_USER", true) ? [{
      field: "reset",
      headerName: "Password",
      width: 110,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Reset password (forgotten password)">
          <KeyIcon style={{ cursor: "pointer" }} color="action" onClick={() => setReset(params.row)} />
        </Tooltip>
      ),
    }] : []),
    { field: "user_name", headerName: "User Name", width: 200 },
    { field: "user_id", headerName: "User Id", width: 200 },
    { field: "doj", headerName: "Date of Join", width: 200 },
    { field: "mobile_no", headerName: "Mobile No", width: 200 },
    { field: "home_contact_no", headerName: "Home Contact No", width: 200 },
    { field: "branch_name", headerName: "Branch Name", width: 220 },
    // { field: "org_name", headerName: "Org Name", width: 200 },
    { field: "residence_address", headerName: "Residence Address", width: 200 },
    { field: "email_id", headerName: "Email Id", width: 200 },
    { field: "user_type", headerName: "User Type", width: 200, valueGetter: (v) => USER_TYPE_LABEL[v] || v },
    { field: "user_status", headerName: "User Status", width: 150, valueGetter: (v) => (v === "A" ? "Active" : v === "I" ? "Inactive" : v) },
   
  ];
  return (
    <Paper sx={{ height: "100%", width: "100%" }}>
      <ResponsiveGrid
        rows={list}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
      <ResetPasswordDialog open={!!reset} userId={reset?.user_id} userName={reset?.user_name} onClose={() => setReset(null)} />
    </Paper>
  );
}

import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DeleteIcon from '@mui/icons-material/Delete';

const IndentItemTable = ({ user, data, sendToParent }) => {  
  //const { sendToParent } = props;
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate(); 

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "item_code", headerName: "Item Code", width: 130 },
    { field: "item_name", headerName: "Item name", width: 130 },
    { field: "uom", headerName: "UOM", width: 130 },
    {
      field: "qty_ordered",
      headerName: "Qty Required",
      type: "number",
      width: 90,
    },
    
    // {
    //   field: "action",
    //   headerName: "Actions",
    //   width: 150,
    //   renderCell: (params) => (
    //     <Tooltip title="Edit">
    //     <EditNoteIcon
    //       style={{ cursor: "pointer" }}
    //       onClick={() => handleEdit(params.row)}
    //     /></Tooltip>
    //   ),
    // },

    {
      field: "delete",
      headerName: "",
      width: 150,
      renderCell: (params) => (
        <Tooltip title="Delete">
        <DeleteIcon
          style={{ cursor: "pointer" }}
          onClick={() => handleDelete(params.row)}
        /></Tooltip>
      ),
    },
    {
      field: "approval",
      headerName: "Approval",
      width: 150,
      renderCell: (params) => (
        <Tooltip title="Approve">
        <PendingActionsIcon
          style={{ cursor: "pointer" }}
          onClick={() => handleEdit(params.row)}
        />
        </Tooltip>
      ),
    },
  ];
  

  const columnVisibilityModel = { approval: user?.role == "admin"};

  const handleDelete = (row)=>{
    row.delete = true
    sendToParent(row)
  }

  const handleEdit = async (row) => {
    row.delete = false
    sendToParent(row)
  };

  const paginationModel = { page: 0, pageSize: 5 };
  return (
    <Paper sx={{width: "100%" }}>
      <DataGrid
        rows={data}
        columns={columns}    
        columnVisibilityModel={columnVisibilityModel}    
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
};

export default IndentItemTable;

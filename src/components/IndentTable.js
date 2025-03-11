import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

const IndentTable = ({ user }) => {
  console.log(user);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "itemName", headerName: "Item name", width: 130 },
    { field: "uom", headerName: "UOM", width: 130 },
    {
      field: "qtyRequired",
      headerName: "Qty Required",
      type: "number",
      width: 90,
      hide: isAdmin,
    },
    {
      field: "qtyReceived",
      headerName: "Qty Received",
      type: "number",
      width: 90,
    },
    {
      field: "action",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Tooltip title="Edit">
        <EditNoteIcon
          style={{ cursor: "pointer" }}
          onClick={() => handleEdit(params.row)}
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
  

  const columnVisibilityModel = { approval: user?.role == "admin", action: user?.role == "admin" };

  const handleEdit = async (row) => {
    try {
      // Make the API call to get product from ID
      //await axios.delete(`https://jsonplaceholder.typicode.com/users/${id}`);

      // After the successful API call, update the local state (remove the row)
      //setRows(rows.filter((row) => row.id !== id));
      navigate("/product-create", { state: { selectedRow: row } });
    } catch (error) {
      console.error("Error deleting row:", error);
      alert("Failed to delete row.");
    }
  };

  const rows = [
    { id: 1, itemName: "Samosa", uom: "EA", qtyRequired: 35 },
    { id: 2, itemName: "Chicken 65", uom: "Packet", qtyRequired: 42 },
    { id: 3, itemName: "Batter", uom: "Bucket", qtyRequired: 45 },
    { id: 4, itemName: "Parotta", uom: "EA", qtyRequired: 16 },
    { id: 5, itemName: "Vada", uom: "EA", qtyRequired: null },
    { id: 6, itemName: "Lassi", uom: "EA", qtyRequired: 150 },
    { id: 7, itemName: "Cola", uom: "EA", qtyRequired: 44 },
  ];

  const paginationModel = { page: 0, pageSize: 5 };
  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
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

export default IndentTable;

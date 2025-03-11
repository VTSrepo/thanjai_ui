import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import EditNoteIcon from "@mui/icons-material/EditNote";
export default function ProductTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };
    

  const handleEdit = async (row) => {
    navigate("/product-create", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const columns = [
    { field: "product_id", headerName: "Product Id", width: 130 },
    { field: "product_name", headerName: "Product Name", width: 200 },
    { field: "uom", headerName: "UOM", width: 130 },
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
      renderCell: (params) => (
        <Tooltip title="Edit">
          <EditNoteIcon
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

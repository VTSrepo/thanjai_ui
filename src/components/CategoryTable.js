import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";

import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function CategoryTable({ list }) {
  const paginationModel = { page: 0, pageSize: 10 };

  const handleEdit = async (row) => {
    navigate("/view-category", { state: { selectedRow: row } });
  };
  const navigate = useNavigate();

  const columns = [
    {
      field: "action",
      headerName: "View",
      width: 300,
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
    { field: "category_code", headerName: "Category Code", width: 400 },
    { field: "category_name", headerName: "Category Name", width: 400 },
    
    { field: "active", headerName: "Active", width: 200 },
    
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

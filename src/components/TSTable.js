import React from "react";
import ResponsiveGrid from "./ResponsiveGrid";
import { Tooltip } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function TSTable({ list }) {
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
      <ResponsiveGrid
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

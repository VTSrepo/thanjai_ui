import * as React from 'react';
import { DataGrid} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'itemName', headerName: 'Item name', width: 130 },
  { field: 'uom', headerName: 'UOM', width: 130 },
  {
    field: 'qtyRequired',
    headerName: 'Qty Required',
    type: 'number',
    width: 90,
  },
  {
    field: 'qtyReceived',
    headerName: 'Qty Received',
    type: 'number',
    width: 90,
  },
//   {
//     field: 'fullName',
//     headerName: 'Full name',
//     description: 'This column has a value getter and is not sortable.',
//     sortable: false,
//     width: 160,
//     valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
//   },
];

const rows = [
  { id: 1, itemName: 'Samosa', uom: 'EA', qtyRequired: 35 },
  { id: 2, itemName: 'Chicken 65', uom: 'Packet', qtyRequired: 42 },
  { id: 3, itemName: 'Batter', uom: 'Bucket', qtyRequired: 45 },
  { id: 4, itemName: 'Parotta', uom: 'EA', qtyRequired: 16 },
  { id: 5, itemName: 'Vada', uom: 'EA', qtyRequired: null },
  { id: 6, itemName: 'Lassi', uom: 'EA', qtyRequired: 150 },
  { id: 7, itemName: 'Cola', uom: 'EA', qtyRequired: 44 },
 
];

const paginationModel = { page: 0, pageSize: 5 };

export default function IncidentTable() {
  return (
    <Paper sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}

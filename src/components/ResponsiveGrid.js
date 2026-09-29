import React, { useMemo, useState } from "react";
import { Box, Card, CardContent, Stack, TablePagination, Typography, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

/**
 * Drop-in replacement for MUI DataGrid.
 * Desktop/tablet: the normal DataGrid (all props passed through).
 * Phone: one card per row built from the same column definitions -
 *   first data column = card title, icon/action columns top-right, the rest as "Label: value" lines.
 */
const ACTION_FIELDS = ["action", "actions", "edit", "view", "delete", "approval", "price"];

const cellValue = (col, row, index) => {
  const value = col.valueGetter ? col.valueGetter(row[col.field], row) : row[col.field];
  if (col.renderCell) {
    return col.renderCell({ row, value, field: col.field, id: row.id ?? index, formattedValue: value, colDef: col });
  }
  if (col.valueFormatter) return col.valueFormatter(value, row);
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const MobileCards = ({ rows, columns, columnVisibilityModel, initialState, onRowClick }) => {
  const initialSize = initialState?.pagination?.paginationModel?.pageSize || 10;
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(Math.max(initialSize, 5));

  const visible = useMemo(
    () => columns.filter((c) => (columnVisibilityModel ? columnVisibilityModel[c.field] !== false : true) && c.field !== "id"),
    [columns, columnVisibilityModel]
  );
  const actions = visible.filter((c) => ACTION_FIELDS.includes(c.field) || (c.renderCell && !c.headerName));
  const data = visible.filter((c) => !actions.includes(c));
  const [titleCol, ...rest] = data;
  const pageRows = (rows || []).slice(page * perPage, page * perPage + perPage);

  if (!rows?.length) {
    return <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>No records.</Typography>;
  }
  return (
    <Box>
      <Stack spacing={1.25}>
        {pageRows.map((row, i) => (
          <Card key={row.id ?? i} onClick={onRowClick ? () => onRowClick({ row }) : undefined} sx={{ cursor: onRowClick ? "pointer" : "default" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {titleCol && (
                    <Typography fontWeight={700} component="div" sx={{ wordBreak: "break-word" }}>
                      {cellValue(titleCol, row, i)}
                    </Typography>
                  )}
                </Box>
                {actions.map((c) => (
                  <Box key={c.field} sx={{ display: "flex", alignItems: "center" }}>{cellValue(c, row, i)}</Box>
                ))}
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.25, mt: 0.75 }}>
                {rest.map((c) => (
                  <React.Fragment key={c.field}>
                    <Typography variant="body2" color="text.secondary">{c.headerName || c.field}</Typography>
                    <Typography variant="body2" component="div" sx={{ wordBreak: "break-word" }}>{cellValue(c, row, i)}</Typography>
                  </React.Fragment>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <TablePagination component="div" count={rows.length} page={page} onPageChange={(e, p) => setPage(p)}
        rowsPerPage={perPage} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Per page"
        onRowsPerPageChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
    </Box>
  );
};

const ResponsiveGrid = (props) => {
  const isPhone = useMediaQuery((t) => t.breakpoints.down("sm"));
  if (isPhone) return <MobileCards {...props} />;
  return <DataGrid {...props} />;
};

export default ResponsiveGrid;

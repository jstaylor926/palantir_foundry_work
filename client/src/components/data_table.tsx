import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Card } from "@mui/material";

function DataTable<T extends { id: string | number }>({
                                                                         rows, columns, height = 520,
                                                                     }: { rows: T[]; columns: GridColDef[]; height?: number; }) {
    return (
        <Card sx={{ p: 1 }}>
            <div style={{ height, width: "100%" }}>
                <DataGrid rows={rows} columns={columns} pageSizeOptions={[5, 10, 25]} initialState={{
                    pagination: { paginationModel: { pageSize: 10 } }
                }} />
            </div>
        </Card>
    );
}

export default DataTable;
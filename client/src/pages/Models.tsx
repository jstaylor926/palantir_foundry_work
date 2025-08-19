import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useDAIA } from "../store/useDAIA";
import { Card, CardContent, CardHeader } from "@mui/material";
import DataTable from "../components/DataTable";
import { GridColDef } from "@mui/x-data-grid";

export default function Models() {
    const s = useDAIA();
    const nav = useNavigate();

    // Join models with latestByModel (include models that only appear in latest)
    const ids = new Set<string>([...s.models.map(m => m.modelId), ...s.latestByModel.map(x => x.modelId)]);
    const rows = [...ids].map(id => {
        const m = s.models.find(mm => mm.modelId === id);
        const l = s.latestByModel.find(ll => ll.modelId === id);
        return {
            id, modelId: id,
            title: m?.title ?? id,
            program: m?.program ?? "",
            ata: m?.ata ?? "",
            subject: l?.subject ?? "",
            status: l?.status ?? "",
        };
    });

    const cols: GridColDef[] = [
        { field: "title", headerName: "Model", flex: 1 },
        { field: "program", headerName: "Program", width: 140 },
        { field: "ata", headerName: "ATA", width: 160 },
        { field: "subject", headerName: "Subject", width: 120 },
        { field: "status", headerName: "Status", width: 160 },
        {
            field: "open", headerName: "", width: 120, sortable: false,
            renderCell: (p) => <a style={{ cursor: "pointer" }} onClick={() => nav(`/models/${p.row.modelId}`)}>Open →</a>
        },
    ];

    return (
        <Card>
            <CardHeader title="Models" />
            <CardContent>
                <DataTable rows={rows} columns={cols} />
            </CardContent>
        </Card>
    );
}

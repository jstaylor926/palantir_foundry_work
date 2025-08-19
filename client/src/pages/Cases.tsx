import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { daia } from "../lib/api";
import { IntegrationCase } from "../lib/types";
import DataTable from "../components/DataTable";
import { GridColDef } from "@mui/x-data-grid";

export default function Cases() {
    const [rows, setRows] = useState<any[]>([]);
    const nav = useNavigate();

    useEffect(() => {
        daia.listCases().then((cs: IntegrationCase[]) => {
            setRows(cs.map(c => ({ id: c.caseId, name: c.name, env: c.envTarget, phase: c.phase, status: c.status, risk: c.riskLevel })));
        });
    }, []);

    const cols: GridColDef[] = [
        { field: "name", headerName: "Case", flex: 1 },
        { field: "env", headerName: "Env", width: 100 },
        { field: "phase", headerName: "Phase", width: 140 },
        { field: "status", headerName: "Status", width: 140 },
        { field: "risk", headerName: "Risk", width: 120 },
        {
            field: "open", headerName: "", width: 120, sortable: false,
            renderCell: (p) => <a style={{ cursor: "pointer" }} onClick={() => nav(`/cases/${p.row.id}`)}>Open →</a>
        },
    ];

    return <DataTable rows={rows} columns={cols} />;
}

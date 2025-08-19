import * as React from "react";
import { useDAIA } from "../store/useDAIA";
import { Card, CardHeader, CardContent, Grid, Chip, Stack, Divider } from "@mui/material";
import KpiCard from "../components/KpiCard";

export default function Portfolio() {
    const s = useDAIA();
    const kpiR = s.kpiRiskSLA();

    const byProgram = new Map<string, number>();
    for (const a of s.actions) {
        const k = a.program || "N/A";
        byProgram.set(k, (byProgram.get(k) || 0) + 1);
    }
    const topPrograms = [...byProgram.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}><KpiCard label="Overdue Actions" value={kpiR.overdueActions} /></Grid>
            <Grid item xs={12} md={3}><KpiCard label="Avg Cycle (days)" value={kpiR.avgCycleDays ?? "—"} /></Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardHeader title="Actions by Program (Top 8)" />
                    <CardContent>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {topPrograms.map(([p,c]) => <Chip key={p} label={`${p}: ${c}`} />)}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Recent Events" />
                    <Divider />
                    <CardContent>
                        {s.events.slice(-30).reverse().map(e => (
                            <div key={e.eventId} style={{ display:"grid", gridTemplateColumns:"160px 240px 1fr", gap:8 }}>
                                <div>{e.when}</div><div>{e.kind}</div><div>{e.note ?? ""}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

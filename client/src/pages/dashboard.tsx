import * as React from "react";
import { Grid, Card, CardHeader, CardContent, Divider } from "@mui/material";
import KpiCard from "../components/KpiCard";
import { useDAIA } from "../store/useDAIA";
import { PieChart, BarChart, LineChart } from "@mui/x-charts";
import dayjs from "dayjs";

export default function Dashboard() {
    const kpiP = useDAIA(s => s.kpiPortfolio());
    const kpiV = useDAIA(s => s.kpiValidation());
    const kpiR = useDAIA(s => s.kpiRiskSLA());
    const ownerLoad = useDAIA(s => s.kpiOwnerLoad());
    const latest = useDAIA(s => s.latestByModel);
    const events = useDAIA(s => s.events);

    const pieData = [
        { id: 0, value: kpiP.openActions, label: "Open Actions" },
        { id: 1, value: kpiV.gatesPending, label: "Pending Gates" },
        { id: 2, value: kpiV.mpvalInProgress, label: "In MPVAL" },
    ];

    const ownersTop = ownerLoad.slice(0, 8);
    const barX = ownersTop.map(o => o.owner);
    const barY = ownersTop.map(o => o.open);

    const days = [...Array(10)].map((_,i)=> dayjs().subtract(9-i,"day").format("YYYY-MM-DD"));
    const byDay = (d: string) => events.filter(e => e.when?.startsWith(d)).length;

    return (
        <Grid container spacing={2}>
            {/* KPIs */}
            <Grid item xs={12} md={3}><KpiCard label="Tracked Models" value={kpiP.trackedModels} helper={`${kpiP.programs} programs`} /></Grid>
            <Grid item xs={12} md={3}><KpiCard label="Open Actions" value={kpiP.openActions} helper={`${kpiP.owners} owners`} /></Grid>
            <Grid item xs={12} md={3}><KpiCard label="Gate Pass Rate" value={`${kpiV.passRate}%`} helper={`${kpiV.gatesDecided} decided`} /></Grid>
            <Grid item xs={12} md={3}><KpiCard label="High Priority Open" value={kpiR.highPriorityOpen} helper={`${kpiR.overdueActions} overdue`} /></Grid>

            {/* Mix & Validation */}
            <Grid item xs={12} md={4}>
                <Card><CardHeader title="Portfolio Mix" /><CardContent><PieChart series={[{ data: pieData }]} height={220} /></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card><CardHeader title="Owner Workload (Top 8)" /><CardContent>
                    <BarChart xAxis={[{ scaleType:"band", data: barX }]} series={[{ data: barY }]} height={220} />
                </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card><CardHeader title="Events (Last 10 Days)" /><CardContent>
                    <LineChart xAxis={[{ scaleType:"point", data: days }]} series={[{ data: days.map(byDay) }]} height={220} />
                </CardContent></Card>
            </Grid>

            {/* Validation status table (quick view) */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Validation Snapshot (Latest by Model)" />
                    <Divider />
                    <CardContent>
                        <div style={{ display:"grid", gridTemplateColumns:"200px 120px 120px 1fr", gap:8 }}>
                            <div style={{ fontWeight:600 }}>Model</div><div style={{ fontWeight:600 }}>Subject</div><div style={{ fontWeight:600 }}>Status</div><div style={{ fontWeight:600 }}>Note</div>
                            {latest.slice(0,50).map((r, i) => (
                                <React.Fragment key={r.modelId + i}>
                                    <div>{r.modelId}</div><div>{r.subject}</div><div>{r.status}</div><div>{r.milestone}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

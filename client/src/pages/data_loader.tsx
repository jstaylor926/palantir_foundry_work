import * as React from "react";
import { Card, CardContent, CardHeader, Grid, Stack, Button, TextField, Typography, Alert } from "@mui/material";
import { UploadCsv } from "../components/UploadCsv";
import { useDAIA } from "../store/useDAIA";
import { toFactActions, toLatest, toLinks, toEvents, toDimModels, toDimActors } from "../lib/loaders";

export default function DataLoader() {
    const store = useDAIA();

    const onActions = (rows: any[]) => store.upsertActions(toFactActions(rows, "Uploaded"));
    const onLatest = (rows: any[]) => store.upsertLatest(toLatest(rows));
    const onLinks  = (rows: any[]) => store.upsertLinks(toLinks(rows));
    const onEvents = (rows: any[]) => store.upsertEvents(toEvents(rows));
    const onModels = (rows: any[]) => store.upsertModels(toDimModels(rows));
    const onActors = (rows: any[]) => store.upsertActors(toDimActors(rows));

    const [snap, setSnap] = React.useState("");
    const [msg, setMsg] = React.useState<string | null>(null);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <Card>
                    <CardHeader title="Load Data" subheader="Upload CSV/JSON to populate the local dashboard" />
                    <CardContent>
                        <Stack spacing={2}>
                            <UploadCsv label="fact_actions.csv" onRows={onActions} />
                            <UploadCsv label="latest_status_by_model.csv" onRows={onLatest} />
                            <UploadCsv label="link_action_model.csv" onRows={onLinks} />
                            <UploadCsv label="fact_model_events.csv" onRows={onEvents} />
                            <UploadCsv label="dim_models.csv (optional)" onRows={onModels} />
                            <UploadCsv label="dim_actors.csv (optional)" onRows={onActors} />
                            <Alert severity="info">
                                Tip: You can upload the same file multiple times; rows will be upserted (idempotent).
                            </Alert>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Snapshots" subheader="Persist/Share a local state snapshot" />
                    <CardContent>
                        <Stack spacing={2}>
                            <Button onClick={() => setSnap(store.exportSnapshot())}>Export Snapshot</Button>
                            <TextField
                                label="Paste Snapshot JSON"
                                value={snap}
                                onChange={e => setSnap(e.target.value)}
                                minRows={6}
                                multiline
                            />
                            <Stack direction="row" spacing={1}>
                                <Button onClick={() => { try { store.importSnapshot(snap); setMsg("Snapshot imported."); } catch(e){ setMsg("Invalid JSON."); } }}>
                                    Import
                                </Button>
                                <Button onClick={() => setSnap("")}>Clear</Button>
                            </Stack>
                            {msg && <Typography variant="body2">{msg}</Typography>}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

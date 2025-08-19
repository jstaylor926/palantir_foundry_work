import * as React from "react";
import Papa from "papaparse";
import { Button, Stack, Typography } from "@mui/material";

export function UploadCsv({ label, onRows }: { label: string; onRows: (rows: any[]) => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    function handle(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]; if (!file) return;
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (res) => onRows(res.data as any[]),
        });
    }
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">{label}</Typography>
            <input ref={inputRef} type="file" accept=".csv" hidden onChange={handle} />
            <Button size="small" onClick={() => inputRef.current?.click()}>Upload CSV</Button>
        </Stack>
    );
}

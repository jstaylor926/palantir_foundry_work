import { Card, CardContent, Typography } from "@mui/material";

export default function KpiCard({ label, value, helper }:{ label:string; value:string|number; helper?:string }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="overline" color="text.secondary">{label}</Typography>
                <Typography variant="h5">{value}</Typography>
                {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
            </CardContent>
        </Card>
    );
}

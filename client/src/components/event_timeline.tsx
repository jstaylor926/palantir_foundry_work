import * as React from "react";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, timelineItemClasses
} from "@mui/lab";

export type EventRow = { eventId: string; when: string; kind: string; note?: string | null };

export default function EventTimeline({ events }: { events: EventRow[] }) {
    const sorted = [...events].sort((a, b) => (a.when > b.when ? -1 : 1)); // newest first
    return (
        <Card>
            <CardHeader title="Event Timeline" />
            <CardContent>
                <Timeline sx={{ [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}>
                    {sorted.map((e, i) => (
                        <TimelineItem key={e.eventId}>
                            <TimelineSeparator>
                                <TimelineDot color={
                                    /Passed/i.test(e.kind) ? "success" :
                                        /KO|Issue/i.test(e.kind) ? "error" :
                                            /MPVAL/i.test(e.kind) ? "secondary" : "primary"
                                } />
                                {i < sorted.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent>
                                <Typography fontWeight={600}>{e.kind}</Typography>
                                <Typography variant="body2" color="text.secondary">{e.when}</Typography>
                                {e.note ? <Typography variant="body2">{e.note}</Typography> : null}
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    );
}

import { FactAction } from "./datasets";
import { norm, splitOwner } from "./normalizers";

// Minimal sample — add more rows from your file as needed.
const raw: Array<any> = [
    {
        id: 87, Subject: "Model Update", Owner: "GE - D. Fernandez", Program: "A320",
        "ATA Chapter": "ATA 21", Milestone: "QG1",
        Actions: "Review troubleshooting matrix table for ATA21...",
        Answers: null, Status: "Not started", "Start date": "Mar 17, 2025",
        "Due on": "May 2, 2025", Priority: "HIGH"
    },
    {
        id: 88, Subject: "Model Update", Owner: "GE - D. Fernandez", Program: "A320",
        "ATA Chapter": "ATA 21", Milestone: "QG1",
        Actions: "Deliver the updated A320/ATA21 model...",
        Answers: null, Status: "In progress", "Start date": "Mar 17, 2025",
        "Due on": "May 30, 2025", Priority: "HIGH"
    },
    {
        id: 93, Subject: "Development", Owner: "GE - P. Bennetts", Program: "A350",
        "ATA Chapter": "ATA 29", Milestone: "QG0",
        Actions: "Identify a QG0 date for ATA29", Answers: null,
        Status: "Not started", "Start date": "Mar 27, 2025", "Due on": "Apr 24, 2025", Priority: "MEDIUM"
    }
];

export const seedActionsGE: FactAction[] = raw.map(r => {
    const { org, ownerName } = splitOwner(r.Owner);
    return {
        actionId: String(r.id),
        subject: norm.subject(r.Subject),
        owner: r.Owner,
        org,
        ownerName,
        program: norm.program(r.Program),
        ataChapter: norm.ata(r["ATA Chapter"]),
        milestone: norm.milestone(r.Milestone),
        text: r.Actions,
        answers: r.Answers ?? null,
        status: norm.status(r.Status),
        startDate: norm.date(r["Start date"]),
        dueOn: norm.date(r["Due on"]),
        priority: norm.priority(r.Priority),
        source: "GE",
    };
});

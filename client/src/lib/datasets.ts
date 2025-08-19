// Dataset row shapes based on your cleaned outputs (see README) and ontology.
// dim_actors.csv, dim_models.csv, fact_actions.csv, fact_latest_by_model.csv,
// fact_model_events.csv, link_action_model.csv  :contentReference[oaicite:5]{index=5}

export type IsoDate = string;      // "2025-04-24"
export type IsoTimestamp = string; // "2025-04-24T10:30:00Z"

// === Dimension tables ===
export interface DimActor {
    actorId: string;            // stable id
    displayName: string;        // "D. Fernandez"
    org: string;                // "GE", "DAIA", "DTO"...
    email?: string | null;
    role?: string | null;
}

export interface DimModel {
    modelId: string;            // canonical key (e.g., "A320:ATA21:FFDP")
    program: string;            // "A320", "A330 GE"...
    ata: string;                // "ATA 21", "ATA 72 - HPC"...
    variant?: string | null;    // CEO/NEO, PW/GE/RR, etc.
    title?: string | null;      // human label
}

// === Facts / Links ===
export interface FactAction {
    actionId: string;
    subject: string;            // enums.subjects
    owner: string;              // "GE - D. Fernandez"
    org?: string | null;        // parsed org "GE"
    ownerName?: string | null;  // parsed "D. Fernandez"
    program: string;            // enums.programs (normalized)
    ataChapter: string;         // enums.ataChapters
    milestone?: string | null;  // enums.milestones
    text: string;               // action/description
    status: string;             // enums.statuses
    startDate?: IsoDate | null;
    dueOn?: IsoDate | null;
    priority?: string | null;   // enums.priorities
    answers?: string | null;
    source?: string | null;     // GE/DTO/ModelTracker
}

export interface FactModelEvent {
    eventId: string;
    modelId: string;
    when: IsoTimestamp;
    kind: string;               // e.g., "QG1 Scheduled", "MPVAL Pushed"
    note?: string | null;
}

export interface LatestStatusByModel {
    modelId: string;
    subject: string;            // {MPVAL,QG0,QG1,QG1L}
    milestone: string;          // {MPVAL,QG0,QG1,QG1L}
    status: string;             // {In Mpval, Issue, KO, MPVAL Pushed, Passed, Scheduled}
    priority?: string | null;
}
// Canonicals for latest_status_by_model derived from your enum blob. :contentReference[oaicite:6]{index=6}

export interface LinkActionModel {
    actionId: string;
    modelId: string;
}

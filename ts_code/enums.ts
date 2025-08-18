// =============================
// ORGS / PARTNERS
// =============================
export type PartnerOrg = "DAIA" | "DAI" | "AIB" | "DAL" | "GE" | "DTO";

// If you want a display label map (optional)
export const PARTNER_LABEL: Record<PartnerOrg, string> = {
    DAIA: "DAIA",
    DAI: "DAI",
    AIB: "Airbus (AIB)",
    DAL: "Delta (DAL)",
    GE: "GE",
    DTO: "DTO",
};

// =============================
// ENV TARGETS (matches SQLModel.env_target)
// =============================
export type EnvTarget = "DEV" | "MPVAL" | "PROD";

// =============================
// CASE PHASE (matches SQLModel.phase)
// =============================
export type CasePhase = "Prep" | "Validation" | "Deployment" | "Post-Deployment";

// =============================
// CASE STATUS (matches SQLModel.status)
// =============================
export type CaseStatus = "NotStarted" | "InProgress" | "Blocked" | "Complete";

// =============================
// TASK STATUS (IntegrationTask.status)
// =============================
export type TaskStatus = "Open" | "Blocked" | "Done";

// =============================
// GATE STATUS (ApprovalGate.status)
// =============================
export type GateStatus = "Pending" | "Passed" | "Failed";

// =============================
// RISK SEVERITY / STATUS (RiskIssue)
// =============================
export type RiskSeverity = "Low" | "Medium" | "High" | "Critical";
export type RiskStatus = "Open" | "Mitigated" | "Closed";

// =============================
// ARTIFACT TYPES (Artifact.artifact_type)
// =============================
export type ArtifactType = "model" | "report" | "config";

// =============================
// MPVAL DEPLOYMENT STATUS (MPVALDeployment.status)
// =============================
export type DeploymentStatus = "Pending" | "InProgress" | "Success" | "Failure";

// =============================
// AIRLINE / CUSTOMER CODES (seen in Subject list)
// Keep separate to avoid overloading Subject.
// =============================
export type AirlineCode =
    | "ALL"
    | "AZU"
    | "DAL"
    | "EZY"
    | "GAP"
    | "JST"
    | "PAL"
    | "QFA"
    | "SAS"
    | "SKU"
    | "VIV"
    | "VOI";

// =============================
// (Already provided by you, listed here for completeness)
//
// export type Subject = …
// export type Program = …
// export type ATAChapter = …
// export type Milestone = …
// export type Status = …    // tracker-level status ("Not Started" | "In Progress" | …)
// export type Priority = …  // "HIGH" | "MEDIUM" | "LOW"
// =============================

// =============================
// CANONICAL LISTS (handy for dropdowns / validation)
// =============================
export const ENV_TARGETS: EnvTarget[] = ["DEV", "MPVAL", "PROD"];
export const CASE_PHASES: CasePhase[] = ["Prep", "Validation", "Deployment", "Post-Deployment"];
export const CASE_STATUSES: CaseStatus[] = ["NotStarted", "InProgress", "Blocked", "Complete"];
export const TASK_STATUSES: TaskStatus[] = ["Open", "Blocked", "Done"];
export const GATE_STATUSES: GateStatus[] = ["Pending", "Passed", "Failed"];
export const RISK_SEVERITIES: RiskSeverity[] = ["Low", "Medium", "High", "Critical"];
export const RISK_STATUSES: RiskStatus[] = ["Open", "Mitigated", "Closed"];
export const ARTIFACT_TYPES: ArtifactType[] = ["model", "report", "config"];
export const DEPLOYMENT_STATUSES: DeploymentStatus[] = ["Pending", "InProgress", "Success", "Failure"];
export const AIRLINE_CODES: AirlineCode[] = ["ALL","AZU","DAL","EZY","GAP","JST","PAL","QFA","SAS","SKU","VIV","VOI"];

// =============================
// NORMALIZERS (defensive cleaning for ingest)
// Keep small, explicit, and idempotent.
// =============================
export function normalizeProgram(s: string): Program | "N/A" {
    const v = s.trim().toUpperCase().replace(/\s+/g, " ");
    switch (v) {
        case "A330 GE":
        case "A330GE": return "A330GE";
        case "A330 RR":
        case "A330RR": return "A330RR";
        default:
            return ([
                "A320","A330","A350","A220","A330PW CEO","A330GE","A330RR","NON AIRBUS","ALL","N/A",
            ] as Program[] | "N/A"[]).includes(v as any) ? (v as Program) : "N/A";
    }
}

export function normalizeCaseStatus(s: string): CaseStatus {
    const v = s.replace(/\s+/g, "").toLowerCase();
    if (v === "notstarted") return "NotStarted";
    if (v === "inprogress") return "InProgress";
    if (v === "blocked") return "Blocked";
    if (v === "complete" || v === "completed") return "Complete";
    return "NotStarted";
}

export function normalizeTrackerStatus(s: string): Status {
    const map: Record<string, Status> = {
        "not started": "Not Started",
        "not_started": "Not Started",
        "in progress": "In Progress",
        "pending reply": "Pending Reply",
        "done": "Done",
        "skipped": "Skipped",
    };
    const k = s.trim().toLowerCase().replace(/[_]/g, " ");
    return map[k] ?? "Not Started";
}

export function normalizeEnvTarget(s: string): EnvTarget {
    const v = s.trim().toUpperCase();
    return (v === "DEV" || v === "MPVAL" || v === "PROD") ? (v as EnvTarget) : "DEV";
}

export function normalizeGateStatus(s: string): GateStatus {
    const v = s.trim().toLowerCase();
    if (v === "passed") return "Passed";
    if (v === "failed") return "Failed";
    return "Pending";
}
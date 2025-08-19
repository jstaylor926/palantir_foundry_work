// Ontology-aligned app types (subset used in UI)
// Mirrors your data_structures.json (IntegrationCase, Gate, Task, Artifact, Risk ...) :contentReference[oaicite:7]{index=7}
export type EnvTarget = "DEV" | "MPVAL" | "PROD";
export type CasePhase = "Prep" | "Validation" | "Deployment" | "Post-Deployment";
export type CaseStatus = "NotStarted" | "InProgress" | "Blocked" | "Complete";
export type RiskLevel = "Low" | "Medium" | "High";

export interface IntegrationCase {
    caseId: string;
    name: string;
    envTarget: EnvTarget;
    phase: CasePhase;
    status: CaseStatus;
    riskLevel: RiskLevel;
    plannedStart?: string; plannedEnd?: string;
    actualStart?: string; actualEnd?: string;
    lastUpdated: string;
    program?: string; ataChapter?: string; partnerId?: string;
}

export type TaskStatus = "ToDo" | "InProgress" | "Blocked" | "Done";
export interface IntegrationTask {
    taskId: string; caseId: string; title: string;
    status: TaskStatus; dueDate?: string; owner?: string;
}

export type GateDecision = "Pending" | "Passed" | "Failed" | "Skipped";
export interface IntegrationGate {
    gateId: string; caseId: string; name: string;
    decision: GateDecision; decisionDate?: string; approver?: string; note?: string;
}

export interface Artifact {
    artifactId: string; caseId: string; taskId?: string; gateId?: string;
    type: "ValidationReport" | "LogFile" | "Script" | "doc" | "weights" | "log";
    path: string; createdOn: string; note?: string;
}

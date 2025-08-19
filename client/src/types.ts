const OWNER_ORGANIZATION = ["DAIA", "DAI", "AIB", "DAL", "DTO", "GE"];
const OWNER_BY_ORGAZIATION = {
    DAIA: ["Frank Obusek", "Joshua Taylor", "Juan Leon", "Rodger Stallworth", "Rong Huang"],
    DAI: ["A. Lacombe", "J-A. Honyigloh", "Julian Klein", "S. Benabid", "C. Fréry"],
    AIB: ["Mathieu Mongermont", "Brian Gaze", "Pierre Seyte"],
    DAL: ["Stephen Hoare"],
    GE: ["D. Fernandez", "D. Mancera", "E. Casagrande", "P. Bennetts", "R. Natarajan"],
    DTO: ["Lu Qin", "Dustin Ames", "Graison Fuller"],
}
const SUBJECTS = [
    "Development",
    "Integration",
    "100-20-3",
    "Deployment",
    "Improvement",
    "Model Update",
    "Process Improvement",
    "Tool",
    "Customer",
    "ALL",
    "AZU",
    "DAL",
    "EZY",
    "GAP",
    "JST",
    "PAL",
    "QFA",
    "SAS",
    "SKU",
    "VIV",
    "VOI",
]

const PROGRAMS = [
    "A320",
    "A330",
    "A350",
    "A220",
    "A330PW CEO",
    "A330 GE",
    "A330 RR",
    "Non Airbus",
    "ALL",
    "N/A",
]

const ATA_CHAPTERS = [
    "ATA 21",
    "ATA 24",
    "ATA 27",
    "ATA 27 FCFS",
    "ATA 27 FCROLL",
    "ATA 29",
    "ATA 32",
    "ATA 36",
    "ATA 72 - HPC",
    "ATA 72 - HPT",
    "ATA 73 - BP",
    "ATA 73 - N1 Shortfall",
    "ATA 73 - TER",
    "ATA 73 - FFDP",
    "ATA 75 - HPTACC",
    "ATA 75 - Nacelle Temp High",
    "ATA 77 - Vib Mx",
    "ALL",
    "N/A",
]

const MILESTONES = [
    "QG0",
    "QG1",
    "QG2",
    "New Customer",
    "Tool",
    "Customer",
    "ALL",
    "N/A",
]

const STATUSES = [
    "Not Started",
    "In Progress",
    "Pending Reply",
    "Done",
    "Skipped",
]

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"]
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
    plannedStart?: string;
    plannedEnd?: string;
    actualStart?: string;
    actualEnd?: string;
    lastUpdated: string;
}

export type TaskStatus = "ToDo" | "InProgress" | "Blocked" | "Done";
export interface IntegrationTask {
    taskId: string;
    caseId: string;
    title: string;
    status: TaskStatus;
    dueDate?: string;
    owner?: string;
}

export type GateDecision = "Pending" | "Passed" | "Failed" | "Skipped";
export interface IntegrationGate {
    gateId: string;
    caseId: string;
    name: string;             // e.g., ValidationRequested, QG1, QG2
    decision: GateDecision;
    decisionDate?: string;
    approver?: string;
    note?: string;
}

export interface Artifact {
    artifactId: string;
    caseId: string;
    taskId?: string;
    gateId?: string;
    type: "ValidationReport" | "LogFile" | "Script" | "doc" | "weights" | "log";
    path: string;
    createdOn: string;
    note?: string;
}


export { OWNER_ORGANIZATION, OWNER_BY_ORGAZIATION, PRIORITIES, SUBJECTS, PROGRAMS, ATA_CHAPTERS, MILESTONES, STATUSES };

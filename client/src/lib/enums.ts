// Minimal surface imported by state; you can paste the full enums.ts you already have.
export const SUBJECTS = [
    "Development","Integration","100-20-3","Deployment","Improvement","Model Update",
    "Process Improvement","Tool","Customer","ALL","AZU","DAL","EZY","GAP","JST",
    "PAL","QFA","SAS","SKU","VIV","VOI",
] as const;

export const PROGRAMS = [
    "A320","A330","A350","A220","A330PW CEO","A330 GE","A330 RR","Non Airbus","ALL","N/A",
] as const;

export const PROGRAM_ALIASES: Record<string,(typeof PROGRAMS)[number]> = {
    A330GE: "A330 GE", A330RR: "A330 RR",
};

export function normalizeProgram(v: string) {
    const key = v?.trim();
    return PROGRAM_ALIASES[key] ?? (PROGRAMS.includes(key as any) ? (key as any) : key);
}

export const ATA_CHAPTERS = [
    "ATA 21","ATA 24","ATA 27","ATA 27 FCFS","ATA 27 FCROLL","ATA 29","ATA 32","ATA 36",
    "ATA 72 - HPC","ATA 72 - HPT","ATA 73 - BP","ATA 73 - N1 Shortfall","ATA 73 - TER","ATA 73 - FFDP",
    "ATA 75 - HPTACC","ATA 75 - Nacelle Temp High","ATA 77 - Vib Mx","ALL","N/A",
] as const;

export const MILESTONES = ["QG0","QG1","QG2","New Customer","Tool","Customer","ALL","N/A"] as const;
export const STATUSES = ["Not Started","In Progress","Pending Reply","Done","Skipped"] as const;
export const PRIORITIES = ["HIGH","MEDIUM","LOW"] as const;

// For latest_status_by_model (subject/milestone/status values)
export const LATEST_SUBJECTS = ["MPVAL","QG0","QG1","QG1L"] as const;
export const LATEST_STATUSES = ["In Mpval","Issue","KO","MPVAL Pushed","Passed","Scheduled"] as const;

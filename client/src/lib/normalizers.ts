import { normalizeProgram } from "./enums";

export function splitOwner(raw?: string) {
    if (!raw) return { org: null as string|null, ownerName: null as string|null };
    const [org, name] = raw.split(" - ").map(s => s.trim());
    return { org: org ?? null, ownerName: name ?? null };
}

export const norm = {
    program: (v: string) => normalizeProgram(v),
    ata: (v: string) => v?.trim(),
    subject: (v: string) => v?.trim(),
    milestone: (v: string|undefined|null) => v?.trim() ?? null,
    status: (v: string) => {
        const s = (v || "").trim();
        // Case-insensitive fixups (e.g., "In progress" → "In Progress")
        if (/^in\s*progress$/i.test(s)) return "In Progress";
        if (/^not\s*started$/i.test(s)) return "Not Started";
        if (/^pending\s*reply$/i.test(s)) return "Pending Reply";
        return s;
    },
    priority: (v?: string|null) => v?.toUpperCase() ?? null,
    date: (v?: string|null) => v ? v : null,
};

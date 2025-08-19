import Papa from "papaparse";
import { DimActor, DimModel, FactAction, LatestStatusByModel, LinkActionModel, FactModelEvent } from "./datasets";
import { norm, splitOwner } from "./normalizers";

// Utility: parse CSV text → typed rows (field mapping happens in callers)
export async function parseCsv<T = any>(csvText: string): Promise<T[]> {
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return data as T[];
}

// Map raw fact_actions.csv → FactAction[]
export function toFactActions(rows: any[], sourceLabel: string): FactAction[] {
    return rows.map((r: any) => {
        const { org, ownerName } = splitOwner(r.owner ?? r.Owner);
        return {
            actionId: String(r.actionId ?? r.id ?? r.item_num),
            subject: norm.subject(r.subject),
            owner: r.owner ?? r.Owner,
            org, ownerName,
            program: norm.program(r.program),
            ataChapter: norm.ata(r.ata_chapter ?? r.ata ?? r["ATA Chapter"]),
            milestone: norm.milestone(r.milestone ?? r.theme),
            text: r.actions ?? r.text ?? r.description ?? "",
            answers: r.answers ?? r.updates ?? r.status_updates ?? null,
            status: norm.status(r.status),
            startDate: norm.date(r.start_date),
            dueOn: norm.date(r.due_on),
            priority: norm.priority(r.priority),
            source: sourceLabel,
        };
    });
}

// Dim conversions (shape-preserving)
export function toDimActors(rows: any[]): DimActor[] {
    return rows.map(r => ({
        actorId: String(r.actorId ?? r.id ?? r.email ?? r.displayName),
        displayName: r.displayName ?? r.name,
        org: r.org,
        email: r.email ?? null,
        role: r.role ?? null,
    }));
}

export function toDimModels(rows: any[]): DimModel[] {
    return rows.map(r => ({
        modelId: String(r.modelId ?? r.id),
        program: norm.program(r.program),
        ata: norm.ata(r.ata ?? r.ata_chapter),
        variant: r.variant ?? null,
        title: r.title ?? null,
    }));
}

export function toLatest(rows: any[]): LatestStatusByModel[] {
    return rows.map(r => ({
        modelId: String(r.modelId ?? r.id ?? r.model_key),
        subject: r.subject,      // already canonical per latest enums blob
        milestone: r.milestone,
        status: r.status,
        priority: r.priority ?? null,
    }));
}

export function toLinks(rows: any[]): LinkActionModel[] {
    return rows.map(r => ({
        actionId: String(r.actionId ?? r.id_action ?? r.action_id),
        modelId: String(r.modelId ?? r.id_model ?? r.model_id),
    }));
}

export function toEvents(rows: any[]): FactModelEvent[] {
    return rows.map(r => ({
        eventId: String(r.eventId ?? r.id),
        modelId: String(r.modelId ?? r.model_id ?? r.modelKey),
        when: r.when ?? r.timestamp,
        kind: r.kind ?? r.event ?? r.type,
        note: r.note ?? null,
    }));
}

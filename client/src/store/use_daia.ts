import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";
import { produce } from "immer";
import dayjs from "dayjs";
import { ulid } from "ulid";
import {
    DimActor, DimModel, FactAction, FactModelEvent,
    LatestStatusByModel, LinkActionModel
} from "../lib/datasets";

// ---- Local action inputs ----
export type ReqValidationInput = { modelId: string; modelVersionId?: string; scheduled?: string /* ISO date */; note?: string };
export type ApproveMilestoneInput = { modelId: string; gate: "QG0"|"QG1"|"QG2"; decision: "Passed"|"KO"; note?: string };
export type FlagRiskInput = { actionId: string; severity: "HIGH"|"MEDIUM"|"LOW"; description: string };
export type UploadEvidenceInput = { actionId?: string; modelId?: string; uri: string; type?: string; note?: string };
export type CloseCaseInput = { modelId: string; note?: string };

// small helper
const nowISO = () => new Date().toISOString();
// Local mutations (backend-free)
// requestValidation(input: ReqValidationInput): void;
// approveMilestone(input: ApproveMilestoneInput): void;
// flagRisk(input: FlagRiskInput): void;
// uploadEvidence(input: UploadEvidenceInput): void;
// closeCase(input: CloseCaseInput): void;
//
// requestValidation({ modelId, modelVersionId, scheduled, note }) {
//     set(produce<DAIAState>(s => {
//         // Latest status → QG1: Scheduled (or In Mpval if you prefer)
//         const curr = s.latestByModel.find(x => x.modelId === modelId);
//         if (curr) { curr.subject = "QG1"; curr.milestone = "QG1"; curr.status = "Scheduled"; }
//         else s.latestByModel.push({ modelId, subject: "QG1", milestone: "QG1", status: "Scheduled", priority: "HIGH" });
//
//         // Event
//         const when = scheduled ? `${scheduled}T09:00:00Z` : nowISO();
//         s.events.push({
//             eventId: ulid(),
//             modelId, when,
//             kind: "Validation Requested",
//             note: [modelVersionId ? `mv=${modelVersionId}` : null, note ?? null].filter(Boolean).join(" • ") || null,
//         });
//     }), false, "requestValidation");
// },
//
// approveMilestone({ modelId, gate, decision, note }) {
//     set(produce<DAIAState>(s => {
//         // Latest → decision
//         const curr = s.latestByModel.find(x => x.modelId === modelId) ??
//             (() => { const x = { modelId, subject: gate, milestone: gate, status: "Scheduled", priority: "MEDIUM" } as LatestStatusByModel; s.latestByModel.push(x); return x; })();
//
//         curr.subject = gate; curr.milestone = gate;
//         curr.status = decision === "Passed" ? "Passed" : "KO";
//
//         s.events.push({
//             eventId: ulid(), modelId, when: nowISO(),
//             kind: `${gate} ${decision}`,
//             note: note ?? null,
//         });
//     }), false, "approveMilestone");
// },
//
// flagRisk({ actionId, severity, description }) {
//     set(produce<DAIAState>(s => {
//         const a = s.actions.find(x => x.actionId === actionId);
//         if (!a) return;
//         a.priority = severity;
//         a.answers = `[RISK ${severity}] ${description}` + (a.answers ? `\n${a.answers}` : "");
//         // Soft “Issue” signal in latest if we can find the linked model
//         const link = s.links.find(l => l.actionId === actionId);
//         if (link) {
//             const curr = s.latestByModel.find(x => x.modelId === link.modelId);
//             if (curr) curr.status = "Issue";
//             s.events.push({
//                 eventId: ulid(), modelId: link.modelId, when: nowISO(),
//                 kind: "Risk Flagged", note: `${severity}: ${description}`
//             });
//         }
//     }), false, "flagRisk");
// },
//
// uploadEvidence({ actionId, modelId, uri, type, note }) {
//     set(produce<DAIAState>(s => {
//         const mid = modelId ?? s.links.find(l => l.actionId === actionId!)?.modelId;
//         s.events.push({
//             eventId: ulid(), modelId: mid ?? "N/A", when: nowISO(),
//             kind: "Evidence Uploaded", note: [type, uri, note].filter(Boolean).join(" • ")
//         });
//         const a = actionId ? s.actions.find(x => x.actionId === actionId) : undefined;
//         if (a) a.answers = `Evidence: ${uri}` + (a.answers ? `\n${a.answers}` : "");
//     }), false, "uploadEvidence");
// },
//
// closeCase({ modelId, note }) {
//     set(produce<DAIAState>(s => {
//         // Mark all linked actions as Done
//         const ids = s.idx.actionsByModel[modelId] ?? [];
//         for (const id of ids) {
//             const a = s.actions.find(x => x.actionId === id);
//             if (a && !/done|skipped|completed/i.test(a.status)) a.status = "Done";
//         }
//         // Latest status convenience
//         const curr = s.latestByModel.find(x => x.modelId === modelId);
//         if (curr && curr.subject === "MPVAL") curr.status = "MPVAL Pushed";
//         // Event
//         s.events.push({ eventId: ulid(), modelId, when: nowISO(), kind: "Case Closed", note: note ?? null });
//     }), false, "closeCase");
// },

// --- Filters/UI ---
export type Filters = Partial<{
    program: string[]; ata: string[]; org: string[]; milestone: string[];
    status: string[]; owner: string[]; priority: string[];
    dateFrom: string; dateTo: string; // ISO date limits for KPIs & lists
}>;
type Selection = { modelId?: string; actionId?: string; caseId?: string; gateId?: string };

// --- State ---
export interface DAIAState {
    // Data (normalized)
    actors: DimActor[];
    models: DimModel[];
    actions: FactAction[];
    latestByModel: LatestStatusByModel[];
    links: LinkActionModel[];
    events: FactModelEvent[];

    // Derived indexes
    idx: {
        actionsByModel: Record<string, string[]>; // modelId → [actionId]
        actionsByOwner: Record<string, string[]>; // ownerName(lower) → [actionId]
    };

    // UI
    filters: Filters;
    selection: Selection;
    pinnedViews: string[]; // e.g., ['Portfolio','Validation']

    // Mutations
    hydrate(payload: Partial<Pick<DAIAState,
        "actors"|"models"|"actions"|"latestByModel"|"links"|"events">>): void;
    upsertActions(rows: FactAction[]): void;
    upsertModels(rows: DimModel[]): void;
    upsertActors(rows: DimActor[]): void;
    upsertLatest(rows: LatestStatusByModel[]): void;
    upsertLinks(rows: LinkActionModel[]): void;
    upsertEvents(rows: FactModelEvent[]): void;

    setFilters(f: Filters): void;
    clearFilters(): void;
    select(sel: Selection): void;

    // Snapshots
    exportSnapshot(): string;         // JSON string
    importSnapshot(json: string): void;

    // --- Derived business KPIs (selectors as functions on state) ---
    kpiPortfolio(): {
        totalModels: number; trackedModels: number; openActions: number;
        owners: number; partners: number; programs: number
    };
    kpiValidation(): {
        gatesPending: number; gatesDecided: number; passRate: number;
        mpvalInProgress: number; scheduledThisMonth: number;
    };
    kpiRiskSLA(): {
        highPriorityOpen: number; overdueActions: number; avgCycleDays?: number;
    };
    kpiOwnerLoad(): Array<{ owner: string; open: number; overdue: number }>;
}

const buildIndexes = (s: Pick<DAIAState,"links"|"actions">) => {
    const actionsByModel: Record<string,string[]> = {};
    for (const ln of s.links) {
        (actionsByModel[ln.modelId] ||= []).push(ln.actionId);
    }
    const actionsByOwner: Record<string,string[]> = {};
    for (const a of s.actions) {
        const key = (a.ownerName ?? a.owner ?? "").toLowerCase();
        if (!key) continue;
        (actionsByOwner[key] ||= []).push(a.actionId);
    }
    return { actionsByModel, actionsByOwner };
};

const initial: Omit<DAIAState,
    "hydrate"|"upsertActions"|"upsertModels"|"upsertActors"|"upsertLatest"|"upsertLinks"|"upsertEvents"|
    "setFilters"|"clearFilters"|"select"|"exportSnapshot"|"importSnapshot"|
    "kpiPortfolio"|"kpiValidation"|"kpiRiskSLA"|"kpiOwnerLoad"> = {
    actors: [], models: [], actions: [], latestByModel: [], links: [], events: [],
    idx: { actionsByModel: {}, actionsByOwner: {} },
    filters: { dateFrom: dayjs().startOf("month").format("YYYY-MM-DD") },
    selection: {}, pinnedViews: ["Portfolio","Validation"]
};

export const useDAIA = create<DAIAState>()(
    devtools(persist((set, get) => ({
        ...initial,

        hydrate(payload) {
            set(produce<DAIAState>(draft => {
                if (payload.actors) draft.actors = payload.actors;
                if (payload.models) draft.models = payload.models;
                if (payload.actions) draft.actions = payload.actions;
                if (payload.latestByModel) draft.latestByModel = payload.latestByModel;
                if (payload.links) draft.links = payload.links;
                if (payload.events) draft.events = payload.events;
                draft.idx = buildIndexes(draft);
            }), false, "hydrate"));
        },

        upsertActions(rows) {
            set(produce<DAIAState>(d => {
                const map = new Map(d.actions.map(a => [a.actionId, a]));
                for (const r of rows) map.set(r.actionId, { ...(map.get(r.actionId) ?? {}), ...r });
                d.actions = [...map.values()];
                d.idx = buildIndexes(d);
            }), false, "upsertActions");
        },
        upsertModels(rows) {
            set(produce<DAIAState>(d => {
                const map = new Map(d.models.map(m => [m.modelId, m]));
                for (const r of rows) map.set(r.modelId, { ...(map.get(r.modelId) ?? {}), ...r });
                d.models = [...map.values()];
            }), false, "upsertModels");
        },
        upsertActors(rows) {
            set(produce<DAIAState>(d => {
                const map = new Map(d.actors.map(a => [a.actorId, a]));
                for (const r of rows) map.set(r.actorId, { ...(map.get(r.actorId) ?? {}), ...r });
                d.actors = [...map.values()];
            }), false, "upsertActors");
        },
        upsertLatest(rows) {
            set(produce<DAIAState>(d => {
                const map = new Map(d.latestByModel.map(x => [x.modelId, x]));
                for (const r of rows) map.set(r.modelId, { ...(map.get(r.modelId) ?? {}), ...r });
                d.latestByModel = [...map.values()];
            }), false, "upsertLatest");
        },
        upsertLinks(rows) {
            set(produce<DAIAState>(d => {
                const key = (x: LinkActionModel) => `${x.actionId}::${x.modelId}`;
                const seen = new Set(d.links.map(key));
                for (const r of rows) {
                    const k = key(r);
                    if (!seen.has(k)) { d.links.push(r); seen.add(k); }
                }
                d.idx = buildIndexes(d);
            }), false, "upsertLinks");
        },
        upsertEvents(rows) {
            set(produce<DAIAState>(d => {
                const map = new Map(d.events.map(e => [e.eventId, e]));
                for (const r of rows) map.set(r.eventId, { ...(map.get(r.eventId) ?? {}), ...r });
                d.events = [...map.values()];
            }), false, "upsertEvents");
        },

        setFilters(f) { set({ filters: { ...get().filters, ...f } }, false, "setFilters"); },
        clearFilters() { set({ filters: {} }, false, "clearFilters"); },
        select(sel) { set({ selection: { ...get().selection, ...sel } }, false, "select"); },

        exportSnapshot() {
            const { actors, models, actions, latestByModel, links, events, filters } = get();
            return JSON.stringify({ meta: { id: ulid(), at: new Date().toISOString(), v: 1 },
                actors, models, actions, latestByModel, links, events, filters }, null, 2);
        },
        importSnapshot(json) {
            const obj = JSON.parse(json);
            get().hydrate(obj);
            if (obj.filters) set({ filters: obj.filters });
        },

        // --- KPIs ---
        kpiPortfolio() {
            const s = get(); const open = s.actions.filter(a => !/done|skipped|completed|canceled/i.test(a.status));
            const partnerSet = new Set(s.actions.map(a => a.org ?? a.source).filter(Boolean));
            const programSet = new Set(s.actions.map(a => a.program).filter(Boolean));
            return {
                totalModels: s.models.length,
                trackedModels: s.latestByModel.length,
                openActions: open.length,
                owners: Object.keys(s.idx.actionsByOwner).length,
                partners: partnerSet.size,
                programs: programSet.size
            };
        },
        kpiValidation() {
            const s = get();
            // heuristics via latestByModel.subject/milestone/status
            const decided = s.latestByModel.filter(x => /Passed|KO|Issue|MPVAL Pushed/i.test(x.status)).length;
            const pending = s.latestByModel.length - decided;
            const pass = s.latestByModel.filter(x => /Passed/i.test(x.status)).length;
            const passRate = s.latestByModel.length ? Math.round((pass / s.latestByModel.length) * 100) : 0;
            const mpvalInProgress = s.latestByModel.filter(x => /In Mpval|MPVAL Pushed/i.test(x.status)).length;
            const thisMonth = dayjs().startOf("month");
            const scheduledThisMonth = s.events.filter(e => dayjs(e.when).isAfter(thisMonth)).length;
            return { gatesPending: pending, gatesDecided: decided, passRate, mpvalInProgress, scheduledThisMonth };
        },
        kpiRiskSLA() {
            const s = get();
            const high = s.actions.filter(a => a.priority === "HIGH" && !/done|completed|skipped/i.test(a.status)).length;
            const today = dayjs();
            const overdue = s.actions.filter(a => a.dueOn && dayjs(a.dueOn).isBefore(today) && !/done|completed|skipped/i.test(a.status)).length;
            // naive cycle: start→due (can refine with events)
            const cycles: number[] = s.actions
                .filter(a => a.startDate && a.dueOn)
                .map(a => dayjs(a.dueOn!).diff(dayjs(a.startDate!), "day"))
                .filter(n => Number.isFinite(n));
            const avgCycleDays = cycles.length ? Math.round(cycles.reduce((p,c)=>p+c,0)/cycles.length) : undefined;
            return { highPriorityOpen: high, overdueActions: overdue, avgCycleDays };
        },
        kpiOwnerLoad() {
            const s = get();
            const byOwner = new Map<string, { open: number; overdue: number }>();
            const today = dayjs();
            for (const a of s.actions) {
                const owner = a.ownerName ?? a.owner ?? "Unassigned";
                const rec = byOwner.get(owner) ?? { open: 0, overdue: 0 };
                if (!/done|completed|skipped/i.test(a.status)) {
                    rec.open += 1;
                    if (a.dueOn && dayjs(a.dueOn).isBefore(today)) rec.overdue += 1;
                    byOwner.set(owner, rec);
                }
            }
            return [...byOwner.entries()].map(([owner, v]) => ({ owner, ...v }))
                .sort((a,b)=> b.open - a.open);
        },
    }), {
        name: "daia-ui-store",
        storage: createJSONStorage(() => localStorage),
        version: 1,
    })))
);

import { IntegrationGate } from "../lib/types";

function GateTimeline({ gates }: { gates: IntegrationGate[] }) {
    return (
        <div className="rounded-2xl border p-4">
            <div className="font-semibold mb-2">Gate Timeline</div>
            <div className="flex gap-3 overflow-x-auto">
                {gates.map(g => (
                    <div key={g.gateId} className="min-w-[220px] border rounded-xl p-3">
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-gray-500">{g.decision}{g.decisionDate ? ` • ${g.decisionDate}` : ""}</div>
                        {g.approver ? <div className="text-xs">By {g.approver}</div> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GateTimeline;


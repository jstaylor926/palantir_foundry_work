import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { daia } from "../lib/api";
import { IntegrationCase, IntegrationGate, IntegrationTask } from "../lib/types";
import Copilot from "../components/Copilot";
import GateTimeline from "../components/GateTimeline";
import ActionsDrawer from "../components/ActionsDrawer";

function CaseDetail() {
    const { caseId = "" } = useParams();
    const [data, setData] = useState<{case?: IntegrationCase; gates: IntegrationGate[]; tasks: IntegrationTask[]}>({ gates: [], tasks: [] });

    useEffect(() => {
        daia.getCase(caseId).then(setData);
    }, [caseId]);

    if (!data.case) return <div className="p-6">Loading…</div>;

    return (
        <div className="grid grid-cols-12 gap-4 p-4">
            <div className="col-span-8 space-y-4">
                <div className="rounded-2xl border p-4">
                    <div className="text-xl font-semibold">{data.case.name}</div>
                    <div className="text-sm text-gray-600">Env {data.case.envTarget} • Phase {data.case.phase} • Status {data.case.status}</div>
                </div>

                <GateTimeline gates={data.gates} />

                <div className="rounded-2xl border p-4">
                    <div className="font-semibold mb-2">Tasks</div>
                    <ul className="space-y-2">
                        {data.tasks.map(t => (
                            <li key={t.taskId} className="border rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{t.title}</div>
                                    <div className="text-xs text-gray-500">{t.status} {t.dueDate ? `• due ${t.dueDate}` : ""} {t.owner ? `• ${t.owner}` : ""}</div>
                                </div>
                                {/* inline action examples */}
                                <button className="text-sm border rounded-lg px-3 py-1">Mark Done</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="col-span-4 space-y-4">
                <ActionsDrawer caseId={caseId} />
                <div className="h-[420px]"><Copilot caseId={caseId} /></div>
            </div>
        </div>
    );
}

export default CaseDetail;
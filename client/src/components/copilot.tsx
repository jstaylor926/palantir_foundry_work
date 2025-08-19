import { useState } from "react";
import { daia, ChatMessage, ToolCall } from "../lib/api";

type Props = { caseId?: string; allowedTools?: Array<ToolCall["type"]> };

function Copilot({ caseId, allowedTools = ["requestValidation","approveMilestone","flagRisk","uploadEvidence","closeCase"] }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "Hi! Ask me about this case, or say `request validation mv-123`." }
    ]);
    const [input, setInput] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const userMsg: ChatMessage = { role: "user", content: input };
        const next = [...messages, userMsg];
        setMessages(next);
        setInput("");

        // naive intent parse (replace with server-side AIP tool routing)
        let tool: ToolCall | null = null;
        const lower = userMsg.content.toLowerCase();
        if (allowedTools.includes("requestValidation") && lower.startsWith("request validation")) {
            const mv = lower.split(" ").pop()!;
            tool = { type: "requestValidation", args: { caseId: caseId!, modelVersionId: mv } };
        } else if (allowedTools.includes("approveMilestone") && lower.startsWith("approve gate")) {
            const gateId = lower.split(" ").pop()!;
            tool = { type: "approveMilestone", args: { gateId, approver: "you@company.com" } };
        }
        // ... add more quick intents as needed

        if (tool) {
            const toolEcho: ChatMessage = { role: "tool", content: `Running ${tool.type}…` };
            setMessages(m => [...m, toolEcho]);
            const result = await daia.runAction(tool);
            setMessages(m => [...m, { role: "assistant", content: `✅ ${tool.type} done: ${JSON.stringify(result)}` }]);
            return;
        }

        // fall back to chat
        const { messages: ai } = await daia.chat(next);
        setMessages(ai);
    }

    return (
        <div className="rounded-2xl border p-4 h-full flex flex-col">
            <div className="font-semibold mb-2">Copilot</div>
            <div className="flex-1 overflow-auto space-y-2 pr-1">
                {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                        <div className={`inline-block px-3 py-2 rounded-xl ${m.role === "user" ? "bg-gray-200" : m.role === "tool" ? "bg-gray-100" : "bg-white border"}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
                <input className="flex-1 border rounded-xl px-3 py-2" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask or type a command…" />
                <button className="px-4 py-2 rounded-xl border">Send</button>
            </form>
        </div>
    );
}
//
// export default Copilot;
//
// // ...inside onSubmit
// // naive intent parse → local store
// const s = useDAIA.getState();
// const lower = userMsg.content.toLowerCase();
//
// let handled = false;
// if (lower.startsWith("request validation")) {
//     // e.g., "request validation M1 mv-123"
//     const parts = userMsg.content.split(/\s+/);
//     const modelId = parts[2];
//     const mv = parts[3];
//     s.requestValidation({ modelId, modelVersionId: mv });
//     handled = true;
// } else if (lower.startsWith("approve gate")) {
//     // "approve gate QG1 M1 pass" or "approve gate QG1 M1 ko"
//     const parts = userMsg.content.split(/\s+/);
//     const gate = parts[2] as any;
//     const modelId = parts[3];
//     const decision = /^pass/i.test(parts[4]) ? "Passed" : "KO";
//     s.approveMilestone({ modelId, gate, decision });
//     handled = true;
// } else if (lower.startsWith("flag risk")) {
//     // "flag risk A1001 high missing artifact"
//     const [, , actionId, sev, ...desc] = userMsg.content.split(/\s+/);
//     s.flagRisk({ actionId, severity: sev.toUpperCase() as any, description: desc.join(" ") });
//     handled = true;
// }
//
// if (handled) {
//     setMessages(m => [...m, { role: "tool", content: "✅ Action applied to local state." }]);
//     return;
// }

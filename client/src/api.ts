import axios from "axios";
import { env } from "./env";
import { IntegrationCase, IntegrationGate, IntegrationTask } from "./types";

export type ChatMessage = { role: "user" | "assistant" | "tool"; content: string };
export type ToolCall =
    | { type: "requestValidation"; args: { caseId: string; modelVersionId: string } }
    | { type: "approveMilestone"; args: { gateId: string; approver: string; note?: string } }
    | { type: "flagRisk"; args: { caseId: string; severity: "High" | "Medium" | "Low"; description: string } }
    | { type: "uploadEvidence"; args: { caseId: string; gateId?: string; taskId?: string; uri: string; type: string } }
    | { type: "closeCase"; args: { caseId: string; actualEnd: string } };

export class DAIAClient {
    async listCases(): Promise<IntegrationCase[]> {
        if (env.mode === "foundry") {
            // In-Foundry: use your SDK/wired endpoints (placeholder)
            return axios.get("/foundry/ontology/cases").then(r => r.data);
        }
        return axios.get(`${env.apiBase}/cases`).then(r => r.data);
    }

    async getCase(caseId: string): Promise<{
        case: IntegrationCase;
        gates: IntegrationGate[];
        tasks: IntegrationTask[];
    }> {
        if (env.mode === "foundry") {
            return axios.get(`/foundry/ontology/cases/${caseId}`).then(r => r.data);
        }
        return axios.get(`${env.apiBase}/cases/${caseId}`).then(r => r.data);
    }

    async runAction(tool: ToolCall): Promise<any> {
        if (env.mode === "foundry") {
            // Map to Action Types like daia-request-validation / approve / etc.
            return axios.post("/foundry/actions/execute", tool).then(r => r.data);
        }
        return axios.post(`${env.apiBase}/actions`, tool).then(r => r.data);
    }

    async chat(messages: ChatMessage[]): Promise<{ messages: ChatMessage[] }> {
        // Local: LLM via Ollama/OpenAI-compatible proxy; Foundry: AIP Copilot endpoint
        const url = env.mode === "foundry" ? "/foundry/aip/chat" : `${env.apiBase}/chat`;
        return axios.post(url, { messages }).then(r => r.data);
    }
}

export const daia = new DAIAClient();

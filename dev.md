# **DAIA Integration Platform — API & Implementation Guide**



> A practical, build-ready spec for your **hub-and-spoke** model-integration tracker, designed to run **locally (FastAPI + Postgres/pgvector)** and **in Foundry (Ontology + Action Types + AIP)**.

---

## **1) Context & Goals**



**Core:** Track an end-to-end _IntegrationCase_ with spokes for _Tasks, Gates, Artifacts, Risks,_ and the _ModelVersion_ delivered by a _Partner_.

**You get:** A clean resource model, REST API surface, action endpoints, payload schemas, IDs, filters, webhooks, and Foundry bindings — plus ready-to-paste server stubs and SDK types.

---

## **2) Domain Model (Resources & IDs)**



### **2.1 Resource Overview**

|**Resource**|**Key ID**|**Purpose (hub/spoke)**|
|---|---|---|
|**IntegrationCase**|caseId (string, ULID)|**Hub**: end-to-end effort for a model version|
|**Partner**|partnerId (string, slug)|Organization/team providing model|
|**ModelVersion**|modelVersionId (string, ULID)|Version undergoing integration|
|**IntegrationTask**|taskId (string, ULID)|Actionable step|
|**IntegrationGate**|gateId (string, ULID)|Quality gate / milestone with decision|
|**Artifact**|artifactId (string, ULID)|Evidence: file/report/log|
|**RiskIssue**|riskId (string, ULID)|Risk/issue/blocker|

**Supporting (dimensional) objects:** Person, OrgParty, ModelAsset, ATA, Tool, Environment.



> **ID format**: Prefer **ULID** (sortable, URL-safe). Slugs for known catalogs (e.g., partner slugs: daia, dto, ge).

---

### **2.2 JSON Schemas (canonical)**



Below are concise schemas (properties shown with typical types; add optional/required as needed).

```
// IntegrationCase
{
  "caseId": "01J...ULID",
  "name": "A330RR FFDP Integration",
  "envTarget": "DEV|MPVAL|PROD",
  "phase": "Prep|Validation|Deployment|Closed",
  "status": "NotStarted|InProgress|Blocked|Complete|Cancelled",
  "riskLevel": "Low|Medium|High",
  "plannedStart": "2025-07-01",
  "plannedEnd": "2025-09-15",
  "actualStart": "2025-07-05",
  "actualEnd": "2025-09-12",
  "partnerId": "dto",
  "program": "A330RR",
  "ataChapter": "73-00",
  "modelVersionId": "01J...ULID",
  "lastUpdated": "2025-08-12T16:30:00Z"
}
```

```
// Partner
{ "partnerId": "dto", "partnerName": "DTO", "orgType": "Internal|External" }
```

```
// ModelVersion
{
  "modelVersionId": "01J...ULID",
  "modelKey": "A330RR:73-00:FFDP",
  "version": "v1.2.3",
  "vendorPartner": "dto",
  "acFamily": "A330RR",
  "ataChapter": "73-00",
  "dataSource": ["spm", "moca"],
  "status": "Draft|Ready|InValidation|Approved|Rejected|Deprecated",
  "notes": "…"
}
```

```
// IntegrationTask
{
  "taskId": "01J...ULID",
  "caseId": "01J...ULID",
  "title": "Create datasource for A330 RR",
  "owner": "lu.qin@…",
  "status": "Open|InProgress|Blocked|Done|Skipped",
  "priority": "Low|Medium|High",
  "milestone": "QG0|QG1|QG2|QG3",
  "expectedHours": 8,
  "actualHours": 5.5,
  "startDate": "2024-07-23",
  "dueOn": "2024-09-13",
  "updates": ["Requested to Lu, reminder 7/30"]
}
```

```
// IntegrationGate
{
  "gateId": "01J...ULID",
  "caseId": "01J...ULID",
  "name": "QG1",
  "status": "Pending|InReview|Decided",
  "decision": "Passed|Failed|Waived|null",
  "decisionDate": "2025-08-10T13:00:00Z",
  "approver": "dustin@…",
  "note": "…"
}
```

```
// Artifact
{
  "artifactId": "01J...ULID",
  "caseId": "01J...ULID",
  "taskId": "01J...ULID|null",
  "gateId": "01J...ULID|null",
  "type": "doc|log|dataset|script|config|screenshot",
  "path": "ri.foundry.dataset.... or s3://... or file RID",
  "note": "SPM log bundle",
  "createdOn": "2025-08-10T15:55:00Z"
}
```

```
// RiskIssue
{
  "riskId": "01J...ULID",
  "caseId": "01J...ULID",
  "category": "Access|Data|Tooling|Schedule|Scope|Compliance|Other",
  "severity": "Low|Medium|High",
  "description": "MPVAL access limited to Boeing fleets",
  "owner": "service-now@…",
  "status": "Open|Mitigating|Closed",
  "openedOn": "2025-07-29T09:00:00Z",
  "closedOn": null
}
```

---

### **2.3 Link Types (hub-and-spoke)**



Use these consistently in both local DB FKs and Foundry Relations:

- daia-case-has-task: **IntegrationCase → IntegrationTask**

- daia-case-has-gate: **IntegrationCase → IntegrationGate**

- daia-risk-issue-daia-integration-case: **RiskIssue → IntegrationCase**

- daia-partner-delivers-model: **Partner → ModelVersion**

- daia-model-integrated-by-case: **ModelVersion → IntegrationCase**

- daia-artifact-daia-integration-task: **Artifact → IntegrationTask**

- daia-gate-has-artifact: **IntegrationGate → Artifact**

- daia-gate-supported-by-validation: **ValidationResult → IntegrationGate**

- daia-case-has-validation: **ValidationResult → IntegrationCase**

- daia-workpackage-has-case: **WorkPackage → IntegrationCase**




> Keep your local column names aligned with the relation direction for clarity (e.g., artifact.task_id, artifact.gate_id).

---

## **3) Actions (Business Verbs)**



Mirrored **HTTP endpoints** locally and **Action Types** in Foundry.

|**Action**|**Primary Target**|**Side Effects**|
|---|---|---|
|**[DAIA] Request Validation**|IntegrationGate (create ValidationRequested)|Create gate, set Pending, audit log|
|**[DAIA] Approve Milestone**|IntegrationGate|Set decision, decisionDate, approver, note, notify|
|**[DAIA] Flag Risk**|RiskIssue (create)|Create risk, link to case|
|**[DAIA] Upload Evidence**|Artifact (create)|Create artifact, link to task/gate|
|**[DAIA] Close Case**|IntegrationCase|Set status final, stamp actualEnd|
|**[DAIA] Request MPVAL Push**|MpvalPushRequest|Track request lifecycle|
|**[DAIA] Execute MPVAL Push**|MpvalPushRequest|Update status → `InProgress|

> You provided Typescript snippets — they map directly to these actions. Keep parameter names stable across REST and OSDK.

---

## **4) REST API Spec (Local FastAPI)**



### **4.1 Conventions**

- **Base URL**: /api/v1

- **Auth**: Authorization: Bearer <JWT>; roles: viewer, editor, approver, admin

- **Content**: application/json (upload evidence may use multipart for binaries)

- **Errors**: JSON { "error": { "code": "string", "message": "string", "details": {...} } }

- **Idempotency** (mutations): optional Idempotency-Key header

- **Pagination**: ?limit=50&cursor=<opaque>; response includes nextCursor




### **4.2 Endpoints**



#### **Cases**

- GET /cases — list with filters: status, phase, partnerId, program, ataChapter, q (search)

- POST /cases — create

- GET /cases/{caseId} — get

- PATCH /cases/{caseId} — update (status/phase/etc.)

- POST /cases/{caseId}:close — **[DAIA] Close Case** { "status":"Complete|Cancelled", "actualEnd":"YYYY-MM-DD" }




#### **Partners & Model Versions**

- GET /partners / POST /partners

- GET /partners/{partnerId}

- GET /partners/{partnerId}/models

- POST /model-versions / GET /model-versions/{modelVersionId}

- POST /model-versions/{modelVersionId}:attachToCase — link (daia-model-integrated-by-case)




#### **Tasks**

- GET /cases/{caseId}/tasks / POST /cases/{caseId}/tasks

- GET /tasks/{taskId} / PATCH /tasks/{taskId}




#### **Gates**

- GET /cases/{caseId}/gates / POST /cases/{caseId}/gates (create QG0/QG1… or ValidationRequested)

- GET /gates/{gateId} / PATCH /gates/{gateId}

- POST /gates/{gateId}:approve — **[DAIA] Approve Milestone** { "approver":"…", "decision":"Passed|Failed|Waived", "note":"…" }

- POST /gates/{gateId}:requestValidation — **[DAIA] Request Validation** { "modelVersionId":"…", "requestedBy":"…", "comments":"…" }




#### **Artifacts**

- GET /cases/{caseId}/artifacts

- POST /artifacts — **[DAIA] Upload Evidence**

  JSON: { "caseId":"…","taskId":"?","gateId":"?","type":"doc|log|dataset|script|config|screenshot","path":"rid://…|s3://…|/fs…","note":"…" }

  (or multipart with file → store & fill path)




#### **Risks**

- GET /cases/{caseId}/risks

- POST /risks — **[DAIA] Flag Risk** { "caseId":"…","description":"…","severity":"High|Medium|Low","owner":"…","status":"Open" }

- PATCH /risks/{riskId}




#### **MPVAL**

- POST /mpval/push-requests — **[DAIA] Request MPVAL Push**

  { "caseId":"…","modelVersionId":"…","requestedBy":"…","libraryZips":["rid://…"],"mocaVersion":"…","spmStaticConfigPath":"rid://…","notes":"…" }

- POST /mpval/push-requests/{id}:execute — **[DAIA] Execute MPVAL Push** { "status":"InProgress|Complete|Failed" }

- GET /mpval/push-requests/{id}


---

## **5) OpenAPI 3.1 (Starter)**



Paste into openapi.yaml and grow:

```
openapi: 3.1.0
info:
  title: DAIA Integration API
  version: 1.0.0
servers:
  - url: /api/v1
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    IntegrationCase:
      type: object
      required: [caseId, name, envTarget, status]
      properties:
        caseId: { type: string }
        name: { type: string }
        envTarget: { type: string, enum: [DEV, MPVAL, PROD] }
        phase: { type: string, enum: [Prep, Validation, Deployment, Closed] }
        status: { type: string, enum: [NotStarted, InProgress, Blocked, Complete, Cancelled] }
        riskLevel: { type: string, enum: [Low, Medium, High] }
        plannedStart: { type: string, format: date }
        plannedEnd: { type: string, format: date }
        actualStart: { type: string, format: date }
        actualEnd: { type: string, format: date }
        partnerId: { type: string }
        program: { type: string }
        ataChapter: { type: string }
        modelVersionId: { type: string }
        lastUpdated: { type: string, format: date-time }
security:
  - bearerAuth: []
paths:
  /cases:
    get:
      summary: List cases
      parameters:
        - in: query
          name: status
          schema: { type: string }
        - in: query
          name: partnerId
          schema: { type: string }
        - in: query
          name: q
          schema: { type: string }
      responses:
        "200":
          description: OK
    post:
      summary: Create case
      requestBody:
        required: true
        content:
          application/json: { schema: { $ref: '#/components/schemas/IntegrationCase' } }
      responses:
        "201": { description: Created }
  /cases/{caseId}:
    get: { summary: Get case, responses: { "200": { description: OK } } }
    patch: { summary: Update case, responses: { "200": { description: OK } } }
  /cases/{caseId}:close:
    post:
      summary: Close case
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status: { type: string, enum: [Complete, Cancelled] }
                actualEnd: { type: string, format: date }
      responses: { "200": { description: Closed } }
```

---

## **6) Local Implementation Notes (FastAPI + Postgres)**



### **6.1 Tables (minimal)**

```
CREATE TABLE partners (
  partner_id text PRIMARY KEY,
  partner_name text NOT NULL,
  org_type text NOT NULL
);

CREATE TABLE model_versions (
  model_version_id text PRIMARY KEY,
  model_key text NOT NULL,
  version text NOT NULL,
  vendor_partner text NOT NULL REFERENCES partners(partner_id),
  ac_family text NOT NULL,
  ata_chapter text NOT NULL,
  data_source text[] NOT NULL,
  status text NOT NULL,
  notes text
);

CREATE TABLE integration_cases (
  case_id text PRIMARY KEY,
  name text NOT NULL,
  env_target text NOT NULL,
  phase text NOT NULL,
  status text NOT NULL,
  risk_level text,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  partner_id text REFERENCES partners(partner_id),
  program text,
  ata_chapter text,
  model_version_id text REFERENCES model_versions(model_version_id),
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE integration_tasks (
  task_id text PRIMARY KEY,
  case_id text NOT NULL REFERENCES integration_cases(case_id) ON DELETE CASCADE,
  title text NOT NULL,
  owner text,
  status text NOT NULL,
  priority text,
  milestone text,
  expected_hours numeric,
  actual_hours numeric,
  start_date date,
  due_on date,
  updates text[]
);

CREATE TABLE integration_gates (
  gate_id text PRIMARY KEY,
  case_id text NOT NULL REFERENCES integration_cases(case_id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL,
  decision text,
  decision_date timestamptz,
  approver text,
  note text
);

CREATE TABLE artifacts (
  artifact_id text PRIMARY KEY,
  case_id text NOT NULL REFERENCES integration_cases(case_id) ON DELETE CASCADE,
  task_id text REFERENCES integration_tasks(task_id) ON DELETE SET NULL,
  gate_id text REFERENCES integration_gates(gate_id) ON DELETE SET NULL,
  type text NOT NULL,
  path text NOT NULL,
  note text,
  created_on timestamptz DEFAULT now()
);

CREATE TABLE risks (
  risk_id text PRIMARY KEY,
  case_id text NOT NULL REFERENCES integration_cases(case_id) ON DELETE CASCADE,
  category text,
  severity text,
  description text,
  owner text,
  status text,
  opened_on timestamptz,
  closed_on timestamptz
);
```

> Add pgvector columns later for semantic search over tasks.title, artifacts.note, etc.



### **6.2 FastAPI action handlers (snippets)**

```
# app/actions.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, date
from .deps import db, require_role

router = APIRouter(prefix="/api/v1")

class ApprovePayload(BaseModel):
    approver: str
    decision: str  # Passed|Failed|Waived
    note: str | None = None

@router.post("/gates/{gate_id}:approve")
def approve_milestone(gate_id: str, body: ApprovePayload, user=Depends(require_role("approver"))):
    with db() as cur:
        cur.execute("UPDATE integration_gates SET decision=%s, decision_date=%s, approver=%s, note=%s, status='Decided' WHERE gate_id=%s RETURNING gate_id",
                    (body.decision, datetime.utcnow(), body.approver, body.note, gate_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "gate not found")
    return {"ok": True, "gateId": gate_id}
```

(Replicate for :requestValidation, :close, risks, artifacts, mpval.)

---

## **7) Webhooks & Events**



Emit events for automations and UI live-updates.

- **Headers:** DAIA-Signature: sha256=…

- **Retry:** exponential backoff, up to 24h

- **Topics:**

    - case.updated

    - task.created|updated|deleted

    - gate.created|approved|failed

    - artifact.created

    - risk.created|updated|closed

    - mpval.requested|executed|failed





**Payload (example):**

```
{
  "id": "evt_01J...ULID",
  "type": "gate.approved",
  "occurredAt": "2025-08-10T13:00:00Z",
  "data": {
    "gateId": "01J...ULID",
    "caseId": "01J...ULID",
    "decision": "Passed",
    "approver": "dustin@…"
  }
}
```

---

## **8) Security, RBAC, and Audit**

- **JWT claims:** sub, roles: [viewer|editor|approver|admin], org

- **Row-level checks:** Editors can mutate only their org cases (if applicable).

- **Audit log table:** audit_logs(id, actor, action, resource_type, resource_id, payload_json, ts)

- **Idempotency:** Store idempotency_key per actor+route for 24h.


---

## **9) Filters, Search & KPI Queries**



### **9.1 Common Filters**

- GET /cases?q=<free text>&partnerId=dto&status=InProgress&ataChapter=73-00

- Date windows: ?from=2025-08-01&to=2025-08-31 (uses lastUpdated)




### **9.2 KPIs**

- **Cycle time:** actualEnd - actualStart

- **Gate pass rate:** #Passed / #Decided

- **Risk exposure:** count open risks by severity

- **SLA on validation:** decisionDate - gate.created




Create materialized views for dashboards.

---

## **10) Foundry Mapping (Ontology & Actions)**



Mirror the API semantics with OSDK / Action Types you listed.



**Action Type bindings (as provided):**

- daia-approve-milstone → Updates DaiaIntegrationGate.decision, decisionDate, approver, note

- daia-close-case → Updates DaiaIntegrationCase.status, actualEnd

- daia-execute-mpval-push → Update DaiaMpvalPushRequest.status

- daia-flag-risk → Create DaiaRiskIssue (link to case)

- daia-request-mpval-push → Create DaiaMpvalPushRequest

- daia-request-validation → Create DaiaValidationResult (and/or gate)

- daia-upload-evidence → Create DaiaArtifact




**Relations (RIDs you provided) → keep 1:1 with local FKs.**

For Workshop, expose the same verbs: buttons call either **REST** (local) or **runAction** (Foundry).

---

## **11) Naming, Status Enums & Governance**

- **Object IDs:** daia-<free-text> for types; instances use ULIDs.

- **Display names:** [DAIA] <Free Text>

- **Actions:** daia-<verb>-<object/action> (e.g., daia-approve-milestone)

- **Statuses (canonical):**

    - Case: NotStarted|InProgress|Blocked|Complete|Cancelled

    - Gate: Pending|InReview|Decided + decision (Passed|Failed|Waived)

    - Task: Open|InProgress|Blocked|Done|Skipped

    - Risk: Open|Mitigating|Closed

    - ModelVersion: Draft|Ready|InValidation|Approved|Rejected|Deprecated



---

## **12) SDKs (TypeScript & Python Stubs)**



### **12.1 TypeScript (frontend)**

```
// sdk/cases.ts
export type Case = {
  caseId: string; name: string; envTarget: 'DEV'|'MPVAL'|'PROD';
  phase: 'Prep'|'Validation'|'Deployment'|'Closed';
  status: 'NotStarted'|'InProgress'|'Blocked'|'Complete'|'Cancelled';
  riskLevel?: 'Low'|'Medium'|'High';
  plannedStart?: string; plannedEnd?: string;
  actualStart?: string; actualEnd?: string;
  partnerId?: string; program?: string; ataChapter?: string;
  modelVersionId?: string; lastUpdated?: string;
};

export async function listCases(q?: string): Promise<Case[]> {
  const r = await fetch(`/api/v1/cases?q=${encodeURIComponent(q||'')}`, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function closeCase(caseId: string, status: 'Complete'|'Cancelled', actualEnd: string) {
  const r = await fetch(`/api/v1/cases/${caseId}:close`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ status, actualEnd })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
```

### **12.2 Python (service tests)**

```
import requests, os
BASE = os.getenv("BASE","http://localhost:8000/api/v1")
def approve_gate(gate_id, approver, decision, note=None, token=None):
    r = requests.post(f"{BASE}/gates/{gate_id}:approve",
        json={"approver": approver, "decision": decision, "note": note},
        headers={"Authorization": f"Bearer {token}"} if token else {})
    r.raise_for_status()
    return r.json()
```

---

## **13) Data Ingestion Plan (Bronze → Silver → Gold)**

1. **Bronze:** Ingest raw partner trackers (CSV, Excel, Sheets) to datasets.

2. **Silver (normalize):** Map Status, Priority, Owner, ATA to canonical enums; parse dates; de-dupe.

3. **Gold:** Materialize object-backed tables feeding the API (e.g., integration_cases, integration_tasks).

4. **Schedulers:** Hourly updates for trackers; nightly risk detection; weekly summaries.


---

## **14) Observability**

- **Logs:** request/response (redact PII), action outcomes

- **Metrics:** requests by route, latency, 4xx/5xx, action success rate

- **Tracing:** propagate X-Request-Id

- **Dashboards:** Gate pass rate, open risks by severity, MPVAL queue


---

## **15) Example Flows (E2E)**



### **15.1 Validation Request → Approval**

1. UI calls POST /gates to create ValidationRequested for caseId.

2. System posts webhook gate.created.

3. Approver runs POST /gates/{gateId}:approve with "Passed".

4. Gate becomes Decided; webhook gate.approved; Case phase → Deployment (rule).




### **15.2 Flag Risk on Overdue Task**

1. Night job finds tasks status != Done and due_on < today() with priority=High.

2. Calls POST /risks (Flag Risk).

3. Notifies owner; links Risk → Case.


---

## **16) Error Codes**

|**Code**|**When**|
|---|---|
|not_found|Resource missing|
|invalid_state|e.g., approving a gate that’s not InReview|
|permission_denied|Lacking role|
|validation_error|Body/field invalid|
|conflict|Duplicate or idempotency re-use with different payload|
|rate_limited|Too many requests|
|upstream_failure|Tooling/MPVAL failures|

---

## **17) Quick Start Checklist**

- Create DB with tables above (add indices on case_id, status, decision_date)

- Seed partners, model_versions, a sample integration_case, and a gate

- Expose endpoints in FastAPI using the path design here

- Add JWT middleware + role checks

- Implement event emitter and one webhook consumer (for tests)

- Mirror actions in Foundry with your provided Action Types & Relations

- Build Workshop pages:

    - Cases Portfolio (filters + KPIs)

    - Case Detail (tabs: Tasks, Gates, Risks, Artifacts)

    - Action buttons: _Request Validation_, _Approve Milestone_, _Flag Risk_, _Upload Evidence_, _Close Case_



---

## **18) Appendix — Foundry Binding Cheatsheet**

- **Relations:** use the RIDs you listed; keep identical names as API link IDs.

- **Actions:** bind your TS v2 handlers exactly as shown; ensure handler param names match Action Type parameters.

- **Security:** Foundry visibility defaults to _Hidden_ until ready; publish to Exposed/daia for UX apps.

- **AIP:** Provide two tools to your Copilot:

    - queryOntology(question, filters): read-only queries for cases/tasks/gates

    - runAction(actionName, params): executes _exactly_ the API verbs



---

If you want, I can drop a **FastAPI project scaffold** with these routes wired up, plus a tiny in-memory webhook receiver and a seed script — just say the word and I’ll generate the files.
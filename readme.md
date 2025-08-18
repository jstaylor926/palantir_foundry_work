# DAIA Unified Tracker — Technical Spec & Schemas (v1)

> Cleaned from your notes. This doc normalizes **work packages**, **actions**, and **status updates** into a single data model you can use locally (FastAPI + Pydantic + Postgres) and in **Foundry** (Ontology objects + edges). It includes parsers for the provided CSV and Work Package lists.

---

## 1) Scope & Goals

* **Unify** the disparate trackers (DAIA/GE/DTO/etc.) into one canonical schema.
* **Model-centric** graph: `Model → Actions → StatusUpdates` with Program/Partner/Owner links.
* **Portable**: same shapes serve FastAPI + Postgres **and** Foundry Ontology.

---

## 2) Core Entities & Enumerations

### 2.1 Entities (conceptual)

* **Model**: a unique analytic (by aircraft family + ATA + name).
* **Action**: a normalized work item regardless of source (DAIA, GE, DTO…).
* **StatusUpdate**: time-stamped note for an Action.
* **Program**: A320/A330/A350…
* **Partner**: GE, DTO, Liebherr…
* **Person**: Owner/assignee (email-based identity).
* **ScheduleTask**: optional milestones/tasks (% complete).

### 2.2 Enumerations (normalized)

* `ProcessGate`: `QG0 | QG1 | QG2 | QG3 | QG4`
* `ActionStatus`: `Proposed | Planned | InProgress | WaitingResponse | Blocked | Completed | Skipped | Canceled`
* `Priority`: `Low | Medium | High | Critical`
* `Subject` (free but recommended set): `Development | Deployment | ProcessImprovement | ModelUpdate | Tool | Customer | Admin | Documentation | Training | Data | Governance`

---

## 3) Canonical JSON Schemas

> Use these shapes for API payloads, pg tables, and Foundry objects. Keys are snake\_case for DB; surface camelCase in the API if you prefer.

```json
// model.schema.json (Model)
{
  "$id": "daia/model",
  "type": "object",
  "required": ["model_key","ac_family","ata_chapter","model_name"],
  "properties": {
    "model_key": {"type":"string","description":"UPPER(ac_family):ATA:model-slug"},
    "ac_family": {"type":"string","enum":["A220","A300","A320","A330","A350"]},
    "ata_chapter": {"type":"string","pattern":"^[0-9]{2}(-[0-9]{2})?$"},
    "model_name": {"type":"string"},
    "partner_name": {"type":"string"},
    "airbus_owner_email": {"type":"string"},
    "status": {"type":"string"},
    "version": {"type":"string"},
    "process_gate": {"type":"string"},
    "description": {"type":"string"},
    "data_source": {"type":"string"},
    "due_date": {"type":"string","format":"date"},
    "priority": {"type":"string"}
  }
}
```

```json
// action.schema.json (Action)
{
  "$id": "daia/action",
  "type": "object",
  "required": ["action_id","title","status"],
  "properties": {
    "action_id": {"type":"string"},
    "title": {"type":"string"},
    "subject": {"type":"string"},
    "theme": {"type":"string"},
    "issue": {"type":"string"},
    "status": {"type":"string"},
    "priority": {"type":"string"},
    "start_date": {"type":"string","format":"date"},
    "due_on": {"type":"string","format":"date"},
    "completed": {"type":"boolean"},
    "program_code": {"type":"string"},
    "owner_email": {"type":"string"},
    "partner_name": {"type":"string"},
    "ac_family": {"type":"string"},
    "ata_chapter": {"type":"string"},
    "model_name": {"type":"string"},
    "source_system": {"type":"string"},
    "source_id": {"type":"string"}
  }
}
```

```json
// status_update.schema.json (StatusUpdate)
{
  "$id": "daia/status_update",
  "type": "object",
  "required": ["update_id","action_id","body"],
  "properties": {
    "update_id": {"type":"string"},
    "action_id": {"type":"string"},
    "created_at": {"type":"string","format":"date-time"},
    "author_email": {"type":"string"},
    "body": {"type":"string"}
  }
}
```

---

## 4) Work Package → Model Seeds (parsed from your list)

**Input (examples)**

```
A330 GE Development Schedule
ATA72: HPC (CF6-80E) - Cruise
ATA72: HPT (CF6-80E) - Cruise
ATA73: N1 Shortfall (CF6-80E) - Take-off
...
A220 Development Schedule
ATA28: Fuel Imbalance model 28-22-35
ATA34: Radio Altimeter Problem 34-44-01
```

**Parsed examples → `model_seed.jsonl`**

```json
{"model_key":"A330:72:hpc-cf6-80e-cruise","ac_family":"A330","ata_chapter":"72","model_name":"HPC (CF6-80E) - Cruise","partner_name":"GE"}
{"model_key":"A330:72:hpt-cf6-80e-cruise","ac_family":"A330","ata_chapter":"72","model_name":"HPT (CF6-80E) - Cruise","partner_name":"GE"}
{"model_key":"A330:73:n1-shortfall-cf6-80e-take-off","ac_family":"A330","ata_chapter":"73","model_name":"N1 Shortfall (CF6-80E) - Take-off","partner_name":"GE"}
{"model_key":"A330:72:hpc-cruise-pw-ceo","ac_family":"A330","ata_chapter":"72","model_name":"HPC (Cruise PW CEO)","partner_name":"PW CEO"}
{"model_key":"A220:28:fuel-imbalance-model-28-22-35","ac_family":"A220","ata_chapter":"28-22","model_name":"Fuel Imbalance model 28-22-35"}
{"model_key":"A350:79:79-21-oil-pressure","ac_family":"A350","ata_chapter":"79-21","model_name":"Oil Pressure"}
```

> Heuristic: `ata_chapter` takes the most specific code present (e.g., `28-22`), `partner_name` inferred from section headers (`A330 GE…`, `A330 PW CEO…`).

---

## 5) CSV → Action Normalization

**Input CSV (excerpt)**

```
Item #,Subject,Owner,Partner,Program,Theme,Model,Issue,Actions,Updates
1,QG0 - Pivot Table,DAIA - Francis Obusek,GE,A350,QG2,GE A350 ACMS pivot table creation,can we extract params key/values from A350 acms_parquet,2/20: Mathieu: find acms_metadata and sent param list to GE, ask them which params to use,
...
33,QG1 - MP VAL,DAIA - Francis Obusek,GE,A320,QG1,,Update: regarding GE A320 ATA 32, correcting the maintenance advice...,GE to update model and maintenance advice.,Changes have been made ...
```

**Mapping rules**

* `Subject` → `subject` (keep original; optionally map `QG*` to ProcessGate on Model if needed).
* `Owner` → `owner_email` (normalize to email later; keep raw now).
* `Partner` → `partner_name` (`GE/DTO/...`).
* `Program` → `program_code` (e.g., `A350`).
* `Theme` → `theme` (e.g., `QG2`).
* `Model` → attempt to parse into (`ac_family`, `ata_chapter`, `model_name`).
* `Actions` → `title`.
* `Updates` → explode to `StatusUpdate` rows (split by `;` or newlines).

**Resulting action row (example)**

```json
{
  "action_id": "md5(GE|1|GE A350 ACMS pivot table creation)",
  "title": "GE A350 ACMS pivot table creation",
  "subject": "QG0 - Pivot Table",
  "theme": "QG2",
  "issue": "can we extract params key/values from A350 acms_parquet",
  "status": "Planned",
  "priority": "Medium",
  "program_code": "A350",
  "owner_email": "daia-francis.obusek@example",
  "partner_name": "GE",
  "ac_family": "A350",
  "ata_chapter": null,
  "model_name": null,
  "source_system": "DAIA_ACTIONS",
  "source_id": "1"
}
```

---

## 6) Backend Models (Pydantic) & DB DDL

### 6.1 Pydantic (FastAPI)

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import date, datetime

ProcessGate = Literal['QG0','QG1','QG2','QG3','QG4']
ActionStatus = Literal['Proposed','Planned','InProgress','WaitingResponse','Blocked','Completed','Skipped','Canceled']
Priority = Literal['Low','Medium','High','Critical']

class Model(BaseModel):
    model_key: str
    ac_family: Literal['A220','A300','A320','A330','A350']
    ata_chapter: str
    model_name: str
    partner_name: Optional[str] = None
    airbus_owner_email: Optional[EmailStr] = None
    status: Optional[str] = None
    version: Optional[str] = None
    process_gate: Optional[ProcessGate] = None
    description: Optional[str] = None
    data_source: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[Priority] = None

class Action(BaseModel):
    action_id: str
    title: str
    subject: Optional[str] = None
    theme: Optional[str] = None
    issue: Optional[str] = None
    status: ActionStatus
    priority: Optional[Priority] = None
    start_date: Optional[date] = None
    due_on: Optional[date] = None
    completed: Optional[bool] = None
    program_code: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    partner_name: Optional[str] = None
    ac_family: Optional[str] = None
    ata_chapter: Optional[str] = None
    model_name: Optional[str] = None
    source_system: str
    source_id: str

class StatusUpdate(BaseModel):
    update_id: str
    action_id: str
    created_at: datetime
    author_email: Optional[EmailStr] = None
    body: str
```

### 6.2 Postgres Tables (DDL)

```sql
CREATE TABLE dim_model (
  model_key TEXT PRIMARY KEY,
  ac_family TEXT NOT NULL,
  ata_chapter TEXT NOT NULL,
  model_name TEXT NOT NULL,
  partner_name TEXT,
  airbus_owner_email TEXT,
  status TEXT,
  version TEXT,
  process_gate TEXT,
  description TEXT,
  data_source TEXT,
  due_date DATE,
  priority TEXT
);

CREATE TABLE fact_action (
  action_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT,
  theme TEXT,
  issue TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  start_date DATE,
  due_on DATE,
  completed BOOLEAN,
  program_code TEXT,
  owner_email TEXT,
  partner_name TEXT,
  ac_family TEXT,
  ata_chapter TEXT,
  model_name TEXT,
  source_system TEXT NOT NULL,
  source_id TEXT NOT NULL
);

CREATE TABLE fact_status_update (
  update_id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES fact_action(action_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  author_email TEXT,
  body TEXT NOT NULL
);
```

---

## 7) ETL Snippets

### 7.1 Parse Work Package lines → Models (Python)

```python
import re, hashlib

def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+","-", s.lower()).strip('-')

HEADER_PARTNER = None

def infer_partner(header: str) -> str | None:
    if 'GE' in header: return 'GE'
    if 'PW CEO' in header: return 'PW CEO'
    return None

MODEL_RE = re.compile(r"ATA(?P<ata>\d{2}(?:-\d{2})?):\s*(?P<name>.+)")

def parse_block(header: str, lines: list[str]):
    partner = infer_partner(header)
    # infer family from header prefix like 'A330 ...'
    family_match = re.match(r"(A\d{3})", header)
    ac_family = family_match.group(1) if family_match else None
    out = []
    for ln in lines:
        m = MODEL_RE.search(ln)
        if not m: continue
        ata = m.group('ata')
        name = m.group('name').strip()
        model_key = f"{ac_family}:{ata}:{slug(name)}".upper()
        out.append({
            'model_key': model_key,
            'ac_family': ac_family,
            'ata_chapter': ata,
            'model_name': name,
            'partner_name': partner
        })
    return out
```

### 7.2 Normalize CSV → Actions & Updates (Python/pandas)

```python
import pandas as pd, hashlib, re

STATUS_MAP = {
  'pending': 'WaitingResponse', 'pending reply': 'WaitingResponse',
  'backlog': 'Planned', 'in progress':'InProgress', 'blocked':'Blocked',
  'completed':'Completed','skipped':'Skipped','canceled':'Canceled'
}

def md5(*parts):
    return hashlib.md5('|'.join(p or '' for p in parts).encode()).hexdigest()

# df = pd.read_csv('actions.csv')

actions = []
updates = []
for _, r in df.iterrows():
    title = (r.get('Model') or r.get('Actions') or '').strip()
    source_id = str(r.get('Item #') or r.get('item') or '')
    source_system = 'DAIA_ACTIONS'
    action_id = md5(source_system, source_id, title)
    status_raw = (r.get('Status') or '').strip().lower()
    status = STATUS_MAP.get(status_raw, 'Planned')
    actions.append({
        'action_id': action_id,
        'title': title,
        'subject': r.get('Subject'),
        'theme': r.get('Theme'),
        'issue': r.get('Issue'),
        'status': status,
        'priority': 'Medium',
        'program_code': r.get('Program'),
        'owner_email': r.get('Owner'),
        'partner_name': r.get('Partner'),
        'source_system': source_system,
        'source_id': source_id
    })
    upd = (r.get('Updates') or '').replace('\r','').split('\n')
    for i, note in enumerate(filter(None, map(str.strip, upd))):
        updates.append({
            'update_id': md5(action_id, str(i), note),
            'action_id': action_id,
            'created_at': pd.Timestamp.utcnow().isoformat(),
            'author_email': r.get('Owner'),
            'body': note
        })

actions_df = pd.DataFrame(actions)
updates_df = pd.DataFrame(updates)
```

---

## 8) Foundry Ontology Mapping (concise)

* **Objects → Datasets**

    * `daia-model` ← `dim_model (model_key)` display: `model_name`
    * `daia-action` ← `fact_action (action_id)` display: `title`
    * `daia-status-update` ← `fact_status_update (update_id)` display: `body`
    * `daia-program` ← `dim_program (program_code)`
    * `daia-partner` ← `dim_partner (partner_name)`
    * `daia-person` ← `dim_person (person_email)`

* **Links**

    * `action→person` from `fact_action.owner_email`
    * `action→program` from `fact_action.program_code`
    * `action→partner` from `fact_action.partner_name`
    * `action→statusUpdate` from `fact_status_update`
    * `action→model` via `action_model_map` (family/ATA/name heuristic)
    * `model→partner` from `dim_model.partner_name`
    * `model→person` from `dim_model.airbus_owner_email`

> You can reuse your existing **edge\_* transforms*\* from prior work; the shapes here match those.

---

## 9) Minimal API Endpoints (FastAPI)

```python
from fastapi import FastAPI
from typing import List

app = FastAPI()

@app.get("/models", response_model=List[Model])
def list_models():
    # SELECT * FROM dim_model ORDER BY ac_family, ata_chapter, model_name
    ...

@app.get("/actions", response_model=List[Action])
def list_actions(program: str | None = None, status: str | None = None):
    # SELECT * FROM fact_action WHERE ...
    ...

@app.get("/actions/{action_id}", response_model=Action)
@app.get("/actions/{action_id}/updates", response_model=List[StatusUpdate])
```

---

## 10) Sample Queries (Analytics)

```sql
-- Open actions by Program and Partner
SELECT program_code, partner_name, COUNT(*) AS open_actions
FROM fact_action
WHERE status NOT IN ('Completed','Canceled','Skipped')
GROUP BY 1,2
ORDER BY open_actions DESC;
```

```sql
-- Actions touching ATA 73 this quarter
SELECT action_id, title, owner_email, status, due_on
FROM fact_action
WHERE ata_chapter LIKE '73%'
  AND due_on >= date_trunc('quarter', CURRENT_DATE)
ORDER BY due_on;
```

---

## 11) Validation Checklist

* [ ] `model_seed.jsonl` loads without duplicate `model_key`.
* [ ] CSV rows produce deterministic `action_id` (MD5 of source info).
* [ ] `Updates` explode into `fact_status_update` with `action_id` FK.
* [ ] Enum values restricted to the normalized sets above.
* [ ] Foundry Ontology cards show Model → Actions → Updates chain.

---

### Appendix A — Title/ATA Parsing Heuristics

* Prefer the **most specific** ATA code in-line (e.g., `28-22` over `28`).
* If section header contains an OEM (GE, PW CEO), attribute `partner_name` to all models in that section.
* Slug generation replaces non-alphanum with `-`, collapses repeats, lowercases.

### Appendix B — Owner Normalization

* Keep raw values (`"DAIA - Francis Obusek"`) initially; later map to a `dim_person` with email. If email unavailable, use a lookup CSV for consistent identity.


DAIA Digital Workspace

Ontology Objects
CORE OBJECTS
[DAIA] Integration Case
Description: Central object for any integration project, linking all other activities and entities together.

ID:
RID:
API Name:
Key Properties:

[DAIA] Integration Task
ID: A single, actionable work item or step that needs to be completed as part of any Integration Case.
RID:
API Name:

[DAIA] Integration Gate
Description: A formal checkpoint, quality gate, or milestone that requires a decision before and Integration Case can proceed.
ID:
RID:
API Name:

[DAIA] Partner
Description: Represents external organization or internal team providing the model.
ID:
RID:
API Name:

[DAIA] Model Version
Description: Represents specific version of a partner’s model that is undergoing the integration process.
ID:
RID:
API Name:

[DAIA] MPVal Model Integration
ID:
RID:
API Name:

[DAIA] Risk Issue
Description: Track known risks, issues, or blockers that could impede the progress of an Integration Case.
ID:
RID:
API Name:

[DAIA] Action Tracker
[DAIA] Work Package
[DAIA] Artifact
Description: Represents a piece of evidence, such as report, log file, or script, that is generated during the process and linked to tasks or gates.
[DAIA] Role
[DAIA] Validation Result


Yes — this is very relevant to the ontology project we’ve been building. Let me break down why and how it fits:

1. Core Ontology Objects

Your notes confirm the set of object types we’ve been defining:
•	IntegrationCase (hub)
•	Partner
•	ModelVersion
•	IntegrationTask
•	IntegrationGate
•	Artifact
•	RiskIssue
•	ValidationResult
•	MPValPushRequest
•	WorkPackage

This matches the “hub-and-spoke” model we outlined earlier, where the IntegrationCase ties everything together. These IDs, RIDs, and API names are the canonical handles you’ll use both in Foundry Ontology Manager and in local SDK integrations.

2. SDK Usage Examples

The snippets show how to interact with these objects programmatically using the OSDK:
•	Fetch single objects (fetchOne, fetchOneWithErrors)
•	Page through results (fetchPageWithErrors, asyncIter)
•	Apply filters and aggregations
•	Load linked objects (e.g. an Artifact → linked ValidationResults)
•	Subscribe for real-time updates (important for your Workshop UI or automated tracking)

This is directly useful for the local implementation (your Cortex Synapse / GPT-OSS setup) where you’ll replicate these Foundry SDK calls against your own Postgres + API.

3. Property Schemas

At the bottom, you’ve got field definitions for each object type:
•	IntegrationCase: caseId, phase, status, plannedStart, riskLevel, etc.
•	IntegrationTask: taskId, dueDate, priority, percentComplete, etc.
•	ModelVersion: modelVersionId, versionString, libraries, partnerId, etc.
•	MPValPushRequest: pushId, modelVersionId, status, etc.
•	RiskIssue: riskId, category, severity, mitigationPlan, etc.
•	ValidationResult: resultId, outcome, summary, etc.
•	WorkPackage: workPackageId, timeboxStart, program, etc.
•	Partner: partnerId, partnerName, contactEmail, etc.

This is essentially the data model spec you need for both Foundry (ontology manager + transforms) and local Postgres (ORM definitions / Alembic migrations).

4. Why It’s Valuable
   •	✅ Confirms your ontology coverage is complete (hub, spokes, evidence, risks, gates).
   •	✅ Provides the API surface area you’ll be coding against in SDKs or local FastAPI routes.
   •	✅ Gives you field lists → ready to turn into JSON schemas, Alembic migrations, or TypeScript interfaces.
   •	✅ Shows advanced Foundry capabilities (subscriptions, derived properties, aggregations) → these map to features you’ll want in your local “Workshop” (e.g. live updates, computed fields).

5. Next Step Suggestion

Since this is essentially the formalized schema + API contract, the next move could be:
1.	Extract the property lists into JSON Schema / SQL migrations for your local DB.
2.	Mirror the OSDK patterns into your FastAPI + pgvector layer, so your local Workshop behaves like Foundry.
3.	Define link types (e.g. IntegrationCase → IntegrationTask, Artifact → ValidationResult) explicitly to ensure you can replicate linked-object fetching locally.

✅ In short: yes, this is directly useful — it’s essentially your ontology dictionary plus the integration API reference. Perfect to seed both your Foundry build and the local project.

Do you want me to condense these property tables into JSON schema / SQL model definitions for your local environment (so you can just drop them into Alembic + FastAPI)?

Awesome — here’s a drop-in pack with JSON Schemas + SQL DDL (Postgres) + SQLAlchemy models + an Alembic migration scaffold. It mirrors the objects/fields from your notes and wires sensible FKs between them so your local API can behave like Foundry’s OSDK.

1) JSON Schemas (one per object)

Save as schemas/*.json. Primary keys use string to match your IDs. Dates use date/date-time formats.

schemas/IntegrationCase.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "IntegrationCase",
"type": "object",
"required": ["caseId", "name", "status"],
"properties": {
"caseId": { "type": "string" },
"name": { "type": "string" },
"envTarget": { "type": "string", "enum": ["DEV", "MPVAL", "PROD", "TEST", "STAGE"] },
"phase": { "type": "string", "enum": ["Prep", "Validation", "Deployment", "Closed", "OnHold"] },
"status": { "type": "string", "enum": ["NotStarted", "InProgress", "Blocked", "Complete", "Cancelled"] },
"riskLevel": { "type": "string", "enum": ["Low", "Medium", "High", "Critical"] },
"plannedStart": { "type": "string", "format": "date" },
"plannedEnd": { "type": "string", "format": "date" },
"actualStart": { "type": "string", "format": "date" },
"actualEnd": { "type": "string", "format": "date" },
"partnerId": { "type": "string" },
"program": { "type": "string" },
"ataChapter": { "type": "string" },
"workPackageId": { "type": "string" },
"slaDays": { "type": "integer" },
"lastUpdated": { "type": "string", "format": "date-time" }
}
}
schemas/IntegrationTask.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "IntegrationTask",
"type": "object",
"required": ["taskId", "title", "caseId", "status", "type"],
"properties": {
"taskId": { "type": "string" },
"title": { "type": "string" },
"caseId": { "type": "string" },
"startDate": { "type": "string", "format": "date" },
"dueDate": { "type": "string", "format": "date" },
"owner": { "type": "string" },
"priority": { "type": "string", "enum": ["Low", "Medium", "High", "Urgent"] },
"status": { "type": "string", "enum": ["NotStarted", "InProgress", "Blocked", "Done", "Deferred"] },
"type": { "type": "string" },
"labels": { "type": "array", "items": { "type": "string" } },
"percentComplete": { "type": "integer", "minimum": 0, "maximum": 100 }
}
}
schemas/IntegrationGate.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "IntegrationGate",
"type": "object",
"required": ["gateId", "caseId", "name"],
"properties": {
"gateId": { "type": "string" },
"caseId": { "type": "string" },
"name": { "type": "string" },
"type": { "type": "string", "enum": ["QG0", "QG1", "QG2", "QG3", "Custom"] },
"decision": { "type": "string", "enum": ["Pending", "Passed", "Failed", "Waived"] },
"decisionDate": { "type": "string", "format": "date-time" },
"notes": { "type": "string" }
}
}
schemas/Artifact.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "Artifact",
"type": "object",
"required": ["artifactId", "caseId", "type"],
"properties": {
"artifactId": { "type": "string" },
"caseId": { "type": "string" },
"taskId": { "type": "string" },
"gateId": { "type": "string" },
"type": { "type": "string" },
"name": { "type": "string" },
"path": { "type": "string" },
"note": { "type": "string" },
"createdOn": { "type": "string", "format": "date-time" }
}
}
schemas/ModelVersion.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "ModelVersion",
"type": "object",
"required": ["modelVersionId", "modelName", "versionString", "partnerId", "status"],
"properties": {
"modelVersionId": { "type": "string" },
"modelName": { "type": "string" },
"versionString": { "type": "string" },
"partnerId": { "type": "string" },
"description": { "type": "string" },
"status": { "type": "string", "enum": ["Draft", "ReadyForValidation", "Validating", "Approved", "Deprecated"] },
"libraries": { "type": "array", "items": { "type": "string" } },
"createdOn": { "type": "string", "format": "date" }
}
}
schemas/MpvalPushRequest.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "MpvalPushRequest",
"type": "object",
"required": ["pushId", "caseId", "modelVersionId", "status", "requestedAt"],
"properties": {
"pushId": { "type": "string" },
"caseId": { "type": "string" },
"modelVersionId": { "type": "string" },
"status": { "type": "string", "enum": ["Requested", "Running", "Succeeded", "Failed", "Cancelled"] },
"requestedAt": { "type": "string", "format": "date-time" },
"requestedBy": { "type": "string" },
"completedAt": { "type": "string", "format": "date-time" },
"modelPath": { "type": "string" },
"spmStaticConfigPath": { "type": "string" },
"libraryZips": { "type": "array", "items": { "type": "string" } },
"mocaVersion": { "type": "string" },
"notes": { "type": "string" }
}
}
schemas/Partner.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "Partner",
"type": "object",
"required": ["partnerId", "partnerName", "status"],
"properties": {
"partnerId": { "type": "string" },
"partnerName": { "type": "string" },
"contactEmail": { "type": "string", "format": "email" },
"country": { "type": "string" },
"status": { "type": "string", "enum": ["Active", "Inactive", "Suspended"] }
}
}
schemas/RiskIssue.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "RiskIssue",
"type": "object",
"required": ["riskId", "caseId", "severity", "status", "openedOn"],
"properties": {
"riskId": { "type": "string" },
"caseId": { "type": "string" },
"category": { "type": "string" },
"description": { "type": "string" },
"owner": { "type": "string" },
"severity": { "type": "string", "enum": ["Low", "Medium", "High", "Critical"] },
"status": { "type": "string", "enum": ["Open", "Mitigating", "Closed", "Deferred"] },
"mitigationPlan": { "type": "string" },
"openedOn": { "type": "string", "format": "date-time" },
"closedOn": { "type": "string", "format": "date-time" }
}
}
schemas/ValidationResult.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "ValidationResult",
"type": "object",
"required": ["resultId", "caseId", "type", "outcome", "date"],
"properties": {
"resultId": { "type": "string" },
"caseId": { "type": "string" },
"gateId": { "type": "string" },
"type": { "type": "string" },
"outcome": { "type": "string", "enum": ["Running", "Passed", "Failed", "Blocked"] },
"summary": { "type": "string" },
"reportRid": { "type": "string" },
"date": { "type": "string", "format": "date-time" }
}
}
schemas/WorkPackage.json
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"title": "WorkPackage",
"type": "object",
"required": ["workPackageId", "title"],
"properties": {
"workPackageId": { "type": "string" },
"title": { "type": "string" },
"partnerId": { "type": "string" },
"program": { "type": "string" },
"timeboxStart": { "type": "string", "format": "date" },
"timeboxEnd": { "type": "string", "format": "date" }
}
}

2) Postgres SQL (DDL)

Save as db/schema.sql. Includes FKs, indexes, and CHECKs for common enums (tweak as needed).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PARTNER
CREATE TABLE partner (
partner_id TEXT PRIMARY KEY,
partner_name TEXT NOT NULL,
contact_email TEXT,
country TEXT,
status TEXT NOT NULL CHECK (status IN ('Active','Inactive','Suspended'))
);

-- WORK PACKAGE
CREATE TABLE work_package (
work_package_id TEXT PRIMARY KEY,
title TEXT NOT NULL,
partner_id TEXT REFERENCES partner(partner_id) ON UPDATE CASCADE ON DELETE SET NULL,
program TEXT,
timebox_start DATE,
timebox_end DATE
);

-- INTEGRATION CASE (hub)
CREATE TABLE integration_case (
case_id TEXT PRIMARY KEY,
name TEXT NOT NULL,
env_target TEXT CHECK (env_target IN ('DEV','MPVAL','PROD','TEST','STAGE')),
phase TEXT CHECK (phase IN ('Prep','Validation','Deployment','Closed','OnHold')),
status TEXT NOT NULL CHECK (status IN ('NotStarted','InProgress','Blocked','Complete','Cancelled')),
risk_level TEXT CHECK (risk_level IN ('Low','Medium','High','Critical')),
planned_start DATE,
planned_end DATE,
actual_start DATE,
actual_end DATE,
partner_id TEXT REFERENCES partner(partner_id) ON UPDATE CASCADE ON DELETE SET NULL,
program TEXT,
ata_chapter TEXT,
work_package_id TEXT REFERENCES work_package(work_package_id) ON UPDATE CASCADE ON DELETE SET NULL,
sla_days INTEGER,
last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_integration_case_partner ON integration_case(partner_id);
CREATE INDEX idx_integration_case_status ON integration_case(status);

-- MODEL VERSION
CREATE TABLE model_version (
model_version_id TEXT PRIMARY KEY,
model_name TEXT NOT NULL,
version_string TEXT NOT NULL,
partner_id TEXT REFERENCES partner(partner_id) ON UPDATE CASCADE ON DELETE SET NULL,
description TEXT,
status TEXT NOT NULL CHECK (status IN ('Draft','ReadyForValidation','Validating','Approved','Deprecated')),
libraries TEXT[],
created_on DATE
);
CREATE INDEX idx_model_version_partner ON model_version(partner_id);
CREATE INDEX idx_model_version_status ON model_version(status);

-- INTEGRATION GATE
CREATE TABLE integration_gate (
gate_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
name TEXT NOT NULL,
type TEXT CHECK (type IN ('QG0','QG1','QG2','QG3','Custom')),
decision TEXT CHECK (decision IN ('Pending','Passed','Failed','Waived')),
decision_date TIMESTAMPTZ,
notes TEXT
);
CREATE INDEX idx_gate_case ON integration_gate(case_id);

-- ARTIFACT
CREATE TABLE artifact (
artifact_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
task_id TEXT,
gate_id TEXT REFERENCES integration_gate(gate_id) ON UPDATE CASCADE ON DELETE SET NULL,
type TEXT NOT NULL,
name TEXT,
path TEXT,
note TEXT,
created_on TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_artifact_case ON artifact(case_id);
CREATE INDEX idx_artifact_gate ON artifact(gate_id);

-- INTEGRATION TASK
CREATE TABLE integration_task (
task_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
title TEXT NOT NULL,
start_date DATE,
due_date DATE,
owner TEXT,
priority TEXT CHECK (priority IN ('Low','Medium','High','Urgent')),
status TEXT NOT NULL CHECK (status IN ('NotStarted','InProgress','Blocked','Done','Deferred')),
type TEXT NOT NULL,
labels TEXT[],
percent_complete INTEGER CHECK (percent_complete BETWEEN 0 AND 100)
);
CREATE INDEX idx_task_case ON integration_task(case_id);
CREATE INDEX idx_task_status ON integration_task(status);

-- VALIDATION RESULT
CREATE TABLE validation_result (
result_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
gate_id TEXT REFERENCES integration_gate(gate_id) ON UPDATE CASCADE ON DELETE SET NULL,
type TEXT NOT NULL,
outcome TEXT NOT NULL CHECK (outcome IN ('Running','Passed','Failed','Blocked')),
summary TEXT,
report_rid TEXT,
date TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_val_case ON validation_result(case_id);
CREATE INDEX idx_val_gate ON validation_result(gate_id);

-- MPVAL PUSH REQUEST
CREATE TABLE mpval_push_request (
push_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
model_version_id TEXT NOT NULL REFERENCES model_version(model_version_id) ON UPDATE CASCADE ON DELETE CASCADE,
status TEXT NOT NULL CHECK (status IN ('Requested','Running','Succeeded','Failed','Cancelled')),
requested_at TIMESTAMPTZ NOT NULL,
requested_by TEXT,
completed_at TIMESTAMPTZ,
model_path TEXT,
spm_static_config_path TEXT,
library_zips TEXT[],
moca_version TEXT,
notes TEXT
);
CREATE INDEX idx_push_case ON mpval_push_request(case_id);
CREATE INDEX idx_push_modelver ON mpval_push_request(model_version_id);

-- RISK / ISSUE
CREATE TABLE risk_issue (
risk_id TEXT PRIMARY KEY,
case_id TEXT NOT NULL REFERENCES integration_case(case_id) ON UPDATE CASCADE ON DELETE CASCADE,
category TEXT,
description TEXT,
owner TEXT,
severity TEXT NOT NULL CHECK (severity IN ('Low','Medium','High','Critical')),
status TEXT NOT NULL CHECK (status IN ('Open','Mitigating','Closed','Deferred')),
mitigation_plan TEXT,
opened_on TIMESTAMPTZ NOT NULL,
closed_on TIMESTAMPTZ
);
CREATE INDEX idx_risk_case ON risk_issue(case_id);
CREATE INDEX idx_risk_status ON risk_issue(status);

3) SQLAlchemy Models (2.0 style)

Save as server/models.py. These map 1:1 to the DDL above.
from sqlalchemy import (
CheckConstraint, ForeignKey, String, Text, Date, DateTime, Integer, ARRAY
)
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
pass


class Partner(Base):
__tablename__ = "partner"
partner_id: Mapped[str] = mapped_column(String, primary_key=True)
partner_name: Mapped[str] = mapped_column(Text, nullable=False)
contact_email: Mapped[str | None] = mapped_column(Text)
country: Mapped[str | None] = mapped_column(Text)
status: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('Active','Inactive','Suspended')", name="ck_partner_status"),
    )

    work_packages = relationship("WorkPackage", back_populates="partner")
    model_versions = relationship("ModelVersion", back_populates="partner")


class WorkPackage(Base):
__tablename__ = "work_package"
work_package_id: Mapped[str] = mapped_column(String, primary_key=True)
title: Mapped[str] = mapped_column(Text, nullable=False)
partner_id: Mapped[str | None] = mapped_column(ForeignKey("partner.partner_id", onupdate="CASCADE", ondelete="SET NULL"))
program: Mapped[str | None] = mapped_column(Text)
timebox_start: Mapped[Date | None] = mapped_column(Date)
timebox_end: Mapped[Date | None] = mapped_column(Date)

    partner = relationship("Partner", back_populates="work_packages")
    cases = relationship("IntegrationCase", back_populates="work_package")


class IntegrationCase(Base):
__tablename__ = "integration_case"
case_id: Mapped[str] = mapped_column(String, primary_key=True)
name: Mapped[str] = mapped_column(Text, nullable=False)
env_target: Mapped[str | None] = mapped_column(Text)
phase: Mapped[str | None] = mapped_column(Text)
status: Mapped[str] = mapped_column(Text, nullable=False)
risk_level: Mapped[str | None] = mapped_column(Text)
planned_start: Mapped[Date | None] = mapped_column(Date)
planned_end: Mapped[Date | None] = mapped_column(Date)
actual_start: Mapped[Date | None] = mapped_column(Date)
actual_end: Mapped[Date | None] = mapped_column(Date)
partner_id: Mapped[str | None] = mapped_column(ForeignKey("partner.partner_id", onupdate="CASCADE", ondelete="SET NULL"))
program: Mapped[str | None] = mapped_column(Text)
ata_chapter: Mapped[str | None] = mapped_column(Text)
work_package_id: Mapped[str | None] = mapped_column(ForeignKey("work_package.work_package_id", onupdate="CASCADE", ondelete="SET NULL"))
sla_days: Mapped[int | None] = mapped_column(Integer)
last_updated: Mapped = mapped_column(TIMESTAMP(timezone=True))

    __table_args__ = (
        CheckConstraint("status IN ('NotStarted','InProgress','Blocked','Complete','Cancelled')", name="ck_case_status"),
        CheckConstraint("env_target IN ('DEV','MPVAL','PROD','TEST','STAGE') OR env_target IS NULL", name="ck_case_env"),
        CheckConstraint("phase IN ('Prep','Validation','Deployment','Closed','OnHold') OR phase IS NULL", name="ck_case_phase"),
        CheckConstraint("risk_level IN ('Low','Medium','High','Critical') OR risk_level IS NULL", name="ck_case_risk"),
    )

    partner = relationship("Partner")
    work_package = relationship("WorkPackage", back_populates="cases")
    gates = relationship("IntegrationGate", back_populates="case", cascade="all, delete-orphan")
    tasks = relationship("IntegrationTask", back_populates="case", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="case", cascade="all, delete-orphan")
    risks = relationship("RiskIssue", back_populates="case", cascade="all, delete-orphan")
    validations = relationship("ValidationResult", back_populates="case", cascade="all, delete-orphan")
    pushes = relationship("MpvalPushRequest", back_populates="case", cascade="all, delete-orphan")


class ModelVersion(Base):
__tablename__ = "model_version"
model_version_id: Mapped[str] = mapped_column(String, primary_key=True)
model_name: Mapped[str] = mapped_column(Text, nullable=False)
version_string: Mapped[str] = mapped_column(Text, nullable=False)
partner_id: Mapped[str | None] = mapped_column(ForeignKey("partner.partner_id", onupdate="CASCADE", ondelete="SET NULL"))
description: Mapped[str | None] = mapped_column(Text)
status: Mapped[str] = mapped_column(Text, nullable=False)
libraries: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
created_on: Mapped[Date | None] = mapped_column(Date)

    __table_args__ = (
        CheckConstraint("status IN ('Draft','ReadyForValidation','Validating','Approved','Deprecated')", name="ck_modelver_status"),
    )

    partner = relationship("Partner")
    pushes = relationship("MpvalPushRequest", back_populates="model_version")


class IntegrationGate(Base):
__tablename__ = "integration_gate"
gate_id: Mapped[str] = mapped_column(String, primary_key=True)
case_id: Mapped[str] = mapped_column(ForeignKey("integration_case.case_id", onupdate="CASCADE", ondelete="CASCADE"))
name: Mapped[str] = mapped_column(Text, nullable=False)
type: Mapped[str | None] = mapped_column(Text)
decision: Mapped[str | None] = mapped_column(Text)
decision_date: Mapped[DateTime | None] = mapped_column(TIMESTAMP(timezone=True))
notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint("type IN ('QG0','QG1','QG2','QG3','Custom') OR type IS NULL", name="ck_gate_type"),
        CheckConstraint("decision IN ('Pending','Passed','Failed','Waived') OR decision IS NULL", name="ck_gate_decision"),
    )

    case = relationship("IntegrationCase", back_populates="gates")
    artifacts = relationship("Artifact", back_populates="gate")
    validations = relationship("ValidationResult", back_populates="gate")


class Artifact(Base):
__tablename__ = "artifact"
artifact_id: Mapped[str] = mapped_column(String, primary_key=True)
case_id: Mapped[str] = mapped_column(ForeignKey("integration_case.case_id", onupdate="CASCADE", ondelete="CASCADE"))
task_id: Mapped[str | None] = mapped_column(String)
gate_id: Mapped[str | None] = mapped_column(ForeignKey("integration_gate.gate_id", onupdate="CASCADE", ondelete="SET NULL"))
type: Mapped[str] = mapped_column(Text, nullable=False)
name: Mapped[str | None] = mapped_column(Text)
path: Mapped[str | None] = mapped_column(Text)
note: Mapped[str | None] = mapped_column(Text)
created_on: Mapped[DateTime | None] = mapped_column(TIMESTAMP(timezone=True))

    case = relationship("IntegrationCase", back_populates="artifacts")
    gate = relationship("IntegrationGate", back_populates="artifacts")


class IntegrationTask(Base):
__tablename__ = "integration_task"
task_id: Mapped[str] = mapped_column(String, primary_key=True)
case_id: Mapped[str] = mapped_column(ForeignKey("integration_case.case_id", onupdate="CASCADE", ondelete="CASCADE"))
title: Mapped[str] = mapped_column(Text, nullable=False)
start_date: Mapped[Date | None] = mapped_column(Date)
due_date: Mapped[Date | None] = mapped_column(Date)
owner: Mapped[str | None] = mapped_column(Text)
priority: Mapped[str | None] = mapped_column(Text)
status: Mapped[str] = mapped_column(Text, nullable=False)
type: Mapped[str] = mapped_column(Text, nullable=False)
labels: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
percent_complete: Mapped[int | None] = mapped_column(Integer)

    __table_args__ = (
        CheckConstraint("priority IN ('Low','Medium','High','Urgent') OR priority IS NULL", name="ck_task_priority"),
        CheckConstraint("status IN ('NotStarted','InProgress','Blocked','Done','Deferred')", name="ck_task_status"),
        CheckConstraint("percent_complete BETWEEN 0 AND 100 OR percent_complete IS NULL", name="ck_task_pct"),
    )

    case = relationship("IntegrationCase", back_populates="tasks")


class ValidationResult(Base):
__tablename__ = "validation_result"
result_id: Mapped[str] = mapped_column(String, primary_key=True)
case_id: Mapped[str] = mapped_column(ForeignKey("integration_case.case_id", onupdate="CASCADE", ondelete="CASCADE"))
gate_id: Mapped[str | None] = mapped_column(ForeignKey("integration_gate.gate_id", onupdate="CASCADE", ondelete="SET NULL"))
type: Mapped[str] = mapped_column(Text, nullable=False)
outcome: Mapped[str] = mapped_column(Text, nullable=False)
summary: Mapped[str | None] = mapped_column(Text)
report_rid: Mapped[str | None] = mapped_column(Text)
date: Mapped[DateTime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)

    __table_args__ = (
        CheckConstraint("outcome IN ('Running','Passed','Failed','Blocked')", name="ck_val_outcome"),
    )

    case = relationship("IntegrationCase", back_populates="validations")
    gate = relationship("IntegrationGate", back_populates="validations")


class MpvalPushRequest(Base):
__tablename__ = "mpval_push_request"
push_id: Mapped[str] = mapped_column(String, primary_key=True)
case_id: Mapped[str] = mapped_column(ForeignKey("integration_case.case_id", onupdate="CASCADE", ondelete="CASCADE"))
model_version_id: Mapped[str] = mapped_column(ForeignKey("model_version.model_version_id", onupdate="CASCADE", ondelete="CASCADE"))
status: Mapped[str] = mapped_column(Text, nullable=False)
requested_at: Mapped[DateTime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
requested_by: Mapped[str | None] = mapped_column(Text)
completed_at: Mapped[DateTime | None] = mapped_column(TIMESTAMP(timezone=True))
model_path: Mapped[str | None] = mapped_column(Text)
spm_static_config_path: Mapped[str | None] = mapped_column(Text)
library_zips: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
moca_version: Mapped[str | None] = mapped_column(Text)
notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint("status IN ('Requested','Running','Succeeded','Failed','Cancelled')", name="ck_push_status"),
    )

    case = relationship("IntegrationCase", back_populates="pushes")
    model_version = relationship("ModelVersion", back_populates="pushes")

4) Alembic Migration (single shot)

Save as server/migrations/versions/0001_init.py and run via your usual Alembic flow. If you prefer, you can just op.execute(open('db/schema.sql').read()).
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
op.execute("""
-- Paste the DDL from db/schema.sql here verbatim
""")
# Or recreate tables with SQLAlchemy ops if you prefer granular definitions.


def downgrade():
op.execute("""
DROP TABLE IF EXISTS mpval_push_request CASCADE;
DROP TABLE IF EXISTS validation_result CASCADE;
DROP TABLE IF EXISTS integration_task CASCADE;
DROP TABLE IF EXISTS artifact CASCADE;
DROP TABLE IF EXISTS integration_gate CASCADE;
DROP TABLE IF EXISTS model_version CASCADE;
DROP TABLE IF EXISTS integration_case CASCADE;
DROP TABLE IF EXISTS work_package CASCADE;
DROP TABLE IF EXISTS partner CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp";
""")

Notes & Rationale
•	FK strategy mirrors how your links work in Foundry:
o	IntegrationCase ↔ Partner, WorkPackage
o	IntegrationTask, Artifact, ValidationResult, RiskIssue, MpvalPushRequest → belong to IntegrationCase
o	ValidationResult & Artifact can reference a Gate (nullable)
o	MpvalPushRequest requires both Case and ModelVersion
•	Enum checks: kept flexible but opinionated to match the values we’ve used in the project.
•	Arrays map your lists (labels, libraries, libraryZips) to TEXT[] for convenience.

Want me to also generate:
•	Pydantic models (for FastAPI I/O), and
•	Seed scripts + sample rows (to match your “smoke test” in Workshop)?

I can drop those in next so you can boot the local stack and click through the exact “Flag Risk → Upload Evidence → Request Validation → Request MPVal Push” flow.
Short answer: yes—keep most of it. It largely matches what we’ve already defined, with a few useful additions and a handful of enum/name mismatches you should reconcile.

What to KEEP (net new/valuable)
•	ID strategy: ULIDs (sortable, URL-safe). We used generic TEXT; ULIDs drop in fine.
•	Link list: Explicit link names (e.g., daia-model-integrated-by-case)—great for Foundry + local parity.
•	Actions matrix: Clear verbs/targets/side-effects—maps 1:1 to your Action Types and FastAPI routes.
•	Events & webhooks: Topic names and payload shapes—good for Workshop live updates.
•	Supporting dims (future): Person, OrgParty, ModelAsset, ATA, Tool, Environment. (We didn’t model these yet; keep as backlog.)

Differences vs. our current schema (and what to do)

1) Object shapes
   •	IntegrationCase
   o	Notes add: modelVersionId on the case.
   o	We currently link ModelVersion only via MpvalPushRequest.
   Recommendation: Add integration_case.model_version_id TEXT NULL REFERENCES model_version(model_version_id) for direct case↔model binding.
   •	ModelVersion
   o	Notes use: modelKey, version, acFamily, vendorPartner, dataSource, notes.
   o	We have: version_string, description, libraries, status.
   Recommendation: Keep ours, add optional columns you care about (model_key, ac_family, data_source TEXT[], notes TEXT). Alias version ⇄ version_string at API level if you prefer one.
   •	IntegrationGate
   o	Notes add: status (Pending|InReview|Decided) separate from decision (Passed|Failed|Waived) and approver.
   o	We have: type, decision, decision_date, notes (no status, no approver).
   Recommendation: Add status TEXT and approver TEXT. Keep type (QG0/1/2/3) as it’s useful.
   •	IntegrationTask
   o	Notes add: milestone (QG0…); expectedHours, actualHours, updates TEXT[].
   o	Enums differ: notes use Open where we use NotStarted.
   Recommendation: Add milestone TEXT, expected_hours NUMERIC, actual_hours NUMERIC, updates TEXT[]. Either:
   	Normalize statuses to our set, or
   	Extend CHECK to accept both (Open and NotStarted) then map in API.
   •	Artifact
   o	Notes make path required; we had it optional. Fine to keep optional locally (uploads vs. references).
   •	RiskIssue
   o	Notes enumerate category values. We kept it free-text.
   Recommendation: keep free-text now; add a controlled list later via lookup table.
   •	MPValPushRequest
   o	Present in our schema; consistent with actions matrix. No change needed.

2) Enum and naming deltas (quick map)
   •	Task.status
   o	Notes: Open|InProgress|Blocked|Done|Skipped
   o	Ours: NotStarted|InProgress|Blocked|Done|Deferred
   Map: Open ↔ NotStarted, Skipped ↔ Deferred.
   •	Gate.status + decision
   o	Notes: status (Pending|InReview|Decided) + decision (Passed|Failed|Waived|null)
   o	Ours: only decision (Pending/Passed/Failed/Waived).
   Adopt notes: richer separation; keep our decision values and add status.
   •	ModelVersion.status
   o	Notes: Draft|Ready|InValidation|Approved|Rejected|Deprecated
   o	Ours: Draft|ReadyForValidation|Validating|Approved|Deprecated
   Map: Ready ↔ ReadyForValidation, InValidation ↔ Validating; add Rejected.

3) New columns to add (minimal)
   •	integration_case.model_version_id TEXT NULL REFERENCES model_version(model_version_id)
   •	integration_gate.status TEXT NULL, integration_gate.approver TEXT NULL
   •	integration_task.milestone TEXT NULL, expected_hours NUMERIC NULL, actual_hours NUMERIC NULL, updates TEXT[] NULL
   •	model_version.model_key TEXT NULL, ac_family TEXT NULL, data_source TEXT[] NULL, notes TEXT NULL
   •	(Optional) tighten artifact.path to NOT NULL if you want to enforce evidence paths.

Quick migration patch (Postgres)
ALTER TABLE integration_case
ADD COLUMN IF NOT EXISTS model_version_id TEXT
REFERENCES model_version(model_version_id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE integration_gate
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS approver TEXT;

ALTER TABLE integration_task
ADD COLUMN IF NOT EXISTS milestone TEXT,
ADD COLUMN IF NOT EXISTS expected_hours NUMERIC,
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC,
ADD COLUMN IF NOT EXISTS updates TEXT[];

ALTER TABLE model_version
ADD COLUMN IF NOT EXISTS model_key TEXT,
ADD COLUMN IF NOT EXISTS ac_family TEXT,
ADD COLUMN IF NOT EXISTS data_source TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT;

-- OPTIONAL: relax/extend enums to accept both vocabularies
-- Task.status: allow Open/Skipped too
ALTER TABLE integration_task DROP CONSTRAINT IF EXISTS ck_task_status;
ALTER TABLE integration_task
ADD CONSTRAINT ck_task_status
CHECK (status IN ('NotStarted','Open','InProgress','Blocked','Done','Deferred','Skipped'));

-- Gate.status
ALTER TABLE integration_gate DROP CONSTRAINT IF EXISTS ck_gate_decision;
ALTER TABLE integration_gate
ADD CONSTRAINT ck_gate_decision
CHECK (decision IN ('Pending','Passed','Failed','Waived') OR decision IS NULL);
Bottom line
•	Keep: ULIDs, link names, actions matrix, webhooks, the added gate/task fields, and the case→modelVersion link.
•	Align: enums and a few property names (version vs version_string, task/gate statuses).
•	Backlog: supporting dims (Person/Org/ATA/Tool/Env) as separate tables later.

If you want, I’ll update the SQLAlchemy models and Pydantic schemas to reflect these deltas so you can drop them straight in.
Perfect — this block you’ve drafted is exactly the Foundry Build Pack skeleton we need to round out your spec.
I’ve added the full Hardening Guide (Alembic, JWT auth, tool audits, embedders, browser/math tools, expanded UI) into your canvas under section 10.

Do you want me to also generate the matching Alembic migration files + FastAPI stubs so you can drop them in and run alembic upgrade head immediately?

Here’s how I’d extend it so you’ve got a complete, ready-to-implement kit:

📦 Foundry Build Pack — SQL Transforms & Ontology Mapping

1. Staging Transforms (examples)

stg_action_clean.sql
SELECT
uuid_generate_v4() AS action_id,
'DTO_ACTIONS' AS source_system,
row_id AS source_id,
subject,
actions AS title,
issue,
theme,
{{status_mapper(status_raw)}} AS status,
{{priority_mapper(priority_raw)}} AS priority,
try_cast(start_date AS DATE) AS start_date,
try_cast(due_on AS DATE) AS due_on,
(lower(completed) = 'yes') AS completed,
program AS program_code,
ac_family,
ata_chapter,
model_name,
owner_email,
partner AS partner_name
FROM raw_dto_actions;
Reusable mappers (inlined macros or CASE)
-- status_mapper
CASE
WHEN regexp_like(status_raw,'(?i)pending') THEN 'Waiting Response'
WHEN regexp_like(status_raw,'(?i)backlog') THEN 'Planned'
WHEN regexp_like(status_raw,'(?i)completed') THEN 'Completed'
WHEN regexp_like(status_raw,'(?i)skipped') THEN 'Skipped'
WHEN regexp_like(status_raw,'(?i)blocked') THEN 'Blocked'
ELSE 'In Progress'
END
-- priority_mapper
CASE
WHEN regexp_like(priority_raw,'(?i)high') THEN 'High'
WHEN regexp_like(priority_raw,'(?i)low') THEN 'Low'
ELSE 'Medium'
END

2. Canonical Fact/Dim Transforms

fact_action.sql
SELECT * FROM stg_action_clean
UNION ALL
SELECT * FROM stg_partner_tracker_clean
UNION ALL
SELECT * FROM stg_dai_tracker_clean;
fact_status_update.sql
SELECT
uuid_generate_v4() AS update_id,
action_id,
now() AS created_at,
owner_email AS author_email,
note AS body
FROM stg_action_notes;
dim_model.sql
SELECT DISTINCT
upper(ac_family)||':'||ata_chapter||':'||slugify(model_name) AS model_key,
ac_family, ata_chapter, model_name,
status, data_source, description,
airbus_owner_email, partner_name,
version, process_gate, due_date, priority
FROM stg_model_master;

3. Link Edge Datasets

edge_action_about_model.sql
SELECT a.action_id, m.model_key
FROM fact_action a
JOIN dim_model m
ON a.ac_family = m.ac_family
AND a.ata_chapter = m.ata_chapter
AND a.model_name = m.model_name;
edge_action_assigned_to.sql
SELECT action_id, owner_email AS person_id
FROM fact_action
WHERE owner_email IS NOT NULL;
edge_action_in_program.sql
SELECT action_id, program_code
FROM fact_action;
edge_model_by_partner.sql
SELECT model_key, partner_name
FROM dim_model;

4. Ontology Manager Mapping
   •	Objects:
   o	daia-model ← dim_model
   o	daia-action ← fact_action
   o	daia-status-update ← fact_status_update
   o	daia-person ← dim_person
   o	daia-partner ← dim_partner
   o	daia-program ← dim_program
   •	Links:
   o	daia-action-about-model ← edge_action_about_model
   o	daia-action-assigned-to ← edge_action_assigned_to
   o	daia-action-in-program ← edge_action_in_program
   o	daia-model-by-partner ← edge_model_by_partner
   o	daia-action-has-update ← join on fact_action.action_id = fact_status_update.action_id

5. Smoke-Test Checklist
1.	Ingest 10–20 rows from one tracker.
2.	Run transforms → fact_action, dim_model.
3.	Load Ontology objects → confirm:
      o	Model card shows linked actions + updates.
      o	Action card shows linked model, owner, partner.
4.	Validate enums (status/priority) render consistently.
5.	Expand to other trackers once canonical schema proven.

✅ This kit now covers: raw ingest → staging → canonical facts/dims → link edges → ontology mapping → smoke-test loop.

Would you like me to turn this into a Foundry Solution Designer template (JSON with object/link definitions + dataset mappings), so you can import it directly instead of copy-pasting SQL?


#  Copyright 2025 Joshua Taylor. All rights reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from transforms.api import transform, transform_df, Output
from pyspark.sql import types as T

# ==============================================================================
# [DAIA] Artifact
# ==============================================================================

def create_artifact_schema(spark_session):
    """Defines the schema for the daia_artifact backing dataset."""
    schema = T.StructType([
        T.StructField("artifactId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("taskId", T.StringType(), True),
        T.StructField("gateId", T.StringType(), True),
        T.StructField("type", T.StringType(), True),  # e.g., ValidationReport, LogFile, Script
        T.StructField("path", T.StringType(), True),
        T.StructField("createdOn", T.TimestampType(), True),
        T.StructField("note", T.StringType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_artifact/daia_artifact_backing")
)
def compute_artifact_backing(ctx):
    """Creates an empty backing dataset for the DAIA Artifact object."""
    return create_artifact_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Integration Case
# ==============================================================================

def create_integration_case_schema(spark_session):
    """Defines the schema for the daia_integration_case backing dataset."""
    schema = T.StructType([
        T.StructField("caseId", T.StringType(), False),
        T.StructField("name", T.StringType(), True),
        T.StructField("envTarget", T.StringType(), True),       # DEV | MPVAL | PROD
        T.StructField("phase", T.StringType(), True),           # Prep | Validation | Deployment
        T.StructField("status", T.StringType(), True),          # NotStarted | InProgress | Blocked | Complete
        T.StructField("riskLevel", T.StringType(), True),       # Low | Medium | High
        T.StructField("plannedStart", T.DateType(), True),
        T.StructField("plannedEnd", T.DateType(), True),
        T.StructField("actualStart", T.DateType(), True),
        T.StructField("actualEnd", T.DateType(), True),
        T.StructField("slaDays", T.IntegerType(), True),
        T.StructField("lastUpdated", T.TimestampType(), True),
        T.StructField("partnerId", T.StringType(), True),
        T.StructField("program", T.StringType(), True),
        T.StructField("ataChapter", T.StringType(), True),
        T.StructField("workPackageId", T.StringType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_integration_case/daia_integration_case_backing")
)
def compute_integration_case_backing(ctx):
    """Creates an empty backing dataset for the DAIA Integration Case object."""
    return create_integration_case_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Integration Gate
# ==============================================================================

def create_integration_gate_schema(spark_session):
    """Defines the schema for the daia_integration_gate backing dataset."""
    schema = T.StructType([
        T.StructField("gateId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("name", T.StringType(), True),        # e.g., QG0, QG1, ValidationRequested
        T.StructField("decision", T.StringType(), True),    # Pending | Passed | Failed | Skipped
        T.StructField("plannedDate", T.DateType(), True),
        T.StructField("decisionDate", T.TimestampType(), True),
        T.StructField("approver", T.StringType(), True),
        T.StructField("note", T.StringType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_integration_gate/daia_integration_gate_backing")
)
def compute_integration_gate_backing(ctx):
    """Creates an empty backing dataset for the DAIA Integration Gate object."""
    return create_integration_gate_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Integration Task
# ==============================================================================

def create_integration_task_schema(spark_session):
    """Defines the schema for the daia_integration_task backing dataset."""
    schema = T.StructType([
        T.StructField("taskId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("title", T.StringType(), True),
        T.StructField("type", T.StringType(), True),        # e.g., Feasibility, Access, MaterialsAvail
        T.StructField("status", T.StringType(), True),      # ToDo | InProgress | Blocked | Done
        T.StructField("priority", T.StringType(), True),    # LOW | MEDIUM | HIGH | CRITICAL
        T.StructField("percentComplete", T.IntegerType(), True),
        T.StructField("startDate", T.DateType(), True),
        T.StructField("dueDate", T.DateType(), True),
        T.StructField("owner", T.StringType(), True),
        T.StructField("labels", T.ArrayType(T.StringType()), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_integration_task/daia_integration_task_backing")
)
def compute_integration_task_backing(ctx):
    """Creates an empty backing dataset for the DAIA Integration Task object."""
    return create_integration_task_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Model Version
# ==============================================================================

def create_model_version_schema(spark_session):
    """Defines the schema for the daia_model_version backing dataset."""
    schema = T.StructType([
        T.StructField("modelVersionId", T.StringType(), False),
        T.StructField("modelName", T.StringType(), True),
        T.StructField("versionString", T.StringType(), True),
        T.StructField("status", T.StringType(), True),      # Development | Testing | Approved
        T.StructField("createdOn", T.DateType(), True),
        T.StructField("description", T.StringType(), True),
        T.StructField("partnerId", T.StringType(), True),
        T.StructField("libraries", T.ArrayType(T.StringType()), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_model_version/daia_model_version_backing")
)
def compute_model_version_backing(ctx):
    """Creates an empty backing dataset for the DAIA Model Version object."""
    return create_model_version_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] MPVal Push Request
# ==============================================================================

def create_mpval_push_request_schema(spark_session):
    """Defines the schema for the daia_mpval_push_request backing dataset."""
    schema = T.StructType([
        T.StructField("pushId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("modelVersionId", T.StringType(), True),
        T.StructField("modelPath", T.StringType(), True),
        T.StructField("spmStaticConfigPath", T.StringType(), True),
        T.StructField("mocaVersion", T.StringType(), True),
        T.StructField("libraryZips", T.ArrayType(T.StringType()), True),
        T.StructField("notes", T.StringType(), True),
        T.StructField("requestedBy", T.StringType(), True),
        T.StructField("status", T.StringType(), True),      # Requested | Pushed | Failed
        T.StructField("requestedAt", T.TimestampType(), True),
        T.StructField("completedAt", T.TimestampType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_mpval_push_request/daia_mpval_push_request_backing")
)
def compute_mpval_push_request_backing(ctx):
    """Creates an empty backing dataset for the DAIA MPVal Push Request object."""
    return create_mpval_push_request_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Partner
# ==============================================================================

def create_partner_schema(spark_session):
    """Defines the schema for the daia_partner backing dataset."""
    schema = T.StructType([
        T.StructField("partnerId", T.StringType(), False),
        T.StructField("partnerName", T.StringType(), True),
        T.StructField("contactEmail", T.StringType(), True),
        T.StructField("status", T.StringType(), True),
        T.StructField("country", T.StringType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_partner/daia_partner_backing")
)
def compute_partner_backing(ctx):
    """Creates an empty backing dataset for the DAIA Partner object."""
    return create_partner_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Risk Issue
# ==============================================================================

def create_risk_issue_schema(spark_session):
    """Defines the schema for the daia_risk_issue backing dataset."""
    schema = T.StructType([
        T.StructField("riskId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("category", T.StringType(), True),
        T.StructField("severity", T.StringType(), True),    # High | Medium | Low
        T.StructField("description", T.StringType(), True),
        T.StructField("status", T.StringType(), True),      # Open | Closed
        T.StructField("owner", T.StringType(), True),
        T.StructField("mitigationPlan", T.StringType(), True),
        T.StructField("openedOn", T.TimestampType(), True),
        T.StructField("closedOn", T.TimestampType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_risk_issue/daia_risk_issue_backing")
)
def compute_risk_issue_backing(ctx):
    """Creates an empty backing dataset for the DAIA Risk Issue object."""
    return create_risk_issue_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Role
# ==============================================================================

@transform(
    role_backing_data=Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_role/daia_role_backing")
)
def compute_role_backing(ctx, role_backing_data):
    """Generates and populates the backing dataset for the DAIA Role object type."""
    schema = T.StructType([
        T.StructField("roleId", T.StringType(), False),
        T.StructField("roleName", T.StringType(), True),
        T.StructField("assigneeEmail", T.StringType(), True),
    ])

    dummy_data = [
        ("INT-LEAD", "Integration Lead", "alex.taylor@example.com"),
        ("DEV-LEAD", "Development Lead", "brian.casey@example.com"),
        ("SEC-APPROVER", "Security Approver", "security.team@example.com"),
    ]

    df = ctx.spark_session.createDataFrame(data=dummy_data, schema=schema)
    role_backing_data.write_dataframe(df)

# ==============================================================================
# [DAIA] Validation Result
# ==============================================================================

def create_validation_result_schema(spark_session):
    """Defines the schema for the daia_validation_result backing dataset."""
    schema = T.StructType([
        T.StructField("resultId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), True),
        T.StructField("gateId", T.StringType(), True),
        T.StructField("type", T.StringType(), True),        # Performance | Security | Compliance
        T.StructField("outcome", T.StringType(), True),     # Pass | Fail | Running
        T.StructField("date", T.TimestampType(), True),
        T.StructField("summary", T.StringType(), True),
        T.StructField("reportRid", T.StringType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_validation_result/daia_validation_result_backing")
)
def compute_validation_result_backing(ctx):
    """Creates an empty backing dataset for the DAIA Validation Result object."""
    return create_validation_result_schema(ctx.spark_session)

# ==============================================================================
# [DAIA] Work Package
# ==============================================================================

def create_work_package_schema(spark_session):
    """Defines the schema for the daia_work_package backing dataset."""
    schema = T.StructType([
        T.StructField("workPackageId", T.StringType(), False),
        T.StructField("title", T.StringType(), True),
        T.StructField("program", T.StringType(), True),
        T.StructField("partnerId", T.StringType(), True),
        T.StructField("timeboxStart", T.DateType(), True),
        T.StructField("timeboxEnd", T.DateType(), True),
    ])
    return spark_session.createDataFrame([], schema)

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/daia_work_package/daia_work_package_backing")
)
def compute_work_package_backing(ctx):
    """Creates an empty backing dataset for the DAIA Work Package object."""
    return create_work_package_schema(ctx.spark_session)

# ==============================================================================
# LINK: Work Package HAS Case
# ==============================================================================

def create_workpackage_has_case_schema():
    """Defines the schema for the workpackage-to-case link table."""
    return T.StructType([
        T.StructField("workPackageId", T.StringType(), False),
        T.StructField("caseId", T.StringType(), False),
    ])

@transform_df(
    Output("/Airbus/Skywise-DAIA Docs Chatbot/protected/data/ontology/links/daia_workpackage_has_case")
)
def compute_workpackage_has_case_link(ctx):
    """Creates an empty but typed join table for the workpackage-to-case link."""
    schema = create_workpackage_has_case_schema()
    return ctx.spark_session.createDataFrame([], schema)
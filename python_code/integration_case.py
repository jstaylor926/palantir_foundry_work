from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import date, datetime

class IntegrationCase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(index=True, unique=True)
    partner_id: int = Field(foreign_key="partner.id")
    env_target: str
    phase: str
    status: str
    planned_start: Optional[date]
    planned_end: Optional[date]
    actual_start: Optional[date]
    actual_end: Optional[date]
    sla_days: Optional[int]
    risk_level: Optional[str]
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List["IntegrationTask"] = Relationship(back_populates="case")
    gates: List["ApprovalGate"] = Relationship(back_populates="case")
    risks: List["RiskIssue"] = Relationship(back_populates="case")
    artifacts: List["Artifact"] = Relationship(back_populates="case")
    deployments: List["MPVALDeployment"] = Relationship(back_populates="case")
    actions: List["ActionLog"] = Relationship(back_populates="case")
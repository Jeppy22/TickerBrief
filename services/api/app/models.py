from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Company(BaseModel):
    ticker: str
    name: str
    cik: str


class Evidence(BaseModel):
    id: str
    kind: Literal["reported_fact", "management_statement", "company_identity"]
    title: str
    url: str
    data_url: str
    retrieved_at: str
    excerpt: str
    accession: str | None = None
    filed: str | None = None
    form: str | None = None
    concept: str | None = None
    unit: str | None = None
    value: float | None = None
    start: str | None = None
    end: str | None = None


class Observation(BaseModel):
    value: float
    unit: str
    start: str | None
    end: str
    source_ids: list[str]
    concept: str


class Metric(BaseModel):
    key: str
    label: str
    current: Observation | None = None
    previous: Observation | None = None
    change: float | None = None
    change_percent: float | None = None
    explanation: str
    missing_reason: str | None = None


class Period(BaseModel):
    kind: Literal["annual", "interim_ytd"]
    label: str
    start: str
    end: str
    metrics: list[Metric]


class Claim(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=5, max_length=1200)
    source_ids: list[str] = Field(min_length=1, max_length=8)
    supporting_quotes: list[str] = Field(min_length=1, max_length=8)
    assumption: str | None = Field(default=None, max_length=800)


class InterpretationContent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: list[Claim] = Field(min_length=1, max_length=4)
    bull: list[Claim] = Field(min_length=1, max_length=3)
    bear: list[Claim] = Field(min_length=1, max_length=3)


class Interpretation(BaseModel):
    status: Literal["disabled", "unavailable", "available"]
    message: str
    model: str | None = None
    content: InterpretationContent | None = None


class Report(BaseModel):
    schema_version: int = 1
    id: str
    company: Company
    retrieved_at: str
    generated_at: str
    stale: bool
    overview: str | None
    overview_source_ids: list[str]
    industry: str | None
    periods: list[Period]
    sources: list[Evidence]
    uncertainties: list[str]
    interpretation: Interpretation

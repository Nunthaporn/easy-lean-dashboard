from datetime import date, datetime
from pydantic import BaseModel


class SummaryResponse(BaseModel):
    data_as_of: date | None
    eff_ezlcard: float | None
    min_produce: float | None
    pph: float | None
    sum_pcs: float | None
    operator_count: float | None
    count_line: int
    last_refresh: datetime


class FactoryEffItem(BaseModel):
    factory: str
    eff_pct: float | None


class LatestLineItem(BaseModel):
    factory: str | None
    line: str
    eff_pct: float | None


class PeriodFactoryItem(BaseModel):
    period: str
    factory: str
    eff_pct: float | None


class FiltersResponse(BaseModel):
    min_date: date | None
    max_date: date | None
    factories: list[str]

from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ..database import engine
from ..queries.easylean_queries import (
    FILTERS_SQL,
    LAST_10_DAYS_SQL,
    LATEST_BY_LINE_SQL,
    MONTHLY_BY_LINE_SQL,
    MONTHLY_FACTORY_SQL,
    SCHEMA_SQL,
    SUMMARY_SQL,
)

router = APIRouter(prefix="/api/easylean", tags=["EasyLean"])


def params(start_date: date, end_date: date, factory: str | None):
    if start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must be <= end_date")
    return {"start_date": start_date, "end_date": end_date, "factory": factory or None}


def rows(sql, values):
    try:
        with engine.connect() as conn:
            return [dict(r) for r in conn.execute(sql, values).mappings().all()]
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="Database query failed") from exc


@router.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "connected"}
    except SQLAlchemyError:
        return {"database": "disconnected"}


@router.get("/schema")
def schema():
    return rows(SCHEMA_SQL, {})


@router.get("/filters")
def filters():
    result = rows(FILTERS_SQL, {})[0]
    return {
        "min_date": result.get("min_date"),
        "max_date": result.get("max_date"),
        "factories": result.get("factories") or [],
    }


@router.get("/summary")
def summary(start_date: date, end_date: date, factory: str | None = Query(default=None)):
    result = rows(SUMMARY_SQL, params(start_date, end_date, factory))[0]
    return {**result, "last_refresh": datetime.now().astimezone()}


@router.get("/monthly-by-line")
def monthly_by_line(start_date: date, end_date: date, factory: str | None = None):
    return rows(MONTHLY_BY_LINE_SQL, params(start_date, end_date, factory))


@router.get("/latest-by-line")
def latest_by_line(start_date: date, end_date: date, factory: str | None = None):
    return rows(LATEST_BY_LINE_SQL, params(start_date, end_date, factory))


@router.get("/monthly-by-factory")
def monthly_by_factory(start_date: date, end_date: date, factory: str | None = None):
    return rows(MONTHLY_FACTORY_SQL, params(start_date, end_date, factory))


@router.get("/last-10-days")
def last_10_days(start_date: date, end_date: date, factory: str | None = None):
    return rows(LAST_10_DAYS_SQL, params(start_date, end_date, factory))

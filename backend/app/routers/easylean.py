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


router = APIRouter(
    prefix="/api/easylean",
    tags=["EasyLean"],
)


# =========================================================
# PARAMS
# =========================================================

def make_params(
    start_date: date,
    end_date: date,

    factory: str | None,

    selected_factory: str | None,
    selected_line: str | None,
    selected_line_factory: str | None,
):
    if start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail="start_date must be <= end_date",
        )

    return {
        "start_date": start_date,
        "end_date": end_date,

        "factory":
            factory or None,

        "selected_factory":
            selected_factory or None,

        "selected_line":
            selected_line or None,

        "selected_line_factory":
            selected_line_factory or None,
    }


# =========================================================
# DB EXECUTION
# =========================================================

def rows(sql, values):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                sql,
                values,
            )

            return [
                dict(row)
                for row
                in result.mappings().all()
            ]

    except SQLAlchemyError as exc:
        print(
            "\n========== DATABASE ERROR =========="
        )

        print(exc)

        print(
            "====================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(
                text("SELECT 1")
            )

        return {
            "database":
                "connected"
        }

    except SQLAlchemyError as exc:
        print(exc)

        return {
            "database":
                "disconnected"
        }


# =========================================================
# SCHEMA
# =========================================================

@router.get("/schema")
def schema():
    return rows(
        SCHEMA_SQL,
        {},
    )


# =========================================================
# FILTERS
# =========================================================

@router.get("/filters")
def filters():
    result = rows(
        FILTERS_SQL,
        {},
    )[0]

    return {
        "min_date":
            result.get(
                "min_date"
            ),

        "max_date":
            result.get(
                "max_date"
            ),

        "factories":
            result.get(
                "factories"
            )
            or [],
    }


# =========================================================
# COMMON QUERY PARAMETERS
# =========================================================

def filter_values(
    start_date: date,
    end_date: date,
    factory: str | None,

    selected_factory: str | None,
    selected_line: str | None,
    selected_line_factory: str | None,
):
    return make_params(
        start_date,
        end_date,

        factory,

        selected_factory,
        selected_line,
        selected_line_factory,
    )


# =========================================================
# SUMMARY
# =========================================================

@router.get("/summary")
def summary(
    start_date: date,
    end_date: date,

    factory: str | None =
        Query(default=None),

    selected_factory: str | None =
        Query(default=None),

    selected_line: str | None =
        Query(default=None),

    selected_line_factory: str | None =
        Query(default=None),
):
    values = filter_values(
        start_date,
        end_date,

        factory,

        selected_factory,
        selected_line,
        selected_line_factory,
    )

    result = rows(
        SUMMARY_SQL,
        values,
    )

    if not result:
        return {
            "data_as_of": None,
            "eff_ezlcard": None,
            "min_produce": None,
            "pph": None,
            "sum_pcs": None,
            "operator_count": None,
            "count_line": 0,
            "last_refresh":
                datetime.now()
                .astimezone(),
        }

    return {
        **result[0],

        "last_refresh":
            datetime.now()
            .astimezone(),
    }


# =========================================================
# MONTHLY BY LINE
# =========================================================

@router.get("/monthly-by-line")
def monthly_by_line(
    start_date: date,
    end_date: date,

    factory: str | None =
        Query(default=None),

    selected_factory: str | None =
        Query(default=None),

    selected_line: str | None =
        Query(default=None),

    selected_line_factory: str | None =
        Query(default=None),
):
    return rows(
        MONTHLY_BY_LINE_SQL,

        filter_values(
            start_date,
            end_date,

            factory,

            selected_factory,
            selected_line,
            selected_line_factory,
        ),
    )


# =========================================================
# LATEST BY LINE
# =========================================================

@router.get("/latest-by-line")
def latest_by_line(
    start_date: date,
    end_date: date,

    factory: str | None =
        Query(default=None),

    selected_factory: str | None =
        Query(default=None),

    selected_line: str | None =
        Query(default=None),

    selected_line_factory: str | None =
        Query(default=None),
):
    return rows(
        LATEST_BY_LINE_SQL,

        filter_values(
            start_date,
            end_date,

            factory,

            selected_factory,
            selected_line,
            selected_line_factory,
        ),
    )


# =========================================================
# MONTHLY FACTORY
# =========================================================

@router.get("/monthly-by-factory")
def monthly_by_factory(
    start_date: date,
    end_date: date,

    factory: str | None =
        Query(default=None),

    selected_factory: str | None =
        Query(default=None),

    selected_line: str | None =
        Query(default=None),

    selected_line_factory: str | None =
        Query(default=None),
):
    return rows(
        MONTHLY_FACTORY_SQL,

        filter_values(
            start_date,
            end_date,

            factory,

            selected_factory,
            selected_line,
            selected_line_factory,
        ),
    )


# =========================================================
# LAST 10 DAYS
# =========================================================

@router.get("/last-10-days")
def last_10_days(
    start_date: date,
    end_date: date,

    factory: str | None =
        Query(default=None),

    selected_factory: str | None =
        Query(default=None),

    selected_line: str | None =
        Query(default=None),

    selected_line_factory: str | None =
        Query(default=None),
):
    return rows(
        LAST_10_DAYS_SQL,

        filter_values(
            start_date,
            end_date,

            factory,

            selected_factory,
            selected_line,
            selected_line_factory,
        ),
    )
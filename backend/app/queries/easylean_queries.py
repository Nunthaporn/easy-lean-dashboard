from sqlalchemy import text


# =========================================================
# SAFE EXPRESSIONS
# =========================================================

# แปลงค่าจาก PostgreSQL เป็น numeric อย่างปลอดภัย
#
# รองรับ:
#   1234
#   1234.56
#   "1234"
#   "1,234.56"
#   ""
#   NULL
#
# ค่าว่างจะกลายเป็น NULL
def numeric_expr(column: str) -> str:
    return f"""
    NULLIF(
        REPLACE(
            BTRIM({column}::text),
            ',',
            ''
        ),
        ''
    )::numeric
    """


MIN_OUTPUT = numeric_expr('e."Min Output"')
MIN_INPUT = numeric_expr('e."Min Input"')
OUTPUT_PCS = numeric_expr('e."Output pcs"')
MAN_OUT = numeric_expr('e."Man_%Out"')


# =========================================================
# BASE FILTER
# =========================================================

BASE_FILTER = """
    e."Date"::date BETWEEN :start_date AND :end_date

    AND (
        CAST(:factory AS text) IS NULL
        OR e."FACTORY"::text = CAST(:factory AS text)
    )
"""


# =========================================================
# SUMMARY
# =========================================================

SUMMARY_SQL = text(f"""
WITH filtered AS (
    SELECT
        e.*,

        {MIN_OUTPUT} AS min_output_num,
        {MIN_INPUT} AS min_input_num,
        {OUTPUT_PCS} AS output_pcs_num,
        {MAN_OUT} AS man_out_num

    FROM public.teffdata e

    WHERE {BASE_FILTER}
),

latest AS (
    SELECT
        MAX("Date"::date) AS data_as_of

    FROM filtered
)

SELECT
    latest.data_as_of,

    /* ============================================
       EFF% EZLcard

       Power BI:
       SumOutmin EZL / SumInmin
       EasyLean Line ต้องไม่ blank
       ============================================ */
    (
        SUM(filtered.min_output_num)
        FILTER (
            WHERE
                filtered."EasyLean Line" IS NOT NULL
                AND BTRIM(filtered."EasyLean Line"::text) <> ''
        )
    )
    /
    NULLIF(
        SUM(filtered.min_input_num)
        FILTER (
            WHERE
                filtered."EasyLean Line" IS NOT NULL
                AND BTRIM(filtered."EasyLean Line"::text) <> ''
        ),
        0
    ) AS eff_ezlcard,


    /* Min Produce
       ใช้ Min Output ตาม implementation ปัจจุบัน */
    SUM(filtered.min_output_num) AS min_produce,


    /* ============================================
       PPH

       สูตร DAX เดิม:
       SumInmin / Sum Unique Man
       / 60
       แล้วใช้ SumPcs / WorkHr / Sum Unique Man

       ทางคณิตศาสตร์สุดท้ายย่อได้เป็น:
       SumPcs * 60 / SumInmin

       หมายเหตุ:
       ถ้าต้องการเลียนแบบ DAX ทีละขั้นแบบ 100%
       และมีสูตร Sum Unique Man ให้เพิ่มภายหลัง
       ============================================ */
    (
        SUM(filtered.output_pcs_num) * 60.0
    )
    /
    NULLIF(
        SUM(filtered.min_input_num),
        0
    ) AS pph,


    /* SumPcs. */
    SUM(filtered.output_pcs_num) AS sum_pcs,


    /* #Of Operator
       ใช้ SUM(Man_%Out) ตามข้อมูลปัจจุบัน */
    SUM(filtered.man_out_num) AS operator_count,


    /* CountLine */
    COUNT(
        DISTINCT NULLIF(
            BTRIM(filtered."FAC-LINE"::text),
            ''
        )
    ) AS count_line

FROM filtered

CROSS JOIN latest

GROUP BY latest.data_as_of
""")


# =========================================================
# %EFF Monthly by Line / Factory
# =========================================================

MONTHLY_BY_LINE_SQL = text(f"""
SELECT
    e."FACTORY"::text AS factory,

    SUM({MIN_OUTPUT})
    /
    NULLIF(
        SUM({MIN_INPUT}),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE {BASE_FILTER}

    AND e."FACTORY" IS NOT NULL
    AND BTRIM(e."FACTORY"::text) <> ''

GROUP BY
    e."FACTORY"

ORDER BY
    eff_pct DESC NULLS LAST,
    factory
""")


# =========================================================
# EFF Last date by Line
# =========================================================

LATEST_BY_LINE_SQL = text(f"""
WITH latest AS (
    SELECT
        MAX(e."Date"::date) AS latest_date

    FROM public.teffdata e

    WHERE {BASE_FILTER}
)

SELECT
    e."FACTORY"::text AS factory,

    e."EasyLean Line"::text AS line,

    SUM({MIN_OUTPUT})
    /
    NULLIF(
        SUM({MIN_INPUT}),
        0
    ) AS eff_pct

FROM public.teffdata e

CROSS JOIN latest l

WHERE {BASE_FILTER}

    AND e."Date"::date = l.latest_date

    AND e."EasyLean Line" IS NOT NULL
    AND BTRIM(e."EasyLean Line"::text) <> ''

GROUP BY
    e."FACTORY",
    e."EasyLean Line"

ORDER BY
    e."FACTORY",
    e."EasyLean Line"
""")


# =========================================================
# EFF% by Year, Month and EasyLean Fac
# =========================================================

MONTHLY_FACTORY_SQL = text(f"""
SELECT
    TO_CHAR(
        DATE_TRUNC(
            'month',
            e."Date"::date
        ),
        'YYYY-MM'
    ) AS period,

    e."EasyLean Fac"::text AS factory,

    SUM({MIN_OUTPUT})
    /
    NULLIF(
        SUM({MIN_INPUT}),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE {BASE_FILTER}

    AND e."EasyLean Fac" IS NOT NULL
    AND BTRIM(e."EasyLean Fac"::text) <> ''

GROUP BY
    DATE_TRUNC(
        'month',
        e."Date"::date
    ),
    e."EasyLean Fac"

ORDER BY
    DATE_TRUNC(
        'month',
        e."Date"::date
    ),
    e."EasyLean Fac"
""")


# =========================================================
# Last 10Days EFF% of EasyLean by Factory
# =========================================================

LAST_10_DAYS_SQL = text(f"""
WITH filtered_dates AS (
    SELECT DISTINCT
        e."Date"::date AS d

    FROM public.teffdata e

    WHERE {BASE_FILTER}

    ORDER BY d DESC

    LIMIT 10
)

SELECT
    TO_CHAR(
        e."Date"::date,
        'YYYY-MM-DD'
    ) AS period,

    e."EasyLean Fac"::text AS factory,

    SUM({MIN_OUTPUT})
    /
    NULLIF(
        SUM({MIN_INPUT}),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE {BASE_FILTER}

    AND e."Date"::date IN (
        SELECT d
        FROM filtered_dates
    )

    AND e."EasyLean Fac" IS NOT NULL
    AND BTRIM(e."EasyLean Fac"::text) <> ''

GROUP BY
    e."Date"::date,
    e."EasyLean Fac"

ORDER BY
    e."Date"::date,
    e."EasyLean Fac"
""")


# =========================================================
# FILTERS
# =========================================================

FILTERS_SQL = text("""
SELECT
    MIN(e."Date"::date) AS min_date,

    MAX(e."Date"::date) AS max_date,

    ARRAY_AGG(
        DISTINCT e."FACTORY"::text
        ORDER BY e."FACTORY"::text
    )
    FILTER (
        WHERE
            e."FACTORY" IS NOT NULL
            AND BTRIM(e."FACTORY"::text) <> ''
    ) AS factories

FROM public.teffdata e
""")


# =========================================================
# DATABASE SCHEMA
# =========================================================

SCHEMA_SQL = text("""
SELECT
    ordinal_position,
    column_name,
    data_type

FROM information_schema.columns

WHERE
    table_schema = 'public'
    AND table_name = 'teffdata'

ORDER BY ordinal_position
""")
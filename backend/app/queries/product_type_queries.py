from sqlalchemy import text

from .easylean_queries import BASE_FILTER, DISPLAY_LINE, MIN_INPUT, MIN_OUTPUT


# =========================================================
# %EFF Monthly by Line / Factory
# Product Type source: public.teffdata."PD_Type"
# =========================================================

MONTHLY_BY_LINE_SQL = text(f"""
WITH base AS (
    SELECT
        e."FACTORY"::text AS factory,

        COALESCE(
            NULLIF(
                BTRIM(e."PD_Type"::text),
                ''
            ),
            'UNKNOWN'
        ) AS product_type,

        {MIN_OUTPUT} AS min_output_num,
        {MIN_INPUT} AS min_input_num

    FROM public.teffdata e

    WHERE {BASE_FILTER}

        AND e."FACTORY" IS NOT NULL
        AND BTRIM(e."FACTORY"::text) <> ''
),

factory_total AS (
    SELECT
        factory,
        SUM(min_output_num)
        /
        NULLIF(SUM(min_input_num), 0) AS eff_pct

    FROM base
    GROUP BY factory
),

product_type_eff AS (
    SELECT
        factory,
        product_type,
        SUM(min_output_num)
        /
        NULLIF(SUM(min_input_num), 0) AS eff_pct

    FROM base
    WHERE product_type <> 'UNKNOWN'
    GROUP BY factory, product_type
),

product_json AS (
    SELECT
        factory,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'product_type', product_type,
                'eff_pct', eff_pct
            )
            ORDER BY eff_pct DESC NULLS LAST, product_type
        ) AS product_types

    FROM product_type_eff
    GROUP BY factory
)

SELECT
    f.factory,
    f.eff_pct,
    COALESCE(p.product_types, '[]'::jsonb) AS product_types

FROM factory_total f
LEFT JOIN product_json p
    ON p.factory = f.factory

ORDER BY
    f.eff_pct DESC NULLS LAST,
    f.factory
""")


# =========================================================
# EFF Last date by Line
# Product Type source: public.teffdata."PD_Type"
# =========================================================

LATEST_BY_LINE_SQL = text(f"""
WITH prepared AS (
    SELECT
        e."FACTORY"::text AS factory,
        e."Date"::date AS produce_date,
        {DISPLAY_LINE} AS display_line,

        COALESCE(
            NULLIF(
                BTRIM(e."PD_Type"::text),
                ''
            ),
            'UNKNOWN'
        ) AS product_type,

        {MIN_OUTPUT} AS min_output_num,
        {MIN_INPUT} AS min_input_num

    FROM public.teffdata e

    WHERE {BASE_FILTER}

        AND e."FACTORY" IS NOT NULL
        AND BTRIM(e."FACTORY"::text) <> ''
),

latest_by_factory AS (
    SELECT
        factory,
        MAX(produce_date) AS latest_date

    FROM prepared
    WHERE display_line IS NOT NULL
    GROUP BY factory
),

latest_data AS (
    SELECT p.*

    FROM prepared p
    INNER JOIN latest_by_factory l
        ON p.factory = l.factory
       AND p.produce_date = l.latest_date

    WHERE p.display_line IS NOT NULL
),

line_total AS (
    SELECT
        factory,
        display_line AS line,
        SUM(min_output_num)
        /
        NULLIF(SUM(min_input_num), 0) AS eff_pct

    FROM latest_data
    GROUP BY factory, display_line
),

product_type_eff AS (
    SELECT
        factory,
        display_line AS line,
        product_type,
        SUM(min_output_num)
        /
        NULLIF(SUM(min_input_num), 0) AS eff_pct

    FROM latest_data
    WHERE product_type <> 'UNKNOWN'
    GROUP BY factory, display_line, product_type
),

product_json AS (
    SELECT
        factory,
        line,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'product_type', product_type,
                'eff_pct', eff_pct
            )
            ORDER BY eff_pct DESC NULLS LAST, product_type
        ) AS product_types

    FROM product_type_eff
    GROUP BY factory, line
)

SELECT
    l.factory,
    l.line,
    l.eff_pct,
    COALESCE(p.product_types, '[]'::jsonb) AS product_types

FROM line_total l
LEFT JOIN product_json p
    ON p.factory = l.factory
   AND p.line = l.line

WHERE
    l.eff_pct IS NOT NULL
    AND l.eff_pct > 0

ORDER BY
    CASE l.factory
        WHEN 'G1' THEN 1
        WHEN 'G2' THEN 2
        WHEN 'G3' THEN 3
        WHEN 'G4' THEN 4
        WHEN 'TRM' THEN 5
        WHEN 'EA' THEN 6
        ELSE 99
    END,
    CASE
        WHEN l.line ~ '^[0-9]+$' THEN l.line::integer
        ELSE 999999
    END,
    l.line
""")

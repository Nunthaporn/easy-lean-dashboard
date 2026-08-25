import ReactECharts from "echarts-for-react";

export interface LatestLineRow {
  factory: string | null;
  line: string;
  eff_pct: number | null;
}

interface Props {
  data: LatestLineRow[];
  selectedLine?: string | null;

  onSelect?: (
    line: string,
    factory: string | null
  ) => void;
}

const TARGET = 0.65;

const FACTORY_ORDER = [
  "G1",
  "G2",
  "G3",
  "G4",
  "TRM",
  "EA",
];

export default function LatestLineChart({
  data,
  selectedLine,
  onSelect,
}: Props) {
  // =====================================================
  // FILTER + SORT
  //
  // ตัดข้อมูลที่ไม่มี EFF / EFF = 0 ออกจากกราฟ
  // =====================================================

  const sortedData = data
    .filter((row) => {
      if (
        row.eff_pct === null ||
        row.eff_pct === undefined
      ) {
        return false;
      }

      const value = Number(row.eff_pct);

      if (!Number.isFinite(value)) {
        return false;
      }

      // ถ้า EFF = 0 ถือว่าไม่มีข้อมูล
      if (value <= 0) {
        return false;
      }

      if (
        row.line === null ||
        row.line === undefined ||
        String(row.line).trim() === ""
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const factoryA =
        a.factory ?? "";

      const factoryB =
        b.factory ?? "";

      const indexA =
        FACTORY_ORDER.indexOf(
          factoryA
        );

      const indexB =
        FACTORY_ORDER.indexOf(
          factoryB
        );

      const orderA =
        indexA === -1
          ? FACTORY_ORDER.length
          : indexA;

      const orderB =
        indexB === -1
          ? FACTORY_ORDER.length
          : indexB;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return String(
        a.line
      ).localeCompare(
        String(b.line),
        undefined,
        {
          numeric: true,
        }
      );
    });

  // =====================================================
  // UNIQUE CATEGORY
  // =====================================================

  const categoryKeys =
    sortedData.map(
      (row, index) =>
        `${
          row.factory ?? "-"
        }|${row.line}|${index}`
    );

  // =====================================================
  // FACTORY LABEL
  // =====================================================

  const factoryAxisLabels =
    sortedData.map(() => "");

  FACTORY_ORDER.forEach(
    (factory) => {
      const indexes =
        sortedData
          .map(
            (
              row,
              index
            ) => ({
              row,
              index,
            })
          )
          .filter(
            ({ row }) =>
              (row.factory ??
                "-") ===
              factory
          )
          .map(
            ({ index }) =>
              index
          );

      if (!indexes.length) {
        return;
      }

      const middleIndex =
        indexes[
          Math.floor(
            indexes.length /
              2
          )
        ];

      factoryAxisLabels[
        middleIndex
      ] = factory;
    }
  );

  // =====================================================
  // FACTORY BOUNDARIES
  // =====================================================

  const factoryBoundaries =
    sortedData
      .map(
        (
          row,
          index
        ) => {
          if (
            index >=
            sortedData.length -
              1
          ) {
            return null;
          }

          const currentFactory =
            row.factory ??
            "-";

          const nextFactory =
            sortedData[
              index + 1
            ]?.factory ??
            "-";

          if (
            currentFactory !==
            nextFactory
          ) {
            return (
              index +
              0.5
            );
          }

          return null;
        }
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null
      );

  // =====================================================
  // OPTION
  // =====================================================

  const option = {
    animationDuration: 250,

    tooltip: {
      trigger: "item",

      formatter: (
        params: any
      ) => {
        if (
          params.seriesName ===
          "__factory_separator__"
        ) {
          return "";
        }

        const row =
          sortedData[
            params.dataIndex
          ];

        if (!row) {
          return "";
        }

        const eff =
          row.eff_pct ==
          null
            ? "-"
            : `${(
                Number(
                  row.eff_pct
                ) * 100
              ).toFixed(
                1
              )}%`;

        return `
          <strong>${
            row.factory ??
            "-"
          }</strong>
          <br/>
          Line: ${
            row.line
          }
          <br/>
          EFF%: ${eff}
        `;
      },
    },

    grid: {
      left: 50,
      right: 55,
      top: 35,
      bottom: 62,
      containLabel: true,
    },

    // ===================================================
    // X AXIS
    // ===================================================

    xAxis: [
      {
        type:
          "category",

        data:
          categoryKeys,

        boundaryGap:
          true,

        axisTick: {
          show: false,
        },

        axisLine: {
          show: true,

          lineStyle: {
            color:
              "#cfd6e2",
          },
        },

        axisLabel: {
          interval: 0,
          fontSize: 10,
          color: "#555",
          margin: 7,

          formatter: (
            value: string
          ) => {
            const parts =
              value.split(
                "|"
              );

            return (
              parts[1] ??
              value
            );
          },
        },
      },

      // =================================================
      // FACTORY AXIS
      // =================================================

      {
        type:
          "category",

        data:
          factoryAxisLabels,

        position:
          "bottom",

        offset: 25,

        boundaryGap:
          true,

        axisTick: {
          show: false,
        },

        axisLine: {
          show: false,
        },

        axisLabel: {
          interval: 0,
          fontSize: 11,
          fontWeight:
            600,
          color:
            "#606773",
          margin: 3,
        },
      },

      // =================================================
      // HIDDEN AXIS FOR FACTORY SEPARATOR
      // =================================================

      {
        type: "value",

        min: -0.5,

        max:
          sortedData.length >
          0
            ? sortedData.length -
              0.5
            : 0.5,

        show: false,

        position:
          "top",
      },
    ],

    // ===================================================
    // Y AXIS
    // ===================================================

    yAxis: {
      type: "value",

      min: 0,

      max: (
        value: any
      ) => {
        if (
          value.max <= 1
        ) {
          return 1;
        }

        return (
          Math.ceil(
            value.max *
              10
          ) / 10
        );
      },

      axisLabel: {
        formatter: (
          value: number
        ) =>
          `${Math.round(
            value * 100
          )}%`,
      },

      // ===============================================
      // ซ่อนเส้นดำด้านซ้าย
      // ===============================================

      axisLine: {
        show: false,
      },

      axisTick: {
        show: false,
      },

      splitLine: {
        show: true,

        lineStyle: {
          color:
            "#e8ecf2",

          width: 1,
        },
      },
    },

    // ===================================================
    // SERIES
    // ===================================================

    series: [
      // =================================================
      // BAR
      // =================================================

      {
        name: "EFF%",

        type: "bar",

        xAxisIndex: 0,

        barMaxWidth:
          28,

        barCategoryGap:
          "20%",

        data:
          sortedData.map(
            (row) => {
              const value =
                Number(
                  row.eff_pct
                );

              const active =
                !selectedLine ||
                selectedLine ===
                  row.line;

              return {
                value,

                line:
                  row.line,

                factory:
                  row.factory,

                itemStyle: {
                  borderRadius:
                    [
                      5,
                      5,
                      0,
                      0,
                    ],

                  opacity:
                    active
                      ? 1
                      : 0.3,

                  color:
                    value >=
                    0.8
                      ? "#45bd69"
                      : value >=
                          TARGET
                        ? "#f4cc73"
                        : "#f31b58",
                },
              };
            }
          ),

        label: {
          show: true,

          position:
            "top",

          distance: 3,

          fontSize: 10,

          color:
            "#333",

          formatter: (
            params: any
          ) =>
            `${Math.round(
              Number(
                params.value
              ) * 100
            )}%`,
        },

        // ===============================================
        // TARGET
        // ===============================================

        markLine: {
          silent: true,

          symbol:
            "none",

          data: [
            {
              yAxis:
                TARGET,

              label: {
                show:
                  true,

                formatter:
                  "Target 65%",

                position:
                  "insideEndTop",

                color:
                  "#3e66b3",

                fontWeight:
                  600,

                fontSize:
                  11,

                padding: [
                  2,
                  5,
                ],

                backgroundColor:
                  "rgba(255,255,255,0.90)",

                borderRadius:
                  3,
              },

              lineStyle: {
                type:
                  "dashed",

                width: 2,

                color:
                  "#5275d5",
              },
            },
          ],
        },
      },

      // =================================================
      // FACTORY SEPARATOR
      // =================================================

      {
        name:
          "__factory_separator__",

        type: "line",

        xAxisIndex: 2,

        silent: true,

        symbol:
          "none",

        lineStyle: {
          opacity: 0,
        },

        data: [],

        markLine: {
          silent: true,

          symbol:
            "none",

          label: {
            show: false,
          },

          data:
            factoryBoundaries.map(
              (x) => ({
                xAxis: x,

                lineStyle: {
                  color:
                    "#b8c1cd",

                  type:
                    "dashed",

                  width:
                    1,

                  opacity:
                    0.65,
                },

                label: {
                  show:
                    false,
                },
              })
            ),
        },
      },
    ],
  };

  // =====================================================
  // CLICK
  // =====================================================

  const handleClick = (
    params: any
  ) => {
    if (
      params.componentType !==
        "series" ||
      params.seriesType !==
        "bar"
    ) {
      return;
    }

    const row =
      sortedData[
        params.dataIndex
      ];

    if (
      !row ||
      !onSelect
    ) {
      return;
    }

    onSelect(
      String(
        row.line
      ),
      row.factory
    );
  };

  return (
    <ReactECharts
      option={option}
      notMerge={
        true
      }
      lazyUpdate={
        true
      }

      style={{
        width:
          "100%",
        height:
          "290px",
      }}

      onEvents={{
        click:
          handleClick,
      }}
    />
  );
}
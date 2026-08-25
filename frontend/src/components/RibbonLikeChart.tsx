import ReactECharts from "echarts-for-react";

interface Row {
  period: string;
  factory: string;
  eff_pct: number | null;
}

interface Props {
  data: Row[];

  mode?: "monthly" | "daily";

  selectedFactory?:
    string | null;

  onFactorySelect?: (
    factory: string
  ) => void;
}

const TARGET = 0.65;

export default function RibbonLikeChart({
  data,
  mode = "monthly",
  selectedFactory,
  onFactorySelect,
}: Props) {
  const periods = Array.from(
    new Set(
      data.map(
        (row) => row.period
      )
    )
  ).sort();

  const factories = Array.from(
    new Set(
      data.map(
        (row) => row.factory
      )
    )
  );

  const factorySeries =
    factories.map((factory) => {
      const active =
        !selectedFactory ||
        selectedFactory ===
          factory;

      return {
        name: factory,

        type: "line",

        smooth: true,

        symbol: "circle",

        symbolSize:
          active ? 7 : 5,

        lineStyle: {
          width:
            active
              ? 3
              : 2,

          opacity:
            active
              ? 1
              : 0.18,
        },

        itemStyle: {
          opacity:
            active
              ? 1
              : 0.18,
        },

        emphasis: {
          focus: "series",
        },

        data:
          periods.map(
            (period) => {
              const row =
                data.find(
                  (item) =>
                    item.period ===
                      period &&
                    item.factory ===
                      factory
                );

              return (
                row?.eff_pct ??
                null
              );
            }
          ),
      };
    });

  const option = {
    tooltip: {
      trigger: "axis",

      valueFormatter: (
        value: number
      ) =>
        value == null
          ? "-"
          : `${(
              Number(value) * 100
            ).toFixed(1)}%`,
    },

    legend: {
      top: 0,
      type: "scroll",
    },

    grid: {
      left: 50,
      right: 25,
      top: 45,
      bottom: 40,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      boundaryGap: false,
      data: periods,

      axisLabel: {
        formatter: (
          value: string
        ) => {
          if (
            mode ===
            "monthly"
          ) {
            return value;
          }

          return value.slice(5);
        },
      },
    },

    yAxis: {
      type: "value",
      min: 0,

      axisLabel: {
        formatter: (
          value: number
        ) =>
          `${Math.round(
            value * 100
          )}%`,
      },

      splitLine: {
        lineStyle: {
          color: "#e7ebf2",
        },
      },
    },

    series: [
      ...factorySeries,

      {
        name: "Target",
        type: "line",
        symbol: "none",
        silent: true,

        data:
          periods.map(
            () => TARGET
          ),

        lineStyle: {
          type: "dashed",
          width: 2,
          color: "#25a7c4",
        },

        label: {
          show: false,
        },
      },
    ],
  };

  const handleClick = (
    params: any
  ) => {
    if (
      params.componentType !==
      "series"
    ) {
      return;
    }

    if (
      params.seriesName ===
      "Target"
    ) {
      return;
    }

    if (
      params.seriesName &&
      onFactorySelect
    ) {
      onFactorySelect(
        String(
          params.seriesName
        )
      );
    }
  };

  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={true}

      style={{
        width: "100%",
        height: "280px",
      }}

      onEvents={{
        click: handleClick,
      }}
    />
  );
}
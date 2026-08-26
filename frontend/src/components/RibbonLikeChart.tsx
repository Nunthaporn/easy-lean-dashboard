import ReactECharts from "echarts-for-react";

interface Row {
  period: string;
  factory: string;
  eff_pct: number | null;
}

interface Props {
  data: Row[];
  mode?: "monthly" | "daily";
  selectedFactory?: string | null;
  onFactorySelect?: (factory: string) => void;
}

const FACTORY_ORDER = ["G1", "G2", "G3", "G4", "TRM", "EA"];

const COLORS: Record<string, string> = {
  G1: "#f04486",
  G2: "#ffd126",
  G3: "#ff7917",
  G4: "#15b7c6",
  TRM: "#2889dc",
  EA: "#54df0b",
};

const pct = (value: number | null | undefined) =>
  value == null ? "-" : `${(value * 100).toFixed(1)}%`;

export default function RibbonLikeChart({
  data,
  mode = "monthly",
  selectedFactory,
  onFactorySelect,
}: Props) {
  const periods = Array.from(new Set(data.map((row) => row.period))).sort();

  const factories = FACTORY_ORDER.filter((factory) =>
    data.some((row) => row.factory === factory)
  );

  const valueMap = new Map<string, number | null>();
  data.forEach((row) => {
    valueMap.set(`${row.period}__${row.factory}`, row.eff_pct);
  });

  // Ranking is calculated independently for every period. The Y coordinate is
  // the rank, while the label still shows the real EFF%. This produces the
  // ribbon-crossing behaviour without using a misleading stacked percentage.
  const rankMap = new Map<string, number>();

  periods.forEach((period) => {
    const ranked = factories
      .map((factory) => ({
        factory,
        value: valueMap.get(`${period}__${factory}`) ?? null,
      }))
      .filter((item) => item.value != null)
      .sort((a, b) => Number(b.value) - Number(a.value));

    ranked.forEach((item, index) => {
      rankMap.set(`${period}__${item.factory}`, index + 1);
    });
  });

  const series = factories.map((factory) => {
    const active = !selectedFactory || selectedFactory === factory;
    const color = COLORS[factory] ?? "#64748b";

    return {
      name: factory,
      type: "line",
      smooth: 0.48,
      connectNulls: false,
      symbol: "roundRect",
      symbolSize: [76, 28],
      showSymbol: true,
      z: active ? 5 : 2,

      lineStyle: {
        width: 20,
        color,
        opacity: active ? 0.58 : 0.12,
        cap: "round",
        join: "round",
      },

      itemStyle: {
        color,
        opacity: active ? 1 : 0.2,
        borderWidth: 0,
      },

      emphasis: {
        focus: "series",
        lineStyle: {
          width: 24,
          opacity: 0.72,
        },
        itemStyle: {
          opacity: 1,
        },
      },

      label: {
        show: true,
        position: "inside",
        color: factory === "G2" || factory === "G3" || factory === "EA" ? "#111827" : "#ffffff",
        fontSize: 10,
        fontWeight: 700,
        formatter: (params: any) => pct(params?.data?.eff),
      },

      data: periods.map((period) => {
        const eff = valueMap.get(`${period}__${factory}`) ?? null;
        const rank = rankMap.get(`${period}__${factory}`);

        if (eff == null || rank == null) {
          return null;
        }

        return {
          value: rank,
          eff,
          period,
          factory,
        };
      }),
    };
  });

  const option = {
    animationDuration: 650,
    animationDurationUpdate: 450,
    color: factories.map((factory) => COLORS[factory]),

    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(148, 163, 184, 0.08)",
        },
      },
      formatter: (params: any) => {
        const rows = Array.isArray(params) ? params : [params];
        const period = rows[0]?.axisValueLabel ?? rows[0]?.name ?? "";

        const body = rows
          .filter((row: any) => row?.data?.eff != null)
          .sort((a: any, b: any) => Number(b.data.eff) - Number(a.data.eff))
          .map(
            (row: any) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin:5px 0;">` +
              `<span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${row.color};margin-right:7px;"></i>${row.seriesName}</span>` +
              `<b>${pct(row.data.eff)}</b></div>`
          )
          .join("");

        return `<div style="min-width:160px"><b>${period}</b><div style="margin-top:7px">${body}</div></div>`;
      },
    },

    legend: {
      top: 0,
      left: "center",
      data: factories,
      itemWidth: 11,
      itemHeight: 11,
      itemGap: 14,
      textStyle: {
        color: "#5b6472",
        fontSize: 11,
      },
    },

    grid: {
      left: 16,
      right: 16,
      top: 42,
      bottom: 34,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      boundaryGap: true,
      data: periods,
      axisTick: { show: false },
      axisLine: {
        lineStyle: {
          color: "#d9e1ea",
        },
      },
      axisLabel: {
        color: "#5b6472",
        fontSize: 10,
        margin: 12,
        formatter: (value: string) =>
          mode === "monthly" ? value : value.slice(5),
      },
    },

    yAxis: {
      type: "value",
      inverse: true,
      min: 0.45,
      max: Math.max(factories.length + 0.55, 2),
      interval: 1,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#edf1f5",
          type: "dashed",
        },
      },
      name: "EFF%",
      nameLocation: "middle",
      nameGap: 8,
      nameTextStyle: {
        color: "#556070",
        fontSize: 10,
        fontWeight: 600,
      },
    },

    series,
  };

  const handleClick = (params: any) => {
    if (params.componentType !== "series") return;
    if (params.seriesName && onFactorySelect) {
      onFactorySelect(String(params.seriesName));
    }
  };

  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={true}
      style={{
        width: "100%",
        height: "300px",
      }}
      onEvents={{
        click: handleClick,
      }}
    />
  );
}

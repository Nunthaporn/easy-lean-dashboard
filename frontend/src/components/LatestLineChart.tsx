// frontend/src/components/LatestLineChart.tsx

import ReactECharts from "echarts-for-react";

export interface LatestLineRow {
  factory: string | null;
  line: string;
  eff_pct: number | null;
}

interface Props {
  data: LatestLineRow[];
  selectedLine?: string | null;
  onSelect?: (line: string) => void;
}

const TARGET = 0.65;

export default function LatestLineChart({
  data,
  selectedLine,
  onSelect,
}: Props) {
  const sortedData = [...data].sort(
    (a, b) => (a.eff_pct ?? 0) - (b.eff_pct ?? 0)
  );

  const option = {
    animationDuration: 250,

    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const row = sortedData[params.dataIndex];
        if (!row) return "";

        const eff = row.eff_pct ?? 0;

        return `
          <strong>Line ${row.line}</strong><br/>
          Factory: ${row.factory ?? "-"}<br/>
          EFF: ${(eff * 100).toFixed(1)}%<br/>
          ${
            eff >= TARGET
              ? "Status: Above Target"
              : "Status: Below Target"
          }
        `;
      },
    },

    grid: {
      left: 50,
      right: 30,
      top: 25,
      bottom: 50,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: sortedData.map((row) => row.line),
      axisLabel: {
        interval: 0,
        fontSize: 10,
      },
    },

    yAxis: {
      type: "value",
      min: 0,
      axisLabel: {
        formatter: (value: number) => `${Math.round(value * 100)}%`,
      },
      splitLine: {
        lineStyle: {
          color: "#e7ebf2",
        },
      },
    },

    series: [
      {
        name: "EFF%",
        type: "bar",
        barMaxWidth: 28,

        data: sortedData.map((row) => {
          const value = row.eff_pct ?? 0;
          const active =
            !selectedLine || selectedLine === row.line;

          return {
            value,
            line: row.line,
            factory: row.factory,

            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              opacity: active ? 1 : 0.25,
              color: value >= TARGET ? "#46b96a" : "#f21d5b",
            },
          };
        }),

        label: {
          show: true,
          position: "top",
          formatter: (params: any) =>
            `${Math.round(Number(params.value) * 100)}%`,
        },

        markLine: {
          silent: true,
          symbol: "none",
          data: [
            {
              yAxis: TARGET,
              label: {
                formatter: "Target 65%",
                position: "end",
              },
            },
          ],
          lineStyle: {
            type: "dashed",
            width: 2,
            color: "#5275d5",
          },
        },
      },
    ],
  };

  const handleClick = (params: any) => {
    const line =
      params.data?.line ??
      sortedData[params.dataIndex]?.line;

    if (line && onSelect) {
      onSelect(String(line));
    }
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: "100%", height: "300px" }}
      onEvents={{ click: handleClick }}
    />
  );
}
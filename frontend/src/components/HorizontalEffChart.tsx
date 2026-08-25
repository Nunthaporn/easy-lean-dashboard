import ReactECharts from "echarts-for-react";

interface ProductTypeEff {
  product_type: string;
  eff_pct: number | null;
}

export interface FactoryEffRow {
  factory: string;
  eff_pct: number | null;
  product_types?: ProductTypeEff[];
}

interface Props {
  data: FactoryEffRow[];
  selectedFactory?: string | null;
  onSelect?: (factory: string) => void;
}

const TARGET = 0.65;

function productTypeHtml(productTypes?: ProductTypeEff[]) {
  if (!productTypes?.length) {
    return `<div style="margin-top:8px;color:#94a3b8">Eff% by Product Type: No data</div>`;
  }

  const rows = productTypes
    .map((item) => {
      const value = item.eff_pct == null
        ? "-"
        : `${(Number(item.eff_pct) * 100).toFixed(1)}%`;

      return `<div style="display:flex;justify-content:space-between;gap:18px;margin-top:3px">
        <span>${item.product_type}</span>
        <strong>${value}</strong>
      </div>`;
    })
    .join("");

  return `
    <div style="margin-top:9px;padding-top:7px;border-top:1px solid #e2e8f0">
      <strong>Eff% by Product Type</strong>
      ${rows}
    </div>
  `;
}

export default function HorizontalEffChart({
  data,
  selectedFactory,
  onSelect,
}: Props) {
  const option = {
    animationDuration: 250,

    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params: any) => {
        const row = data[params.dataIndex];
        if (!row) return "";

        const eff = row.eff_pct ?? 0;

        return `
          <div style="min-width:220px">
            <strong>${row.factory}</strong><br/>
            EFF: ${(eff * 100).toFixed(1)}%<br/>
            Target: 65.0%
            ${productTypeHtml(row.product_types)}
          </div>
        `;
      },
    },

    grid: {
      left: 50,
      right: 55,
      top: 42,
      bottom: 35,
      containLabel: true,
    },

    graphic: [
      {
        type: "text",
        left: "65%",
        top: 8,
        silent: true,
        z: 100,
        style: {
          text: "Target 65%",
          fill: "#3e66b3",
          font: "600 12px sans-serif",
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.94)",
          padding: [2, 4],
        },
      },
    ],

    xAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: {
        formatter: (value: number) => `${Math.round(value * 100)}%`,
      },
      splitLine: {
        lineStyle: { color: "#e7ebf2" },
      },
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: data.map((row) => row.factory),
      axisTick: { show: false },
      axisLine: { show: false },
    },

    series: [
      {
        name: "EFF%",
        type: "bar",
        barWidth: 24,
        data: data.map((row) => {
          const value = row.eff_pct ?? 0;
          const active = !selectedFactory || selectedFactory === row.factory;

          return {
            value,
            factory: row.factory,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              opacity: active ? 1 : 0.25,
              color:
                value >= 0.8
                  ? "#46b96a"
                  : value >= TARGET
                    ? "#f1c75b"
                    : "#f21d5b",
            },
          };
        }),
        label: {
          show: true,
          position: "right",
          formatter: (params: any) =>
            `${(Number(params.value) * 100).toFixed(1)}%`,
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: {
            show: false,
          },
          data: [
            {
              xAxis: TARGET,
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
    if (params.componentType !== "series" || params.seriesType !== "bar") {
      return;
    }

    const selected =
      params.data?.factory ?? data[params.dataIndex]?.factory;

    if (selected && onSelect) {
      onSelect(String(selected));
    }
  };

  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={true}
      style={{ width: "100%", height: "290px" }}
      onEvents={{ click: handleClick }}
    />
  );
}

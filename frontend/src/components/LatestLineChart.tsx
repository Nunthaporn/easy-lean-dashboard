import ReactECharts from "echarts-for-react";

interface ProductTypeEff {
  product_type: string;
  eff_pct: number | null;
}

export interface LatestLineRow {
  factory: string | null;
  line: string;
  eff_pct: number | null;
  product_types?: ProductTypeEff[];
}

interface Props {
  data: LatestLineRow[];
  selectedLine?: string | null;
  onSelect?: (line: string, factory: string | null) => void;
}

const TARGET = 0.65;
const FACTORY_ORDER = ["G1", "G2", "G3", "G4", "TRM", "EA"];

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

export default function LatestLineChart({
  data,
  selectedLine,
  onSelect,
}: Props) {
  const sortedData = [...data]
    .filter((row) => {
      const value = Number(row.eff_pct);
      return (
        row.eff_pct != null &&
        Number.isFinite(value) &&
        value > 0 &&
        row.line != null &&
        String(row.line).trim() !== ""
      );
    })
    .sort((a, b) => {
      const aIndex = FACTORY_ORDER.indexOf(a.factory ?? "");
      const bIndex = FACTORY_ORDER.indexOf(b.factory ?? "");
      const aOrder = aIndex === -1 ? FACTORY_ORDER.length : aIndex;
      const bOrder = bIndex === -1 ? FACTORY_ORDER.length : bIndex;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return String(a.line).localeCompare(String(b.line), undefined, {
        numeric: true,
      });
    });

  const categoryKeys = sortedData.map(
    (row, index) => `${row.factory ?? "-"}|${row.line}|${index}`
  );

  const factoryAxisLabels = sortedData.map(() => "");

  FACTORY_ORDER.forEach((factory) => {
    const indexes = sortedData
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => (row.factory ?? "-") === factory)
      .map(({ index }) => index);

    if (!indexes.length) return;

    const middleIndex = indexes[Math.floor(indexes.length / 2)];
    factoryAxisLabels[middleIndex] = factory;
  });

  const factoryBoundaries = sortedData
    .map((row, index) => {
      if (index >= sortedData.length - 1) return null;
      const currentFactory = row.factory ?? "-";
      const nextFactory = sortedData[index + 1]?.factory ?? "-";
      return currentFactory !== nextFactory ? index + 0.5 : null;
    })
    .filter((value): value is number => value !== null);

  const option = {
    animationDuration: 250,
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params: any) => {
        if (params.seriesName === "__factory_separator__") return "";

        const row = sortedData[params.dataIndex];
        if (!row) return "";

        const eff = row.eff_pct == null
          ? "-"
          : `${(Number(row.eff_pct) * 100).toFixed(1)}%`;

        return `
          <div style="min-width:230px">
            <strong>${row.factory ?? "-"}</strong><br/>
            Line: ${row.line}<br/>
            EFF%: ${eff}
            ${productTypeHtml(row.product_types)}
          </div>
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
    xAxis: [
      {
        type: "category",
        data: categoryKeys,
        boundaryGap: true,
        axisTick: { show: false },
        axisLine: {
          show: true,
          lineStyle: { color: "#cfd6e2" },
        },
        axisLabel: {
          interval: 0,
          fontSize: 10,
          color: "#555",
          margin: 7,
          formatter: (value: string) => value.split("|")[1] ?? value,
        },
      },
      {
        type: "category",
        data: factoryAxisLabels,
        position: "bottom",
        offset: 25,
        boundaryGap: true,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          interval: 0,
          fontSize: 11,
          fontWeight: 600,
          color: "#606773",
          margin: 3,
        },
      },
      {
        type: "value",
        min: -0.5,
        max: sortedData.length > 0 ? sortedData.length - 0.5 : 0.5,
        show: false,
        position: "top",
      },
    ],
    yAxis: {
      type: "value",
      min: 0,
      max: (value: any) =>
        value.max <= 1 ? 1 : Math.ceil(value.max * 10) / 10,
      axisLabel: {
        formatter: (value: number) => `${Math.round(value * 100)}%`,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: "#e8ecf2", width: 1 },
      },
    },
    series: [
      {
        name: "EFF%",
        type: "bar",
        xAxisIndex: 0,
        barMaxWidth: 28,
        barCategoryGap: "20%",
        data: sortedData.map((row) => {
          const value = Number(row.eff_pct);
          const active = !selectedLine || selectedLine === row.line;

          return {
            value,
            line: row.line,
            factory: row.factory,
            itemStyle: {
              borderRadius: [5, 5, 0, 0],
              opacity: active ? 1 : 0.3,
              color:
                value >= 0.8
                  ? "#45bd69"
                  : value >= TARGET
                    ? "#f4cc73"
                    : "#f31b58",
            },
          };
        }),
        label: {
          show: true,
          position: "top",
          distance: 3,
          fontSize: 10,
          color: "#333",
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
                show: true,
                formatter: "Target 65%",
                position: "insideEndTop",
                color: "#3e66b3",
                fontWeight: 600,
                fontSize: 11,
                padding: [2, 5],
                backgroundColor: "rgba(255,255,255,0.90)",
                borderRadius: 3,
              },
              lineStyle: {
                type: "dashed",
                width: 2,
                color: "#5275d5",
              },
            },
          ],
        },
      },
      {
        name: "__factory_separator__",
        type: "line",
        xAxisIndex: 2,
        silent: true,
        symbol: "none",
        lineStyle: { opacity: 0 },
        data: [],
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          data: factoryBoundaries.map((x) => ({
            xAxis: x,
            lineStyle: {
              color: "#b8c1cd",
              type: "dashed",
              width: 1,
              opacity: 0.65,
            },
            label: { show: false },
          })),
        },
      },
    ],
  };

  const handleClick = (params: any) => {
    if (params.componentType !== "series" || params.seriesType !== "bar") {
      return;
    }

    const row = sortedData[params.dataIndex];
    if (!row || !onSelect) return;

    onSelect(String(row.line), row.factory);
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

type Props = { label: string; value: string }
export default function KpiCard({label, value}: Props) {
  return <div className="kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div></div>
}

type MetricCardProps = {
  label: string
  value: number | string
  detail: string
  icon: string
  tone?: string
}

function MetricCard({ label, value, detail, icon, tone = '' }: MetricCardProps) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

export default MetricCard

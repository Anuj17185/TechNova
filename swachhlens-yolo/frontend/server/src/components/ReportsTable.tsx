import type { Report } from './reportTypes'

type ReportsTableProps = {
  reports: Report[]
  formatDate: (value?: string) => string
  formatCategory: (value?: string | null) => string
  onStatusChange: (reportId: string, status: string) => void
}

function ReportsTable({ reports, formatDate, formatCategory, onStatusChange }: ReportsTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Report</th><th>Classification</th><th>Location</th><th>Reported</th><th>Status</th></tr></thead>
        <tbody>{reports.map((report) => (
          <tr key={report.report_id}>
            <td><div className="report-name"><span className="report-symbol">{report.ai_category ? '✦' : '○'}</span><div><strong>#{report.report_id.slice(0, 8)}</strong><small>{report.comment || 'No note added'}</small></div></div></td>
            <td><strong>{formatCategory(report.ai_category)}</strong><small className="confidence">{report.ai_confidence ? `${Math.round(report.ai_confidence * 100)}% confidence` : 'Awaiting analysis'}</small></td>
            <td><span className="coordinates">{report.latitude?.toFixed(4) ?? '—'}, {report.longitude?.toFixed(4) ?? '—'}</span></td>
            <td><strong>{formatDate(report.created_at || report.captured_at)}</strong><small>{report.citizen_id || 'Unknown citizen'}</small></td>
            <td><select className={`status status-select ${report.status === 'completed' ? 'completed' : report.status === 'working' ? 'working' : 'submitted'}`} value={report.status === 'working' || report.status === 'completed' ? report.status : 'submitted'} onChange={(event) => onStatusChange(report.report_id, event.target.value)} aria-label={`Update status for report ${report.report_id}`}>
              <option value="submitted" disabled>Submitted</option>
              <option value="working">Working</option>
              <option value="completed">Completed</option>
            </select></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export default ReportsTable

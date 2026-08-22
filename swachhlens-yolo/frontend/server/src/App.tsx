import { useEffect, useMemo, useState } from 'react'
import './App.css'
import MetricCard from './components/MetricCard'
import Navbar from './components/Navbar'
import ReportsTable from './components/ReportsTable'
import HeatmapView from './components/HeatmapView'
import type { Report } from './components/reportTypes'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

function formatDate(value?: string) {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCategory(value?: string | null) {
  return value ? value.replaceAll('_', ' ') : 'Unclassified'
}

function App() {
  const [reports, setReports] = useState<Report[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<'reports' | 'heatmap'>('reports')

  const loadReports = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/reports`)
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
      setReports(await response.json() as Report[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchReports = window.setTimeout(() => { void loadReports() }, 0)
    return () => window.clearTimeout(fetchReports)
  }, [])

  const categories = useMemo(() => [...new Set(reports.map((report) => report.ai_category).filter(Boolean))] as string[], [reports])
  const filteredReports = useMemo(() => reports.filter((report) => {
    const searchable = `${report.report_id} ${report.citizen_id ?? ''} ${report.comment ?? ''} ${report.ai_category ?? ''}`.toLowerCase()
    return searchable.includes(query.toLowerCase()) && (status === 'all' || report.status === status) && (category === 'all' || report.ai_category === category)
  }), [reports, query, status, category])
  const submitted = reports.filter((report) => report.status === 'submitted').length
  const working = reports.filter((report) => report.status === 'working').length
  const completed = reports.filter((report) => report.status === 'completed').length

  const updateStatus = async (reportId: string, nextStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) throw new Error(`Status update failed with status ${response.status}`)
      setReports((currentReports) => currentReports.map((report) => report.report_id === reportId ? { ...report, status: nextStatus } : report))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update report status')
    }
  }

  return (
    <div className="app-shell">
      <Navbar reportCount={reports.length} activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content" id="reports">
        <header className="topbar"><div><p className="eyebrow">Saturday, August 22, 2026</p><h1>Report overview</h1></div><button className="refresh-button" onClick={() => void loadReports()} disabled={loading}><span className={loading ? 'spin' : ''}>↻</span> Refresh data</button></header>
        <section className="intro-row"><p className="lede">Keep an eye on incoming sanitation reports and AI classifications.</p><div className="connection"><span className="online-dot" /> API connected</div></section>

        {activeView === 'heatmap' ? <HeatmapView reports={reports} /> : <>
        <section className="metric-grid" aria-label="Report summary">
          <MetricCard label="Total reports" value={reports.length} detail="All time submissions" icon="⌁" tone="accent" />
          <MetricCard label="Submitted" value={submitted} detail={`${reports.length ? Math.round(submitted / reports.length * 100) : 0}% awaiting assignment`} icon="•" tone="green" />
          <MetricCard label="In progress" value={working} detail={`${reports.length ? Math.round(working / reports.length * 100) : 0}% being handled`} icon="→" tone="yellow" />
          <MetricCard label="Completed" value={completed} detail={`${reports.length ? Math.round(completed / reports.length * 100) : 0}% resolved reports`} icon="✓" tone="coral" />
        </section>
        </>}

        {activeView === 'reports' && <section className="reports-panel">
            <div className="panel-heading">
                <div>
                    <h2>Recent reports</h2>
                    <p>Review and track reports from the field</p>
                </div>
                <span className="result-count">{filteredReports.length} visible</span>
            </div>
            <div className="toolbar">
                <label className="search-box">
                    <span>⌕</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports, citizens, notes..." />
                </label>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="all">All statuses</option><option value="submitted">Submitted</option>
                    <option value="working">Working</option><option value="completed">Completed</option>
                </select>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}
                </select>
            </div>
          {error && <div className="error-state">Could not reach the API. <span>{error}</span></div>}
          {loading ? <div className="empty-state">Loading reports...</div> : !error && filteredReports.length === 0 ? <div className="empty-state"><strong>No reports match these filters.</strong><span>Try clearing your search or filters.</span></div> : <ReportsTable reports={filteredReports} formatDate={formatDate} formatCategory={formatCategory} onStatusChange={updateStatus} />}
        </section>}
        <footer className="footer-note">SwachhLens monitoring system <span>•</span> Live report feed</footer>
      </main>
    </div>
  )
}

export default App

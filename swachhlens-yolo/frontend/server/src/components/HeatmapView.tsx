import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import 'leaflet/dist/leaflet.css'
import type { Report } from './reportTypes'

type HeatmapViewProps = {
  reports: Report[]
}

function HeatLayer({ reports }: HeatmapViewProps) {
  const map = useMap()

  useEffect(() => {
    const points = reports.map((report) => [report.latitude as number, report.longitude as number, 0.7] as [number, number, number])
    const heatLayer = (L as unknown as { heatLayer: (heatPoints: [number, number, number][], options: Record<string, unknown>) => L.Layer }).heatLayer
    const layer = heatLayer(points, { radius: 32, blur: 24, maxZoom: 17, minOpacity: 0.55, gradient: { 0.25: '#c4d86a', 0.55: '#f2c14e', 0.8: '#e27d58', 1: '#ba3f4b' } }).addTo(map)
    return () => { map.removeLayer(layer) }
  }, [map, reports])

  return null
}

function FitToReports({ reports }: HeatmapViewProps) {
  const map = useMap()

  useEffect(() => {
    if (reports.length > 1) {
      map.fitBounds(reports.map((report) => [report.latitude as number, report.longitude as number]), { padding: [36, 36], maxZoom: 15 })
    } else if (reports.length === 1) {
      map.setView([reports[0].latitude as number, reports[0].longitude as number], 15)
    }
  }, [map, reports])

  return null
}

function HeatmapView({ reports }: HeatmapViewProps) {
  const locatedReports = reports.filter((report) => report.latitude != null && report.longitude != null && (report.status === 'submitted' || report.status === 'working'))
  const center: [number, number] = locatedReports.length ? [locatedReports[0].latitude as number, locatedReports[0].longitude as number] : [20.5937, 78.9629]

  return (
    <section className="heatmap-panel">
      <div className="heatmap-heading"><div><p className="eyebrow">FIELD ACTIVITY</p><h2>Submitted &amp; working reports</h2><p>Live location density across active sanitation reports.</p></div><div className="heatmap-count"><strong>{locatedReports.length}</strong><span>active locations</span></div></div>
    {locatedReports.length > 0 ? (
        <MapContainer
            center={center}
            zoom={6}
            scrollWheelZoom
            zoomControl={false}
            className="heatmap-map"
        >
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <HeatLayer reports={locatedReports} />
            <FitToReports reports={locatedReports} />

            {locatedReports.map((report) => (
            <CircleMarker
                key={report.report_id}
                center={[report.latitude as number, report.longitude as number]}
                radius={6}
                pathOptions={{
                color: report.status === 'working' ? '#e27d58' : '#638649',
                fillColor: report.status === 'working' ? '#e27d58' : '#c4d86a',
                fillOpacity: 0.9,
                weight: 2,
                }}
            >
                <Popup>
                <strong>#{report.report_id.slice(0, 8)}</strong>
                <br />
                {report.status}
                <br />
                {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                </Popup>
            </CircleMarker>
            ))}
        </MapContainer>
        ) : (
        <div className="empty-state heatmap-empty">
            <strong>No active report locations yet.</strong>
            <span>Submitted and working reports with coordinates will appear here.</span>
        </div>
        )}
      <div className="heatmap-legend"><span><i className="legend-dot submitted-dot" /> Submitted</span><span><i className="legend-dot working-dot" /> Working</span><span className="heat-scale"><i />Low density <b />High density</span></div>
    </section>
  )
}

export default HeatmapView

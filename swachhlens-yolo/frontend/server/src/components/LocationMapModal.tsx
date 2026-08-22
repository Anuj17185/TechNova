import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Report } from './reportTypes'

type LocationMapModalProps = {
  report: Report
  onClose: () => void
}

function LocationMapModal({ report, onClose }: LocationMapModalProps) {
  const latitude = report.latitude as number
  const longitude = report.longitude as number

  return (
    <div className="map-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="map-modal" role="dialog" aria-modal="true" aria-labelledby="map-title" onClick={(event) => event.stopPropagation()}>
        <div className="map-modal-heading">
          <div><p className="map-kicker">REPORT LOCATION</p><h2 id="map-title">Report #{report.report_id.slice(0, 8)}</h2></div>
          <button className="map-close" type="button" onClick={onClose} aria-label="Close map">×</button>
        </div>
        <MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom zoomControl={false} className="report-map">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="bottomright" />
          <Marker position={[latitude, longitude]}>
            <Popup>{report.comment || 'Reported sanitation issue'}<br />{latitude.toFixed(5)}, {longitude.toFixed(5)}</Popup>
          </Marker>
        </MapContainer>
        <div className="map-modal-footer"><span className="map-pin">●</span><span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span><a href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`} target="_blank" rel="noreferrer">Open in OSM ↗</a></div>
      </section>
    </div>
  )
}

export default LocationMapModal

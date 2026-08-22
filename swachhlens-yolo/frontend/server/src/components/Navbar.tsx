type NavbarProps = {
  reportCount: number
  activeView: 'reports' | 'heatmap'
  onViewChange: (view: 'reports' | 'heatmap') => void
}

function Navbar({ reportCount, activeView, onViewChange }: NavbarProps) {
  return (
    <header className="navbar">
      <a className="brand" href="#reports" aria-label="SwachhLens reports">
        <span className="brand-mark">S</span>
        <span>Swachh<span>Lens</span></span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <button className={`nav-link ${activeView === 'reports' ? 'active' : ''}`} type="button" onClick={() => onViewChange('reports')}>Reports <b>{reportCount}</b></button>
        <button className={`nav-link ${activeView === 'heatmap' ? 'active' : ''}`} type="button" onClick={() => onViewChange('heatmap')}>Heatmap</button>
      </nav>
      <div className="navbar-meta"><span className="online-dot" /> API connected <span className="avatar">OP</span></div>
    </header>
  )
}

export default Navbar

type NavbarProps = {
  reportCount: number
}

function Navbar({ reportCount }: NavbarProps) {
  return (
    <header className="navbar">
      <a className="brand" href="#reports" aria-label="SwachhLens reports">
        <span className="brand-mark">S</span>
        <span>Swachh<span>Lens</span></span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a className="nav-link active" href="#reports">Reports <b>{reportCount}</b></a>
      </nav>
      <div className="navbar-meta"><span className="online-dot" /> API connected <span className="avatar">OP</span></div>
    </header>
  )
}

export default Navbar

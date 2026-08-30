import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/exclusive', label: 'Exclusive' },
  { to: '/digest', label: 'Digest' },
  { to: '/games', label: 'Games' },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function SiteLayout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="shell site-header-inner">
          <NavLink to="/" className="brand" end>
            <span className="brand-name">DAN</span>
            <span className="brand-handle">@KettlebellDan</span>
          </NavLink>
          <nav className="site-nav" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="shell site-footer-inner">
          <p>Kettlebell Dan · @KettlebellDan</p>
          <a href="https://x.com/KettlebellDan" target="_blank" rel="noopener noreferrer">
            Find me on X →
          </a>
        </div>
      </footer>
    </div>
  )
}

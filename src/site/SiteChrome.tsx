import { NavLink, Outlet } from 'react-router-dom'

export default function SiteChrome() {
  return (
    <div className="chrome">
      <header className="chrome-bar">
        <NavLink to="/" className="chrome-brand" end>
          DAN
        </NavLink>
        <nav className="chrome-nav" aria-label="Site">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/games">Games</NavLink>
          <a href="https://x.com/KettlebellDan" target="_blank" rel="noopener noreferrer">
            @KettlebellDan
          </a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

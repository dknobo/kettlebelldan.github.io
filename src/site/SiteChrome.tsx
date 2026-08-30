import { NavLink, Outlet } from 'react-router-dom'
import { BellMark } from './graphics'

export default function SiteChrome() {
  return (
    <div className="chrome">
      <header className="chrome-bar">
        <NavLink to="/" className="chrome-brand" end>
          <BellMark className="chrome-brand-mark" />
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

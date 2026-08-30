import { Link } from 'react-router-dom'
import { DASHBOARD_TZ, isWeekdaySession, weekdayParts } from '../lib/weekday'
import { EmptyState } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

const SLOTS = [
  {
    label: 'Book',
    copy: 'Live book numbers will sit here. No equity, prints, or history on this page until a real feed exists.',
  },
  {
    label: 'Tape',
    copy: 'No tape. This is a shell.',
  },
  {
    label: 'Session',
    copy: 'Weekdays only, America/New_York. Saturday and Sunday stay closed.',
  },
]

export default function DashboardPage() {
  usePageMeta('Dashboard · Kettlebell Dan')
  const now = new Date()
  const open = isWeekdaySession(now)
  const { weekday, dateLabel } = weekdayParts(now)

  return (
    <div className="shell page">
      <header className="page-hero">
        <p className="kicker">Dashboard</p>
        <h1>Weekday book</h1>
        <p className="lede">
          Public shell for later live numbers. {weekday}, {dateLabel} ({DASHBOARD_TZ}).
          Nothing on this page is a quote, a print, or a trade.
        </p>
      </header>

      {!open ? (
        <EmptyState>
          <p>No weekday session.</p>
          <p>This page stays closed on Saturday and Sunday. Come back Monday through Friday.</p>
        </EmptyState>
      ) : (
        <ul className="dash-grid">
          {SLOTS.map((slot) => (
            <li key={slot.label} className="dash-card">
              <p className="kicker">{slot.label}</p>
              <p>{slot.copy}</p>
              <p className="dash-empty">No data</p>
            </li>
          ))}
        </ul>
      )}

      <p className="more">
        <Link to="/">Back home</Link>
      </p>
    </div>
  )
}

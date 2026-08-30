import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ContentEntry } from '../lib/content'
import { formatEntryDate } from '../lib/content'
import { games } from './games'

export function Section({
  id,
  kicker,
  title,
  children,
}: {
  id?: string
  kicker: string
  title?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="section">
      <div className="section-head">
        <p className="kicker">{kicker}</p>
        {title ? <h2 className="section-title">{title}</h2> : null}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>
}

export function EntryCard({
  entry,
  to,
}: {
  entry: ContentEntry
  to: string
}) {
  return (
    <article className="entry-card">
      <p className="meta">
        {formatEntryDate(entry.date)}
        {entry.tags.length ? ` · ${entry.tags.join(', ')}` : ''}
      </p>
      <h3>
        <Link to={to}>{entry.title}</Link>
      </h3>
      <p>{entry.excerpt}</p>
    </article>
  )
}

export function ExampleBanner() {
  return (
    <p className="example-banner" role="note">
      Example stub. Not a published article.
    </p>
  )
}

export function GameGrid({ limit }: { limit?: number }) {
  const list = limit ? games.slice(0, limit) : games
  return (
    <ul className="game-grid">
      {list.map((game) => (
        <li key={game.path}>
          {game.external ? (
            <a className={`game-card tone-${game.tone}`} href={`${game.path}/`}>
              <strong>{game.name}</strong>
              <span>{game.blurb}</span>
            </a>
          ) : (
            <Link className={`game-card tone-${game.tone}`} to={game.path}>
              <strong>{game.name}</strong>
              <span>{game.blurb}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

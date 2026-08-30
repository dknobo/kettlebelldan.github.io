import { Link, useParams } from 'react-router-dom'
import type { ContentKind } from '../lib/content'
import { formatEntryDate, getPublicEntry } from '../lib/content'
import { Markdown } from '../lib/markdown'
import { ExampleBanner } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'
import NotFound from './NotFound'

export default function ContentPost({ kind }: { kind: ContentKind }) {
  const { slug = '' } = useParams()
  const entry = getPublicEntry(kind, slug)
  const base = kind === 'exclusive' ? '/exclusive' : '/digest'
  const label = kind === 'exclusive' ? 'Exclusive' : 'Digest'

  usePageMeta(entry ? `${entry.title} · ${label}` : 'Not found · Kettlebell Dan', {
    noindex: !entry || entry.example,
  })

  if (!entry) {
    return <NotFound embedded />
  }

  return (
    <article className="shell page post">
      <p className="kicker">
        <Link to={base}>{label}</Link>
      </p>
      {entry.example ? <ExampleBanner /> : null}
      <h1>{entry.title}</h1>
      <p className="meta">
        {formatEntryDate(entry.date)}
        {entry.tags.length ? ` · ${entry.tags.join(', ')}` : ''}
      </p>
      <Markdown source={entry.body} />
    </article>
  )
}

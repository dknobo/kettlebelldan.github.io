import { Link } from 'react-router-dom'
import { listExamples, listPublished } from '../lib/content'
import { EmptyState, EntryCard, ExampleBanner, Section } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

export default function DigestIndex() {
  usePageMeta('Digest · Kettlebell Dan')
  const published = listPublished('digest')
  const examples = listExamples('digest')

  return (
    <div className="shell page">
      <header className="page-hero">
        <p className="kicker">Digest</p>
        <h1>Daily social pulse</h1>
        <p className="lede">
          Short notes on what I am watching. Public files in <code>content/digest</code> show up here.
        </p>
      </header>

      <Section kicker="Index" title="Published">
        {published.length === 0 ? (
          <EmptyState>
            <p>No digest entries published yet.</p>
            <p>This list stays empty until a real public file is added.</p>
          </EmptyState>
        ) : (
          <div className="stack">
            {published.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} to={`/digest/${entry.slug}`} />
            ))}
          </div>
        )}
      </Section>

      {examples.length > 0 ? (
        <Section kicker="Renderer" title="Example stubs">
          <ExampleBanner />
          <div className="stack">
            {examples.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} to={`/digest/${entry.slug}`} />
            ))}
          </div>
        </Section>
      ) : null}

      <p className="more">
        <Link to="/">Back home</Link>
      </p>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { listExamples, listPublished } from '../lib/content'
import { EmptyState, EntryCard, ExampleBanner, Section } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

export default function ExclusiveIndex() {
  usePageMeta('Exclusive · Kettlebell Dan')
  const published = listPublished('exclusive')
  const examples = listExamples('exclusive')

  return (
    <div className="shell page">
      <header className="page-hero">
        <p className="kicker">Exclusive</p>
        <h1>Long-form from YouTube</h1>
        <p className="lede">
          Written versions of the videos. Public files in <code>content/exclusive</code> show up here.
          Files marked <code>members: true</code> stay off this site.
        </p>
      </header>

      <Section kicker="Index" title="Published">
        {published.length === 0 ? (
          <EmptyState>
            <p>No exclusives published yet.</p>
            <p>This list stays empty until a real public file is added. Nothing here is invented.</p>
          </EmptyState>
        ) : (
          <div className="stack">
            {published.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} to={`/exclusive/${entry.slug}`} />
            ))}
          </div>
        )}
      </Section>

      {examples.length > 0 ? (
        <Section kicker="Renderer" title="Example stubs">
          <ExampleBanner />
          <div className="stack">
            {examples.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} to={`/exclusive/${entry.slug}`} />
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

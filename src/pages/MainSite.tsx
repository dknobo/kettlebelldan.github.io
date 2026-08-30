import { Link } from 'react-router-dom'
import { latestPublished } from '../lib/content'
import { EmptyState, EntryCard, GameGrid, Section } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

const TEES = [
  {
    href: 'https://kettlebell-krue.launchcart.store/unisex-premium-t-shirt/p/p0w96vd',
    image: '/images/mens-krue-tee.png',
    alt: "Men's Krüe Tee",
    name: 'Heavyweight Tee',
    fit: "Men's Fit",
    price: '$30',
  },
  {
    href: 'https://kettlebell-krue.launchcart.store/womens-relaxed-v-neck-t-shirt/p/mp53jnw',
    image: '/images/womens-krue-tee.png',
    alt: "Women's Krüe Tee",
    name: 'Relaxed Tee',
    fit: "Women's Fit",
    price: '$30',
  },
]

const PILLARS = [
  {
    label: 'X',
    title: 'X Employee',
    body: "I work at X. I'm genuinely excited about what we're building, especially tools like Grok Build that let me ship personal projects in minutes instead of hours.",
  },
  {
    label: 'KRÜE',
    title: 'Kettlebell Krüe',
    body: 'Founder of the Krüe. Discipline, iron, and showing up when it is hard. "No mercy. Only iron."',
  },
  {
    label: 'DAD',
    title: 'Dad',
    body: 'Present, active, and trying to raise healthy kids. Cooking foods from scratch for our kids is important.',
  },
  {
    label: 'COFFEE',
    title: 'Coffee',
    body: 'Aeropress, V60, and Chemex every morning. Small daily rituals that make a big difference.',
  },
]

export default function MainSite() {
  usePageMeta('Kettlebell Dan')
  const exclusive = latestPublished('exclusive')
  const digest = latestPublished('digest')

  return (
    <div className="shell home">
      <section className="hero">
        <div className="hero-identity">
          <p className="hero-chips" aria-label="Focus">
            X · KRÜE · DAD · COFFEE
          </p>
          <div className="hero-who">
            <img src="/images/dan.jpg" alt="Dan" width={96} height={96} />
            <div>
              <h1>DAN</h1>
              <p className="handle">@KettlebellDan on X</p>
            </div>
          </div>
          <p className="lede">
            Proud X employee and founder of the Kettlebell Krüe. I spend my days
            building with AI, swinging iron, and trying to be the dad my kids deserve.
          </p>
          <p className="hero-plan">
            Long-form Exclusive from YouTube. A daily Digest of what I am watching.
            Games I shipped. Tees for the Krüe.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-solid" to="/exclusive">
              Exclusive
            </Link>
            <Link className="btn" to="/games">
              Games
            </Link>
            <a className="btn" href="https://x.com/KettlebellDan" target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
        </div>
        <ul className="pillar-grid">
          {PILLARS.map((pillar) => (
            <li key={pillar.label} className="pillar-card">
              <p className="kicker">{pillar.label}</p>
              <h2>{pillar.title}</h2>
              <p>{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <Section kicker="Now" title="Latest">
        <div className="latest-grid">
          <div>
            <p className="slot-label">Exclusive</p>
            {exclusive ? (
              <EntryCard entry={exclusive} to={`/exclusive/${exclusive.slug}`} />
            ) : (
              <EmptyState>
                <p>No exclusive published yet.</p>
                <p>Long-form from YouTube will show here when a public file lands in <code>content/exclusive</code>.</p>
                <Link to="/exclusive">Open Exclusive</Link>
              </EmptyState>
            )}
          </div>
          <div>
            <p className="slot-label">Digest</p>
            {digest ? (
              <EntryCard entry={digest} to={`/digest/${digest.slug}`} />
            ) : (
              <EmptyState>
                <p>No digest published yet.</p>
                <p>Daily social pulse entries will show here when a public file lands in <code>content/digest</code>.</p>
                <Link to="/digest">Open Digest</Link>
              </EmptyState>
            )}
          </div>
        </div>
      </Section>

      <Section id="games" kicker="Lab" title="Games">
        <p className="section-copy">Three I keep on the front. Click the still to play.</p>
        <GameGrid />
      </Section>

      <Section kicker="Krüe Tees" title="KRÜE on a shirt">
        <div className="tee-grid">
          {TEES.map((tee) => (
            <a
              key={tee.href}
              className="tee-card"
              href={tee.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={tee.image} alt={tee.alt} />
              <div className="tee-meta">
                <strong>{tee.name}</strong>
                <span>{tee.fit}</span>
                <span className="price">{tee.price}</span>
              </div>
            </a>
          ))}
        </div>
        <p className="fine">Fulfilled by Printful</p>
      </Section>

      <Section kicker="Updates" title="Occasional notes">
        <p className="section-copy">
          Training, code, and the small things I am into. Free. No paid tier.
        </p>
        <form
          className="signup"
          action="https://buttondown.com/api/emails/embed-subscribe/kettlebellkrue"
          method="post"
        >
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
          <button type="submit">Join</button>
        </form>
        <p className="fine">Powered by Buttondown. Unsubscribe anytime.</p>
      </Section>
    </div>
  )
}

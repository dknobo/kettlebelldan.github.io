import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { BellMark } from '../site/graphics'
import IronField from '../site/IronField'
import { games } from '../site/games'
import { usePrefersReducedMotion } from '../site/motion'
import { usePageMeta } from '../site/usePageMeta'

const TEES = [
  {
    href: 'https://kettlebell-krue.launchcart.store/unisex-premium-t-shirt/p/p0w96vd',
    image: '/images/mens-krue-tee.png',
    alt: "Men's Krüe Tee",
    name: 'Heavyweight',
    price: '$30',
  },
  {
    href: 'https://kettlebell-krue.launchcart.store/womens-relaxed-v-neck-t-shirt/p/mp53jnw',
    image: '/images/womens-krue-tee.png',
    alt: "Women's Krüe Tee",
    name: 'Relaxed',
    price: '$30',
  },
]

const PILLARS = [
  {
    id: 'krue',
    kicker: 'KRÜE',
    line: 'No mercy. Only iron.',
    body: 'Founder of the Kettlebell Krüe. Discipline, iron, and showing up when it is hard.',
    art: '/images/art/linocut-krue.jpg',
    alt: 'Linocut of a worn kettlebell and a heavy chain',
  },
  {
    id: 'x',
    kicker: 'X',
    body: "I work at X. I'm genuinely excited about what we're building, especially tools like Grok Build that let me ship personal projects in minutes instead of hours.",
    art: '/images/art/linocut-x.jpg',
    alt: 'Linocut of crossed steel beams forming an X',
  },
  {
    id: 'dad',
    kicker: 'DAD',
    line: 'Cooking from scratch for the kids.',
    body: 'Present, active, and trying to be the dad my kids deserve. Cooking foods from scratch for our kids is important.',
    art: '/images/art/linocut-dad.jpg',
    alt: 'Linocut of a steak searing in a cast-iron skillet',
  },
  {
    id: 'coffee',
    kicker: 'COFFEE',
    line: 'Aeropress. V60. Chemex.',
    body: 'Aeropress, V60, and Chemex every morning. Small daily rituals that make a big difference.',
    art: '/images/art/linocut-coffee.jpg',
    alt: 'Linocut of an Aeropress, V60, and Chemex',
  },
]

export default function HomePage() {
  usePageMeta('Kettlebell Dan')
  const reduced = usePrefersReducedMotion()
  const heroRef = useRef<HTMLElement>(null)

  const heroScroll = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroProgress = useSpring(heroScroll.scrollYProgress, {
    stiffness: 70,
    damping: 24,
    restDelta: 0.001,
  })

  const nameY = useTransform(heroProgress, [0, 1], [0, -90])
  const nameScale = useTransform(heroProgress, [0, 1], [1, 0.72])
  const bgY = useTransform(heroProgress, [0, 1], [0, 140])
  const bellRotate = useTransform(heroProgress, [0, 1], [-16, 22])
  const bellY = useTransform(heroProgress, [0, 1], [20, -70])

  return (
    <div className="iron-page">
      <IronField />
      <div className="iron-grain" aria-hidden />

      <header className="iron-bar">
        <a className="iron-brand" href="#top">
          <BellMark className="iron-brand-mark" />
          DAN
        </a>
        <nav aria-label="On this page">
          <a href="#pillars">Pillars</a>
          <a href="#games">Games</a>
          <a href="https://x.com/KettlebellDan" target="_blank" rel="noopener noreferrer">
            @KettlebellDan
          </a>
        </nav>
      </header>

      <section id="top" className="iron-hero" ref={heroRef}>
        <div className="iron-hero-pin">
          <motion.div
            className="iron-hero-bg"
            style={reduced ? undefined : { y: bgY }}
            aria-hidden
          />
          <motion.div
            className="iron-print"
            style={reduced ? undefined : { y: bgY }}
          >
            <img src="/images/art/linocut-bell.jpg" alt="" />
          </motion.div>
          <motion.div
            className="iron-bell-stage"
            style={reduced ? undefined : { rotate: bellRotate, y: bellY }}
          >
            <BellMark />
          </motion.div>
          <div className="iron-hero-copy">
            <p className="iron-chips">KRÜE · X · DAD · COFFEE</p>
            <motion.div style={reduced ? undefined : { y: nameY, scale: nameScale }}>
              <h1 className="iron-name">DAN</h1>
              <p className="iron-sub">KETTLEBELL DAN</p>
            </motion.div>
            <p className="iron-handle">@KettlebellDan on X</p>
            <p className="iron-lede">
              Proud X employee and founder of the Kettlebell Krüe. I spend my days
              building with AI, swinging iron, and trying to be the dad my kids deserve.
            </p>
            <div className="iron-portrait-wrap">
              <img src="/images/dan.jpg" alt="Dan" width={176} height={176} />
            </div>
          </div>
          <p className="iron-scroll-hint">Scroll the iron</p>
        </div>
      </section>

      <div id="pillars">
        {PILLARS.map((pillar, i) => (
          <Chapter key={pillar.id} pillar={pillar} odd={i % 2 === 0} reduced={reduced} />
        ))}
      </div>

      <section id="games" className="iron-block">
        <div className="iron-block-inner">
          <h2>Games</h2>
          <ul className="iron-games">
            {games.map((game) => (
              <li key={game.path}>
                <Link className="iron-game" to={game.path}>
                  <img src={game.thumb} alt="" />
                  <span>{game.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="iron-block iron-quiet" aria-label="Krüe tees and newsletter">
        <div className="iron-block-inner iron-quiet-stack">
          <div className="iron-tees-block">
            <h2>Tees</h2>
            <div className="iron-tees">
              {TEES.map((tee) => (
                <a
                  key={tee.href}
                  className="iron-tee"
                  href={tee.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={tee.image} alt={tee.alt} />
                  <div>
                    <span>{tee.name}</span>
                    <span>{tee.price}</span>
                  </div>
                </a>
              ))}
            </div>
            <p className="iron-fine">Fulfilled by Printful</p>
          </div>
          <div className="iron-notes">
            <h2>Sign up for my newsletter</h2>
            <form
              className="iron-signup"
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
            <p className="iron-fine">Buttondown. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <footer className="iron-foot">
        <p>Kettlebell Dan</p>
        <a href="https://x.com/KettlebellDan" target="_blank" rel="noopener noreferrer">
          Find me on X
        </a>
      </footer>
    </div>
  )
}

function Chapter({
  pillar,
  odd,
  reduced,
}: {
  pillar: (typeof PILLARS)[number]
  odd: boolean
  reduced: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const artY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const copyY = useTransform(scrollYProgress, [0, 1], [30, -20])

  return (
    <section
      id={pillar.id}
      className={odd ? 'iron-chapter is-odd' : 'iron-chapter is-even'}
      ref={ref}
    >
      <div className="iron-chapter-pin">
        <motion.div className="iron-chapter-art" style={reduced ? undefined : { y: artY }}>
          <img src={pillar.art} alt={pillar.alt} />
        </motion.div>
        <motion.div className="iron-chapter-copy" style={reduced ? undefined : { y: copyY }}>
          <p className="iron-kicker">{pillar.kicker}</p>
          {'line' in pillar && pillar.line ? <p className="iron-line">{pillar.line}</p> : null}
          <p>{pillar.body}</p>
        </motion.div>
      </div>
    </section>
  )
}

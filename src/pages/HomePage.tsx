import { useRef, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
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

const PAIR = [
  {
    word: 'KRÜE',
    src: '/images/art/linocut-krue.jpg',
    alt: 'Linocut of a kettlebell',
  },
  {
    word: 'RITUALS',
    src: '/images/art/linocut-coffee.jpg',
    alt: 'Linocut of a coffee brewing still life',
  },
]

function useFocusScale(target: RefObject<HTMLElement | null>, reduced: boolean) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1.015, 0.99])
  const scale = useSpring(raw, { stiffness: 80, damping: 28, restDelta: 0.001 })
  return reduced ? undefined : { scale }
}

export default function HomePage() {
  usePageMeta('Kettlebell Dan')
  const reduced = usePrefersReducedMotion()
  const heroRef = useRef<HTMLElement>(null)

  const heroScroll = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroProgress = useSpring(heroScroll.scrollYProgress, {
    stiffness: 48,
    damping: 22,
    restDelta: 0.001,
  })
  const bgY = useTransform(heroProgress, [0, 1], [0, 140])
  const bgScale = useTransform(heroProgress, [0, 1], [1.12, 1.02])
  const lockY = useTransform(heroProgress, [0, 1], [0, -36])
  const hintOp = useTransform(heroProgress, [0, 0.35], [1, 0])

  return (
    <div className="iron-page">
      <IronField />
      <div className="iron-grain" aria-hidden />

      <section id="top" className="iron-hero" ref={heroRef}>
        <div className="iron-hero-pin">
          <motion.div
            className="iron-hero-bg"
            style={reduced ? undefined : { y: bgY, scale: bgScale }}
            aria-hidden
          />
          <div className="iron-hero-veil" aria-hidden />
          <motion.div
            className="iron-hero-id"
            style={reduced ? undefined : { y: lockY }}
          >
            <h1 className="iron-wordmark">
              <span className="iron-wordmark-lead">Kettlebell</span>
              <span className="iron-wordmark-name">Dan</span>
            </h1>
            <div className="iron-portrait-wrap">
              <img src="/images/dan.jpg" alt="Dan" width={320} height={320} />
            </div>
          </motion.div>
          <motion.p
            className="iron-scroll-hint"
            style={reduced ? undefined : { opacity: hintOp }}
          >
            Scroll the iron
          </motion.p>
        </div>
      </section>

      {PAIR.map((item) => (
        <ImmersivePrint key={item.word} item={item} reduced={reduced} />
      ))}

      <section id="games" className="iron-block">
        <div className="iron-block-inner">
          <h2>Games</h2>
          <ul className="iron-games">
            {games.map((game) => (
              <li key={game.path}>
                <ScaleCard reduced={reduced}>
                  <Link className="iron-game" to={game.path}>
                    <img src={game.thumb} alt="" />
                    <span>{game.name}</span>
                  </Link>
                </ScaleCard>
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
                <ScaleCard key={tee.href} reduced={reduced}>
                  <a
                    className="iron-tee"
                    href={tee.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={tee.image} alt={tee.alt} />
                    <div className="iron-tee-meta">
                      <span>{tee.name}</span>
                      <span>{tee.price}</span>
                    </div>
                  </a>
                </ScaleCard>
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

function ImmersivePrint({
  item,
  reduced,
}: {
  item: (typeof PAIR)[number]
  reduced: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const flow = useSpring(scrollYProgress, { stiffness: 36, damping: 22, restDelta: 0.001 })
  const imgY = useTransform(flow, [0, 1], [56, -56])
  const imgScale = useTransform(flow, [0, 0.5, 1], [0.94, 1.04, 1])
  const wordY = useTransform(flow, [0, 0.48, 1], [28, 0, -16])
  const wordOp = useTransform(flow, [0.16, 0.4, 0.78, 1], [0, 1, 1, 0.7])

  return (
    <section className="iron-immerse" ref={ref} aria-label={item.word}>
      <div className="iron-immerse-pin">
        <motion.figure
          className="iron-immerse-art"
          style={reduced ? undefined : { y: imgY, scale: imgScale }}
        >
          <img src={item.src} alt={item.alt} />
        </motion.figure>
        <motion.p
          className="iron-immerse-word"
          style={reduced ? undefined : { y: wordY, opacity: wordOp }}
        >
          {item.word}
        </motion.p>
      </div>
    </section>
  )
}

function ScaleCard({
  children,
  reduced,
}: {
  children: ReactNode
  reduced: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFocusScale(ref, reduced)
  return (
    <motion.div ref={ref} style={scale}>
      {children}
    </motion.div>
  )
}

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
  const raw = useTransform(scrollYProgress, [0, 0.48, 1], [0.9, 1.045, 0.93])
  const scale = useSpring(raw, { stiffness: 70, damping: 26, restDelta: 0.001 })
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
    stiffness: 70,
    damping: 24,
    restDelta: 0.001,
  })
  const bgY = useTransform(heroProgress, [0, 1], [0, 110])
  const bgScale = useTransform(heroProgress, [0, 1], [1.08, 1])

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
          <div className="iron-hero-id">
            <p className="iron-wordmark">Kettlebell Dan</p>
            <div className="iron-portrait-wrap">
              <img src="/images/dan.jpg" alt="Dan" width={280} height={280} />
            </div>
          </div>
          <p className="iron-scroll-hint">Scroll the iron</p>
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
                    <div>
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
  const flow = useSpring(scrollYProgress, { stiffness: 46, damping: 20, restDelta: 0.001 })
  const imgY = useTransform(flow, [0, 1], [90, -90])
  const imgScale = useTransform(flow, [0, 0.48, 1], [0.78, 1.1, 0.9])
  const wordY = useTransform(flow, [0, 0.45, 1], [56, 0, -28])
  const wordOp = useTransform(flow, [0.12, 0.38, 0.82, 1], [0, 1, 1, 0.55])

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

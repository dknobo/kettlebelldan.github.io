import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion'
import { ArrowLeft, Coffee, Dumbbell, User, X } from 'lucide-react'

type Chamber = 'x' | 'krue' | 'dad' | 'coffee'

const CHAMBERS: {
  id: Chamber
  label: string
  icon: typeof X
  accent: string
  glow: string
  line: string
  body: string
  image?: string
}[] = [
  {
    id: 'x',
    label: 'X',
    icon: X,
    accent: '#e5e5e5',
    glow: 'rgba(255,255,255,0.18)',
    line: 'Ship fast. Think clear.',
    body: 'Days spent on tools that let anyone go from idea to live in minutes — including this page.',
  },
  {
    id: 'krue',
    label: 'KRÜE',
    icon: Dumbbell,
    accent: '#c41e1e',
    glow: 'rgba(196,30,30,0.35)',
    line: 'No mercy. Only iron.',
    body: 'Discipline when it’s hard. Show up. Swing. Repeat. Founder of the Krüe.',
    image: '/images/mens-krue-tee.png',
  },
  {
    id: 'dad',
    label: 'DAD',
    icon: User,
    accent: '#93c5fd',
    glow: 'rgba(147,197,253,0.22)',
    line: 'Present over perfect.',
    body: 'Active, intentional, cooking from scratch — trying to be the dad the kids deserve.',
  },
  {
    id: 'coffee',
    label: 'BREW',
    icon: Coffee,
    accent: '#d4a574',
    glow: 'rgba(212,165,116,0.28)',
    line: 'Aeropress · V60 · Chemex',
    body: 'Small daily rites that set the tone. Steam, grind, pour — then iron or code.',
    image: '/images/kettlebell-coffee.jpg',
  },
]

function usePointerField() {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const sx = useSpring(x, { stiffness: 80, damping: 20 })
  const sy = useSpring(y, { stiffness: 80, damping: 20 })

  const onMove = useCallback(
    (e: MouseEvent) => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      x.set(e.clientX / w)
      y.set(e.clientY / h)
    },
    [x, y],
  )

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [onMove])

  return { x: sx, y: sy }
}

function IronField({ active }: { active: Chamber | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number }
    let particles: P[] = []

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(90, Math.floor((w * h) / 18000))
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 0.6 + Math.random() * 2.2,
        a: 0.15 + Math.random() * 0.45,
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    const colors: Record<Chamber | 'default', string> = {
      default: '200,200,200',
      x: '230,230,230',
      krue: '220,40,40',
      dad: '150,190,255',
      coffee: '210,160,110',
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      const key = activeRef.current ?? 'default'
      const rgb = colors[key]

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.fillStyle = `rgba(${rgb},${p.a})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 120 * 120) {
            const alpha = (1 - Math.sqrt(d2) / 120) * 0.08
            ctx.strokeStyle = `rgba(${rgb},${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
      aria-hidden
    />
  )
}

export default function V2Experience() {
  const [active, setActive] = useState<Chamber | null>(null)
  const [pulse, setPulse] = useState(0)
  const pointer = usePointerField()

  const orbX = useTransform(pointer.x, [0, 1], [-28, 28])
  const orbY = useTransform(pointer.y, [0, 1], [-20, 20])
  const tiltX = useTransform(pointer.y, [0, 1], [6, -6])
  const tiltY = useTransform(pointer.x, [0, 1], [-8, 8])
  const pointerXPct = useTransform(pointer.x, (v) => `${v * 100}%`)
  const pointerYPct = useTransform(pointer.y, (v) => `${v * 100}%`)
  const glowColor = active
    ? (CHAMBERS.find((c) => c.id === active)?.glow ?? 'rgba(255,255,255,0.06)')
    : 'rgba(255,255,255,0.06)'
  const vignetteBg = useMotionTemplate`radial-gradient(900px circle at ${pointerXPct} ${pointerYPct}, ${glowColor} 0%, transparent 55%)`

  const activeMeta = useMemo(
    () => CHAMBERS.find((c) => c.id === active) ?? null,
    [active],
  )

  useEffect(() => {
    document.title = 'Kettlebell Dan — Immersive'
    return () => {
      document.title = 'Kettlebell Dan'
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      const map: Record<string, Chamber> = { '1': 'x', '2': 'krue', '3': 'dad', '4': 'coffee' }
      if (map[e.key]) {
        setActive((prev) => (prev === map[e.key] ? null : map[e.key]))
        setPulse((p) => p + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectChamber = (id: Chamber) => {
    setActive((prev) => (prev === id ? null : id))
    setPulse((p) => p + 1)
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#f5f5f5] overflow-x-hidden selection:bg-[#c41e1e]/selection:text-white">
      <IronField active={active} />

      <motion.div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ background: vignetteBg }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_75%)]" />

      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 md:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-[2px] text-[#a3a3a3] backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          CLASSIC
        </Link>
        <div className="hidden sm:block text-[10px] tracking-[3px] text-[#6b7280]">
          CLICK A PILLAR · KEYS 1–4 · ESC
        </div>
        <a
          href="https://x.com/KettlebellDan"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-[2px] text-[#a3a3a3] backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
        >
          @KETTLEBELLDAN
        </a>
      </header>

      {/* Orbit stage */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-8 pt-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex w-full max-w-6xl flex-col items-center"
        >
          <motion.div
            style={{ x: orbX, y: orbY, rotateX: tiltX, rotateY: tiltY }}
            className="relative mb-10 flex h-[min(62vw,420px)] w-[min(62vw,420px)] items-center justify-center [perspective:1000px]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-white/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 72, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-6 rounded-full border border-dashed border-white/10"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-12 rounded-full border border-white/[0.07]"
              style={{
                boxShadow: activeMeta
                  ? `0 0 80px ${activeMeta.glow}, inset 0 0 60px ${activeMeta.glow}`
                  : '0 0 40px rgba(255,255,255,0.04)',
              }}
            />

            {CHAMBERS.map((c, i) => {
              const angle = (i / CHAMBERS.length) * Math.PI * 2 - Math.PI / 2
              const r = 46
              const left = 50 + Math.cos(angle) * r
              const top = 50 + Math.sin(angle) * r
              const Icon = c.icon
              const isOn = active === c.id
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => selectChamber(c.id)}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-[10px] font-medium tracking-[2px] backdrop-blur-md transition-[border-color,color,box-shadow,background-color] duration-300 md:px-4 md:text-xs"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    borderColor: isOn ? c.accent : 'rgba(255,255,255,0.14)',
                    color: isOn ? '#fff' : '#a3a3a3',
                    background: isOn ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)',
                    boxShadow: isOn ? `0 0 28px ${c.glow}` : undefined,
                  }}
                  whileHover={{
                    borderColor: c.accent,
                    color: '#fff',
                    boxShadow: `0 0 22px ${c.glow}`,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: isOn ? c.accent : undefined }} />
                    {c.label}
                  </span>
                </motion.button>
              )
            })}

            <motion.div
              key={pulse}
              initial={{ scale: 0.96, opacity: 0.75 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative z-10 flex flex-col items-center"
            >
              <motion.img
                src="/images/dan.jpg"
                alt="Dan"
                className="h-28 w-28 rounded-[28px] object-cover border border-white/15 md:h-36 md:w-36"
                style={{
                  boxShadow: activeMeta
                    ? `0 20px 60px ${activeMeta.glow}`
                    : '0 20px 50px rgba(0,0,0,0.6)',
                }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'tween', duration: 0.25 }}
              />
              <h1 className="mt-6 text-center text-[clamp(3.5rem,12vw,7rem)] font-semibold leading-none tracking-[-0.08em] text-white">
                DAN
              </h1>
              <p className="mt-2 text-center text-sm tracking-[0.35em] text-[#8a8a8a] md:text-base">
                KETTLEBELL
              </p>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p
              key={activeMeta?.line ?? 'default'}
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
              className="max-w-xl text-center text-2xl font-medium tracking-tight md:text-4xl"
              style={{ color: activeMeta?.accent ?? '#f5f5f5' }}
            >
              {activeMeta?.line ?? 'No mercy. Only iron.'}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={activeMeta?.body ?? 'intro'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 max-w-md text-center text-[15px] leading-relaxed text-[#9a9a9a]"
            >
              {activeMeta?.body ??
                'X employee. Founder of the Kettlebell Krüe. Dad. Coffee ritualist. Click a pillar.'}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence>
            {activeMeta?.image && (
              <motion.div
                key={activeMeta.image}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="mt-8 overflow-hidden rounded-3xl border border-white/10"
                style={{ boxShadow: `0 30px 80px ${activeMeta.glow}` }}
              >
                <img
                  src={activeMeta.image}
                  alt=""
                  className="h-40 w-auto max-w-[min(90vw,360px)] object-cover md:h-52"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Merch + newsletter only */}
      <section className="relative z-20 mx-auto max-w-5xl px-5 pb-24 pt-4 md:px-8">
        <div className="mb-6 text-[10px] tracking-[3px] text-[#6b7280]">KRÜE TEES</div>
        <div className="grid gap-5 md:grid-cols-2">
          <a
            href="https://kettlebell-krue.launchcart.store/unisex-premium-t-shirt/p/p0w96vd"
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0c0c] transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_20px_60px_rgba(196,30,30,0.12)]"
          >
            <div className="overflow-hidden">
              <img
                src="/images/mens-krue-tee.png"
                alt="Men's Krüe Tee"
                className="w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex items-end justify-between p-6">
              <div>
                <div className="text-xl font-semibold text-white">Heavyweight Tee</div>
                <div className="text-sm text-[#8a8a8a]">Men&apos;s fit</div>
              </div>
              <div className="text-lg font-medium text-white transition-transform duration-300 group-hover:translate-x-0.5">
                $30 →
              </div>
            </div>
          </a>
          <a
            href="https://kettlebell-krue.launchcart.store/womens-relaxed-v-neck-t-shirt/p/mp53jnw"
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0c0c] transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_20px_60px_rgba(196,30,30,0.12)]"
          >
            <div className="overflow-hidden">
              <img
                src="/images/womens-krue-tee.png"
                alt="Women's Krüe Tee"
                className="w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex items-end justify-between p-6">
              <div>
                <div className="text-xl font-semibold text-white">Relaxed Tee</div>
                <div className="text-sm text-[#8a8a8a]">Women&apos;s fit</div>
              </div>
              <div className="text-lg font-medium text-white transition-transform duration-300 group-hover:translate-x-0.5">
                $30 →
              </div>
            </div>
          </a>
        </div>

        <div className="mt-16">
          <div className="mb-2 text-[10px] tracking-[3px] text-[#6b7280]">UPDATES</div>
          <p className="mb-4 max-w-[42ch] text-[15px] text-[#a3a3a3]">
            Occasional notes on training, code, and the small things I’m into.
          </p>
          <form
            action="https://buttondown.com/api/emails/embed-subscribe/kettlebellkrue"
            method="post"
            className="flex w-full max-w-md gap-2"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm outline-none placeholder:text-[#6b7280] transition-colors focus:border-white/30"
            />
            <button
              type="submit"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-medium tracking-wide transition-colors hover:bg-white/15"
            >
              Join
            </button>
          </form>
          <p className="mt-2 text-[11px] text-[#525252]">Powered by Buttondown. Unsubscribe anytime.</p>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] tracking-[2px] text-[#525252]">
          <span>IMMERSIVE</span>
          <Link to="/" className="transition-colors hover:text-white">
            ← BACK TO CLASSIC
          </Link>
        </div>
      </section>
    </div>
  )
}

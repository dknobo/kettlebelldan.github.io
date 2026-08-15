import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useMotionValue } from 'framer-motion'
import { RivalMark, TokenMark } from './marks'
import { sfx, unlockAudio } from './sound'
import './orb.css'

const SIZE = 4
const LS_BEST = 'orb-hop-best'

type Phase = 'idle' | 'play' | 'over'
type Pos = { r: number; c: number }
type Look = 'center' | 'left' | 'right' | 'up' | 'down'
type Rival = 'claude' | 'openai' | 'gemini' | 'deepseek'
type Hazard = { pos: Pos; kind: Rival }

const RIVALS: Rival[] = ['claude', 'openai', 'gemini', 'deepseek']

const DIRS: Record<string, Pos> = {
  arrowup: { r: -1, c: 0 },
  w: { r: -1, c: 0 },
  arrowdown: { r: 1, c: 0 },
  s: { r: 1, c: 0 },
  arrowleft: { r: 0, c: -1 },
  a: { r: 0, c: -1 },
  arrowright: { r: 0, c: 1 },
  d: { r: 0, c: 1 },
}

function eq(a: Pos, b: Pos) {
  return a.r === b.r && a.c === b.c
}

function manh(a: Pos, b: Pos) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

function inb(p: Pos) {
  return p.r >= 0 && p.c >= 0 && p.r < SIZE && p.c < SIZE
}

function neighbors(p: Pos) {
  return [
    { r: p.r - 1, c: p.c },
    { r: p.r + 1, c: p.c },
    { r: p.r, c: p.c - 1 },
    { r: p.r, c: p.c + 1 },
  ].filter(inb)
}

function pick(list: Pos[]) {
  return list[Math.floor(Math.random() * list.length)]
}

function keyOf(p: Pos) {
  return `${p.r},${p.c}`
}

function cells() {
  const out: Pos[] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) out.push({ r, c })
  }
  return out
}

function shuffle<T>(list: T[]) {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function reachable(from: Pos, blocked: Set<string>) {
  const seen = new Set([keyOf(from)])
  const q = [from]
  while (q.length) {
    const cur = q.shift()!
    for (const n of neighbors(cur)) {
      const k = keyOf(n)
      if (seen.has(k) || blocked.has(k)) continue
      seen.add(k)
      q.push(n)
    }
  }
  return seen
}

function hazardCount(collects: number) {
  if (collects < 2) return 0
  if (collects < 5) return 1
  if (collects < 9) return 2
  if (collects < 14) return 3
  return 4
}

function pickLayout(from: Pos, collects: number) {
  const maxDist = collects < 2 ? 1 : collects < 5 ? 2 : SIZE * 2
  const minDist = collects < 8 ? 1 : 2
  const pool = cells().filter((p) => {
    const d = manh(from, p)
    return d >= minDist && d <= maxDist
  })
  const target = pick(pool.length ? pool : neighbors(from))
  const hazards: Hazard[] = []
  const want = hazardCount(collects)
  const kinds = shuffle(RIVALS)
  for (const c of shuffle(cells().filter((p) => !eq(p, from) && !eq(p, target)))) {
    if (hazards.length >= want) break
    const blocked = new Set([...hazards.map((h) => h.pos), c].map(keyOf))
    if (reachable(from, blocked).has(keyOf(target))) {
      hazards.push({ pos: c, kind: kinds[hazards.length] })
    }
  }
  return { target, hazards }
}

function timeFor(collects: number) {
  return Math.max(1.28, 4.15 - collects * 0.085)
}

function lookOf(from: Pos, to: Pos): Look {
  if (to.c < from.c) return 'left'
  if (to.c > from.c) return 'right'
  if (to.r < from.r) return 'up'
  if (to.r > from.r) return 'down'
  return 'center'
}

function toastFor(combo: number, perfect: boolean) {
  if (perfect && combo >= 6) return 'unreal'
  if (perfect) return 'clean'
  if (combo >= 8) return 'on fire'
  if (combo >= 4) return 'nice'
  return null
}

function OrbFace({
  mood,
  look,
  blink,
}: {
  mood: 'idle' | 'happy' | 'sad'
  look: Look
  blink: boolean
}) {
  return (
    <div className={`oh-orb ${blink ? 'is-blink' : ''} ${mood === 'happy' ? 'is-happy' : ''} ${mood === 'sad' ? 'is-sad' : ''} look-${look}`}>
      <div className="oh-sphere" />
      <div className="oh-eyes">
        <span className="oh-eye" />
        <span className="oh-eye" />
      </div>
    </div>
  )
}

export default function OrbHopApp() {
  const boardRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ cell: 80, gap: 10 })
  const [phase, setPhase] = useState<Phase>('idle')
  const [pos, setPos] = useState<Pos>({ r: 1, c: 1 })
  const [target, setTarget] = useState<Pos | null>(null)
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [collects, setCollects] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(LS_BEST) || 0))
  const [timeLeft, setTimeLeft] = useState(0)
  const [timeMax, setTimeMax] = useState(4)
  const [mood, setMood] = useState<'idle' | 'happy' | 'sad'>('idle')
  const [look, setLook] = useState<Look>('center')
  const [blink, setBlink] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [hint, setHint] = useState(true)
  const [bad, setBad] = useState<string | null>(null)
  const [burst, setBurst] = useState(0)
  const [burstPos, setBurstPos] = useState<Pos | null>(null)
  const [newBest, setNewBest] = useState(false)

  const hopping = useRef(false)
  const hopToRef = useRef<(to: Pos, silent?: boolean) => Promise<void>>(async () => {})
  const startRunRef = useRef<(first?: Pos) => void>(() => {})
  const endRunRef = useRef<() => void>(() => {})
  const xyOfRef = useRef<(p: Pos) => { x: number; y: number }>((p) => ({
    x: p.c * 90,
    y: p.r * 90,
  }))
  const queue = useRef<Pos | null>(null)
  const gen = useRef(0)
  const hopsOn = useRef(0)
  const origin = useRef<Pos>({ r: 1, c: 1 })
  const phaseRef = useRef(phase)
  const posRef = useRef(pos)
  const targetRef = useRef(target)
  const hazardsRef = useRef(hazards)
  const comboRef = useRef(combo)
  const collectsRef = useRef(collects)
  const scoreRef = useRef(score)
  const timeLeftRef = useRef(timeLeft)
  const timeMaxRef = useRef(timeMax)
  const happyTimer = useRef<ReturnType<typeof window.setTimeout> | 0>(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const hopY = useMotionValue(0)
  const squashX = useMotionValue(1)
  const squashY = useMotionValue(1)
  const shadow = useMotionValue(1)

  const orbSize = metrics.cell * 0.64

  const xyOf = useCallback(
    (p: Pos) => ({
      x: p.c * (metrics.cell + metrics.gap) + (metrics.cell - orbSize) / 2,
      y: p.r * (metrics.cell + metrics.gap) + (metrics.cell - orbSize) / 2,
    }),
    [metrics, orbSize],
  )

  useEffect(() => {
    document.title = 'Orb Hop · kettlebelldan.com'
  }, [])

  useLayoutEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => {
      const gap = parseFloat(getComputedStyle(el).gap) || 10
      const cell = (el.clientWidth - gap * (SIZE - 1)) / SIZE
      setMetrics({ cell, gap })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (hopping.current) return
    const p = xyOf(pos)
    x.set(p.x)
    y.set(p.y)
  }, [xyOf, pos, x, y])

  useEffect(() => {
    let id = 0
    const loop = () => {
      if (phaseRef.current !== 'over') {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 90)
      }
      id = window.setTimeout(loop, 2600 + Math.random() * 2400)
    }
    id = window.setTimeout(loop, 1800)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (phase !== 'idle') return
    const id = window.setInterval(() => {
      if (hopping.current) return
      const next = pick(neighbors(posRef.current))
      void hopToRef.current(next, true)
    }, 1500)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'play') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const next = timeLeftRef.current - dt
      if (next <= 0) {
        endRunRef.current()
        return
      }
      setTimeLeft(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const endRun = () => {
    if (phaseRef.current !== 'play') return
    hopping.current = false
    queue.current = null
    gen.current += 1
    setPhase('over')
    setMood('sad')
    setLook('center')
    setTarget(null)
    sfx.over()
    const final = scoreRef.current
    if (final > Number(localStorage.getItem(LS_BEST) || 0)) {
      localStorage.setItem(LS_BEST, String(final))
      setBest(final)
      setNewBest(true)
    } else {
      setNewBest(false)
    }
  }

  const collectAt = (at: Pos) => {
    const hops = hopsOn.current
    const perfect = hops === manh(origin.current, at)
    const nextCombo = comboRef.current + 1
    const remain = timeLeftRef.current / timeMaxRef.current
    const pts = 10 + (perfect ? 10 : 0) + Math.round(remain * 8) + Math.min(nextCombo, 12) * 2
    const nextCollects = collectsRef.current + 1
    const nextScore = scoreRef.current + pts

    setScore(nextScore)
    setCombo(nextCombo)
    setCollects(nextCollects)
    setMood('happy')
    setBurstPos(at)
    setBurst((n) => n + 1)
    setToast(toastFor(nextCombo, perfect))
    window.clearTimeout(happyTimer.current)
    happyTimer.current = window.setTimeout(() => {
      if (phaseRef.current === 'play') setMood('idle')
      setToast(null)
    }, 520)

    if (perfect) sfx.perfect()
    else sfx.collect(nextCombo)
    try {
      navigator.vibrate?.([6, 16, 10])
    } catch {
      /* ignore */
    }

    const next = pickLayout(at, nextCollects)
    const budget = timeFor(nextCollects)
    origin.current = at
    hopsOn.current = 0
    setTarget(next.target)
    setHazards(next.hazards)
    setTimeMax(budget)
    setTimeLeft(budget)
    setLook(lookOf(at, next.target))
  }

  const hopTo = async (to: Pos, silent = false) => {
    if (!inb(to) || hopping.current) return
    const from = posRef.current
    if (eq(from, to) || manh(from, to) !== 1) return

    hopping.current = true
    const my = gen.current
    setPos(to)
    setLook(lookOf(from, to))
    if (!silent) {
      hopsOn.current += 1
      setHint(false)
      sfx.hop()
      try {
        navigator.vibrate?.(8)
      } catch {
        /* ignore */
      }
    }

    const start = xyOfRef.current(from)
    const end = xyOfRef.current(to)
    const lift = 18 + metrics.cell * 0.18
    hopY.set(0)
    squashX.set(1)
    squashY.set(1)

    await Promise.all([
      animate(x, [start.x, end.x], { duration: 0.22, ease: [0.2, 0.85, 0.2, 1] }),
      animate(y, [start.y, end.y], { duration: 0.22, ease: [0.2, 0.85, 0.2, 1] }),
      animate(hopY, [0, -lift, 0], { duration: 0.22, times: [0, 0.42, 1], ease: [0.2, 0.85, 0.2, 1] }),
      animate(squashX, [1, 0.88, 1.1, 1], { duration: 0.22, times: [0, 0.35, 0.78, 1] }),
      animate(squashY, [1, 1.14, 0.86, 1], { duration: 0.22, times: [0, 0.35, 0.78, 1] }),
      animate(shadow, [1, 0.45, 1], { duration: 0.22, times: [0, 0.42, 1] }),
    ])

    hopping.current = false
    if (my !== gen.current) return
    if (silent) {
      if (phaseRef.current !== 'play') setLook('center')
      return
    }
    sfx.land()

    if (phaseRef.current === 'play' && hazardsRef.current.some((h) => eq(h.pos, to))) {
      sfx.pit()
      endRunRef.current()
      return
    }

    const t = targetRef.current
    if (phaseRef.current === 'play' && t && eq(to, t)) {
      collectAt(to)
    } else if (phaseRef.current === 'play' && t) {
      setLook(lookOf(to, t))
    }

    const queued = queue.current
    queue.current = null
    if (queued && phaseRef.current === 'play' && manh(posRef.current, queued) === 1) {
      void hopTo(queued)
    }
  }

  const startRun = (first?: Pos) => {
    unlockAudio()
    hopping.current = false
    queue.current = null
    gen.current += 1
    x.stop()
    y.stop()
    hopY.stop()
    const start = { r: 1, c: 1 }
    const dest = first && manh(start, first) === 1 ? first : start
    const layout = pickLayout(dest, 0)
    origin.current = dest
    hopsOn.current = 0
    setPhase('play')
    setPos(dest)
    setTarget(layout.target)
    setHazards(layout.hazards)
    setScore(0)
    setCombo(0)
    setCollects(0)
    setMood('idle')
    setLook(lookOf(dest, layout.target))
    setHint(true)
    setNewBest(false)
    const budget = timeFor(0)
    setTimeMax(budget)
    setTimeLeft(budget)
    const p = xyOfRef.current(dest)
    x.set(p.x)
    y.set(p.y)
    hopY.set(0)
    squashX.set(1)
    squashY.set(1)
    shadow.set(1)
  }

  const tryTile = (to: Pos) => {
    unlockAudio()
    if (phaseRef.current === 'idle' || phaseRef.current === 'over') {
      startRunRef.current()
      return
    }
    if (manh(posRef.current, to) !== 1) {
      if (!eq(posRef.current, to)) {
        setBad(`${to.r}-${to.c}`)
        sfx.miss()
        window.setTimeout(() => setBad(null), 280)
      }
      return
    }
    if (hopping.current) {
      queue.current = to
      return
    }
    void hopToRef.current(to)
  }

  useLayoutEffect(() => {
    phaseRef.current = phase
    posRef.current = pos
    targetRef.current = target
    hazardsRef.current = hazards
    comboRef.current = combo
    collectsRef.current = collects
    scoreRef.current = score
    timeLeftRef.current = timeLeft
    timeMaxRef.current = timeMax
    xyOfRef.current = xyOf
    hopToRef.current = hopTo
    startRunRef.current = startRun
    endRunRef.current = endRun
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (phaseRef.current !== 'play') {
          e.preventDefault()
          startRunRef.current()
        }
        return
      }
      const d = DIRS[e.key.toLowerCase()]
      if (!d) return
      e.preventDefault()
      if (phaseRef.current !== 'play') {
        startRunRef.current()
        return
      }
      tryTile({ r: posRef.current.r + d.r, c: posRef.current.c + d.c })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tiles = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = { r, c }
      const here = eq(pos, p)
      const isT = !!target && eq(target, p)
      const rival = hazards.find((h) => eq(h.pos, p))
      tiles.push(
        <button
          key={`${r}-${c}`}
          type="button"
          className={`oh-tile${here ? ' is-here' : ''}${isT ? ' is-target' : ''}${rival ? ` is-hazard is-${rival.kind}` : ''}${bad === `${r}-${c}` ? ' is-bad' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            tryTile(p)
          }}
          aria-label={rival ? `${rival.kind} ${r + 1} ${c + 1}` : isT ? `token ${r + 1} ${c + 1}` : `tile ${r + 1} ${c + 1}`}
        >
          {isT ? <TokenMark /> : null}
          {rival ? <RivalMark kind={rival.kind} /> : null}
        </button>,
      )
    }
  }

  const frac = phase === 'play' ? Math.max(0, timeLeft / timeMax) : phase === 'idle' ? 1 : 0
  const burstAt = burstPos ?? pos

  return (
    <div className="oh">
      <div className="oh-top">
        <Link to="/" className="oh-back">
          Dan
        </Link>
        <div className="oh-brand">Orb Hop</div>
        <div className="oh-best">
          best <b>{best}</b>
        </div>
      </div>

      <div className="oh-stage">
        <div className={`oh-score${phase === 'idle' ? ' is-ghost' : ''}`}>{phase === 'idle' ? '' : score}</div>
        <div className={`oh-score-unit${phase === 'play' || phase === 'over' ? '' : ' is-ghost'}`}>tokens</div>
        <div className="oh-combo">{phase === 'play' ? toast ?? (combo > 1 ? `x${combo}` : '') : ''}</div>
        <div className={`oh-bar${phase === 'idle' ? ' is-ghost' : ''}${phase === 'play' && frac < 0.28 ? ' is-low' : ''}`}>
          <i style={{ width: `${phase === 'idle' ? 0 : frac * 100}%` }} />
        </div>

        <div className="oh-board-wrap">
          <div className="oh-board" ref={boardRef}>
            {tiles}
          </div>

          {burst > 0 && phase === 'play' ? (
            <div
              key={burst}
              className="oh-burst"
              style={{
                left: burstAt.c * (metrics.cell + metrics.gap),
                top: burstAt.r * (metrics.cell + metrics.gap),
                width: metrics.cell,
                height: metrics.cell,
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ ['--r' as string]: `${i * 36}deg` }} />
              ))}
            </div>
          ) : null}

          <motion.div className="oh-actor" style={{ x, y, width: orbSize, height: orbSize }}>
            <motion.div className="oh-shadow" style={{ scale: shadow }} />
            <motion.div style={{ y: hopY, scaleX: squashX, scaleY: squashY, width: '100%', height: '100%' }}>
              <OrbFace mood={mood} look={look} blink={blink} />
            </motion.div>
          </motion.div>
        </div>

        <div className="oh-hint">
          {phase === 'play' ? (hint ? 'tap a next-door square' : 'grab tokens · dodge the labs') : phase === 'idle' ? '' : 'tap to try again'}
        </div>
      </div>

      {phase === 'idle' ? (
        <div className="oh-overlay" onPointerDown={() => startRun()}>
          <div className="oh-kicker">Grok Bot</div>
          <div className="oh-title">Orb</div>
          <p className="oh-sub">Hop him to the tokens. Don't land on Claude, OpenAI, Gemini, or DeepSeek.</p>
          <button type="button" className="oh-cta" onPointerDown={(e) => { e.stopPropagation(); startRun() }}>
            Play
          </button>
        </div>
      ) : null}

      {phase === 'over' ? (
        <div className="oh-overlay" onPointerDown={() => startRun()}>
          <div className="oh-kicker">game over</div>
          <div className="oh-over-score">{score}</div>
          <div className={`oh-over-note${newBest ? ' is-hot' : ''}`}>{newBest ? 'new best' : `best ${best}`}</div>
          <button type="button" className="oh-cta" onPointerDown={(e) => { e.stopPropagation(); startRun() }}>
            Again
          </button>
        </div>
      ) : null}
    </div>
  )
}

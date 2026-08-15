import { useEffect, useRef, useState } from 'react'
import type { MissionId } from './content'

export type MissionResult = { stars: 1 | 2 | 3; score: number; note: string }

const F1_FAILS = [
  'Flight 1 · 2006 — a fuel leak. The engine coughed out.',
  'Flight 2 · 2007 — the rocket wobbled itself apart.',
  'Flight 3 · 2008 — the stages bumped after they split.',
]

export function MissionPlay({ id, onDone }: { id: MissionId; onDone: (r: MissionResult) => void }) {
  if (id === 'ignition') return <Ignition onDone={onDone} />
  if (id === 'stack') return <Stack onDone={onDone} />
  if (id === 'land') return <Land onDone={onDone} />
  if (id === 'crew') return <Crew onDone={onDone} />
  if (id === 'constellation') return <Constellation onDone={onDone} />
  if (id === 'cadence') return <Cadence onDone={onDone} />
  if (id === 'catch') return <Catch onDone={onDone} />
  return <Bid onDone={onDone} />
}

function Stars({ n, note, onDone }: { n: 1 | 2 | 3; note: string; onDone: (r: MissionResult) => void }) {
  return (
    <div className="sb-done">
      <div className="sb-stars">{'★'.repeat(n)}{'☆'.repeat(3 - n)}</div>
      <p>{note}</p>
      <button className="sb-btn primary" onClick={() => onDone({ stars: n, score: n * 100, note })}>
        Debrief
      </button>
    </div>
  )
}

function Ignition({ onDone }: { onDone: (r: MissionResult) => void }) {
  const [flight, setFlight] = useState(1)
  const [msg, setMsg] = useState('Flight 1 is on the pad. Catch the green.')
  const [done, setDone] = useState<1 | 2 | 3 | null>(null)
  const needle = useRef(0)
  const raf = useRef(0)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let t = 0
    const loop = () => {
      t += 0.016
      const speed = flight >= 4 ? 1.6 : 2.3 + flight * 0.15
      needle.current = 0.5 + 0.48 * Math.sin(t * speed)
      if (bar.current) bar.current.style.left = `${needle.current * 100}%`
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [flight])

  const tap = () => {
    if (done) return
    const lo = flight >= 4 ? 0.55 : 0.62
    const hi = flight >= 4 ? 0.82 : 0.74
    if (needle.current >= lo && needle.current <= hi) {
      if (flight < 4) {
        setMsg(`${F1_FAILS[flight - 1]} Nice hit — history still needed four tries.`)
        setFlight((f) => f + 1)
      } else {
        setDone(flight === 4 ? 3 : 2)
        setMsg('Falcon 1 Flight 4 · 28 Sep 2008. First private liquid rocket to orbit.')
      }
    } else if (flight < 4) {
      setMsg(F1_FAILS[flight - 1])
      setFlight((f) => f + 1)
    } else {
      setDone(1)
      setMsg('Close. They only had one rocket left too.')
    }
  }

  if (done) return <Stars n={done} note={msg} onDone={onDone} />

  return (
    <div className="sb-mission">
      <div className="sb-kicker">Falcon 1 · Flight {Math.min(flight, 4)} of 4</div>
      <h3>Ignition window</h3>
      <p className="sb-help">{msg}</p>
      <div className="sb-gauge" onClick={tap}>
        <div className="sb-green" style={{ left: flight >= 4 ? '55%' : '62%', width: flight >= 4 ? '27%' : '12%' }} />
        <div ref={bar} className="sb-needle" />
      </div>
      <button className="sb-btn primary" onClick={tap}>
        Light
      </button>
    </div>
  )
}

const STACK = [
  { id: 'merlin', label: 'Merlin engines' },
  { id: 'tanks', label: 'Tanks & plumbing' },
  { id: 'inter', label: 'Interstage' },
  { id: 'mvac', label: 'Second stage' },
  { id: 'fairing', label: 'Fairing' },
  { id: 'dragon', label: 'Dragon' },
]

function Stack({ onDone }: { onDone: (r: MissionResult) => void }) {
  const [next, setNext] = useState(0)
  const [left, setLeft] = useState(22)
  const [done, setDone] = useState<1 | 2 | 3 | null>(null)
  const [msg, setMsg] = useState('Stack it yourself. That is the whole company in one sentence.')
  const [shake, setShake] = useState(false)
  const [order] = useState(() => [...STACK].sort(() => Math.random() - 0.5))

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          setDone(1)
          setMsg('The clock won. Vertical integration is a race.')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [done])

  const tap = (i: number) => {
    if (done) return
    if (i === next) {
      const n = next + 1
      setNext(n)
      if (n === STACK.length) {
        setDone(left > 10 ? 3 : left > 5 ? 2 : 1)
        setMsg('Factory built. You own the throttle.')
      }
    } else {
      setShake(true)
      setMsg('Wrong station. The line only works in order.')
      window.setTimeout(() => setShake(false), 240)
    }
  }

  if (done) return <Stars n={done} note={msg} onDone={onDone} />

  return (
    <div className={`sb-mission ${shake ? 'shake' : ''}`}>
      <div className="sb-kicker">{left}s · {next}/{STACK.length}</div>
      <h3>Stack the line</h3>
      <p className="sb-help">{msg}</p>
      <div className="sb-stack-vis">
        {STACK.map((p, i) => (
          <div key={p.id} className={`sb-seg ${i < next ? 'on' : ''}`} />
        ))}
      </div>
      <div className="sb-grid">
        {order.map((p) => {
          const i = STACK.findIndex((x) => x.id === p.id)
          return (
            <button key={p.id} className={`sb-chip ${i < next ? 'done' : ''}`} onClick={() => tap(i)} disabled={i < next}>
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Land({ onDone }: { onDone: (r: MissionResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lives, setLives] = useState(3)
  const [msg, setMsg] = useState('Keep it over the pad. Hold burn to kill speed.')
  const keys = useRef({ l: false, r: false, b: false })
  const st = useRef({ x: 0.5, y: 0.12, vx: 0.12, vy: 0.02, fuel: 1 })
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const livesRef = useRef(3)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf = 0
    let last = performance.now()
    let locked = false

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const w = c.clientWidth
      const h = c.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      const s = st.current
      if (!locked) {
        if (keys.current.l) s.vx -= 0.55 * dt
        if (keys.current.r) s.vx += 0.55 * dt
        if (keys.current.b && s.fuel > 0) {
          s.vy -= 0.85 * dt
          s.fuel -= 0.22 * dt
        } else s.vy += 0.42 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx *= 0.995
        if (s.x < 0.06) {
          s.x = 0.06
          s.vx *= -0.3
        }
        if (s.x > 0.94) {
          s.x = 0.94
          s.vx *= -0.3
        }
        if (s.y >= 0.84) {
          locked = true
          const good = Math.abs(s.x - 0.5) < 0.1 && s.vy < 0.28
          if (good) {
            const stars = (s.vy < 0.16 && Math.abs(s.x - 0.5) < 0.06 ? 3 : 2) as 1 | 2 | 3
            setMsg(stars === 3 ? 'Stick. That booster flies again.' : 'Down. A little hard, but you have a ship.')
            window.setTimeout(() => doneRef.current({ stars, score: stars * 100, note: 'First stage recovered.' }), 700)
          } else {
            const left = livesRef.current - 1
            livesRef.current = left
            setLives(left)
            if (left <= 0) {
              setMsg('Ocean. That is a $30M splash.')
              window.setTimeout(() => doneRef.current({ stars: 1, score: 40, note: 'Expended. The lesson still counts.' }), 700)
            } else {
              setMsg('Missed the shoes. Resetting.')
              st.current = { x: 0.5, y: 0.12, vx: (Math.random() - 0.5) * 0.3, vy: 0.02, fuel: 1 }
              locked = false
            }
          }
        }
      }
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(8,10,14,0.35)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3a4550'
      ctx.fillRect(0, h * 0.88, w, h * 0.12)
      ctx.fillStyle = '#d8c4a0'
      ctx.fillRect(w * 0.4, h * 0.86, w * 0.2, 8)
      ctx.fillStyle = 'rgba(255,200,80,0.25)'
      ctx.fillRect(w * 0.4, h * 0.2, w * 0.2, h * 0.66)
      const px = s.x * w
      const py = s.y * h
      ctx.fillStyle = '#e8e4dc'
      ctx.fillRect(px - 8, py - 28, 16, 36)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(px - 10, py + 8, 20, 6)
      if (keys.current.b && s.fuel > 0) {
        ctx.fillStyle = '#ffb060'
        ctx.beginPath()
        ctx.moveTo(px - 6, py + 14)
        ctx.lineTo(px, py + 28 + Math.random() * 8)
        ctx.lineTo(px + 6, py + 14)
        ctx.fill()
      }
      ctx.fillStyle = '#c8d0d8'
      ctx.font = '12px Outfit, sans-serif'
      ctx.fillText(`fuel ${Math.max(0, Math.round(s.fuel * 100))}%`, 12, 20)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.l = true
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.r = true
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        keys.current.b = true
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.l = false
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.r = false
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.current.b = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{lives} boosters left</div>
      <h3>Stick the landing</h3>
      <p className="sb-help">{msg}</p>
      <canvas ref={canvasRef} className="sb-canvas" />
      <div className="sb-dock">
        <button onPointerDown={() => (keys.current.l = true)} onPointerUp={() => (keys.current.l = false)}>
          ◀
        </button>
        <button
          onPointerDown={() => (keys.current.b = true)}
          onPointerUp={() => (keys.current.b = false)}
          className="burn"
        >
          Burn
        </button>
        <button onPointerDown={() => (keys.current.r = true)} onPointerUp={() => (keys.current.r = false)}>
          ▶
        </button>
      </div>
    </div>
  )
}

const SYS = ['Engines', 'Weather', 'Range', 'Crew']

function Crew({ onDone }: { onDone: (r: MissionResult) => void }) {
  const [lights, setLights] = useState([true, true, true, true])
  const [left, setLeft] = useState(22)
  const [hits, setHits] = useState(0)
  const [miss, setMiss] = useState(0)
  const [done, setDone] = useState<1 | 2 | 3 | null>(null)
  const red = useRef<number | null>(null)

  const hitsRef = useRef(0)
  const missRef = useRef(0)
  const stop = useRef(false)

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (stop.current) return
      setLeft((s) => {
        if (s <= 1) {
          stop.current = true
          const stars = (missRef.current === 0 && hitsRef.current >= 3 ? 3 : hitsRef.current >= 2 ? 2 : 1) as 1 | 2 | 3
          setDone(stars)
          return 0
        }
        return s - 1
      })
    }, 1000)
    const spawn = () => {
      if (stop.current) return
      const i = Math.floor(Math.random() * 4)
      red.current = i
      setLights((l) => l.map((_, k) => k !== i))
      window.setTimeout(() => {
        if (red.current === i) {
          red.current = null
          setLights([true, true, true, true])
          missRef.current += 1
          setMiss(missRef.current)
        }
      }, 1400)
    }
    const t1 = window.setTimeout(spawn, 1200)
    const t2 = window.setInterval(spawn, 3200)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(t1)
      window.clearInterval(t2)
    }
  }, [])

  const tap = (i: number) => {
    if (done) return
    if (red.current === i) {
      red.current = null
      setLights([true, true, true, true])
      hitsRef.current += 1
      setHits(hitsRef.current)
    } else {
      missRef.current += 1
      setMiss(missRef.current)
    }
  }

  if (done) {
    return (
      <Stars
        n={done}
        note={done === 3 ? 'Clean. That is how Crew Dragon earned NASA.' : 'You flew. Certification is picky on purpose.'}
        onDone={onDone}
      />
    )
  }

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{left}s · caught {hits} · misses {miss}</div>
      <h3>Go / no-go</h3>
      <p className="sb-help">Abort the red one. Leave the green ones alone.</p>
      <div className="sb-grid">
        {SYS.map((name, i) => (
          <button key={name} className={`sb-sys ${lights[i] ? 'go' : 'nogo'}`} onClick={() => tap(i)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Constellation({ onDone }: { onDone: (r: MissionResult) => void }) {
  const slots = 12
  const [filled, setFilled] = useState<boolean[]>(Array(slots).fill(false))
  const n = filled.filter(Boolean).length
  const rings = [0, 1, 2].map((r) => filled.slice(r * 4, r * 4 + 4).filter(Boolean).length)
  const even = rings.every((x) => x >= 2)

  const finish = () => {
    const stars = (n >= 10 && even ? 3 : n >= 7 ? 2 : 1) as 1 | 2 | 3
    onDone({
      stars,
      score: n * 20,
      note: even ? 'Even shells. That is how you sell coverage, not launches.' : 'Lumpy sky. Users in the gaps will churn.',
    })
  }

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{n}/12 sats · shells {rings.join('-')}</div>
      <h3>Paint the sky</h3>
      <p className="sb-help">Fill three orbital shells. Even coverage beats a pile in one ring.</p>
      <div className="sb-earth">
        {[0, 1, 2].map((ring) => (
          <div key={ring} className={`sb-ring r${ring}`}>
            {[0, 1, 2, 3].map((s) => {
              const i = ring * 4 + s
              const rad = [96, 72, 50][ring]
              const a = ((s * 90 - 90) * Math.PI) / 180
              return (
                <button
                  key={i}
                  className={`sb-sat ${filled[i] ? 'on' : ''}`}
                  style={{ left: `calc(50% + ${Math.cos(a) * rad}px)`, top: `calc(50% + ${Math.sin(a) * rad}px)` }}
                  onClick={() => setFilled((f) => f.map((v, k) => (k === i ? !v : v)))}
                />
              )
            })}
          </div>
        ))}
        <div className="sb-planet" />
      </div>
      <button className="sb-btn primary" onClick={finish} disabled={n < 4}>
        Deploy
      </button>
    </div>
  )
}

function Cadence({ onDone }: { onDone: (r: MissionResult) => void }) {
  type Pad = { id: number; state: 'idle' | 'stack' | 'ready' | 'fly' | 'land'; t: number }
  const [pads, setPads] = useState<Pad[]>([
    { id: 1, state: 'idle', t: 0 },
    { id: 2, state: 'idle', t: 0 },
    { id: 3, state: 'idle', t: 0 },
  ])
  const [left, setLeft] = useState(40)
  const [flown, setFlown] = useState(0)
  const flownRef = useRef(0)
  const [done, setDone] = useState<1 | 2 | 3 | null>(null)

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          const n = flownRef.current
          setDone((n >= 6 ? 3 : n >= 3 ? 2 : 1) as 1 | 2 | 3)
          return 0
        }
        return s - 1
      })
      setPads((ps) =>
        ps.map((p) => {
          if (p.state === 'stack') return p.t >= 1 ? { ...p, state: 'ready', t: 0 } : { ...p, t: p.t + 0.25 }
          if (p.state === 'fly') return p.t >= 1 ? { ...p, state: 'land', t: 0.8 } : { ...p, t: p.t + 0.25 }
          if (p.state === 'land') return { ...p, t: Math.max(0, p.t - 0.12) }
          if (p.state === 'ready') return { ...p, t: p.t + 0.25 }
          return p
        }),
      )
    }, 250)
    return () => window.clearInterval(id)
  }, [done, flown])

  const hit = (p: Pad) => {
    if (done) return
    if (p.state === 'idle') setPads((ps) => ps.map((x) => (x.id === p.id ? { ...x, state: 'stack', t: 0 } : x)))
    else if (p.state === 'ready') setPads((ps) => ps.map((x) => (x.id === p.id ? { ...x, state: 'fly', t: 0 } : x)))
    else if (p.state === 'land') {
      flownRef.current += 1
      setFlown(flownRef.current)
      setPads((ps) => ps.map((x) => (x.id === p.id ? { ...x, state: 'idle', t: 0 } : x)))
    }
  }

  if (done) {
    return <Stars n={done} note={`${flown} flights. That is an airline, not a parade.`} onDone={onDone} />
  }

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{left}s · {flown} flights</div>
      <h3>Keep the airline open</h3>
      <p className="sb-help">Stack → launch → catch the landing. Do not let a pad sit idle.</p>
      <div className="sb-pads">
        {pads.map((p) => (
          <button key={p.id} className={`sb-pad ${p.state}`} onClick={() => hit(p)}>
            <strong>Pad {p.id}</strong>
            <span>
              {p.state === 'idle' && 'Stack'}
              {p.state === 'stack' && 'Stacking…'}
              {p.state === 'ready' && 'LAUNCH'}
              {p.state === 'fly' && 'In flight'}
              {p.state === 'land' && 'LAND'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Catch({ onDone }: { onDone: (r: MissionResult) => void }) {
  const [y, setY] = useState(0)
  const [tries, setTries] = useState(3)
  const [done, setDone] = useState<1 | 2 | 3 | null>(null)
  const [msg, setMsg] = useState('Catch in the glowing band. Too early clips the ship. Too late is the drink.')
  const running = useRef(true)

  useEffect(() => {
    if (done) return
    running.current = true
    let v = 0
    const id = window.setInterval(() => {
      if (!running.current) return
      v += 0.0035
      setY((p) => {
        const n = p + 0.018 + v
        if (n > 1.05) {
          running.current = false
          window.clearInterval(id)
          const left = tries - 1
          setTries(left)
          if (left <= 0) {
            setDone(1)
            setMsg('Splash. Full reuse is a timing business.')
          } else {
            setMsg('Missed. Tower reset.')
            window.setTimeout(() => {
              setY(0)
              running.current = true
            }, 400)
          }
          return 1
        }
        return n
      })
    }, 32)
    return () => window.clearInterval(id)
  }, [tries, done])

  const catchNow = () => {
    if (done || !running.current) return
    if (y >= 0.62 && y <= 0.8) {
      running.current = false
      const stars = (y > 0.68 && y < 0.76 ? 3 : 2) as 1 | 2 | 3
      setDone(stars)
      setMsg(stars === 3 ? 'Chopsticks. The booster is an asset again.' : 'Caught. A little off-center.')
    } else {
      running.current = false
      const left = tries - 1
      setTries(left)
      if (left <= 0) {
        setDone(1)
        setMsg('Not in the window.')
      } else {
        setMsg('Outside the window. Resetting.')
        window.setTimeout(() => setY(0), 350)
      }
    }
  }

  if (done) return <Stars n={done} note={msg} onDone={onDone} />

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{tries} attempts</div>
      <h3>Mechazilla</h3>
      <p className="sb-help">{msg}</p>
      <div className="sb-tower">
        <div className="sb-window" />
        <div className="sb-booster" style={{ top: `${8 + y * 72}%` }} />
      </div>
      <button className="sb-btn primary" onClick={catchNow}>
        Catch
      </button>
    </div>
  )
}

const DEALS = [
  {
    id: 'nssl',
    name: 'Space Force NSSL slot',
    blurb: 'Secret satellite. They care about two vendors, not just the cheapest.',
    value: 90,
    rival: 'ULA Vulcan · $140M',
    fair: 85,
  },
  {
    id: 'kuiper',
    name: 'Amazon Kuiper batch',
    blurb: 'Your rival’s internet. They will pay you to launch it because they are late.',
    value: 70,
    rival: 'New Glenn (slips) · $80M',
    fair: 68,
  },
  {
    id: 'science',
    name: 'University climate sat',
    blurb: 'Tiny check, huge goodwill. Rocket Lab wants this too.',
    value: 18,
    rival: 'Electron rideshare · $16M',
    fair: 15,
  },
]

function Bid({ onDone }: { onDone: (r: MissionResult) => void }) {
  const [deal, setDeal] = useState<(typeof DEALS)[0] | null>(null)
  const [note, setNote] = useState('')
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)

  const price = (mult: number) => {
    if (!deal) return
    const bid = Math.round(deal.fair * mult)
    const win = bid <= deal.fair * 1.18
    const margin = bid - deal.fair * 0.72
    if (!win) {
      setStars(1)
      setNote(`Lost to ${deal.rival}. Too proud. Dual-source exists so they can walk away.`)
    } else if (margin < 0) {
      setStars(2)
      setNote(`Won at $${bid}M. You bought the logo and sold the flight at a loss.`)
    } else {
      setStars(3)
      setNote(`Won at $${bid}M. Price + cadence + trust. That is the industry.`)
    }
  }

  if (stars && deal) return <Stars n={stars} note={note} onDone={onDone} />

  if (!deal) {
    return (
      <div className="sb-mission">
        <div className="sb-kicker">Industry desk</div>
        <h3>Pick a fight</h3>
        <p className="sb-help">Every contract teaches a different buyer.</p>
        <div className="sb-deals">
          {DEALS.map((d) => (
            <button key={d.id} className="sb-deal" onClick={() => setDeal(d)}>
              <strong>{d.name}</strong>
              <span>{d.blurb}</span>
              <em>Customer value ~${d.value}M</em>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="sb-mission">
      <div className="sb-kicker">{deal.name}</div>
      <h3>Set the price</h3>
      <p className="sb-help">
        {deal.blurb} Rival: {deal.rival}
      </p>
      <div className="sb-grid">
        <button className="sb-chip" onClick={() => price(0.8)}>
          Low-ball ${Math.round(deal.fair * 0.8)}M
        </button>
        <button className="sb-chip" onClick={() => price(1)}>
          Fair ${deal.fair}M
        </button>
        <button className="sb-chip" onClick={() => price(1.35)}>
          Premium ${Math.round(deal.fair * 1.35)}M
        </button>
      </div>
    </div>
  )
}

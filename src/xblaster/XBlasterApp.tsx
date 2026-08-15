import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createGame,
  levelFor,
  nextLevel,
  resolveStep,
  retry,
  startGame,
  tap,
  trySwap,
  type Fx,
  type Game,
  type Pos,
} from './engine'
import { createRenderer, type Renderer } from './render'
import './xblaster.css'

const LS_BEST = 'x-blaster-best'

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export default function XBlasterApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const gameRef = useRef<Game | null>(null)
  if (!gameRef.current) {
    const boot = createGame()
    startGame(boot, 1)
    gameRef.current = boot
  }
  const game = () => gameRef.current!
  const busyRef = useRef(false)
  const aliveRef = useRef(true)
  const preferRef = useRef<Pos | null>(null)
  const dragRef = useRef<{ from: Pos; x: number; y: number } | null>(null)
  const [phase, setPhase] = useState<'play' | 'won' | 'lost'>('play')
  const [best, setBest] = useState(() => Number(localStorage.getItem(LS_BEST) || 0))
  const [label, setLabel] = useState(levelFor(1).name)

  useEffect(() => {
    document.title = 'X Blaster · kettlebelldan.com'
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    aliveRef.current = true
    const renderer = createRenderer(canvas)
    rendererRef.current = renderer
    renderer.resize()
    const onResize = () => renderer.resize()
    window.addEventListener('resize', onResize)

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      renderer.draw(game(), dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      aliveRef.current = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  const rememberBest = (score: number) => {
    if (score > Number(localStorage.getItem(LS_BEST) || 0)) {
      localStorage.setItem(LS_BEST, String(score))
      setBest(score)
    }
  }

  const playFx = (fx: Fx[]) => {
    rendererRef.current?.feed(fx)
    if (fx.some((e) => e.kind === 'win')) {
      setPhase('won')
      rememberBest(game().score)
    }
    if (fx.some((e) => e.kind === 'lose')) {
      setPhase('lost')
      rememberBest(game().score)
    }
    if (fx.some((e) => e.kind === 'shuffle')) setLabel(levelFor(game().level).name)
  }

  const cascade = async () => {
    const g = game()
    let first = true
    for (let i = 0; i < 24; i++) {
      if (!aliveRef.current) return
      const step = resolveStep(g, first ? preferRef.current : null)
      first = false
      if (!step.length) break
      playFx(step)
      if (step.some((e) => e.kind === 'win' || e.kind === 'lose')) break
      const clear = step.some((e) => e.kind === 'clear')
      await wait(clear ? 240 : 160)
    }
    preferRef.current = null
    setLabel(levelFor(g.level).name)
    busyRef.current = false
  }

  const runMove = async (fx: Fx[]) => {
    if (!fx.length) {
      busyRef.current = false
      return
    }
    const motion = fx.filter((e) => e.kind === 'swap' || e.kind === 'swapback')
    const rest = fx.filter((e) => e.kind !== 'swap' && e.kind !== 'swapback')
    if (motion.length) playFx(motion)
    if (fx.some((e) => e.kind === 'swapback')) {
      await wait(200)
      busyRef.current = false
      return
    }
    if (motion.length) await wait(140)
    if (rest.length) playFx(rest)
    if (rest.some((e) => e.kind === 'clear')) await wait(240)
    await cascade()
  }

  const handlePos = (p: Pos | null) => {
    if (!p || busyRef.current || phase !== 'play') return
    const g = game()
    if (g.status !== 'playing') return
    const selected = g.selected
    busyRef.current = true
    const fx = tap(g, p)
    if (selected && (selected.r !== p.r || selected.c !== p.c)) preferRef.current = p
    void runMove(fx).finally(() => {
      if (!fx.some((e) => e.kind === 'swap' || e.kind === 'swapback' || e.kind === 'clear')) {
        busyRef.current = false
      }
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const posAt = (e: PointerEvent) => rendererRef.current?.hit(e.clientX, e.clientY) ?? null

    const down = (e: PointerEvent) => {
      const p = posAt(e)
      if (!p) return
      dragRef.current = { from: p, x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }

    const move = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || busyRef.current || phase !== 'play') return
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      if (Math.hypot(dx, dy) < 18) return
      const to: Pos =
        Math.abs(dx) > Math.abs(dy)
          ? { r: drag.from.r, c: drag.from.c + (dx > 0 ? 1 : -1) }
          : { r: drag.from.r + (dy > 0 ? 1 : -1), c: drag.from.c }
      dragRef.current = null
      const g = game()
      if (g.status !== 'playing') return
      busyRef.current = true
      preferRef.current = to
      void runMove(trySwap(g, drag.from, to))
    }

    const up = (e: PointerEvent) => {
      const drag = dragRef.current
      dragRef.current = null
      if (!drag) return
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 18) handlePos(drag.from)
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = game()
      if (e.key === 'Enter' && phase === 'won') {
        goNext()
        return
      }
      if ((e.key === 'Enter' || e.key.toLowerCase() === 'r') && phase === 'lost') {
        replay()
        return
      }
      if (busyRef.current || g.status !== 'playing') return
      const sel = g.selected ?? { r: 3, c: 3 }
      const map: Record<string, Pos> = {
        arrowup: { r: sel.r - 1, c: sel.c },
        w: { r: sel.r - 1, c: sel.c },
        arrowdown: { r: sel.r + 1, c: sel.c },
        s: { r: sel.r + 1, c: sel.c },
        arrowleft: { r: sel.r, c: sel.c - 1 },
        a: { r: sel.r, c: sel.c - 1 },
        arrowright: { r: sel.r, c: sel.c + 1 },
        d: { r: sel.r, c: sel.c + 1 },
      }
      const dest = map[e.key.toLowerCase()]
      if (!dest) return
      e.preventDefault()
      if (!g.selected) {
        g.selected = sel
        return
      }
      busyRef.current = true
      preferRef.current = dest
      void runMove(trySwap(g, sel, dest))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const replay = () => {
    retry(game())
    setPhase('play')
    setLabel(levelFor(game().level).name)
    busyRef.current = false
  }

  const goNext = () => {
    nextLevel(game())
    setPhase('play')
    setLabel(levelFor(game().level).name)
    busyRef.current = false
  }

  const fresh = () => {
    startGame(game(), 1)
    setPhase('play')
    setLabel(levelFor(1).name)
    busyRef.current = false
  }

  const g = game()
  const lv = levelFor(g.level)

  return (
    <div className="xb">
      <canvas ref={canvasRef} className="xb-canvas" />

      <div className="xb-top">
        <div className="xb-row">
          <Link className="xb-btn" to="/">
            Home
          </Link>
        </div>
        <div className="xb-row">
          <button className="xb-btn" onClick={fresh}>
            New launch
          </button>
        </div>
      </div>

      {phase === 'play' && (
        <div className="xb-hint">4 laser · 6 rail · 2×2 X-blade · L fire · 5 core · tap a weapon to fire</div>
      )}

      {phase === 'won' && (
        <div className="xb-overlay">
          <div className="xb-card">
            <div className="xb-kicker">Orbit achieved</div>
            <h2>{label}</h2>
            <p>
              {g.score.toLocaleString()} · target {lv.target.toLocaleString()}
              <br />
              Best {best.toLocaleString()}
            </p>
            <div className="xb-actions">
              <Link className="xb-btn" to="/">
                Home
              </Link>
              <button className="xb-btn primary" onClick={goNext}>
                Next pad
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'lost' && (
        <div className="xb-overlay">
          <div className="xb-card">
            <div className="xb-kicker">Rapid unscheduled</div>
            <h2>{label}</h2>
            <p>
              {g.score.toLocaleString()} of {lv.target.toLocaleString()}
              <br />
              Best {best.toLocaleString()}
            </p>
            <div className="xb-actions">
              <Link className="xb-btn" to="/">
                Home
              </Link>
              <button className="xb-btn primary" onClick={replay}>
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

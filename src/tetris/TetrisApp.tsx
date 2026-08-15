import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import {
  createGame,
  input,
  levelFor,
  startGame,
  step,
  type FxEvent,
  type Game,
} from './engine'
import { createRenderer, type Renderer } from './render'
import './tetris.css'

const LS_BEST = 'spacex-tetris-best'

export default function TetrisApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const gameRef = useRef<Game>(createGame())
  const keysRef = useRef<Record<string, boolean>>({})
  const dasRef = useRef({ dir: 0, t: 0, charged: false })
  const [over, setOver] = useState(false)
  const [waiting, setWaiting] = useState(true)
  const [stats, setStats] = useState({ score: 0, lines: 0, level: 1, name: 'Preflight' })
  const [best, setBest] = useState(() => Number(localStorage.getItem(LS_BEST) || 0))

  useEffect(() => {
    document.title = 'SpaceX Tetris · kettlebelldan.com'
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = createRenderer(canvas)
    rendererRef.current = renderer
    renderer.resize()
    const onResize = () => renderer.resize()
    window.addEventListener('resize', onResize)

    let raf = 0
    let last = performance.now()
    let hud = 0
    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      const g = gameRef.current
      const fx: FxEvent[] = []
      const keys = keysRef.current

      if (g.status === 'playing') {
        const left = keys['arrowleft'] || keys['a']
        const right = keys['arrowright'] || keys['d']
        const dir = left && !right ? -1 : right && !left ? 1 : 0
        const das = dasRef.current
        if (dir === 0) {
          das.dir = 0
          das.t = 0
          das.charged = false
        } else if (dir !== das.dir) {
          das.dir = dir
          das.t = 0
          das.charged = false
          fx.push(...input(g, dir < 0 ? 'left' : 'right'))
        } else {
          das.t += dt
          if (!das.charged && das.t >= 0.12) {
            das.charged = true
            das.t = 0
            fx.push(...input(g, dir < 0 ? 'left' : 'right'))
          } else if (das.charged && das.t >= 0.018) {
            das.t = 0
            fx.push(...input(g, dir < 0 ? 'left' : 'right'))
          }
        }
        if (keys['arrowdown'] || keys['s']) fx.push(...input(g, 'soft'))
      }

      fx.push(...step(g, dt))
      renderer.feed(fx)
      renderer.draw(g, dt)

      if (fx.some((e) => e.kind === 'gameover')) {
        setOver(true)
        if (g.score > Number(localStorage.getItem(LS_BEST) || 0)) {
          localStorage.setItem(LS_BEST, String(g.score))
          setBest(g.score)
        }
      }

      hud += dt
      if (hud > 0.12) {
        hud = 0
        const lvl = levelFor(g.levelIndex)
        setStats({ score: g.score, lines: g.lines, level: g.levelIndex, name: lvl.name })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current[key] = true
      if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' '].includes(key)) e.preventDefault()
      const g = gameRef.current
      if (g.status === 'ready') {
        if (key === ' ' || key === 'enter') {
          e.preventDefault()
          begin()
        }
        return
      }
      if (key === 'p' || key === 'escape') input(g, 'pause')
      if (key === 'arrowup' || key === 'x' || key === 'w') input(g, 'cw')
      if (key === 'z' || key === 'control') input(g, 'ccw')
      if (key === ' ') void input(g, 'hard')
      if ((key === 'r' || key === 'enter') && g.status === 'over') begin()
    }
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const begin = () => {
    gameRef.current = createGame()
    startGame(gameRef.current)
    setOver(false)
    setWaiting(false)
    dasRef.current = { dir: 0, t: 0, charged: false }
  }

  const tap = (action: Parameters<typeof input>[1]) => {
    input(gameRef.current, action)
  }

  const screenshot = () => {
    const data = rendererRef.current?.capture()
    if (!data) return
    const a = document.createElement('a')
    a.href = data
    a.download = `ascent-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
    a.click()
  }

  return (
    <div className="stx play">
      <canvas ref={canvasRef} className="stx-canvas" />

      <div className="stx-top">
        <div className="row">
          <Link className="stx-btn" to="/">
            Home
          </Link>
          <button className="stx-btn" onClick={() => input(gameRef.current, 'pause')}>
            Pause
          </button>
        </div>
        <div className="row">
          <button className="stx-shot" onClick={screenshot} title="Save screenshot" aria-label="Save screenshot">
            <Camera size={16} strokeWidth={1.6} />
          </button>
          <button className="stx-btn" onClick={begin}>
            New flight
          </button>
        </div>
      </div>

      <div className="stx-dock">
        <div className="keys">
          <button onPointerDown={() => tap('ccw')}>CCW</button>
          <button onPointerDown={() => tap('left')}>Left</button>
          <button onPointerDown={() => tap('cw')}>Rot</button>
          <button onPointerDown={() => tap('right')}>Right</button>
          <button onPointerDown={() => tap('hard')}>Drop</button>
        </div>
      </div>

      {waiting && !over && (
        <div className="stx-overlay stx-start">
          <button className="stx-btn primary stx-start-btn" onClick={begin}>
            Start
          </button>
        </div>
      )}

      {over && (
        <div className="stx-overlay">
          <div className="card">
            <div className="stx-kicker">Flight terminated</div>
            <h2>{stats.name}</h2>
            <p className="stx-help">
              {stats.score.toLocaleString()} · {stats.lines} lines · level {stats.level}
              <br />
              Best {best.toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <Link className="stx-btn" to="/" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>
                Home
              </Link>
              <button className="stx-btn primary" style={{ width: 'auto', marginTop: 0 }} onClick={begin}>
                Fly again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

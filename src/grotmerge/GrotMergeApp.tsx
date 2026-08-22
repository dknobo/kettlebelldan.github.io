import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TIERS, clampDropX, createGame, drop, layout, startRun, step, type Game, type Phase } from './engine'
import { createRenderer, type Renderer } from './render'
import { dropClick, pop, startBed, stopBed, thud, unlockAudio } from './sound'
import './grotmerge.css'

export default function GrotMergeApp() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<Game>(createGame())
  const renderer = useRef<Renderer | null>(null)
  const last = useRef(0)
  const [phase, setPhase] = useState<Phase>('title')
  const [hud, setHud] = useState({ score: 0, best: game.current.best, warn: 0 })

  useEffect(() => {
    const el = wrap.current!
    const cv = canvas.current!
    const g = game.current
    renderer.current = createRenderer(cv)

    const fit = () => {
      const r = el.getBoundingClientRect()
      renderer.current?.resize(r.width, r.height)
      layout(g, r.width, r.height)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)

    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(34, now - (last.current || now))
      last.current = now
      const before = g.score
      const ph = g.phase
      step(g, dt)
      if (g.score !== before) pop()
      if (ph === 'play' && g.phase === 'over') {
        thud()
        stopBed()
        setPhase('over')
      }
      const warn = g.warnMs > 0 ? Math.ceil((5000 - g.warnMs) / 1000) : 0
      if (g.score !== hud.score || g.best !== hud.best || warn !== hud.warn) {
        setHud({ score: g.score, best: g.best, warn })
      }
      renderer.current?.draw(g)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      stopBed()
    }
    // hud is read inside rAF; we only want this to mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aim = (clientX: number) => {
    const cv = canvas.current
    if (!cv) return
    const r = cv.getBoundingClientRect()
    clampDropX(game.current, clientX - r.left)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    unlockAudio()
    ;(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId)
    game.current.holding = true
    aim(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!game.current.holding && e.pointerType !== 'mouse') return
    aim(e.clientX)
  }
  const onPointerUp = (_e: React.PointerEvent) => {
    if (!game.current.holding) return
    game.current.holding = false
    if (game.current.phase === 'play') {
      if (drop(game.current)) dropClick()
    }
  }

  const play = () => {
    unlockAudio()
    startBed()
    startRun(game.current)
    setPhase('play')
    setHud({ score: 0, best: game.current.best, warn: 0 })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') play()
      if (e.key === ' ' && game.current.phase === 'play') {
        e.preventDefault()
        drop(game.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="grot">
      <div className="grot-bar">
        <Link to="/" className="grot-home">
          Dan
        </Link>
        <div className="grot-word">Grot Bot Merge</div>
        <div className="grot-scores">
          <div>
            <span>Score</span>
            <b>{hud.score}</b>
          </div>
          <div>
            <span>Best</span>
            <b>{hud.best}</b>
          </div>
        </div>
      </div>
      <div className="grot-stage" ref={wrap}>
        <canvas
          ref={canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {phase !== 'play' && (
          <div className="grot-overlay">
            <div className="grot-card">
              <h1>{phase === 'over' ? 'Bowl full' : 'Grot Bot Merge'}</h1>
              <p>
                {phase === 'over'
                  ? `You scored ${hud.score}. Two of the same Grot become the next color.`
                  : 'Drop Grot Bots. Match two of a kind to grow the next. Sitting on the line is fine — fully above it turns red and you have 5 seconds to fix it.'}
              </p>
              <div className="grot-actions">
                <button className="grot-btn primary" type="button" onClick={play}>
                  {phase === 'over' ? 'Again' : 'Play'}
                </button>
                <Link className="grot-btn" to="/">
                  Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grot-ladder" aria-label="Merge ladder">
        <span>Ladder</span>
        {TIERS.map((_, i) => (
          <img
            key={i}
            src={`/grot_bot_merge/bots/bot_${String(i).padStart(2, '0')}.png`}
            alt=""
            style={{ width: 16 + i * 1.6, height: 16 + i * 1.6 }}
          />
        ))}
      </div>
    </div>
  )
}

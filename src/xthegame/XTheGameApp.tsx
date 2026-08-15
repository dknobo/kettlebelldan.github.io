import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARSENAL, POWERS, createGame, startRun, step, type Game, type PowerKind } from './engine'
import { createRenderer, type Renderer } from './render'
import { duckMusic, playStageMusic, preloadMusic, sfx, startMusic, unlockAudio } from './audio'
import './xthegame.css'

const LS_BEST = 'x-the-game-best'

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
}

function screenAngle() {
  const o = window.screen?.orientation?.angle
  if (typeof o === 'number') return o
  const w = (window as Window & { orientation?: number }).orientation
  return typeof w === 'number' ? w : 0
}

function deadzone(v: number, z = 0.12) {
  const a = Math.abs(v)
  if (a < z) return 0
  return Math.sign(v) * ((a - z) / (1 - z))
}

export default function XTheGameApp() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const game = useRef<Game>(createGame())
  const renderer = useRef<Renderer | null>(null)
  const keys = useRef<Record<string, boolean>>({})
  const mouse = useRef({ x: 400, y: 300, on: true })
  const dashQ = useRef(false)
  const fireHeld = useRef(false)
  const mobile = useRef(isMobileDevice())
  const tilt = useRef({ x: 0, y: 0, ready: false })
  const tiltRest = useRef<{ b: number; g: number } | null>(null)
  const tiltNeedCal = useRef(false)
  const drag = useRef({ on: false, x: 0, y: 0, sx: 0, sy: 0 })
  const prev = useRef({ kills: 0, weapon: 1, hp: 4, phase: 'title' as Game['phase'], wave: -1 })
  const [best, setBest] = useState(() => Number(localStorage.getItem(LS_BEST) || 0))
  const [touchUI] = useState(() => isMobileDevice())

  const [phase, setPhase] = useState<Game['phase']>('title')
  const [hud, setHud] = useState({
    score: 0,
    weapon: 1,
    kills: 0,
    goal: 69,
    hp: 4,
    maxHp: 4,
    waveName: '',
    waveTag: '',
    banner: 0,
    combo: 0,
    boss: 0,
    bossMax: 0,
    unlock: null as { name: string; use: string; t: number } | null,
    boost: 0,
    mult: 1,
    note: null as { name: string; use: string; t: number } | null,
    paused: false,
    hyper: 0,
    buffs: { rapid: 0, nova: 0, titan: 0 } as Record<PowerKind, number>,
  })
  const [deadGate, setDeadGate] = useState(false)
  const deadGateRef = useRef(false)

  const dismissOver = useCallback(() => {
    deadGateRef.current = false
    setDeadGate(false)
  }, [])

  useEffect(() => {
    document.title = 'X THE GAME · kettlebelldan.com'
    preloadMusic()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = createRenderer(canvas)
    renderer.current = r
    r.resize()
    const onResize = () => r.resize()
    window.addEventListener('resize', onResize)

    let raf = 0
    let last = performance.now()
    let hudT = 0
    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      const g = game.current
      const k = keys.current
      const rotate = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0)
      const thrust = !!(k['w'] || k['arrowup'])
      const playing = g.phase === 'play' || g.phase === 'boss'
      const hyper = mobile.current ? false : dashQ.current
      dashQ.current = false
      const kFire = !!(k[' '] || k['space'] || k['f'] || k['j'])
      const useTilt = mobile.current && tilt.current.ready
      const useDrag = mobile.current && !useTilt && drag.current.on
      const analog = useTilt ? { x: tilt.current.x, y: tilt.current.y } : useDrag ? { x: drag.current.x, y: drag.current.y } : null
      step(g, dt, {
        rotate: analog ? 0 : rotate,
        thrust: analog ? false : thrust,
        hyper,
        fire: playing && !g.paused && (fireHeld.current || (!mobile.current && kFire)),
        tilt: analog,
      })

      if (g.kills > prev.current.kills) sfx.kill()
      if (g.weapon > prev.current.weapon) sfx.level()
      if (g.player.hp < prev.current.hp) sfx.hurt()
      if (g.phase === 'boss' && prev.current.phase !== 'boss') {
        sfx.boss()
        playStageMusic(g.wave, 'boss')
      } else if (g.phase === 'play' && g.wave !== prev.current.wave && prev.current.wave >= 0) {
        playStageMusic(g.wave, 'play')
      }
      if (g.phase === 'win' && prev.current.phase !== 'win') {
        duckMusic()
        sfx.win()
        const score = g.score
        const was = Number(localStorage.getItem(LS_BEST) || 0)
        if (score > was) {
          localStorage.setItem(LS_BEST, String(score))
          setBest(score)
        }
      }
      if (g.phase === 'dead' && prev.current.phase !== 'dead') {
        duckMusic()
        sfx.dead()
        fireHeld.current = false
        deadGateRef.current = true
        setDeadGate(true)
        const score = g.score
        const was = Number(localStorage.getItem(LS_BEST) || 0)
        if (score > was) {
          localStorage.setItem(LS_BEST, String(score))
          setBest(score)
        }
      }
      prev.current = { kills: g.kills, weapon: g.weapon, hp: g.player.hp, phase: g.phase, wave: g.wave }

      r.draw(g)
      hudT += dt
      if (hudT > 0.08) {
        hudT = 0
        setPhase(g.phase)
        setHud({
          score: Math.floor(g.shown),
          weapon: g.weapon,
          kills: g.kills,
          goal: g.goal,
          hp: g.player.hp,
          maxHp: g.player.maxHp,
          waveName: g.waveName,
          waveTag: g.waveTag,
          banner: g.waveBanner,
          combo: g.combo,
          boss: g.boss?.hp ?? 0,
          bossMax: g.boss?.max ?? 0,
          unlock: g.unlock,
          boost: g.boostT,
          mult: g.boostMul,
          note: g.note,
          paused: g.paused,
          hyper: g.player.dashCd,
          buffs: { ...g.buffs },
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const enableTilt = useCallback(async () => {
    if (!mobile.current) return
    try {
      const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<string>
      }
      if (typeof DOE.requestPermission === 'function') await DOE.requestPermission()
    } catch {
      /* permission optional */
    }
    tiltNeedCal.current = true
    tilt.current.ready = false
  }, [])

  const play = useCallback(() => {
    unlockAudio()
    startMusic()
    void enableTilt()
    startRun(game.current)
    fireHeld.current = false
    deadGateRef.current = false
    setDeadGate(false)
    prev.current = { kills: 0, weapon: 1, hp: 4, phase: 'play', wave: 0 }
    setPhase('play')
  }, [enableTilt])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keys.current[key] = e.type === 'keydown'
      if (e.code === 'Space') keys.current[' '] = e.type === 'keydown'
      if (e.type !== 'keydown') return
      const phase = game.current.phase
      const playing = phase === 'play' || phase === 'boss'
      if (phase === 'dead' || phase === 'win') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code.startsWith('Arrow') || key === 'r') e.preventDefault()
        return
      }
      if (!playing && (e.code === 'Enter' || e.code === 'Space' || key === 'r')) {
        e.preventDefault()
        play()
        return
      }
      if (playing && key === 'p') {
        e.preventDefault()
        game.current.paused = !game.current.paused
        return
      }
      if (playing && (e.code === 'Space' || key === 'f' || key === 'j')) {
        e.preventDefault()
        return
      }
      if (playing && !game.current.paused && (key === 'x' || e.code.startsWith('Shift'))) {
        e.preventDefault()
        if (game.current.player.dashCd <= 0) {
          dashQ.current = true
          sfx.dash()
        }
        unlockAudio()
      }
    }
    const onMove = (e: PointerEvent) => {
      const r = renderer.current
      if (!r) return
      const w = r.toWorld(e.clientX, e.clientY)
      mouse.current = { x: w.x, y: w.y, on: true }
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (!mobile.current) return
      if (e.beta == null || e.gamma == null) return
      if (tiltNeedCal.current || !tiltRest.current) {
        tiltRest.current = { b: e.beta, g: e.gamma }
        tiltNeedCal.current = false
        tilt.current.ready = true
      }
      const rest = tiltRest.current
      let x = (e.gamma - rest.g) / 22
      let y = (e.beta - rest.b) / 22
      const a = ((screenAngle() % 360) + 360) % 360
      if (a === 90) {
        const nx = y
        y = -x
        x = nx
      } else if (a === 270) {
        const nx = -y
        y = x
        x = nx
      } else if (a === 180) {
        x = -x
        y = -y
      }
      x = deadzone(Math.max(-1, Math.min(1, x)))
      y = deadzone(Math.max(-1, Math.min(1, y)))
      tilt.current.x += (x - tilt.current.x) * 0.28
      tilt.current.y += (y - tilt.current.y) * 0.28
      tilt.current.ready = true
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('deviceorientation', onOrient)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, [play])

  return (
    <div
      className="xg"
      ref={wrapRef}
      onPointerDown={(e) => {
        if (phase !== 'play' && phase !== 'boss') return
        if ((e.target as HTMLElement).closest('a, button')) return
        fireHeld.current = true
        if (mobile.current) {
          drag.current = { on: true, x: 0, y: 0, sx: e.clientX, sy: e.clientY }
        }
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (!drag.current.on) return
        drag.current.x = Math.max(-1, Math.min(1, (e.clientX - drag.current.sx) / 70))
        drag.current.y = Math.max(-1, Math.min(1, (e.clientY - drag.current.sy) / 70))
      }}
      onPointerUp={() => {
        fireHeld.current = false
        drag.current.on = false
        drag.current.x = 0
        drag.current.y = 0
      }}
      onPointerCancel={() => {
        fireHeld.current = false
        drag.current.on = false
        drag.current.x = 0
        drag.current.y = 0
      }}
    >
      <canvas ref={canvasRef} className="xg-canvas" />

      <div className="xg-top">
        <Link to="/" className="xg-back">
          Dan
        </Link>
        <div className="xg-brand">
          <svg className="xg-xmark" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.825L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
            />
          </svg>
          <b>THE GAME</b>
        </div>
        <div className="xg-top-spacer" />
      </div>

      {phase === 'play' || phase === 'boss' ? (
        <div className="xg-hud">
          <div className="xg-level">{hud.waveName || 'The Feed'}</div>
          <div className="xg-score">{hud.score}</div>
          <div className="xg-hearts">
            {Array.from({ length: hud.maxHp }, (_, i) => (
              <i key={i} className={i < hud.hp ? '' : 'off'} />
            ))}
          </div>
          <div className="xg-weapon">{ARSENAL[hud.weapon - 1]?.name ?? ''}</div>
          {hud.boost > 0 ? <div className="xg-mod">{hud.mult}x {hud.boost.toFixed(0)}s</div> : null}
          {(['rapid', 'nova', 'titan'] as PowerKind[]).map((k) =>
            hud.buffs[k] > 0 ? (
              <div key={k} className="xg-mod xg-power" style={{ color: POWERS[k].color }}>
                {POWERS[k].name} ×{hud.buffs[k]}
              </div>
            ) : null,
          )}
          <div className="xg-hyper" title="hyper">
            <i style={{ width: `${Math.max(0, (1 - hud.hyper / 1.6) * 100)}%` }} />
          </div>
        </div>
      ) : null}

      {phase === 'boss' && hud.bossMax > 0 ? (
        <div className="xg-bossbar" aria-hidden>
          <span>Zuck</span>
          <b>
            <i style={{ width: `${Math.max(0, (hud.boss / hud.bossMax) * 100)}%` }} />
          </b>
        </div>
      ) : null}

      {hud.unlock && hud.unlock.t > 0.15 && (phase === 'play' || phase === 'boss') ? (
        <div className="xg-unlock" style={{ opacity: Math.min(1, hud.unlock.t / 0.6) }}>
          <small>weapon acquired</small>
          <strong>{hud.unlock.name}</strong>
          <p>{hud.unlock.use}</p>
        </div>
      ) : hud.note && hud.note.t > 0.15 && (phase === 'play' || phase === 'boss') ? (
        <div className="xg-streak" style={{ opacity: Math.min(1, hud.note.t / 0.7) }}>
          <strong>{hud.note.name}</strong>
          <p>{hud.note.use}</p>
        </div>
      ) : null}

      {hud.banner > 0 && !hud.unlock && !hud.note && (phase === 'play' || phase === 'boss') ? (
        <div className="xg-banner" style={{ opacity: Math.min(1, hud.banner / 0.55) }}>
          {hud.waveTag ? <small>{hud.waveTag}</small> : null}
          <strong>{hud.waveName}</strong>
        </div>
      ) : null}

      {phase === 'title' ? (
        <div className="xg-overlay xg-title-screen" onPointerDown={() => play()}>
          <div className="xg-kicker">kettlebelldan</div>
          <div className="xg-title">
            X
            <span>THE GAME</span>
          </div>
          {best > 0 ? <div className="xg-best">best {best}</div> : null}
          <button
            type="button"
            className="xg-cta"
            onPointerDown={(e) => {
              e.stopPropagation()
              play()
            }}
          >
            Play
          </button>
          {touchUI ? <div className="xg-how">tilt to move · hold to fire</div> : null}
        </div>
      ) : null}

      {phase === 'dead' ? (
        <div className="xg-overlay">
          <div className="xg-kicker">ratioed</div>
          <div className="xg-over-score">{hud.score}</div>
          {best > 0 ? <div className="xg-best">best {best}</div> : null}
          {!deadGate ? (
            <button
              type="button"
              tabIndex={-1}
              className="xg-cta"
              onKeyDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                play()
              }}
            >
              Again
            </button>
          ) : null}
          {deadGate ? (
            <button
              type="button"
              tabIndex={-1}
              className="xg-gameover"
              onKeyDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                dismissOver()
              }}
            >
              Game Over
            </button>
          ) : null}
        </div>
      ) : null}

      {phase === 'win' ? (
        <div className="xg-overlay xg-win">
          <img className="xg-elon" src="/xthegame/elon.jpg" alt="" />
          <div className="xg-win-copy">
            <div className="xg-title">Congrats you win the internet</div>
            <div className="xg-over-score">{hud.score}</div>
            {best > 0 ? <div className="xg-best">best {best}</div> : null}
            <button
              type="button"
              tabIndex={-1}
              className="xg-cta"
              onKeyDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                play()
              }}
            >
              Again
            </button>
          </div>
        </div>
      ) : null}

      {hud.paused && (phase === 'play' || phase === 'boss') ? <div className="xg-pause">paused</div> : null}

    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './rocket.css'
import { createRocketScene, type RocketScene } from './scene'
import {
  type EngineId,
  type GameMode,
  type Input,
  type SimState,
  initialState,
  litCount,
  slLit,
  step,
} from './sim'

type Cam = 'chase' | 'tower' | 'pad'

const IDS: EngineId[] = ['SL1', 'SL2', 'SL3', 'VAC1', 'VAC2', 'VAC3']

export default function RocketCatchApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RocketScene | null>(null)
  const stateRef = useRef<SimState>(initialState())
  const inputRef = useRef<Input>(emptyInput())
  const keysRef = useRef<Record<string, boolean>>({})
  const [ui, setUi] = useState(stateRef.current)
  const [screen, setScreen] = useState<'brief' | 'play' | 'end'>('brief')
  const [cam, setCam] = useState<Cam>('chase')
  const camRef = useRef<Cam>('chase')
  const [stick, setStick] = useState({ x: 0, y: 0 })
  camRef.current = cam

  useEffect(() => {
    document.title = 'Starship Catch · kettlebelldan.com'
    const canvas = canvasRef.current
    if (!canvas) return
    const scn = createRocketScene(canvas)
    sceneRef.current = scn
    const onResize = () => scn.resize()
    window.addEventListener('resize', onResize)
    scn.update(stateRef.current, camRef.current)

    let raf = 0
    let last = performance.now()
    let hudAcc = 0
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const inp = sampleInput(keysRef.current, inputRef.current)
      if (stateRef.current.running) {
        stateRef.current = step(stateRef.current, inp, dt)
        inputRef.current.toggle = {}
        inputRef.current.chopClose = false
        inputRef.current.restart = false
        if (stateRef.current.ended) setScreen('end')
      }
      scn.update(stateRef.current, camRef.current)
      hudAcc += dt
      if (hudAcc > 0.12) {
        hudAcc = 0
        setUi({ ...stateRef.current })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      scn.dispose()
    }
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true
      if (e.key === ' ') {
        e.preventDefault()
        inputRef.current.chopClose = true
      }
      if (e.key === 'r' || e.key === 'R') inputRef.current.restart = true
      const map: Record<string, EngineId> = {
        '1': 'SL1',
        '2': 'SL2',
        '3': 'SL3',
        '4': 'VAC1',
        '5': 'VAC2',
        '6': 'VAC3',
      }
      if (map[e.key]) {
        const id = map[e.key]
        const cur = stateRef.current.engines.find((en) => en.id === id)
        inputRef.current.toggle[id] = !cur?.on
      }
      if (e.key === 'c') setCam((v) => (v === 'chase' ? 'tower' : v === 'tower' ? 'pad' : 'chase'))
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

  function start(mode: GameMode = 'flight') {
    stateRef.current = { ...initialState(mode), running: true }
    setUi(stateRef.current)
    setScreen('play')
  }

  function toggle(id: EngineId) {
    const cur = stateRef.current.engines.find((e) => e.id === id)
    inputRef.current.toggle[id] = !cur?.on
  }

  function setCluster(kind: 'sl' | 'vac' | 'off' | 'landing') {
    if (kind === 'off') {
      for (const id of IDS) inputRef.current.toggle[id] = false
      return
    }
    if (kind === 'landing') {
      inputRef.current.toggle = { SL1: true, SL2: true, SL3: true, VAC1: false, VAC2: false, VAC3: false }
      return
    }
    for (const e of stateRef.current.engines) {
      inputRef.current.toggle[e.id] = e.kind === kind
    }
  }

  return (
    <div className="rocket-app">
      <canvas ref={canvasRef} />
      <Link className="rk-home" to="/">← Dan</Link>

      <div className="rk-overlay">
        {screen !== 'brief' && (
          <>
            <div className="rk-top">
              <div className={`rk-card rk-msg ${ui.inBasket ? 'go' : ''}`}>{ui.message}</div>
              <div className="rk-card rk-telemetry">
                <span>ALT</span><b>{Math.round(ui.y)} m</b>
                <span>VS</span><b>{ui.vy.toFixed(1)} m/s</b>
                <span>GS</span><b>{Math.hypot(ui.vx, ui.vz).toFixed(1)} m/s</b>
                <span>PITCH</span><b>{((ui.pitch * 180) / Math.PI).toFixed(0)}°</b>
                <span>PROP</span><b>{Math.round(ui.prop / 1000)} t</b>
                <span>THRTL</span><b>{Math.round(ui.throttle * 100)}%</b>
                <span>RAPTORS</span><b>{litCount(ui)} lit · {slLit(ui)} SL</b>
                <span>CHOP</span><b>{Math.round(ui.chopHeight)} m · {Math.round(ui.chopOpen * 100)}% open</b>
              </div>
            </div>

            <div className="rk-bottom">
              <div>
                <div className="rk-pad"
                  onPointerDown={(e) => trackStick(e, setStick, inputRef)}
                  onPointerMove={(e) => trackStick(e, setStick, inputRef)}
                  onPointerUp={(e) => endStick(e, setStick, inputRef)}
                  onPointerCancel={(e) => endStick(e, setStick, inputRef)}
                >
                  <div className="rk-knob" style={{ left: 38 + stick.x * 34, top: 38 + stick.y * 34 }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75 }}>Attitude / gimbal</div>
              </div>

              <div className="rk-engines">
                {IDS.map((id) => {
                  const e = ui.engines.find((x) => x.id === id)!
                  return (
                    <button
                      key={id}
                      className={`rk-eng ${e.on ? 'on' : ''} ${e.kind}`}
                      onClick={() => toggle(id)}
                    >
                      {id}<br />{e.kind === 'sl' ? 'Raptor SL' : 'RVac'}
                    </button>
                  )
                })}
                <button className="rk-eng" onClick={() => setCluster('landing')}>3 SL</button>
                <button className="rk-eng" onClick={() => setCluster('vac')}>3 VAC</button>
                <button className="rk-eng" onClick={() => setCluster('off')}>CUT</button>
              </div>

              <div className="rk-chop">
                <div className="rk-throt">
                  <button className="rk-btn" onPointerDown={() => { keysRef.current['shift'] = true }} onPointerUp={() => { keysRef.current['shift'] = false }} onPointerCancel={() => { keysRef.current['shift'] = false }}>Throttle +</button>
                  <button className="rk-btn" onPointerDown={() => { keysRef.current['control'] = true }} onPointerUp={() => { keysRef.current['control'] = false }} onPointerCancel={() => { keysRef.current['control'] = false }}>Throttle −</button>
                </div>
                <button className="rk-btn" onPointerDown={() => { keysRef.current['q'] = true }} onPointerUp={() => { keysRef.current['q'] = false }} onPointerCancel={() => { keysRef.current['q'] = false }}>Chop ▲</button>
                <button className="rk-btn" onPointerDown={() => { keysRef.current['e'] = true }} onPointerUp={() => { keysRef.current['e'] = false }} onPointerCancel={() => { keysRef.current['e'] = false }}>Chop ▼</button>
                <button className="rk-btn catch" onClick={() => { inputRef.current.chopClose = true }}>CLOSE CHOPSTICKS</button>
                <button className="rk-btn" onClick={() => setCam((v) => (v === 'chase' ? 'tower' : v === 'tower' ? 'pad' : 'chase'))}>Cam: {cam}</button>
              </div>
            </div>
          </>
        )}

        {screen === 'brief' && (
          <div className="rk-menu">
            <div className="rk-panel">
              <h1>Starship Catch</h1>
              <p>
                You are flying a Block 2 <b>Starship</b> (upper stage) back to Starbase Pad A for a tower catch.
                This is not Super Heavy. The Ship is ~52 m tall, 9 m wide, with <b>6 Raptors</b>: 3 center
                sea-level engines that gimbal, and 3 outer Raptor Vacuum engines with larger nozzles.
              </p>
              <ul>
                <li>Reentry uses a belly-flop and four flaps to bleed energy.</li>
                <li>Landing flip, then landing burn — flight data shows a <b>3→2</b> SL engine profile.</li>
                <li>RVac engines are overexpanded at sea level. They make less thrust and are a last resort.</li>
                <li>Mechazilla chopsticks catch the vehicle by side hardpoints / catch pins. No landing legs.</li>
                <li>Null horizontal speed, stay vertical, match pin height to the arms, then close.</li>
              </ul>
              <p>
                Desktop: WASD, 1–3 SL engines, Shift/Ctrl throttle, Q/E chopsticks, Space to catch.
                Phone: stick + engine buttons + throttle/chop buttons.
              </p>
              <button className="rk-btn catch" onClick={() => start('flight')}>Play — easy descent</button>
              <div style={{ height: 8 }} />
              <button className="rk-btn" onClick={() => start('tutorial')}>Tutorial — learn the controls</button>
            </div>
          </div>
        )}

        {screen === 'end' && (
          <div className="rk-menu">
            <div className="rk-panel">
              <h1>{ui.success ? 'Caught' : 'No catch'}</h1>
              <p>{ui.message}</p>
              <p>Score <b>{Math.round(ui.score)}</b> · T+{ui.t.toFixed(1)}s · Prop left {(ui.prop / 1000).toFixed(1)} t</p>
              <button className="rk-btn catch" onClick={() => start(ui.mode)}>Fly again</button>
              <div style={{ height: 8 }} />
              <button className="rk-btn" onClick={() => start(ui.mode === 'tutorial' ? 'flight' : 'tutorial')}>
                {ui.mode === 'tutorial' ? 'Try a real descent' : 'Practice tutorial'}
              </button>
              <div style={{ height: 8 }} />
              <Link to="/" className="rk-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Back home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function emptyInput(): Input {
  return {
    pitch: 0,
    yaw: 0,
    roll: 0,
    throttleDelta: 0,
    flap: 0.85,
    chopHeightDelta: 0,
    chopClose: false,
    toggle: {},
    restart: false,
  }
}

function sampleInput(keys: Record<string, boolean>, sticky: Input): Input {
  const pitch = (keys['s'] ? 1 : 0) + (keys['w'] ? -1 : 0) + sticky.pitch
  const yaw = (keys['d'] ? 1 : 0) + (keys['a'] ? -1 : 0) + sticky.yaw
  const roll = (keys['z'] ? -1 : 0) + (keys['x'] ? 1 : 0)
  const throttleDelta = (keys['shift'] ? 0.55 : 0) + (keys['control'] ? -0.55 : 0)
  const chopHeightDelta = (keys['q'] ? 1 : 0) + (keys['e'] ? -1 : 0)
  return {
    ...sticky,
    pitch: clamp(pitch, -1, 1),
    yaw: clamp(yaw, -1, 1),
    roll: clamp(roll, -1, 1),
    throttleDelta,
    chopHeightDelta,
    flap: keys['f'] ? 0.2 : 0.85,
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

function trackStick(
  e: { currentTarget: EventTarget & HTMLElement; pointerId: number; clientX: number; clientY: number },
  setStick: (v: { x: number; y: number }) => void,
  inputRef: { current: Input },
) {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  const r = el.getBoundingClientRect()
  const x = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1)
  const y = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1)
  setStick({ x, y })
  inputRef.current.yaw = x
  inputRef.current.pitch = y
}

function endStick(
  e: { currentTarget: EventTarget & HTMLElement; pointerId: number },
  setStick: (v: { x: number; y: number }) => void,
  inputRef: { current: Input },
) {
  setStick({ x: 0, y: 0 })
  inputRef.current.yaw = 0
  inputRef.current.pitch = 0
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

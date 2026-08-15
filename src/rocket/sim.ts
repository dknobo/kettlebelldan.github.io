/** Starship Ship catch sim — numbers grounded in public SpaceX / wiki data. */

export const SHIP_HEIGHT = 52.1
export const SHIP_RADIUS = 4.5
export const SHIP_DRY_MASS = 85_000
export const G0 = 9.80665
export const TOWER_HEIGHT = 146
export const CATCH_PIN_HEIGHT = 34 // m above engines (mid/upper hardpoints)
export const SL_THRUST = 2_260_000 // Raptor 2 sea-level, N
export const VAC_THRUST_SL = 1_350_000 // RVac derated in atmosphere (overexpanded)
export const ISP_SL = 327
export const ISP_VAC_SL = 250
export const MIN_THROTTLE = 0.28
export const MAX_GIMBAL = 0.34 // rad (~19°)

export type GameMode = 'flight' | 'tutorial'

export type EngineId = 'SL1' | 'SL2' | 'SL3' | 'VAC1' | 'VAC2' | 'VAC3'

export type Engine = {
  id: EngineId
  kind: 'sl' | 'vac'
  on: boolean
  /** azimuth around engine bay, rad */
  az: number
  radial: number
  gimbal: boolean
}

export type SimState = {
  running: boolean
  ended: boolean
  success: boolean
  message: string
  t: number
  // world position of COM (m). Y up.
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  // body attitude as yaw/pitch/roll (rad). pitch 0 = vertical engines-down, pitch PI/2 = belly-flop
  yaw: number
  pitch: number
  roll: number
  wy: number
  wp: number
  wr: number
  mass: number
  prop: number
  throttle: number
  gimbalPitch: number
  gimbalYaw: number
  engines: Engine[]
  chopHeight: number
  chopOpen: number // 1 open, 0 closed
  chopClosing: boolean
  flap: number // 0-1 aero brake
  score: number
  mode: GameMode
  tutorialStep: number
  inBasket: boolean
  assist: boolean
}

export type Input = {
  pitch: number
  yaw: number
  roll: number
  throttleDelta: number
  flap: number
  chopHeightDelta: number
  chopClose: boolean
  toggle: Partial<Record<EngineId, boolean>>
  restart: boolean
}

export function defaultEngines(): Engine[] {
  return [
    { id: 'SL1', kind: 'sl', on: false, az: 0, radial: 1.15, gimbal: true },
    { id: 'SL2', kind: 'sl', on: false, az: (2 * Math.PI) / 3, radial: 1.15, gimbal: true },
    { id: 'SL3', kind: 'sl', on: false, az: (4 * Math.PI) / 3, radial: 1.15, gimbal: true },
    { id: 'VAC1', kind: 'vac', on: false, az: Math.PI / 3, radial: 2.85, gimbal: false },
    { id: 'VAC2', kind: 'vac', on: false, az: Math.PI, radial: 2.85, gimbal: false },
    { id: 'VAC3', kind: 'vac', on: false, az: (5 * Math.PI) / 3, radial: 2.85, gimbal: false },
  ]
}

export const TUTORIAL_COPY = [
  'Tutorial 1/5: Tap 3 SL (or keys 1–3) to light the center Raptors.',
  'Tutorial 2/5: Use the left stick or WASD to drift toward the tower.',
  'Tutorial 3/5: Shift = more throttle, Ctrl = less. Hold a slow descent.',
  'Tutorial 4/5: Move chopsticks with Q/E or Chop ▲▼ onto the yellow pins.',
  'Tutorial 5/5: When the banner turns green, tap CLOSE CHOPSTICKS.',
]

export function initialState(mode: GameMode = 'flight'): SimState {
  const tutorial = mode === 'tutorial'
  const engines = defaultEngines().map((e) => ({
    ...e,
    on: !tutorial && e.kind === 'sl',
  }))
  return {
    running: false,
    ended: false,
    success: false,
    message: tutorial
      ? TUTORIAL_COPY[0]
      : 'High final. 3 center Raptors are lit. Stay upright, slow down, then catch.',
    t: 0,
    x: tutorial ? 28 : 18,
    y: tutorial ? 420 : 980,
    z: tutorial ? 90 : 260,
    vx: 0,
    vy: tutorial ? -6 : -16,
    vz: tutorial ? -3 : -10,
    yaw: 0,
    pitch: tutorial ? 0.12 : 0.42,
    roll: 0,
    wy: 0,
    wp: 0,
    wr: 0,
    mass: tutorial ? 140_000 : 155_000,
    prop: tutorial ? 55_000 : 70_000,
    throttle: tutorial ? 0.58 : 0.64,
    gimbalPitch: 0,
    gimbalYaw: 0,
    engines,
    chopHeight: tutorial ? 90 : 86,
    chopOpen: 1,
    chopClosing: false,
    flap: 0.9,
    score: 1000,
    mode,
    tutorialStep: 0,
    inBasket: false,
    assist: true,
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

export function step(s: SimState, input: Input, dt: number): SimState {
  if (input.restart) return { ...initialState(s.mode), running: true }
  if (!s.running || s.ended) return s

  const engines = s.engines.map((e) => ({
    ...e,
    on: input.toggle[e.id] !== undefined ? input.toggle[e.id]! : e.on,
  }))

  const throttle = clamp(s.throttle + input.throttleDelta * dt, MIN_THROTTLE, 1)
  const gimbalPitch = clamp(s.gimbalPitch * 0.86 + input.pitch * MAX_GIMBAL, -MAX_GIMBAL, MAX_GIMBAL)
  const gimbalYaw = clamp(s.gimbalYaw * 0.86 + input.yaw * MAX_GIMBAL, -MAX_GIMBAL, MAX_GIMBAL)
  const flap = clamp(input.flap, 0, 1)

  let chopHeight = clamp(s.chopHeight + input.chopHeightDelta * 34 * dt, 42, 118)
  let chopOpen = s.chopOpen
  let chopClosing = s.chopClosing || input.chopClose
  if (chopClosing) chopOpen = Math.max(0, chopOpen - 1.05 * dt)
  else chopOpen = Math.min(1, chopOpen + 0.55 * dt)

  // orientation integration — stronger pilot authority + damping
  let wp = s.wp + input.pitch * 1.85 * dt
  let wy = s.wy + input.yaw * 1.7 * dt
  let wr = s.wr + input.roll * 1.6 * dt
  wp *= 0.975
  wy *= 0.975
  wr *= 0.97

  let pitch = s.pitch + wp * dt
  let yaw = s.yaw + wy * dt
  let roll = clamp(s.roll + wr * dt, -0.8, 0.8)

  // aero damping while belly-flop (flaps)
  const belly = Math.sin(pitch)
  const vertical = Math.cos(pitch)
  const rho = 1.15
  const areaBelly = 9 * SHIP_HEIGHT * 0.55
  const areaNose = Math.PI * SHIP_RADIUS * SHIP_RADIUS
  const area = areaBelly * Math.abs(belly) * (0.35 + flap * 0.65) + areaNose * Math.abs(vertical) * 0.25
  const spd = Math.hypot(s.vx, s.vy, s.vz) + 1e-6
  const drag = 0.5 * rho * spd * spd * 2.15 * area
  const dx = -s.vx / spd
  const dy = -s.vy / spd
  const dz = -s.vz / spd

  // engine forces in body frame: +Y body is nose, -Y is engines (we use world Y up after rotation)
  // Ship body: engines at -Y_body, nose +Y_body. pitch 0 => body Y aligns world Y (vertical).
  let fx = 0
  let fy = 0
  let fz = 0
  let tqP = 0
  let tqY = 0
  let tqR = 0
  let thrustSum = 0
  let mdot = 0

  for (const e of engines) {
    if (!e.on || s.prop <= 0) continue
    const vacPenalty = e.kind === 'vac' ? 1 : 1
    const F = (e.kind === 'sl' ? SL_THRUST : VAC_THRUST_SL) * throttle * vacPenalty
    thrustSum += F
    const isp = e.kind === 'sl' ? ISP_SL : ISP_VAC_SL
    mdot += F / (isp * G0)

    // gimbal only SL cluster
    const gp = e.gimbal ? gimbalPitch : 0
    const gy = e.gimbal ? gimbalYaw : 0
    // thrust along -bodyY with tilt
    const bx = Math.sin(gy) + Math.sin(e.az) * 0.02
    const by = 1
    const bz = Math.sin(gp) + Math.cos(e.az) * 0.02
    const bl = Math.hypot(bx, by, bz)
    const tbx = (bx / bl) * F
    const tby = (by / bl) * F
    const tbz = (bz / bl) * F

    // torque from offset
    const ox = Math.cos(e.az) * e.radial
    const oz = Math.sin(e.az) * e.radial
    tqP += oz * tby * 0.00000012
    tqY += -ox * tby * 0.00000012
    tqR += (ox * tbz - oz * tbx) * 0.00000008

    // rotate body thrust into world using yaw then pitch
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const cp = Math.cos(pitch)
    const sp = Math.sin(pitch)
    // body Y (up ship) in world
    const wyx = sy * sp
    const wyy = cp
    const wyz = cy * sp
    // body X
    const wxx = cy
    const wxy = 0
    const wxz = -sy
    // body Z
    const wzx = sy * cp
    const wzy = -sp
    const wzz = cy * cp

    fx += wxx * tbx + wyx * tby + wzx * tbz
    fy += wxy * tbx + wyy * tby + wzy * tbz
    fz += wxz * tbx + wyz * tby + wzz * tbz
  }

  wp += tqP
  wy += tqY
  wr += tqR
  // engine plume "rights" slightly when thrusting hard while pitched
  if (thrustSum > 8e5) {
    wp += -Math.sin(pitch) * 0.95 * dt * (thrustSum / (3 * SL_THRUST))
  }
  const slOn = engines.filter((e) => e.on && e.kind === 'sl').length
  const mass = SHIP_DRY_MASS + Math.max(0, s.prop)
  if (s.assist && slOn >= 2) {
    wp += -pitch * 1.6 * dt
    wy += -yaw * 0.35 * dt
    wr += -roll * 1.8 * dt
    fx += -s.vx * mass * 0.35
    fz += -s.vz * mass * 0.35
  }
  fx += dx * drag
  fy += dy * drag - mass * G0
  fz += dz * drag

  let vx = s.vx + (fx / mass) * dt
  let vy = s.vy + (fy / mass) * dt
  let vz = s.vz + (fz / mass) * dt
  let x = s.x + vx * dt
  let y = s.y + vy * dt
  let z = s.z + vz * dt
  const prop = Math.max(0, s.prop - mdot * dt)

  // ground / ocean
  let ended = false
  let success = false
  let message = s.message
  let score = s.score - dt * 2

  const keel = Math.max(1.5, SHIP_HEIGHT * 0.08 + 8 * Math.abs(Math.sin(pitch)))
  if (y < keel) {
    y = keel
    if (Math.abs(vy) > 14 || Math.abs(pitch) > 0.55) {
      ended = true
      success = false
      message = 'Hard landing. Stay more vertical and slower next time.'
    } else if (Math.hypot(x, z) > 55) {
      ended = true
      success = false
      message = 'Soft touchdown off-pad. Tower catch missed.'
    }
    vy = Math.max(vy, 0)
    vx *= 0.4
    vz *= 0.4
  }

  // catch detection (forgiving on purpose)
  const pinY = y + CATCH_PIN_HEIGHT
  if (Math.abs(input.chopHeightDelta) < 0.05 && !chopClosing) {
    chopHeight = clamp(chopHeight + (pinY - chopHeight) * 1.8 * dt, 42, 118)
  }
  const nearTower = Math.hypot(x - 2, z) < 14
  const upright = Math.abs(pitch) < 0.38 && Math.abs(roll) < 0.35
  const slow = Math.hypot(vx, vz) < 8.5 && vy > -12 && vy < 6
  const heightOk = Math.abs(pinY - chopHeight) < 9
  const armsAround = chopOpen < 0.42
  const inBasket = nearTower && upright && slow && heightOk

  if (!ended && inBasket && armsAround && chopClosing) {
    ended = true
    success = true
    const fuelBonus = Math.round(prop / 80)
    const timeBonus = Math.max(0, 800 - s.t * 8)
    score = Math.round(score + 1500 + fuelBonus + timeBonus)
    message = `Chopsticks closed. Starship is caught. Score ${score}.`
    vx = 0
    vy = 0
    vz = 0
  }

  if (!ended && (y > 2800 || Math.hypot(x, z) > 2200 || s.t > 420)) {
    ended = true
    success = false
    message = 'Out of catch window. Try tutorial first if this feels wild.'
  }

  let tutorialStep = s.tutorialStep
  if (s.mode === 'tutorial' && !ended) {
    if (tutorialStep === 0 && slOn >= 3) tutorialStep = 1
    if (tutorialStep === 1 && Math.hypot(x - 2, z) < 40) tutorialStep = 2
    if (tutorialStep === 2 && vy > -14 && vy < 2 && y < 380) tutorialStep = 3
    if (tutorialStep === 3 && heightOk) tutorialStep = 4
    message = inBasket ? 'Green basket — CLOSE CHOPSTICKS now!' : TUTORIAL_COPY[tutorialStep]
  } else if (!ended && prop <= 0 && y > 80 && vy < -1) {
    message = 'Propellant depleted. Throttle down earlier next time.'
  } else if (!ended && inBasket) {
    message = 'In the basket. CLOSE CHOPSTICKS.'
  } else if (!ended && y < 220 && Math.abs(pitch) > 0.55) {
    message = 'Get upright. Stick back / W and keep the center Raptors lit.'
  } else if (!ended && y < 260) {
    message = 'Slow it down, drift over the tower, then catch.'
  } else if (!ended) {
    message = 'Lots of altitude. Center on the tower before you get low.'
  }

  return {
    ...s,
    t: s.t + dt,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    yaw,
    pitch,
    roll,
    wy,
    wp,
    wr,
    mass,
    prop,
    throttle,
    gimbalPitch,
    gimbalYaw,
    engines,
    chopHeight,
    chopOpen,
    chopClosing,
    flap,
    ended,
    success,
    message,
    score: Math.max(0, score),
    running: ended ? false : s.running,
    tutorialStep,
    inBasket,
  }
}

export function litCount(s: SimState) {
  return s.engines.filter((e) => e.on).length
}

export function slLit(s: SimState) {
  return s.engines.filter((e) => e.on && e.kind === 'sl').length
}

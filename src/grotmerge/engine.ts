import Matter from 'matter-js'

export const TIER_COUNT = 11
export const DROP_MAX = 4
export const LS_BEST = 'grot-bot-merge-best'

export const TIERS = [
  { name: 'Pip', color: '#f3ead8' },
  { name: 'Spark', color: '#f97316' },
  { name: 'Bolt', color: '#f5c518' },
  { name: 'Pulse', color: '#84cc16' },
  { name: 'Hum', color: '#2dd4bf' },
  { name: 'Glow', color: '#38bdf8' },
  { name: 'Orbit', color: '#2563eb' },
  { name: 'Nova', color: '#8b5cf6' },
  { name: 'Quasar', color: '#e11d8a' },
  { name: 'Core', color: '#eab308' },
  { name: 'Grot', color: '#f4f4f5' },
] as const

export type Phase = 'title' | 'play' | 'over'

export type Fx = {
  x: number
  y: number
  r: number
  color: string
  t: number
  kind: 'ring' | 'spark'
  vx?: number
  vy?: number
}

export type BotData = {
  id: number
  tier: number
  dead: boolean
  overMs: number
  age: number
  squash: number
  born: number
}

export type Game = {
  engine: Matter.Engine
  world: Matter.World
  phase: Phase
  score: number
  best: number
  next: number
  after: number
  dropX: number
  cooldown: number
  holding: boolean
  nextId: number
  bots: WeakMap<Matter.Body, BotData>
  live: Matter.Body[]
  fx: Fx[]
  bowl: { x: number; y: number; w: number; h: number; wall: number }
  dangerY: number
  dropY: number
  scale: number
  overTimer: number
  mergeQ: [Matter.Body, Matter.Body][]
  walls: Matter.Body[]
  warnMs: number
}

function radius(tier: number, scale: number) {
  return 16 * Math.pow(1.22, tier) * scale
}

function pickDrop() {
  const w = [5, 4, 3, 2, 1]
  let n = Math.random() * w.reduce((a, b) => a + b, 0)
  for (let i = 0; i < w.length; i++) {
    n -= w[i]
    if (n <= 0) return i
  }
  return 0
}

export function createGame(): Game {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1.55, scale: 0.001 },
    enableSleeping: true,
  })
  const g: Game = {
    engine,
    world: engine.world,
    phase: 'title',
    score: 0,
    best: Number(localStorage.getItem(LS_BEST) || 0),
    next: 0,
    after: 1,
    dropX: 0,
    cooldown: 0,
    holding: false,
    nextId: 1,
    bots: new WeakMap(),
    live: [],
    fx: [],
    bowl: { x: 0, y: 0, w: 400, h: 560, wall: 18 },
    dangerY: 0,
    dropY: 0,
    scale: 1,
    overTimer: 0,
    mergeQ: [],
    walls: [],
    warnMs: 0,
  }
  Matter.Events.on(engine, 'collisionStart', (e) => {
    for (const p of e.pairs) {
      const a = p.bodyA
      const b = p.bodyB
      if (a.label === 'bot' && b.label === 'bot') g.mergeQ.push([a, b])
      const da = a.label === 'bot' ? g.bots.get(a) : undefined
      const db = b.label === 'bot' ? g.bots.get(b) : undefined
      if (da && da.age > 40) da.squash = Math.max(da.squash, 1)
      if (db && db.age > 40) db.squash = Math.max(db.squash, 1)
    }
  })
  return g
}

export function layout(g: Game, viewW: number, viewH: number) {
  const wall = 16
  const hud = 88
  const keyH = 72
  const w = Math.min(420, Math.max(280, viewW - 28))
  const h = Math.min(620, Math.max(380, viewH - hud - keyH - 16))
  const x = (viewW - w) / 2
  const y = hud + 8
  g.bowl = { x, y, w, h, wall }
  g.scale = w / 400
  g.dangerY = y + 72 * g.scale
  g.dropY = y + 36 * g.scale
  if (!g.live.length) g.dropX = x + w / 2

  if (g.walls.length) Matter.World.remove(g.world, g.walls)
  const thick = wall
  const floor = Matter.Bodies.rectangle(x + w / 2, y + h + thick / 2 - 4, w + thick * 2, thick, {
    isStatic: true,
    friction: 0.9,
    label: 'wall',
  })
  const left = Matter.Bodies.rectangle(x - thick / 2 + 4, y + h / 2, thick, h + thick, {
    isStatic: true,
    friction: 0.2,
    label: 'wall',
  })
  const right = Matter.Bodies.rectangle(x + w + thick / 2 - 4, y + h / 2, thick, h + thick, {
    isStatic: true,
    friction: 0.2,
    label: 'wall',
  })
  g.walls = [floor, left, right]
  Matter.World.add(g.world, g.walls)
}

function spawn(g: Game, tier: number, x: number, y: number, opts?: { falling?: boolean }) {
  const r = radius(tier, g.scale)
  const body = Matter.Bodies.circle(x, y, r, {
    restitution: 0.045,
    friction: 0.42,
    frictionAir: 0.012,
    density: 0.0018,
    slop: 0.04,
    label: 'bot',
    sleepThreshold: 40,
  })
  if (opts?.falling) {
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.35, y: 0.55 })
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08)
  }
  const data: BotData = { id: g.nextId++, tier, dead: false, overMs: 0, age: 0, squash: 0, born: 1 }
  g.bots.set(body, data)
  g.live.push(body)
  Matter.World.add(g.world, body)
  return body
}

export function startRun(g: Game) {
  g.phase = 'play'
  g.score = 0
  g.next = pickDrop()
  g.after = pickDrop()
  g.cooldown = 0
  g.holding = false
  g.overTimer = 0
  g.warnMs = 0
  g.fx = []
  for (const b of [...g.live]) Matter.World.remove(g.world, b)
  g.live = []
  g.dropX = g.bowl.x + g.bowl.w / 2
}

export function clampDropX(g: Game, x: number) {
  const r = radius(g.next, g.scale)
  const min = g.bowl.x + g.bowl.wall + r + 2
  const max = g.bowl.x + g.bowl.w - g.bowl.wall - r - 2
  g.dropX = Math.max(min, Math.min(max, x))
}

export function drop(g: Game) {
  if (g.phase !== 'play' || g.cooldown > 0) return false
  spawn(g, g.next, g.dropX, g.dropY, { falling: true })
  g.next = g.after
  g.after = pickDrop()
  g.cooldown = 380
  return true
}

function mergePair(g: Game, a: Matter.Body, b: Matter.Body) {
  const da = g.bots.get(a)
  const db = g.bots.get(b)
  if (!da || !db || da.dead || db.dead) return
  if (da.tier !== db.tier || da.tier >= TIER_COUNT - 1) return
  da.dead = true
  db.dead = true
  const x = (a.position.x + b.position.x) / 2
  const y = (a.position.y + b.position.y) / 2
  Matter.World.remove(g.world, a)
  Matter.World.remove(g.world, b)
  g.live = g.live.filter((body) => body !== a && body !== b)
  const next = da.tier + 1
  const neu = spawn(g, next, x, y)
  const nd = g.bots.get(neu)
  if (nd) {
    nd.born = 1
    nd.squash = 1
  }
  Matter.Body.setAngularVelocity(neu, (Math.random() - 0.5) * 0.12)
  g.score += 2 ** next
  if (g.score > g.best) {
    g.best = g.score
    localStorage.setItem(LS_BEST, String(g.best))
  }
  g.fx.push({ x, y, r: radius(next, g.scale), color: TIERS[next].color, t: 1, kind: 'ring' })
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3
    const sp = 1.2 + Math.random() * 2.2
    g.fx.push({
      x,
      y,
      r: 2 + Math.random() * 3,
      color: TIERS[next].color,
      t: 1,
      kind: 'spark',
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
    })
  }
}

export function step(g: Game, dt: number) {
  if (g.phase !== 'play') return
  g.cooldown = Math.max(0, g.cooldown - dt)
  g.fx = g.fx
    .map((f) => ({
      ...f,
      t: f.t - dt / (f.kind === 'spark' ? 420 : 280),
      x: f.x + (f.vx || 0) * dt * 0.06,
      y: f.y + (f.vy || 0) * dt * 0.06,
    }))
    .filter((f) => f.t > 0)

  const pending = g.mergeQ
  g.mergeQ = []
  const seen = new Set<Matter.Body>()
  for (const [a, b] of pending) {
    if (seen.has(a) || seen.has(b)) continue
    seen.add(a)
    seen.add(b)
    mergePair(g, a, b)
  }

  Matter.Engine.update(g.engine, Math.min(32, dt))

  let worst = 0
  for (const body of g.live) {
    const d = g.bots.get(body)
    if (!d || d.dead) continue
    d.age += dt
    d.born = Math.max(0, d.born - dt / 220)
    d.squash = Math.max(0, d.squash - dt / 160)
    const r = body.circleRadius || 0
    const bottom = body.position.y + r
    const fullyAbove = bottom < g.dangerY - 1
    const settled = body.speed < 0.7
    if (fullyAbove && settled && d.age > 350) {
      d.overMs += dt
      if (d.overMs > worst) worst = d.overMs
    } else {
      d.overMs = 0
    }
  }
  g.warnMs = worst
  if (worst >= 5000) {
    g.phase = 'over'
    for (const b of g.live) Matter.Sleeping.set(b, true)
  }
}

export function botOf(g: Game, body: Matter.Body) {
  return g.bots.get(body)
}

export function radiusOf(tier: number, scale: number) {
  return radius(tier, scale)
}

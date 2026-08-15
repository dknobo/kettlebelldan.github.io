import { sfx } from './audio'

export type Phase = 'title' | 'play' | 'boss' | 'win' | 'dead'

export type EnemyKind = 'tube' | 'book' | 'gram' | 'tiktok' | 'threads'

export type ShotKind = 'bolt' | 'rail' | 'seek' | 'nova' | 'rift' | 'lance'

export type Bullet = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  dmg: number
  pierce: number
  homing: boolean
  bounce: number
  kind: ShotKind
  len: number
  tint: 'blue' | 'gold' | null
  tx: number
  ty: number
  lock: number
  look: number
}

export type Enemy = {
  id: number
  kind: EnemyKind
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hp: number
  max: number
  t: number
  flash: number
  aim: number
  next: number
  split: boolean
  novaLock: number
}

export type PowerKind = 'rapid' | 'nova' | 'titan'

export const POWERS: Record<PowerKind, { name: string; use: string; color: string }> = {
  rapid: { name: 'Overclock', use: 'full auto · stacks until you lose a life', color: '#ff6b2c' },
  nova: { name: 'Nova', use: 'chain blast · stacks until you lose a life', color: '#c084fc' },
  titan: { name: 'Titan', use: 'heavy rounds · stacks until you lose a life', color: '#f4f4f5' },
}

export type Orb = {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  worth: number
  color: string
  kind: 'score' | 'heart' | 'boost' | PowerKind
}
export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: 'spark' | 'ring' | 'flame' | 'heart' | 'bolt' | 'nova' | 'flare'
}

export type Shock = { x: number; y: number; r: number; vr: number; life: number; ink?: boolean }
export type ScorePip = { x: number; y: number; sx: number; sy: number; n: number; t: number; life: number }
export type Beam = { x: number; y: number; a: number; w: number; life: number; max: number; dmg: number }
export type NovaArc = {
  x: number
  y: number
  tid: number
  wait: number
  t: number
  max: number
  dmg: number
  hop: number
}
export type FoeShot = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  kind: 'plasma' | 'shard'
  spin: number
}

export type Boss = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hp: number
  max: number
  t: number
  phase: 1 | 2 | 3
  next: number
  flash: number
  angle: number
  novaLock: number
  laserCd: number
  laserT: number
  laserA: number
  laserT2: number
  laserA2: number
  dropLock: number
  loot: number
}

export const TENTACLE_COUNT = 8
export const TENTACLE_LOGOS = ['book', 'meta', 'gram', 'threads', 'book', 'meta', 'gram', 'threads'] as const
export type TentacleLogo = (typeof TENTACLE_LOGOS)[number]

export function tentacleOf(b: Boss, i: number, t: number) {
  const n = TENTACLE_COUNT
  const base = b.angle + (i / n) * Math.PI * 2
  const root = b.r * 0.36
  const ox = b.x + Math.cos(base) * root
  const oy = b.y + Math.sin(base) * root
  const pts: { x: number; y: number }[] = [{ x: ox, y: oy }]
  let x = ox
  let y = oy
  let a = base + Math.sin(t * 0.55 + i * 0.9) * 0.1
  const segs = 10
  const reach = b.r * (0.2 + (i % 2) * 0.035) + 9
  for (let s = 1; s <= segs; s++) {
    const u = s / segs
    a += Math.sin(t * 1.45 + i * 1.12 + u * 3.2) * (0.16 + u * 0.2)
    a += Math.sin(t * 0.62 + i * 0.55) * 0.05
    x += Math.cos(a) * reach
    y += Math.sin(a) * reach
    pts.push({ x, y })
  }
  return { pts, tip: pts[pts.length - 1], a, base }
}

export type Game = {
  w: number
  h: number
  phase: Phase
  t: number
  player: {
    x: number
    y: number
    vx: number
    vy: number
    angle: number
    hp: number
    maxHp: number
    iFrames: number
    dashCd: number
    fireCd: number
    thrusting: boolean
    charging: boolean
    charge: number
    muzzle: number
  }
  bullets: Bullet[]
  shocks: Shock[]
  enemies: Enemy[]
  orbs: Orb[]
  particles: Particle[]
  ghosts: { x: number; y: number; a: number; life: number }[]
  boss: Boss | null
  kills: number
  goal: number
  score: number
  weapon: number
  wave: number
  waveName: string
  waveTag: string
  waveBanner: number
  spawnQ: EnemyKind[]
  spawnT: number
  shake: number
  hitstop: number
  combo: number
  bestCombo: number
  invuln: number
  marks: number
  unlock: { name: string; use: string; t: number } | null
  flash: number
  paused: boolean
  shown: number
  pips: ScorePip[]
  beams: Beam[]
  foes: FoeShot[]
  arcs: NovaArc[]
  boostT: number
  boostMul: number
  overdrive: number
  buffs: Record<PowerKind, number>
  novaTick: number
  note: { name: string; use: string; t: number } | null
}

export type Input = {
  rotate: number
  thrust: boolean
  hyper: boolean
  fire: boolean
  tilt: { x: number; y: number } | null
}

type Wave = { name: string; tag: string; pack: EnemyKind[] }

function pile(kind: EnemyKind, n: number) {
  return Array.from({ length: n }, () => kind)
}

export const ARSENAL = [
  { name: 'Pulse', use: 'Heavy bolts. Lead the drift — they are slow and mean.' },
  { name: 'Twin', use: 'Two streams. Hold a line and rake the pack.' },
  { name: 'Rail', use: 'Charge, then release. Line them up. It goes through everything.' },
  { name: 'Spread', use: 'Five-way cone. Good when they cluster. Wasteful at range.' },
  { name: 'Seekers', use: 'Heat-seeking spread. Blue and gold lock on and chase.' },
]

export const WAVES: Wave[] = [
  { name: 'The Feed', tag: '', pack: pile('tube', 22) },
  { name: 'The Algorithm', tag: '', pack: [...pile('tube', 12), ...pile('book', 16)] },
  { name: 'For You', tag: '', pack: [...pile('tube', 8), ...pile('book', 10), ...pile('gram', 16)] },
  { name: 'The Timeline', tag: '', pack: [...pile('tube', 6), ...pile('book', 8), ...pile('gram', 8), ...pile('tiktok', 16)] },
  {
    name: 'Ratio',
    tag: '',
    pack: [...pile('tube', 6), ...pile('book', 6), ...pile('gram', 8), ...pile('tiktok', 8), ...pile('threads', 16)],
  },
]

const STAT: Record<EnemyKind, { hp: number; r: number; spd: number }> = {
  tube: { hp: 4, r: 26, spd: 70 },
  book: { hp: 7, r: 29, spd: 56 },
  gram: { hp: 4, r: 24, spd: 90 },
  tiktok: { hp: 4, r: 24, spd: 150 },
  threads: { hp: 6, r: 28, spd: 88 },
}

let nid = 1
const nextId = () => nid++

export function createGame(): Game {
  return {
    w: 900,
    h: 700,
    phase: 'title',
    t: 0,
    player: {
      x: 450,
      y: 380,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 4,
      hp: 4,
      maxHp: 4,
      iFrames: 0,
      dashCd: 0,
      fireCd: 0,
      thrusting: false,
      charging: false,
      charge: 0,
      muzzle: 0,
    },
    bullets: [],
    shocks: [],
    enemies: [],
    orbs: [],
    particles: [],
    ghosts: [],
    boss: null,
    kills: 0,
    score: 0,
    weapon: 1,
    wave: 0,
    waveName: '',
    waveTag: '',
    waveBanner: 0,
    spawnQ: [],
    spawnT: 0,
    shake: 0,
    hitstop: 0,
    combo: 0,
    bestCombo: 0,
    invuln: 0,
    marks: 0,
    unlock: null,
    flash: 0,
    goal: 166,
    paused: false,
    shown: 0,
    pips: [],
    beams: [],
    foes: [],
    arcs: [],
    boostT: 0,
    boostMul: 1,
    overdrive: 0,
    buffs: { rapid: 0, nova: 0, titan: 0 },
    novaTick: 0,
    note: null,
  }
}

export function startRun(g: Game) {
  const w = g.w
  const h = g.h
  Object.assign(g, createGame(), { w, h, phase: 'play' as Phase })
  g.player.x = w / 2
  g.player.y = h * 0.56
  beginWave(g, 0)
}

function beginWave(g: Game, i: number) {
  const wave = WAVES[i]
  g.wave = i
  g.waveName = wave.name
  g.waveTag = wave.tag
  g.waveBanner = 1.8
  g.spawnQ = wave.pack.slice()
  g.spawnT = 0.35
}

export function weaponFor(marks: number) {
  return Math.min(5, 1 + Math.floor(marks / 32))
}

function fireRate(weapon: number) {
  if (weapon === 3) return 0.42
  if (weapon === 5) return 0.52
  return Math.max(0.12, 0.22 - weapon * 0.012)
}

function stacks(g: Game, k: PowerKind) {
  return g.buffs[k] || 0
}

function firePace(g: Game) {
  let r = fireRate(g.weapon) * (g.overdrive > 0 ? 0.6 : 1)
  const n = stacks(g, 'rapid')
  if (n > 0) r *= Math.max(0.08, 0.34 * Math.pow(0.66, n - 1))
  return r
}

export function kindColor(kind: EnemyKind) {
  if (kind === 'tube') return '#ff2a2a'
  if (kind === 'book') return '#1877f2'
  if (kind === 'gram') return '#ee2a7b'
  if (kind === 'tiktok') return '#25f4ee'
  return '#f4f4f4'
}

function award(g: Game, x: number, y: number, n: number) {
  if (n <= 0) return
  const pts = Math.round(n * (g.boostT > 0 ? g.boostMul : 1))
  g.score += pts
  if (g.pips.length > 18) {
    const old = g.pips.shift()
    if (old) g.shown += old.n
  }
  g.pips.push({ x, y, sx: x, sy: y, n: pts, t: 0, life: 1.25 })
}

function hyperDest(g: Game) {
  const pad = 70
  for (let n = 0; n < 28; n++) {
    const x = pad + Math.random() * (g.w - pad * 2)
    const y = pad + Math.random() * (g.h - pad * 2)
    let ok = true
    for (const e of g.enemies) {
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < (e.r + 88) ** 2) {
        ok = false
        break
      }
    }
    if (ok && g.boss && (g.boss.x - x) ** 2 + (g.boss.y - y) ** 2 < (g.boss.r + 100) ** 2) ok = false
    if (ok) {
      for (const f of g.foes) {
        if ((f.x - x) ** 2 + (f.y - y) ** 2 < 70 ** 2) {
          ok = false
          break
        }
      }
    }
    if (ok) return { x, y }
  }
  return { x: g.w * 0.5, y: g.h * 0.55 }
}

function wrap(g: Game, o: { x: number; y: number }) {
  if (o.x < -24) o.x = g.w + 24
  else if (o.x > g.w + 24) o.x = -24
  if (o.y < -24) o.y = g.h + 24
  else if (o.y > g.h + 24) o.y = -24
}

function edgeSpawn(g: Game) {
  const pad = 36
  const side = Math.floor(Math.random() * 4)
  if (side === 0) return { x: Math.random() * g.w, y: -pad }
  if (side === 1) return { x: Math.random() * g.w, y: g.h + pad }
  if (side === 2) return { x: -pad, y: Math.random() * g.h }
  return { x: g.w + pad, y: Math.random() * g.h }
}

function spawnEnemy(
  g: Game,
  kind: EnemyKind,
  at?: { x: number; y: number },
  extra?: { r?: number; hp?: number; split?: boolean; vx?: number; vy?: number },
) {
  const st = STAT[kind]
  const p = at ?? edgeSpawn(g)
  const drift = 40 + Math.random() * 90
  const a = Math.random() * Math.PI * 2
  const r = extra?.r ?? st.r
  const hp = extra?.hp ?? st.hp
  g.enemies.push({
    id: nextId(),
    kind,
    x: p.x,
    y: p.y,
    vx: extra?.vx ?? Math.cos(a) * drift,
    vy: extra?.vy ?? Math.sin(a) * drift,
    r,
    hp,
    max: hp,
    t: Math.random() * 10,
    flash: 0,
    aim: 0,
    next: 0.6 + Math.random() * 0.8,
    split: extra?.split ?? true,
    novaLock: 0,
  })
}

function burst(g: Game, x: number, y: number, color: string, n = 10, speed = 180) {
  if (g.particles.length > 140) return
  n = Math.min(n, 14)
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3
    const s = speed * (0.4 + Math.random())
    g.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.28 + Math.random() * 0.25,
      max: 0.5,
      size: 2 + Math.random() * 3,
      color,
      kind: 'spark',
    })
  }
}

function ring(g: Game, x: number, y: number, color: string) {
  g.particles.push({ x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 8, color, kind: 'ring' })
}

function novaPulse(g: Game, x: number, y: number, r: number, dmg: number) {
  g.particles.push({ x, y, vx: 0, vy: 0, life: 0.58, max: 0.58, size: r, color: '#c084fc', kind: 'nova' })
  g.particles.push({ x, y, vx: 0, vy: 0, life: 0.34, max: 0.34, size: r * 0.62, color: '#f0abfc', kind: 'nova' })
  g.particles.push({ x, y, vx: 0, vy: 0, life: 0.16, max: 0.16, size: r * 0.28, color: '#fff', kind: 'flare' })
  burst(g, x, y, '#e879f9', 12, 280)
  for (const e of g.enemies) {
    if (e.hp <= 0) continue
    if ((e.x - x) ** 2 + (e.y - y) ** 2 > (r + e.r) ** 2) continue
    e.hp -= dmg
    e.flash = 1
    if (e.hp <= 0) killEnemy(g, e)
  }
  if (g.boss && (g.boss.x - x) ** 2 + (g.boss.y - y) ** 2 < (r + g.boss.r) ** 2) {
    g.boss.hp -= Math.max(2, Math.round(dmg * 0.7))
    g.boss.flash = 0.45
    if (g.boss.hp <= 0) defeatBoss(g)
  }
}

function queueNovaFrom(g: Game, x: number, y: number, srcId: number, hop = 0) {
  if (!powered(g, 'nova')) return
  const n = stacks(g, 'nova')
  if (hop >= n) return
  const reach = 180 + n * 58
  const near: { id: number; d: number }[] = []
  for (const e of g.enemies) {
    if (e.id === srcId || e.hp <= 0) continue
    const d = (e.x - x) ** 2 + (e.y - y) ** 2
    if (d < reach * reach) near.push({ id: e.id, d })
  }
  if (g.boss && srcId !== -1) {
    const d = (g.boss.x - x) ** 2 + (g.boss.y - y) ** 2
    if (d < (reach + 40) * (reach + 40)) near.push({ id: -1, d })
  }
  near.sort((a, b) => a.d - b.d)
  const count = 4 + n * 3
  near.slice(0, count).forEach((t, i) => {
    g.arcs.push({
      x,
      y,
      tid: t.id,
      wait: 0.06 + i * 0.045 + hop * 0.07,
      t: 0,
      max: 0.2,
      dmg: 6 + n * 4,
      hop,
    })
  })
  if (g.particles.length < 140) {
    g.particles.push({ x, y, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 32 + n * 6, color: '#e879f9', kind: 'nova' })
    g.particles.push({ x, y, vx: 0, vy: 0, life: 0.08, max: 0.08, size: 12 + n * 2, color: '#fff', kind: 'flare' })
  }
  if (g.arcs.length > 48) g.arcs.splice(0, g.arcs.length - 48)
}

function landNova(g: Game, a: NovaArc, x: number, y: number) {
  const n = stacks(g, 'nova')
  burst(g, x, y, '#f0abfc', 8 + n, 200)
  if (g.particles.length < 140) {
    g.particles.push({ x, y, vx: 0, vy: 0, life: 0.16, max: 0.16, size: 26 + n * 5, color: '#d8b4fe', kind: 'nova' })
    g.particles.push({ x, y, vx: 0, vy: 0, life: 0.07, max: 0.07, size: 10 + n * 2, color: '#fff', kind: 'flare' })
  }
  if (a.hop + 1 < n) queueNovaFrom(g, x, y, a.tid, a.hop + 1)
}

function updateArcs(g: Game, dt: number) {
  for (const a of g.arcs) {
    if (a.wait > 0) {
      a.wait -= dt
      continue
    }
    a.t += dt
    if (a.t < a.max) continue
    a.t = 99
    if (a.tid === -1) {
      if (!g.boss) continue
      g.boss.hp -= Math.max(2, Math.round(a.dmg * 0.7))
      g.boss.flash = 0.55
      landNova(g, a, g.boss.x, g.boss.y)
      if (g.boss.hp <= 0) defeatBoss(g)
      continue
    }
    const e = g.enemies.find((o) => o.id === a.tid)
    if (!e) continue
    const live = e.hp > 0
    if (live) {
      e.hp -= a.dmg
      e.flash = 1
      e.novaLock = Math.max(e.novaLock, 0.18)
    }
    landNova(g, a, e.x, e.y)
    if (live && e.hp <= 0) killEnemy(g, e)
  }
  g.arcs = g.arcs.filter((a) => a.t < a.max)
}

function novaLockTime(g: Game) {
  return Math.max(0.12, 0.26 - stacks(g, 'nova') * 0.025)
}

function triggerNova(g: Game, e: Enemy) {
  if (!powered(g, 'nova') || e.novaLock > 0) return
  e.novaLock = novaLockTime(g)
  queueNovaFrom(g, e.x, e.y, e.id, 0)
}

function activatePower(g: Game, kind: PowerKind) {
  const spec = POWERS[kind]
  g.buffs[kind] = Math.min(5, g.buffs[kind] + 1)
  const n = g.buffs[kind]
  g.note = {
    name: spec.name,
    use: n === 1 ? 'until you lose a life' : `×${n} stronger`,
    t: 2.4,
  }
  g.shake = Math.max(g.shake, kind === 'nova' ? 14 + n : 9 + n)
  const p = g.player
  g.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.7, max: 0.7, size: 180 + n * 50, color: spec.color, kind: 'nova' })
  g.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: 40 + n * 8, color: '#fff', kind: 'flare' })
  ring(g, p.x, p.y, spec.color)
  burst(g, p.x, p.y, spec.color, 10 + n * 2, 340)
  if (kind === 'nova') novaPulse(g, p.x, p.y, 220 + n * 48, 14 + n * 6)
}

function aimAt(x: number, y: number, tx: number, ty: number) {
  return Math.atan2(ty - y, tx - x)
}

function powered(g: Game, k: PowerKind) {
  return g.buffs[k] > 0
}

function shot(
  g: Game,
  ang: number,
  opts: Partial<Bullet> & { spd?: number } = {},
) {
  const p = g.player
  const tn = stacks(g, 'titan')
  const nv = stacks(g, 'nova')
  const spd = (opts.spd ?? 680) * (tn > 0 ? 0.86 : 1)
  g.bullets.push({
    x: p.x + Math.cos(ang) * 18,
    y: p.y + Math.sin(ang) * 18,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    r: (opts.r ?? 4.2) * (1 + tn * 0.2),
    life: opts.life ?? 1.15,
    dmg: (opts.dmg ?? 2) * (1 + tn * 1.05) * (1 + nv * 0.08),
    pierce: (opts.pierce ?? 0) + (tn > 0 ? 1 + tn : 0),
    homing: opts.homing ?? false,
    bounce: opts.bounce ?? 0,
    kind: opts.kind ?? 'bolt',
    len: (opts.len ?? 10) * (1 + tn * 0.16),
    tint: opts.tint ?? null,
    tx: 0,
    ty: 0,
    lock: 0,
    look: opts.look ?? g.weapon,
  })
  if (g.bullets.length > 64) g.bullets.splice(0, g.bullets.length - 64)
}

function muzzlePop(g: Game) {
  const p = g.player
  p.muzzle = Math.max(p.muzzle, 0.14)
  const a = p.angle
  const x = p.x + Math.cos(a) * 22
  const y = p.y + Math.sin(a) * 22
  const tn = stacks(g, 'titan')
  const nv = stacks(g, 'nova')
  const rp = stacks(g, 'rapid')
  const col = nv > 0 ? '#e879f9' : tn > 0 ? '#f4f4f5' : rp > 0 ? '#ff8a3d' : '#9ecbff'
  if (g.particles.length < 140) {
    g.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.11,
      max: 0.11,
      size: 16 + tn * 4 + nv * 2,
      color: col,
      kind: 'flare',
    })
  }
  burst(g, x, y, col, 5 + tn + nv, 220)
}

function firePlayer(g: Game) {
  const p = g.player
  const w = g.weapon
  const a = p.angle

  if (w === 1) {
    shot(g, a, { r: 6.4, dmg: 3.4, spd: 520, kind: 'bolt', len: 16, look: 1 })
  } else if (w === 2) {
    shot(g, a - 0.1, { r: 5.2, dmg: 3.2, spd: 620, kind: 'bolt', len: 14, look: 2 })
    shot(g, a + 0.1, { r: 5.2, dmg: 3.2, spd: 620, kind: 'bolt', len: 14, look: 2 })
  } else if (w === 4) {
    for (const s of [-0.42, -0.21, 0, 0.21, 0.42]) {
      shot(g, a + s, { r: 4.2, dmg: 2.2, spd: 700, kind: 'bolt', len: 12, look: 4 })
    }
  } else if (w === 5) {
    const fans = [-0.48, -0.24, 0, 0.24, 0.48]
    fans.forEach((s, i) => {
      shot(g, a + s, {
        r: 5,
        dmg: 3.2,
        spd: 400 + Math.abs(s) * 40,
        kind: 'seek',
        homing: true,
        life: 1.7,
        len: 12,
        tint: i % 2 === 0 ? 'blue' : 'gold',
        look: 5,
      })
    })
  }
  muzzlePop(g)
}

function railLevel() {
  return { w: 11, dmg: 18, charge: 0.12, linger: 0.26 }
}

function fireRail(g: Game) {
  const p = g.player
  const spec = railLevel()
  const a = p.angle
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const tn = stacks(g, 'titan')
  const nv = stacks(g, 'nova')
  const w = spec.w * (1 + tn * 0.28)
  const dmg = spec.dmg * (1 + tn * 1.25)
  const linger = spec.linger * (1 + tn * 0.4)
  g.beams.push({ x: p.x, y: p.y, a, w, life: linger, max: linger, dmg })
  g.shake = Math.min(14, 4 + tn * 2.4 + nv)
  railDamage(g, p.x, p.y, a, w, dmg)
  muzzlePop(g)
  burst(g, p.x + ux * 28, p.y + uy * 28, tn > 0 ? '#f4f4f5' : nv > 0 ? '#e879f9' : '#9ecbff', 10 + tn * 2, 240)
}

function railDamage(g: Game, x: number, y: number, a: number, width: number, dmg: number, give = true) {
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const hit = (ex: number, ey: number, r: number) => {
    const dx = ex - x
    const dy = ey - y
    const along = dx * ux + dy * uy
    if (along < -8) return false
    const px = dx - along * ux
    const py = dy - along * uy
    return px * px + py * py < (width + r) * (width + r)
  }
  for (const e of g.enemies) {
    if (e.hp <= 0) continue
    if (!hit(e.x, e.y, e.r)) continue
    e.hp -= dmg
    e.flash = 1
    if (give) award(g, e.x, e.y, 10)
    burst(g, e.x, e.y, '#fff', 6, 120)
    triggerNova(g, e)
    if (e.hp <= 0) killEnemy(g, e)
  }
  if (give && g.boss && hit(g.boss.x, g.boss.y, g.boss.r)) {
    g.boss.hp -= dmg
    g.boss.flash = 0.45
    award(g, g.boss.x, g.boss.y, 10)
    popBossPower(g, g.boss.x, g.boss.y)
    if (powered(g, 'nova') && g.boss.novaLock <= 0) {
      g.boss.novaLock = novaLockTime(g)
      queueNovaFrom(g, g.boss.x, g.boss.y, -1, 0)
    }
    if (g.boss.hp <= 0) defeatBoss(g)
  }
  for (const f of g.foes) {
    if (f.life > 0 && hit(f.x, f.y, f.r)) f.life = 0
  }
}

function killEnemy(g: Game, e: Enemy) {
  g.kills += 1
  if (e.split) g.marks += 1
  g.combo += 1
  if (g.combo > g.bestCombo) g.bestCombo = g.combo
  const nextW = weaponFor(g.marks)
  if (nextW > g.weapon) {
    g.weapon = nextW
    const kit = ARSENAL[nextW - 1]
    g.unlock = { name: kit.name, use: kit.use, t: 2.8 }
    g.invuln = 2.6
    g.shake = 4
  }
  burst(g, e.x, e.y, '#ffffff', 7, 220)
  ring(g, e.x, e.y, 'rgba(255,255,255,0.7)')
  g.shake = Math.min(8, g.shake + 2.4)
  g.hitstop = 0.016
  const drop = (kind: Orb['kind'], worth: number, color: string) => {
    g.orbs.push({
      x: e.x + (Math.random() - 0.5) * 16,
      y: e.y + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      t: 0,
      worth,
      color,
      kind,
    })
  }
  drop('score', 20, kindColor(e.kind))
  if (e.split && Math.random() < 0.1) drop('heart', 0, '#ff4d6d')
  if (e.split && Math.random() < 0.03) drop('boost', 0, '#f5d76e')
  if (e.split && Math.random() < 0.2) {
    const kinds: PowerKind[] = ['rapid', 'nova', 'titan']
    const pk = kinds[Math.floor(Math.random() * kinds.length)]
    drop(pk, 0, POWERS[pk].color)
  }
  if (g.combo > 0 && g.combo % 22 === 0) {
    drop('boost', 0, '#f5d76e')
    ring(g, e.x, e.y, '#f5d76e')
  }
  if (e.split) {
    const childR = Math.max(14, e.r * 0.62)
    const childHp = Math.max(1, Math.ceil(e.max * 0.45))
    for (let i = 0; i < 2; i++) {
      spawnEnemy(
        g,
        e.kind,
        { x: e.x + (i ? 12 : -12), y: e.y + (i ? -10 : 10) },
        {
          r: childR,
          hp: childHp,
          split: false,
          vx: e.vx + (i ? 80 : -80),
          vy: e.vy + (i ? -55 : 55),
        },
      )
    }
  }
}

function hurtPlayer(g: Game) {
  if (g.player.iFrames > 0 || g.invuln > 0) return
  g.player.hp -= 1
  g.player.iFrames = 1.05
  g.combo = 0
  if (g.phase !== 'boss') {
    g.buffs.rapid = 0
    g.buffs.nova = 0
    g.buffs.titan = 0
    g.arcs = []
  }
  g.shake = 28
  g.hitstop = 0.09
  burst(g, g.player.x, g.player.y, '#ff4d4d', 16, 260)
  if (g.player.hp <= 0) {
    g.phase = 'dead'
    burst(g, g.player.x, g.player.y, '#ffffff', 28, 320)
  }
}

function startBoss(g: Game) {
  g.phase = 'boss'
  g.waveName = 'The Platform'
  g.waveTag = ''
  g.waveBanner = 2.2
  g.enemies = []
  g.foes = []
  g.boss = {
    x: g.w / 2,
    y: g.h * 0.28,
    vx: 80,
    vy: 10,
    r: 70,
    hp: 860,
    max: 860,
    t: 0,
    phase: 1,
    next: 0.7,
    flash: 0,
    angle: 0,
    novaLock: 0,
    laserCd: 2.1,
    laserT: 0,
    laserA: Math.PI / 2,
    laserT2: 0,
    laserA2: Math.PI / 2,
    dropLock: 0,
    loot: 0,
  }
  ring(g, g.boss.x, g.boss.y, '#1877f2')
}

function popBossPower(g: Game, hx: number, hy: number) {
  const b = g.boss
  if (!b || b.dropLock > 0) return
  b.dropLock = 0.82
  const kinds: PowerKind[] = ['rapid', 'nova', 'titan']
  const pk = kinds[b.loot % 3]
  b.loot += 1
  const a = Math.atan2(hy - b.y, hx - b.x || 1) + (Math.random() - 0.5) * 0.9
  const spd = 150 + Math.random() * 90
  g.orbs.push({
    x: b.x + Math.cos(a) * (b.r * 0.35),
    y: b.y + Math.sin(a) * (b.r * 0.35),
    vx: Math.cos(a) * spd,
    vy: Math.sin(a) * spd,
    t: 0,
    worth: 0,
    color: POWERS[pk].color,
    kind: pk,
  })
}

function defeatBoss(g: Game) {
  const b = g.boss
  if (!b) return
  g.phase = 'win'
  award(g, b.x, b.y, 2500)
  burst(g, b.x, b.y, '#1877f2', 36, 340)
  burst(g, b.x, b.y, '#ffffff', 18, 260)
  g.shake = 8
  g.boss = null
  g.foes = []
}

function foeShot(g: Game, x: number, y: number, a: number, opts: Partial<FoeShot> & { spd?: number } = {}) {
  const spd = opts.spd ?? 220
  g.foes.push({
    x,
    y,
    vx: Math.cos(a) * spd,
    vy: Math.sin(a) * spd,
    r: opts.r ?? 6.4,
    life: opts.life ?? 4.2,
    kind: opts.kind ?? 'plasma',
    spin: opts.spin ?? a,
  })
}

function bossFire(g: Game, b: Boss) {
  const a0 = aimAt(b.x, b.y, g.player.x, g.player.y)
  if (b.phase === 3 && Math.random() < 0.5) {
    for (let i = 0; i < 8; i++) {
      const a = a0 + (i / 8) * Math.PI * 2
      foeShot(g, b.x + Math.cos(a) * (b.r + 8), b.y + Math.sin(a) * (b.r + 8), a, {
        spd: 240,
        kind: 'shard',
        r: 5.4,
        life: 3.6,
      })
    }
    return
  }
  const n = b.phase === 1 ? 1 : b.phase === 2 ? 3 : 5
  const stepA = b.phase === 1 ? 0 : b.phase === 2 ? 0.26 : 0.2
  const spd = 210 + b.phase * 55
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * stepA
    const shard = b.phase >= 2 && i !== Math.floor(n / 2)
    foeShot(g, b.x + Math.cos(a) * (b.r + 8), b.y + Math.sin(a) * (b.r + 8), a, {
      spd: shard ? spd + 40 : spd,
      kind: shard ? 'shard' : 'plasma',
      r: shard ? 5.4 : 7.2,
    })
  }
}

function updateFoes(g: Game, dt: number) {
  for (const f of g.foes) {
    f.x += f.vx * dt
    f.y += f.vy * dt
    f.life -= dt
    f.spin += dt * (f.kind === 'shard' ? 8 : 4)
    const dx = g.player.x - f.x
    const dy = g.player.y - f.y
    if (dx * dx + dy * dy < (f.r + 16) * (f.r + 16)) {
      hurtPlayer(g)
      f.life = 0
    }
  }
  g.foes = g.foes.filter((f) => f.life > 0 && f.x > -50 && f.x < g.w + 50 && f.y > -50 && f.y < g.h + 50)
}

function rayHit(px: number, py: number, x: number, y: number, a: number, width: number) {
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const dx = px - x
  const dy = py - y
  const along = dx * ux + dy * uy
  if (along < 0) return false
  const ox = dx - along * ux
  const oy = dy - along * uy
  return ox * ox + oy * oy < width * width
}

function updateBoss(g: Game, dt: number) {
  const b = g.boss
  if (!b) return
  b.t += dt
  b.angle += dt * (0.35 + b.phase * 0.12)
  b.flash = Math.max(0, b.flash - dt * 4)
  b.novaLock = Math.max(0, b.novaLock - dt)
  b.dropLock = Math.max(0, b.dropLock - dt)
  b.next -= dt

  const tx = g.w * 0.5 + Math.sin(b.t * 0.62) * g.w * 0.34
  const ty = g.h * 0.3 + Math.cos(b.t * 0.46) * g.h * 0.2
  const steer = 1.55 + b.phase * 0.35
  b.vx += (tx - b.x) * dt * steer
  b.vy += (ty - b.y) * dt * steer
  if (b.phase === 3) {
    b.vx += (g.player.x - b.x) * dt * 0.22
    b.vy += (g.player.y - b.y) * dt * 0.22
  }
  const cap = 120 + b.phase * 30
  const sp = Math.hypot(b.vx, b.vy) || 1
  if (sp > cap) {
    b.vx = (b.vx / sp) * cap
    b.vy = (b.vy / sp) * cap
  }
  b.x += b.vx * dt
  b.y += b.vy * dt
  const pad = b.r + 10
  b.x = Math.max(pad, Math.min(g.w - pad, b.x))
  b.y = Math.max(pad, Math.min(g.h - pad, b.y))

  const frac = b.hp / b.max
  if (frac < 0.66 && b.phase === 1) b.phase = 2
  if (frac < 0.33 && b.phase === 2) b.phase = 3

  if (b.next <= 0) {
    bossFire(g, b)
    if (b.phase >= 2) {
      g.shocks.push({ x: b.x, y: b.y, r: 18, vr: b.phase === 3 ? 90 : 70, life: 1.8, ink: true })
    }
    b.next = b.phase === 1 ? 0.92 : b.phase === 2 ? 0.7 : 0.5
  }

  b.laserCd -= dt
  const trackLaser = (key: 'laserA' | 'laserA2', tkey: 'laserT' | 'laserT2', lead: number) => {
    if (b[tkey] <= 0) return
    b[tkey] -= dt
    if (b[tkey] > 0.52) {
      const want = aimAt(b.x, b.y, g.player.x, g.player.y) + lead
      const d = Math.atan2(Math.sin(want - b[key]), Math.cos(want - b[key]))
      b[key] += d * dt * 2.4
    } else if (b[tkey] > 0) {
      if (rayHit(g.player.x, g.player.y, b.x, b.y, b[key], 11)) hurtPlayer(g)
    }
  }
  trackLaser('laserA', 'laserT', 0)
  if (b.phase >= 2) trackLaser('laserA2', 'laserT2', b.phase === 3 ? 0.7 : 0.48)
  if (b.laserT <= 0 && b.laserCd <= 0) {
    const aim = aimAt(b.x, b.y, g.player.x, g.player.y)
    b.laserA = aim
    b.laserT = 1.28
    if (b.phase >= 2) {
      b.laserA2 = aim + (b.phase === 3 ? 0.7 : 0.48)
      b.laserT2 = 1.28
    }
    b.laserCd = b.phase === 1 ? 3.2 : b.phase === 2 ? 2.2 : 1.55
  }

  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const tip = tentacleOf(b, i, b.t).tip
    const dx = g.player.x - tip.x
    const dy = g.player.y - tip.y
    if (dx * dx + dy * dy < 22 * 22) hurtPlayer(g)
  }

  for (const bl of g.bullets) {
    const dx = bl.x - b.x
    const dy = bl.y - b.y
    if (dx * dx + dy * dy < (b.r + bl.r) * (b.r + bl.r)) {
      b.hp -= bl.dmg
      b.flash = 0.45
      bl.life = 0
      award(g, bl.x, bl.y, 10)
      burst(g, bl.x, bl.y, '#8ab4ff', 5, 120)
      popBossPower(g, bl.x, bl.y)
      if (powered(g, 'nova') && b.novaLock <= 0) {
        b.novaLock = novaLockTime(g)
        queueNovaFrom(g, b.x, b.y, -1, 0)
      }
      if (b.hp <= 0) {
        defeatBoss(g)
        return
      }
    }
  }

  const p = g.player
  const dx = p.x - b.x
  const dy = p.y - b.y
  if (dx * dx + dy * dy < (b.r + 17) * (b.r + 17)) hurtPlayer(g)
}

function updateEnemies(g: Game, dt: number) {
  const p = g.player
  for (const e of g.enemies) {
    e.t += dt
    e.flash = Math.max(0, e.flash - dt * 8)
    e.novaLock = Math.max(0, e.novaLock - dt)
    e.aim = aimAt(e.x, e.y, p.x, p.y)
    e.next -= dt
    const dist = Math.hypot(p.x - e.x, p.y - e.y) || 1

    if (e.kind === 'book') {
      e.vx += Math.cos(e.aim) * 48 * dt
      e.vy += Math.sin(e.aim) * 48 * dt
      if (g.wave >= 3 && e.next <= 0) {
        foeShot(g, e.x + Math.cos(e.aim) * (e.r + 6), e.y + Math.sin(e.aim) * (e.r + 6), e.aim, {
          spd: 170,
          kind: 'plasma',
          r: 6,
          life: 3.8,
        })
        e.next = 2.5 + Math.random() * 0.6
      }
    } else if (e.kind === 'gram') {
      if (e.next <= 0) {
        e.flash = 1
        e.vx = Math.cos(e.aim) * 340
        e.vy = Math.sin(e.aim) * 340
        e.next = 1.35 + Math.random() * 0.5
      } else {
        e.vx *= 0.985
        e.vy *= 0.985
      }
    } else if (e.kind === 'tiktok') {
      const wob = Math.sin(e.t * 11) * 260
      e.vx += (Math.cos(e.aim) * 70 + Math.cos(e.aim + Math.PI / 2) * wob) * dt
      e.vy += (Math.sin(e.aim) * 70 + Math.sin(e.aim + Math.PI / 2) * wob) * dt
    } else if (e.kind === 'threads') {
      if (dist > 150) {
        e.vx += (-Math.sin(e.aim) * 90 + Math.cos(e.aim) * 20) * dt
        e.vy += (Math.cos(e.aim) * 90 + Math.sin(e.aim) * 20) * dt
      } else {
        e.vx += Math.cos(e.aim) * 130 * dt
        e.vy += Math.sin(e.aim) * 130 * dt
      }
      if (e.next <= 0) {
        g.shocks.push({ x: e.x, y: e.y, r: 12, vr: 160, life: 0.55 })
        if (g.wave >= 3) {
          foeShot(g, e.x + Math.cos(e.aim) * (e.r + 6), e.y + Math.sin(e.aim) * (e.r + 6), e.aim, {
            spd: 200,
            kind: 'shard',
            r: 5.2,
            life: 3.4,
          })
        }
        e.next = 2.1
      }
    }

    const cap = STAT[e.kind].spd + (e.kind === 'gram' && e.flash > 0.4 ? 220 : 40)
    const sp = Math.hypot(e.vx, e.vy) || 1
    if (sp > cap) {
      e.vx = (e.vx / sp) * cap
      e.vy = (e.vy / sp) * cap
    }
    e.x += e.vx * dt
    e.y += e.vy * dt
    wrap(g, e)

    const dx = p.x - e.x
    const dy = p.y - e.y
    if (dx * dx + dy * dy < (e.r + 16) * (e.r + 16)) hurtPlayer(g)
  }
}

function updateBullets(g: Game, dt: number) {
  for (const b of g.bullets) {
    if (b.homing) {
      b.lock -= dt
      if (b.lock <= 0) {
        b.lock = 0.12
        let bestD = 1e9
        let found = false
        for (const e of g.enemies) {
          if (e.hp <= 0) continue
          const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2
          if (d < bestD) {
            bestD = d
            b.tx = e.x
            b.ty = e.y
            found = true
          }
        }
        if (g.boss) {
          const d = (g.boss.x - b.x) ** 2 + (g.boss.y - b.y) ** 2
          if (d < bestD) {
            b.tx = g.boss.x
            b.ty = g.boss.y
            found = true
          }
        }
        if (!found) {
          b.tx = b.x + b.vx
          b.ty = b.y + b.vy
        }
      }
      const a = aimAt(b.x, b.y, b.tx, b.ty)
      b.vx += Math.cos(a) * 780 * dt
      b.vy += Math.sin(a) * 780 * dt
      const sp = Math.hypot(b.vx, b.vy) || 1
      b.vx = (b.vx / sp) * 440
      b.vy = (b.vy / sp) * 440
    }
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.life -= dt
    if (b.bounce > 0) {
      if (b.x < 0 || b.x > g.w) {
        b.vx *= -1
        b.bounce -= 1
      }
      if (b.y < 0 || b.y > g.h) {
        b.vy *= -1
        b.bounce -= 1
      }
    } else if (b.kind === 'rift') {
      wrap(g, b)
    }
  }

  for (const b of g.bullets) {
    for (const e of g.enemies) {
      if (e.hp <= 0) continue
      const hitR = b.kind === 'rail' || b.kind === 'lance' ? b.len * 0.35 + e.r : b.r + e.r
      const dx = b.x - e.x
      const dy = b.y - e.y
      if (dx * dx + dy * dy < hitR * hitR) {
        e.hp -= b.dmg
        e.flash = 1
        award(g, e.x, e.y, 10)
        b.pierce -= 1
        if (b.kind === 'rift' && g.enemies.length) {
          let next = e
          let best = 1e9
          for (const o of g.enemies) {
            if (o === e || o.hp <= 0) continue
            const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2
            if (d < best) {
              best = d
              next = o
            }
          }
          if (next !== e) {
            const ang = aimAt(b.x, b.y, next.x, next.y)
            const sp = Math.hypot(b.vx, b.vy) || 700
            b.vx = Math.cos(ang) * sp
            b.vy = Math.sin(ang) * sp
          }
        }
        if (b.pierce < 0) b.life = 0
        burst(g, b.x, b.y, '#fff', 2, 80)
        triggerNova(g, e)
        if (e.hp <= 0) killEnemy(g, e)
      }
    }
  }

  for (const s of g.shocks) {
    s.r += s.vr * dt
    s.life -= dt
    const d = Math.hypot(g.player.x - s.x, g.player.y - s.y)
    if (Math.abs(d - s.r) < 14) hurtPlayer(g)
  }
  g.shocks = g.shocks.filter((s) => s.life > 0)

  g.bullets = g.bullets.filter((b) => b.life > 0 && b.x > -80 && b.x < g.w + 80 && b.y > -80 && b.y < g.h + 80)
  g.enemies = g.enemies.filter((e) => e.hp > 0)
}

export function step(g: Game, dt: number, input: Input) {
  if (g.phase === 'title') {
    g.t += Math.min(0.033, dt)
    return
  }
  if (g.paused) return
  const capped = Math.min(0.033, dt)
  if (g.hitstop > 0) {
    g.hitstop -= capped
    return
  }
  const slow = g.unlock && g.unlock.t > 0.4 ? 0.22 : 1
  const c = capped * slow
  g.t += capped
  g.shake = Math.max(0, g.shake - capped * 28)
  g.waveBanner = Math.max(0, g.waveBanner - capped)
  g.invuln = Math.max(0, g.invuln - capped)
  g.flash = Math.max(0, g.flash - capped)
  g.boostT = Math.max(0, g.boostT - capped)
  if (g.boostT <= 0) g.boostMul = 1
  g.overdrive = Math.max(0, g.overdrive - capped)
  if (g.unlock) {
    g.unlock.t -= capped
    if (g.unlock.t <= 0) g.unlock = null
  }
  if (g.note) {
    g.note.t -= capped
    if (g.note.t <= 0) g.note = null
  }

  const p = g.player
  p.iFrames = Math.max(0, p.iFrames - capped)
  p.dashCd = Math.max(0, p.dashCd - capped)
  p.fireCd = Math.max(0, p.fireCd - capped)
  p.muzzle = Math.max(0, p.muzzle - capped)

  if (g.phase === 'dead' || g.phase === 'win') {
    if (g.pips.length) {
      for (const pip of g.pips) g.shown += pip.n
      g.pips = []
    }
    for (const pt of g.particles) {
      pt.x += pt.vx * capped
      pt.y += pt.vy * capped
      pt.life -= capped
    }
    g.particles = g.particles.filter((pt) => pt.life > 0)
    return
  }

  const tilt = input.tilt
  const tiltMag = tilt ? Math.hypot(tilt.x, tilt.y) : 0
  if (tilt && tiltMag > 0.05) {
    const nx = tilt.x / tiltMag
    const ny = tilt.y / tiltMag
    const want = Math.atan2(ny, nx)
    let turn = want - p.angle
    while (turn > Math.PI) turn -= Math.PI * 2
    while (turn < -Math.PI) turn += Math.PI * 2
    p.angle += turn * Math.min(1, 12 * capped)
    const power = Math.min(1, tiltMag)
    p.vx += nx * 680 * power * capped
    p.vy += ny * 680 * power * capped
    p.thrusting = power > 0.14
    if (p.thrusting && g.particles.length < 70) {
      g.particles.push({
        x: p.x - Math.cos(p.angle) * 16,
        y: p.y - Math.sin(p.angle) * 16,
        vx: -Math.cos(p.angle) * 80 + (Math.random() - 0.5) * 40,
        vy: -Math.sin(p.angle) * 80 + (Math.random() - 0.5) * 40,
        life: 0.16,
        max: 0.16,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#fff' : '#9ecbff',
        kind: 'flame',
      })
    }
  } else {
    p.angle += input.rotate * 3.9 * capped
    p.thrusting = input.thrust
    if (input.thrust) {
      p.vx += Math.cos(p.angle) * 540 * capped
      p.vy += Math.sin(p.angle) * 540 * capped
      if (g.particles.length < 70) {
        g.particles.push({
          x: p.x - Math.cos(p.angle) * 16,
          y: p.y - Math.sin(p.angle) * 16,
          vx: -Math.cos(p.angle) * 80 + (Math.random() - 0.5) * 40,
          vy: -Math.sin(p.angle) * 80 + (Math.random() - 0.5) * 40,
          life: 0.16,
          max: 0.16,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#fff' : '#9ecbff',
          kind: 'flame',
        })
      }
    }
  }
  p.vx *= Math.pow(0.72, capped)
  p.vy *= Math.pow(0.72, capped)
  const spd = Math.hypot(p.vx, p.vy)
  if (spd > 460) {
    p.vx = (p.vx / spd) * 460
    p.vy = (p.vy / spd) * 460
  }

  if (input.hyper && p.dashCd <= 0) {
    p.dashCd = 1.6
    burst(g, p.x, p.y, '#fff', 12, 240)
    ring(g, p.x, p.y, 'rgba(255,255,255,0.45)')
    const dest = hyperDest(g)
    p.x = dest.x
    p.y = dest.y
    p.vx *= 0.15
    p.vy *= 0.15
    p.iFrames = 0.8
    burst(g, p.x, p.y, '#9ecbff', 10, 200)
    ring(g, p.x, p.y, 'rgba(158,203,255,0.5)')
    g.shake = Math.max(g.shake, 3)
  }

  p.x += p.vx * capped
  p.y += p.vy * capped
  wrap(g, p)

  if (g.weapon !== 3) {
    p.charging = false
    p.charge = 0
  }
  const locked = !!(g.unlock && g.unlock.t > 1.4)
  if (g.weapon === 3) {
    const spec = railLevel()
    if (!input.fire || locked) {
      p.charging = false
      p.charge = 0
    } else if (p.charging) {
      p.charge += capped
      if (p.charge >= spec.charge * (g.overdrive > 0 ? 0.6 : 1) * (stacks(g, 'rapid') > 0 ? Math.max(0.18, 0.42 * Math.pow(0.7, stacks(g, 'rapid') - 1)) : 1)) {
        fireRail(g)
        p.charging = false
        p.charge = 0
        p.fireCd = firePace(g)
      }
    } else if (p.fireCd <= 0) {
      p.charging = true
      p.charge = 0
    }
  } else if (input.fire && p.fireCd <= 0 && !locked) {
    firePlayer(g)
    p.fireCd = firePace(g)
  }

  if (g.phase === 'play') {
    g.spawnT -= c
    if (g.spawnQ.length && g.spawnT <= 0) {
      spawnEnemy(g, g.spawnQ.shift()!)
      g.spawnT = (g.wave === 0 ? 0.32 : 0.52) + Math.random() * 0.16
    }
    if (!g.spawnQ.length && !g.enemies.length) {
      if (g.wave + 1 < WAVES.length) beginWave(g, g.wave + 1)
      else startBoss(g)
    }
  }

  updateEnemies(g, c)
  updateBullets(g, c)
  updateFoes(g, c)

  for (const beam of g.beams) {
    beam.life -= c
    if (powered(g, 'titan') && beam.life > 0 && beam.life < beam.max - 0.04) {
      railDamage(g, beam.x, beam.y, beam.a, beam.w * 0.75, Math.max(2, beam.dmg * 0.16), false)
    }
  }
  g.beams = g.beams.filter((b) => b.life > 0)

  const boardX = 56
  const boardY = 92
  for (const pip of g.pips) {
    pip.t += capped
    const u = Math.min(1, pip.t / pip.life)
    const hold = 0.42
    const travel = u < hold ? 0 : (u - hold) / (1 - hold)
    const e = 1 - (1 - travel) ** 2
    pip.x = pip.sx + (boardX - pip.sx) * e * 0.92
    pip.y = pip.sy + (boardY - pip.sy) * e * 0.92
    if (u >= 1) g.shown += pip.n
  }
  g.pips = g.pips.filter((pip) => pip.t < pip.life)
  if (g.phase === 'boss') updateBoss(g, c)

  updateArcs(g, c)

  for (const o of g.orbs) {
    o.t += capped
    const dx = p.x - o.x
    const dy = p.y - o.y
    const d = Math.hypot(dx, dy) || 1
    if (d < 220) {
      const pull = o.kind === 'score' ? 720 : 920
      o.vx += (dx / d) * pull * capped
      o.vy += (dy / d) * pull * capped
    }
    o.x += o.vx * capped
    o.y += o.vy * capped
    o.vx *= 0.94
    o.vy *= 0.94
    if (d < (o.kind === 'score' ? 26 : 42)) {
      o.t = 99
      if (o.kind === 'heart') {
        if (g.player.hp < 6) {
          g.player.hp += 1
          if (g.player.hp > g.player.maxHp) g.player.maxHp = g.player.hp
        }
        award(g, o.x, o.y, 30)
        g.particles.push({ x: o.x, y: o.y, vx: 0, vy: -28, life: 0.55, max: 0.55, size: 34, color: '#ff4d6d', kind: 'heart' })
        sfx.oneUp()
      } else if (o.kind === 'boost') {
        g.boostMul = Math.min(16, Math.max(2, g.boostMul * 2))
        g.boostT = Math.max(g.boostT, 10)
        g.overdrive = Math.max(g.overdrive, 8)
        g.note = { name: `${g.boostMul}x`, use: 'points', t: 2.2 }
        award(g, o.x, o.y, 40)
        ring(g, o.x, o.y, '#f5d76e')
        g.particles.push({ x: o.x, y: o.y, vx: 0, vy: 0, life: 0.32, max: 0.32, size: 40, color: '#f5d76e', kind: 'bolt' })
        burst(g, o.x, o.y, '#f5d76e', 8, 240)
        sfx.zap()
        const near = g.enemies.filter((e) => Math.hypot(e.x - o.x, e.y - o.y) <= 200)
        for (const e of near) {
          e.hp -= 3
          e.flash = 1
          burst(g, e.x, e.y, '#f5d76e', 5, 140)
          if (e.hp <= 0) killEnemy(g, e)
        }
        if (g.boss && Math.hypot(g.boss.x - o.x, g.boss.y - o.y) < 240) {
          g.boss.hp -= 18
          g.boss.flash = 0.45
          if (g.boss.hp <= 0) defeatBoss(g)
        }
      } else if (o.kind === 'rapid' || o.kind === 'nova' || o.kind === 'titan') {
        activatePower(g, o.kind)
        award(g, o.x, o.y, 50)
        if (o.kind === 'nova') sfx.nova()
        else if (o.kind === 'titan') sfx.titan()
        else sfx.power()
      } else {
        award(g, o.x, o.y, o.worth || 20)
        sfx.collect()
      }
    }
  }
  g.orbs = g.orbs.filter((o) => o.t < 8)

  for (const pt of g.particles) {
    pt.x += pt.vx * capped
    pt.y += pt.vy * capped
    pt.vx *= 0.92
    pt.vy *= 0.92
    pt.life -= capped
  }
  g.particles = g.particles.filter((pt) => pt.life > 0)
  for (const gh of g.ghosts) gh.life -= capped
  g.ghosts = g.ghosts.filter((gh) => gh.life > 0)
}

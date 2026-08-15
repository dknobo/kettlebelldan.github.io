import {
  COLS,
  ROWS,
  KINDS,
  levelFor,
  type Fx,
  type Game,
  type Pos,
  type Special,
  type Tile,
} from './engine'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: 'spark' | 'ember' | 'bolt'
}

type Bolt = { x1: number; y1: number; x2: number; y2: number; t: number; color: string; w: number }
type Beam = { axis: 'h' | 'v'; i: number; t: number; heavy: boolean; color: string }
type Burst = { x: number; y: number; t: number; max: number; mode: 'fire' | 'nova' | 'shock' }
type Slash = { x: number; y: number; t: number; color: string }
type Anim = { id: number; fr: number; fc: number; tr: number; tc: number; t: number; dur: number }
type SwapAnim = { a: Pos; b: Pos; t: number; dur: number; bounce: boolean }

export type Renderer = {
  resize: () => void
  draw: (g: Game, dt: number) => void
  feed: (fx: Fx[]) => void
  hit: (clientX: number, clientY: number) => Pos | null
  dispose: () => void
}

const TONE = [
  { a: '#f2f4f6', b: '#6d7580', c: '#1a1e24', ink: '#ffffff', glow: '#e8eef4' },
  { a: '#ff7a28', b: '#b83c10', c: '#2a0e06', ink: '#ffe0c8', glow: '#ff6a18' },
  { a: '#4ec4e0', b: '#187088', c: '#062028', ink: '#e4f8ff', glow: '#3ec8e8' },
  { a: '#f0d24a', b: '#b88610', c: '#241a04', ink: '#fff4c0', glow: '#f0c830' },
  { a: '#5ec46a', b: '#1e6a38', c: '#06160c', ink: '#d8f8dc', glow: '#48c860' },
  { a: '#8a72e0', b: '#3c2a88', c: '#10081c', ink: '#ece4ff', glow: '#9a82f0' },
]

function loadImg(src: string) {
  const img = new Image()
  img.src = src
  return img
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function jaggedBolt(x1: number, y1: number, x2: number, y2: number, segs = 8) {
  const pts: { x: number; y: number }[] = [{ x: x1, y: y1 }]
  for (let i = 1; i < segs; i++) {
    const t = i / segs
    const nx = -(y2 - y1)
    const ny = x2 - x1
    const len = Math.hypot(nx, ny) || 1
    const j = (Math.random() - 0.5) * 22
    pts.push({
      x: x1 + (x2 - x1) * t + (nx / len) * j,
      y: y1 + (y2 - y1) * t + (ny / len) * j,
    })
  }
  pts.push({ x: x2, y: y2 })
  return pts
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const bg = loadImg('/xblaster/bg.jpg')
  const particles: Particle[] = []
  const bolts: Bolt[] = []
  const beams: Beam[] = []
  const bursts: Burst[] = []
  const slashes: Slash[] = []
  const anims: Anim[] = []
  const swaps: SwapAnim[] = []
  let shake = 0
  let flash = 0
  let flashColor = 'rgba(240,244,255,0.18)'
  let pop = new Set<string>()
  let popT = 0
  let comboFlash = 0
  let time = 0

  function ease(t: number) {
    return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function layout() {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    const mobile = w < 820
    const pad = mobile ? 16 : 24
    const cell = Math.floor(Math.min((Math.min(w, 720) - pad * 2) / COLS, (h * (mobile ? 0.62 : 0.72)) / ROWS))
    const bw = cell * COLS
    const bh = cell * ROWS
    const x = Math.round((w - bw) / 2)
    const y = Math.round(mobile ? h * 0.16 : (h - bh) / 2 + 8)
    return { w, h, cell, bw, bh, x, y, mobile }
  }

  function cellKey(p: Pos) {
    return `${p.r},${p.c}`
  }

  function feed(fx: Fx[]) {
    const L = layout()
    for (const e of fx) {
      if (e.kind === 'swap') {
        swaps.push({ a: e.a, b: e.b, t: 0, dur: 0.14, bounce: false })
      }
      if (e.kind === 'swapback') {
        swaps.push({ a: e.a, b: e.b, t: 0, dur: 0.2, bounce: true })
      }
      if (e.kind === 'fall') {
        for (const m of e.moves) {
          anims.push({
            id: m.tile.id,
            fr: m.from.r,
            fc: m.from.c,
            tr: m.to.r,
            tc: m.to.c,
            t: 0,
            dur: 0.16 + (m.to.r - m.from.r) * 0.03,
          })
        }
      }
      if (e.kind === 'spawn') {
        const colCount = new Map<number, number>()
        for (const s of e.tiles) colCount.set(s.at.c, (colCount.get(s.at.c) || 0) + 1)
        const seen = new Map<number, number>()
        for (const s of e.tiles) {
          const n = (seen.get(s.at.c) || 0) + 1
          seen.set(s.at.c, n)
          const depth = colCount.get(s.at.c) || 1
          anims.push({
            id: s.tile.id,
            fr: s.at.r - depth + n - 1 - depth,
            fc: s.at.c,
            tr: s.at.r,
            tc: s.at.c,
            t: 0,
            dur: 0.18 + n * 0.03,
          })
        }
      }
      if (e.kind === 'shuffle') {
        flash = 0.28
        shake = 0.35
      }
      if (e.kind === 'clear') {
        pop = new Set(e.cells.map(cellKey))
        popT = 0.16
        comboFlash = 0.22
        const sparkColor =
          e.effect === 'fire' || e.effect === 'nova'
            ? '#ffb070'
            : e.effect === 'tempest'
              ? '#c8b6ff'
              : e.effect === 'xslash'
                ? '#f2f2f2'
                : e.effect.startsWith('rail')
                  ? '#ffe6b0'
                  : e.effect.includes('lightning')
                    ? '#dcefff'
                    : '#e8eef4'
        if (e.effect === 'laser-h' || e.effect === 'rail-h') {
          const rows = new Set(e.cells.map((p) => p.r))
          rows.forEach((i) =>
            beams.push({ axis: 'h', i, t: 0, heavy: e.effect === 'rail-h', color: e.effect === 'rail-h' ? '#ffd089' : '#d8ecff' }),
          )
          shake = e.effect === 'rail-h' ? 0.72 : 0.5
          flash = e.effect === 'rail-h' ? 0.34 : 0.26
          flashColor = e.effect === 'rail-h' ? 'rgba(255,200,120,0.2)' : 'rgba(210,230,255,0.18)'
        } else if (e.effect === 'laser-v' || e.effect === 'rail-v') {
          const cols = new Set(e.cells.map((p) => p.c))
          cols.forEach((i) =>
            beams.push({ axis: 'v', i, t: 0, heavy: e.effect === 'rail-v', color: e.effect === 'rail-v' ? '#ffd089' : '#d8ecff' }),
          )
          shake = e.effect === 'rail-v' ? 0.72 : 0.5
          flash = e.effect === 'rail-v' ? 0.34 : 0.26
          flashColor = e.effect === 'rail-v' ? 'rgba(255,200,120,0.2)' : 'rgba(210,230,255,0.18)'
        } else if (e.effect === 'fire' || e.effect === 'nova') {
          for (const p of e.cells) {
            bursts.push({
              x: L.x + (p.c + 0.5) * L.cell,
              y: L.y + (p.r + 0.5) * L.cell,
              t: 0,
              max: e.effect === 'nova' ? 0.48 : 0.36,
              mode: e.effect === 'nova' ? 'nova' : 'fire',
            })
          }
          shake = e.effect === 'nova' ? 0.82 : 0.58
          flash = e.effect === 'nova' ? 0.36 : 0.22
          flashColor = 'rgba(255,140,70,0.2)'
        } else if (e.effect === 'lightning' || e.effect === 'tempest') {
          const mid = e.cells[Math.floor(e.cells.length / 2)] || { r: 4, c: 4 }
          const ox = L.x + (mid.c + 0.5) * L.cell
          const oy = L.y + (mid.r + 0.5) * L.cell
          for (const p of e.cells) {
            bolts.push({
              x1: ox,
              y1: oy,
              x2: L.x + (p.c + 0.5) * L.cell,
              y2: L.y + (p.r + 0.5) * L.cell,
              t: e.effect === 'tempest' ? 0.4 : 0.32,
              color: e.effect === 'tempest' ? '#d8c8ff' : '#e8f4ff',
              w: e.effect === 'tempest' ? 2.2 : 1.8,
            })
          }
          shake = e.effect === 'tempest' ? 1 : 0.78
          flash = e.effect === 'tempest' ? 0.5 : 0.4
          flashColor = e.effect === 'tempest' ? 'rgba(180,160,255,0.22)' : 'rgba(220,235,255,0.2)'
        } else if (e.effect === 'xslash') {
          for (const p of e.cells.filter((_, i) => i % 2 === 0)) {
            slashes.push({
              x: L.x + (p.c + 0.5) * L.cell,
              y: L.y + (p.r + 0.5) * L.cell,
              t: 0,
              color: '#f4f4f4',
            })
          }
          shake = 0.7
          flash = 0.3
          flashColor = 'rgba(240,240,240,0.16)'
        } else {
          shake = Math.max(shake, 0.18)
        }
        for (const p of e.cells) {
          const x = L.x + (p.c + 0.5) * L.cell
          const y = L.y + (p.r + 0.5) * L.cell
          const n = e.effect === 'pop' ? 7 : e.effect === 'nova' || e.effect === 'tempest' ? 16 : 12
          for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2
            const sp = 50 + Math.random() * 200
            particles.push({
              x,
              y,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - 30,
              life: 0.28 + Math.random() * 0.3,
              max: 0.6,
              size: 1 + Math.random() * 2.6,
              color: sparkColor,
              kind: e.effect === 'fire' || e.effect === 'nova' ? 'ember' : 'spark',
            })
          }
        }
      }
      if (e.kind === 'win') {
        flash = 0.45
        shake = 0.55
      }
    }
  }

  function drawGlyph(kind: number, x: number, y: number, s: number, ink: string) {
    ctx.save()
    ctx.translate(x + s / 2, y + s / 2)
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = Math.max(2, s * 0.085)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const k = kind % KINDS
    if (k === 0) {
      ctx.beginPath()
      ctx.moveTo(-s * 0.18, -s * 0.18)
      ctx.lineTo(s * 0.18, s * 0.18)
      ctx.moveTo(s * 0.18, -s * 0.18)
      ctx.lineTo(-s * 0.18, s * 0.18)
      ctx.stroke()
    } else if (k === 1) {
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.22)
      ctx.lineTo(s * 0.12, s * 0.06)
      ctx.lineTo(s * 0.08, s * 0.2)
      ctx.lineTo(-s * 0.08, s * 0.2)
      ctx.lineTo(-s * 0.12, s * 0.06)
      ctx.closePath()
      ctx.stroke()
    } else if (k === 2) {
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 2
        const r = i % 2 === 0 ? s * 0.22 : s * 0.1
        const px = Math.cos(a) * r
        const py = Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    } else if (k === 3) {
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-s * 0.22, 0)
      ctx.lineTo(s * 0.22, 0)
      ctx.stroke()
    } else if (k === 4) {
      ctx.beginPath()
      ctx.moveTo(-s * 0.1, -s * 0.16)
      ctx.lineTo(s * 0.1, -s * 0.16)
      ctx.lineTo(s * 0.16, s * 0.16)
      ctx.lineTo(-s * 0.16, s * 0.16)
      ctx.closePath()
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.14)
      ctx.lineTo(s * 0.14, 0)
      ctx.lineTo(0, s * 0.14)
      ctx.lineTo(-s * 0.14, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.04, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  function drawSpecial(sp: Special, x: number, y: number, s: number, pulse: number) {
    if (!sp) return
    const cx = x + s / 2
    const cy = y + s / 2
    ctx.save()
    ctx.translate(cx, cy)
    if (sp === 'laser-h' || sp === 'rail-h') {
      const heavy = sp === 'rail-h'
      ctx.shadowColor = heavy ? '#ffb060' : '#9ec8ff'
      ctx.shadowBlur = 8 + pulse * 6
      ctx.fillStyle = heavy ? `rgba(255,208,130,${0.7 + pulse * 0.25})` : `rgba(190,220,255,${0.55 + pulse * 0.3})`
      ctx.fillRect(-s * 0.32, heavy ? -2.4 : -1.1, s * 0.64, heavy ? 4.8 : 2.2)
      if (heavy) {
        ctx.fillStyle = 'rgba(255,255,240,0.9)'
        ctx.fillRect(-s * 0.28, -0.8, s * 0.56, 1.6)
      }
    } else if (sp === 'laser-v' || sp === 'rail-v') {
      const heavy = sp === 'rail-v'
      ctx.shadowColor = heavy ? '#ffb060' : '#9ec8ff'
      ctx.shadowBlur = 8 + pulse * 6
      ctx.fillStyle = heavy ? `rgba(255,208,130,${0.7 + pulse * 0.25})` : `rgba(190,220,255,${0.55 + pulse * 0.3})`
      ctx.fillRect(heavy ? -2.4 : -1.1, -s * 0.32, heavy ? 4.8 : 2.2, s * 0.64)
      if (heavy) {
        ctx.fillStyle = 'rgba(255,255,240,0.9)'
        ctx.fillRect(-0.8, -s * 0.28, 1.6, s * 0.56)
      }
    } else if (sp === 'burst' || sp === 'nova') {
      const nova = sp === 'nova'
      ctx.strokeStyle = nova ? `rgba(255,150,70,${0.75 + pulse * 0.2})` : `rgba(255,176,110,${0.65 + pulse * 0.2})`
      ctx.lineWidth = nova ? 2 : 1.4
      ctx.shadowColor = '#ff8a40'
      ctx.shadowBlur = 10 + pulse * 8
      ctx.beginPath()
      ctx.arc(0, 0, s * (nova ? 0.3 : 0.26), 0, Math.PI * 2)
      ctx.stroke()
      if (nova) {
        ctx.beginPath()
        ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2)
        ctx.stroke()
      }
    } else if (sp === 'core' || sp === 'tempest') {
      const storm = sp === 'tempest'
      ctx.strokeStyle = storm ? `rgba(210,190,255,${0.8 + pulse * 0.2})` : `rgba(220,235,255,${0.8 + pulse * 0.2})`
      ctx.lineWidth = storm ? 1.6 : 1.2
      ctx.shadowColor = storm ? '#b8a0ff' : '#cfe6ff'
      ctx.shadowBlur = 12 + pulse * 10
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = storm ? `rgba(180,160,255,${0.35 + pulse * 0.2})` : `rgba(200,220,255,${0.28 + pulse * 0.2})`
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2)
      ctx.fill()
    } else if (sp === 'xblade') {
      ctx.strokeStyle = `rgba(240,240,240,${0.8 + pulse * 0.2})`
      ctx.lineWidth = 2
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 10 + pulse * 8
      ctx.beginPath()
      ctx.moveTo(-s * 0.22, -s * 0.22)
      ctx.lineTo(s * 0.22, s * 0.22)
      ctx.moveTo(s * 0.22, -s * 0.22)
      ctx.lineTo(-s * 0.22, s * 0.22)
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawTile(tile: Tile, x: number, y: number, s: number, selected: boolean, dying: boolean) {
    const pad = Math.max(3, s * 0.08)
    const tone = TONE[tile.kind % TONE.length]
    const pulse = tile.special ? 0.5 + 0.5 * Math.sin(time * 5) : 0
    ctx.save()
    if (dying) ctx.globalAlpha = 0.35
    if (tile.special || selected) {
      ctx.shadowColor = selected ? tone.glow : tone.glow
      ctx.shadowBlur = selected ? 16 : 10 + pulse * 8
    }
    const rw = s - pad * 2
    const rh = s - pad * 2
    roundRect(ctx, x + pad, y + pad, rw, rh, s * 0.18)
    const g = ctx.createLinearGradient(x, y, x + s, y + s)
    g.addColorStop(0, tone.a)
    g.addColorStop(0.38, tone.b)
    g.addColorStop(1, tone.c)
    ctx.fillStyle = g
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = selected ? tone.ink : tone.glow
    ctx.lineWidth = selected ? 2.6 : 2
    ctx.stroke()
    ctx.save()
    roundRect(ctx, x + pad, y + pad, rw, rh, s * 0.18)
    ctx.clip()
    const hg = ctx.createLinearGradient(x, y, x, y + s * 0.34)
    hg.addColorStop(0, 'rgba(255,255,255,0.16)')
    hg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = hg
    ctx.fillRect(x, y, s, s * 0.34)
    ctx.fillStyle = tone.glow
    ctx.globalAlpha = 0.9
    ctx.fillRect(x + pad, y + pad + rh - Math.max(3, s * 0.07), rw, Math.max(3, s * 0.07))
    ctx.globalAlpha = 1
    ctx.restore()
    drawGlyph(tile.kind, x, y, s, tone.ink)
    drawSpecial(tile.special, x, y, s, pulse)
    ctx.restore()
  }

  function hit(clientX: number, clientY: number): Pos | null {
    const L = layout()
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const c = Math.floor((x - L.x) / L.cell)
    const r = Math.floor((y - L.y) / L.cell)
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return null
    return { r, c }
  }

  function draw(g: Game, dt: number) {
    const L = layout()
    time += dt
    shake = Math.max(0, shake - dt * 2.6)
    flash = Math.max(0, flash - dt * 1.5)
    comboFlash = Math.max(0, comboFlash - dt)
    popT = Math.max(0, popT - dt)
    if (popT <= 0) pop.clear()
    for (let i = anims.length - 1; i >= 0; i--) {
      anims[i].t += dt
      if (anims[i].t >= anims[i].dur) anims.splice(i, 1)
    }
    for (let i = swaps.length - 1; i >= 0; i--) {
      swaps[i].t += dt
      if (swaps[i].t >= swaps[i].dur) swaps.splice(i, 1)
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 80 * dt
      if (p.life <= 0) particles.splice(i, 1)
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t -= dt
      if (bolts[i].t <= 0) bolts.splice(i, 1)
    }
    for (let i = beams.length - 1; i >= 0; i--) {
      beams[i].t += dt
      if (beams[i].t > 0.28) beams.splice(i, 1)
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i].t += dt
      if (bursts[i].t > bursts[i].max) bursts.splice(i, 1)
    }
    for (let i = slashes.length - 1; i >= 0; i--) {
      slashes[i].t += dt
      if (slashes[i].t > 0.34) slashes.splice(i, 1)
    }

    ctx.clearRect(0, 0, L.w, L.h)
    ctx.save()
    ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8)

    if (bg.complete && bg.naturalWidth) {
      const sc = Math.max(L.w / bg.naturalWidth, L.h / bg.naturalHeight)
      ctx.drawImage(bg, (L.w - bg.naturalWidth * sc) / 2, (L.h - bg.naturalHeight * sc) / 2, bg.naturalWidth * sc, bg.naturalHeight * sc)
    } else {
      ctx.fillStyle = '#07080b'
      ctx.fillRect(0, 0, L.w, L.h)
    }
    ctx.fillStyle = 'rgba(6,5,4,0.38)'
    ctx.fillRect(0, 0, L.w, L.h)

    const lv = levelFor(g.level)
    const hx = L.x
    const hy = Math.max(56, L.y - 54)
    ctx.fillStyle = 'rgba(230,230,230,0.5)'
    ctx.font = '500 11px Outfit, system-ui, sans-serif'
    ctx.fillText(`LV ${String(g.level).padStart(2, '0')}  ·  ${lv.name.toUpperCase()}`, hx, hy)
    ctx.fillStyle = '#f3f3f3'
    ctx.font = '650 26px Fraunces, Georgia, serif'
    ctx.fillText(g.score.toLocaleString(), hx, hy + 26)
    ctx.fillStyle = 'rgba(230,230,230,0.55)'
    ctx.font = '400 13px Outfit, system-ui, sans-serif'
    const right = `${g.moves} moves  ·  target ${lv.target.toLocaleString()}`
    ctx.fillText(right, hx, hy + 46)
    const barW = Math.min(L.bw, 280)
    const pct = Math.min(1, g.score / Math.max(1, lv.target))
    roundRect(ctx, L.x + L.bw - barW, hy + 18, barW, 6, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()
    roundRect(ctx, L.x + L.bw - barW, hy + 18, Math.max(6, barW * pct), 6, 3)
    ctx.fillStyle = comboFlash > 0 ? 'rgba(255,176,96,0.95)' : 'rgba(196,140,72,0.78)'
    ctx.fill()

    roundRect(ctx, L.x - 10, L.y - 10, L.bw + 20, L.bh + 20, 16)
    ctx.fillStyle = 'rgba(8,9,12,0.62)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(230,230,230,0.12)'
    ctx.stroke()

    const moving = new Set<number>()
    const skip = new Set<string>()
    for (const a of anims) moving.add(a.id)
    for (const s of swaps) {
      skip.add(`${s.a.r},${s.a.c}`)
      skip.add(`${s.b.r},${s.b.c}`)
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = g.board[r][c]
        if (!tile) continue
        if (moving.has(tile.id) || skip.has(`${r},${c}`)) continue
        const dying = pop.has(`${r},${c}`)
        const sel = !!(g.selected && g.selected.r === r && g.selected.c === c)
        drawTile(tile, L.x + c * L.cell, L.y + r * L.cell, L.cell, sel, dying)
      }
    }

    for (const a of anims) {
      let tile: Tile | null = null
      for (let r = 0; r < ROWS && !tile; r++) {
        for (let c = 0; c < COLS; c++) {
          if (g.board[r][c]?.id === a.id) {
            tile = g.board[r][c]
            break
          }
        }
      }
      if (!tile) continue
      const k = ease(a.t / a.dur)
      const x = L.x + (a.fc + (a.tc - a.fc) * k) * L.cell
      const y = L.y + (a.fr + (a.tr - a.fr) * k) * L.cell
      drawTile(tile, x, y, L.cell, false, false)
    }

    for (const s of swaps) {
      const ta = g.board[s.a.r][s.a.c]
      const tb = g.board[s.b.r][s.b.c]
      const k = s.bounce ? Math.sin((s.t / s.dur) * Math.PI) * 0.42 : ease(s.t / s.dur)
      const ax = L.x + s.a.c * L.cell
      const ay = L.y + s.a.r * L.cell
      const bx = L.x + s.b.c * L.cell
      const by = L.y + s.b.r * L.cell
      if (s.bounce) {
        if (ta) drawTile(ta, ax + (bx - ax) * k, ay + (by - ay) * k, L.cell, false, false)
        if (tb) drawTile(tb, bx + (ax - bx) * k, by + (ay - by) * k, L.cell, false, false)
      } else {
        // board already swapped: tile now at a came from b
        if (ta) drawTile(ta, bx + (ax - bx) * k, by + (ay - by) * k, L.cell, false, false)
        if (tb) drawTile(tb, ax + (bx - ax) * k, ay + (by - ay) * k, L.cell, false, false)
      }
    }

    for (const b of beams) {
      const a = 1 - b.t / 0.28
      const thick = b.heavy ? L.cell * 0.72 : 14
      ctx.save()
      ctx.globalAlpha = a
      ctx.shadowColor = b.color
      ctx.shadowBlur = b.heavy ? 28 : 22
      if (b.axis === 'h') {
        const y = L.y + (b.i + 0.5) * L.cell
        ctx.fillStyle = b.heavy ? 'rgba(255,170,80,0.22)' : 'rgba(180,210,255,0.25)'
        ctx.fillRect(L.x - 10, y - thick / 2, L.bw + 20, thick)
        ctx.fillStyle = b.heavy ? '#ffe7b4' : '#eaf4ff'
        ctx.fillRect(L.x - 6, y - (b.heavy ? 3.2 : 1.6), L.bw + 12, b.heavy ? 6.4 : 3.2)
      } else {
        const x = L.x + (b.i + 0.5) * L.cell
        ctx.fillStyle = b.heavy ? 'rgba(255,170,80,0.22)' : 'rgba(180,210,255,0.25)'
        ctx.fillRect(x - thick / 2, L.y - 10, thick, L.bh + 20)
        ctx.fillStyle = b.heavy ? '#ffe7b4' : '#eaf4ff'
        ctx.fillRect(x - (b.heavy ? 3.2 : 1.6), L.y - 6, b.heavy ? 6.4 : 3.2, L.bh + 12)
      }
      ctx.restore()
    }

    for (const b of bursts) {
      const k = b.t / b.max
      const nova = b.mode === 'nova'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 8 + k * L.cell * (nova ? 2.2 : 1.5), 0, Math.PI * 2)
      ctx.strokeStyle = nova ? `rgba(255,120,50,${0.7 * (1 - k)})` : `rgba(255,160,90,${0.6 * (1 - k)})`
      ctx.lineWidth = nova ? 3 : 2.2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(b.x, b.y, 4 + k * L.cell * (nova ? 1.1 : 0.7), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,220,170,${0.5 * (1 - k)})`
      ctx.lineWidth = nova ? 2 : 1.2
      ctx.stroke()
    }

    for (const s of slashes) {
      const a = 1 - s.t / 0.34
      ctx.save()
      ctx.globalAlpha = a
      ctx.strokeStyle = s.color
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 16
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(s.x - L.bw, s.y - L.bh)
      ctx.lineTo(s.x + L.bw, s.y + L.bh)
      ctx.moveTo(s.x + L.bw, s.y - L.bh)
      ctx.lineTo(s.x - L.bw, s.y + L.bh)
      ctx.stroke()
      ctx.restore()
    }

    for (const b of bolts) {
      const pts = jaggedBolt(b.x1, b.y1, b.x2, b.y2, 8)
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.strokeStyle = `rgba(230,242,255,${Math.max(0, b.t / 0.32)})`
      ctx.lineWidth = b.w + 2
      ctx.shadowColor = '#cfe6ff'
      ctx.shadowBlur = 14
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, b.t / 0.32)})`
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (flash > 0) {
      ctx.fillStyle = flashColor.replace(/[\d.]+\)$/, `${flash * 0.22})`)
      ctx.fillRect(0, 0, L.w, L.h)
    }
    ctx.restore()
  }

  return { resize, draw, feed, hit, dispose() {} }
}

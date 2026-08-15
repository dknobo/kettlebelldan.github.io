import {
  COLS,
  HIDDEN,
  ROWS,
  cellsOf,
  fallBlend,
  ghost,
  isGrounded,
  levelFor,
  nextQueue,
  visibleBoard,
  type Active,
  type Cell,
  type FxEvent,
  type Game,
  type PieceId,
  type Theme,
} from './engine'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  r: number
  g: number
  b: number
}

type ClearAnim = { rows: number[]; t: number; dur: number; tetris: boolean }
type Toast = { title: string; sub: string; t: number }

export type Renderer = {
  resize: () => void
  draw: (g: Game, dt: number) => void
  feed: (fx: FxEvent[]) => void
  capture: () => string
  dispose: () => void
}

const THEME_SRC: Record<Theme, string> = {
  pad: '/tetris/pad.jpg',
  ascent: '/tetris/ascent.jpg',
  orbit: '/tetris/orbit.jpg',
  entry: '/tetris/entry.jpg',
  deep: '/tetris/orbit.jpg',
}

type Pal = { a: string; b: string; c: string; glow: string }

const PALS: Record<PieceId, Pal> = {
  I: { a: '#d8dde4', b: '#8b949e', c: '#2a3038', glow: 'rgba(255,140,70,0.55)' },
  O: { a: '#1c2430', b: '#0d1218', c: '#c9a227', glow: 'rgba(201,162,39,0.4)' },
  T: { a: '#3a4048', b: '#1a1d22', c: '#e0a24a', glow: 'rgba(224,162,74,0.35)' },
  S: { a: '#143047', b: '#07141f', c: '#3ec0ff', glow: 'rgba(62,192,255,0.35)' },
  Z: { a: '#2a2420', b: '#100e0c', c: '#c46a3a', glow: 'rgba(196,106,58,0.35)' },
  J: { a: '#f2f4f7', b: '#9aa3ad', c: '#111418', glow: 'rgba(230,236,244,0.28)' },
  L: { a: '#8a8478', b: '#3e3a34', c: '#d7c7a2', glow: 'rgba(215,199,162,0.32)' },
}

function loadImg(src: string): HTMLImageElement {
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function splitRun(run: { x: number; y: number; seg: number }[], axis: 0 | 1) {
  const sorted = run.slice().sort((a, b) => (axis ? a.y - b.y || a.x - b.x : a.x - b.x || a.y - b.y))
  const groups: { x: number; y: number; seg: number }[][] = []
  let cur: { x: number; y: number; seg: number }[] = []
  for (const cell of sorted) {
    const prev = cur[cur.length - 1]
    if (!prev) {
      cur = [cell]
      continue
    }
    const gap = axis ? cell.y - prev.y === 1 && cell.x === prev.x : cell.x - prev.x === 1 && cell.y === prev.y
    if (gap) cur.push(cell)
    else {
      groups.push(cur)
      cur = [cell]
    }
  }
  if (cur.length) groups.push(cur)
  return groups
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const images: Record<Theme, HTMLImageElement> = {
    pad: loadImg(THEME_SRC.pad),
    ascent: loadImg(THEME_SRC.ascent),
    orbit: loadImg(THEME_SRC.orbit),
    entry: loadImg(THEME_SRC.entry),
    deep: loadImg(THEME_SRC.deep),
  }
  const starshipImg = loadImg('/tetris/starship.png')
  const starlinkImg = loadImg('/tetris/starlink.png')
  const plumeImg = loadImg('/tetris/plume_sheet.png')
  const PLUME_FRAMES = 12
  const particles: Particle[] = []
  const rings: { x: number; y: number; t: number; max: number; tetris: boolean }[] = []
  const floaters: { text: string; x: number; y: number; t: number; hue: string }[] = []
  let clearAnim: ClearAnim | null = null
  let toast: Toast | null = null
  let shake = 0
  let flash = 0
  let lockPulse = 0
  let themeBlend = 0
  let themeFrom: Theme = 'pad'
  let themeTo: Theme = 'pad'
  let trail: { x: number; y: number; id: PieceId }[] = []
  let plumeClock = 0
  let afterburn: { x: number; y: number; n: number; t: number } | null = null
  let spawnPop = 0
  let shotFlash = 0

  const fontUi = 'Outfit, system-ui, sans-serif'
  const fontDisplay = 'Fraunces, Georgia, serif'

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
    const cell = mobile
      ? Math.floor(Math.min((w - 28) / COLS, (h * 0.58) / ROWS))
      : Math.floor(Math.min(42, (h * 0.78) / ROWS, (w * 0.34) / COLS))
    const boardW = cell * COLS
    const boardH = cell * ROWS
    const x = mobile ? Math.round((w - boardW) / 2) : Math.round(w * 0.36 - boardW / 2)
    const y = mobile ? Math.round(h * 0.12) : Math.round((h - boardH) / 2 - 8)
    return { w, h, cell, boardW, boardH, x, y, mobile }
  }

  function feed(fx: FxEvent[]) {
    for (const e of fx) {
      if (e.kind === 'lock') {
        lockPulse = 1
        if (e.hard) {
          shake = 0.55
          flash = 0.18
        } else shake = Math.max(shake, 0.18)
        const L = layout()
        let ax = 0
        let ay = 0
        for (const [cx, cy] of e.cells) {
          const px = L.x + cx * L.cell + L.cell / 2
          const py = L.y + (cy - HIDDEN) * L.cell + L.cell / 2
          ax += px
          ay += py
          spawnSparks(px, py, e.id, e.hard ? 10 : 5)
        }
        rings.push({
          x: ax / Math.max(1, e.cells.length),
          y: ay / Math.max(1, e.cells.length),
          t: 0,
          max: e.hard ? 0.35 : 0.22,
          tetris: false,
        })
        if (e.id === 'I') {
          const xs = new Set(e.cells.map(([x]) => x))
          if (xs.size === 1) {
            const ys = e.cells.map(([, y]) => y - HIDDEN).sort((a, b) => a - b)
            afterburn = { x: e.cells[0][0], y: ys[0], n: ys.length, t: e.hard ? 0.32 : 0.14 }
          }
        }
      }
      if (e.kind === 'clear') {
        clearAnim = { rows: e.rows, t: 0, dur: e.tetris ? 0.34 : 0.2, tetris: e.tetris }
        shake = e.tetris ? 1.05 : 0.42
        flash = e.tetris ? 0.42 : 0.14
        const L = layout()
        const midY = (Math.min(...e.rows) + Math.max(...e.rows)) / 2
        for (const row of e.rows) {
          for (let c = 0; c < COLS; c++) {
            spawnSparks(L.x + c * L.cell + L.cell / 2, L.y + row * L.cell + L.cell / 2, 'I', e.tetris ? 4 : 2)
          }
        }
        rings.push({
          x: L.x + L.boardW / 2,
          y: L.y + midY * L.cell,
          t: 0,
          max: e.tetris ? 0.55 : 0.28,
          tetris: e.tetris,
        })
        const label = e.tetris ? 'HOT STAGING' : e.lines === 3 ? 'MECO' : e.lines === 2 ? 'SEP' : 'TRIM'
        floaters.push({
          text: e.combo > 0 ? `${label}  ×${e.combo + 1}` : label,
          x: L.x + L.boardW / 2,
          y: L.y + midY * L.cell,
          t: 0,
          hue: e.tetris ? '#ffb070' : '#e8eef4',
        })
      }
      if (e.kind === 'level') {
        themeFrom = themeTo
        themeTo = e.level.theme
        themeBlend = 0
        toast = { title: e.level.name, sub: e.level.subtitle, t: 0 }
        flash = Math.max(flash, 0.2)
      }
      if (e.kind === 'spawn') {
        spawnPop = 1
      }
      if (e.kind === 'gameover') {
        toast = { title: 'Flight terminated', sub: 'Stack exceeded the tower', t: 0 }
        shake = 0.7
      }
    }
  }

  function spawnSparks(x: number, y: number, id: PieceId, n: number) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI - Math.PI / 2
      const sp = 40 + Math.random() * 120
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp * (Math.random() * 0.6 + 0.2),
        vy: -Math.abs(Math.sin(ang) * sp) - 20,
        life: 0.35 + Math.random() * 0.45,
        max: 0.7,
        size: 1 + Math.random() * 2.2,
        r: id === 'I' ? 255 : 220,
        g: id === 'I' ? 160 : 210,
        b: id === 'I' ? 90 : 190,
      })
    }
  }

  function drawBackground(theme: Theme, w: number, h: number, alpha = 1) {
    const img = images[theme]
    if (img.complete && img.naturalWidth) {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const scale = Math.max(w / iw, h / ih)
      const dw = iw * scale
      const dh = ih * scale
      ctx.globalAlpha = alpha
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#05070c'
      ctx.fillRect(0, 0, w, h)
    }
  }

  function drawCellBody(x: number, y: number, s: number, pal: Pal, inset = 1.6) {
    const ix = x + inset
    const iy = y + inset
    const iw = s - inset * 2
    const ih = s - inset * 2
    roundRect(ctx, ix, iy, iw, ih, 4)
    const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih)
    g.addColorStop(0, pal.a)
    g.addColorStop(0.45, pal.b)
    g.addColorStop(1, pal.c)
    ctx.fillStyle = g
    ctx.fill()
    ctx.save()
    ctx.clip()
    const hg = ctx.createLinearGradient(ix, iy, ix, iy + ih * 0.45)
    hg.addColorStop(0, 'rgba(255,255,255,0.38)')
    hg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = hg
    ctx.fillRect(ix, iy, iw, ih * 0.45)
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    roundRect(ctx, ix + 0.5, iy + 0.5, iw - 1, ih - 1, 3.5)
    ctx.stroke()
  }

  function shipReady() {
    return starshipImg.complete && starshipImg.naturalWidth > 0
  }

  function plumeReady() {
    return plumeImg.complete && plumeImg.naturalWidth > 0
  }

  function drawPlume(dx: number, dy: number, dw: number, dh: number, intensity = 1) {
    if (!plumeReady() || intensity <= 0) return
    const fw = plumeImg.naturalWidth / PLUME_FRAMES
    const fh = plumeImg.naturalHeight
    const frame = Math.floor(plumeClock * 18) % PLUME_FRAMES
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.92 * intensity
    ctx.drawImage(plumeImg, frame * fw, 0, fw, fh, dx, dy, dw, dh)
    ctx.restore()
  }

  function drawStarshipInRect(
    slotX: number,
    slotY: number,
    slotW: number,
    slotH: number,
    axis: 0 | 1,
    opts: { ghosted?: boolean; flying?: boolean; srcStart?: number; srcEnd?: number; burn?: number } = {},
  ) {
    const ghosted = !!opts.ghosted
    const srcStart = opts.srcStart ?? 0
    const srcEnd = opts.srcEnd ?? 1
    const srcSpan = Math.max(0.05, srcEnd - srcStart)

    ctx.save()
    if (ghosted) ctx.globalAlpha = 0.28

    if (!shipReady()) {
      // fallback metal while loading
      ctx.fillStyle = '#9aa3ad'
      roundRect(ctx, slotX + 4, slotY + 2, slotW - 8, slotH - 4, 6)
      ctx.fill()
      ctx.restore()
      return
    }

    const iw = starshipImg.naturalWidth
    const ih = starshipImg.naturalHeight
    const sy = srcStart * ih
    const sh = srcSpan * ih
    const aspect = iw / sh

    if (axis === 1) {
      let dh = slotH * 0.995
      let dw = dh * aspect
      if (dw > slotW * 1.35) {
        dw = slotW * 1.35
        dh = dw / aspect
      }
      const dx = slotX + (slotW - dw) / 2
      const dy = slotY + (slotH - dh) / 2
      if ((opts.flying || (opts.burn ?? 0) > 0) && srcEnd > 0.72 && !ghosted) {
        const intensity = opts.flying ? 1 : Math.max(0, opts.burn ?? 0)
        const pw = dw * 0.78
        const ph = Math.max(slotW * 2.1, dh * 0.62)
        drawPlume(dx + (dw - pw) / 2, dy + dh - ph * 0.14, pw, ph, intensity)
      }
      ctx.drawImage(starshipImg, 0, sy, iw, sh, dx, dy, dw, dh)
    } else {
      ctx.translate(slotX + slotW / 2, slotY + slotH / 2)
      ctx.rotate(-Math.PI / 2)
      // after -90°, +x was up the ship; slot long axis is slotW along world x = local +y? 
      // local +y (down in image, engines) should map to world +x (right).
      // rotate -90° (CCW): local +y -> world +x. Good (engines right).
      let dh = slotW * 0.995
      let dw = dh * aspect
      if (dw > slotH * 1.35) {
        dw = slotH * 1.35
        dh = dw / aspect
      }
      ctx.drawImage(starshipImg, 0, sy, iw, sh, -dw / 2, -dh / 2, dw, dh)
    }
    ctx.restore()
  }

  function drawRocketRun(
    cells: { x: number; y: number; seg: number }[],
    s: number,
    ox: number,
    oy: number,
    axis: 0 | 1,
    ghosted = false,
    flying = false,
    burn = 0,
  ) {
    if (!cells.length) return
    const sorted = cells.slice().sort((a, b) => (axis ? a.y - b.y || a.x - b.x : a.x - b.x || a.y - b.y))
    const a = sorted[0]
    const n = sorted.length
    const slotX = ox + a.x * s
    const slotY = oy + a.y * s
    const slotW = axis ? s : n * s
    const slotH = axis ? n * s : s
    const segs = sorted.map((c) => c.seg)
    const minSeg = Math.min(...segs)
    const maxSeg = Math.max(...segs)
    const denom = 4
    drawStarshipInRect(slotX, slotY, slotW, slotH, axis, {
      ghosted,
      flying: flying && axis === 1 && n >= 3,
      burn: axis === 1 ? burn : 0,
      srcStart: minSeg / denom,
      srcEnd: (maxSeg + 1) / denom,
    })
  }

  function satReady() {
    return starlinkImg.complete && starlinkImg.naturalWidth > 0
  }

  function drawSatFootprint(x: number, y: number, s: number, ghosted: boolean) {
    const size = s * 2
    if (ghosted) {
      ctx.save()
      for (const [cx, cy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const) {
        roundRect(ctx, x + cx * s + 2.5, y + cy * s + 2.5, s - 5, s - 5, 4)
        ctx.fillStyle = 'rgba(90, 150, 200, 0.12)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(190, 220, 255, 0.7)'
        ctx.lineWidth = 1.6
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(220, 240, 255, 0.85)'
      ctx.lineWidth = 2.2
      roundRect(ctx, x + 1.5, y + 1.5, size - 3, size - 3, 6)
      ctx.stroke()
      ctx.restore()
      return
    }

    for (const [cx, cy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const) {
      drawCellBody(x + cx * s, y + cy * s, s, PALS.O, 2)
    }
    ctx.save()
    ctx.strokeStyle = 'rgba(180, 210, 235, 0.55)'
    ctx.lineWidth = 2
    roundRect(ctx, x + 1.2, y + 1.2, size - 2.4, size - 2.4, 6)
    ctx.stroke()
    ctx.restore()
  }

  function drawSatellite(x: number, y: number, s: number, ghosted = false, live = false) {
    const size = s * 2
    drawSatFootprint(x, y, s, ghosted)
    if (ghosted) return
    ctx.save()
    if (!satReady()) {
      ctx.restore()
      return
    }
    const iw = starlinkImg.naturalWidth
    const ih = starlinkImg.naturalHeight
    const aspect = iw / ih
    let dw = size * 0.92
    let dh = dw / aspect
    if (dh > size * 0.72) {
      dh = size * 0.72
      dw = dh * aspect
    }
    const dx = x + (size - dw) / 2
    const dy = y + (size - dh) / 2
    if (live) {
      const unfold = 0.88 + (1 - Math.min(1, spawnPop)) * 0.12
      ctx.translate(dx + dw / 2, dy + dh / 2)
      ctx.scale(unfold, 0.96 + unfold * 0.04)
      ctx.drawImage(starlinkImg, -dw / 2, -dh / 2, dw, dh)
      const glint = (Math.sin(plumeClock * 3.1) * 0.5 + 0.5) * 0.22
      const gx = -dw * 0.2 + Math.sin(plumeClock * 1.4) * dw * 0.28
      const gg = ctx.createLinearGradient(gx - 10, -dh / 2, gx + 18, dh / 2)
      gg.addColorStop(0, 'rgba(255,255,255,0)')
      gg.addColorStop(0.5, `rgba(220,240,255,${glint})`)
      gg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gg
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh)
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = `rgba(90,170,255,${0.18 + Math.sin(plumeClock * 8) * 0.08})`
      ctx.beginPath()
      ctx.ellipse(dw * 0.02, dh * 0.38, dw * 0.08, dh * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.drawImage(starlinkImg, dx, dy, dw, dh)
    }
    ctx.restore()
  }

  function drawPieceCells(
    cells: [number, number][],
    id: PieceId,
    ox: number,
    oy: number,
    s: number,
    yOff: number,
    ghosted = false,
    flying = false,
  ) {
    if (id === 'I' && cells.length >= 2) {
      const xs = new Set(cells.map((c) => c[0]))
      const axis: 0 | 1 = xs.size === 1 ? 1 : 0
      const ordered = cells
        .slice()
        .sort((a, b) => (axis ? a[1] - b[1] : a[0] - b[0]))
        .map(([x, y], i) => ({ x, y, seg: i }))
      drawRocketRun(ordered, s, ox, oy + yOff * s, axis, ghosted, flying)
      return
    }
    if (id === 'O' && cells.length === 4) {
      const minx = Math.min(...cells.map((c) => c[0]))
      const miny = Math.min(...cells.map((c) => c[1]))
      drawSatellite(ox + minx * s, oy + (miny + yOff) * s, s, ghosted, !ghosted)
      return
    }
    for (const [x, y] of cells) {
      if (ghosted) {
        ctx.globalAlpha = 0.22
        ctx.strokeStyle = PALS[id].a
        ctx.lineWidth = 1.4
        roundRect(ctx, ox + x * s + 3, oy + (y + yOff) * s + 3, s - 6, s - 6, 4)
        ctx.stroke()
        ctx.globalAlpha = 1
      } else {
        drawCellBody(ox + x * s, oy + (y + yOff) * s, s, PALS[id])
        if (id === 'T') {
          ctx.fillStyle = '#e0a24a'
          ctx.globalAlpha = 0.8
          ctx.beginPath()
          ctx.arc(ox + x * s + s / 2, oy + (y + yOff) * s + s / 2, 2.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        if (id === 'S') {
          ctx.strokeStyle = 'rgba(80,190,255,0.25)'
          ctx.beginPath()
          ctx.moveTo(ox + x * s + 5, oy + (y + yOff) * s + s / 2)
          ctx.lineTo(ox + x * s + s - 5, oy + (y + yOff) * s + s / 2)
          ctx.stroke()
        }
      }
    }
  }

  function drawLocked(board: (Cell | null)[][], ox: number, oy: number, s: number, hiding: Set<number>) {
    const drawnRuns = new Set<number>()
    const satRuns = new Set<number>()
    for (let y = 0; y < ROWS; y++) {
      if (hiding.has(y)) continue
      for (let x = 0; x < COLS; x++) {
        const cell = board[y][x]
        if (!cell) continue
        if (cell.id === 'I') {
          if (drawnRuns.has(cell.run)) continue
          drawnRuns.add(cell.run)
          const run: { x: number; y: number; seg: number }[] = []
          for (let yy = 0; yy < ROWS; yy++) {
            if (hiding.has(yy)) continue
            for (let xx = 0; xx < COLS; xx++) {
              const c = board[yy][xx]
              if (c && c.id === 'I' && c.run === cell.run) run.push({ x: xx, y: yy, seg: c.seg })
            }
          }
          const groups = splitRun(run, cell.axis)
          for (const group of groups) {
            if (group.length) drawRocketRun(group, s, ox, oy, cell.axis)
          }
          continue
        }
        if (cell.id === 'O') {
          if (satRuns.has(cell.run)) continue
          const group: [number, number][] = []
          for (let yy = 0; yy < ROWS; yy++) {
            if (hiding.has(yy)) continue
            for (let xx = 0; xx < COLS; xx++) {
              const c = board[yy][xx]
              if (c && c.id === 'O' && c.run === cell.run) group.push([xx, yy])
            }
          }
          satRuns.add(cell.run)
          if (group.length === 4) {
            const minx = Math.min(...group.map((c) => c[0]))
            const miny = Math.min(...group.map((c) => c[1]))
            if (group.every(([gx, gy]) => (gx === minx || gx === minx + 1) && (gy === miny || gy === miny + 1))) {
              drawSatellite(ox + minx * s, oy + miny * s, s)
              continue
            }
          }
          for (const [gx, gy] of group) drawCellBody(ox + gx * s, oy + gy * s, s, PALS.O)
          continue
        }
        drawCellBody(ox + x * s, oy + y * s, s, PALS[cell.id])
        if (cell.id === 'T') {
          ctx.fillStyle = '#e0a24a'
          ctx.beginPath()
          ctx.arc(ox + x * s + s / 2, oy + y * s + s / 2, 2.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  function miniPiece(id: PieceId, x: number, y: number, s: number) {
    if (id === 'I' && shipReady()) {
      const h = s * 4.2
      const w = h * (starshipImg.naturalWidth / starshipImg.naturalHeight)
      ctx.drawImage(starshipImg, x - w / 2, y - h / 2, w, h)
      return
    }
    if (id === 'O') {
      const cell = s * 1.05
      drawSatellite(x - cell, y - cell, cell, false, false)
      return
    }
    const dummy: Active = { id, x: 0, y: 0, r: 0 }
    const cells = cellsOf(dummy)
    const minx = Math.min(...cells.map((c) => c[0]))
    const miny = Math.min(...cells.map((c) => c[1]))
    const maxx = Math.max(...cells.map((c) => c[0]))
    const maxy = Math.max(...cells.map((c) => c[1]))
    const pw = (maxx - minx + 1) * s
    const ph = (maxy - miny + 1) * s
    const ox = x - pw / 2 - minx * s
    const oy = y - ph / 2 - miny * s
    drawPieceCells(
      cells.map(([cx, cy]) => [cx, cy]),
      id,
      ox,
      oy,
      s,
      0,
    )
  }

  function panel(x: number, y: number, w: number, h: number) {
    ctx.fillStyle = 'rgba(6,8,12,0.62)'
    roundRect(ctx, x, y, w, h, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(210,220,230,0.12)'
    ctx.stroke()
  }

  function draw(g: Game, dt: number) {
    const L = layout()
    shake = Math.max(0, shake - dt * 2.8)
    flash = Math.max(0, flash - dt * 1.4)
    lockPulse = Math.max(0, lockPulse - dt * 3.2)
    themeBlend = Math.min(1, themeBlend + dt * 0.55)
    plumeClock += dt
    spawnPop = Math.max(0, spawnPop - dt * 2.8)
    shotFlash = Math.max(0, shotFlash - dt * 3.5)
    if (afterburn) {
      afterburn.t -= dt
      if (afterburn.t <= 0) afterburn = null
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt
      if (rings[i].t >= rings[i].max) rings.splice(i, 1)
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      floaters[i].t += dt
      if (floaters[i].t >= 1.1) floaters.splice(i, 1)
    }
    if (clearAnim) {
      clearAnim.t += dt
      if (clearAnim.t >= clearAnim.dur) clearAnim = null
    }
    if (toast) {
      toast.t += dt
      if (toast.t > 2.2) toast = null
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 90 * dt
      if (p.life <= 0) particles.splice(i, 1)
    }
    trail = trail.filter((t) => {
      t.y -= dt * 18
      return t.y > -4
    })

    const sx = (Math.random() - 0.5) * shake * 10
    const sy = (Math.random() - 0.5) * shake * 8
    ctx.clearRect(0, 0, L.w, L.h)
    ctx.save()
    ctx.translate(sx, sy)

    const liveTheme = levelFor(g.levelIndex).theme
    if (themeTo !== liveTheme && !toast) {
      themeFrom = themeTo
      themeTo = liveTheme
      themeBlend = 0
    }
    drawBackground(themeFrom, L.w, L.h, 1)
    if (themeBlend < 1) drawBackground(themeTo, L.w, L.h, themeBlend)
    else drawBackground(themeTo, L.w, L.h, 1)

    ctx.fillStyle = 'rgba(4,6,10,0.42)'
    ctx.fillRect(0, 0, L.w, L.h)

    // well
    panel(L.x - 12, L.y - 12, L.boardW + 24, L.boardH + 24)
    ctx.save()
    roundRect(ctx, L.x, L.y, L.boardW, L.boardH, 8)
    ctx.clip()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(L.x, L.y, L.boardW, L.boardH)

    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(L.x + i * L.cell, L.y)
      ctx.lineTo(L.x + i * L.cell, L.y + L.boardH)
      ctx.stroke()
    }
    for (let i = 1; i < ROWS; i++) {
      ctx.beginPath()
      ctx.moveTo(L.x, L.y + i * L.cell)
      ctx.lineTo(L.x + L.boardW, L.y + i * L.cell)
      ctx.stroke()
    }

    const hiding = new Set<number>()
    if (clearAnim) for (const r of clearAnim.rows) if (r >= 0) hiding.add(r)
    const board = visibleBoard(g)
    drawLocked(board, L.x, L.y, L.cell, hiding)
    if (afterburn && afterburn.t > 0) {
      const intensity = Math.min(1, afterburn.t * 6) * Math.min(1, afterburn.t / 0.08)
      drawPlume(
        L.x + afterburn.x * L.cell - L.cell * 0.2,
        L.y + (afterburn.y + afterburn.n - 0.2) * L.cell,
        L.cell * 1.4,
        L.cell * 2.4,
        Math.max(0.15, intensity),
      )
    }

    if (clearAnim) {
      const k = clearAnim.t / clearAnim.dur
      for (const r of clearAnim.rows) {
        if (r < 0) continue
        ctx.fillStyle = clearAnim.tetris ? `rgba(255,186,120,${0.75 * (1 - k)})` : `rgba(240,244,255,${0.55 * (1 - k)})`
        ctx.fillRect(L.x, L.y + r * L.cell, L.boardW, L.cell)
        ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`
        ctx.fillRect(L.x, L.y + r * L.cell + L.cell * 0.45, L.boardW, 1)
      }
    }

    const gh = ghost(g)
    if (gh && g.active && g.status === 'playing') {
      const cells = cellsOf(gh).map(([x, y]) => [x, y - HIDDEN] as [number, number])
      drawPieceCells(cells, gh.id, L.x, L.y, L.cell, 0, true, false)
    }
    if (g.active && g.status !== 'over') {
      const blend = fallBlend(g)
      const cells = cellsOf(g.active).map(([x, y]) => [x, y - HIDDEN] as [number, number])
      const vertical = g.active.id === 'I' && new Set(cells.map((c) => c[0])).size === 1
      const flying = vertical && !isGrounded(g)
      ctx.save()
      if (spawnPop > 0) {
        const cx = L.x + (Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0])) + 1) * L.cell / 2
        const cy = L.y + (Math.min(...cells.map((c) => c[1])) + Math.max(...cells.map((c) => c[1])) + 1) * L.cell / 2 + blend * L.cell
        const sc = 1 + spawnPop * 0.1
        ctx.translate(cx, cy)
        ctx.scale(sc, sc)
        ctx.translate(-cx, -cy)
        ctx.globalAlpha = 0.55 + (1 - spawnPop) * 0.45
      }
      drawPieceCells(cells, g.active.id, L.x, L.y, L.cell, blend, false, flying)
      ctx.restore()
      if (g.active.id === 'O' && !isGrounded(g)) {
        const minx = Math.min(...cells.map((c) => c[0]))
        const miny = Math.min(...cells.map((c) => c[1]))
        const px = L.x + (minx + 1) * L.cell
        const py = L.y + (miny + 1.15 + blend) * L.cell
        if (Math.random() < 0.6) {
          particles.push({
            x: px + (Math.random() - 0.5) * 10,
            y: py,
            vx: (Math.random() - 0.5) * 20,
            vy: 30 + Math.random() * 40,
            life: 0.28,
            max: 0.28,
            size: 1.2,
            r: 120,
            g: 180,
            b: 255,
          })
        }
      }
    }

    for (const ring of rings) {
      const k = ring.t / ring.max
      ctx.strokeStyle = ring.tetris ? `rgba(255,176,96,${0.55 * (1 - k)})` : `rgba(230,236,244,${0.35 * (1 - k)})`
      ctx.lineWidth = ring.tetris ? 2.2 : 1.3
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, (ring.tetris ? 28 : 16) + k * (ring.tetris ? 90 : 46), 0, Math.PI * 2)
      ctx.stroke()
    }

    for (const f of floaters) {
      const a = f.t < 0.12 ? f.t / 0.12 : Math.max(0, 1 - (f.t - 0.55) / 0.55)
      ctx.globalAlpha = a
      ctx.fillStyle = f.hue
      ctx.textAlign = 'center'
      ctx.font = `650 ${f.text.includes('HOT') ? 22 : 16}px ${fontDisplay}`
      ctx.fillText(f.text, f.x, f.y - f.t * 36)
      ctx.textAlign = 'left'
      ctx.globalAlpha = 1
    }

    for (const t of trail) {
      ctx.globalAlpha = 0.08
      ctx.fillStyle = '#ffb070'
      ctx.fillRect(L.x + t.x * L.cell + 8, L.y + t.y * L.cell, L.cell - 16, L.cell)
      ctx.globalAlpha = 1
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max)
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.restore()

    ctx.strokeStyle = `rgba(230,236,244,${0.16 + lockPulse * 0.25})`
    ctx.lineWidth = 1.4
    roundRect(ctx, L.x - 12, L.y - 12, L.boardW + 24, L.boardH + 24, 16)
    ctx.stroke()

    // HUD
    const lvl = levelFor(g.levelIndex)
    if (!L.mobile) {
      panel(L.x - 220, L.y, 188, 248)
      ctx.fillStyle = 'rgba(230,236,244,0.45)'
      ctx.font = `500 10px ${fontUi}`
      ctx.fillText('MISSION', L.x - 200, L.y + 28)
      ctx.fillStyle = '#f4f1ea'
      ctx.font = `650 30px ${fontDisplay}`
      ctx.fillText(lvl.name, L.x - 200, L.y + 68)
      ctx.fillStyle = 'rgba(230,236,244,0.55)'
      ctx.font = `400 13px ${fontUi}`
      ctx.fillText(lvl.subtitle, L.x - 200, L.y + 94)
      ctx.fillStyle = 'rgba(230,236,244,0.4)'
      ctx.font = `500 11px ${fontUi}`
      ctx.fillText(`LEVEL ${String(g.levelIndex).padStart(2, '0')}`, L.x - 200, L.y + 128)
      ctx.fillText(`${g.lines} LINES`, L.x - 200, L.y + 148)
      ctx.fillStyle = '#f4f1ea'
      ctx.font = `650 28px ${fontDisplay}`
      ctx.fillText(g.score.toLocaleString(), L.x - 200, L.y + 196)
      ctx.fillStyle = 'rgba(230,236,244,0.35)'
      ctx.font = `400 11px ${fontUi}`
      ctx.fillText(`${g.totalPieces} VEHICLES`, L.x - 200, L.y + 224)

      panel(L.x + L.boardW + 32, L.y, 168, L.boardH)
      ctx.fillStyle = 'rgba(230,236,244,0.45)'
      ctx.font = `500 10px ${fontUi}`
      ctx.fillText('NEXT', L.x + L.boardW + 52, L.y + 28)
      nextQueue(g, 5).forEach((id, i) => miniPiece(id, L.x + L.boardW + 116, L.y + 78 + i * 78, 18))
    } else {
      ctx.fillStyle = 'rgba(230,236,244,0.5)'
      ctx.font = `500 10px ${fontUi}`
      ctx.fillText(`LV ${g.levelIndex}  ·  ${lvl.name.toUpperCase()}`, 18, 28)
      ctx.fillStyle = '#f4f1ea'
      ctx.font = `650 22px ${fontDisplay}`
      ctx.fillText(g.score.toLocaleString(), 18, 54)
      nextQueue(g, 3).forEach((id, i) => miniPiece(id, L.w - 48, 40 + i * 46, 11))
    }

    if (toast) {
      const a = toast.t < 0.15 ? toast.t / 0.15 : toast.t > 1.8 ? Math.max(0, 1 - (toast.t - 1.8) / 0.4) : 1
      ctx.globalAlpha = a
      const tw = Math.min(420, L.w - 40)
      const tx = (L.w - tw) / 2
      const ty = L.y - (L.mobile ? 8 : 64)
      panel(tx, ty, tw, 72)
      ctx.fillStyle = '#f4f1ea'
      ctx.font = `650 26px ${fontDisplay}`
      ctx.textAlign = 'center'
      ctx.fillText(toast.title, L.w / 2, ty + 34)
      ctx.fillStyle = 'rgba(230,236,244,0.55)'
      ctx.font = `400 13px ${fontUi}`
      ctx.fillText(toast.sub, L.w / 2, ty + 56)
      ctx.textAlign = 'left'
      ctx.globalAlpha = 1
    }

    if (g.status === 'paused') {
      ctx.fillStyle = 'rgba(4,6,10,0.55)'
      ctx.fillRect(0, 0, L.w, L.h)
      ctx.fillStyle = '#f4f1ea'
      ctx.textAlign = 'center'
      ctx.font = `650 40px ${fontDisplay}`
      ctx.fillText('Paused', L.w / 2, L.h / 2)
      ctx.font = `400 14px ${fontUi}`
      ctx.fillStyle = 'rgba(230,236,244,0.6)'
      ctx.fillText('Clock stopped', L.w / 2, L.h / 2 + 28)
      ctx.textAlign = 'left'
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,236,210,${flash * 0.22})`
      ctx.fillRect(0, 0, L.w, L.h)
    }
    if (shotFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${shotFlash * 0.55})`
      ctx.fillRect(0, 0, L.w, L.h)
    }
    ctx.restore()
  }

  return {
    resize,
    draw,
    feed,
    capture() {
      const url = canvas.toDataURL('image/png')
      shotFlash = 1
      return url
    },
    dispose() {},
  }
}

export { lerp }

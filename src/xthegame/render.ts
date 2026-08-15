import { TENTACLE_COUNT, TENTACLE_LOGOS, kindColor, tentacleOf, type Boss, type Enemy, type EnemyKind, type Game } from './engine'

export type Renderer = {
  resize: () => void
  draw: (g: Game) => void
  toWorld: (clientX: number, clientY: number) => { x: number; y: number }
  dispose: () => void
}

const TIKTOK_MARK = new Path2D(
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
)
const THREADS_MARK = new Path2D(
  'M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z',
)
const IG_MARK = new Path2D(
  'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
)

function fillMark(ctx: CanvasRenderingContext2D, path: Path2D, view: number, size: number, color: string, ox = 0, oy = 0) {
  ctx.save()
  ctx.fillStyle = color
  const s = (size * 1.85) / view
  ctx.translate(ox, oy)
  ctx.scale(s, s)
  ctx.translate(-view / 2, -view / 2)
  ctx.fill(path, 'evenodd')
  ctx.restore()
}

const X_MARK = new Path2D(
  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.825L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z',
)

function lightning(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segs: number,
  jag: number,
  seed: number,
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  for (let i = 1; i < segs; i++) {
    const u = i / segs
    const wob = Math.sin(u * 17 + seed) * jag * (0.35 + Math.sin(u * 9 + seed * 1.7) * 0.65)
    ctx.lineTo(x1 + dx * u + nx * wob, y1 + dy * u + ny * wob)
  }
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const rr = i % 2 === 0 ? r : r * 0.38
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function drawBooster(ctx: CanvasRenderingContext2D, t: number, thrusting: boolean) {
  const pow = thrusting ? 1 : 0.42
  const flick = 0.82 + Math.sin(t * 31) * 0.1 + Math.sin(t * 53) * 0.07
  for (let i = 0; i < 6; i++) {
    const hgt = (20 + i * 10) * pow * flick + Math.sin(t * 26 + i * 1.3) * 5 * pow
    const half = (6.5 - i * 0.7) * pow
    const wob = Math.sin(t * 23 + i * 1.6) * 2.6 * pow
    ctx.globalAlpha = (0.16 + (1 - i / 6) * 0.32) * (thrusting ? 1 : 0.55)
    ctx.fillStyle = i < 2 ? '#fff4c4' : i < 4 ? '#ffb347' : '#ff4a14'
    ctx.beginPath()
    ctx.moveTo(-12, -half)
    ctx.quadraticCurveTo(-12 - hgt * 0.5, wob, -14 - hgt, wob * 0.25)
    ctx.quadraticCurveTo(-12 - hgt * 0.5, -wob, -12, half)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawX(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  const s = (size * 2.05) / 24
  ctx.scale(s, s)
  ctx.translate(-12, -12)
  ctx.fill(X_MARK, 'evenodd')
  ctx.restore()
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

function drawMark(ctx: CanvasRenderingContext2D, kind: EnemyKind, r: number) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (kind === 'tube') {
    ctx.fillStyle = '#ff0000'
    roundRect(ctx, -r * 0.78, -r * 0.54, r * 1.56, r * 1.08, r * 0.24)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(-r * 0.14, -r * 0.26)
    ctx.lineTo(-r * 0.14, r * 0.26)
    ctx.lineTo(r * 0.36, 0)
    ctx.closePath()
    ctx.fill()
  } else if (kind === 'book') {
    ctx.fillStyle = '#1877f2'
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `800 ${Math.round(r * 1.05)}px Helvetica, Arial, sans-serif`
    ctx.fillText('f', 1, 2)
  } else if (kind === 'tiktok') {
    fillMark(ctx, TIKTOK_MARK, 24, r * 1.05, '#25f4ee', -r * 0.08, r * 0.06)
    fillMark(ctx, TIKTOK_MARK, 24, r * 1.05, '#fe2c55', r * 0.08, -r * 0.05)
    fillMark(ctx, TIKTOK_MARK, 24, r * 1.05, '#f4f4f4')
  } else if (kind === 'threads') {
    fillMark(ctx, THREADS_MARK, 192, r * 1.08, '#f4f4f4')
  } else {
    const g = ctx.createLinearGradient(-r, -r, r, r)
    g.addColorStop(0, '#f9ce34')
    g.addColorStop(0.45, '#ee2a7b')
    g.addColorStop(1, '#6228d7')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2)
    ctx.fill()
    fillMark(ctx, IG_MARK, 24, r * 0.92, '#fff')
  }
  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.save()
  ctx.translate(e.x, e.y)
  ctx.shadowColor =
    e.kind === 'tube' ? '#ff0000' : e.kind === 'book' ? '#1877f2' : e.kind === 'tiktok' ? '#fe2c55' : 'rgba(255,255,255,0.22)'
  ctx.shadowBlur = 12
  if (e.flash > 0) ctx.globalAlpha = 0.55 + e.flash * 0.45
  drawMark(ctx, e.kind, e.r)
  ctx.restore()
}

const zuckHead = new Image()
zuckHead.src = '/xthegame/zuck.jpg'

function drawMeta(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save()
  ctx.strokeStyle = '#0668e1'
  ctx.lineWidth = Math.max(2.2, r * 0.28)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.ellipse(-r * 0.36, 0, r * 0.4, r * 0.34, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(r * 0.36, 0, r * 0.4, r * 0.34, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function armWidth(u: number, base: number) {
  return base * (1 - u * 0.78) * (1 - u * u * 0.12)
}

function armNormals(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]
    const c = pts[Math.min(pts.length - 1, i + 1)]
    const dx = c.x - a.x
    const dy = c.y - a.y
    const m = Math.hypot(dx, dy) || 1
    return { nx: -dy / m, ny: dx / m }
  })
}

function drawTentacles(ctx: CanvasRenderingContext2D, b: Boss, t: number) {
  const arms = Array.from({ length: TENTACLE_COUNT }, (_, i) => tentacleOf(b, i, t))
  ctx.save()
  ctx.fillStyle = 'rgba(18, 42, 68, 0.55)'
  ctx.beginPath()
  for (let i = 0; i < arms.length; i++) {
    const a = arms[i].pts[0]
    const c = arms[(i + 1) % arms.length].pts[0]
    const mx = (a.x + c.x) * 0.5
    const my = (a.y + c.y) * 0.5
    const wx = b.x + (mx - b.x) * 1.35
    const wy = b.y + (my - b.y) * 1.35
    if (i === 0) ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(wx, wy, c.x, c.y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  for (let i = 0; i < arms.length; i++) {
    const pts = arms[i].pts
    const ns = armNormals(pts)
    const baseW = 21 + (i % 2) * 3
    ctx.save()
    ctx.beginPath()
    for (let s = 0; s < pts.length; s++) {
      const w = armWidth(s / (pts.length - 1), baseW)
      const x = pts[s].x + ns[s].nx * w * 0.5
      const y = pts[s].y + ns[s].ny * w * 0.5
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let s = pts.length - 1; s >= 0; s--) {
      const w = armWidth(s / (pts.length - 1), baseW)
      ctx.lineTo(pts[s].x - ns[s].nx * w * 0.5, pts[s].y - ns[s].ny * w * 0.5)
    }
    ctx.closePath()
    const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y)
    g.addColorStop(0, '#1b3d62')
    g.addColorStop(0.45, '#24507a')
    g.addColorStop(1, '#16324f')
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = 'rgba(90, 140, 180, 0.22)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    for (let s = 0; s < pts.length; s++) {
      const u = s / (pts.length - 1)
      const w = armWidth(u, baseW)
      const x = pts[s].x + ns[s].nx * w * 0.22
      const y = pts[s].y + ns[s].ny * w * 0.22
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(170, 210, 230, 0.18)'
    ctx.lineWidth = 3.2
    ctx.lineCap = 'round'
    ctx.stroke()

    for (let s = 2; s < pts.length - 1; s++) {
      const u = s / (pts.length - 1)
      const w = armWidth(u, baseW)
      const sr = Math.max(1.4, w * 0.22)
      const sx = pts[s].x - ns[s].nx * w * 0.22
      const sy = pts[s].y - ns[s].ny * w * 0.22
      ctx.fillStyle = `rgba(210, 168, 148, ${0.55 - u * 0.2})`
      ctx.beginPath()
      ctx.ellipse(sx, sy, sr, sr * 0.72, Math.atan2(ns[s].ny, ns[s].nx), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(90, 40, 36, 0.35)'
      ctx.beginPath()
      ctx.ellipse(sx, sy, sr * 0.42, sr * 0.3, Math.atan2(ns[s].ny, ns[s].nx), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.translate(arms[i].tip.x, arms[i].tip.y)
    const logo = TENTACLE_LOGOS[i]
    if (logo === 'meta') drawMeta(ctx, 12)
    else drawMark(ctx, logo, 14)
    ctx.restore()
  }
}

function drawOneLaser(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  a: number,
  t: number,
  w: number,
  h: number,
) {
  if (t <= 0) return
  const len = Math.hypot(w, h)
  const firing = t <= 0.52
  ctx.save()
  ctx.translate(b.x, b.y)
  ctx.rotate(a)
  if (!firing) {
    ctx.strokeStyle = 'rgba(255, 80, 140, 0.28)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 10])
    ctx.beginPath()
    ctx.moveTo(b.r - 4, 0)
    ctx.lineTo(len, 0)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    const k = Math.min(1, t / 0.18, (0.52 - t) / 0.08)
    ctx.shadowColor = 'rgba(255, 70, 160, 0.4)'
    ctx.shadowBlur = 10
    ctx.strokeStyle = `rgba(255, 90, 170, ${0.22 + k * 0.28})`
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(b.r - 4, 0)
    ctx.lineTo(len, 0)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.strokeStyle = `rgba(255, 210, 240, ${0.35 + k * 0.3})`
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.moveTo(b.r - 4, 0)
    ctx.lineTo(len, 0)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBossLaser(ctx: CanvasRenderingContext2D, b: Boss, w: number, h: number) {
  drawOneLaser(ctx, b, b.laserA, b.laserT, w, h)
  if (b.phase >= 2) drawOneLaser(ctx, b, b.laserA2, b.laserT2, w, h)
}

function drawBoss(ctx: CanvasRenderingContext2D, b: Boss, t: number, w: number, h: number) {
  drawTentacles(ctx, b, t)
  drawBossLaser(ctx, b, w, h)
  ctx.save()
  ctx.translate(b.x, b.y)
  const pulse = 1 + Math.sin(t * 1.15) * 0.012
  ctx.scale(pulse, pulse)

  ctx.shadowColor = 'rgba(8, 20, 36, 0.55)'
  ctx.shadowBlur = 18
  const mantle = ctx.createRadialGradient(-b.r * 0.2, -b.r * 0.28, 8, 0, b.r * 0.08, b.r * 1.15)
  mantle.addColorStop(0, '#2a5278')
  mantle.addColorStop(0.42, '#1a3a58')
  mantle.addColorStop(1, '#0b1a2c')
  ctx.fillStyle = mantle
  ctx.beginPath()
  ctx.ellipse(0, 3, b.r * 1.06, b.r * 1.1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, b.r, 0, Math.PI * 2)
  ctx.clip()
  if (zuckHead.complete && zuckHead.naturalWidth > 0) {
    const nw = zuckHead.naturalWidth
    const nh = zuckHead.naturalHeight
    const crop = Math.min(nw, nh) * 0.52
    const sx = (nw - crop) * 0.5
    const sy = nh * 0.045
    ctx.drawImage(zuckHead, sx, sy, crop, crop, -b.r, -b.r, b.r * 2, b.r * 2)
  } else {
    ctx.fillStyle = '#1c1c22'
    ctx.fillRect(-b.r, -b.r, b.r * 2, b.r * 2)
  }
  if (b.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${b.flash * 0.2})`
    ctx.fillRect(-b.r, -b.r, b.r * 2, b.r * 2)
  }
  const fade = ctx.createRadialGradient(0, 0, b.r * 0.62, 0, 0, b.r)
  fade.addColorStop(0, 'rgba(8, 18, 30, 0)')
  fade.addColorStop(0.72, 'rgba(8, 18, 30, 0)')
  fade.addColorStop(1, 'rgba(8, 18, 30, 0.55)')
  ctx.fillStyle = fade
  ctx.fillRect(-b.r, -b.r, b.r * 2, b.r * 2)
  ctx.restore()

  ctx.strokeStyle = 'rgba(18, 40, 62, 0.7)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, b.r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(120, 170, 200, 0.16)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(0, 0, b.r - 1.6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function bakeGalaxy(hue: number, arms: number, tilt: number) {
  const c = document.createElement('canvas')
  c.width = 280
  c.height = 280
  const x = c.getContext('2d')
  if (!x) return c
  x.translate(140, 140)
  x.scale(1, tilt)
  const halo = x.createRadialGradient(0, 0, 10, 0, 0, 132)
  halo.addColorStop(0, `hsla(${hue}, 55%, 62%, 0.22)`)
  halo.addColorStop(0.4, `hsla(${hue + 18}, 50%, 42%, 0.1)`)
  halo.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = halo
  x.beginPath()
  x.arc(0, 0, 132, 0, Math.PI * 2)
  x.fill()
  const core = x.createRadialGradient(0, 0, 0, 0, 0, 28)
  core.addColorStop(0, 'rgba(255,252,240,0.95)')
  core.addColorStop(0.35, `hsla(${hue}, 70%, 72%, 0.55)`)
  core.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = core
  x.beginPath()
  x.arc(0, 0, 28, 0, Math.PI * 2)
  x.fill()
  for (let arm = 0; arm < arms; arm++) {
    const off = (arm / arms) * Math.PI * 2
    for (let i = 0; i < 110; i++) {
      const u = i / 110
      const a = off + u * 4.6
      const r = 16 + u * 118
      const j = Math.sin(i * 1.8 + arm * 2.4) * 7
      x.fillStyle = `hsla(${hue + u * 28}, 72%, ${78 - u * 26}%, ${(1 - u) * 0.28})`
      x.beginPath()
      x.arc(Math.cos(a) * r + j, Math.sin(a) * r, 1.4 + (1 - u) * 2.6, 0, Math.PI * 2)
      x.fill()
    }
  }
  return c
}

const GALAXY_SPRITES = [
  { img: bakeGalaxy(212, 3, 0.48), x: 0.18, y: 0.22, s: 0.16, rot: 0.014, drift: 0.004 },
  { img: bakeGalaxy(28, 2, 0.55), x: 0.78, y: 0.7, s: 0.2, rot: -0.01, drift: 0.003 },
  { img: bakeGalaxy(278, 4, 0.4), x: 0.66, y: 0.16, s: 0.1, rot: 0.018, drift: 0.005 },
]

const NEBULAS = [
  { x: 0.22, y: 0.28, r: 0.38, h: 220, s: 55, l: 42, vx: 0.004, vy: 0.0014 },
  { x: 0.78, y: 0.22, r: 0.3, h: 300, s: 45, l: 40, vx: -0.003, vy: 0.0018 },
  { x: 0.6, y: 0.76, r: 0.4, h: 18, s: 50, l: 38, vx: 0.0022, vy: -0.0016 },
]

const STARS = Array.from({ length: 160 }, () => ({
  x: Math.random(),
  y: Math.random(),
  s: 0.4 + Math.random() * 1.9,
  a: 0.2 + Math.random() * 0.62,
  d: 5 + Math.random() * 16,
  hue: Math.random() < 0.16 ? 205 : Math.random() < 0.08 ? 38 : 0,
}))

const TINTS = [
  { near: 'rgba(70, 120, 220, 0.16)', far: 'rgba(20, 40, 90, 0.08)', line: 'rgba(170, 200, 255, 0.55)' },
  { near: 'rgba(40, 90, 230, 0.18)', far: 'rgba(20, 30, 80, 0.1)', line: 'rgba(140, 180, 255, 0.55)' },
  { near: 'rgba(210, 50, 140, 0.14)', far: 'rgba(80, 20, 70, 0.1)', line: 'rgba(255, 160, 210, 0.5)' },
  { near: 'rgba(20, 190, 210, 0.14)', far: 'rgba(10, 50, 70, 0.1)', line: 'rgba(120, 240, 255, 0.55)' },
  { near: 'rgba(210, 210, 230, 0.1)', far: 'rgba(40, 40, 55, 0.08)', line: 'rgba(230, 230, 240, 0.5)' },
]
const BOSS_TINT = { near: 'rgba(24, 90, 230, 0.2)', far: 'rgba(90, 16, 40, 0.12)', line: 'rgba(80, 160, 255, 0.65)' }

function palette(g: Game) {
  if (g.phase === 'boss') return BOSS_TINT
  return TINTS[Math.max(0, Math.min(TINTS.length - 1, g.wave))] ?? TINTS[0]
}

function wrap01(n: number) {
  return ((n % 1) + 1) % 1
}

function drawBackdrop(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number) {
  ctx.fillStyle = '#020208'
  ctx.fillRect(-30, -30, w + 60, h + 60)
  const pal = palette(g)
  const wash = ctx.createRadialGradient(w * 0.28, h * 0.22, 12, w * 0.28, h * 0.22, w * 0.6)
  wash.addColorStop(0, pal.near)
  wash.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, w, h)
  const wash2 = ctx.createRadialGradient(w * 0.8, h * 0.76, 10, w * 0.8, h * 0.76, w * 0.5)
  wash2.addColorStop(0, pal.far)
  wash2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wash2
  ctx.fillRect(0, 0, w, h)

  for (const n of NEBULAS) {
    const nx = wrap01(n.x + g.t * n.vx) * w
    const ny = wrap01(n.y + g.t * n.vy) * h
    const rad = n.r * Math.max(w, h)
    const cloud = ctx.createRadialGradient(nx, ny, 8, nx, ny, rad)
    cloud.addColorStop(0, `hsla(${n.h}, ${n.s}%, ${n.l}%, 0.1)`)
    cloud.addColorStop(0.5, `hsla(${n.h + 16}, ${n.s - 8}%, ${n.l - 8}%, 0.04)`)
    cloud.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cloud
    ctx.fillRect(nx - rad, ny - rad, rad * 2, rad * 2)
  }

  for (const gal of GALAXY_SPRITES) {
    const gx = wrap01(gal.x + g.t * gal.drift * 0.15) * w
    const gy = wrap01(gal.y + g.t * gal.drift * 0.08) * h
    const scale = Math.min(w, h) * gal.s
    ctx.save()
    ctx.globalAlpha = 0.72
    ctx.translate(gx, gy)
    ctx.rotate(g.t * gal.rot)
    ctx.drawImage(gal.img, -scale / 2, -scale / 2, scale, scale)
    ctx.restore()
  }

  for (const st of STARS) {
    const x = wrap01(st.x + (g.t * st.d) / Math.max(w, 1)) * w
    const y = wrap01(st.y + g.t * 0.004 * (st.d / 14)) * h
    const tw = 0.7 + Math.sin(g.t * 1.3 + st.x * 18) * 0.3
    ctx.globalAlpha = st.a * tw
    ctx.fillStyle = st.hue ? `hsl(${st.hue}, 65%, 84%)` : '#fff'
    ctx.fillRect(x, y, st.s, st.s)
  }
  ctx.globalAlpha = 1
}

function drawArena(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number) {
  const pad = 22
  const x = pad
  const y = pad
  const rw = w - pad * 2
  const rh = h - pad * 2
  const pal = palette(g)
  const pulse = 0.45 + Math.sin(g.t * 1.5) * 0.12

  ctx.fillStyle = 'rgba(2, 2, 8, 0.55)'
  ctx.fillRect(0, 0, w, y)
  ctx.fillRect(0, y + rh, w, h - y - rh)
  ctx.fillRect(0, y, x, rh)
  ctx.fillRect(x + rw, y, w - x - rw, rh)

  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 10
  ctx.strokeRect(x, y, rw, rh)

  ctx.save()
  ctx.globalAlpha = pulse
  ctx.shadowColor = pal.line
  ctx.shadowBlur = 14
  ctx.strokeStyle = pal.line
  ctx.lineWidth = 1.6
  ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1)
  ctx.restore()

  const L = 26
  ctx.strokeStyle = 'rgba(240,246,255,0.82)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(x, y + L)
  ctx.lineTo(x, y)
  ctx.lineTo(x + L, y)
  ctx.moveTo(x + rw - L, y)
  ctx.lineTo(x + rw, y)
  ctx.lineTo(x + rw, y + L)
  ctx.moveTo(x + rw, y + rh - L)
  ctx.lineTo(x + rw, y + rh)
  ctx.lineTo(x + rw - L, y + rh)
  ctx.moveTo(x + L, y + rh)
  ctx.lineTo(x, y + rh)
  ctx.lineTo(x, y + rh - L)
  ctx.stroke()
}

function drawEdgePips(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number) {
  const pad = 22
  const inset = pad + 3
  const mark = (x: number, y: number, color: string) => {
    const cx = Math.max(inset, Math.min(w - inset, x))
    const cy = Math.max(inset, Math.min(h - inset, y))
    const outside = x < pad || x > w - pad || y < pad || y > h - pad
    if (!outside) return
    ctx.fillStyle = color
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  for (const e of g.enemies) mark(e.x, e.y, kindColor(e.kind))
  if (g.boss) mark(g.boss.x, g.boss.y, '#1877f2')
}

function drawWrapHints(ctx: CanvasRenderingContext2D, g: Game) {
  if (g.phase === 'title') return
  const p = g.player
  const near = 90
  const copies: { x: number; y: number; a: number }[] = []
  if (p.x < near) copies.push({ x: p.x + g.w, y: p.y, a: 1 - p.x / near })
  if (p.x > g.w - near) copies.push({ x: p.x - g.w, y: p.y, a: 1 - (g.w - p.x) / near })
  if (p.y < near) copies.push({ x: p.x, y: p.y + g.h, a: 1 - p.y / near })
  if (p.y > g.h - near) copies.push({ x: p.x, y: p.y - g.h, a: 1 - (g.h - p.y) / near })
  if (p.x < near && p.y < near) copies.push({ x: p.x + g.w, y: p.y + g.h, a: 0.7 })
  if (p.x > g.w - near && p.y < near) copies.push({ x: p.x - g.w, y: p.y + g.h, a: 0.7 })
  if (p.x < near && p.y > g.h - near) copies.push({ x: p.x + g.w, y: p.y - g.h, a: 0.7 })
  if (p.x > g.w - near && p.y > g.h - near) copies.push({ x: p.x - g.w, y: p.y - g.h, a: 0.7 })
  for (const c of copies) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, c.a) * 0.42
    ctx.translate(c.x, c.y)
    ctx.rotate(p.angle)
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 10
    drawX(ctx, 25, '#f7f7f7')
    ctx.restore()
  }
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  let dpr = 1
  let cssW = 1
  let cssH = 1

  const resize = () => {
    const parent = canvas.parentElement
    const w = parent?.clientWidth ?? window.innerWidth
    const h = parent?.clientHeight ?? window.innerHeight
    dpr = Math.min(2, window.devicePixelRatio || 1)
    cssW = w
    cssH = h
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * (canvas.width / dpr),
      y: ((clientY - rect.top) / rect.height) * (canvas.height / dpr),
    }
  }

  const draw = (g: Game) => {
    g.w = cssW
    g.h = cssH
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const sx = (Math.random() - 0.5) * g.shake
    const sy = (Math.random() - 0.5) * g.shake
    ctx.save()
    ctx.translate(sx, sy)

    drawBackdrop(ctx, g, cssW, cssH)
    drawArena(ctx, g, cssW, cssH)
    if (g.phase === 'play' || g.phase === 'boss') drawEdgePips(ctx, g, cssW, cssH)

    for (const pt of g.particles) {
      const k = Math.max(0, pt.life / pt.max)
      ctx.globalAlpha = k
      if (pt.kind === 'ring') {
        ctx.strokeStyle = pt.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, (1 - k) * 46 + 8, 0, Math.PI * 2)
        ctx.stroke()
      } else if (pt.kind === 'heart') {
        const s = 1.1 + (1 - k) * 1.35
        ctx.save()
        ctx.translate(pt.x, pt.y)
        ctx.scale(s, s)
        ctx.globalAlpha = k * 0.85
        ctx.fillStyle = '#ff4d6d'
        ctx.beginPath()
        ctx.moveTo(0, 9)
        ctx.bezierCurveTo(-16, -4, -10, -16, 0, -8)
        ctx.bezierCurveTo(10, -16, 16, -4, 0, 9)
        ctx.fill()
        ctx.restore()
      } else if (pt.kind === 'nova') {
        const r = 8 + (1 - k) * pt.size
        ctx.save()
        ctx.translate(pt.x, pt.y)
        ctx.strokeStyle = pt.color
        ctx.globalAlpha = k * 0.7
        ctx.lineWidth = 1.4 + (1 - k) * 2.2
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = k * 0.06
        ctx.fillStyle = pt.color
        ctx.fill()
        ctx.globalAlpha = k * 0.4
        ctx.lineWidth = 1
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + (1 - k) * 0.6
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72)
          ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10))
          ctx.stroke()
        }
        ctx.restore()
      } else if (pt.kind === 'flare') {
        ctx.save()
        ctx.translate(pt.x, pt.y)
        ctx.rotate((1 - k) * 0.8)
        ctx.globalAlpha = k
        ctx.fillStyle = pt.color
        drawStar(ctx, pt.size * (0.55 + k * 0.7))
        ctx.globalAlpha = k * 0.45
        ctx.fillStyle = '#fff'
        drawStar(ctx, pt.size * 0.38 * k)
        ctx.restore()
      } else if (pt.kind === 'bolt') {
        ctx.save()
        ctx.translate(pt.x, pt.y)
        ctx.globalAlpha = k * 0.8
        ctx.strokeStyle = `rgba(245, 215, 110, ${0.35 + k * 0.4})`
        ctx.lineWidth = 1.8
        ctx.lineCap = 'round'
        const span = 10 + (1 - k) * 28
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + (1 - k) * 0.4
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4)
          ctx.lineTo(Math.cos(a + 0.35) * span * 0.45, Math.sin(a + 0.35) * span * 0.45)
          ctx.lineTo(Math.cos(a - 0.15) * span * 0.7, Math.sin(a - 0.15) * span * 0.7)
          ctx.lineTo(Math.cos(a) * span, Math.sin(a) * span)
          ctx.stroke()
        }
        ctx.restore()
      } else {
        ctx.fillStyle = pt.color
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.size * k, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    for (const o of g.orbs) {
      ctx.save()
      ctx.translate(o.x, o.y)
      if (o.kind === 'heart') {
        ctx.shadowColor = '#ff4d6d'
        ctx.shadowBlur = 16
        ctx.fillStyle = '#ff4d6d'
        ctx.beginPath()
        ctx.moveTo(0, 9)
        ctx.bezierCurveTo(-16, -4, -10, -16, 0, -8)
        ctx.bezierCurveTo(10, -16, 16, -4, 0, 9)
        ctx.fill()
      } else if (o.kind === 'rapid' || o.kind === 'nova' || o.kind === 'titan') {
        const pulse = 1 + Math.sin(g.t * 9 + o.x) * 0.08
        ctx.scale(pulse, pulse)
        ctx.shadowColor = o.color
        ctx.shadowBlur = 16
        ctx.strokeStyle = o.color
        ctx.fillStyle = o.color
        ctx.lineWidth = 2.2
        if (o.kind === 'rapid') {
          ctx.rotate(g.t * 1.2)
          for (let i = -1; i <= 1; i++) {
            ctx.fillRect(-8, i * 6 - 1.4, 16, 2.8)
          }
        } else if (o.kind === 'nova') {
          ctx.beginPath()
          ctx.arc(0, 0, 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(0, 0, 11, 0, Math.PI * 2)
          ctx.stroke()
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + g.t * 2
            ctx.beginPath()
            ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11)
            ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17)
            ctx.stroke()
          }
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -13)
          ctx.lineTo(11, 4)
          ctx.lineTo(5, 4)
          ctx.lineTo(5, 13)
          ctx.lineTo(-5, 13)
          ctx.lineTo(-5, 4)
          ctx.lineTo(-11, 4)
          ctx.closePath()
          ctx.fill()
        }
      } else if (o.kind === 'boost') {
        const pulse = 1 + Math.sin(g.t * 11 + o.x * 0.05) * 0.1
        ctx.rotate(g.t * 1.8)
        ctx.scale(pulse, pulse)
        ctx.shadowColor = '#f5d76e'
        ctx.shadowBlur = 16
        ctx.fillStyle = '#f5d76e'
        ctx.beginPath()
        ctx.moveTo(-5, -16)
        ctx.lineTo(8, -2)
        ctx.lineTo(2, -2)
        ctx.lineTo(6, 16)
        ctx.lineTo(-8, 2)
        ctx.lineTo(-1, 2)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(255,255,220,0.55)'
        ctx.lineWidth = 1.2
        ctx.stroke()
        for (let k = 0; k < 3; k++) {
          const a = g.t * 6 + k * 2.1
          ctx.strokeStyle = `rgba(245,215,110,${0.35 + Math.sin(g.t * 14 + k) * 0.2})`
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12)
          ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17)
          ctx.stroke()
        }
      } else {
        ctx.globalAlpha = 0.16
        ctx.shadowColor = o.color
        ctx.shadowBlur = 2
        ctx.fillStyle = o.color
        ctx.beginPath()
        ctx.arc(0, 0, 3.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    for (const s of g.shocks) {
      ctx.strokeStyle = s.ink ? 'rgba(70, 30, 90, 0.55)' : 'rgba(80,160,255,0.7)'
      ctx.lineWidth = s.ink ? 10 : 3
      ctx.shadowColor = s.ink ? 'rgba(80,20,100,0.3)' : '#3b82f6'
      ctx.shadowBlur = s.ink ? 8 : 16
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    for (const e of g.enemies) drawEnemy(ctx, e)
    if (g.boss) drawBoss(ctx, g.boss, g.t, cssW, cssH)

    for (const a of g.arcs) {
      let tx = a.x
      let ty = a.y
      if (a.tid === -1 && g.boss) {
        tx = g.boss.x
        ty = g.boss.y
      } else {
        const e = g.enemies.find((o) => o.id === a.tid)
        if (!e) continue
        tx = e.x
        ty = e.y
      }
      const n = g.buffs.nova
      const thick = 1.15 + n * 0.18
      ctx.save()
      if (a.wait > 0) {
        const pulse = 0.55 + Math.sin(g.t * 42 + a.x) * 0.25
        ctx.strokeStyle = `rgba(232,121,249,${0.45 + pulse * 0.35})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(a.x, a.y, 10 + (0.22 - Math.min(0.22, a.wait)) * 46 + n * 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.35})`
        ctx.beginPath()
        ctx.arc(a.x, a.y, 2.4 + n * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(250,232,255,0.75)'
        ctx.lineWidth = 1
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + g.t * 10
          ctx.beginPath()
          ctx.moveTo(a.x + Math.cos(ang) * 5, a.y + Math.sin(ang) * 5)
          ctx.lineTo(a.x + Math.cos(ang) * (14 + n * 2), a.y + Math.sin(ang) * (14 + n * 2))
          ctx.stroke()
        }
      } else {
        const u = Math.min(1, a.t / a.max)
        const px = a.x + (tx - a.x) * u
        const py = a.y + (ty - a.y) * u
        const seed = a.x * 0.07 + a.y * 0.05 + a.tid
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'rgba(168,85,247,0.28)'
        ctx.lineWidth = thick + 2.4
        lightning(ctx, a.x, a.y, px, py, 8, 10 + n * 2, seed)
        ctx.strokeStyle = 'rgba(232,121,249,0.85)'
        ctx.lineWidth = thick + 0.6
        lightning(ctx, a.x, a.y, px, py, 8, 7 + n, seed + 1)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 0.9
        lightning(ctx, a.x, a.y, px, py, 8, 5 + n * 0.6, seed + 2)
        ctx.fillStyle = '#f5d0fe'
        ctx.beginPath()
        ctx.arc(px, py, 2.4 + n * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(px, py, 1.1, 0, Math.PI * 2)
        ctx.fill()
        if (u > 0.72) {
          ctx.strokeStyle = `rgba(240,171,252,${(u - 0.72) * 2.4})`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(tx, ty, 6 + (u - 0.72) * 42, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    for (const gh of g.ghosts) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, gh.life / 0.18) * 0.35
      ctx.translate(gh.x, gh.y)
      ctx.rotate(gh.a)
      drawX(ctx, 20, '#fff')
      ctx.restore()
    }

    if (g.phase === 'title') {
      ctx.save()
      ctx.translate(cssW / 2, cssH * 0.36)
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + Math.sin(g.t * 1.2) * 0.05})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, 92 + Math.sin(g.t * 0.7) * 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.rotate(g.t * 0.22)
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 36
      drawX(ctx, 68, '#f7f7f7')
      ctx.restore()
    }

    if (g.phase !== 'title') {
      const p = g.player
      if (g.boostT > 0) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.strokeStyle = `rgba(245,215,110,${0.28 + Math.sin(g.t * 10) * 0.1})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(0, 0, 30 + Math.sin(g.t * 9) * 3, 0, Math.PI * 2)
        ctx.stroke()
        for (let i = 0; i < 4; i++) {
          const a = g.t * 5 + (i / 4) * Math.PI * 2
          ctx.strokeStyle = 'rgba(245,215,110,0.4)'
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16)
          ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22)
          ctx.stroke()
        }
        ctx.restore()
      }
      if (g.buffs.rapid > 0 || g.buffs.nova > 0 || g.buffs.titan > 0) {
        ctx.save()
        ctx.translate(p.x, p.y)
        const rp = g.buffs.rapid
        const nv = g.buffs.nova
        const tn = g.buffs.titan
        if (rp > 0) {
          ctx.strokeStyle = `rgba(255,107,44,${0.45 + Math.sin(g.t * 18) * 0.15})`
          ctx.lineWidth = 2.4 + rp * 0.5
          const ticks = 8 + rp * 2
          for (let i = 0; i < ticks; i++) {
            const a = g.t * (16 + rp * 3) + (i / ticks) * Math.PI * 2
            ctx.beginPath()
            ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18)
            ctx.lineTo(Math.cos(a) * (32 + rp * 4), Math.sin(a) * (32 + rp * 4))
            ctx.stroke()
          }
        }
        if (nv > 0) {
          for (let i = 0; i < nv + 1; i++) {
            const k = ((g.t * (1.4 + nv * 0.25) + i / (nv + 1)) % 1)
            ctx.strokeStyle = '#e879f9'
            ctx.globalAlpha = 0.38 * (1 - k)
            ctx.lineWidth = 1.15
            ctx.beginPath()
            ctx.arc(0, 0, 16 + k * (90 + nv * 14), 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.globalAlpha = 0.55
          ctx.strokeStyle = '#f5d0fe'
          ctx.lineWidth = 1
          const spokes = 8 + nv
          for (let i = 0; i < spokes; i++) {
            const a = g.t * 2.4 + (i / spokes) * Math.PI * 2
            ctx.beginPath()
            ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12)
            ctx.lineTo(Math.cos(a) * (22 + nv * 3), Math.sin(a) * (22 + nv * 3))
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }
        if (tn > 0) {
          ctx.strokeStyle = `rgba(244,244,245,${0.4 + Math.sin(g.t * 6) * 0.12})`
          ctx.lineWidth = 3.6 + tn * 0.8
          ctx.beginPath()
          ctx.arc(0, 0, 40 + tn * 4 + Math.sin(g.t * 5) * 3, 0, Math.PI * 2)
          ctx.stroke()
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + g.t * 0.6
            const r = 34 + tn * 3
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.stroke()
        }
        ctx.restore()
      }
      if (p.dashCd > 0) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + (1 - p.dashCd / 1.6) * Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      drawBooster(ctx, g.t, p.thrusting)
      if (p.charging && g.weapon === 3) {
        const k = Math.min(1, p.charge / 0.12)
        const tn = g.buffs.titan
        const nv = g.buffs.nova
        ctx.strokeStyle = nv > 0 ? `rgba(232,121,249,${0.28 + k * 0.45})` : `rgba(170,200,255,${0.26 + k * 0.42})`
        ctx.lineWidth = 1.8 + k * 2.4 + tn * 0.6
        ctx.beginPath()
        ctx.moveTo(16, 0)
        ctx.lineTo(18 + 22 + k * 26 + tn * 4, 0)
        ctx.stroke()
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + k * 0.45})`
        ctx.lineWidth = 0.9 + k
        ctx.beginPath()
        ctx.moveTo(16, 0)
        ctx.lineTo(18 + 16 + k * 20, 0)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${0.25 + k * 0.45})`
        ctx.beginPath()
        ctx.arc(18 + k * 6, 0, 2 + k * 2.4 + tn * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      if (p.muzzle > 0) {
        const u = p.muzzle / 0.14
        const nv = g.buffs.nova
        const tn = g.buffs.titan
        const rp = g.buffs.rapid
        ctx.fillStyle =
          nv > 0 ? `rgba(232,121,249,${0.4 * u})` : rp > 0 ? `rgba(255,107,44,${0.4 * u})` : `rgba(180,220,255,${0.38 * u})`
        ctx.beginPath()
        ctx.moveTo(14, 0)
        ctx.lineTo(14 + 16 + tn * 3, 5 + tn)
        ctx.lineTo(14 + 26 + tn * 5, 0)
        ctx.lineTo(14 + 16 + tn * 3, -5 - tn)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${0.65 * u})`
        ctx.beginPath()
        ctx.moveTo(16, 0)
        ctx.lineTo(24, 2.2)
        ctx.lineTo(28 + tn * 2, 0)
        ctx.lineTo(24, -2.2)
        ctx.closePath()
        ctx.fill()
      }
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = p.thrusting || p.charging || p.muzzle > 0 ? 22 : p.iFrames > 0 ? 16 : 14
      ctx.globalAlpha = p.iFrames > 0 ? 0.62 + Math.sin(g.t * 7) * 0.18 : 1
      drawX(ctx, 26, '#f7f7f7')
      ctx.restore()
      drawWrapHints(ctx, g)
    }

    for (const beam of g.beams) {
      const k = Math.max(0.14, beam.life / beam.max)
      const nv = g.buffs.nova
      const tn = g.buffs.titan
      ctx.save()
      ctx.translate(beam.x, beam.y)
      ctx.rotate(beam.a)
      const len = Math.hypot(g.w, g.h)
      const hw = beam.w * k
      if (nv > 0) {
        ctx.fillStyle = `rgba(168, 85, 247, ${0.08 + k * 0.1})`
        ctx.beginPath()
        ctx.roundRect(0, -hw * 0.72, len, hw * 1.44, hw * 0.5)
        ctx.fill()
      }
      ctx.fillStyle = `rgba(80, 160, 255, ${0.12 + k * 0.14})`
      ctx.beginPath()
      ctx.roundRect(0, -hw * 0.62, len, hw * 1.24, hw * 0.45)
      ctx.fill()
      ctx.fillStyle = `rgba(170, 210, 255, ${0.28 + k * 0.28})`
      ctx.beginPath()
      ctx.roundRect(0, -hw * 0.28, len, hw * 0.56, hw * 0.28)
      ctx.fill()
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + k * 0.4})`
      ctx.beginPath()
      ctx.roundRect(0, -hw * 0.08, len, hw * 0.16, hw * 0.08)
      ctx.fill()
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + k * 0.35})`
      ctx.beginPath()
      ctx.arc(8, 0, hw * 0.22 + tn * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(255,255,255,${0.18 + k * 0.22})`
      ctx.lineWidth = 0.8
      for (let i = 0; i < 4 + tn; i++) {
        const x = 36 + i * 96
        ctx.beginPath()
        ctx.moveTo(x, -hw * 0.55)
        ctx.lineTo(x + 10, 0)
        ctx.lineTo(x, hw * 0.55)
        ctx.stroke()
      }
      ctx.restore()
    }

    for (const f of g.foes) {
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.spin)
      ctx.globalAlpha = Math.min(1, f.life / 0.3)
      if (f.kind === 'shard') {
        const grd = ctx.createLinearGradient(-10, 0, 10, 0)
        grd.addColorStop(0, 'rgba(40,180,255,0.15)')
        grd.addColorStop(0.45, '#7af0ff')
        grd.addColorStop(1, 'rgba(255,255,255,0.9)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.moveTo(11, 0)
        ctx.lineTo(-4, 4.2)
        ctx.lineTo(-8, 0)
        ctx.lineTo(-4, -4.2)
        ctx.closePath()
        ctx.fill()
      } else {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, f.r + 3)
        glow.addColorStop(0, '#fff')
        glow.addColorStop(0.28, '#c4a6ff')
        glow.addColorStop(0.62, '#6a3bff')
        glow.addColorStop(1, 'rgba(40,10,80,0.1)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(0, 0, f.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(210, 190, 255, 0.7)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2
          const cmd = i === 0 ? ctx.moveTo.bind(ctx) : ctx.lineTo.bind(ctx)
          cmd(Math.cos(a) * (f.r + 2.5), Math.sin(a) * (f.r + 2.5))
        }
        ctx.closePath()
        ctx.stroke()
      }
      ctx.restore()
    }

    ctx.font = '600 20px Outfit, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const pip of g.pips) {
      const u = Math.min(1, pip.t / pip.life)
      const fade = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45
      ctx.globalAlpha = Math.max(0, fade * 0.9)
      ctx.fillStyle = '#f4f4f4'
      ctx.fillText(`+${pip.n}`, pip.x, pip.y)
    }
    ctx.globalAlpha = 1

    for (const b of g.bullets) {
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(Math.atan2(b.vy, b.vx))
      const nv = g.buffs.nova
      const tn = g.buffs.titan
      const rp = g.buffs.rapid
      if (nv > 0) {
        ctx.fillStyle = `rgba(192,132,252,${0.12 + nv * 0.03})`
        ctx.beginPath()
        ctx.ellipse(-3, 0, b.len * 0.55 + nv * 0.6, b.r * 0.42 + nv * 0.2, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if (b.kind === 'seek') {
        const gold = b.tint === 'gold'
        ctx.fillStyle = gold ? 'rgba(245, 190, 60, 0.28)' : 'rgba(70, 150, 255, 0.28)'
        ctx.beginPath()
        ctx.ellipse(-10, 0, 12 + tn, 2.6 + tn * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = gold ? '#ffd36a' : '#7ec8ff'
        ctx.beginPath()
        ctx.moveTo(10, 0)
        ctx.lineTo(-2, 3.4 + tn * 0.3)
        ctx.lineTo(-8, 0)
        ctx.lineTo(-2, -3.4 - tn * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = gold ? '#fff4c4' : '#e8f4ff'
        ctx.beginPath()
        ctx.moveTo(9, 0)
        ctx.lineTo(1, 1.3)
        ctx.lineTo(1, -1.3)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = gold ? '#f59e0b' : '#3b82f6'
        ctx.beginPath()
        ctx.moveTo(-2, 2.8)
        ctx.lineTo(-9 - tn, 0)
        ctx.lineTo(-2, -2.8)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = gold ? 'rgba(255,211,106,0.55)' : 'rgba(126,200,255,0.55)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(3, 0, 4.2 + tn * 0.3, 0, Math.PI * 2)
        ctx.stroke()
      } else if (b.look === 4) {
        ctx.fillStyle = rp > 0 ? 'rgba(255,140,60,0.28)' : 'rgba(180, 210, 255, 0.24)'
        ctx.beginPath()
        ctx.ellipse(-4, 0, b.len * 0.55, b.r * 0.42, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.ellipse(2, 0, b.len * 0.32, b.r * 0.26, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#9ecbff'
        ctx.beginPath()
        ctx.moveTo(-1, -b.r * 0.55)
        ctx.lineTo(b.len * 0.22, 0)
        ctx.lineTo(-1, b.r * 0.55)
        ctx.closePath()
        ctx.fill()
      } else if (b.look === 2) {
        ctx.fillStyle = rp > 0 ? 'rgba(255,120,50,0.28)' : 'rgba(150, 200, 255, 0.26)'
        ctx.beginPath()
        ctx.ellipse(-5, 0, b.len * 0.62, b.r * 0.38, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.ellipse(2, 0, b.len * 0.34, b.r * 0.24, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#cfe4ff'
        ctx.fillRect(-b.len * 0.45, -0.8, b.len * 0.5, 1.6)
      } else if (b.kind === 'bolt') {
        ctx.fillStyle = rp > 0 ? 'rgba(255,107,44,0.3)' : 'rgba(180, 210, 255, 0.26)'
        ctx.beginPath()
        ctx.ellipse(-4, 0, b.len * 0.68, b.r * 0.42, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = tn > 0 ? '#f4f4f5' : '#fff'
        ctx.beginPath()
        ctx.ellipse(2, 0, b.len * 0.34, b.r * 0.26, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = rp > 0 ? '#ffb347' : '#9ecbff'
        ctx.beginPath()
        ctx.ellipse(-b.len * 0.28, 0, b.len * 0.22, b.r * 0.16, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.beginPath()
        ctx.arc(b.len * 0.16, 0, Math.max(1.3, b.r * 0.16), 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = b.kind === 'rift' ? '#7dd3fc' : '#fff'
        ctx.beginPath()
        ctx.ellipse(0, 0, b.len * 0.48, b.r * 0.28, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    ctx.restore()

    const vig = ctx.createRadialGradient(cssW / 2, cssH / 2, cssH * 0.25, cssW / 2, cssH / 2, cssH * 0.78)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, cssW, cssH)

    if (g.flash > 0) {
      ctx.fillStyle = `rgba(180,200,230,${Math.min(0.05, g.flash * 0.2)})`
      ctx.fillRect(0, 0, cssW, cssH)
    }
  }

  return {
    resize,
    draw,
    toWorld,
    dispose: () => {},
  }
}

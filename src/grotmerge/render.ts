import { TIERS, botOf, radiusOf, type Game } from './engine'

export type Renderer = {
  draw: (g: Game) => void
  resize: (w: number, h: number) => void
}

type Blink = { until: number; next: number }

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const open: HTMLImageElement[] = []
  const shut: HTMLImageElement[] = []
  for (let i = 0; i < TIERS.length; i++) {
    const a = new Image()
    a.src = `/grot_bot_merge/bots/bot_${String(i).padStart(2, '0')}.png`
    open.push(a)
    const b = new Image()
    b.src = `/grot_bot_merge/bots/bot_${String(i).padStart(2, '0')}_blink.png`
    shut.push(b)
  }
  const blinks = new Map<number, Blink>()

  function blinking(id: number, now: number) {
    let s = blinks.get(id)
    if (!s) {
      s = { until: 0, next: now + 500 + Math.random() * 2400 }
      blinks.set(id, s)
    }
    if (now >= s.next) {
      s.until = now + 85 + Math.random() * 55
      s.next = now + 800 + Math.random() * 3400
    }
    return now < s.until
  }

  function resize(w: number, h: number) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function sprite(
    tier: number,
    x: number,
    y: number,
    r: number,
    rot: number,
    id: number,
    alpha = 1,
    extra?: { born?: number; squash?: number; danger?: number },
  ) {
    const now = performance.now()
    const img = blinking(id, now) && shut[tier].complete && shut[tier].naturalWidth ? shut[tier] : open[tier]
    const appear = 1 - Math.min(1, extra?.born ?? 0)
    const bounce = 0.28 + 0.72 * appear + Math.sin(appear * Math.PI) * 0.2 * appear
    const sq = extra?.squash ?? 0
    const sx = r * 1.94 * bounce * (1 + sq * 0.16)
    const sy = r * 1.94 * bounce * (1 - sq * 0.14)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(sx / (r * 1.94) || 1, sy / (r * 1.94) || 1)
    const s = r * 1.94
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = r * 0.35
    ctx.shadowOffsetY = r * 0.12
    if (img.complete && img.naturalWidth) ctx.drawImage(img, -s / 2, -s / 2, s, s)
    else {
      ctx.fillStyle = TIERS[tier].color
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
    }
    if (extra?.danger) {
      const pulse = 0.25 + Math.sin(now / 90) * 0.12
      ctx.globalAlpha = pulse * extra.danger
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  function bowl(g: Game) {
    const { x, y, w, h } = g.bowl
    const ox = 7
    const oy = 9

    // outer shell
    const shell = ctx.createLinearGradient(x - ox, y, x + w + ox, y)
    shell.addColorStop(0, '#4a4a54')
    shell.addColorStop(0.45, '#2e2e36')
    shell.addColorStop(1, '#1a1a20')
    ctx.beginPath()
    ctx.roundRect(x - ox, y - 2, w + ox * 2, h + oy + 4, 24)
    ctx.fillStyle = shell
    ctx.fill()

    // top rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x - ox + 1.5, y - 0.5, w + ox * 2 - 3, 14, 10)
    ctx.stroke()

    // inner cavity
    const inn = ctx.createLinearGradient(x, y, x + w, y + h)
    inn.addColorStop(0, '#14141a')
    inn.addColorStop(0.35, '#1d1d24')
    inn.addColorStop(0.75, '#121218')
    inn.addColorStop(1, '#0b0b10')
    ctx.beginPath()
    ctx.roundRect(x + 5, y + 6, w - 10, h - 8, 16)
    ctx.fillStyle = inn
    ctx.fill()

    // left inner light
    const left = ctx.createLinearGradient(x + 6, y, x + 48, y)
    left.addColorStop(0, 'rgba(255,255,255,0.07)')
    left.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = left
    ctx.fillRect(x + 6, y + 8, 42, h - 14)

    // floor
    const floor = ctx.createLinearGradient(x, y + h - 56, x, y + h)
    floor.addColorStop(0, 'rgba(255,255,255,0)')
    floor.addColorStop(1, 'rgba(255,255,255,0.05)')
    ctx.fillStyle = floor
    ctx.fillRect(x + 8, y + h - 52, w - 16, 44)

    // inner lip shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x + 10, y + 8)
    ctx.lineTo(x + w - 10, y + 8)
    ctx.stroke()
  }

  function draw(g: Game) {
    const vw = canvas.clientWidth
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    if (g.shake > 0.02) {
      ctx.save()
      ctx.translate((Math.random() - 0.5) * 10 * g.shake, (Math.random() - 0.5) * 8 * g.shake)
    }
    bowl(g)

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(g.bowl.x + 5, g.bowl.y + 6, g.bowl.w - 10, g.bowl.h - 8, 16)
    ctx.clip()

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([7, 7])
    ctx.moveTo(g.bowl.x + 16, g.dangerY)
    ctx.lineTo(g.bowl.x + g.bowl.w - 16, g.dangerY)
    ctx.strokeStyle = 'rgba(244,63,94,0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    for (const body of g.live) {
      const d = botOf(g, body)
      if (!d || d.dead) continue
      const r = body.circleRadius || radiusOf(d.tier, g.scale)
      sprite(d.tier, body.position.x, body.position.y, r, body.angle, d.id, 1, {
        born: d.born,
        squash: d.squash,
        danger: d.overMs > 0 ? Math.min(1, d.overMs / 400) : 0,
      })
    }

    for (const f of g.fx) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, f.t) * 0.8
      ctx.fillStyle = f.color
      ctx.strokeStyle = f.color
      if (f.kind === 'spark') {
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * f.t, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.lineWidth = 5 * f.t
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * (1.15 + (1 - f.t) * 0.85), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.restore()

    if (g.phase === 'play') {
      const r = radiusOf(g.next, g.scale)
      sprite(g.next, g.dropX, g.dropY, r, 0, -1, 0.96)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.setLineDash([3, 6])
      ctx.beginPath()
      ctx.moveTo(g.dropX, g.dropY + r + 4)
      ctx.lineTo(g.dropX, g.dangerY)
      ctx.stroke()
      ctx.restore()
    }

    const px = vw - 58
    const py = 44
    const cell = ctx.createLinearGradient(px - 28, py - 28, px + 28, py + 28)
    cell.addColorStop(0, '#2a2a32')
    cell.addColorStop(1, '#141418')
    ctx.fillStyle = cell
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(px - 28, py - 28, 56, 56, 14)
    ctx.fill()
    ctx.stroke()
    sprite(g.phase === 'title' ? 0 : g.after, px, py, 18, 0, -2)
    ctx.fillStyle = '#6b6b72'
    ctx.font = '9px ui-sans-serif, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('NEXT', px, py + 42)

    if (g.phase === 'play' && g.warnMs > 0) {
      const left = Math.max(0, 5 - g.warnMs / 1000)
      ctx.save()
      ctx.fillStyle = `rgba(239,68,68,${0.75 + Math.sin(performance.now() / 80) * 0.2})`
      ctx.font = '700 42px ui-sans-serif, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(left.toFixed(1), vw / 2, g.bowl.y + 48)
      ctx.font = '10px ui-sans-serif, Helvetica, sans-serif'
      ctx.fillStyle = 'rgba(239,68,68,0.8)'
      ctx.fillText('CLEAR THE LINE', vw / 2, g.bowl.y + 64)
      ctx.restore()
    }

    if (g.shake > 0.02) ctx.restore()
  }

  return { draw, resize }
}

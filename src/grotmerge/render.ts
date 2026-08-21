import { TIERS, botOf, radiusOf, type Game } from './engine'

export type Renderer = {
  draw: (g: Game) => void
  resize: (w: number, h: number) => void
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const imgs: HTMLImageElement[] = TIERS.map((_, i) => {
    const im = new Image()
    im.src = `/grot_bot_merge/bots/bot_${String(i).padStart(2, '0')}.png`
    return im
  })

  function resize(w: number, h: number) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function bot(img: HTMLImageElement, x: number, y: number, r: number, rot: number, alpha = 1) {
    const s = r * 2.08
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rot)
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, -s / 2, -s / 2, s, s)
    } else {
      ctx.fillStyle = '#888'
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  function draw(g: Game) {
    const vw = canvas.clientWidth
    const b = g.bowl
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

    // bowl
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 22)
    ctx.fillStyle = '#0c0c0e'
    ctx.fill()
    ctx.strokeStyle = '#2a2a2e'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    // danger line
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([7, 7])
    ctx.moveTo(b.x + 14, g.dangerY)
    ctx.lineTo(b.x + b.w - 14, g.dangerY)
    ctx.strokeStyle = 'rgba(244,63,94,0.55)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 22)
    ctx.clip()

    for (const body of g.live) {
      const d = botOf(g, body)
      if (!d || d.dead) continue
      const r = body.circleRadius || radiusOf(d.tier, g.scale)
      bot(imgs[d.tier], body.position.x, body.position.y, r, body.angle)
    }

    for (const f of g.fx) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, f.t) * 0.7
      ctx.strokeStyle = f.color
      ctx.lineWidth = 4 * f.t
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r * (1.2 + (1 - f.t) * 0.7), 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()

    if (g.phase === 'play') {
      const r = radiusOf(g.next, g.scale)
      bot(imgs[g.next], g.dropX, g.dropY, r, 0, 0.95)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.setLineDash([3, 6])
      ctx.beginPath()
      ctx.moveTo(g.dropX, g.dropY + r + 4)
      ctx.lineTo(g.dropX, g.dangerY)
      ctx.stroke()
      ctx.restore()
    }

    // next preview
    const px = vw - 58
    const py = 46
    ctx.fillStyle = '#141416'
    ctx.strokeStyle = '#2a2a2e'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(px - 28, py - 28, 56, 56, 12)
    ctx.fill()
    ctx.stroke()
    bot(imgs[g.phase === 'title' ? 0 : g.after], px, py, 18, 0)
    ctx.fillStyle = '#6b6b72'
    ctx.font = '9px ui-sans-serif, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.18em'
    ctx.fillText('NEXT', px, py + 42)
  }

  return { draw, resize }
}

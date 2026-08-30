import { useEffect, useRef } from 'react'

export type LifeKind = 'dad' | 'coffee' | 'krue' | 'x'

type Props = {
  src: string
  alt: string
  life: LifeKind
  reduced: boolean
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  life: number
  max: number
  phase: number
}

export default function LivingArt({ src, alt, life, reduced }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointer = useRef({ x: 0.5, y: 0.5, heat: 0.55 })

  useEffect(() => {
    if (reduced) return
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let visible = false
    let running = true
    let t = 0
    let parts: Particle[] = []

    const resize = () => {
      const box = wrap.getBoundingClientRect()
      w = Math.max(1, Math.floor(box.width))
      h = Math.max(1, Math.floor(box.height))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && pointer.current.heat < 0.55) pointer.current.heat = 0.55
      },
      { threshold: 0.15 },
    )
    io.observe(wrap)

    const onMove = (e: PointerEvent) => {
      const box = wrap.getBoundingClientRect()
      pointer.current.x = (e.clientX - box.left) / Math.max(box.width, 1)
      pointer.current.y = (e.clientY - box.top) / Math.max(box.height, 1)
      pointer.current.heat = 1
    }
    const onLeave = () => {
      pointer.current.heat = 0.55
    }

    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    resize()
    window.addEventListener('resize', resize)

    const spawn = (kind: LifeKind) => {
      const px = pointer.current.x
      const py = pointer.current.y
      if (kind === 'dad') {
        const n = 3
        for (let i = 0; i < n; i += 1) {
          parts.push({
            x: (0.34 + Math.random() * 0.32 + (px - 0.5) * 0.12) * w,
            y: (0.4 + Math.random() * 0.22 + (py - 0.5) * 0.08) * h,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -0.9 - Math.random() * 1.1,
            r: 2.2 + Math.random() * 3.4,
            a: 0.85,
            life: 0,
            max: 34 + Math.random() * 22,
            phase: Math.random() * Math.PI * 2,
          })
        }
      } else if (kind === 'coffee') {
        for (let i = 0; i < 2; i += 1) {
          parts.push({
            x: (0.32 + Math.random() * 0.38 + (px - 0.5) * 0.14) * w,
            y: (0.28 + Math.random() * 0.2) * h,
            vx: (Math.random() - 0.5) * 0.28,
            vy: -0.7 - Math.random() * 0.55,
            r: 28 + Math.random() * 36,
            a: 0.55,
            life: 0,
            max: 90 + Math.random() * 50,
            phase: Math.random() * Math.PI * 2,
          })
        }
      } else if (kind === 'krue') {
        for (let i = 0; i < 2; i += 1) {
          parts.push({
            x: Math.random() * w,
            y: h * (0.55 + Math.random() * 0.38),
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.35 - Math.random() * 0.45,
            r: 1.6 + Math.random() * 2.8,
            a: 0.75,
            life: 0,
            max: 70 + Math.random() * 40,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const drawGlint = (heat: number) => {
      const sweep = ((t * (0.012 + heat * 0.01)) % 1.15) - 0.08
      const cx = w * (0.12 + sweep * 0.78 + (pointer.current.x - 0.5) * 0.08)
      const g = ctx.createLinearGradient(cx - 70, 0, cx + 70, h)
      g.addColorStop(0, 'rgba(255,244,220,0)')
      g.addColorStop(0.42, `rgba(255,236,200,${0.18 + heat * 0.16})`)
      g.addColorStop(0.5, `rgba(255,252,235,${0.55 + heat * 0.28})`)
      g.addColorStop(0.58, `rgba(255,236,200,${0.18 + heat * 0.16})`)
      g.addColorStop(1, 'rgba(255,244,220,0)')
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(cx - 56, 0)
      ctx.lineTo(cx + 8, 0)
      ctx.lineTo(cx + 86, h)
      ctx.lineTo(cx + 10, h)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawShimmer = (heat: number) => {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.52, 8, w * 0.5, h * 0.5, w * 0.38)
      glow.addColorStop(0, `rgba(255,140,60,${0.18 + heat * 0.16})`)
      glow.addColorStop(0.55, `rgba(196,58,26,${0.08 + heat * 0.08})`)
      glow.addColorStop(1, 'rgba(196,58,26,0)')
      ctx.fillStyle = glow
      ctx.fillRect(w * 0.2, h * 0.28, w * 0.6, h * 0.42)

      for (let i = 0; i < 10; i += 1) {
        const x = w * (0.3 + i * 0.042) + Math.sin(t * 0.06 + i * 0.8) * (10 + heat * 10)
        const g = ctx.createLinearGradient(x, h * 0.22, x, h * 0.68)
        g.addColorStop(0, 'rgba(255,190,110,0)')
        g.addColorStop(0.5, `rgba(255,176,90,${0.16 + heat * 0.14})`)
        g.addColorStop(1, 'rgba(255,190,110,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 9
        ctx.beginPath()
        ctx.moveTo(x, h * 0.26)
        ctx.quadraticCurveTo(x + Math.sin(t * 0.08 + i) * 16, h * 0.46, x, h * 0.66)
        ctx.stroke()
      }
      ctx.restore()
    }

    const tick = () => {
      if (!running) return
      t += 1
      pointer.current.heat *= 0.985
      if (visible && pointer.current.heat < 0.55) pointer.current.heat = 0.55
      const heat = visible ? pointer.current.heat : 0

      ctx.clearRect(0, 0, w, h)
      if (visible) {
        const rate =
          life === 'x' ? 0 : life === 'dad' ? 0.85 + heat * 0.5 : life === 'coffee' ? 0.7 + heat * 0.45 : 0.55 + heat * 0.4
        if (Math.random() < rate) spawn(life)
        if (life === 'dad') drawShimmer(heat)
        if (life === 'x') drawGlint(heat)

        parts = parts.filter((p) => {
          p.life += 1
          p.x += p.vx + Math.sin(t * 0.06 + p.phase) * (life === 'coffee' ? 0.85 : 0.2)
          p.y += p.vy
          const k = 1 - p.life / p.max
          if (k <= 0) return false

          if (life === 'coffee') {
            const rise = p.r * (1 - k) * 1.35
            ctx.beginPath()
            ctx.strokeStyle = `rgba(243,234,216,${p.a * k})`
            ctx.lineWidth = 2.4
            ctx.moveTo(p.x, p.y)
            ctx.quadraticCurveTo(
              p.x + Math.sin(p.phase + t * 0.05) * 18,
              p.y - rise * 0.45,
              p.x + Math.sin(p.phase + 1.2) * 12,
              p.y - rise,
            )
            ctx.stroke()
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${p.a * k * 0.45})`
            ctx.lineWidth = 1.1
            ctx.moveTo(p.x + 3, p.y)
            ctx.quadraticCurveTo(
              p.x + Math.sin(p.phase + t * 0.05) * 14,
              p.y - rise * 0.5,
              p.x + 6,
              p.y - rise * 0.92,
            )
            ctx.stroke()
          } else if (life === 'dad') {
            ctx.beginPath()
            ctx.fillStyle = `rgba(255,214,140,${p.a * k})`
            ctx.arc(p.x, p.y, p.r * (0.45 + k * 0.7), 0, Math.PI * 2)
            ctx.fill()
            if (k > 0.55) {
              ctx.beginPath()
              ctx.fillStyle = `rgba(255,255,230,${0.35 * k})`
              ctx.arc(p.x, p.y, p.r * 0.35, 0, Math.PI * 2)
              ctx.fill()
            }
          } else {
            ctx.beginPath()
            ctx.fillStyle = `rgba(220,70,28,${p.a * k})`
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.fillStyle = `rgba(255,170,80,${p.a * k * 0.55})`
            ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2)
            ctx.fill()
          }
          return true
        })
        if (parts.length > 140) parts = parts.slice(-140)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
    }
  }, [life, reduced])

  return (
    <div className="iron-living" ref={wrapRef}>
      <img src={src} alt={alt} />
      {reduced ? null : <canvas ref={canvasRef} className="iron-living-fx" aria-hidden />}
    </div>
  )
}

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
  const pointer = useRef({ x: 0.5, y: 0.5, heat: 0 })

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
      },
      { threshold: 0.2 },
    )
    io.observe(wrap)

    const onMove = (e: PointerEvent) => {
      const box = wrap.getBoundingClientRect()
      pointer.current.x = (e.clientX - box.left) / Math.max(box.width, 1)
      pointer.current.y = (e.clientY - box.top) / Math.max(box.height, 1)
      pointer.current.heat = 1
    }
    const onLeave = () => {
      pointer.current.heat = 0.15
    }

    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    resize()
    window.addEventListener('resize', resize)

    const spawn = (kind: LifeKind, heat: number) => {
      const px = pointer.current.x
      const py = pointer.current.y
      if (kind === 'dad') {
        const n = heat > 0.4 ? 2 : 1
        for (let i = 0; i < n; i += 1) {
          parts.push({
            x: (0.38 + Math.random() * 0.24 + (px - 0.5) * 0.1) * w,
            y: (0.44 + Math.random() * 0.18 + (py - 0.5) * 0.06) * h,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.45 - Math.random() * 0.55,
            r: 1.1 + Math.random() * 2.2,
            a: 0.45,
            life: 0,
            max: 28 + Math.random() * 22,
            phase: Math.random() * Math.PI * 2,
          })
        }
      } else if (kind === 'coffee') {
        parts.push({
          x: (0.38 + Math.random() * 0.28 + (px - 0.5) * 0.12) * w,
          y: (0.32 + Math.random() * 0.18) * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.35 - Math.random() * 0.4,
          r: 10 + Math.random() * 16,
          a: 0.22,
          life: 0,
          max: 70 + Math.random() * 40,
          phase: Math.random() * Math.PI * 2,
        })
      } else if (kind === 'krue') {
        parts.push({
          x: Math.random() * w,
          y: h * (0.62 + Math.random() * 0.3),
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.12 - Math.random() * 0.22,
          r: 0.7 + Math.random() * 1.6,
          a: 0.35,
          life: 0,
          max: 80 + Math.random() * 50,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    const drawGlint = (heat: number) => {
      const sweep = ((t * (0.004 + heat * 0.006)) % 1.4) - 0.2
      const cx = w * (0.28 + sweep * 0.5 + (pointer.current.x - 0.5) * 0.06)
      const g = ctx.createLinearGradient(cx - 28, 0, cx + 28, h)
      g.addColorStop(0, 'rgba(243,234,216,0)')
      g.addColorStop(0.45, `rgba(243,234,216,${0.05 + heat * 0.08})`)
      g.addColorStop(0.5, `rgba(255,236,210,${0.16 + heat * 0.18})`)
      g.addColorStop(0.55, `rgba(243,234,216,${0.05 + heat * 0.08})`)
      g.addColorStop(1, 'rgba(243,234,216,0)')
      ctx.save()
      ctx.globalCompositeOperation = 'soft-light'
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(cx - 40, 0)
      ctx.lineTo(cx + 18, 0)
      ctx.lineTo(cx + 58, h)
      ctx.lineTo(cx, h)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawShimmer = (heat: number) => {
      ctx.save()
      ctx.globalCompositeOperation = 'soft-light'
      for (let i = 0; i < 7; i += 1) {
        const x = w * (0.36 + i * 0.045) + Math.sin(t * 0.03 + i * 0.9) * (4 + heat * 6)
        const g = ctx.createLinearGradient(x, h * 0.28, x, h * 0.62)
        g.addColorStop(0, 'rgba(255,180,120,0)')
        g.addColorStop(0.5, `rgba(255,196,140,${0.04 + heat * 0.06})`)
        g.addColorStop(1, 'rgba(255,180,120,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(x, h * 0.3)
        ctx.quadraticCurveTo(x + Math.sin(t * 0.05 + i) * 8, h * 0.46, x, h * 0.6)
        ctx.stroke()
      }
      ctx.restore()
    }

    const tick = () => {
      if (!running) return
      t += 1
      pointer.current.heat *= 0.96
      if (visible && pointer.current.heat < 0.22) pointer.current.heat = 0.22
      const heat = visible ? pointer.current.heat : 0

      ctx.clearRect(0, 0, w, h)
      if (visible) {
        const rate = life === 'x' ? 0 : life === 'dad' ? 0.35 + heat * 0.55 : 0.18 + heat * 0.35
        if (Math.random() < rate) spawn(life, heat)
        if (life === 'dad') drawShimmer(heat)
        if (life === 'x') drawGlint(heat)

        parts = parts.filter((p) => {
          p.life += 1
          p.x += p.vx + Math.sin(t * 0.05 + p.phase) * (life === 'coffee' ? 0.45 : 0.12)
          p.y += p.vy
          const k = 1 - p.life / p.max
          if (k <= 0) return false

          if (life === 'coffee') {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(243,234,216,${p.a * k})`
            ctx.lineWidth = 1.15
            const rise = p.r * (1 - k)
            ctx.moveTo(p.x, p.y + rise * 0.2)
            ctx.quadraticCurveTo(
              p.x + Math.sin(p.phase + t * 0.04) * 10,
              p.y - rise * 0.4,
              p.x + Math.sin(p.phase + 1) * 6,
              p.y - rise,
            )
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.fillStyle =
              life === 'dad'
                ? `rgba(255,210,150,${p.a * k})`
                : `rgba(196,58,26,${p.a * k})`
            ctx.arc(p.x, p.y, p.r * (life === 'dad' ? k : 1), 0, Math.PI * 2)
            ctx.fill()
          }
          return true
        })
        if (parts.length > 90) parts = parts.slice(-90)
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

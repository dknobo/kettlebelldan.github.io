import { useEffect, useRef } from 'react'

type Flake = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  rust: boolean
}

export default function IronField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let w = 0
    let h = 0
    let flakes: Flake[] = []
    let running = true

    const seed = () => {
      const density = reduce ? 28000 : 14000
      const n = Math.max(18, Math.min(70, Math.floor((w * h) / density)))
      flakes = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: 0.08 + Math.random() * 0.22,
        r: 0.6 + Math.random() * 2.4,
        a: 0.12 + Math.random() * 0.38,
        rust: Math.random() > 0.62,
      }))
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, w, h)
      for (const flake of flakes) {
        if (!reduce) {
          flake.x += flake.vx
          flake.y += flake.vy
          if (flake.y > h + 8) {
            flake.y = -8
            flake.x = Math.random() * w
          }
          if (flake.x < -8) flake.x = w + 8
          if (flake.x > w + 8) flake.x = -8
        }
        ctx.beginPath()
        ctx.fillStyle = flake.rust
          ? `rgba(196,58,26,${flake.a})`
          : `rgba(243,234,216,${flake.a * 0.55})`
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="iron-field" aria-hidden />
}

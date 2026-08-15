let ctx: AudioContext | null = null

function ac() {
  if (ctx) return ctx
  const C = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C) return null
  ctx = new C()
  return ctx
}

export function unlockAudio() {
  const c = ac()
  if (c?.state === 'suspended') void c.resume()
  preloadMusic()
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.16, slide?: number) {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function crack(dur = 0.14, gain = 0.16) {
  const c = ac()
  if (!c) return
  const n = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 900
  const g = c.createGain()
  const t = c.currentTime
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
  src.connect(f)
  f.connect(g)
  g.connect(c.destination)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export const sfx = {
  shoot(weapon: number) {
    tone(180 + weapon * 12, 0.05, 'triangle', 0.12)
    tone(520 + weapon * 20, 0.035, 'sine', 0.08)
  },
  railCharge() {
    tone(140, 0.16, 'sine', 0.12, 420)
  },
  rail() {
    tone(70, 0.18, 'sawtooth', 0.16, 40)
    tone(880, 0.07, 'square', 0.1)
  },
  dash() {
    tone(180, 0.12, 'sine', 0.18, 620)
    tone(90, 0.1, 'triangle', 0.1)
  },
  hit() {
    tone(240, 0.05, 'triangle', 0.1)
  },
  collect() {
    tone(700, 0.07, 'sine', 0.18)
    window.setTimeout(() => tone(1040, 0.1, 'triangle', 0.14), 35)
  },
  oneUp() {
    const notes = [523, 659, 784, 1046]
    notes.forEach((n, i) => {
      window.setTimeout(() => {
        tone(n, 0.13, 'sine', 0.17)
        tone(n * 2, 0.09, 'triangle', 0.055)
      }, i * 72)
    })
  },
  zap() {
    crack(0.16, 0.2)
    tone(90, 0.22, 'sawtooth', 0.18, 36)
    tone(320, 0.07, 'square', 0.12, 90)
    window.setTimeout(() => crack(0.08, 0.1), 40)
  },
  power() {
    tone(196, 0.12, 'sawtooth', 0.14, 392)
    tone(392, 0.18, 'triangle', 0.12)
    window.setTimeout(() => tone(523, 0.14, 'sine', 0.16), 70)
    window.setTimeout(() => tone(784, 0.2, 'triangle', 0.14), 140)
    window.setTimeout(() => tone(1046, 0.24, 'sine', 0.12), 210)
  },
  nova() {
    crack(0.28, 0.24)
    tone(56, 0.4, 'sawtooth', 0.24, 32)
    tone(160, 0.22, 'triangle', 0.16, 70)
    window.setTimeout(() => {
      tone(480, 0.18, 'sine', 0.18)
      crack(0.12, 0.14)
    }, 70)
    window.setTimeout(() => tone(720, 0.2, 'triangle', 0.14), 140)
    window.setTimeout(() => tone(980, 0.26, 'sine', 0.12), 210)
  },
  titan() {
    tone(48, 0.36, 'sine', 0.22)
    tone(72, 0.28, 'sawtooth', 0.16, 40)
    window.setTimeout(() => tone(110, 0.2, 'triangle', 0.14), 50)
    window.setTimeout(() => tone(165, 0.24, 'sine', 0.12), 120)
  },
  kill() {
    tone(210, 0.05, 'square', 0.1)
    tone(560, 0.08, 'sine', 0.18)
    window.setTimeout(() => tone(840, 0.1, 'triangle', 0.14), 28)
  },
  hurt() {
    tone(140, 0.2, 'sawtooth', 0.2, 55)
    tone(90, 0.16, 'triangle', 0.12)
  },
  level() {
    tone(440, 0.1, 'sine', 0.16)
    window.setTimeout(() => tone(660, 0.12, 'sine', 0.14), 50)
    window.setTimeout(() => tone(880, 0.16, 'triangle', 0.12), 110)
  },
  boss() {
    tone(80, 0.45, 'sine', 0.2, 46)
    tone(120, 0.3, 'triangle', 0.12)
  },
  win() {
    tone(523, 0.14, 'sine', 0.18)
    window.setTimeout(() => tone(659, 0.16, 'sine', 0.16), 90)
    window.setTimeout(() => tone(784, 0.26, 'triangle', 0.14), 180)
  },
  dead() {
    tone(200, 0.34, 'sine', 0.18, 60)
  },
}

// L1 Light Years, L2 Blazing Stars, L3 Urban Jungle 2061, L4 Dark Techno City,
// L5 They're Here — Eric Matyas, soundimage.org (CC-BY)
// Boss Star Run — bobjt, OpenGameArt (public domain)
const STAGE = [
  { src: '/xthegame/bgm-1.mp3', skip: 10 },
  { src: '/xthegame/bgm-2.mp3', skip: 12 },
  { src: '/xthegame/bgm-3.mp3', skip: 8 },
  { src: '/xthegame/bgm-4.mp3', skip: 7 },
  { src: '/xthegame/bgm-5.mp3', skip: 11 },
]
const BOSS = { src: '/xthegame/bgm-boss.mp3', skip: 5 }
const BGM_VOL = 0.28
const FADE_MS = 1600
const cache = new Map<string, HTMLAudioElement>()
let current: HTMLAudioElement | null = null
let currentSrc = ''
let fadeRaf = 0

function makeTrack(src: string, skip: number) {
  const a = new Audio(src)
  a.loop = true
  a.preload = 'auto'
  a.volume = 0
  a.addEventListener('timeupdate', () => {
    if (a.currentTime < 0.18 && skip > 0 && a.duration > skip + 4) a.currentTime = skip
  })
  return a
}

export function preloadMusic() {
  for (const t of [...STAGE, BOSS]) {
    if (cache.has(t.src)) continue
    const a = makeTrack(t.src, t.skip)
    a.load()
    cache.set(t.src, a)
  }
}

function seekReady(a: HTMLAudioElement, skip: number, then: () => void) {
  const go = () => {
    const dur = a.duration
    const at = Number.isFinite(dur) && dur > skip + 4 ? skip : 0
    try {
      a.currentTime = at
    } catch {
      /* not seekable yet */
    }
    then()
  }
  if (a.readyState >= 2) go()
  else a.addEventListener('canplay', go, { once: true })
}

function playSrc(src: string, skip: number) {
  preloadMusic()
  if (currentSrc === src && current && !current.paused) return
  const next = cache.get(src) ?? makeTrack(src, skip)
  cache.set(src, next)
  const prev = current && current !== next ? current : null
  current = next
  currentSrc = src

  seekReady(next, skip, () => {
    next.volume = 0
    void next.play().catch(() => {})
  })

  const t0 = performance.now()
  if (fadeRaf) cancelAnimationFrame(fadeRaf)
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / FADE_MS)
    const ease = k * k * (3 - 2 * k)
    next.volume = BGM_VOL * ease
    if (prev) {
      prev.volume = BGM_VOL * (1 - ease)
      if (k >= 1) {
        prev.pause()
        prev.volume = 0
      }
    }
    if (k < 1) fadeRaf = requestAnimationFrame(tick)
    else fadeRaf = 0
  }
  fadeRaf = requestAnimationFrame(tick)
}

export function startMusic() {
  playStageMusic(0, 'play')
}

export function playStageMusic(wave: number, phase: string) {
  const t = phase === 'boss' ? BOSS : STAGE[Math.max(0, Math.min(STAGE.length - 1, wave))]
  playSrc(t.src, t.skip)
}

export function stopMusic() {
  if (fadeRaf) cancelAnimationFrame(fadeRaf)
  fadeRaf = 0
  if (current) {
    current.pause()
    current.volume = 0
  }
  currentSrc = ''
}

export function setMusicPaused(on: boolean) {
  if (!current) return
  if (on) current.pause()
  else {
    current.volume = BGM_VOL
    void current.play().catch(() => {})
  }
}

export function duckMusic() {
  if (!current) return
  const node = current
  const start = node.volume
  const t0 = performance.now()
  if (fadeRaf) cancelAnimationFrame(fadeRaf)
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / 420)
    node.volume = start * (1 - k)
    if (k < 1) fadeRaf = requestAnimationFrame(tick)
    else {
      node.pause()
      node.volume = 0
      currentSrc = ''
      fadeRaf = 0
    }
  }
  fadeRaf = requestAnimationFrame(tick)
}

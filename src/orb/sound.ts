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
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.06, slide?: number) {
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

export const sfx = {
  hop() {
    tone(210, 0.055, 'sine', 0.035)
  },
  land() {
    tone(160, 0.04, 'triangle', 0.02)
  },
  collect(combo: number) {
    tone(523, 0.07, 'triangle', 0.05)
    window.setTimeout(() => tone(660 + Math.min(combo, 8) * 18, 0.1, 'sine', 0.045), 40)
  },
  perfect() {
    tone(784, 0.08, 'sine', 0.04)
    window.setTimeout(() => tone(1046, 0.12, 'triangle', 0.035), 55)
  },
  miss() {
    tone(140, 0.08, 'sine', 0.03)
  },
  pit() {
    tone(180, 0.16, 'sawtooth', 0.035, 55)
    window.setTimeout(() => tone(90, 0.22, 'sine', 0.05, 40), 40)
  },
  over() {
    tone(220, 0.28, 'sine', 0.05, 70)
  },
}

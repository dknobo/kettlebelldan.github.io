let ctx: AudioContext | null = null

function ac() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function unlockAudio() {
  ac()
}

export function pop() {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const n = Math.floor(c.sampleRate * 0.07)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const env = Math.pow(1 - i / n, 2.4)
    data[i] = (Math.random() * 2 - 1) * env
  }
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(1400, t)
  bp.frequency.exponentialRampToValueAtTime(420, t + 0.07)
  bp.Q.value = 0.9
  const g = c.createGain()
  g.gain.setValueAtTime(0.22, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  src.connect(bp)
  bp.connect(g)
  g.connect(c.destination)
  src.start(t)

  const o = c.createOscillator()
  const og = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(980, t)
  o.frequency.exponentialRampToValueAtTime(180, t + 0.1)
  og.gain.setValueAtTime(0.07, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  o.connect(og)
  og.connect(c.destination)
  o.start(t)
  o.stop(t + 0.11)
}

export function dropClick() {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(240, t)
  o.frequency.exponentialRampToValueAtTime(90, t + 0.06)
  g.gain.setValueAtTime(0.05, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  o.connect(g)
  g.connect(c.destination)
  o.start(t)
  o.stop(t + 0.08)
}

export function thud() {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(140, t)
  o.frequency.exponentialRampToValueAtTime(50, t + 0.22)
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
  o.connect(g)
  g.connect(c.destination)
  o.start(t)
  o.stop(t + 0.25)
}

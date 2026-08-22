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
  g.gain.setValueAtTime(0.32, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
  src.connect(bp)
  bp.connect(g)
  g.connect(c.destination)
  src.start(t)
  duckBed()

  const o = c.createOscillator()
  const og = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(980, t)
  o.frequency.exponentialRampToValueAtTime(180, t + 0.1)
  og.gain.setValueAtTime(0.11, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  o.connect(og)
  og.connect(c.destination)
  o.start(t)
  o.stop(t + 0.13)

  const o3 = c.createOscillator()
  const g3 = c.createGain()
  o3.type = 'triangle'
  o3.frequency.setValueAtTime(520, t)
  o3.frequency.exponentialRampToValueAtTime(140, t + 0.16)
  g3.gain.setValueAtTime(0.08, t)
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
  o3.connect(g3)
  g3.connect(c.destination)
  o3.start(t)
  o3.stop(t + 0.17)
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

type Bed = { master: GainNode; timer: number; step: number }
let bed: Bed | null = null

function hz(semi: number) {
  return 196 * Math.pow(2, semi / 12)
}

export function startBed() {
  const c = ac()
  if (!c || bed) return
  const audio = c
  const master = audio.createGain()
  master.gain.value = 0.13
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1600
  master.connect(lp)
  lp.connect(c.destination)
  const state: Bed = { master, timer: 0, step: 0 }
  bed = state
  const beat = 60 / 86
  const basses = [
    [0, 0, 7, 3, 0, 5, 7, 3],
    [5, 5, 3, 0, 7, 7, 10, 5],
    [3, 0, 3, 7, 5, 3, 0, 0],
    [7, 5, 3, 5, 0, 0, 10, 7],
  ]
  const leads = [
    [7, 10, 12, 10, 7, 5, 7, 12, 10, 7, 5, 3, 5, 7, 10, 7],
    [12, 10, 8, 7, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3, 5, 7],
    [5, 7, 10, 7, null, 5, 3, 0, 3, 5, 7, 10, 7, 5, 3, 5],
    [10, 12, 15, 12, 10, 7, 10, 12, 7, 5, 7, 10, 12, 10, 7, 5],
  ]
  function pulse() {
    if (bed !== state) return
    const t = audio.currentTime + 0.04
    const i = state.step
    const phrase = Math.floor(i / 16) % 4
    const bass = basses[phrase]
    const lead = leads[phrase]
    const b = bass[i % bass.length]
    const o = audio.createOscillator()
    const g = audio.createGain()
    o.type = 'sine'
    o.frequency.value = hz(b - 12)
    g.gain.setValueAtTime(0.55, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.6)
    o.connect(g)
    g.connect(master)
    o.start(t)
    o.stop(t + beat * 1.7)

    const n = lead[i % lead.length]
    if (n != null) {
      const o2 = audio.createOscillator()
      const g2 = audio.createGain()
      o2.type = 'triangle'
      o2.frequency.value = hz(n)
      g2.gain.setValueAtTime(0.26, t + beat * 0.5)
      g2.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.15)
      o2.connect(g2)
      g2.connect(master)
      o2.start(t + beat * 0.5)
      o2.stop(t + beat * 1.2)
    }

    if (i % 2 === 0) {
      const nlen = Math.floor(audio.sampleRate * 0.03)
      const buf = audio.createBuffer(1, nlen, audio.sampleRate)
      const data = buf.getChannelData(0)
      for (let k = 0; k < nlen; k++) data[k] = (Math.random() * 2 - 1) * (1 - k / nlen)
      const src = audio.createBufferSource()
      src.buffer = buf
      const hp = audio.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 4000
      const g3 = audio.createGain()
      g3.gain.value = 0.14
      src.connect(hp)
      hp.connect(g3)
      g3.connect(master)
      src.start(t)
    }

    state.step++
    state.timer = window.setTimeout(pulse, beat * 1000)
  }
  pulse()
}

export function stopBed() {
  if (!bed) return
  window.clearTimeout(bed.timer)
  const m = bed.master
  const c = ac()
  if (c) {
    m.gain.cancelScheduledValues(c.currentTime)
    m.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.25)
  }
  bed = null
}

export function duckBed() {
  if (!bed) return
  const c = ac()
  if (!c) return
  const g = bed.master.gain
  const t = c.currentTime
  g.cancelScheduledValues(t)
  g.setValueAtTime(0.05, t)
  g.linearRampToValueAtTime(0.13, t + 0.22)
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

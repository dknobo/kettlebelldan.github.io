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

type Bed = { master: GainNode; timer: number; step: number; hiss: AudioBufferSourceNode }
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
  const beat = 60 / 72
  // Imaj7, vi7, IVmaj7, V7 — lo-fi game lounge
  const chords = [
    [0, 4, 7, 11],
    [-3, 0, 4, 7],
    [-7, -3, 0, 4],
    [-5, -1, 2, 5],
  ]
  const hooks = [
    [11, null, 12, 11, 7, null, 9, 7],
    [12, 14, 12, 7, null, 4, 7, 9],
    [7, null, 4, 7, 9, 7, 4, null],
    [14, 12, 11, 7, 9, null, 7, 4],
  ]
  // looping vinyl hiss
  const hissN = audio.sampleRate * 2
  const hiss = audio.createBuffer(1, hissN, audio.sampleRate)
  const hd = hiss.getChannelData(0)
  for (let i = 0; i < hissN; i++) hd[i] = (Math.random() * 2 - 1) * 0.04
  const hissSrc = audio.createBufferSource()
  hissSrc.buffer = hiss
  hissSrc.loop = true
  const hissG = audio.createGain()
  hissG.gain.value = 0.22
  const hissF = audio.createBiquadFilter()
  hissF.type = 'highpass'
  hissF.frequency.value = 1800
  hissSrc.connect(hissF)
  hissF.connect(hissG)
  hissG.connect(master)
  hissSrc.start()
  const state: Bed = { master, timer: 0, step: 0, hiss: hissSrc }
  bed = state

  function tone(freq: number, type: OscillatorType, start: number, dur: number, gain: number) {
    const o = audio.createOscillator()
    const g = audio.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(gain, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g)
    g.connect(master)
    o.start(start)
    o.stop(start + dur + 0.02)
  }

  function pulse() {
    if (bed !== state) return
    const t = audio.currentTime + 0.05
    const i = state.step
    const bar = Math.floor(i / 8)
    const chord = chords[bar % chords.length]
    const hook = hooks[bar % hooks.length]
    const stepIn = i % 8

    if (stepIn === 0) {
      for (const s of chord) {
        tone(hz(s - 12), 'sine', t, beat * 7.4, 0.11)
        tone(hz(s), 'triangle', t, beat * 7.2, 0.045)
      }
    }

    const note = hook[stepIn]
    if (note != null && (bar + stepIn) % 3 !== 0) {
      const swing = stepIn % 2 === 1 ? beat * 0.12 : 0
      tone(hz(note + 12), 'sine', t + swing, beat * 1.4, 0.07)
    }

    if (stepIn === 0 || stepIn === 4) {
      tone(hz(-24), 'sine', t, beat * 0.35, 0.09)
    }
    if (stepIn % 2 === 0) {
      const nlen = Math.floor(audio.sampleRate * 0.025)
      const buf = audio.createBuffer(1, nlen, audio.sampleRate)
      const data = buf.getChannelData(0)
      for (let k = 0; k < nlen; k++) data[k] = (Math.random() * 2 - 1) * (1 - k / nlen)
      const src = audio.createBufferSource()
      src.buffer = buf
      const hp = audio.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 5000
      const g3 = audio.createGain()
      g3.gain.value = 0.05
      src.connect(hp)
      hp.connect(g3)
      g3.connect(master)
      src.start(t + (stepIn % 4 === 2 ? beat * 0.1 : 0))
    }

    state.step++
    state.timer = window.setTimeout(pulse, beat * 1000)
  }
  pulse()
}

export function stopBed() {
  if (!bed) return
  window.clearTimeout(bed.timer)
  try {
    bed.hiss.stop()
  } catch {
    /* already stopped */
  }
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

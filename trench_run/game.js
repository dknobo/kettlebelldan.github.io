(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const persist = document.createElement("canvas");
  const pctx = persist.getContext("2d");

  const lampShields = document.getElementById("lamp-shields");
  const lampLock = document.getElementById("lamp-lock");
  const lampForce = document.getElementById("lamp-force");
  const lampTorp = document.getElementById("lamp-torp");

  const PHOS = "#5dff8a";
  const PHOS_DIM = "#1f7a42";
  const AMBER = "#ffb000";
  const RED = "#ff3a2a";
  const LASER_R = "#ff4d3a";
  const LASER_G = "#3aff6a";
  const TIE_C = "#ffe14a";
  const WHITE = "#d8ffe8";
  const DS = "#9fd0bc";
  const FORCE = "#8fd0ff";
  const FIRE = "#ff7a18";
  const MAG = "#ff5ad6";

  const HS_KEY = "trench-run-hs";

  const FONT = {
    A: [[0, 1, 0.5, 0, 1, 1], [0.18, 0.62, 0.82, 0.62]],
    B: [[0, 0, 0, 1], [0, 0, 0.72, 0, 0.95, 0.18, 0.95, 0.38, 0.7, 0.5, 0, 0.5], [0, 0.5, 0.75, 0.5, 1, 0.66, 1, 0.86, 0.72, 1, 0, 1]],
    C: [[0.95, 0.18, 0.72, 0, 0.28, 0, 0, 0.22, 0, 0.78, 0.28, 1, 0.72, 1, 0.95, 0.82]],
    D: [[0, 0, 0, 1], [0, 0, 0.62, 0, 1, 0.28, 1, 0.72, 0.62, 1, 0, 1]],
    E: [[1, 0, 0, 0, 0, 1, 1, 1], [0, 0.5, 0.72, 0.5]],
    F: [[0, 1, 0, 0, 1, 0], [0, 0.5, 0.68, 0.5]],
    G: [[0.95, 0.2, 0.7, 0, 0.28, 0, 0, 0.24, 0, 0.76, 0.28, 1, 0.78, 1, 1, 0.76, 1, 0.55, 0.55, 0.55]],
    H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]],
    I: [[0.2, 0, 0.8, 0], [0.5, 0, 0.5, 1], [0.2, 1, 0.8, 1]],
    J: [[0.15, 0, 1, 0], [0.78, 0, 0.78, 0.72, 0.55, 1, 0.22, 1, 0, 0.78]],
    K: [[0, 0, 0, 1], [1, 0, 0, 0.5, 1, 1]],
    L: [[0, 0, 0, 1, 1, 1]],
    M: [[0, 1, 0, 0, 0.5, 0.55, 1, 0, 1, 1]],
    N: [[0, 1, 0, 0, 1, 1, 1, 0]],
    O: [[0.3, 0, 0.7, 0, 1, 0.25, 1, 0.75, 0.7, 1, 0.3, 1, 0, 0.75, 0, 0.25, 0.3, 0]],
    P: [[0, 1, 0, 0, 0.72, 0, 1, 0.18, 1, 0.4, 0.72, 0.55, 0, 0.55]],
    Q: [[0.3, 0, 0.7, 0, 1, 0.25, 1, 0.75, 0.7, 1, 0.3, 1, 0, 0.75, 0, 0.25, 0.3, 0], [0.55, 0.7, 1, 1]],
    R: [[0, 1, 0, 0, 0.72, 0, 1, 0.18, 1, 0.4, 0.7, 0.55, 0, 0.55], [0.55, 0.55, 1, 1]],
    S: [[0.95, 0.18, 0.7, 0, 0.28, 0, 0, 0.2, 0, 0.38, 0.28, 0.5, 0.72, 0.5, 1, 0.62, 1, 0.82, 0.72, 1, 0.28, 1, 0.05, 0.82]],
    T: [[0, 0, 1, 0], [0.5, 0, 0.5, 1]],
    U: [[0, 0, 0, 0.75, 0.28, 1, 0.72, 1, 1, 0.75, 1, 0]],
    V: [[0, 0, 0.5, 1, 1, 0]],
    W: [[0, 0, 0.2, 1, 0.5, 0.45, 0.8, 1, 1, 0]],
    X: [[0, 0, 1, 1], [1, 0, 0, 1]],
    Y: [[0, 0, 0.5, 0.5, 1, 0], [0.5, 0.5, 0.5, 1]],
    Z: [[0, 0, 1, 0, 0, 1, 1, 1]],
    "0": [[0.25, 0, 0.75, 0, 1, 0.25, 1, 0.75, 0.75, 1, 0.25, 1, 0, 0.75, 0, 0.25, 0.25, 0], [0.2, 0.8, 0.8, 0.2]],
    "1": [[0.25, 0.25, 0.5, 0, 0.5, 1], [0.2, 1, 0.8, 1]],
    "2": [[0.05, 0.22, 0.28, 0, 0.75, 0, 1, 0.2, 1, 0.4, 0, 1, 1, 1]],
    "3": [[0.1, 0.15, 0.35, 0, 0.75, 0, 1, 0.18, 1, 0.38, 0.7, 0.5, 1, 0.62, 1, 0.82, 0.72, 1, 0.28, 1, 0.05, 0.82], [0.45, 0.5, 0.7, 0.5]],
    "4": [[0.72, 1, 0.72, 0], [0.72, 0, 0, 0.72, 1, 0.72]],
    "5": [[1, 0, 0, 0, 0, 0.45, 0.7, 0.45, 1, 0.6, 1, 0.82, 0.7, 1, 0.25, 1, 0, 0.82]],
    "6": [[0.9, 0.12, 0.6, 0, 0.28, 0, 0, 0.28, 0, 0.78, 0.28, 1, 0.72, 1, 1, 0.8, 1, 0.58, 0.72, 0.48, 0, 0.48]],
    "7": [[0, 0, 1, 0, 0.35, 1]],
    "8": [[0.3, 0, 0.7, 0, 0.95, 0.18, 0.95, 0.38, 0.7, 0.5, 0.3, 0.5, 0.05, 0.38, 0.05, 0.18, 0.3, 0], [0.3, 0.5, 0.7, 0.5, 1, 0.66, 1, 0.86, 0.7, 1, 0.3, 1, 0, 0.86, 0, 0.66, 0.3, 0.5]],
    "9": [[1, 0.52, 0.28, 0.52, 0, 0.38, 0, 0.18, 0.28, 0, 0.72, 0, 1, 0.22, 1, 0.78, 0.72, 1, 0.35, 1, 0.12, 0.85]],
    " ": [],
    "-": [[0.15, 0.5, 0.85, 0.5]],
    ".": [[0.4, 0.85, 0.6, 0.85, 0.6, 1, 0.4, 1, 0.4, 0.85]],
    ":": [[0.4, 0.2, 0.6, 0.2, 0.6, 0.38, 0.4, 0.38, 0.4, 0.2], [0.4, 0.7, 0.6, 0.7, 0.6, 0.88, 0.4, 0.88, 0.4, 0.7]],
    "*": [[0.5, 0.05, 0.5, 0.95], [0.1, 0.5, 0.9, 0.5], [0.18, 0.18, 0.82, 0.82], [0.82, 0.18, 0.18, 0.82]],
    "+": [[0.5, 0.15, 0.5, 0.85], [0.15, 0.5, 0.85, 0.5]],
    "/": [[0.85, 0, 0.15, 1]],
    "'": [[0.4, 0, 0.4, 0.28]],
    "!": [[0.5, 0, 0.5, 0.62], [0.5, 0.82, 0.5, 1]],
  };

  let W = 960, H = 720, FOV = 420, UI = 1;
  let last = 0, shake = 0, flash = 0, muted = false;

  const keys = new Set();
  const mouse = { x: 0, y: 0, down: false, locked: false };

  const S = {
    mode: "attract",
    t: 0,
    stageT: 0,
    score: 0,
    combo: 0,
    comboT: 0,
    bestCombo: 0,
    shields: 6,
    maxShields: 6,
    torps: 2,
    invuln: 0,
    shipX: 0,
    shipY: 0,
    stickX: 0,
    stickY: 0,
    bank: 0,
    speed: 18,
    force: false,
    forceT: 0,
    lock: false,
    range: 99999,
    kills: 0,
    wave: 0,
    trenchDist: 0,
    trenchLen: 520,
    portZ: 40,
    firedTorp: false,
    torp: null,
    worldX: 0,
    worldY: 0,
    hyperspace: 0,
    bootI: 0,
    bootT: 0,
    briefT: 0,
    overT: 0,
    winT: 0,
    pause: false,
    comm: "",
    commT: 0,
    initials: "___",
    initI: 0,
    demo: 0,
  };

  let stars = [];
  let enemies = [];
  let bullets = [];
  let particles = [];
  let popups = [];
  let spawnQ = [];
  let events = [];

  const audio = {
    ctx: null,
    master: null,
    engine: null,
    engineGain: null,
    forceOsc: null,
    ready: false,
    init() {
      if (this.ready) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.28;
      this.master.connect(this.ctx.destination);
      const eg = this.ctx.createGain();
      eg.gain.value = 0.0;
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 42;
      const flt = this.ctx.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.value = 180;
      osc.connect(flt);
      flt.connect(eg);
      eg.connect(this.master);
      osc.start();
      this.engine = osc;
      this.engineGain = eg;
      this.ready = true;
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ready || muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(vol || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq) {
      if (!this.ready || muted) return;
      const t = this.ctx.currentTime;
      const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = this.ctx.createBufferSource();
      src.buffer = n;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 800;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    laser() {
      this.beep(920, 0.09, "square", 0.07, 180);
      this.beep(1380, 0.05, "square", 0.03, 400);
    },
    torp() {
      this.beep(180, 0.45, "sawtooth", 0.12, 60);
      this.noise(0.3, 0.1, 300);
    },
    explosion(big) {
      this.noise(big ? 0.55 : 0.22, big ? 0.32 : 0.16, big ? 220 : 700);
      this.beep(big ? 90 : 160, big ? 0.4 : 0.18, "sawtooth", 0.1, 40);
    },
    hit() {
      this.beep(140, 0.16, "square", 0.12, 70);
      this.noise(0.18, 0.2, 400);
    },
    r2() {
      const a = 900 + Math.random() * 1400;
      this.beep(a, 0.07 + Math.random() * 0.06, "sine", 0.06, a * (Math.random() > 0.5 ? 1.4 : 0.6));
      setTimeout(() => {
        if (!this.ready) return;
        const b = 700 + Math.random() * 1600;
        this.beep(b, 0.05, "sine", 0.05, b * 0.7);
      }, 70);
    },
    ui() { this.beep(660, 0.06, "square", 0.05); },
    lock() { this.beep(1400, 0.08, "square", 0.05); this.beep(1800, 0.1, "square", 0.04); },
    alarm() { this.beep(440, 0.12, "square", 0.08); this.beep(320, 0.12, "square", 0.08); },
    forceOn() {
      this.beep(220, 0.4, "sine", 0.06, 440);
      this.beep(330, 0.5, "sine", 0.04, 660);
    },
    tick() {
      if (!this.ready || !this.engine) return;
      const playing = S.mode === "space" || S.mode === "surface" || S.mode === "trench" || S.mode === "port";
      const target = muted || !playing ? 0 : 0.05 + S.speed / 400;
      const g = this.engineGain.gain;
      const t = this.ctx.currentTime;
      g.setTargetAtTime(target, t, 0.08);
      this.engine.frequency.setTargetAtTime(38 + S.speed * 0.7, t, 0.1);
    },
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function resize() {
    const crt = document.getElementById("crt");
    const r = crt.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(640, Math.floor(r.width * dpr));
    H = Math.max(480, Math.floor(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    persist.width = W;
    persist.height = H;
    FOV = H * 0.62;
    UI = Math.max(0.8, H / 720);
  }

  function camOn() {
    return S.mode === "space" || S.mode === "surface" || S.mode === "trench" || S.mode === "port" || S.mode === "dead";
  }

  function project(x, y, z) {
    if (z < 0.35) return null;
    const s = FOV / z;
    const cx = camOn() ? S.worldX : 0;
    const cy = camOn() ? S.worldY : 0;
    return { x: W / 2 + (x - cx) * s, y: H / 2 - (y - cy) * s, s, z };
  }

  function rotY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
  }
  function rotX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  }
  function rotZ(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
  }

  function glowLine(g, x1, y1, x2, y2, color, width, bloom) {
    g.strokeStyle = color;
    g.lineCap = "round";
    if (bloom !== false) {
      g.globalAlpha = 0.22;
      g.lineWidth = (width || 1.2) * 5;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.lineWidth = width || 1.2;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  function drawPoly(g, pts, color, width) {
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length - 1; i++) {
      glowLine(g, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, color, width);
    }
  }

  function drawModel(g, edges, x, y, z, rx, ry, rz, scale, color, width) {
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      let a = [e[0] * scale, e[1] * scale, e[2] * scale];
      let b = [e[3] * scale, e[4] * scale, e[5] * scale];
      if (rx) { a = rotX(a, rx); b = rotX(b, rx); }
      if (ry) { a = rotY(a, ry); b = rotY(b, ry); }
      if (rz) { a = rotZ(a, rz); b = rotZ(b, rz); }
      const p1 = project(a[0] + x, a[1] + y, a[2] + z);
      const p2 = project(b[0] + x, b[1] + y, b[2] + z);
      if (!p1 || !p2) continue;
      glowLine(g, p1.x, p1.y, p2.x, p2.y, color, width || 1.15);
    }
  }

  function hexWing(x) {
    const r = 1.15;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      pts.push([x, r * Math.cos(a), r * Math.sin(a)]);
    }
    const e = [];
    for (let i = 0; i < 6; i++) {
      const n = (i + 1) % 6;
      e.push([pts[i][0], pts[i][1], pts[i][2], pts[n][0], pts[n][1], pts[n][2]]);
    }
    e.push([x, r * 0.55, 0, x, -r * 0.55, 0]);
    e.push([x, 0, r * 0.55, x, 0, -r * 0.55]);
    return e;
  }

  function makeTIE() {
    const e = [];
    e.push(...hexWing(-1.35), ...hexWing(1.35));
    const cr = 0.38;
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2;
      const a1 = ((i + 1) / 8) * Math.PI * 2;
      e.push([
        cr * Math.cos(a0), cr * Math.sin(a0) * 0.85, 0,
        cr * Math.cos(a1), cr * Math.sin(a1) * 0.85, 0,
      ]);
      e.push([
        cr * Math.cos(a0), 0, cr * Math.sin(a0) * 0.85,
        cr * Math.cos(a1), 0, cr * Math.sin(a1) * 0.85,
      ]);
    }
    e.push([-1.35, 0, 0, -0.38, 0, 0], [0.38, 0, 0, 1.35, 0, 0]);
    return e;
  }

  function makeVader() {
    const e = [];
    const wing = (x, fold) => {
      const pts = [
        [x, 1.0, 0.9], [x, 0.15, 1.15], [x, -0.7, 0.7],
        [x, -0.7, -0.7], [x, 0.15, -1.15], [x, 1.0, -0.9],
      ];
      for (let i = 0; i < pts.length; i++) {
        const n = (i + 1) % pts.length;
        e.push([pts[i][0], pts[i][1], pts[i][2], pts[n][0], pts[n][1], pts[n][2]]);
        e.push([pts[i][0], pts[i][1], pts[i][2], pts[i][0] + fold, pts[i][1] * 0.7, pts[i][2] * 0.7]);
      }
    };
    wing(-1.2, -0.35);
    wing(1.2, 0.35);
    const cr = 0.4;
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
      e.push([cr * Math.cos(a0), cr * Math.sin(a0), 0, cr * Math.cos(a1), cr * Math.sin(a1), 0]);
    }
    e.push([-1.2, 0.2, 0, -0.4, 0, 0], [0.4, 0, 0, 1.2, 0.2, 0]);
    return e;
  }

  function makeOcta(s) {
    const p = [[s, 0, 0], [-s, 0, 0], [0, s, 0], [0, -s, 0], [0, 0, s], [0, 0, -s]];
    const idx = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [4, 3], [3, 5], [5, 2]];
    return idx.map(([a, b]) => [p[a][0], p[a][1], p[a][2], p[b][0], p[b][1], p[b][2]]);
  }

  function makeTower() {
    return [
      [-0.8, 0, -0.8, 0.8, 0, -0.8], [0.8, 0, -0.8, 0.8, 0, 0.8],
      [0.8, 0, 0.8, -0.8, 0, 0.8], [-0.8, 0, 0.8, -0.8, 0, -0.8],
      [-0.8, 0, -0.8, 0, 2.4, 0], [0.8, 0, -0.8, 0, 2.4, 0],
      [0.8, 0, 0.8, 0, 2.4, 0], [-0.8, 0, 0.8, 0, 2.4, 0],
      [-0.35, 2.4, -0.35, 0.35, 2.4, -0.35], [0.35, 2.4, -0.35, 0.35, 2.4, 0.35],
      [0.35, 2.4, 0.35, -0.35, 2.4, 0.35], [-0.35, 2.4, 0.35, -0.35, 2.4, -0.35],
    ];
  }

  const MODEL_TIE = makeTIE();
  const MODEL_VADER = makeVader();
  const MODEL_OCTA = makeOcta(0.55);
  const MODEL_TOWER = makeTower();

  function deathStarEdges(mer, par) {
    const e = [];
    const R = 1;
    for (let i = 0; i < mer; i++) {
      const th = (i / mer) * Math.PI * 2;
      for (let j = 0; j < par; j++) {
        const p0 = (j / par) * Math.PI - Math.PI / 2;
        const p1 = ((j + 1) / par) * Math.PI - Math.PI / 2;
        e.push([
          R * Math.cos(p0) * Math.cos(th), R * Math.sin(p0), R * Math.cos(p0) * Math.sin(th),
          R * Math.cos(p1) * Math.cos(th), R * Math.sin(p1), R * Math.cos(p1) * Math.sin(th),
        ]);
      }
    }
    for (let j = 1; j < par; j++) {
      const p = (j / par) * Math.PI - Math.PI / 2;
      const r = R * Math.cos(p);
      const y = R * Math.sin(p);
      for (let i = 0; i < mer; i++) {
        const t0 = (i / mer) * Math.PI * 2;
        const t1 = ((i + 1) / mer) * Math.PI * 2;
        e.push([
          r * Math.cos(t0), y, r * Math.sin(t0),
          r * Math.cos(t1), y, r * Math.sin(t1),
        ]);
      }
    }
    const dishY = 0.42, dishR = 0.28, dishZ = Math.sqrt(Math.max(0, 1 - dishY * dishY - 0.02));
    for (let i = 0; i < 14; i++) {
      const t0 = (i / 14) * Math.PI * 2, t1 = ((i + 1) / 14) * Math.PI * 2;
      e.push([
        dishR * Math.cos(t0), dishY + dishR * Math.sin(t0) * 0.3, dishZ,
        dishR * Math.cos(t1), dishY + dishR * Math.sin(t1) * 0.3, dishZ,
      ]);
    }
    const eq = 0.02;
    for (let i = 0; i < mer; i++) {
      const t0 = (i / mer) * Math.PI * 2, t1 = ((i + 1) / mer) * Math.PI * 2;
      e.push([
        Math.cos(t0), eq, Math.sin(t0),
        Math.cos(t1), eq, Math.sin(t1),
      ]);
      e.push([
        Math.cos(t0), -eq, Math.sin(t0),
        Math.cos(t1), -eq, Math.sin(t1),
      ]);
    }
    return e;
  }
  const MODEL_DS = deathStarEdges(18, 10);

  function vtext(g, str, x, y, scale, color, align, width) {
    str = String(str).toUpperCase();
    scale *= UI;
    if (width) width *= UI;
    const gap = scale * 0.82;
    let w = 0;
    for (const ch of str) w += ch === " " ? gap * 0.6 : gap;
    let px = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    g.save();
    for (const ch of str) {
      const segs = FONT[ch];
      if (segs) {
        for (const s of segs) {
          for (let i = 0; i <= s.length - 4; i += 2) {
            glowLine(
              g,
              px + s[i] * scale * 0.72,
              y + s[i + 1] * scale,
              px + s[i + 2] * scale * 0.72,
              y + s[i + 3] * scale,
              color,
              width || Math.max(1, scale * 0.06),
            );
          }
        }
      }
      px += ch === " " ? gap * 0.6 : gap;
    }
    g.restore();
  }

  function hudText(g, str, x, y, size, color, align) {
    g.save();
    g.font = `${size * UI}px "Share Tech Mono", monospace`;
    g.textAlign = align || "left";
    g.textBaseline = "top";
    g.fillStyle = color;
    g.shadowColor = color;
    g.shadowBlur = 8;
    g.fillText(str, x, y);
    g.restore();
  }

  function loadHS() {
    try {
      const raw = JSON.parse(localStorage.getItem(HS_KEY) || "[]");
      if (Array.isArray(raw) && raw.length) return raw;
    } catch (_) {}
    return [
      { name: "LUK", score: 42000 },
      { name: "HAN", score: 31000 },
      { name: "WEG", score: 24000 },
      { name: "BIG", score: 16000 },
      { name: "R2D", score: 9000 },
    ];
  }
  function saveHS(list) {
    localStorage.setItem(HS_KEY, JSON.stringify(list.slice(0, 8)));
  }

  function comm(text, dur) {
    S.comm = text;
    S.commT = dur || 2.4;
    audio.beep(520, 0.05, "square", 0.04);
  }

  function addScore(n, x, y) {
    const m = 1 + Math.min(7, S.combo);
    const got = Math.round(n * m);
    S.score += got;
    S.combo++;
    S.bestCombo = Math.max(S.bestCombo, S.combo);
    S.comboT = 1.25;
    if (x != null) {
      popups.push({ x, y, text: "+" + got, t: 0.9, col: m > 1 ? AMBER : PHOS });
    }
  }

  function burst(x, y, z, color, n, speed) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y, z,
        vx: rand(-1, 1) * speed,
        vy: rand(-1, 1) * speed,
        vz: rand(-0.4, 0.8) * speed,
        life: rand(0.35, 0.9),
        max: 0.9,
        color,
        len: rand(0.4, 1.4),
      });
    }
  }

  function shatter(edges, x, y, z, rx, ry, rz, scale, color) {
    const n = Math.min(edges.length, 18);
    for (let i = 0; i < n; i++) {
      const e = edges[i];
      let a = [e[0] * scale, e[1] * scale, e[2] * scale];
      let b = [e[3] * scale, e[4] * scale, e[5] * scale];
      if (rx) { a = rotX(a, rx); b = rotX(b, rx); }
      if (ry) { a = rotY(a, ry); b = rotY(b, ry); }
      if (rz) { a = rotZ(a, rz); b = rotZ(b, rz); }
      particles.push({
        x: x + (a[0] + b[0]) / 2,
        y: y + (a[1] + b[1]) / 2,
        z: z + (a[2] + b[2]) / 2,
        vx: rand(-6, 6),
        vy: rand(-6, 6),
        vz: rand(-2, 8),
        life: rand(0.5, 1.1),
        max: 1.1,
        color,
        ax: a[0] - b[0],
        ay: a[1] - b[1],
        az: a[2] - b[2],
        line: true,
      });
    }
    burst(x, y, z, color, 14, 8);
  }

  function spawnStars() {
    stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: rand(-80, 80),
        y: rand(-50, 50),
        z: rand(1, 90),
      });
    }
  }

  function spawnTIE(opts) {
    const o = opts || {};
    enemies.push({
      type: o.type || "tie",
      x: o.x != null ? o.x : rand(-8, 8),
      y: o.y != null ? o.y : rand(-4, 4),
      z: o.z != null ? o.z : rand(55, 85),
      vx: o.vx || 0,
      vy: o.vy || 0,
      vz: o.vz != null ? o.vz : rand(-16, -10),
      rx: 0, ry: Math.PI, rz: 0,
      hp: o.hp || 1,
      t: 0,
      fire: rand(0.6, 1.6),
      weave: o.weave || 0,
      phase: rand(0, Math.PI * 2),
      scale: o.scale || 1,
      score: o.score || 1000,
    });
  }

  function spawnFireball(x, y, z, vx, vy, vz) {
    enemies.push({
      type: "fireball",
      x, y, z,
      vx: vx || 0,
      vy: vy || 0,
      vz: vz != null ? vz : -22,
      rx: 0, ry: 0, rz: 0,
      hp: 1,
      t: 0,
      fire: 999,
      scale: 0.7,
      score: 50,
    });
  }

  function spawnTower(x, z) {
    enemies.push({
      type: "tower",
      x, y: -3.2, z,
      vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0,
      hp: 2,
      t: 0,
      fire: rand(0.8, 2.2),
      scale: 1.3,
      score: 500,
      grounded: true,
    });
  }

  function formationV(n, z) {
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      spawnTIE({
        x: (i - mid) * 2.4,
        y: 1.2 - Math.abs(i - mid) * 0.7,
        z: (z || 70) + Math.abs(i - mid) * 3,
        vz: -13,
      });
    }
  }

  function formationLine(n, z) {
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      spawnTIE({ x: (i - mid) * 2.8, y: rand(-1, 2), z: z || 68, vz: -12 });
    }
  }

  function formationWeave(n) {
    for (let i = 0; i < n; i++) {
      spawnTIE({
        x: rand(-6, 6),
        y: rand(-3, 3),
        z: 60 + i * 5,
        vz: -11 - i * 0.4,
        weave: 2.5 + i * 0.2,
      });
    }
  }

  function resetRun() {
    S.score = 0;
    S.combo = 0;
    S.comboT = 0;
    S.bestCombo = 0;
    S.shields = S.maxShields;
    S.torps = 2;
    S.invuln = 0;
    S.shipX = 0;
    S.shipY = 0;
    S.stickX = 0;
    S.stickY = 0;
    S.bank = 0;
    S.speed = 18;
    S.force = false;
    S.forceT = 0;
    S.lock = false;
    S.kills = 0;
    S.wave = 0;
    S.trenchDist = 0;
    S.firedTorp = false;
    S.torp = null;
    S.pause = false;
    S.comm = "";
    S.commT = 0;
    S.stageT = 0;
    enemies = [];
    bullets = [];
    particles = [];
    popups = [];
    spawnQ = [];
    events = [];
    spawnStars();
  }

  function startBoot() {
    resetRun();
    S.mode = "boot";
    S.bootI = 0;
    S.bootT = 0;
    audio.ui();
    audio.r2();
  }

  const BOOT_LINES = [
    "ALLIANCE FLIGHT COMPUTER  v2.07",
    "MASSASSI BASE  /  YAVIN IV",
    "",
    "INITIALIZING T-65B X-WING...",
    "S-FOILS ................ LOCKED ATTACK",
    "QUAD LASERS ............ ARMED",
    "PROTON TORPEDOES ....... 02",
    "ASTROMECH .............. R2-D2 ONLINE",
    "NAVCOMP ................ BATTLE STATION",
    "SHIELD PROJECTORS ...... FORWARD/AFT",
    "",
    "CALLSIGN  RED FIVE",
    "MAY THE FORCE BE WITH YOU",
  ];

  function startBriefing() {
    S.mode = "briefing";
    S.briefT = 0;
    audio.ui();
  }

  function startHyperspace() {
    S.mode = "hyperspace";
    S.hyperspace = 0;
    audio.noise(1.1, 0.18, 200);
    audio.beep(80, 1.0, "sawtooth", 0.08, 600);
  }

  function startSpace() {
    S.mode = "space";
    S.stageT = 0;
    S.speed = 18;
    enemies = [];
    bullets = [];
    comm("RED LEADER: ALL WINGS REPORT IN.", 3);
    formationV(3, 48);
    events = [
      { t: 5.5, fn: () => formationWeave(4) },
      { t: 6.5, fn: () => { comm("RED FIVE: I'M GOING IN.", 2); formationLine(4, 70); } },
      { t: 12, fn: () => { formationWeave(5); spawnFireball(rand(-3, 3), rand(-2, 2), 50, 0, 0, -26); } },
      { t: 18, fn: () => { comm("GOLD LEADER: STAY LOW. WATCH THOSE TOWERS.", 3); formationV(5, 75); } },
      { t: 24, fn: () => { formationLine(3, 60); formationWeave(3); } },
      { t: 30, fn: () => {
        comm("THEY'RE COMING IN TOO FAST!", 2.4);
        spawnTIE({ type: "vader", x: 0, y: 1.5, z: 80, vz: -9, hp: 6, scale: 1.15, score: 5000 });
        formationWeave(4);
      } },
      { t: 38, fn: () => { formationV(6, 78); spawnFireball(-2, 1, 40, 0.4, 0, -28); spawnFireball(2, -1, 44, -0.4, 0, -28); } },
    ];
  }

  function startSurface() {
    S.mode = "surface";
    S.stageT = 0;
    S.speed = 26;
    enemies = enemies.filter((e) => e.type === "tie" || e.type === "vader");
    comm("APPROACHING THE BATTLE STATION. WATCH THE SURFACE GUNS.", 3);
    for (let i = 0; i < 8; i++) spawnTower(rand(-10, 10), 30 + i * 12);
    events = [
      { t: 4, fn: () => { for (let i = 0; i < 4; i++) spawnTower(rand(-9, 9), 70 + i * 8); } },
      { t: 8, fn: () => formationV(4, 65) },
      { t: 12, fn: () => { for (let i = 0; i < 5; i++) spawnTower((i - 2) * 3.5, 80 + (i % 2) * 6); } },
      { t: 16, fn: () => { comm("RED LEADER: I'M GOING TO CUT ACROSS THE TRENCH.", 3); formationWeave(3); } },
    ];
  }

  function startTrench() {
    S.mode = "trench";
    S.stageT = 0;
    S.trenchDist = 0;
    S.speed = 32;
    enemies = [];
    comm("RED FIVE, THIS IS RED LEADER. BEGIN YOUR ATTACK RUN.", 3);
    audio.r2();
    events = [
      { t: 6, fn: () => comm("STAY ON TARGET.", 2) },
      { t: 14, fn: () => comm("THE GUNS. THEY'VE STOPPED. STABLE SET OF GUNS AT THAT SPEED.", 3) },
      { t: 20, fn: () => {
        comm("I HAVE YOU NOW.", 2.2);
        spawnTIE({ type: "vader", x: 0, y: 0.6, z: 28, vz: -4, hp: 8, scale: 1.1, score: 5000 });
      } },
      { t: 28, fn: () => comm("USE THE FORCE, LUKE.", 3) },
    ];
  }

  function startPort() {
    S.mode = "port";
    S.stageT = 0;
    S.speed = 28;
    S.firedTorp = false;
    S.torp = null;
    S._forceHint = false;
    comm("SWITCHING TO PROTON TORPEDOES. RANGE CLOSING.", 3);
    audio.lock();
  }

  function damagePlayer(amt) {
    if (S.invuln > 0) return;
    S.shields -= amt || 1;
    S.invuln = 0.85;
    S.combo = 0;
    shake = Math.max(shake, 12);
    flash = 0.28;
    audio.hit();
    audio.r2();
    if (S.shields <= 2) audio.alarm();
    if (S.shields <= 0) {
      S.shields = 0;
      die();
    }
  }

  function die() {
    S.mode = "dead";
    S.overT = 0;
    shake = 22;
    audio.explosion(true);
    burst(0, 0, 4, RED, 40, 14);
    comm("RED FIVE, DO YOU COPY? RED FIVE!", 3);
  }

  function win() {
    S.mode = "victory";
    S.winT = 0;
    S.score += 100000;
    audio.explosion(true);
    comm("GREAT SHOT KID. THAT WAS ONE IN A MILLION.", 4);
  }

  function gameOver() {
    S.mode = "gameover";
    S.overT = 0;
    S.initials = "___";
    S.initI = 0;
  }

  function maybeHighScore() {
    const list = loadHS();
    if (list.length < 8 || S.score > list[list.length - 1].score) {
      S.mode = "enter";
      S.overT = 0;
      S.initials = "AAA";
      S.initI = 0;
    } else {
      S.mode = "attract";
    }
  }

  function fireLasers() {
    if (S.mode !== "space" && S.mode !== "surface" && S.mode !== "trench" && S.mode !== "port") return;
    if (S.mode === "port" && S.range < 90) return fireTorpedo();
    const cannons = [
      [-1.15, 0.55], [1.15, 0.55], [-0.85, -0.35], [0.85, -0.35],
    ];
    const pair = (performance.now() / 120) % 2 | 0;
    const pairIdx = pair === 0 ? [0, 3] : [1, 2];
    for (const i of pairIdx) {
      const c = cannons[i];
      bullets.push({
        kind: "laser",
        x: S.worldX + c[0],
        y: S.worldY + c[1],
        z: 1.6,
        vx: (S.worldX - (S.worldX + c[0])) * 8,
        vy: (S.worldY - (S.worldY + c[1])) * 8,
        vz: 88,
        life: 0.7,
        color: LASER_R,
      });
    }
    audio.laser();
  }

  function fireTorpedo() {
    if (S.mode !== "port") return;
    if (S.torps <= 0 || S.firedTorp) return;
    S.torps--;
    S.firedTorp = true;
    S.torp = {
      x: S.worldX,
      y: S.worldY,
      z: 2,
      vx: 0,
      vy: 0,
      vz: 36,
      t: 0,
    };
    audio.torp();
    comm("TORPEDOES AWAY.", 1.6);
    shake = 8;
  }

  function toggleForce() {
    if (S.mode !== "trench" && S.mode !== "port") {
      comm("COMPUTER LOCKED. TRUST YOUR FEELINGS WHEN YOU REACH THE PORT.", 2.4);
      return;
    }
    S.force = !S.force;
    S.forceT = 0;
    if (S.force) {
      audio.forceOn();
      comm("THE FORCE IS STRONG WITH THIS ONE.", 2.5);
    } else {
      comm("TARGETING COMPUTER ONLINE.", 1.8);
      audio.ui();
    }
  }

  let fireHold = 0;
  function updatePlayer(dt) {
    let kx = 0, ky = 0;
    if (keys.has("arrowleft") || keys.has("a")) kx -= 1;
    if (keys.has("arrowright") || keys.has("d")) kx += 1;
    if (keys.has("arrowup") || keys.has("w")) ky -= 1;
    if (keys.has("arrowdown") || keys.has("s")) ky += 1;
    if (kx || ky) {
      S.stickX = clamp(S.stickX + kx * dt * 1.8, -1, 1);
      S.stickY = clamp(S.stickY + ky * dt * 1.8, -1, 1);
    } else if (!mouse.locked && !mouse.moved) {
      /* keep */
    }

    const smooth = 1 - Math.pow(0.0002, dt);
    S.shipX = lerp(S.shipX, S.stickX, smooth);
    S.shipY = lerp(S.shipY, S.stickY, smooth);
    S.bank = lerp(S.bank, (S.stickX - S.shipX) * 8 + S.shipX * 0.4, 0.12);

    S.worldX = S.shipX * (S.mode === "trench" || S.mode === "port" ? 2.05 : 3.4);
    S.worldY = -S.shipY * (S.mode === "trench" || S.mode === "port" ? 1.15 : 2.1);

    if (S.mode === "trench" || S.mode === "port") {
      const maxX = 2.35, minY = -1.35, maxY = 1.15;
      if (Math.abs(S.worldX) > maxX) {
        S.worldX = clamp(S.worldX, -maxX, maxX);
        S.stickX *= 0.4;
        damagePlayer(1);
        burst(S.worldX, S.worldY, 3, AMBER, 10, 5);
      }
      if (S.worldY < minY || S.worldY > maxY) {
        S.worldY = clamp(S.worldY, minY, maxY);
        S.stickY *= 0.4;
        damagePlayer(1);
        burst(S.worldX, S.worldY, 3, AMBER, 10, 5);
      }
    }

    S.invuln = Math.max(0, S.invuln - dt);
    S.comboT -= dt;
    if (S.comboT <= 0) S.combo = 0;
    S.commT -= dt;
    if (S.commT <= 0) S.comm = "";
    if (S.force) S.forceT += dt;

    if (mouse.down || keys.has(" ") || keys.has("z") || keys.has("control")) {
      fireHold -= dt;
      if (fireHold <= 0) {
        fireLasers();
        fireHold = S.force ? 0.09 : 0.12;
      }
    } else fireHold = 0;
  }

  function enemyFire(e) {
    const dx = S.worldX - e.x, dy = S.worldY - e.y, dz = 0.5 - e.z;
    const mag = Math.hypot(dx, dy, dz) || 1;
    const acc = e.type === "vader" ? 0.15 : 0.55;
    spawnFireball(
      e.x,
      e.y,
      e.z - 1,
      (dx / mag) * 6 + rand(-acc, acc) * 8,
      (dy / mag) * 6 + rand(-acc, acc) * 8,
      Math.min(-16, (dz / mag) * 22),
    );
  }

  function updateEnemies(dt) {
    const timeScale = S.force ? 0.55 : 1;
    const ts = dt * timeScale;
    S.lock = false;
    let nearest = 99;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.t += ts;
      if (e.weave) {
        e.x += Math.sin(e.t * 1.6 + e.phase) * e.weave * ts;
        e.y += Math.cos(e.t * 1.1 + e.phase) * e.weave * 0.45 * ts;
      }
      if (e.type === "tie" || e.type === "vader") {
        e.ry += ts * (e.type === "vader" ? 0.4 : 1.2);
        e.rz = Math.sin(e.t * 2 + e.phase) * 0.25;
        if (e.type === "vader" && S.mode !== "trench") {
          e.x += (S.worldX - e.x) * 0.15 * ts;
          e.y += (S.worldY + 0.4 - e.y) * 0.12 * ts;
        }
      }
      if (e.type === "fireball") {
        e.rx += ts * 4;
        e.ry += ts * 5;
      }
      if (e.grounded) {
        e.z -= S.speed * ts;
      } else {
        e.x += e.vx * ts;
        e.y += e.vy * ts;
        e.z += e.vz * ts;
        if (S.mode === "surface" && e.type !== "fireball") e.z -= S.speed * 0.35 * ts;
        if (S.mode === "trench" || S.mode === "port") e.z -= S.speed * 0.55 * ts;
      }

      e.fire -= ts;
      if (e.fire <= 0 && e.type !== "fireball" && e.z < 55 && e.z > 8) {
        enemyFire(e);
        e.fire = e.type === "tower" ? rand(1.4, 2.6) : e.type === "vader" ? rand(0.45, 0.9) : rand(1.1, 2.2);
      }

      const p = project(e.x, e.y, e.z);
      if (p) {
        const d = Math.hypot(p.x - W / 2, p.y - H / 2);
        if (d < 78 && e.type !== "fireball") {
          S.lock = true;
          nearest = Math.min(nearest, d);
        }
      }

      if (e.type === "fireball" && e.z < 2.4 && Math.hypot(e.x - S.worldX, e.y - S.worldY) < 1.05) {
        burst(e.x, e.y, e.z, FIRE, 12, 6);
        enemies.splice(i, 1);
        damagePlayer(1);
        continue;
      }

      if (e.z < 0.6 || e.z > 140 || Math.abs(e.x) > 40 || Math.abs(e.y) > 30) {
        enemies.splice(i, 1);
      }
    }
    return nearest;
  }

  function updateBullets(dt) {
    const ts = dt * (S.force ? 0.7 : 1);
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt;
      if (b.life <= 0 || b.z > 95) {
        bullets.splice(i, 1);
        continue;
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const rad = e.type === "fireball" ? 0.7 : e.type === "tower" ? 1.4 : 1.15 * (e.scale || 1);
        const dx = b.x - e.x, dy = b.y - e.y, dz = b.z - e.z;
        if (dx * dx + dy * dy + dz * dz < rad * rad) {
          e.hp--;
          burst(e.x, e.y, e.z, b.color, 6, 4);
          bullets.splice(i, 1);
          if (e.hp <= 0) {
            const col = e.type === "fireball" ? FIRE : e.type === "vader" ? MAG : TIE_C;
            const model = e.type === "vader" ? MODEL_VADER : e.type === "tower" ? MODEL_TOWER : e.type === "fireball" ? MODEL_OCTA : MODEL_TIE;
            shatter(model, e.x, e.y, e.z, e.rx, e.ry, e.rz, e.scale || 1, col);
            audio.explosion(e.type === "vader");
            const p = project(e.x, e.y, e.z);
            addScore(e.score || 100, p ? p.x : W / 2, p ? p.y : H / 2);
            S.kills++;
            enemies.splice(j, 1);
            shake = Math.max(shake, e.type === "vader" ? 10 : 4);
            if (S.kills % 8 === 0) audio.r2();
          } else audio.beep(300, 0.05, "square", 0.04, 120);
          break;
        }
      }
    }

    if (S.torp) {
      const t = S.torp;
      t.t += dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.z += t.vz * dt;
      if (S.force) {
        t.x += (0 - t.x) * 1.8 * dt;
        t.y += (-0.12 - t.y) * 1.8 * dt;
      }
      burst(t.x, t.y, t.z, AMBER, 1, 0.4);
      if (t.z > 38) {
        const off = Math.hypot(t.x, t.y + 0.12);
        const window = S.force ? 0.55 : 0.22;
        if (off < window) {
          S.torp = null;
          win();
        } else {
          S.torp = null;
          audio.explosion(true);
          shake = 16;
          comm("IT'S A HIT... NEGATIVE. NEGATIVE. IT DIDN'T GO IN.", 3);
          S.firedTorp = false;
          if (S.torps <= 0) {
            S.torps = 1;
            comm("R2, RELOAD THE LAST TORPEDO. STAY ON TARGET.", 3);
          }
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 420) particles.splice(0, particles.length - 420);
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].t -= dt;
      popups[i].y -= 28 * dt;
      if (popups[i].t <= 0) popups.splice(i, 1);
    }
  }

  function updateStars(dt) {
    const spd = S.mode === "hyperspace" ? 180 : S.speed;
    for (const s of stars) {
      s.z -= spd * dt;
      if (s.z < 0.5) {
        s.z += 90;
        s.x = rand(-80, 80);
        s.y = rand(-50, 50);
      }
    }
  }

  function runEvents(dt) {
    S.stageT += dt;
    for (const ev of events) {
      if (!ev.done && S.stageT >= ev.t) {
        ev.done = true;
        ev.fn();
      }
    }
  }

  function updateSpace(dt) {
    S.speed = lerp(S.speed, 20, 0.02);
    runEvents(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateStars(dt);
    S.range = Math.max(0, 42000 - S.stageT * 900);
    if (S.stageT > 44 && enemies.filter((e) => e.type !== "fireball").length === 0) {
      startSurface();
    }
  }

  function updateSurface(dt) {
    S.speed = lerp(S.speed, 28, 0.03);
    runEvents(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateStars(dt);
    if (S.stageT > 3 && S.stageT % 2.2 < dt + 0.02) {
      spawnTower(rand(-10, 10), rand(70, 95));
    }
    if (S.stageT > 6 && S.stageT % 1.8 < dt + 0.02) {
      spawnFireball(rand(-6, 6), rand(-1, 2), 55, rand(-1, 1), rand(-0.5, 0.5), -24);
    }
    S.range = Math.max(0, 18000 - S.stageT * 800);
    if (S.stageT > 22) startTrench();
  }

  function trenchHazards() {
    const seg = 7;
    const idx = Math.floor(S.trenchDist / seg);
    if (S._haz === idx) return;
    S._haz = idx;
    const h = hash(idx + 17);
    if (h > 0.62 && S.trenchDist > 20 && S.trenchDist < S.trenchLen - 80) {
      const wall = h > 0.81 ? 1 : -1;
      enemies.push({
        type: "tower",
        x: wall * 2.4,
        y: rand(-0.6, 0.6),
        z: 48,
        vx: 0, vy: 0, vz: 0,
        rx: 0, ry: 0, rz: 0,
        hp: 1,
        t: 0,
        fire: rand(0.4, 1.2),
        scale: 0.7,
        score: 400,
        grounded: true,
      });
    }
    if (h > 0.28 && h < 0.5 && S.trenchDist > 30) {
      spawnFireball(rand(-1.6, 1.6), rand(-0.7, 0.7), 46, 0, 0, -S.speed - 6);
    }
    if (h > 0.9 && S.trenchDist > 40 && S.trenchDist < S.trenchLen - 100) {
      spawnTIE({ x: rand(-1.4, 1.4), y: rand(-0.4, 0.8), z: 55, vz: -6, weave: 0.8 });
    }
  }

  function updateTrench(dt) {
    S.speed = lerp(S.speed, S.force ? 24 : 34, 0.04);
    S.trenchDist += S.speed * dt;
    runEvents(dt);
    updatePlayer(dt);
    trenchHazards();
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    S.range = Math.max(0, (S.trenchLen - S.trenchDist) * 42);
    checkCatwalks();
    if (S.trenchDist > S.trenchLen - 70) startPort();
  }

  function checkCatwalks() {
    const TW = 2.7, seg = 6;
    const scroll = S.trenchDist % seg;
    const base = Math.floor(S.trenchDist / seg);
    for (let i = 0; i < 5; i++) {
      const z0 = 1.3 + i * seg - scroll;
      const idx = base + i;
      if (hash(idx + 99) <= 0.72) continue;
      const z = z0 + 2;
      if (z > 5.2 || z < 2.1) continue;
      const cy = -0.1 + (hash(idx) - 0.5) * 0.6;
      if (Math.abs(S.worldY - cy) < 0.3 && Math.abs(S.worldX) < TW - 0.2) damagePlayer(1);
    }
  }

  function updatePort(dt) {
    S.speed = lerp(S.speed, S.force ? 16 : 22, 0.05);
    S.trenchDist += S.speed * dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    S.range = Math.max(0, (40 - (S.trenchDist - (S.trenchLen - 70))) * 18);
    if (!S.force && S.stageT > 2.2 && !S._forceHint) {
      S._forceHint = true;
      comm("COMPUTER LOCK UNSTABLE. LET GO.", 2.6);
    }
    if (S.trenchDist > S.trenchLen + 30 && !S.torp && S.mode === "port") {
      comm("WE OVERSHOT THE PORT. PULL UP!", 2);
      damagePlayer(2);
      S.trenchDist = S.trenchLen - 90;
      S.firedTorp = false;
      startPort();
    }
  }

  function updateAttract(dt) {
    S.t += dt;
    S.demo += dt;
    updateStars(dt);
    updateParticles(dt);
    if (S.demo > 8 && enemies.length === 0) {
      formationV(5, 70);
      S.demo = 0;
    }
    for (const e of enemies) {
      e.z -= 10 * dt;
      e.ry += dt;
    }
    enemies = enemies.filter((e) => e.z > 2);
  }

  function updateBoot(dt) {
    S.bootT += dt;
    if (S.bootT > 0.22 && S.bootI < BOOT_LINES.length) {
      S.bootI++;
      S.bootT = 0;
      if (BOOT_LINES[S.bootI - 1]) audio.beep(700 + S.bootI * 40, 0.04, "square", 0.04);
    }
    if (S.bootI >= BOOT_LINES.length && S.bootT > 0.7) startBriefing();
  }

  function updateBriefing(dt) {
    S.briefT += dt;
    updateStars(dt * 0.15);
    if (S.briefT > 14) startHyperspace();
  }

  function updateHyperspace(dt) {
    S.hyperspace += dt;
    updateStars(dt);
    if (S.hyperspace > 1.6) startSpace();
  }

  function updateDead(dt) {
    S.overT += dt;
    updateParticles(dt);
    updateStars(dt * 0.3);
    if (S.overT > 2.2) gameOver();
  }

  function updateVictory(dt) {
    S.winT += dt;
    updateParticles(dt);
    if (S.winT > 1.2 && S.winT < 1.3) burst(0, 0, 8, AMBER, 50, 16);
    if (S.winT > 8) maybeHighScore();
  }

  function drawStars(g, streak) {
    g.fillStyle = "#cffff0";
    for (const s of stars) {
      const p = project(s.x, s.y, s.z);
      if (!p) continue;
      const p2 = project(s.x, s.y, s.z + streak);
      if (p2 && streak > 1.2) glowLine(g, p.x, p.y, p2.x, p2.y, "rgba(200,255,230,0.7)", 1, false);
      else {
        g.globalAlpha = clamp(0.3 + (90 - s.z) / 90, 0.2, 1);
        g.fillRect(p.x, p.y, p.s * 0.03 + 1, p.s * 0.03 + 1);
        g.globalAlpha = 1;
      }
    }
  }

  function drawDeathStar(g, x, y, z, rot, scale, color) {
    drawModel(g, MODEL_DS, x, y, z, 0.18, rot, 0.04, scale, color || DS, 0.9);
  }

  function drawTrenchWorld(g) {
    const TW = 2.7, TH = 1.55, seg = 6;
    const scroll = S.trenchDist % seg;
    const base = Math.floor(S.trenchDist / seg);
    for (let i = 18; i >= 0; i--) {
      const z0 = 1.3 + i * seg - scroll;
      const z1 = z0 + seg;
      const idx = base + i;
      const h = hash(idx);
      const col = i % 2 ? "#7ecaa8" : "#b7ecd4";
      const corners = (z) => {
        const L = project(-TW - S.worldX * 0.02, TH, z);
        const R = project(TW - S.worldX * 0.02, TH, z);
        const FL = project(-TW - S.worldX * 0.02, -TH, z);
        const FR = project(TW - S.worldX * 0.02, -TH, z);
        return { L, R, FL, FR };
      };
      const a = corners(z0), b = corners(z1);
      if (!a.L || !b.L || !a.R || !b.R) continue;
      glowLine(g, a.L.x, a.L.y, b.L.x, b.L.y, col, 1.1);
      glowLine(g, a.R.x, a.R.y, b.R.x, b.R.y, col, 1.1);
      glowLine(g, a.FL.x, a.FL.y, b.FL.x, b.FL.y, col, 1.1);
      glowLine(g, a.FR.x, a.FR.y, b.FR.x, b.FR.y, col, 1.1);
      glowLine(g, a.L.x, a.L.y, a.FL.x, a.FL.y, col, 1);
      glowLine(g, a.R.x, a.R.y, a.FR.x, a.FR.y, col, 1);
      glowLine(g, a.FL.x, a.FL.y, a.FR.x, a.FR.y, col, 1);

      const boxes = 2 + ((h * 5) | 0);
      for (let k = 0; k < boxes; k++) {
        const side = hash(idx * 13 + k) > 0.5 ? 1 : -1;
        const by = -TH + 0.25 + hash(idx * 9 + k) * (TH * 1.6);
        const bz = z0 + 0.6 + hash(idx * 3 + k) * (seg - 1.2);
        const bw = 0.35 + hash(idx * 7 + k) * 0.5;
        const bh = 0.2 + hash(idx * 11 + k) * 0.45;
        const bd = 0.4;
        const x0 = side * (TW - 0.02);
        const pts = [
          [x0, by, bz], [x0, by + bh, bz], [x0, by + bh, bz + bd], [x0, by, bz + bd],
        ];
        const pr = pts.map((p) => project(p[0], p[1], p[2])).filter(Boolean);
        if (pr.length === 4) {
          drawPoly(g, [...pr, pr[0]], "#8fd8b8", 0.9);
        }
        void bw;
      }

      if (hash(idx + 99) > 0.72 && i > 2 && i < 16) {
        const cy = -0.1 + (hash(idx) - 0.5) * 0.6;
        const p1 = project(-TW, cy, z0 + 2);
        const p2 = project(TW, cy, z0 + 2);
        if (p1 && p2) glowLine(g, p1.x, p1.y, p2.x, p2.y, AMBER, 1.4);
      }
    }

    if (S.mode === "port" || S.trenchDist > S.trenchLen - 80) {
      const pz = clamp(42 - (S.trenchDist - (S.trenchLen - 70)) * 0.9, 4, 50);
      S.portZ = pz;
      const s = 0.22 + (50 - pz) * 0.008;
      const port = [
        [-s, -0.12 - s * 0.4, pz],
        [s, -0.12 - s * 0.4, pz],
        [s, -0.12 + s * 0.4, pz],
        [-s, -0.12 + s * 0.4, pz],
      ].map((p) => project(p[0], p[1], p[2]));
      if (port.every(Boolean)) {
        const pc = S.force ? FORCE : RED;
        drawPoly(g, [...port, port[0]], pc, 2.4);
        const c = project(0, -0.12, pz);
        if (c) {
          const br = 18 * UI + (50 - pz) * 0.4;
          const lg = 10 * UI;
          glowLine(g, c.x - br, c.y - br, c.x - br + lg, c.y - br, pc, 2, false);
          glowLine(g, c.x - br, c.y - br, c.x - br, c.y - br + lg, pc, 2, false);
          glowLine(g, c.x + br, c.y - br, c.x + br - lg, c.y - br, pc, 2, false);
          glowLine(g, c.x + br, c.y - br, c.x + br, c.y - br + lg, pc, 2, false);
          glowLine(g, c.x - br, c.y + br, c.x - br + lg, c.y + br, pc, 2, false);
          glowLine(g, c.x - br, c.y + br, c.x - br, c.y + br - lg, pc, 2, false);
          glowLine(g, c.x + br, c.y + br, c.x + br - lg, c.y + br, pc, 2, false);
          glowLine(g, c.x + br, c.y + br, c.x + br, c.y + br - lg, pc, 2, false);
        }
      }
    }
  }

  function drawSurface(g) {
    const grid = 8;
    const scroll = (S.stageT * S.speed) % grid;
    for (let i = 0; i < 16; i++) {
      const z = 2 + i * grid - scroll;
      const y = -3.4;
      const a = project(-40, y, z);
      const b = project(40, y, z);
      if (a && b) glowLine(g, a.x, a.y, b.x, b.y, "#3d6a55", 1, false);
    }
    for (let i = -12; i <= 12; i++) {
      const x = i * 4;
      const a = project(x, -3.4, 2);
      const b = project(x, -3.4, 90);
      if (a && b) glowLine(g, a.x, a.y, b.x, b.y, "#3d6a55", 1, false);
    }
    drawDeathStar(g, 18, 8, 70, S.t * 0.05, 14, "#5d907c");
  }

  function drawEnemies(g) {
    const list = enemies.slice().sort((a, b) => b.z - a.z);
    for (const e of list) {
      const col = e.type === "vader" ? MAG : e.type === "fireball" ? FIRE : e.type === "tower" ? "#c8e8d8" : TIE_C;
      const model = e.type === "vader" ? MODEL_VADER : e.type === "tower" ? MODEL_TOWER : e.type === "fireball" ? MODEL_OCTA : MODEL_TIE;
      const sc = (e.scale || 1) * (e.type === "fireball" ? 0.7 + Math.sin(e.t * 10) * 0.1 : 1);
      drawModel(g, model, e.x, e.y, e.z, e.rx, e.ry, e.rz, sc, col, e.type === "fireball" ? 1.6 : 1.15);
      if (S.lock && e.type !== "fireball" && !S.force) {
        const p = project(e.x, e.y, e.z);
        if (p && p.s > 4) {
          const r = clamp(p.s * 1.1, 10, 46);
          g.strokeStyle = PHOS;
          g.globalAlpha = 0.8;
          g.lineWidth = 1;
          g.strokeRect(p.x - r, p.y - r, r * 2, r * 2);
          g.globalAlpha = 1;
        }
      }
    }
  }

  function drawBullets(g) {
    for (const b of bullets) {
      const p1 = project(b.x, b.y, b.z);
      const p2 = project(b.x, b.y, b.z - 2.4);
      if (p1 && p2) glowLine(g, p1.x, p1.y, p2.x, p2.y, b.color, 2.1);
    }
    if (S.torp) {
      const t = S.torp;
      const p1 = project(t.x, t.y, t.z);
      const p2 = project(t.x, t.y, t.z - 3);
      if (p1 && p2) {
        glowLine(g, p1.x, p1.y, p2.x, p2.y, AMBER, 3);
        glowLine(g, p1.x, p1.y, p2.x, p2.y, WHITE, 1.2);
      }
    }
  }

  function drawParticles(g) {
    for (const p of particles) {
      const a = project(p.x, p.y, p.z);
      if (!a) continue;
      g.globalAlpha = clamp(p.life / (p.max || 1), 0, 1);
      if (p.line) {
        const b = project(p.x + p.ax * 0.4, p.y + p.ay * 0.4, p.z + p.az * 0.4);
        if (b) glowLine(g, a.x, a.y, b.x, b.y, p.color, 1.1, false);
      } else {
        g.fillStyle = p.color;
        g.fillRect(a.x, a.y, 2, 2);
      }
      g.globalAlpha = 1;
    }
  }

  function drawCockpit(g) {
    const playing = S.mode === "space" || S.mode === "surface" || S.mode === "trench" || S.mode === "port";
    if (!playing && S.mode !== "dead") return;

    const bank = S.bank || 0;
    g.save();
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W * 0.16, 0);
    g.lineTo(W * 0.22, H * 0.18);
    g.lineTo(0, H * 0.28);
    g.closePath();
    g.moveTo(W, 0);
    g.lineTo(W * 0.84, 0);
    g.lineTo(W * 0.78, H * 0.18);
    g.lineTo(W, H * 0.28);
    g.closePath();
    g.moveTo(0, H);
    g.lineTo(0, H * 0.62);
    g.lineTo(W * 0.28, H * 0.78);
    g.lineTo(W * 0.72, H * 0.78);
    g.lineTo(W, H * 0.62);
    g.lineTo(W, H);
    g.closePath();
    g.fill();

    glowLine(g, W * 0.16, 0, W * 0.22, H * 0.18, PHOS_DIM, 1.2);
    glowLine(g, W * 0.22, H * 0.18, W * 0.38, H * 0.22, PHOS_DIM, 1);
    glowLine(g, W * 0.84, 0, W * 0.78, H * 0.18, PHOS_DIM, 1.2);
    glowLine(g, W * 0.78, H * 0.18, W * 0.62, H * 0.22, PHOS_DIM, 1);
    glowLine(g, 0, H * 0.62, W * 0.28, H * 0.78, PHOS, 1.3);
    glowLine(g, W * 0.28, H * 0.78, W * 0.72, H * 0.78, PHOS, 1.3);
    glowLine(g, W * 0.72, H * 0.78, W, H * 0.62, PHOS, 1.3);

    const cannons = [
      [W * 0.07, H * 0.58], [W * 0.93, H * 0.58],
      [W * 0.16, H * 0.86], [W * 0.84, H * 0.86],
    ];
    const tick = 12 * UI;
    for (const c of cannons) {
      glowLine(g, c[0] - tick, c[1], c[0] + tick, c[1], RED, 1.4 * UI, false);
      glowLine(g, c[0], c[1] - tick * 0.7, c[0], c[1] + tick * 0.7, RED, 1.4 * UI, false);
    }

    const rx = W / 2 + S.bank * 22 * UI + (S.stickX - S.shipX) * 36 * UI;
    const ry = H / 2 + (S.stickY - S.shipY) * 40 * UI;
    const col = S.force ? FORCE : S.lock ? AMBER : PHOS;
    const hexR = 34 * UI;
    const hex = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      hex.push({ x: rx + Math.cos(a) * hexR, y: ry + Math.sin(a) * hexR });
    }
    drawPoly(g, [...hex, hex[0]], col, 1.6 * UI);
    glowLine(g, rx - 10 * UI, ry, rx + 10 * UI, ry, col, 1.2 * UI, false);
    glowLine(g, rx, ry - 10 * UI, rx, ry + 10 * UI, col, 1.2 * UI, false);
    if (S.lock && !S.force) {
      hudText(g, "LOCK", rx + 38 * UI, ry - 12 * UI, 14, AMBER);
    }
    if (S.force) hudText(g, "LET GO", rx + 36 * UI, ry - 14 * UI, 14, FORCE);

    g.restore();
    void bank;
  }

  function drawTargetingComputer(g) {
    const playing = S.mode === "space" || S.mode === "surface" || S.mode === "trench" || S.mode === "port";
    if (!playing) return;
    const tw = Math.min(260, W * 0.24), th = tw * 0.72;
    const x = W / 2 - tw / 2, y = H * 0.79;
    g.save();
    g.fillStyle = "rgba(0, 10, 4, 0.82)";
    g.fillRect(x, y, tw, th);
    glowLine(g, x, y, x + tw, y, S.force ? "#123" : PHOS, 1.2);
    glowLine(g, x + tw, y, x + tw, y + th, S.force ? "#123" : PHOS, 1.2);
    glowLine(g, x + tw, y + th, x, y + th, S.force ? "#123" : PHOS, 1.2);
    glowLine(g, x, y + th, x, y, S.force ? "#123" : PHOS, 1.2);
    hudText(g, S.force ? "COMPUTER OFF" : "TARGETING COMPUTER", x + 8, y + 4, 11, S.force ? "#345" : PHOS);

    if (S.force) {
      g.globalAlpha = 0.25;
      hudText(g, "TRUST YOUR FEELINGS", x + 18, y + th / 2 - 8, 12, FORCE);
      g.globalAlpha = 1;
      g.restore();
      return;
    }

    const cx = x + tw / 2, cy = y + th / 2 + 6;
    if (S.mode === "space" || S.mode === "surface") {
      g.strokeStyle = PHOS_DIM;
      g.beginPath();
      g.arc(cx, cy, th * 0.28, 0, Math.PI * 2);
      g.stroke();
      hudText(g, "DS-1", cx - 14, cy - th * 0.28 - 12, 10, PHOS_DIM);
      for (const e of enemies) {
        if (e.type === "fireball") continue;
        const bx = cx + clamp(e.x * 6, -tw * 0.4, tw * 0.4);
        const by = cy - clamp((40 - e.z) * 1.1, -th * 0.3, th * 0.3);
        g.fillStyle = e.type === "vader" ? MAG : TIE_C;
        g.fillRect(bx, by, 3, 3);
      }
      g.fillStyle = PHOS;
      g.beginPath();
      g.moveTo(cx, cy + 8);
      g.lineTo(cx - 4, cy + 14);
      g.lineTo(cx + 4, cy + 14);
      g.closePath();
      g.fill();
    } else {
      const trenchY = cy + 8;
      glowLine(g, x + 16, trenchY - 22, x + tw - 16, trenchY - 22, PHOS_DIM, 1, false);
      glowLine(g, x + 16, trenchY + 22, x + tw - 16, trenchY + 22, PHOS_DIM, 1, false);
      glowLine(g, x + 16, trenchY - 22, x + 16, trenchY + 22, PHOS_DIM, 1, false);
      const prog = clamp(S.trenchDist / S.trenchLen, 0, 1);
      const px = x + 20 + (tw - 50) * prog;
      g.fillStyle = PHOS;
      g.fillRect(px - 3, trenchY - 4, 6, 8);
      const portX = x + tw - 28;
      g.strokeStyle = RED;
      g.strokeRect(portX - 6, trenchY - 6, 12, 12);
      hudText(g, "EXHAUST PORT", portX - 40, trenchY + 26, 10, RED);
      if (S.mode === "port") {
        const jitter = S.force ? 0 : Math.sin(S.t * 18) * 7;
        g.strokeStyle = AMBER;
        g.strokeRect(portX - 14 + jitter, trenchY - 14, 28, 28);
        hudText(g, S.range < 40 ? "FIRE TORPEDO" : "CLOSE RANGE", x + 20, y + 18, 11, AMBER);
      }
    }
    g.restore();
  }

  function drawHUD(g) {
    const playing = ["space", "surface", "trench", "port", "dead"].includes(S.mode);
    if (!playing) return;

    hudText(g, "SCORE", 24 * UI, 16 * UI, 13, PHOS_DIM);
    hudText(g, String(S.score).padStart(8, "0"), 24 * UI, 32 * UI, 22, PHOS);
    hudText(g, "RED FIVE", W / 2, 16 * UI, 14, PHOS, "center");
    const stageName = S.mode === "space" ? "APPROACH" : S.mode === "surface" ? "SURFACE" : S.mode === "trench" ? "TRENCH" : S.mode === "port" ? "EXHAUST PORT" : "HULL LOSS";
    hudText(g, stageName, W / 2, 34 * UI, 12, AMBER, "center");

    hudText(g, "SHIELDS", W - 24 * UI, 16 * UI, 13, PHOS_DIM, "right");
    for (let i = 0; i < S.maxShields; i++) {
      const bw = 14 * UI, bh = 10 * UI, gap = 18 * UI;
      const x = W - 24 * UI - (S.maxShields - i) * gap;
      g.strokeStyle = i < S.shields ? (S.shields <= 2 ? RED : PHOS) : "#133";
      g.fillStyle = i < S.shields ? (S.shields <= 2 ? "rgba(255,50,40,0.5)" : "rgba(93,255,138,0.35)") : "transparent";
      g.lineWidth = 1 * UI;
      g.fillRect(x, 36 * UI, bw, bh);
      g.strokeRect(x, 36 * UI, bw, bh);
    }

    hudText(g, "TORPEDOES  " + "▲ ".repeat(S.torps).trim(), 24 * UI, 62 * UI, 13, AMBER);
    hudText(g, "RANGE " + String(Math.round(S.range)).padStart(6, "0"), W - 24 * UI, 62 * UI, 13, PHOS, "right");
    if (S.combo > 1) hudText(g, "COMBO x" + Math.min(8, S.combo), W / 2, 54 * UI, 16, AMBER, "center");

    if (S.comm) {
      hudText(g, S.comm, W / 2, H * 0.12, 16, WHITE, "center");
    }

    for (const p of popups) {
      g.globalAlpha = clamp(p.t * 1.4, 0, 1);
      hudText(g, p.text, p.x, p.y, 14, p.col, "center");
      g.globalAlpha = 1;
    }

    if (S.mode === "port") {
      hudText(g, S.force ? "F  COMPUTER OFF  ·  FIRE TORPEDO" : "PRESS F TO USE THE FORCE   ·   T TORPEDO", W / 2, H * 0.72, 14, S.force ? FORCE : AMBER, "center");
    }

    if (S.pause) {
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(0, 0, W, H);
      vtext(g, "PAUSED", W / 2, H / 2 - 30, 48, PHOS, "center");
      hudText(g, "PRESS ESC TO RESUME", W / 2, H / 2 + 30, 16, WHITE, "center");
    }
  }

  function drawAttract(g) {
    drawStars(g, 1.4);
    drawDeathStar(g, 0, 0.15, 6.2, S.t * 0.25, 2.05, DS);
    drawEnemies(g);
    drawParticles(g);

    vtext(g, "STAR WARS", W / 2, H * 0.08, 56, AMBER, "center", 2.2);
    vtext(g, "TRENCH RUN", W / 2, H * 0.08 + 64 * UI, 34, PHOS, "center", 1.6);
    hudText(g, "A NEW HOPE  ·  BATTLE OF YAVIN  ·  1977", W / 2, H * 0.08 + 108 * UI, 14, PHOS_DIM, "center");

    g.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(S.t * 4));
    hudText(g, "PRESS FIRE TO START ATTACK RUN", W / 2, H * 0.72, 18, PHOS, "center");
    g.globalAlpha = 1;

    hudText(g, "MOUSE / WASD STEER    CLICK FIRE    F USE THE FORCE    T TORPEDO", W / 2, H * 0.78, 13, PHOS_DIM, "center");

    const hs = loadHS();
    hudText(g, "HIGH SCORES", W / 2, H * 0.84, 12, AMBER, "center");
    hs.slice(0, 5).forEach((h, i) => {
      hudText(g, `${i + 1}  ${h.name}   ${String(h.score).padStart(8, "0")}`, W / 2, H * 0.84 + (16 + i * 16) * UI, 13, WHITE, "center");
    });
  }

  function drawBoot(g) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    hudText(g, "REBEL ALLIANCE  /  TACTICAL COMPUTER", 40 * UI, 36 * UI, 14, PHOS_DIM);
    hudText(g, "------------------------------------", 40 * UI, 54 * UI, 14, PHOS_DIM);
    for (let i = 0; i < S.bootI; i++) {
      hudText(g, BOOT_LINES[i] || " ", 40 * UI, (90 + i * 26) * UI, 18, PHOS);
    }
    if (S.bootI < BOOT_LINES.length) hudText(g, "█", 50 * UI, (90 + S.bootI * 26) * UI, 18, PHOS);
    hudText(g, "PRESS FIRE TO SKIP", W - 40, H - 40, 12, PHOS_DIM, "right");
  }

  function drawBriefing(g) {
    drawStars(g, 0.4);
    const z = 7 - Math.min(3.2, S.briefT * 0.35);
    drawDeathStar(g, 0, 0.1, z, 0.6 + S.briefT * 0.15, 2.1, WHITE);

    hudText(g, "MISSION BRIEFING  —  DS-1 ORBITAL BATTLE STATION", 40, 28, 14, AMBER);
    const lines = [
      "THE BATTLE STATION IS HEAVILY SHIELDED AND CARRIES A WEAPON",
      "SYSTEM MORE POWERFUL THAN HALF THE STARFLEET.",
      "",
      "A SMALL THERMAL EXHAUST PORT RIGHT BELOW THE MAIN PORT.",
      "THE SHAFT LEADS DIRECTLY TO THE REACTOR SYSTEM.",
      "A PRECISE HIT WILL START A CHAIN REACTION AND DESTROY IT.",
      "",
      "YOU ARE REQUIRED TO MANEUVER STRAIGHT DOWN THIS TRENCH",
      "AND SKIM THE SURFACE TO THIS POINT.",
      "THE PORT IS RAY SHIELDED, SO YOU'LL HAVE TO USE TORPEDOES.",
    ];
    const shown = Math.min(lines.length, Math.floor(S.briefT * 1.5));
    for (let i = 0; i < shown; i++) hudText(g, lines[i], 40, 64 + i * 22, 15, PHOS);

    if (S.briefT > 4) {
      const trenchZ = 5;
      for (let i = 0; i < 8; i++) {
        const zz = trenchZ + i * 0.7;
        const L = project(-0.9, 0.5, zz), R = project(0.9, 0.5, zz);
        const FL = project(-0.9, -0.5, zz), FR = project(0.9, -0.5, zz);
        if (L && R && FL && FR) {
          glowLine(g, L.x, L.y, FL.x, FL.y, PHOS, 1);
          glowLine(g, R.x, R.y, FR.x, FR.y, PHOS, 1);
          glowLine(g, FL.x, FL.y, FR.x, FR.y, PHOS, 1);
        }
      }
    }
    if (S.briefT > 7 && Math.sin(S.t * 4) > 0) {
      hudText(g, "PRESS FIRE TO LAUNCH  —  MAY THE FORCE BE WITH YOU", W / 2, H - 48, 16, AMBER, "center");
    }
  }

  function drawHyperspace(g) {
    drawStars(g, 14 + S.hyperspace * 10);
    vtext(g, "HYPERSPACE", W / 2, H / 2 - 24, 40, FORCE, "center");
    hudText(g, "YAVIN  →  DS-1", W / 2, H / 2 + 28, 16, PHOS, "center");
  }

  function drawVictory(g) {
    drawStars(g, 2);
    const rot = S.winT * 0.4;
    const sc = 2.2 + Math.max(0, S.winT - 4) * 0.4;
    if (S.winT < 5.2) drawDeathStar(g, 0, 0, 6.4, rot, sc, S.winT > 3.5 ? AMBER : WHITE);
    if (S.winT > 1.4 && S.winT < 3.6) {
      const d = (S.winT - 1.4) / 2.2;
      const p0 = project(0, 0, 6.4);
      const p1 = project(0, 0, 6.4);
      if (p0) {
        g.fillStyle = AMBER;
        g.beginPath();
        g.arc(p0.x, p0.y + H * 0.02, 3, 0, Math.PI * 2);
        g.fill();
      }
      void d; void p1;
      const p = project(Math.cos(rot) * 0.05, -0.05 + d * 0.05, 6.2);
      if (p) {
        g.fillStyle = AMBER;
        g.beginPath();
        g.arc(p.x, p.y, 4, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (S.winT > 3.5) {
      drawParticles(g);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + S.winT;
        const r = (S.winT - 3.5) * 80;
        glowLine(g, W / 2, H / 2, W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, i % 2 ? AMBER : WHITE, 1.4);
      }
    }
    if (S.winT > 4.4) {
      vtext(g, "THE BATTLE STATION", W / 2, H * 0.12, 28, PHOS, "center");
      vtext(g, "HAS BEEN DESTROYED", W / 2, H * 0.12 + 40, 28, AMBER, "center");
      hudText(g, "GREAT SHOT KID  ·  THAT WAS ONE IN A MILLION", W / 2, H * 0.78, 16, WHITE, "center");
      hudText(g, "SCORE " + String(S.score).padStart(8, "0") + "    KILLS " + S.kills + "    BEST COMBO x" + S.bestCombo, W / 2, H * 0.84, 14, PHOS, "center");
    }
  }

  function drawGameOver(g) {
    drawStars(g, 1);
    drawParticles(g);
    vtext(g, "GAME OVER", W / 2, H * 0.28, 54, RED, "center", 2);
    hudText(g, "RED FIVE LOST", W / 2, H * 0.28 + 70, 18, PHOS, "center");
    hudText(g, "SCORE " + String(S.score).padStart(8, "0"), W / 2, H * 0.52, 22, AMBER, "center");
    if (Math.sin(S.t * 4) > 0) hudText(g, "PRESS FIRE TO RETURN TO BASE", W / 2, H * 0.68, 16, PHOS, "center");
  }

  function drawEnter(g) {
    drawStars(g, 1);
    vtext(g, "HIGH SCORE", W / 2, H * 0.22, 42, AMBER, "center");
    hudText(g, String(S.score).padStart(8, "0"), W / 2, H * 0.22 + 58, 22, PHOS, "center");
    hudText(g, "ENTER INITIALS  —  LEFT/RIGHT  FIRE TO LOCK", W / 2, H * 0.48, 14, PHOS_DIM, "center");
    const letters = S.initials.split("");
    letters.forEach((ch, i) => {
      const x = W / 2 + (i - 1) * 64;
      vtext(g, ch, x, H * 0.56, 48, i === S.initI ? AMBER : PHOS, "center");
      if (i === S.initI) glowLine(g, x - 22, H * 0.56 + 58, x + 22, H * 0.56 + 58, AMBER, 2);
    });
  }

  function drawWorld(g) {
    if (S.mode === "attract") return drawAttract(g);
    if (S.mode === "boot") return drawBoot(g);
    if (S.mode === "briefing") return drawBriefing(g);
    if (S.mode === "hyperspace") return drawHyperspace(g);
    if (S.mode === "victory") return drawVictory(g);
    if (S.mode === "gameover") return drawGameOver(g);
    if (S.mode === "enter") return drawEnter(g);

    drawStars(g, S.speed * 0.12);
    if (S.mode === "space") {
      drawDeathStar(g, 12, -2.4, 70 + Math.max(0, 18 - S.stageT * 0.5), 0.35, 8.2, DS);
    }
    if (S.mode === "surface") drawSurface(g);
    if (S.mode === "trench" || S.mode === "port") drawTrenchWorld(g);
    drawEnemies(g);
    drawBullets(g);
    drawParticles(g);
  }

  function updateLamps() {
    const playing = ["space", "surface", "trench", "port"].includes(S.mode);
    lampShields.className = "lamp" + (playing ? (S.shields <= 2 ? " hot" : " on") : "");
    lampLock.className = "lamp" + (S.lock && !S.force ? " warn" : "");
    lampForce.className = "lamp force" + (S.force ? " on" : "");
    lampTorp.className = "lamp" + (S.mode === "port" ? " warn" : S.torps > 0 && playing ? " on" : "");
  }

  function firePressed() {
    audio.init();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    if (S.mode === "attract") return startBoot();
    if (S.mode === "boot") return startBriefing();
    if (S.mode === "briefing") return startHyperspace();
    if (S.mode === "gameover") {
      maybeHighScore();
      if (S.mode === "gameover") S.mode = "attract";
      return;
    }
    if (S.mode === "enter") return lockInitial();
    if (S.mode === "victory" && S.winT > 3) return maybeHighScore();
  }

  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function nudgeInitial(dir) {
    const chars = S.initials.split("");
    let i = ABC.indexOf(chars[S.initI]);
    if (i < 0) i = 0;
    i = (i + dir + ABC.length) % ABC.length;
    chars[S.initI] = ABC[i];
    S.initials = chars.join("");
    audio.ui();
  }
  function lockInitial() {
    if (S.initI < 2) {
      S.initI++;
      audio.ui();
    } else {
      const list = loadHS();
      list.push({ name: S.initials, score: S.score });
      list.sort((a, b) => b.score - a.score);
      saveHS(list);
      audio.lock();
      S.mode = "attract";
    }
  }

  function update(dt) {
    S.t += dt;
    shake = Math.max(0, shake - dt * 28);
    flash = Math.max(0, flash - dt);
    audio.tick();

    if (S.pause) return;

    switch (S.mode) {
      case "attract": updateAttract(dt); break;
      case "boot": updateBoot(dt); break;
      case "briefing": updateBriefing(dt); break;
      case "hyperspace": updateHyperspace(dt); break;
      case "space": updateSpace(dt); break;
      case "surface": updateSurface(dt); break;
      case "trench": updateTrench(dt); break;
      case "port": updatePort(dt); break;
      case "dead": updateDead(dt); break;
      case "victory": updateVictory(dt); break;
      case "gameover": S.overT += dt; updateStars(dt * 0.4); break;
      case "enter": updateStars(dt * 0.4); break;
    }
  }

  function render() {
    const sx = shake ? rand(-shake, shake) : 0;
    const sy = shake ? rand(-shake, shake) : 0;

    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.fillStyle = S.force ? "rgba(0, 4, 12, 0.28)" : "rgba(0, 0, 0, 0.32)";
    pctx.fillRect(0, 0, W, H);
    pctx.setTransform(1, 0, 0, 1, sx, sy);
    drawWorld(pctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(persist, 0, 0);
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    drawCockpit(ctx);
    drawTargetingComputer(ctx);
    drawHUD(ctx);

    if (flash > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(255, 70, 50, ${flash * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (S.force && ["trench", "port"].includes(S.mode)) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "rgba(40, 90, 160, 0.08)";
      ctx.fillRect(0, 0, W, H);
    }
    updateLamps();
  }

  function frame(t) {
    const dt = clamp((t - last) / 1000, 0, 0.05);
    last = t;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if (down) keys.add(k); else keys.delete(k);
    if (!down) return;
    if (k === "m") {
      muted = !muted;
      comm(muted ? "AUDIO OFF" : "AUDIO ON", 1.2);
      return;
    }
    if (k === "escape") {
      if (["space", "surface", "trench", "port"].includes(S.mode)) S.pause = !S.pause;
      return;
    }
    if (k === "f") toggleForce();
    if (k === "t") fireTorpedo();
    if (S.mode === "enter") {
      if (k === "arrowleft") { S.initI = (S.initI + 2) % 3; audio.ui(); }
      if (k === "arrowright") { S.initI = (S.initI + 1) % 3; audio.ui(); }
      if (k === "arrowup") nudgeInitial(1);
      if (k === "arrowdown") nudgeInitial(-1);
    }
    if (k === " " || k === "enter") {
      e.preventDefault();
      firePressed();
    }
  }

  canvas.addEventListener("mousemove", (e) => {
    mouse.moved = true;
    if (document.pointerLockElement === canvas) {
      S.stickX = clamp(S.stickX + e.movementX * 0.0032, -1, 1);
      S.stickY = clamp(S.stickY + e.movementY * 0.0032, -1, 1);
    } else {
      const r = canvas.getBoundingClientRect();
      S.stickX = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      S.stickY = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    }
  });
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    mouse.down = true;
    audio.init();
    firePressed();
    if (["space", "surface", "trench", "port"].includes(S.mode)) {
      canvas.requestPointerLock && canvas.requestPointerLock();
      fireLasers();
    }
  });
  window.addEventListener("mouseup", () => { mouse.down = false; });
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    fireTorpedo();
  });
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  document.addEventListener("pointerlockchange", () => {
    mouse.locked = document.pointerLockElement === canvas;
    canvas.style.cursor = mouse.locked ? "none" : "crosshair";
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mouse.down = true;
    audio.init();
    firePressed();
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    S.stickX = clamp(((t.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    S.stickY = clamp(((t.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    if (["space", "surface", "trench", "port"].includes(S.mode)) fireLasers();
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    S.stickX = clamp(((t.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    S.stickY = clamp(((t.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  }, { passive: false });
  canvas.addEventListener("touchend", () => { mouse.down = false; });

  window.addEventListener("resize", resize);
  spawnStars();
  resize();
  canvas.style.cursor = "crosshair";
  last = performance.now();
  requestAnimationFrame(frame);

  window.__trench = {
    S,
    boot: startBoot,
    brief: startBriefing,
    space: () => { resetRun(); startSpace(); },
    surface: () => { resetRun(); startSurface(); },
    trench: () => { resetRun(); startTrench(); S.trenchDist = 80; },
    port: () => { resetRun(); startPort(); S.trenchDist = S.trenchLen - 60; },
    win: () => { resetRun(); S.score = 128400; win(); S.winT = 5; },
    dead: () => { resetRun(); die(); },
  };

  const scene = new URLSearchParams(location.search).get("scene");
  if (scene && window.__trench[scene]) window.__trench[scene]();
})();

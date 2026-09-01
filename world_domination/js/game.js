(() => {
  "use strict";
  // build 4: solid starting blocs, clearer unit figures

  const canvas = document.querySelector("#world");
  const ctx = canvas.getContext("2d", { alpha: false });
  const standingsEl = document.querySelector("#standings");
  const historyCanvas = document.querySelector("#history-plot");
  const historyCtx = historyCanvas.getContext("2d");

  const REGION_NAMES = [
    "USA", "Canada", "Mexico", "S. America",
    "Africa", "Europe", "Russia", "Mid East",
    "India", "China", "SE Asia", "Australia",
  ];
  const REGIONS = [
    ["united states of america", "puerto rico"],
    ["canada"],
    ["mexico", "guatemala", "belize", "honduras", "el salvador", "nicaragua", "costa rica", "panama", "cuba", "haiti", "dominican republic", "jamaica", "the bahamas"],
    ["brazil", "argentina", "chile", "peru", "colombia", "venezuela", "bolivia", "paraguay", "uruguay", "ecuador", "guyana", "suriname", "french guiana", "falkland"],
    ["algeria", "angola", "benin", "botswana", "burkina", "burundi", "cameroon", "central african", "chad", "congo", "djibouti", "egypt", "equatorial guinea", "eritrea", "ethiopia", "gabon", "gambia", "ghana", "guinea", "ivory", "kenya", "lesotho", "liberia", "libya", "madagascar", "malawi", "mali", "mauritania", "morocco", "mozambique", "namibia", "niger", "nigeria", "rwanda", "senegal", "sierra leone", "somalia", "somaliland", "south africa", "south sudan", "sudan", "swaziland", "tanzania", "togo", "tunisia", "uganda", "western sahara", "zambia", "zimbabwe"],
    ["united kingdom", "ireland", "france", "germany", "spain", "portugal", "italy", "switzerland", "austria", "belgium", "netherlands", "luxembourg", "denmark", "norway", "sweden", "finland", "iceland", "poland", "czech", "slovakia", "hungary", "romania", "bulgaria", "greece", "albania", "macedonia", "serbia", "bosnia", "croatia", "slovenia", "montenegro", "kosovo", "estonia", "latvia", "lithuania", "belarus", "ukraine", "moldova", "greenland"],
    ["russia", "kazakhstan", "uzbekistan", "turkmenistan", "kyrgyzstan", "tajikistan", "mongolia"],
    ["saudi", "iran", "iraq", "syria", "jordan", "israel", "lebanon", "kuwait", "qatar", "united arab", "oman", "yemen", "turkey", "georgia", "armenia", "azerbaijan", "west bank", "northern cyprus", "cyprus"],
    ["india", "pakistan", "bangladesh", "nepal", "bhutan", "sri lanka", "afghanistan"],
    ["china", "taiwan", "japan", "north korea", "south korea"],
    ["vietnam", "laos", "cambodia", "thailand", "myanmar", "malaysia", "indonesia", "philippines", "brunei", "east timor", "papua"],
    ["australia", "new zealand", "fiji", "solomon", "vanuatu", "new caledonia"],
  ];
  const FACTIONS = REGIONS.length;
  const HISTORY_MAX = 120;
  const MAX_UNITS = 24;
  const MAX_TOTAL = 140;
  const MAX_CAPSULES = 10;

  const PALETTE = [
    "#1a4d8c", "#8c1e1e", "#0d6b4c", "#8a4a0c",
    "#5a1a78", "#0a5c6e", "#7a2418", "#6e4a0c",
    "#2a5a18", "#8a1848", "#1e3a6e", "#4a1e3a",
  ];
  const ACCENT = [
    "#4d8cff", "#ff4d4d", "#2ee08a", "#ffb020",
    "#c46bff", "#2ad4e6", "#ff6b3a", "#e0b040",
    "#7dff4d", "#ff4d9a", "#6d8cff", "#e06b9a",
  ];

  const KINDS = {
    soldier: { speed: 1.00, burst: 1, fly: false, strike: 0 },
    tank:    { speed: 1.42, burst: 2, fly: false, strike: 0 },
    plane:   { speed: 2.15, burst: 2, fly: true,  strike: 0 },
    missile: { speed: 2.55, burst: 1, fly: true,  strike: 1 },
  };

  let geo = null;
  let world = null;
  let animationId = 0;
  let previousTime = performance.now();
  let accumulatedTime = 0;
  let spawnTimer = 0;
  let dominateTimer = 0;
  let fade = 0;
  let fadingOut = false;
  let resizeTimer = 0;
  let particles = [];
  let missiles = [];
  let standingRows = [];
  let history = [];
  let historyTimer = 0;

  const audio = {
    ctx: null,
    master: null,
    hitGate: 0,
    unlock() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.85;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    ready() { return this.ctx && this.ctx.state === "running"; },
    tone(freq, dur, type, vol, slide) {
      this.unlock();
      if (!this.ready()) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, vol, type, startHz, endHz) {
      this.unlock();
      if (!this.ready()) return;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || "bandpass";
      const t = this.ctx.currentTime;
      f.frequency.setValueAtTime(startHz, t);
      if (endHz) f.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), t + dur);
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + dur + 0.02);
    },
    hit() {},
    power(kind) {
      this.unlock();
      if (!this.ready()) return;
      if (kind === "tank") {
        this.tone(140, 0.12, "square", 0.14);
        this.tone(90, 0.18, "sawtooth", 0.08);
      } else if (kind === "plane") {
        this.noise(0.26, 0.22, "bandpass", 500, 2200);
        this.tone(220, 0.2, "sine", 0.08, 80);
      } else if (kind === "missile") {
        this.noise(0.16, 0.28, "highpass", 1600, 300);
        this.tone(80, 0.2, "sawtooth", 0.12, 40);
        this.tone(1400, 0.08, "square", 0.1, 200);
      } else if (kind === "mult") {
        [523, 659, 784, 1046].forEach((f, i) => {
          window.setTimeout(() => this.tone(f, 0.12, "triangle", 0.16), i * 55);
        });
      }
    },
    zap() {
      this.unlock();
      if (!this.ready()) return;
      this.noise(0.07, 0.16, "highpass", 2200, 500);
      this.tone(1200 + Math.random() * 500, 0.05, "square", 0.07, 260);
    },
  };

  function mixHex(hex, toward, t) {
    const a = parseInt(hex.slice(1), 16);
    const b = parseInt(toward.slice(1), 16);
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
  }

  const LAT_MAX = 84;
  const LAT_MIN = -56;

  function project(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * h];
  }

  function drawRing(c, ring, w, h) {
    let first = true;
    let px = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1], w, h);
      if (first) { c.moveTo(x, y); first = false; }
      else if (Math.abs(x - px) > w * 0.45) c.moveTo(x, y);
      else c.lineTo(x, y);
      px = x;
    }
    c.closePath();
  }

  function regionOf(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("antarctica") || n.includes("french southern")) return -2;
    for (let i = 0; i < REGIONS.length; i++) {
      if (REGIONS[i].includes(n)) return i;
    }
    for (let i = 0; i < REGIONS.length; i++) {
      for (const key of REGIONS[i]) {
        if (key.length >= 7 && n.includes(key)) return i;
      }
    }
    return -1;
  }

  function geoAssign(x, y, cols, rows) {
    const lon = (x + 0.5) / cols * 360 - 180;
    const lat = LAT_MAX - (y + 0.5) / rows * (LAT_MAX - LAT_MIN);
    if (lat > 51 && lon < -129) return 0;
    if (lat > 18.5 && lat < 22.8 && lon < -154 && lon > -161) return 0;
    if (lon <= -25) {
      if (lat >= 49) return 1;
      if (lat >= 24.3) return 0;
      if (lat >= 7.2) return 2;
      return 3;
    }
    if (lon > 112 && lon < 180 && lat < -10) return 11;
    if (lon > 165 && lat < -32) return 11;
    if (lon > -19 && lon < 51 && lat < 37.2 && lat > -35) {
      if (lon > 34 && lat > 29) return 7;
      return 4;
    }
    if (lon > 67 && lon < 90 && lat > 6 && lat < 36) return 8;
    if (lon > 92 && lon < 141 && lat < 20.5 && lat > -11) return 10;
    if (lon > 26 && lon < 64 && lat > 12 && lat < 42.5) return 7;
    if (lon > 97 && lon < 147 && lat > 20 && lat < 54) return 9;
    if (lon > -25 && lon < 29 && lat > 36) return 5;
    if (lon > 28 && lat > 41) return 6;
    if (lon > 29 && lon < 42 && lat > 36 && lat < 48) return 5;
    return 5;
  }

  function rasterize(cols, rows) {
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.imageSmoothingEnabled = false;
    octx.clearRect(0, 0, cols, rows);
    octx.fillStyle = "#fff";
    for (const feat of geo.features) {
      const name = String(feat.properties.name || "").toLowerCase();
      if (name.includes("antarctica") || name.includes("french southern")) continue;
      octx.beginPath();
      const g = feat.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      for (const poly of polys) {
        for (const ring of poly) drawRing(octx, ring, cols, rows);
      }
      octx.fill("evenodd");
    }
    const img = octx.getImageData(0, 0, cols, rows).data;
    const owner = new Int16Array(cols * rows);
    const land = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = y * cols + x;
        if (img[p * 4 + 3] < 20) { owner[p] = -1; continue; }
        land[p] = 1;
        owner[p] = geoAssign(x, y, cols, rows);
      }
    }
    return { owner, land };
  }

  function spawnUnit(owner, kind, x, y, random, brick) {
    const spec = KINDS[kind];
    const ang = random() * Math.PI * 2;
    const cell = brick || (world && world.brick) || 14;
    const base = cell * 18 * spec.speed * (0.92 + random() * 0.16);
    return {
      owner, kind,
      x, y,
      vx: Math.cos(ang) * base,
      vy: Math.sin(ang) * base,
      lastCapture: -1,
    };
  }

  function resetWorld() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const brick = Math.min(width, height) <= 700 ? 16 : 14;
    const cols = Math.max(40, Math.floor(width / brick));
    const rows = Math.max(22, Math.floor(height / brick));
    const cellW = width / cols;
    const cellH = height / rows;
    const { owner, land } = rasterize(cols, rows);

    const cents = Array.from({ length: FACTIONS }, () => ({ x: 0, y: 0, n: 0 }));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const o = owner[y * cols + x];
        if (o < 0) continue;
        cents[o].x += x; cents[o].y += y; cents[o].n++;
      }
    }
    for (const c of cents) if (c.n) { c.x /= c.n; c.y /= c.n; }

    const random = Math.random;
    const units = [];
    for (let f = 0; f < FACTIONS; f++) {
      if (!cents[f].n) continue;
      const x = (cents[f].x + 0.5) * cellW;
      const y = (cents[f].y + 0.5) * cellH;
      units.push(spawnUnit(f, "soldier", x, y, random, brick));
      units.push(spawnUnit(f, "soldier", x + cellW * 0.8, y + cellH * 0.4, random, brick));
    }

    const tileFill = PALETTE.map((c) => mixHex(c, "#071018", 0.12));
    world = {
      width, height, cols, rows, cellW, cellH, brick,
      owner, land, units, cents, tileFill, random,
      powerups: new Map(),
    };
    particles = [];
    missiles = [];
    history = [];
    historyTimer = 0;
    accumulatedTime = 0;
    spawnTimer = 0.4;
    spawnPowerup();
    spawnPowerup();
    spawnPowerup();
    dominateTimer = 0;
    fade = 0;
    fadingOut = false;
    previousTime = performance.now();
    if (!standingRows.length) buildStandings();
    sizeHistoryCanvas();
    refreshLeader();
    recordHistory(ownership().counts);
    drawHistory();
  }

  function cellAt(x, y) {
    if (!world || x < 0 || y < 0 || x >= world.width || y >= world.height) return -2;
    const col = Math.min(world.cols - 1, Math.max(0, Math.floor(x / world.cellW)));
    const row = Math.min(world.rows - 1, Math.max(0, Math.floor(y / world.cellH)));
    return row * world.cols + col;
  }

  function isLand(i) { return i >= 0 && world.land[i]; }
  function blocked(i, unit) {
    if (i === -2) return true;
    if (i < 0) return !KINDS[unit.kind].fly;
    if (!world.land[i]) return !KINDS[unit.kind].fly;
    return world.owner[i] !== unit.owner;
  }

  function isProtected(index, attacker) {
    if (index < 0) return true;
    const col = index % world.cols;
    const row = Math.floor(index / world.cols);
    for (const u of world.units) {
      if (u.owner === attacker) continue;
      const bc = Math.floor(u.x / world.cellW);
      const br = Math.floor(u.y / world.cellH);
      if (Math.abs(col - bc) <= 1 && Math.abs(row - br) <= 1) return true;
    }
    return false;
  }

  function collisionCandidate(unit, nextX, nextY) {
    const samples = 14;
    const hits = [];
    const rad = Math.min(world.cellW, world.cellH) * 0.38;
    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const sx = nextX + Math.cos(angle) * rad;
      const sy = nextY + Math.sin(angle) * rad;
      const index = cellAt(sx, sy);
      if (blocked(index, unit)) hits.push({ index, nx: Math.cos(angle), ny: Math.sin(angle) });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => (b.nx * unit.vx + b.ny * unit.vy) - (a.nx * unit.vx + a.ny * unit.vy));
    const approaching = hits.filter((h) => h.nx * unit.vx + h.ny * unit.vy > 0);
    const surface = approaching.length ? approaching : hits;
    let nx = 0, ny = 0;
    for (const h of surface) { nx += h.nx; ny += h.ny; }
    const len = Math.hypot(nx, ny) || 1;
    return { index: hits[0].index, nx: nx / len, ny: ny / len };
  }

  function findEscape(unit, reflectedAngle, distance) {
    const turn = Math.PI / 18;
    const offsets = [0];
    for (let i = 1; i <= 16; i++) offsets.push(i * turn, -i * turn);
    for (const offset of offsets) {
      const angle = reflectedAngle + offset;
      const x = unit.x + Math.cos(angle) * distance;
      const y = unit.y + Math.sin(angle) * distance;
      if (!collisionCandidate(unit, x, y)) return angle;
    }
    return reflectedAngle + Math.PI * 0.62;
  }

  function captureBurst(origin, owner, count) {
    if (count <= 1) return;
    const cols = world.cols;
    const seen = new Set([origin]);
    const q = [origin];
    let converted = 1;
    while (q.length && converted < count) {
      const i = q.shift();
      const c = i % cols;
      const r = Math.floor(i / cols);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= world.rows) continue;
        const n = nr * cols + nc;
        if (seen.has(n)) continue;
        seen.add(n);
        if (!world.land[n]) continue;
        if (world.owner[n] === owner) { q.push(n); continue; }
        if (isProtected(n, owner)) continue;
        world.owner[n] = owner;
        converted++;
        maybeCollect(n, owner);
        q.push(n);
        if (converted >= count) return;
      }
    }
  }

  function cellCenter(index) {
    return {
      x: ((index % world.cols) + 0.5) * world.cellW,
      y: (Math.floor(index / world.cols) + 0.5) * world.cellH,
    };
  }

  function missilePos(m, u) {
    const x = m.x0 + (m.x1 - m.x0) * u;
    const y = m.y0 + (m.y1 - m.y0) * u - Math.sin(u * Math.PI) * m.arc;
    return { x, y };
  }

  function fireStrike(from, owner) {
    const pool = [];
    for (let i = 0; i < world.owner.length; i++) {
      if (!world.land[i] || world.owner[i] === owner || i === from) continue;
      if (isProtected(i, owner)) continue;
      pool.push(i);
    }
    if (!pool.length) return;
    const target = pool[(Math.random() * pool.length) | 0];
    const a = cellCenter(from), b = cellCenter(target);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    missiles.push({
      x0: a.x, y0: a.y, x1: b.x, y1: b.y,
      arc: Math.min(90, 18 + dist * 0.22),
      owner, target,
      t: 0,
      dur: 0.42 + dist * 0.0005,
      claimed: false,
      color: ACCENT[owner],
    });
    if (missiles.length > 36) missiles.splice(0, missiles.length - 36);
    audio.zap();
  }

  function maybeCollect(index, owner, collector) {
    const kind = world.powerups.get(index);
    if (!kind) return false;
    world.powerups.delete(index);
    const pos = cellCenter(index);
    if (kind === "mult") {
      const srcKind = collector && collector.kind ? collector.kind : "soldier";
      const copies = world.units.filter((u) => u.owner === owner && u.kind === srcKind);
      for (const src of copies) {
        if (world.units.filter((u) => u.owner === owner).length >= MAX_UNITS) break;
        if (world.units.length >= MAX_TOTAL) break;
        world.units.push(spawnUnit(owner, srcKind, src.x + (Math.random() - 0.5) * 10, src.y + (Math.random() - 0.5) * 10, world.random, world.brick));
      }
    } else {
      const mine = world.units.filter((u) => u.owner === owner).length;
      if (mine < MAX_UNITS && world.units.length < MAX_TOTAL) {
        world.units.push(spawnUnit(owner, kind, pos.x, pos.y, world.random, world.brick));
      }
    }
    burst(pos.x, pos.y, ACCENT[owner], 18);
    audio.power(kind);
    return true;
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 140;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.25, age: 0, color, size: 1.2 + Math.random() * 2,
      });
    }
  }

  function pickupKind() {
    const t = accumulatedTime;
    const roll = Math.random();
    if (t < 16) return roll < 0.72 ? "tank" : "mult";
    if (t < 40) return roll < 0.42 ? "tank" : roll < 0.78 ? "plane" : "mult";
    if (roll < 0.28) return "tank";
    if (roll < 0.52) return "plane";
    if (roll < 0.76) return "missile";
    return "mult";
  }

  function spawnPowerup() {
    if (world.powerups.size >= MAX_CAPSULES) return;
    const kind = pickupKind();
    for (let tries = 0; tries < 50; tries++) {
      const i = (Math.random() * world.owner.length) | 0;
      if (!world.land[i] || world.powerups.has(i)) continue;
      world.powerups.set(i, kind);
      return;
    }
  }

  function moveUnit(unit, dt) {
    const nextX = unit.x + unit.vx * dt;
    const nextY = unit.y + unit.vy * dt;
    const hit = collisionCandidate(unit, nextX, nextY);
    const here = cellAt(unit.x, unit.y);
    let picked = here >= 0 && maybeCollect(here, unit.owner, unit);

    if (!hit) {
      unit.x = nextX;
      unit.y = nextY;
      return;
    }

    if (hit.index >= 0) picked = maybeCollect(hit.index, unit.owner, unit) || picked;

    if (accumulatedTime > 0.85 && hit.index >= 0 && isLand(hit.index) && hit.index !== unit.lastCapture && !isProtected(hit.index, unit.owner)) {
      world.owner[hit.index] = unit.owner;
      unit.lastCapture = hit.index;
      const spec = KINDS[unit.kind];
      if (spec.burst > 1) captureBurst(hit.index, unit.owner, spec.burst);
      if (spec.strike) fireStrike(hit.index, unit.owner);
    }

    if (!picked) audio.hit();

    const speed = Math.hypot(unit.vx, unit.vy);
    const dot = unit.vx * hit.nx + unit.vy * hit.ny;
    const rx = unit.vx - 2 * dot * hit.nx;
    const ry = unit.vy - 2 * dot * hit.ny;
    const probe = Math.max(1.5, Math.min(world.cellW, world.cellH) * 0.16);
    const angle = findEscape(unit, Math.atan2(ry, rx), probe);
    unit.vx = Math.cos(angle) * speed;
    unit.vy = Math.sin(angle) * speed;
    const ex = unit.x + Math.cos(angle) * probe;
    const ey = unit.y + Math.sin(angle) * probe;
    if (!collisionCandidate(unit, ex, ey)) { unit.x = ex; unit.y = ey; }
  }

  function landCount() {
    let n = 0;
    for (let i = 0; i < world.land.length; i++) if (world.land[i]) n++;
    return n;
  }

  function ownership() {
    const counts = new Uint32Array(FACTIONS);
    for (let i = 0; i < world.owner.length; i++) {
      const o = world.owner[i];
      if (o >= 0) counts[o]++;
    }
    let best = 0;
    for (let i = 1; i < FACTIONS; i++) if (counts[i] > counts[best]) best = i;
    return { counts, best };
  }

  function unitCounts() {
    const tab = Array.from({ length: FACTIONS }, () => ({ soldier: 0, tank: 0, plane: 0, missile: 0 }));
    for (const u of world.units) {
      if (tab[u.owner] && tab[u.owner][u.kind] != null) tab[u.owner][u.kind]++;
    }
    return tab;
  }

  function buildStandings() {
    standingsEl.innerHTML = "";
    standingRows = [];
    const head = document.createElement("div");
    head.className = "row head";
    head.innerHTML = `<span class="swatch"></span><span class="name"></span><span class="n">Territories</span><span class="u">Soldiers</span><span class="u">Tanks</span><span class="u">Planes</span><span class="u">Rockets</span>`;
    head.style.order = "0";
    standingsEl.appendChild(head);
    for (let i = 0; i < FACTIONS; i++) {
      const row = document.createElement("div");
      row.className = "row";
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = mixHex(PALETTE[i], ACCENT[i], 0.22);
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = REGION_NAMES[i];
      const n = document.createElement("span");
      n.className = "n";
      const s = document.createElement("span");
      s.className = "u";
      const t = document.createElement("span");
      t.className = "u";
      const p = document.createElement("span");
      p.className = "u";
      const m = document.createElement("span");
      m.className = "u";
      row.append(swatch, name, n, s, t, p, m);
      standingsEl.appendChild(row);
      standingRows.push({ row, n, s, t, p, m, team: i });
    }
  }

  function refreshLeader() {
    if (!world || !standingRows.length) return;
    const { counts } = ownership();
    const units = unitCounts();
    const ranked = standingRows
      .map((r) => ({ ...r, count: counts[r.team] }))
      .sort((a, b) => b.count - a.count || a.team - b.team);
    ranked.forEach((r, i) => {
      r.row.style.order = String(i + 1);
      r.n.textContent = r.count.toLocaleString();
      const u = units[r.team];
      r.s.textContent = u.soldier;
      r.t.textContent = u.tank;
      r.p.textContent = u.plane;
      r.m.textContent = u.missile;
    });
  }

  function sizeHistoryCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = historyCanvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    historyCanvas.width = Math.floor(w * dpr);
    historyCanvas.height = Math.floor(h * dpr);
    historyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    historyCanvas._cssW = w;
    historyCanvas._cssH = h;
  }

  function recordHistory(counts) {
    history.push(Array.from(counts));
    if (history.length > HISTORY_MAX) history.shift();
  }

  function drawHistory() {
    const w = historyCanvas._cssW || historyCanvas.clientWidth;
    const h = historyCanvas._cssH || historyCanvas.clientHeight;
    if (!w || !h || history.length < 2) return;
    historyCtx.clearRect(0, 0, w, h);
    const origin = history[0];
    let lo = 0;
    let hi = 0;
    for (const sample of history) {
      for (let t = 0; t < FACTIONS; t++) {
        const d = (sample[t] || 0) - (origin[t] || 0);
        if (d < lo) lo = d;
        if (d > hi) hi = d;
      }
    }
    const padY = Math.max(8, (hi - lo) * 0.18);
    lo -= padY;
    hi += padY;
    if (hi <= lo) { hi = 8; lo = -8; }
    const pad = 2;
    const zeroY = h - pad - ((0 - lo) / (hi - lo)) * (h - pad * 2);
    historyCtx.strokeStyle = "rgba(255,255,255,0.18)";
    historyCtx.lineWidth = 1;
    historyCtx.beginPath();
    historyCtx.moveTo(pad, zeroY);
    historyCtx.lineTo(w - pad, zeroY);
    historyCtx.stroke();
    const span = Math.max(history.length - 1, 1);
    for (let t = 0; t < FACTIONS; t++) {
      historyCtx.beginPath();
      historyCtx.lineWidth = 1.4;
      historyCtx.strokeStyle = ACCENT[t];
      historyCtx.lineJoin = "round";
      for (let i = 0; i < history.length; i++) {
        const d = (history[i][t] || 0) - (origin[t] || 0);
        const x = pad + (i / span) * (w - pad * 2);
        const y = h - pad - ((d - lo) / (hi - lo)) * (h - pad * 2);
        if (i === 0) historyCtx.moveTo(x, y);
        else historyCtx.lineTo(x, y);
      }
      historyCtx.stroke();
    }
  }

  function update(dt) {
    if (!world || fadingOut) return;
    const maxStep = 1 / 120;
    let remaining = Math.min(dt, 0.05);
    while (remaining > 0) {
      const step = Math.min(maxStep, remaining);
      for (let i = 0; i < world.units.length; i++) moveUnit(world.units[i], step);
      remaining -= step;
    }
    spawnTimer -= dt;
    const interval = Math.max(0.7, 2.4 - accumulatedTime * 0.012);
    if (spawnTimer <= 0) {
      spawnPowerup();
      spawnTimer = interval;
    }
    for (const p of particles) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
    }
    particles = particles.filter((p) => p.age < p.life);
    for (const m of missiles) {
      m.t += dt;
      if (!m.claimed && m.t >= m.dur) {
        m.claimed = true;
        if (world.land[m.target]) {
          world.owner[m.target] = m.owner;
          maybeCollect(m.target, m.owner);
        }
        burst(m.x1, m.y1, m.color, 16);
      }
    }
    missiles = missiles.filter((m) => m.t < m.dur + 0.16);

    const { counts, best } = ownership();
    refreshLeader();
    historyTimer += dt;
    if (historyTimer >= 0.14) {
      historyTimer = 0;
      recordHistory(counts);
      drawHistory();
    }
    const land = landCount();
    if (land && counts[best] / land > 0.96) {
      dominateTimer += dt;
      if (dominateTimer > 5.5) { fadingOut = true; fade = 0; }
    } else dominateTimer = 0;
  }

  function drawSoldier(c, r) {
    c.fillStyle = "#1a3d22";
    c.beginPath();
    c.arc(0, -r * 0.38, r * 0.2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(-r * 0.22, -r * 0.14);
    c.lineTo(r * 0.22, -r * 0.14);
    c.lineTo(r * 0.16, r * 0.22);
    c.lineTo(r * 0.12, r * 0.5);
    c.lineTo(-r * 0.12, r * 0.5);
    c.lineTo(-r * 0.16, r * 0.22);
    c.closePath();
    c.fill();
    c.fillRect(-r * 0.34, -r * 0.08, r * 0.16, r * 0.08);
    c.fillRect(r * 0.18, -r * 0.08, r * 0.16, r * 0.08);
  }

  function drawTank(c, r) {
    c.fillStyle = "#1a1c16";
    c.fillRect(-r * 0.52, r * 0.1, r * 1.04, r * 0.28);
    c.fillStyle = "#3c4a28";
    c.fillRect(-r * 0.44, -r * 0.1, r * 0.88, r * 0.28);
    c.fillStyle = "#4a5a30";
    c.fillRect(-r * 0.14, -r * 0.34, r * 0.34, r * 0.26);
    c.fillStyle = "#222218";
    c.fillRect(r * 0.16, -r * 0.28, r * 0.46, r * 0.09);
    c.fillStyle = "#2a2c20";
    c.fillRect(-r * 0.48, r * 0.14, r * 0.12, r * 0.12);
    c.fillRect(-r * 0.2, r * 0.14, r * 0.12, r * 0.12);
    c.fillRect(0.08 * r, r * 0.14, r * 0.12, r * 0.12);
    c.fillRect(0.36 * r, r * 0.14, r * 0.12, r * 0.12);
  }

  function drawPlane(c, r) {
    c.fillStyle = "#c5cdd6";
    c.beginPath();
    c.moveTo(r * 0.56, 0);
    c.lineTo(r * 0.18, -r * 0.08);
    c.lineTo(-r * 0.08, -r * 0.46);
    c.lineTo(-r * 0.22, -r * 0.46);
    c.lineTo(-r * 0.12, -r * 0.08);
    c.lineTo(-r * 0.48, -r * 0.16);
    c.lineTo(-r * 0.48, -r * 0.06);
    c.lineTo(-r * 0.28, 0);
    c.lineTo(-r * 0.48, r * 0.06);
    c.lineTo(-r * 0.48, r * 0.16);
    c.lineTo(-r * 0.12, r * 0.08);
    c.lineTo(-r * 0.22, r * 0.46);
    c.lineTo(-r * 0.08, r * 0.46);
    c.lineTo(r * 0.18, r * 0.08);
    c.closePath();
    c.fill();
    c.fillStyle = "#8a94a0";
    c.fillRect(-r * 0.2, -r * 0.05, r * 0.42, r * 0.1);
  }

  function drawMissile(c, r) {
    c.fillStyle = "#d7dbe0";
    c.beginPath();
    c.moveTo(0, -r * 0.56);
    c.lineTo(r * 0.15, -r * 0.22);
    c.lineTo(r * 0.15, r * 0.22);
    c.lineTo(-r * 0.15, r * 0.22);
    c.lineTo(-r * 0.15, -r * 0.22);
    c.closePath();
    c.fill();
    c.fillStyle = "#c43a22";
    c.beginPath();
    c.moveTo(0, -r * 0.56);
    c.lineTo(r * 0.15, -r * 0.22);
    c.lineTo(-r * 0.15, -r * 0.22);
    c.closePath();
    c.fill();
    c.fillStyle = "#6a7080";
    c.beginPath();
    c.moveTo(-r * 0.15, r * 0.08);
    c.lineTo(-r * 0.32, r * 0.34);
    c.lineTo(-r * 0.15, r * 0.22);
    c.fill();
    c.beginPath();
    c.moveTo(r * 0.15, r * 0.08);
    c.lineTo(r * 0.32, r * 0.34);
    c.lineTo(r * 0.15, r * 0.22);
    c.fill();
    c.fillStyle = "#ff7a20";
    c.beginPath();
    c.moveTo(-r * 0.08, r * 0.22);
    c.lineTo(0, r * 0.48);
    c.lineTo(r * 0.08, r * 0.22);
    c.fill();
  }

  function drawIcon(kind, x, y, s, unit) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === "plane" && unit) ctx.rotate(Math.atan2(unit.vy, unit.vx));
    else if (kind === "tank" && unit && unit.vx < 0) ctx.scale(-1, 1);
    else if (kind === "missile" && unit) ctx.rotate(Math.atan2(unit.vy, unit.vx) + Math.PI / 2);
    if (kind === "soldier") drawSoldier(ctx, s);
    else if (kind === "tank") drawTank(ctx, s);
    else if (kind === "plane") drawPlane(ctx, s);
    else drawMissile(ctx, s);
    ctx.restore();
  }

  function drawCapsule(cx, cy, kind, t) {
    const color = kind === "tank" ? "#c4a24a" : kind === "plane" ? "#6dc8ff" : kind === "mult" ? "#d46bff" : "#ff6b4a";
    const s = Math.max(34, Math.min(world.cellW, world.cellH) * 2.6);
    const pulse = 1 + Math.sin(t * 5) * 0.04;
    const r = (s / 2) * pulse;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#2a3038");
    g.addColorStop(1, "#080a10");
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = color;
    ctx.stroke();
    if (kind === "tank") drawTank(ctx, r * 0.78);
    else if (kind === "plane") drawPlane(ctx, r * 0.78);
    else if (kind === "mult") {
      ctx.fillStyle = color;
      ctx.font = `800 ${Math.max(11, r * 0.85)}px Rajdhani, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×2", 0, 1);
    } else drawMissile(ctx, r * 0.78);
    ctx.restore();
  }

  function strokePath(c, pts) {
    if (!pts || pts.length < 2) return;
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.stroke();
  }

  function draw() {
    if (!world) return;
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, world.width, world.height);

    ctx.strokeStyle = "rgba(80,140,170,0.045)";
    ctx.lineWidth = 1;
    for (let x = 0; x < world.cols; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x * world.cellW, 0);
      ctx.lineTo(x * world.cellW, world.height);
      ctx.stroke();
    }
    for (let y = 0; y < world.rows; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y * world.cellH);
      ctx.lineTo(world.width, y * world.cellH);
      ctx.stroke();
    }

    const gapX = Math.max(0.7, world.cellW * 0.07);
    const gapY = Math.max(0.7, world.cellH * 0.07);
    for (let y = 0; y < world.rows; y++) {
      for (let x = 0; x < world.cols; x++) {
        const i = y * world.cols + x;
        if (!world.land[i]) continue;
        const o = world.owner[i];
        const px = x * world.cellW + gapX * 0.5;
        const py = y * world.cellH + gapY * 0.5;
        ctx.fillStyle = world.tileFill[o] || "#1a2430";
        ctx.fillRect(px, py, world.cellW - gapX, world.cellH - gapY);
      }
    }

    for (const [index, kind] of world.powerups) {
      const p = cellCenter(index);
      drawCapsule(p.x, p.y + Math.sin(accumulatedTime * 4 + index) * 1.4, kind, accumulatedTime);
    }

    for (const p of particles) {
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const m of missiles) {
      const u = Math.max(0, Math.min(1, m.t / m.dur));
      const p = missilePos(m, u);
      const prev = missilePos(m, Math.max(0, u - 0.04));
      ctx.save();
      if (!m.claimed) {
        ctx.strokeStyle = m.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 0.18;
        for (let k = 2; k < 6; k++) {
          const q = missilePos(m, Math.max(0, u - k * 0.035));
          ctx.beginPath();
          ctx.arc(q.x, q.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.y - prev.y, p.x - prev.x) + Math.PI / 2);
        ctx.shadowColor = "#ff7a20";
        ctx.shadowBlur = 10;
        drawMissile(ctx, Math.min(world.cellW, world.cellH) * 0.9);
      } else {
        const boom = (m.t - m.dur) / 0.16;
        ctx.globalAlpha = 1 - boom;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x1, m.y1, 4 + boom * 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    const cell = Math.min(world.cellW, world.cellH);
    for (const u of world.units) {
      const uSize = u.kind === "soldier" ? cell * 1.05 : cell * 1.55;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 4;
      drawIcon(u.kind, u.x, u.y, uSize, u);
      ctx.restore();
    }

    if (fade > 0) {
      ctx.fillStyle = `rgba(4,6,12,${fade})`;
      ctx.fillRect(0, 0, world.width, world.height);
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - previousTime) / 1000);
    previousTime = now;
    accumulatedTime += dt;
    if (fadingOut) {
      fade = Math.min(1, fade + dt * 1.3);
      if (fade >= 1) resetWorld();
    } else update(dt);
    draw();
    animationId = requestAnimationFrame(tick);
  }

  const unlockAudio = () => audio.unlock();
  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("pointermove", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "KeyR") {
      e.preventDefault();
      if (!fadingOut) { fadingOut = true; fade = 0; }
    }
  });
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resetWorld, 100);
  });

  window.__DOM = () => world;

  fetch("data/countries.geo.json")
    .then((r) => r.json())
    .then((data) => {
      geo = data;
      resetWorld();
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(tick);
    })
    .catch((err) => {
      console.error(err);
    });
})();

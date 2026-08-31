(() => {
  "use strict";

  const canvas = document.querySelector("#world");
  const ctx = canvas.getContext("2d", { alpha: false });
  const standingsEl = document.querySelector("#standings");
  const historyCanvas = document.querySelector("#history-plot");
  const historyCtx = historyCanvas.getContext("2d");
  const HISTORY_MAX = 120;

  const PLAYERS = 4;
  const MAX_BALLS_PER_TEAM = 36;
  const MAX_TOTAL_BALLS = 144;
  const MAX_SPEED_MUL = 7;
  const MAX_BURST = 32;
  const SPEED_STEP = 1.38;
  const MAX_CAPSULES = 10;

  const PALETTE = [
    "#0b6e68",
    "#9a5c08",
    "#9a145c",
    "#1a3ea8",
  ];

  const ACCENT = [
    "#2ef0e0",
    "#ffc233",
    "#ff4db8",
    "#5b8cff",
  ];

  const POWER_META = {
    triple: { color: "#d46bff", glow: "rgba(180,80,255,0.75)" },
    speed:  { color: "#3ad4e6", glow: "rgba(50,210,230,0.75)" },
    double: { color: "#e0a24a", glow: "rgba(220,150,60,0.75)" },
  };

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
  let tileFill = [];
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
        this.master.gain.value = 0.62;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    ready() {
      return this.ctx && this.ctx.state === "running";
    },
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
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    hit() {
      this.unlock();
      if (!this.ready()) return;
      const now = this.ctx.currentTime;
      if (now < this.hitGate) return;
      this.hitGate = now + 0.018;
      this.tone(240 + Math.random() * 55, 0.032, "sine", 0.028, 130);
    },
    power(kind) {
      this.unlock();
      if (!this.ready()) return;
      if (kind === "triple") {
        this.tone(392, 0.1, "square", 0.16);
        this.tone(523, 0.12, "square", 0.14);
        window.setTimeout(() => this.tone(659, 0.2, "square", 0.18), 70);
      } else if (kind === "speed") {
        this.tone(480, 0.24, "sawtooth", 0.18, 1680);
        this.tone(720, 0.14, "triangle", 0.1, 1400);
      } else {
        this.tone(196, 0.16, "square", 0.2);
        this.tone(294, 0.22, "triangle", 0.15, 160);
      }
    },
  };

  function mulberry32(seed) {
    return function random() {
      let t = seed += 0x6d2b79f5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mixHex(hex, toward, t) {
    const a = parseInt(hex.slice(1), 16);
    const b = parseInt(toward.slice(1), 16);
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function makeSeeds(count, cols, rows, random) {
    const seeds = [];
    const candidates = Math.max(35, count * 14);
    for (let i = 0; i < candidates && seeds.length < count; i++) {
      const candidate = {
        x: 2 + random() * Math.max(1, cols - 4),
        y: 2 + random() * Math.max(1, rows - 4),
      };
      const separation = seeds.reduce((nearest, seed) => {
        return Math.min(nearest, Math.hypot(candidate.x - seed.x, candidate.y - seed.y));
      }, Infinity);
      const target = Math.sqrt((cols * rows) / count) * 0.52;
      if (separation > target || i > candidates - count + seeds.length) seeds.push(candidate);
    }
    return seeds;
  }

  function brickSizeFor(width, height) {
    const short = Math.min(width, height);
    if (short <= 520) return 18;
    if (short <= 900) return 16;
    return 15;
  }

  function resetWorld(seed) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const brick = brickSizeFor(width, height);
    const cols = Math.max(14, Math.floor(width / brick));
    const rows = Math.max(14, Math.floor(height / brick));
    const cellW = width / cols;
    const cellH = height / rows;
    const useSeed = seed ?? (1 + Math.floor(Math.random() * 999));
    const random = mulberry32(useSeed);
    const midX = cols / 2;
    const midY = rows / 2;
    const seeds = [
      { x: midX * 0.5, y: midY * 0.5 },
      { x: midX + midX * 0.5, y: midY * 0.5 },
      { x: midX * 0.5, y: midY + midY * 0.5 },
      { x: midX + midX * 0.5, y: midY + midY * 0.5 },
    ];
    const cells = new Uint8Array(cols * rows);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const owner = (y < midY ? 0 : 2) + (x < midX ? 0 : 1);
        cells[y * cols + x] = owner;
      }
    }

    const teams = Array.from({ length: PLAYERS }, () => ({
      speedMul: 1,
      burst: 1,
      triples: 0,
    }));

    const balls = seeds.map((s, owner) => spawnBall(s.x, s.y, owner, cellW, cellH, brick, random));

    tileFill = PALETTE.map((c) => mixHex(c, "#050508", 0.04));

    world = {
      width, height, cols, rows, cellW, cellH, cells, balls, teams,
      brick, random, seed: useSeed,
      powerups: new Map(),
    };
    particles = [];
    accumulatedTime = 0;
    spawnTimer = 0.35;
    spawnPowerup();
    spawnPowerup();
    spawnPowerup();
    dominateTimer = 0;
    fade = 0;
    fadingOut = false;
    previousTime = performance.now();
    if (!standingRows.length) buildStandings();
    history = [];
    historyTimer = 0;
    sizeHistoryCanvas();
    refreshLeader();
    const start = ownership();
    recordHistory(start.counts);
    drawHistory();
  }

  function spawnBall(gx, gy, owner, cellW, cellH, brick, random, x, y, angle) {
    const ang = angle ?? random() * Math.PI * 2;
    const base = brick * (19 + random() * 2.75) * 1.55;
    return {
      owner,
      x: x ?? (gx + 0.5) * cellW,
      y: y ?? (gy + 0.5) * cellH,
      vx: Math.cos(ang) * base,
      vy: Math.sin(ang) * base,
      radius: Math.min(cellW, cellH) * 0.52,
      lastCapture: -1,
      captureCooldown: 0,
    };
  }

  function cellAt(x, y) {
    if (!world || x < 0 || y < 0 || x >= world.width || y >= world.height) return -1;
    const col = Math.min(world.cols - 1, Math.max(0, Math.floor(x / world.cellW)));
    const row = Math.min(world.rows - 1, Math.max(0, Math.floor(y / world.cellH)));
    return row * world.cols + col;
  }

  function isProtected(cellIndex, attacker) {
    if (cellIndex < 0) return true;
    const col = cellIndex % world.cols;
    const row = Math.floor(cellIndex / world.cols);
    for (const ball of world.balls) {
      if (ball.owner === attacker) continue;
      const bc = Math.floor(ball.x / world.cellW);
      const br = Math.floor(ball.y / world.cellH);
      if (Math.abs(col - bc) <= 1 && Math.abs(row - br) <= 1) return true;
    }
    return false;
  }

  function collisionCandidate(ball, nextX, nextY) {
    const samples = 16;
    const hits = [];
    const collisionRadius = Math.min(ball.radius, Math.min(world.cellW, world.cellH) * 0.42);
    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const sx = nextX + Math.cos(angle) * collisionRadius;
      const sy = nextY + Math.sin(angle) * collisionRadius;
      const index = cellAt(sx, sy);
      if (index < 0 || world.cells[index] !== ball.owner) {
        hits.push({ index, nx: Math.cos(angle), ny: Math.sin(angle) });
      }
    }
    if (!hits.length) return null;
    hits.sort((a, b) => (b.nx * ball.vx + b.ny * ball.vy) - (a.nx * ball.vx + a.ny * ball.vy));
    const approaching = hits.filter((h) => h.nx * ball.vx + h.ny * ball.vy > 0);
    const surface = approaching.length ? approaching : hits;
    let nx = 0, ny = 0;
    for (const h of surface) { nx += h.nx; ny += h.ny; }
    const length = Math.hypot(nx, ny) || 1;
    return { index: hits[0].index, nx: nx / length, ny: ny / length };
  }

  function findEscape(ball, reflectedAngle, distance) {
    const turn = Math.PI / 18;
    const offsets = [0];
    for (let i = 1; i <= 18; i++) offsets.push(i * turn, -i * turn);
    for (const offset of offsets) {
      const angle = reflectedAngle + offset;
      const x = ball.x + Math.cos(angle) * distance;
      const y = ball.y + Math.sin(angle) * distance;
      if (!collisionCandidate(ball, x, y)) return angle;
    }
    return reflectedAngle + Math.PI * 0.618;
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
      const neigh = [
        r * cols + (c + 1), r * cols + (c - 1),
        (r + 1) * cols + c, (r - 1) * cols + c,
        (r + 1) * cols + (c + 1), (r + 1) * cols + (c - 1),
        (r - 1) * cols + (c + 1), (r - 1) * cols + (c - 1),
      ];
      for (const n of neigh) {
        if (n < 0 || n >= world.cells.length) continue;
        const nc = n % cols;
        const nr = Math.floor(n / cols);
        if (Math.abs(nc - c) > 1 || Math.abs(nr - r) > 1) continue;
        if (seen.has(n)) continue;
        seen.add(n);
        if (world.cells[n] === owner) {
          q.push(n);
          continue;
        }
        if (isProtected(n, owner)) continue;
        world.cells[n] = owner;
        converted++;
        q.push(n);
        maybeCollect(n, owner);
        if (converted >= count) return;
      }
    }
  }

  function maybeCollect(index, owner) {
    const kind = world.powerups.get(index);
    if (!kind) return false;
    world.powerups.delete(index);
    applyPower(owner, kind, index);
    return true;
  }

  function applyPower(owner, kind, index) {
    const team = world.teams[owner];
    const col = index % world.cols;
    const row = Math.floor(index / world.cols);
    const x = (col + 0.5) * world.cellW;
    const y = (row + 0.5) * world.cellH;
    burst(x, y, POWER_META[kind].color, 22);
    audio.power(kind);

    if (kind === "speed") {
      if (team.speedMul < MAX_SPEED_MUL) {
        const next = Math.min(MAX_SPEED_MUL, team.speedMul * SPEED_STEP);
        const ratio = next / team.speedMul;
        team.speedMul = next;
        for (const ball of world.balls) {
          if (ball.owner === owner) { ball.vx *= ratio; ball.vy *= ratio; }
        }
      }
      return;
    }

    if (kind === "double") {
      team.burst = Math.min(MAX_BURST, team.burst * 2);
      return;
    }

    if (kind === "triple") {
      team.triples += 1;
      const mine = world.balls.filter((b) => b.owner === owner);
      const roomTeam = MAX_BALLS_PER_TEAM - mine.length;
      const roomAll = MAX_TOTAL_BALLS - world.balls.length;
      const add = Math.min(mine.length * 2, roomTeam, roomAll);
      if (add <= 0) return;
      const extras = [];
      for (let i = 0; i < add; i++) {
        const src = mine[i % mine.length];
        const ang = Math.atan2(src.vy, src.vx) + (i % 2 === 0 ? 0.45 : -0.45) + (i * 0.17);
        const speed = Math.hypot(src.vx, src.vy);
        extras.push({
          owner,
          x: src.x,
          y: src.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: src.radius,
          lastCapture: -1,
          captureCooldown: 0,
        });
      }
      world.balls.push(...extras);
    }
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 160;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.3, age: 0, color, size: 1.2 + Math.random() * 2,
      });
    }
  }

  function spawnPowerup() {
    if (world.powerups.size >= MAX_CAPSULES) return;
    const roll = world.random();
    const kind = roll < 0.36 ? "triple" : roll < 0.68 ? "speed" : "double";
    for (let tries = 0; tries < 40; tries++) {
      const col = 2 + ((world.random() * (world.cols - 4)) | 0);
      const row = 2 + ((world.random() * (world.rows - 4)) | 0);
      const i = row * world.cols + col;
      if (world.powerups.has(i)) continue;
      world.powerups.set(i, kind);
      return;
    }
  }

  function moveBall(ball, dt) {
    ball.captureCooldown = Math.max(0, ball.captureCooldown - dt);
    const nextX = ball.x + ball.vx * dt;
    const nextY = ball.y + ball.vy * dt;
    const hit = collisionCandidate(ball, nextX, nextY);

    const here = cellAt(ball.x, ball.y);
    let picked = here >= 0 && maybeCollect(here, ball.owner);

    if (!hit) {
      ball.x = nextX;
      ball.y = nextY;
      return;
    }

    if (hit.index >= 0) picked = maybeCollect(hit.index, ball.owner) || picked;

    if (hit.index >= 0 && hit.index !== ball.lastCapture && !isProtected(hit.index, ball.owner)) {
      world.cells[hit.index] = ball.owner;
      ball.lastCapture = hit.index;
      ball.captureCooldown = 0.028;
      const burstN = world.teams[ball.owner].burst;
      if (burstN > 1) captureBurst(hit.index, ball.owner, burstN);
    }

    if (!picked) audio.hit();

    const speed = Math.hypot(ball.vx, ball.vy);
    const dot = ball.vx * hit.nx + ball.vy * hit.ny;
    const reflectedX = ball.vx - 2 * dot * hit.nx;
    const reflectedY = ball.vy - 2 * dot * hit.ny;
    const probe = Math.max(1.5, Math.min(world.cellW, world.cellH) * 0.16);
    const angle = findEscape(ball, Math.atan2(reflectedY, reflectedX), probe);
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;

    const escapeX = ball.x + Math.cos(angle) * probe;
    const escapeY = ball.y + Math.sin(angle) * probe;
    if (!collisionCandidate(ball, escapeX, escapeY)) {
      ball.x = escapeX;
      ball.y = escapeY;
    }
  }

  function ownership() {
    const counts = new Uint32Array(PLAYERS);
    for (let i = 0; i < world.cells.length; i++) counts[world.cells[i]]++;
    let best = 0;
    for (let i = 1; i < PLAYERS; i++) if (counts[i] > counts[best]) best = i;
    return { counts, best };
  }

  function buildStandings() {
    standingsEl.innerHTML = "";
    standingRows = [];
    for (let i = 0; i < PLAYERS; i++) {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.team = String(i);
      const track = document.createElement("div");
      track.className = "track";
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.background = mixHex(PALETTE[i], ACCENT[i], 0.28);
      const n = document.createElement("span");
      n.className = "n";
      n.textContent = "0";
      track.appendChild(bar);
      row.appendChild(track);
      row.appendChild(n);
      standingsEl.appendChild(row);
      standingRows.push({ row, bar, n, team: i });
    }
  }

  function refreshLeader() {
    if (!world || !standingRows.length) return;
    const { counts } = ownership();
    const max = Math.max(1, ...counts);
    const ranked = standingRows
      .map((r) => ({ ...r, count: counts[r.team] }))
      .sort((a, b) => b.count - a.count || a.team - b.team);
    ranked.forEach((r, i) => {
      r.row.style.order = String(i);
      r.bar.style.width = `${(r.count / max) * 100}%`;
      r.n.textContent = r.count.toLocaleString();
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
    history.push([counts[0], counts[1], counts[2], counts[3]]);
    if (history.length > HISTORY_MAX) history.shift();
  }

  function drawHistory() {
    const w = historyCanvas._cssW || historyCanvas.clientWidth;
    const h = historyCanvas._cssH || historyCanvas.clientHeight;
    if (!w || !h) return;
    historyCtx.clearRect(0, 0, w, h);
    if (history.length < 2 || !world) return;
    let lo = Infinity;
    let hi = 0;
    for (const sample of history) {
      for (let t = 0; t < PLAYERS; t++) {
        const v = sample[t];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    const padY = Math.max(6, (hi - lo) * 0.2);
    lo = Math.max(0, lo - padY);
    hi = hi + padY;
    if (hi <= lo) hi = lo + 1;
    const pad = 1.5;
    const span = Math.max(history.length - 1, 1);
    for (let t = 0; t < PLAYERS; t++) {
      historyCtx.beginPath();
      historyCtx.lineWidth = 1.7;
      historyCtx.strokeStyle = ACCENT[t];
      historyCtx.lineJoin = "round";
      historyCtx.lineCap = "round";
      for (let i = 0; i < history.length; i++) {
        const x = pad + (i / span) * (w - pad * 2);
        const y = h - pad - ((history[i][t] - lo) / (hi - lo)) * (h - pad * 2);
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
      for (let i = 0; i < world.balls.length; i++) moveBall(world.balls[i], step);
      remaining -= step;
    }

    spawnTimer -= dt;
    const interval = Math.max(0.38, 1.55 - accumulatedTime * 0.02);
    if (spawnTimer <= 0) {
      spawnPowerup();
      if (world.random() < 0.35) spawnPowerup();
      spawnTimer = interval;
    }

    for (const p of particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    particles = particles.filter((p) => p.age < p.life);

    const { counts, best } = ownership();
    refreshLeader();
    historyTimer += dt;
    if (historyTimer >= 0.12) {
      historyTimer = 0;
      recordHistory(counts);
      drawHistory();
    }
    if (counts[best] / world.cells.length > 0.96) {
      dominateTimer += dt;
      if (dominateTimer > 5.5) startFade();
    } else dominateTimer = 0;
  }

  function startFade() {
    fadingOut = true;
    fade = 0;
  }

  function drawCapsule(cx, cy, kind, t) {
    const meta = POWER_META[kind];
    const s = Math.max(28, Math.min(world.cellW, world.cellH) * 2.15);
    const pulse = 1 + Math.sin(t * 5) * 0.04;
    const r = (s / 2) * pulse;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = meta.glow;
    ctx.shadowBlur = 16;

    const g = ctx.createRadialGradient(-r * 0.28, -r * 0.34, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#2a2c34");
    g.addColorStop(0.55, "#101218");
    g.addColorStop(1, "#07080c");
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = meta.color;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.34, r * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    ctx.strokeStyle = meta.color;
    ctx.fillStyle = meta.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (kind === "triple") {
      const o = r * 0.28;
      const pr = r * 0.16;
      const pts = [[0, -o * 0.95], [-o, o * 0.55], [o, o * 0.55]];
      for (const [px, py] of pts) {
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === "speed") {
      ctx.lineWidth = Math.max(1.6, r * 0.12);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const x = -r * 0.28 + i * r * 0.26;
        ctx.moveTo(x - r * 0.12, -r * 0.28);
        ctx.lineTo(x + r * 0.16, 0);
        ctx.lineTo(x - r * 0.12, r * 0.28);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1.4, r * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.22);
      ctx.lineTo(0, -r * 0.16);
      ctx.moveTo(-r * 0.2, r * 0.02);
      ctx.lineTo(0, -r * 0.22);
      ctx.lineTo(r * 0.2, r * 0.02);
      ctx.lineWidth = Math.max(1.8, r * 0.14);
      ctx.stroke();
    }

    ctx.restore();
  }

  function draw() {
    if (!world) return;
    ctx.fillStyle = "#030306";
    ctx.fillRect(0, 0, world.width, world.height);

    const gapX = Math.max(0.85, world.cellW * 0.08);
    const gapY = Math.max(0.85, world.cellH * 0.08);

    for (let y = 0; y < world.rows; y++) {
      for (let x = 0; x < world.cols; x++) {
        const owner = world.cells[y * world.cols + x];
        const px = x * world.cellW + gapX * 0.5;
        const py = y * world.cellH + gapY * 0.5;
        const w = world.cellW - gapX;
        const h = world.cellH - gapY;
        ctx.fillStyle = tileFill[owner];
        ctx.fillRect(px, py, w, h);
      }
    }

    for (const [index, kind] of world.powerups) {
      const col = index % world.cols;
      const row = Math.floor(index / world.cols);
      const cx = (col + 0.5) * world.cellW;
      const cy = (row + 0.5) * world.cellH + Math.sin(accumulatedTime * 4.2 + index) * 1.6;
      drawCapsule(cx, cy, kind, accumulatedTime + index * 0.2);
    }

    for (const p of particles) {
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const ball of world.balls) {
      const color = ACCENT[ball.owner];
      const speedMul = world.teams[ball.owner].speedMul;
      if (speedMul > 1.15) {
        const spd = Math.hypot(ball.vx, ball.vy) || 1;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = ball.radius * 0.55;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(
          ball.x - (ball.vx / spd) * ball.radius * (1.6 + speedMul * 0.35),
          ball.y - (ball.vy / spd) * ball.radius * (1.6 + speedMul * 0.35)
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = mixHex(PALETTE[ball.owner], "#000000", 0.2);
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;

      const rg = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.35,
        ball.radius * 0.1,
        ball.x, ball.y, ball.radius
      );
      rg.addColorStop(0, "#f2f4f8");
      rg.addColorStop(0.55, "#c8cdd6");
      rg.addColorStop(1, "#8a909a");
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.lineWidth = Math.max(1.1, ball.radius * 0.14);
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    if (fade > 0) {
      ctx.fillStyle = `rgba(3,3,6,${fade})`;
      ctx.fillRect(0, 0, world.width, world.height);
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - previousTime) / 1000);
    previousTime = now;
    accumulatedTime += dt;

    if (fadingOut) {
      fade = Math.min(1, fade + dt * 1.4);
      if (fade >= 1) resetWorld();
    } else {
      update(dt);
    }
    draw();
    animationId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => resetWorld(world ? world.seed : undefined), 80);
  });
  const unlockAudio = () => audio.unlock();
  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("pointermove", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "KeyR") {
      e.preventDefault();
      if (!fadingOut) startFade();
    }
  });

  window.__VOID = () => world;
  resetWorld();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(tick);
})();

(() => {
  const W = 640, H = 360, TW = 40, TH = 40, COLS = 16, ROWS = 9;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  const ROOMS = {
    dungeon: {
      name: "The Dungeon Gate",
      hint: "Arrow keys or WASD to run. Space to jump. The block is a step, not a wall.",
      exits: { e: "teeth" },
      map: [
        "################",
        "#W....T.......W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#........###...#",
        "#@.............#",
        "################",
      ],
    },
    teeth: {
      name: "The Iron Teeth",
      hint: "Get a running start. Spikes do not forgive a short hop.",
      exits: { w: "dungeon", e: "sentry" },
      map: [
        "################",
        "#W............W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@.............#",
        "######^^########",
      ],
    },
    sentry: {
      name: "The Sentry",
      hint: "J or X swings the 24. Two clean hits. Do not stand in his strike.",
      exits: { w: "teeth", e: "shaft" },
      map: [
        "################",
        "#W....T.......W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@......g......#",
        "################",
      ],
    },
    shaft: {
      name: "The Rising Shaft",
      hint: "Jump into a ledge to hang. Up or Space climbs. Down drops.",
      exits: { w: "sentry", n: "blades", e: "cellar" },
      map: [
        "################",
        "#W...........X.#",
        "#........#######",
        "#..............#",
        "#....#####.....#",
        "#..............#",
        "######.........#",
        "#@.............#",
        "################",
      ],
    },
    cellar: {
      name: "The Cellar Bell",
      hint: "An extra bell. K places it. Carry it back west if you want a spare weight.",
      exits: { w: "shaft" },
      map: [
        "################",
        "#W............W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@.........k.+.#",
        "################",
      ],
    },
    blades: {
      name: "The Slicers",
      hint: "Hold Down to goblet-squat under the blades. Time the gaps if you stand.",
      exits: { s: "shaft", e: "scale" },
      map: [
        "################",
        "#W....T.......W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@..s...s...s..#",
        "################",
      ],
    },
    scale: {
      name: "The Scale",
      hint: "Stand on the plate and the gate lifts — with you still on it. Hold Down and press K to leave the bell as a weight.",
      exits: { w: "blades", e: "crumble" },
      map: [
        "################",
        "#W............W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@.k...o..|....#",
        "################",
      ],
    },
    crumble: {
      name: "Loose Stone",
      hint: "The pale floors give way. Do not linger. Slam Down+J in the air to break them faster.",
      exits: { w: "scale", e: "longpress" },
      map: [
        "################",
        "#W............W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@.............#",
        "###~~~~^^~~~~###",
      ],
    },
    longpress: {
      name: "The Long Press",
      hint: "Throw the bell (K) onto the far plate. The gate stays if the iron sits.",
      exits: { w: "crumble", n: "well" },
      map: [
        "################",
        "#W............X#",
        "#........#######",
        "#........|.....#",
        "#........#######",
        "#..............#",
        "#..............#",
        "#@.............#",
        "######..o.######",
      ],
    },
    well: {
      name: "The Dry Well",
      hint: "A long drop is death. Catch every ledge. A snatch-jump (J then Space) reaches higher.",
      exits: { s: "longpress", e: "gauntlet" },
      map: [
        "################",
        "#W.............#",
        "####...........#",
        "#..............#",
        "#........#######",
        "#..............#",
        "######.........#",
        "#@.............#",
        "################",
      ],
    },
    gauntlet: {
      name: "The Gauntlet",
      hint: "Squat, swing, keep moving. The vizier waits above.",
      exits: { w: "well", n: "vizier" },
      map: [
        "################",
        "#W...........X.#",
        "#........#######",
        "#..............#",
        "#....s.........#",
        "#..............#",
        "######....g....#",
        "#@...s.........#",
        "###.^^.#########",
      ],
    },
    vizier: {
      name: "The Grand Vizier",
      hint: "He trained with iron too. Three hits. Do not trade blindly.",
      exits: { s: "gauntlet", e: "tower" },
      map: [
        "################",
        "#W....T.......W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@........g...+#",
        "################",
      ],
      boss: true,
    },
    tower: {
      name: "The High Tower",
      hint: "The princess has not been idle.",
      exits: { w: "vizier" },
      map: [
        "################",
        "#W............W#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#..............#",
        "#@...........P.#",
        "################",
      ],
    },
  };

  const START_ROOM = "dungeon";
  const START_TIME = 60 * 60;

  const keys = Object.create(null);
  const hold = Object.create(null);
  let pointer = { left: false, right: false, down: false, jump: false, swing: false, throw: false };

  const bellImg = new Image();
  bellImg.src = "assets/bell.png";
  const wallImg = new Image();
  wallImg.src = "assets/wall.jpg";

  const SFX = {
    ctx: null,
    musicOn: false,
    nextNote: 0,
    ensure() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep(freq, dur, type, gain, slide) {
      this.ensure();
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(gain || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, gain, freq) {
      this.ensure();
      const t = this.ctx.currentTime;
      const n = this.ctx.createBufferSource();
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 800;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      n.connect(f).connect(g).connect(this.ctx.destination);
      n.start(t);
    },
    step() { this.beep(140, 0.04, "triangle", 0.03); },
    jump() { this.beep(240, 0.12, "square", 0.05, 140); },
    land() { this.noise(0.08, 0.07, 220); },
    swing() { this.noise(0.16, 0.09, 500); this.beep(180, 0.14, "sawtooth", 0.04, 80); },
    clang() { this.beep(520, 0.08, "square", 0.07); this.beep(260, 0.16, "triangle", 0.05); },
    gate() { this.beep(90, 0.3, "square", 0.05, 50); },
    potion() { this.beep(520, 0.12, "sine", 0.05); this.beep(780, 0.18, "sine", 0.04); },
    hurt() { this.beep(160, 0.2, "sawtooth", 0.07, 70); },
    die() { this.beep(220, 0.4, "sawtooth", 0.07, 50); },
    win() { [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.22, "triangle", 0.05), i * 140)); },
    tick(now) {
      if (!this.musicOn || !this.ctx) return;
      if (now < this.nextNote) return;
      const scale = [146.83, 164.81, 174.61, 196, 220, 233.08, 277.18, 293.66];
      const f = scale[(Math.random() * 8) | 0];
      if (Math.random() < 0.55) this.beep(f / 2, 0.35, "sine", 0.018);
      this.nextNote = now + 0.55 + Math.random() * 0.7;
    },
  };

  const state = {
    mode: "title",
    roomId: START_ROOM,
    tiles: [],
    solids: [],
    guards: [],
    bells: [],
    plates: [],
    gates: [],
    slicers: [],
    potions: [],
    princess: null,
    particles: [],
    player: null,
    spawn: { x: 48, y: 200 },
    timeLeft: START_TIME,
    dead: false,
    won: false,
    deathReason: "",
    banner: 0,
    bannerText: "",
    roomHintT: 0,
    camShake: 0,
    tick: 0,
    fallFrom: 0,
  };

  function tileAt(c, r) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return "#";
    return state.tiles[r][c];
  }
  function isSolidChar(ch) {
    return ch === "#" || ch === "~" || ch === "^";
  }
  function isSolid(c, r) {
    if (c < 0 || c >= COLS) return true;
    if (r < 0) return !(ROOMS[state.roomId].exits && ROOMS[state.roomId].exits.n);
    if (r >= ROWS) return false;
    const ch = state.tiles[r][c];
    if (ch === "#" || ch === "~" || ch === "^" || ch === "o") return true;
    for (const g of state.gates) {
      if (g.c === c && g.r === r && g.closed > 0.55) return true;
    }
    return false;
  }

  function loadRoom(id, fromDir) {
    const def = ROOMS[id];
    state.roomId = id;
    state.tiles = def.map.map((row) => row.split(""));
    state.guards = [];
    state.bells = [];
    state.plates = [];
    state.gates = [];
    state.slicers = [];
    state.potions = [];
    state.princess = null;
    state.particles = [];
    let start = null;
    const plateCells = [];
    const gateCells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = state.tiles[r][c];
        if (ch === "@") {
          start = { x: c * TW + 20, y: r * TH + (TH - 38) };
          state.tiles[r][c] = ".";
        } else if (ch === "X") {
          state.tiles[r][c] = ".";
        } else if (ch === "W" || ch === "T") {
          // keep as deco, not solid
        } else if (ch === "g") {
          state.guards.push(makeGuard(c * TW + 10, r * TH + (TH - 38), !!def.boss));
          state.tiles[r][c] = ".";
        } else if (ch === "k") {
          state.bells.push(makeBell(c * TW + 10, r * TH + TH - 22, false));
          state.tiles[r][c] = ".";
        } else if (ch === "o") {
          plateCells.push({ c, r });
          state.tiles[r][c] = r === ROWS - 1 ? "#" : ".";
        } else if (ch === "|") {
          gateCells.push({ c, r });
          state.tiles[r][c] = ".";
        } else if (ch === "s") {
          state.slicers.push({ c, r, x: c * TW + 8, y: r * TH - 20, t: c * 0.7, period: 2.2 });
          state.tiles[r][c] = ".";
        } else if (ch === "+" || ch === "*") {
          state.potions.push({ x: c * TW + 14, y: r * TH + 10, kind: ch === "+" ? "hp" : "time", taken: false });
          state.tiles[r][c] = ".";
        } else if (ch === "P") {
          state.princess = { x: c * TW + 8, y: r * TH + (TH - 38), t: 0 };
          state.tiles[r][c] = ".";
        }
      }
    }
    plateCells.forEach((p, i) => {
      state.plates.push({ c: p.c, r: p.r, x: p.c * TW, y: p.r * TH + TH - 6, on: false, gate: i });
    });
    gateCells.forEach((g, i) => {
      state.gates.push({ c: g.c, r: g.r, x: g.c * TW, y: g.r * TH - TH, closed: 1, id: i });
    });

    const p = state.player;
    if (fromDir === "e") {
      p.x = 18;
      p.y = start ? start.y : p.y;
    } else if (fromDir === "w") {
      p.x = W - 18 - p.w;
      p.y = start ? start.y : p.y;
    } else if (fromDir === "n") {
      p.y = H - 80;
      p.x = start ? start.x : p.x;
    } else if (fromDir === "s") {
      p.y = 48;
      p.x = start ? start.x : p.x;
    } else if (start) {
      p.x = start.x;
      p.y = start.y;
    }
    state.spawn = { x: p.x, y: p.y };
    p.vx = 0;
    p.vy = 0;
    p.state = "idle";
    p.stateT = 0;
    p.hanging = false;
    p.invuln = 0.4;
    state.fallFrom = p.y;
    state.roomHintT = 6;
    $("hud-room").textContent = def.name;
    $("hud-hint").textContent = def.hint || "";
  }

  function makePlayer() {
    return {
      x: 48, y: 240, w: 16, h: 38,
      vx: 0, vy: 0, facing: 1,
      onGround: false, hanging: false, hang: null,
      state: "idle", stateT: 0, anim: 0,
      hasBell: true, carried: 0,
      hp: 3, maxHp: 3, invuln: 0,
      swingHit: false, landLock: 0, coyote: 0,
      careful: false, squat: false,
    };
  }
  function makeGuard(x, y, boss) {
    return {
      x, y, w: 16, h: 38, vx: 0, facing: -1,
      hp: boss ? 3 : 2, boss,
      state: "patrol", t: 0, anim: 0,
      minX: Math.max(40, x - 90), maxX: Math.min(W - 56, x + 90),
      dead: false,
    };
  }
  function makeBell(x, y, flying) {
    return { x, y, w: 16, h: 18, vx: 0, vy: 0, flying: !!flying, rest: !flying, t: 0 };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function moveSolid(a) {
    a.x += a.vx;
    let hits = tilesOverlapping(a.x, a.y, a.w, a.h);
    for (const h of hits) {
      if (a.vx > 0) a.x = h.x - a.w - 0.01;
      else if (a.vx < 0) a.x = h.x + TW + 0.01;
      a.vx = 0;
    }
    a.y += a.vy;
    a.onGround = false;
    hits = tilesOverlapping(a.x, a.y, a.w, a.h);
    for (const h of hits) {
      if (a.vy >= 0) {
        a.y = h.y - a.h - 0.01;
        a.vy = 0;
        a.onGround = true;
      } else {
        a.y = h.y + TH + 0.01;
        a.vy = 0;
      }
    }
  }

  function tilesOverlapping(x, y, w, h) {
    const out = [];
    const c0 = Math.floor(x / TW), c1 = Math.floor((x + w - 0.001) / TW);
    const r0 = Math.floor(y / TH), r1 = Math.floor((y + h - 0.001) / TH);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (isSolid(c, r)) out.push({ c, r, x: c * TW, y: r * TH, ch: tileAt(c, r) });
      }
    }
    return out;
  }

  function pressed(name) {
    return !!(keys[name] || pointer[name]);
  }
  function consume(name) {
    if (hold[name]) return false;
    if (keys[name] || pointer[name]) {
      hold[name] = true;
      return true;
    }
    return false;
  }

  function updatePlayer(dt) {
    const p = state.player;
    if (state.dead || state.won) return;
    p.stateT += dt;
    p.anim += dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.landLock > 0) p.landLock -= dt;
    p.careful = pressed("shift");
    const left = pressed("left");
    const right = pressed("right");
    const down = pressed("down");
    const locked = p.state === "swing" || p.state === "throw" || p.state === "climb" || p.state === "die" || p.landLock > 0;

    if (p.hanging) {
      p.vx = 0;
      p.vy = 0;
      if (consume("jump") || consume("up")) startClimb(p);
      else if (down) {
        p.hanging = false;
        p.state = "fall";
        p.vy = 0.8;
      }
      return;
    }

    p.squat = down && p.onGround && !locked;
    if (!locked && !p.squat) {
      const spd = p.careful ? 0.85 : (p.carried ? 1.55 : 2.35);
      if (left && !right) {
        p.facing = -1;
        p.vx = -spd;
      } else if (right && !left) {
        p.facing = 1;
        p.vx = spd;
      } else {
        p.vx *= p.onGround ? 0.6 : 0.92;
        if (Math.abs(p.vx) < 0.08) p.vx = 0;
      }
    } else if (p.squat) {
      p.vx *= 0.5;
    }

    if (p.careful && p.onGround && p.vx) {
      const footX = p.facing > 0 ? p.x + p.w + 2 : p.x - 2;
      const footC = Math.floor(footX / TW);
      const footR = Math.floor((p.y + p.h + 4) / TH);
      if (!isSolid(footC, footR)) p.vx = 0;
    }

    if (p.onGround) p.coyote = 0.09;
    else p.coyote -= dt;

    const wantJump = consume("jump") || consume("up");
    if (wantJump && (p.onGround || p.coyote > 0) && !p.squat && !locked) {
      const snatch = p.state === "swing" && p.stateT < 0.18 && p.hasBell;
      p.vy = snatch ? -9.4 : -7.85;
      p.onGround = false;
      p.coyote = 0;
      p.state = "jump";
      p.stateT = 0;
      state.fallFrom = p.y;
      SFX.jump();
      dust(p.x + p.w / 2, p.y + p.h, 6);
    }

    if (!p.onGround) {
      p.vy += (p.vy > 0 ? 0.34 : 0.3);
      if (p.vy > 9) p.vy = 9;
    }

    if (!locked && consume("swing")) {
      p.state = "swing";
      p.stateT = 0;
      p.swingHit = false;
      SFX.swing();
    }
    if (!locked && consume("throw") && p.hasBell) {
      if (p.squat || p.careful) placeBell(p);
      else throwBell(p);
    } else if (!locked && consume("throw") && p.carried > 0) {
      placeCarried(p);
    }

    if (p.state === "swing") {
      if (p.onGround) p.vx *= 0.82;
      if (p.stateT > 0.12 && p.stateT < 0.32 && !p.swingHit) doSwingHit(p);
      if (p.stateT > 0.42) {
        p.state = p.onGround ? "idle" : "fall";
        p.stateT = 0;
      }
    }
    if (p.state === "throw" && p.stateT > 0.28) {
      p.state = p.onGround ? "idle" : "fall";
      p.stateT = 0;
    }

    if (p.state === "climb") {
      p.vx = 0;
      p.vy = 0;
      p.y -= 2.4;
      if (p.stateT > 0.28) {
        p.hanging = false;
        p.state = "idle";
        p.onGround = true;
        if (p.hang) {
          p.x = p.hang.c * TW + (p.facing > 0 ? 8 : 16);
          p.y = p.hang.r * TH - p.h - 1;
        }
      }
      return;
    }

    const wasGround = p.onGround;
    moveSolid(p);
    tryLedgeGrab(p);

    if (!wasGround && p.onGround) {
      const drop = p.y - state.fallFrom;
      SFX.land();
      dust(p.x + p.w / 2, p.y + p.h, 8);
      p.landLock = 0.06;
      if (drop > 118) {
        kill("THE PRINCE HAS FALLEN");
        return;
      }
      if (p.state !== "swing") {
        p.state = "land";
        p.stateT = 0;
      }
    }
    if (p.onGround) state.fallFrom = p.y;
    else if (p.vy > 0 && p.state !== "swing" && p.state !== "throw" && p.state !== "climb") {
      p.state = "fall";
    }

    if (p.onGround && p.state === "land" && p.stateT > 0.12) p.state = "idle";
    if (p.onGround && !locked && p.state !== "land") {
      if (p.squat) p.state = "squat";
      else if (Math.abs(p.vx) > 0.2) p.state = p.careful ? "walk" : "run";
      else p.state = "idle";
    }

    checkHazards(p);
    checkExits(p);
    pickupBells(p);
    pickupPotions(p);
    if (state.princess && aabb(p, { x: state.princess.x, y: state.princess.y, w: 20, h: 38 })) win();
  }

  function tryLedgeGrab(p) {
    if (p.onGround || p.hanging || p.vy < 0.35 || p.squat) return;
    const handY = p.y + 6;
    const frontX = p.facing > 0 ? p.x + p.w + 5 : p.x - 5;
    const c = Math.floor(frontX / TW);
    const r = Math.floor(handY / TH);
    if (!isSolid(c, r) || isSolid(c, r - 1)) return;
    const ledgeY = r * TH;
    if (p.y > ledgeY - 2 && p.y < ledgeY + 14) {
      p.hanging = true;
      p.hang = { c, r };
      p.x = p.facing > 0 ? c * TW - p.w - 1 : c * TW + TW + 1;
      p.y = ledgeY - 6;
      p.vx = 0;
      p.vy = 0;
      p.state = "hang";
      p.stateT = 0;
      SFX.step();
    }
  }
  function startClimb(p) {
    p.state = "climb";
    p.stateT = 0;
    SFX.step();
  }

  function doSwingHit(p) {
    p.swingHit = true;
    const box = {
      x: p.facing > 0 ? p.x + p.w - 2 : p.x - 30,
      y: p.y + 6,
      w: 32,
      h: 26,
    };
    if (!p.hasBell) {
      box.w = 18;
    }
    for (const g of state.guards) {
      if (g.dead) continue;
      if (aabb(box, g)) {
        g.hp -= p.hasBell ? 1 : 0.5;
        g.facing = -p.facing;
        g.x += p.facing * 10;
        g.state = "stun";
        g.t = 0;
        SFX.clang();
        state.camShake = 5;
        sparks(g.x + 8, g.y + 16);
        if (g.hp <= 0) {
          g.dead = true;
          g.state = "dead";
          dust(g.x + 8, g.y + 30, 14);
        }
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.tiles[r][c] === "~") {
          const tile = { x: c * TW, y: r * TH, w: TW, h: TH };
          if (aabb(box, tile)) crumble(c, r);
        }
      }
    }
  }

  function throwBell(p) {
    p.hasBell = false;
    p.state = "throw";
    p.stateT = 0;
    const b = makeBell(p.x + (p.facing > 0 ? p.w : -16), p.y + 8, true);
    b.vx = p.facing * 5.2 + p.vx * 0.3;
    b.vy = -3.6;
    b.rest = false;
    state.bells.push(b);
    SFX.swing();
  }
  function placeBell(p) {
    if (!p.hasBell && p.carried <= 0) return;
    if (p.hasBell) p.hasBell = false;
    else p.carried--;
    const b = makeBell(p.x + (p.facing > 0 ? p.w + 2 : -18), p.y + p.h - 18, false);
    b.rest = false;
    b.vy = 0.4;
    state.bells.push(b);
    p.state = "throw";
    p.stateT = 0;
    SFX.land();
  }
  function placeCarried(p) {
    p.carried--;
    const b = makeBell(p.x + (p.facing > 0 ? p.w + 2 : -18), p.y + p.h - 18, false);
    b.rest = false;
    state.bells.push(b);
    SFX.land();
  }
  function pickupBells(p) {
    for (let i = state.bells.length - 1; i >= 0; i--) {
      const b = state.bells[i];
      if (b.flying) continue;
      if (!aabb(p, { x: b.x, y: b.y, w: b.w, h: b.h })) continue;
      if (!p.hasBell) {
        p.hasBell = true;
        state.bells.splice(i, 1);
        SFX.step();
      } else if (p.carried < 2) {
        p.carried++;
        state.bells.splice(i, 1);
        SFX.step();
      }
    }
  }
  function pickupPotions(p) {
    for (const pot of state.potions) {
      if (pot.taken) continue;
      if (aabb(p, { x: pot.x, y: pot.y, w: 12, h: 16 })) {
        pot.taken = true;
        SFX.potion();
        if (pot.kind === "hp") p.hp = Math.min(p.maxHp, p.hp + 1);
        else state.timeLeft += 90;
        banner(pot.kind === "hp" ? "Strength returns" : "The sands slow");
      }
    }
  }

  function updateBells(dt) {
    for (const b of state.bells) {
      b.t += dt;
      if (b.rest && !b.flying) continue;
      b.vy += 0.28;
      if (b.vy > 8) b.vy = 8;
      b.x += b.vx;
      b.y += b.vy;
      const hits = tilesOverlapping(b.x, b.y, b.w, b.h);
      if (hits.length) {
        const h = hits[0];
        if (b.vy > 0) {
          b.y = h.y - b.h - 0.1;
          b.vy = 0;
          b.vx *= 0.4;
          b.flying = false;
          if (Math.abs(b.vx) < 0.3) {
            b.vx = 0;
            b.rest = true;
            SFX.land();
          }
        } else {
          b.vx *= -0.4;
          b.x += b.vx * 2;
        }
      }
      if (b.flying) {
        for (const g of state.guards) {
          if (g.dead) continue;
          if (aabb({ x: b.x, y: b.y, w: b.w, h: b.h }, g)) {
            g.hp -= 1;
            g.state = "stun";
            g.t = 0;
            b.flying = false;
            b.vx *= -0.2;
            SFX.clang();
            if (g.hp <= 0) {
              g.dead = true;
              g.state = "dead";
            }
          }
        }
      }
    }
  }

  function updatePlates() {
    for (const plate of state.plates) {
      const box = { x: plate.x + 4, y: plate.y - 8, w: TW - 8, h: 12 };
      let on = aabb(state.player, box);
      for (const b of state.bells) {
        if (!b.flying && aabb({ x: b.x, y: b.y, w: b.w, h: b.h }, box)) on = true;
      }
      if (on !== plate.on && on) SFX.gate();
      plate.on = on;
    }
    for (const g of state.gates) {
      const plate = state.plates[g.id] || state.plates[0];
      const want = plate && plate.on ? 0 : 1;
      g.closed += (want - g.closed) * 0.12;
    }
  }

  function updateSlicers(dt) {
    for (const s of state.slicers) {
      s.t += dt;
      const wave = (Math.sin((s.t / s.period) * Math.PI * 2) + 1) / 2;
      s.y = s.r * TH - 36 + wave * 28;
      s.cut = wave < 0.72;
    }
  }

  function updateGuards(dt) {
    const p = state.player;
    for (const g of state.guards) {
      if (g.dead) {
        g.vy = (g.vy || 0) + 0.3;
        g.y += g.vy;
        const hits = tilesOverlapping(g.x, g.y, g.w, g.h);
        if (hits.length && g.vy > 0) {
          g.y = hits[0].y - g.h;
          g.vy = 0;
        }
        continue;
      }
      g.t += dt;
      g.anim += dt;
      const sameFloor = Math.abs((g.y + g.h) - (p.y + p.h)) < 28;
      const dx = (p.x + p.w / 2) - (g.x + g.w / 2);
      if (g.state === "stun") {
        g.vx = 0;
        if (g.t > 0.35) g.state = "chase";
      } else if (g.state === "strike") {
        g.vx = 0;
        if (g.t > 0.18 && g.t < 0.28) {
          const box = { x: g.facing > 0 ? g.x + g.w : g.x - 22, y: g.y + 8, w: 24, h: 22 };
          if (!state.dead && aabb(box, p) && p.invuln <= 0 && !p.squat) {
            hurt(1, "STRUCK DOWN");
          }
        }
        if (g.t > 0.7) g.state = "chase";
      } else if (sameFloor && Math.abs(dx) < 200 && !state.dead) {
        g.state = "chase";
        g.facing = dx > 0 ? 1 : -1;
        if (Math.abs(dx) < 26) {
          g.state = "strike";
          g.t = 0;
          g.vx = 0;
        } else {
          g.vx = g.facing * (g.boss ? 1.35 : 1.15);
        }
      } else {
        g.state = "patrol";
        if (g.x < g.minX) g.facing = 1;
        if (g.x > g.maxX) g.facing = -1;
        g.vx = g.facing * 0.7;
      }
      g.vy = (g.vy || 0) + 0.3;
      moveSolid(g);
    }
  }

  function checkHazards(p) {
    const feet = tilesOverlapping(p.x + 3, p.y + p.h - 4, p.w - 6, 6);
    for (const h of feet) {
      if (h.ch === "^") {
        kill("IMPALED");
        return;
      }
      if (h.ch === "~") {
        h.stand = (h.stand || 0);
      }
    }
    // crumble timer via tile metadata
    const c0 = Math.floor((p.x + 4) / TW);
    const c1 = Math.floor((p.x + p.w - 4) / TW);
    const r = Math.floor((p.y + p.h + 2) / TH);
    for (let c = c0; c <= c1; c++) {
      if (tileAt(c, r) === "~") {
        const key = c + "," + r;
        state._crumb = state._crumb || {};
        state._crumb[key] = (state._crumb[key] || 0) + 0.016;
        if (state._crumb[key] > 0.45) crumble(c, r);
      }
    }
    if (p.state === "swing" && pressed("down") && !p.onGround && p.hasBell) {
      // slam
      p.vy = Math.max(p.vy, 8);
      const below = tilesOverlapping(p.x, p.y + p.h, p.w, 8);
      for (const h of below) if (h.ch === "~") crumble(h.c, h.r);
    }
    const hitH = p.squat ? 22 : p.h;
    const hitY = p.squat ? p.y + (p.h - 22) : p.y;
    for (const s of state.slicers) {
      if (!s.cut) continue;
      const box = { x: s.c * TW + 10, y: s.y, w: 20, h: 36 };
      if (aabb({ x: p.x + 3, y: hitY, w: p.w - 6, h: hitH }, box)) {
        kill("SLICED");
        return;
      }
    }
    if (p.y > H + 20) kill("THE PRINCE HAS FALLEN");
  }

  function crumble(c, r) {
    if (state.tiles[r][c] !== "~") return;
    state.tiles[r][c] = ".";
    dust(c * TW + 20, r * TH + 8, 10);
    SFX.land();
  }

  function checkExits(p) {
    const room = ROOMS[state.roomId];
    const ex = room.exits || {};
    if (ex.e && p.x + p.w > W - 12 && p.vx >= 0) enter(ex.e, "e");
    else if (ex.w && p.x < 12 && p.vx <= 0) enter(ex.w, "w");
    else if (ex.n && p.y < 14) enter(ex.n, "n");
    else if (ex.s && p.y + p.h > H - 4) enter(ex.s, "s");
  }
  function enter(id, from) {
    loadRoom(id, from);
  }

  function hurt(n, reason) {
    const p = state.player;
    if (p.invuln > 0 || state.dead) return;
    p.hp -= n;
    p.invuln = 0.9;
    p.vx = -p.facing * 2.2;
    p.vy = -3;
    SFX.hurt();
    state.camShake = 7;
    if (p.hp <= 0) kill(reason || "THE PRINCE IS DEAD");
  }
  function kill(reason) {
    if (state.dead) return;
    state.dead = true;
    state.deathReason = reason;
    state.player.state = "die";
    state.player.stateT = 0;
    SFX.die();
    banner(reason, "Space · tap to rise in this room");
    setTimeout(() => {
      if (state.mode === "play" && state.dead) showEnd(false);
    }, 1600);
  }
  function win() {
    if (state.won) return;
    state.won = true;
    SFX.win();
    showEnd(true);
  }
  function showEnd(victory) {
    state.mode = "end";
    $("hud").classList.add("hidden");
    $("banner").classList.add("hidden");
    $("end").classList.remove("hidden");
    if (victory) {
      $("end-kicker").textContent = "The palace is yours";
      $("end-title").innerHTML = "The Princess<br />was already swinging";
      const left = formatTime(state.timeLeft);
      $("end-tag").textContent = "“You're late,” she says. “I saved the first set for you.”  ·  " + left + " remaining";
      $("btn-again").textContent = "One more palace";
    } else {
      $("end-kicker").textContent = "A kettlebell falls in the palace";
      $("end-title").innerHTML = state.deathReason === "TIME HAS RUN OUT"
        ? "The sands<br />ran out"
        : (state.deathReason || "The Prince<br />has fallen").replace(" ", "<br />");
      $("end-tag").textContent = "The vizier still holds the tower.";
      $("btn-again").textContent = "Rise again";
    }
  }

  function banner(text, sub) {
    const el = $("banner");
    el.innerHTML = text + (sub ? "<small>" + sub + "</small>" : "");
    el.classList.remove("hidden");
    state.banner = 2.2;
    state.bannerText = text;
  }

  function dust(x, y, n) {
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x, y, vx: (Math.random() - 0.5) * 2.4, vy: -Math.random() * 1.6,
        life: 0.4 + Math.random() * 0.3, t: 0, c: "#c4b08a",
      });
    }
  }
  function sparks(x, y) {
    for (let i = 0; i < 10; i++) {
      state.particles.push({
        x, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3,
        life: 0.25 + Math.random() * 0.2, t: 0, c: "#f0d48a",
      });
    }
  }
  function updateParticles(dt) {
    for (const q of state.particles) {
      q.t += dt;
      q.x += q.vx;
      q.y += q.vy;
      q.vy += 0.12;
    }
    state.particles = state.particles.filter((q) => q.t < q.life);
  }

  function formatTime(t) {
    const s = Math.max(0, Math.ceil(t));
    const m = (s / 60) | 0;
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function newGame() {
    for (const k of Object.keys(hold)) hold[k] = false;
    for (const k of Object.keys(keys)) keys[k] = false;
    state.player = makePlayer();
    state.timeLeft = START_TIME;
    state.dead = false;
    state.won = false;
    state.deathReason = "";
    state._crumb = {};
    loadRoom(START_ROOM, null);
    state.mode = "play";
    $("title").classList.add("hidden");
    $("crawl").classList.add("hidden");
    $("end").classList.add("hidden");
    $("hud").classList.remove("hidden");
    SFX.musicOn = true;
  }

  const CRAWL = "The Grand Vizier has seized the palace.\nYour sword was taken at the gate.\nYou still have the 24.\n\nSixty minutes.";
  function startCrawl() {
    state.mode = "crawl";
    $("title").classList.add("hidden");
    $("crawl").classList.remove("hidden");
    $("crawl-text").textContent = "";
    let i = 0;
    clearInterval(state._crawl);
    state._crawl = setInterval(() => {
      i++;
      $("crawl-text").textContent = CRAWL.slice(0, i);
      if (i >= CRAWL.length) {
        clearInterval(state._crawl);
        setTimeout(() => { if (state.mode === "crawl") newGame(); }, 700);
      }
    }, 28);
  }

  function restartRoom() {
    if (state.mode !== "play" && state.mode !== "end") return;
    $("end").classList.add("hidden");
    $("banner").classList.add("hidden");
    $("hud").classList.remove("hidden");
    const hp = Math.max(1, state.player ? state.player.hp : 3);
    const has = state.player ? state.player.hasBell : true;
    const car = state.player ? state.player.carried : 0;
    state.player = makePlayer();
    state.player.hp = state.dead && hp <= 0 ? 3 : hp;
    if (state.dead && hp <= 0) {
      state.player.hasBell = true;
      state.player.carried = 0;
    } else {
      state.player.hasBell = has;
      state.player.carried = car;
    }
    state.dead = false;
    state.won = false;
    state.mode = "play";
    state._crumb = {};
    loadRoom(state.roomId, null);
    state.player.x = state.spawn.x;
    state.player.y = state.spawn.y;
  }

  // ---------- render ----------
  function draw() {
    const shakeX = state.camShake ? (Math.random() - 0.5) * state.camShake : 0;
    const shakeY = state.camShake ? (Math.random() - 0.5) * state.camShake : 0;
    if (state.camShake) state.camShake *= 0.86;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackdrop();
    drawTiles();
    drawPlates();
    drawGates();
    drawSlicers();
    drawPotions();
    for (const b of state.bells) drawBell(b.x, b.y, 0, 1);
    for (const g of state.guards) drawGuard(g);
    if (state.princess) drawPrincess(state.princess);
    if (state.player) drawPrince(state.player);
    for (const q of state.particles) {
      ctx.globalAlpha = 1 - q.t / q.life;
      ctx.fillStyle = q.c;
      ctx.fillRect(q.x, q.y, 2, 2);
      ctx.globalAlpha = 1;
    }
    drawVignette();
    ctx.restore();
    drawHudBits();
  }

  function drawBackdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#141821");
    g.addColorStop(0.45, "#1b1a18");
    g.addColorStop(1, "#0c0d10");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // moonlight shafts from windows
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tileAt(c, r) === "W") {
          const x = c * TW + 8;
          const grd = ctx.createLinearGradient(x, r * TH, x + 50, H);
          grd.addColorStop(0, "rgba(160,190,230,0.16)");
          grd.addColorStop(1, "rgba(160,190,230,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(x, r * TH + 8);
          ctx.lineTo(x + 22, r * TH + 8);
          ctx.lineTo(x + 70, H);
          ctx.lineTo(x + 10, H);
          ctx.fill();
          // moon window
          ctx.fillStyle = "#121820";
          ctx.beginPath();
          ctx.moveTo(c * TW + 6, r * TH + 28);
          ctx.lineTo(c * TW + 6, r * TH + 12);
          ctx.quadraticCurveTo(c * TW + 20, r * TH + 2, c * TW + 34, r * TH + 12);
          ctx.lineTo(c * TW + 34, r * TH + 28);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d7e2ef";
          ctx.beginPath();
          ctx.arc(c * TW + 22, r * TH + 16, 5.5, 0.2, Math.PI * 1.6);
          ctx.fill();
        }
        if (tileAt(c, r) === "T") {
          const flicker = 0.7 + Math.sin(state.tick * 9 + c) * 0.15;
          ctx.fillStyle = `rgba(255,160,60,${0.18 * flicker})`;
          ctx.beginPath();
          ctx.arc(c * TW + 20, r * TH + 16, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#3a2414";
          ctx.fillRect(c * TW + 18, r * TH + 8, 4, 16);
          ctx.fillStyle = `rgb(255,${140 + flicker * 80 | 0},40)`;
          ctx.beginPath();
          ctx.ellipse(c * TW + 20, r * TH + 7, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // far arches
    ctx.strokeStyle = "rgba(80,70,55,0.25)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 160, 210, 70, Math.PI, 0);
      ctx.stroke();
    }
  }

  function drawTiles() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = tileAt(c, r);
        const x = c * TW, y = r * TH;
        if (ch === "#" || ch === "~") {
          if (wallImg.complete && wallImg.naturalWidth) {
            ctx.drawImage(wallImg, (c * 37) % 120, (r * 29) % 120, 40, 40, x, y, TW, TH);
            ctx.fillStyle = ch === "~" ? "rgba(210,190,140,0.18)" : "rgba(20,14,10,0.28)";
            ctx.fillRect(x, y, TW, TH);
          } else {
            ctx.fillStyle = ch === "~" ? "#8a7354" : "#5a4636";
            ctx.fillRect(x, y, TW, TH);
          }
          ctx.strokeStyle = "rgba(20,14,10,0.45)";
          ctx.strokeRect(x + 0.5, y + 0.5, TW - 1, TH - 1);
          if (ch === "#") {
            ctx.fillStyle = "rgba(230,210,170,0.07)";
            ctx.fillRect(x, y, TW, 3);
          } else {
            ctx.fillStyle = "rgba(240,220,160,0.2)";
            for (let i = 0; i < 3; i++) ctx.fillRect(x + 6 + i * 10, y + 8, 6, 2);
          }
        } else if (ch === "^") {
          ctx.fillStyle = "#2a2420";
          ctx.fillRect(x, y + 22, TW, 18);
          ctx.fillStyle = "#8a8c92";
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 24);
          for (let i = 0; i < 4; i++) {
            ctx.lineTo(x + 5 + i * 10, y + 4);
            ctx.lineTo(x + 8 + i * 10, y + 24);
          }
          ctx.fill();
          ctx.fillStyle = "#c8cdd4";
          for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i * 10, y + 4, 2, 10);
        }
      }
    }
  }

  function drawPlates() {
    for (const p of state.plates) {
      ctx.fillStyle = p.on ? "#6a5a30" : "#3a3428";
      ctx.fillRect(p.x + 4, p.y, TW - 8, 6);
      ctx.fillStyle = p.on ? "#c9a24a" : "#7a6a48";
      ctx.fillRect(p.x + 6, p.y - (p.on ? 2 : 4), TW - 12, 4);
    }
  }
  function drawGates() {
    for (const g of state.gates) {
      const h = TH * 2 * g.closed;
      if (h < 2) continue;
      ctx.fillStyle = "#2a2c32";
      ctx.fillRect(g.c * TW + 12, g.r * TH + TH - h, 16, h);
      ctx.fillStyle = "#6a6e78";
      for (let i = 0; i < 4; i++) ctx.fillRect(g.c * TW + 15, g.r * TH + TH - h + 8 + i * 14, 10, 3);
      ctx.fillStyle = "#c9a24a";
      ctx.fillRect(g.c * TW + 18, g.r * TH + TH - 12, 4, 8);
    }
  }
  function drawSlicers() {
    for (const s of state.slicers) {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(s.c * TW + 16, s.r * TH - 40, 8, 16);
      ctx.save();
      ctx.translate(s.c * TW + 20, s.y + 8);
      ctx.rotate(Math.sin(s.t * 14) * 0.4);
      ctx.fillStyle = "#c4c8d0";
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, -5);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8a1e1e";
      ctx.fillRect(-14, -2, 10, 4);
      ctx.restore();
    }
  }
  function drawPotions() {
    for (const pot of state.potions) {
      if (pot.taken) continue;
      ctx.fillStyle = pot.kind === "hp" ? "#8a1e1e" : "#2a6a8a";
      ctx.beginPath();
      ctx.ellipse(pot.x + 6, pot.y + 10, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(pot.x + 4, pot.y + 5, 2, 4);
    }
  }

  function drawBell(x, y, rot, scale) {
    const s = scale || 1;
    if (bellImg.complete && bellImg.naturalWidth) {
      ctx.save();
      ctx.translate(x + 8, y + 10);
      ctx.rotate(rot || 0);
      ctx.drawImage(bellImg, -9 * s, -11 * s, 18 * s, 26 * s);
      ctx.restore();
    } else {
      ctx.fillStyle = "#2e2e32";
      ctx.beginPath();
      ctx.arc(x + 8, y + 12, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6a6a70";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 8, y + 4, 4 * s, Math.PI, 0);
      ctx.stroke();
    }
  }

  function limb(ax, ay, bx, by, w, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function poseFor(p) {
    const t = p.anim;
    const base = {
      hipY: 0, torso: 0.04, head: 0,
      lThigh: 0.06, lShin: 0.04, rThigh: -0.04, rShin: 0.06,
      lArm: 0.25, lFore: 0.35, rArm: 0.05, rFore: 0.55,
      bell: 1,
    };
    if (p.state === "run" || p.state === "walk") {
      const spd = p.state === "walk" ? 7 : 11;
      const ph = Math.sin(t * spd);
      base.lThigh = ph * 0.7;
      base.rThigh = -ph * 0.7;
      base.lShin = 0.2 + Math.max(0, ph) * 0.5;
      base.rShin = 0.2 + Math.max(0, -ph) * 0.5;
      base.lArm = -ph * 0.5;
      base.rArm = 0.15 + ph * 0.35;
      base.rFore = 1.0;
      base.torso = ph * 0.05;
    } else if (p.state === "jump" || p.state === "fall") {
      base.lThigh = -0.4; base.rThigh = 0.25;
      base.lShin = 0.7; base.rShin = 0.4;
      base.lArm = -0.6; base.rArm = 0.8; base.rFore = 0.4;
    } else if (p.state === "squat") {
      base.hipY = 10;
      base.lThigh = 1.1; base.rThigh = 1.0;
      base.lShin = 1.3; base.rShin = 1.25;
      base.torso = 0.25;
      base.rArm = 0.6; base.rFore = 1.3;
      base.lArm = 0.5; base.lFore = 1.2;
    } else if (p.state === "swing") {
      const k = Math.min(1, p.stateT / 0.42);
      const arc = k < 0.35 ? -0.9 - k * 1.2 : -1.4 + (k - 0.35) * 5.2;
      base.rArm = arc;
      base.rFore = 0.2;
      base.lArm = 0.8;
      base.torso = k < 0.35 ? -0.15 : 0.25;
      base.lThigh = 0.3; base.rThigh = -0.2;
    } else if (p.state === "throw") {
      base.rArm = 1.4; base.rFore = 0.2;
      base.lArm = -0.4; base.torso = 0.2;
    } else if (p.state === "hang" || p.state === "climb") {
      base.lArm = -2.5; base.rArm = -2.3;
      base.lFore = 0.2; base.rFore = 0.3;
      base.lThigh = 0.3; base.rThigh = -0.15;
      base.hipY = 6;
    } else if (p.state === "die") {
      base.hipY = 16; base.torso = 1.2; base.head = 0.4;
      base.lThigh = 0.8; base.rThigh = 1.1;
    } else if (p.state === "land") {
      base.hipY = 4; base.lThigh = 0.4; base.rThigh = 0.35;
    } else {
      base.rArm = 0.15 + Math.sin(t * 2) * 0.04;
      base.torso = 0.04 + Math.sin(t * 2) * 0.015;
    }
    return base;
  }

  function drawPrince(p) {
    const pose = poseFor(p);
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h);
    ctx.scale(p.facing * 1.65, 1.65);
    if (p.invuln > 0 && ((p.invuln * 20) | 0) % 2 === 0) ctx.globalAlpha = 0.45;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    const hipY = -17 + pose.hipY;
    const shY = hipY - 16;
    const skin = "#c9956c";
    const pants = "#efe6d6";
    const sash = "#8b1e1e";
    const hair = "#1a1210";
    const boot = "#3d2b1f";

    function bone(ang, len) {
      return { x: Math.sin(ang) * len, y: Math.cos(ang) * len };
    }
    const lT = bone(pose.lThigh, 11);
    const lS = bone(pose.lThigh + pose.lShin, 11);
    const rT = bone(pose.rThigh, 11);
    const rS = bone(pose.rThigh + pose.rShin, 11);
    const lA = bone(pose.lArm, 9);
    const lF = bone(pose.lArm + pose.lFore, 9);
    const rA = bone(pose.rArm, 9);
    const rF = bone(pose.rArm + pose.rFore, 9);

    limb(0, hipY, lT.x, hipY + lT.y, 8, pants);
    limb(lT.x, hipY + lT.y, lT.x + lS.x, hipY + lT.y + lS.y, 6.5, pants);
    ctx.fillStyle = boot;
    ctx.beginPath();
    ctx.ellipse(lT.x + lS.x + 3, hipY + lT.y + lS.y + 1.2, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    limb(0, shY, lA.x, shY + lA.y, 5, skin);
    limb(lA.x, shY + lA.y, lA.x + lF.x, shY + lA.y + lF.y, 4.2, skin);

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-6.5, shY - 2);
    ctx.lineTo(6.5, shY - 1);
    ctx.lineTo(5.2, hipY + 3);
    ctx.lineTo(-5.2, hipY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sash;
    ctx.beginPath();
    ctx.moveTo(-6, hipY - 4);
    ctx.lineTo(7, hipY - 5);
    ctx.lineTo(8, hipY + 3);
    ctx.lineTo(-7, hipY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(-6, hipY - 5, 13, 1.6);

    limb(0, hipY, rT.x, hipY + rT.y, 8, pants);
    limb(rT.x, hipY + rT.y, rT.x + rS.x, hipY + rT.y + rS.y, 6.5, pants);
    ctx.fillStyle = boot;
    ctx.beginPath();
    ctx.ellipse(rT.x + rS.x + 3, hipY + rT.y + rS.y + 1.2, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    limb(0, shY, rA.x, shY + rA.y, 5, skin);
    limb(rA.x, shY + rA.y, rA.x + rF.x, shY + rA.y + rF.y, 4.2, skin);
    const hx = rA.x + rF.x, hy = shY + rA.y + rF.y;
    if (p.hasBell) {
      const rot = p.state === "swing" ? pose.rArm + 1.2 : 0.12;
      drawBell(hx - 9, hy - 10, rot, 0.82);
    }
    if (p.carried > 0) drawBell(-16, hipY - 4, 0.1, 0.8);

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(1.2, shY - 9, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0.6, shY - 10.2, 6.5, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, shY - 8);
    ctx.quadraticCurveTo(-8, shY - 2, -4, shY + 2);
    ctx.lineTo(-2, shY - 6);
    ctx.fill();
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(-4.2, shY - 11.2, 11, 2);
    ctx.fillStyle = "#2a1a12";
    ctx.fillRect(3.8, shY - 9.4, 1.6, 1);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGuard(g) {
    ctx.save();
    ctx.translate(g.x + g.w / 2, g.y + g.h);
    ctx.scale(g.facing * 1.55, 1.55);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 1, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const skin = g.boss ? "#a87850" : "#b88962";
    const cloth = g.boss ? "#4a1424" : "#2c3038";
    ctx.fillStyle = cloth;
    ctx.fillRect(-7, -32, 14, 24);
    ctx.fillStyle = "#1a1816";
    ctx.fillRect(-6, -16, 5, 16);
    ctx.fillRect(1, -16, 5, 16);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1210";
    ctx.beginPath();
    ctx.arc(0, -40, 6.2, Math.PI, 0);
    ctx.fill();
    if (g.boss) {
      ctx.fillStyle = "#c9a24a";
      ctx.fillRect(-7, -30, 14, 3);
      ctx.fillRect(-5, -42, 10, 2);
    }
    if (!g.dead) {
      ctx.save();
      const swing = g.state === "strike" ? -1.2 + Math.min(1, g.t * 4) * 2.4 : 0.35;
      ctx.translate(7, -26);
      ctx.rotate(swing);
      drawBell(-8, -6, 0, 0.9);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(140,20,20,0.4)";
      ctx.fillRect(-10, -6, 20, 5);
    }
    ctx.restore();
  }

  function drawPrincess(pr) {
    pr.t += 0.016;
    ctx.save();
    ctx.translate(pr.x + 10, pr.y + 38);
    ctx.scale(1.55, 1.55);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 1, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a2030";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(7, -24);
    ctx.lineTo(-7, -24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d4a07a";
    ctx.fillRect(-5, -28, 4, 8);
    ctx.fillRect(1, -28, 4, 8);
    ctx.beginPath();
    ctx.arc(0, -32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1210";
    ctx.beginPath();
    ctx.arc(-1, -33, 6.2, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(-4.5, -34, 9, 1.6);
    const a = Math.sin(pr.t * 3) * 0.7;
    ctx.save();
    ctx.translate(8, -20);
    ctx.rotate(a);
    drawBell(-7, -2, 0, 0.7);
    ctx.restore();
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 380);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawHudBits() {
    if (state.mode !== "play") return;
    const p = state.player;
    const hp = $("hud-hp");
    let html = "";
    for (let i = 0; i < p.maxHp; i++) {
      html += `<span style="display:inline-block;width:12px;height:14px;margin-left:4px;background:${i < p.hp ? "#c9a24a" : "#2a2418"};clip-path:polygon(20% 0,80% 0,100% 30%,70% 100%,30% 100%,0 30%)"></span>`;
    }
    if (p.hasBell) html += `<span style="margin-left:10px;color:#9a8b70;letter-spacing:.12em">24kg</span>`;
    else html += `<span style="margin-left:10px;color:#8a1e1e;letter-spacing:.12em">unarmed</span>`;
    if (p.carried) html += `<span style="margin-left:8px;color:#9a8b70">+${p.carried}</span>`;
    hp.innerHTML = html;
    $("hud-time").textContent = formatTime(state.timeLeft);
    $("hud-time").style.color = state.timeLeft < 60 ? "#c44" : "#e6d7b4";
    if (state.roomHintT > 0) {
      $("hud-hint").style.opacity = Math.min(1, state.roomHintT);
    } else $("hud-hint").style.opacity = 0.35;
  }

  // ---------- loop / input / scale ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    state.tick += dt;
    if (state.mode === "play") {
      if (!state.dead && !state.won) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          kill("TIME HAS RUN OUT");
        }
      }
      if (state.banner > 0) {
        state.banner -= dt;
        if (state.banner <= 0) $("banner").classList.add("hidden");
      }
      if (state.roomHintT > 0) state.roomHintT -= dt;
      updatePlayer(dt);
      updateBells(dt);
      updateGuards(dt);
      updatePlates();
      updateSlicers(dt);
      updateParticles(dt);
      SFX.tick(now / 1000);
      draw();
    } else if (state.mode === "end") {
      draw();
    }
    requestAnimationFrame(frame);
  }

  function scaleFrame() {
    const extra = matchMedia("(pointer: coarse)").matches ? 88 : 24;
    const s = Math.max(1, Math.min(
      (window.innerWidth - 28) / W,
      (window.innerHeight - extra) / H
    ));
    canvas.style.width = W * s + "px";
    canvas.style.height = H * s + "px";
    const hud = $("hud");
    hud.style.transform = `translate(-50%, -50%) scale(${s})`;
    hud.style.width = W + "px";
    hud.style.height = H + "px";
  }

  const KEYMAP = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    " ": "jump",
    j: "swing", J: "swing", x: "swing", X: "swing",
    k: "throw", K: "throw", c: "throw", C: "throw",
    Shift: "shift",
    r: "restart", R: "restart",
  };

  window.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.key];
    if (!k) return;
    if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
    keys[k] = true;
    SFX.ensure();
    if (state.mode === "title" && (k === "jump" || k === "swing")) startCrawl();
    else if (state.mode === "crawl" && k === "jump") { clearInterval(state._crawl); newGame(); }
    else if (state.mode === "end" && (k === "jump" || k === "restart")) {
      if (state.won) { state.mode = "title"; $("end").classList.add("hidden"); $("title").classList.remove("hidden"); }
      else restartRoom();
    } else if (state.mode === "play" && state.dead && k === "jump") restartRoom();
    else if (state.mode === "play" && k === "restart") restartRoom();
  });
  window.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.key];
    if (!k) return;
    keys[k] = false;
    hold[k] = false;
  });

  $("btn-start").addEventListener("click", () => { SFX.ensure(); startCrawl(); });
  $("btn-skip").addEventListener("click", () => { clearInterval(state._crawl); newGame(); });
  $("btn-again").addEventListener("click", () => {
    if (state.won) {
      $("end").classList.add("hidden");
      $("title").classList.remove("hidden");
      state.mode = "title";
    } else restartRoom();
  });

  function bindTouch(btn) {
    const k = btn.dataset.k;
    const on = (e) => { e.preventDefault(); pointer[k] = true; SFX.ensure();
      if (state.mode === "title") startCrawl();
      if (state.mode === "play" && state.dead && k === "jump") restartRoom();
    };
    const off = (e) => { e.preventDefault(); pointer[k] = false; hold[k] = false; };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  }
  document.querySelectorAll("#touch button").forEach(bindTouch);

  window.addEventListener("resize", scaleFrame);
  scaleFrame();
  $("touch").classList.remove("hidden");
  requestAnimationFrame(frame);
  if (/[?&]play=1/.test(location.search) || /[?&]demo=1/.test(location.search)) newGame();
  if (/[?&]room=/.test(location.search)) {
    const id = new URLSearchParams(location.search).get("room");
    if (ROOMS[id]) {
      if (state.mode !== "play") newGame();
      loadRoom(id, null);
    }
  }
  if (/[?&]demo=1/.test(location.search)) {
    pointer.right = true;
    setTimeout(() => { pointer.jump = true; setTimeout(() => { pointer.jump = false; }, 120); }, 280);
  }
})();

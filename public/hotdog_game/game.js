(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const CATCH_WIN = 10;
  const DROP_LOSE = 3;
  const GRAVITY = 0.17;

  const PATHS = {
    bg: "assets/bg.jpg",
    cannon: "assets/cannon.png",
    hotdog: "assets/hotdog.png",
    splat: "assets/splat.png",
    explode: "assets/man_explode.png",
    man: [
      "assets/man_0.png",
      "assets/man_3.png",
      "assets/man_6.png",
      "assets/man_9.png",
    ],
  };

  const imgs = { man: [] };
  let loaded = false;

  const state = {
    mode: "title", // title | play | win | lose
    caught: 0,
    dropped: 0,
    playerX: 520,
    targetX: 520,
    keys: { left: false, right: false },
    dogs: [],
    splats: [],
    floats: [],
    puffs: [],
    nextShot: 0,
    last: 0,
    shake: 0,
    chew: 0,
    recoil: 0,
    winFlash: 0,
    endTimer: 0,
  };

  const audio = {
    ctx: null,
    unlock() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep(freq, dur, type, gain, slide) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(gain ?? 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur);
    },
    noise(dur, gain) {
      if (!this.ctx) return;
      const n = this.ctx.sampleRate * dur;
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      src.buffer = buf;
      f.type = "lowpass";
      f.frequency.value = 900;
      g.gain.value = gain ?? 0.12;
      src.connect(f);
      f.connect(g);
      g.connect(this.ctx.destination);
      src.start();
    },
    boom() {
      this.noise(0.18, 0.16);
      this.beep(140, 0.22, "sawtooth", 0.07, 50);
    },
    chomp() {
      this.beep(220, 0.08, "square", 0.07);
      this.beep(330, 0.1, "square", 0.05);
    },
    splat() {
      this.noise(0.2, 0.14);
      this.beep(90, 0.18, "triangle", 0.06, 40);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.22, "square", 0.07), i * 120);
      });
    },
    lose() {
      this.beep(330, 0.25, "sawtooth", 0.07, 120);
      setTimeout(() => this.beep(196, 0.45, "sawtooth", 0.07, 80), 220);
    },
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(src));
      im.src = src;
    });
  }

  async function loadAll() {
    const jobs = [
      loadImage(PATHS.bg).then((i) => (imgs.bg = i)),
      loadImage(PATHS.cannon).then((i) => (imgs.cannon = i)),
      loadImage(PATHS.hotdog).then((i) => (imgs.hotdog = i)),
      loadImage(PATHS.splat).then((i) => (imgs.splat = i)),
      loadImage(PATHS.explode).then((i) => (imgs.explode = i)),
      ...PATHS.man.map((p, n) => loadImage(p).then((i) => (imgs.man[n] = i))),
    ];
    await Promise.all(jobs);
    loaded = true;
  }

  function manIndex() {
    if (state.caught >= 9) return 3;
    if (state.caught >= 6) return 2;
    if (state.caught >= 3) return 1;
    return 0;
  }

  function manImg() {
    if (state.mode === "win") return imgs.explode;
    return imgs.man[manIndex()];
  }

  function manSize() {
    const im = manImg();
    const h = state.mode === "win" ? 310 : 300;
    const w = (im.width / im.height) * h;
    return { w, h };
  }

  function mouthOf() {
    const { w, h } = manSize();
    // Tight zone centered on the open mouth of these sprites.
    return {
      x: state.playerX + w * (0.355 + manIndex() * 0.028),
      y: H - 18 - h + h * (0.255 + manIndex() * 0.01),
      r: 16,
    };
  }

  function feetY() {
    return H - 18;
  }

  function cannonBox() {
    const h = 168;
    const w = (imgs.cannon.width / imgs.cannon.height) * h;
    return { x: -10, y: H - h - 8, w, h };
  }

  function muzzle() {
    const c = cannonBox();
    return { x: c.x + c.w * 0.86, y: c.y + c.h * 0.14 };
  }

  function reset() {
    state.mode = "play";
    state.caught = 0;
    state.dropped = 0;
    state.playerX = 500;
    state.targetX = 500;
    state.dogs = [];
    state.splats = [];
    state.floats = [];
    state.puffs = [];
    state.nextShot = 1100;
    state.shake = 0;
    state.chew = 0;
    state.recoil = 0;
    state.winFlash = 0;
    if (state.endTimer) {
      clearTimeout(state.endTimer);
      state.endTimer = 0;
    }
    setOverlay(false);
    status();
    setMsg("Open wide!");
  }

  function status() {
    document.getElementById("st-caught").textContent = `Caught: ${state.caught} / ${CATCH_WIN}`;
    document.getElementById("st-dropped").textContent = `Dropped: ${state.dropped} / ${DROP_LOSE}`;
  }

  function setMsg(t) {
    document.getElementById("st-msg").textContent = t;
  }

  function setOverlay(on, title, msg, icon, btn) {
    const overlay = document.getElementById("overlay");
    overlay.classList.toggle("hidden", !on);
    const hint = document.getElementById("dlg-hint");
    if (!on) return;
    document.getElementById("dlg-title").textContent = title;
    document.getElementById("dlg-msg").innerHTML = msg;
    document.getElementById("dlg-icon").textContent = icon;
    document.getElementById("btn-start").textContent = btn;
    const showHint = btn === "Start!" || title === "Hot Dog Catcher 95";
    hint.classList.toggle("hidden", !showHint);
  }

  function shoot(now) {
    const m = muzzle();
    const landX = 240 + Math.random() * 460;
    const flight = 70 + Math.random() * 34;
    const gy = feetY() - 14;
    state.dogs.push({
      x: m.x,
      y: m.y,
      vx: (landX - m.x) / flight,
      vy: (gy - m.y) / flight - 0.5 * GRAVITY * flight,
      rot: Math.random() * Math.PI,
      spin: (Math.random() * 0.18 + 0.08) * (Math.random() < 0.5 ? -1 : 1),
      born: now,
    });
    state.recoil = 1;
    audio.boom();
    for (let i = 0; i < 10; i++) {
      state.puffs.push({
        x: m.x + Math.random() * 8,
        y: m.y + Math.random() * 8,
        vx: 1 + Math.random() * 2,
        vy: -1.5 - Math.random() * 2,
        life: 1,
      });
    }
    const gap = Math.max(820, 1850 - state.caught * 95);
    state.nextShot = now + gap + Math.random() * 260;
  }

  function catchDog(d, now) {
    state.caught += 1;
    state.chew = 1;
    audio.chomp();
    state.floats.push({
      x: d.x,
      y: d.y,
      t: 1,
      text: state.caught >= CATCH_WIN ? "BOOM!" : "CHOMP!",
    });
    status();
    if (state.caught >= CATCH_WIN) {
      state.mode = "win";
      state.winFlash = 1;
      state.shake = 18;
      audio.win();
      setMsg("Belly critical! You win!");
      state.dogs = [];
      state.endTimer = setTimeout(() => {
        setOverlay(
          true,
          "You win!",
          "Ten dogs later, his belly exploded.<br /><b>Congratulations.</b> Maybe try salad next time.",
          "💥",
          "Play again"
        );
      }, 1400);
    } else {
      const left = CATCH_WIN - state.caught;
      setMsg(left === 1 ? "One more and he pops..." : `Belly growing. ${left} to go.`);
    }
  }

  function dropDog(d) {
    state.dropped += 1;
    state.splats.push({ x: d.x, y: feetY() - 8, t: 1 });
    state.shake = 8;
    audio.splat();
    status();
    if (state.dropped >= DROP_LOSE) {
      state.mode = "lose";
      audio.lose();
      setMsg("Three on the ground. Game over.");
      setOverlay(
        true,
        "Game over",
        "Three perfectly good hot dogs. On the grass.<br />The ants are thrilled. You are not.",
        "💀",
        "Try again"
      );
    } else {
      setMsg(`Missed! ${DROP_LOSE - state.dropped} drop${DROP_LOSE - state.dropped === 1 ? "" : "s"} left.`);
    }
  }

  function update(dt, now) {
    if (state.shake > 0) state.shake *= 0.88;
    if (state.chew > 0) state.chew = Math.max(0, state.chew - dt * 0.004);
    if (state.recoil > 0) state.recoil = Math.max(0, state.recoil - dt * 0.006);
    if (state.winFlash > 0) state.winFlash = Math.max(0, state.winFlash - dt * 0.0012);

    const speed = 0.42 - manIndex() * 0.05;
    if (state.keys.left) state.targetX -= speed * dt;
    if (state.keys.right) state.targetX += speed * dt;
    const { w } = manSize();
    const minX = 150;
    const maxX = W - w - 8;
    state.targetX = Math.max(minX, Math.min(maxX, state.targetX));
    state.playerX += (state.targetX - state.playerX) * Math.min(1, dt * 0.022);
    state.playerX = Math.max(minX, Math.min(maxX, state.playerX));

    if (state.mode === "play" && now >= state.nextShot) shoot(now);

    const mouth = mouthOf();
    for (let i = state.dogs.length - 1; i >= 0; i--) {
      const d = state.dogs[i];
      d.vy += GRAVITY;
      d.x += d.vx;
      d.y += d.vy;
      d.rot += d.spin;
      if (state.mode === "play") {
        const dx = d.x - mouth.x;
        const dy = d.y - mouth.y;
        if (dx * dx + dy * dy < mouth.r * mouth.r) {
          state.dogs.splice(i, 1);
          catchDog(d, now);
          continue;
        }
      }
      if (d.y > feetY() - 6 || d.x > W + 40) {
        state.dogs.splice(i, 1);
        if (state.mode === "play" && d.y > feetY() - 40) dropDog(d);
      }
    }

    state.splats.forEach((s) => (s.t = Math.max(0.55, s.t - dt * 0.00015)));
    for (let i = state.floats.length - 1; i >= 0; i--) {
      state.floats[i].t -= dt * 0.0014;
      state.floats[i].y -= dt * 0.04;
      if (state.floats[i].t <= 0) state.floats.splice(i, 1);
    }
    for (let i = state.puffs.length - 1; i >= 0; i--) {
      const p = state.puffs[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= dt * 0.0022;
      if (p.life <= 0) state.puffs.splice(i, 1);
    }
  }

  function draw() {
    if (!loaded) {
      ctx.fillStyle = "#008080";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Tahoma, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading Hot Dog Catcher 95...", W / 2, H / 2);
      return;
    }

    ctx.save();
    if (state.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    ctx.drawImage(imgs.bg, 0, 0, W, H);

    // ground shadow strip so sprites sit
    ctx.fillStyle = "rgba(0,40,0,0.18)";
    ctx.fillRect(0, feetY() - 4, W, 22);

    for (const s of state.splats) {
      const sw = 86 * (0.7 + s.t * 0.3);
      const sh = 58 * (0.7 + s.t * 0.3);
      ctx.globalAlpha = 0.55 + s.t * 0.45;
      ctx.drawImage(imgs.splat, s.x - sw / 2, s.y - sh * 0.7, sw, sh);
      ctx.globalAlpha = 1;
    }

    const c = cannonBox();
    ctx.save();
    ctx.translate(c.x + c.w * 0.35, c.y + c.h * 0.72);
    ctx.rotate(-state.recoil * 0.08);
    ctx.drawImage(imgs.cannon, -c.w * 0.35, -c.h * 0.72, c.w, c.h);
    ctx.restore();

    for (const p of state.puffs) {
      ctx.globalAlpha = Math.max(0, p.life) * 0.55;
      ctx.fillStyle = "#eee";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 + (1 - p.life) * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const im = manImg();
    const { w, h } = manSize();
    const px = state.playerX;
    const py = feetY() - h;
    const squash = 1 - state.chew * 0.08;
    const grow = 1 + state.chew * 0.06;
    ctx.save();
    ctx.translate(px + w / 2, py + h);
    ctx.scale(grow, squash);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.restore();

    if (state.mode === "play") {
      const mouth = mouthOf();
      const incoming = state.dogs.some((d) => d.y < mouth.y + 80 && d.x > 80);
      const pulse = incoming ? 0.55 + Math.sin(performance.now() / 90) * 0.35 : 0.28;
      ctx.save();
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y, mouth.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 60, ${incoming ? 0.22 : 0.10})`;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.stroke();
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 255, 40, ${0.55 + pulse})`;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(255, 255, 80, ${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const d of state.dogs) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.drawImage(imgs.hotdog, -34, -18, 68, 36);
      ctx.restore();
    }

    ctx.font = "bold 18px Tahoma, sans-serif";
    ctx.textAlign = "center";
    for (const f of state.floats) {
      ctx.globalAlpha = Math.max(0, f.t);
      ctx.fillStyle = "#000";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = "#ffff40";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    if (state.winFlash > 0) {
      ctx.fillStyle = `rgba(255,220,80,${state.winFlash * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(34, now - (state.last || now));
    state.last = now;
    if (loaded && (state.mode === "play" || state.mode === "win")) update(dt, now);
    draw();
    requestAnimationFrame(loop);
  }

  function canvasPos(ev) {
    const r = canvas.getBoundingClientRect();
    return ((ev.clientX - r.left) / r.width) * W;
  }

  canvas.addEventListener("mousemove", (e) => {
    if (state.mode !== "play") return;
    const { w } = manSize();
    state.targetX = canvasPos(e) - w / 2;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = true;
    if ((e.key === "Enter" || e.key === " ") && state.mode !== "play") {
      e.preventDefault();
      start();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = false;
  });

  function start() {
    audio.unlock();
    reset();
  }

  let overlayAction = "start";

  document.getElementById("btn-start").addEventListener("click", () => {
    audio.unlock();
    if (overlayAction === "resume") {
      overlayAction = "start";
      state.mode = "play";
      setOverlay(false);
      return;
    }
    start();
  });

  document.getElementById("menu-game").addEventListener("click", () => {
    audio.unlock();
    overlayAction = "start";
    if (state.mode === "play") {
      state.mode = "title";
      setOverlay(
        true,
        "New game?",
        "Abandon this perfectly good belly?",
        "🌭",
        "Start over"
      );
    } else start();
  });

  document.getElementById("menu-help").addEventListener("click", () => {
    const playing = state.mode === "play";
    if (playing) {
      state.mode = "title";
      overlayAction = "resume";
    } else {
      overlayAction = "start";
    }
    setOverlay(
      true,
      "Help",
      "A cannon fires hot dogs. Catch them in your mouth.<br />10 catches: belly explodes, you win.<br />3 drops: game over.<br />Bigger belly = slower waddle. That's science.",
      "❓",
      playing ? "Resume" : "OK"
    );
  });

  function toast(msg) {
    setMsg(msg);
  }

  document.querySelectorAll("[data-toast]").forEach((el) => {
    el.addEventListener("click", () => toast(el.dataset.toast));
  });

  const app = document.getElementById("app");
  document.getElementById("btn-min").addEventListener("click", () => {
    app.classList.add("minimized");
    document.getElementById("task-btn").classList.remove("active");
  });
  document.getElementById("task-btn").addEventListener("click", () => {
    app.classList.toggle("minimized");
    document.getElementById("task-btn").classList.toggle("active", !app.classList.contains("minimized"));
  });
  document.getElementById("icon-game").addEventListener("dblclick", () => {
    app.classList.remove("minimized");
    document.getElementById("task-btn").classList.add("active");
  });
  document.getElementById("btn-max").addEventListener("click", () => {
    app.style.width = app.style.width === "98vw" ? "" : "98vw";
  });

  const err = document.getElementById("error-modal");
  document.getElementById("btn-close").addEventListener("click", () => {
    document.getElementById("err-text").textContent =
      "This program has performed an illegal operation and will be restarted.";
    err.classList.remove("hidden");
  });
  function dismissErr() {
    err.classList.add("hidden");
    if (state.mode === "play") {
      state.mode = "title";
    }
    setOverlay(
      true,
      "Hot Dog Catcher 95",
      "Catch <b>10</b> flying hot dogs in your mouth.<br />Drop <b>3</b> and it's game over.",
      "🌭",
      "Start!"
    );
    overlayAction = "start";
  }
  document.getElementById("err-ok").addEventListener("click", dismissErr);
  document.getElementById("err-x").addEventListener("click", dismissErr);

  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.classList.toggle("hidden");
    startBtn.classList.toggle("open", !startMenu.classList.contains("hidden"));
  });
  document.addEventListener("click", () => {
    startMenu.classList.add("hidden");
    startBtn.classList.remove("open");
  });
  document.getElementById("start-shutdown").addEventListener("click", () => {
    document.getElementById("err-text").textContent =
      "It's now safe to turn off your computer. (Or just keep catching hot dogs.)";
    err.classList.remove("hidden");
  });

  function tickClock() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    document.getElementById("clock").textContent = `${h}:${m} ${ap}`;
  }
  tickClock();
  setInterval(tickClock, 10000);

  loadAll().catch((e) => {
    console.error(e);
    setMsg("Could not load sprites. Check the assets folder.");
  });
  requestAnimationFrame(loop);

  window.HDC = {
    state,
    start,
    loaded: () => loaded,
    setX: (x) => {
      const { w } = manSize();
      const clamped = Math.max(150, Math.min(W - w - 8, x));
      state.targetX = clamped;
      state.playerX = clamped;
    },
    forceCatch() {
      if (state.mode !== "play") return;
      catchDog({ x: state.playerX + 40, y: 200 }, performance.now());
    },
    forceDrop() {
      if (state.mode !== "play") return;
      dropDog({ x: 280 + state.dropped * 90, y: 400 });
    },
  };
})();

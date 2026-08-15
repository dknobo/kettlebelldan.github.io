export const COLS = 8
export const ROWS = 8
export const KINDS = 6

export type Kind = number
export type Special =
  | 'laser-h'
  | 'laser-v'
  | 'rail-h'
  | 'rail-v'
  | 'burst'
  | 'nova'
  | 'core'
  | 'tempest'
  | 'xblade'
  | null

export type FxEffect =
  | 'pop'
  | 'laser-h'
  | 'laser-v'
  | 'rail-h'
  | 'rail-v'
  | 'fire'
  | 'nova'
  | 'lightning'
  | 'tempest'
  | 'xslash'

export type Tile = { kind: Kind; special: Special; id: number }

export type Pos = { r: number; c: number }

export type LevelDef = {
  id: number
  name: string
  subtitle: string
  moves: number
  target: number
}

export const LEVELS: LevelDef[] = [
  { id: 1, name: 'Pad', subtitle: 'Stack is live', moves: 22, target: 1800 },
  { id: 2, name: 'Ignition', subtitle: 'Chamber pressure', moves: 20, target: 2600 },
  { id: 3, name: 'Hold Down', subtitle: 'Release', moves: 20, target: 3400 },
  { id: 4, name: 'Max-Q', subtitle: 'Throttle back', moves: 18, target: 4200 },
  { id: 5, name: 'MECO', subtitle: 'Cutoff', moves: 18, target: 5200 },
  { id: 6, name: 'Orbit', subtitle: 'Circularize', moves: 16, target: 6400 },
  { id: 7, name: 'Starlink', subtitle: 'Deploy', moves: 16, target: 7800 },
  { id: 8, name: 'Grok', subtitle: 'Inference', moves: 15, target: 9200 },
  { id: 9, name: 'Catch', subtitle: 'Chopsticks', moves: 14, target: 11000 },
  { id: 10, name: 'TMI', subtitle: 'Trans-Mars', moves: 14, target: 13000 },
  { id: 11, name: 'Uncrewed', subtitle: 'No abort', moves: 12, target: 15500 },
  { id: 12, name: 'Rapid Unscheduled', subtitle: 'Hold on', moves: 12, target: 18000 },
]

export function levelFor(n: number): LevelDef {
  if (n < 1) return LEVELS[0]
  if (n <= LEVELS.length) return LEVELS[n - 1]
  const last = LEVELS[LEVELS.length - 1]
  return {
    ...last,
    id: n,
    name: 'Deep Space',
    subtitle: `Sol ${n - LEVELS.length}`,
    moves: 12,
    target: last.target + (n - LEVELS.length) * 2500,
  }
}

export type Fx =
  | { kind: 'swap'; a: Pos; b: Pos }
  | { kind: 'swapback'; a: Pos; b: Pos }
  | { kind: 'clear'; cells: Pos[]; effect: FxEffect }
  | { kind: 'spawnSpecial'; at: Pos; special: Special }
  | { kind: 'fall'; moves: { from: Pos; to: Pos; tile: Tile }[] }
  | { kind: 'spawn'; tiles: { at: Pos; tile: Tile }[] }
  | { kind: 'shuffle' }
  | { kind: 'win' }
  | { kind: 'lose' }

export type Game = {
  board: (Tile | null)[][]
  score: number
  moves: number
  level: number
  combo: number
  status: 'ready' | 'playing' | 'won' | 'lost'
  selected: Pos | null
  seq: number
}

function key(p: Pos) {
  return p.r * COLS + p.c
}

function inb(r: number, c: number) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

function emptyBoard(): (Tile | null)[][] {
  return Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null))
}

function randKind() {
  return Math.floor(Math.random() * KINDS)
}

function makeTile(g: Game, kind = randKind(), special: Special = null): Tile {
  return { kind, special, id: ++g.seq }
}

function clonePos(p: Pos): Pos {
  return { r: p.r, c: p.c }
}

function adj(a: Pos, b: Pos) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

function swapCells(board: (Tile | null)[][], a: Pos, b: Pos) {
  const t = board[a.r][a.c]
  board[a.r][a.c] = board[b.r][b.c]
  board[b.r][b.c] = t
}

type Run = { cells: Pos[]; axis: 'h' | 'v' }

function isBeam(sp: Special) {
  return sp === 'laser-h' || sp === 'laser-v' || sp === 'rail-h' || sp === 'rail-v'
}

function isCoreLike(sp: Special) {
  return sp === 'core' || sp === 'tempest'
}

function effectRank(e: FxEffect) {
  const order: FxEffect[] = ['pop', 'xslash', 'laser-h', 'laser-v', 'rail-h', 'rail-v', 'fire', 'nova', 'lightning', 'tempest']
  return order.indexOf(e)
}

function stronger(a: FxEffect, b: FxEffect): FxEffect {
  return effectRank(b) > effectRank(a) ? b : a
}

function lineRuns(board: (Tile | null)[][]): Run[] {
  const runs: Run[] = []
  for (let r = 0; r < ROWS; r++) {
    let c = 0
    while (c < COLS) {
      const t = board[r][c]
      if (!t) {
        c++
        continue
      }
      let n = 1
      while (c + n < COLS && board[r][c + n]?.kind === t.kind) n++
      if (n >= 3) {
        runs.push({
          axis: 'h',
          cells: Array.from({ length: n }, (_, i) => ({ r, c: c + i })),
        })
      }
      c += n
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0
    while (r < ROWS) {
      const t = board[r][c]
      if (!t) {
        r++
        continue
      }
      let n = 1
      while (r + n < ROWS && board[r + n][c]?.kind === t.kind) n++
      if (n >= 3) {
        runs.push({
          axis: 'v',
          cells: Array.from({ length: n }, (_, i) => ({ r: r + i, c })),
        })
      }
      r += n
    }
  }
  return runs
}

function squareMatches(board: (Tile | null)[][]): Pos[][] {
  const out: Pos[][] = []
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const t = board[r][c]
      if (!t) continue
      if (
        board[r][c + 1]?.kind === t.kind &&
        board[r + 1][c]?.kind === t.kind &&
        board[r + 1][c + 1]?.kind === t.kind
      ) {
        out.push([
          { r, c },
          { r, c: c + 1 },
          { r: r + 1, c },
          { r: r + 1, c: c + 1 },
        ])
      }
    }
  }
  return out
}

function hasAnyMatch(board: (Tile | null)[][]) {
  return lineRuns(board).length > 0 || squareMatches(board).length > 0
}

function classifyMatch(
  board: (Tile | null)[][],
  runs: Run[],
  squares: Pos[][],
  prefer: Pos | null,
): { clear: Pos[]; special: { at: Pos; special: Special } | null } {
  const map = new Map<number, Pos>()
  for (const run of runs) for (const p of run.cells) map.set(key(p), p)
  for (const sq of squares) for (const p of sq) map.set(key(p), p)
  const clear = [...map.values()]
  if (!clear.length) return { clear, special: null }

  const h4 = runs.filter((x) => x.axis === 'h' && x.cells.length >= 4)
  const v4 = runs.filter((x) => x.axis === 'v' && x.cells.length >= 4)
  const h6 = runs.some((x) => x.axis === 'h' && x.cells.length >= 6)
  const v6 = runs.some((x) => x.axis === 'v' && x.cells.length >= 6)
  const h5 = runs.some((x) => x.axis === 'h' && x.cells.length >= 5)
  const v5 = runs.some((x) => x.axis === 'v' && x.cells.length >= 5)

  const inH = new Set<number>()
  const inV = new Set<number>()
  for (const run of runs) {
    for (const p of run.cells) {
      if (run.axis === 'h') inH.add(key(p))
      else inV.add(key(p))
    }
  }
  const corners = clear.filter((p) => inH.has(key(p)) && inV.has(key(p)))

  const pick = (list: Pos[]) => {
    if (prefer && list.some((p) => p.r === prefer.r && p.c === prefer.c)) return prefer
    return list[Math.floor(list.length / 2)]
  }

  const runHasSpecial = (list: Run[], pred: (sp: Special) => boolean) =>
    list.some((run) => run.cells.some((p) => pred(board[p.r][p.c]?.special ?? null)))

  let special: { at: Pos; special: Special } | null = null
  if (h6) special = { at: pick(h4[0]?.cells || clear), special: 'rail-h' }
  else if (v6) special = { at: pick(v4[0]?.cells || clear), special: 'rail-v' }
  else if (h5 || v5) {
    const charged = runHasSpecial(runs.filter((r) => r.cells.length >= 5), (sp) => !!sp)
    special = { at: pick(clear), special: charged || (h5 && v5) ? 'tempest' : 'core' }
  } else if (corners.length) {
    const fat = clear.length >= 6 || corners.some((p) => board[p.r][p.c]?.special === 'burst' || board[p.r][p.c]?.special === 'nova')
    special = { at: pick(corners), special: fat ? 'nova' : 'burst' }
  } else if (h4.length && !v4.length) {
    const up = runHasSpecial(h4, isBeam)
    special = { at: pick(h4[0].cells), special: up ? 'rail-h' : 'laser-h' }
  } else if (v4.length && !h4.length) {
    const up = runHasSpecial(v4, isBeam)
    special = { at: pick(v4[0].cells), special: up ? 'rail-v' : 'laser-v' }
  } else if (h4.length && v4.length) special = { at: pick(clear), special: 'nova' }
  else if (squares.length) special = { at: pick(squares[0]), special: 'xblade' }

  return { clear, special }
}

function addBandH(cells: Set<number>, row: number, width: number) {
  for (let dr = -width; dr <= width; dr++) {
    const r = row + dr
    if (r < 0 || r >= ROWS) continue
    for (let c = 0; c < COLS; c++) cells.add(key({ r, c }))
  }
}

function addBandV(cells: Set<number>, col: number, width: number) {
  for (let dc = -width; dc <= width; dc++) {
    const c = col + dc
    if (c < 0 || c >= COLS) continue
    for (let r = 0; r < ROWS; r++) cells.add(key({ r, c }))
  }
}

function addDiagonals(cells: Set<number>, at: Pos, thick = 0) {
  for (let i = -ROWS; i <= ROWS; i++) {
    for (let t = -thick; t <= thick; t++) {
      const a = { r: at.r + i + t, c: at.c + i }
      const b = { r: at.r + i + t, c: at.c - i }
      if (inb(a.r, a.c)) cells.add(key(a))
      if (inb(b.r, b.c)) cells.add(key(b))
    }
  }
}

function collectSpecialClear(
  board: (Tile | null)[][],
  start: Pos,
  incomingKind: Kind | null,
): { cells: Set<number>; effect: FxEffect } {
  const tile = board[start.r][start.c]
  const cells = new Set<number>()
  let effect: FxEffect = 'fire'
  if (!tile?.special) return { cells, effect }

  if (tile.special === 'laser-h') {
    effect = 'laser-h'
    addBandH(cells, start.r, 0)
  } else if (tile.special === 'laser-v') {
    effect = 'laser-v'
    addBandV(cells, start.c, 0)
  } else if (tile.special === 'rail-h') {
    effect = 'rail-h'
    addBandH(cells, start.r, 1)
  } else if (tile.special === 'rail-v') {
    effect = 'rail-v'
    addBandV(cells, start.c, 1)
  } else if (tile.special === 'burst') {
    effect = 'fire'
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (inb(start.r + dr, start.c + dc)) cells.add(key({ r: start.r + dr, c: start.c + dc }))
  } else if (tile.special === 'nova') {
    effect = 'nova'
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) if (inb(start.r + dr, start.c + dc)) cells.add(key({ r: start.r + dr, c: start.c + dc }))
  } else if (tile.special === 'core') {
    effect = 'lightning'
    const k = incomingKind ?? tile.kind
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (board[r][c]?.kind === k) cells.add(key({ r, c }))
    cells.add(key(start))
  } else if (tile.special === 'tempest') {
    effect = 'tempest'
    const k = incomingKind ?? tile.kind
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (board[r][c]?.kind === k) cells.add(key({ r, c }))
    addBandH(cells, start.r, 0)
    addBandV(cells, start.c, 0)
  } else if (tile.special === 'xblade') {
    effect = 'xslash'
    addDiagonals(cells, start, 0)
  }
  return { cells, effect }
}

function hasMatchAfterSwap(board: (Tile | null)[][], a: Pos, b: Pos) {
  swapCells(board, a, b)
  const ok = hasAnyMatch(board) || !!(board[a.r][a.c]?.special || board[b.r][b.c]?.special)
  swapCells(board, a, b)
  return ok
}

function anyMove(board: (Tile | null)[][]) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS && hasMatchAfterSwap(board, { r, c }, { r, c: c + 1 })) return true
      if (r + 1 < ROWS && hasMatchAfterSwap(board, { r, c }, { r: r + 1, c })) return true
    }
  }
  return false
}

function fillNoMatches(g: Game) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let kind = randKind()
      let guard = 0
      while (
        guard++ < 16 &&
        ((c >= 2 && g.board[r][c - 1]?.kind === kind && g.board[r][c - 2]?.kind === kind) ||
          (r >= 2 && g.board[r - 1][c]?.kind === kind && g.board[r - 2][c]?.kind === kind) ||
          (r >= 1 &&
            c >= 1 &&
            g.board[r][c - 1]?.kind === kind &&
            g.board[r - 1][c]?.kind === kind &&
            g.board[r - 1][c - 1]?.kind === kind))
      ) {
        kind = randKind()
      }
      g.board[r][c] = makeTile(g, kind)
    }
  }
}

function shuffleBoard(g: Game) {
  const tiles: Tile[] = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) tiles.push(g.board[r][c]!)
  for (let i = 0; i < 40; i++) {
    for (let j = tiles.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[tiles[j], tiles[k]] = [tiles[k], tiles[j]]
    }
    let n = 0
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) g.board[r][c] = tiles[n++]
    if (!hasAnyMatch(g.board) && anyMove(g.board)) return
  }
}

export function createGame(): Game {
  return {
    board: emptyBoard(),
    score: 0,
    moves: levelFor(1).moves,
    level: 1,
    combo: 0,
    status: 'ready',
    selected: null,
    seq: 1,
  }
}

export function startGame(g: Game, level = 1) {
  const lv = levelFor(level)
  g.board = emptyBoard()
  g.score = 0
  g.level = lv.id
  g.moves = lv.moves
  g.combo = 0
  g.status = 'playing'
  g.selected = null
  fillNoMatches(g)
  let guard = 0
  while (!anyMove(g.board) && guard++ < 20) fillNoMatches(g)
}

function applyGravity(g: Game): { moves: { from: Pos; to: Pos; tile: Tile }[]; spawn: { at: Pos; tile: Tile }[] } {
  const moves: { from: Pos; to: Pos; tile: Tile }[] = []
  const spawn: { at: Pos; tile: Tile }[] = []
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1
    for (let r = ROWS - 1; r >= 0; r--) {
      const t = g.board[r][c]
      if (!t) continue
      if (r !== write) {
        moves.push({ from: { r, c }, to: { r: write, c }, tile: t })
        g.board[write][c] = t
        g.board[r][c] = null
      }
      write--
    }
    for (let r = write; r >= 0; r--) {
      const t = makeTile(g)
      g.board[r][c] = t
      spawn.push({ at: { r, c }, tile: t })
    }
  }
  return { moves, spawn }
}

function posFromKey(k: number): Pos {
  return { r: Math.floor(k / COLS), c: k % COLS }
}

function chainClears(
  board: (Tile | null)[][],
  seeds: Pos[],
  keep: number,
): { cells: Map<number, Pos>; effect: FxEffect } {
  const all = new Map<number, Pos>()
  const queue: Pos[] = []
  const detonated = new Set<number>()
  let effect: FxEffect = 'pop'

  const enqueue = (p: Pos) => {
    const k = key(p)
    if (all.has(k)) return
    all.set(k, p)
    queue.push(p)
  }
  for (const p of seeds) enqueue(p)

  while (queue.length) {
    const p = queue.shift()!
    const k = key(p)
    if (k === keep || detonated.has(k)) continue
    const t = board[p.r][p.c]
    if (!t?.special) continue
    detonated.add(k)
    const burst = collectSpecialClear(board, p, t.kind)
    effect = stronger(effect, burst.effect)
    burst.cells.forEach((nk) => enqueue(posFromKey(nk)))
  }
  return { cells: all, effect }
}

function resolveOnce(g: Game, prefer: Pos | null): Fx[] {
  const fx: Fx[] = []
  const runs = lineRuns(g.board)
  const squares = squareMatches(g.board)
  const { clear, special } = classifyMatch(g.board, runs, squares, prefer)
  if (!clear.length) return fx

  const keep = special ? key(special.at) : -1
  const { cells: all, effect } = chainClears(g.board, clear, keep)

  if (special) {
    const kind = g.board[special.at.r][special.at.c]?.kind ?? 0
    all.delete(keep)
    g.score += (all.size + 1) * 40 * Math.max(1, g.combo)
    for (const p of all.values()) g.board[p.r][p.c] = null
    g.board[special.at.r][special.at.c] = makeTile(g, kind, special.special)
    fx.push({ kind: 'clear', cells: [...all.values()], effect })
    fx.push({ kind: 'spawnSpecial', at: special.at, special: special.special })
  } else {
    g.score += all.size * 50 * Math.max(1, g.combo)
    for (const p of all.values()) g.board[p.r][p.c] = null
    fx.push({ kind: 'clear', cells: [...all.values()], effect })
  }
  const grav = applyGravity(g)
  if (grav.moves.length) fx.push({ kind: 'fall', moves: grav.moves })
  if (grav.spawn.length) fx.push({ kind: 'spawn', tiles: grav.spawn })
  return fx
}

function settle(g: Game): Fx[] {
  const out: Fx[] = []
  if (!anyMove(g.board)) {
    shuffleBoard(g)
    out.push({ kind: 'shuffle' })
  }
  const lv = levelFor(g.level)
  if (g.score >= lv.target) {
    g.status = 'won'
    out.push({ kind: 'win' })
  } else if (g.moves <= 0) {
    g.status = 'lost'
    out.push({ kind: 'lose' })
  }
  return out
}

export function resolveStep(g: Game, prefer: Pos | null = null): Fx[] {
  const step = resolveOnce(g, prefer)
  if (step.length) {
    g.combo++
    return step
  }
  return settle(g)
}

export function resolveAll(g: Game, prefer: Pos | null = null): Fx[] {
  const out: Fx[] = []
  g.combo = 1
  for (let i = 0; i < 20; i++) {
    const step = resolveOnce(g, i === 0 ? prefer : null)
    if (!step.length) break
    out.push(...step)
    g.combo++
  }
  out.push(...settle(g))
  return out
}

function activateSwapSpecials(g: Game, a: Pos, b: Pos): Fx[] {
  const ta = g.board[a.r][a.c]
  const tb = g.board[b.r][b.c]
  if (!ta || !tb) return []
  if (!ta.special && !tb.special) return []

  const wipe = new Set<number>()
  let effect: FxEffect = 'pop'
  const sa = ta.special
  const sb = tb.special

  const paint = (e: FxEffect, cells: Set<number>) => {
    effect = stronger(effect, e)
    cells.forEach((k) => wipe.add(k))
  }

  if ((isCoreLike(sa) && isCoreLike(sb)) || (sa === 'tempest' && sb === 'tempest')) {
    effect = 'tempest'
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) wipe.add(key({ r, c }))
  } else if (isCoreLike(sa) || isCoreLike(sb)) {
    const other = isCoreLike(sa) ? tb : ta
    const origin = isCoreLike(sa) ? a : b
    if (isBeam(other.special)) {
      const wide = other.special?.startsWith('rail') ? 1 : 0
      const horiz = other.special?.endsWith('h')
      effect = wide ? (horiz ? 'rail-h' : 'rail-v') : horiz ? 'laser-h' : 'laser-v'
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (g.board[r][c]?.kind === other.kind) {
            if (horiz) addBandH(wipe, r, wide)
            else addBandV(wipe, c, wide)
          }
      wipe.add(key(origin))
    } else if (other.special === 'burst' || other.special === 'nova') {
      const rad = other.special === 'nova' ? 2 : 1
      effect = other.special === 'nova' ? 'nova' : 'fire'
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (g.board[r][c]?.kind === other.kind) {
            for (let dr = -rad; dr <= rad; dr++)
              for (let dc = -rad; dc <= rad; dc++) if (inb(r + dr, c + dc)) wipe.add(key({ r: r + dr, c: c + dc }))
          }
    } else if (other.special === 'xblade') {
      effect = 'tempest'
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) if (g.board[r][c]?.kind === other.kind) addDiagonals(wipe, { r, c }, 0)
      addDiagonals(wipe, origin, 0)
    } else {
      const burst = collectSpecialClear(g.board, origin, other.kind)
      paint(burst.effect, burst.cells)
    }
  } else if (sa && sb) {
    if (isBeam(sa) && isBeam(sb)) {
      const wide = sa.startsWith('rail') || sb.startsWith('rail') ? 1 : 0
      effect = wide ? 'rail-h' : 'laser-h'
      addBandH(wipe, a.r, wide)
      addBandV(wipe, a.c, wide)
    } else if ((isBeam(sa) || isBeam(sb)) && (sa === 'burst' || sb === 'burst' || sa === 'nova' || sb === 'nova')) {
      const beam = isBeam(sa) ? sa : sb
      const wide = beam.startsWith('rail') || sa === 'nova' || sb === 'nova' ? 1 : 1
      effect = beam.endsWith('h') ? 'rail-h' : 'rail-v'
      addBandH(wipe, a.r, wide)
      addBandV(wipe, a.c, wide)
    } else if ((sa === 'nova' || sb === 'nova') && (sa === 'burst' || sb === 'burst' || sa === 'nova' || sb === 'nova')) {
      effect = 'nova'
      for (let dr = -3; dr <= 3; dr++)
        for (let dc = -3; dc <= 3; dc++) if (inb(a.r + dr, a.c + dc)) wipe.add(key({ r: a.r + dr, c: a.c + dc }))
    } else if (sa === 'xblade' && sb === 'xblade') {
      effect = 'xslash'
      addDiagonals(wipe, a, 1)
      addDiagonals(wipe, b, 1)
    } else if ((sa === 'xblade' || sb === 'xblade') && (isBeam(sa) || isBeam(sb))) {
      const blade = sa === 'xblade' ? a : b
      const beam = isBeam(sa) ? sa : sb!
      effect = 'xslash'
      addDiagonals(wipe, blade, 0)
      if (beam.endsWith('h')) addBandH(wipe, a.r, beam.startsWith('rail') ? 1 : 0)
      else addBandV(wipe, a.c, beam.startsWith('rail') ? 1 : 0)
    } else {
      const A = collectSpecialClear(g.board, a, tb.kind)
      const B = collectSpecialClear(g.board, b, ta.kind)
      paint(A.effect, A.cells)
      paint(B.effect, B.cells)
    }
  } else {
    const origin = ta.special ? a : b
    const other = ta.special ? tb : ta
    const burst = collectSpecialClear(g.board, origin, other.kind)
    paint(burst.effect, burst.cells)
  }

  if (!wipe.size) return []
  return applyWipe(g, wipe, effect)
}

function applyWipe(g: Game, wipe: Set<number>, effect: FxEffect): Fx[] {
  const fx: Fx[] = []
  const cells = [...wipe].map((k) => ({ r: Math.floor(k / COLS), c: k % COLS }))
  g.score += cells.length * 60
  for (const p of cells) g.board[p.r][p.c] = null
  fx.push({ kind: 'clear', cells, effect })
  const grav = applyGravity(g)
  if (grav.moves.length) fx.push({ kind: 'fall', moves: grav.moves })
  if (grav.spawn.length) fx.push({ kind: 'spawn', tiles: grav.spawn })
  return fx
}

function detonateAt(g: Game, at: Pos): Fx[] {
  const tile = g.board[at.r][at.c]
  if (!tile?.special) return []
  const burst = collectSpecialClear(g.board, at, tile.kind)
  if (!burst.cells.size) return []
  return applyWipe(g, burst.cells, burst.effect)
}

export function trySwap(g: Game, a: Pos, b: Pos): Fx[] {
  if (g.status !== 'playing') return []
  if (!adj(a, b)) return []
  const ta = g.board[a.r][a.c]
  const tb = g.board[b.r][b.c]
  if (!ta || !tb) return []

  swapCells(g.board, a, b)
  const specialHit = !!(ta.special || tb.special)
  const matched = hasAnyMatch(g.board)
  if (!specialHit && !matched) {
    swapCells(g.board, a, b)
    return [{ kind: 'swapback', a, b }]
  }
  g.moves -= 1
  g.combo = 1
  g.selected = null
  const fx: Fx[] = [{ kind: 'swap', a, b }]
  if (ta.special && tb.special) {
    fx.push(...activateSwapSpecials(g, a, b))
    return fx
  }
  if (specialHit && (isCoreLike(ta.special) || isCoreLike(tb.special) || !matched)) {
    fx.push(...activateSwapSpecials(g, a, b))
    return fx
  }
  return fx
}

export function tap(g: Game, p: Pos): Fx[] {
  if (g.status !== 'playing') return []
  if (!inb(p.r, p.c) || !g.board[p.r][p.c]) return []
  if (!g.selected) {
    g.selected = clonePos(p)
    return []
  }
  if (g.selected.r === p.r && g.selected.c === p.c) {
    const tile = g.board[p.r][p.c]
    if (tile?.special) {
      g.moves -= 1
      g.combo = 1
      g.selected = null
      return detonateAt(g, p)
    }
    g.selected = null
    return []
  }
  if (!adj(g.selected, p)) {
    g.selected = clonePos(p)
    return []
  }
  const a = g.selected
  g.selected = null
  return trySwap(g, a, p)
}

export function nextLevel(g: Game) {
  startGame(g, g.level + 1)
}

export function retry(g: Game) {
  startGame(g, g.level)
}

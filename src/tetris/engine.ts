export const COLS = 10
export const ROWS = 20
export const HIDDEN = 2

export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type Theme = 'pad' | 'ascent' | 'orbit' | 'entry' | 'deep'

export type Cell = {
  id: PieceId
  run: number
  seg: number
  axis: 0 | 1
}

export type Active = {
  id: PieceId
  x: number
  y: number
  r: 0 | 1 | 2 | 3
}

export type LevelDef = {
  id: number
  name: string
  subtitle: string
  gravityMs: number
  theme: Theme
  lines: number
}

export const LEVELS: LevelDef[] = [
  { id: 1, name: 'Preflight', subtitle: 'Stack is live', gravityMs: 880, theme: 'pad', lines: 8 },
  { id: 2, name: 'Ignition', subtitle: 'Chamber pressure up', gravityMs: 780, theme: 'pad', lines: 8 },
  { id: 3, name: 'Hold Down', subtitle: 'Release bolts', gravityMs: 700, theme: 'pad', lines: 8 },
  { id: 4, name: 'Liftoff', subtitle: 'Cleared the tower', gravityMs: 620, theme: 'ascent', lines: 10 },
  { id: 5, name: 'Max-Q', subtitle: 'Throttle back', gravityMs: 540, theme: 'ascent', lines: 10 },
  { id: 6, name: 'MECO', subtitle: 'Main engine cutoff', gravityMs: 470, theme: 'ascent', lines: 10 },
  { id: 7, name: 'Hot Staging', subtitle: 'Sep confirmed', gravityMs: 400, theme: 'ascent', lines: 10 },
  { id: 8, name: 'SES-1', subtitle: 'Second start', gravityMs: 340, theme: 'orbit', lines: 10 },
  { id: 9, name: 'Vacuum', subtitle: 'Clean burn', gravityMs: 290, theme: 'orbit', lines: 10 },
  { id: 10, name: 'SECO', subtitle: 'Insertion', gravityMs: 240, theme: 'orbit', lines: 12 },
  { id: 11, name: 'Orbit', subtitle: 'Circularize', gravityMs: 200, theme: 'orbit', lines: 12 },
  { id: 12, name: 'Rendezvous', subtitle: 'Closing rate', gravityMs: 165, theme: 'orbit', lines: 12 },
  { id: 13, name: 'Starlink', subtitle: 'Deploy sequence', gravityMs: 135, theme: 'orbit', lines: 12 },
  { id: 14, name: 'Entry Interface', subtitle: 'Plasma sheath', gravityMs: 108, theme: 'entry', lines: 12 },
  { id: 15, name: 'Landing Burn', subtitle: 'Suicide math', gravityMs: 86, theme: 'entry', lines: 12 },
  { id: 16, name: 'Catch', subtitle: 'Chopsticks closed', gravityMs: 68, theme: 'pad', lines: 12 },
  { id: 17, name: 'Flight Proven', subtitle: 'Turnaround', gravityMs: 54, theme: 'pad', lines: 14 },
  { id: 18, name: 'Rapid Reuse', subtitle: 'Again', gravityMs: 42, theme: 'ascent', lines: 14 },
  { id: 19, name: 'TMI', subtitle: 'Trans-Mars', gravityMs: 32, theme: 'deep', lines: 14 },
  { id: 20, name: 'Uncrewed', subtitle: 'No abort modes', gravityMs: 22, theme: 'deep', lines: 9999 },
]

export function levelFor(index: number): LevelDef {
  if (index < 1) return LEVELS[0]
  if (index <= LEVELS.length) return LEVELS[index - 1]
  return {
    ...LEVELS[LEVELS.length - 1],
    id: index,
    name: 'Deep Space',
    subtitle: `Sol ${index - 20}`,
    gravityMs: 18,
    theme: 'deep',
  }
}

type Kick = [number, number]

const SHAPES: Record<PieceId, [number, number][][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
}

const JLSTZ_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
}

const I_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
}

const PIECES: PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export function cellsOf(p: Active): [number, number][] {
  return SHAPES[p.id][p.r].map(([dx, dy]) => [p.x + dx, p.y + dy])
}

export type FxEvent =
  | { kind: 'lock'; cells: [number, number][]; id: PieceId; hard: boolean }
  | { kind: 'clear'; rows: number[]; lines: number; tetris: boolean; combo: number }
  | { kind: 'level'; level: LevelDef }
  | { kind: 'spawn'; id: PieceId }
  | { kind: 'gameover' }

export type Game = {
  board: (Cell | null)[][]
  active: Active | null
  queue: PieceId[]
  score: number
  lines: number
  levelIndex: number
  combo: number
  status: 'ready' | 'playing' | 'paused' | 'over'
  fallAcc: number
  lockAcc: number
  moveResets: number
  entryAcc: number
  lastDx: number
  hardDrop: boolean
  runSeq: number
  bag: PieceId[]
  totalPieces: number
}

function emptyBoard(): (Cell | null)[][] {
  return Array.from({ length: ROWS + HIDDEN }, () => Array<Cell | null>(COLS).fill(null))
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function refill(g: Game) {
  while (g.queue.length < 7) {
    if (!g.bag.length) g.bag = shuffle(PIECES)
    g.queue.push(g.bag.pop()!)
  }
}

function occupied(board: (Cell | null)[][], x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y >= ROWS + HIDDEN) return true
  if (y < 0) return false
  return board[y][x] != null
}

function valid(board: (Cell | null)[][], p: Active): boolean {
  for (const [x, y] of cellsOf(p)) if (occupied(board, x, y)) return false
  return true
}

function spawnPiece(id: PieceId): Active {
  if (id === 'I') return { id, x: 3, y: -1, r: 1 }
  return { id, x: 3, y: 0, r: 0 }
}

export function createGame(): Game {
  const g: Game = {
    board: emptyBoard(),
    active: null,
    queue: [],
    score: 0,
    lines: 0,
    levelIndex: 1,
    combo: -1,
    status: 'ready',
    fallAcc: 0,
    lockAcc: 0,
    moveResets: 0,
    entryAcc: 0,
    lastDx: 0,
    hardDrop: false,
    runSeq: 1,
    bag: [],
    totalPieces: 0,
  }
  refill(g)
  return g
}

export function startGame(g: Game): FxEvent[] {
  Object.assign(g, createGame(), { status: 'playing' as const })
  return spawn(g)
}

function spawn(g: Game): FxEvent[] {
  refill(g)
  const id = g.queue.shift()!
  const piece = spawnPiece(id)
  g.active = piece
  g.fallAcc = 0
  g.lockAcc = 0
  g.moveResets = 0
  g.hardDrop = false
  g.totalPieces += 1
  if (!valid(g.board, piece)) {
    g.active = null
    g.status = 'over'
    return [{ kind: 'gameover' }]
  }
  return [{ kind: 'spawn', id }]
}

function tryMove(g: Game, dx: number, dy: number): boolean {
  if (!g.active) return false
  const next = { ...g.active, x: g.active.x + dx, y: g.active.y + dy }
  if (!valid(g.board, next)) return false
  g.active = next
  if (dx) g.lastDx = dx
  if (dy === 0) onShift(g)
  return true
}

function onShift(g: Game) {
  if (!g.active) return
  const grounded = !valid(g.board, { ...g.active, y: g.active.y + 1 })
  if (grounded && g.moveResets < 15) {
    g.lockAcc = 0
    g.moveResets += 1
  }
}

function tryRotate(g: Game, dir: 1 | -1): boolean {
  if (!g.active || g.active.id === 'O') return false
  const from = g.active.r
  const to = ((from + dir + 4) % 4) as 0 | 1 | 2 | 3
  const key = `${from}>${to}`
  const table = g.active.id === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key]
  for (const [kx, ky] of table) {
    const next: Active = { ...g.active, r: to, x: g.active.x + kx, y: g.active.y - ky }
    if (valid(g.board, next)) {
      g.active = next
      onShift(g)
      return true
    }
  }
  return false
}

function ghostY(g: Game): number {
  if (!g.active) return 0
  let y = g.active.y
  while (valid(g.board, { ...g.active, y: y + 1 })) y++
  return y
}

function stamp(g: Game): FxEvent[] {
  const p = g.active!
  const cells = cellsOf(p)
  const axis: 0 | 1 = p.id === 'I' && (p.r === 1 || p.r === 3) ? 1 : 0
  const ordered = cells.slice().sort((a, b) => (axis ? a[1] - b[1] : a[0] - b[0]))
  const run = g.runSeq++
  ordered.forEach(([x, y], i) => {
    if (y >= 0 && y < ROWS + HIDDEN) {
      g.board[y][x] = { id: p.id, run, seg: i, axis }
    }
  })
  const fx: FxEvent[] = [{ kind: 'lock', cells, id: p.id, hard: g.hardDrop }]
  g.active = null
  g.hardDrop = false
  if (cells.every(([, y]) => y < HIDDEN)) {
    g.status = 'over'
    fx.push({ kind: 'gameover' })
    return fx
  }
  const cleared = clearLines(g)
  fx.push(...cleared)
  if (g.status === 'over') return fx
  g.entryAcc = cleared.length ? 0.16 : 0.05
  return fx
}

function clearLines(g: Game): FxEvent[] {
  const full: number[] = []
  for (let y = 0; y < ROWS + HIDDEN; y++) {
    if (g.board[y].every((c) => c != null)) full.push(y)
  }
  if (!full.length) {
    g.combo = -1
    return []
  }
  g.board = g.board.filter((_, y) => !full.includes(y))
  while (g.board.length < ROWS + HIDDEN) g.board.unshift(Array<Cell | null>(COLS).fill(null))
  const n = full.length
  g.combo += 1
  g.lines += n
  const lvl = levelFor(g.levelIndex)
  const base = n === 1 ? 100 : n === 2 ? 300 : n === 3 ? 500 : 800
  g.score += base * g.levelIndex + Math.max(0, g.combo) * 50 * g.levelIndex
  const fx: FxEvent[] = [{ kind: 'clear', rows: full.map((y) => y - HIDDEN), lines: n, tetris: n >= 4, combo: g.combo }]
  const prev = g.levelIndex
  let acc = 0
  for (let i = 1; i <= 40; i++) {
    acc += levelFor(i).lines
    if (g.lines < acc) {
      g.levelIndex = i
      break
    }
    g.levelIndex = i
  }
  if (g.levelIndex !== prev) fx.push({ kind: 'level', level: levelFor(g.levelIndex) })
  void lvl
  return fx
}

export function input(
  g: Game,
  action: 'left' | 'right' | 'soft' | 'hard' | 'cw' | 'ccw' | 'pause',
): FxEvent[] {
  if (action === 'pause') {
    if (g.status === 'playing') g.status = 'paused'
    else if (g.status === 'paused') g.status = 'playing'
    return []
  }
  if (g.status !== 'playing' || g.entryAcc > 0) return []
  if (!g.active) return []
  if (action === 'left') {
    tryMove(g, -1, 0)
    return []
  }
  if (action === 'right') {
    tryMove(g, 1, 0)
    return []
  }
  if (action === 'ccw') {
    tryRotate(g, -1)
    return []
  }
  if (action === 'cw') {
    tryRotate(g, 1)
    return []
  }
  if (action === 'soft') {
    if (tryMove(g, 0, 1)) {
      g.score += 1
      g.fallAcc = 0
    } else {
      g.lockAcc = 999
    }
    return []
  }
  if (action === 'hard') {
    let dist = 0
    while (tryMove(g, 0, 1)) dist++
    g.score += dist * 2
    g.hardDrop = true
    g.lockAcc = 999
    return step(g, 0)
  }
  return []
}

export function step(g: Game, dt: number): FxEvent[] {
  if (g.status !== 'playing') return []
  if (g.entryAcc > 0) {
    g.entryAcc -= dt
    if (g.entryAcc > 0) return []
    g.entryAcc = 0
    if (!g.active) return spawn(g)
  }
  if (!g.active) return spawn(g)

  const grav = levelFor(g.levelIndex).gravityMs / 1000
  const grounded = !valid(g.board, { ...g.active, y: g.active.y + 1 })
  if (!grounded) {
    g.lockAcc = 0
    g.fallAcc += dt
    if (g.fallAcc >= grav) {
      g.fallAcc -= grav
      tryMove(g, 0, 1)
    }
    return []
  }
  g.lockAcc += dt
  if (g.lockAcc >= 0.48) return stamp(g)
  return []
}

export function ghost(g: Game): Active | null {
  if (!g.active) return null
  return { ...g.active, y: ghostY(g) }
}

export function fallBlend(g: Game): number {
  if (!g.active) return 0
  const grounded = !valid(g.board, { ...g.active, y: g.active.y + 1 })
  if (grounded) return 0
  const grav = levelFor(g.levelIndex).gravityMs / 1000
  return Math.max(0, Math.min(1, g.fallAcc / grav))
}

export function isGrounded(g: Game): boolean {
  if (!g.active) return true
  return !valid(g.board, { ...g.active, y: g.active.y + 1 })
}

export function visibleBoard(g: Game): (Cell | null)[][] {
  return g.board.slice(HIDDEN)
}

export function nextQueue(g: Game, n = 5): PieceId[] {
  return g.queue.slice(0, n)
}

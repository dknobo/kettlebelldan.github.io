export type Mode = 'classic' | 'lattice'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type Puzzle = {
  mode: Mode
  size: number
  maxDigit: number
  givens: number[]
  solution: number[]
  units: number[][]
  unitsByCell: number[][][]
}

export function indexOf(x: number, y: number, z: number, size: number): number {
  return x + size * y + size * size * z
}

export function xyz(index: number, size: number): { x: number; y: number; z: number } {
  const s2 = size * size
  const z = Math.floor(index / s2)
  const rem = index - z * s2
  const y = Math.floor(rem / size)
  const x = rem - y * size
  return { x, y, z }
}

export function sliceUnits(size: number): number[][] {
  const units: number[][] = []
  for (let z = 0; z < size; z++) {
    const unit: number[] = []
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) unit.push(indexOf(x, y, z, size))
    units.push(unit)
  }
  for (let y = 0; y < size; y++) {
    const unit: number[] = []
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) unit.push(indexOf(x, y, z, size))
    units.push(unit)
  }
  for (let x = 0; x < size; x++) {
    const unit: number[] = []
    for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) unit.push(indexOf(x, y, z, size))
    units.push(unit)
  }
  return units
}

export function lineUnits(size: number): number[][] {
  const units: number[][] = []
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      const unit: number[] = []
      for (let x = 0; x < size; x++) unit.push(indexOf(x, y, z, size))
      units.push(unit)
    }
  }
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const unit: number[] = []
      for (let y = 0; y < size; y++) unit.push(indexOf(x, y, z, size))
      units.push(unit)
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const unit: number[] = []
      for (let z = 0; z < size; z++) unit.push(indexOf(x, y, z, size))
      units.push(unit)
    }
  }
  return units
}

export function buildUnitsByCell(cellCount: number, units: number[][]): number[][][] {
  const map: number[][][] = Array.from({ length: cellCount }, () => [])
  for (const unit of units) {
    for (const i of unit) map[i].push(unit)
  }
  return map
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function candidatesFor(
  grid: number[],
  unitsByCell: number[][][],
  maxDigit: number,
  index: number,
): number[] {
  const used = new Uint8Array(maxDigit + 1)
  for (const unit of unitsByCell[index]) {
    for (const j of unit) {
      const v = grid[j]
      if (v) used[v] = 1
    }
  }
  const out: number[] = []
  for (let d = 1; d <= maxDigit; d++) if (!used[d]) out.push(d)
  return out
}

export function conflictIndices(grid: number[], units: number[][]): Set<number> {
  const bad = new Set<number>()
  for (const unit of units) {
    const seen = new Map<number, number>()
    for (const i of unit) {
      const v = grid[i]
      if (!v) continue
      const prev = seen.get(v)
      if (prev !== undefined) {
        bad.add(prev)
        bad.add(i)
      } else {
        seen.set(v, i)
      }
    }
  }
  return bad
}

export function isSolved(grid: number[], solution: number[]): boolean {
  for (let i = 0; i < grid.length; i++) if (grid[i] !== solution[i]) return false
  return true
}

export function filledCount(grid: number[]): number {
  let n = 0
  for (const v of grid) if (v) n++
  return n
}

type SolveOpts = {
  randomize?: boolean
  rng?: () => number
  limit?: number
  deadline?: number
}

function solveAll(
  grid: number[],
  unitsByCell: number[][][],
  maxDigit: number,
  opts: SolveOpts = {},
): number[][] {
  const randomize = opts.randomize ?? false
  const rng = opts.rng ?? Math.random
  const limit = opts.limit ?? 1
  const deadline = opts.deadline ?? Infinity
  const solutions: number[][] = []
  const n = grid.length

  const search = (): boolean => {
    if (performance.now() > deadline) return true
    if (solutions.length >= limit) return true

    let best = -1
    let bestCands: number[] | null = null
    for (let i = 0; i < n; i++) {
      if (grid[i]) continue
      const cands = candidatesFor(grid, unitsByCell, maxDigit, i)
      if (cands.length === 0) return false
      if (!bestCands || cands.length < bestCands.length) {
        best = i
        bestCands = cands
        if (cands.length === 1) break
      }
    }

    if (best === -1) {
      solutions.push(grid.slice())
      return solutions.length >= limit
    }

    const order = randomize ? shuffle(bestCands!, rng) : bestCands!
    for (const v of order) {
      grid[best] = v
      if (search()) {
        if (solutions.length >= limit || performance.now() > deadline) {
          grid[best] = 0
          return true
        }
      }
      grid[best] = 0
    }
    return false
  }

  search()
  return solutions
}

function completeGrid(size: number, units: number[][], maxDigit: number, rng: () => number): number[] {
  const cellCount = size * size * size
  const unitsByCell = buildUnitsByCell(cellCount, units)
  const empty = new Array<number>(cellCount).fill(0)
  for (let attempt = 0; attempt < 40; attempt++) {
    const found = solveAll(empty, unitsByCell, maxDigit, {
      randomize: true,
      rng,
      limit: 1,
      deadline: performance.now() + 250,
    })
    if (found[0]) return found[0]
  }
  throw new Error('Failed to generate a completed 3D Sudoku grid')
}

function clueTarget(mode: Mode, difficulty: Difficulty): number {
  if (mode === 'classic') {
    if (difficulty === 'easy') return 16
    if (difficulty === 'medium') return 12
    return 9
  }
  if (difficulty === 'easy') return 30
  if (difficulty === 'medium') return 24
  return 18
}

export function generatePuzzle(mode: Mode, difficulty: Difficulty, seed?: number): Puzzle {
  const size = mode === 'classic' ? 3 : 4
  const maxDigit = mode === 'classic' ? 9 : 4
  const units = mode === 'classic' ? sliceUnits(size) : lineUnits(size)
  const cellCount = size * size * size
  const unitsByCell = buildUnitsByCell(cellCount, units)
  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0)

  const solution = completeGrid(size, units, maxDigit, rng)
  const puzzle = solution.slice()
  const order = shuffle(
    Array.from({ length: cellCount }, (_, i) => i),
    rng,
  )
  const target = clueTarget(mode, difficulty)

  for (const i of order) {
    if (filledCount(puzzle) <= target) break
    const backup = puzzle[i]
    puzzle[i] = 0
    const copies = puzzle.slice()
    const found = solveAll(copies, unitsByCell, maxDigit, {
      randomize: false,
      limit: 2,
      deadline: performance.now() + 120,
    })
    if (found.length !== 1) puzzle[i] = backup
  }

  // Relabel digits for extra variety after uniqueness is locked? Relabeling preserves uniqueness.
  if (mode === 'lattice' || mode === 'classic') {
    const labels = shuffle(
      Array.from({ length: maxDigit }, (_, i) => i + 1),
      rng,
    )
    const map = [0, ...labels]
    for (let i = 0; i < cellCount; i++) {
      puzzle[i] = map[puzzle[i]]
      solution[i] = map[solution[i]]
    }
  }

  return { mode, size, maxDigit, givens: puzzle, solution, units, unitsByCell }
}

export function logicalHint(
  grid: number[],
  units: number[][],
  unitsByCell: number[][][],
  maxDigit: number,
  solution: number[],
): { index: number; value: number; reason: string } | null {
  // Naked single
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue
    const cands = candidatesFor(grid, unitsByCell, maxDigit, i)
    if (cands.length === 1) {
      return { index: i, value: cands[0], reason: 'Only one digit fits this cell.' }
    }
  }

  // Hidden single in a unit
  for (const unit of units) {
    for (let d = 1; d <= maxDigit; d++) {
      let spot = -1
      let count = 0
      let already = false
      for (const i of unit) {
        if (grid[i] === d) {
          already = true
          break
        }
        if (grid[i]) continue
        const cands = candidatesFor(grid, unitsByCell, maxDigit, i)
        if (cands.includes(d)) {
          count++
          spot = i
        }
      }
      if (!already && count === 1 && spot >= 0) {
        return { index: spot, value: d, reason: `Digit ${d} can only live in one cell of this slice.` }
      }
    }
  }

  // Fallback: reveal a solution cell that is still empty
  const empty = grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
  if (!empty.length) return null
  const index = empty[Math.floor(Math.random() * empty.length)]
  return { index, value: solution[index], reason: 'A little light from the finished cube.' }
}

export function relatedCells(index: number, unitsByCell: number[][][]): Set<number> {
  const out = new Set<number>()
  for (const unit of unitsByCell[index] ?? []) {
    for (const j of unit) if (j !== index) out.add(j)
  }
  return out
}

export function unitComplete(grid: number[], unit: number[], maxDigit: number): boolean {
  const seen = new Uint8Array(maxDigit + 1)
  for (const i of unit) {
    const v = grid[i]
    if (!v || seen[v]) return false
    seen[v] = 1
  }
  return true
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type Difficulty,
  type Mode,
  type Puzzle,
  candidatesFor,
  conflictIndices,
  generatePuzzle,
  indexOf,
  isSolved,
  logicalHint,
  relatedCells,
  unitComplete,
  xyz,
} from './engine'
import { createSudokuScene, type FocusAxis, type SudokuScene } from './scene'
import './sudoku3d.css'

type Notes = number[][]

type Game = {
  puzzle: Puzzle
  grid: number[]
  notes: Notes
  startedAt: number
  elapsed: number
  running: boolean
  mistakes: number
  hintCount: number
}

const LS_BEST = 'sudoku3d-best'

function emptyNotes(n: number): Notes {
  return Array.from({ length: n }, () => [])
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function makeGame(mode: Mode, difficulty: Difficulty): Game {
  const puzzle = generatePuzzle(mode, difficulty)
  return {
    puzzle,
    grid: puzzle.givens.slice(),
    notes: emptyNotes(puzzle.givens.length),
    startedAt: 0,
    elapsed: 0,
    running: false,
    mistakes: 0,
    hintCount: 0,
  }
}

function bestKey(mode: Mode, difficulty: Difficulty) {
  return `${LS_BEST}:${mode}:${difficulty}`
}

export default function Sudoku3DApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SudokuScene | null>(null)
  const gameRef = useRef<Game | null>(null)
  const [screen, setScreen] = useState<'menu' | 'play'>('menu')
  const [mode, setMode] = useState<Mode>('classic')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [game, setGame] = useState<Game | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [explode, setExplode] = useState(0.28)
  const [focusAxis, setFocusAxis] = useState<FocusAxis>('all')
  const [focusLayer, setFocusLayer] = useState(0)
  const [noteMode, setNoteMode] = useState(false)
  const [won, setWon] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [best, setBest] = useState<string | null>(null)

  gameRef.current = game

  useEffect(() => {
    document.title = '3D Sudoku · kettlebelldan.com'
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || screen !== 'play') return
    const scene = createSudokuScene(canvas)
    sceneRef.current = scene
    scene.setExplode(explode)
    const onResize = () => scene.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      scene.dispose()
      sceneRef.current = null
    }
  }, [screen])

  useEffect(() => {
    sceneRef.current?.setExplode(explode)
  }, [explode])

  useEffect(() => {
    if (screen !== 'play' || won) return
    const id = window.setInterval(() => setTick((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [screen, won])

  useEffect(() => {
    if (!game || won) return
    if (!isSolved(game.grid, game.puzzle.solution)) return
    const total = game.running ? Date.now() - game.startedAt + game.elapsed : game.elapsed
    setWon(true)
    setGame((g) => (g ? { ...g, running: false, elapsed: total } : g))
    const key = bestKey(game.puzzle.mode, difficulty)
    const prev = Number(localStorage.getItem(key) || 0)
    if (!prev || total < prev) {
      localStorage.setItem(key, String(total))
      setBest(formatTime(total))
    }
  }, [game, won, difficulty])

  const conflicts = useMemo(
    () => (game ? conflictIndices(game.grid, game.puzzle.units) : new Set<number>()),
    [game],
  )
  const related = useMemo(
    () => (game && selected != null ? relatedCells(selected, game.puzzle.unitsByCell) : new Set<number>()),
    [game, selected],
  )
  const completeCells = useMemo(() => {
    const set = new Set<number>()
    if (!game) return set
    for (const unit of game.puzzle.units) {
      if (unitComplete(game.grid, unit, game.puzzle.maxDigit)) {
        for (const i of unit) set.add(i)
      }
    }
    return set
  }, [game])

  useEffect(() => {
    if (!game || !sceneRef.current) return
    const givenMask = game.puzzle.givens.map((v) => v > 0)
    sceneRef.current.setView({
      size: game.puzzle.size,
      grid: game.grid,
      givenMask,
      selected,
      hovered,
      conflicts,
      related,
      completeCells,
      won,
      focusAxis,
      focusLayer,
    })
    sceneRef.current.setAutoRotate(won || selected == null)
  }, [game, selected, hovered, conflicts, related, completeCells, won, focusAxis, focusLayer, tick])

  const elapsed = game ? (game.running ? Date.now() - game.startedAt + game.elapsed : game.elapsed) : 0

  const touchStart = useCallback(() => {
    setGame((g) => {
      if (!g || g.running || won) return g
      return { ...g, running: true, startedAt: Date.now() }
    })
  }, [won])

  const place = useCallback(
    (index: number, value: number) => {
      setGame((g) => {
        if (!g || won) return g
        if (g.puzzle.givens[index]) return g
        const next = { ...g, grid: g.grid.slice(), notes: g.notes.map((n) => n.slice()) }
        if (!next.running) {
          next.running = true
          next.startedAt = Date.now()
        }
        if (noteMode) {
          if (!value) {
            next.notes[index] = []
            return next
          }
          const has = next.notes[index].includes(value)
          next.notes[index] = has ? next.notes[index].filter((n) => n !== value) : [...next.notes[index], value].sort((a, b) => a - b)
          return next
        }
        if (next.grid[index] === value || value === 0) {
          next.grid[index] = 0
          return next
        }
        next.grid[index] = value
        next.notes[index] = []
        if (value !== g.puzzle.solution[index]) next.mistakes += 1
        return next
      })
    },
    [difficulty, noteMode, won],
  )

  const start = () => {
    const g = makeGame(mode, difficulty)
    setGame(g)
    setSelected(null)
    setHovered(null)
    setWon(false)
    setFocusAxis('all')
    setFocusLayer(0)
    setExplode(mode === 'classic' ? 0.28 : 0.42)
    setNoteMode(false)
    setScreen('play')
    const rec = localStorage.getItem(bestKey(mode, difficulty))
    setBest(rec ? formatTime(Number(rec)) : null)
  }

  const hint = () => {
    if (!game || won) return
    touchStart()
    const h = logicalHint(game.grid, game.puzzle.units, game.puzzle.unitsByCell, game.puzzle.maxDigit, game.puzzle.solution)
    if (!h) return
    setSelected(h.index)
    setGame((g) => {
      if (!g) return g
      const next = { ...g, grid: g.grid.slice(), notes: g.notes.map((n) => n.slice()), hintCount: g.hintCount + 1 }
      next.grid[h.index] = h.value
      next.notes[h.index] = []
      if (!next.running) {
        next.running = true
        next.startedAt = Date.now()
      }
      return next
    })
  }

  useEffect(() => {
    if (screen !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (!game) return
      const max = game.puzzle.maxDigit
      const size = game.puzzle.size
      if (e.key === 'n' || e.key === 'N') {
        setNoteMode((v) => !v)
        return
      }
      if (e.key === 'h' || e.key === 'H') {
        hint()
        return
      }
      if (e.key === '?' || e.key === '/') {
        setHelpOpen((v) => !v)
        return
      }
      if (selected == null) return
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.key === ' ') {
        e.preventDefault()
        place(selected, 0)
        return
      }
      if (/^[1-9]$/.test(e.key)) {
        const v = Number(e.key)
        if (v <= max) place(selected, v)
        return
      }
      const { x, y, z } = xyz(selected, size)
      let nx = x
      let ny = y
      let nz = z
      if (e.key === 'ArrowLeft') nx = Math.max(0, x - 1)
      if (e.key === 'ArrowRight') nx = Math.min(size - 1, x + 1)
      if (e.key === 'ArrowUp') ny = Math.min(size - 1, y + 1)
      if (e.key === 'ArrowDown') ny = Math.max(0, y - 1)
      if (e.key === '[' ) nz = Math.max(0, z - 1)
      if (e.key === ']') nz = Math.min(size - 1, z + 1)
      if (nx !== x || ny !== y || nz !== z) setSelected(indexOf(nx, ny, nz, size))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const digits = game ? Array.from({ length: game.puzzle.maxDigit }, (_, i) => i + 1) : []

  return (
    <div className={`s3d ${screen}`}>
      {screen === 'play' && (
        <div className="s3d-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="s3d-canvas"
            onPointerDown={(e) => {
              const idx = sceneRef.current?.pick(e.clientX, e.clientY)
              if (idx == null) return
              setSelected(idx)
              touchStart()
            }}
            onPointerMove={(e) => {
              const idx = sceneRef.current?.pick(e.clientX, e.clientY) ?? null
              setHovered(idx)
            }}
            onPointerLeave={() => setHovered(null)}
          />
        </div>
      )}

      {screen === 'menu' ? (
        <div className="s3d-menu">
          <div className="s3d-hero">
            <div className="s3d-kicker">kettlebelldan.com</div>
            <h1>3D Sudoku</h1>
            <p className="lede">
              Not a flat grid in a fancy jacket. This is a crystal cube of digits. Every square slice — front to back,
              left to right, top to bottom — must hold each number exactly once.
            </p>
            <div className="s3d-rules">
              <div className="s3d-rule">
                <strong>Orbit</strong>
                <span>Drag the cube. The board is the object. Interior cells hide until you turn or explode the lattice.</span>
              </div>
              <div className="s3d-rule">
                <strong>Slice</strong>
                <span>Select a cell and read its three intersecting faces. Those faces are your Sudoku units.</span>
              </div>
              <div className="s3d-rule">
                <strong>Fill</strong>
                <span>Classic uses 1–9 on a 3×3×3. Lattice uses 1–4 on every straight line of a 4×4×4.</span>
              </div>
            </div>
            <Link className="s3d-link" to="/">
              ← Back home
            </Link>
          </div>

          <div className="s3d-setup">
            <img className="relic" src="/sudoku3d/relic.jpg" alt="Crystal sudoku cube" />
            <h2>Assemble the cube</h2>
            <p className="s3d-help">Choose a geometry, a difficulty, then begin. Fresh puzzles every time.</p>
            <div className="s3d-modes">
              <button className={`s3d-mode ${mode === 'classic' ? 'on' : ''}`} onClick={() => setMode('classic')}>
                <b>Classic · 3×3×3</b>
                <span>Nine slices. Digits 1–9. The true 3D cousin of a Sudoku box.</span>
              </button>
              <button className={`s3d-mode ${mode === 'lattice' ? 'on' : ''}`} onClick={() => setMode('lattice')}>
                <b>Lattice · 4×4×4</b>
                <span>Sixty-four cells. Every row, column, and pillar holds 1–4 once.</span>
              </button>
            </div>
            <div className="s3d-diffs">
              {(
                [
                  ['easy', 'Gentle clues, room to learn the cube'],
                  ['medium', 'Balanced. You’ll need the slice view'],
                  ['hard', 'Sparse. Think in three directions'],
                ] as const
              ).map(([id, copy]) => (
                <button key={id} className={`s3d-diff ${difficulty === id ? 'on' : ''}`} onClick={() => setDifficulty(id)}>
                  <b>{id}</b>
                  <span>{copy}</span>
                </button>
              ))}
            </div>
            <button className="s3d-btn primary s3d-start" onClick={start}>
              Begin
            </button>
          </div>
        </div>
      ) : (
        game && (
          <div className="s3d-ui">
            <div className="s3d-top">
              <div className="s3d-brand">
                <div className="s3d-kicker">3D Sudoku</div>
                <h1 className="s3d-title">{game.puzzle.mode === 'classic' ? 'Classic cube' : 'Lattice cube'}</h1>
                <div className="s3d-sub">
                  {game.puzzle.mode === 'classic'
                    ? 'Each 3×3 slice in every direction contains 1–9 once.'
                    : 'Each line of four — X, Y, and Z — contains 1–4 once.'}
                </div>
              </div>
              <div>
                <div className="s3d-stats">
                  <div className="s3d-chip">
                    <b>{formatTime(elapsed)}</b>
                    <span>time</span>
                  </div>
                  <div className="s3d-chip">
                    <b>{game.mistakes}</b>
                    <span>misses</span>
                  </div>
                  <div className="s3d-chip">
                    <b>{best ?? '—'}</b>
                    <span>best</span>
                  </div>
                </div>
                <div className="s3d-actions" style={{ marginTop: 10 }}>
                  <button className="s3d-btn ghost" onClick={() => setScreen('menu')}>
                    Menu
                  </button>
                  <button className="s3d-btn" onClick={() => setHelpOpen((v) => !v)}>
                    Rules
                  </button>
                  <button className="s3d-btn" onClick={hint}>
                    Hint
                  </button>
                  <button className="s3d-btn primary" onClick={start}>
                    New cube
                  </button>
                </div>
              </div>
            </div>

            <div className="s3d-side">
              <div className="s3d-panel">
                <h3>Intersecting slices</h3>
                {selected == null ? (
                  <p className="s3d-help">Tap a cell in the cube. Its three faces appear here, so the 3D constraints become readable.</p>
                ) : (
                  <SliceInspector
                    game={game}
                    selected={selected}
                    conflicts={conflicts}
                    related={related}
                    onSelect={setSelected}
                    noteMode={noteMode}
                  />
                )}
              </div>
              {helpOpen && (
                <div className="s3d-panel">
                  <h3>How this works</h3>
                  <p className="s3d-help">
                    Classic 3D Sudoku (sometimes called Roxdoku) stacks numbers in a cube. Imagine three ordinary 3×3 boxes
                    stacked through each axis. No digit may repeat inside any of those squares. Lattice mode is a Latin cube:
                    every straight line is 1–4.
                    <br />
                    <br />
                    Drag to orbit · scroll to zoom · arrows move · [ ] change depth · N notes · H hint
                  </p>
                </div>
              )}
            </div>

            <div className="s3d-bottom">
              <div className="s3d-panel s3d-sliders">
                <h3>Presence</h3>
                <label>
                  Explode lattice <span>{Math.round(explode * 100)}%</span>
                </label>
                <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
                <div className="s3d-focus">
                  {(['all', 'x', 'y', 'z'] as const).map((axis) => (
                    <button key={axis} className={focusAxis === axis ? 'on' : ''} onClick={() => setFocusAxis(axis)}>
                      {axis === 'all' ? 'All' : axis.toUpperCase()}
                    </button>
                  ))}
                  {focusAxis !== 'all' &&
                    Array.from({ length: game.puzzle.size }, (_, i) => (
                      <button key={i} className={focusLayer === i ? 'on' : ''} onClick={() => setFocusLayer(i)}>
                        {i + 1}
                      </button>
                    ))}
                </div>
                <label className="s3d-toggle">
                  <input type="checkbox" checked={noteMode} onChange={(e) => setNoteMode(e.target.checked)} />
                  Pencil notes
                </label>
              </div>

              <div className="s3d-panel">
                <h3>{noteMode ? 'Write a note' : 'Place a digit'}</h3>
                <div className={`s3d-pad ${game.puzzle.mode}`}>
                  {digits.map((d) => (
                    <button
                      key={d}
                      className={selected != null && game.grid[selected] === d ? 'active' : ''}
                      onClick={() => selected != null && place(selected, d)}
                    >
                      {d}
                    </button>
                  ))}
                  <button className="warn" onClick={() => selected != null && place(selected, 0)}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="s3d-panel">
                <h3>Candidates</h3>
                {selected == null ? (
                  <p className="s3d-help">Select a cell to see what still fits.</p>
                ) : game.puzzle.givens[selected] ? (
                  <p className="s3d-help">This number was given. It cannot move.</p>
                ) : (
                  <p className="s3d-help">
                    Legal here:{' '}
                    {candidatesFor(game.grid, game.puzzle.unitsByCell, game.puzzle.maxDigit, selected).join(' · ') || 'none — conflict nearby'}
                    {game.notes[selected].length > 0 && (
                      <>
                        <br />
                        Notes: {game.notes[selected].join(' · ')}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {won && game && (
        <div className="s3d-win">
          <div className="card">
            <div className="s3d-kicker">Cube complete</div>
            <h2>Solved</h2>
            <p>
              {formatTime(game.elapsed)} · {game.mistakes} {game.mistakes === 1 ? 'miss' : 'misses'} · {game.hintCount}{' '}
              {game.hintCount === 1 ? 'hint' : 'hints'}
            </p>
            <div className="s3d-actions" style={{ justifyContent: 'center' }}>
              <button className="s3d-btn" onClick={() => setScreen('menu')}>
                Menu
              </button>
              <button className="s3d-btn primary" onClick={start}>
                Another cube
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SliceInspector({
  game,
  selected,
  conflicts,
  related,
  onSelect,
  noteMode,
}: {
  game: Game
  selected: number
  conflicts: Set<number>
  related: Set<number>
  onSelect: (i: number) => void
  noteMode: boolean
}) {
  const { size } = game.puzzle
  const sel = xyz(selected, size)
  const slices = [
    {
      title: `Z layer ${sel.z + 1}`,
      hint: 'front face of this depth',
      cells: planeCells(size, (x, y) => indexOf(x, y, sel.z, size)),
    },
    {
      title: `Y layer ${sel.y + 1}`,
      hint: 'horizontal ribbon',
      cells: planeCells(size, (x, z) => indexOf(x, sel.y, z, size)),
    },
    {
      title: `X layer ${sel.x + 1}`,
      hint: 'vertical ribbon',
      cells: planeCells(size, (y, z) => indexOf(sel.x, y, z, size)),
    },
  ]

  return (
    <div className="s3d-slices">
      {slices.map((slice) => (
        <div key={slice.title} className="s3d-slice">
          <header>
            <span>{slice.title}</span>
            <span>{slice.hint}</span>
          </header>
          <div className="s3d-grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {slice.cells.map((index) => {
              const value = game.grid[index]
              const given = game.puzzle.givens[index] > 0
              const notes = game.notes[index]
              return (
                <button
                  key={index}
                  className={[
                    's3d-cell',
                    given ? 'given' : value ? 'player' : '',
                    index === selected ? 'selected' : '',
                    related.has(index) ? 'related' : '',
                    conflicts.has(index) ? 'conflict' : '',
                  ].join(' ')}
                  onClick={() => onSelect(index)}
                >
                  {value ? (
                    value
                  ) : notes.length && noteMode ? (
                    <div className="s3d-notes" style={{ gridTemplateColumns: `repeat(${Math.min(3, game.puzzle.maxDigit)}, 1fr)` }}>
                      {Array.from({ length: game.puzzle.maxDigit }, (_, i) => (
                        <span key={i}>{notes.includes(i + 1) ? i + 1 : ''}</span>
                      ))}
                    </div>
                  ) : notes.length ? (
                    <div className="s3d-notes">
                      {Array.from({ length: game.puzzle.maxDigit }, (_, i) => (
                        <span key={i}>{notes.includes(i + 1) ? i + 1 : ''}</span>
                      ))}
                    </div>
                  ) : (
                    ''
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function planeCells(size: number, at: (a: number, b: number) => number): number[] {
  const cells: number[] = []
  for (let b = size - 1; b >= 0; b--) {
    for (let a = 0; a < size; a++) cells.push(at(a, b))
  }
  return cells
}

import type {
  Category,
  GameMode,
  LiarPrompt,
  Player,
  RoleCard,
  Round,
  Settings,
} from './types'
import { CATEGORIES } from './data/words'
import type { ImposterTheme } from './theme'
import { PARTY_THEME } from './theme'

export function defaultSettingsFor(categories: Category[]): Settings {
  return {
    mode: 'classic',
    imposterCount: 1,
    timerSeconds: 180,
    hintLevel: 'category',
    impostersKnowEachOther: false,
    lastChanceGuess: true,
    categoryIds: categories.map((c) => c.id),
    clueRounds: 2,
    winScore: 0,
    voteStyle: 'quick',
    customWords: [],
  }
}

export const DEFAULT_SETTINGS: Settings = defaultSettingsFor(CATEGORIES)

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

export function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function clampImposters(playerCount: number, imposters: number): number {
  const max = Math.max(1, Math.floor((playerCount - 1) / 2))
  return Math.min(Math.max(1, imposters), max)
}

export function recommendedImposters(playerCount: number): number {
  if (playerCount >= 10) return 3
  if (playerCount >= 7) return 2
  return 1
}

export function suggestedNames(count: number): string[] {
  const pool = [
    'Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Quinn', 'Avery', 'Jamie',
    'Taylor', 'Morgan', 'Reese', 'Parker', 'Drew', 'Skyler', 'Cameron', 'Finley',
  ]
  return Array.from({ length: count }, (_, i) => pool[i] || `Player ${i + 1}`)
}

function customCategory(words: string[]): Category {
  return {
    id: 'custom',
    name: 'Custom',
    emoji: '✏️',
    blurb: 'Words your group added',
    words: words.map((word) => ({ word, hint: 'A custom group word' })),
  }
}

function pickCategory(settings: Settings, categories: Category[]): Category {
  const selected = categories.filter((c) => settings.categoryIds.includes(c.id))
  const pool = [...selected]
  if (settings.categoryIds.includes('custom') && settings.customWords.length >= 3) {
    pool.push(customCategory(settings.customWords))
  }
  if (!pool.length) {
    return settings.customWords.length >= 3 ? customCategory(settings.customWords) : categories[0]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickWord(category: Category, usedWords: string[]) {
  const fresh = category.words.filter((w) => !usedWords.includes(`${category.id}:${w.word}`))
  const pool = fresh.length ? fresh : category.words
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickDecoy(category: Category, secret: string) {
  const others = category.words.filter((w) => w.word !== secret)
  if (!others.length) return null
  return others[Math.floor(Math.random() * others.length)].word
}

function pickPrompt(usedPrompts: string[], prompts: LiarPrompt[]): LiarPrompt {
  const fresh = prompts.filter((p) => !usedPrompts.includes(p.id))
  const pool = fresh.length ? fresh : prompts
  return pool[Math.floor(Math.random() * pool.length)]
}

export function createRound(
  players: Player[],
  settings: Settings,
  usedWords: string[],
  usedPrompts: string[],
  theme: ImposterTheme = PARTY_THEME,
): Round {
  const mode: GameMode = settings.mode
  const maxImposters = mode === 'liar' ? 1 : clampImposters(players.length, settings.imposterCount)
  const actualImposterCount =
    mode === 'chaos' ? Math.floor(Math.random() * (maxImposters + 1)) : maxImposters

  const imposterIds = new Set(
    shuffle(players.map((p) => p.id)).slice(0, actualImposterCount),
  )
  const imposterNames = players
    .filter((p) => imposterIds.has(p.id))
    .map((p) => p.name)

  if (mode === 'liar') {
    const prompt = pickPrompt(usedPrompts, theme.liarPrompts)
    const starter = players[Math.floor(Math.random() * players.length)]
    const cards: RoleCard[] = players.map((p) => {
      const isImposter = imposterIds.has(p.id)
      return {
        playerId: p.id,
        isImposter,
        word: null,
        categoryName: prompt.topic,
        categoryEmoji: '❓',
        hint: null,
        question: isImposter ? prompt.liar : prompt.civilian,
        otherImposterNames:
          settings.impostersKnowEachOther && isImposter
            ? imposterNames.filter((n) => n !== p.name)
            : [],
      }
    })
    return {
      mode,
      categoryId: `liar:${prompt.id}`,
      categoryName: prompt.topic,
      categoryEmoji: '❓',
      secretWord: prompt.civilian,
      decoyWord: prompt.liar,
      civilianQuestion: prompt.civilian,
      liarQuestion: prompt.liar,
      cards,
      starterPlayerId: starter.id,
      wordKey: prompt.id,
      actualImposterCount,
    }
  }

  const category = pickCategory(settings, theme.categories)
  const entry = pickWord(category, usedWords)
  const decoy = mode === 'mystery' ? pickDecoy(category, entry.word) : null
  const starter = players[Math.floor(Math.random() * players.length)]

  const cards: RoleCard[] = players.map((p) => {
    const isImposter = imposterIds.has(p.id)
    let word: string | null = entry.word
    let hint: string | null = null

    if (isImposter && mode !== 'mystery') {
      word = null
      if (settings.hintLevel === 'category') hint = `Category: ${category.name}`
      if (settings.hintLevel === 'clue') hint = entry.hint
      if (settings.hintLevel === 'none') hint = null
    }
    if (isImposter && mode === 'mystery') {
      word = decoy
      hint = null
    }

    return {
      playerId: p.id,
      isImposter,
      word,
      categoryName: category.name,
      categoryEmoji: category.emoji,
      hint,
      question: null,
      otherImposterNames:
        settings.impostersKnowEachOther && isImposter && mode !== 'mystery'
          ? imposterNames.filter((n) => n !== p.name)
          : [],
    }
  })

  return {
    mode,
    categoryId: category.id,
    categoryName: category.name,
    categoryEmoji: category.emoji,
    secretWord: entry.word,
    decoyWord: decoy,
    civilianQuestion: null,
    liarQuestion: null,
    cards,
    starterPlayerId: starter.id,
    wordKey: `${category.id}:${entry.word}`,
    actualImposterCount,
  }
}

export function scoreRound(opts: {
  players: Player[]
  round: Round
  accusedIds: string[]
  guessCorrect: boolean
}): { players: Player[]; crewWon: boolean; deltas: Record<string, number> } {
  const imposterIds = new Set(opts.round.cards.filter((c) => c.isImposter).map((c) => c.playerId))
  const accused = new Set(opts.accusedIds)
  const nobodyAccused = accused.has('nobody')
  const actualIds = [...imposterIds]

  let identifiedAll = false
  if (actualIds.length === 0) {
    identifiedAll = nobodyAccused || accused.size === 0
  } else if (!nobodyAccused) {
    identifiedAll =
      actualIds.length === accused.size && actualIds.every((id) => accused.has(id))
  }

  const crewWon = identifiedAll && !opts.guessCorrect
  const deltas: Record<string, number> = {}

  for (const p of opts.players) {
    const isImposter = imposterIds.has(p.id)
    let delta = 0
    if (crewWon && !isImposter) delta = 1
    else if (!crewWon && isImposter) delta = opts.guessCorrect ? 3 : 2
    deltas[p.id] = delta
  }

  return {
    crewWon,
    deltas,
    players: opts.players.map((p) => ({ ...p, score: p.score + (deltas[p.id] || 0) })),
  }
}

export function playerById(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id === id)
}

export function checkIdentified(round: Round, accusedIds: string[]): boolean {
  const actual = new Set(round.cards.filter((c) => c.isImposter).map((c) => c.playerId))
  const accused = new Set(accusedIds)
  if (actual.size === 0) return accused.has('nobody') || accused.size === 0
  if (accused.has('nobody')) return false
  return actual.size === accused.size && [...actual].every((id) => accused.has(id))
}

export function tallyVotes(votes: Record<string, string>, round: Round): string[] {
  const counts = new Map<string, number>()
  for (const target of Object.values(votes)) {
    counts.set(target, (counts.get(target) || 0) + 1)
  }
  if (round.actualImposterCount === 0) {
    const nobodyVotes = counts.get('nobody') || 0
    const others = [...counts.entries()].filter(([id]) => id !== 'nobody')
    const maxOther = others.reduce((m, [, n]) => Math.max(m, n), 0)
    if (nobodyVotes >= maxOther) return ['nobody']
    return others.sort((a, b) => b[1] - a[1]).slice(0, 1).map(([id]) => id)
  }
  const needed = Math.max(1, round.actualImposterCount)
  return [...counts.entries()]
    .filter(([id]) => id !== 'nobody')
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, needed)
    .map(([id]) => id)
}

export function haptic(ms = 18) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

export async function keepAwake(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen')
    }
  } catch {
    /* ignore */
  }
  return null
}

export function beep(kind: 'tick' | 'end' | 'tap' = 'tap') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = kind === 'end' ? 880 : kind === 'tick' ? 660 : 420
    gain.gain.value = 0.04
    osc.start()
    osc.stop(ctx.currentTime + (kind === 'end' ? 0.28 : 0.08))
    osc.onended = () => ctx.close()
  } catch {
    /* ignore */
  }
}

import type { Player, Settings } from './types'
import { defaultSettingsFor } from './gameLogic'
import type { ImposterTheme } from './theme'
import { PARTY_THEME } from './theme'

type Saved = {
  players: Player[]
  settings: Settings
  usedWords: string[]
  usedPrompts: string[]
}

function safeParse(raw: string | null): Partial<Saved> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<Saved>
  } catch {
    return {}
  }
}

export function loadSaved(theme: ImposterTheme = PARTY_THEME): Saved {
  const defaults = defaultSettingsFor(theme.categories)
  let raw: string | null = null
  try {
    raw = localStorage.getItem(theme.storageKey)
  } catch {
    raw = null
  }
  const data = safeParse(raw)
  const validIds = new Set(theme.categories.map((c) => c.id).concat(['custom']))
  const savedIds = Array.isArray(data.settings?.categoryIds)
    ? data.settings.categoryIds.filter((id) => validIds.has(id))
    : []
  return {
    players: Array.isArray(data.players) && data.players.length >= 3
      ? data.players.map((p, i) => ({
          id: p.id || `p-${i + 1}`,
          name: (p.name || `Player ${i + 1}`).slice(0, 18),
          score: typeof p.score === 'number' ? p.score : 0,
        }))
      : defaultPlayers(),
    settings: {
      ...defaults,
      ...(data.settings || {}),
      customWords: Array.isArray(data.settings?.customWords) ? data.settings.customWords : [],
      categoryIds: savedIds.length ? savedIds : defaults.categoryIds,
    },
    usedWords: Array.isArray(data.usedWords) ? data.usedWords.slice(-120) : [],
    usedPrompts: Array.isArray(data.usedPrompts) ? data.usedPrompts.slice(-80) : [],
  }
}

export function saveState(partial: Partial<Saved>, theme: ImposterTheme = PARTY_THEME) {
  try {
    const current = loadSaved(theme)
    const next: Saved = { ...current, ...partial }
    localStorage.setItem(theme.storageKey, JSON.stringify(next))
  } catch {
    /* private mode / blocked storage */
  }
}

export function defaultPlayers(): Player[] {
  return [
    { id: 'p-1', name: 'Player 1', score: 0 },
    { id: 'p-2', name: 'Player 2', score: 0 },
    { id: 'p-3', name: 'Player 3', score: 0 },
    { id: 'p-4', name: 'Player 4', score: 0 },
  ]
}

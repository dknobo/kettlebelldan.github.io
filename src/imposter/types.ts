export type GameMode = 'classic' | 'mystery' | 'chaos' | 'liar'

export type Screen =
  | 'home'
  | 'howto'
  | 'setup'
  | 'pass'
  | 'reveal'
  | 'discuss'
  | 'vote'
  | 'guess'
  | 'results'
  | 'scores'
  | 'packs'

export type HintLevel = 'none' | 'category' | 'clue'

export type VoteStyle = 'quick' | 'secret'

export type Player = {
  id: string
  name: string
  score: number
}

export type Settings = {
  mode: GameMode
  imposterCount: number
  timerSeconds: number
  hintLevel: HintLevel
  impostersKnowEachOther: boolean
  lastChanceGuess: boolean
  categoryIds: string[]
  clueRounds: number
  winScore: number
  voteStyle: VoteStyle
  customWords: string[]
}

export type RoleCard = {
  playerId: string
  isImposter: boolean
  word: string | null
  categoryName: string
  categoryEmoji: string
  hint: string | null
  question: string | null
  otherImposterNames: string[]
}

export type Round = {
  mode: GameMode
  categoryId: string
  categoryName: string
  categoryEmoji: string
  secretWord: string
  decoyWord: string | null
  civilianQuestion: string | null
  liarQuestion: string | null
  cards: RoleCard[]
  starterPlayerId: string
  wordKey: string
  actualImposterCount: number
}

export type RoundResult = {
  roundNumber: number
  secretWord: string
  categoryName: string
  imposterIds: string[]
  accusedIds: string[]
  crewWon: boolean
  guessUsed: boolean
  guessCorrect: boolean
  scoresDelta: Record<string, number>
}

export type WordEntry = {
  word: string
  hint: string
}

export type Category = {
  id: string
  name: string
  emoji: string
  blurb: string
  words: WordEntry[]
}

export type LiarPrompt = {
  id: string
  topic: string
  civilian: string
  liar: string
}

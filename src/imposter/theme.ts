import type { Category, LiarPrompt } from './types'
import { CATEGORIES } from './data/words'
import { LIAR_PROMPTS } from './data/questions'
import { MATH_CATEGORIES } from './data/mathWords'
import { MATH_LIAR_PROMPTS } from './data/mathQuestions'

export type ImposterTheme = {
  id: string
  storageKey: string
  titleLines: [string, string]
  tag: string
  blurb: string
  startLabel: string
  installNote: string
  documentTitle: string
  homeIcon?: string
  cssClass: string
  categories: Category[]
  liarPrompts: LiarPrompt[]
  howSteps: [string, string][]
  modesBlurb: string
  passHint: string
  revealPrompt: string
  revealHint: string
  gotIt: string
  imposterLabel: string
  imposterHint: string
  discussTitle: string
  discussBody: (starter: string, rounds: number) => string
  discussTip: string
  simple?: boolean
  skipTimer?: boolean
  skipVote?: boolean
  bigCategoryReveal?: boolean
  discussActionLabel?: string
  categoryBackgrounds?: Record<string, string>
  homeBackground?: string
  streamlined?: boolean
}

export const PARTY_THEME: ImposterTheme = {
  id: 'party',
  storageKey: 'imposter-party-v1',
  titleLines: ['Imposter', 'Party'],
  tag: 'Pass-the-phone party game',
  blurb: 'One phone. Secret words. Bluff, clue, and catch who is faking it.',
  startLabel: 'Start a game',
  installNote: 'On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.',
  documentTitle: 'Imposter Party',
  homeIcon: '/imposter-icon.jpg',
  cssClass: '',
  categories: CATEGORIES,
  liarPrompts: LIAR_PROMPTS,
  howSteps: [
    ['1. Set up', 'Add names, pick how many imposters, and choose categories.'],
    ['2. Pass the phone', 'Each player looks alone. First you see the category.'],
    ['3. Tap for the secret', 'Most players see the same word. Imposters see IMPOSTER.'],
    ['4. Hide it', 'Tap Got it, then hand the phone over.'],
    ['5. Give clues', 'Take turns saying one related word. Do not say the secret word.'],
    ['6. Vote', 'Figure out who is faking it. Imposters can steal it with a last guess.'],
  ],
  modesBlurb:
    'Classic, Mystery (imposters get a fake word), Chaos (maybe nobody is faking), and Find the Liar (one person gets a different question).',
  passHint: 'Only {name} should see the next screen.',
  revealPrompt: 'Tap to see your word',
  revealHint: 'Category is showing. Cover the screen, then tap.',
  gotIt: 'Got it',
  imposterLabel: 'IMPOSTER',
  imposterHint: 'You do not know the secret word. Blend in.',
  discussTitle: 'Give your clues',
  discussBody: (starter, rounds) =>
    `${starter} goes first. Each player says one word related to the secret. Play ${rounds} clue round${rounds === 1 ? '' : 's'}.`,
  discussTip: 'Do not say the secret word. Clear enough for friends, fuzzy enough that imposters stay lost.',
}

export const MATH_THEME: ImposterTheme = {
  id: 'math',
  storageKey: 'math-imposter-v1',
  titleLines: ['Math', 'Imposter'],
  tag: 'AMC 10 study night, but a game',
  blurb: 'Same rules. Math words. Someone in the room is bluffing through algebra.',
  startLabel: 'Start a round',
  installNote: '',
  documentTitle: 'Math Imposter',
  cssClass: 'math',
  categories: MATH_CATEGORIES,
  liarPrompts: MATH_LIAR_PROMPTS,
  howSteps: [
    ['1. Set up', 'Names, imposters, categories. Geometry, counting, contest moves, the works.'],
    ['2. Pass the phone', 'One person at a time. Category first.'],
    ['3. Reveal', 'Most people get the same term. One person is the imposter.'],
    ['4. Lock it in', 'Hit Got it and pass it on.'],
    ['5. Clue round', 'One related word each. If the word is “slope,” maybe say “rise.”'],
    ['6. Vote', 'Catch the faker. Or watch them steal it with a last guess.'],
  ],
  modesBlurb:
    'Classic is the move for study group. Mystery swaps in a decoy term. Chaos might have zero imposters. Liar mode asks one person a different question.',
  passHint: 'Pass to {name}.',
  revealPrompt: 'Show my term',
  revealHint: 'Category is up. Tap when the screen is yours.',
  gotIt: 'Got it',
  imposterLabel: 'IMPOSTER',
  imposterHint: 'No term for you. Listen, bluff, survive.',
  discussTitle: 'Clue time',
  discussBody: (starter, rounds) =>
    `${starter} starts. One related word each, ${rounds} round${rounds === 1 ? '' : 's'}. Do not say the term itself.`,
  discussTip: 'Good clue: specific enough that math people nod. Bad clue: “number.”',
}

export const SIMPLE_THEME: ImposterTheme = {
  ...PARTY_THEME,
  id: 'simple',
  storageKey: 'imposter-simple-v1',
  titleLines: ['Imposter', 'Simple'],
  tag: 'Quick pass-the-phone game',
  blurb: 'See the category. Tap for the word. Clue up. Reveal who faked it.',
  startLabel: 'Start',
  documentTitle: 'Imposter Simple',
  categories: CATEGORIES.filter((c) => c.id !== 'silly'),
  howSteps: [
    ['1. Set up', 'Add names, imposters, and categories.'],
    ['2. Pass the phone', 'One person at a time. Category first.'],
    ['3. Tap for the word', 'Most people get the same word. One person is the imposter.'],
    ['4. Got it', 'Hide it and pass to the next person.'],
    ['5. Clues', 'Say one related word each. Do not say the secret word.'],
    ['6. Reveal', 'When you are ready, reveal the imposter.'],
  ],
  modesBlurb: 'Classic only. Clue, then reveal. No vote, no timer.',
  discussTitle: 'Clue time',
  discussBody: (starter) =>
    `${starter} goes first. Each person says one word related to the secret.`,
  discussTip: 'Do not say the secret word.',
  simple: true,
  skipTimer: true,
  skipVote: true,
  bigCategoryReveal: true,
  discussActionLabel: 'Reveal the Imposter',
}

const BG = (id: string) => `/imposter-bgs/${id}.jpg`

export const IMAGE_THEME: ImposterTheme = {
  ...SIMPLE_THEME,
  id: 'image',
  storageKey: 'imposter-image-v1',
  titleLines: ['Imposter', 'Scenes'],
  tag: 'Same simple game, with scene backdrops',
  blurb: 'Each category gets its own world. Ocean, holidays, space, and more.',
  startLabel: 'Start',
  documentTitle: 'Imposter Scenes',
  cssClass: 'image',
  categoryBackgrounds: Object.fromEntries(
    SIMPLE_THEME.categories.map((c) => [c.id, BG(c.id)]),
  ),
}

export const STREAM_THEME: ImposterTheme = {
  ...IMAGE_THEME,
  id: 'stream',
  storageKey: 'imposter-stream-v1',
  titleLines: ['Impasta 🍝', 'Party'],
  tag: '',
  blurb: '',
  startLabel: 'Enter',
  installNote: '',
  documentTitle: 'Impasta Party',
  homeIcon: '/imposter-icon.jpg',
  cssClass: 'image stream',
  homeBackground: '/imposter-bgs/party-home.jpg',
  streamlined: true,
  discussTitle: '',
  discussBody: () => '',
  discussTip: '',
  passHint: '',
  revealHint: '',
}

export type GameLink = {
  path: string
  name: string
  blurb: string
  tone: string
  external?: boolean
}

export const games: GameLink[] = [
  {
    path: '/v2',
    name: 'Immersive',
    blurb: 'Full-page chambers for X, Krüe, dad, and coffee.',
    tone: 'neutral',
  },
  {
    path: '/imposter',
    name: 'Imposter Party',
    blurb: 'Pass-the-phone secret word for a room.',
    tone: 'ember',
  },
  {
    path: '/imposter_simple',
    name: 'Imposter Simple',
    blurb: 'Same game, thinner rules.',
    tone: 'ember',
  },
  {
    path: '/imposter_image',
    name: 'Imposter Scenes',
    blurb: 'Imposter, with pictures.',
    tone: 'ember',
  },
  {
    path: '/imposter_party',
    name: 'Imposter Stream',
    blurb: 'Stream-friendly party variant.',
    tone: 'ember',
  },
  {
    path: '/math_imposter',
    name: 'Math Imposter',
    blurb: 'Secret number. Same heat.',
    tone: 'green',
  },
  {
    path: '/rocket_catch_game',
    name: 'Starship Catch',
    blurb: 'Catch the booster.',
    tone: 'blue',
  },
  {
    path: '/3D_Sudoku',
    name: '3D Sudoku',
    blurb: 'The cube, not the grid.',
    tone: 'gold',
  },
  {
    path: '/spacex_tetris',
    name: 'SpaceX Tetris',
    blurb: 'Stacks with plume.',
    tone: 'steel',
  },
  {
    path: '/x_blaster',
    name: 'X Blaster',
    blurb: 'Rails on. Clear the field.',
    tone: 'steel',
  },
  {
    path: '/starbase',
    name: 'Starbase',
    blurb: 'Walk the pad.',
    tone: 'sand',
  },
  {
    path: '/orb',
    name: 'Orb Hop',
    blurb: 'Hop the orb.',
    tone: 'steel',
  },
  {
    path: '/x_the_game_v2',
    name: 'X THE GAME',
    blurb: 'Tilt or tap. Keep the mark.',
    tone: 'steel',
  },
  {
    path: '/grot_bot_merge',
    name: 'Grot Bot Merge',
    blurb: 'Merge grots. Do not overflow.',
    tone: 'violet',
  },
  {
    path: '/hotdog_game',
    name: 'Hot Dog Catcher',
    blurb: 'Static catcher. Same URL.',
    tone: 'ember',
    external: true,
  },
  {
    path: '/knicks',
    name: 'Knicks',
    blurb: 'Fan page stub.',
    tone: 'blue',
  },
]

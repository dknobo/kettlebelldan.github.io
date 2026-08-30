export type GameLink = {
  path: string
  name: string
  thumb: string
}

export const games: GameLink[] = [
  {
    path: '/spacex_tetris',
    name: 'SpaceX Tetris',
    thumb: '/images/games/spacex-tetris.jpg',
  },
  {
    path: '/x_the_game_v2',
    name: 'X The Game',
    thumb: '/images/games/x-the-game.jpg',
  },
  {
    path: '/grot_bot_merge',
    name: 'Grok Bot Merge',
    thumb: '/images/games/grot-bot-merge.jpg',
  },
]

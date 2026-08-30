import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const spaPaths = [
  'v2',
  'imposter',
  'party',
  'math_imposter',
  'imposter_simple',
  'imposter_image',
  'impasta_party',
  'imposter_party',
  'knicks',
  'rocket_catch_game',
  '3D_Sudoku',
  '3d_sudoku',
  'spacex_tetris',
  'x_blaster',
  'starbase',
  'orb',
  'x_the_game',
  'x_the_game_v2',
  'grot_bot_merge',
  'grot-bot-merge',
  'exclusive',
  'digest',
  'games',
  'dashboard',
]

const dist = 'dist'
copyFileSync('CNAME', join(dist, 'CNAME'))

for (const path of spaPaths) {
  const dir = join(dist, path)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join(dist, 'index.html'), join(dir, 'index.html'))
}

console.log(`Prepared ${spaPaths.length} SPA fallback paths and copied CNAME.`)

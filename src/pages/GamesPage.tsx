import { Link } from 'react-router-dom'
import { GameGrid } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

export default function GamesPage() {
  usePageMeta('Games · Kettlebell Dan')

  return (
    <div className="shell page">
      <header className="page-hero">
        <p className="kicker">Games</p>
        <h1>The lab</h1>
        <p className="lede">
          Every game URL still works. This page is the labeled index. Aliases
          (<code>/party</code>, <code>/3d_sudoku</code>, <code>/x_the_game</code>,{' '}
          <code>/grot-bot-merge</code>, <code>/impasta_party</code>) stay live and are not listed twice.
        </p>
      </header>
      <GameGrid />
      <p className="more">
        <Link to="/">Back home</Link>
      </p>
    </div>
  )
}

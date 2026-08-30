import { Link } from 'react-router-dom'
import { GameGrid } from '../site/ui'
import { usePageMeta } from '../site/usePageMeta'

export default function GamesPage() {
  usePageMeta('Games · Kettlebell Dan')

  return (
    <div className="chrome-page">
      <p className="iron-kicker">Games</p>
      <h1>The lab</h1>
      <p className="lede">
        SpaceX Tetris, X The Game, and Grok Bot Merge. Other game URLs still resolve if you have them.
      </p>
      <GameGrid />
      <p className="more">
        <Link to="/">Back home</Link>
      </p>
    </div>
  )
}

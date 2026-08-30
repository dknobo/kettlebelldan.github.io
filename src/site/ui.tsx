import { Link } from 'react-router-dom'
import { games } from './games'

export function GameGrid() {
  return (
    <ul className="iron-games" style={{ marginTop: '1.5rem' }}>
      {games.map((game) => (
        <li key={game.path}>
          <Link className="iron-game" to={game.path}>
            <img src={game.thumb} alt="" />
            <span>{game.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

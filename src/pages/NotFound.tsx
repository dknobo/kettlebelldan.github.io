import { Link } from 'react-router-dom'
import { usePageMeta } from '../site/usePageMeta'

export default function NotFound() {
  usePageMeta('Not found · Kettlebell Dan', { noindex: true })

  return (
    <div className="chrome-page">
      <p className="iron-kicker">404</p>
      <h1>Not found</h1>
      <p className="lede">That page is not here.</p>
      <p className="more">
        <Link to="/">Home</Link>
      </p>
    </div>
  )
}

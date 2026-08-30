import { Link } from 'react-router-dom'
import { usePageMeta } from '../site/usePageMeta'

export default function NotFound({ embedded = false }: { embedded?: boolean }) {
  usePageMeta('Not found · Kettlebell Dan', { noindex: true })

  return (
    <div className={embedded ? 'page-hero' : 'shell page'}>
      <p className="kicker">404</p>
      <h1>Not found</h1>
      <p className="lede">
        That URL is not public. Members exclusives do not render here. There is no login gate.
      </p>
      <p className="more">
        <Link to="/">Home</Link>
      </p>
    </div>
  )
}

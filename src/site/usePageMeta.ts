import { useEffect } from 'react'

export function usePageMeta(title: string, options?: { noindex?: boolean }) {
  useEffect(() => {
    const previous = document.title
    document.title = title

    let robots: HTMLMetaElement | null = null
    if (options?.noindex) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      robots.content = 'noindex, nofollow'
      document.head.appendChild(robots)
    }

    return () => {
      document.title = previous
      robots?.remove()
    }
  }, [title, options?.noindex])
}

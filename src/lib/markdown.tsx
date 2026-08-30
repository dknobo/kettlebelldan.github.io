import type { ReactNode } from 'react'

type InlinePart =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'link'; href: string; value: string }

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; lang: string; text: string }

const INLINE =
  /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > last) {
      parts.push({ type: 'text', value: text.slice(last, index) })
    }
    const token = match[0]
    if (token.startsWith('`')) {
      parts.push({ type: 'code', value: token.slice(1, -1) })
    } else if (token.startsWith('**')) {
      parts.push({ type: 'strong', value: token.slice(2, -2) })
    } else if (token.startsWith('*')) {
      parts.push({ type: 'em', value: token.slice(1, -1) })
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      if (link) parts.push({ type: 'link', value: link[1], href: link[2] })
    }
    last = index + token.length
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }
  return parts
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        if (part.type === 'code') return <code key={i}>{part.value}</code>
        if (part.type === 'strong') return <strong key={i}>{part.value}</strong>
        if (part.type === 'em') return <em key={i}>{part.value}</em>
        if (part.type === 'link') {
          return (
            <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">
              {part.value}
            </a>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </>
  )
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const buf: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i])
        i += 1
      }
      if (i < lines.length) i += 1
      blocks.push({ type: 'code', lang, text: buf.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length === 1 ? 'h1' : heading[1].length === 2 ? 'h2' : 'h3'
      blocks.push({ type: level, text: heading[2].trim() })
      i += 1
      continue
    }

    if (line.startsWith('> ')) {
      const buf = [line.slice(2)]
      i += 1
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2))
        i += 1
      }
      blocks.push({ type: 'quote', text: buf.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    const buf = [line]
    i += 1
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s+|```|[-*]\s+|> )/.test(lines[i])) {
      buf.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }

  return blocks
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source)
  const nodes: ReactNode[] = blocks.map((block, i) => {
    if (block.type === 'h1') return <h1 key={i}><Inline text={block.text} /></h1>
    if (block.type === 'h2') return <h2 key={i}><Inline text={block.text} /></h2>
    if (block.type === 'h3') return <h3 key={i}><Inline text={block.text} /></h3>
    if (block.type === 'quote') return <blockquote key={i}><Inline text={block.text} /></blockquote>
    if (block.type === 'list') {
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}><Inline text={item} /></li>
          ))}
        </ul>
      )
    }
    if (block.type === 'code') {
      return (
        <pre key={i}>
          <code>{block.text}</code>
        </pre>
      )
    }
    return <p key={i}><Inline text={block.text} /></p>
  })

  return <div className="md">{nodes}</div>
}

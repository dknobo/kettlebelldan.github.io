export type YamlScalar = string | boolean
export type YamlValue = YamlScalar | string[]
export type YamlData = Record<string, YamlValue>

export function splitFrontmatter(raw: string): { matter: string; body: string } {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) {
    throw new Error('Missing opening frontmatter fence')
  }
  const close = text.indexOf('\n---\n', 4)
  if (close === -1) {
    throw new Error('Missing closing frontmatter fence')
  }
  return {
    matter: text.slice(4, close),
    body: text.slice(close + 5).replace(/^\n/, ''),
  }
}

function parseScalar(raw: string): YamlScalar {
  const value = raw.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return value
}

export function parseSimpleYaml(source: string): YamlData {
  const data: YamlData = {}
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    i += 1
    if (!line.trim() || line.trim().startsWith('#')) continue

    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!match) {
      throw new Error(`Unsupported YAML line: ${line}`)
    }

    const key = match[1]
    const rest = match[2]
    if (rest.length > 0) {
      data[key] = parseScalar(rest)
      continue
    }

    const items: string[] = []
    while (i < lines.length) {
      const next = lines[i]
      if (!next.trim()) {
        i += 1
        continue
      }
      const item = next.match(/^\s+-\s+(.*)$/)
      if (!item) break
      items.push(String(parseScalar(item[1])))
      i += 1
    }
    data[key] = items
  }

  return data
}

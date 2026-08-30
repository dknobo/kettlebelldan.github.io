import { parseSimpleYaml, splitFrontmatter } from './frontmatter'

export type ContentKind = 'exclusive' | 'digest'

export type ContentEntry = {
  kind: ContentKind
  title: string
  date: string
  slug: string
  excerpt: string
  tags: string[]
  members: boolean
  example: boolean
  body: string
  sourcePath: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const exclusiveModules = import.meta.glob('../../content/exclusive/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const digestModules = import.meta.glob('../../content/digest/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function asString(value: unknown, field: string, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path}: ${field} must be a non-empty string`)
  }
  return value.trim()
}

function asTags(value: unknown, path: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${path}: tags must be a list of strings`)
  }
  return value.map((item) => item.trim()).filter(Boolean)
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function parseContentFile(kind: ContentKind, sourcePath: string, raw: string): ContentEntry {
  const { matter, body } = splitFrontmatter(raw)
  const data = parseSimpleYaml(matter)
  const title = asString(data.title, 'title', sourcePath)
  const date = asString(data.date, 'date', sourcePath)
  const slug = asString(data.slug, 'slug', sourcePath)
  const excerpt = asString(data.excerpt, 'excerpt', sourcePath)

  if (!DATE.test(date)) {
    throw new Error(`${sourcePath}: date must be YYYY-MM-DD`)
  }
  if (!SLUG.test(slug)) {
    throw new Error(`${sourcePath}: slug must be lowercase kebab-case`)
  }

  return {
    kind,
    title,
    date,
    slug,
    excerpt,
    tags: asTags(data.tags, sourcePath),
    members: asBool(data.members, false),
    example: asBool(data.example, false),
    body: body.trim(),
    sourcePath,
  }
}

function loadKind(kind: ContentKind, modules: Record<string, string>): ContentEntry[] {
  const entries = Object.entries(modules).map(([sourcePath, raw]) =>
    parseContentFile(kind, sourcePath, raw),
  )
  const slugs = new Set<string>()
  for (const entry of entries) {
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate ${kind} slug: ${entry.slug}`)
    }
    slugs.add(entry.slug)
  }
  return entries.sort(byDateDesc)
}

function byDateDesc(a: ContentEntry, b: ContentEntry): number {
  if (a.date === b.date) return a.title.localeCompare(b.title)
  return a.date < b.date ? 1 : -1
}

const exclusiveAll = loadKind('exclusive', exclusiveModules)
const digestAll = loadKind('digest', digestModules)

export function formatEntryDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isPublic(entry: ContentEntry): boolean {
  return !entry.members
}

export function isPublished(entry: ContentEntry): boolean {
  return !entry.members && !entry.example
}

export function listPublished(kind: ContentKind): ContentEntry[] {
  const all = kind === 'exclusive' ? exclusiveAll : digestAll
  return all.filter(isPublished)
}

export function listExamples(kind: ContentKind): ContentEntry[] {
  const all = kind === 'exclusive' ? exclusiveAll : digestAll
  return all.filter((entry) => entry.example && isPublic(entry))
}

export function getPublicEntry(kind: ContentKind, slug: string): ContentEntry | null {
  const all = kind === 'exclusive' ? exclusiveAll : digestAll
  const entry = all.find((item) => item.slug === slug)
  if (!entry || !isPublic(entry)) return null
  return entry
}

export function latestPublished(kind: ContentKind): ContentEntry | null {
  return listPublished(kind)[0] ?? null
}

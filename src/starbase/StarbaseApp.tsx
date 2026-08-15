import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHAPTERS, CODEX, type Chapter, type CodexCard } from './content'
import { MissionPlay, type MissionResult } from './missions'
import './starbase.css'

const LS = 'starbase-pad-chief-v1'

type Save = {
  chapter: number
  cash: number
  value: number
  boosters: number
  users: number
  trust: number
  stars: number
  unlocked: string[]
  seenTitle: boolean
}

type Screen = 'title' | 'hq' | 'brief' | 'play' | 'decision' | 'codex'

const empty = (): Save => ({
  chapter: 0,
  cash: 4,
  value: 10,
  boosters: 0,
  users: 0,
  trust: 1,
  stars: 0,
  unlocked: [],
  seenTitle: false,
})

function load(): Save {
  try {
    const raw = localStorage.getItem(LS)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export default function StarbaseApp() {
  const [save, setSave] = useState<Save>(() => load())
  const [screen, setScreen] = useState<Screen>(() => (load().seenTitle ? 'hq' : 'title'))
  const [deep, setDeep] = useState(false)
  const [pick, setPick] = useState<CodexCard | null>(null)
  const [lastNote, setLastNote] = useState('')
  const [cat, setCat] = useState<CodexCard['cat'] | 'All'>('All')

  useEffect(() => {
    document.title = 'Starbase · kettlebelldan.com'
  }, [])

  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify(save))
  }, [save])

  const ch = CHAPTERS[Math.min(save.chapter, CHAPTERS.length - 1)]
  const doneAll = save.chapter >= CHAPTERS.length
  const unlockedCards = useMemo(
    () => CODEX.filter((c) => save.unlocked.includes(c.id)),
    [save.unlocked],
  )

  const write = (p: Partial<Save>) => setSave((s) => ({ ...s, ...p }))

  const begin = () => {
    write({ seenTitle: true })
    setDeep(false)
    setScreen(doneAll ? 'hq' : 'brief')
  }

  const finishMission = (r: MissionResult, chapter: Chapter) => {
    setSave((s) => ({
      ...s,
      cash: s.cash + chapter.reward.cash + r.stars * 3,
      value: s.value + chapter.reward.value + r.stars * 8,
      boosters: s.boosters + (chapter.reward.boosters ?? 0),
      stars: s.stars + r.stars,
      unlocked: Array.from(new Set([...s.unlocked, ...chapter.unlock])),
      chapter: chapter.decision ? s.chapter : s.chapter + 1,
    }))
    setLastNote(r.note)
    setDeep(false)
    setScreen(chapter.decision ? 'decision' : 'hq')
  }

  const choose = (which: 'a' | 'b') => {
    const d = ch.decision
    if (!d) {
      setSave((s) => ({ ...s, chapter: s.chapter + 1 }))
      setScreen('hq')
      return
    }
    const c = d[which]
    setSave((s) => ({
      ...s,
      chapter: s.chapter + 1,
      cash: s.cash + c.cash,
      trust: s.trust + c.trust,
      users: s.users + c.users,
      value: s.value + Math.max(4, c.cash + c.trust * 4 + c.users * 3),
      unlocked: c.unlock && !s.unlocked.includes(c.unlock) ? [...s.unlocked, c.unlock] : s.unlocked,
    }))
    setLastNote(c.result)
    setScreen('hq')
  }

  const reset = () => {
    const s = empty()
    setSave(s)
    setScreen('title')
    setPick(null)
  }

  const campus = CHAPTERS.map((c, i) => ({
    name: c.building,
    on: i < save.chapter || (i === save.chapter && screen !== 'title'),
    now: i === save.chapter && !doneAll,
  }))

  return (
    <div className={`sb ${screen === 'play' ? 'play' : ''}`}>
      <div className="sb-top">
        <div className="row">
          <Link className="sb-btn" to="/">
            Home
          </Link>
          {screen !== 'title' && (
            <button className="sb-btn" onClick={() => setScreen('hq')}>
              HQ
            </button>
          )}
        </div>
        <div className="row">
          {screen !== 'title' && (
            <button className="sb-btn" onClick={() => setScreen('codex')}>
              Codex {unlockedCards.length}/{CODEX.length}
            </button>
          )}
        </div>
      </div>

      {screen === 'title' && (
        <div className="sb-hero">
          <img className="sb-bg" src="/starbase/hq.jpg" alt="" />
          <div className="sb-hero-card">
            <img className="sb-mascot" src="/starbase/booster.jpg" alt="Booster" />
            <div className="sb-kicker">Pad Chief</div>
            <h1>Starbase</h1>
            <p>
              Run SpaceX from a borrowed island to a steel tower. The games are for kids. The books are the real
              company.
            </p>
            <button className="sb-btn primary" onClick={begin}>
              Take the pad
            </button>
          </div>
        </div>
      )}

      {screen === 'hq' && (
        <div className="sb-hq">
          <img className="sb-bg" src={save.chapter < 2 ? '/starbase/island.jpg' : '/starbase/hq.jpg'} alt="" />
          <div className="sb-panel">
            <div className="sb-kicker">{doneAll ? 'Company complete' : `Era ${save.chapter + 1} / ${CHAPTERS.length}`}</div>
            <h2>{doneAll ? 'You ran the whole stack' : ch.title}</h2>
            <p className="sb-help">
              {lastNote || (doneAll ? 'Replay chapters from the Codex. The industry does not freeze.' : ch.kid)}
            </p>
            <div className="sb-stats">
              <Stat k="Cash" v={`$${save.cash}M`} />
              <Stat k="Value" v={`${save.value}`} />
              <Stat k="Boosters" v={`${save.boosters}`} />
              <Stat k="Starlink" v={`${save.users}k`} />
              <Stat k="NASA trust" v={`${save.trust}`} />
              <Stat k="Stars" v={`${save.stars}`} />
            </div>
            <div className="sb-campus">
              {campus.map((b) => (
                <div key={b.name} className={`sb-bldg ${b.on ? 'on' : ''} ${b.now ? 'now' : ''}`}>
                  {b.name}
                </div>
              ))}
            </div>
            <div className="sb-actions">
              {!doneAll && (
                <button className="sb-btn primary" onClick={() => setScreen('brief')}>
                  Fly {ch.title}
                </button>
              )}
              {doneAll && (
                <button
                  className="sb-btn primary"
                  onClick={() => {
                    write({ chapter: CHAPTERS.length - 1 })
                    setScreen('brief')
                  }}
                >
                  Replay the industry desk
                </button>
              )}
              <button className="sb-btn" onClick={reset}>
                New company
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'brief' && (
        <div className="sb-sheet">
          <div className="sb-kicker">
            {ch.year} · {ch.building}
          </div>
          <h2>{ch.title}</h2>
          <p>{deep ? ch.deep : ch.kid}</p>
          <p className="sb-help">{ch.missionHint}</p>
          <button className="sb-text" onClick={() => setDeep((d) => !d)}>
            {deep ? 'Kid version' : 'Grown-up version'}
          </button>
          <div className="sb-actions">
            <button className="sb-btn" onClick={() => setScreen('hq')}>
              Back
            </button>
            <button className="sb-btn primary" onClick={() => setScreen('play')}>
              Start mission
            </button>
          </div>
        </div>
      )}

      {screen === 'play' && (
        <MissionPlay
          id={ch.mission}
          onDone={(r) => finishMission(r, ch)}
        />
      )}

      {screen === 'decision' && ch.decision && (
        <div className="sb-sheet">
          <div className="sb-kicker">Board meeting</div>
          <h2>{ch.decision.prompt}</h2>
          <p>{deep ? ch.decision.deep : ch.decision.kid}</p>
          <button className="sb-text" onClick={() => setDeep((d) => !d)}>
            {deep ? 'Kid version' : 'Why this was real'}
          </button>
          <div className="sb-deals">
            <button className="sb-deal" onClick={() => choose('a')}>
              <strong>{ch.decision.a.label}</strong>
              <span>{ch.decision.a.kid}</span>
            </button>
            <button className="sb-deal" onClick={() => choose('b')}>
              <strong>{ch.decision.b.label}</strong>
              <span>{ch.decision.b.kid}</span>
            </button>
          </div>
          {lastNote && <p className="sb-help">{lastNote}</p>}
        </div>
      )}

      {screen === 'codex' && (
        <div className="sb-codex">
          <div className="sb-kicker">Company books</div>
          <h2>Codex</h2>
          <p className="sb-help">Unlocked by flying. Kid first, then the real industry.</p>
          <div className="sb-cats">
            {(['All', 'History', 'Vehicles', 'Money', 'Customers', 'Rivals', 'Rules'] as const).map((c) => (
              <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="sb-cards">
            {CODEX.filter((c) => cat === 'All' || c.cat === cat).map((c) => {
              const on = save.unlocked.includes(c.id)
              return (
                <button key={c.id} className={`sb-card ${on ? 'on' : 'off'}`} onClick={() => on && setPick(c)} disabled={!on}>
                  <em>{c.cat}</em>
                  <strong>{on ? c.title : 'Classified'}</strong>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {pick && (
        <div className="sb-pop" onClick={() => setPick(null)}>
          <article onClick={(e) => e.stopPropagation()}>
            <div className="sb-kicker">{pick.cat}</div>
            <h3>{pick.title}</h3>
            <p>{pick.kid}</p>
            <hr />
            <p className="deep">{pick.deep}</p>
            <button className="sb-btn primary" onClick={() => setPick(null)}>
              Close
            </button>
          </article>
        </div>
      )}
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="sb-stat">
      <span>{k}</span>
      <strong>{v}</strong>
    </div>
  )
}

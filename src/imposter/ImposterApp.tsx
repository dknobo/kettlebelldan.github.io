import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Eye,
  Ghost,
  HelpCircle,
  Home,
  Settings2,
  Shuffle,
  Trophy,
  Users,
} from 'lucide-react'
import './imposter.css'
import type { GameMode, Player, Round, RoundResult, Screen, Settings } from './types'
import type { ImposterTheme } from './theme'
import { PARTY_THEME } from './theme'
import {
  beep,
  checkIdentified,
  clampImposters,
  createRound,
  haptic,
  keepAwake,
  playerById,
  recommendedImposters,
  scoreRound,
  tallyVotes,
  uid,
} from './gameLogic'
import { loadSaved, saveState } from './storage'

const fade = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
}

export default function ImposterApp({ theme = PARTY_THEME }: { theme?: ImposterTheme }) {
  const saved = useMemo(() => loadSaved(theme), [theme])
  const [screen, setScreen] = useState<Screen>('home')
  const [players, setPlayers] = useState<Player[]>(saved.players)
  const [settings, setSettings] = useState<Settings>(saved.settings)
  const [usedWords, setUsedWords] = useState<string[]>(saved.usedWords)
  const [usedPrompts, setUsedPrompts] = useState<string[]>(saved.usedPrompts)
  const [round, setRound] = useState<Round | null>(null)
  const [revealIndex, setRevealIndex] = useState(0)
  const [cardOpen, setCardOpen] = useState(false)
  const [accusedIds, setAccusedIds] = useState<string[]>([])
  const [secretVotes, setSecretVotes] = useState<Record<string, string>>({})
  const [voteIndex, setVoteIndex] = useState(0)
  const [voteOpen, setVoteOpen] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [guessUsed, setGuessUsed] = useState(false)
  const [roundNumber, setRoundNumber] = useState(1)
  const [history, setHistory] = useState<RoundResult[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerOn, setTimerOn] = useState(false)
  const wakeRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    saveState({ players, settings, usedWords, usedPrompts }, theme)
  }, [players, settings, usedWords, usedPrompts, theme])

  useEffect(() => {
    if (!theme.simple && !theme.skipTimer && !theme.skipVote) return
    setSettings((s) => ({
      ...s,
      mode: theme.simple ? 'classic' : s.mode,
      timerSeconds: theme.skipTimer ? 0 : s.timerSeconds,
      lastChanceGuess: theme.skipVote ? false : s.lastChanceGuess,
      voteStyle: theme.skipVote ? 'quick' : s.voteStyle,
    }))
  }, [theme])

  useEffect(() => {
    const previous = document.title
    document.title = theme.documentTitle
    return () => {
      document.title = previous
    }
  }, [theme.documentTitle])

  useEffect(() => {
    void keepAwake().then((lock) => {
      wakeRef.current = lock
    })
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void keepAwake().then((lock) => {
          wakeRef.current = lock
        })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      void wakeRef.current?.release()
    }
  }, [])

  useEffect(() => {
    if (!timerOn) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setTimerOn(false)
          beep('end')
          haptic(40)
          return 0
        }
        if (s <= 11) beep('tick')
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerOn])

  const currentPlayer = players[revealIndex]
  const currentCard = round?.cards[revealIndex]
  const wordTotal = useMemo(
    () => theme.categories.reduce((sum, c) => sum + c.words.length, 0),
    [theme],
  )

  function startRound() {
    const next = createRound(
      players,
      {
        ...settings,
        mode: theme.simple ? 'classic' : settings.mode,
        timerSeconds: theme.skipTimer ? 0 : settings.timerSeconds,
      },
      usedWords,
      usedPrompts,
      theme,
    )
    setRound(next)
    setRevealIndex(0)
    setCardOpen(false)
    setAccusedIds([])
    setSecretVotes({})
    setVoteIndex(0)
    setVoteOpen(false)
    setGuessUsed(false)
    setResult(null)
    setSecondsLeft(theme.skipTimer ? 0 : settings.timerSeconds)
    setTimerOn(false)
    if (next.mode === 'liar') setUsedPrompts((u) => [...u, next.wordKey].slice(-80))
    else setUsedWords((u) => [...u, next.wordKey].slice(-120))
    haptic(12)
    setScreen('pass')
  }

  function afterGotIt() {
    haptic(10)
    setCardOpen(false)
    if (revealIndex + 1 < players.length) {
      setRevealIndex((i) => i + 1)
      setScreen('pass')
    } else {
      setScreen('discuss')
      if (!theme.skipTimer && settings.timerSeconds > 0) {
        setSecondsLeft(settings.timerSeconds)
        setTimerOn(true)
      }
    }
  }

  function revealImposters() {
    if (!round) return
    const nextResult: RoundResult = {
      roundNumber,
      secretWord: round.mode === 'liar' ? 'Different question' : round.secretWord,
      categoryName: round.categoryName,
      imposterIds: round.cards.filter((c) => c.isImposter).map((c) => c.playerId),
      accusedIds: [],
      crewWon: false,
      guessUsed: false,
      guessCorrect: false,
      scoresDelta: Object.fromEntries(players.map((p) => [p.id, 0])),
    }
    setResult(nextResult)
    setHistory((h) => [...h, nextResult])
    setRoundNumber((n) => n + 1)
    setTimerOn(false)
    setScreen('results')
  }

  function finalizeVotes(finalAccused: string[]) {
    if (!round) return
    const identifiedAll = checkIdentified(round, finalAccused)
    if (identifiedAll && settings.lastChanceGuess && round.actualImposterCount > 0 && round.mode !== 'liar') {
      setAccusedIds(finalAccused)
      setGuessUsed(true)
      setScreen('guess')
      return
    }
    finishRound(finalAccused, false, false)
  }

  function finishRound(finalAccused: string[], guessed: boolean, usedGuess = guessUsed) {
    if (!round) return
    const scored = scoreRound({
      players,
      round,
      accusedIds: finalAccused,
      guessCorrect: guessed,
    })
    const nextResult: RoundResult = {
      roundNumber,
      secretWord: round.mode === 'liar' ? 'Different question' : round.secretWord,
      categoryName: round.categoryName,
      imposterIds: round.cards.filter((c) => c.isImposter).map((c) => c.playerId),
      accusedIds: finalAccused,
      crewWon: scored.crewWon,
      guessUsed: usedGuess,
      guessCorrect: guessed,
      scoresDelta: scored.deltas,
    }
    setPlayers(scored.players)
    setResult(nextResult)
    setHistory((h) => [...h, nextResult])
    setRoundNumber((n) => n + 1)
    setTimerOn(false)
    setScreen('results')
  }

  function resetScores() {
    setPlayers((ps) => ps.map((p) => ({ ...p, score: 0 })))
    setHistory([])
    setRoundNumber(1)
  }

  const leader = [...players].sort((a, b) => b.score - a.score)[0]
  const matchOver = settings.winScore > 0 && leader && leader.score >= settings.winScore
  const playScreens = new Set(['pass', 'reveal', 'discuss', 'results', 'vote', 'guess'])
  const bgUrl =
    screen === 'home' && theme.homeBackground
      ? theme.homeBackground
      : theme.categoryBackgrounds && round && playScreens.has(screen)
        ? theme.categoryBackgrounds[round.categoryId]
        : undefined

  return (
    <div
      className={`imposter-app ${theme.cssClass}`.trim()}
      style={
        bgUrl
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(8,12,24,0.35), rgba(8,12,24,0.62)), url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="ip-shell">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <ScreenWrap key="home">
              <HomeScreen
                theme={theme}
                playerCount={players.length}
                wordTotal={wordTotal}
                onPlay={() => setScreen('setup')}
                onHow={() => setScreen('howto')}
                onPacks={() => setScreen('packs')}
                onScores={() => setScreen('scores')}
              />
            </ScreenWrap>
          )}

          {screen === 'howto' && (
            <ScreenWrap key="howto">
              <HowToPlay theme={theme} onBack={() => setScreen('home')} />
            </ScreenWrap>
          )}

          {screen === 'packs' && (
            <ScreenWrap key="packs">
              <PacksScreen theme={theme} onBack={() => setScreen('home')} />
            </ScreenWrap>
          )}

          {screen === 'scores' && (
            <ScreenWrap key="scores">
              <ScoresScreen
                players={players}
                history={history}
                onBack={() => setScreen('home')}
                onReset={resetScores}
              />
            </ScreenWrap>
          )}

          {screen === 'setup' && (
            <ScreenWrap key="setup">
              <SetupScreen
                theme={theme}
                players={players}
                settings={settings}
                onBack={() => setScreen('home')}
                onChangePlayers={setPlayers}
                onChangeSettings={setSettings}
                onStart={startRound}
              />
            </ScreenWrap>
          )}

          {screen === 'pass' && currentPlayer && currentCard && theme.streamlined && (
            <ScreenWrap key={`card-${currentPlayer.id}`}>
              <StreamCardScreen
                theme={theme}
                name={currentPlayer.name}
                card={currentCard}
                onGotIt={afterGotIt}
              />
            </ScreenWrap>
          )}

          {screen === 'pass' && currentPlayer && !theme.streamlined && (
            <ScreenWrap key={`pass-${currentPlayer.id}`}>
              <PassScreen
                theme={theme}
                name={currentPlayer.name}
                index={revealIndex}
                total={players.length}
                onReady={() => {
                  haptic(8)
                  setCardOpen(false)
                  setScreen('reveal')
                }}
              />
            </ScreenWrap>
          )}

          {screen === 'reveal' && currentPlayer && currentCard && !theme.streamlined && (
            <ScreenWrap key={`reveal-${currentPlayer.id}-${cardOpen ? 'open' : 'shut'}`}>
              <RevealScreen
                theme={theme}
                playerName={currentPlayer.name}
                card={currentCard}
                mode={round?.mode || 'classic'}
                open={cardOpen}
                onOpen={() => {
                  setCardOpen(true)
                  haptic(18)
                  beep('tap')
                }}
                onGotIt={afterGotIt}
              />
            </ScreenWrap>
          )}

          {screen === 'discuss' && round && (
            <ScreenWrap key="discuss">
              <DiscussScreen
                theme={theme}
                round={round}
                players={players}
                settings={settings}
                secondsLeft={secondsLeft}
                timerOn={timerOn}
                onToggleTimer={() => {
                  if (settings.timerSeconds === 0) return
                  if (secondsLeft === 0) setSecondsLeft(settings.timerSeconds)
                  setTimerOn((v) => !v)
                }}
                onVote={() => {
                  setTimerOn(false)
                  if (theme.skipVote) {
                    revealImposters()
                    return
                  }
                  if (settings.voteStyle === 'secret') {
                    setVoteIndex(0)
                    setVoteOpen(false)
                    setSecretVotes({})
                  }
                  setAccusedIds([])
                  setScreen('vote')
                }}
              />
            </ScreenWrap>
          )}

          {screen === 'vote' && round && (
            <ScreenWrap key="vote">
              <VoteScreen
                players={players}
                round={round}
                settings={settings}
                accusedIds={accusedIds}
                setAccusedIds={setAccusedIds}
                voteIndex={voteIndex}
                voteOpen={voteOpen}
                setVoteOpen={setVoteOpen}
                onSecretPick={(targetId) => {
                  const voter = players[voteIndex]
                  const next = { ...secretVotes, [voter.id]: targetId }
                  setSecretVotes(next)
                  setVoteOpen(false)
                  if (voteIndex + 1 < players.length) setVoteIndex((i) => i + 1)
                  else finalizeVotes(tallyVotes(next, round))
                }}
                onQuickLock={() => finalizeVotes(accusedIds)}
                onBack={() => setScreen('discuss')}
              />
            </ScreenWrap>
          )}

          {screen === 'guess' && round && (
            <ScreenWrap key="guess">
              <GuessScreen
                round={round}
                players={players}
                onYes={() => finishRound(accusedIds, true, true)}
                onNo={() => finishRound(accusedIds, false, true)}
              />
            </ScreenWrap>
          )}

          {screen === 'results' && result && round && (
            <ScreenWrap key="results">
              <ResultsScreen
                theme={theme}
                result={result}
                round={round}
                players={players}
                matchOver={!!matchOver}
                winScore={settings.winScore}
                onAgain={startRound}
                onSetup={() => setScreen('setup')}
                onHome={() => setScreen('home')}
                onScores={() => setScreen('scores')}
              />
            </ScreenWrap>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ScreenWrap({ children }: { children: ReactNode }) {
  return (
    <motion.div {...fade} transition={{ duration: 0.22 }} className="flex flex-1 flex-col">
      {children}
    </motion.div>
  )
}

function HomeScreen({
  theme,
  playerCount,
  wordTotal,
  onPlay,
  onHow,
  onPacks,
  onScores,
}: {
  theme: ImposterTheme
  playerCount: number
  wordTotal: number
  onPlay: () => void
  onHow: () => void
  onPacks: () => void
  onScores: () => void
}) {
  return (
    <div className="flex flex-1 flex-col">
      {!theme.streamlined && (
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="ip-pill">
            <Home size={14} /> Dan.com
          </Link>
          <button className="ip-pill" onClick={onHow}>
            <HelpCircle size={14} /> Rules
          </button>
        </div>
      )}

      <div className={`text-center ${theme.streamlined ? 'mt-auto' : 'mt-4'}`}>
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl text-5xl">
          {theme.homeIcon ? (
            <img src={theme.homeIcon} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>∑</span>
          )}
        </div>
        {theme.tag ? <div className="ip-pill mx-auto mb-3">{theme.tag}</div> : null}
        <h1 className="ip-title text-[52px]">{theme.titleLines[0]}<br />{theme.titleLines[1]}</h1>
        {theme.blurb ? (
          <p className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[var(--ip-muted)]">
            {theme.blurb}
          </p>
        ) : null}
      </div>

      {!theme.streamlined && (
        <div className={`mt-8 grid gap-2 ${theme.simple ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <Stat label="Players" value={`${Math.max(3, playerCount)}+`} />
          <Stat label="Words" value={`${wordTotal}+`} />
          {!theme.simple && <Stat label="Modes" value="4" />}
        </div>
      )}

      <div className="ip-sticky space-y-2">
        <button className="ip-btn ip-btn-primary" onClick={onPlay}>{theme.startLabel}</button>
        {!theme.streamlined && (
          <div className="grid grid-cols-3 gap-2">
            <button className="ip-btn ip-btn-secondary" onClick={onHow}>How to play</button>
            <button className="ip-btn ip-btn-secondary" onClick={onPacks}>Categories</button>
            <button className="ip-btn ip-btn-secondary" onClick={onScores}>Scores</button>
          </div>
        )}
        {theme.installNote ? <p className="ip-install text-center">{theme.installNote}</p> : null}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ip-card py-3 text-center">
      <div className="text-xl font-black">{value}</div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--ip-muted)]">{label}</div>
    </div>
  )
}

function HowToPlay({ theme, onBack }: { theme: ImposterTheme; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="How to play" onBack={onBack} />
      <div className="space-y-3">
        {theme.howSteps.map(([t, d]) => (
          <div key={t} className="ip-card">
            <div className="font-black">{t}</div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ip-muted)]">{d}</p>
          </div>
        ))}
        <div className="ip-card">
          <div className="font-black">Modes</div>
          <p className="mt-1 text-sm text-[var(--ip-muted)]">{theme.modesBlurb}</p>
        </div>
      </div>
    </div>
  )
}

function PacksScreen({ theme, onBack }: { theme: ImposterTheme; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Categories" onBack={onBack} />
      <p className="mb-3 text-sm text-[var(--ip-muted)]">Pick these in setup. Mix subjects for a better round.</p>
      <div className="space-y-2">
        {theme.categories.map((c) => (
          <div key={c.id} className="ip-card flex items-center justify-between gap-3">
            <div>
              <div className="font-black">{c.emoji} {c.name}</div>
              <div className="text-xs text-[var(--ip-muted)]">{c.blurb}</div>
            </div>
            <div className="text-sm font-black text-[var(--ip-gold)]">{c.words.length}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoresScreen({
  players,
  history,
  onBack,
  onReset,
}: {
  players: Player[]
  history: RoundResult[]
  onBack: () => void
  onReset: () => void
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Scoreboard" onBack={onBack} />
      <div className="space-y-2">
        {ranked.map((p, i) => (
          <div key={p.id} className="ip-card flex items-center justify-between">
            <div className="font-black">{i === 0 ? '🏆 ' : `${i + 1}. `}{p.name}</div>
            <div className="text-xl font-black">{p.score}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--ip-muted)]">{history.length} round{history.length === 1 ? '' : 's'} played this visit.</p>
      <button className="ip-btn ip-btn-secondary mt-4" onClick={onReset}>Reset scores</button>
    </div>
  )
}

function SetupScreen({
  theme,
  players,
  settings,
  onBack,
  onChangePlayers,
  onChangeSettings,
  onStart,
}: {
  players: Player[]
  settings: Settings
  onBack: () => void
  onChangePlayers: (p: Player[]) => void
  onChangeSettings: (s: Settings) => void
  onStart: () => void
  theme: ImposterTheme
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customDraft, setCustomDraft] = useState('')
  const modes: { id: GameMode; name: string; info: string }[] = [
    { id: 'classic', name: 'Classic', info: 'Imposters do not see the word' },
    { id: 'mystery', name: 'Mystery', info: 'Imposters get a different word' },
    { id: 'chaos', name: 'Chaos', info: 'Maybe 0 up to your max imposters' },
    { id: 'liar', name: 'Find the Liar', info: 'One person gets another question' },
  ]

  function setCount(n: number) {
    const count = Math.min(16, Math.max(3, n))
    const next = [...players]
    while (next.length < count) {
      next.push({ id: uid('p'), name: `Player ${next.length + 1}`, score: 0 })
    }
    onChangePlayers(next.slice(0, count).map((p, i) => ({ ...p, name: p.name || `Player ${i + 1}` })))
    onChangeSettings({
      ...settings,
      imposterCount: clampImposters(count, settings.imposterCount || recommendedImposters(count)),
    })
  }

  const canStart =
    players.length >= 3 &&
    (settings.mode === 'liar' ||
      settings.categoryIds.some((id) => id !== 'custom') ||
      (settings.categoryIds.includes('custom') && settings.customWords.length >= 3))

  return (
    <div className="flex flex-1 flex-col">
      {!theme.streamlined && <TopBar title="New game" onBack={onBack} />}
      {theme.streamlined && (
        <button className="ip-btn ip-btn-primary mb-4" disabled={!canStart} onClick={onStart}>
          Start
        </button>
      )}

      <div className="ip-card mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-black"><Users size={16} className="mr-1 inline" />Players</div>
          <div className="ip-stepper">
            <button type="button" onClick={() => setCount(players.length - 1)}>-</button>
            <div className="w-8 text-center text-xl font-black">{players.length}</div>
            <button type="button" onClick={() => setCount(players.length + 1)}>+</button>
          </div>
        </div>
        <div className="space-y-2">
          {players.map((p, i) => (
            <input
              key={p.id}
              value={p.name}
              maxLength={18}
              onChange={(e) => {
                const next = [...players]
                next[i] = { ...p, name: e.target.value }
                onChangePlayers(next)
              }}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none focus:border-[var(--ip-gold)]"
              placeholder={`Player ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="ip-card mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-black"><Ghost size={16} className="mr-1 inline" />Imposters</div>
          <div className="ip-stepper">
            <button
              type="button"
              disabled={settings.mode === 'liar'}
              onClick={() => onChangeSettings({ ...settings, imposterCount: clampImposters(players.length, settings.imposterCount - 1) })}
            >-</button>
            <div className="w-8 text-center text-xl font-black">
              {settings.mode === 'liar' ? 1 : clampImposters(players.length, settings.imposterCount)}
            </div>
            <button
              type="button"
              disabled={settings.mode === 'liar'}
              onClick={() => onChangeSettings({ ...settings, imposterCount: clampImposters(players.length, settings.imposterCount + 1) })}
            >+</button>
          </div>
        </div>
        <p className="text-xs text-[var(--ip-muted)]">
          {settings.mode === 'liar'
            ? 'Find the Liar always has exactly one different question.'
            : settings.mode === 'chaos'
              ? 'Chaos uses 0 up to this number.'
              : `Suggested for this group: ${recommendedImposters(players.length)}.`}
        </p>
      </div>

      {!theme.simple && (
      <div className="mb-3">
        <div className="mb-2 font-black">Game mode</div>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              className={`ip-cat ${settings.mode === m.id ? 'on' : ''}`}
              onClick={() => onChangeSettings({
                ...settings,
                mode: m.id,
                imposterCount: m.id === 'liar' ? 1 : settings.imposterCount,
              })}
            >
              <div className="font-black">{m.name}</div>
              <div className="mt-1 text-[11px] leading-snug text-[var(--ip-muted)]">{m.info}</div>
            </button>
          ))}
        </div>
      </div>
      )}

      {settings.mode !== 'liar' && (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-black">Categories</div>
            <button
              className="text-xs font-extrabold uppercase tracking-wide text-[var(--ip-gold)]"
              onClick={() => onChangeSettings({
                ...settings,
                categoryIds: settings.categoryIds.length === theme.categories.length ? [] : theme.categories.map((c) => c.id),
              })}
            >
              {settings.categoryIds.length === theme.categories.length ? 'Clear' : 'All'}
            </button>
          </div>
          <div className="ip-grid-cats">
            {theme.categories.map((c) => {
              const on = settings.categoryIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  className={`ip-cat ${on ? 'on' : ''}`}
                  onClick={() => onChangeSettings({
                    ...settings,
                    categoryIds: on
                      ? settings.categoryIds.filter((id) => id !== c.id)
                      : [...settings.categoryIds, c.id],
                  })}
                >
                  <div className="text-lg">{c.emoji}</div>
                  <div className="text-sm font-black">{c.name}</div>
                </button>
              )
            })}
            <button
              className={`ip-cat ${settings.categoryIds.includes('custom') ? 'on' : ''}`}
              onClick={() => onChangeSettings({
                ...settings,
                categoryIds: settings.categoryIds.includes('custom')
                  ? settings.categoryIds.filter((id) => id !== 'custom')
                  : [...settings.categoryIds, 'custom'],
              })}
            >
              <div className="text-lg">✏️</div>
              <div className="text-sm font-black">Custom</div>
            </button>
          </div>
          {settings.categoryIds.includes('custom') && (
            <div className="ip-card mt-2">
              <div className="text-sm font-black">Custom words</div>
              <p className="mb-2 text-xs text-[var(--ip-muted)]">Add at least 3 easy words for your group.</p>
              <div className="flex gap-2">
                <input
                  value={customDraft}
                  maxLength={24}
                  placeholder="Type a word"
                  className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none"
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const word = customDraft.trim()
                      if (!word) return
                      if (!settings.customWords.some((w) => w.toLowerCase() === word.toLowerCase())) {
                        onChangeSettings({ ...settings, customWords: [...settings.customWords, word] })
                      }
                      setCustomDraft('')
                    }
                  }}
                />
                <button
                  className="ip-btn ip-btn-secondary w-auto px-3"
                  onClick={() => {
                    const word = customDraft.trim()
                    if (!word) return
                    if (!settings.customWords.some((w) => w.toLowerCase() === word.toLowerCase())) {
                      onChangeSettings({ ...settings, customWords: [...settings.customWords, word] })
                    }
                    setCustomDraft('')
                  }}
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {settings.customWords.map((word) => (
                  <button
                    key={word}
                    className="ip-pill"
                    onClick={() => onChangeSettings({
                      ...settings,
                      customWords: settings.customWords.filter((w) => w !== word),
                    })}
                  >
                    {word} ×
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!theme.simple && (
      <button className="mb-3 text-left text-sm font-black text-[var(--ip-gold)]" onClick={() => setShowAdvanced((v) => !v)}>
        <Settings2 size={14} className="mr-1 inline" />
        {showAdvanced ? 'Hide options' : 'More options'}
      </button>
      )}

      {!theme.simple && showAdvanced && (
        <div className="ip-card mb-3 space-y-3">
          <OptionRow label="Timer">
            <select
              className="rounded-lg bg-black/30 px-2 py-1"
              value={settings.timerSeconds}
              onChange={(e) => onChangeSettings({ ...settings, timerSeconds: Number(e.target.value) })}
            >
              <option value={0}>Off</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
              <option value={420}>7 min</option>
            </select>
          </OptionRow>
          <OptionRow label="Imposter hint">
            <select
              className="rounded-lg bg-black/30 px-2 py-1"
              value={settings.hintLevel}
              onChange={(e) => onChangeSettings({ ...settings, hintLevel: e.target.value as Settings['hintLevel'] })}
            >
              <option value="none">None</option>
              <option value="category">Category</option>
              <option value="clue">Sneaky clue</option>
            </select>
          </OptionRow>
          <OptionRow label="Clue rounds">
            <select
              className="rounded-lg bg-black/30 px-2 py-1"
              value={settings.clueRounds}
              onChange={(e) => onChangeSettings({ ...settings, clueRounds: Number(e.target.value) })}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </OptionRow>
          <OptionRow label="Voting">
            <select
              className="rounded-lg bg-black/30 px-2 py-1"
              value={settings.voteStyle}
              onChange={(e) => onChangeSettings({ ...settings, voteStyle: e.target.value as Settings['voteStyle'] })}
            >
              <option value="quick">Quick vote</option>
              <option value="secret">Secret pass-vote</option>
            </select>
          </OptionRow>
          <OptionRow label="First to score">
            <select
              className="rounded-lg bg-black/30 px-2 py-1"
              value={settings.winScore}
              onChange={(e) => onChangeSettings({ ...settings, winScore: Number(e.target.value) })}
            >
              <option value={0}>No limit</option>
              <option value={5}>5 points</option>
              <option value={7}>7 points</option>
              <option value={10}>10 points</option>
            </select>
          </OptionRow>
          <label className="flex items-center justify-between gap-3 text-sm font-bold">
            Imposters know each other
            <input
              type="checkbox"
              checked={settings.impostersKnowEachOther}
              onChange={(e) => onChangeSettings({ ...settings, impostersKnowEachOther: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-bold">
            Last-chance word guess
            <input
              type="checkbox"
              checked={settings.lastChanceGuess}
              onChange={(e) => onChangeSettings({ ...settings, lastChanceGuess: e.target.checked })}
            />
          </label>
        </div>
      )}

      {!theme.streamlined && (
        <div className="ip-sticky">
          <button className="ip-btn ip-btn-primary" disabled={!canStart} onClick={onStart}>
            Deal the cards
          </button>
        </div>
      )}
    </div>
  )
}

function OptionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-bold">
      {label}
      {children}
    </label>
  )
}

function StreamCardScreen({
  theme,
  name,
  card,
  onGotIt,
}: {
  theme: ImposterTheme
  name: string
  card: Round['cards'][number]
  onGotIt: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const isImposterView = card.isImposter
  return (
    <div className="flex flex-1 flex-col items-center">
      <h2 className="ip-title mt-2 text-center text-4xl">Pass to {name}</h2>
      <div className="ip-flip-wrap mt-8">
        <div className={`ip-flip ${flipped ? 'is-flipped' : ''}`}>
          <div className="ip-flip-face ip-flip-front ip-card ip-card-soft">
            <div className="text-5xl leading-none">{card.categoryEmoji}</div>
            <div className="mt-2 text-3xl font-black tracking-tight">{card.categoryName}</div>
          </div>
          <div className="ip-flip-face ip-flip-back ip-card ip-card-soft">
            <div className="text-5xl leading-none">{card.categoryEmoji}</div>
            <div className="mt-2 text-3xl font-black tracking-tight">{card.categoryName}</div>
            {isImposterView ? (
              <div className="ip-secret-word mt-5 text-[var(--ip-imposter)]">{theme.imposterLabel}</div>
            ) : (
              <div className="ip-secret-word mt-5">{card.word}</div>
            )}
          </div>
        </div>
      </div>
      <div className="ip-stream-action">
        {!flipped ? (
          <button
            className="ip-btn ip-btn-primary"
            onClick={() => {
              setFlipped(true)
              haptic(14)
              beep('tap')
            }}
          >
            Show word
          </button>
        ) : (
          <button className="ip-btn ip-btn-crew" onClick={onGotIt}>
            {theme.gotIt}
          </button>
        )}
      </div>
    </div>
  )
}

function PassScreen({
  theme,
  name,
  index,
  total,
  onReady,
}: {
  theme: ImposterTheme
  name: string
  index: number
  total: number
  onReady: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {!theme.streamlined && <div className="ip-pill mb-4">{index + 1} / {total}</div>}
      <h2 className="ip-title text-4xl">Pass to {name}</h2>
      {!theme.streamlined && (
        <>
          <div className="mt-3 text-5xl font-black tracking-tight text-[var(--ip-gold)]">{name}</div>
          {theme.passHint ? (
            <p className="mt-4 max-w-[28ch] text-[var(--ip-muted)]">{theme.passHint.replace('{name}', name)}</p>
          ) : null}
        </>
      )}
      <button className="ip-btn ip-btn-primary mt-8 max-w-xs" onClick={onReady}>
        {theme.streamlined ? 'Show word' : `${name} is ready`}
      </button>
    </div>
  )
}

function RevealScreen({
  theme,
  playerName,
  card,
  mode,
  open,
  onOpen,
  onGotIt,
}: {
  theme: ImposterTheme
  playerName: string
  card: Round['cards'][number]
  mode: GameMode
  open: boolean
  onOpen: () => void
  onGotIt: () => void
}) {
  const isImposterView = card.isImposter && mode !== 'mystery'
  if (theme.streamlined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="ip-card ip-card-soft mx-auto w-full max-w-[380px] px-5 py-10">
          <div className="text-5xl leading-none">{card.categoryEmoji}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{card.categoryName}</div>
          {isImposterView ? (
            <div className="ip-secret-word mt-6 text-[var(--ip-imposter)]">{theme.imposterLabel}</div>
          ) : (
            <div className="ip-secret-word mt-6">{card.word}</div>
          )}
        </div>
        <button className="ip-btn ip-btn-crew mt-6 max-w-xs" onClick={onGotIt}>
          {theme.gotIt}
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="ip-pill">{playerName}</div>
        {!theme.bigCategoryReveal && (
          <div className="ip-pill">{card.categoryEmoji} {card.categoryName}</div>
        )}
      </div>

      {!open ? (
        <button
          className="ip-card flex min-h-[320px] flex-1 flex-col items-center justify-center text-center"
          onClick={onOpen}
        >
          {theme.bigCategoryReveal ? (
            <>
              <div className="text-6xl leading-none">{card.categoryEmoji}</div>
              <div className="mt-3 text-4xl font-black tracking-tight">{card.categoryName}</div>
              <div className="mt-8 text-xl font-black">{theme.revealPrompt}</div>
            </>
          ) : (
            <>
              <Eye size={42} className="mb-3 text-[var(--ip-gold)]" />
              <div className="text-2xl font-black">{theme.revealPrompt}</div>
              <p className="mt-2 max-w-[26ch] text-sm text-[var(--ip-muted)]">
                {theme.revealHint}
              </p>
            </>
          )}
        </button>
      ) : (
        <div
          className="ip-card flex min-h-[320px] flex-1 flex-col items-center justify-center text-center"
          style={{
            background: isImposterView
              ? 'linear-gradient(180deg, rgba(255,93,143,0.2), rgba(23,31,58,0.92))'
              : 'linear-gradient(180deg, rgba(61,220,151,0.16), rgba(23,31,58,0.92))',
          }}
        >
          {card.question ? (
            <>
              <div className="ip-pill mb-3">{card.isImposter ? 'Answer carefully' : 'Your question'}</div>
              <div className="ip-secret-word text-[1.7rem] leading-tight">{card.question}</div>
              <p className="mt-4 text-sm text-[var(--ip-muted)]">Everyone answers out loud. One question is different.</p>
            </>
          ) : isImposterView ? (
            <>
              <Ghost size={40} className="mb-2" />
              <div className="ip-secret-word text-[var(--ip-imposter)]">{theme.imposterLabel}</div>
              {!theme.streamlined && (
                <p className="mt-3 max-w-[28ch] text-sm text-[var(--ip-muted)]">
                  {theme.imposterHint}
                </p>
              )}
              {card.hint && <div className="mt-4 ip-pill">{card.hint}</div>}
              {card.otherImposterNames.length > 0 && (
                <div className="mt-3 text-sm font-bold">Team: {card.otherImposterNames.join(', ')}</div>
              )}
            </>
          ) : (
            <>
              <div className="ip-pill mb-3">{mode === 'mystery' ? 'Your word' : 'Secret word'}</div>
              <div className="ip-secret-word">{card.word}</div>
              {!theme.streamlined && (
                <p className="mt-4 text-sm text-[var(--ip-muted)]">Lock it in, then pass.</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="ip-sticky">
        <button className="ip-btn ip-btn-crew" disabled={!open} onClick={onGotIt}>
          {theme.gotIt}
        </button>
      </div>
    </div>
  )
}

function DiscussScreen({
  theme,
  round,
  players,
  settings,
  secondsLeft,
  timerOn,
  onToggleTimer,
  onVote,
}: {
  round: Round
  players: Player[]
  settings: Settings
  secondsLeft: number
  timerOn: boolean
  onToggleTimer: () => void
  onVote: () => void
  theme: ImposterTheme
}) {
  const starter = playerById(players, round.starterPlayerId)
  const mm = Math.floor(secondsLeft / 60)
  const ss = `${secondsLeft % 60}`.padStart(2, '0')
  return (
    <div className="flex flex-1 flex-col">
      {!theme.streamlined && <div className="ip-pill w-fit">Clue time</div>}
      {theme.streamlined ? (
        <h2 className="ip-title text-4xl">{starter?.name || 'Someone'} goes first</h2>
      ) : (
        <>
          <h2 className="ip-title mt-3 text-4xl">{theme.discussTitle}</h2>
          <p className="mt-2 text-[var(--ip-muted)]">
            {round.mode === 'liar'
              ? `${starter?.name || 'Someone'} starts. Answer out loud. One question is different.`
              : theme.discussBody(starter?.name || 'Someone', settings.clueRounds)}
          </p>
        </>
      )}

      <div className="ip-card mt-5 text-center">
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--ip-muted)]">Category</div>
        <div className="mt-1 text-2xl font-black">{round.categoryEmoji} {round.categoryName}</div>
        {settings.timerSeconds > 0 && (
          <>
            <div className={`ip-timer mt-4 ${secondsLeft > 0 && secondsLeft <= 10 ? 'text-[var(--ip-imposter)]' : ''}`}>
              {mm}:{ss}
            </div>
            <button className="ip-btn ip-btn-secondary mt-2" onClick={onToggleTimer}>
              {timerOn ? 'Pause timer' : secondsLeft === 0 ? 'Restart timer' : 'Resume timer'}
            </button>
          </>
        )}
      </div>

      {!theme.streamlined && theme.discussTip ? (
        <div className="mt-3 ip-card text-sm leading-relaxed text-[var(--ip-muted)]">
          {theme.discussTip}
        </div>
      ) : null}

      <div className="ip-sticky space-y-2">
        <button className="ip-btn ip-btn-primary" onClick={onVote}>
          {theme.discussActionLabel || 'Vote now'}
        </button>
      </div>
    </div>
  )
}

function VoteScreen({
  players,
  round,
  settings,
  accusedIds,
  setAccusedIds,
  voteIndex,
  voteOpen,
  setVoteOpen,
  onSecretPick,
  onQuickLock,
  onBack,
}: {
  players: Player[]
  round: Round
  settings: Settings
  accusedIds: string[]
  setAccusedIds: (ids: string[]) => void
  voteIndex: number
  voteOpen: boolean
  setVoteOpen: (v: boolean) => void
  onSecretPick: (targetId: string) => void
  onQuickLock: () => void
  onBack: () => void
}) {
  const chaosMode = settings.mode === 'chaos'
  const needed = chaosMode ? 0 : Math.max(1, round.actualImposterCount)
  const voter = players[voteIndex]

  if (settings.voteStyle === 'secret') {
    if (voteIndex >= players.length) return null
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Secret vote" onBack={onBack} />
        {!voteOpen ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="ip-pill mb-3">{voteIndex + 1} / {players.length}</div>
            <h2 className="ip-title text-4xl">Pass to {voter.name}</h2>
            <p className="mt-3 text-[var(--ip-muted)]">Vote in private, then hand it on.</p>
            <button className="ip-btn ip-btn-primary mt-6 max-w-xs" onClick={() => setVoteOpen(true)}>
              I am {voter.name}
            </button>
          </div>
        ) : (
          <>
            <h2 className="ip-title text-3xl">Who is faking it?</h2>
            <div className="mt-4 space-y-2">
              {chaosMode && (
                <button className="ip-btn ip-btn-secondary" onClick={() => onSecretPick('nobody')}>Nobody</button>
              )}
              {players.map((p) => (
                <button key={p.id} className="ip-btn ip-btn-secondary" onClick={() => onSecretPick(p.id)}>
                  {p.name}{p.id === voter.id ? ' (me)' : ''}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  function toggle(id: string) {
    if (id === 'nobody') {
      setAccusedIds(accusedIds[0] === 'nobody' ? [] : ['nobody'])
      return
    }
    const withoutNobody = accusedIds.filter((x) => x !== 'nobody')
    if (withoutNobody.includes(id)) setAccusedIds(withoutNobody.filter((x) => x !== id))
    else setAccusedIds([...withoutNobody, id].slice(-needed))
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Vote" onBack={onBack} />
      <h2 className="ip-title text-3xl">Who is the imposter?</h2>
      <p className="mt-2 text-sm text-[var(--ip-muted)]">
        {chaosMode
          ? 'Chaos: pick who you think is faking, or tap nobody.'
          : `Tap ${needed} name${needed === 1 ? '' : 's'}. Then lock it in.`}
      </p>
      <div className="mt-4 space-y-2">
        {chaosMode && (
          <button className={`ip-btn ${accusedIds[0] === 'nobody' ? 'ip-btn-primary' : 'ip-btn-secondary'}`} onClick={() => toggle('nobody')}>
            Nobody is faking
          </button>
        )}
        {players.map((p) => {
          const on = accusedIds.includes(p.id)
          return (
            <button key={p.id} className={`ip-btn ${on ? 'ip-btn-primary' : 'ip-btn-secondary'}`} onClick={() => toggle(p.id)}>
              {on && <Check size={16} className="mr-2 inline" />}{p.name}
            </button>
          )
        })}
      </div>
      <div className="ip-sticky">
        <button
          className="ip-btn ip-btn-crew"
          disabled={chaosMode ? accusedIds.length === 0 : accusedIds.length !== needed}
          onClick={onQuickLock}
        >
          Reveal
        </button>
      </div>
    </div>
  )
}

function GuessScreen({
  round,
  players,
  onYes,
  onNo,
}: {
  round: Round
  players: Player[]
  onYes: () => void
  onNo: () => void
}) {
  const imposters = round.cards
    .filter((c) => c.isImposter)
    .map((c) => playerById(players, c.playerId)?.name)
    .filter(Boolean)
  return (
    <div className="flex flex-1 flex-col">
      <div className="ip-pill w-fit">Last chance</div>
      <h2 className="ip-title mt-3 text-4xl">Imposters can steal it</h2>
      <p className="mt-3 text-[var(--ip-muted)]">
        The group caught {imposters.join(' and ')}. They get one try to guess the secret word out loud.
      </p>
      <div className="ip-card mt-6 text-center">
        <div className="text-sm text-[var(--ip-muted)]">Did they guess it?</div>
        <div className="mt-2 text-lg font-black">Only the host should tap</div>
      </div>
      <div className="ip-sticky space-y-2">
        <button className="ip-btn ip-btn-danger" onClick={onYes}>Yes, they got the word</button>
        <button className="ip-btn ip-btn-crew" onClick={onNo}>No, they missed</button>
      </div>
    </div>
  )
}

function ResultsScreen({
  theme,
  result,
  round,
  players,
  matchOver,
  winScore,
  onAgain,
  onSetup,
  onHome,
  onScores,
}: {
  theme: ImposterTheme
  result: RoundResult
  round: Round
  players: Player[]
  matchOver: boolean
  winScore: number
  onAgain: () => void
  onSetup: () => void
  onHome: () => void
  onScores: () => void
}) {
  const imposters = result.imposterIds.map((id) => playerById(players, id)?.name || 'Unknown')
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const simpleReveal = !!theme.skipVote
  return (
    <div className="flex flex-1 flex-col">
      {!theme.streamlined && (
        <div className="ip-pill w-fit">
          {simpleReveal ? 'Reveal' : result.crewWon ? 'Crew wins' : 'Imposters win'}
        </div>
      )}
      {!theme.streamlined && (
        <>
          <h2 className="ip-title mt-3 text-4xl">
            {simpleReveal
              ? imposters.length ? imposters.join(' & ') : 'Nobody'
              : result.crewWon ? 'Caught them!' : result.guessCorrect ? 'Stolen guess!' : 'They got away!'}
          </h2>
          {simpleReveal && (
            <p className="mt-2 text-[var(--ip-muted)]">
              {imposters.length === 1 ? 'was the imposter.' : imposters.length > 1 ? 'were the imposters.' : 'No imposters this round.'}
            </p>
          )}
        </>
      )}

      {theme.streamlined && (
        <div className="ip-card mt-2 text-center">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--ip-muted)]">Imposter</div>
          <div className="mt-1 text-2xl font-black leading-snug">
            {imposters.length === 1
              ? `${imposters[0]} was the imposter`
              : imposters.length > 1
                ? `${imposters.join(' & ')} were the imposters`
                : 'Nobody was the imposter'}
          </div>
        </div>
      )}

      <div className="ip-card mt-3 space-y-2">
        {round.mode === 'liar' ? (
          <>
            <Row k="Everyone else" v={round.civilianQuestion || ''} />
            <Row k="Liar question" v={round.liarQuestion || ''} />
          </>
        ) : (
          <>
            <Row k="Secret word" v={round.secretWord} />
            {!theme.streamlined && round.decoyWord && <Row k="Mystery word" v={round.decoyWord} />}
          </>
        )}
        {!theme.streamlined && (
          <Row k="Imposters" v={imposters.length ? imposters.join(', ') : 'Nobody'} />
        )}
      </div>

      {!theme.streamlined && (
        <div className="mt-3 space-y-2">
          {ranked.map((p) => (
            <div key={p.id} className="ip-card flex items-center justify-between">
              <div>
                <div className="font-black">{p.name}</div>
                <div className="text-xs text-[var(--ip-muted)]">
                  {result.imposterIds.includes(p.id) ? 'Imposter' : 'Crew'}
                  {result.scoresDelta[p.id] ? `  +${result.scoresDelta[p.id]}` : ''}
                </div>
              </div>
              <div className="text-xl font-black">{p.score}</div>
            </div>
          ))}
        </div>
      )}

      {!theme.streamlined && matchOver && (
        <div className="ip-card mt-3 text-center">
          <Trophy className="mx-auto mb-1" />
          <div className="font-black">{ranked[0]?.name} wins the match!</div>
          <div className="text-sm text-[var(--ip-muted)]">First to {winScore}</div>
        </div>
      )}

      <div className="ip-sticky space-y-2">
        <button className="ip-btn ip-btn-primary" onClick={onAgain}>
          {!theme.streamlined && <Shuffle size={16} className="mr-2 inline" />}Next round
        </button>
        {!theme.streamlined && (
          <div className="grid grid-cols-3 gap-2">
            <button className="ip-btn ip-btn-secondary" onClick={onSetup}>Setup</button>
            <button className="ip-btn ip-btn-secondary" onClick={onScores}>Scores</button>
            <button className="ip-btn ip-btn-secondary" onClick={onHome}>Home</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--ip-muted)]">{k}</div>
      <div className="font-black leading-snug">{v}</div>
    </div>
  )
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <button className="ip-btn ip-btn-ghost w-auto px-2" onClick={onBack} aria-label="Back">
        <ArrowLeft />
      </button>
      <h1 className="text-xl font-black">{title}</h1>
    </div>
  )
}



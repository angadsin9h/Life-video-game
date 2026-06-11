import React, { useState, useEffect } from 'react'
import { Sprout, Sun, Leaf, Snowflake, Plus, CheckCircle2, TrendingUp, BookOpen, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'
type Domain = 'overall' | 'career' | 'relationships' | 'health' | 'creative'

type SeasonEntry = {
  id: string
  startDate: string
  endDate: string
  season: Season
  domain: Domain
  theme: string
  lessons: string
  honoring: string
  resisting: string
}

type SeasonCheckIn = {
  id: string
  date: string
  alignmentScore: number
  note: string
}

type StoredData = {
  entries: SeasonEntry[]
  checkIns: SeasonCheckIn[]
}

type SeasonConfig = {
  label: string
  metaphor: string
  color: string
  gradient: string
  embrace: string[]
  avoid: string[]
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
}

const STORAGE_KEY = 'lq-seasons-of-life'

const SEASONS: Record<Season, SeasonConfig> = {
  spring: {
    label: 'Spring',
    metaphor: 'Planting & new beginnings — seeds in the ground, energy returning',
    color: '#4ade80',
    gradient: 'linear-gradient(135deg, #14532d 0%, #4ade80 100%)',
    embrace: ['Start small experiments', 'Plant seeds without demanding harvests', 'Say yes to learning', 'Build new routines gently'],
    avoid: ['Expecting immediate results', 'Overcommitting to every sprout', 'Comparing your seedlings to others’ harvests'],
    icon: Sprout,
  },
  summer: {
    label: 'Summer',
    metaphor: 'Full push & growth — long days, maximum output, momentum',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #92400e 0%, #fbbf24 100%)',
    embrace: ['Go all-in on what’s working', 'Ride the momentum', 'Visibility and bold moves', 'Long focused work sessions'],
    avoid: ['Burning out by skipping recovery', 'Starting too many new things', 'Ignoring early signs of fatigue'],
    icon: Sun,
  },
  autumn: {
    label: 'Autumn',
    metaphor: 'Harvest & letting go — gather what grew, release what didn’t',
    color: '#ea580c',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
    embrace: ['Celebrate and document wins', 'Prune commitments ruthlessly', 'Finish and ship', 'Gratitude for what grew'],
    avoid: ['Clinging to dying projects', 'Launching big new initiatives', 'Guilt about slowing down'],
    icon: Leaf,
  },
  winter: {
    label: 'Winter',
    metaphor: 'Rest & reflection — fallow ground, quiet restoration, deep roots',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #60a5fa 100%)',
    embrace: ['Deep rest without apology', 'Reflection and journaling', 'Tending relationships and health', 'Dreaming about the next spring'],
    avoid: ['Forcing productivity', 'Judging yourself for low output', 'Making drastic decisions from depletion'],
    icon: Snowflake,
  },
}

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']
const DOMAINS: Domain[] = ['overall', 'career', 'relationships', 'health', 'creative']

const makeId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const todayStr = (): string => new Date().toISOString().slice(0, 10)

const loadData = (): StoredData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredData
  } catch {
    return { entries: [], checkIns: [] }
  }
  return { entries: [], checkIns: [] }
}

const SeasonsOfLife: React.FC = () => {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SeasonEntry[]>(() => loadData().entries)
  const [checkIns, setCheckIns] = useState<SeasonCheckIn[]>(() => loadData().checkIns)

  const [formDomain, setFormDomain] = useState<Domain>('overall')
  const [formSeason, setFormSeason] = useState<Season>('spring')
  const [formTheme, setFormTheme] = useState<string>('')
  const [formLessons, setFormLessons] = useState<string>('')
  const [formHonoring, setFormHonoring] = useState<string>('')
  const [formResisting, setFormResisting] = useState<string>('')

  const [checkScore, setCheckScore] = useState<number>(7)
  const [checkNote, setCheckNote] = useState<string>('')

  useEffect(() => {
    const data: StoredData = { entries, checkIns }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [entries, checkIns])

  const currentEntries: SeasonEntry[] = entries.filter((e) => e.endDate === '')
  const currentOverall: SeasonEntry | undefined =
    currentEntries.find((e) => e.domain === 'overall') ?? currentEntries[0]

  const declareSeason = (): void => {
    if (!formTheme.trim()) return
    const today = todayStr()
    const closed = entries.map((e) =>
      e.domain === formDomain && e.endDate === '' ? { ...e, endDate: today } : e
    )
    const entry: SeasonEntry = {
      id: makeId(),
      startDate: today,
      endDate: '',
      season: formSeason,
      domain: formDomain,
      theme: formTheme.trim(),
      lessons: formLessons.trim(),
      honoring: formHonoring.trim(),
      resisting: formResisting.trim(),
    }
    setEntries([...closed, entry])
    setFormTheme('')
    setFormLessons('')
    setFormHonoring('')
    setFormResisting('')
    toastSuccess(`${SEASONS[formSeason].label} declared for ${formDomain}`)
  }

  const saveCheckIn = (): void => {
    const checkIn: SeasonCheckIn = {
      id: makeId(),
      date: todayStr(),
      alignmentScore: checkScore,
      note: checkNote.trim(),
    }
    setCheckIns([...checkIns, checkIn])
    setCheckNote('')
    toastSuccess('Alignment check-in saved')
  }

  const renderTimeline = (): React.ReactElement => {
    if (entries.length === 0) {
      return <p style={{ color: '#94a3b8' }}>Declare your first season to begin the timeline.</p>
    }
    const width = 760
    const padX = 90
    const rowH = 34
    const height = DOMAINS.length * rowH + 40
    const times = entries.flatMap((e) => [
      new Date(e.startDate).getTime(),
      new Date(e.endDate === '' ? todayStr() : e.endDate).getTime(),
    ])
    const minT = Math.min(...times)
    const maxT = Math.max(...times, new Date(todayStr()).getTime())
    const span = Math.max(maxT - minT, 86400000)
    const xOf = (t: number): number => padX + ((t - minT) / span) * (width - padX - 20)

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Season history timeline">
        {DOMAINS.map((d, i) => (
          <g key={d}>
            <text x={8} y={20 + i * rowH + rowH / 2 + 4} fill="#94a3b8" fontSize={12} style={{ textTransform: 'capitalize' }}>
              {d}
            </text>
            <line x1={padX} y1={20 + i * rowH + rowH / 2} x2={width - 20} y2={20 + i * rowH + rowH / 2} stroke="#1e293b" strokeWidth={1} />
          </g>
        ))}
        {entries.map((e) => {
          const row = DOMAINS.indexOf(e.domain)
          const x1 = xOf(new Date(e.startDate).getTime())
          const x2 = xOf(new Date(e.endDate === '' ? todayStr() : e.endDate).getTime())
          return (
            <g key={e.id}>
              <rect
                x={x1}
                y={20 + row * rowH + 5}
                width={Math.max(x2 - x1, 6)}
                height={rowH - 10}
                rx={5}
                fill={SEASONS[e.season].color}
                opacity={e.endDate === '' ? 0.95 : 0.65}
              >
                <title>{`${SEASONS[e.season].label} (${e.domain}): ${e.theme}`}</title>
              </rect>
            </g>
          )
        })}
        <text x={padX} y={height - 6} fill="#64748b" fontSize={11}>
          {new Date(minT).toLocaleDateString()}
        </text>
        <text x={width - 20} y={height - 6} fill="#64748b" fontSize={11} textAnchor="end">
          {new Date(maxT).toLocaleDateString()}
        </text>
      </svg>
    )
  }

  const renderTrend = (): React.ReactElement => {
    const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-16)
    if (sorted.length < 2) {
      return <p style={{ color: '#94a3b8' }}>Log at least two check-ins to see your alignment trend.</p>
    }
    const width = 720
    const height = 200
    const padL = 36
    const padB = 28
    const xOf = (i: number): number => padL + (i / (sorted.length - 1)) * (width - padL - 16)
    const yOf = (s: number): number => 12 + (1 - (s - 1) / 9) * (height - padB - 12)
    const points = sorted.map((c, i) => `${xOf(i)},${yOf(c.alignmentScore)}`).join(' ')

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Alignment trend">
        {[1, 4, 7, 10].map((s) => (
          <g key={s}>
            <line x1={padL} y1={yOf(s)} x2={width - 16} y2={yOf(s)} stroke="#1e293b" strokeWidth={1} />
            <text x={padL - 8} y={yOf(s) + 4} fill="#64748b" fontSize={11} textAnchor="end">
              {s}
            </text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinejoin="round" />
        {sorted.map((c, i) => (
          <circle key={c.id} cx={xOf(i)} cy={yOf(c.alignmentScore)} r={4} fill="#4ade80">
            <title>{`${c.date}: ${c.alignmentScore}/10 ${c.note}`}</title>
          </circle>
        ))}
        <text x={padL} y={height - 6} fill="#64748b" fontSize={11}>
          {sorted[0].date}
        </text>
        <text x={width - 16} y={height - 6} fill="#64748b" fontSize={11} textAnchor="end">
          {sorted[sorted.length - 1].date}
        </text>
      </svg>
    )
  }

  const HeroIcon = currentOverall ? SEASONS[currentOverall.season].icon : Sprout

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem' }}>
      <div
        className="game-card"
        style={{
          background: currentOverall ? SEASONS[currentOverall.season].gradient : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <HeroIcon className="hero-season-icon" style={{ width: 48, height: 48, color: '#fff' }} />
        <div>
          <h1 style={{ margin: 0, color: '#fff' }}>Seasons of Life</h1>
          {currentOverall ? (
            <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.9)' }}>
              You are in <strong>{SEASONS[currentOverall.season].label}</strong> ({currentOverall.domain}) — {currentOverall.theme}
            </p>
          ) : (
            <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.9)' }}>
              No season declared yet. What season are you in right now?
            </p>
          )}
        </div>
      </div>

      {currentEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {currentEntries.map((e) => {
            const Icon = SEASONS[e.season].icon
            return (
              <div key={e.id} className="game-card" style={{ padding: '0.9rem', borderLeft: `4px solid ${SEASONS[e.season].color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon style={{ width: 18, height: 18, color: SEASONS[e.season].color }} />
                  <strong style={{ textTransform: 'capitalize' }}>{e.domain}</strong>
                  <span style={{ color: SEASONS[e.season].color }}>{SEASONS[e.season].label}</span>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{e.theme}</p>
                {e.honoring && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#86efac' }}>Honoring: {e.honoring}</p>
                )}
                {e.resisting && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#fca5a5' }}>Resisting: {e.resisting}</p>
                )}
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>Since {e.startDate}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="game-card" style={{ padding: '1.25rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus style={{ width: 20, height: 20 }} /> Declare a Season
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <select className="game-input" value={formDomain} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormDomain(e.target.value as Domain)}>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select className="game-input" value={formSeason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormSeason(e.target.value as Season)}>
            {SEASON_ORDER.map((s) => (
              <option key={s} value={s}>
                {SEASONS[s].label}
              </option>
            ))}
          </select>
        </div>
        <p style={{ color: SEASONS[formSeason].color, fontSize: '0.85rem', marginTop: 0 }}>{SEASONS[formSeason].metaphor}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.6rem' }}>
          <input
            className="game-input"
            placeholder="Theme — what defines this season?"
            value={formTheme}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTheme(e.target.value)}
          />
          <input
            className="game-input"
            placeholder="Lessons it's teaching you"
            value={formLessons}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormLessons(e.target.value)}
          />
          <input
            className="game-input"
            placeholder="How are you honoring its needs?"
            value={formHonoring}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormHonoring(e.target.value)}
          />
          <input
            className="game-input"
            placeholder="Where are you fighting it?"
            value={formResisting}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormResisting(e.target.value)}
          />
        </div>
        <button
          onClick={declareSeason}
          disabled={!formTheme.trim()}
          style={{
            marginTop: '0.85rem',
            padding: '0.55rem 1.2rem',
            borderRadius: 8,
            border: 'none',
            cursor: formTheme.trim() ? 'pointer' : 'not-allowed',
            background: SEASONS[formSeason].color,
            color: '#0f172a',
            fontWeight: 700,
          }}
        >
          Declare {SEASONS[formSeason].label}
        </button>
      </div>

      <div className="game-card" style={{ padding: '1.25rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: 20, height: 20 }} /> Season History
        </h2>
        {renderTimeline()}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {SEASON_ORDER.map((s) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: SEASONS[s].color, display: 'inline-block' }} />
              {SEASONS[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="game-card" style={{ padding: '1.25rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 style={{ width: 20, height: 20 }} /> Weekly Alignment Check-In
        </h2>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>Are you honoring your current season, or fighting it?</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="range"
            min={1}
            max={10}
            value={checkScore}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckScore(Number(e.target.value))}
            style={{ flex: '1 1 200px' }}
          />
          <strong style={{ minWidth: 56, color: checkScore >= 7 ? '#4ade80' : checkScore >= 4 ? '#fbbf24' : '#f87171' }}>
            {checkScore}/10
          </strong>
          <input
            className="game-input"
            placeholder="Note (optional)"
            value={checkNote}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckNote(e.target.value)}
            style={{ flex: '2 1 240px' }}
          />
          <button
            onClick={saveCheckIn}
            style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#4ade80', color: '#0f172a', fontWeight: 700 }}
          >
            Save
          </button>
        </div>
      </div>

      <div className="game-card" style={{ padding: '1.25rem' }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp style={{ width: 20, height: 20 }} /> Alignment Trend
        </h2>
        {renderTrend()}
      </div>

      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen style={{ width: 20, height: 20 }} /> Season Wisdom
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {SEASON_ORDER.map((s) => {
            const cfg = SEASONS[s]
            const Icon = cfg.icon
            return (
              <div key={s} className="game-card" style={{ padding: '1rem', borderTop: `4px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Icon style={{ width: 20, height: 20, color: cfg.color }} />
                  <strong style={{ color: cfg.color }}>{cfg.label}</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 0 }}>{cfg.metaphor}</p>
                <p style={{ fontSize: '0.8rem', margin: '0.4rem 0 0.2rem', color: '#86efac', fontWeight: 600 }}>Embrace</p>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {cfg.embrace.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0.2rem', color: '#fca5a5', fontWeight: 600 }}>Avoid</p>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {cfg.avoid.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SeasonsOfLife

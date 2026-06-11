import React, { useState, useEffect } from 'react'
import { BookOpen, Plus, Star, ChevronDown, ChevronUp, Trash2, BarChart2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Genre = 'adventure' | 'comedy' | 'drama' | 'thriller' | 'romance' | 'mystery' | 'slice-of-life'

type DayStory = {
  id: string
  date: string
  headline: string
  protagonist: string
  settingMood: string
  mainChallenge: string
  keyAction: string
  climax: string
  resolution: string
  lesson: string
  nextChapter: string
  storyRating: number
  genre: Genre
}

const STORAGE_KEY = 'lq-dailystorylog'

const GENRE_CONFIG: Record<Genre, { label: string; color: string; bg: string }> = {
  adventure:    { label: 'Adventure',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  comedy:       { label: 'Comedy',      color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  drama:        { label: 'Drama',       color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  thriller:     { label: 'Thriller',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  romance:      { label: 'Romance',     color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  mystery:      { label: 'Mystery',     color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  'slice-of-life': { label: 'Slice of Life', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
}

const PROMPTS: Record<keyof Omit<DayStory, 'id' | 'date' | 'storyRating' | 'genre'>, string> = {
  headline:      'Give this day a title — "The Day I…" or "How I…"',
  protagonist:   'Who were you today? Your role, identity, or character arc…',
  settingMood:   'How did the day open? The mood, the light, the first feeling…',
  mainChallenge: 'What was the central obstacle, tension, or task of this chapter?',
  keyAction:     'What was the pivotal thing you did — the defining move?',
  climax:        'Describe the peak moment — the turning point, the highlight…',
  resolution:    'How did the tension resolve? What settled by evening?',
  lesson:        'What did this day teach you? The moral of the chapter…',
  nextChapter:   'What does tomorrow set up? The seed planted today…',
}

const EMPTY_FORM: Omit<DayStory, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  headline: '',
  protagonist: '',
  settingMood: '',
  mainChallenge: '',
  keyAction: '',
  climax: '',
  resolution: '',
  lesson: '',
  nextChapter: '',
  storyRating: 7,
  genre: 'slice-of-life',
}

type View = 'write' | 'archive' | 'charts' | 'best'

export default function DailyStoryLog() {
  const { toastSuccess } = useToast()
  const [stories, setStories] = useState<DayStory[]>([])
  const [view, setView] = useState<View>('write')
  const [form, setForm] = useState<Omit<DayStory, 'id'>>(EMPTY_FORM)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  const STEPS: (keyof Omit<DayStory, 'id' | 'date' | 'storyRating' | 'genre'>)[] = [
    'headline', 'protagonist', 'settingMood', 'mainChallenge',
    'keyAction', 'climax', 'resolution', 'lesson', 'nextChapter',
  ]

  useEffect(() => {
    try { setStories(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (next: DayStory[]) => {
    setStories(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const submit = () => {
    if (!form.headline.trim()) return
    const s: DayStory = { id: Date.now().toString(), ...form }
    persist([s, ...stories])
    setForm(EMPTY_FORM)
    setStep(0)
    setView('archive')
    toastSuccess('Story written!', form.headline)
  }

  const deleteStory = (id: string) => persist(stories.filter(s => s.id !== id))

  const fieldLabel = (key: string): string =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())

  const bestStories = [...stories].sort((a, b) => b.storyRating - a.storyRating).slice(0, 5)

  const genreCounts = (Object.keys(GENRE_CONFIG) as Genre[]).map(g => ({
    genre: g,
    count: stories.filter(s => s.genre === g).length,
  }))
  const totalGenre = stories.length || 1

  const donutRadius = 54
  const circumference = 2 * Math.PI * donutRadius
  let gOffset = 0
  const donutSlices = genreCounts.filter(g => g.count > 0).map(g => {
    const frac = g.count / totalGenre
    const dash = frac * circumference
    const slice = { genre: g.genre, count: g.count, dash, gap: circumference - dash, offset: gOffset }
    gOffset += dash
    return slice
  })

  const ratingPoints = [...stories]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const chartW = 320
  const chartH = 100
  const padX = 20
  const padY = 10
  const innerW = chartW - padX * 2
  const innerH = chartH - padY * 2

  const polyline = ratingPoints.length >= 2
    ? ratingPoints.map((s, i) => {
        const x = padX + (i / (ratingPoints.length - 1)) * innerW
        const y = padY + (1 - (s.storyRating - 1) / 9) * innerH
        return `${x},${y}`
      }).join(' ')
    : ''

  const tabs: { id: View; label: string }[] = [
    { id: 'write',   label: 'Write' },
    { id: 'archive', label: 'Archive' },
    { id: 'charts',  label: 'Charts' },
    { id: 'best',    label: 'Best Chapters' },
  ]

  const currentField = STEPS[step]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"
          style={{ fontFamily: 'Georgia, serif', color: '#f5e6c8' }}>
          <BookOpen className="w-7 h-7" style={{ color: '#d4a853' }} />
          Daily Story Log
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8a7660' }}>Turn your life into a compelling narrative.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3" style={{ background: 'rgba(20,16,10,0.85)' }}>
          <div className="text-xl font-bold" style={{ color: '#d4a853' }}>{stories.length}</div>
          <div className="text-xs" style={{ color: '#6b5d4a' }}>Chapters</div>
        </div>
        <div className="game-card p-3" style={{ background: 'rgba(20,16,10,0.85)' }}>
          <div className="text-xl font-bold" style={{ color: '#f5e6c8' }}>
            {stories.length > 0 ? (stories.reduce((s, st) => s + st.storyRating, 0) / stories.length).toFixed(1) : '—'}
          </div>
          <div className="text-xs" style={{ color: '#6b5d4a' }}>Avg Rating</div>
        </div>
        <div className="game-card p-3" style={{ background: 'rgba(20,16,10,0.85)' }}>
          <div className="text-xl font-bold" style={{ color: '#c084fc' }}>
            {stories.length > 0 ? GENRE_CONFIG[stories.reduce((a, b) => {
              const ac = stories.filter(s => s.genre === a.genre).length
              const bc = stories.filter(s => s.genre === b.genre).length
              return ac >= bc ? a : b
            }).genre].label : '—'}
          </div>
          <div className="text-xs" style={{ color: '#6b5d4a' }}>Top Genre</div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-semibold transition-all"
            style={view === t.id
              ? { background: 'rgba(212,168,83,0.2)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.4)' }
              : { background: 'rgba(20,16,10,0.6)', color: '#6b5d4a', border: '1px solid transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'write' && (
        <div className="game-card p-5 space-y-4" style={{
          background: 'radial-gradient(ellipse at top, rgba(30,22,12,0.98) 0%, rgba(10,8,5,0.99) 100%)',
          border: '1px solid rgba(212,168,83,0.2)',
          boxShadow: '0 0 30px rgba(212,168,83,0.06)',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input text-xs" style={{ width: 'auto' }} />
            </div>
            <div className="flex items-center gap-2">
              <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as Genre }))}
                className="game-input text-xs">
                {(Object.keys(GENRE_CONFIG) as Genre[]).map(g => (
                  <option key={g} value={g}>{GENRE_CONFIG[g].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d4a853' }}>
                {step + 1}/{STEPS.length} — {fieldLabel(currentField)}
              </p>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === step ? '#d4a853' : i < step ? 'rgba(212,168,83,0.4)' : 'rgba(107,93,74,0.3)' }}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs mb-2 italic" style={{ color: '#8a7660' }}>{PROMPTS[currentField]}</p>

            <textarea
              key={currentField}
              value={form[currentField] as string}
              onChange={e => setForm(f => ({ ...f, [currentField]: e.target.value }))}
              className="game-input w-full resize-none text-sm leading-relaxed"
              style={{ height: '90px', fontFamily: 'Georgia, serif', background: 'rgba(30,22,12,0.5)' }}
              autoFocus
              placeholder=""
            />
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-3 py-2 rounded-xl text-xs" style={{ color: '#8a7660', background: 'rgba(30,22,12,0.5)' }}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.3)' }}>
                Next
              </button>
            ) : (
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d4a853' }}>Story Rating</p>
                    <span className="text-sm font-bold" style={{ color: '#f5e6c8' }}>{form.storyRating}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={form.storyRating}
                    onChange={e => setForm(f => ({ ...f, storyRating: Number(e.target.value) }))}
                    className="w-full h-1" style={{ accentColor: '#d4a853' }} />
                  <div className="flex justify-between text-xs mt-0.5" style={{ color: '#6b5d4a' }}>
                    <span>Dull</span><span>Epic</span>
                  </div>
                </div>
                <button onClick={submit}
                  className="w-full py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4a853, #a07030)', color: '#1a1008', boxShadow: '0 4px 20px rgba(212,168,83,0.3)' }}>
                  <BookOpen className="w-4 h-4 inline mr-1.5" />
                  Close This Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'archive' && (
        <div className="space-y-3">
          {stories.length === 0 ? (
            <div className="game-card p-10 text-center" style={{ background: 'rgba(20,16,10,0.85)' }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#d4a853' }} />
              <p className="text-sm" style={{ color: '#6b5d4a' }}>Your story begins with the first entry.</p>
              <button onClick={() => setView('write')}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.3)' }}>
                Write Today's Chapter
              </button>
            </div>
          ) : (
            stories.map(s => {
              const g = GENRE_CONFIG[s.genre]
              const isExp = expanded === s.id
              return (
                <div key={s.id} className="game-card overflow-hidden cursor-pointer"
                  style={{ background: 'rgba(20,16,10,0.9)', border: '1px solid rgba(212,168,83,0.1)', borderLeft: `3px solid ${g.color}` }}>
                  <div className="p-4" onClick={() => setExpanded(isExp ? null : s.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold leading-snug flex-1" style={{ color: '#f5e6c8', fontFamily: 'Georgia, serif' }}>
                        {s.headline || 'Untitled Chapter'}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: g.bg, color: g.color }}>
                          {g.label}
                        </span>
                        {isExp
                          ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#6b5d4a' }} />
                          : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6b5d4a' }} />
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: '#6b5d4a' }}>{s.date}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <Star key={i} className="w-2.5 h-2.5"
                            style={{ color: i < s.storyRating ? '#d4a853' : 'rgba(107,93,74,0.3)', fill: i < s.storyRating ? '#d4a853' : 'none' }} />
                        ))}
                      </span>
                      {s.protagonist && <span className="text-xs italic" style={{ color: '#8a7660' }}>as {s.protagonist}</span>}
                    </div>
                  </div>

                  {isExp && (
                    <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(212,168,83,0.08)' }}>
                      {([
                        ['Setting & Mood', s.settingMood],
                        ['The Challenge', s.mainChallenge],
                        ['Key Action', s.keyAction],
                        ['Climax', s.climax],
                        ['Resolution', s.resolution],
                        ['Lesson', s.lesson],
                        ['Next Chapter', s.nextChapter],
                      ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#d4a853' }}>{label}</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#c8b89a', fontFamily: 'Georgia, serif' }}>{value}</p>
                        </div>
                      ))}
                      <button onClick={e => { e.stopPropagation(); deleteStory(s.id) }}
                        className="mt-1" style={{ color: '#4a3a2a' }}>
                        <Trash2 className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {view === 'charts' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold" style={{ color: '#d4a853' }}>Story Analytics</h3>

          <div className="game-card p-4" style={{ background: 'rgba(20,16,10,0.9)' }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4" style={{ color: '#d4a853' }} />
              <p className="text-sm font-bold" style={{ color: '#f5e6c8' }}>Story Arc — Engagement Over Time</p>
            </div>
            {ratingPoints.length < 2 ? (
              <p className="text-xs" style={{ color: '#6b5d4a' }}>Write at least 2 stories to see your arc.</p>
            ) : (
              <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <linearGradient id="arcGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d4a853" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d4a853" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[1, 3, 5, 7, 9].map(r => {
                  const y = padY + (1 - (r - 1) / 9) * innerH
                  return (
                    <g key={r}>
                      <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(107,93,74,0.15)" strokeWidth={1} />
                      <text x={padX - 4} y={y + 3} textAnchor="end" fontSize={8} fill="rgba(107,93,74,0.6)">{r}</text>
                    </g>
                  )
                })}
                <polyline
                  points={ratingPoints.map((s, i) => {
                    const x = padX + (i / (ratingPoints.length - 1)) * innerW
                    const y = padY + (1 - (s.storyRating - 1) / 9) * innerH
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#d4a853"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(212,168,83,0.5))' }}
                />
                {ratingPoints.map((s, i) => {
                  const x = padX + (i / (ratingPoints.length - 1)) * innerW
                  const y = padY + (1 - (s.storyRating - 1) / 9) * innerH
                  return (
                    <circle key={s.id} cx={x} cy={y} r={3} fill="#d4a853"
                      style={{ filter: 'drop-shadow(0 0 3px rgba(212,168,83,0.8))' }} />
                  )
                })}
                {polyline && (
                  <polygon
                    points={`${padX},${padY + innerH} ${polyline} ${chartW - padX},${padY + innerH}`}
                    fill="url(#arcGrad)"
                  />
                )}
              </svg>
            )}
          </div>

          <div className="game-card p-4 flex items-center gap-6" style={{ background: 'rgba(20,16,10,0.9)' }}>
            <div className="shrink-0">
              <svg width={130} height={130} viewBox="0 0 130 130">
                <circle cx={65} cy={65} r={donutRadius} fill="none" stroke="rgba(107,93,74,0.15)" strokeWidth={16} />
                {donutSlices.map((s, i) => (
                  <circle key={i} cx={65} cy={65} r={donutRadius} fill="none"
                    stroke={GENRE_CONFIG[s.genre].color}
                    strokeWidth={16}
                    strokeDasharray={`${s.dash} ${s.gap}`}
                    strokeDashoffset={-s.offset}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 4px ${GENRE_CONFIG[s.genre].color})` }}
                  />
                ))}
                <text x={65} y={62} textAnchor="middle" fontSize={20} fill="#d4a853" fontWeight="bold">{stories.length}</text>
                <text x={65} y={76} textAnchor="middle" fontSize={9} fill="#6b5d4a">chapters</text>
              </svg>
            </div>
            <div className="space-y-1.5">
              {genreCounts.filter(g => g.count > 0).map(g => (
                <div key={g.genre} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: GENRE_CONFIG[g.genre].color }} />
                  <span className="text-xs" style={{ color: '#c8b89a' }}>{GENRE_CONFIG[g.genre].label}</span>
                  <span className="text-xs font-bold ml-auto" style={{ color: '#d4a853' }}>{g.count}</span>
                </div>
              ))}
              {genreCounts.every(g => g.count === 0) && (
                <p className="text-xs" style={{ color: '#6b5d4a' }}>No stories yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'best' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#d4a853' }}>Best Chapters</h3>
          {bestStories.length === 0 ? (
            <div className="game-card p-8 text-center" style={{ background: 'rgba(20,16,10,0.85)' }}>
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#d4a853' }} />
              <p className="text-sm" style={{ color: '#6b5d4a' }}>Your greatest chapters await writing.</p>
            </div>
          ) : (
            bestStories.map((s, rank) => {
              const g = GENRE_CONFIG[s.genre]
              return (
                <div key={s.id} className="game-card p-4 space-y-2" style={{
                  background: rank === 0
                    ? 'linear-gradient(135deg, rgba(30,22,10,0.98) 0%, rgba(20,14,6,0.99) 100%)'
                    : 'rgba(20,16,10,0.9)',
                  border: rank === 0
                    ? '1px solid rgba(212,168,83,0.35)'
                    : '1px solid rgba(212,168,83,0.08)',
                  boxShadow: rank === 0 ? '0 0 20px rgba(212,168,83,0.08)' : 'none',
                }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl font-bold shrink-0" style={{
                      color: rank === 0 ? '#d4a853' : rank === 1 ? '#94a3b8' : rank === 2 ? '#cd7f32' : '#6b5d4a',
                      fontFamily: 'Georgia, serif',
                    }}>#{rank + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold leading-snug" style={{ color: '#f5e6c8', fontFamily: 'Georgia, serif' }}>
                        {s.headline || 'Untitled'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: '#6b5d4a' }}>{s.date}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: g.bg, color: g.color }}>{g.label}</span>
                        <span className="flex gap-0.5">
                          {Array.from({ length: 10 }, (_, i) => (
                            <Star key={i} className="w-2.5 h-2.5"
                              style={{ color: i < s.storyRating ? '#d4a853' : 'rgba(107,93,74,0.3)', fill: i < s.storyRating ? '#d4a853' : 'none' }} />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                  {s.climax && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#d4a853' }}>Peak Moment</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#c8b89a', fontFamily: 'Georgia, serif' }}>{s.climax}</p>
                    </div>
                  )}
                  {s.lesson && (
                    <p className="text-xs italic border-l-2 pl-3" style={{ color: '#8a7660', borderColor: 'rgba(212,168,83,0.3)' }}>
                      "{s.lesson}"
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

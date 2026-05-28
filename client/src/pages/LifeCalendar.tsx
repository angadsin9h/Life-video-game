import { useEffect, useState } from 'react'
import axios from 'axios'

interface Settings { birth_date?: string; username?: string }

const LIFE_EXPECTANCY = 90

function getWeeksLived(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  const ms = now.getTime() - birth.getTime()
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
}

function getAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return now.getFullYear() - birth.getFullYear() - (
    now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0
  )
}

function getWeekNumber(birthDate: string, weekIndex: number): Date {
  const birth = new Date(birthDate)
  const d = new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
  return d
}

const LIFE_PHASES = [
  { ageFrom: 0,  ageTo: 5,  label: 'Early Childhood', color: '#fbbf24' },
  { ageFrom: 5,  ageTo: 12, label: 'Childhood', color: '#f59e0b' },
  { ageFrom: 12, ageTo: 18, label: 'Teen Years', color: '#fb923c' },
  { ageFrom: 18, ageTo: 25, label: 'Young Adult', color: '#f97316' },
  { ageFrom: 25, ageTo: 40, label: 'Prime Years', color: '#8b5cf6' },
  { ageFrom: 40, ageTo: 55, label: 'Middle Age', color: '#6d28d9' },
  { ageFrom: 55, ageTo: 70, label: 'Later Life', color: '#4c1d95' },
  { ageFrom: 70, ageTo: 90, label: 'Elder Years', color: '#312e81' },
]

function phaseColor(age: number): string {
  for (const p of LIFE_PHASES) {
    if (age >= p.ageFrom && age < p.ageTo) return p.color
  }
  return '#1e293b'
}

function weekToAge(birthDate: string, weekIndex: number): number {
  return Math.floor(weekIndex / 52)
}

export default function LifeCalendar() {
  const [birthDate, setBirthDate] = useState('')
  const [inputDate, setInputDate] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)
  const [view, setView] = useState<'weeks' | 'years'>('weeks')

  useEffect(() => {
    axios.get<Settings>('/api/settings')
      .then(r => {
        setSettings(r.data)
        if (r.data.birth_date) {
          setBirthDate(r.data.birth_date)
          setInputDate(r.data.birth_date)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveBirthDate = async () => {
    if (!inputDate) return
    await axios.put('/api/settings', { birth_date: inputDate })
    setBirthDate(inputDate)
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Loading…</div>

  if (!birthDate) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, monospace' }}>Life Calendar</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your life is about <span className="text-violet-400 font-bold">{LIFE_EXPECTANCY * 52} weeks</span> long.
            Each tiny square represents one week. Enter your birth date to see how many you've lived — and how many remain.
          </p>
        </div>
        <div className="game-card p-5">
          <label className="text-sm text-slate-400 block mb-2">Your Birth Date</label>
          <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)}
            className="game-input w-full mb-3" />
          <button onClick={saveBirthDate} disabled={!inputDate}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            Reveal My Life Calendar
          </button>
        </div>
      </div>
    )
  }

  const totalWeeks = LIFE_EXPECTANCY * 52
  const weeksLived = getWeeksLived(birthDate)
  const age = getAge(birthDate)
  const yearsLeft = LIFE_EXPECTANCY - age
  const weeksLeft = totalWeeks - weeksLived
  const pctLived = Math.min(100, (weeksLived / totalWeeks) * 100)

  const hoveredDate = hovered !== null ? getWeekNumber(birthDate, hovered) : null
  const hoveredAge = hovered !== null ? weekToAge(birthDate, hovered) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Life Calendar
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Each square = 1 week of your life</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('weeks')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === 'weeks' ? 'bg-violet-600/30 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            Weeks
          </button>
          <button onClick={() => setView('years')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${view === 'years' ? 'bg-violet-600/30 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            Years
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{age}</div>
          <div className="text-xs text-slate-500">Years Old</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{weeksLived.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Weeks Lived</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{weeksLeft.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Weeks Left*</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{pctLived.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">Life Lived</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="game-card p-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Birth</span>
          <span className="text-violet-400 font-semibold">You are here — Age {age}</span>
          <span>Age {LIFE_EXPECTANCY}</span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-1000"
            style={{ width: `${pctLived}%` }} />
        </div>
      </div>

      {/* Hovered info */}
      {hovered !== null && hoveredDate && (
        <div className="game-card px-4 py-3 border border-violet-500/20 text-sm text-slate-300">
          Week {hovered + 1} · Age {hoveredAge} ·{' '}
          {hoveredDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·{' '}
          {hovered < weeksLived
            ? <span className="text-orange-400">Lived ✓</span>
            : hovered === weeksLived
            ? <span className="text-violet-400 font-bold">← You are here</span>
            : <span className="text-slate-500">Future</span>
          }
        </div>
      )}

      {/* Life phases legend */}
      <div className="flex flex-wrap gap-2">
        {LIFE_PHASES.map(p => (
          <div key={p.label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
            <span>{p.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-600" />
          <span>Future</span>
        </div>
      </div>

      {view === 'weeks' ? (
        /* Weeks grid — 52 columns × 90 rows */
        <div className="game-card p-4 overflow-x-auto">
          <div className="min-w-[580px]">
            {/* Year labels */}
            <div className="flex mb-1">
              <div className="w-6 flex-shrink-0" />
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} className="text-[9px] text-slate-700" style={{ width: `${100/52 * (i < 12 ? (i === 0 ? 4 : 4) : 1)}%`, flexShrink: 0 }}>
                  {i * 7}
                </div>
              ))}
            </div>
            {Array.from({ length: LIFE_EXPECTANCY }).map((_, yearIdx) => (
              <div key={yearIdx} className="flex items-center gap-[1px] mb-[1px]">
                <div className="w-6 flex-shrink-0 text-[9px] text-slate-700 text-right pr-1">{yearIdx}</div>
                {Array.from({ length: 52 }).map((_, weekOfYear) => {
                  const weekIdx = yearIdx * 52 + weekOfYear
                  const lived = weekIdx < weeksLived
                  const current = weekIdx === weeksLived
                  return (
                    <div
                      key={weekOfYear}
                      className="flex-1 h-[6px] rounded-[1px] cursor-pointer transition-all hover:scale-150 hover:z-10 relative"
                      style={{
                        backgroundColor: current
                          ? '#a78bfa'
                          : lived
                          ? phaseColor(yearIdx)
                          : '#1e293b',
                        outline: current ? '1px solid #a78bfa' : undefined,
                      }}
                      onMouseEnter={() => setHovered(weekIdx)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-700 mt-3 text-center">*Based on {LIFE_EXPECTANCY}-year life expectancy</p>
        </div>
      ) : (
        /* Years view - larger blocks */
        <div className="game-card p-4">
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {Array.from({ length: LIFE_EXPECTANCY }).map((_, yearIdx) => {
              const weekStart = yearIdx * 52
              const yearLived = weekStart < weeksLived
              const yearCurrent = weekStart <= weeksLived && weeksLived < weekStart + 52
              return (
                <div
                  key={yearIdx}
                  className={`aspect-square rounded flex items-center justify-center text-[10px] cursor-pointer transition-all hover:scale-110 ${
                    yearCurrent ? 'ring-2 ring-violet-400' : ''
                  }`}
                  style={{
                    backgroundColor: yearCurrent ? '#7c3aed' : yearLived ? phaseColor(yearIdx) : '#1e293b',
                  }}
                  onMouseEnter={() => setHovered(yearIdx * 52)}
                  onMouseLeave={() => setHovered(null)}
                  title={`Age ${yearIdx}`}
                >
                  <span className="text-white/70 font-bold">{yearIdx}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reflection prompts */}
      <div className="game-card p-5 border border-violet-500/20 bg-violet-900/5">
        <h3 className="font-semibold text-slate-200 mb-3">📖 Reflection Questions</h3>
        <div className="space-y-2 text-sm text-slate-400">
          {[
            `You have approximately ${yearsLeft} years left. What do you most want to accomplish?`,
            `If you looked back at this week from your deathbed, would you be proud of how you spent it?`,
            `What would the best version of yourself do with the ${weeksLeft.toLocaleString()} weeks ahead?`,
            `Which relationships deserve more of your finite time?`,
          ].map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5 flex-shrink-0">→</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Target, TrendingUp, Zap, BarChart3, RefreshCw, Smile } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'serendipity_log'

interface SerendipityEntry {
  id: string
  date: string
  title: string
  description: string
  category: 'connection' | 'opportunity' | 'insight' | 'kindness' | 'luck' | 'timing' | 'discovery' | 'coincidence'
  impact: 1 | 2 | 3 | 4 | 5
  led_to: string
  tags: string[]
  starred: boolean
}

const CATEGORIES: Array<{
  value: SerendipityEntry['category']
  label: string
  emoji: string
  color: string
}> = [
  { value: 'connection', label: 'Connection', emoji: '🤝', color: '#ec4899' },
  { value: 'opportunity', label: 'Opportunity', emoji: '🚀', color: '#f97316' },
  { value: 'insight', label: 'Insight', emoji: '💡', color: '#eab308' },
  { value: 'kindness', label: 'Kindness', emoji: '💝', color: '#a855f7' },
  { value: 'luck', label: 'Luck', emoji: '🍀', color: '#22c55e' },
  { value: 'timing', label: 'Timing', emoji: '⏰', color: '#3b82f6' },
  { value: 'discovery', label: 'Discovery', emoji: '🔍', color: '#06b6d4' },
  { value: 'coincidence', label: 'Coincidence', emoji: '🔄', color: '#8b5cf6' },
]

function getCatConfig(category: SerendipityEntry['category']) {
  return CATEGORIES.find(c => c.value === category) ?? CATEGORIES[0]
}

function defaultForm(): Omit<SerendipityEntry, 'id'> {
  return {
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    category: 'luck',
    impact: 3,
    led_to: '',
    tags: [],
    starred: false,
  }
}

function calcStreak30(entries: SerendipityEntry[]): number {
  const dates = new Set(entries.map(e => e.date))
  let count = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (dates.has(d.toISOString().split('T')[0])) count++
  }
  return count
}

function getMonthLabel(d: Date): string {
  return d.toLocaleString('default', { month: 'short', year: '2-digit' })
}

export default function SerendipityLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SerendipityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SerendipityEntry, 'id'>>(defaultForm())
  const [tagInput, setTagInput] = useState('')
  const [filterCat, setFilterCat] = useState<SerendipityEntry['category'] | 'all'>('all')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setEntries(raw ? JSON.parse(raw) : [])
    } catch { /**/ }
  }, [])

  const persist = (updated: SerendipityEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t)) return
    setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const submit = () => {
    if (!form.title.trim()) return
    const entry: SerendipityEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(defaultForm())
    setTagInput('')
    setShowForm(false)
    toastSuccess('Serendipity captured! ✨')
  }

  const toggleStar = (id: string) => {
    persist(entries.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
  }

  const deleteEntry = (id: string) => persist(entries.filter(e => e.id !== id))

  // Filter
  const displayed = filterCat === 'all' ? entries : entries.filter(e => e.category === filterCat)

  // Stats
  const total = entries.length
  const starredCount = entries.filter(e => e.starred).length
  const avgImpact = total
    ? Math.round((entries.reduce((s, e) => s + e.impact, 0) / total) * 10) / 10
    : null

  const catCounts: Record<string, number> = {}
  for (const e of entries) catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  const mostCommonCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as SerendipityEntry['category'] | undefined

  const streak30 = calcStreak30(entries)
  const awarenessRate = Math.round((streak30 / 30) * 100)

  // Monthly chart (last 6 months)
  const months: Array<{ label: string; count: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      label: getMonthLabel(d),
      count: entries.filter(e => e.date.startsWith(ym)).length,
    })
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1)

  // Category breakdown bars
  const catBreakdown = CATEGORIES.map(c => ({
    ...c,
    count: catCounts[c.value] ?? 0,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  const maxCatCount = Math.max(...catBreakdown.map(c => c.count), 1)

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Serendipity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture lucky moments. Train yourself to notice magic.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgImpact ?? '—'}</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{starredCount}</div>
          <div className="text-xs text-slate-500">Life-changing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{awarenessRate}%</div>
          <div className="text-xs text-slate-500">Awareness</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Smile className="w-4 h-4 text-yellow-400" /> Log a Serendipitous Moment
          </h3>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What happened?"
            className="game-input w-full"
          />

          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Tell the story..."
            className="game-input w-full h-20 resize-none text-sm"
          />

          {/* Category chips */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Category:</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
                    form.category === c.value ? 'text-white' : 'text-slate-500 border-slate-700 hover:border-slate-500'
                  }`}
                  style={form.category === c.value ? { background: c.color + '30', borderColor: c.color + '60', color: c.color } : {}}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Impact stars */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Impact:</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, impact: v }))}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${v <= form.impact ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Led to */}
          <input
            value={form.led_to}
            onChange={e => setForm(f => ({ ...f, led_to: e.target.value }))}
            placeholder="What did this open up? (optional)"
            className="game-input w-full text-sm"
          />

          {/* Tags */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Tags:</p>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Type + Enter to add tag"
                className="game-input flex-1 text-sm"
              />
              <button onClick={addTag} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 cursor-pointer"
                    onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                  >
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Star toggle */}
          <button
            onClick={() => setForm(f => ({ ...f, starred: !f.starred }))}
            className={`w-full py-2 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
              form.starred
                ? 'bg-yellow-600/30 border-yellow-500/60 text-yellow-300'
                : 'border-slate-700 text-slate-500 hover:border-yellow-500/40 hover:text-yellow-400'
            }`}
          >
            <Star className={`w-4 h-4 ${form.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {form.starred ? 'Marked as life-changing ✨' : 'Mark as life-changing'}
          </button>

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={!form.title.trim()}
              className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4" /> Capture Serendipity
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      {total > 0 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-yellow-400" /> Monthly Serendipity
          </h3>
          <svg viewBox="0 0 300 70" className="w-full" style={{ height: 70 }}>
            {months.map((m, i) => {
              const barMaxH = 48
              const barH = maxMonthCount > 0 ? (m.count / maxMonthCount) * barMaxH : 0
              const x = 10 + i * 48
              const barY = 10 + barMaxH - barH
              return (
                <g key={m.label}>
                  <rect
                    x={x}
                    y={barY}
                    width={32}
                    height={barH}
                    rx={4}
                    fill="#eab30880"
                  />
                  {m.count > 0 && (
                    <text x={x + 16} y={barY - 3} textAnchor="middle" fontSize={9} fill="#eab308">
                      {m.count}
                    </text>
                  )}
                  <text x={x + 16} y={66} textAnchor="middle" fontSize={9} fill="#475569">
                    {m.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Streak / awareness */}
      {total > 0 && (
        <div className="game-card p-4 flex items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-200">Awareness Rate (last 30 days)</span>
              <span className="text-sm font-bold text-emerald-400">{streak30}/30 days — {awarenessRate}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${awarenessRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">More awareness = more serendipity spotted.</p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <div className="game-card p-4">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Category Breakdown
          </h3>
          <div className="space-y-2">
            {catBreakdown.map(c => (
              <div key={c.value} className="flex items-center gap-3">
                <span className="text-base w-6">{c.emoji}</span>
                <span className="text-xs text-slate-400 w-22">{c.label}</span>
                <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(c.count / maxCatCount) * 100}%`, background: c.color }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      {total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${filterCat === 'all' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}
          >
            All ({total})
          </button>
          {CATEGORIES.filter(c => catCounts[c.value] > 0).map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCat(filterCat === c.value ? 'all' : c.value)}
              className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                filterCat === c.value ? 'text-white' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
              style={filterCat === c.value ? { background: c.color + '30', borderColor: c.color + '60', color: c.color } : {}}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Most common category badge */}
      {mostCommonCat && (
        <div className="flex items-center gap-2 text-xs text-slate-500 -mt-3">
          <TrendingUp className="w-3.5 h-3.5" />
          Most common: <span style={{ color: getCatConfig(mostCommonCat).color }}>{getCatConfig(mostCommonCat).emoji} {getCatConfig(mostCommonCat).label}</span>
        </div>
      )}

      {/* Serendipity wall */}
      {displayed.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Serendipity Wall
          </h3>
          <div className="columns-1 sm:columns-2 gap-3">
            {displayed.map(e => {
              const cat = getCatConfig(e.category)
              return (
                <div
                  key={e.id}
                  className={`break-inside-avoid game-card p-4 mb-3 relative group ${
                    e.starred ? 'border border-yellow-500/50 shadow-yellow-500/10 shadow-lg' : ''
                  }`}
                  style={e.starred ? { boxShadow: '0 0 16px #eab30820' } : {}}
                >
                  {/* Category emoji + date badge */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: cat.color + '20', color: cat.color }}
                      >
                        {e.date}
                      </span>
                      {e.starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    </div>
                  </div>

                  <p className="font-semibold text-white text-sm mb-1">{e.title}</p>

                  {/* Impact stars */}
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= e.impact ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>

                  {e.description && (
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{e.description}</p>
                  )}

                  {e.led_to && (
                    <p className="text-xs text-emerald-400 italic mb-2">→ {e.led_to}</p>
                  )}

                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {e.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    <button
                      onClick={() => toggleStar(e.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-yellow-400 transition-colors"
                    >
                      <Star className={`w-3.5 h-3.5 ${e.starred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                      {e.starred ? 'Starred' : 'Star'}
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No serendipitous moments logged yet.</p>
          <p className="text-sm">The more you look, the more you find.</p>
        </div>
      )}
    </div>
  )
}

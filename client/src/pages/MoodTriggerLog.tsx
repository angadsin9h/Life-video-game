import { useState, useEffect, KeyboardEvent } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Save, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'mood_trigger_log'

type TriggerCategory = 'person' | 'event' | 'thought' | 'place' | 'body' | 'media' | 'memory' | 'weather' | 'work' | 'other'
type Direction = 'up' | 'down' | 'mixed'

interface MoodTriggerEntry {
  id: string
  date: string
  time: string
  moodBefore: 1 | 2 | 3 | 4 | 5
  moodAfter: 1 | 2 | 3 | 4 | 5
  trigger: string
  triggerCategory: TriggerCategory
  direction: Direction
  response: string
  insight: string
  tags: string[]
}

const CATEGORY_CONFIG: Record<TriggerCategory, { label: string; emoji: string; color: string }> = {
  person:  { label: 'Person',  emoji: '👤', color: '#6366f1' },
  event:   { label: 'Event',   emoji: '📅', color: '#f59e0b' },
  thought: { label: 'Thought', emoji: '💭', color: '#8b5cf6' },
  place:   { label: 'Place',   emoji: '📍', color: '#ef4444' },
  body:    { label: 'Body',    emoji: '🫀', color: '#ec4899' },
  media:   { label: 'Media',   emoji: '📱', color: '#3b82f6' },
  memory:  { label: 'Memory',  emoji: '💾', color: '#0ea5e9' },
  weather: { label: 'Weather', emoji: '🌤', color: '#22d3ee' },
  work:    { label: 'Work',    emoji: '💼', color: '#f97316' },
  other:   { label: 'Other',   emoji: '🔲', color: '#94a3b8' },
}

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

const DIRECTION_CONFIG: Record<Direction, { label: string; symbol: string; color: string }> = {
  up:    { label: 'Up',    symbol: '⬆️', color: '#22c55e' },
  down:  { label: 'Down',  symbol: '⬇️', color: '#ef4444' },
  mixed: { label: 'Mixed', symbol: '↕️', color: '#eab308' },
}

function computeDirection(before: number, after: number): Direction {
  if (after > before) return 'up'
  if (after < before) return 'down'
  return 'mixed'
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

type FormState = {
  trigger: string
  triggerCategory: TriggerCategory
  moodBefore: 1 | 2 | 3 | 4 | 5
  moodAfter: 1 | 2 | 3 | 4 | 5
  direction: Direction
  time: string
  date: string
  response: string
  insight: string
  tags: string[]
}

const defaultForm = (): FormState => ({
  trigger: '',
  triggerCategory: 'event',
  moodBefore: 3,
  moodAfter: 3,
  direction: 'mixed',
  time: getCurrentTime(),
  date: new Date().toISOString().split('T')[0],
  response: '',
  insight: '',
  tags: [],
})

export default function MoodTriggerLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MoodTriggerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [tagInput, setTagInput] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: MoodTriggerEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const updateMoods = (field: 'moodBefore' | 'moodAfter', val: 1 | 2 | 3 | 4 | 5) => {
    setForm(f => {
      const next = { ...f, [field]: val }
      return { ...next, direction: computeDirection(next.moodBefore, next.moodAfter) }
    })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  const submit = () => {
    if (!form.trigger.trim()) return
    const entry: MoodTriggerEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(defaultForm())
    setTagInput('')
    setShowForm(false)
    toastSuccess('Trigger logged! 🧠')
  }

  // Streak — days logged in last 30
  const last30Dates = new Set(
    entries
      .filter(e => {
        const d = new Date(e.date)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 29)
        return d >= cutoff
      })
      .map(e => e.date)
  )
  const streak = last30Dates.size

  // Trigger map by category
  const categoryMap: Record<TriggerCategory, MoodTriggerEntry[]> = {} as Record<TriggerCategory, MoodTriggerEntry[]>
  for (const cat of Object.keys(CATEGORY_CONFIG) as TriggerCategory[]) categoryMap[cat] = []
  entries.forEach(e => categoryMap[e.triggerCategory].push(e))

  // Top triggers — keyword frequency from trigger texts
  const wordFreq: Record<string, number> = {}
  entries.forEach(e => {
    e.trigger.toLowerCase().split(/\s+/).forEach(w => {
      const cleaned = w.replace(/[^a-z]/g, '')
      if (cleaned.length > 3) wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1
    })
  })
  const topTriggerWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Last 14 entries for chart
  const chartEntries = [...entries].slice(0, 14).reverse()

  // Recent entries (last 10)
  const recentEntries = entries.slice(0, 10)

  // Insights
  const insights = entries.filter(e => e.insight.trim()).slice(0, 20)

  const SVG_W = 560
  const SVG_H = 120
  const padL = 20
  const padR = 20
  const padT = 20
  const padB = 20
  const chartW = SVG_W - padL - padR
  const chartH = SVG_H - padT - padB

  const cx = (i: number) => padL + (chartEntries.length <= 1 ? chartW / 2 : (i / (chartEntries.length - 1)) * chartW)
  const cy = (mood: number) => padT + chartH - ((mood - 1) / 4) * chartH

  const dirColor = (d: Direction) => DIRECTION_CONFIG[d].color

  const beforePoints = chartEntries.map((e, i) => `${cx(i)},${cy(e.moodBefore)}`).join(' ')
  const afterPoints = chartEntries.map((e, i) => `${cx(i)},${cy(e.moodAfter)}`).join(' ')

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Mood Trigger Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Identify what shifts your mood — build self-awareness about emotional patterns.
          </p>
        </div>
        <button
          onClick={() => { setForm(defaultForm()); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log Trigger
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{streak}/30</div>
          <div className="text-xs text-slate-500">Days Aware</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Triggers Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{entries.filter(e => e.direction === 'up').length}</div>
          <div className="text-xs text-slate-500">Positive Shifts</div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" /> Log a Mood Trigger
          </h3>

          {/* Trigger description */}
          <textarea
            value={form.trigger}
            onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What happened / what triggered this shift?"
            className="game-input w-full h-16 resize-none text-sm"
            autoFocus
          />

          {/* Category chips */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [TriggerCategory, typeof CATEGORY_CONFIG.person][]).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, triggerCategory: k }))}
                  className="px-2.5 py-1 rounded-xl text-xs transition-all"
                  style={form.triggerCategory === k
                    ? { background: c.color + '30', color: c.color, border: `1px solid ${c.color}60` }
                    : { background: '#1e293b', color: '#64748b' }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood before + after */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">Mood Before</p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => updateMoods('moodBefore', v)}
                    className="text-xl transition-all"
                    style={{ opacity: form.moodBefore === v ? 1 : 0.3, transform: form.moodBefore === v ? 'scale(1.3)' : 'scale(1)' }}
                  >
                    {MOOD_EMOJIS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Mood After</p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => updateMoods('moodAfter', v)}
                    className="text-xl transition-all"
                    style={{ opacity: form.moodAfter === v ? 1 : 0.3, transform: form.moodAfter === v ? 'scale(1.3)' : 'scale(1)' }}
                  >
                    {MOOD_EMOJIS[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direction + time */}
          <div className="flex gap-3 items-center flex-wrap">
            <div>
              <p className="text-xs text-slate-500 mb-1">Direction</p>
              <div className="flex gap-2">
                {(['up', 'down', 'mixed'] as Direction[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({ ...f, direction: d }))}
                    className="px-3 py-1 rounded-xl text-xs font-medium transition-all"
                    style={form.direction === d
                      ? { background: DIRECTION_CONFIG[d].color + '30', color: DIRECTION_CONFIG[d].color, border: `1px solid ${DIRECTION_CONFIG[d].color}60` }
                      : { background: '#1e293b', color: '#64748b' }}
                  >
                    {DIRECTION_CONFIG[d].symbol} {DIRECTION_CONFIG[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <p className="text-xs text-slate-500 mb-1">Time</p>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm w-full" />
            </div>
          </div>

          {/* Response + Insight */}
          <textarea
            value={form.response}
            onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
            placeholder="How did you respond?"
            className="game-input w-full h-14 resize-none text-sm"
          />
          <textarea
            value={form.insight}
            onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="What insight did this give you?"
            className="game-input w-full h-14 resize-none text-sm"
          />

          {/* Tags */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Tags</p>
            <div className="flex gap-2 flex-wrap mb-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-violet-900/40 text-violet-300 rounded-lg text-xs">
                  {t}
                  <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="text-violet-500 hover:text-violet-200">×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              placeholder="Type a tag, press Enter"
              className="game-input text-sm w-full"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
              <Save className="w-4 h-4" /> Save Trigger
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Mood shift chart */}
      {chartEntries.length > 1 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Mood Shift Chart (last 14)
          </h3>
          <div className="overflow-x-auto">
            <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minWidth: 280 }}>
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map(m => (
                <line key={m} x1={padL} y1={cy(m)} x2={SVG_W - padR} y2={cy(m)} stroke="#1e293b" strokeWidth="1" />
              ))}
              {/* Before line */}
              <polyline points={beforePoints} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* After line */}
              <polyline points={afterPoints} fill="none" stroke="#22c55e" strokeWidth="1.5" />
              {/* Dots */}
              {chartEntries.map((e, i) => (
                <g key={e.id}>
                  {/* before — hollow */}
                  <circle cx={cx(i)} cy={cy(e.moodBefore)} r={4} fill="none" stroke={dirColor(e.direction)} strokeWidth={1.5} />
                  {/* after — filled */}
                  <circle cx={cx(i)} cy={cy(e.moodAfter)} r={4} fill={dirColor(e.direction)} />
                  {/* connector */}
                  <line x1={cx(i)} y1={cy(e.moodBefore)} x2={cx(i)} y2={cy(e.moodAfter)} stroke={dirColor(e.direction)} strokeWidth={1} strokeDasharray="2 1" />
                </g>
              ))}
            </svg>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full border border-violet-400"></span> Before</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span> After</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400"></span> Up</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400"></span> Down</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span> Mixed</span>
          </div>
        </div>
      )}

      {/* Trigger map by category */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Trigger Map</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(categoryMap) as [TriggerCategory, MoodTriggerEntry[]][])
              .filter(([, arr]) => arr.length > 0)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([cat, arr]) => {
                const cfg = CATEGORY_CONFIG[cat]
                const upCount = arr.filter(e => e.direction === 'up').length
                const downCount = arr.filter(e => e.direction === 'down').length
                const upPct = arr.length > 0 ? Math.round((upCount / arr.length) * 100) : 0
                const downPct = arr.length > 0 ? Math.round((downCount / arr.length) * 100) : 0
                return (
                  <div key={cat} className="p-3 rounded-xl" style={{ background: cfg.color + '12', border: `1px solid ${cfg.color}25` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                      <span className="text-xs text-slate-400">{arr.length}</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-800">
                      <div style={{ width: `${upPct}%`, background: '#22c55e' }} />
                      <div style={{ width: `${downPct}%`, background: '#ef4444' }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                      <span>↑ {upPct}%</span>
                      <span>↓ {downPct}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Top triggers */}
      {topTriggerWords.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Top Trigger Words</h3>
          <div className="space-y-1.5">
            {topTriggerWords.map(([word, count]) => {
              const maxCount = topTriggerWords[0][1]
              return (
                <div key={word} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-slate-400 truncate">{word}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Recent Triggers</h3>
          {recentEntries.map(e => {
            const cfg = CATEGORY_CONFIG[e.triggerCategory]
            const dirCfg = DIRECTION_CONFIG[e.direction]
            const isExp = expanded === e.id
            return (
              <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExp ? null : e.id)}
                >
                  <span className="text-lg">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{e.trigger}</p>
                    <p className="text-xs text-slate-500">{e.date} {e.time} · {cfg.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: dirCfg.color }}>{dirCfg.symbol}</span>
                    <span className="text-sm">{MOOD_EMOJIS[e.moodBefore]}</span>
                    <span className="text-xs text-slate-600">→</span>
                    <span className="text-sm">{MOOD_EMOJIS[e.moodAfter]}</span>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                </div>
                {isExp && (
                  <div className="border-t border-slate-800 p-3 space-y-2">
                    {e.response && <p className="text-xs text-slate-300"><span className="text-slate-500 font-medium">Response: </span>{e.response}</p>}
                    {e.insight && <p className="text-xs text-blue-300"><span className="text-blue-500 font-medium">Insight: </span>{e.insight}</p>}
                    {e.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {e.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-lg text-[10px]">{t}</span>)}
                      </div>
                    )}
                    <button
                      onClick={() => persist(entries.filter(x => x.id !== e.id))}
                      className="ml-auto flex text-slate-600 hover:text-red-400 transition-colors mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Insights wall */}
      {insights.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Insights Collected</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {insights.map(e => (
              <div key={e.id} className="p-3 bg-slate-800/60 border-l-2 border-violet-500/50 rounded-r-xl">
                <p className="text-xs text-slate-300 italic">"{e.insight}"</p>
                <p className="text-[10px] text-slate-600 mt-1">{e.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm mb-4">Start logging triggers to build emotional self-awareness.</p>
          <button onClick={() => { setForm(defaultForm()); setShowForm(true) }} className="px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
            Log Your First Trigger
          </button>
        </div>
      )}
    </div>
  )
}

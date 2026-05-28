import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, Save, CheckCircle, Circle, Flag, TrendingUp, Target, Zap, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ActionItem {
  id: string
  text: string
  done: boolean
  dueDate: string
}

interface RetroEntry {
  id: string
  weekStart: string
  wentWell: string[]
  didntGo: string[]
  different: string[]
  actionItems: ActionItem[]
  energyLevel: 1 | 2 | 3 | 4 | 5
  focusScore: 1 | 2 | 3 | 4 | 5
  productivityScore: 1 | 2 | 3 | 4 | 5
  weekRating: number
  notes: string
}

const STORAGE_KEY = 'weekly_retro_log'

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(d)} – ${fmt(end)}`
}

function ratingColor(r: number, max = 10): string {
  const pct = r / max
  if (pct >= 0.7) return '#22c55e'
  if (pct >= 0.5) return '#eab308'
  return '#ef4444'
}

const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6']

function StarRating({
  value,
  max = 5,
  onChange,
}: {
  value: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          onClick={() => onChange(star as 1 | 2 | 3 | 4 | 5)}
          className="transition-transform hover:scale-110"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: star <= value ? STAR_COLORS[star - 1] + '33' : '#1e293b',
              border: `1px solid ${star <= value ? STAR_COLORS[star - 1] : '#334155'}`,
              color: star <= value ? STAR_COLORS[star - 1] : '#475569',
            }}
          >
            {star}
          </div>
        </button>
      ))}
    </div>
  )
}

// Small SVG trend chart for weekRating
function WeekRatingTrend({ entries }: { entries: RetroEntry[] }) {
  const last8 = [...entries].slice(0, 8).reverse()
  if (last8.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
        Log at least 2 weeks to see trend
      </div>
    )
  }

  const W = 300
  const H = 60
  const pad = { top: 8, bottom: 14, left: 6, right: 6 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const ratings = last8.map(e => e.weekRating)
  const minR = Math.max(0, Math.min(...ratings) - 1)
  const maxR = Math.min(10, Math.max(...ratings) + 1)

  const xFor = (i: number) => pad.left + (i / (last8.length - 1)) * chartW
  const yFor = (v: number) => pad.top + chartH - ((v - minR) / (maxR - minR)) * chartH

  const polyPoints = ratings.map((r, i) => `${xFor(i)},${yFor(r)}`).join(' ')
  const areaPoints = [
    `${xFor(0)},${H - pad.bottom}`,
    ...ratings.map((r, i) => `${xFor(i)},${yFor(r)}`),
    `${xFor(ratings.length - 1)},${H - pad.bottom}`,
  ].join(' ')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polygon points={areaPoints} fill="rgba(139,92,246,0.12)" />
      <polyline
        points={polyPoints}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {ratings.map((r, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(r)} r={3} fill="#8b5cf6" />
      ))}
      {last8.map((e, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={H - 1}
          textAnchor="middle"
          fontSize={7}
          fill="#475569"
        >
          {e.weekStart.slice(5).replace('-', '/')}
        </text>
      ))}
    </svg>
  )
}

const DEFAULT_FORM: Omit<RetroEntry, 'id'> = {
  weekStart: '',
  wentWell: [],
  didntGo: [],
  different: [],
  actionItems: [],
  energyLevel: 3,
  focusScore: 3,
  productivityScore: 3,
  weekRating: 7,
  notes: '',
}

type ListKey = 'wentWell' | 'didntGo' | 'different'

const LIST_SECTIONS: { key: ListKey; label: string; emoji: string; color: string }[] = [
  { key: 'wentWell', label: 'What went well?', emoji: '✅', color: '#22c55e' },
  { key: 'didntGo', label: "What didn't go well?", emoji: '⚠️', color: '#f97316' },
  { key: 'different', label: 'What will I do differently?', emoji: '🔄', color: '#8b5cf6' },
]

export default function WeeklyRetrospective() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RetroEntry[]>([])
  const [form, setForm] = useState<Omit<RetroEntry, 'id'>>({ ...DEFAULT_FORM })
  const [listInputs, setListInputs] = useState<Record<ListKey, string>>({
    wentWell: '', didntGo: '', different: '',
  })
  const [actionInput, setActionInput] = useState('')
  const [actionDue, setActionDue] = useState('')

  const thisWeek = getMondayOfWeek(new Date())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: RetroEntry[] = raw ? JSON.parse(raw) : []
      setEntries(parsed)
      const thisEntry = parsed.find(e => e.weekStart === thisWeek)
      if (thisEntry) {
        const { id: _id, ...rest } = thisEntry
        setForm(rest)
      } else {
        setForm({ ...DEFAULT_FORM, weekStart: thisWeek })
      }
    } catch { /**/ }
  }, [thisWeek])

  const persist = (updated: RetroEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addListItem = (key: ListKey) => {
    const val = listInputs[key].trim()
    if (!val) return
    setForm(f => ({ ...f, [key]: [...f[key], val] }))
    setListInputs(l => ({ ...l, [key]: '' }))
  }

  const removeListItem = (key: ListKey, idx: number) => {
    setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }))
  }

  const addActionItem = () => {
    if (!actionInput.trim()) return
    const item: ActionItem = {
      id: Date.now().toString(),
      text: actionInput.trim(),
      done: false,
      dueDate: actionDue,
    }
    setForm(f => ({ ...f, actionItems: [...f.actionItems, item] }))
    setActionInput('')
    setActionDue('')
  }

  const removeActionItem = (id: string) => {
    setForm(f => ({ ...f, actionItems: f.actionItems.filter(a => a.id !== id) }))
  }

  const handleSave = () => {
    const entry: RetroEntry = {
      id: thisWeek,
      ...form,
      weekStart: thisWeek,
    }
    const without = entries.filter(e => e.weekStart !== thisWeek)
    persist([entry, ...without].sort((a, b) => b.weekStart.localeCompare(a.weekStart)))
    toastSuccess('Retrospective saved!', `Week of ${formatWeek(thisWeek)}`)
  }

  // Collect all open action items across all entries + current form
  const savedEntry = entries.find(e => e.weekStart === thisWeek)
  const allEntries: RetroEntry[] = savedEntry
    ? entries
    : [{ id: thisWeek, ...form, weekStart: thisWeek }, ...entries]

  const openActions = allEntries
    .flatMap(e =>
      e.actionItems
        .filter(a => !a.done)
        .map(a => ({ ...a, weekStart: e.weekStart, entryId: e.id }))
    )
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })

  const markActionDone = (entryId: string, actionId: string) => {
    const updated = entries.map(e => {
      if (e.id !== entryId) return e
      return {
        ...e,
        actionItems: e.actionItems.map(a =>
          a.id === actionId ? { ...a, done: true } : a
        ),
      }
    })
    persist(updated)
    // Also update form if it's the current week
    if (entryId === thisWeek) {
      setForm(f => ({
        ...f,
        actionItems: f.actionItems.map(a =>
          a.id === actionId ? { ...a, done: true } : a
        ),
      }))
    }
  }

  // Stats
  const last4 = entries.slice(0, 4)
  const avgRating =
    last4.length > 0
      ? Math.round((last4.reduce((s, e) => s + e.weekRating, 0) / last4.length) * 10) / 10
      : 0
  const totalActions = entries.reduce((s, e) => s + e.actionItems.length, 0)
  const doneActions = entries.reduce((s, e) => s + e.actionItems.filter(a => a.done).length, 0)
  const donePct = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0

  // Consecutive weeks
  let streak = 0
  const today = getMondayOfWeek(new Date())
  let checkDate = today
  for (let i = 0; i < 52; i++) {
    if (entries.some(e => e.weekStart === checkDate)) {
      streak++
      const d = new Date(checkDate + 'T12:00:00')
      d.setDate(d.getDate() - 7)
      checkDate = getMondayOfWeek(d)
    } else {
      break
    }
  }

  const recentEntries = entries.slice(0, 4)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <RefreshCw className="w-7 h-7 text-violet-400" />
            Weekly Retrospective
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Review your week, spot patterns, commit to actions
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="game-card p-3 text-center">
          <div
            className="text-xl font-bold"
            style={{ color: ratingColor(avgRating), fontFamily: 'Orbitron, monospace' }}
          >
            {avgRating || '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Rating</div>
          <div className="text-xs text-slate-600">last 4 wks</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalActions}
          </div>
          <div className="text-xs text-slate-500">Total Actions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div
            className="text-xl font-bold"
            style={{
              color: ratingColor(donePct, 100),
              fontFamily: 'Orbitron, monospace',
            }}
          >
            {donePct}%
          </div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {streak}
          </div>
          <div className="text-xs text-slate-500">Wk Streak</div>
        </div>
      </div>

      {/* Retro Form */}
      <div className="game-card p-5 space-y-5 border border-violet-500/20">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-violet-400" />
          Week of {formatWeek(thisWeek)}
        </h3>

        {/* List sections */}
        {LIST_SECTIONS.map(section => (
          <div key={section.key} className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: section.color }}
            >
              {section.emoji} {section.label}
            </label>
            <div className="flex gap-2">
              <input
                value={listInputs[section.key]}
                onChange={e =>
                  setListInputs(l => ({ ...l, [section.key]: e.target.value }))
                }
                onKeyDown={e => {
                  if (e.key === 'Enter') addListItem(section.key)
                }}
                placeholder={`Add item…`}
                className="game-input flex-1 text-sm"
              />
              <button
                onClick={() => addListItem(section.key)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: section.color + '22',
                  color: section.color,
                  border: `1px solid ${section.color}44`,
                }}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {form[section.key].length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form[section.key].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      background: section.color + '18',
                      border: `1px solid ${section.color}33`,
                      color: section.color,
                    }}
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => removeListItem(section.key, idx)}
                      className="hover:opacity-70 transition-opacity ml-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Action items */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-blue-400 flex items-center gap-1">
            <Target className="w-3 h-3" /> Action Items
          </label>
          <div className="flex gap-2">
            <input
              value={actionInput}
              onChange={e => setActionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addActionItem() }}
              placeholder="Action item…"
              className="game-input flex-1 text-sm"
            />
            <input
              type="date"
              value={actionDue}
              onChange={e => setActionDue(e.target.value)}
              className="game-input text-sm w-36"
            />
            <button
              onClick={addActionItem}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-700/30 hover:bg-blue-700/50 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.actionItems.length > 0 && (
            <div className="space-y-1.5">
              {form.actionItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-slate-700/40"
                >
                  {item.done ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-slate-300">{item.text}</span>
                  {item.dueDate && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {item.dueDate}
                    </span>
                  )}
                  <button
                    onClick={() => removeActionItem(item.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className="space-y-3 pt-2 border-t border-slate-700">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" /> Energy Level
              </label>
              <StarRating
                value={form.energyLevel}
                onChange={v => setForm(f => ({ ...f, energyLevel: v as 1 | 2 | 3 | 4 | 5 }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" /> Focus Score
              </label>
              <StarRating
                value={form.focusScore}
                onChange={v => setForm(f => ({ ...f, focusScore: v as 1 | 2 | 3 | 4 | 5 }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" /> Productivity
              </label>
              <StarRating
                value={form.productivityScore}
                onChange={v =>
                  setForm(f => ({ ...f, productivityScore: v as 1 | 2 | 3 | 4 | 5 }))
                }
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Week Rating</label>
              <span
                className="text-sm font-bold"
                style={{ color: ratingColor(form.weekRating) }}
              >
                {form.weekRating}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={form.weekRating}
              onChange={e => setForm(f => ({ ...f, weekRating: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Additional notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any other thoughts on this week…"
              className="game-input w-full h-16 resize-none text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Retrospective
        </button>
      </div>

      {/* Open action items dashboard */}
      {openActions.length > 0 && (
        <div className="game-card p-5 space-y-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Open Action Items
            <span className="ml-auto px-2 py-0.5 bg-blue-900/40 text-blue-400 text-xs rounded-full">
              {openActions.length}
            </span>
          </h3>
          <div className="space-y-2">
            {openActions.map(action => (
              <div
                key={`${action.entryId}-${action.id}`}
                className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-700/40"
              >
                <button
                  onClick={() => markActionDone(action.entryId, action.id)}
                  className="text-slate-500 hover:text-green-400 transition-colors flex-shrink-0"
                  title="Mark done"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <span className="flex-1 text-sm text-slate-300">{action.text}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {action.dueDate && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {action.dueDate}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">{formatWeek(action.weekStart).split('–')[0].trim()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {entries.length > 1 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Week Rating Trend
          </h3>
          <WeekRatingTrend entries={entries} />
        </div>
      )}

      {/* Recent retros */}
      {recentEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Recent Retrospectives
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recentEntries.map(entry => {
              const avg5 = Math.round(
                ((entry.energyLevel + entry.focusScore + entry.productivityScore) / 3) * 10
              ) / 10
              return (
                <div key={entry.id} className="game-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-medium">
                      {formatWeek(entry.weekStart)}
                    </span>
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        color: ratingColor(entry.weekRating),
                        background: ratingColor(entry.weekRating) + '22',
                        fontFamily: 'Orbitron, monospace',
                      }}
                    >
                      {entry.weekRating}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-700/40 rounded-lg py-1.5">
                      <div className="font-bold text-yellow-400">{entry.energyLevel}/5</div>
                      <div className="text-slate-600">Energy</div>
                    </div>
                    <div className="bg-slate-700/40 rounded-lg py-1.5">
                      <div className="font-bold text-blue-400">{entry.focusScore}/5</div>
                      <div className="text-slate-600">Focus</div>
                    </div>
                    <div className="bg-slate-700/40 rounded-lg py-1.5">
                      <div className="font-bold text-green-400">{entry.productivityScore}/5</div>
                      <div className="text-slate-600">Prod.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {entry.wentWell.length} went well
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-violet-400" />
                      {entry.different.length} changes
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-blue-400" />
                      {entry.actionItems.length} actions
                    </span>
                  </div>
                  {avg5 !== (entry.energyLevel + entry.focusScore + entry.productivityScore) / 3 && null}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Complete your first retrospective to start seeing patterns.</p>
        </div>
      )}
    </div>
  )
}

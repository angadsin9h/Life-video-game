import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Plus, Trash2, CheckCircle2, Circle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeBlock {
  id: number
  date: string
  hour: number
  title: string
  category: string
  duration_hours: number
  color: string
  completed: number
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6am – 11pm
const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

const BLOCK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  violet: { bg: 'bg-violet-600/30', border: 'border-violet-500/60', text: 'text-violet-300' },
  cyan:   { bg: 'bg-cyan-600/30',   border: 'border-cyan-500/60',   text: 'text-cyan-300'   },
  green:  { bg: 'bg-green-600/30',  border: 'border-green-500/60',  text: 'text-green-300'  },
  orange: { bg: 'bg-orange-600/30', border: 'border-orange-500/60', text: 'text-orange-300' },
  red:    { bg: 'bg-red-600/30',    border: 'border-red-500/60',    text: 'text-red-300'    },
  yellow: { bg: 'bg-yellow-600/30', border: 'border-yellow-500/60', text: 'text-yellow-300' },
}

const CAT_COLOR: Record<string, string> = { health: 'green', mind: 'cyan', work: 'violet', social: 'yellow', growth: 'orange' }

function formatHour(h: number) {
  if (h === 0 || h === 24) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function Planner() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [addingHour, setAddingHour] = useState<number | null>(null)
  const [draft, setDraft] = useState({ title: '', category: 'work', duration_hours: 1, color: 'violet' })
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async (d = date) => {
    setLoading(true)
    try {
      const res = await axios.get<TimeBlock[]>(`/api/planner/${d}`)
      setBlocks(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(date) }, [date])

  useEffect(() => {
    if (addingHour !== null) setTimeout(() => inputRef.current?.focus(), 50)
  }, [addingHour])

  const openAdd = (hour: number) => {
    if (blocks.some(b => b.hour === hour)) return
    const currentHour = new Date().getHours()
    const autoCategory = currentHour < 9 ? 'health' : currentHour < 17 ? 'work' : 'growth'
    setDraft({ title: '', category: autoCategory, duration_hours: 1, color: CAT_COLOR[autoCategory] })
    setAddingHour(hour)
  }

  const save = async () => {
    if (!draft.title.trim() || addingHour === null) return
    setSaving(true)
    try {
      await axios.post('/api/planner', { date, hour: addingHour, ...draft })
      setAddingHour(null)
      load(date)
    } finally { setSaving(false) }
  }

  const toggleComplete = async (block: TimeBlock) => {
    await axios.patch(`/api/planner/${block.id}/complete`, {})
    load(date)
  }

  const deleteBlock = async (id: number) => {
    await axios.delete(`/api/planner/${id}`)
    load(date)
  }

  const blockMap = new Map(blocks.map(b => [b.hour, b]))
  const completedCount = blocks.filter(b => b.completed).length
  const totalCount = blocks.length
  const isToday = date === today

  const dateLabel = isToday
    ? 'Today'
    : date === offsetDate(today, 1)
    ? 'Tomorrow'
    : date === offsetDate(today, -1)
    ? 'Yesterday'
    : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CalendarDays className="w-8 h-8 text-cyan-400" />
            Day Planner
          </h1>
          <p className="text-slate-400 mt-1">Time-block your day, own every hour</p>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {completedCount}/{totalCount}
            </div>
            <div className="text-xs text-slate-500">complete</div>
          </div>
        )}
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => setDate(d => offsetDate(d, -1))} className="game-btn-secondary p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-slate-200">{dateLabel}</div>
          <div className="text-xs text-slate-500">{date}</div>
        </div>
        <button onClick={() => setDate(d => offsetDate(d, 1))} className="game-btn-secondary p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
        {date !== today && (
          <button onClick={() => setDate(today)} className="game-btn-secondary text-xs px-3 py-2">Today</button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div>
          <div className="stat-bar h-2">
            <div className="stat-bar-fill bar-mind transition-all duration-500" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </div>
          <div className="text-xs text-slate-500 mt-1 text-center">
            {completedCount === totalCount ? '🎉 Perfect day planned and executed!' : `${totalCount - completedCount} block${totalCount - completedCount !== 1 ? 's' : ''} remaining`}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="game-card overflow-hidden">
        {loading ? (
          <div className="animate-pulse space-y-px">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-slate-800" />)}
          </div>
        ) : (
          <div>
            {HOURS.map(hour => {
              const block = blockMap.get(hour)
              const isCurrentHour = isToday && new Date().getHours() === hour
              const isAdding = addingHour === hour

              return (
                <div
                  key={hour}
                  className={`flex border-b border-slate-800 last:border-0 min-h-[56px] transition-all ${
                    isCurrentHour ? 'bg-violet-900/10' : ''
                  }`}
                >
                  {/* Hour label */}
                  <div className={`w-16 flex-shrink-0 flex items-start justify-end pr-3 pt-3 text-xs font-mono ${
                    isCurrentHour ? 'text-violet-400 font-bold' : 'text-slate-600'
                  }`}>
                    {formatHour(hour)}
                    {isCurrentHour && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block mt-1" />}
                  </div>

                  {/* Block area */}
                  <div className="flex-1 p-1.5">
                    {isAdding ? (
                      <div className="bg-slate-800 border border-violet-500/50 rounded-lg p-3 space-y-2">
                        <input
                          ref={inputRef}
                          type="text"
                          className="game-input w-full text-sm py-1.5"
                          placeholder="What are you doing at this hour?"
                          value={draft.title}
                          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setAddingHour(null) }}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {CATEGORIES.map(c => (
                            <button
                              key={c}
                              onClick={() => setDraft(d => ({ ...d, category: c, color: CAT_COLOR[c] }))}
                              className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                                draft.category === c
                                  ? 'bg-violet-600/30 border-violet-500/60 text-violet-300'
                                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {CAT_ICONS[c]} {c}
                            </button>
                          ))}
                          <select
                            className="game-input text-xs py-1 px-2 ml-auto"
                            value={draft.duration_hours}
                            onChange={e => setDraft(d => ({ ...d, duration_hours: parseInt(e.target.value) }))}
                          >
                            {[1, 2, 3].map(n => <option key={n} value={n}>{n}h</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={save} disabled={saving || !draft.title.trim()} className="game-btn-primary text-xs flex-1 py-1.5">
                            {saving ? 'Saving…' : 'Add Block'}
                          </button>
                          <button onClick={() => setAddingHour(null)} className="game-btn-secondary text-xs px-3 py-1.5">✕</button>
                        </div>
                      </div>
                    ) : block ? (
                      <div
                        className={`flex items-center gap-2 p-2.5 rounded-lg border ${BLOCK_COLORS[block.color]?.bg ?? 'bg-violet-600/30'} ${BLOCK_COLORS[block.color]?.border ?? 'border-violet-500/60'} ${block.completed ? 'opacity-50' : ''} group transition-all`}
                        style={{ minHeight: `${block.duration_hours * 56 - 12}px` }}
                      >
                        <button onClick={() => toggleComplete(block)} className="flex-shrink-0">
                          {block.completed
                            ? <CheckCircle2 className={`w-4 h-4 ${BLOCK_COLORS[block.color]?.text ?? 'text-violet-300'}`} />
                            : <Circle className="w-4 h-4 text-slate-500 hover:text-violet-400" />
                          }
                        </button>
                        <span className="text-sm flex-shrink-0">{CAT_ICONS[block.category]}</span>
                        <span className={`text-sm flex-1 font-medium ${block.completed ? 'line-through text-slate-500' : BLOCK_COLORS[block.color]?.text ?? 'text-violet-300'}`}>
                          {block.title}
                        </span>
                        <span className="text-xs text-slate-600 flex-shrink-0">{block.duration_hours}h</span>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAdd(hour)}
                        className="w-full h-10 flex items-center justify-center text-slate-700 hover:text-slate-500 hover:bg-slate-800 rounded-lg transition-all group text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        <span className="opacity-0 group-hover:opacity-100">Add block</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {blocks.length === 0 && !loading && (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">Click any hour slot to time-block your day.</p>
          <p className="text-xs mt-1">Planned days score higher — intention is power.</p>
        </div>
      )}
    </div>
  )
}

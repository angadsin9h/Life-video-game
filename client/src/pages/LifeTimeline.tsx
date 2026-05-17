import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Filter, Clock, Star, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface TimelineEvent {
  id: string
  title: string
  date: string
  category: string
  description: string
  impact: number
  createdAt: string
}

const CATEGORIES = [
  'Career', 'Education', 'Health', 'Relationships', 'Travel',
  'Personal Growth', 'Finance', 'Other',
]

const CATEGORY_COLORS: Record<string, { dot: string; badge: string; line: string }> = {
  'Career':          { dot: 'bg-blue-500',    badge: 'bg-blue-900/60 text-blue-300 border-blue-500/40',    line: 'border-blue-500/40' },
  'Education':       { dot: 'bg-violet-500',  badge: 'bg-violet-900/60 text-violet-300 border-violet-500/40', line: 'border-violet-500/40' },
  'Health':          { dot: 'bg-green-500',   badge: 'bg-green-900/60 text-green-300 border-green-500/40',  line: 'border-green-500/40' },
  'Relationships':   { dot: 'bg-pink-500',    badge: 'bg-pink-900/60 text-pink-300 border-pink-500/40',    line: 'border-pink-500/40' },
  'Travel':          { dot: 'bg-cyan-500',    badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/40',    line: 'border-cyan-500/40' },
  'Personal Growth': { dot: 'bg-amber-500',   badge: 'bg-amber-900/60 text-amber-300 border-amber-500/40', line: 'border-amber-500/40' },
  'Finance':         { dot: 'bg-emerald-500', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40', line: 'border-emerald-500/40' },
  'Other':           { dot: 'bg-slate-400',   badge: 'bg-slate-700/60 text-slate-300 border-slate-500/40', line: 'border-slate-500/40' },
}

const STORAGE_KEY = 'life_timeline'

const EMPTY_FORM = {
  title: '',
  date: '',
  category: 'Career',
  description: '',
  impact: 3,
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getYearsSpanned(events: TimelineEvent[]): number {
  if (events.length < 2) return 0
  const dates = events.map(e => new Date(e.date).getFullYear()).filter(y => !isNaN(y))
  if (dates.length < 2) return 0
  return Math.max(...dates) - Math.min(...dates)
}

function getMostImpactfulCategory(events: TimelineEvent[]): string {
  if (events.length === 0) return '—'
  const totals: Record<string, number> = {}
  for (const e of events) {
    totals[e.category] = (totals[e.category] ?? 0) + e.impact
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

export default function LifeTimeline() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setEvents(JSON.parse(saved))
      } catch {
        setEvents([])
      }
    }
  }, [])

  const save = (updated: TimelineEvent[]) => {
    setEvents(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEvent = () => {
    if (!form.title.trim() || !form.date) return
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      title: form.title.trim(),
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      impact: form.impact,
      createdAt: new Date().toISOString(),
    }
    const updated = [...events, newEvent].sort((a, b) => b.date.localeCompare(a.date))
    save(updated)
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Life event added to your timeline!')
  }

  const deleteEvent = (id: string) => {
    save(events.filter(e => e.id !== id))
    toastSuccess('Event removed from timeline.')
  }

  const filtered = filterCategory === 'All'
    ? events
    : events.filter(e => e.category === filterCategory)

  const yearsSpanned = getYearsSpanned(events)
  const mostImpactful = getMostImpactfulCategory(events)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Life Timeline
          </h1>
          <p className="text-slate-400 mt-1">Chronicle the milestones that shaped you</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(f => !f)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {events.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total Events</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {yearsSpanned}
          </div>
          <div className="text-xs text-slate-400 mt-1">Years Spanned</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-sm font-bold text-amber-400 truncate" style={{ fontFamily: 'Orbitron, monospace' }}>
            {mostImpactful}
          </div>
          <div className="text-xs text-slate-400 mt-1">Top Category</div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400 mr-1">Category:</span>
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  filterCategory === cat
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Form */}
      {showForm && (
        <div className="game-card p-5 border border-violet-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">New Life Event</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Title *</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. Started my first job"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date *</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  className="game-input w-full"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Impact Score: {form.impact}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.impact}
                  onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
                  className="w-full accent-violet-500 mt-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                className="game-input w-full resize-none"
                rows={3}
                placeholder="What happened? Why does it matter?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEvent}
                disabled={!form.title.trim() || !form.date}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                Add to Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="game-card p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Your timeline is empty</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {filterCategory !== 'All'
              ? `No events in "${filterCategory}" yet. Try a different filter or add a new event.`
              : 'Start by adding a life milestone — a new job, a move, a relationship, anything that shaped who you are.'}
          </p>
          {filterCategory === 'All' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
            >
              Add your first event
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700" />

          <div className="space-y-6">
            {filtered.map((event, idx) => {
              const colors = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS['Other']
              return (
                <div key={event.id} className="relative flex gap-6">
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 flex items-start pt-4">
                    <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center ${colors.dot} shadow-lg`}>
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`game-card p-4 flex-1 border ${colors.line}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                            {event.category}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{event.description}</p>
                        )}
                        {/* Impact stars */}
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= event.impact ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                            />
                          ))}
                          <span className="text-xs text-slate-500 ml-1">Impact</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

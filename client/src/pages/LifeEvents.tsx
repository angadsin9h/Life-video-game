import { useEffect, useState } from 'react'
import { Calendar, Plus, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LifeEvent {
  id: string
  date: string
  title: string
  description: string
  type: 'milestone' | 'memory' | 'turning-point' | 'achievement' | 'loss' | 'start' | 'end' | 'adventure'
  impact: 1 | 2 | 3 | 4 | 5
  tags: string[]
  photo?: string
}

const EVENT_TYPES = [
  { value: 'milestone', label: 'Milestone', emoji: '🏆', color: '#eab308' },
  { value: 'memory', label: 'Memory', emoji: '📸', color: '#3b82f6' },
  { value: 'turning-point', label: 'Turning Point', emoji: '🔄', color: '#f97316' },
  { value: 'achievement', label: 'Achievement', emoji: '⭐', color: '#22c55e' },
  { value: 'loss', label: 'Loss/Ending', emoji: '💔', color: '#ef4444' },
  { value: 'start', label: 'New Beginning', emoji: '🌱', color: '#22c55e' },
  { value: 'end', label: 'Chapter End', emoji: '📖', color: '#64748b' },
  { value: 'adventure', label: 'Adventure', emoji: '🗺️', color: '#8b5cf6' },
]

const STORAGE_KEY = 'life_events'

export default function LifeEvents() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', description: '', type: 'milestone' as LifeEvent['type'], impact: 3 as LifeEvent['impact'], tags: '' })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEvents(JSON.parse(saved))
  }, [])

  const persist = (updated: LifeEvent[]) => {
    setEvents(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEvent = () => {
    if (!form.title.trim()) return
    const e: LifeEvent = {
      id: Date.now().toString(),
      date: form.date,
      title: form.title,
      description: form.description,
      type: form.type,
      impact: form.impact,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    persist([e, ...events])
    setForm({ date: new Date().toISOString().split('T')[0], title: '', description: '', type: 'milestone', impact: 3, tags: '' })
    setShowForm(false)
    toastSuccess('Life event recorded!')
  }

  const deleteEvent = (id: string) => persist(events.filter(e => e.id !== id))

  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date))
  const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a)

  const filtered = sorted.filter(e => {
    const year = new Date(e.date).getFullYear()
    if (year !== selectedYear) return false
    if (filterType !== 'all' && e.type !== filterType) return false
    return true
  })

  // Group by month
  const byMonth: Record<string, LifeEvent[]> = {}
  filtered.forEach(e => {
    const month = e.date.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(e)
  })

  const impactColor = (impact: number) => ['', '#64748b', '#3b82f6', '#eab308', '#f97316', '#ef4444'][impact]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Calendar className="w-7 h-7 text-blue-400" />
            Life Events
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chronicle the moments that shaped you</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Year nav */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 text-slate-500 hover:text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-xl font-bold text-white">{selectedYear}</div>
        <button onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= new Date().getFullYear()} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterType === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {EVENT_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(filterType === t.value ? 'all' : t.value)}
            className="px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
            style={filterType === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#64748b' }}>
            {t.emoji}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-300">Record Life Event</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Event title" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what happened, how you felt, why it mattered..." className="game-input w-full h-24 resize-none" />
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value as LifeEvent['type'] }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.type === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Impact: {form.impact}/5</label>
              <input type="range" min="1" max="5" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: +e.target.value as LifeEvent['impact'] }))}
                className="w-full accent-blue-400 mt-2" />
            </div>
          </div>
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma separated)" className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={addEvent} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Event
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {Object.keys(byMonth).sort().reverse().map(month => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {new Date(month + '-15').toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="space-y-3 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800" />
            {byMonth[month].map(e => {
              const t = EVENT_TYPES.find(et => et.value === e.type)
              return (
                <div key={e.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-1"
                    style={{ background: t?.color + '22', border: `2px solid ${t?.color || '#64748b'}` }}>
                    <span className="text-xs">{t?.emoji}</span>
                  </div>
                  <div className="game-card p-4 flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white text-sm">{e.title}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{e.date}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className="w-2.5 h-2.5" style={{ color: i < e.impact ? impactColor(e.impact) : '#1e293b', fill: i < e.impact ? impactColor(e.impact) : 'transparent' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(e.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {e.description && <p className="text-sm text-slate-400">{e.description}</p>}
                    {e.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {e.tags.map(tag => <span key={tag} className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No events for {selectedYear}.</p>
          <p className="text-sm mb-5">Record the moments that define your story.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Add First Event
          </button>
        </div>
      )}
    </div>
  )
}

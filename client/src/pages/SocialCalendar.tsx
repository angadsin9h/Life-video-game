import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EventType = 'dinner' | 'party' | 'coffee' | 'call' | 'game' | 'outing' | 'celebration' | 'other'
type EventStatus = 'upcoming' | 'done' | 'cancelled'

interface SocialEvent {
  id: string
  date: string
  title: string
  type: EventType
  status: EventStatus
  people: string
  venue: string
  notes: string
  energyBefore: number
  energyAfter: number
  rating: number
  createdAt: string
}

const TYPE_CONFIG: Record<EventType, { label: string; emoji: string; color: string }> = {
  dinner:      { label: 'Dinner',       emoji: '🍽️', color: '#f59e0b' },
  party:       { label: 'Party',        emoji: '🎉', color: '#6366f1' },
  coffee:      { label: 'Coffee',       emoji: '☕', color: '#a855f7' },
  call:        { label: 'Call/Video',   emoji: '📞', color: '#3b82f6' },
  game:        { label: 'Game Night',   emoji: '🎮', color: '#22c55e' },
  outing:      { label: 'Outing',       emoji: '🚶', color: '#f97316' },
  celebration: { label: 'Celebration',  emoji: '🥂', color: '#ec4899' },
  other:       { label: 'Other',        emoji: '👥', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: '#3b82f6' },
  done:      { label: 'Done',      color: '#22c55e' },
  cancelled: { label: 'Cancelled', color: '#94a3b8' },
}

const STORAGE_KEY = 'social_calendar'

export default function SocialCalendar() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<SocialEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState<Omit<SocialEvent, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], title: '', type: 'dinner', status: 'upcoming',
    people: '', venue: '', notes: '', energyBefore: 5, energyAfter: 5, rating: 0,
  })

  useEffect(() => {
    try { setEvents(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SocialEvent[]) => { setEvents(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: SocialEvent = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...events])
    setForm({ date: new Date().toISOString().split('T')[0], title: '', type: 'dinner', status: 'upcoming', people: '', venue: '', notes: '', energyBefore: 5, energyAfter: 5, rating: 0 })
    setShowForm(false)
    toastSuccess('Social event logged 🎉')
  }

  const upcoming = events.filter(e => e.status === 'upcoming').length
  const thisMonth = events.filter(e => {
    const now = new Date()
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.status === 'done'
  }).length

  const filtered = events.filter(e => filterStatus === 'all' || e.status === filterStatus)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-violet-400" />
            Social Calendar
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your social life and energy levels.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{upcoming}</div>
          <div className="text-xs text-slate-500">Upcoming</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{thisMonth}</div>
          <div className="text-xs text-slate-500">This Month</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{events.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs capitalize ${filterStatus === s ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s as EventStatus].label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Event</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG.dinner][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Event title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <input value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))}
              placeholder="Who's attending?" className="game-input flex-1 text-sm" />
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="Venue / where" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [EventStatus, typeof STATUS_CONFIG.upcoming][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.status === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          {form.status === 'done' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-32">Energy before: {form.energyBefore}/10</span>
                <input type="range" min={1} max={10} value={form.energyBefore}
                  onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                  className="flex-1 h-1 accent-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-32">Energy after: {form.energyAfter}/10</span>
                <input type="range" min={1} max={10} value={form.energyAfter}
                  onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                  className="flex-1 h-1 accent-green-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rating:</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={`text-lg ${form.rating >= n ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
                ))}
              </div>
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / how it went" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const s = STATUS_CONFIG[e.status]
          const isExp = expanded === e.id
          const energyDelta = e.energyAfter - e.energyBefore
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{e.date}{e.people && ` · ${e.people}`}</p>
                </div>
                {e.status === 'done' && energyDelta !== 0 && (
                  <span className={`text-xs ${energyDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {energyDelta > 0 ? '+' : ''}{energyDelta} ⚡
                  </span>
                )}
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.venue && <p className="text-xs text-slate-400"><span className="text-slate-500">Venue: </span>{e.venue}</p>}
                  {e.status === 'done' && (
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Energy: {e.energyBefore} → {e.energyAfter}</span>
                      {e.rating > 0 && <span className="text-yellow-400">{'★'.repeat(e.rating)}</span>}
                    </div>
                  )}
                  {e.notes && <p className="text-sm text-slate-300 italic">"{e.notes}"</p>}
                  <div className="flex gap-2">
                    {(Object.entries(STATUS_CONFIG) as [EventStatus, typeof STATUS_CONFIG.upcoming][]).map(([k, st]) => (
                      <button key={k} onClick={() => save(events.map(x => x.id === e.id ? { ...x, status: k } : x))}
                        className={`px-2 py-0.5 rounded-full text-xs ${e.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                        style={e.status === k ? { background: st.color + '30', color: st.color } : {}}>
                        {st.label}
                      </button>
                    ))}
                    <button onClick={() => save(events.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start tracking your social life and how it affects your energy.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TripStatus = 'dreaming' | 'planning' | 'booked' | 'completed'
type TripType = 'solo' | 'couple' | 'family' | 'friends' | 'work'

interface Trip {
  id: string
  destination: string
  country: string
  status: TripStatus
  type: TripType
  startDate: string
  endDate: string
  budget: number
  spent: number
  notes: string
  highlights: string
  rating: number
  accommodation: string
  checklist: string[]
  createdAt: string
}

const STATUS_CONFIG: Record<TripStatus, { label: string; emoji: string; color: string }> = {
  dreaming:  { label: 'Dreaming',  emoji: '💭', color: '#a855f7' },
  planning:  { label: 'Planning',  emoji: '📋', color: '#3b82f6' },
  booked:    { label: 'Booked!',   emoji: '✈️', color: '#f59e0b' },
  completed: { label: 'Visited!',  emoji: '✅', color: '#22c55e' },
}

const TYPE_CONFIG: Record<TripType, { label: string; emoji: string }> = {
  solo:   { label: 'Solo',   emoji: '🎒' },
  couple: { label: 'Couple', emoji: '💑' },
  family: { label: 'Family', emoji: '👨‍👩‍👧' },
  friends:{ label: 'Friends',emoji: '👫' },
  work:   { label: 'Work',   emoji: '💼' },
}

const STORAGE_KEY = 'travel_planner'

export default function TravelPlanner() {
  const { toastSuccess } = useToast()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [form, setForm] = useState<Omit<Trip, 'id' | 'createdAt'>>({
    destination: '', country: '', status: 'dreaming', type: 'solo',
    startDate: '', endDate: '', budget: 0, spent: 0,
    notes: '', highlights: '', rating: 0, accommodation: '', checklist: [],
  })

  useEffect(() => {
    try { setTrips(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Trip[]) => { setTrips(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    setForm(f => ({ ...f, checklist: [...f.checklist, newChecklistItem.trim()] }))
    setNewChecklistItem('')
  }

  const submit = () => {
    if (!form.destination.trim()) return
    const t: Trip = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([t, ...trips])
    setForm({ destination: '', country: '', status: 'dreaming', type: 'solo', startDate: '', endDate: '', budget: 0, spent: 0, notes: '', highlights: '', rating: 0, accommodation: '', checklist: [] })
    setShowForm(false)
    toastSuccess('Trip saved ✈️')
  }

  const filtered = trips.filter(t => filterStatus === 'all' || t.status === filterStatus)
  const visited = trips.filter(t => t.status === 'completed').length
  const dreaming = trips.filter(t => t.status === 'dreaming').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-sky-400" />
            Travel Planner
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan trips, track adventures, fulfill wanderlust.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{visited}</div>
          <div className="text-xs text-slate-500">Visited</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{dreaming}</div>
          <div className="text-xs text-slate-500">On Wishlist</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{trips.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === 'all' ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(STATUS_CONFIG) as [TripStatus, typeof STATUS_CONFIG.dreaming][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterStatus === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterStatus === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-sky-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Trip</h3>
          <div className="flex gap-2">
            <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              placeholder="Destination *" className="game-input flex-1" autoFocus />
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              placeholder="Country" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TripStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [TripStatus, typeof STATUS_CONFIG.dreaming][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TripType }))} className="game-input text-sm">
              {(Object.entries(TYPE_CONFIG) as [TripType, typeof TYPE_CONFIG.solo][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="game-input text-sm flex-1" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <input type="number" value={form.budget || ''} min={0}
              onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
              placeholder="Budget $" className="game-input flex-1 text-sm" />
            <input value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value }))}
              placeholder="Accommodation" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Plans, ideas, must-dos..." className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
              placeholder="Add checklist item..." className="game-input flex-1 text-sm"
              onKeyDown={e => e.key === 'Enter' && addChecklistItem()} />
            <button onClick={addChecklistItem} className="px-3 py-1.5 bg-sky-700/30 text-sky-400 rounded-xl text-xs">Add</button>
          </div>
          {form.checklist.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {form.checklist.map((item, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded cursor-pointer"
                  onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, j) => j !== i) }))}>
                  {item} ×
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(t => {
          const s = STATUS_CONFIG[t.status]
          const tp = TYPE_CONFIG[t.type]
          const isExp = expanded === t.id
          return (
            <div key={t.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{t.destination}</span>
                    {t.country && <span className="text-xs text-slate-500">{t.country}</span>}
                    <span className="text-xs">{tp.emoji}</span>
                  </div>
                  <p className="text-xs text-slate-500">{s.label}{t.startDate && ` · ${t.startDate}`}{t.budget > 0 && ` · $${t.budget}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {t.notes && <p className="text-xs text-slate-300">{t.notes}</p>}
                  {t.checklist.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Checklist:</p>
                      {t.checklist.map((item, i) => (
                        <p key={i} className="text-xs text-slate-400">• {item}</p>
                      ))}
                    </div>
                  )}
                  {t.highlights && <p className="text-xs text-yellow-300">⭐ {t.highlights}</p>}
                  {t.status !== 'completed' && (
                    <button onClick={() => { save(trips.map(x => x.id === t.id ? { ...x, status: 'completed' } : x)); toastSuccess('Trip completed! 🌍') }}
                      className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                      <Check className="w-3 h-3" /> Mark as visited
                    </button>
                  )}
                  <button onClick={() => save(trips.filter(x => x.id !== t.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The world is waiting. Start planning your next adventure.</p>
          </div>
        )}
      </div>
    </div>
  )
}

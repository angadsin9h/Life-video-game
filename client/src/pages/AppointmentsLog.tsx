import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AppointmentType = 'doctor' | 'dentist' | 'specialist' | 'therapy' | 'financial' | 'legal' | 'beauty' | 'vet' | 'service' | 'other'
type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled'

interface Appointment {
  id: string
  date: string
  time: string
  title: string
  type: AppointmentType
  provider: string
  location: string
  status: AppointmentStatus
  notes: string
  followUp: string
  cost: number
  insuranceCovered: boolean
  nextDate: string
  createdAt: string
}

const TYPE_CONFIG: Record<AppointmentType, { label: string; emoji: string; color: string }> = {
  doctor:     { label: 'Doctor',          emoji: '👨‍⚕️', color: '#ef4444' },
  dentist:    { label: 'Dentist',         emoji: '🦷', color: '#3b82f6' },
  specialist: { label: 'Specialist',      emoji: '🏥', color: '#f97316' },
  therapy:    { label: 'Therapy',         emoji: '🧠', color: '#a855f7' },
  financial:  { label: 'Financial',       emoji: '💰', color: '#22c55e' },
  legal:      { label: 'Legal',           emoji: '⚖️', color: '#6366f1' },
  beauty:     { label: 'Beauty/Wellness', emoji: '💆', color: '#ec4899' },
  vet:        { label: 'Vet',             emoji: '🐾', color: '#f59e0b' },
  service:    { label: 'Service',         emoji: '🔧', color: '#94a3b8' },
  other:      { label: 'Other',           emoji: '📅', color: '#64748b' },
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  upcoming:    { label: 'Upcoming',    color: '#3b82f6' },
  completed:   { label: 'Completed',   color: '#22c55e' },
  cancelled:   { label: 'Cancelled',   color: '#94a3b8' },
  rescheduled: { label: 'Rescheduled', color: '#f59e0b' },
}

const STORAGE_KEY = 'appointments_log'

export default function AppointmentsLog() {
  const { toastSuccess } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('upcoming')
  const [form, setForm] = useState<Omit<Appointment, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], time: '', title: '', type: 'doctor',
    provider: '', location: '', status: 'upcoming', notes: '', followUp: '',
    cost: 0, insuranceCovered: false, nextDate: '',
  })

  useEffect(() => {
    try { setAppointments(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Appointment[]) => { setAppointments(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.date) return
    const a: Appointment = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([a, ...appointments])
    setForm({ date: new Date().toISOString().split('T')[0], time: '', title: '', type: 'doctor', provider: '', location: '', status: 'upcoming', notes: '', followUp: '', cost: 0, insuranceCovered: false, nextDate: '' })
    setShowForm(false)
    toastSuccess('Appointment saved 📅')
  }

  const upcoming = appointments.filter(a => a.status === 'upcoming')
  const filtered = appointments.filter(a => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) => a.date.localeCompare(b.date))

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = upcoming.filter(a => a.date === today)
  const soon = upcoming.filter(a => {
    const diff = (new Date(a.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 7
  })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CalendarDays className="w-7 h-7 text-blue-400" />
            Appointments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track all your appointments in one place.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {todayAppts.length > 0 && (
        <div className="game-card p-3 border border-blue-500/30 bg-blue-500/5">
          <p className="text-sm font-medium text-blue-400 mb-1">📌 Today's appointments:</p>
          {todayAppts.map(a => {
            const t = TYPE_CONFIG[a.type]
            return (
              <p key={a.id} className="text-xs text-slate-300">{t.emoji} {a.time && a.time + ' — '}{a.title}{a.provider && ` · ${a.provider}`}</p>
            )
          })}
        </div>
      )}

      {soon.length > 0 && todayAppts.length === 0 && (
        <div className="game-card p-3 border border-yellow-500/20">
          <p className="text-xs text-yellow-400">{soon[0].date}: {TYPE_CONFIG[soon[0].type].emoji} {soon[0].title}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{upcoming.length}</div>
          <div className="text-xs text-slate-500">Upcoming</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{appointments.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">${appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.cost, 0)}</div>
          <div className="text-xs text-slate-500">Spent</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap capitalize ${filterStatus === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s as AppointmentStatus].label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Appointment</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AppointmentType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [AppointmentType, typeof TYPE_CONFIG.doctor][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title / reason *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              placeholder="Provider / doctor name" className="game-input flex-1 text-sm" />
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Location" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <input type="number" value={form.cost || ''} min={0}
              onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
              placeholder="Cost $" className="game-input w-24 text-sm" />
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.insuranceCovered} onChange={e => setForm(f => ({ ...f, insuranceCovered: e.target.checked }))} className="accent-blue-400" />
              Insurance
            </label>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / questions to ask..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(a => {
          const t = TYPE_CONFIG[a.type]
          const s = STATUS_CONFIG[a.status]
          const isExp = expanded === a.id
          return (
            <div key={a.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{a.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{a.date}{a.time && ` at ${a.time}`}{a.provider && ` · ${a.provider}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {a.location && <p className="text-xs text-slate-400">📍 {a.location}</p>}
                  {a.notes && <p className="text-xs text-slate-400">{a.notes}</p>}
                  {a.followUp && <p className="text-xs text-teal-400">↩️ Follow-up: {a.followUp}</p>}
                  {a.cost > 0 && <p className="text-xs text-slate-500">${a.cost}{a.insuranceCovered && ' (insured)'}</p>}
                  <div className="flex gap-2">
                    {a.status === 'upcoming' && (
                      <button onClick={() => save(appointments.map(x => x.id === a.id ? { ...x, status: 'completed' } : x))}
                        className="flex-1 py-1.5 bg-green-700/20 text-green-400 rounded-xl text-xs hover:bg-green-700/40">
                        Mark Complete
                      </button>
                    )}
                    <button onClick={() => save(appointments.filter(x => x.id !== a.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track appointments across health, finance, and more.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Users, Plus, Trash2, X, MessageCircle, Heart, AlertCircle, Check, Star, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Relationship {
  id: number
  name: string
  category: string
  emoji: string
  notes: string | null
  birthday: string | null
  contact_frequency: number
  importance: number
  lastContact: string | null
  overdueDays: number
  daysSince: number | null
  isBirthdayUpcoming: number | null
}

const CATEGORIES = ['family', 'friend', 'colleague', 'mentor', 'romantic', 'acquaintance']
const CAT_COLORS: Record<string, string> = {
  family: '#ec4899', friend: '#22c55e', colleague: '#8b5cf6',
  mentor: '#eab308', romantic: '#ef4444', acquaintance: '#64748b',
}
const INTERACTION_TYPES = ['talk', 'call', 'coffee', 'lunch', 'message', 'email', 'visit']

const FREQ_OPTIONS = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Bi-weekly' },
  { days: 30, label: 'Monthly' },
  { days: 60, label: 'Every 2 months' },
  { days: 90, label: 'Quarterly' },
  { days: 180, label: 'Twice a year' },
  { days: 365, label: 'Yearly' },
]

function RelCard({ rel, onInteract, onDelete }: {
  rel: Relationship
  onInteract: (id: number, type: string) => void
  onDelete: (id: number) => void
}) {
  const [showInteract, setShowInteract] = useState(false)
  const color = CAT_COLORS[rel.category] || '#64748b'
  const isOverdue = rel.overdueDays > 0
  const isUrgent = rel.overdueDays > 14

  return (
    <div className={`game-card p-4 border-l-4 ${isUrgent ? 'border-l-red-500 bg-red-900/5' : isOverdue ? 'border-l-yellow-500' : 'border-l-green-500 bg-green-900/5'}`}
      style={!isOverdue && !isUrgent ? { borderLeftColor: color } : {}}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{rel.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100">{rel.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize"
              style={{ color, backgroundColor: color + '20' }}>
              {rel.category}
            </span>
            {rel.isBirthdayUpcoming !== null && (
              <span className="text-xs text-pink-400 flex items-center gap-0.5">
                🎂 {rel.isBirthdayUpcoming === 0 ? 'Today!' : `${rel.isBirthdayUpcoming}d`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            {isUrgent ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {rel.overdueDays}d overdue
              </span>
            ) : isOverdue ? (
              <span className="text-yellow-400">{rel.overdueDays}d overdue</span>
            ) : (
              <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Up to date</span>
            )}
            {rel.daysSince !== null && (
              <span className="text-slate-600">Last: {rel.daysSince === 0 ? 'today' : `${rel.daysSince}d ago`}</span>
            )}
            {'★'.repeat(rel.importance).padEnd(5, '☆').split('').map((c, i) => (
              <span key={i} className={c === '★' ? 'text-yellow-400' : 'text-slate-700'} style={{ fontSize: '10px' }}>{c}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setShowInteract(s => !s)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all text-white"
            style={{ backgroundColor: color }}>
            <MessageCircle className="w-3 h-3" /> Log
          </button>
          <button onClick={() => onDelete(rel.id)} className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showInteract && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <div className="text-xs text-slate-500 mb-2">How did you connect?</div>
          <div className="flex flex-wrap gap-1.5">
            {INTERACTION_TYPES.map(type => (
              <button key={type} onClick={() => { onInteract(rel.id, type); setShowInteract(false) }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors capitalize">
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {rel.notes && (
        <p className="text-xs text-slate-600 mt-2 border-t border-slate-800 pt-2">{rel.notes}</p>
      )}
    </div>
  )
}

export default function Relationships() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [rels, setRels] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState({
    name: '', category: 'friend', emoji: '👤', notes: '', birthday: '',
    contact_frequency: 30, importance: 3,
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await axios.get<Relationship[]>('/api/relationships')
    setRels(res.data)
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const create = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/relationships', form)
      setForm({ name: '', category: 'friend', emoji: '👤', notes: '', birthday: '', contact_frequency: 30, importance: 3 })
      setShowAdd(false)
      await load()
      toastSuccess('Relationship added!')
    } finally { setSaving(false) }
  }

  const interact = async (id: number, type: string) => {
    await axios.post(`/api/relationships/${id}/interact`, { date: today, type })
    await load()
    toastSuccess(`✓ Logged ${type} with ${rels.find(r => r.id === id)?.name}!`)
  }

  const deleteRel = async (id: number) => {
    await axios.delete(`/api/relationships/${id}`)
    setRels(prev => prev.filter(r => r.id !== id))
  }

  const overdue = rels.filter(r => r.overdueDays > 0).sort((a, b) => b.overdueDays - a.overdueDays)
  const upcoming = rels.filter(r => r.isBirthdayUpcoming !== null).sort((a, b) => (a.isBirthdayUpcoming || 0) - (b.isBirthdayUpcoming || 0))

  const filtered = filter === 'all' ? rels
    : filter === 'overdue' ? overdue
    : filter === 'birthdays' ? upcoming
    : rels.filter(r => r.category === filter)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-yellow-400" />
            Relationships
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {rels.length} people · {overdue.length > 0 && <span className="text-red-400">{overdue.length} overdue</span>}
            {upcoming.length > 0 && <span className="text-pink-400 ml-2">{upcoming.length} birthdays soon</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showAdd ? 'bg-slate-700 text-slate-300' : 'bg-yellow-600 hover:bg-yellow-500 text-white'
          }`}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Person'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Name…" autoFocus value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="game-input flex-1 font-semibold" />
            <input placeholder="😊" value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="game-input w-14 text-center text-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.contact_frequency} onChange={e => setForm(f => ({ ...f, contact_frequency: parseInt(e.target.value) }))}
              className="game-input text-sm">
              {FREQ_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Birthday (optional)</div>
              <input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Importance</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, importance: i }))}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${form.importance >= i ? 'text-yellow-400' : 'text-slate-700'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea rows={2} placeholder="Notes (optional)…" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <button onClick={create} disabled={saving || !form.name.trim()}
            className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Person'}
          </button>
        </div>
      )}

      {/* Filters */}
      {rels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'all', label: `All (${rels.length})` },
            ...(overdue.length > 0 ? [{ id: 'overdue', label: `⚠️ Overdue (${overdue.length})` }] : []),
            ...(upcoming.length > 0 ? [{ id: 'birthdays', label: `🎂 Birthdays (${upcoming.length})` }] : []),
            ...CATEGORIES.map(c => ({ id: c, label: c })),
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f.id ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(r => (
            <RelCard key={r.id} rel={r} onInteract={interact} onDelete={deleteRel} />
          ))
        ) : (
          <div className="text-center py-16 text-slate-600">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No relationships tracked yet</p>
            <p className="text-xs mt-1">Add important people and set contact reminders</p>
          </div>
        )}
      </div>
    </div>
  )
}

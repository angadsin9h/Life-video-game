import { useState, useEffect } from 'react'
import { Phone, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CommType = 'call' | 'text' | 'email' | 'meeting' | 'video-call' | 'letter' | 'other'
type CommTone = 'positive' | 'neutral' | 'difficult' | 'emotional' | 'productive'

interface CommEntry {
  id: string
  date: string
  type: CommType
  person: string
  summary: string
  tone: CommTone
  duration: string
  actionItems: string
  followUp: string
  createdAt: string
}

const TYPE_CONFIG: Record<CommType, { label: string; emoji: string; color: string }> = {
  call:        { label: 'Phone Call',  emoji: '📞', color: '#22c55e' },
  text:        { label: 'Text',        emoji: '💬', color: '#3b82f6' },
  email:       { label: 'Email',       emoji: '📧', color: '#6366f1' },
  meeting:     { label: 'Meeting',     emoji: '🤝', color: '#f59e0b' },
  'video-call':{ label: 'Video Call',  emoji: '📹', color: '#a855f7' },
  letter:      { label: 'Letter',      emoji: '✉️', color: '#ec4899' },
  other:       { label: 'Other',       emoji: '💭', color: '#94a3b8' },
}

const TONE_CONFIG: Record<CommTone, { label: string; color: string }> = {
  positive:   { label: 'Positive',   color: '#22c55e' },
  neutral:    { label: 'Neutral',    color: '#94a3b8' },
  difficult:  { label: 'Difficult',  color: '#ef4444' },
  emotional:  { label: 'Emotional',  color: '#ec4899' },
  productive: { label: 'Productive', color: '#3b82f6' },
}

const STORAGE_KEY = 'communication_log'

export default function CommunicationLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CommEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<CommEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'call', person: '', summary: '', tone: 'neutral',
    duration: '', actionItems: '', followUp: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CommEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.person.trim() || !form.summary.trim()) return
    const e: CommEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], type: 'call', person: '', summary: '', tone: 'neutral', duration: '', actionItems: '', followUp: '' })
    setShowForm(false)
    toastSuccess('Conversation logged 📞')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const people = [...new Set(entries.map(e => e.person))].length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Phone className="w-7 h-7 text-green-400" />
            Communication Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track important conversations and follow-ups.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{people}</div>
          <div className="text-xs text-slate-500">People</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.filter(e => e.followUp).length}</div>
          <div className="text-xs text-slate-500">Follow-ups</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Communication</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CommType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CommType, typeof TYPE_CONFIG.call][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="Person / people *" className="game-input flex-1" autoFocus />
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration" className="game-input w-24 text-sm" />
          </div>
          <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="What was discussed? *" className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(TONE_CONFIG) as [CommTone, typeof TONE_CONFIG.neutral][]).map(([k, t]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, tone: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.tone === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.tone === k ? { background: t.color + '30', color: t.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>
          <input value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
            placeholder="Action items..." className="game-input w-full text-sm" />
          <input value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))}
            placeholder="Follow-up needed?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const tn = TONE_CONFIG[e.tone]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${tn.color}` }}>
              <span className="text-xl mt-0.5">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{e.person}</span>
                  <span className="text-xs text-slate-500">{e.date}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: tn.color + '20', color: tn.color }}>{tn.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{e.summary}</p>
                {e.followUp && <p className="text-xs text-yellow-400 mt-0.5">↩️ {e.followUp}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0 mt-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Phone className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log conversations to stay on top of your connections.</p>
          </div>
        )}
      </div>
    </div>
  )
}

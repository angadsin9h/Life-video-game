import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BodySignal = 'tension' | 'fatigue' | 'pain' | 'energy-surge' | 'gut-feeling' | 'heart-racing' | 'deep-calm' | 'hunger-cravings' | 'posture-awareness' | 'breath-pattern'
type ListeningDepth = 'ignored' | 'noticed' | 'acknowledged' | 'responded' | 'honored'

interface BodyWisdomEntry {
  id: string
  signal: BodySignal
  depth: ListeningDepth
  whereInBody: string
  whatTriggeredIt: string
  messageFromBody: string
  howYouResponded: string
  whatItNeeded: string
  emotionLinked: string
  actionTaken: string
  bodyWisdomScore: number
  date: string
  createdAt: string
}

const SIGNAL_CONFIG: Record<BodySignal, { label: string; emoji: string; color: string }> = {
  tension:           { label: 'Physical Tension',   emoji: '⚡', color: '#ef4444' },
  fatigue:           { label: 'Fatigue',            emoji: '😴', color: '#6366f1' },
  pain:              { label: 'Pain Signal',        emoji: '🔴', color: '#dc2626' },
  'energy-surge':    { label: 'Energy Surge',       emoji: '⚡', color: '#f59e0b' },
  'gut-feeling':     { label: 'Gut Feeling',        emoji: '🌀', color: '#a855f7' },
  'heart-racing':    { label: 'Heart Racing',       emoji: '❤️', color: '#ec4899' },
  'deep-calm':       { label: 'Deep Calm',          emoji: '🌊', color: '#3b82f6' },
  'hunger-cravings': { label: 'Hunger/Cravings',    emoji: '🍃', color: '#22c55e' },
  'posture-awareness':{ label: 'Posture Awareness', emoji: '🧍', color: '#94a3b8' },
  'breath-pattern':  { label: 'Breath Pattern',     emoji: '💨', color: '#10b981' },
}

const DEPTH_CONFIG: Record<ListeningDepth, { label: string; color: string }> = {
  ignored:     { label: 'Ignored',     color: '#ef4444' },
  noticed:     { label: 'Noticed',     color: '#f97316' },
  acknowledged:{ label: 'Acknowledged', color: '#f59e0b' },
  responded:   { label: 'Responded',   color: '#3b82f6' },
  honored:     { label: 'Honored',     color: '#22c55e' },
}

const STORAGE_KEY = 'body_wisdom_log'

export default function BodyWisdom() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BodyWisdomEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BodyWisdomEntry, 'id' | 'createdAt'>>({
    signal: 'gut-feeling', depth: 'responded', whereInBody: '',
    whatTriggeredIt: '', messageFromBody: '', howYouResponded: '',
    whatItNeeded: '', emotionLinked: '', actionTaken: '', bodyWisdomScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BodyWisdomEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whereInBody.trim()) return
    const e: BodyWisdomEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whereInBody: '', whatTriggeredIt: '', messageFromBody: '', howYouResponded: '', whatItNeeded: '', emotionLinked: '', actionTaken: '' }))
    setShowForm(false)
    toastSuccess('Body wisdom logged — your body knows what your mind has yet to understand 🌊')
  }

  const honored = entries.filter(e => e.depth === 'honored' || e.depth === 'responded').length
  const avgWisdom = entries.length ? Math.round(entries.reduce((s, e) => s + e.bodyWisdomScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-green-400" />
            Body Wisdom
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Listen to your body's signals and develop somatic intelligence.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Signals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{honored}</div>
          <div className="text-xs text-slate-500">Honored</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgWisdom}/10</div>
          <div className="text-xs text-slate-500">Avg Awareness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Body Signal</h3>
          <div className="flex gap-2">
            <select value={form.signal} onChange={e => setForm(f => ({ ...f, signal: e.target.value as BodySignal }))} className="game-input text-sm flex-1">
              {(Object.entries(SIGNAL_CONFIG) as [BodySignal, typeof SIGNAL_CONFIG.tension][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as ListeningDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [ListeningDepth, typeof DEPTH_CONFIG.responded][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whereInBody} onChange={e => setForm(f => ({ ...f, whereInBody: e.target.value }))}
            placeholder="Where in your body did you feel this? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatTriggeredIt} onChange={e => setForm(f => ({ ...f, whatTriggeredIt: e.target.value }))}
            placeholder="What triggered this signal?" className="game-input w-full text-sm" />
          <input value={form.messageFromBody} onChange={e => setForm(f => ({ ...f, messageFromBody: e.target.value }))}
            placeholder="Message your body was sending you" className="game-input w-full text-sm" />
          <input value={form.emotionLinked} onChange={e => setForm(f => ({ ...f, emotionLinked: e.target.value }))}
            placeholder="Emotion linked to this sensation" className="game-input w-full text-sm" />
          <input value={form.whatItNeeded} onChange={e => setForm(f => ({ ...f, whatItNeeded: e.target.value }))}
            placeholder="What your body needed from you" className="game-input w-full text-sm" />
          <input value={form.howYouResponded} onChange={e => setForm(f => ({ ...f, howYouResponded: e.target.value }))}
            placeholder="How you responded to this signal" className="game-input w-full text-sm" />
          <input value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))}
            placeholder="Concrete action taken" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Body awareness level: {form.bodyWisdomScore}/10</p>
            <input type="range" min={1} max={10} value={form.bodyWisdomScore}
              onChange={e => setForm(f => ({ ...f, bodyWisdomScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SIGNAL_CONFIG[e.signal]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-green-400">🌊 {e.bodyWisdomScore}/10</span>
                </div>
                {e.whereInBody && <p className="text-xs text-slate-300 mt-1 line-clamp-1">📍 {e.whereInBody}</p>}
                {e.messageFromBody && <p className="text-xs text-teal-300/70 mt-0.5 line-clamp-1">💬 {e.messageFromBody}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The body never lies. It speaks a language older than words.</p>
          </div>
        )}
      </div>
    </div>
  )
}

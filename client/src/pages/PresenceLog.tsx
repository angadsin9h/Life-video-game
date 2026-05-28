import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PresenceContext = 'conversation' | 'nature' | 'meditation' | 'work' | 'meal' | 'movement' | 'creativity' | 'prayer' | 'rest' | 'play'
type PresenceDepth = 'distracted' | 'partial' | 'present' | 'absorbed' | 'unified'

interface PresenceLogEntry {
  id: string
  context: PresenceContext
  depth: PresenceDepth
  duration: string
  whatBroughtYouIn: string
  whatDistracted: string
  qualityOfAttention: string
  insightReceived: string
  howItFeltInBody: string
  presenceScore: number
  date: string
  createdAt: string
}

const CONTEXT_CONFIG: Record<PresenceContext, { label: string; emoji: string; color: string }> = {
  conversation: { label: 'Conversation', emoji: '💬', color: '#3b82f6' },
  nature:       { label: 'Nature',       emoji: '🌿', color: '#22c55e' },
  meditation:   { label: 'Meditation',   emoji: '🧘', color: '#8b5cf6' },
  work:         { label: 'Work',         emoji: '💻', color: '#f59e0b' },
  meal:         { label: 'Meal',         emoji: '🍽️', color: '#f97316' },
  movement:     { label: 'Movement',     emoji: '🚶', color: '#ef4444' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#a855f7' },
  prayer:       { label: 'Prayer',       emoji: '🙏', color: '#6366f1' },
  rest:         { label: 'Rest',         emoji: '😌', color: '#94a3b8' },
  play:         { label: 'Play',         emoji: '🎯', color: '#ec4899' },
}

const DEPTH_CONFIG: Record<PresenceDepth, { label: string; color: string }> = {
  distracted: { label: 'Distracted', color: '#ef4444' },
  partial:    { label: 'Partial',    color: '#f97316' },
  present:    { label: 'Present',    color: '#f59e0b' },
  absorbed:   { label: 'Absorbed',   color: '#3b82f6' },
  unified:    { label: 'Unified',    color: '#22c55e' },
}

const STORAGE_KEY = 'presence_log'

export default function PresenceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PresenceLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PresenceLogEntry, 'id' | 'createdAt'>>({
    context: 'meditation', depth: 'present', duration: '',
    whatBroughtYouIn: '', whatDistracted: '', qualityOfAttention: '',
    insightReceived: '', howItFeltInBody: '', presenceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PresenceLogEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.qualityOfAttention.trim()) return
    const e: PresenceLogEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, duration: '', whatBroughtYouIn: '', whatDistracted: '', qualityOfAttention: '', insightReceived: '', howItFeltInBody: '' }))
    setShowForm(false)
    toastSuccess('Presence logged — now is where life actually happens 👁️')
  }

  const deep = entries.filter(e => e.depth === 'absorbed' || e.depth === 'unified').length
  const avgPresence = entries.length ? Math.round(entries.reduce((s, e) => s + e.presenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-cyan-400" />
            Presence Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and deepen your quality of presence in every moment.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{deep}</div>
          <div className="text-xs text-slate-500">Deep Presence</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{avgPresence}/10</div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Presence Moment</h3>
          <div className="flex gap-2">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as PresenceContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CONTEXT_CONFIG) as [PresenceContext, typeof CONTEXT_CONFIG.meditation][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as PresenceDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [PresenceDepth, typeof DEPTH_CONFIG.present][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            placeholder="Duration (e.g., 20 min)" className="game-input w-full text-sm" autoFocus />
          <input value={form.qualityOfAttention} onChange={e => setForm(f => ({ ...f, qualityOfAttention: e.target.value }))}
            placeholder="Describe the quality of your attention *" className="game-input w-full text-sm" />
          <input value={form.whatBroughtYouIn} onChange={e => setForm(f => ({ ...f, whatBroughtYouIn: e.target.value }))}
            placeholder="What helped you arrive fully?" className="game-input w-full text-sm" />
          <input value={form.whatDistracted} onChange={e => setForm(f => ({ ...f, whatDistracted: e.target.value }))}
            placeholder="What pulled you out of presence?" className="game-input w-full text-sm" />
          <input value={form.insightReceived} onChange={e => setForm(f => ({ ...f, insightReceived: e.target.value }))}
            placeholder="Any insight or download received?" className="game-input w-full text-sm" />
          <input value={form.howItFeltInBody} onChange={e => setForm(f => ({ ...f, howItFeltInBody: e.target.value }))}
            placeholder="How did full presence feel in your body?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Presence quality: {form.presenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.presenceScore}
              onChange={e => setForm(f => ({ ...f, presenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-cyan-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CONTEXT_CONFIG[e.context]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-cyan-400">👁️ {e.presenceScore}/10</span>
                  {e.duration && <span className="text-xs text-slate-500">{e.duration}</span>}
                </div>
                {e.insightReceived && <p className="text-xs text-yellow-300/70 mt-1">💡 {e.insightReceived}</p>}
                {e.whatBroughtYouIn && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">✓ {e.whatBroughtYouIn}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The present moment is the only place where life is ever lived.</p>
          </div>
        )}
      </div>
    </div>
  )
}

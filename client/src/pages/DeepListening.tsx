import { useState, useEffect } from 'react'
import { Headphones, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ListeningContext = 'conversation' | 'presentation' | 'podcast' | 'mentor' | 'nature' | 'music' | 'intuition' | 'body' | 'silence' | 'conflict'
type ListeningDepth = 'surface' | 'content' | 'emotion' | 'intent' | 'essence' | 'presence'

interface DeepListeningEntry {
  id: string
  context: ListeningContext
  depth: ListeningDepth
  withWhom: string
  whatYouHeard: string
  whatWasUnsaid: string
  howTheyFelt: string
  whatYouMissed: string
  keyInsight: string
  howItChangedYou: string
  presenceScore: number
  date: string
  createdAt: string
}

const CTX_CONFIG: Record<ListeningContext, { label: string; emoji: string; color: string }> = {
  conversation:  { label: 'Conversation',  emoji: '💬', color: '#3b82f6' },
  presentation:  { label: 'Presentation',  emoji: '🎤', color: '#f59e0b' },
  podcast:       { label: 'Podcast',       emoji: '🎧', color: '#a855f7' },
  mentor:        { label: 'Mentor',        emoji: '🎓', color: '#22c55e' },
  nature:        { label: 'Nature',        emoji: '🌿', color: '#10b981' },
  music:         { label: 'Music',         emoji: '🎵', color: '#ec4899' },
  intuition:     { label: 'Intuition',     emoji: '💫', color: '#6366f1' },
  body:          { label: 'Body Signals',  emoji: '🫀', color: '#ef4444' },
  silence:       { label: 'Silence',       emoji: '🤫', color: '#94a3b8' },
  conflict:      { label: 'Conflict',      emoji: '⚡', color: '#f97316' },
}

const DEPTH_CONFIG: Record<ListeningDepth, { label: string; color: string }> = {
  surface:  { label: 'Surface',   color: '#94a3b8' },
  content:  { label: 'Content',   color: '#3b82f6' },
  emotion:  { label: 'Emotion',   color: '#ec4899' },
  intent:   { label: 'Intent',    color: '#6366f1' },
  essence:  { label: 'Essence',   color: '#a855f7' },
  presence: { label: 'Presence',  color: '#f59e0b' },
}

const STORAGE_KEY = 'deep_listening_log'

export default function DeepListening() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DeepListeningEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DeepListeningEntry, 'id' | 'createdAt'>>({
    context: 'conversation', depth: 'emotion', withWhom: '',
    whatYouHeard: '', whatWasUnsaid: '', howTheyFelt: '',
    whatYouMissed: '', keyInsight: '', howItChangedYou: '', presenceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DeepListeningEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouHeard.trim()) return
    const e: DeepListeningEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, withWhom: '', whatYouHeard: '', whatWasUnsaid: '', howTheyFelt: '', whatYouMissed: '', keyInsight: '', howItChangedYou: '' }))
    setShowForm(false)
    toastSuccess('Deep listening logged — presence is the greatest gift you can give 🎧')
  }

  const presence = entries.filter(e => e.depth === 'presence' || e.depth === 'essence').length
  const avgPresence = entries.length ? Math.round(entries.reduce((s, e) => s + e.presenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Headphones className="w-7 h-7 text-violet-400" />
            Deep Listening
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Develop the art of listening beyond words to essence.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{presence}</div>
          <div className="text-xs text-slate-500">Deep Presence</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgPresence}/10</div>
          <div className="text-xs text-slate-500">Avg Presence</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Listening Session</h3>
          <div className="flex gap-2">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as ListeningContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CTX_CONFIG) as [ListeningContext, typeof CTX_CONFIG.conversation][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as ListeningDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [ListeningDepth, typeof DEPTH_CONFIG.emotion][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.withWhom} onChange={e => setForm(f => ({ ...f, withWhom: e.target.value }))}
            placeholder="Who / what were you listening to?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whatYouHeard} onChange={e => setForm(f => ({ ...f, whatYouHeard: e.target.value }))}
            placeholder="What did you hear? *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whatWasUnsaid} onChange={e => setForm(f => ({ ...f, whatWasUnsaid: e.target.value }))}
            placeholder="What was left unsaid?" className="game-input w-full text-sm" />
          <input value={form.howTheyFelt} onChange={e => setForm(f => ({ ...f, howTheyFelt: e.target.value }))}
            placeholder="How did they feel underneath the words?" className="game-input w-full text-sm" />
          <input value={form.whatYouMissed} onChange={e => setForm(f => ({ ...f, whatYouMissed: e.target.value }))}
            placeholder="What did you miss or overlook?" className="game-input w-full text-sm" />
          <input value={form.keyInsight} onChange={e => setForm(f => ({ ...f, keyInsight: e.target.value }))}
            placeholder="Key insight from truly listening" className="game-input w-full text-sm" />
          <input value={form.howItChangedYou} onChange={e => setForm(f => ({ ...f, howItChangedYou: e.target.value }))}
            placeholder="How did this listening change you?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Presence quality: {form.presenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.presenceScore}
              onChange={e => setForm(f => ({ ...f, presenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CTX_CONFIG[e.context]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {e.withWhom && <span className="text-xs font-medium text-white">{e.withWhom}</span>}
                  <span className="text-xs">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-violet-400">🎧 {e.presenceScore}/10</span>
                </div>
                {e.keyInsight && <p className="text-xs text-yellow-300/70 mt-1">💡 {e.keyInsight}</p>}
                {e.whatWasUnsaid && <p className="text-xs text-slate-400 mt-0.5 italic">Unsaid: {e.whatWasUnsaid}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Headphones className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Most people listen to reply. The master listens to understand.</p>
          </div>
        )}
      </div>
    </div>
  )
}

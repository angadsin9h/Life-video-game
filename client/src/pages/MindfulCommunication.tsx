import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CommContext = 'conflict' | 'feedback' | 'request' | 'sharing' | 'listening' | 'negotiation' | 'apology' | 'appreciation' | 'boundary' | 'vulnerability'
type CommQuality = 'reactive' | 'defensive' | 'passive' | 'assertive' | 'empathic' | 'nonviolent'

interface MindfulCommEntry {
  id: string
  context: CommContext
  quality: CommQuality
  withWhom: string
  whatYouSaid: string
  whatYouMeant: string
  howTheyReceived: string
  whatYouWouldChange: string
  keyLearning: string
  nextConversation: string
  clarityScore: number
  date: string
  createdAt: string
}

const CONTEXT_CONFIG: Record<CommContext, { label: string; emoji: string; color: string }> = {
  conflict:      { label: 'Conflict',      emoji: '⚔️', color: '#ef4444' },
  feedback:      { label: 'Feedback',      emoji: '💬', color: '#3b82f6' },
  request:       { label: 'Request',       emoji: '🙏', color: '#22c55e' },
  sharing:       { label: 'Sharing',       emoji: '💝', color: '#ec4899' },
  listening:     { label: 'Listening',     emoji: '👂', color: '#6366f1' },
  negotiation:   { label: 'Negotiation',   emoji: '🤝', color: '#f59e0b' },
  apology:       { label: 'Apology',       emoji: '💔', color: '#94a3b8' },
  appreciation:  { label: 'Appreciation',  emoji: '🌟', color: '#f97316' },
  boundary:      { label: 'Boundary',      emoji: '🛡️', color: '#a855f7' },
  vulnerability: { label: 'Vulnerability', emoji: '🫀', color: '#10b981' },
}

const QUALITY_CONFIG: Record<CommQuality, { label: string; color: string }> = {
  reactive:    { label: 'Reactive',    color: '#ef4444' },
  defensive:   { label: 'Defensive',   color: '#f97316' },
  passive:     { label: 'Passive',     color: '#94a3b8' },
  assertive:   { label: 'Assertive',   color: '#3b82f6' },
  empathic:    { label: 'Empathic',    color: '#22c55e' },
  nonviolent:  { label: 'Nonviolent',  color: '#a855f7' },
}

const STORAGE_KEY = 'mindful_comm_log'

export default function MindfulCommunication() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindfulCommEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MindfulCommEntry, 'id' | 'createdAt'>>({
    context: 'conflict', quality: 'assertive', withWhom: '',
    whatYouSaid: '', whatYouMeant: '', howTheyReceived: '',
    whatYouWouldChange: '', keyLearning: '', nextConversation: '', clarityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindfulCommEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouSaid.trim()) return
    const e: MindfulCommEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, withWhom: '', whatYouSaid: '', whatYouMeant: '', howTheyReceived: '', whatYouWouldChange: '', keyLearning: '', nextConversation: '' }))
    setShowForm(false)
    toastSuccess('Communication logged — speak with intention, listen with your whole being 💬')
  }

  const mindful = entries.filter(e => e.quality === 'nonviolent' || e.quality === 'empathic').length
  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <MessageSquare className="w-7 h-7 text-teal-400" />
            Mindful Communication
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Practice and reflect on the art of conscious communication.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Convos</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{mindful}</div>
          <div className="text-xs text-slate-500">Mindful</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Communication</h3>
          <div className="flex gap-2">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as CommContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CONTEXT_CONFIG) as [CommContext, typeof CONTEXT_CONFIG.conflict][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as CommQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [CommQuality, typeof QUALITY_CONFIG.assertive][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          <input value={form.withWhom} onChange={e => setForm(f => ({ ...f, withWhom: e.target.value }))}
            placeholder="Who was this conversation with?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whatYouSaid} onChange={e => setForm(f => ({ ...f, whatYouSaid: e.target.value }))}
            placeholder="Key things you said *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whatYouMeant} onChange={e => setForm(f => ({ ...f, whatYouMeant: e.target.value }))}
            placeholder="What you really meant underneath" className="game-input w-full text-sm" />
          <input value={form.howTheyReceived} onChange={e => setForm(f => ({ ...f, howTheyReceived: e.target.value }))}
            placeholder="How they seemed to receive it" className="game-input w-full text-sm" />
          <input value={form.whatYouWouldChange} onChange={e => setForm(f => ({ ...f, whatYouWouldChange: e.target.value }))}
            placeholder="What you'd say differently" className="game-input w-full text-sm" />
          <input value={form.keyLearning} onChange={e => setForm(f => ({ ...f, keyLearning: e.target.value }))}
            placeholder="Key communication learning" className="game-input w-full text-sm" />
          <input value={form.nextConversation} onChange={e => setForm(f => ({ ...f, nextConversation: e.target.value }))}
            placeholder="Next conversation you need to have" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Communication clarity: {form.clarityScore}/10</p>
            <input type="range" min={1} max={10} value={form.clarityScore}
              onChange={e => setForm(f => ({ ...f, clarityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-teal-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CONTEXT_CONFIG[e.context]
          const q = QUALITY_CONFIG[e.quality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {e.withWhom && <span className="text-xs font-medium text-white">{e.withWhom}</span>}
                  <span className="text-xs">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-teal-400">💬 {e.clarityScore}/10</span>
                </div>
                {e.keyLearning && <p className="text-xs text-yellow-300/70 mt-1">💡 {e.keyLearning}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The quality of your relationships is the quality of your communication.</p>
          </div>
        )}
      </div>
    </div>
  )
}

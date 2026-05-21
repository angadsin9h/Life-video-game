import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ClarityDomain = 'life-direction' | 'relationship' | 'career' | 'creative' | 'financial' | 'spiritual' | 'personal' | 'problem'
type ClaritySource = 'meditation' | 'exercise' | 'sleep' | 'conversation' | 'nature' | 'journaling' | 'shower' | 'reading'

interface ClarityEntry {
  id: string
  domain: ClarityDomain
  source: ClaritySource
  insight: string
  whatConfused: string
  whatCleared: string
  actions: string
  whenItHit: string
  clarityScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ClarityDomain, { label: string; emoji: string; color: string }> = {
  'life-direction': { label: 'Life Direction', emoji: '🧭', color: '#6366f1' },
  relationship:     { label: 'Relationship',   emoji: '❤️', color: '#ec4899' },
  career:           { label: 'Career',         emoji: '💼', color: '#3b82f6' },
  creative:         { label: 'Creative',       emoji: '🎨', color: '#f97316' },
  financial:        { label: 'Financial',      emoji: '💰', color: '#f59e0b' },
  spiritual:        { label: 'Spiritual',      emoji: '✨', color: '#a855f7' },
  personal:         { label: 'Personal',       emoji: '🌟', color: '#22c55e' },
  problem:          { label: 'Problem',        emoji: '🔍', color: '#ef4444' },
}

const SOURCE_CONFIG: Record<ClaritySource, { label: string; emoji: string }> = {
  meditation:  { label: 'Meditation',  emoji: '🧘' },
  exercise:    { label: 'Exercise',    emoji: '🏃' },
  sleep:       { label: 'Sleep/Dream', emoji: '😴' },
  conversation:{ label: 'Conversation',emoji: '💬' },
  nature:      { label: 'Nature',      emoji: '🌿' },
  journaling:  { label: 'Journaling',  emoji: '📝' },
  shower:      { label: 'Shower',      emoji: '🚿' },
  reading:     { label: 'Reading',     emoji: '📚' },
}

const STORAGE_KEY = 'clarity_journal'

export default function ClarityJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ClarityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ClarityEntry, 'id' | 'createdAt'>>({
    domain: 'life-direction', source: 'meditation', insight: '', whatConfused: '',
    whatCleared: '', actions: '', whenItHit: '',
    clarityScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ClarityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.insight.trim()) return
    const e: ClarityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, insight: '', whatConfused: '', whatCleared: '', actions: '', whenItHit: '' }))
    setShowForm(false)
    toastSuccess('Moment of clarity captured — insight is power 👁')
  }

  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityScore, 0) / entries.length) : 0
  const domains = new Set(entries.map(e => e.domain)).size

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-cyan-400" />
            Clarity Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture moments of mental clarity and breakthrough insight.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{domains}</div>
          <div className="text-xs text-slate-500">Life Areas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Clarity Moment</h3>
          <textarea value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="The insight or realization you had *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ClarityDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ClarityDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as ClaritySource }))} className="game-input text-sm flex-1">
              {(Object.entries(SOURCE_CONFIG) as [ClaritySource, typeof SOURCE_CONFIG.meditation][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatConfused} onChange={e => setForm(f => ({ ...f, whatConfused: e.target.value }))}
            placeholder="What was confusing or unclear before?" className="game-input w-full text-sm" />
          <input value={form.whatCleared} onChange={e => setForm(f => ({ ...f, whatCleared: e.target.value }))}
            placeholder="What created this clarity?" className="game-input w-full text-sm" />
          <input value={form.whenItHit} onChange={e => setForm(f => ({ ...f, whenItHit: e.target.value }))}
            placeholder="When / where did it hit you?" className="game-input w-full text-sm" />
          <input value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
            placeholder="Actions this clarity is calling you to take" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Clarity score: {form.clarityScore}/10</p>
            <input type="range" min={1} max={10} value={form.clarityScore}
              onChange={e => setForm(f => ({ ...f, clarityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-cyan-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Log Clarity</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = SOURCE_CONFIG[e.source]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{s.emoji} {s.label}</span>
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs text-cyan-400">👁 {e.clarityScore}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.insight}</p>
                {e.actions && <p className="text-xs text-green-300/70 mt-0.5">→ {e.actions}</p>}
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
            <p className="text-sm">Clarity is the rarest and most valuable commodity. Capture it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

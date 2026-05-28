import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EgoPattern = 'defensiveness' | 'comparison' | 'seeking-approval' | 'entitlement' | 'blame' | 'perfectionism' | 'arrogance' | 'victimhood' | 'attachment' | 'other'
type EgoTrigger = 'criticism' | 'failure' | 'rejection' | 'comparison' | 'praise' | 'threat' | 'loss' | 'other'

interface EgoEntry {
  id: string
  pattern: EgoPattern
  trigger: EgoTrigger
  situation: string
  egoReaction: string
  truthfulReframe: string
  humbleResponse: string
  awareness: number
  date: string
  createdAt: string
}

const PATTERN_CONFIG: Record<EgoPattern, { label: string; emoji: string; color: string }> = {
  defensiveness:      { label: 'Defensiveness',    emoji: '🛡️', color: '#ef4444' },
  comparison:         { label: 'Comparison',        emoji: '⚖️', color: '#f59e0b' },
  'seeking-approval': { label: 'Approval Seeking',  emoji: '👁️', color: '#a855f7' },
  entitlement:        { label: 'Entitlement',        emoji: '👑', color: '#f97316' },
  blame:              { label: 'Blame / Projection', emoji: '👉', color: '#ec4899' },
  perfectionism:      { label: 'Perfectionism',      emoji: '🔬', color: '#6366f1' },
  arrogance:          { label: 'Arrogance',           emoji: '🎭', color: '#0ea5e9' },
  victimhood:         { label: 'Victimhood',          emoji: '😔', color: '#64748b' },
  attachment:         { label: 'Ego Attachment',      emoji: '🔗', color: '#22c55e' },
  other:              { label: 'Other',               emoji: '💭', color: '#94a3b8' },
}

const TRIGGER_CONFIG: Record<EgoTrigger, { label: string; color: string }> = {
  criticism:  { label: 'Criticism',   color: '#ef4444' },
  failure:    { label: 'Failure',     color: '#f97316' },
  rejection:  { label: 'Rejection',   color: '#ec4899' },
  comparison: { label: 'Comparison',  color: '#f59e0b' },
  praise:     { label: 'Praise',      color: '#22c55e' },
  threat:     { label: 'Ego Threat',  color: '#a855f7' },
  loss:       { label: 'Loss',        color: '#6366f1' },
  other:      { label: 'Other',       color: '#94a3b8' },
}

const STORAGE_KEY = 'ego_journal'

export default function EgoJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EgoEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EgoEntry, 'id' | 'createdAt'>>({
    pattern: 'defensiveness', trigger: 'criticism', situation: '',
    egoReaction: '', truthfulReframe: '', humbleResponse: '',
    awareness: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EgoEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: EgoEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', egoReaction: '', truthfulReframe: '', humbleResponse: '' }))
    setShowForm(false)
    toastSuccess('Ego pattern logged — awareness is power 🧠')
  }

  const patternCount = [...new Set(entries.map(e => e.pattern))].length
  const avgAwareness = entries.length ? Math.round(entries.reduce((s, e) => s + e.awareness, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Ego Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Observe ego patterns and reframe with humility.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Observe
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Observations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{patternCount}</div>
          <div className="text-xs text-slate-500">Patterns Found</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgAwareness}/10</div>
          <div className="text-xs text-slate-500">Avg Awareness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Observe Ego Pattern</h3>
          <div className="flex gap-2">
            <select value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value as EgoPattern }))} className="game-input text-sm flex-1">
              {(Object.entries(PATTERN_CONFIG) as [EgoPattern, typeof PATTERN_CONFIG.defensiveness][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as EgoTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [EgoTrigger, typeof TRIGGER_CONFIG.criticism][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="What happened? Describe the situation *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <textarea value={form.egoReaction} onChange={e => setForm(f => ({ ...f, egoReaction: e.target.value }))}
            placeholder="How did the ego react? (thoughts, feelings, impulses)" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.truthfulReframe} onChange={e => setForm(f => ({ ...f, truthfulReframe: e.target.value }))}
            placeholder="Truthful reframe — what's actually true here?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.humbleResponse} onChange={e => setForm(f => ({ ...f, humbleResponse: e.target.value }))}
            placeholder="Humble / grounded response instead" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Self-awareness level: {form.awareness}/10</p>
            <input type="range" min={1} max={10} value={form.awareness}
              onChange={e => setForm(f => ({ ...f, awareness: Number(e.target.value) }))}
              className="w-full h-1 accent-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Record</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PATTERN_CONFIG[e.pattern]
          const t = TRIGGER_CONFIG[e.trigger]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-slate-500">via {t.label}</span>
                  <span className="text-xs text-green-400">👁 {e.awareness}/10</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.situation}</p>
                {e.truthfulReframe && <p className="text-xs text-purple-300 mt-0.5">→ {e.truthfulReframe}</p>}
                {e.humbleResponse && <p className="text-xs text-green-300/70 mt-0.5">💡 {e.humbleResponse}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Ego is the enemy of growth. Observe it without judgment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

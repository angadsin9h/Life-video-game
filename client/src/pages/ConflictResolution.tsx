import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConflictType = 'misunderstanding' | 'values-clash' | 'boundary-violation' | 'unmet-needs' | 'communication-failure' | 'power-struggle' | 'betrayal' | 'neglect' | 'jealousy' | 'control'
type ResolutionLevel = 'unresolved' | 'ceasefire' | 'partial' | 'resolved' | 'transformed'

interface ConflictResolutionEntry {
  id: string
  conflictType: ConflictType
  resolution: ResolutionLevel
  whoInvolved: string
  whatHappened: string
  yourRole: string
  theirPerspective: string
  rootCause: string
  stepsYouTook: string
  lessonLearned: string
  relationshipStatus: string
  harmonyScore: number
  date: string
  createdAt: string
}

const CONFLICT_CONFIG: Record<ConflictType, { label: string; emoji: string; color: string }> = {
  misunderstanding:       { label: 'Misunderstanding',       emoji: '🌫️', color: '#94a3b8' },
  'values-clash':         { label: 'Values Clash',           emoji: '⚖️', color: '#6366f1' },
  'boundary-violation':   { label: 'Boundary Violation',     emoji: '🚧', color: '#ef4444' },
  'unmet-needs':          { label: 'Unmet Needs',            emoji: '🕳️', color: '#f97316' },
  'communication-failure':{ label: 'Comm. Failure',          emoji: '📵', color: '#f59e0b' },
  'power-struggle':       { label: 'Power Struggle',         emoji: '⚡', color: '#a855f7' },
  betrayal:               { label: 'Betrayal',               emoji: '💔', color: '#dc2626' },
  neglect:                { label: 'Neglect',                emoji: '👻', color: '#475569' },
  jealousy:               { label: 'Jealousy',               emoji: '🔥', color: '#ec4899' },
  control:                { label: 'Control Issues',         emoji: '🪢', color: '#3b82f6' },
}

const RESOLUTION_CONFIG: Record<ResolutionLevel, { label: string; color: string }> = {
  unresolved: { label: 'Unresolved', color: '#ef4444' },
  ceasefire:  { label: 'Ceasefire',  color: '#f97316' },
  partial:    { label: 'Partial',    color: '#f59e0b' },
  resolved:   { label: 'Resolved',   color: '#3b82f6' },
  transformed:{ label: 'Transformed', color: '#22c55e' },
}

const STORAGE_KEY = 'conflict_resolution_log'

export default function ConflictResolution() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ConflictResolutionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ConflictResolutionEntry, 'id' | 'createdAt'>>({
    conflictType: 'misunderstanding', resolution: 'partial', whoInvolved: '',
    whatHappened: '', yourRole: '', theirPerspective: '',
    rootCause: '', stepsYouTook: '', lessonLearned: '', relationshipStatus: '', harmonyScore: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ConflictResolutionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatHappened.trim()) return
    const e: ConflictResolutionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whoInvolved: '', whatHappened: '', yourRole: '', theirPerspective: '', rootCause: '', stepsYouTook: '', lessonLearned: '', relationshipStatus: '' }))
    setShowForm(false)
    toastSuccess('Conflict logged — every resolved conflict deepens connection and wisdom 👥')
  }

  const resolved = entries.filter(e => e.resolution === 'resolved' || e.resolution === 'transformed').length
  const avgHarmony = entries.length ? Math.round(entries.reduce((s, e) => s + e.harmonyScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-violet-400" />
            Conflict Resolution
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Process conflicts with clarity and transform them into growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Conflicts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{resolved}</div>
          <div className="text-xs text-slate-500">Resolved+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgHarmony}/10</div>
          <div className="text-xs text-slate-500">Avg Harmony</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Conflict</h3>
          <div className="flex gap-2">
            <select value={form.conflictType} onChange={e => setForm(f => ({ ...f, conflictType: e.target.value as ConflictType }))} className="game-input text-sm flex-1">
              {(Object.entries(CONFLICT_CONFIG) as [ConflictType, typeof CONFLICT_CONFIG.misunderstanding][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value as ResolutionLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(RESOLUTION_CONFIG) as [ResolutionLevel, typeof RESOLUTION_CONFIG.resolved][]).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whoInvolved} onChange={e => setForm(f => ({ ...f, whoInvolved: e.target.value }))}
            placeholder="Who was involved?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.yourRole} onChange={e => setForm(f => ({ ...f, yourRole: e.target.value }))}
            placeholder="Your role in the conflict" className="game-input w-full text-sm" />
          <input value={form.theirPerspective} onChange={e => setForm(f => ({ ...f, theirPerspective: e.target.value }))}
            placeholder="Their perspective (as best you understand it)" className="game-input w-full text-sm" />
          <input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="Root cause beneath the surface issue" className="game-input w-full text-sm" />
          <input value={form.stepsYouTook} onChange={e => setForm(f => ({ ...f, stepsYouTook: e.target.value }))}
            placeholder="Steps you took toward resolution" className="game-input w-full text-sm" />
          <input value={form.lessonLearned} onChange={e => setForm(f => ({ ...f, lessonLearned: e.target.value }))}
            placeholder="Key lesson from this conflict" className="game-input w-full text-sm" />
          <input value={form.relationshipStatus} onChange={e => setForm(f => ({ ...f, relationshipStatus: e.target.value }))}
            placeholder="Current state of the relationship" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Harmony level now: {form.harmonyScore}/10</p>
            <input type="range" min={1} max={10} value={form.harmonyScore}
              onChange={e => setForm(f => ({ ...f, harmonyScore: Number(e.target.value) }))}
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
          const c = CONFLICT_CONFIG[e.conflictType]
          const r = RESOLUTION_CONFIG[e.resolution]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  <span className="text-xs text-violet-400">🤝 {e.harmonyScore}/10</span>
                </div>
                {e.whoInvolved && <p className="text-xs text-slate-400 mt-1">👥 {e.whoInvolved}</p>}
                {e.lessonLearned && <p className="text-xs text-yellow-300/70 mt-0.5 line-clamp-1">💡 {e.lessonLearned}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Conflict resolved with wisdom deepens the relationship. Conflict avoided weakens it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

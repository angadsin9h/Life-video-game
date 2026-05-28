import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LoadSource = 'decisions' | 'worries' | 'relationships' | 'projects' | 'finances' | 'health' | 'admin' | 'communication' | 'learning' | 'goals'
type LoadStatus = 'draining' | 'heavy' | 'manageable' | 'clearing' | 'resolved'

interface CogLoadEntry {
  id: string
  item: string
  source: LoadSource
  status: LoadStatus
  whatsTaking: string
  clearingAction: string
  delegateTo: string
  toAutomate: string
  toEliminate: string
  loadWeight: number
  date: string
  createdAt: string
}

const SOURCE_CONFIG: Record<LoadSource, { label: string; emoji: string; color: string }> = {
  decisions:     { label: 'Decisions',     emoji: '🤔', color: '#6366f1' },
  worries:       { label: 'Worries',       emoji: '😰', color: '#ef4444' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  projects:      { label: 'Projects',      emoji: '🗂️', color: '#3b82f6' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#f59e0b' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  admin:         { label: 'Admin',         emoji: '📋', color: '#94a3b8' },
  communication: { label: 'Communication', emoji: '💬', color: '#f97316' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#a855f7' },
  goals:         { label: 'Goals',         emoji: '🎯', color: '#84cc16' },
}

const STATUS_CONFIG: Record<LoadStatus, { label: string; color: string }> = {
  draining:   { label: 'Draining',    color: '#ef4444' },
  heavy:      { label: 'Heavy',       color: '#f97316' },
  manageable: { label: 'Manageable',  color: '#f59e0b' },
  clearing:   { label: 'Clearing',    color: '#22c55e' },
  resolved:   { label: 'Resolved',    color: '#3b82f6' },
}

const STORAGE_KEY = 'cognitive_load_log'

export default function CognitiveLoad() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CogLoadEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CogLoadEntry, 'id' | 'createdAt'>>({
    item: '', source: 'decisions', status: 'heavy', whatsTaking: '',
    clearingAction: '', delegateTo: '', toAutomate: '', toEliminate: '',
    loadWeight: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CogLoadEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.item.trim()) return
    const e: CogLoadEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, item: '', whatsTaking: '', clearingAction: '', delegateTo: '', toAutomate: '', toEliminate: '' }))
    setShowForm(false)
    toastSuccess('Cognitive load mapped — protect your mental bandwidth 🧠')
  }

  const total = entries.reduce((s, e) => s + e.loadWeight, 0)
  const draining = entries.filter(e => e.status === 'draining').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-indigo-400" />
            Cognitive Load
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map what's consuming your mental bandwidth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Items</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{draining}</div>
          <div className="text-xs text-slate-500">Draining</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{total}</div>
          <div className="text-xs text-slate-500">Total Load</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Cognitive Load</h3>
          <input value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
            placeholder="What's taking up mental space? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as LoadSource }))} className="game-input text-sm flex-1">
              {(Object.entries(SOURCE_CONFIG) as [LoadSource, typeof SOURCE_CONFIG.decisions][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LoadStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [LoadStatus, typeof STATUS_CONFIG.heavy][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatsTaking} onChange={e => setForm(f => ({ ...f, whatsTaking: e.target.value }))}
            placeholder="What specifically is taking mental energy?" className="game-input w-full text-sm" />
          <input value={form.clearingAction} onChange={e => setForm(f => ({ ...f, clearingAction: e.target.value }))}
            placeholder="Action to clear this from your mind" className="game-input w-full text-sm" />
          <input value={form.delegateTo} onChange={e => setForm(f => ({ ...f, delegateTo: e.target.value }))}
            placeholder="Could you delegate this? To who?" className="game-input w-full text-sm" />
          <input value={form.toAutomate} onChange={e => setForm(f => ({ ...f, toAutomate: e.target.value }))}
            placeholder="Could this be automated? How?" className="game-input w-full text-sm" />
          <input value={form.toEliminate} onChange={e => setForm(f => ({ ...f, toEliminate: e.target.value }))}
            placeholder="Should this just be eliminated?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Load weight: {form.loadWeight}/10</p>
            <input type="range" min={1} max={10} value={form.loadWeight}
              onChange={e => setForm(f => ({ ...f, loadWeight: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Map Item</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SOURCE_CONFIG[e.source]
          const st = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.item}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                  <span className="text-xs text-indigo-400">🧠 {e.loadWeight}/10</span>
                </div>
                {e.clearingAction && <p className="text-xs text-green-300/70 mt-1">→ {e.clearingAction}</p>}
                {e.delegateTo && <p className="text-xs text-blue-300/70 mt-0.5">Delegate: {e.delegateTo}</p>}
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
            <p className="text-sm">Your mind is for having ideas, not holding them. Empty it here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

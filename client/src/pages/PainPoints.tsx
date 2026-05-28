import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PainArea = 'physical' | 'emotional' | 'relational' | 'financial' | 'career' | 'health' | 'mental' | 'existential' | 'practical' | 'other'
type PainStatus = 'acute' | 'chronic' | 'healing' | 'resolved' | 'accepted'
type PainAction = 'addressing' | 'exploring' | 'seeking-help' | 'accepting' | 'stuck'

interface PainEntry {
  id: string
  area: PainArea
  status: PainStatus
  action: PainAction
  painPoint: string
  rootCause: string
  impact: string
  whatHelps: string
  support: string
  intensity: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<PainArea, { label: string; emoji: string; color: string }> = {
  physical:     { label: 'Physical',     emoji: '🩺', color: '#ef4444' },
  emotional:    { label: 'Emotional',    emoji: '💔', color: '#ec4899' },
  relational:   { label: 'Relational',   emoji: '👥', color: '#f97316' },
  financial:    { label: 'Financial',    emoji: '💸', color: '#f59e0b' },
  career:       { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  health:       { label: 'Health',       emoji: '🫀', color: '#22c55e' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#a855f7' },
  existential:  { label: 'Existential',  emoji: '🌑', color: '#6366f1' },
  practical:    { label: 'Practical',    emoji: '🔧', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '⚡', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<PainStatus, { label: string; color: string; emoji: string }> = {
  acute:    { label: 'Acute',    color: '#ef4444', emoji: '🔴' },
  chronic:  { label: 'Chronic',  color: '#f97316', emoji: '🟠' },
  healing:  { label: 'Healing',  color: '#22c55e', emoji: '🌱' },
  resolved: { label: 'Resolved', color: '#a855f7', emoji: '✅' },
  accepted: { label: 'Accepted', color: '#3b82f6', emoji: '🕊️' },
}

const ACTION_CONFIG: Record<PainAction, { label: string }> = {
  addressing:    { label: 'Actively Addressing' },
  exploring:     { label: 'Exploring'           },
  'seeking-help':{ label: 'Seeking Help'        },
  accepting:     { label: 'Accepting'           },
  stuck:         { label: 'Feeling Stuck'       },
}

const STORAGE_KEY = 'pain_points'

export default function PainPoints() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PainEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PainEntry, 'id' | 'createdAt'>>({
    area: 'emotional', status: 'acute', action: 'exploring', painPoint: '',
    rootCause: '', impact: '', whatHelps: '', support: '', intensity: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PainEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.painPoint.trim()) return
    const e: PainEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, painPoint: '', rootCause: '', impact: '', whatHelps: '', support: '' }))
    setShowForm(false)
    toastSuccess('Pain point acknowledged — awareness is healing 🌱')
  }

  const healing = entries.filter(e => e.status === 'healing' || e.status === 'resolved' || e.status === 'accepted').length
  const avgIntensity = entries.length ? Math.round(entries.reduce((s, e) => s + e.intensity, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertTriangle className="w-7 h-7 text-orange-400" />
            Pain Points
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Acknowledge your pain, explore its roots, find healing.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{healing}</div>
          <div className="text-xs text-slate-500">Healing/Resolved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Pain Point</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as PainArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [PainArea, typeof AREA_CONFIG.physical][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PainStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [PainStatus, typeof STATUS_CONFIG.acute][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.painPoint} onChange={e => setForm(f => ({ ...f, painPoint: e.target.value }))}
            placeholder="Describe the pain point honestly *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="What might be at the root of this?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How is this affecting your life?" className="game-input w-full text-sm" />
          <input value={form.whatHelps} onChange={e => setForm(f => ({ ...f, whatHelps: e.target.value }))}
            placeholder="What has helped, even slightly?" className="game-input w-full text-sm" />
          <input value={form.support} onChange={e => setForm(f => ({ ...f, support: e.target.value }))}
            placeholder="Support you need or are seeking" className="game-input w-full text-sm" />
          <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value as PainAction }))} className="game-input w-full text-sm">
            {(Object.entries(ACTION_CONFIG) as [PainAction, typeof ACTION_CONFIG.addressing][]).map(([k, a]) => (
              <option key={k} value={k}>{a.label}</option>
            ))}
          </select>
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{s.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-red-400">🔥 {e.intensity}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3">{e.painPoint}</p>
                {e.whatHelps && <p className="text-xs text-green-300 mt-0.5">Helps: {e.whatHelps}</p>}
                {e.rootCause && <p className="text-xs text-slate-500 mt-0.5">Root: {e.rootCause}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Naming pain is the first step to healing it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

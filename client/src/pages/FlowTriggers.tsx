import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TriggerCategory = 'environment' | 'ritual' | 'physical' | 'mental' | 'social' | 'creative' | 'auditory' | 'emotional'
type TriggerReliability = 'always' | 'usually' | 'sometimes' | 'rarely'

interface FlowTriggerEntry {
  id: string
  trigger: string
  category: TriggerCategory
  reliability: TriggerReliability
  description: string
  howToActivate: string
  bestWorkType: string
  duration: number
  flowIntensity: number
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<TriggerCategory, { label: string; emoji: string; color: string }> = {
  environment: { label: 'Environment', emoji: '🏠', color: '#3b82f6' },
  ritual:      { label: 'Ritual',      emoji: '🔮', color: '#a855f7' },
  physical:    { label: 'Physical',    emoji: '💪', color: '#ef4444' },
  mental:      { label: 'Mental',      emoji: '🧠', color: '#6366f1' },
  social:      { label: 'Social',      emoji: '👥', color: '#22c55e' },
  creative:    { label: 'Creative',    emoji: '🎨', color: '#f97316' },
  auditory:    { label: 'Auditory',    emoji: '🎵', color: '#f59e0b' },
  emotional:   { label: 'Emotional',   emoji: '❤️', color: '#ec4899' },
}

const RELIABILITY_CONFIG: Record<TriggerReliability, { label: string; color: string }> = {
  always:    { label: 'Always Works',    color: '#22c55e' },
  usually:   { label: 'Usually Works',   color: '#f59e0b' },
  sometimes: { label: 'Sometimes',       color: '#f97316' },
  rarely:    { label: 'Rarely',          color: '#94a3b8' },
}

const STORAGE_KEY = 'flow_triggers'

export default function FlowTriggers() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FlowTriggerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FlowTriggerEntry, 'id' | 'createdAt'>>({
    trigger: '', category: 'environment', reliability: 'usually',
    description: '', howToActivate: '', bestWorkType: '',
    duration: 60, flowIntensity: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FlowTriggerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.trigger.trim()) return
    const e: FlowTriggerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, trigger: '', description: '', howToActivate: '', bestWorkType: '' }))
    setShowForm(false)
    toastSuccess('Flow trigger mapped — design your flow state 🌊')
  }

  const alwaysWork = entries.filter(e => e.reliability === 'always').length
  const avgFlow = entries.length ? Math.round(entries.reduce((s, e) => s + e.flowIntensity, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-violet-400" />
            Flow Triggers
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map what reliably puts you into deep flow states.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Triggers</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{alwaysWork}</div>
          <div className="text-xs text-slate-500">Reliable</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgFlow}/10</div>
          <div className="text-xs text-slate-500">Avg Flow</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Flow Trigger</h3>
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggers your flow? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TriggerCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [TriggerCategory, typeof CATEGORY_CONFIG.environment][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.reliability} onChange={e => setForm(f => ({ ...f, reliability: e.target.value as TriggerReliability }))} className="game-input text-sm flex-1">
              {(Object.entries(RELIABILITY_CONFIG) as [TriggerReliability, typeof RELIABILITY_CONFIG.usually][]).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this trigger in detail" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howToActivate} onChange={e => setForm(f => ({ ...f, howToActivate: e.target.value }))}
            placeholder="How to intentionally activate it" className="game-input w-full text-sm" />
          <input value={form.bestWorkType} onChange={e => setForm(f => ({ ...f, bestWorkType: e.target.value }))}
            placeholder="Best type of work to do in this flow state" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Flow duration: {form.duration}min</p>
              <input type="range" min={15} max={240} step={15} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Flow intensity: {form.flowIntensity}/10</p>
              <input type="range" min={1} max={10} value={form.flowIntensity}
                onChange={e => setForm(f => ({ ...f, flowIntensity: Number(e.target.value) }))}
                className="w-full h-1 accent-violet-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Map Trigger</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CATEGORY_CONFIG[e.category]
          const r = RELIABILITY_CONFIG[e.reliability]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.trigger}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  <span className="text-xs text-violet-400">🌊 {e.flowIntensity}/10</span>
                  <span className="text-xs text-slate-500">⏱ {e.duration}min</span>
                </div>
                {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>}
                {e.bestWorkType && <p className="text-xs text-blue-300/70 mt-0.5">Best for: {e.bestWorkType}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Flow is the ultimate performance state. Map your triggers.</p>
          </div>
        )}
      </div>
    </div>
  )
}

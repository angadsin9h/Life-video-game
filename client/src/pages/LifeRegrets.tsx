import { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RegretArea = 'relationships' | 'career' | 'health' | 'education' | 'finance' | 'travel' | 'creative' | 'courage' | 'other'
type RegretStatus = 'active' | 'processing' | 'accepted' | 'resolved'

interface RegretEntry {
  id: string
  title: string
  area: RegretArea
  description: string
  period: string
  lesson: string
  action: string
  status: RegretStatus
  intensity: number
  preventable: boolean
  createdAt: string
}

const AREA_CONFIG: Record<RegretArea, { label: string; emoji: string; color: string }> = {
  relationships: { label: 'Relationships', emoji: '💔', color: '#ec4899' },
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '❤️', color: '#ef4444' },
  education:     { label: 'Education',     emoji: '📚', color: '#f59e0b' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  travel:        { label: 'Travel',        emoji: '✈️', color: '#0ea5e9' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#a855f7' },
  courage:       { label: 'Courage',       emoji: '🦁', color: '#f97316' },
  other:         { label: 'Other',         emoji: '💭', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<RegretStatus, { label: string; color: string }> = {
  active:     { label: 'Active',     color: '#ef4444' },
  processing: { label: 'Processing', color: '#f59e0b' },
  accepted:   { label: 'Accepted',   color: '#3b82f6' },
  resolved:   { label: 'Resolved',   color: '#22c55e' },
}

const STORAGE_KEY = 'life_regrets'

export default function LifeRegrets() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RegretEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<RegretEntry, 'id' | 'createdAt'>>({
    title: '', area: 'courage', description: '', period: '',
    lesson: '', action: '', status: 'processing', intensity: 6, preventable: true,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RegretEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: RegretEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ title: '', area: 'courage', description: '', period: '', lesson: '', action: '', status: 'processing', intensity: 6, preventable: true })
    setShowForm(false)
    toastSuccess('Regret logged — awareness is healing 💡')
  }

  const resolved = entries.filter(e => e.status === 'resolved').length
  const avgIntensity = entries.length
    ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1) : '—'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertCircle className="w-7 h-7 text-orange-400" />
            Life Regrets
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Process regrets — extract lessons, take action.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="game-card p-4 border border-orange-500/10 bg-orange-500/5">
        <p className="text-xs text-orange-300/80 italic">"The only regrets I have are the things I didn't do." — Use this space to process, learn, and move forward.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgIntensity}</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{resolved}</div>
          <div className="text-xs text-slate-500">Resolved</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Regret</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="One-line title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as RegretArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [RegretArea, typeof AREA_CONFIG.courage][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              placeholder="When (e.g. 2018, age 25)" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What happened? What do you regret?" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Intensity: {form.intensity}/10</span>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="flex-1 h-1 accent-orange-400" />
          </div>
          <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What lesson does this teach you?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="What action can you take now or in the future?" className="game-input w-full h-12 resize-none text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.preventable} onChange={e => setForm(f => ({ ...f, preventable: e.target.checked }))} className="accent-orange-400" />
            This was preventable (vs. circumstance)
          </label>
          <div className="flex gap-2">
            {(Object.entries(STATUS_CONFIG) as [RegretStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                className={`flex-1 py-1 rounded-xl text-xs ${form.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.status === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{a.label}{e.period && ` · ${e.period}`} · Intensity: {e.intensity}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                  {e.lesson && <p className="text-sm text-teal-400 italic">💡 {e.lesson}</p>}
                  {e.action && <p className="text-xs text-blue-400">🎯 Action: {e.action}</p>}
                  {!e.preventable && <p className="text-xs text-slate-600">📌 Circumstance — not fully preventable</p>}
                  <div className="flex gap-2">
                    {(Object.entries(STATUS_CONFIG) as [RegretStatus, typeof STATUS_CONFIG.active][]).map(([k, st]) => (
                      <button key={k} onClick={() => save(entries.map(x => x.id === e.id ? { ...x, status: k } : x))}
                        className={`px-2 py-0.5 rounded-full text-xs ${e.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                        style={e.status === k ? { background: st.color + '30', color: st.color } : {}}>
                        {st.label}
                      </button>
                    ))}
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Turn regrets into lessons and actions.</p>
          </div>
        )}
      </div>
    </div>
  )
}

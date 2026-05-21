import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VisionTimeframe = '1-year' | '3-years' | '5-years' | '10-years' | '20-years' | 'lifetime'
type VisionDomain = 'career' | 'financial' | 'health' | 'relationships' | 'personal-growth' | 'creative' | 'spiritual' | 'impact' | 'lifestyle' | 'legacy'
type VisionStatus = 'draft' | 'active' | 'revised' | 'achieved' | 'evolved'

interface VisionEntry {
  id: string
  timeframe: VisionTimeframe
  domain: VisionDomain
  status: VisionStatus
  vision: string
  whyItMatters: string
  whatItLooksLike: string
  keyMilestones: string
  firstNextStep: string
  obstacles: string
  clarityScore: number
  excitementScore: number
  date: string
  createdAt: string
}

const TIMEFRAME_CONFIG: Record<VisionTimeframe, { label: string; emoji: string; color: string }> = {
  '1-year':   { label: '1 Year',    emoji: '📅', color: '#22c55e' },
  '3-years':  { label: '3 Years',   emoji: '🗓️', color: '#3b82f6' },
  '5-years':  { label: '5 Years',   emoji: '🌟', color: '#6366f1' },
  '10-years': { label: '10 Years',  emoji: '🚀', color: '#a855f7' },
  '20-years': { label: '20 Years',  emoji: '🌄', color: '#f59e0b' },
  lifetime:   { label: 'Lifetime',  emoji: '♾️', color: '#f97316' },
}

const DOMAIN_CONFIG: Record<VisionDomain, { label: string; emoji: string }> = {
  career:          { label: 'Career',         emoji: '💼' },
  financial:       { label: 'Financial',      emoji: '💰' },
  health:          { label: 'Health',         emoji: '💪' },
  relationships:   { label: 'Relationships',  emoji: '❤️' },
  'personal-growth': { label: 'Growth',       emoji: '🌱' },
  creative:        { label: 'Creative',       emoji: '🎨' },
  spiritual:       { label: 'Spiritual',      emoji: '✨' },
  impact:          { label: 'Impact',         emoji: '🌍' },
  lifestyle:       { label: 'Lifestyle',      emoji: '🌴' },
  legacy:          { label: 'Legacy',         emoji: '🏛️' },
}

const STATUS_CONFIG: Record<VisionStatus, { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: '#94a3b8' },
  active:   { label: 'Active',   color: '#22c55e' },
  revised:  { label: 'Revised',  color: '#f59e0b' },
  achieved: { label: 'Achieved', color: '#3b82f6' },
  evolved:  { label: 'Evolved',  color: '#a855f7' },
}

const STORAGE_KEY = 'strategic_vision'

export default function StrategicVision() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VisionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<VisionEntry, 'id' | 'createdAt'>>({
    timeframe: '5-years', domain: 'career', status: 'active', vision: '',
    whyItMatters: '', whatItLooksLike: '', keyMilestones: '', firstNextStep: '',
    obstacles: '', clarityScore: 7, excitementScore: 9,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: VisionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.vision.trim()) return
    const e: VisionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, vision: '', whyItMatters: '', whatItLooksLike: '', keyMilestones: '', firstNextStep: '', obstacles: '' }))
    setShowForm(false)
    toastSuccess('Strategic vision documented — begin with the end in mind 🧭')
  }

  const active = entries.filter(e => e.status === 'active').length
  const avgExcitement = entries.length ? Math.round(entries.reduce((s, e) => s + e.excitementScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-emerald-400" />
            Strategic Vision
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define your long-term vision across all life domains.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Define
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Visions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgExcitement}/10</div>
          <div className="text-xs text-slate-500">Avg Excitement</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Define Strategic Vision</h3>
          <div className="flex gap-2">
            <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value as VisionTimeframe }))} className="game-input text-sm flex-1">
              {(Object.entries(TIMEFRAME_CONFIG) as [VisionTimeframe, typeof TIMEFRAME_CONFIG['1-year']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as VisionDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [VisionDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
            placeholder="Describe your vision in vivid detail *" className="game-input w-full h-16 resize-none text-sm" autoFocus />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this vision matter to you?" className="game-input w-full text-sm" />
          <input value={form.whatItLooksLike} onChange={e => setForm(f => ({ ...f, whatItLooksLike: e.target.value }))}
            placeholder="What does a day in this vision look like?" className="game-input w-full text-sm" />
          <input value={form.keyMilestones} onChange={e => setForm(f => ({ ...f, keyMilestones: e.target.value }))}
            placeholder="3 key milestones on the path" className="game-input w-full text-sm" />
          <input value={form.firstNextStep} onChange={e => setForm(f => ({ ...f, firstNextStep: e.target.value }))}
            placeholder="First next step you can take this week" className="game-input w-full text-sm" />
          <input value={form.obstacles} onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
            placeholder="Main obstacles to overcome" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Clarity: {form.clarityScore}/10</p>
              <input type="range" min={1} max={10} value={form.clarityScore}
                onChange={e => setForm(f => ({ ...f, clarityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Excitement: {form.excitementScore}/10</p>
              <input type="range" min={1} max={10} value={form.excitementScore}
                onChange={e => setForm(f => ({ ...f, excitementScore: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save Vision</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TIMEFRAME_CONFIG[e.timeframe]
          const d = DOMAIN_CONFIG[e.domain]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{d.emoji} {d.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">🔥 {e.excitementScore}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.vision}</p>
                {e.firstNextStep && <p className="text-xs text-green-300/70 mt-0.5">→ {e.firstNextStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Strategy without vision is noise. Define where you're going.</p>
          </div>
        )}
      </div>
    </div>
  )
}

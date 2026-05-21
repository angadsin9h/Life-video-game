import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AlignmentArea = 'work' | 'relationships' | 'health' | 'finances' | 'spirituality' | 'creativity' | 'community' | 'learning' | 'rest' | 'environment'
type AlignmentLevel = 'misaligned' | 'slightly' | 'neutral' | 'aligned' | 'deeply-aligned'

interface AlignmentEntry {
  id: string
  area: AlignmentArea
  level: AlignmentLevel
  coreValue: string
  currentReality: string
  gapDescription: string
  alignmentAction: string
  whyItMatters: string
  alignmentScore: number
  energyImpact: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<AlignmentArea, { label: string; emoji: string; color: string }> = {
  work:         { label: 'Work',         emoji: '💼', color: '#3b82f6' },
  relationships:{ label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  finances:     { label: 'Finances',     emoji: '💰', color: '#f59e0b' },
  spirituality: { label: 'Spirituality', emoji: '✨', color: '#a855f7' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#f97316' },
  community:    { label: 'Community',    emoji: '🌍', color: '#84cc16' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#6366f1' },
  rest:         { label: 'Rest',         emoji: '😴', color: '#94a3b8' },
  environment:  { label: 'Environment',  emoji: '🏠', color: '#0ea5e9' },
}

const LEVEL_CONFIG: Record<AlignmentLevel, { label: string; color: string; pct: number }> = {
  misaligned:     { label: 'Misaligned',      color: '#ef4444', pct: 10 },
  slightly:       { label: 'Slightly Aligned', color: '#f97316', pct: 30 },
  neutral:        { label: 'Neutral',          color: '#f59e0b', pct: 50 },
  aligned:        { label: 'Aligned',          color: '#22c55e', pct: 75 },
  'deeply-aligned':{ label: 'Deeply Aligned',  color: '#a855f7', pct: 100 },
}

const STORAGE_KEY = 'purpose_alignment'

export default function PurposeAlignment() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AlignmentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AlignmentEntry, 'id' | 'createdAt'>>({
    area: 'work', level: 'aligned', coreValue: '', currentReality: '',
    gapDescription: '', alignmentAction: '', whyItMatters: '',
    alignmentScore: 7, energyImpact: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AlignmentEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.coreValue.trim()) return
    const e: AlignmentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, coreValue: '', currentReality: '', gapDescription: '', alignmentAction: '', whyItMatters: '' }))
    setShowForm(false)
    toastSuccess('Purpose alignment checked — live in alignment 🧭')
  }

  const deeplyAligned = entries.filter(e => e.level === 'deeply-aligned').length
  const avgAlignment = entries.length ? Math.round(entries.reduce((s, e) => s + e.alignmentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-green-400" />
            Purpose Alignment
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Check if each life area aligns with your deepest values.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Check
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Checks</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{deeplyAligned}</div>
          <div className="text-xs text-slate-500">Deeply Aligned</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgAlignment}/10</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Check Purpose Alignment</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as AlignmentArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [AlignmentArea, typeof AREA_CONFIG.work][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as AlignmentLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [AlignmentLevel, typeof LEVEL_CONFIG.aligned][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.coreValue} onChange={e => setForm(f => ({ ...f, coreValue: e.target.value }))}
            placeholder="Core value this area should express *" className="game-input w-full text-sm" autoFocus />
          <input value={form.currentReality} onChange={e => setForm(f => ({ ...f, currentReality: e.target.value }))}
            placeholder="Current reality in this area" className="game-input w-full text-sm" />
          <input value={form.gapDescription} onChange={e => setForm(f => ({ ...f, gapDescription: e.target.value }))}
            placeholder="What's the gap between ideal and reality?" className="game-input w-full text-sm" />
          <input value={form.alignmentAction} onChange={e => setForm(f => ({ ...f, alignmentAction: e.target.value }))}
            placeholder="One action to increase alignment" className="game-input w-full text-sm" />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why alignment here matters to your purpose" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Alignment: {form.alignmentScore}/10</p>
              <input type="range" min={1} max={10} value={form.alignmentScore}
                onChange={e => setForm(f => ({ ...f, alignmentScore: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy impact: {form.energyImpact}/10</p>
              <input type="range" min={1} max={10} value={form.energyImpact}
                onChange={e => setForm(f => ({ ...f, energyImpact: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log Alignment</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const l = LEVEL_CONFIG[e.level]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  <span className="text-xs text-green-400">🎯 {e.alignmentScore}/10</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">Value: {e.coreValue}</p>
                <div className="mt-1 bg-slate-700 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${l.pct}%`, background: l.color }} />
                </div>
                {e.alignmentAction && <p className="text-xs text-green-300/70 mt-0.5">→ {e.alignmentAction}</p>}
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
            <p className="text-sm">Alignment is peace. Misalignment is suffering. Choose wisely.</p>
          </div>
        )}
      </div>
    </div>
  )
}

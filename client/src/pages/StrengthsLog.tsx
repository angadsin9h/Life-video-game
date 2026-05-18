import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StrengthCategory = 'cognitive' | 'emotional' | 'social' | 'creative' | 'physical' | 'leadership' | 'technical' | 'spiritual' | 'practical' | 'other'
type StrengthLevel = 'emerging' | 'developing' | 'solid' | 'strong' | 'signature'

interface Strength {
  id: string
  category: StrengthCategory
  level: StrengthLevel
  name: string
  evidence: string
  howUsed: string
  howGrow: string
  relatedTo: string
  energizing: boolean
  confidence: number
  createdAt: string
}

const CAT_CONFIG: Record<StrengthCategory, { label: string; emoji: string; color: string }> = {
  cognitive:   { label: 'Cognitive',    emoji: '🧠', color: '#3b82f6' },
  emotional:   { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  social:      { label: 'Social',       emoji: '👥', color: '#22c55e' },
  creative:    { label: 'Creative',     emoji: '🎨', color: '#f97316' },
  physical:    { label: 'Physical',     emoji: '💪', color: '#ef4444' },
  leadership:  { label: 'Leadership',   emoji: '👑', color: '#f59e0b' },
  technical:   { label: 'Technical',    emoji: '⚙️', color: '#6366f1' },
  spiritual:   { label: 'Spiritual',    emoji: '✨', color: '#84cc16' },
  practical:   { label: 'Practical',    emoji: '🔧', color: '#0ea5e9' },
  other:       { label: 'Other',        emoji: '⭐', color: '#94a3b8' },
}

const LEVEL_CONFIG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  emerging:    { label: 'Emerging',    color: '#94a3b8', bars: 1 },
  developing:  { label: 'Developing',  color: '#3b82f6', bars: 2 },
  solid:       { label: 'Solid',       color: '#22c55e', bars: 3 },
  strong:      { label: 'Strong',      color: '#f59e0b', bars: 4 },
  signature:   { label: 'Signature ★', color: '#a855f7', bars: 5 },
}

const KNOWN_STRENGTHS = [
  'Analytical thinking', 'Empathy', 'Creativity', 'Communication', 'Problem-solving',
  'Adaptability', 'Leadership', 'Strategic thinking', 'Resilience', 'Attention to detail',
  'Curiosity', 'Collaboration', 'Self-awareness', 'Discipline', 'Optimism',
]

const STORAGE_KEY = 'strengths_log'

export default function StrengthsLog() {
  const { toastSuccess } = useToast()
  const [strengths, setStrengths] = useState<Strength[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<Strength, 'id' | 'createdAt'>>({
    category: 'cognitive', level: 'solid', name: '', evidence: '', howUsed: '',
    howGrow: '', relatedTo: '', energizing: true, confidence: 7,
  })

  useEffect(() => {
    try { setStrengths(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Strength[]) => { setStrengths(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const s: Strength = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...strengths])
    setForm(f => ({ ...f, name: '', evidence: '', howUsed: '', howGrow: '', relatedTo: '' }))
    setShowForm(false)
    toastSuccess('Strength logged ⚡')
  }

  const filtered = strengths.filter(s => filterCat === 'all' || s.category === filterCat)
  const signature = strengths.filter(s => s.level === 'signature').length
  const energizing = strengths.filter(s => s.energizing).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Strengths Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Know your superpowers and build on them intentionally.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{strengths.length}</div>
          <div className="text-xs text-slate-500">Identified</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{signature}</div>
          <div className="text-xs text-slate-500">Signature</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{energizing}</div>
          <div className="text-xs text-slate-500">Energizing</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [StrengthCategory, typeof CAT_CONFIG.cognitive][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Strength</h3>
          <div className="flex gap-1.5 flex-wrap">
            {KNOWN_STRENGTHS.slice(0, 8).map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, name: s }))}
                className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-lg text-xs">{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as StrengthCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [StrengthCategory, typeof CAT_CONFIG.cognitive][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as StrengthLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [StrengthLevel, typeof LEVEL_CONFIG.solid][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Strength name *" className="game-input w-full" autoFocus />
          <textarea value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence — when have you demonstrated this?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howUsed} onChange={e => setForm(f => ({ ...f, howUsed: e.target.value }))}
            placeholder="How do you currently use this?" className="game-input w-full text-sm" />
          <input value={form.howGrow} onChange={e => setForm(f => ({ ...f, howGrow: e.target.value }))}
            placeholder="How could you grow or leverage it more?" className="game-input w-full text-sm" />
          <input value={form.relatedTo} onChange={e => setForm(f => ({ ...f, relatedTo: e.target.value }))}
            placeholder="Related strengths or skills" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Confidence: {form.confidence}/10</p>
              <input type="range" min={1} max={10} value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.energizing} onChange={e => setForm(f => ({ ...f, energizing: e.target.checked }))} />
              Energizing
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const c = CAT_CONFIG[s.category]
          const l = LEVEL_CONFIG[s.level]
          return (
            <div key={s.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${l.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{s.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  {s.energizing && <span className="text-xs text-yellow-400">⚡</span>}
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-4 h-1.5 rounded-full" style={{ background: i <= l.bars ? l.color : '#334155' }} />
                  ))}
                </div>
                {s.evidence && <p className="text-xs text-slate-500 mt-1">{s.evidence}</p>}
              </div>
              <button onClick={() => save(strengths.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You have more strengths than you realize. Start naming them.</p>
          </div>
        )}
      </div>
    </div>
  )
}

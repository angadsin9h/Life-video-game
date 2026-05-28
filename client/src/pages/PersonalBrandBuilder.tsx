import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BrandArea = 'mission' | 'values' | 'skills' | 'story' | 'audience' | 'content' | 'presence' | 'goals' | 'wins' | 'other'

interface BrandEntry {
  id: string
  area: BrandArea
  title: string
  content: string
  actionItems: string
  status: 'draft' | 'active' | 'done'
  createdAt: string
}

const AREA_CONFIG: Record<BrandArea, { label: string; emoji: string; color: string; description: string }> = {
  mission:   { label: 'Mission',        emoji: '🎯', color: '#ef4444', description: 'What you stand for and why' },
  values:    { label: 'Core Values',    emoji: '💎', color: '#6366f1', description: 'Non-negotiable principles' },
  skills:    { label: 'Signature Skills',emoji: '⚡', color: '#f59e0b', description: 'What you do uniquely well' },
  story:     { label: 'Brand Story',    emoji: '📖', color: '#a855f7', description: 'Your compelling origin story' },
  audience:  { label: 'Target Audience',emoji: '👥', color: '#3b82f6', description: 'Who you serve and impact' },
  content:   { label: 'Content Pillars',emoji: '📱', color: '#22c55e', description: 'Themes you create around' },
  presence:  { label: 'Online Presence',emoji: '🌐', color: '#0ea5e9', description: 'Your digital footprint' },
  goals:     { label: 'Brand Goals',    emoji: '🚀', color: '#f97316', description: 'Where your brand is headed' },
  wins:      { label: 'Wins & Proof',   emoji: '🏆', color: '#84cc16', description: 'Evidence of your impact' },
  other:     { label: 'Other',          emoji: '✨', color: '#94a3b8', description: 'Miscellaneous brand work' },
}

const STORAGE_KEY = 'personal_brand_builder'

export default function PersonalBrandBuilder() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BrandEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<BrandEntry, 'id' | 'createdAt'>>({
    area: 'mission', title: '', content: '', actionItems: '', status: 'draft',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BrandEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const e: BrandEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ area: 'mission', title: '', content: '', actionItems: '', status: 'draft' })
    setShowForm(false)
    toastSuccess('Brand element saved ⚡')
  }

  const filtered = entries.filter(e => filterArea === 'all' || e.area === filterArea)
  const completedAreas = [...new Set(entries.filter(e => e.status === 'active' || e.status === 'done').map(e => e.area))].length
  const brandScore = Math.round((completedAreas / Object.keys(AREA_CONFIG).length) * 100)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-orange-400" />
            Brand Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your personal brand systematically.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="game-card p-4 border border-orange-500/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500">Brand Completeness</span>
          <span className="text-sm font-bold text-orange-400">{brandScore}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${brandScore}%` }} />
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {Object.entries(AREA_CONFIG).map(([k, a]) => {
            const has = entries.some(e => e.area === k)
            return (
              <span key={k} className={`text-xs px-1.5 py-0.5 rounded ${has ? '' : 'opacity-30'}`}
                style={has ? { background: a.color + '30', color: a.color } : { background: '#1e293b', color: '#64748b' }}>
                {a.emoji}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(AREA_CONFIG).map(([k, a]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Brand Element</h3>
          <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as BrandArea }))} className="game-input text-sm w-full">
            {(Object.entries(AREA_CONFIG) as [BrandArea, typeof AREA_CONFIG.mission][]).map(([k, a]) => (
              <option key={k} value={k}>{a.emoji} {a.label} — {a.description}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Content / details *" className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
            placeholder="Action items..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            {(['draft', 'active', 'done'] as const).map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`flex-1 py-1.5 rounded-xl text-xs capitalize ${form.status === s ? 'bg-orange-700/30 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                {s}
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
        {filtered.map(e => {
          const a = AREA_CONFIG[e.area]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-white text-sm">{e.title}</span>
                  <p className="text-xs text-slate-500">{a.label} · {e.status}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300">{e.content}</p>
                  {e.actionItems && <p className="text-xs text-orange-300">⚡ {e.actionItems}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your brand element by element.</p>
          </div>
        )}
      </div>
    </div>
  )
}

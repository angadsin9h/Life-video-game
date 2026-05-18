import { useState, useEffect } from 'react'
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SWOTQuadrant = 'strength' | 'weakness' | 'opportunity' | 'threat'
type SWOTDomain = 'career' | 'health' | 'relationships' | 'finance' | 'skills' | 'mindset' | 'personal' | 'other'

interface SWOTEntry {
  id: string
  quadrant: SWOTQuadrant
  domain: SWOTDomain
  title: string
  description: string
  actionable: string
  priority: number
  isAddressed: boolean
  createdAt: string
}

const QUADRANT_CONFIG: Record<SWOTQuadrant, { label: string; emoji: string; color: string; description: string }> = {
  strength:    { label: 'Strength',    emoji: '💪', color: '#22c55e', description: 'What you do well' },
  weakness:    { label: 'Weakness',    emoji: '⚠️', color: '#ef4444', description: 'Areas to improve' },
  opportunity: { label: 'Opportunity', emoji: '🚀', color: '#3b82f6', description: 'External possibilities' },
  threat:      { label: 'Threat',      emoji: '🛡️', color: '#f97316', description: 'External risks' },
}

const DOMAIN_CONFIG: Record<SWOTDomain, { label: string; emoji: string }> = {
  career:        { label: 'Career',        emoji: '💼' },
  health:        { label: 'Health',        emoji: '💪' },
  relationships: { label: 'Relationships', emoji: '❤️' },
  finance:       { label: 'Finance',       emoji: '💰' },
  skills:        { label: 'Skills',        emoji: '⚡' },
  mindset:       { label: 'Mindset',       emoji: '🧠' },
  personal:      { label: 'Personal',      emoji: '🌟' },
  other:         { label: 'Other',         emoji: '📌' },
}

const STORAGE_KEY = 'personal_swot'

export default function PersonalSWOT() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SWOTEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterQuadrant, setFilterQuadrant] = useState<string>('all')
  const [form, setForm] = useState<Omit<SWOTEntry, 'id' | 'createdAt'>>({
    quadrant: 'strength', domain: 'personal', title: '', description: '',
    actionable: '', priority: 5, isAddressed: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SWOTEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: SWOTEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', actionable: '' }))
    setShowForm(false)
    toastSuccess('SWOT entry added 📊')
  }

  const filtered = filterQuadrant === 'all' ? entries : entries.filter(e => e.quadrant === filterQuadrant)
  const counts = {
    strength: entries.filter(e => e.quadrant === 'strength').length,
    weakness: entries.filter(e => e.quadrant === 'weakness').length,
    opportunity: entries.filter(e => e.quadrant === 'opportunity').length,
    threat: entries.filter(e => e.quadrant === 'threat').length,
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Personal SWOT
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Analyze yourself strategically with SWOT analysis.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(QUADRANT_CONFIG) as [SWOTQuadrant, typeof QUADRANT_CONFIG.strength][]).map(([k, q]) => (
          <div key={k} className="game-card p-3 text-center" style={{ borderTop: `2px solid ${q.color}` }}>
            <div className="text-xl">{q.emoji}</div>
            <div className="font-bold text-lg" style={{ color: q.color }}>{counts[k]}</div>
            <div className="text-xs text-slate-500">{q.label}s</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterQuadrant('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterQuadrant === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(QUADRANT_CONFIG) as [SWOTQuadrant, typeof QUADRANT_CONFIG.strength][]).map(([k, q]) => (
          <button key={k} onClick={() => setFilterQuadrant(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterQuadrant === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterQuadrant === k ? { background: q.color + '30', color: q.color } : {}}>
            {q.emoji} {q.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add SWOT Entry</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Quadrant</p>
              <select value={form.quadrant} onChange={e => setForm(f => ({ ...f, quadrant: e.target.value as SWOTQuadrant }))} className="game-input w-full text-sm">
                {(Object.entries(QUADRANT_CONFIG) as [SWOTQuadrant, typeof QUADRANT_CONFIG.strength][]).map(([k, q]) => (
                  <option key={k} value={k}>{q.emoji} {q.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Domain</p>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as SWOTDomain }))} className="game-input w-full text-sm">
                {(Object.entries(DOMAIN_CONFIG) as [SWOTDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
                  <option key={k} value={k}>{d.emoji} {d.label}</option>
                ))}
              </select>
            </div>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What is it? *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this strength / weakness / opportunity / threat..." className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.actionable} onChange={e => setForm(f => ({ ...f, actionable: e.target.value }))}
            placeholder="What action will you take about this?" className="game-input w-full h-12 resize-none text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority: {form.priority}/10</p>
            <input type="range" min={1} max={10} value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const q = QUADRANT_CONFIG[e.quadrant]
          const d = DOMAIN_CONFIG[e.domain]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${q.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    {e.isAddressed && <span className="text-xs text-green-500">✅</span>}
                  </div>
                  <p className="text-xs text-slate-500">{d.emoji} {d.label} · priority {e.priority}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  {e.actionable && <p className="text-xs text-blue-300">→ Action: {e.actionable}</p>}
                  <div className="flex gap-2 items-center">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, isAddressed: !x.isAddressed } : x))}
                      className="text-xs text-green-600 hover:text-green-400">
                      {e.isAddressed ? 'Mark unaddressed' : 'Mark addressed'}
                    </button>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Know yourself strategically. Build on strengths, address weaknesses.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LegacyCategory = 'impact' | 'values' | 'relationships' | 'work' | 'community' | 'knowledge' | 'memories' | 'wisdom' | 'mission' | 'eulogy'

interface LegacyEntry {
  id: string
  category: LegacyCategory
  title: string
  content: string
  impact: string
  who: string
  timeframe: string
  status: 'idea' | 'in-progress' | 'achieved'
  importance: number
  createdAt: string
}

const CAT_CONFIG: Record<LegacyCategory, { label: string; emoji: string; color: string; description: string }> = {
  impact:        { label: 'Impact',       emoji: '🌍', color: '#3b82f6', description: 'How you changed the world' },
  values:        { label: 'Values',       emoji: '💎', color: '#6366f1', description: 'What you stood for' },
  relationships: { label: 'Relationships',emoji: '❤️', color: '#ec4899', description: 'How you loved' },
  work:          { label: 'Work',         emoji: '💼', color: '#f59e0b', description: 'What you built' },
  community:     { label: 'Community',    emoji: '🏘️', color: '#22c55e', description: 'How you served' },
  knowledge:     { label: 'Knowledge',    emoji: '📚', color: '#a855f7', description: 'What you taught' },
  memories:      { label: 'Memories',     emoji: '📸', color: '#f97316', description: 'How you will be remembered' },
  wisdom:        { label: 'Wisdom',       emoji: '🦉', color: '#84cc16', description: 'What wisdom you pass on' },
  mission:       { label: 'Mission',      emoji: '🎯', color: '#0ea5e9', description: 'Your purpose and calling' },
  eulogy:        { label: 'Eulogy',       emoji: '✨', color: '#94a3b8', description: 'What you want said at your funeral' },
}

const STORAGE_KEY = 'personal_legacy'

export default function PersonalLegacy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LegacyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<LegacyEntry, 'id' | 'createdAt'>>({
    category: 'impact', title: '', content: '', impact: '',
    who: '', timeframe: '', status: 'idea', importance: 5,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LegacyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const e: LegacyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', content: '', impact: '', who: '', timeframe: '' }))
    setShowForm(false)
    toastSuccess('Legacy entry added ✨')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const achieved = entries.filter(e => e.status === 'achieved').length
  const avgImportance = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.importance, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Personal Legacy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define and build the legacy you want to leave.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgImportance}</div>
          <div className="text-xs text-slate-500">Avg Importance</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [LegacyCategory, typeof CAT_CONFIG.impact][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Legacy Entry</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as LegacyCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [LegacyCategory, typeof CAT_CONFIG.impact][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label} — {c.description}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Describe this aspect of your legacy... *" className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Who / what will be impacted?" className="game-input w-full text-sm" />
          <input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}
            placeholder="Timeframe (e.g., in 10 years, by end of life)" className="game-input w-full text-sm" />
          <div className="flex gap-2 items-center">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LegacyEntry['status'] }))} className="game-input text-sm flex-1">
              <option value="idea">💡 Idea</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="achieved">✅ Achieved</option>
            </select>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Importance: {form.importance}/5</p>
              <input type="range" min={1} max={5} value={form.importance}
                onChange={e => setForm(f => ({ ...f, importance: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const isExp = expanded === e.id
          const statusColor = e.status === 'achieved' ? '#22c55e' : e.status === 'in-progress' ? '#f59e0b' : '#94a3b8'
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusColor + '20', color: statusColor }}>
                      {e.status === 'achieved' ? '✅' : e.status === 'in-progress' ? '🔄' : '💡'} {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · Importance {'⭐'.repeat(e.importance)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-300">{e.content}</p>
                  {e.impact && <p className="text-xs text-blue-300">🌍 Impact: {e.impact}</p>}
                  {e.timeframe && <p className="text-xs text-yellow-300">⏰ {e.timeframe}</p>}
                  <div className="flex gap-2 mt-1">
                    <select value={e.status} onChange={ev => save(entries.map(x => x.id === e.id ? { ...x, status: ev.target.value as LegacyEntry['status'] } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      <option value="idea">💡 Idea</option>
                      <option value="in-progress">🔄 In Progress</option>
                      <option value="achieved">✅ Achieved</option>
                    </select>
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
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Begin with the end in mind. What legacy will you leave?</p>
          </div>
        )}
      </div>
    </div>
  )
}

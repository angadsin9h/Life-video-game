import { useState, useEffect } from 'react'
import { Pencil, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CreativeType = 'writing' | 'drawing' | 'music' | 'photography' | 'video' | 'design' | 'craft' | 'coding' | 'cooking' | 'other'
type CreativeStatus = 'idea' | 'in-progress' | 'completed' | 'abandoned'

interface CreativeWork {
  id: string
  title: string
  type: CreativeType
  status: CreativeStatus
  description: string
  inspiration: string
  tools: string
  timeSpent: number
  dateStarted: string
  dateCompleted: string
  notes: string
  rating: number
  createdAt: string
}

const TYPE_CONFIG: Record<CreativeType, { label: string; emoji: string; color: string }> = {
  writing:     { label: 'Writing',      emoji: '✍️', color: '#6366f1' },
  drawing:     { label: 'Drawing',      emoji: '🎨', color: '#ec4899' },
  music:       { label: 'Music',        emoji: '🎵', color: '#f59e0b' },
  photography: { label: 'Photography',  emoji: '📷', color: '#3b82f6' },
  video:       { label: 'Video',        emoji: '🎬', color: '#ef4444' },
  design:      { label: 'Design',       emoji: '💎', color: '#a855f7' },
  craft:       { label: 'Craft',        emoji: '🧵', color: '#22c55e' },
  coding:      { label: 'Coding',       emoji: '💻', color: '#0ea5e9' },
  cooking:     { label: 'Cooking',      emoji: '👨‍🍳', color: '#f97316' },
  other:       { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<CreativeStatus, { label: string; color: string }> = {
  idea:         { label: 'Idea',        color: '#94a3b8' },
  'in-progress':{ label: 'In Progress', color: '#3b82f6' },
  completed:    { label: 'Completed',   color: '#22c55e' },
  abandoned:    { label: 'Abandoned',   color: '#ef4444' },
}

const STORAGE_KEY = 'creativity_log'

export default function CreativityLog() {
  const { toastSuccess } = useToast()
  const [works, setWorks] = useState<CreativeWork[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<CreativeWork, 'id' | 'createdAt'>>({
    title: '', type: 'writing', status: 'idea', description: '', inspiration: '',
    tools: '', timeSpent: 0, dateStarted: new Date().toISOString().split('T')[0],
    dateCompleted: '', notes: '', rating: 0,
  })

  useEffect(() => {
    try { setWorks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CreativeWork[]) => { setWorks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const w: CreativeWork = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([w, ...works])
    setForm({ title: '', type: 'writing', status: 'idea', description: '', inspiration: '', tools: '', timeSpent: 0, dateStarted: new Date().toISOString().split('T')[0], dateCompleted: '', notes: '', rating: 0 })
    setShowForm(false)
    toastSuccess('Creative work logged ✨')
  }

  const filtered = works.filter(w => filterType === 'all' || w.type === filterType)
  const completed = works.filter(w => w.status === 'completed').length
  const totalHours = Math.round(works.reduce((s, w) => s + w.timeSpent, 0) / 60 * 10) / 10

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Pencil className="w-7 h-7 text-purple-400" />
            Creativity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your creative projects and output.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{works.length}</div>
          <div className="text-xs text-slate-500">Projects</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Hours</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Creative Work</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Project title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CreativeType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CreativeType, typeof TYPE_CONFIG.writing][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CreativeStatus }))} className="game-input text-sm">
              {(Object.entries(STATUS_CONFIG) as [CreativeStatus, typeof STATUS_CONFIG.idea][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this project about?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.inspiration} onChange={e => setForm(f => ({ ...f, inspiration: e.target.value }))}
              placeholder="What inspired it?" className="game-input flex-1 text-sm" />
            <input value={form.tools} onChange={e => setForm(f => ({ ...f, tools: e.target.value }))}
              placeholder="Tools used" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Time spent (min)</p>
              <input type="number" value={form.timeSpent || ''} min={0}
                onChange={e => setForm(f => ({ ...f, timeSpent: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setForm(f => ({ ...f, rating: r }))}
                    className={`text-lg ${r <= form.rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(w => {
          const t = TYPE_CONFIG[w.type]
          const s = STATUS_CONFIG[w.status]
          const isExp = expanded === w.id
          return (
            <div key={w.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : w.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{w.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label}{w.timeSpent > 0 && ` · ${Math.round(w.timeSpent/60*10)/10}h`}{w.rating > 0 && ` · ${'★'.repeat(w.rating)}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {w.description && <p className="text-xs text-slate-300">{w.description}</p>}
                  {w.inspiration && <p className="text-xs text-purple-300">💡 {w.inspiration}</p>}
                  {w.tools && <p className="text-xs text-slate-500">🛠️ {w.tools}</p>}
                  <button onClick={() => save(works.filter(x => x.id !== w.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Pencil className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log your creative work and watch your portfolio grow.</p>
          </div>
        )}
      </div>
    </div>
  )
}

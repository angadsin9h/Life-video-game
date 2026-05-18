import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelCategory = 'romantic' | 'family' | 'friendship' | 'professional' | 'community' | 'self'
type GoalStatus = 'active' | 'achieved' | 'paused'

interface RelGoal {
  id: string
  person: string
  category: RelCategory
  goal: string
  why: string
  actions: string
  status: GoalStatus
  progress: number
  targetDate: string
  notes: string
  createdAt: string
}

const CAT_CONFIG: Record<RelCategory, { label: string; emoji: string; color: string }> = {
  romantic:     { label: 'Romantic',     emoji: '💕', color: '#ec4899' },
  family:       { label: 'Family',       emoji: '👨‍👩‍👧', color: '#f59e0b' },
  friendship:   { label: 'Friendship',   emoji: '👫', color: '#3b82f6' },
  professional: { label: 'Professional', emoji: '🤝', color: '#6366f1' },
  community:    { label: 'Community',    emoji: '🌍', color: '#22c55e' },
  self:         { label: 'Self-Love',    emoji: '💙', color: '#a855f7' },
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active:   { label: 'Active',   color: '#3b82f6' },
  achieved: { label: 'Achieved', color: '#22c55e' },
  paused:   { label: 'Paused',   color: '#f59e0b' },
}

const STORAGE_KEY = 'relationship_goals'

export default function RelationshipGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<RelGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<RelGoal, 'id' | 'createdAt'>>({
    person: '', category: 'friendship', goal: '', why: '',
    actions: '', status: 'active', progress: 0, targetDate: '', notes: '',
  })

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RelGoal[]) => { setGoals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goal.trim()) return
    const g: RelGoal = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...goals])
    setForm({ person: '', category: 'friendship', goal: '', why: '', actions: '', status: 'active', progress: 0, targetDate: '', notes: '' })
    setShowForm(false)
    toastSuccess('Relationship goal set 💕')
  }

  const filtered = goals.filter(g => filterCat === 'all' || g.category === filterCat)
  const achieved = goals.filter(g => g.status === 'achieved').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Relationship Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Intentionally nurture your most important relationships.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{goals.length}</div>
          <div className="text-xs text-slate-500">Goals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{goals.filter(g => g.status === 'active').length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(CAT_CONFIG).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Goal</h3>
          <div className="flex gap-2">
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="Person / relationship" className="game-input flex-1" autoFocus />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as RelCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [RelCategory, typeof CAT_CONFIG.friendship][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="What do you want to achieve in this relationship? *" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this matter?" className="game-input w-full h-10 resize-none text-sm" />
          <textarea value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
            placeholder="Actions you'll take..." className="game-input w-full h-10 resize-none text-sm" />
          <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="game-input text-sm w-full" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Progress: {form.progress}%</span>
            <input type="range" min={0} max={100} step={5} value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
              className="flex-1 h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(g => {
          const c = CAT_CONFIG[g.category]
          const s = STATUS_CONFIG[g.status]
          const isExp = expanded === g.id
          return (
            <div key={g.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : g.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{g.person || g.category}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{g.goal}</p>
                  <div className="h-1 bg-slate-800 rounded-full mt-1 w-24">
                    <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: c.color }} />
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {g.why && <p className="text-xs text-slate-400 italic">"{g.why}"</p>}
                  {g.actions && <p className="text-xs text-blue-300">🎯 {g.actions}</p>}
                  {g.targetDate && <p className="text-xs text-slate-500">📅 Target: {g.targetDate}</p>}
                  <div className="flex gap-2">
                    {g.status !== 'achieved' && (
                      <button onClick={() => { save(goals.map(x => x.id === g.id ? { ...x, status: 'achieved' } : x)); toastSuccess('Relationship goal achieved! 💕') }}
                        className="flex-1 py-1.5 bg-green-700/20 text-green-400 rounded-xl text-xs">
                        <Check className="w-3 h-3 inline mr-1" />Achieved
                      </button>
                    )}
                    <button onClick={() => save(goals.filter(x => x.id !== g.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
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
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Set intentions for the relationships that matter most.</p>
          </div>
        )}
      </div>
    </div>
  )
}

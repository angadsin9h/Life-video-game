import { useState, useEffect } from 'react'
import { Home, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FamilyGoalArea = 'communication' | 'traditions' | 'finances' | 'health' | 'education' | 'travel' | 'bonding' | 'support' | 'legacy' | 'other'
type FamilyGoalStatus = 'planned' | 'active' | 'achieved' | 'paused'

interface FamilyGoalEntry {
  id: string
  area: FamilyGoalArea
  status: FamilyGoalStatus
  goal: string
  whoInvolved: string
  milestones: string[]
  progress: number
  targetDate: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<FamilyGoalArea, { label: string; emoji: string; color: string }> = {
  communication: { label: 'Communication', emoji: '💬', color: '#3b82f6' },
  traditions:    { label: 'Traditions',    emoji: '🎉', color: '#f59e0b' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#22c55e' },
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  education:     { label: 'Education',     emoji: '📚', color: '#6366f1' },
  travel:        { label: 'Travel',        emoji: '✈️', color: '#0ea5e9' },
  bonding:       { label: 'Bonding',       emoji: '🤝', color: '#ec4899' },
  support:       { label: 'Support',       emoji: '❤️', color: '#f97316' },
  legacy:        { label: 'Legacy',        emoji: '🌳', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '🏠', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<FamilyGoalStatus, { label: string; color: string }> = {
  planned:  { label: 'Planned',  color: '#94a3b8' },
  active:   { label: 'Active',   color: '#3b82f6' },
  achieved: { label: 'Achieved', color: '#22c55e' },
  paused:   { label: 'Paused',   color: '#f59e0b' },
}

const STORAGE_KEY = 'family_goals'

export default function FamilyGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<FamilyGoalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')
  const [form, setForm] = useState<Omit<FamilyGoalEntry, 'id' | 'createdAt'>>({
    area: 'bonding', status: 'planned', goal: '', whoInvolved: '',
    milestones: [], progress: 0, targetDate: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FamilyGoalEntry[]) => { setGoals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setForm(f => ({ ...f, milestones: [...f.milestones, newMilestone.trim()] }))
    setNewMilestone('')
  }

  const submit = () => {
    if (!form.goal.trim()) return
    const g: FamilyGoalEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...goals])
    setForm(f => ({ ...f, goal: '', whoInvolved: '', milestones: [], progress: 0, targetDate: '' }))
    setNewMilestone('')
    setShowForm(false)
    toastSuccess('Family goal set 🏠')
  }

  const achieved = goals.filter(g => g.status === 'achieved').length
  const active = goals.filter(g => g.status === 'active').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Home className="w-7 h-7 text-orange-400" />
            Family Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set and track goals for your family unit.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{goals.length}</div>
          <div className="text-xs text-slate-500">Total Goals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Family Goal</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as FamilyGoalArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [FamilyGoalArea, typeof AREA_CONFIG.bonding][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FamilyGoalStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [FamilyGoalStatus, typeof STATUS_CONFIG.planned][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Describe the family goal *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.whoInvolved} onChange={e => setForm(f => ({ ...f, whoInvolved: e.target.value }))}
            placeholder="Who's involved? (family members)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
              placeholder="Add milestone..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addMilestone() }} />
            <button onClick={addMilestone} className="px-3 py-1.5 bg-orange-700/30 text-orange-400 rounded-xl text-xs">+</button>
          </div>
          {form.milestones.length > 0 && (
            <div className="space-y-0.5">
              {form.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-orange-300">
                  <span>→</span><span className="flex-1">{m}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, milestones: fo.milestones.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">Progress: {form.progress}%</p>
            <input type="range" min={0} max={100} step={5} value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save Goal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {goals.map(g => {
          const a = AREA_CONFIG[g.area]
          const s = STATUS_CONFIG[g.status]
          return (
            <div key={g.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                </div>
                <p className="text-xs text-white mt-1">{g.goal}</p>
                {g.whoInvolved && <p className="text-xs text-slate-400 mt-0.5">👥 {g.whoInvolved}</p>}
                {g.progress > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div className="h-1 rounded-full bg-orange-400" style={{ width: `${g.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{g.progress}%</p>
                  </div>
                )}
              </div>
              <button onClick={() => save(goals.filter(x => x.id !== g.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {goals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Home className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Strong families are built on shared goals and intentional love.</p>
          </div>
        )}
      </div>
    </div>
  )
}

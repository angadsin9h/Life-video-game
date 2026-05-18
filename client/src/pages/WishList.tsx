import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WishCategory = 'experience' | 'skill' | 'purchase' | 'relationship' | 'health' | 'career' | 'creative' | 'travel' | 'other'
type WishStatus = 'active' | 'working' | 'achieved' | 'dropped'
type Priority = 'high' | 'medium' | 'low'

interface WishItem {
  id: string
  wish: string
  category: WishCategory
  status: WishStatus
  priority: Priority
  reason: string
  steps: string
  timeline: string
  estimatedCost: number
  achievedDate: string
  createdAt: string
}

const CAT_CONFIG: Record<WishCategory, { label: string; emoji: string; color: string }> = {
  experience:   { label: 'Experience',   emoji: '🌟', color: '#f59e0b' },
  skill:        { label: 'Skill',        emoji: '📚', color: '#3b82f6' },
  purchase:     { label: 'Purchase',     emoji: '🛍️', color: '#22c55e' },
  relationship: { label: 'Relationship', emoji: '💕', color: '#ec4899' },
  health:       { label: 'Health',       emoji: '❤️', color: '#ef4444' },
  career:       { label: 'Career',       emoji: '💼', color: '#6366f1' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#a855f7' },
  travel:       { label: 'Travel',       emoji: '✈️', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '✨', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<WishStatus, { label: string; color: string }> = {
  active:   { label: 'Wish',      color: '#6366f1' },
  working:  { label: 'Working On',color: '#f59e0b' },
  achieved: { label: 'Achieved!', color: '#22c55e' },
  dropped:  { label: 'Dropped',   color: '#94a3b8' },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high:   { label: 'High',   color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low:    { label: 'Low',    color: '#22c55e' },
}

const STORAGE_KEY = 'wish_list'

export default function WishList() {
  const { toastSuccess } = useToast()
  const [wishes, setWishes] = useState<WishItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [form, setForm] = useState<Omit<WishItem, 'id' | 'createdAt' | 'achievedDate'>>({
    wish: '', category: 'experience', status: 'active', priority: 'medium',
    reason: '', steps: '', timeline: '', estimatedCost: 0,
  })

  useEffect(() => {
    try { setWishes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WishItem[]) => { setWishes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.wish.trim()) return
    const w: WishItem = { id: Date.now().toString(), ...form, achievedDate: '', createdAt: new Date().toISOString() }
    save([w, ...wishes])
    setForm({ wish: '', category: 'experience', status: 'active', priority: 'medium', reason: '', steps: '', timeline: '', estimatedCost: 0 })
    setShowForm(false)
    toastSuccess('Wish added ⭐')
  }

  const markAchieved = (id: string) => {
    save(wishes.map(w => w.id === id ? { ...w, status: 'achieved', achievedDate: new Date().toISOString().split('T')[0] } : w))
    toastSuccess('Wish achieved! 🌟 Amazing!')
  }

  const achieved = wishes.filter(w => w.status === 'achieved').length
  const active = wishes.filter(w => w.status === 'active' || w.status === 'working').length
  const filtered = wishes.filter(w => filterStatus === 'all' || w.status === filterStatus)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Wish List
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your wishes, goals, and desires — tracked.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{wishes.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs capitalize ${filterStatus === s ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s as WishStatus].label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Wish</h3>
          <input value={form.wish} onChange={e => setForm(f => ({ ...f, wish: e.target.value }))}
            placeholder="I wish... *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WishCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [WishCategory, typeof CAT_CONFIG.experience][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.high][]).map(([k, p]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, priority: k }))}
                  className={`px-2 py-1.5 rounded-xl text-xs ${form.priority === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.priority === k ? { background: p.color + '30', color: p.color } : {}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Why do you want this?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            placeholder="What steps would make this happen?" className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
              placeholder="Timeline (e.g. 6 months)" className="game-input flex-1 text-sm" />
            <input type="number" value={form.estimatedCost || ''} min={0}
              onChange={e => setForm(f => ({ ...f, estimatedCost: Number(e.target.value) }))}
              placeholder="Cost $" className="game-input w-24 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(w => {
          const c = CAT_CONFIG[w.category]
          const s = STATUS_CONFIG[w.status]
          const p = PRIORITY_CONFIG[w.priority]
          const isExp = expanded === w.id
          return (
            <div key={w.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : w.id)}>
                <span className="text-2xl">{w.status === 'achieved' ? '🌟' : c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${w.status === 'achieved' ? 'text-yellow-400' : 'text-white'}`}>{w.wish}</span>
                    <span className="text-xs" style={{ color: p.color }}>●</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label}{w.timeline && ` · ${w.timeline}`}{w.estimatedCost > 0 && ` · $${w.estimatedCost}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {w.reason && <p className="text-xs text-slate-400 italic">"{w.reason}"</p>}
                  {w.steps && <p className="text-xs text-blue-400">🎯 {w.steps}</p>}
                  {w.achievedDate && <p className="text-xs text-yellow-400">🌟 Achieved {w.achievedDate}</p>}
                  <div className="flex gap-2">
                    {w.status !== 'achieved' && (
                      <>
                        <button onClick={() => save(wishes.map(x => x.id === w.id ? { ...x, status: x.status === 'working' ? 'active' : 'working' } : x))}
                          className="flex-1 py-1.5 bg-yellow-700/20 text-yellow-400 rounded-xl text-xs">
                          {w.status === 'working' ? 'Pause' : '▶ Working On'}
                        </button>
                        <button onClick={() => markAchieved(w.id)} className="flex-1 py-1.5 bg-green-700/20 text-green-400 rounded-xl text-xs">
                          <Check className="w-3 h-3 inline mr-1" />Achieved!
                        </button>
                      </>
                    )}
                    <button onClick={() => save(wishes.filter(x => x.id !== w.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
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
            <p className="text-sm">Write down your wishes — the universe listens.</p>
          </div>
        )}
      </div>
    </div>
  )
}

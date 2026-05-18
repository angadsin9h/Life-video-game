import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Heart, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Child {
  id: string
  name: string
  birthdate: string
  avatar: string
}

type MomentType = 'milestone' | 'funny' | 'proud' | 'lesson' | 'challenge' | 'memory'

interface ParentingMoment {
  id: string
  childId: string
  date: string
  type: MomentType
  title: string
  description: string
  starred: boolean
  createdAt: string
}

const MOMENT_TYPES: Record<MomentType, { label: string; emoji: string; color: string }> = {
  milestone:  { label: 'Milestone',  emoji: '🏆', color: '#f59e0b' },
  funny:      { label: 'Funny',      emoji: '😂', color: '#22c55e' },
  proud:      { label: 'Proud',      emoji: '💪', color: '#3b82f6' },
  lesson:     { label: 'Life Lesson', emoji: '📚', color: '#a855f7' },
  challenge:  { label: 'Challenge',  emoji: '😤', color: '#ef4444' },
  memory:     { label: 'Memory',     emoji: '💜', color: '#ec4899' },
}

const STORAGE_KEY = 'parenting_log'
const CHILDREN_KEY = 'parenting_children'

export default function ParentingLog() {
  const { toastSuccess } = useToast()
  const [children, setChildren] = useState<Child[]>([])
  const [moments, setMoments] = useState<ParentingMoment[]>([])
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddMoment, setShowAddMoment] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [childForm, setChildForm] = useState({ name: '', birthdate: '', avatar: '👶' })
  const [momentForm, setMomentForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'memory' as MomentType, title: '', description: '' })
  const [filterType, setFilterType] = useState<string>('all')

  const AVATARS = ['👶', '🧒', '👧', '👦', '🧒‍♀️', '🧒‍♂️', '🌟', '🌈', '🦁', '🐼']

  useEffect(() => {
    try {
      setChildren(JSON.parse(localStorage.getItem(CHILDREN_KEY) || '[]'))
      setMoments(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveChildren = (u: Child[]) => { setChildren(u); localStorage.setItem(CHILDREN_KEY, JSON.stringify(u)) }
  const saveMoments = (u: ParentingMoment[]) => { setMoments(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addChild = () => {
    if (!childForm.name.trim()) return
    const c: Child = { id: Date.now().toString(), ...childForm }
    saveChildren([...children, c])
    setChildForm({ name: '', birthdate: '', avatar: '👶' })
    setShowAddChild(false)
    setActiveChild(c.id)
    toastSuccess(`${childForm.name} added 💜`)
  }

  const addMoment = () => {
    if (!momentForm.title.trim() || !activeChild) return
    const m: ParentingMoment = { id: Date.now().toString(), childId: activeChild, ...momentForm, starred: false, createdAt: new Date().toISOString() }
    saveMoments([m, ...moments])
    setMomentForm({ date: new Date().toISOString().split('T')[0], type: 'memory', title: '', description: '' })
    setShowAddMoment(false)
    toastSuccess(`Moment saved ${MOMENT_TYPES[momentForm.type].emoji}`)
  }

  const toggleStar = (id: string) => saveMoments(moments.map(m => m.id === id ? { ...m, starred: !m.starred } : m))

  const getAge = (birthdate: string) => {
    if (!birthdate) return ''
    const d = new Date(birthdate)
    const now = new Date()
    const years = now.getFullYear() - d.getFullYear()
    const months = now.getMonth() - d.getMonth()
    const totalMonths = years * 12 + months
    if (totalMonths < 24) return `${totalMonths}m old`
    return `${years}y old`
  }

  const filtered = moments.filter(m => {
    if (activeChild && m.childId !== activeChild) return false
    if (filterType !== 'all' && m.type !== filterType) return false
    return true
  })

  const child = children.find(c => c.id === activeChild)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-7 h-7 text-pink-400" />
          Parenting Log
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Capture milestones and precious moments.</p>
      </div>

      {/* Children */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveChild(null)}
          className={`px-3 py-1.5 rounded-xl text-sm ${!activeChild ? 'bg-pink-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({moments.length})
        </button>
        {children.map(c => (
          <button key={c.id} onClick={() => setActiveChild(c.id)}
            className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 ${activeChild === c.id ? 'bg-pink-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {c.avatar} {c.name}
            {c.birthdate && <span className="text-xs opacity-70">{getAge(c.birthdate)}</span>}
          </button>
        ))}
        <button onClick={() => setShowAddChild(true)}
          className="px-3 py-1.5 rounded-xl text-sm bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add child
        </button>
      </div>

      {showAddChild && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Child</h3>
          <div className="flex gap-2">
            <input value={childForm.name} onChange={e => setChildForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name" className="game-input flex-1" autoFocus />
            <input type="date" value={childForm.birthdate} onChange={e => setChildForm(f => ({ ...f, birthdate: e.target.value }))}
              className="game-input" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setChildForm(f => ({ ...f, avatar: a }))}
                className={`text-xl p-1.5 rounded-lg transition-all ${childForm.avatar === a ? 'bg-pink-700/30 ring-1 ring-pink-500' : 'bg-slate-800'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addChild} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowAddChild(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-full text-xs ${filterType === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
              {(Object.entries(MOMENT_TYPES) as [MomentType, typeof MOMENT_TYPES.memory][]).map(([k, t]) => (
                <button key={k} onClick={() => setFilterType(k)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors`}
                  style={filterType === k ? { background: t.color + '30', color: t.color } : { background: '#1e293b', color: '#64748b' }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            {activeChild && (
              <button onClick={() => setShowAddMoment(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pink-700 hover:bg-pink-600 text-white rounded-lg">
                <Plus className="w-3 h-3" /> Add moment
              </button>
            )}
          </div>

          {showAddMoment && activeChild && (
            <div className="game-card p-4 border border-pink-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Moment — {child?.name}</h3>
              <div className="flex gap-2">
                <input type="date" value={momentForm.date} onChange={e => setMomentForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(MOMENT_TYPES) as [MomentType, typeof MOMENT_TYPES.memory][]).map(([k, t]) => (
                  <button key={k} onClick={() => setMomentForm(f => ({ ...f, type: k }))}
                    className={`p-2 rounded-lg text-xs text-center transition-all ${momentForm.type === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                    style={momentForm.type === k ? { background: t.color + '30', color: t.color } : {}}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <input value={momentForm.title} onChange={e => setMomentForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title (e.g., First steps!)" className="game-input w-full" autoFocus />
              <textarea value={momentForm.description} onChange={e => setMomentForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the moment in detail..." className="game-input w-full h-24 resize-none text-sm" />
              <div className="flex gap-2">
                <button onClick={addMoment} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save Moment</button>
                <button onClick={() => setShowAddMoment(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(m => {
              const t = MOMENT_TYPES[m.type]
              const c = children.find(x => x.id === m.childId)
              const isExp = expanded === m.id
              return (
                <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                    <span className="text-xl">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{m.title}</span>
                        {m.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <span className="text-xs text-slate-500">{c?.name} · {m.date}</span>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      {m.description && <p className="text-sm text-slate-300 leading-relaxed">{m.description}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => toggleStar(m.id)} className="flex items-center gap-1 text-xs text-slate-600 hover:text-yellow-400">
                          <Star className={`w-3 h-3 ${m.starred ? 'text-yellow-400 fill-yellow-400' : ''}`} /> {m.starred ? 'Unstar' : 'Star'}
                        </button>
                        <button onClick={() => saveMoments(moments.filter(x => x.id !== m.id))} className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{activeChild ? 'No moments captured yet.' : 'Select a child to add moments.'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {children.length === 0 && !showAddChild && (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Add your children to start logging moments.</p>
        </div>
      )}
    </div>
  )
}

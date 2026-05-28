import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SkillCategory = 'technical' | 'creative' | 'interpersonal' | 'leadership' | 'analytical' | 'physical' | 'language' | 'business' | 'craft' | 'other'
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'

interface Skill {
  id: string
  category: SkillCategory
  name: string
  description: string
  level: SkillLevel
  yearsExp: number
  lastUsed: string
  context: string
  isTransferable: boolean
  isLearning: boolean
  targetLevel: SkillLevel
  notes: string
  createdAt: string
}

const CAT_CONFIG: Record<SkillCategory, { label: string; emoji: string; color: string }> = {
  technical:     { label: 'Technical',      emoji: '💻', color: '#3b82f6' },
  creative:      { label: 'Creative',       emoji: '🎨', color: '#a855f7' },
  interpersonal: { label: 'Interpersonal',  emoji: '🤝', color: '#ec4899' },
  leadership:    { label: 'Leadership',     emoji: '👑', color: '#f59e0b' },
  analytical:    { label: 'Analytical',     emoji: '🔍', color: '#6366f1' },
  physical:      { label: 'Physical',       emoji: '💪', color: '#22c55e' },
  language:      { label: 'Language',       emoji: '🌍', color: '#0ea5e9' },
  business:      { label: 'Business',       emoji: '📈', color: '#f97316' },
  craft:         { label: 'Craft',          emoji: '🔨', color: '#84cc16' },
  other:         { label: 'Other',          emoji: '⭐', color: '#94a3b8' },
}

const LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; bars: number }> = {
  beginner:     { label: 'Beginner',     color: '#94a3b8', bars: 1 },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bars: 2 },
  advanced:     { label: 'Advanced',     color: '#3b82f6', bars: 3 },
  expert:       { label: 'Expert',       color: '#a855f7', bars: 4 },
  master:       { label: 'Master',       color: '#f97316', bars: 5 },
}

const STORAGE_KEY = 'skill_inventory'

export default function SkillInventory() {
  const { toastSuccess } = useToast()
  const [skills, setSkills] = useState<Skill[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [form, setForm] = useState<Omit<Skill, 'id' | 'createdAt'>>({
    category: 'technical', name: '', description: '', level: 'intermediate',
    yearsExp: 1, lastUsed: new Date().toISOString().split('T')[0],
    context: '', isTransferable: false, isLearning: false, targetLevel: 'advanced', notes: '',
  })

  useEffect(() => {
    try { setSkills(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Skill[]) => { setSkills(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const s: Skill = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...skills])
    setForm(f => ({ ...f, name: '', description: '', context: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Skill added to inventory ⚡')
  }

  const filtered = skills
    .filter(s => filterCat === 'all' || s.category === filterCat)
    .filter(s => filterLevel === 'all' || s.level === filterLevel)

  const experts = skills.filter(s => s.level === 'expert' || s.level === 'master').length
  const learning = skills.filter(s => s.isLearning).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Skill Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your complete skill set and growth areas.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{skills.length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{experts}</div>
          <div className="text-xs text-slate-500">Expert/Master</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{learning}</div>
          <div className="text-xs text-slate-500">Learning</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [SkillCategory, typeof CAT_CONFIG.technical][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'beginner', 'intermediate', 'advanced', 'expert', 'master'] as const).map(l => (
          <button key={l} onClick={() => setFilterLevel(l)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap capitalize ${filterLevel === l ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
            {l === 'all' ? 'All Levels' : l}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Skill</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SkillCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [SkillCategory, typeof CAT_CONFIG.technical][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Skill name *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What can you do with this skill?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Where did you gain/use this skill?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current Level</p>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as SkillLevel }))} className="game-input w-full text-sm">
                {Object.entries(LEVEL_CONFIG).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target Level</p>
              <select value={form.targetLevel} onChange={e => setForm(f => ({ ...f, targetLevel: e.target.value as SkillLevel }))} className="game-input w-full text-sm">
                {Object.entries(LEVEL_CONFIG).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
              </select>
            </div>
            <div className="w-20">
              <p className="text-xs text-slate-500 mb-1">Years Exp</p>
              <input type="number" value={form.yearsExp} min={0} step={0.5}
                onChange={e => setForm(f => ({ ...f, yearsExp: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isTransferable} onChange={e => setForm(f => ({ ...f, isTransferable: e.target.checked }))} />
              Transferable
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isLearning} onChange={e => setForm(f => ({ ...f, isLearning: e.target.checked }))} />
              Currently learning
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
          const isExp = expanded === s.id
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{s.name}</span>
                    {s.isLearning && <span className="text-xs text-blue-400">📚 learning</span>}
                    {s.isTransferable && <span className="text-xs text-green-400">🔄</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(b => (
                        <div key={b} className="w-4 h-1 rounded-full" style={{ background: b <= l.bars ? l.color : '#334155' }} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: l.color }}>{l.label}</span>
                    <span className="text-xs text-slate-500">· {s.yearsExp}y</span>
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {s.description && <p className="text-xs text-slate-300">{s.description}</p>}
                  {s.context && <p className="text-xs text-blue-300">📍 {s.context}</p>}
                  <p className="text-xs text-slate-500">Target: {LEVEL_CONFIG[s.targetLevel].label}</p>
                  <button onClick={() => save(skills.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400 mt-1">
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
            <p className="text-sm">Every skill you have is a competitive advantage. Inventory them all.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Brain, Plus, TrendingUp, Trash2, ChevronUp, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SkillEntry {
  id: string
  name: string
  category: string
  currentLevel: number
  targetLevel: number
  xp: number
  xpToNext: number
  sessions: { date: string; duration: number; note: string; xpGained: number }[]
  color: string
  description: string
}

const CATEGORIES = [
  { value: 'technical', label: 'Technical', emoji: '💻', color: '#3b82f6' },
  { value: 'creative', label: 'Creative', emoji: '🎨', color: '#ec4899' },
  { value: 'physical', label: 'Physical', emoji: '💪', color: '#22c55e' },
  { value: 'social', label: 'Social', emoji: '🤝', color: '#f97316' },
  { value: 'mental', label: 'Mental', emoji: '🧠', color: '#8b5cf6' },
  { value: 'language', label: 'Language', emoji: '🗣️', color: '#14b8a6' },
  { value: 'music', label: 'Music', emoji: '🎵', color: '#eab308' },
  { value: 'business', label: 'Business', emoji: '📊', color: '#64748b' },
]

const LEVEL_NAMES = ['Novice', 'Beginner', 'Apprentice', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend', 'God']

const xpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1))

const STORAGE_KEY = 'skill_progress'

export default function SkillProgress() {
  const { toastSuccess } = useToast()
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [logging, setLogging] = useState<string | null>(null)
  const [sessionForm, setSessionForm] = useState({ duration: '30', note: '', xp: '10' })
  const [form, setForm] = useState({ name: '', category: 'technical', description: '', targetLevel: '5' })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setSkills(JSON.parse(saved))
  }, [])

  const persist = (updated: SkillEntry[]) => {
    setSkills(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addSkill = () => {
    if (!form.name.trim()) return
    const cat = CATEGORIES.find(c => c.value === form.category)
    const s: SkillEntry = {
      id: Date.now().toString(),
      name: form.name,
      category: form.category,
      currentLevel: 1,
      targetLevel: parseInt(form.targetLevel) || 5,
      xp: 0,
      xpToNext: xpForLevel(1),
      sessions: [],
      color: cat?.color || '#64748b',
      description: form.description,
    }
    persist([...skills, s])
    setShowForm(false)
    setForm({ name: '', category: 'technical', description: '', targetLevel: '5' })
    toastSuccess('Skill added!')
  }

  const logSession = (id: string) => {
    const xpGained = parseInt(sessionForm.xp) || 10
    const updated = skills.map(s => {
      if (s.id !== id) return s
      let newXP = s.xp + xpGained
      let newLevel = s.currentLevel
      let xpToNext = s.xpToNext

      while (newXP >= xpToNext && newLevel < 10) {
        newXP -= xpToNext
        newLevel++
        xpToNext = xpForLevel(newLevel)
        toastSuccess(`Level Up! ${s.name} is now ${LEVEL_NAMES[newLevel - 1]}!`)
      }

      return {
        ...s,
        xp: newXP,
        currentLevel: newLevel,
        xpToNext,
        sessions: [{ date: new Date().toISOString().split('T')[0], duration: parseInt(sessionForm.duration) || 30, note: sessionForm.note, xpGained }, ...s.sessions],
      }
    })
    persist(updated)
    setLogging(null)
    setSessionForm({ duration: '30', note: '', xp: '10' })
  }

  const deleteSkill = (id: string) => persist(skills.filter(s => s.id !== id))

  const totalHours = skills.reduce((sum, s) => sum + s.sessions.reduce((ss, sess) => ss + sess.duration, 0), 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Skill Progress
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Level up your real-world skills with XP</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Brain className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{skills.length}</div>
          <div className="text-xs text-slate-500">Skills Tracked</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{Math.round(totalHours / 60)}h</div>
          <div className="text-xs text-slate-500">Total Practice</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{skills.filter(s => s.currentLevel >= s.targetLevel).length}</div>
          <div className="text-xs text-slate-500">Goals Reached</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <h3 className="font-semibold text-slate-300">Add New Skill</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Skill name (e.g. Python, Piano, Spanish)" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What do you want to achieve with this skill?" className="game-input w-full h-16 resize-none" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.category === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Level: {form.targetLevel} ({LEVEL_NAMES[parseInt(form.targetLevel) - 1]})</label>
            <input type="range" min="2" max="10" value={form.targetLevel}
              onChange={e => setForm(f => ({ ...f, targetLevel: e.target.value }))}
              className="w-full accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={addSkill} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Add Skill
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Skills list */}
      <div className="space-y-4">
        {skills.map(s => {
          const cat = CATEGORIES.find(c => c.value === s.category)
          const xpPct = s.xpToNext > 0 ? (s.xp / s.xpToNext) * 100 : 100
          const levelPct = ((s.currentLevel - 1) / (s.targetLevel - 1)) * 100
          const totalMinutes = s.sessions.reduce((sum, sess) => sum + sess.duration, 0)
          const reachedTarget = s.currentLevel >= s.targetLevel

          return (
            <div key={s.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{s.name}</h3>
                      {reachedTarget && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span style={{ color: s.color }}>Lv.{s.currentLevel} {LEVEL_NAMES[s.currentLevel - 1]}</span>
                      <span>→ Lv.{s.targetLevel} {LEVEL_NAMES[s.targetLevel - 1]}</span>
                      <span>{Math.round(totalMinutes / 60)}h practice</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteSkill(s.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* XP bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>XP to next level</span>
                  <span>{s.xp}/{s.xpToNext}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${xpPct}%`, background: s.color }} />
                </div>
              </div>

              {/* Goal progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Goal progress</span>
                  <span>{Math.min(100, Math.round(levelPct))}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all opacity-60" style={{ width: `${Math.min(100, levelPct)}%`, background: s.color }} />
                </div>
              </div>

              {s.description && <p className="text-xs text-slate-500 italic">{s.description}</p>}

              {/* Recent sessions */}
              {s.sessions.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {s.sessions.slice(0, 3).map((sess, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {sess.date.slice(5)} · {sess.duration}m · +{sess.xpGained}xp
                    </span>
                  ))}
                </div>
              )}

              {logging === s.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
                      <input type="number" value={sessionForm.duration} onChange={e => setSessionForm(f => ({ ...f, duration: e.target.value }))}
                        className="game-input w-full text-xs" min="1" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">XP Earned</label>
                      <input type="number" value={sessionForm.xp} onChange={e => setSessionForm(f => ({ ...f, xp: e.target.value }))}
                        className="game-input w-full text-xs" min="1" />
                    </div>
                  </div>
                  <input value={sessionForm.note} onChange={e => setSessionForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="What did you practice?" className="game-input w-full text-xs" />
                  <div className="flex gap-2">
                    <button onClick={() => logSession(s.id)} className="flex-1 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold">
                      <ChevronUp className="w-3 h-3 inline mr-1" />Log Session
                    </button>
                    <button onClick={() => setLogging(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setLogging(s.id)}
                  className="w-full py-1.5 border border-dashed border-slate-700 hover:border-violet-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all">
                  + Log Practice Session
                </button>
              )}
            </div>
          )
        })}
      </div>

      {skills.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No skills tracked yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Add Your First Skill
          </button>
        </div>
      )}
    </div>
  )
}

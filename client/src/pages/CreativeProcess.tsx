import { useState, useEffect } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CreativeType = 'writing' | 'visual-art' | 'music' | 'design' | 'code' | 'video' | 'photography' | 'crafting' | 'cooking' | 'performance'
type ProcessPhase = 'ideation' | 'exploration' | 'incubation' | 'creation' | 'refinement' | 'completion' | 'sharing'
type CreativeState = 'blocked' | 'struggling' | 'flowing' | 'inspired' | 'in-the-zone'

interface CreativeEntry {
  id: string
  project: string
  creativeType: CreativeType
  phase: ProcessPhase
  state: CreativeState
  idea: string
  whatWorked: string
  whatBlocked: string
  nextStep: string
  inspiration: string
  creativeScore: number
  timeSpent: number
  date: string
  createdAt: string
}

const CREATIVE_CONFIG: Record<CreativeType, { label: string; emoji: string; color: string }> = {
  writing:      { label: 'Writing',      emoji: '✍️', color: '#3b82f6' },
  'visual-art': { label: 'Visual Art',   emoji: '🎨', color: '#f97316' },
  music:        { label: 'Music',        emoji: '🎵', color: '#a855f7' },
  design:       { label: 'Design',       emoji: '🖼️', color: '#ec4899' },
  code:         { label: 'Code',         emoji: '💻', color: '#22c55e' },
  video:        { label: 'Video',        emoji: '🎬', color: '#ef4444' },
  photography:  { label: 'Photography',  emoji: '📷', color: '#84cc16' },
  crafting:     { label: 'Crafting',     emoji: '🧵', color: '#f59e0b' },
  cooking:      { label: 'Cooking',      emoji: '👨‍🍳', color: '#6366f1' },
  performance:  { label: 'Performance',  emoji: '🎭', color: '#0ea5e9' },
}

const PHASE_CONFIG: Record<ProcessPhase, { label: string; emoji: string }> = {
  ideation:    { label: 'Ideation',    emoji: '💡' },
  exploration: { label: 'Exploration', emoji: '🔍' },
  incubation:  { label: 'Incubation',  emoji: '🥚' },
  creation:    { label: 'Creation',    emoji: '🔨' },
  refinement:  { label: 'Refinement',  emoji: '✨' },
  completion:  { label: 'Completion',  emoji: '🏁' },
  sharing:     { label: 'Sharing',     emoji: '🌍' },
}

const STATE_CONFIG: Record<CreativeState, { label: string; color: string }> = {
  blocked:      { label: 'Blocked',    color: '#ef4444' },
  struggling:   { label: 'Struggling', color: '#f97316' },
  flowing:      { label: 'Flowing',    color: '#f59e0b' },
  inspired:     { label: 'Inspired',   color: '#22c55e' },
  'in-the-zone':{ label: 'In the Zone',color: '#a855f7' },
}

const STORAGE_KEY = 'creative_process_log'

export default function CreativeProcess() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CreativeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CreativeEntry, 'id' | 'createdAt'>>({
    project: '', creativeType: 'writing', phase: 'creation', state: 'flowing',
    idea: '', whatWorked: '', whatBlocked: '', nextStep: '', inspiration: '',
    creativeScore: 7, timeSpent: 60, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CreativeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.project.trim()) return
    const e: CreativeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, project: '', idea: '', whatWorked: '', whatBlocked: '', nextStep: '', inspiration: '' }))
    setShowForm(false)
    toastSuccess('Creative session logged — make art, make meaning 🎨')
  }

  const inZone = entries.filter(e => e.state === 'in-the-zone').length
  const totalHours = Math.round(entries.reduce((s, e) => s + e.timeSpent, 0) / 60)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Pencil className="w-7 h-7 text-orange-400" />
            Creative Process
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your creative sessions, breakthroughs, and blocks.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Creative Hrs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{inZone}</div>
          <div className="text-xs text-slate-500">In the Zone</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Creative Session</h3>
          <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
            placeholder="Project / creative work name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.creativeType} onChange={e => setForm(f => ({ ...f, creativeType: e.target.value as CreativeType }))} className="game-input text-sm flex-1">
              {(Object.entries(CREATIVE_CONFIG) as [CreativeType, typeof CREATIVE_CONFIG.writing][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value as CreativeState }))} className="game-input text-sm flex-1">
              {(Object.entries(STATE_CONFIG) as [CreativeState, typeof STATE_CONFIG.flowing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as ProcessPhase }))} className="game-input w-full text-sm">
            {(Object.entries(PHASE_CONFIG) as [ProcessPhase, typeof PHASE_CONFIG.creation][]).map(([k, p]) => (
              <option key={k} value={k}>{p.emoji} {p.label}</option>
            ))}
          </select>
          <textarea value={form.idea} onChange={e => setForm(f => ({ ...f, idea: e.target.value }))}
            placeholder="Main idea or what you worked on" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whatWorked} onChange={e => setForm(f => ({ ...f, whatWorked: e.target.value }))}
            placeholder="What worked / what flowed?" className="game-input w-full text-sm" />
          <input value={form.whatBlocked} onChange={e => setForm(f => ({ ...f, whatBlocked: e.target.value }))}
            placeholder="What blocked you / what was hard?" className="game-input w-full text-sm" />
          <input value={form.inspiration} onChange={e => setForm(f => ({ ...f, inspiration: e.target.value }))}
            placeholder="What inspired this session?" className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next creative step" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Time: {form.timeSpent}min</p>
              <input type="range" min={15} max={480} step={15} value={form.timeSpent}
                onChange={e => setForm(f => ({ ...f, timeSpent: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Quality: {form.creativeScore}/10</p>
              <input type="range" min={1} max={10} value={form.creativeScore}
                onChange={e => setForm(f => ({ ...f, creativeScore: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CREATIVE_CONFIG[e.creativeType]
          const p = PHASE_CONFIG[e.phase]
          const s = STATE_CONFIG[e.state]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.project}</span>
                  <span className="text-xs">{p.emoji} {p.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-orange-400">⏱ {e.timeSpent}m</span>
                </div>
                {e.idea && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.idea}</p>}
                {e.nextStep && <p className="text-xs text-green-300/70 mt-0.5">→ {e.nextStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Pencil className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Creativity is intelligence having fun. Track your creative life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

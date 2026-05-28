import { useState, useEffect } from 'react'
import { Sword, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DisciplineArea = 'fitness' | 'diet' | 'sleep' | 'focus' | 'finances' | 'learning' | 'relationships' | 'mindset' | 'creativity' | 'other'
type DisciplineType = 'maintained' | 'tested' | 'failed' | 'recovered' | 'exceeded'

interface DisciplineEntry {
  id: string
  area: DisciplineArea
  disciplineType: DisciplineType
  situation: string
  choiceMade: string
  temptation: string
  outcome: string
  lesson: string
  willpower: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<DisciplineArea, { label: string; emoji: string; color: string }> = {
  fitness:       { label: 'Fitness',       emoji: '💪', color: '#ef4444' },
  diet:          { label: 'Diet',          emoji: '🥗', color: '#22c55e' },
  sleep:         { label: 'Sleep',         emoji: '😴', color: '#3b82f6' },
  focus:         { label: 'Focus',         emoji: '🎯', color: '#f59e0b' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#84cc16' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#0ea5e9' },
  other:         { label: 'Other',         emoji: '⚡', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<DisciplineType, { label: string; color: string; emoji: string }> = {
  maintained: { label: 'Maintained',  color: '#22c55e', emoji: '✅' },
  tested:     { label: 'Tested',      color: '#f59e0b', emoji: '⚡' },
  failed:     { label: 'Slipped',     color: '#ef4444', emoji: '❌' },
  recovered:  { label: 'Recovered',   color: '#3b82f6', emoji: '🔄' },
  exceeded:   { label: 'Exceeded!',   color: '#a855f7', emoji: '🚀' },
}

const STORAGE_KEY = 'discipline_log'

export default function DisciplineLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DisciplineEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DisciplineEntry, 'id' | 'createdAt'>>({
    area: 'fitness', disciplineType: 'maintained', situation: '', choiceMade: '',
    temptation: '', outcome: '', lesson: '', willpower: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DisciplineEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: DisciplineEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', choiceMade: '', temptation: '', outcome: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Discipline entry logged ⚔️')
  }

  const maintained = entries.filter(e => e.disciplineType === 'maintained' || e.disciplineType === 'exceeded').length
  const avgWillpower = entries.length ? Math.round(entries.reduce((s, e) => s + e.willpower, 0) / entries.length) : 0
  const winRate = entries.length ? Math.round((maintained / entries.length) * 100) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sword className="w-7 h-7 text-orange-400" />
            Discipline Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track every battle won and lost. Build the discipline muscle.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{winRate}%</div>
          <div className="text-xs text-slate-500">Win Rate</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgWillpower}/10</div>
          <div className="text-xs text-slate-500">Avg Willpower</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Discipline Entry</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as DisciplineArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [DisciplineArea, typeof AREA_CONFIG.fitness][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.disciplineType} onChange={e => setForm(f => ({ ...f, disciplineType: e.target.value as DisciplineType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [DisciplineType, typeof TYPE_CONFIG.maintained][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="Describe the situation / test of discipline *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.temptation} onChange={e => setForm(f => ({ ...f, temptation: e.target.value }))}
            placeholder="What was the temptation or obstacle?" className="game-input w-full text-sm" />
          <input value={form.choiceMade} onChange={e => setForm(f => ({ ...f, choiceMade: e.target.value }))}
            placeholder="What choice did you make?" className="game-input w-full text-sm" />
          <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="Outcome / result" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson learned" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Willpower level: {form.willpower}/10</p>
            <input type="range" min={1} max={10} value={form.willpower}
              onChange={e => setForm(f => ({ ...f, willpower: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Log Entry</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = TYPE_CONFIG[e.disciplineType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{t.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-orange-400">⚡ {e.willpower}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.situation}</p>
                {e.choiceMade && <p className="text-xs text-green-300/80 mt-0.5">Chose: {e.choiceMade}</p>}
                {e.lesson && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.lesson}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sword className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Discipline is choosing what you want most over what you want now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

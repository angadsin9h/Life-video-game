import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ShiftArea = 'identity' | 'motivation' | 'discipline' | 'consistency' | 'environment' | 'reward' | 'trigger' | 'accountability' | 'mindset' | 'other'
type ShiftStatus = 'insight' | 'practicing' | 'integrated'

interface MindsetShift {
  id: string
  area: ShiftArea
  oldThinking: string
  newThinking: string
  insight: string
  habit: string
  impact: string
  evidence: string
  status: ShiftStatus
  strength: number
  createdAt: string
}

const AREA_CONFIG: Record<ShiftArea, { label: string; emoji: string; color: string }> = {
  identity:       { label: 'Identity',       emoji: '🧬', color: '#a855f7' },
  motivation:     { label: 'Motivation',     emoji: '🔥', color: '#f97316' },
  discipline:     { label: 'Discipline',     emoji: '⚔️', color: '#6366f1' },
  consistency:    { label: 'Consistency',    emoji: '📅', color: '#3b82f6' },
  environment:    { label: 'Environment',    emoji: '🏡', color: '#22c55e' },
  reward:         { label: 'Reward',         emoji: '🎁', color: '#f59e0b' },
  trigger:        { label: 'Trigger',        emoji: '⚡', color: '#ec4899' },
  accountability: { label: 'Accountability', emoji: '🤝', color: '#0ea5e9' },
  mindset:        { label: 'Mindset',        emoji: '🧠', color: '#84cc16' },
  other:          { label: 'Other',          emoji: '💡', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ShiftStatus, { label: string; color: string }> = {
  insight:    { label: 'Insight',    color: '#f59e0b' },
  practicing: { label: 'Practicing', color: '#3b82f6' },
  integrated: { label: 'Integrated', color: '#22c55e' },
}

const STORAGE_KEY = 'habit_mindset_shifts'

export default function HabitMindsetShift() {
  const { toastSuccess } = useToast()
  const [shifts, setShifts] = useState<MindsetShift[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<MindsetShift, 'id' | 'createdAt'>>({
    area: 'identity', oldThinking: '', newThinking: '', insight: '',
    habit: '', impact: '', evidence: '', status: 'insight', strength: 5,
  })

  useEffect(() => {
    try { setShifts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindsetShift[]) => { setShifts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.oldThinking.trim() || !form.newThinking.trim()) return
    const s: MindsetShift = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...shifts])
    setForm(f => ({ ...f, oldThinking: '', newThinking: '', insight: '', habit: '', impact: '', evidence: '' }))
    setShowForm(false)
    toastSuccess('Mindset shift recorded 🧬')
  }

  const filtered = shifts.filter(s => filterArea === 'all' || s.area === filterArea)
  const integrated = shifts.filter(s => s.status === 'integrated').length
  const practicing = shifts.filter(s => s.status === 'practicing').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-blue-400" />
            Habit Mindset Shifts
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track mental reframes that transform your habits.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{shifts.length}</div>
          <div className="text-xs text-slate-500">Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{practicing}</div>
          <div className="text-xs text-slate-500">Practicing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{integrated}</div>
          <div className="text-xs text-slate-500">Integrated</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [ShiftArea, typeof AREA_CONFIG.identity][]).map(([k, a]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Record Mindset Shift</h3>
          <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ShiftArea }))} className="game-input w-full text-sm">
            {(Object.entries(AREA_CONFIG) as [ShiftArea, typeof AREA_CONFIG.identity][]).map(([k, a]) => (
              <option key={k} value={k}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-red-400 mb-1">Old Thinking *</p>
              <textarea value={form.oldThinking} onChange={e => setForm(f => ({ ...f, oldThinking: e.target.value }))}
                placeholder='e.g. "I have to work out every day"' className="game-input w-full h-12 resize-none text-sm" autoFocus />
            </div>
            <div>
              <p className="text-xs text-green-400 mb-1">New Thinking *</p>
              <textarea value={form.newThinking} onChange={e => setForm(f => ({ ...f, newThinking: e.target.value }))}
                placeholder='e.g. "I am someone who moves their body"' className="game-input w-full h-12 resize-none text-sm" />
            </div>
          </div>
          <input value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="What sparked this insight?" className="game-input w-full text-sm" />
          <input value={form.habit} onChange={e => setForm(f => ({ ...f, habit: e.target.value }))}
            placeholder="Which habit does this apply to?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How has this changed your behavior?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence this shift is working..." className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Shift Strength: {form.strength}/10</p>
              <input type="range" min={1} max={10} value={form.strength}
                onChange={e => setForm(f => ({ ...f, strength: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ShiftStatus }))}
              className="game-input text-sm">
              <option value="insight">💡 Insight</option>
              <option value="practicing">🔄 Practicing</option>
              <option value="integrated">✅ Integrated</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const a = AREA_CONFIG[s.area]
          const st = STATUS_CONFIG[s.status]
          const isExp = expanded === s.id
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{s.newThinking}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate line-through">{s.oldThinking}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-red-950/30 rounded-lg">
                      <p className="text-xs text-red-400 mb-0.5">Before</p>
                      <p className="text-xs text-slate-300">{s.oldThinking}</p>
                    </div>
                    <div className="flex-1 p-2 bg-green-950/30 rounded-lg">
                      <p className="text-xs text-green-400 mb-0.5">After</p>
                      <p className="text-xs text-slate-300">{s.newThinking}</p>
                    </div>
                  </div>
                  {s.insight && <p className="text-xs text-yellow-300">💡 {s.insight}</p>}
                  {s.habit && <p className="text-xs text-blue-300">🔄 Habit: {s.habit}</p>}
                  {s.impact && <p className="text-xs text-purple-300">📈 Impact: {s.impact}</p>}
                  {s.evidence && <p className="text-xs text-slate-400">🔍 Evidence: {s.evidence}</p>}
                  <p className="text-xs text-slate-500">Strength: {s.strength}/10</p>
                  <div className="flex gap-2 items-center">
                    <select value={s.status} onChange={ev => save(shifts.map(x => x.id === s.id ? { ...x, status: ev.target.value as ShiftStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      <option value="insight">💡 Insight</option>
                      <option value="practicing">🔄 Practicing</option>
                      <option value="integrated">✅ Integrated</option>
                    </select>
                    <button onClick={() => save(shifts.filter(x => x.id !== s.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every behavior change starts with a mindset shift. What's yours?</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { CalendarDays, Plus, Trash2, X, Check, Target, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WeekPlan {
  id: string
  week_start: string
  theme: string
  priorities: PriorityItem[]
  intentions: string[]
  not_to_do: string[]
  energy_plan: string
  created_at: string
}

interface PriorityItem {
  id: string
  text: string
  area: string
  done: boolean
}

const AREAS = ['work', 'health', 'mind', 'social', 'growth', 'personal']
const AREA_COLORS: Record<string, string> = {
  work: '#8b5cf6', health: '#22c55e', mind: '#06b6d4',
  social: '#eab308', growth: '#f97316', personal: '#ec4899',
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeekRange(monday: string): string {
  const start = new Date(monday + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function WeeklyPlanning() {
  const today = new Date().toISOString().split('T')[0]
  const currentMonday = getMonday(new Date())
  const { toastSuccess } = useToast()
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [theme, setTheme] = useState('')
  const [energyPlan, setEnergyPlan] = useState('')
  const [priorities, setPriorities] = useState<PriorityItem[]>([])
  const [intentions, setIntentions] = useState<string[]>([''])
  const [notToDo, setNotToDo] = useState<string[]>([''])
  const [newPriority, setNewPriority] = useState('')
  const [newPriorityArea, setNewPriorityArea] = useState('work')
  const [saving, setSaving] = useState(false)
  const [lastWeekData, setLastWeekData] = useState<any>(null)

  const STORAGE_KEY = `week_plan_${currentMonday}`

  const load = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const p: WeekPlan = JSON.parse(stored)
      setPlan(p)
      setTheme(p.theme || '')
      setEnergyPlan(p.energy_plan || '')
      setPriorities(p.priorities || [])
      setIntentions(p.intentions.length > 0 ? p.intentions : [''])
      setNotToDo(p.not_to_do.length > 0 ? p.not_to_do : [''])
    }
    // Load last week's data for reflection
    const lastMonday = new Date(currentMonday)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const lastKey = `week_plan_${lastMonday.toISOString().split('T')[0]}`
    const lastStored = localStorage.getItem(lastKey)
    if (lastStored) setLastWeekData(JSON.parse(lastStored))
  }, [STORAGE_KEY, currentMonday])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    const p: WeekPlan = {
      id: plan?.id || Date.now().toString(),
      week_start: currentMonday,
      theme,
      priorities,
      intentions: intentions.filter(i => i.trim()),
      not_to_do: notToDo.filter(i => i.trim()),
      energy_plan: energyPlan,
      created_at: plan?.created_at || new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    setPlan(p)
    setSaving(false)
    toastSuccess('Week plan saved!')
  }

  const addPriority = () => {
    if (!newPriority.trim()) return
    setPriorities(prev => [...prev, {
      id: Date.now().toString(),
      text: newPriority.trim(),
      area: newPriorityArea,
      done: false,
    }])
    setNewPriority('')
    // Auto-save
    setTimeout(() => save(), 100)
  }

  const togglePriority = (id: string) => {
    setPriorities(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p))
  }

  const deletePriority = (id: string) => {
    setPriorities(prev => prev.filter(p => p.id !== id))
  }

  const doneCount = priorities.filter(p => p.done).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <CalendarDays className="w-7 h-7 text-blue-400" />
            Weekly Planning
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{formatWeekRange(currentMonday)}</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Plan'}
        </button>
      </div>

      {/* Last week reflection */}
      {lastWeekData && lastWeekData.priorities?.length > 0 && (
        <div className="game-card p-4 border border-slate-600/50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Week Reflection</div>
          <div className="text-sm text-slate-400 mb-2">
            Completed {lastWeekData.priorities.filter((p: PriorityItem) => p.done).length}/{lastWeekData.priorities.length} priorities
          </div>
          <div className="flex gap-2 flex-wrap">
            {lastWeekData.priorities.slice(0, 3).map((p: PriorityItem) => (
              <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full border ${
                p.done ? 'text-green-400 border-green-500/30 bg-green-900/20' : 'text-slate-500 border-slate-700 line-through'
              }`}>
                {p.done ? '✓' : '○'} {p.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Theme */}
      <div className="game-card p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Week Theme / Focus
        </label>
        <input placeholder="e.g. 'Deep Work Mode' or 'Recovery & Recharge'…"
          value={theme} onChange={e => setTheme(e.target.value)}
          className="game-input w-full text-lg font-semibold" />
      </div>

      {/* Top Priorities */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top Priorities {priorities.length > 0 && `(${doneCount}/${priorities.length})`}
          </label>
        </div>

        {priorities.length > 0 && (
          <div className="space-y-2 mb-3">
            {priorities.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${p.done ? 'opacity-60' : ''}`}>
                <button onClick={() => togglePriority(p.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                    p.done ? 'bg-green-600 border-green-500' : 'border-slate-600 hover:border-green-500'
                  }`}>
                  {p.done && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${p.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{p.text}</span>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ color: AREA_COLORS[p.area], backgroundColor: AREA_COLORS[p.area] + '20' }}>
                  {p.area}
                </span>
                <button onClick={() => deletePriority(p.id)} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <select value={newPriorityArea} onChange={e => setNewPriorityArea(e.target.value)}
            className="game-input w-24 text-sm">
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input placeholder="Add priority…" value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPriority()}
            className="game-input flex-1 text-sm" />
          <button onClick={addPriority} disabled={!newPriority.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {priorities.length > 0 && (
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${priorities.length > 0 ? (doneCount / priorities.length) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      {/* Intentions */}
      <div className="game-card p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Weekly Intentions (How you want to show up)
        </label>
        <div className="space-y-2">
          {intentions.map((intent, i) => (
            <div key={i} className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-2.5" />
              <input placeholder={`I will be / I will…`} value={intent}
                onChange={e => setIntentions(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="game-input flex-1 text-sm" />
              {intentions.length > 1 && (
                <button onClick={() => setIntentions(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-700 hover:text-red-400 transition-colors mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setIntentions(prev => [...prev, ''])}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> Add intention
          </button>
        </div>
      </div>

      {/* Not-to-do list */}
      <div className="game-card p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          Not-To-Do List
        </label>
        <p className="text-xs text-slate-600 mb-2">What will you actively avoid this week?</p>
        <div className="space-y-2">
          {notToDo.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-red-500 text-sm flex-shrink-0">✗</span>
              <input placeholder={`Avoid…`} value={item}
                onChange={e => setNotToDo(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="game-input flex-1 text-sm" />
              {notToDo.length > 1 && (
                <button onClick={() => setNotToDo(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-700 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setNotToDo(prev => [...prev, ''])}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
      </div>

      {/* Energy plan */}
      <div className="game-card p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Energy & Schedule Notes
        </label>
        <textarea rows={3} placeholder="When are your peak hours? Any big events? How will you protect your energy?"
          value={energyPlan} onChange={e => setEnergyPlan(e.target.value)}
          className="game-input w-full text-sm resize-none" />
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Week Plan'}
      </button>
    </div>
  )
}

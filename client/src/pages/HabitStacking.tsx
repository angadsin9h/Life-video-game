import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface StackHabit {
  id: string
  text: string
  anchor?: string
  done: boolean
}

interface Stack {
  id: string
  name: string
  time: 'morning' | 'midday' | 'evening' | 'night'
  habits: StackHabit[]
  color: string
  lastCompleted?: string
  streak: number
}

const TIME_CONFIG = {
  morning: { label: 'Morning Stack', emoji: '🌅', color: '#f97316' },
  midday:  { label: 'Midday Stack',  emoji: '☀️', color: '#eab308' },
  evening: { label: 'Evening Stack', emoji: '🌆', color: '#8b5cf6' },
  night:   { label: 'Night Stack',   emoji: '🌙', color: '#3b82f6' },
}

const STORAGE_KEY = 'habit_stacks'
const today = new Date().toISOString().split('T')[0]

function loadStacks(): Stack[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveStacks(stacks: Stack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stacks))
}

export default function HabitStacking() {
  const { toastSuccess } = useToast()
  const [stacks, setStacks] = useState<Stack[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newStackForm, setNewStackForm] = useState<{ name: string; time: 'morning' | 'midday' | 'evening' | 'night' }>({ name: '', time: 'morning' })
  const [addHabitTo, setAddHabitTo] = useState<string | null>(null)
  const [habitText, setHabitText] = useState('')
  const [habitAnchor, setHabitAnchor] = useState('')

  useEffect(() => { setStacks(loadStacks()) }, [])

  const addStack = () => {
    if (!newStackForm.name.trim()) return
    const tc = TIME_CONFIG[newStackForm.time]
    const stack: Stack = {
      id: Date.now().toString(),
      name: newStackForm.name,
      time: newStackForm.time,
      habits: [],
      color: tc.color,
      streak: 0,
    }
    const updated = [...stacks, stack]
    setStacks(updated)
    saveStacks(updated)
    setNewStackForm({ name: '', time: 'morning' })
    setShowAdd(false)
  }

  const addHabit = (stackId: string) => {
    if (!habitText.trim()) return
    const habit: StackHabit = { id: Date.now().toString(), text: habitText, anchor: habitAnchor || undefined, done: false }
    const updated = stacks.map(s => s.id === stackId ? { ...s, habits: [...s.habits, habit] } : s)
    setStacks(updated)
    saveStacks(updated)
    setHabitText('')
    setHabitAnchor('')
    setAddHabitTo(null)
  }

  const toggleHabit = (stackId: string, habitId: string) => {
    const updated = stacks.map(s => {
      if (s.id !== stackId) return s
      const habits = s.habits.map(h => h.id === habitId ? { ...h, done: !h.done } : h)
      const allDone = habits.every(h => h.done)
      let streak = s.streak
      if (allDone && s.lastCompleted !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().split('T')[0]
        streak = (s.lastCompleted === yStr || s.lastCompleted === today) ? streak + 1 : 1
      }
      return { ...s, habits, lastCompleted: allDone ? today : s.lastCompleted, streak: allDone ? streak : s.streak }
    })
    setStacks(updated)
    saveStacks(updated)
  }

  const deleteHabit = (stackId: string, habitId: string) => {
    const updated = stacks.map(s => s.id === stackId ? { ...s, habits: s.habits.filter(h => h.id !== habitId) } : s)
    setStacks(updated)
    saveStacks(updated)
  }

  const deleteStack = (stackId: string) => {
    const updated = stacks.filter(s => s.id !== stackId)
    setStacks(updated)
    saveStacks(updated)
  }

  const completeAll = (stackId: string) => {
    const updated = stacks.map(s => {
      if (s.id !== stackId) return s
      const habits = s.habits.map(h => ({ ...h, done: true }))
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().split('T')[0]
      const streak = (s.lastCompleted === yStr) ? s.streak + 1 : s.lastCompleted === today ? s.streak : 1
      return { ...s, habits, lastCompleted: today, streak }
    })
    setStacks(updated)
    saveStacks(updated)
    toastSuccess('Stack completed! 🔥')
  }

  const totalHabits = stacks.reduce((s, st) => s + st.habits.length, 0)
  const doneHabits = stacks.reduce((s, st) => s + st.habits.filter(h => h.done).length, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-teal-400" />
            Habit Stacking
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chain habits together for maximum consistency</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Stack
        </button>
      </div>

      {totalHabits > 0 && (
        <div className="game-card p-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{doneHabits}/{totalHabits} habits done today</span>
              <span>{Math.round((doneHabits / totalHabits) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(doneHabits / totalHabits) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Add stack form */}
      {showAdd && (
        <div className="game-card p-4 space-y-3 border border-teal-500/20">
          <h3 className="font-semibold text-slate-300">New Habit Stack</h3>
          <input value={newStackForm.name} onChange={e => setNewStackForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Stack name (e.g. Morning Power Routine)" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(TIME_CONFIG) as Array<keyof typeof TIME_CONFIG>).map(t => {
              const tc = TIME_CONFIG[t]
              return (
                <button key={t} onClick={() => setNewStackForm(f => ({ ...f, time: t }))}
                  className={`p-2 rounded-xl text-center transition-all ${newStackForm.time === t ? 'border' : 'bg-slate-800 hover:bg-slate-700'}`}
                  style={newStackForm.time === t ? { background: tc.color + '22', borderColor: tc.color, color: tc.color } : {}}>
                  <div className="text-lg">{tc.emoji}</div>
                  <div className="text-[10px]">{t}</div>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={addStack} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">Create Stack</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Stacks */}
      {stacks.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-slate-500">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-3">No habit stacks yet.</p>
          <p className="text-sm max-w-xs mx-auto mb-5">Stack habits together: "After coffee → meditate → journal → exercise". Each habit triggers the next.</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Build Your First Stack
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {stacks.map(stack => {
            const tc = TIME_CONFIG[stack.time]
            const allDone = stack.habits.length > 0 && stack.habits.every(h => h.done)
            const doneCnt = stack.habits.filter(h => h.done).length
            return (
              <div key={stack.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${stack.color}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tc.emoji}</span>
                    <div>
                      <h3 className="font-bold text-white">{stack.name}</h3>
                      <div className="text-xs text-slate-500">{tc.label} · {stack.habits.length} habits</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stack.streak > 0 && (
                      <div className="text-xs font-bold" style={{ color: stack.color }}>🔥 {stack.streak}d</div>
                    )}
                    <div className="text-xs text-slate-500">{doneCnt}/{stack.habits.length}</div>
                    <button onClick={() => deleteStack(stack.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Habits */}
                <div className="space-y-2">
                  {stack.habits.map((h, idx) => (
                    <div key={h.id} className="flex items-start gap-3 group">
                      {idx > 0 && (
                        <div className="absolute ml-3 -mt-2 text-xs text-slate-700">↓</div>
                      )}
                      <button onClick={() => toggleHabit(stack.id, h.id)} className="mt-0.5 flex-shrink-0">
                        {h.done
                          ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                          : <Circle className="w-5 h-5 text-slate-600" />
                        }
                      </button>
                      <div className="flex-1">
                        <div className={`text-sm ${h.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>{h.text}</div>
                        {h.anchor && <div className="text-xs text-slate-600">After: {h.anchor}</div>}
                      </div>
                      <button onClick={() => deleteHabit(stack.id, h.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add habit to stack */}
                {addHabitTo === stack.id ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <input value={habitText} onChange={e => setHabitText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addHabit(stack.id)}
                      placeholder="Habit to add..." className="game-input w-full text-sm" autoFocus />
                    <input value={habitAnchor} onChange={e => setHabitAnchor(e.target.value)}
                      placeholder='Anchor (e.g. "After brushing teeth") — optional' className="game-input w-full text-xs" />
                    <div className="flex gap-2">
                      <button onClick={() => addHabit(stack.id)} className="flex-1 py-1.5 text-sm text-white rounded-lg transition-colors" style={{ background: stack.color }}>Add</button>
                      <button onClick={() => setAddHabitTo(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-sm transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button onClick={() => setAddHabitTo(stack.id)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      <Plus className="w-3 h-3" /> Add habit
                    </button>
                    {stack.habits.length > 0 && !allDone && (
                      <button onClick={() => completeAll(stack.id)} className="ml-auto text-xs font-medium transition-colors" style={{ color: stack.color }}>
                        Complete all ✓
                      </button>
                    )}
                    {allDone && <span className="ml-auto text-xs text-green-400 font-semibold">✓ Stack complete!</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MonthlyIntention {
  id: string
  month: string
  year: number
  theme: string
  intentions: string[]
  focusWord: string
  gratitudes: string
  challenges: string
  goals: string[]
  reflection: string
  rating: number
  isCompleted: boolean
  createdAt: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const STORAGE_KEY = 'monthly_intentions'

export default function MonthlyIntentions() {
  const { toastSuccess } = useToast()
  const [months, setMonths] = useState<MonthlyIntention[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newIntention, setNewIntention] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [form, setForm] = useState<Omit<MonthlyIntention, 'id' | 'createdAt'>>({
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    theme: '', intentions: [], focusWord: '',
    gratitudes: '', challenges: '', goals: [], reflection: '', rating: 0, isCompleted: false,
  })

  useEffect(() => {
    try { setMonths(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MonthlyIntention[]) => { setMonths(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.theme.trim()) return
    const m: MonthlyIntention = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...months])
    setForm(f => ({ ...f, theme: '', intentions: [], focusWord: '', gratitudes: '', challenges: '', goals: [], reflection: '', rating: 0, isCompleted: false }))
    setNewIntention('')
    setNewGoal('')
    setShowForm(false)
    toastSuccess('Month intention set 🎯')
  }

  const currentYear = new Date().getFullYear()
  const thisYear = months.filter(m => m.year === currentYear)
  const completed = months.filter(m => m.isCompleted).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-orange-400" />
            Monthly Intentions
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set powerful intentions for each month.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Set
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{months.length}</div>
          <div className="text-xs text-slate-500">Months</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{thisYear.length}</div>
          <div className="text-xs text-slate-500">This Year</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Set Monthly Intentions</h3>
          <div className="flex gap-2">
            <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="game-input text-sm flex-1">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              className="game-input text-sm w-24" min={2020} max={2050} />
          </div>
          <input value={form.focusWord} onChange={e => setForm(f => ({ ...f, focusWord: e.target.value }))}
            placeholder="One word theme (e.g., 'Courage', 'Rest')" className="game-input w-full" autoFocus />
          <textarea value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
            placeholder="What is this month about? *" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newIntention} onChange={e => setNewIntention(e.target.value)}
              placeholder="Add an intention..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newIntention.trim()) { setForm(f => ({ ...f, intentions: [...f.intentions, newIntention.trim()] })); setNewIntention('') } }} />
            <button onClick={() => { if (newIntention.trim()) { setForm(f => ({ ...f, intentions: [...f.intentions, newIntention.trim()] })); setNewIntention('') } }}
              className="px-3 py-1.5 bg-orange-700/30 text-orange-400 rounded-xl text-xs">Add</button>
          </div>
          {form.intentions.length > 0 && (
            <div className="space-y-1">
              {form.intentions.map((int, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-orange-400">→</span>
                  <span className="text-xs text-slate-300 flex-1">{int}</span>
                  <button onClick={() => setForm(f => ({ ...f, intentions: f.intentions.filter((_, j) => j !== i) }))}
                    className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
              placeholder="Add a goal..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { setForm(f => ({ ...f, goals: [...f.goals, newGoal.trim()] })); setNewGoal('') } }} />
            <button onClick={() => { if (newGoal.trim()) { setForm(f => ({ ...f, goals: [...f.goals, newGoal.trim()] })); setNewGoal('') } }}
              className="px-3 py-1.5 bg-green-700/30 text-green-400 rounded-xl text-xs">Goal</button>
          </div>
          <input value={form.gratitudes} onChange={e => setForm(f => ({ ...f, gratitudes: e.target.value }))}
            placeholder="What to carry forward from last month..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Set Intentions</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {months.map(m => {
          const isExp = expanded === m.id
          return (
            <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: '3px solid #f97316' }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{m.isCompleted ? '✅' : '🎯'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{m.month} {m.year}</span>
                    {m.focusWord && <span className="text-xs bg-orange-900/30 text-orange-400 px-1.5 rounded">{m.focusWord}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{m.theme}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {m.intentions.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Intentions:</p>
                      {m.intentions.map((int, i) => <p key={i} className="text-xs text-orange-300">→ {int}</p>)}
                    </div>
                  )}
                  {m.goals.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Goals:</p>
                      {m.goals.map((g, i) => <p key={i} className="text-xs text-green-300">🎯 {g}</p>)}
                    </div>
                  )}
                  {m.gratitudes && <p className="text-xs text-yellow-300">🙏 {m.gratitudes}</p>}
                  {m.reflection && <p className="text-xs text-slate-300">📝 {m.reflection}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => { save(months.map(x => x.id === m.id ? { ...x, isCompleted: !x.isCompleted } : x)); toastSuccess('Month status updated!') }}
                      className="text-xs text-green-600 hover:text-green-400">
                      {m.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    </button>
                    <button onClick={() => save(months.filter(x => x.id !== m.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {months.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Each month is a new chapter. Set your intentions now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

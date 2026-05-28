import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface AnnualReview {
  id: string
  year: number
  theme: string
  biggestWin: string
  biggestLesson: string
  biggestChallenge: string
  whatLetGo: string
  gratefulFor: string[]
  goalsAchieved: number
  goalsTotal: number
  avgMood: number
  avgEnergy: number
  topMemories: string[]
  wordsForYear: string
  nextYearTheme: string
  nextYearGoals: string[]
  createdAt: string
}

const STORAGE_KEY = 'annual_review'

export default function AnnualReview() {
  const { toastSuccess } = useToast()
  const [reviews, setReviews] = useState<AnnualReview[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newGrateful, setNewGrateful] = useState('')
  const [newMemory, setNewMemory] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [form, setForm] = useState<Omit<AnnualReview, 'id' | 'createdAt'>>({
    year: new Date().getFullYear(), theme: '', biggestWin: '', biggestLesson: '',
    biggestChallenge: '', whatLetGo: '', gratefulFor: [], goalsAchieved: 0,
    goalsTotal: 0, avgMood: 7, avgEnergy: 7, topMemories: [],
    wordsForYear: '', nextYearTheme: '', nextYearGoals: [],
  })

  useEffect(() => {
    try { setReviews(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AnnualReview[]) => { setReviews(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.biggestWin.trim() && !form.theme.trim()) return
    const r: AnnualReview = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...reviews])
    setForm(f => ({ ...f, theme: '', biggestWin: '', biggestLesson: '', biggestChallenge: '', whatLetGo: '', gratefulFor: [], topMemories: [], wordsForYear: '', nextYearTheme: '', nextYearGoals: [] }))
    setShowForm(false)
    toastSuccess('Annual review saved 🎉')
  }

  const addItem = (field: 'gratefulFor' | 'topMemories' | 'nextYearGoals', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return
    setForm(f => ({ ...f, [field]: [...f[field], value.trim()] }))
    setter('')
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Calendar className="w-7 h-7 text-violet-400" />
            Annual Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep-dive year-in-review to close the past and design the future.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Review
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{reviews.length}</div>
          <div className="text-xs text-slate-500">Reviews</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{reviews[0]?.year || '-'}</div>
          <div className="text-xs text-slate-500">Last Year</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">
            {reviews.length > 0 ? `${Math.round(reviews[0].goalsAchieved / Math.max(reviews[0].goalsTotal, 1) * 100)}%` : '-'}
          </div>
          <div className="text-xs text-slate-500">Goals Hit</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Annual Review {form.year}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Year</p>
              <input type="number" value={form.year} min={2000} max={2100}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Word(s) for this year</p>
              <input value={form.wordsForYear} onChange={e => setForm(f => ({ ...f, wordsForYear: e.target.value }))}
                placeholder="e.g. Courage, Growth" className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
            placeholder="Year theme or title" className="game-input w-full" autoFocus />
          <textarea value={form.biggestWin} onChange={e => setForm(f => ({ ...f, biggestWin: e.target.value }))}
            placeholder="Biggest win of the year..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.biggestLesson} onChange={e => setForm(f => ({ ...f, biggestLesson: e.target.value }))}
            placeholder="Most important lesson learned..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.biggestChallenge} onChange={e => setForm(f => ({ ...f, biggestChallenge: e.target.value }))}
            placeholder="Biggest challenge you overcame..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whatLetGo} onChange={e => setForm(f => ({ ...f, whatLetGo: e.target.value }))}
            placeholder="What did you let go of this year?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newGrateful} onChange={e => setNewGrateful(e.target.value)}
              placeholder="Something you're grateful for..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addItem('gratefulFor', newGrateful, setNewGrateful) }} />
            <button onClick={() => addItem('gratefulFor', newGrateful, setNewGrateful)}
              className="px-3 py-1.5 bg-violet-700/30 text-violet-400 rounded-xl text-xs">+</button>
          </div>
          {form.gratefulFor.length > 0 && (
            <div className="space-y-0.5">
              {form.gratefulFor.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-violet-300">
                  <span>✦</span><span className="flex-1">{g}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, gratefulFor: fo.gratefulFor.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Goals achieved</p>
              <input type="number" value={form.goalsAchieved} min={0}
                onChange={e => setForm(f => ({ ...f, goalsAchieved: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Goals total</p>
              <input type="number" value={form.goalsTotal} min={0}
                onChange={e => setForm(f => ({ ...f, goalsTotal: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Avg mood: {form.avgMood}/10</p>
              <input type="range" min={1} max={10} value={form.avgMood}
                onChange={e => setForm(f => ({ ...f, avgMood: Number(e.target.value) }))}
                className="w-full h-1 accent-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Avg energy: {form.avgEnergy}/10</p>
              <input type="range" min={1} max={10} value={form.avgEnergy}
                onChange={e => setForm(f => ({ ...f, avgEnergy: Number(e.target.value) }))}
                className="w-full h-1 accent-violet-400" />
            </div>
          </div>
          <input value={form.nextYearTheme} onChange={e => setForm(f => ({ ...f, nextYearTheme: e.target.value }))}
            placeholder="Theme for next year" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
              placeholder="Next year goal..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addItem('nextYearGoals', newGoal, setNewGoal) }} />
            <button onClick={() => addItem('nextYearGoals', newGoal, setNewGoal)}
              className="px-3 py-1.5 bg-violet-700/30 text-violet-400 rounded-xl text-xs">+</button>
          </div>
          {form.nextYearGoals.length > 0 && (
            <div className="space-y-0.5">
              {form.nextYearGoals.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-green-300">
                  <span>→</span><span className="flex-1">{g}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, nextYearGoals: fo.nextYearGoals.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save Review</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reviews.map(r => {
          const isExp = expanded === r.id
          const goalPct = r.goalsTotal > 0 ? Math.round((r.goalsAchieved / r.goalsTotal) * 100) : 0
          return (
            <div key={r.id} className="game-card overflow-hidden border-l-2 border-violet-500/40">
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">📅</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{r.year}</span>
                    {r.theme && <span className="text-sm text-slate-300">— {r.theme}</span>}
                  </div>
                  <p className="text-xs text-slate-500">Goals: {goalPct}% · Mood {r.avgMood}/10 · Energy {r.avgEnergy}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.wordsForYear && <p className="text-xs text-violet-300 font-medium">"{r.wordsForYear}"</p>}
                  {r.biggestWin && <p className="text-xs text-green-300">🏆 {r.biggestWin}</p>}
                  {r.biggestLesson && <p className="text-xs text-yellow-300">💡 {r.biggestLesson}</p>}
                  {r.biggestChallenge && <p className="text-xs text-red-300">⚡ {r.biggestChallenge}</p>}
                  {r.whatLetGo && <p className="text-xs text-slate-400">🍃 Let go: {r.whatLetGo}</p>}
                  {r.gratefulFor.length > 0 && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 font-medium">Grateful for:</p>
                      {r.gratefulFor.map((g, i) => <p key={i} className="text-xs text-slate-400">✦ {g}</p>)}
                    </div>
                  )}
                  {r.nextYearTheme && <p className="text-xs text-indigo-300">→ {r.year + 1}: {r.nextYearTheme}</p>}
                  <button onClick={() => save(reviews.filter(x => x.id !== r.id))} className="ml-auto block text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {reviews.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">An examined year is a well-lived year. Do your annual review.</p>
          </div>
        )}
      </div>
    </div>
  )
}

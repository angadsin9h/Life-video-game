import { useState, useEffect } from 'react'
import { Trophy, Plus, ChevronLeft, ChevronRight, Flame, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Win {
  id: string
  date: string
  text: string
  category: string
  impact: 1 | 2 | 3
  private: boolean
}

const CATEGORIES = [
  { value: 'health', label: 'Health', emoji: '💪' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'mind', label: 'Mind', emoji: '🧠' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'personal', label: 'Personal', emoji: '⭐' },
]

const IMPACT_CONFIG = [
  { value: 1 as const, label: 'Small win', emoji: '✅', color: '#22c55e' },
  { value: 2 as const, label: 'Medium win', emoji: '🏅', color: '#3b82f6' },
  { value: 3 as const, label: 'Big win!', emoji: '🏆', color: '#eab308' },
]

const STORAGE_KEY = 'daily_wins'

function loadWins(): Win[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveWins(wins: Win[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wins))
}

const WIN_PROMPTS = [
  "What did you accomplish today, no matter how small?",
  "What are you proud of from today?",
  "What did you do today that your past self would be impressed by?",
  "What challenge did you overcome today?",
  "What habit or commitment did you keep today?",
  "What progress did you make toward your goals?",
]

export default function DailyWins() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<Win[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', category: 'work', impact: 1 as 1 | 2 | 3, private: false })
  const [showAll, setShowAll] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { setWins(loadWins()) }, [])

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const prompt = WIN_PROMPTS[dayOfYear % WIN_PROMPTS.length]

  const prevDay = () => {
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }
  const nextDay = () => {
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + 1)
    if (d.toISOString().split('T')[0] <= today) setDate(d.toISOString().split('T')[0])
  }

  const addWin = () => {
    if (!form.text.trim()) return
    const win: Win = { id: Date.now().toString(), date, ...form }
    const updated = [win, ...wins]
    setWins(updated)
    saveWins(updated)
    setForm({ text: '', category: 'work', impact: 1, private: false })
    setShowForm(false)
    toastSuccess('Win logged! 🏆')
  }

  const dateWins = wins.filter(w => w.date === date)
  const totalWins = wins.length
  const bigWins = wins.filter(w => w.impact === 3).length

  // Streak
  const dateSet = new Set(wins.map(w => w.date))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    if (dateSet.has(d.toISOString().split('T')[0])) streak++
    else if (i > 0) break
  }

  // Category breakdown
  const byCat: Record<string, number> = {}
  for (const w of wins) byCat[w.category] = (byCat[w.category] || 0) + 1

  // 30-day win count chart
  const last30: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    last30.push({ date: ds, count: wins.filter(w => w.date === ds).length })
  }
  const maxDay = Math.max(...last30.map(d => d.count), 1)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Daily Wins
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Celebrate every victory, big and small</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log Win
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400">{totalWins}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          <Star className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-300">{bigWins}</div>
          <div className="text-xs text-slate-500">Big Wins</div>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="p-1 text-slate-600 hover:text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
        <span className="flex-1 text-center text-sm font-semibold text-slate-300">
          {date === today ? '🌟 Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        <button onClick={nextDay} disabled={date >= today} className="p-1 text-slate-600 hover:text-slate-400 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20 bg-yellow-900/5">
          <div className="text-xs text-yellow-400 italic">"{prompt}"</div>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Describe your win..." className="game-input w-full h-24 resize-none" autoFocus />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.category === c.value ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {IMPACT_CONFIG.map(ic => (
              <button key={ic.value} onClick={() => setForm(f => ({ ...f, impact: ic.value }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.impact === ic.value ? 'text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                style={form.impact === ic.value ? { background: ic.color + '33', border: `1px solid ${ic.color}`, color: ic.color } : {}}>
                {ic.emoji} {ic.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addWin} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Log Win 🏆
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Today's wins */}
      {dateWins.length > 0 ? (
        <div className="space-y-2">
          {dateWins.map(w => {
            const cat = CATEGORIES.find(c => c.value === w.category)
            const imp = IMPACT_CONFIG.find(i => i.value === w.impact)!
            return (
              <div key={w.id} className="game-card p-4 flex items-start gap-3" style={{ borderLeft: `3px solid ${imp.color}` }}>
                <span className="text-2xl flex-shrink-0">{imp.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-200 leading-relaxed">{w.text}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span>{cat?.emoji} {cat?.label}</span>
                    <span>·</span>
                    <span style={{ color: imp.color }}>{imp.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No wins logged for this day.</p>
          {date === today && (
            <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              What did you win today?
            </button>
          )}
        </div>
      )}

      {/* 30-day chart */}
      {wins.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">30-Day Win History</h3>
          <div className="flex items-end gap-0.5 h-12">
            {last30.map((d, i) => (
              <div key={i} className="flex-1 rounded-t-sm group relative"
                style={{
                  height: `${(d.count / maxDay) * 100}%`,
                  background: d.count > 0 ? '#eab308' : '#1e293b',
                  minHeight: d.count > 0 ? '4px' : '2px',
                  opacity: d.count > 0 ? 1 : 0.3,
                }}>
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.count} win{d.count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

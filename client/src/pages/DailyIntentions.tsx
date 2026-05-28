import { useEffect, useState } from 'react'
import { Target, Plus, Check, ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Intention {
  id: string
  text: string
  category: string
  completed: boolean
  reflection: string
}

interface DayData {
  date: string
  intentions: Intention[]
  theme: string
  gratitude: string
  energyLevel: number
  reviewNote: string
}

const CATEGORIES = [
  { value: 'work', label: 'Work', color: '#3b82f6', emoji: '💼' },
  { value: 'health', label: 'Health', color: '#22c55e', emoji: '💪' },
  { value: 'relationships', label: 'Relations', color: '#ec4899', emoji: '❤️' },
  { value: 'learning', label: 'Learning', color: '#8b5cf6', emoji: '📚' },
  { value: 'personal', label: 'Personal', color: '#f97316', emoji: '🌱' },
  { value: 'creative', label: 'Creative', color: '#14b8a6', emoji: '🎨' },
]

const STORAGE_KEY = 'daily_intentions_v2'

const getKey = (date: string) => `${STORAGE_KEY}_${date}`

const MORNING_THEMES = [
  'Be fully present in every moment.',
  'Give more than I take.',
  'Choose growth over comfort.',
  'Lead with curiosity, not judgment.',
  'Make today matter.',
  'Be the person I aspire to be.',
  'Focus on what I can control.',
  'Create more than I consume.',
]

export default function DailyIntentions() {
  const { toastSuccess } = useToast()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState<DayData>({ date, intentions: [], theme: '', gratitude: '', energyLevel: 5, reviewNote: '' })
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState('work')
  const [showReview, setShowReview] = useState(false)

  useEffect(() => { loadDay(date) }, [date])

  const loadDay = (d: string) => {
    const saved = localStorage.getItem(getKey(d))
    if (saved) {
      setData(JSON.parse(saved))
    } else {
      const theme = MORNING_THEMES[Math.floor(Math.random() * MORNING_THEMES.length)]
      setData({ date: d, intentions: [], theme, gratitude: '', energyLevel: 5, reviewNote: '' })
    }
  }

  const persist = (updated: DayData) => {
    setData(updated)
    localStorage.setItem(getKey(date), JSON.stringify(updated))
  }

  const addIntention = () => {
    if (!newText.trim()) return
    const intention: Intention = {
      id: Date.now().toString(),
      text: newText,
      category: newCategory,
      completed: false,
      reflection: '',
    }
    persist({ ...data, intentions: [...data.intentions, intention] })
    setNewText('')
    toastSuccess('Intention set!')
  }

  const toggleDone = (id: string) => {
    persist({ ...data, intentions: data.intentions.map(i => i.id === id ? { ...i, completed: !i.completed } : i) })
  }

  const deleteIntention = (id: string) => {
    persist({ ...data, intentions: data.intentions.filter(i => i.id !== id) })
  }

  const shiftDate = (days: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const isToday = date === new Date().toISOString().split('T')[0]
  const completed = data.intentions.filter(i => i.completed).length
  const completionPct = data.intentions.length > 0 ? Math.round((completed / data.intentions.length) * 100) : 0

  const dayLabel = () => {
    if (isToday) return 'Today'
    const diff = Math.round((new Date(date + 'T12:00:00').getTime() - new Date().getTime()) / 86400000)
    if (diff === -1) return 'Yesterday'
    if (diff === 1) return 'Tomorrow'
    return new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Daily Intentions
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set your intentions. Review your day.</p>
        </div>
        <button onClick={() => setShowReview(!showReview)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
          {showReview ? 'Morning' : 'Evening Review'}
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-bold text-white">{dayLabel()}</div>
          <div className="text-xs text-slate-500">{date}</div>
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Theme */}
      <div className="game-card p-4 border border-violet-500/10 bg-violet-900/5">
        <div className="text-xs text-violet-400 uppercase tracking-wider mb-1">Today's Theme</div>
        <p className="text-slate-200 italic">{data.theme || MORNING_THEMES[0]}</p>
      </div>

      {/* Progress */}
      {data.intentions.length > 0 && (
        <div className="game-card p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Intentions completed</span>
            <span className="font-semibold text-white">{completed}/{data.intentions.length}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Add intention */}
      {!showReview && (
        <div className="game-card p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setNewCategory(c.value)}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={newCategory === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIntention()}
              placeholder="Set an intention for today..." className="game-input flex-1" />
            <button onClick={addIntention} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Intentions list */}
      <div className="space-y-2">
        {data.intentions.map(i => {
          const cat = CATEGORIES.find(c => c.value === i.category)
          return (
            <div key={i.id} className="game-card p-3 flex items-center gap-3"
              style={{ opacity: i.completed ? 0.7 : 1 }}>
              <button onClick={() => toggleDone(i.id)}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: i.completed ? cat?.color || '#22c55e' : '#475569', background: i.completed ? (cat?.color || '#22c55e') + '22' : 'transparent' }}>
                {i.completed && <Check className="w-3.5 h-3.5" style={{ color: cat?.color || '#22c55e' }} />}
              </button>
              <span className={`flex-1 text-sm ${i.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{i.text}</span>
              <span className="text-xs" style={{ color: cat?.color || '#64748b' }}>{cat?.emoji}</span>
              <button onClick={() => deleteIntention(i.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Gratitude */}
      <div className="game-card p-4 space-y-2">
        <label className="text-xs text-slate-400 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" /> One thing I'm grateful for today
        </label>
        <input value={data.gratitude}
          onChange={e => persist({ ...data, gratitude: e.target.value })}
          placeholder="I'm grateful for..." className="game-input w-full" />
      </div>

      {/* Evening review */}
      {showReview && (
        <div className="game-card p-4 space-y-4 border border-blue-500/10">
          <h3 className="font-semibold text-slate-300">Evening Review</h3>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Energy Level Today</label>
            <input type="range" min="1" max="10" value={data.energyLevel}
              onChange={e => persist({ ...data, energyLevel: +e.target.value })}
              className="w-full accent-violet-400" />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Drained</span><span>{data.energyLevel}/10</span><span>Peak</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Day reflection</label>
            <textarea value={data.reviewNote}
              onChange={e => persist({ ...data, reviewNote: e.target.value })}
              placeholder="What went well? What could be better tomorrow?" className="game-input w-full h-24 resize-none" />
          </div>
          {completed < data.intentions.length && (
            <div className="text-sm text-slate-500">
              {data.intentions.length - completed} intention{data.intentions.length - completed > 1 ? 's' : ''} not completed. That's OK — log them below.
            </div>
          )}
          <button onClick={() => { toastSuccess('Evening review saved!'); setShowReview(false) }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Save Review
          </button>
        </div>
      )}

      {data.intentions.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No intentions set for {isToday ? 'today' : 'this day'} yet.</p>
          <p className="text-sm mt-1">What do you want to accomplish?</p>
        </div>
      )}
    </div>
  )
}

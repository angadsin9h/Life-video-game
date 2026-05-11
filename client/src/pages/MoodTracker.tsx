import { useEffect, useState } from 'react'
import axios from 'axios'
import { Heart, TrendingUp, Calendar, Edit2 } from 'lucide-react'

interface MoodEntry {
  id: number
  date: string
  mood: number
  note: string | null
  label: string
  emoji: string
}

const MOOD_EMOJIS = ['', '😭', '😔', '😐', '😊', '🤩']
const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Amazing']
const MOOD_COLORS = [
  '',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-violet-500',
]
const MOOD_TEXT = [
  '',
  'text-red-400',
  'text-orange-400',
  'text-yellow-400',
  'text-green-400',
  'text-violet-400',
]
const MOOD_BORDER = [
  '',
  'border-red-500/50 bg-red-900/20',
  'border-orange-500/50 bg-orange-900/20',
  'border-yellow-500/50 bg-yellow-900/20',
  'border-green-500/50 bg-green-900/20',
  'border-violet-500/50 bg-violet-900/20',
]

function avgMood(entries: MoodEntry[]) {
  if (!entries.length) return 0
  return Math.round(entries.reduce((s, e) => s + e.mood, 0) / entries.length * 10) / 10
}

export default function MoodTracker() {
  const [history, setHistory] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [note, setNote] = useState('')
  const [editingDate, setEditingDate] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    const res = await axios.get<MoodEntry[]>('/api/mood/history')
    setHistory(res.data)
  }

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)) }, [])

  const logMood = async (mood: number, date = today) => {
    setLogging(true)
    try {
      await axios.post('/api/mood', { mood, note: note || null, date })
      setNote('')
      setEditingDate(null)
      await load()
    } finally {
      setLogging(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const todayEntry = history.find(e => e.date === today)
  const avg7 = avgMood(history.slice(0, 7))
  const avg30 = avgMood(history)

  const moodCounts = [0, 0, 0, 0, 0, 0]
  for (const e of history) if (e.mood >= 1 && e.mood <= 5) moodCounts[e.mood]++
  const maxCount = Math.max(...moodCounts.slice(1), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-8 h-8 text-red-400" />
          Mood Tracker
        </h1>
        <p className="text-slate-400 mt-1">Track how you feel — notice patterns, improve your baseline</p>
      </div>

      {/* Today's mood */}
      <div className={`game-card p-5 border ${todayEntry ? MOOD_BORDER[todayEntry.mood] : 'border-slate-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">How are you feeling today?</h3>
          {todayEntry && (
            <button onClick={() => setEditingDate(today)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {todayEntry && editingDate !== today ? (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{todayEntry.emoji}</span>
            <div>
              <div className={`font-bold text-lg ${MOOD_TEXT[todayEntry.mood]}`}>{todayEntry.label}</div>
              {todayEntry.note && <p className="text-sm text-slate-400 italic mt-0.5">"{todayEntry.note}"</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map(m => (
                <button
                  key={m}
                  onClick={() => logMood(m)}
                  disabled={logging}
                  className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center transition-all hover:scale-110 border-2 ${
                    todayEntry?.mood === m
                      ? `${MOOD_BORDER[m]} border-opacity-100 scale-110`
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                  title={MOOD_LABELS[m]}
                >
                  {MOOD_EMOJIS[m]}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="game-input w-full text-sm"
              placeholder="Add a note... (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-slate-500 text-center">Tap an emoji to log your mood</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-3xl mb-1">{MOOD_EMOJIS[Math.round(avg7)] || '—'}</div>
          <div className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avg7 > 0 ? avg7.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">7-day avg</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-3xl mb-1">{MOOD_EMOJIS[Math.round(avg30)] || '—'}</div>
          <div className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avg30 > 0 ? avg30.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">30-day avg</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-3xl mb-1">📅</div>
          <div className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
            {history.length}
          </div>
          <div className="text-xs text-slate-500">Days logged</div>
        </div>
      </div>

      {/* Mood distribution */}
      {history.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Mood Distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(m => (
              <div key={m} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{MOOD_EMOJIS[m]}</span>
                <span className="text-xs text-slate-400 w-16">{MOOD_LABELS[m]}</span>
                <div className="flex-1 stat-bar h-3">
                  <div
                    className={`stat-bar-fill ${MOOD_COLORS[m]} transition-all duration-700`}
                    style={{ width: `${(moodCounts[m] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-4 text-right">{moodCounts[m]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Mood History
          </h3>
          <div className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                <span className="text-xl w-8 text-center">{entry.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${MOOD_TEXT[entry.mood]}`}>{entry.label}</span>
                    {entry.note && <span className="text-xs text-slate-500 italic truncate max-w-48">"{entry.note}"</span>}
                  </div>
                  <div className="text-xs text-slate-600">{entry.date}</div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= entry.mood ? MOOD_COLORS[entry.mood] : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Log your first mood above to start tracking your emotional patterns.</p>
        </div>
      )}
    </div>
  )
}

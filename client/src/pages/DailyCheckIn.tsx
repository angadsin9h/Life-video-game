import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sun, Moon, ChevronLeft, ChevronRight, Save, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface CheckInData {
  date: string
  morning_mood: number
  morning_energy: number
  morning_intention: string
  evening_mood: number
  evening_energy: number
  evening_wins: string
  evening_gratitude: string
  notes: string
}

const empty = (date: string): CheckInData => ({
  date, morning_mood: 0, morning_energy: 0, morning_intention: '',
  evening_mood: 0, evening_energy: 0, evening_wins: '', evening_gratitude: '', notes: '',
})

const MOOD_EMOJIS = ['', '😫', '😔', '😐', '😊', '😄']
const ENERGY_EMOJIS = ['', '🔋', '⚡', '⚡⚡', '⚡⚡⚡', '🔥']

const MORNING_INTENTIONS = [
  'I will focus on one important task',
  'I will stay calm and present',
  'I will show up with full energy',
  'I will help one person today',
  'I will take care of my body',
  'I will make meaningful progress',
  'I will learn something new',
  'I will be disciplined and consistent',
]

export default function DailyCheckIn() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [data, setData] = useState<CheckInData>(empty(today))
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<'morning' | 'evening'>(() =>
    new Date().getHours() < 13 ? 'morning' : 'evening'
  )

  useEffect(() => { load() }, [date])

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`/api/check-ins/${date}`)
      const d = r.data as Partial<CheckInData>
      if (d && Object.keys(d).length > 0) {
        setData({ ...empty(date), ...d })
        setSaved(true)
      } else {
        setData(empty(date))
        setSaved(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    await axios.post('/api/check-ins', { ...data, date })
    setSaved(true)
    toastSuccess(mode === 'morning' ? 'Morning check-in saved! Have a great day ☀️' : 'Evening check-in saved! Rest well 🌙')
  }

  const shiftDate = (d: number) => {
    const dt = new Date(date + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  const isToday = date === today

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const morningComplete = data.morning_mood > 0 && data.morning_energy > 0 && data.morning_intention.trim()
  const eveningComplete = data.evening_mood > 0 && data.evening_wins.trim()

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Daily Check-In
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Morning & evening bookends for your day</p>
        </div>
        <div className="flex items-center gap-2">
          {morningComplete && <span className="text-xs text-green-400">☀️ Done</span>}
          {eveningComplete && <span className="text-xs text-indigo-400">🌙 Done</span>}
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <div className="font-bold text-white">{isToday ? 'Today' : date}</div>
          {saved && <div className="text-xs text-green-400">✓ Saved</div>}
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button onClick={() => setMode('morning')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'morning' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <Sun className="w-4 h-4" /> Morning
          {morningComplete && <span className="text-xs">✓</span>}
        </button>
        <button onClick={() => setMode('evening')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'evening' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <Moon className="w-4 h-4" /> Evening
          {eveningComplete && <span className="text-xs">✓</span>}
        </button>
      </div>

      {mode === 'morning' && (
        <div className="space-y-5">
          <div className="game-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4" /> Morning Pulse
            </h3>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">How are you feeling?</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(m => (
                  <button key={m} onClick={() => setData(d => ({ ...d, morning_mood: m }))}
                    className={`flex-1 text-2xl transition-transform hover:scale-125 py-2 rounded-lg ${data.morning_mood === m ? 'bg-yellow-500/20 scale-110' : 'bg-slate-800'}`}>
                    {MOOD_EMOJIS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Energy Level</span>
                <span className="text-yellow-400">{ENERGY_EMOJIS[data.morning_energy] || '—'}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(e => (
                  <button key={e} onClick={() => setData(d => ({ ...d, morning_energy: e }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${data.morning_energy === e ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="game-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Morning Intention</h3>
            <input value={data.morning_intention}
              onChange={e => setData(d => ({ ...d, morning_intention: e.target.value }))}
              placeholder="Today I intend to..." className="game-input w-full" />
            <div className="flex flex-wrap gap-1.5">
              {MORNING_INTENTIONS.slice(0, 4).map(i => (
                <button key={i} onClick={() => setData(d => ({ ...d, morning_intention: i }))}
                  className="text-xs text-slate-600 hover:text-yellow-400 transition-colors bg-slate-800 px-2 py-1 rounded-lg">
                  {i}
                </button>
              ))}
            </div>
          </div>

          {data.notes !== undefined && (
            <div className="game-card p-4">
              <label className="text-xs text-slate-400 mb-1 block">Morning Notes</label>
              <textarea value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
                placeholder="Anything on your mind this morning..." className="game-input w-full h-16 resize-none" />
            </div>
          )}
        </div>
      )}

      {mode === 'evening' && (
        <div className="space-y-5">
          <div className="game-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Moon className="w-4 h-4" /> Evening Pulse
            </h3>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">How did the day go?</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(m => (
                  <button key={m} onClick={() => setData(d => ({ ...d, evening_mood: m }))}
                    className={`flex-1 text-2xl transition-transform hover:scale-125 py-2 rounded-lg ${data.evening_mood === m ? 'bg-indigo-500/20 scale-110' : 'bg-slate-800'}`}>
                    {MOOD_EMOJIS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">End-of-day Energy</span>
                <span className="text-indigo-400">{ENERGY_EMOJIS[data.evening_energy] || '—'}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(e => (
                  <button key={e} onClick={() => setData(d => ({ ...d, evening_energy: e }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${data.evening_energy === e ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="game-card p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Today's Wins</label>
              <textarea value={data.evening_wins} onChange={e => setData(d => ({ ...d, evening_wins: e.target.value }))}
                placeholder="What did I accomplish today? Even small things count..." className="game-input w-full h-20 resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Evening Gratitude</label>
              <textarea value={data.evening_gratitude} onChange={e => setData(d => ({ ...d, evening_gratitude: e.target.value }))}
                placeholder="I'm grateful for..." className="game-input w-full h-16 resize-none" />
            </div>
          </div>

          {data.morning_intention && (
            <div className="game-card p-4 border border-yellow-500/20">
              <div className="text-xs text-yellow-400 mb-1">☀️ Morning Intention</div>
              <div className="text-sm text-slate-300">{data.morning_intention}</div>
            </div>
          )}
        </div>
      )}

      <button onClick={save} className={`w-full py-3 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${mode === 'morning' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
        <Save className="w-4 h-4" />
        {saved ? 'Update Check-In' : `Save ${mode === 'morning' ? 'Morning' : 'Evening'} Check-In`}
      </button>
    </div>
  )
}

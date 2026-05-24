import { useState, useEffect } from 'react'
import { Sun, Moon, Zap, Star, Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'daily_driver_log'
const STATE_KEY = 'daily_driver_state'

interface DailyDriverState {
  energy: number
  mood: number
  wins: [string, string, string]
  mainFocus: string
  intention: string
}

interface DailyDriverEntry {
  date: string
  energy: number
  mood: number
  wins: [string, string, string]
  mainFocus: string
  intention: string
  score: number
  savedAt: string
}

const DEFAULT_STATE: DailyDriverState = {
  energy: 5,
  mood: 3,
  wins: ['', '', ''],
  mainFocus: '',
  intention: '',
}

const MOODS = ['😔', '😐', '🙂', '😊', '🤩']

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function computeScore(state: DailyDriverState): number {
  const energyPoints = state.energy * 10
  const moodPoints = state.mood * 8
  const winsPoints = state.wins.filter(w => w.trim().length > 0).length * 10
  const focusPoints = state.mainFocus.trim().length > 0 ? 10 : 0
  return Math.min(100, energyPoints + moodPoints + winsPoints + focusPoints)
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-6 h-6 text-amber-400" /> }
  if (hour < 17) return { text: 'Good afternoon', icon: <Zap className="w-6 h-6 text-violet-400" /> }
  return { text: 'Good evening', icon: <Moon className="w-6 h-6 text-indigo-400" /> }
}

function getDotColor(score: number): string {
  if (score > 60) return 'bg-emerald-500'
  if (score > 30) return 'bg-amber-400'
  return 'bg-red-500'
}

function loadLog(): DailyDriverEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function loadState(): DailyDriverState {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE }
}

export default function DailyDriver() {
  const { toastSuccess } = useToast()
  const [state, setState] = useState<DailyDriverState>(loadState)
  const [log, setLog] = useState<DailyDriverEntry[]>(loadLog)

  const greeting = getGreeting()
  const score = computeScore(state)
  const today = getToday()

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }, [state])

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const entry = log.find(e => e.date === dateStr)
    return { date: dateStr, score: entry?.score ?? -1 }
  })

  function setWin(idx: number, val: string) {
    const wins: [string, string, string] = [...state.wins] as [string, string, string]
    wins[idx] = val
    setState(prev => ({ ...prev, wins }))
  }

  function handleSave() {
    const entry: DailyDriverEntry = {
      date: today,
      energy: state.energy,
      mood: state.mood,
      wins: state.wins,
      mainFocus: state.mainFocus,
      intention: state.intention,
      score,
      savedAt: new Date().toISOString(),
    }
    const updated = log.filter(e => e.date !== today)
    updated.push(entry)
    setLog(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }
    toastSuccess('Daily Driver saved!', `Score: ${score}/100`)
  }

  const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
  const scoreBorder = score >= 70 ? 'border-emerald-500/40' : score >= 40 ? 'border-amber-400/40' : 'border-red-500/40'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {greeting.icon}
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Daily Driver
          </h1>
        </div>
        <p className="text-slate-400 text-sm">{greeting.text} — let's build your day. <span className="text-violet-400">{today}</span></p>
      </div>

      {/* Score card */}
      <div className={`game-card mb-6 border ${scoreBorder} flex items-center justify-between`}>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Daily Score</p>
          <p className={`text-5xl font-black ${scoreColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>{score}</p>
          <p className="text-slate-500 text-xs mt-1">/ 100</p>
        </div>
        <div className="text-right">
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            <span>Energy: <span className="text-violet-300">{state.energy * 10}pts</span></span>
            <span>Mood: <span className="text-violet-300">{state.mood * 8}pts</span></span>
            <span>Wins: <span className="text-violet-300">{state.wins.filter(w => w.trim()).length * 10}pts</span></span>
            <span>Focus: <span className="text-violet-300">{state.mainFocus.trim() ? '10' : '0'}pts</span></span>
          </div>
        </div>
      </div>

      {/* Energy Slider */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Energy Level</span>
          <span className="ml-auto text-amber-400 font-bold text-lg" style={{ fontFamily: 'Orbitron, monospace' }}>{state.energy}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={state.energy}
          onChange={e => setState(prev => ({ ...prev, energy: Number(e.target.value) }))}
          className="w-full accent-amber-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Drained</span><span>Unstoppable</span>
        </div>
      </div>

      {/* Mood Pulse */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-sm">Mood Pulse</span>
        </div>
        <div className="flex gap-3 justify-center">
          {MOODS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => setState(prev => ({ ...prev, mood: idx + 1 }))}
              className={`text-3xl p-2 rounded-xl transition-all ${state.mood === idx + 1 ? 'bg-violet-600/40 ring-2 ring-violet-400 scale-110' : 'hover:bg-slate-700/60'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">{MOODS[state.mood - 1]} — level {state.mood}/5</p>
      </div>

      {/* Today's 3 Wins */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Today's 3 Wins</span>
        </div>
        {[0, 1, 2].map(i => (
          <input
            key={i}
            type="text"
            className="game-input w-full mb-2 last:mb-0"
            placeholder={`Win #${i + 1}...`}
            value={state.wins[i]}
            onChange={e => setWin(i, e.target.value)}
          />
        ))}
      </div>

      {/* Main Focus */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Main Focus Today</span>
        </div>
        <input
          type="text"
          className="game-input w-full"
          placeholder="The single most important thing today..."
          value={state.mainFocus}
          onChange={e => setState(prev => ({ ...prev, mainFocus: e.target.value }))}
        />
      </div>

      {/* End-of-Day Intention */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm">End-of-Day Intention</span>
        </div>
        <textarea
          className="game-input w-full h-24 resize-none"
          placeholder="How do you want to feel at the end of today? What would make this day a success?"
          value={state.intention}
          onChange={e => setState(prev => ({ ...prev, intention: e.target.value }))}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all mb-6 flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-5 h-5" />
        Save Daily Driver
      </button>

      {/* 7-Day History */}
      <div className="game-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Last 7 Days</span>
        </div>
        <div className="flex items-end gap-2 justify-center">
          {last7.map(({ date, score: s }) => (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">{s >= 0 ? s : '—'}</span>
              <div
                className={`w-8 h-8 rounded-full ${s >= 0 ? getDotColor(s) : 'bg-slate-700'} transition-all`}
                title={`${date}: ${s >= 0 ? s : 'No data'}`}
              />
              <span className="text-xs text-slate-600">{date.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &gt;60</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> &gt;30</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> low</span>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Moon, Star, Zap, Heart, Brain, Target, Clock, CheckCircle2, TrendingUp, Sun } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'nightly_debrief_log'

type ShowUpRating = 'yes' | 'mostly' | 'partially' | 'no'
type MindState = 'peaceful' | 'anxious' | 'excited' | 'tired' | 'reflective' | 'content'

interface NightlyDebriefEntry {
  date: string
  overallDayRating: number
  energyEndOfDay: number
  biggestWin: string
  biggestChallenge: string
  unexpectedLesson: string
  momentOfGratitude: string
  didYouShowUp: ShowUpRating
  tomorrowPriority: string
  mindStateAtBedtime: MindState
  bedtimeGoal: string
  debriefScore: number
  savedAt: string
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function loadLog(): NightlyDebriefEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function getDotColor(score: number): string {
  if (score > 60) return 'bg-emerald-500'
  if (score > 30) return 'bg-amber-400'
  return 'bg-red-500'
}

function computeStreak(log: NightlyDebriefEntry[]): number {
  if (log.length === 0) return 0
  const sorted = [...log].sort((a, b) => (a.date < b.date ? 1 : -1))
  let streak = 0
  const today = getToday()
  let expected = today
  for (const entry of sorted) {
    if (entry.date === expected) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().split('T')[0]
    } else {
      break
    }
  }
  return streak
}

const SHOW_UP_OPTIONS: { value: ShowUpRating; label: string; color: string }[] = [
  { value: 'yes', label: 'Yes — fully showed up', color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { value: 'mostly', label: 'Mostly showed up', color: 'border-violet-500 bg-violet-500/20 text-violet-300' },
  { value: 'partially', label: 'Partially showed up', color: 'border-amber-500 bg-amber-500/20 text-amber-300' },
  { value: 'no', label: 'Fell short today', color: 'border-red-500 bg-red-500/20 text-red-300' },
]

const MIND_STATES: { value: MindState; label: string; emoji: string }[] = [
  { value: 'peaceful', label: 'Peaceful', emoji: '🌙' },
  { value: 'content', label: 'Content', emoji: '😌' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔' },
  { value: 'excited', label: 'Excited', emoji: '✨' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
]

export default function NightlyDebrief() {
  const { toastSuccess } = useToast()
  const today = getToday()
  const [log, setLog] = useState<NightlyDebriefEntry[]>(loadLog)

  const [overallDayRating, setOverallDayRating] = useState(7)
  const [energyEndOfDay, setEnergyEndOfDay] = useState(5)
  const [biggestWin, setBiggestWin] = useState('')
  const [biggestChallenge, setBiggestChallenge] = useState('')
  const [unexpectedLesson, setUnexpectedLesson] = useState('')
  const [momentOfGratitude, setMomentOfGratitude] = useState('')
  const [didYouShowUp, setDidYouShowUp] = useState<ShowUpRating>('mostly')
  const [tomorrowPriority, setTomorrowPriority] = useState('')
  const [mindStateAtBedtime, setMindStateAtBedtime] = useState<MindState>('reflective')
  const [bedtimeGoal, setBedtimeGoal] = useState('22:30')

  const debriefScore = overallDayRating * 10
  const streak = computeStreak(log)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const entry = log.find(e => e.date === dateStr)
    return { date: dateStr, score: entry?.debriefScore ?? -1 }
  })

  function handleSave() {
    const entry: NightlyDebriefEntry = {
      date: today,
      overallDayRating,
      energyEndOfDay,
      biggestWin,
      biggestChallenge,
      unexpectedLesson,
      momentOfGratitude,
      didYouShowUp,
      tomorrowPriority,
      mindStateAtBedtime,
      bedtimeGoal,
      debriefScore,
      savedAt: new Date().toISOString(),
    }
    const updated = log.filter(e => e.date !== today)
    updated.push(entry)
    setLog(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
    toastSuccess('Nightly Debrief saved!', `Day score: ${debriefScore}/100`)
  }

  const scoreColor = debriefScore >= 70 ? 'text-emerald-400' : debriefScore >= 40 ? 'text-amber-400' : 'text-red-400'
  const scoreBorder = debriefScore >= 70 ? 'border-emerald-500/40' : debriefScore >= 40 ? 'border-amber-400/40' : 'border-red-500/40'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Moon className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Nightly Debrief
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          Close out the day with intention. <span className="text-violet-400">{today}</span>
        </p>
      </div>

      {/* Score + Streak */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`game-card border ${scoreBorder}`}>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Debrief Score</p>
          <p className={`text-4xl font-black ${scoreColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {debriefScore}
          </p>
          <p className="text-slate-500 text-xs mt-1">/ 100</p>
        </div>
        <div className="game-card border border-violet-500/30">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Logging Streak</p>
          <p className="text-4xl font-black text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {streak}
          </p>
          <p className="text-slate-500 text-xs mt-1">day{streak !== 1 ? 's' : ''} in a row</p>
        </div>
      </div>

      {/* Overall Day Rating */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Overall Day Rating</span>
          <span className="ml-auto text-amber-400 font-bold text-xl" style={{ fontFamily: 'Orbitron, monospace' }}>{overallDayRating}/10</span>
        </div>
        <input
          type="range" min={1} max={10} value={overallDayRating}
          onChange={e => setOverallDayRating(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Rough day</span><span>Perfect day</span>
        </div>
      </div>

      {/* Energy End of Day */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Energy End of Day</span>
          <span className="ml-auto text-violet-400 font-bold text-xl" style={{ fontFamily: 'Orbitron, monospace' }}>{energyEndOfDay}/10</span>
        </div>
        <input
          type="range" min={1} max={10} value={energyEndOfDay}
          onChange={e => setEnergyEndOfDay(Number(e.target.value))}
          className="w-full accent-violet-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Depleted</span><span>Still energized</span>
        </div>
      </div>

      {/* Did You Show Up */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Did You Show Up Today?</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SHOW_UP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDidYouShowUp(opt.value)}
              className={`text-sm py-2 px-3 rounded-lg border transition-all text-left ${
                didYouShowUp === opt.value ? opt.color : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Biggest Win */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Biggest Win Today</span>
        </div>
        <input
          type="text" className="game-input w-full"
          placeholder="What was your biggest win today?"
          value={biggestWin}
          onChange={e => setBiggestWin(e.target.value)}
        />
      </div>

      {/* Biggest Challenge */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-sm">Biggest Challenge</span>
        </div>
        <input
          type="text" className="game-input w-full"
          placeholder="What challenged you most today?"
          value={biggestChallenge}
          onChange={e => setBiggestChallenge(e.target.value)}
        />
      </div>

      {/* Unexpected Lesson */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-sm">Unexpected Lesson</span>
        </div>
        <input
          type="text" className="game-input w-full"
          placeholder="What did today teach you that you didn't expect?"
          value={unexpectedLesson}
          onChange={e => setUnexpectedLesson(e.target.value)}
        />
      </div>

      {/* Moment of Gratitude */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-sm">Moment of Gratitude</span>
        </div>
        <input
          type="text" className="game-input w-full"
          placeholder="One thing you're genuinely grateful for today..."
          value={momentOfGratitude}
          onChange={e => setMomentOfGratitude(e.target.value)}
        />
      </div>

      {/* Tomorrow Priority */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Tomorrow's #1 Priority</span>
        </div>
        <input
          type="text" className="game-input w-full"
          placeholder="What's the single most important thing tomorrow?"
          value={tomorrowPriority}
          onChange={e => setTomorrowPriority(e.target.value)}
        />
      </div>

      {/* Mind State at Bedtime */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm">Mind State at Bedtime</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MIND_STATES.map(ms => (
            <button
              key={ms.value}
              onClick={() => setMindStateAtBedtime(ms.value)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all ${
                mindStateAtBedtime === ms.value
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-xl">{ms.emoji}</span>
              <span className="text-xs">{ms.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bedtime Goal */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-sm">Bedtime Goal</span>
        </div>
        <input
          type="time"
          className="game-input"
          value={bedtimeGoal}
          onChange={e => setBedtimeGoal(e.target.value)}
        />
        <p className="text-xs text-slate-500 mt-2">Target time to be asleep by tonight</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all mb-6 flex items-center justify-center gap-2"
      >
        <Moon className="w-5 h-5" />
        Complete Nightly Debrief
      </button>

      {/* 7-Day Timeline */}
      <div className="game-card">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Last 7 Days</span>
        </div>
        <div className="flex items-end gap-2 justify-center">
          {last7.map(({ date, score: s }) => (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">{s >= 0 ? s : '—'}</span>
              <div
                className={`w-8 h-8 rounded-full ${s >= 0 ? getDotColor(s) : 'bg-slate-700'} transition-all flex items-center justify-center`}
                title={`${date}: ${s >= 0 ? `${s}/100` : 'No entry'}`}
              >
                {s >= 0 && <CheckCircle2 className="w-4 h-4 text-white/70" />}
              </div>
              <span className="text-xs text-slate-600">{date.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &gt;60</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> &gt;30</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700 inline-block" /> none</span>
        </div>
      </div>
    </div>
  )
}

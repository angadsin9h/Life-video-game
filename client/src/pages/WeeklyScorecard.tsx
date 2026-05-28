import { useEffect, useState } from 'react'
import axios from 'axios'
import { Trophy, TrendingUp, CheckCircle2, Flame, Target, Star, Zap, Clock } from 'lucide-react'

interface ScoreArea {
  key: string
  label: string
  emoji: string
  score: number
  details: string[]
  color: string
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function formatWeek(monday: string) {
  const start = new Date(monday + 'T12:00:00')
  const end = new Date(start); end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
}

export default function WeeklyScorecard() {
  const [scores, setScores] = useState<ScoreArea[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState(false)

  const monday = getMonday(new Date(Date.now() - weekOffset * 7 * 86400000))
  const isCurrentWeek = weekOffset === 0

  useEffect(() => {
    const end = new Date(monday + 'T12:00:00'); end.setDate(end.getDate() + 6)
    const endStr = end.toISOString().split('T')[0]
    const weekStart = monday

    Promise.all([
      axios.get('/api/logs').catch(() => ({ data: [] })),
      axios.get('/api/habits').catch(() => ({ data: [] })),
      axios.get('/api/timer/sessions?limit=200').catch(() => ({ data: [] })),
      axios.get('/api/mood?limit=30').catch(() => ({ data: [] })),
      axios.get('/api/workouts?limit=50').catch(() => ({ data: [] })),
      axios.get('/api/journal?limit=50').catch(() => ({ data: [] })),
      axios.get('/api/gratitude/history/recent').catch(() => ({ data: [] })),
    ]).then(([logs, habits, sessions, moods, workouts, journal, gratitude]) => {
      const allLogs: any[] = logs.data as any[]
      const weekLogs = allLogs.filter((l: any) => l.date >= weekStart && l.date <= endStr)
      const completedLogs = weekLogs.filter((l: any) => l.completed)
      const taskRate = weekLogs.length > 0 ? Math.round((completedLogs.length / weekLogs.length) * 100) : 0

      const habitList: any[] = habits.data as any[]
      const avgStreak = habitList.length > 0 ? Math.round(habitList.reduce((s: number, h: any) => s + (h.streak || 0), 0) / habitList.length) : 0
      const habitScore = Math.min(100, avgStreak * 10)

      const weekSessions = (sessions.data as any[]).filter((s: any) => (s.date || s.created_at?.split('T')[0]) >= weekStart && (s.date || s.created_at?.split('T')[0]) <= endStr)
      const focusMins = weekSessions.reduce((s: number, sess: any) => s + (sess.duration_minutes || sess.duration || 0), 0)
      const focusScore = Math.min(100, Math.round((focusMins / (5 * 90)) * 100))

      const weekMoods = (moods.data as any[]).filter((m: any) => m.date >= weekStart && m.date <= endStr)
      const avgMood = weekMoods.length > 0 ? weekMoods.reduce((s: number, m: any) => s + m.mood, 0) / weekMoods.length : 0
      const moodScore = Math.round((avgMood / 5) * 100)

      const weekWorkouts = (workouts.data as any[]).filter((w: any) => w.date >= weekStart && w.date <= endStr)
      const workoutScore = Math.min(100, weekWorkouts.length * 25)

      const weekJournal = (journal.data as any[]).filter((j: any) => j.date >= weekStart && j.date <= endStr)
      const journalScore = Math.min(100, weekJournal.length * 20)

      const weekGratitude = (gratitude.data as any[]).filter((g: any) => g.date >= weekStart && g.date <= endStr)
      const gratitudeScore = Math.min(100, weekGratitude.reduce((s: number, g: any) => s + g.count, 0) * 10)

      setScores([
        {
          key: 'tasks', label: 'Task Completion', emoji: '✅', score: taskRate, color: '#3b82f6',
          details: [`${completedLogs.length}/${weekLogs.length} tasks done`, `${taskRate}% completion rate`],
        },
        {
          key: 'habits', label: 'Habit Consistency', emoji: '🔄', score: habitScore, color: '#22c55e',
          details: [`${avgStreak}d avg streak`, `${habitList.length} habits tracked`],
        },
        {
          key: 'focus', label: 'Deep Focus', emoji: '⚡', score: focusScore, color: '#8b5cf6',
          details: [`${focusMins}m focused`, `${weekSessions.length} sessions`],
        },
        {
          key: 'mood', label: 'Mood & Energy', emoji: '😊', score: moodScore, color: '#ec4899',
          details: [`${avgMood.toFixed(1)}/5 avg mood`, `${weekMoods.length} check-ins`],
        },
        {
          key: 'fitness', label: 'Physical Health', emoji: '💪', score: workoutScore, color: '#f97316',
          details: [`${weekWorkouts.length} workouts`, `Goal: 4/week`],
        },
        {
          key: 'journal', label: 'Journaling', emoji: '📓', score: journalScore, color: '#eab308',
          details: [`${weekJournal.length} entries`, `Gratitude: ${weekGratitude.length}d`],
        },
      ])
      setLoading(false)
    })
  }, [monday])

  const overallScore = scores.length > 0 ? Math.round(scores.reduce((s, a) => s + a.score, 0) / scores.length) : 0
  const grade = overallScore >= 90 ? 'S' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 50 ? 'D' : 'F'
  const gradeColor = overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#eab308' : '#ef4444'

  const STORAGE_KEY = `weekly_scorecard_reflection_${monday}`
  const loadedReflection = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || '') : ''

  const saveReflectionFn = () => {
    localStorage.setItem(STORAGE_KEY, reflection)
    setSavedReflection(true)
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || ''
    setReflection(saved)
    setSavedReflection(!!saved)
  }, [monday])

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Weekly Scorecard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{formatWeek(monday)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors text-xs">←</button>
          <button onClick={() => setWeekOffset(0)} disabled={isCurrentWeek} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors text-xs disabled:opacity-40">Now</button>
          <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={isCurrentWeek} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors text-xs disabled:opacity-40">→</button>
        </div>
      </div>

      {/* Overall grade */}
      <div className="game-card p-6 flex items-center gap-6">
        <div className="text-center">
          <div className="text-6xl font-black" style={{ color: gradeColor }}>{grade}</div>
          <div className="text-xs text-slate-500 mt-1">Week Grade</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Overall Score</span>
            <span className="font-bold text-white">{overallScore}/100</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${overallScore}%`, background: `linear-gradient(to right, ${gradeColor}88, ${gradeColor})` }} />
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {overallScore >= 80 ? '🔥 Exceptional week! You\'re on fire.' :
             overallScore >= 60 ? '⚡ Solid effort. Keep building.' :
             overallScore >= 40 ? '📈 Room to grow. What will you improve?' :
             '💪 Tough week. Tomorrow is a new chance.'}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {scores.map(s => (
          <div key={s.key} className="game-card p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base">{s.emoji}</span>
              <span className="text-lg font-bold text-white">{s.score}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.score}%`, background: s.color }} />
            </div>
            <div className="text-xs font-semibold text-slate-300 mb-1">{s.label}</div>
            {s.details.map((d, i) => (
              <div key={i} className="text-[11px] text-slate-600">{d}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Strengths & Growth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-4 border border-green-500/20 bg-green-900/5">
          <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Star className="w-3.5 h-3.5" /> Strengths
          </h3>
          <div className="space-y-1">
            {scores.filter(s => s.score >= 70).sort((a, b) => b.score - a.score).slice(0, 3).map(s => (
              <div key={s.key} className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>{s.emoji}</span> {s.label} ({s.score})
              </div>
            ))}
            {scores.filter(s => s.score >= 70).length === 0 && <div className="text-xs text-slate-600">Keep pushing!</div>}
          </div>
        </div>
        <div className="game-card p-4 border border-yellow-500/20 bg-yellow-900/5">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Improve Next Week
          </h3>
          <div className="space-y-1">
            {scores.filter(s => s.score < 70).sort((a, b) => a.score - b.score).slice(0, 3).map(s => (
              <div key={s.key} className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>{s.emoji}</span> {s.label} ({s.score})
              </div>
            ))}
            {scores.filter(s => s.score < 70).length === 0 && <div className="text-xs text-slate-400">All areas strong! 🏆</div>}
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Weekly Reflection</h3>
        <div className="space-y-2 text-xs text-slate-500">
          <p>• What was my biggest win this week?</p>
          <p>• What did I learn?</p>
          <p>• What will I do differently next week?</p>
        </div>
        <textarea value={reflection} onChange={e => { setReflection(e.target.value); setSavedReflection(false) }}
          placeholder="Write your weekly reflection here..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm leading-relaxed placeholder-slate-700 focus:outline-none focus:border-yellow-500/30 resize-none h-32" />
        <button onClick={saveReflectionFn} disabled={!reflection.trim() || savedReflection}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${savedReflection ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-yellow-600 hover:bg-yellow-500 text-white'} disabled:opacity-50`}>
          {savedReflection ? '✓ Saved' : 'Save Reflection'}
        </button>
      </div>
    </div>
  )
}

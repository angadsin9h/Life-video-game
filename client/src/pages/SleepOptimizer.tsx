import { useEffect, useState } from 'react'
import axios from 'axios'
import { Moon, Sun, Clock, TrendingUp, AlertCircle, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SleepLog {
  date: string
  bedtime?: string
  wake_time?: string
  duration_minutes: number
  quality: number
  notes?: string
}

const SLEEP_TIPS = [
  { trigger: (avg: number) => avg < 360, tip: "You're sleeping under 6 hours. Prioritize sleep — it's non-negotiable for performance.", icon: '😴' },
  { trigger: (avg: number) => avg > 540, tip: "You're sleeping over 9 hours consistently. This may signal low energy or health issues worth checking.", icon: '🤔' },
  { trigger: (avg: number, qual: number) => qual < 3, tip: "Your sleep quality is low. Try: no screens 1h before bed, consistent schedule, cool dark room.", icon: '💡' },
  { trigger: (_: number, qual: number) => qual >= 4, tip: "Your sleep quality is great! Keep your current routine.", icon: '⭐' },
]

const IDEAL_SLEEP = 480 // 8 hours

export default function SleepOptimizer() {
  const { toastSuccess } = useToast()
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ bedtime: '23:00', wake_time: '07:00', quality: 3, notes: '' })
  const [todayLog, setTodayLog] = useState<SleepLog | null>(null)
  const [saved, setSaved] = useState(false)
  const [goals, setGoals] = useState({ bedtime: '23:00', wake_time: '07:00', targetQuality: 4 })

  useEffect(() => {
    const storedGoals = localStorage.getItem('sleep_goals')
    if (storedGoals) setGoals(JSON.parse(storedGoals))
    loadData()
  }, [])

  const loadData = async () => {
    const [r, todayR] = await Promise.all([
      axios.get('/api/sleep?limit=30'),
      axios.get(`/api/sleep/${new Date().toISOString().split('T')[0]}`),
    ])
    setLogs((r.data as SleepLog[]).reverse())
    if ((todayR.data as any)?.date) {
      setTodayLog(todayR.data as SleepLog)
      setSaved(true)
    }
    setLoading(false)
  }

  const save = async () => {
    await axios.post('/api/sleep', { date: today, ...form })
    setSaved(true)
    setTodayLog({ date: today, ...form, duration_minutes: calcDuration(form.bedtime, form.wake_time) })
    toastSuccess('Sleep logged!')
    loadData()
  }

  const calcDuration = (bed: string, wake: string) => {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let bedMins = bh * 60 + bm, wakeMins = wh * 60 + wm
    if (wakeMins <= bedMins) wakeMins += 24 * 60
    return wakeMins - bedMins
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60), m = mins % 60
    return `${h}h${m > 0 ? ` ${m}m` : ''}`
  }

  const recent = logs.slice(-14)
  const withData = recent.filter(l => l.duration_minutes > 0)
  const avgDuration = withData.length > 0 ? Math.round(withData.reduce((s, l) => s + l.duration_minutes, 0) / withData.length) : 0
  const avgQuality = withData.length > 0 ? +(withData.reduce((s, l) => s + l.quality, 0) / withData.length).toFixed(1) : 0
  const sleepDebt = withData.reduce((s, l) => s + Math.max(0, IDEAL_SLEEP - l.duration_minutes), 0)

  const goalDuration = calcDuration(goals.bedtime, goals.wake_time)
  const daysOnSchedule = withData.filter(l => l.duration_minutes >= goalDuration - 30).length
  const consistencyScore = withData.length > 0 ? Math.round((daysOnSchedule / withData.length) * 100) : 0

  const tips = SLEEP_TIPS.filter(t => t.trigger(avgDuration, avgQuality))

  // Bedtime consistency: stddev of bedtimes
  const bedtimeVariance = (() => {
    const logsWithBed = withData.filter(l => l.bedtime)
    if (logsWithBed.length < 2) return 0
    const mins = logsWithBed.map(l => {
      const [h, m] = (l.bedtime || '23:00').split(':').map(Number)
      return h * 60 + m
    })
    const avg = mins.reduce((s, m) => s + m, 0) / mins.length
    return Math.round(Math.sqrt(mins.reduce((s, m) => s + (m - avg) ** 2, 0) / mins.length))
  })()

  const qualityColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Moon className="w-7 h-7 text-blue-400" />
          Sleep Optimizer
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Analyze and improve your sleep</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg Duration', value: avgDuration > 0 ? formatDuration(avgDuration) : '—', icon: Clock, color: avgDuration >= 420 ? 'text-green-400' : 'text-yellow-400' },
          { label: 'Avg Quality', value: avgQuality > 0 ? `${avgQuality}/5` : '—', icon: TrendingUp, color: avgQuality >= 4 ? 'text-green-400' : avgQuality >= 3 ? 'text-yellow-400' : 'text-red-400' },
          { label: 'Sleep Debt', value: sleepDebt > 0 ? formatDuration(sleepDebt) : 'None', icon: AlertCircle, color: sleepDebt > 480 ? 'text-red-400' : sleepDebt > 0 ? 'text-yellow-400' : 'text-green-400' },
          { label: 'Consistency', value: `${consistencyScore}%`, icon: Check, color: consistencyScore >= 70 ? 'text-green-400' : 'text-yellow-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Log today's sleep */}
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-slate-300 flex items-center gap-2">
          <Sun className="w-4 h-4 text-yellow-400" />
          {saved ? 'Today\'s Sleep (logged)' : 'Log Last Night\'s Sleep'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Bedtime</label>
            <input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))}
              disabled={saved} className="game-input w-full" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Wake Time</label>
            <input type="time" value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))}
              disabled={saved} className="game-input w-full" />
          </div>
        </div>
        {form.bedtime && form.wake_time && (
          <div className="text-sm text-slate-400">
            Duration: <span className="text-white font-semibold">{formatDuration(calcDuration(form.bedtime, form.wake_time))}</span>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <button key={q} onClick={() => !saved && setForm(f => ({ ...f, quality: q }))}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: form.quality === q ? qualityColors[q - 1] + '33' : '#1e293b',
                  border: form.quality === q ? `1px solid ${qualityColors[q - 1]}` : '1px solid transparent',
                  color: form.quality === q ? qualityColors[q - 1] : '#475569',
                }}>
                {q}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
            <span>Terrible</span><span>Poor</span><span>OK</span><span>Good</span><span>Great</span>
          </div>
        </div>
        {!saved && (
          <button onClick={save} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Save Sleep Log
          </button>
        )}
        {saved && (
          <button onClick={() => setSaved(false)} className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
            Edit entry
          </button>
        )}
      </div>

      {/* 14-day chart */}
      {withData.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">14-Day Sleep Duration</h3>
          <div className="flex items-end gap-1 h-24">
            {recent.map((l, i) => {
              const pct = Math.min(1, l.duration_minutes / 600)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {l.date.slice(5)}: {l.duration_minutes > 0 ? formatDuration(l.duration_minutes) : '—'} Q:{l.quality}
                  </div>
                  <div className="w-full rounded-t-sm"
                    style={{
                      height: `${pct * 100}%`,
                      background: l.duration_minutes >= 420 ? qualityColors[Math.max(0, l.quality - 1)] : '#ef4444',
                      minHeight: l.duration_minutes > 0 ? '3px' : '1px',
                      opacity: l.duration_minutes > 0 ? 1 : 0.2,
                    }} />
                  <div className="text-[8px] text-slate-700">
                    {new Date(l.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Goal line */}
          <div className="text-xs text-slate-600 mt-1 text-center">Goal: {formatDuration(IDEAL_SLEEP)}</div>
        </div>
      )}

      {/* Bedtime consistency */}
      {bedtimeVariance > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Bedtime Consistency</h3>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${bedtimeVariance <= 20 ? 'text-green-400' : bedtimeVariance <= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
              ±{bedtimeVariance}m
            </div>
            <div className="text-sm text-slate-400">
              {bedtimeVariance <= 20 ? 'Excellent! Very consistent bedtime.' :
               bedtimeVariance <= 45 ? 'OK — try to sleep within 30 min of the same time.' :
               'High variability. Irregular sleep hurts quality and recovery.'}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div className="game-card p-4 border border-blue-500/20 bg-blue-900/5">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Sleep Insights
          </h3>
          <div className="space-y-3">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lg flex-shrink-0">{t.icon}</span>
                <p className="text-slate-400">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep goal settings */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Sleep Goals</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Bedtime</label>
            <input type="time" value={goals.bedtime}
              onChange={e => { const g = { ...goals, bedtime: e.target.value }; setGoals(g); localStorage.setItem('sleep_goals', JSON.stringify(g)) }}
              className="game-input w-full" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Wake Time</label>
            <input type="time" value={goals.wake_time}
              onChange={e => { const g = { ...goals, wake_time: e.target.value }; setGoals(g); localStorage.setItem('sleep_goals', JSON.stringify(g)) }}
              className="game-input w-full" />
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Target duration: <span className="text-white font-semibold">{formatDuration(goalDuration)}</span>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Moon, Sun, Star, Trash2, TrendingUp } from 'lucide-react'

interface SleepLog {
  id: number
  date: string
  bedtime: string | null
  wake_time: string | null
  duration_minutes: number
  quality: number
  notes: string
}

interface WeekStats {
  days: SleepLog[]
  avgDuration: number
  avgQuality: number
}

const QUALITY_LABELS = ['', '😫 Terrible', '😴 Poor', '😐 Fair', '🙂 Good', '😄 Great']
const QUALITY_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-cyan-400']

function fmtDuration(mins: number): string {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function sleepScore(mins: number, quality: number): number {
  const idealMins = 8 * 60
  const durationScore = Math.max(0, 100 - Math.abs(mins - idealMins) / idealMins * 100)
  const qualityScore = quality > 0 ? (quality / 5) * 100 : 50
  return Math.round(durationScore * 0.6 + qualityScore * 0.4)
}

function scoreColor(s: number): string {
  if (s >= 80) return 'text-green-400'
  if (s >= 60) return 'text-yellow-400'
  if (s >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export default function SleepTracker() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [entry, setEntry] = useState<SleepLog | null>(null)
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [bedtime, setBedtime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(0)
  const [notes, setNotes] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [entryRes, statsRes] = await Promise.all([
        axios.get<SleepLog | null>(`/api/sleep/${date}`),
        axios.get<WeekStats>('/api/sleep/stats/week'),
      ])
      const e = entryRes.data
      if (e) {
        setBedtime(e.bedtime || '23:00')
        setWakeTime(e.wake_time || '07:00')
        setQuality(e.quality)
        setNotes(e.notes || '')
      } else {
        setBedtime('23:00')
        setWakeTime('07:00')
        setQuality(0)
        setNotes('')
      }
      setEntry(e)
      setWeekStats(statsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [date])

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.post<SleepLog>('/api/sleep', { date, bedtime, wake_time: wakeTime, quality, notes })
      setEntry(res.data)
      const statsRes = await axios.get<WeekStats>('/api/sleep/stats/week')
      setWeekStats(statsRes.data)
    } finally {
      setSaving(false) }
  }

  const remove = async () => {
    await axios.delete(`/api/sleep/${date}`)
    setEntry(null)
    setBedtime('23:00')
    setWakeTime('07:00')
    setQuality(0)
    setNotes('')
    const statsRes = await axios.get<WeekStats>('/api/sleep/stats/week')
    setWeekStats(statsRes.data)
  }

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const calcPreview = (): number => {
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let bed = bh * 60 + bm
    let wake = wh * 60 + wm
    if (wake <= bed) wake += 24 * 60
    return wake - bed
  }
  const previewMins = calcPreview()

  const maxBarMins = 10 * 60

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Moon className="w-8 h-8 text-indigo-400" />
          Sleep Tracker
        </h1>
        <p className="text-slate-400 mt-1">Track your sleep to optimize recovery and performance</p>
      </div>

      {/* Week overview */}
      {weekStats && (
        <div className="game-card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            7-Day Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {fmtDuration(weekStats.avgDuration)}
              </div>
              <div className="text-xs text-slate-500">Avg Duration</div>
              <div className={`text-xs mt-0.5 ${weekStats.avgDuration >= 7 * 60 ? 'text-green-400' : 'text-orange-400'}`}>
                {weekStats.avgDuration >= 8 * 60 ? 'Optimal' : weekStats.avgDuration >= 7 * 60 ? 'Good' : 'Need more sleep'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {weekStats.avgQuality > 0 ? weekStats.avgQuality.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-slate-500">Avg Quality / 5</div>
              <div className={`text-xs mt-0.5 ${weekStats.avgQuality >= 4 ? 'text-green-400' : weekStats.avgQuality >= 3 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {weekStats.avgQuality >= 4 ? 'Excellent' : weekStats.avgQuality >= 3 ? 'Decent' : weekStats.avgQuality > 0 ? 'Needs work' : 'No data'}
              </div>
            </div>
          </div>

          {/* Bar chart for the week */}
          <div className="flex items-end gap-1.5 h-16">
            {weekStats.days.map(day => {
              const pct = day.duration_minutes / maxBarMins
              const isToday = day.date === today
              const isSelected = day.date === date
              const score = day.duration_minutes > 0 ? sleepScore(day.duration_minutes, day.quality) : 0
              return (
                <button
                  key={day.date}
                  onClick={() => setDate(day.date)}
                  className="flex-1 flex flex-col items-center gap-1 group"
                  title={`${day.date}: ${fmtDuration(day.duration_minutes)}`}
                >
                  <div className="w-full rounded-t relative" style={{ height: `${Math.max(pct * 52, day.duration_minutes > 0 ? 4 : 2)}px` }}>
                    <div
                      className={`w-full h-full rounded-t transition-all ${
                        isSelected ? 'bg-indigo-400' : score >= 80 ? 'bg-green-500/60' : score >= 60 ? 'bg-yellow-500/60' : day.duration_minutes > 0 ? 'bg-orange-500/60' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <div className={`text-xs ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Date navigator */}
      <div className="game-card p-4 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          ←
        </button>
        <div className="text-center">
          <div className={`font-semibold ${date === today ? 'text-indigo-400' : 'text-slate-200'}`}>
            {date === today ? 'Last Night' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          {date !== today && <div className="text-xs text-slate-600">{date}</div>}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={date >= today}
          className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
        >
          →
        </button>
      </div>

      {/* Log form */}
      <div className="game-card p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Bedtime
            </label>
            <input
              type="time"
              value={bedtime}
              onChange={e => setBedtime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Wake time
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Duration preview */}
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
          <span className="text-xs text-slate-500">Duration</span>
          <span className={`text-lg font-bold ${previewMins >= 7 * 60 ? 'text-green-400' : previewMins >= 6 * 60 ? 'text-yellow-400' : 'text-red-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {fmtDuration(previewMins)}
          </span>
          <span className="text-xs text-slate-500">
            {previewMins >= 8 * 60 ? '😄 Optimal' : previewMins >= 7 * 60 ? '🙂 Good' : previewMins >= 6 * 60 ? '😐 Short' : '😫 Too short'}
          </span>
        </div>

        {/* Quality rating */}
        <div>
          <label className="block text-xs text-slate-500 mb-2">Sleep Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <button
                key={q}
                onClick={() => setQuality(quality === q ? 0 : q)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
                  quality === q ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Star className={`w-4 h-4 ${q <= quality ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                <span className="text-xs text-slate-500">{q}</span>
              </button>
            ))}
          </div>
          {quality > 0 && (
            <div className={`text-xs mt-1.5 text-center ${QUALITY_COLORS[quality]}`}>{QUALITY_LABELS[quality]}</div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Dreams, disturbances, how you felt…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Sleep score preview */}
        {previewMins > 0 && quality > 0 && (
          <div className="flex items-center justify-between p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-lg">
            <span className="text-xs text-slate-400">Sleep Score</span>
            <span className={`text-xl font-bold ${scoreColor(sleepScore(previewMins, quality))}`}
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {sleepScore(previewMins, quality)}
            </span>
            <span className="text-xs text-slate-500">/100</span>
          </div>
        )}

        <div className="flex gap-2">
          {entry && (
            <button onClick={remove} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : entry ? 'Update' : 'Log Sleep'}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="game-card p-4 border border-indigo-500/20">
        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Sleep Optimization Tips</h4>
        <div className="space-y-1 text-xs text-slate-500">
          {[
            'Aim for 7–9 hours consistently',
            'Keep the same bedtime and wake time even on weekends',
            'Avoid screens 1 hour before bed',
            'Keep your room cool (65–68°F / 18–20°C)',
            'No caffeine after 2pm for most people',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-indigo-500 flex-shrink-0">→</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Sparkles, Calendar, TrendingUp, Heart } from 'lucide-react'

interface GratitudeDay {
  date: string
  count: number
  texts: string
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export default function GratitudeAnalytics() {
  const [history, setHistory] = useState<GratitudeDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/gratitude/history/recent').then(r => {
      setHistory(r.data as GratitudeDay[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const totalEntries = history.reduce((s, d) => s + d.count, 0)
  const daysLogged = history.length
  const avgPerDay = daysLogged > 0 ? (totalEntries / daysLogged).toFixed(1) : '0'

  // Word frequency from all texts
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'in', 'on', 'at', 'to', 'of', 'my', 'i', 'am', 'is', 'are', 'was', 'be', 'have', 'had', 'that', 'this', 'it', 'with', 'so', 'me', 'we', 'our', 'by', 'as', 'how', 'can', 'all', 'from', 'very'])
  const wordFreq: Record<string, number> = {}
  for (const d of history) {
    const words = (d.texts || '').toLowerCase().split(/[\s,.|!?;:'"]+/).filter(w => w.length > 3 && !stopWords.has(w))
    for (const w of words) wordFreq[w] = (wordFreq[w] || 0) + 1
  }
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const maxWordFreq = topWords[0]?.[1] || 1

  // 12-week heatmap
  const today = new Date()
  const heatmapDays: { date: string; count: number }[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    const entry = history.find(h => h.date === date)
    heatmapDays.push({ date, count: entry?.count || 0 })
  }
  // pad to start of week
  const firstDow = new Date(heatmapDays[0].date + 'T12:00:00').getDay()
  const padded: ({ date: string; count: number } | null)[] = [...Array(firstDow).fill(null), ...heatmapDays]
  const weeks: ({ date: string; count: number } | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  // Streak
  let streak = 0
  const dateSet = new Set(history.map(d => d.date))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dateSet.has(d.toISOString().split('T')[0])) streak++
    else if (i > 0) break
  }

  // Monthly consistency (last 6 months)
  const monthlyData: { label: string; days: number; totalDays: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en', { month: 'short' })
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const days = history.filter(h => h.date.startsWith(key)).length
    monthlyData.push({ label, days, totalDays: daysInMonth })
  }

  // Recent entries
  const recent = history.slice(0, 7)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sparkles className="w-7 h-7 text-yellow-400" />
          Gratitude Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Patterns in your gratitude practice</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Entries', value: totalEntries, icon: Heart, color: 'text-pink-400' },
          { label: 'Days Logged', value: daysLogged, icon: Calendar, color: 'text-yellow-400' },
          { label: 'Avg / Day', value: avgPerDay, icon: TrendingUp, color: 'text-teal-400' },
          { label: 'Streak', value: `${streak}d`, icon: Sparkles, color: 'text-violet-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      {history.length > 0 && (
        <div className="game-card p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">12 Weeks</h3>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div key={di} className="w-[13px] h-[13px] rounded-sm group relative"
                    style={{
                      background: day === null ? 'transparent' : day.count >= 3 ? '#eab308' : day.count >= 1 ? '#eab30888' : '#1e293b',
                      opacity: day === null ? 0 : 1,
                    }}>
                    {day && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {day.date}: {day.count} {day.count === 1 ? 'entry' : 'entries'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly consistency */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Monthly Consistency</h3>
        <div className="flex items-end gap-2 h-20">
          {monthlyData.map(m => {
            const pct = m.totalDays > 0 ? (m.days / m.totalDays) * 100 : 0
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-500">{m.days}d</div>
                <div className="w-full rounded-t-sm bg-yellow-500/70"
                  style={{ height: `${pct * 0.6}%`, minHeight: m.days > 0 ? '4px' : '2px', opacity: m.days > 0 ? 1 : 0.2 }} />
                <div className="text-[10px] text-slate-600">{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top words */}
      {topWords.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Most Common Themes</h3>
          <div className="flex flex-wrap gap-2">
            {topWords.map(([word, count]) => {
              const size = 10 + (count / maxWordFreq) * 14
              return (
                <span key={word} className="px-2 py-1 rounded-full bg-yellow-900/20 border border-yellow-500/20 text-yellow-400"
                  style={{ fontSize: `${size}px` }}>
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries preview */}
      {recent.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Entries</h3>
          <div className="space-y-3">
            {recent.map(d => (
              <div key={d.date} className="border-b border-slate-800 pb-2 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">{d.date}</span>
                  <span className="text-xs text-slate-600">{d.count} {d.count === 1 ? 'entry' : 'entries'}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{d.texts?.split('||').join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No gratitude entries yet. Start in the Gratitude page.</p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Apple, TrendingUp, Calendar, Target, Flame } from 'lucide-react'

interface NutritionEntry {
  id: number
  date: string
  meal_type: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  notes?: string
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#f97316',
  lunch: '#22c55e',
  dinner: '#3b82f6',
  snack: '#8b5cf6',
}

export default function NutritionAnalytics() {
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    const requests = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      requests.push(axios.get(`/api/nutrition/${dateStr}`).then(r => r.data as NutritionEntry[]).catch(() => []))
    }
    Promise.all(requests).then(results => {
      setEntries(results.flat())
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (period === 'month') {
      const requests = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        requests.push(axios.get(`/api/nutrition/${dateStr}`).then(r => r.data as NutritionEntry[]).catch(() => []))
      }
      Promise.all(requests).then(results => {
        setEntries(results.flat())
      })
    }
  }, [period])

  const days: Record<string, NutritionEntry[]> = {}
  for (const e of entries) {
    if (!days[e.date]) days[e.date] = []
    days[e.date].push(e)
  }
  const dayList = Object.entries(days).sort(([a], [b]) => a.localeCompare(b))

  const totalCalories = entries.reduce((s, e) => s + (e.calories || 0), 0)
  const totalProtein = entries.reduce((s, e) => s + (e.protein || 0), 0)
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs || 0), 0)
  const totalFat = entries.reduce((s, e) => s + (e.fat || 0), 0)
  const daysWithData = Object.keys(days).length
  const avgCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0
  const avgProtein = daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0

  const CALORIE_GOAL = 2000

  // Daily calories chart
  const allDays: { date: string; calories: number; protein: number }[] = []
  const numDays = period === 'week' ? 7 : 30
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayEntries = days[dateStr] || []
    allDays.push({
      date: dateStr,
      calories: dayEntries.reduce((s, e) => s + (e.calories || 0), 0),
      protein: dayEntries.reduce((s, e) => s + (e.protein || 0), 0),
    })
  }
  const maxCal = Math.max(...allDays.map(d => d.calories), CALORIE_GOAL)

  // Macro split
  const macroTotal = totalProtein * 4 + totalCarbs * 4 + totalFat * 9
  const proteinPct = macroTotal > 0 ? Math.round((totalProtein * 4 / macroTotal) * 100) : 0
  const carbsPct = macroTotal > 0 ? Math.round((totalCarbs * 4 / macroTotal) * 100) : 0
  const fatPct = macroTotal > 0 ? Math.round((totalFat * 9 / macroTotal) * 100) : 0

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Nutrition Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Macro & calorie trends</p>
        </div>
        <div className="flex gap-1">
          {(['week', 'month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${period === p ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {p === 'week' ? '7D' : '30D'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg Calories', value: `${avgCalories}`, icon: Flame, color: 'text-orange-400', sub: `goal: ${CALORIE_GOAL}` },
          { label: 'Avg Protein', value: `${avgProtein}g`, icon: Target, color: 'text-blue-400', sub: 'per day' },
          { label: 'Days Logged', value: daysWithData, icon: Calendar, color: 'text-violet-400', sub: `of ${numDays}` },
          { label: 'Total Entries', value: entries.length, icon: Apple, color: 'text-green-400', sub: 'meals logged' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-xl font-bold ${t.color}`}>{t.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Calorie chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Daily Calories
        </h3>
        <div className="flex items-end gap-1 h-28">
          {allDays.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                {d.date}: {d.calories} kcal
              </div>
              <div className="w-full rounded-t-sm"
                style={{
                  height: `${(d.calories / maxCal) * 100}%`,
                  background: d.calories > CALORIE_GOAL * 1.2 ? '#ef4444' : d.calories > CALORIE_GOAL * 0.8 ? '#22c55e' : d.calories > 0 ? '#eab308' : 'transparent',
                  minHeight: d.calories > 0 ? '2px' : 0,
                }} />
            </div>
          ))}
        </div>
        {/* Goal line indicator */}
        <div className="flex justify-between text-xs text-slate-600 mt-2">
          <span>— goal: {CALORIE_GOAL} kcal</span>
          <div className="flex gap-3">
            <span className="text-green-400">■ on track</span>
            <span className="text-yellow-400">■ under</span>
            <span className="text-red-400">■ over</span>
          </div>
        </div>
      </div>

      {/* Macro split */}
      {macroTotal > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Macro Split</h3>
          <div className="space-y-3">
            {[
              { label: 'Protein', pct: proteinPct, grams: Math.round(totalProtein / daysWithData), color: '#3b82f6', target: '25-35%' },
              { label: 'Carbs', pct: carbsPct, grams: Math.round(totalCarbs / daysWithData), color: '#22c55e', target: '45-65%' },
              { label: 'Fat', pct: fatPct, grams: Math.round(totalFat / daysWithData), color: '#f97316', target: '20-35%' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{m.label}</span>
                  <span className="text-slate-400">{m.pct}% · {m.grams}g/day <span className="text-slate-600">({m.target})</span></span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per meal type */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Average by Meal</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
              const mealEntries = entries.filter(e => e.meal_type === meal)
              const mealDays = new Set(mealEntries.map(e => e.date)).size
              const avg = mealDays > 0 ? Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0) / mealDays) : 0
              return (
                <div key={meal} className="text-center p-3 bg-slate-800 rounded-lg">
                  <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: MEAL_COLORS[meal] }} />
                  <div className="text-xs text-slate-400 capitalize mb-1">{meal}</div>
                  <div className="text-base font-bold text-white">{avg > 0 ? `${avg}` : '—'}</div>
                  <div className="text-xs text-slate-600">kcal</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Apple className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No nutrition data yet. Start logging in the Nutrition page.</p>
        </div>
      )}
    </div>
  )
}

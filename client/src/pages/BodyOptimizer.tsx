import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  Activity, Flame, Heart, Sun, Moon, Zap, TrendingUp, BarChart3,
  CheckCircle2, Plus, Trophy, Star,
} from 'lucide-react'

const STORAGE_KEY = 'body_optimizer_log'

const WORKOUT_TYPES = ['None', 'Walk', 'Run', 'Strength', 'HIIT', 'Yoga', 'Swim', 'Cycle', 'Sport', 'Other']
const ALCOHOL_OPTIONS = ['0', '1', '2', '3', '4+']
const CAFFEINE_OPTIONS = ['None', 'Before noon', 'After noon', 'After 3pm', 'After 6pm']
const BODY_FEEL_OPTIONS = ['Amazing', 'Great', 'Good', 'Okay', 'Tired', 'Sore', 'Sick', 'Heavy']

interface BodyEntry {
  id: string
  date: string
  hydration: number
  steps: number
  activeMinutes: number
  workoutType: string
  workoutIntensity: number
  sleepHours: number
  sleepQuality: number
  nutritionRating: number
  alcoholUnits: string
  caffeineTime: string
  sunlightMinutes: number
  coldExposure: boolean
  bodyFeel: string
  bodyScore: number
}

interface FormState {
  hydration: number
  steps: number
  activeMinutes: number
  workoutType: string
  workoutIntensity: number
  sleepHours: number
  sleepQuality: number
  nutritionRating: number
  alcoholUnits: string
  caffeineTime: string
  sunlightMinutes: number
  coldExposure: boolean
  bodyFeel: string
}

const EMPTY_FORM: FormState = {
  hydration: 2,
  steps: 0,
  activeMinutes: 0,
  workoutType: 'None',
  workoutIntensity: 5,
  sleepHours: 7.5,
  sleepQuality: 7,
  nutritionRating: 7,
  alcoholUnits: '0',
  caffeineTime: 'None',
  sunlightMinutes: 20,
  coldExposure: false,
  bodyFeel: 'Good',
}

function computeBodyScore(f: FormState): number {
  const score = (f.hydration * 2.5 + f.sleepQuality + f.workoutIntensity + f.nutritionRating) / 4 * 10
  return Math.round(Math.min(100, score))
}

function scoreColor(s: number): string {
  if (s >= 80) return 'text-green-400'
  if (s >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function bodyFeelColor(feel: string): string {
  const map: Record<string, string> = {
    'Amazing': 'text-green-400',
    'Great': 'text-green-300',
    'Good': 'text-blue-300',
    'Okay': 'text-slate-300',
    'Tired': 'text-amber-400',
    'Sore': 'text-orange-400',
    'Sick': 'text-red-400',
    'Heavy': 'text-red-300',
  }
  return map[feel] ?? 'text-slate-300'
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export default function BodyOptimizer() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BodyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  const saveEntries = (updated: BodyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSubmit = () => {
    const today = todayStr()
    const entry: BodyEntry = {
      id: Date.now().toString(),
      date: today,
      ...form,
      bodyScore: computeBodyScore(form),
    }
    const filtered = entries.filter(e => e.date !== today)
    saveEntries([entry, ...filtered])
    toastSuccess('Body data logged! Keep optimizing.')
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  // Streak
  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse()
  let streak = 0
  const today = todayStr()
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const exp = expected.toISOString().split('T')[0]
    if (sortedDates[i] === exp || (i === 0 && sortedDates[0] === today)) {
      streak++
    } else {
      break
    }
  }

  // 7-day trend
  const last7: BodyEntry[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const found = entries.find(e => e.date === key)
    if (found) last7.push(found)
    else last7.push({ id: '', date: key, bodyScore: 0 } as BodyEntry)
  }

  // Weekly averages
  const week7 = entries.filter(e => {
    const d = new Date(e.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  })

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0
  const avgHydration = avg(week7.map(e => e.hydration))
  const avgSleep = avg(week7.map(e => e.sleepHours))
  const avgSteps = Math.round(avg(week7.map(e => e.steps)))
  const avgScore = avg(week7.map(e => e.bodyScore))

  const maxScore = Math.max(...last7.map(e => e.bodyScore), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-8 h-8 text-green-400" />
            Body Optimizer
          </h1>
          <p className="text-slate-400 mt-1">Comprehensive daily body optimization tracker.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Today
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-400 mt-1">Body Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgScore}</div>
          <div className="text-xs text-slate-400 mt-1">Avg Score (7d)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgHydration}L</div>
          <div className="text-xs text-slate-400 mt-1">Avg Hydration</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgSleep}h</div>
          <div className="text-xs text-slate-400 mt-1">Avg Sleep</div>
        </div>
      </div>

      {/* 7-day trend */}
      <div className="game-card p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-400" />
          7-Day Body Score Trend
        </h2>
        <div className="flex items-end gap-2 h-24">
          {last7.map((e, i) => {
            const pct = maxScore > 0 ? (e.bodyScore / maxScore) * 100 : 0
            const day = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                  <div
                    className={`w-full rounded-t-sm transition-all ${e.bodyScore > 0 ? 'bg-green-600' : 'bg-slate-800'}`}
                    style={{ height: `${Math.max(4, pct * 0.8)}%` }}
                    title={`Score: ${e.bodyScore}`}
                  />
                </div>
                <div className="text-xs text-slate-500">{day}</div>
                {e.bodyScore > 0 && <div className="text-xs text-green-400 font-semibold">{e.bodyScore}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly metric averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-pink-400">{avgSteps.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Avg Steps</div>
        </div>
        <div className="game-card p-3 text-center">
          <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-400">{avg(week7.map(e => e.sunlightMinutes))}min</div>
          <div className="text-xs text-slate-500">Avg Sunlight</div>
        </div>
        <div className="game-card p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-orange-400">{avg(week7.map(e => e.workoutIntensity))}</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-400">{avg(week7.map(e => e.nutritionRating))}</div>
          <div className="text-xs text-slate-500">Avg Nutrition</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-5 border border-green-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Log Today — {todayStr()}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <Trophy className="w-4 h-4 opacity-0" />
            </button>
          </div>

          {/* Hydration */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Hydration: {form.hydration}L</label>
            <input type="range" min={0} max={4} step={0.5} value={form.hydration}
              onChange={e => setForm(f => ({ ...f, hydration: Number(e.target.value) }))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Daily Steps</label>
              <input type="number" min={0} max={100000}
                className="game-input w-full"
                placeholder="e.g. 8000"
                value={form.steps}
                onChange={e => setForm(f => ({ ...f, steps: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Active Minutes</label>
              <input type="number" min={0} max={300}
                className="game-input w-full"
                placeholder="e.g. 45"
                value={form.activeMinutes}
                onChange={e => setForm(f => ({ ...f, activeMinutes: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Workout Type</label>
              <select className="game-input w-full"
                value={form.workoutType}
                onChange={e => setForm(f => ({ ...f, workoutType: e.target.value }))}
              >
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Workout Intensity: {form.workoutIntensity}/10</label>
              <input type="range" min={1} max={10} value={form.workoutIntensity}
                onChange={e => setForm(f => ({ ...f, workoutIntensity: Number(e.target.value) }))}
                className="w-full accent-orange-500 mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sleep Hours: {form.sleepHours}h</label>
              <input type="range" min={3} max={12} step={0.5} value={form.sleepHours}
                onChange={e => setForm(f => ({ ...f, sleepHours: Number(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sleep Quality: {form.sleepQuality}/10</label>
              <input type="range" min={1} max={10} value={form.sleepQuality}
                onChange={e => setForm(f => ({ ...f, sleepQuality: Number(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nutrition Rating: {form.nutritionRating}/10</label>
            <input type="range" min={1} max={10} value={form.nutritionRating}
              onChange={e => setForm(f => ({ ...f, nutritionRating: Number(e.target.value) }))}
              className="w-full accent-green-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Alcohol Units</label>
              <select className="game-input w-full"
                value={form.alcoholUnits}
                onChange={e => setForm(f => ({ ...f, alcoholUnits: e.target.value }))}
              >
                {ALCOHOL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Last Caffeine</label>
              <select className="game-input w-full"
                value={form.caffeineTime}
                onChange={e => setForm(f => ({ ...f, caffeineTime: e.target.value }))}
              >
                {CAFFEINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sunlight: {form.sunlightMinutes} min</label>
              <input type="range" min={0} max={60} step={5} value={form.sunlightMinutes}
                onChange={e => setForm(f => ({ ...f, sunlightMinutes: Number(e.target.value) }))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">How Does Your Body Feel?</label>
              <select className="game-input w-full"
                value={form.bodyFeel}
                onChange={e => setForm(f => ({ ...f, bodyFeel: e.target.value }))}
              >
                {BODY_FEEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, coldExposure: !f.coldExposure }))}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  form.coldExposure ? 'bg-cyan-600 border-cyan-500' : 'border-slate-600 bg-slate-800'
                }`}
              >
                {form.coldExposure && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <span className="text-sm text-slate-300">Cold Exposure (cold shower / ice bath)</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Body Score: <span className={`font-bold text-lg ${scoreColor(computeBodyScore(form))}`}>{computeBodyScore(form)}</span>
              <span className="text-xs text-slate-500">/100</span>
              <span className={`ml-3 text-sm font-semibold ${bodyFeelColor(form.bodyFeel)}`}>{form.bodyFeel}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Recent Entries
          </h2>
          <div className="space-y-2">
            {entries.slice(0, 5).map(e => (
              <div key={e.id} className="game-card p-3 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className={`text-xl font-bold ${scoreColor(e.bodyScore)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {e.bodyScore}
                  </div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-sm font-semibold ${bodyFeelColor(e.bodyFeel)}`}>{e.bodyFeel}</span>
                    <span className="text-xs text-slate-500">Sleep: {e.sleepHours}h ({e.sleepQuality}/10)</span>
                    <span className="text-xs text-slate-500">Steps: {e.steps.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">{e.workoutType !== 'None' ? e.workoutType : 'No workout'}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0">{e.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="game-card p-4 border border-green-500/20 bg-green-900/10">
        <div className="flex items-start gap-3">
          <Moon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">Body Optimizer Principle</p>
            <p className="text-xs text-slate-400 mt-1">
              Sleep, hydration, movement, and nutrition — master these four and your body becomes your greatest asset.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

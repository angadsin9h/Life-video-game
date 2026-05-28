import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Heart, TrendingUp, Plus, Target, BarChart3, Zap, Calendar, Check,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthLog {
  date: string
  weightLbs: number | null
  weightKg: number | null
  restingHR: number | null
  hrv: number | null
  systolic: number | null
  diastolic: number | null
  steps: number | null
  activeMinutes: number | null
  caloriesBurned: number | null
}

interface HealthSettings {
  heightCm: number | null
  weightUnit: 'lbs' | 'kg'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = (date: string) => `health_metrics_${date}`
const SETTINGS_KEY = 'health_metrics_settings'

const today = () => new Date().toISOString().split('T')[0]

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function loadLog(date: string): HealthLog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(date))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLog(log: HealthLog) {
  localStorage.setItem(STORAGE_KEY(log.date), JSON.stringify(log))
}

function loadSettings(): HealthSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { heightCm: null, weightUnit: 'lbs' }
  } catch {
    return { heightCm: null, weightUnit: 'lbs' }
  }
}

function saveSettings(s: HealthSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function calcBMI(heightCm: number, weightKg: number): number {
  const hm = heightCm / 100
  return Math.round((weightKg / (hm * hm)) * 10) / 10
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
  if (bmi < 25) return { label: 'Normal', color: 'text-green-400' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' }
  return { label: 'Obese', color: 'text-red-400' }
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (!nums.length) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────

function MiniBarChart({
  values,
  labels,
  color,
  unit,
}: {
  values: (number | null)[]
  labels: string[]
  color: string
  unit?: string
}) {
  const nums = values.filter((v): v is number => v !== null)
  const max = nums.length ? Math.max(...nums) : 1
  return (
    <div className="flex items-end gap-1 h-16">
      {values.map((v, i) => {
        const pct = v !== null && max > 0 ? (v / max) * 100 : 0
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <div
              title={v !== null ? `${v}${unit ?? ''}` : 'No data'}
              className="w-full rounded-t transition-all duration-500 relative group"
              style={{
                height: `${Math.max(pct, v !== null ? 4 : 0)}%`,
                backgroundColor: v !== null ? color : '#1e293b',
                minHeight: v !== null ? '4px' : '0',
              }}
            />
            <span className="text-xs text-slate-500 truncate" style={{ fontSize: '9px' }}>
              {labels[i]?.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: number | null
  unit: string
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <div className="game-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <div className={`text-2xl font-bold ${value !== null ? color : 'text-slate-600'}`}>
        {value !== null ? `${value}` : '—'}
        {value !== null && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function HealthMetrics() {
  const { toastSuccess } = useToast()
  const [selectedDate, setSelectedDate] = useState(today())
  const [settings, setSettings] = useState<HealthSettings>(loadSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weekLogs, setWeekLogs] = useState<(HealthLog | null)[]>([])
  const days = getLast7Days()

  // Form state
  const [weightInput, setWeightInput] = useState('')
  const [restingHR, setRestingHR] = useState('')
  const [hrv, setHrv] = useState('')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [steps, setSteps] = useState('')
  const [activeMinutes, setActiveMinutes] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')

  // Settings form
  const [heightInput, setHeightInput] = useState(settings.heightCm?.toString() ?? '')
  const [unitPref, setUnitPref] = useState<'lbs' | 'kg'>(settings.weightUnit)

  const loadDate = useCallback((date: string) => {
    const log = loadLog(date)
    if (log) {
      const w = settings.weightUnit === 'lbs' ? log.weightLbs : log.weightKg
      setWeightInput(w?.toString() ?? '')
      setRestingHR(log.restingHR?.toString() ?? '')
      setHrv(log.hrv?.toString() ?? '')
      setSystolic(log.systolic?.toString() ?? '')
      setDiastolic(log.diastolic?.toString() ?? '')
      setSteps(log.steps?.toString() ?? '')
      setActiveMinutes(log.activeMinutes?.toString() ?? '')
      setCaloriesBurned(log.caloriesBurned?.toString() ?? '')
    } else {
      setWeightInput('')
      setRestingHR('')
      setHrv('')
      setSystolic('')
      setDiastolic('')
      setSteps('')
      setActiveMinutes('')
      setCaloriesBurned('')
    }
  }, [settings.weightUnit])

  useEffect(() => {
    loadDate(selectedDate)
    setWeekLogs(days.map(d => loadLog(d)))
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setWeekLogs(days.map(d => loadLog(d)))
  }, [saved]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const weightVal = weightInput ? parseFloat(weightInput) : null
    const log: HealthLog = {
      date: selectedDate,
      weightLbs: settings.weightUnit === 'lbs' ? weightVal : (weightVal ? Math.round(weightVal * 2.20462 * 10) / 10 : null),
      weightKg: settings.weightUnit === 'kg' ? weightVal : (weightVal ? Math.round(weightVal / 2.20462 * 10) / 10 : null),
      restingHR: restingHR ? parseInt(restingHR) : null,
      hrv: hrv ? parseFloat(hrv) : null,
      systolic: systolic ? parseInt(systolic) : null,
      diastolic: diastolic ? parseInt(diastolic) : null,
      steps: steps ? parseInt(steps) : null,
      activeMinutes: activeMinutes ? parseInt(activeMinutes) : null,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : null,
    }
    saveLog(log)
    setSaved(s => !s)
    toastSuccess('Health data saved!', selectedDate)
  }

  const handleSaveSettings = () => {
    const s: HealthSettings = {
      heightCm: heightInput ? parseFloat(heightInput) : null,
      weightUnit: unitPref,
    }
    setSettings(s)
    saveSettings(s)
    setShowSettings(false)
    toastSuccess('Settings saved!')
    loadDate(selectedDate)
  }

  // 7-day data arrays
  const weightKgWeek = weekLogs.map(l => l?.weightKg ?? null)
  const hrWeek = weekLogs.map(l => l?.restingHR ?? null)
  const hrvWeek = weekLogs.map(l => l?.hrv ?? null)
  const stepsWeek = weekLogs.map(l => l?.steps ?? null)
  const activeWeek = weekLogs.map(l => l?.activeMinutes ?? null)
  const calWeek = weekLogs.map(l => l?.caloriesBurned ?? null)

  // Averages
  const avgWeight = avg(settings.weightUnit === 'lbs' ? weekLogs.map(l => l?.weightLbs ?? null) : weightKgWeek)
  const avgHR = avg(hrWeek)
  const avgHRV = avg(hrvWeek)
  const avgSteps = avg(stepsWeek)

  // Personal bests (across all stored data)
  const allLogs = days.map(d => loadLog(d)).filter((l): l is HealthLog => l !== null)
  const lowestHR = allLogs.map(l => l.restingHR).filter((v): v is number => v !== null)
  const highestHRV = allLogs.map(l => l.hrv).filter((v): v is number => v !== null)
  const highestSteps = allLogs.map(l => l.steps).filter((v): v is number => v !== null)

  const bestHR = lowestHR.length ? Math.min(...lowestHR) : null
  const bestHRV = highestHRV.length ? Math.max(...highestHRV) : null
  const bestSteps = highestSteps.length ? Math.max(...highestSteps) : null

  // BMI
  const todayLog = loadLog(today())
  const bmi =
    settings.heightCm && todayLog?.weightKg
      ? calcBMI(settings.heightCm, todayLog.weightKg)
      : null
  const bmiInfo = bmi ? bmiCategory(bmi) : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Health Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your body's daily data</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={selectedDate}
            max={today()}
            onChange={e => setSelectedDate(e.target.value)}
            className="game-input text-sm"
          />
          <button
            onClick={() => setShowSettings(s => !s)}
            className="game-btn-secondary text-sm px-3 py-2"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="game-card p-5 space-y-4 border-violet-500/30">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" /> Profile Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Height (cm)</label>
              <input
                type="number"
                value={heightInput}
                onChange={e => setHeightInput(e.target.value)}
                placeholder="e.g. 175"
                className="game-input w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Weight Unit</label>
              <div className="flex gap-2">
                {(['lbs', 'kg'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnitPref(u)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      unitPref === u
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleSaveSettings} className="game-btn-primary text-sm">
            Save Settings
          </button>
        </div>
      )}

      {/* Log Form */}
      <div className="game-card p-5 space-y-5">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Log for{' '}
          <span className="text-emerald-400">
            {selectedDate === today() ? 'Today' : selectedDate}
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Weight */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Weight ({settings.weightUnit})
            </label>
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder={`e.g. ${settings.weightUnit === 'lbs' ? '165' : '75'}`}
              className="game-input w-full"
            />
          </div>

          {/* Resting HR */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-400" /> Resting HR (bpm)
            </label>
            <input
              type="number"
              value={restingHR}
              onChange={e => setRestingHR(e.target.value)}
              placeholder="e.g. 62"
              className="game-input w-full"
            />
          </div>

          {/* HRV */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> HRV (ms)
            </label>
            <input
              type="number"
              step="0.1"
              value={hrv}
              onChange={e => setHrv(e.target.value)}
              placeholder="e.g. 45"
              className="game-input w-full"
            />
          </div>

          {/* Blood Pressure */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Blood Pressure (mmHg)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={systolic}
                onChange={e => setSystolic(e.target.value)}
                placeholder="Sys"
                className="game-input w-full"
              />
              <span className="text-slate-400 self-center">/</span>
              <input
                type="number"
                value={diastolic}
                onChange={e => setDiastolic(e.target.value)}
                placeholder="Dia"
                className="game-input w-full"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" /> Steps
            </label>
            <input
              type="number"
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder="e.g. 8500"
              className="game-input w-full"
            />
          </div>

          {/* Active Minutes */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" /> Active Minutes
            </label>
            <input
              type="number"
              value={activeMinutes}
              onChange={e => setActiveMinutes(e.target.value)}
              placeholder="e.g. 45"
              className="game-input w-full"
            />
          </div>

          {/* Calories Burned */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-purple-400" /> Calories Burned
            </label>
            <input
              type="number"
              value={caloriesBurned}
              onChange={e => setCaloriesBurned(e.target.value)}
              placeholder="e.g. 2200"
              className="game-input w-full"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="game-btn-primary flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Save Today's Metrics
        </button>
      </div>

      {/* 7-Day Averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Avg Weight"
          value={avgWeight}
          unit={settings.weightUnit}
          icon={Activity}
          color="text-emerald-400"
          sub="7-day avg"
        />
        <StatCard
          label="Avg Resting HR"
          value={avgHR}
          unit="bpm"
          icon={Heart}
          color="text-red-400"
          sub="7-day avg"
        />
        <StatCard
          label="Avg HRV"
          value={avgHRV}
          unit="ms"
          icon={Zap}
          color="text-yellow-400"
          sub="7-day avg"
        />
        <StatCard
          label="Avg Steps"
          value={avgSteps}
          unit=""
          icon={TrendingUp}
          color="text-blue-400"
          sub="7-day avg"
        />
      </div>

      {/* Personal Records */}
      <div className="game-card p-5 space-y-3">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4 text-yellow-400" /> Personal Records (last 7 days)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Lowest Resting HR</div>
            <div className="text-xl font-bold text-red-400">
              {bestHR !== null ? `${bestHR}` : '—'}
              {bestHR !== null && <span className="text-xs text-slate-400 ml-1">bpm</span>}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Highest HRV</div>
            <div className="text-xl font-bold text-yellow-400">
              {bestHRV !== null ? `${bestHRV}` : '—'}
              {bestHRV !== null && <span className="text-xs text-slate-400 ml-1">ms</span>}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Best Step Day</div>
            <div className="text-xl font-bold text-blue-400">
              {bestSteps !== null ? bestSteps.toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* BMI Calculator */}
      {settings.heightCm && (
        <div className="game-card p-5 space-y-3">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> BMI Calculator
          </h2>
          {bmi !== null && bmiInfo ? (
            <div className="flex items-center gap-6">
              <div>
                <div className="text-4xl font-bold text-violet-400">{bmi}</div>
                <div className={`text-sm font-medium mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-2">
                  Height: {settings.heightCm} cm &nbsp;|&nbsp; Weight:{' '}
                  {todayLog?.weightKg} kg
                </div>
                {/* BMI scale bar */}
                <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-400 via-yellow-400 to-red-500">
                  <div
                    className="absolute top-0 w-1 h-full bg-white rounded-full shadow"
                    style={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Log your weight for today to see your BMI. (Height set: {settings.heightCm} cm)
            </p>
          )}
        </div>
      )}

      {/* Weekly Trend Charts */}
      <div className="game-card p-5 space-y-5">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Trends
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Weight ({settings.weightUnit})
            </div>
            <MiniBarChart
              values={settings.weightUnit === 'lbs'
                ? weekLogs.map(l => l?.weightLbs ?? null)
                : weightKgWeek}
              labels={days}
              color="#34d399"
              unit={settings.weightUnit}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-400" /> Resting HR (bpm)
            </div>
            <MiniBarChart values={hrWeek} labels={days} color="#f87171" unit="bpm" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> HRV (ms)
            </div>
            <MiniBarChart values={hrvWeek} labels={days} color="#facc15" unit="ms" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" /> Steps
            </div>
            <MiniBarChart values={stepsWeek} labels={days} color="#60a5fa" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" /> Active Minutes
            </div>
            <MiniBarChart values={activeWeek} labels={days} color="#fb923c" unit="m" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-purple-400" /> Calories Burned
            </div>
            <MiniBarChart values={calWeek} labels={days} color="#a78bfa" unit="cal" />
          </div>
        </div>
      </div>

      {/* Blood Pressure Display (if logged) */}
      {weekLogs.some(l => l?.systolic !== null) && (
        <div className="game-card p-5 space-y-3">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" /> Blood Pressure — Last 7 Days
          </h2>
          <div className="space-y-2">
            {days.map((d, i) => {
              const l = weekLogs[i]
              if (!l?.systolic) return null
              const sys = l.systolic
              const dia = l.diastolic ?? 0
              const isHigh = sys >= 140 || dia >= 90
              const isElevated = sys >= 120 && sys < 140
              const color = isHigh ? 'text-red-400' : isElevated ? 'text-yellow-400' : 'text-green-400'
              const label = isHigh ? 'High' : isElevated ? 'Elevated' : 'Normal'
              return (
                <div key={d} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-2">
                  <span className="text-slate-400 text-sm">{d.slice(5)}</span>
                  <span className={`font-bold ${color}`}>
                    {sys}/{dia}
                  </span>
                  <span className={`text-xs ${color}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

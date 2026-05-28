import { useState, useEffect } from 'react'
import { Sun, CheckCircle2, Circle, ChevronRight, ChevronLeft, Star, Target, Heart, Zap, Clock, Flame, Trophy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'morning_intention_ritual_log'

const QUALITIES = ['Disciplined', 'Creative', 'Courageous', 'Loving', 'Focused', 'Joyful', 'Resilient', 'Grateful', 'Generous', 'Peaceful']

interface IntentionEntry {
  date: string
  todayIAm: string
  mainQuality: string
  singleMostImportant: string
  byWhenDone: string
  secondaryTask: string
  whatToDelegate: string
  energyPlan: string
  rechargeActivity: string
  whoToConnect: string
  howToShowUp: string
  bestCaseScenario: string
  eveningCheckIn: string
  intentionScore: number
}

const SECTION_LABELS = [
  'Identity',
  'Focus',
  'Energy',
  'Relationships',
  'Evening Review',
]

const SECTION_ICONS = [Star, Target, Zap, Heart, Clock]

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcScore(entry: Partial<IntentionEntry>): number {
  const fields: (keyof IntentionEntry)[] = [
    'todayIAm', 'mainQuality', 'singleMostImportant', 'byWhenDone',
    'secondaryTask', 'whatToDelegate', 'energyPlan', 'rechargeActivity',
    'whoToConnect', 'howToShowUp', 'bestCaseScenario',
  ]
  const filled = fields.filter(f => entry[f] && String(entry[f]).trim() !== '').length
  return Math.round((filled / 11) * 100)
}

function loadLog(): IntentionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as IntentionEntry[]
  } catch {
    return []
  }
}

function saveLog(entries: IntentionEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function calcStreak(entries: IntentionEntry[]): number {
  const dates = new Set(entries.map(e => e.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) streak++
    else break
  }
  return streak
}

export default function MorningIntentionRitual() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<IntentionEntry[]>([])
  const [section, setSection] = useState(0)
  const [saved, setSaved] = useState(false)

  const [todayIAm, setTodayIAm] = useState('')
  const [mainQuality, setMainQuality] = useState('')
  const [singleMostImportant, setSingleMostImportant] = useState('')
  const [byWhenDone, setByWhenDone] = useState('')
  const [secondaryTask, setSecondaryTask] = useState('')
  const [whatToDelegate, setWhatToDelegate] = useState('')
  const [energyPlan, setEnergyPlan] = useState('')
  const [rechargeActivity, setRechargeActivity] = useState('')
  const [whoToConnect, setWhoToConnect] = useState('')
  const [howToShowUp, setHowToShowUp] = useState('')
  const [bestCaseScenario, setBestCaseScenario] = useState('')
  const [eveningCheckIn, setEveningCheckIn] = useState('')

  useEffect(() => {
    const entries = loadLog()
    setLog(entries)
    const todayEntry = entries.find(e => e.date === todayKey())
    if (todayEntry) {
      setTodayIAm(todayEntry.todayIAm)
      setMainQuality(todayEntry.mainQuality)
      setSingleMostImportant(todayEntry.singleMostImportant)
      setByWhenDone(todayEntry.byWhenDone)
      setSecondaryTask(todayEntry.secondaryTask)
      setWhatToDelegate(todayEntry.whatToDelegate)
      setEnergyPlan(todayEntry.energyPlan)
      setRechargeActivity(todayEntry.rechargeActivity)
      setWhoToConnect(todayEntry.whoToConnect)
      setHowToShowUp(todayEntry.howToShowUp)
      setBestCaseScenario(todayEntry.bestCaseScenario)
      setEveningCheckIn(todayEntry.eveningCheckIn)
      setSaved(true)
    }
  }, [])

  const currentEntry: Partial<IntentionEntry> = {
    todayIAm, mainQuality, singleMostImportant, byWhenDone,
    secondaryTask, whatToDelegate, energyPlan, rechargeActivity,
    whoToConnect, howToShowUp, bestCaseScenario, eveningCheckIn,
  }
  const score = calcScore(currentEntry)
  const streak = calcStreak(log)
  const last7 = getLast7Days()
  const logDates = new Set(log.map(e => e.date))

  function handleSave() {
    const entry: IntentionEntry = {
      date: todayKey(),
      todayIAm, mainQuality, singleMostImportant, byWhenDone,
      secondaryTask, whatToDelegate, energyPlan, rechargeActivity,
      whoToConnect, howToShowUp, bestCaseScenario, eveningCheckIn,
      intentionScore: score,
    }
    const updated = log.filter(e => e.date !== todayKey())
    updated.unshift(entry)
    saveLog(updated)
    setLog(updated)
    setSaved(true)
    toastSuccess('Morning Intention Set', `Intention score: ${score}%`)
  }

  const SectionIcon = SECTION_ICONS[section]

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Sun className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Morning Intention Ritual</h1>
            <p className="text-slate-400 text-sm">Set who you're being, not just what you're doing</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="game-card text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-orange-300">{streak}</div>
            <div className="text-xs text-slate-400">Day Streak</div>
          </div>
          <div className="game-card text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-amber-300">{score}%</div>
            <div className="text-xs text-slate-400">Today's Score</div>
          </div>
          <div className="game-card text-center">
            <Star className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-violet-300">{log.length}</div>
            <div className="text-xs text-slate-400">Total Days</div>
          </div>
        </div>

        {/* Last 7 days dots */}
        <div className="game-card mb-6">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Last 7 Days</p>
          <div className="flex gap-2 justify-between">
            {last7.map(date => {
              const done = logDates.has(date)
              const isToday = date === todayKey()
              return (
                <div key={date} className="flex flex-col items-center gap-1">
                  {done
                    ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                    : <Circle className={`w-6 h-6 ${isToday ? 'text-amber-400' : 'text-slate-600'}`} />
                  }
                  <span className="text-xs text-slate-500">{date.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SECTION_LABELS.map((label, i) => {
            const Icon = SECTION_ICONS[i]
            return (
              <button
                key={label}
                onClick={() => setSection(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  section === i
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Section content */}
        <div className="game-card mb-4">
          <div className="flex items-center gap-2 mb-5">
            <SectionIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">{SECTION_LABELS[section]}</h2>
          </div>

          {section === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Today I am a...</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. focused creator, loving father, disciplined athlete"
                  value={todayIAm}
                  onChange={e => setTodayIAm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Main Quality I'm Embodying</label>
                <select
                  className="game-input w-full"
                  value={mainQuality}
                  onChange={e => setMainQuality(e.target.value)}
                >
                  <option value="">Select a quality...</option>
                  {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
          )}

          {section === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">The ONE Most Important Thing Today</label>
                <input
                  className="game-input w-full"
                  placeholder="If you accomplish only one thing..."
                  value={singleMostImportant}
                  onChange={e => setSingleMostImportant(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Must be done by</label>
                <input
                  type="time"
                  className="game-input w-full"
                  value={byWhenDone}
                  onChange={e => setByWhenDone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Secondary Task</label>
                <input
                  className="game-input w-full"
                  placeholder="If the main thing is done..."
                  value={secondaryTask}
                  onChange={e => setSecondaryTask(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">What to Delegate (optional)</label>
                <input
                  className="game-input w-full"
                  placeholder="What can someone else handle?"
                  value={whatToDelegate}
                  onChange={e => setWhatToDelegate(e.target.value)}
                />
              </div>
            </div>
          )}

          {section === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Energy Protection Plan</label>
                <input
                  className="game-input w-full"
                  placeholder="How will you protect your energy today?"
                  value={energyPlan}
                  onChange={e => setEnergyPlan(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Planned Recharge Activity</label>
                <input
                  className="game-input w-full"
                  placeholder="One recovery activity you'll do"
                  value={rechargeActivity}
                  onChange={e => setRechargeActivity(e.target.value)}
                />
              </div>
            </div>
          )}

          {section === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">One Person to Connect With</label>
                <input
                  className="game-input w-full"
                  placeholder="Who will you reach out to today?"
                  value={whoToConnect}
                  onChange={e => setWhoToConnect(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">How I'll Show Up for Others</label>
                <input
                  className="game-input w-full"
                  placeholder="Present, patient, encouraging..."
                  value={howToShowUp}
                  onChange={e => setHowToShowUp(e.target.value)}
                />
              </div>
            </div>
          )}

          {section === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Best Case Scenario</label>
                <input
                  className="game-input w-full"
                  placeholder="If today goes perfectly, what happens?"
                  value={bestCaseScenario}
                  onChange={e => setBestCaseScenario(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Evening Check-In Reminder</label>
                <input
                  type="time"
                  className="game-input w-full"
                  value={eveningCheckIn}
                  onChange={e => setEveningCheckIn(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation + Save */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSection(s => Math.max(0, s - 1))}
            disabled={section === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {section < 4 ? (
            <button
              onClick={() => setSection(s => Math.min(4, s + 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 font-semibold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saved ? 'Update Intention' : 'Set Intention'}
            </button>
          )}
        </div>

        {/* Today's summary card (read-only after save) */}
        {saved && todayIAm && (
          <div className="game-card border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-amber-300">Today's Intention</h3>
              <span className="ml-auto text-sm font-bold text-amber-400">{score}% complete</span>
            </div>
            <div className="space-y-2 text-sm">
              {todayIAm && (
                <p><span className="text-slate-400">I am: </span><span className="text-white font-medium">{todayIAm}</span>{mainQuality && <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">{mainQuality}</span>}</p>
              )}
              {singleMostImportant && (
                <p><span className="text-slate-400">MIT: </span><span className="text-white">{singleMostImportant}</span>{byWhenDone && <span className="text-slate-400"> by {byWhenDone}</span>}</p>
              )}
              {bestCaseScenario && (
                <p><span className="text-slate-400">Best case: </span><span className="text-white">{bestCaseScenario}</span></p>
              )}
              {whoToConnect && (
                <p><span className="text-slate-400">Connect with: </span><span className="text-white">{whoToConnect}</span></p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  Brain, Flame, Star, Heart, Shield, Eye, Zap,
  TrendingUp, BarChart3, Plus, CheckCircle2, Clock,
  Lightbulb, Target,
} from 'lucide-react'

const STORAGE_KEY = 'mindset_gym_log'

type ExerciseType = 'Visualization' | 'Affirmations' | 'Gratitude Depth' | 'Future Self Letter' | 'Fear Confrontation'

const EXERCISES: { type: ExerciseType; icon: React.ReactNode; color: string; accent: string }[] = [
  { type: 'Visualization', icon: <Eye className="w-5 h-5" />, color: 'violet', accent: 'text-violet-400' },
  { type: 'Affirmations', icon: <Zap className="w-5 h-5" />, color: 'blue', accent: 'text-blue-400' },
  { type: 'Gratitude Depth', icon: <Heart className="w-5 h-5" />, color: 'pink', accent: 'text-pink-400' },
  { type: 'Future Self Letter', icon: <Star className="w-5 h-5" />, color: 'amber', accent: 'text-amber-400' },
  { type: 'Fear Confrontation', icon: <Shield className="w-5 h-5" />, color: 'red', accent: 'text-red-400' },
]

const REPEAT_OPTIONS = ['5', '10', '21', '108']
const FUTURE_OPTIONS = ['1 month', '3 months', '1 year', '5 years', '10 years']

// Per-exercise form states
interface VisualizationForm {
  whatVisualized: string
  duration: number
  vividness: number
  emotionFelt: string
}

interface AffirmationsForm {
  affirmation: string
  timesRepeated: string
  beliefBefore: number
  beliefAfter: number
}

interface GratitudeDepthForm {
  grateful1: string
  grateful2: string
  grateful3: string
  depthFeeling: number
}

interface FutureLetterForm {
  letter: string
  howFarFuture: string
}

interface FearConfrontationForm {
  fear: string
  actionTaken: string
  courageLevel: number
}

interface MindsetEntry {
  id: string
  date: string
  exerciseType: ExerciseType
  mindsetScore: number
  data: VisualizationForm | AffirmationsForm | GratitudeDepthForm | FutureLetterForm | FearConfrontationForm
}

const EMPTY_VIZ: VisualizationForm = { whatVisualized: '', duration: 5, vividness: 7, emotionFelt: '' }
const EMPTY_AFF: AffirmationsForm = { affirmation: '', timesRepeated: '21', beliefBefore: 5, beliefAfter: 7 }
const EMPTY_GRAT: GratitudeDepthForm = { grateful1: '', grateful2: '', grateful3: '', depthFeeling: 7 }
const EMPTY_FUTURE: FutureLetterForm = { letter: '', howFarFuture: '1 year' }
const EMPTY_FEAR: FearConfrontationForm = { fear: '', actionTaken: '', courageLevel: 7 }

function computeScore(type: ExerciseType, data: VisualizationForm | AffirmationsForm | GratitudeDepthForm | FutureLetterForm | FearConfrontationForm): number {
  if (type === 'Visualization') {
    const d = data as VisualizationForm
    return Math.round(((d.vividness + 7) / 2) * 10)
  }
  if (type === 'Affirmations') {
    const d = data as AffirmationsForm
    return Math.round(((d.beliefBefore + d.beliefAfter) / 2) * 10)
  }
  if (type === 'Gratitude Depth') {
    const d = data as GratitudeDepthForm
    return d.depthFeeling * 10
  }
  if (type === 'Future Self Letter') {
    const d = data as FutureLetterForm
    return Math.min(100, Math.round((d.letter.length / 50) * 70) + 30)
  }
  if (type === 'Fear Confrontation') {
    const d = data as FearConfrontationForm
    return d.courageLevel * 10
  }
  return 70
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getExerciseStyle(type: ExerciseType): string {
  const map: Record<ExerciseType, string> = {
    'Visualization': 'bg-violet-900/40 text-violet-300 border-violet-500/40',
    'Affirmations': 'bg-blue-900/40 text-blue-300 border-blue-500/40',
    'Gratitude Depth': 'bg-pink-900/40 text-pink-300 border-pink-500/40',
    'Future Self Letter': 'bg-amber-900/40 text-amber-300 border-amber-500/40',
    'Fear Confrontation': 'bg-red-900/40 text-red-300 border-red-500/40',
  }
  return map[type]
}

export default function MindsetGym() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindsetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null)

  const [vizForm, setVizForm] = useState<VisualizationForm>(EMPTY_VIZ)
  const [affForm, setAffForm] = useState<AffirmationsForm>(EMPTY_AFF)
  const [gratForm, setGratForm] = useState<GratitudeDepthForm>(EMPTY_GRAT)
  const [futureForm, setFutureForm] = useState<FutureLetterForm>(EMPTY_FUTURE)
  const [fearForm, setFearForm] = useState<FearConfrontationForm>(EMPTY_FEAR)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  const saveEntries = (updated: MindsetEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const getFormData = (): VisualizationForm | AffirmationsForm | GratitudeDepthForm | FutureLetterForm | FearConfrontationForm => {
    if (selectedExercise === 'Visualization') return vizForm
    if (selectedExercise === 'Affirmations') return affForm
    if (selectedExercise === 'Gratitude Depth') return gratForm
    if (selectedExercise === 'Future Self Letter') return futureForm
    return fearForm
  }

  const canSubmit = (): boolean => {
    if (!selectedExercise) return false
    if (selectedExercise === 'Visualization') return !!vizForm.whatVisualized.trim()
    if (selectedExercise === 'Affirmations') return !!affForm.affirmation.trim()
    if (selectedExercise === 'Gratitude Depth') return !!gratForm.grateful1.trim()
    if (selectedExercise === 'Future Self Letter') return futureForm.letter.length >= 50
    return !!fearForm.fear.trim()
  }

  const handleSubmit = () => {
    if (!selectedExercise || !canSubmit()) return
    const data = getFormData()
    const entry: MindsetEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exerciseType: selectedExercise,
      mindsetScore: computeScore(selectedExercise, data),
      data,
    }
    saveEntries([entry, ...entries])
    toastSuccess('Mindset workout complete! Mental gains unlocked.')
    setSelectedExercise(null)
    setVizForm(EMPTY_VIZ)
    setAffForm(EMPTY_AFF)
    setGratForm(EMPTY_GRAT)
    setFutureForm(EMPTY_FUTURE)
    setFearForm(EMPTY_FEAR)
    setShowForm(false)
  }

  // Streak
  const sortedDates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort().reverse()
  let streak = 0
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const exp = expected.toISOString().split('T')[0]
    if (sortedDates[i] === exp) streak++
    else break
  }

  // Last 30 days breakdown
  const cutoff30 = new Date()
  cutoff30.setDate(cutoff30.getDate() - 30)
  const last30 = entries.filter(e => new Date(e.date) >= cutoff30)
  const countByType: Record<string, number> = {}
  const scoreByType: Record<string, number[]> = {}
  last30.forEach(e => {
    countByType[e.exerciseType] = (countByType[e.exerciseType] ?? 0) + 1
    if (!scoreByType[e.exerciseType]) scoreByType[e.exerciseType] = []
    scoreByType[e.exerciseType].push(e.mindsetScore)
  })
  const avgByType: Record<string, number> = {}
  Object.entries(scoreByType).forEach(([k, v]) => {
    avgByType[k] = Math.round(v.reduce((a, b) => a + b, 0) / v.length)
  })

  const last7 = entries.slice(0, 7)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-8 h-8 text-violet-400" />
            Mindset Gym
          </h1>
          <p className="text-slate-400 mt-1">Train your mindset like a muscle. Daily mental conditioning.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Train Now
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-400 mt-1">Workout Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{last30.length}</div>
          <div className="text-xs text-slate-400 mt-1">Sessions (30d)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {last30.length ? Math.round(last30.reduce((s, e) => s + e.mindsetScore, 0) / last30.length) : 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Avg Score (30d)</div>
        </div>
      </div>

      {/* Exercise picker + form */}
      {showForm && (
        <div className="game-card p-5 border border-violet-500/30 space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-violet-400" />
            Choose Your Mindset Exercise
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {EXERCISES.map(ex => (
              <button
                key={ex.type}
                onClick={() => setSelectedExercise(ex.type)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors text-center ${
                  selectedExercise === ex.type
                    ? `${getExerciseStyle(ex.type)}`
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className={ex.accent}>{ex.icon}</span>
                {ex.type}
              </button>
            ))}
          </div>

          {/* VISUALIZATION */}
          {selectedExercise === 'Visualization' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">What Did You Visualize?</label>
                <input className="game-input w-full" placeholder="Describe your visualization in detail..."
                  value={vizForm.whatVisualized}
                  onChange={e => setVizForm(f => ({ ...f, whatVisualized: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duration (mins): {vizForm.duration}</label>
                  <input type="range" min={1} max={30} value={vizForm.duration}
                    onChange={e => setVizForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full accent-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Vividness: {vizForm.vividness}/10</label>
                  <input type="range" min={1} max={10} value={vizForm.vividness}
                    onChange={e => setVizForm(f => ({ ...f, vividness: Number(e.target.value) }))}
                    className="w-full accent-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Emotion Felt</label>
                  <input className="game-input w-full" placeholder="e.g. Excited, confident..."
                    value={vizForm.emotionFelt}
                    onChange={e => setVizForm(f => ({ ...f, emotionFelt: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AFFIRMATIONS */}
          {selectedExercise === 'Affirmations' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Your Affirmation</label>
                <input className="game-input w-full" placeholder="I am...  /  I have...  /  I create..."
                  value={affForm.affirmation}
                  onChange={e => setAffForm(f => ({ ...f, affirmation: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Times Repeated</label>
                  <select className="game-input w-full"
                    value={affForm.timesRepeated}
                    onChange={e => setAffForm(f => ({ ...f, timesRepeated: e.target.value }))}
                  >
                    {REPEAT_OPTIONS.map(o => <option key={o} value={o}>{o}x</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Belief Before: {affForm.beliefBefore}/10</label>
                  <input type="range" min={1} max={10} value={affForm.beliefBefore}
                    onChange={e => setAffForm(f => ({ ...f, beliefBefore: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Belief After: {affForm.beliefAfter}/10</label>
                  <input type="range" min={1} max={10} value={affForm.beliefAfter}
                    onChange={e => setAffForm(f => ({ ...f, beliefAfter: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GRATITUDE DEPTH */}
          {selectedExercise === 'Gratitude Depth' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              {(['grateful1', 'grateful2', 'grateful3'] as const).map((key, i) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1">Gratitude #{i + 1}</label>
                  <input className="game-input w-full" placeholder={`I am deeply grateful for...`}
                    value={gratForm[key]}
                    onChange={e => setGratForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Depth of Feeling: {gratForm.depthFeeling}/10</label>
                <input type="range" min={1} max={10} value={gratForm.depthFeeling}
                  onChange={e => setGratForm(f => ({ ...f, depthFeeling: Number(e.target.value) }))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
          )}

          {/* FUTURE SELF LETTER */}
          {selectedExercise === 'Future Self Letter' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">How Far in the Future?</label>
                <select className="game-input w-full sm:w-48"
                  value={futureForm.howFarFuture}
                  onChange={e => setFutureForm(f => ({ ...f, howFarFuture: e.target.value }))}
                >
                  {FUTURE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Your Letter (min 50 characters — {futureForm.letter.length} / 50)
                </label>
                <textarea className="game-input w-full resize-none" rows={6}
                  placeholder={`Dear future me,\n\nBy ${futureForm.howFarFuture} from now, I will have...`}
                  value={futureForm.letter}
                  onChange={e => setFutureForm(f => ({ ...f, letter: e.target.value }))}
                />
                {futureForm.letter.length > 0 && futureForm.letter.length < 50 && (
                  <p className="text-xs text-amber-400 mt-1">{50 - futureForm.letter.length} more characters needed</p>
                )}
              </div>
            </div>
          )}

          {/* FEAR CONFRONTATION */}
          {selectedExercise === 'Fear Confrontation' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">What Fear Are You Confronting?</label>
                <input className="game-input w-full" placeholder="Name the fear specifically..."
                  value={fearForm.fear}
                  onChange={e => setFearForm(f => ({ ...f, fear: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Action Taken Toward It</label>
                <input className="game-input w-full" placeholder="What did you do despite the fear?"
                  value={fearForm.actionTaken}
                  onChange={e => setFearForm(f => ({ ...f, actionTaken: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Courage Level: {fearForm.courageLevel}/10</label>
                <input type="range" min={1} max={10} value={fearForm.courageLevel}
                  onChange={e => setFearForm(f => ({ ...f, courageLevel: Number(e.target.value) }))}
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          )}

          {selectedExercise && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Mindset Score: <span className="text-violet-400 font-bold text-lg">
                  {computeScore(selectedExercise, getFormData())}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setSelectedExercise(null) }}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  Log Workout
                </button>
              </div>
            </div>
          )}

          {!selectedExercise && (
            <div className="text-center">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Breakdown */}
      {Object.keys(countByType).length > 0 && (
        <div className="game-card p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Exercise Breakdown (Last 30 Days)
          </h2>
          <div className="space-y-2">
            {EXERCISES.map(ex => {
              const count = countByType[ex.type] ?? 0
              const avg = avgByType[ex.type] ?? 0
              if (count === 0) return null
              return (
                <div key={ex.type} className="flex items-center gap-3">
                  <span className={`w-40 text-xs font-medium ${ex.accent} flex-shrink-0`}>{ex.type}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-${ex.color}-500 transition-all`}
                      style={{ width: `${Math.min(100, count * 15)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">{count}x</span>
                  <span className="text-xs text-slate-500 w-16 text-right">Avg {avg}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Last 7 entries timeline */}
      {last7.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Last 7 Sessions
          </h2>
          <div className="space-y-2">
            {last7.map(e => (
              <div key={e.id} className="game-card p-3 flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getExerciseStyle(e.exerciseType)}`}>
                  {e.exerciseType}
                </span>
                <span className="text-xs text-violet-400 font-bold ml-auto">Score: {e.mindsetScore}</span>
                <span className="text-xs text-slate-500">
                  {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="game-card p-10 text-center">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Your mind is your greatest muscle. Start training it.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold text-sm transition-colors"
          >
            Begin First Workout
          </button>
        </div>
      )}

      {/* Tip */}
      <div className="game-card p-4 border border-violet-500/20 bg-violet-900/10">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-300">Mindset Gym Principle</p>
            <p className="text-xs text-slate-400 mt-1">
              Repetition builds belief. The mind you train today determines the life you live tomorrow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

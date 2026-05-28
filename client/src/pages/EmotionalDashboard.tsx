import { useState, useEffect } from 'react'
import { Heart, Brain, Shield, Star, Smile, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Emotion =
  | 'Joy' | 'Gratitude' | 'Love' | 'Serenity' | 'Hope' | 'Pride' | 'Amusement' | 'Inspiration' | 'Awe' | 'Interest'
  | 'Surprise' | 'Fear' | 'Sadness' | 'Disgust' | 'Anger' | 'Contempt' | 'Shame' | 'Guilt' | 'Anxiety' | 'Boredom'

type RegulationStrategy = 'breathe' | 'move' | 'talk' | 'write' | 'rest' | 'create' | 'pray'

interface EmotionalEntry {
  id: string
  emotion: Emotion
  intensity: number
  trigger: string
  need: string
  strategy: RegulationStrategy
  emotionScore: number
  date: string
  createdAt: string
}

const POSITIVE_EMOTIONS: Emotion[] = ['Joy', 'Gratitude', 'Love', 'Serenity', 'Hope', 'Pride', 'Amusement', 'Inspiration', 'Awe', 'Interest']
const ALL_EMOTIONS: Emotion[] = [
  'Joy', 'Gratitude', 'Love', 'Serenity', 'Hope', 'Pride', 'Amusement', 'Inspiration', 'Awe', 'Interest',
  'Surprise', 'Fear', 'Sadness', 'Disgust', 'Anger', 'Contempt', 'Shame', 'Guilt', 'Anxiety', 'Boredom',
]

const EMOTION_EMOJI: Record<Emotion, string> = {
  Joy: '😄', Gratitude: '🙏', Love: '❤️', Serenity: '😌', Hope: '🌟', Pride: '💪',
  Amusement: '😂', Inspiration: '✨', Awe: '🤩', Interest: '🧐',
  Surprise: '😲', Fear: '😰', Sadness: '😢', Disgust: '🤢', Anger: '😠',
  Contempt: '😒', Shame: '😳', Guilt: '😔', Anxiety: '😟', Boredom: '😑',
}

const STRATEGY_LABELS: Record<RegulationStrategy, string> = {
  breathe: '🫁 Breathe',
  move: '🏃 Move',
  talk: '💬 Talk',
  write: '✍️ Write',
  rest: '😴 Rest',
  create: '🎨 Create',
  pray: '🙏 Pray',
}

const STORAGE_KEY = 'emotional_dashboard_log'

function getLatestScore(storageKey: string, field: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (Array.isArray(data) && data.length > 0) {
      const val = Number(data[0][field])
      if (!isNaN(val) && val >= 0) return val
    }
  } catch { /**/ }
  return 0
}

function computeEmotionScore(emotion: Emotion, intensity: number): number {
  if (POSITIVE_EMOTIONS.includes(emotion)) return intensity * 10
  if (emotion === 'Surprise') return 50
  return (10 - intensity) * 10
}

export default function EmotionalDashboard() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EmotionalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    emotion: 'Joy' as Emotion,
    intensity: 7,
    trigger: '',
    need: '',
    strategy: 'breathe' as RegulationStrategy,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const harmonyScore = getLatestScore('conflict_resolution_log', 'harmonyScore')
  const willpowerScore = getLatestScore('willpower_log', 'willpowerScore')
  const resilienceScore = getLatestScore('resilient_thinking_log', 'resilienceScore')
  const selfLoveScore = getLatestScore('gratitude_to_self_log', 'selfLoveScore')
  const peaceScore = getLatestScore('inner_peace_log', 'peaceScore')
  const bodyWisdomScore = getLatestScore('body_wisdom_log', 'bodyWisdomScore')

  const eqDimensions = [
    { label: 'Harmony', score: harmonyScore, color: 'bg-blue-500 text-blue-200' },
    { label: 'Willpower', score: willpowerScore, color: 'bg-violet-500 text-violet-200' },
    { label: 'Resilience', score: resilienceScore, color: 'bg-green-500 text-green-200' },
    { label: 'Self-Love', score: selfLoveScore, color: 'bg-pink-500 text-pink-200' },
    { label: 'Peace', score: peaceScore, color: 'bg-sky-500 text-sky-200' },
    { label: 'Body Aware', score: bodyWisdomScore, color: 'bg-emerald-500 text-emerald-200' },
  ]

  const validScores = eqDimensions.filter(d => d.score > 0).map(d => d.score)
  const eqAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0

  const getEqLabel = (avg: number) => {
    if (avg >= 8) return { label: 'Masterful', color: 'text-green-400' }
    if (avg >= 6) return { label: 'Developing', color: 'text-yellow-400' }
    if (avg >= 4) return { label: 'Emerging', color: 'text-orange-400' }
    return { label: 'Building', color: 'text-red-400' }
  }
  const eqLabel = getEqLabel(eqAvg)

  const spectrumPercent = eqAvg > 0 ? (eqAvg / 10) * 100 : 50

  const save = (updated: EmotionalEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    const emotionScore = computeEmotionScore(form.emotion, form.intensity)
    const entry: EmotionalEntry = {
      id: Date.now().toString(),
      ...form,
      emotionScore,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(f => ({ ...f, trigger: '', need: '', intensity: 7, emotion: 'Joy' }))
    setShowForm(false)
    toastSuccess('Emotional state logged — awareness is the first step to regulation')
  }

  const last10 = entries.slice(0, 10)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Emotional Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Full emotional intelligence dashboard.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold"
        >
          <Smile className="w-4 h-4" /> Check In
        </button>
      </div>

      {/* EQ Overview */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">EQ Overview</h3>
          {eqAvg > 0 && (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-slate-700 ${eqLabel.color}`}>
              {eqLabel.label} — {eqAvg.toFixed(1)}/10
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {eqDimensions.map(dim => (
            <span
              key={dim.label}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dim.score > 0 ? dim.color : 'bg-slate-700 text-slate-500'}`}
            >
              {dim.label}: {dim.score > 0 ? dim.score : '–'}/10
            </span>
          ))}
        </div>
      </div>

      {/* Emotional Range Spectrum */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Emotional Range</h3>
        <div className="relative h-4 rounded-full overflow-hidden" style={{
          background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)'
        }}>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-900 shadow transition-all duration-500"
            style={{ left: `calc(${spectrumPercent}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Distress</span>
          <span>Neutral</span>
          <span>Thriving</span>
        </div>
      </div>

      {/* Check-in Form */}
      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Emotional Check-In</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Primary emotion right now</label>
            <select
              value={form.emotion}
              onChange={e => setForm(f => ({ ...f, emotion: e.target.value as Emotion }))}
              className="game-input w-full text-sm"
            >
              {ALL_EMOTIONS.map(em => (
                <option key={em} value={em}>{EMOTION_EMOJI[em]} {em}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Intensity: <span className="text-pink-400 font-bold">{form.intensity}/10</span>
              {' '}— Score: <span className="text-yellow-400 font-bold">{computeEmotionScore(form.emotion, form.intensity)}</span>
            </p>
            <input
              type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-500"
            />
          </div>
          <input
            value={form.trigger}
            onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggered this emotion?"
            className="game-input w-full text-sm"
          />
          <input
            value={form.need}
            onChange={e => setForm(f => ({ ...f, need: e.target.value }))}
            placeholder="What do you need right now?"
            className="game-input w-full text-sm"
          />
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Regulation strategy</label>
            <select
              value={form.strategy}
              onChange={e => setForm(f => ({ ...f, strategy: e.target.value as RegulationStrategy }))}
              className="game-input w-full text-sm"
            >
              {(Object.entries(STRATEGY_LABELS) as [RegulationStrategy, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Emoji Timeline */}
      {last10.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Recent Emotions</h3>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {last10.map(entry => (
              <div
                key={entry.id}
                className="flex flex-col items-center gap-0.5"
                title={`${entry.emotion} (${entry.intensity}/10) — Score: ${entry.emotionScore}`}
              >
                <span className="text-xl">{EMOTION_EMOJI[entry.emotion]}</span>
                <span className="text-xs text-slate-600">{entry.date.slice(5)}</span>
                <span className="text-xs font-bold text-yellow-400">{entry.emotionScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Your emotions are data, not destiny. Log your first check-in.</p>
        </div>
      )}
    </div>
  )
}

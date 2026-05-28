import { useState, useEffect } from 'react'
import { Heart, Activity, Brain, Moon, Users, Shield, Star, TrendingUp, Lightbulb, Globe, Smile, Zap, BookOpen, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Vital {
  id: string
  label: string
  emoji: string
  icon: React.ReactNode
  score: number
  notes: string
}

interface CheckupEntry {
  id: string
  vitals: { id: string; score: number; notes: string }[]
  lifeVitalsScore: number
  createdAt: string
}

const STORAGE_KEY = 'life_checkup_log'

const VITAL_DEFINITIONS = [
  { id: 'physical-energy', label: 'Physical Energy', emoji: '⚡' },
  { id: 'mental-clarity', label: 'Mental Clarity', emoji: '🧠' },
  { id: 'emotional-stability', label: 'Emotional Stability', emoji: '❤️' },
  { id: 'sleep-quality', label: 'Sleep Quality', emoji: '🌙' },
  { id: 'relationship-depth', label: 'Relationship Depth', emoji: '👥' },
  { id: 'financial-security', label: 'Financial Security', emoji: '🛡️' },
  { id: 'career-meaning', label: 'Career Meaning', emoji: '⭐' },
  { id: 'personal-growth', label: 'Personal Growth', emoji: '📈' },
  { id: 'creative-expression', label: 'Creative Expression', emoji: '💡' },
  { id: 'spiritual-connection', label: 'Spiritual Connection', emoji: '🌐' },
  { id: 'life-purpose-clarity', label: 'Life Purpose Clarity', emoji: '🎯' },
  { id: 'overall-happiness', label: 'Overall Happiness', emoji: '😊' },
]

const VITAL_ICONS: Record<string, React.ReactNode> = {
  'physical-energy': <Zap className="w-4 h-4" />,
  'mental-clarity': <Brain className="w-4 h-4" />,
  'emotional-stability': <Heart className="w-4 h-4" />,
  'sleep-quality': <Moon className="w-4 h-4" />,
  'relationship-depth': <Users className="w-4 h-4" />,
  'financial-security': <Shield className="w-4 h-4" />,
  'career-meaning': <Star className="w-4 h-4" />,
  'personal-growth': <TrendingUp className="w-4 h-4" />,
  'creative-expression': <Lightbulb className="w-4 h-4" />,
  'spiritual-connection': <Globe className="w-4 h-4" />,
  'life-purpose-clarity': <Activity className="w-4 h-4" />,
  'overall-happiness': <Smile className="w-4 h-4" />,
}

const PRESCRIPTIONS: Record<string, string> = {
  'physical-energy': 'Start a daily 20-minute movement protocol — walk, stretch, or train.',
  'mental-clarity': 'Practice a 10-minute morning brain dump to clear cognitive clutter.',
  'emotional-stability': 'Try a 5-minute emotional check-in practice twice daily.',
  'sleep-quality': 'Start a 7-night sleep protocol — consistent bedtime, no screens 1hr before.',
  'relationship-depth': 'Schedule one meaningful 1-on-1 conversation per week.',
  'financial-security': 'Build a simple budget tracker and set one savings micro-goal this week.',
  'career-meaning': 'Write your personal mission statement — why does your work matter?',
  'personal-growth': 'Commit to one learning resource: a book, course, or mentor this month.',
  'creative-expression': 'Reserve 30 minutes per week for pure creative play with no output goal.',
  'spiritual-connection': 'Start a 5-minute daily stillness or reflection practice.',
  'life-purpose-clarity': 'Use the Ikigai framework to map what you love, can do, and the world needs.',
  'overall-happiness': 'Write three specific things you are genuinely grateful for each morning.',
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-green-900/30 border-green-500/30'
  if (score >= 60) return 'bg-yellow-900/30 border-yellow-500/30'
  if (score >= 40) return 'bg-amber-900/30 border-amber-500/30'
  return 'bg-red-900/30 border-red-500/30'
}

function getSliderColor(score: number): string {
  if (score >= 8) return 'accent-green-500'
  if (score >= 6) return 'accent-yellow-500'
  if (score >= 4) return 'accent-orange-500'
  return 'accent-red-500'
}

export default function LifeCheckup() {
  const { toastSuccess } = useToast()
  const [vitals, setVitals] = useState<Vital[]>(
    VITAL_DEFINITIONS.map(v => ({
      id: v.id,
      label: v.label,
      emoji: v.emoji,
      icon: VITAL_ICONS[v.id],
      score: 5,
      notes: '',
    }))
  )
  const [history, setHistory] = useState<CheckupEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch { /**/ }
  }, [])

  const updateVital = (id: string, field: 'score' | 'notes', value: string | number) => {
    setVitals(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const avg = vitals.reduce((sum, v) => sum + v.score, 0) / vitals.length
  const lifeVitalsScore = Math.round(avg * 10)

  const lowest3 = [...vitals].sort((a, b) => a.score - b.score).slice(0, 3)

  const save = () => {
    const entry: CheckupEntry = {
      id: Date.now().toString(),
      vitals: vitals.map(v => ({ id: v.id, score: v.score, notes: v.notes })),
      lifeVitalsScore,
      createdAt: new Date().toISOString(),
    }
    const updated = [entry, ...history]
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    toastSuccess('Life checkup saved', `Your Life Vitals Score: ${lifeVitalsScore}/100`)
  }

  const last5 = history.slice(0, 5)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-violet-400" />
            Life Checkup
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your comprehensive life health assessment.</p>
        </div>
      </div>

      {/* Life Vitals Score */}
      <div className={`game-card p-4 border text-center ${getScoreBg(lifeVitalsScore)}`}>
        <div className="text-xs text-slate-400 mb-1">Life Vitals Score</div>
        <div className={`text-4xl font-bold ${getScoreColor(lifeVitalsScore)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {lifeVitalsScore}
        </div>
        <div className="text-xs text-slate-500 mt-1">/ 100</div>
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              lifeVitalsScore >= 75 ? 'bg-green-500' : lifeVitalsScore >= 60 ? 'bg-yellow-500' : lifeVitalsScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${lifeVitalsScore}%` }}
          />
        </div>
      </div>

      {/* Vitals Sliders */}
      <div className="game-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          12 Life Vital Signs
        </h3>
        {vitals.map(vital => (
          <div key={vital.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{vital.emoji}</span>
                <span className="text-sm text-slate-300">{vital.label}</span>
              </div>
              <span
                className={`text-sm font-bold ${
                  vital.score >= 8 ? 'text-green-400' : vital.score >= 6 ? 'text-yellow-400' : vital.score >= 4 ? 'text-orange-400' : 'text-red-400'
                }`}
                style={{ fontFamily: 'Orbitron, monospace' }}
              >
                {vital.score}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={vital.score}
              onChange={e => updateVital(vital.id, 'score', Number(e.target.value))}
              className={`w-full h-1.5 ${getSliderColor(vital.score)}`}
            />
            <input
              value={vital.notes}
              onChange={e => updateVital(vital.id, 'notes', e.target.value)}
              placeholder={`Notes on ${vital.label.toLowerCase()}...`}
              className="game-input w-full text-xs"
            />
          </div>
        ))}
      </div>

      {/* Prescription */}
      <div className="game-card p-4 border border-amber-500/20 bg-amber-900/10">
        <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4" />
          Prescription — 3 Focus Areas
        </h3>
        <div className="space-y-2.5">
          {lowest3.map((vital, i) => (
            <div key={vital.id} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-300">{i + 1}</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-200">{vital.emoji} {vital.label} — {vital.score}/10</div>
                <div className="text-xs text-slate-400 mt-0.5">{PRESCRIPTIONS[vital.id]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={save}
        className="w-full py-3 bg-violet-700 hover:bg-violet-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        <Activity className="w-4 h-4" />
        Save Checkup
      </button>

      {/* History */}
      {last5.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Checkups
          </h3>
          <div className="space-y-2">
            {last5.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                <span
                  className={`text-sm font-bold ${getScoreColor(entry.lifeVitalsScore)}`}
                  style={{ fontFamily: 'Orbitron, monospace' }}
                >
                  {entry.lifeVitalsScore}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

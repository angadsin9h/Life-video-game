import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, Check, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface CheckData {
  energy: number
  stress: number
  focus: number
  mood: number
  gratitude: string
  affirmation: string
}

const ENERGY_LABELS = ['💀 Exhausted', '😴 Very Low', '😐 Low', '🙂 Moderate', '⚡ High', '🔥 Peak']
const STRESS_LABELS = ['😌 None', '😊 Minimal', '😐 Low', '😟 Moderate', '😰 High', '🤯 Extreme']
const FOCUS_LABELS = ['🌫️ Foggy', '😵 Poor', '😐 Fair', '🎯 Good', '🔥 Sharp', '⚡ Flow State']
const MOOD_LABELS = ['😭 Awful', '😢 Bad', '😐 Okay', '🙂 Good', '😄 Great', '🤩 Amazing']

const MORNING_AFFIRMATIONS = [
  "I have the strength to overcome any challenge today.",
  "My potential is unlimited and I choose to grow.",
  "I am worthy of success and happiness.",
  "Today I create the life I love.",
  "I am focused, energized, and ready to win.",
  "Every obstacle is an opportunity in disguise.",
  "I trust the process and embrace the journey.",
  "I am becoming the best version of myself.",
]

const GRATITUDE_PROMPTS = [
  "What's one thing that made you smile recently?",
  "Who in your life are you grateful for today?",
  "What ability or strength are you thankful for?",
  "What simple pleasure brought you joy this week?",
  "What challenge helped you grow?",
  "What's something beautiful you noticed today?",
]

function Slider({ value, onChange, labels, color }: {
  value: number
  onChange: (v: number) => void
  labels: string[]
  color: string
}) {
  return (
    <div>
      <div className="flex justify-center mb-3">
        <span className="text-lg font-semibold" style={{ color }}>{labels[value] || ''}</span>
      </div>
      <div className="flex gap-2">
        {labels.map((_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`flex-1 h-2 rounded-full transition-all ${i <= value ? '' : 'bg-slate-800'}`}
            style={{ backgroundColor: i <= value ? color : undefined }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-700">Low</span>
        <span className="text-xs text-slate-700">High</span>
      </div>
    </div>
  )
}

export default function WellnessCheck() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const STORAGE_KEY = `wellness_${today}`
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CheckData>({
    energy: 3, stress: 2, focus: 3, mood: 3, gratitude: '', affirmation: '',
  })
  const [saved, setSaved] = useState(false)

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const gratitudePrompt = GRATITUDE_PROMPTS[dayOfYear % GRATITUDE_PROMPTS.length]
  const defaultAffirmation = MORNING_AFFIRMATIONS[dayOfYear % MORNING_AFFIRMATIONS.length]

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setData(JSON.parse(stored))
      setSaved(true)
    }
  }, [STORAGE_KEY])

  const save = async () => {
    // Save energy and mood to metrics
    try {
      await Promise.all([
        axios.put(`/api/metrics/${today}`, { energy: data.energy, mood: data.mood }),
        axios.post(`/api/mood`, { date: today, mood: data.mood, notes: `Stress: ${data.stress}/5, Focus: ${data.focus}/5` }),
      ])
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSaved(true)
    toastSuccess('Wellness check saved! 💪')
  }

  const steps = [
    {
      title: 'Energy Level',
      subtitle: 'How energized do you feel?',
      color: '#f97316',
      content: <Slider value={data.energy} onChange={v => setData(d => ({ ...d, energy: v }))} labels={ENERGY_LABELS} color="#f97316" />,
    },
    {
      title: 'Stress Level',
      subtitle: 'How stressed are you feeling?',
      color: '#ef4444',
      content: <Slider value={data.stress} onChange={v => setData(d => ({ ...d, stress: v }))} labels={STRESS_LABELS} color="#ef4444" />,
    },
    {
      title: 'Mental Focus',
      subtitle: "How sharp is your mind today?",
      color: '#06b6d4',
      content: <Slider value={data.focus} onChange={v => setData(d => ({ ...d, focus: v }))} labels={FOCUS_LABELS} color="#06b6d4" />,
    },
    {
      title: 'Mood',
      subtitle: 'Overall, how are you feeling?',
      color: '#22c55e',
      content: <Slider value={data.mood} onChange={v => setData(d => ({ ...d, mood: v }))} labels={MOOD_LABELS} color="#22c55e" />,
    },
    {
      title: 'Gratitude',
      subtitle: gratitudePrompt,
      color: '#eab308',
      content: (
        <textarea rows={3} placeholder="I'm grateful for…"
          value={data.gratitude} onChange={e => setData(d => ({ ...d, gratitude: e.target.value }))}
          className="game-input w-full text-sm resize-none" autoFocus />
      ),
    },
    {
      title: "Today's Affirmation",
      subtitle: 'Set an intention for today',
      color: '#8b5cf6',
      content: (
        <div className="space-y-2">
          <div className="game-card p-3 text-center text-sm text-slate-400 italic">
            "{defaultAffirmation}"
          </div>
          <input placeholder="Or write your own…"
            value={data.affirmation} onChange={e => setData(d => ({ ...d, affirmation: e.target.value }))}
            className="game-input w-full text-sm" />
        </div>
      ),
    },
  ]

  const currentStep = steps[step]

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-7 h-7 text-green-400" />
          Wellness Check
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Daily 2-minute check-in</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center">
        {steps.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'w-6 bg-green-400' : i < step ? 'bg-green-600' : 'bg-slate-700'
            }`} />
        ))}
      </div>

      {/* Summary if saved */}
      {saved && step === steps.length && (
        <div className="game-card p-6 border border-green-500/20 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-xl font-bold text-green-400 mb-2">Check-in Complete!</div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="game-card p-3 text-center">
              <div className="text-xl">{ENERGY_LABELS[data.energy]}</div>
              <div className="text-xs text-slate-500 mt-1">Energy</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-xl">{MOOD_LABELS[data.mood]}</div>
              <div className="text-xs text-slate-500 mt-1">Mood</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-xl">{STRESS_LABELS[data.stress]}</div>
              <div className="text-xs text-slate-500 mt-1">Stress</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-xl">{FOCUS_LABELS[data.focus]}</div>
              <div className="text-xs text-slate-500 mt-1">Focus</div>
            </div>
          </div>
          {data.affirmation && (
            <div className="mt-4 text-sm text-violet-400 italic">"{data.affirmation || defaultAffirmation}"</div>
          )}
          <button onClick={() => { setSaved(false); setStep(0) }}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Edit responses
          </button>
        </div>
      )}

      {!saved || step < steps.length ? (
        <div className="game-card p-6 border-2 transition-all" style={{ borderColor: currentStep.color + '40' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: currentStep.color }}>{currentStep.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{currentStep.subtitle}</p>
          </div>
          {currentStep.content}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm rounded-xl transition-colors">
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 py-2.5 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: currentStep.color }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => { save(); setStep(steps.length) }}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Complete
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

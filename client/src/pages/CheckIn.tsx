import { useEffect, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Zap, Droplets, Moon, Heart, Sparkles, ChevronRight } from 'lucide-react'

interface CheckInState {
  mood: number | null
  energy: number | null
  water: number
  waterGoal: number
  sleepHours: number
  sleepQuality: number
  gratitude: string
  intention: string
  savedMood: boolean
  savedEnergy: boolean
  savedWater: boolean
  savedSleep: boolean
  savedGratitude: boolean
  savedIntention: boolean
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Bad' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

const ENERGY_OPTIONS = [
  { value: 0, emoji: '💀', label: 'Dead' },
  { value: 1, emoji: '😴', label: 'Tired' },
  { value: 2, emoji: '😐', label: 'Neutral' },
  { value: 3, emoji: '😊', label: 'Decent' },
  { value: 4, emoji: '⚡', label: 'Pumped' },
  { value: 5, emoji: '🔥', label: 'Unstoppable' },
]

const SLEEP_QUALITIES = [
  { value: 1, label: 'Terrible' },
  { value: 2, label: 'Poor' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Amazing' },
]

function Step({ number, title, done, children }: { number: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={`game-card p-5 border transition-all ${done ? 'border-green-500/30 bg-green-900/5' : 'border-slate-700'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : number}
        </div>
        <h3 className={`font-semibold ${done ? 'text-green-300' : 'text-slate-200'}`}>{title}</h3>
        {done && <span className="text-xs text-green-500 ml-auto">Saved ✓</span>}
      </div>
      {children}
    </div>
  )
}

export default function CheckIn() {
  const today = new Date().toISOString().split('T')[0]
  const [state, setState] = useState<CheckInState>({
    mood: null, energy: null,
    water: 0, waterGoal: 8,
    sleepHours: 7.5, sleepQuality: 3,
    gratitude: '', intention: '',
    savedMood: false, savedEnergy: false, savedWater: false,
    savedSleep: false, savedGratitude: false, savedIntention: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      axios.get('/api/mood/today').catch(() => ({ data: null })),
      axios.get(`/api/water/${today}`).catch(() => ({ data: { glasses: 0, goal: 8 } })),
      axios.get(`/api/sleep/${today}`).catch(() => ({ data: null })),
      axios.get(`/api/metrics/${today}`).catch(() => ({ data: null })),
    ]).then(([moodRes, waterRes, sleepRes, metricsRes]: any) => {
      setState(s => ({
        ...s,
        mood: moodRes.data?.mood ?? null,
        savedMood: !!moodRes.data?.mood,
        water: waterRes.data?.glasses ?? 0,
        waterGoal: waterRes.data?.goal ?? 8,
        savedWater: (waterRes.data?.glasses ?? 0) > 0,
        sleepHours: sleepRes.data?.duration_minutes ? sleepRes.data.duration_minutes / 60 : 7.5,
        sleepQuality: sleepRes.data?.quality ?? 3,
        savedSleep: !!(sleepRes.data?.duration_minutes),
        energy: metricsRes.data?.energy ?? null,
        savedEnergy: metricsRes.data?.energy != null,
      }))
    }).finally(() => setLoading(false))
  }, [today])

  const saveMood = async () => {
    if (state.mood === null) return
    setSaving('mood')
    try {
      await axios.post('/api/mood', { mood: state.mood })
      setState(s => ({ ...s, savedMood: true }))
    } finally { setSaving(null) }
  }

  const saveEnergy = async () => {
    if (state.energy === null) return
    setSaving('energy')
    try {
      await axios.put(`/api/metrics/${today}`, { energy: state.energy })
      setState(s => ({ ...s, savedEnergy: true }))
    } finally { setSaving(null) }
  }

  const saveWater = async () => {
    setSaving('water')
    try {
      await axios.post(`/api/water/${today}`, { glasses: state.water })
      setState(s => ({ ...s, savedWater: true }))
    } finally { setSaving(null) }
  }

  const saveSleep = async () => {
    setSaving('sleep')
    try {
      const mins = Math.round(state.sleepHours * 60)
      await axios.post('/api/sleep', { date: today, duration_minutes: mins, quality: state.sleepQuality })
      setState(s => ({ ...s, savedSleep: true }))
    } finally { setSaving(null) }
  }

  const saveGratitude = async () => {
    if (!state.gratitude.trim()) return
    setSaving('gratitude')
    try {
      const existing = await axios.get(`/api/gratitude/${today}`).catch(() => ({ data: null })) as any
      const entries = existing.data?.entries || []
      await axios.post('/api/gratitude', {
        date: today,
        entries: [...entries, state.gratitude.trim()].slice(0, 5),
      })
      setState(s => ({ ...s, savedGratitude: true }))
    } finally { setSaving(null) }
  }

  const saveIntention = async () => {
    if (!state.intention.trim()) return
    setSaving('intention')
    try {
      const existing = await axios.get(`/api/intentions/${today}`).catch(() => ({ data: [] })) as any
      const hasIntentions = Array.isArray(existing.data) && existing.data.length > 0
      if (!hasIntentions) {
        await axios.post('/api/intentions', { date: today, intentions: [state.intention.trim()] })
      }
      setState(s => ({ ...s, savedIntention: true }))
    } finally { setSaving(null) }
  }

  const stepsCompleted = [
    state.savedMood,
    state.savedEnergy,
    state.savedWater,
    state.savedSleep,
    state.savedGratitude,
    state.savedIntention,
  ].filter(Boolean).length

  const allDone = stepsCompleted === 6

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-lg mx-auto">
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Daily Check-In
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stepsCompleted}/6
          </div>
          <div className="text-xs text-slate-500">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-violet-500'}`}
          style={{ width: `${(stepsCompleted / 6) * 100}%` }}
        />
      </div>

      {allDone && (
        <div className="game-card p-5 border border-green-500/30 bg-green-900/5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-400">Check-in complete!</p>
          <p className="text-slate-400 text-sm mt-1">You've set yourself up for a great day.</p>
        </div>
      )}

      {/* Step 1: Mood */}
      <Step number={1} title="How are you feeling?" done={state.savedMood}>
        <div className="flex gap-2 justify-between">
          {MOOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setState(s => ({ ...s, mood: opt.value, savedMood: false }))}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all hover:scale-110 ${
                state.mood === opt.value ? 'bg-violet-600/30 border border-violet-500/50' : 'bg-slate-800 border border-slate-700'
              }`}>
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs text-slate-500">{opt.label}</span>
            </button>
          ))}
        </div>
        {state.mood !== null && !state.savedMood && (
          <button onClick={saveMood} disabled={saving === 'mood'}
            className="w-full mt-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'mood' ? 'Saving…' : <><CheckCircle2 className="w-4 h-4" /> Save Mood</>}
          </button>
        )}
      </Step>

      {/* Step 2: Energy */}
      <Step number={2} title="What's your energy level?" done={state.savedEnergy}>
        <div className="flex gap-1.5">
          {ENERGY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setState(s => ({ ...s, energy: opt.value, savedEnergy: false }))}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all hover:scale-110 ${
                state.energy === opt.value ? 'bg-yellow-600/30 border border-yellow-500/50' : 'bg-slate-800 border border-slate-700'
              }`}>
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-[10px] text-slate-500 leading-tight text-center">{opt.label}</span>
            </button>
          ))}
        </div>
        {state.energy !== null && !state.savedEnergy && (
          <button onClick={saveEnergy} disabled={saving === 'energy'}
            className="w-full mt-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'energy' ? 'Saving…' : <><Zap className="w-4 h-4" /> Save Energy</>}
          </button>
        )}
      </Step>

      {/* Step 3: Water */}
      <Step number={3} title="How much water so far?" done={state.savedWater}>
        <div className="flex items-center gap-3">
          <button onClick={() => setState(s => ({ ...s, water: Math.max(0, s.water - 1), savedWater: false }))}
            className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:text-slate-200 text-lg transition-colors">−</button>
          <div className="flex-1 flex gap-1">
            {Array.from({ length: state.waterGoal }).map((_, i) => (
              <button key={i} onClick={() => setState(s => ({ ...s, water: i + 1, savedWater: false }))}
                className={`flex-1 h-8 rounded transition-all ${i < state.water ? 'bg-cyan-500/60' : 'bg-slate-700'}`} />
            ))}
          </div>
          <button onClick={() => setState(s => ({ ...s, water: Math.min(20, s.water + 1), savedWater: false }))}
            className="w-8 h-8 rounded-lg bg-slate-700 text-cyan-400 hover:text-cyan-300 text-lg transition-colors">+</button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          <span className="text-cyan-400 font-bold">{state.water}</span> of {state.waterGoal} glasses
        </p>
        {!state.savedWater && (
          <button onClick={saveWater} disabled={saving === 'water'}
            className="w-full mt-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'water' ? 'Saving…' : <><Droplets className="w-4 h-4" /> Save Water</>}
          </button>
        )}
      </Step>

      {/* Step 4: Sleep */}
      <Step number={4} title="How did you sleep last night?" done={state.savedSleep}>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Duration</span>
              <span className="font-semibold text-indigo-400">{state.sleepHours.toFixed(1)}h</span>
            </div>
            <input type="range" min="3" max="12" step="0.5" value={state.sleepHours}
              onChange={e => setState(s => ({ ...s, sleepHours: parseFloat(e.target.value), savedSleep: false }))}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-[10px] text-slate-700 mt-1">
              <span>3h</span><span>6h</span><span>8h</span><span>10h</span><span>12h</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2">Quality</div>
            <div className="flex gap-2">
              {SLEEP_QUALITIES.map(q => (
                <button key={q.value} onClick={() => setState(s => ({ ...s, sleepQuality: q.value, savedSleep: false }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                    state.sleepQuality === q.value ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {!state.savedSleep && (
          <button onClick={saveSleep} disabled={saving === 'sleep'}
            className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'sleep' ? 'Saving…' : <><Moon className="w-4 h-4" /> Save Sleep</>}
          </button>
        )}
      </Step>

      {/* Step 5: Gratitude */}
      <Step number={5} title="One thing you're grateful for" done={state.savedGratitude}>
        <textarea
          rows={2}
          placeholder="I'm grateful for…"
          value={state.gratitude}
          onChange={e => setState(s => ({ ...s, gratitude: e.target.value, savedGratitude: false }))}
          className="game-input w-full resize-none"
        />
        {state.gratitude.trim() && !state.savedGratitude && (
          <button onClick={saveGratitude} disabled={saving === 'gratitude'}
            className="w-full mt-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'gratitude' ? 'Saving…' : <><Heart className="w-4 h-4" /> Save Gratitude</>}
          </button>
        )}
      </Step>

      {/* Step 6: Intention */}
      <Step number={6} title="Today's #1 priority" done={state.savedIntention}>
        <input
          type="text"
          placeholder="Today I will…"
          value={state.intention}
          onChange={e => setState(s => ({ ...s, intention: e.target.value, savedIntention: false }))}
          onKeyDown={e => e.key === 'Enter' && saveIntention()}
          className="game-input w-full"
        />
        {state.intention.trim() && !state.savedIntention && (
          <button onClick={saveIntention} disabled={saving === 'intention'}
            className="w-full mt-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving === 'intention' ? 'Saving…' : <><ChevronRight className="w-4 h-4" /> Set Intention</>}
          </button>
        )}
      </Step>
    </div>
  )
}

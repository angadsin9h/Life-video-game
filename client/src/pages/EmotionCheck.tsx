import { useEffect, useState } from 'react'
import axios from 'axios'
import { Heart, TrendingUp, Calendar, Sun, Moon } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface EmotionEntry {
  date: string
  time_of_day: string
  primary_emotion: string
  intensity: number
  trigger?: string
  notes?: string
  action_taken?: string
}

const EMOTIONS = [
  { name: 'Joy', emoji: '😄', color: '#eab308' },
  { name: 'Calm', emoji: '😌', color: '#22c55e' },
  { name: 'Focused', emoji: '🎯', color: '#3b82f6' },
  { name: 'Grateful', emoji: '🙏', color: '#8b5cf6' },
  { name: 'Excited', emoji: '🔥', color: '#f97316' },
  { name: 'Anxious', emoji: '😰', color: '#ef4444' },
  { name: 'Sad', emoji: '😢', color: '#6366f1' },
  { name: 'Angry', emoji: '😤', color: '#dc2626' },
  { name: 'Tired', emoji: '😴', color: '#94a3b8' },
  { name: 'Confused', emoji: '😕', color: '#f59e0b' },
  { name: 'Proud', emoji: '💪', color: '#14b8a6' },
  { name: 'Bored', emoji: '😑', color: '#64748b' },
]

const POSITIVE = new Set(['Joy', 'Calm', 'Focused', 'Grateful', 'Excited', 'Proud'])
const STORAGE_KEY = 'emotion_entries'

function loadEntries(): EmotionEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveEntry(entry: EmotionEntry) {
  const entries = loadEntries()
  entries.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 500)))
}

export default function EmotionCheck() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EmotionEntry[]>([])
  const [step, setStep] = useState<'select' | 'intensity' | 'context' | 'done'>('select')
  const [selected, setSelected] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [trigger, setTrigger] = useState('')
  const [notes, setNotes] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [view, setView] = useState<'log' | 'history'>('log')

  useEffect(() => { setEntries(loadEntries()) }, [])

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const handleSubmit = () => {
    const entry: EmotionEntry = {
      date: today,
      time_of_day: timeOfDay,
      primary_emotion: selected,
      intensity,
      trigger: trigger || undefined,
      notes: notes || undefined,
      action_taken: actionTaken || undefined,
    }
    saveEntry(entry)
    setEntries(loadEntries())
    setStep('done')
    toastSuccess('Emotion logged!')
  }

  const reset = () => {
    setStep('select')
    setSelected('')
    setIntensity(5)
    setTrigger('')
    setNotes('')
    setActionTaken('')
  }

  // Stats
  const todayEntries = entries.filter(e => e.date === today)
  const last30 = entries.filter(e => e.date >= new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const positiveCount = last30.filter(e => POSITIVE.has(e.primary_emotion)).length
  const positivityRate = last30.length > 0 ? Math.round((positiveCount / last30.length) * 100) : 0
  const emotionFreq: Record<string, number> = {}
  for (const e of last30) emotionFreq[e.primary_emotion] = (emotionFreq[e.primary_emotion] || 0) + 1
  const topEmotions = Object.entries(emotionFreq).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // 7-day trend
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    const dayEntries = entries.filter(e => e.date === date)
    const posCount = dayEntries.filter(e => POSITIVE.has(e.primary_emotion)).length
    return { date, total: dayEntries.length, posCount, pct: dayEntries.length > 0 ? posCount / dayEntries.length : -1 }
  })

  const emotion = EMOTIONS.find(e => e.name === selected)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Emotion Check
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your emotional patterns</p>
        </div>
        <div className="flex gap-1">
          {(['log', 'history'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${view === v ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'log' && (
        <div className="space-y-4">
          {step === 'select' && (
            <div className="game-card p-6">
              <h3 className="text-base font-semibold text-slate-300 mb-1">
                {hour < 12 ? <span className="flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-400" /> Good morning</span> : hour < 17 ? 'Good afternoon' : <span className="flex items-center gap-2"><Moon className="w-4 h-4 text-blue-400" /> Good evening</span>}
              </h3>
              <p className="text-slate-400 text-sm mb-5">How are you feeling right now?</p>
              <div className="grid grid-cols-4 gap-2">
                {EMOTIONS.map(e => (
                  <button key={e.name} onClick={() => { setSelected(e.name); setStep('intensity') }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{e.emoji}</span>
                    <span className="text-xs text-slate-400">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'intensity' && emotion && (
            <div className="game-card p-6 space-y-5">
              <div className="text-center">
                <span className="text-5xl">{emotion.emoji}</span>
                <h3 className="text-lg font-bold text-white mt-2">{emotion.name}</h3>
                <p className="text-slate-400 text-sm">How intense is this feeling?</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Barely noticeable</span>
                  <span className="font-bold text-white" style={{ color: emotion.color }}>{intensity}/10</span>
                  <span>Overwhelming</span>
                </div>
                <input type="range" min={1} max={10} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full accent-pink-500" />
                <div className="h-2 rounded-full overflow-hidden bg-slate-800">
                  <div className="h-full rounded-full transition-all" style={{ width: `${intensity * 10}%`, background: emotion.color }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('select')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors">Back</button>
                <button onClick={() => setStep('context')} className="flex-1 py-2 text-white rounded-xl text-sm font-semibold transition-colors" style={{ background: emotion.color }}>Next</button>
              </div>
            </div>
          )}

          {step === 'context' && emotion && (
            <div className="game-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{emotion.emoji}</span>
                <span className="font-bold text-white">{emotion.name} · {intensity}/10</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What triggered this? (optional)</label>
                <input value={trigger} onChange={e => setTrigger(e.target.value)}
                  placeholder="Work stress, good news, conversation..."
                  className="game-input w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Any notes? (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Anything else about this feeling..."
                  className="game-input w-full h-20 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What will you do about it? (optional)</label>
                <input value={actionTaken} onChange={e => setActionTaken(e.target.value)}
                  placeholder="Take a walk, meditate, talk to someone..."
                  className="game-input w-full" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('intensity')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors">Back</button>
                <button onClick={handleSubmit} className="flex-1 py-2 text-white rounded-xl text-sm font-semibold transition-colors" style={{ background: emotion.color }}>Log Emotion</button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="game-card p-8 text-center space-y-4">
              <div className="text-5xl">✨</div>
              <h3 className="text-lg font-bold text-white">Emotion logged!</h3>
              <p className="text-slate-400 text-sm">Self-awareness is the foundation of emotional intelligence.</p>
              <button onClick={reset} className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Log Another
              </button>
            </div>
          )}

          {/* Today's summary */}
          {todayEntries.length > 0 && step !== 'done' && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Emotions</h3>
              <div className="flex flex-wrap gap-2">
                {todayEntries.map((e, i) => {
                  const em = EMOTIONS.find(x => x.name === e.primary_emotion)
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-sm">
                      <span>{em?.emoji}</span>
                      <span className="text-slate-300">{e.primary_emotion}</span>
                      <span className="text-slate-600 text-xs">{e.intensity}/10</span>
                      <span className="text-slate-600 text-xs">{e.time_of_day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center">
              <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{last30.length}</div>
              <div className="text-xs text-slate-500">30d Logs</div>
            </div>
            <div className="game-card p-4 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-400">{positivityRate}%</div>
              <div className="text-xs text-slate-500">Positivity</div>
            </div>
            <div className="game-card p-4 text-center">
              <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{new Set(entries.map(e => e.date)).size}</div>
              <div className="text-xs text-slate-500">Days Logged</div>
            </div>
          </div>

          {/* 7-day mood trend */}
          <div className="game-card p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">7-Day Mood</h3>
            <div className="flex items-end gap-1 h-12">
              {weekDays.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm transition-all"
                    style={{
                      height: d.total > 0 ? '100%' : '4px',
                      background: d.pct === -1 ? '#1e293b' : d.pct >= 0.7 ? '#22c55e' : d.pct >= 0.4 ? '#eab308' : '#ef4444',
                    }} />
                  <div className="text-[9px] text-slate-600">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top emotions */}
          {topEmotions.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Emotions (30d)</h3>
              <div className="space-y-2">
                {topEmotions.map(([name, count]) => {
                  const em = EMOTIONS.find(e => e.name === name)
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xl">{em?.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-slate-300">{name}</span>
                          <span className="text-slate-500">{count}x</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / (topEmotions[0]?.[1] || 1)) * 100}%`, background: em?.color || '#94a3b8' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent entries */}
          {entries.slice(0, 10).length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent</h3>
              <div className="space-y-2">
                {entries.slice(0, 10).map((e, i) => {
                  const em = EMOTIONS.find(x => x.name === e.primary_emotion)
                  return (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-xl">{em?.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-300">{e.primary_emotion}</span>
                          <span className="text-xs text-slate-600">{e.intensity}/10</span>
                          <span className="text-xs text-slate-700">{e.time_of_day}</span>
                        </div>
                        {e.trigger && <div className="text-xs text-slate-600 truncate">{e.trigger}</div>}
                      </div>
                      <div className="text-xs text-slate-700">{e.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

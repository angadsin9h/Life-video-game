import { useState, useEffect } from 'react'
import { Sun, Star, ChevronRight, ChevronLeft, CheckCircle2, Circle, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface PowerupEntry {
  id: string
  date: string
  sleepStars: number
  energyStars: number
  topPriority: string
  intentionWord: string
  commitment: string
  powerupScore: number
  createdAt: string
}

const STORAGE_KEY = 'morning_powerup_log'

const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Discipline is the bridge between goals and accomplishment. — Jim Rohn",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "Energy and persistence conquer all things. — Benjamin Franklin",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "Action is the foundational key to all success. — Pablo Picasso",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "You are never too old to set another goal or to dream a new dream. — C.S. Lewis",
  "It always seems impossible until it's done. — Nelson Mandela",
  "The only way to do great work is to love what you do. — Steve Jobs",
]

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function dayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function getStreak(entries: PowerupEntry[]): number {
  if (entries.length === 0) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (entries.some(e => e.date === ds)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className={`transition-all ${onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-8 h-8 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function MorningPowerup() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PowerupEntry[]>([])
  const [step, setStep] = useState(0)
  const [sleepStars, setSleepStars] = useState(3)
  const [energyStars, setEnergyStars] = useState(3)
  const [topPriority, setTopPriority] = useState('')
  const [intentionWord, setIntentionWord] = useState('')
  const [commitment, setCommitment] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const today = todayStr()
  const todayDone = entries.some(e => e.date === today)
  const streak = getStreak(entries)
  const days7 = last7Days()

  const steps = [
    {
      q: 'How did you sleep?',
      hint: 'Rate your sleep quality',
      content: <div className="space-y-4"><StarRating value={sleepStars} onChange={setSleepStars} /></div>,
      canNext: true,
    },
    {
      q: 'Energy level right now?',
      hint: 'How charged are you feeling?',
      content: <div className="space-y-4"><StarRating value={energyStars} onChange={setEnergyStars} /></div>,
      canNext: true,
    },
    {
      q: "Today's #1 priority?",
      hint: 'The one thing that matters most',
      content: (
        <input
          value={topPriority}
          onChange={e => setTopPriority(e.target.value)}
          placeholder="My most important task today..."
          className="game-input w-full text-center text-sm"
          autoFocus
        />
      ),
      canNext: topPriority.trim().length > 0,
    },
    {
      q: 'One word for how you want to feel today?',
      hint: 'Your intention for the day',
      content: (
        <input
          value={intentionWord}
          onChange={e => setIntentionWord(e.target.value)}
          placeholder="Focused / Joyful / Calm / Powerful..."
          className="game-input w-full text-center text-sm"
          autoFocus
        />
      ),
      canNext: intentionWord.trim().length > 0,
    },
    {
      q: 'I am committed to...',
      hint: 'Your declaration for today',
      content: (
        <input
          value={commitment}
          onChange={e => setCommitment(e.target.value)}
          placeholder="...showing up fully and giving my best"
          className="game-input w-full text-center text-sm"
          autoFocus
        />
      ),
      canNext: commitment.trim().length > 0,
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      setShowCard(true)
    }
  }

  const handleSave = () => {
    const entry: PowerupEntry = {
      id: Date.now().toString(),
      date: today,
      sleepStars,
      energyStars,
      topPriority,
      intentionWord,
      commitment,
      powerupScore: Math.round(((sleepStars + energyStars) / 2) * 10),
      createdAt: new Date().toISOString(),
    }
    const updated = [entry, ...entries.filter(e => e.date !== today)]
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    toastSuccess('Morning powerup complete — go crush this day!')
  }

  const reset = () => {
    setStep(0)
    setSleepStars(3)
    setEnergyStars(3)
    setTopPriority('')
    setIntentionWord('')
    setCommitment('')
    setShowCard(false)
  }

  const cur = steps[step]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sun className="w-7 h-7 text-amber-400" />
          Morning Powerup
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your daily launch pad — start strong in under 2 minutes.</p>
      </div>

      {/* Streak + dots */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1">
            {todayDone
              ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done today</span>
              : <span className="text-xs text-slate-500 flex items-center gap-1"><Circle className="w-3.5 h-3.5" /> Not done yet</span>
            }
          </div>
        </div>
        <div className="flex gap-1.5 justify-center">
          {days7.map(d => (
            <div key={d} className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full border"
                style={{
                  background: entries.some(e => e.date === d) ? '#f59e0b' : 'transparent',
                  borderColor: entries.some(e => e.date === d) ? '#f59e0b' : '#334155',
                }}
              />
              <span className="text-xs text-slate-600">{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Power Card (after completion) */}
      {showCard ? (
        <div className="game-card p-6 border border-amber-500/30 space-y-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">{dayName()}</div>
            <div className="text-lg font-bold text-white">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Sleep</div>
              <StarRating value={sleepStars} />
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Energy</div>
              <StarRating value={energyStars} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-xs text-slate-400">Priority</div>
            <div className="text-base font-bold text-amber-300">{topPriority}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs text-slate-400">Today I choose to feel</div>
            <div className="text-3xl font-black text-violet-300" style={{ fontFamily: 'Orbitron, monospace' }}>{intentionWord}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-400 mb-1">My Commitment</div>
            <div className="text-sm text-slate-200 italic">"I am committed to {commitment}"</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1 italic">"{quote}"</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <Sun className="w-4 h-4" /> Begin Your Day
            </button>
            <button onClick={reset} className="px-4 py-3 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Redo
            </button>
          </div>
        </div>
      ) : todayDone ? (
        <div className="game-card p-6 text-center border border-green-500/30">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <div className="text-lg font-bold text-white mb-1">Morning Complete!</div>
          <div className="text-sm text-slate-400">You powered up today. Come back tomorrow.</div>
          <div className="mt-4 text-xs text-amber-400">Score: {entries.find(e => e.date === today)?.powerupScore ?? 0}/50</div>
        </div>
      ) : (
        /* Step flow */
        <div className="game-card p-6 space-y-6">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {step + 1} of {steps.length}</span>
              <span>{Math.round(((step) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full">
              <div
                className="h-1.5 bg-amber-400 rounded-full transition-all"
                style={{ width: `${((step) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">{cur.q}</div>
            <div className="text-xs text-slate-500">{cur.hint}</div>
          </div>

          <div>{cur.content}</div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!cur.canNext}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            >
              {step === steps.length - 1 ? 'See Power Card' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-2">Recent</h2>
          <div className="space-y-2">
            {entries.slice(0, 5).map(e => (
              <div key={e.id} className="game-card p-3 flex items-center gap-3">
                <div className="text-xs text-slate-500 w-20 flex-shrink-0">{e.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-amber-300 font-medium truncate">{e.topPriority}</div>
                  <div className="text-xs text-violet-300/70 truncate italic">{e.intentionWord}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">⚡{e.powerupScore}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

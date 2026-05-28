import { useEffect, useState } from 'react'
import axios from 'axios'
import { Swords, RefreshCw, CheckCircle2, Circle, Trophy, Flame } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  xp: number
  difficulty: 1 | 2 | 3
  type: 'timed' | 'count' | 'quality' | 'streak'
  target: string
}

const ALL_CHALLENGES: Challenge[] = [
  // Health
  { id: 'h1', title: '10k Steps', description: 'Walk or run 10,000 steps today', category: 'health', xp: 150, difficulty: 2, type: 'count', target: '10,000 steps' },
  { id: 'h2', title: 'No Sugar Day', description: 'Avoid all added sugar for 24 hours', category: 'health', xp: 200, difficulty: 3, type: 'quality', target: 'full day' },
  { id: 'h3', title: 'Cold Shower', description: 'Take a cold shower (minimum 2 minutes)', category: 'health', xp: 100, difficulty: 2, type: 'timed', target: '2 minutes' },
  { id: 'h4', title: 'Drink 3L Water', description: 'Drink at least 3 liters of water today', category: 'health', xp: 100, difficulty: 1, type: 'count', target: '3 liters' },
  { id: 'h5', title: '100 Push-ups', description: 'Complete 100 push-ups throughout the day', category: 'health', xp: 175, difficulty: 2, type: 'count', target: '100 reps' },
  { id: 'h6', title: '30min Stretch', description: 'Do 30 minutes of stretching or yoga', category: 'health', xp: 100, difficulty: 1, type: 'timed', target: '30 minutes' },
  { id: 'h7', title: 'No Junk Food', description: 'Eat only whole foods today. No fast food, chips, or candy', category: 'health', xp: 150, difficulty: 2, type: 'quality', target: 'full day' },
  { id: 'h8', title: 'Sleep by 10pm', description: 'Get to bed before 10:30pm tonight', category: 'health', xp: 125, difficulty: 2, type: 'quality', target: '10:30pm' },

  // Mind
  { id: 'm1', title: '20min Meditation', description: 'Sit in stillness and focus on your breath for 20 minutes', category: 'mind', xp: 150, difficulty: 2, type: 'timed', target: '20 minutes' },
  { id: 'm2', title: 'Read 30 Pages', description: 'Read 30 pages of a non-fiction book', category: 'mind', xp: 125, difficulty: 1, type: 'count', target: '30 pages' },
  { id: 'm3', title: 'No Phone Before Noon', description: 'Avoid checking your phone for the first 4 hours after waking', category: 'mind', xp: 200, difficulty: 3, type: 'quality', target: '4 hours' },
  { id: 'm4', title: 'Write 500 Words', description: 'Write 500 words — journal, ideas, anything', category: 'mind', xp: 125, difficulty: 2, type: 'count', target: '500 words' },
  { id: 'm5', title: 'Learn Something New', description: 'Spend 45 minutes learning a brand new skill or topic', category: 'mind', xp: 150, difficulty: 1, type: 'timed', target: '45 minutes' },
  { id: 'm6', title: 'Digital Detox Hour', description: 'Spend 1 hour completely offline — no devices at all', category: 'mind', xp: 150, difficulty: 2, type: 'timed', target: '60 minutes' },
  { id: 'm7', title: '3 Gratitudes + Why', description: 'Write 3 things you\'re grateful for AND the reason why for each', category: 'mind', xp: 75, difficulty: 1, type: 'quality', target: '3 items' },

  // Work
  { id: 'w1', title: '3-Hour Deep Work', description: 'Do 3 uninterrupted hours of focused work on your most important project', category: 'work', xp: 200, difficulty: 3, type: 'timed', target: '3 hours' },
  { id: 'w2', title: 'Inbox Zero', description: 'Clear your email inbox completely', category: 'work', xp: 125, difficulty: 2, type: 'quality', target: '0 emails' },
  { id: 'w3', title: 'Ship Something', description: 'Complete and deliver one meaningful output today', category: 'work', xp: 175, difficulty: 2, type: 'quality', target: '1 deliverable' },
  { id: 'w4', title: 'Plan Your Week', description: 'Spend 30 minutes planning the entire next 7 days', category: 'work', xp: 100, difficulty: 1, type: 'timed', target: '30 minutes' },
  { id: 'w5', title: 'No Multitasking', description: 'Do one thing at a time for the entire work day. No task-switching', category: 'work', xp: 200, difficulty: 3, type: 'quality', target: 'full day' },

  // Social
  { id: 's1', title: 'Reach Out to 3 People', description: 'Genuinely check in with 3 people you care about', category: 'social', xp: 125, difficulty: 1, type: 'count', target: '3 people' },
  { id: 's2', title: 'Acts of Kindness', description: 'Do 5 small acts of kindness for others today', category: 'social', xp: 150, difficulty: 2, type: 'count', target: '5 acts' },
  { id: 's3', title: 'Listen More', description: 'In every conversation today, ask more questions than you make statements', category: 'social', xp: 125, difficulty: 2, type: 'quality', target: 'full day' },
  { id: 's4', title: 'Reconnect', description: 'Reach out to someone you haven\'t talked to in over 3 months', category: 'social', xp: 100, difficulty: 1, type: 'quality', target: '1 person' },

  // Growth
  { id: 'g1', title: 'Teach Something', description: 'Explain something you know to someone else. Teaching solidifies learning', category: 'growth', xp: 150, difficulty: 2, type: 'quality', target: '1 lesson' },
  { id: 'g2', title: 'Comfort Zone Break', description: 'Do one thing today that genuinely scares you a little', category: 'growth', xp: 200, difficulty: 3, type: 'quality', target: '1 thing' },
  { id: 'g3', title: 'Reflect on Failure', description: 'Write a candid reflection on a recent failure and what you learned', category: 'growth', xp: 125, difficulty: 2, type: 'quality', target: '1 reflection' },
  { id: 'g4', title: 'Set 1-Year Vision', description: 'Spend 45 minutes writing your ideal life 1 year from today', category: 'growth', xp: 175, difficulty: 2, type: 'timed', target: '45 minutes' },
  { id: 'g5', title: 'No Complaints', description: 'Go through the entire day without complaining once — not even silently', category: 'growth', xp: 250, difficulty: 3, type: 'quality', target: 'full day' },
]

const CAT_COLORS: Record<string, string> = {
  health: 'border-green-500/30 bg-green-900/10',
  mind:   'border-cyan-500/30 bg-cyan-900/10',
  work:   'border-violet-500/30 bg-violet-900/10',
  social: 'border-yellow-500/30 bg-yellow-900/10',
  growth: 'border-orange-500/30 bg-orange-900/10',
}
const CAT_TEXT: Record<string, string> = {
  health: 'text-green-400', mind: 'text-cyan-400', work: 'text-violet-400', social: 'text-yellow-400', growth: 'text-orange-400',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const DIFF_LABELS = ['', '⚡ Easy', '🔥 Medium', '💀 Hard']
const DIFF_COLORS = ['', 'text-green-400', 'text-yellow-400', 'text-red-400']

const STORAGE_KEY = 'daily_challenge_state'

interface ChallengeState {
  date: string
  challengeIds: string[]
  completed: string[]
  locked: string[]
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function getDailyChallenges(dateStr: string, count = 5): Challenge[] {
  const seed = dateStr.replace(/-/g, '').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0)
  const rng = seededRandom(seed)
  const shuffled = [...ALL_CHALLENGES].sort(() => rng() - 0.5)
  // Ensure at least one from each category
  const result: Challenge[] = []
  const cats = ['health', 'mind', 'work', 'social', 'growth']
  cats.forEach(cat => {
    const c = shuffled.find(ch => ch.category === cat && !result.includes(ch))
    if (c) result.push(c)
  })
  while (result.length < count) {
    const c = shuffled.find(ch => !result.includes(ch))
    if (c) result.push(c)
    else break
  }
  return result
}

export default function DailyChallenge() {
  const today = getTodayKey()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [totalXp, setTotalXp] = useState(0)
  const [celebrationMsg, setCelebrationMsg] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    let state: ChallengeState | null = null
    if (stored) {
      try {
        state = JSON.parse(stored)
        if (state?.date !== today) state = null
      } catch { state = null }
    }

    const todayChallenges = getDailyChallenges(today, 5)
    setChallenges(todayChallenges)

    if (state) {
      setCompleted(new Set(state.completed))
      setLocked(new Set(state.locked))
      const xp = todayChallenges.filter(c => state!.completed.includes(c.id)).reduce((s, c) => s + c.xp, 0)
      setTotalXp(xp)
    }
  }, [today])

  const persist = (comp: Set<string>, lock: Set<string>) => {
    const state: ChallengeState = {
      date: today,
      challengeIds: challenges.map(c => c.id),
      completed: [...comp],
      locked: [...lock],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  const toggle = (challenge: Challenge) => {
    if (locked.has(challenge.id)) return
    const newComp = new Set(completed)
    if (newComp.has(challenge.id)) {
      newComp.delete(challenge.id)
    } else {
      newComp.add(challenge.id)
      // Celebrate hard challenges
      if (challenge.difficulty === 3) {
        setCelebrationMsg(`💀 Hardcore! You completed "${challenge.title}" — ${challenge.xp} XP earned!`)
        setTimeout(() => setCelebrationMsg(''), 4000)
      }
    }
    const xp = challenges.filter(c => newComp.has(c.id)).reduce((s, c) => s + c.xp, 0)
    setCompleted(newComp)
    setTotalXp(xp)
    persist(newComp, locked)

    if (newComp.size === challenges.length) {
      setCelebrationMsg(`🏆 ALL CHALLENGES COMPLETE! ${xp} total XP earned! You are elite!`)
    }
  }

  const completedCount = completed.size
  const allDone = completedCount === challenges.length && challenges.length > 0
  const pct = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Swords className="w-8 h-8 text-red-400" />
          Daily Challenges
        </h1>
        <p className="text-slate-400 mt-1">Five fresh challenges every day. Push your limits.</p>
      </div>

      {/* Celebration */}
      {celebrationMsg && (
        <div className="game-card p-4 border border-yellow-500/40 bg-yellow-900/10 text-center text-yellow-300 font-semibold animate-pulse">
          {celebrationMsg}
        </div>
      )}

      {/* Progress summary */}
      <div className="game-card p-5 flex items-center gap-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={allDone ? '#22c55e' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${pct * 0.94} 94`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            {completedCount}/{challenges.length}
          </div>
        </div>
        <div className="flex-1">
          <div className={`font-bold text-lg ${allDone ? 'text-green-400' : 'text-slate-200'}`}>
            {allDone ? '🏆 All Challenges Conquered!' : `${challenges.length - completedCount} challenge${challenges.length - completedCount !== 1 ? 's' : ''} remaining`}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{totalXp} XP</span>
            <span className="text-slate-500 text-sm">earned today</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">New challenges unlock at midnight</div>
        </div>
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {challenges.map((ch) => (
          <button
            key={ch.id}
            onClick={() => toggle(ch)}
            className={`w-full text-left game-card p-4 border transition-all ${
              completed.has(ch.id)
                ? 'opacity-60 border-green-500/30 bg-green-900/10'
                : CAT_COLORS[ch.category]
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {completed.has(ch.id)
                  ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                  : <Circle className="w-6 h-6 text-slate-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">{CAT_ICONS[ch.category]}</span>
                  <span className={`font-semibold ${completed.has(ch.id) ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {ch.title}
                  </span>
                  <span className={`text-xs ${DIFF_COLORS[ch.difficulty]}`}>{DIFF_LABELS[ch.difficulty]}</span>
                </div>
                <div className="text-sm text-slate-400 mt-0.5">{ch.description}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs font-medium ${CAT_TEXT[ch.category]}`}>{ch.category}</span>
                  <span className="text-xs text-slate-500">Target: {ch.target}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-yellow-400">+{ch.xp}</div>
                <div className="text-xs text-slate-500">XP</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Streak info */}
      <div className="game-card p-4 border border-orange-500/20 bg-orange-900/5">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-sm font-semibold text-slate-200">Complete all 5 to build your challenge streak</div>
            <div className="text-xs text-slate-500 mt-0.5">Earn bonus XP multipliers for consecutive days</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-violet-400" />
          <h4 className="text-sm font-semibold text-slate-300">How It Works</h4>
        </div>
        <div className="space-y-1 text-xs text-slate-500">
          <div>→ 5 unique challenges generated fresh every day</div>
          <div>→ Tap to mark complete — your progress is saved locally</div>
          <div>→ Challenges span all 5 life categories</div>
          <div>→ Hard challenges (💀) award the most XP but require real effort</div>
          <div>→ Completing all 5 is an elite feat — don't leave XP on the table</div>
        </div>
      </div>
    </div>
  )
}

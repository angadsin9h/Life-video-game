import { useState, useEffect } from 'react'
import { Brain, RefreshCw, CheckCircle2, ChevronRight, Flame, BookOpen, MessageSquare } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ReflectionEntry {
  id: string
  date: string
  prompt: string
  response: string
  reflectionScore: number
}

const PROMPTS = [
  'What did you do today that your future self will thank you for?',
  'What belief did you challenge today?',
  'Who did you show up for, and how?',
  'What fear did you face, even slightly?',
  'What would you do differently if you had today again?',
  'What are you tolerating that you shouldn\'t be?',
  'What are you not saying that needs to be said?',
  'Where are you playing small right now?',
  'What would you do if you knew you couldn\'t fail?',
  'What is the story you keep telling yourself that holds you back?',
  'What do you need to forgive yourself for?',
  'What evidence do you have that you are growing?',
  'What conversation are you avoiding?',
  'What would the best version of you do right now?',
  'What are you most proud of from the last 7 days?',
  'What boundary do you need to enforce or create?',
  'What does your body know that your mind is ignoring?',
  'What is the kindest thing you could do for yourself today?',
  'What habit would change everything if you mastered it?',
  'What legacy are you building with your daily choices?',
]

const STORAGE_KEY = 'reflection_engine_log'

function loadEntries(): ReflectionEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

export default function ReflectionEngine() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ReflectionEntry[]>(loadEntries)
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0])
  const [response, setResponse] = useState('')
  const [recentPrompts, setRecentPrompts] = useState<string[]>([PROMPTS[0]])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getNewPrompt = () => {
    const available = PROMPTS.filter(p => !recentPrompts.slice(-5).includes(p))
    const pool = available.length > 0 ? available : PROMPTS
    const next = pool[Math.floor(Math.random() * pool.length)]
    setCurrentPrompt(next)
    setRecentPrompts(prev => [...prev.slice(-4), next])
    setResponse('')
  }

  const handleSave = () => {
    if (!response.trim()) return
    const score = Math.min(response.length / 20, 10)
    const entry: ReflectionEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      prompt: currentPrompt,
      response,
      reflectionScore: parseFloat(score.toFixed(1)),
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
    setResponse('')
    getNewPrompt()
    toastSuccess('Reflection saved!', `Depth score: ${score.toFixed(1)}/10`)
  }

  // Streak
  const today = new Date().toISOString().split('T')[0]
  const uniqueDays = [...new Set(entries.map(e => e.date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    if (uniqueDays[i] === expected.toISOString().split('T')[0]) streak++
    else break
  }

  const avgLength = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.response.length, 0) / entries.length)
    : 0

  const last5 = entries.slice(0, 5)
  const depthScore = Math.min(response.length / 20, 10)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-violet-300 flex items-center gap-2">
            <Brain className="w-6 h-6" /> Reflection Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Deep reflection to unlock your best self</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-orange-300 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" /> {streak}
            </div>
            <div className="text-xs text-slate-400">Day Streak</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-violet-300">{entries.length}</div>
            <div className="text-xs text-slate-400">Total Reflections</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-blue-300">{avgLength}</div>
            <div className="text-xs text-slate-400">Avg Length</div>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="game-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs text-violet-400 font-semibold mb-2 uppercase tracking-wider">Today's Prompt</div>
              <p className="text-lg font-semibold text-slate-100 leading-snug">
                "{currentPrompt}"
              </p>
            </div>
            <button
              onClick={getNewPrompt}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> New Prompt
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 flex justify-between">
              <span>Your Reflection</span>
              <span className={`font-semibold ${depthScore >= 8 ? 'text-green-400' : depthScore >= 5 ? 'text-blue-400' : 'text-slate-500'}`}>
                Depth: {depthScore.toFixed(1)}/10
              </span>
            </label>
            <textarea
              className="game-input w-full min-h-[140px] resize-none"
              placeholder="Write your reflection here... The more depth, the higher your score."
              value={response}
              onChange={e => setResponse(e.target.value)}
            />
            {response.length > 0 && (
              <div className="mt-1 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${Math.min(depthScore * 10, 100)}%` }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!response.trim()}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Reflection
          </button>
        </div>

        {/* Last 5 Reflections */}
        {last5.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4" /> Recent Reflections
            </h2>
            <div className="space-y-2">
              {last5.map(e => {
                const isExpanded = expandedId === e.id
                return (
                  <div key={e.id} className="border border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-700/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">
                          "{e.prompt.slice(0, 50)}{e.prompt.length > 50 ? '...' : ''}"
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{e.date}</span>
                          <span className="text-xs text-violet-400">Score: {e.reflectionScore}/10</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-slate-700 pt-3">
                        <p className="text-xs text-violet-300 mb-2 italic">"{e.prompt}"</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{e.response}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">{e.response.length} characters</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            Start your first reflection above to track your growth journey.
          </div>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { BookOpen, RefreshCw, Save, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Reflection {
  id: string
  date: string
  prompt: string
  category: string
  response: string
  mood?: number
}

const PROMPT_SETS: { category: string; color: string; emoji: string; prompts: string[] }[] = [
  {
    category: 'Self-Awareness',
    color: '#8b5cf6',
    emoji: '🔍',
    prompts: [
      "What emotion am I avoiding right now, and why?",
      "What story am I telling myself that might not be true?",
      "What behavior of mine do I want to change most right now?",
      "When did I feel most like myself this week?",
      "What am I seeking external validation for that I could give myself?",
      "What's my relationship with failure right now?",
      "How do I respond when things don't go my way? Is that who I want to be?",
    ],
  },
  {
    category: 'Growth',
    color: '#22c55e',
    emoji: '🌱',
    prompts: [
      "What is the hardest truth I need to face right now?",
      "What skill, if I developed it, would change my life most?",
      "What's the gap between who I am and who I want to be?",
      "What would I do if I knew I couldn't fail?",
      "What comfort zone is preventing me from growing?",
      "What lesson has life been trying to teach me that I keep resisting?",
      "What would I need to believe to achieve my biggest goal?",
    ],
  },
  {
    category: 'Relationships',
    color: '#ec4899',
    emoji: '❤️',
    prompts: [
      "Who in my life deserves more of my time and energy?",
      "What would the people closest to me say my best quality is? My worst?",
      "Where do I show up inconsistently in my relationships?",
      "Who do I need to forgive, and what's stopping me?",
      "What relationship pattern keeps repeating in my life?",
      "Am I as good a friend as I want others to be to me?",
      "What do I need to communicate that I've been avoiding?",
    ],
  },
  {
    category: 'Purpose',
    color: '#f97316',
    emoji: '🌟',
    prompts: [
      "What does a meaningful life look like to me, specifically?",
      "Am I spending my time on what actually matters to me?",
      "What would I regret not doing if my life ended in a year?",
      "What are my non-negotiable values? Am I living by them?",
      "What legacy do I want to leave?",
      "If money weren't a factor, how would I spend my days?",
      "What contribution am I uniquely positioned to make to the world?",
    ],
  },
  {
    category: 'Present Moment',
    color: '#14b8a6',
    emoji: '🧘',
    prompts: [
      "What is going right in my life that I'm not appreciating?",
      "What small thing brought me genuine joy today?",
      "Where is my mind when my body is here?",
      "What would it feel like to fully accept this moment as it is?",
      "What beauty have I been walking past without noticing?",
      "If this were the last day of this chapter of my life, how would I spend it?",
      "What am I taking for granted that I would miss if it were gone?",
    ],
  },
  {
    category: 'Challenges',
    color: '#ef4444',
    emoji: '⚡',
    prompts: [
      "What is my biggest challenge right now, and what's one step toward it?",
      "What fear is driving my decisions that I haven't acknowledged?",
      "What problem in my life am I letting become my identity?",
      "What would solving my current challenge require me to give up?",
      "Where am I playing it safe when I should be taking a risk?",
      "What decision have I been delaying, and what's the cost of not deciding?",
      "What would I do about this problem if I were 10x braver?",
    ],
  },
]

const ALL_PROMPTS = PROMPT_SETS.flatMap(s => s.prompts.map(p => ({ prompt: p, category: s.category, color: s.color, emoji: s.emoji })))

const STORAGE_KEY = 'reflection_entries'

function loadReflections(): Reflection[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveReflections(rs: Reflection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rs))
}

export default function ReflectionPrompts() {
  const { toastSuccess } = useToast()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0)
  const [response, setResponse] = useState('')
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState<'write' | 'history'>('write')
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)

  useEffect(() => {
    setReflections(loadReflections())
    setCurrentPromptIdx(dayOfYear % ALL_PROMPTS.length)
  }, [])

  const currentPromptData = ALL_PROMPTS[currentPromptIdx]

  const shuffle = () => {
    const idx = Math.floor(Math.random() * ALL_PROMPTS.length)
    setCurrentPromptIdx(idx)
    setResponse('')
    setSaved(false)
  }

  const prev = () => {
    setCurrentPromptIdx(i => (i - 1 + ALL_PROMPTS.length) % ALL_PROMPTS.length)
    setResponse('')
    setSaved(false)
  }
  const next = () => {
    setCurrentPromptIdx(i => (i + 1) % ALL_PROMPTS.length)
    setResponse('')
    setSaved(false)
  }

  const save = () => {
    if (!response.trim()) return
    const entry: Reflection = {
      id: Date.now().toString(),
      date: today,
      prompt: currentPromptData.prompt,
      category: currentPromptData.category,
      response,
      mood,
    }
    const updated = [entry, ...loadReflections()]
    saveReflections(updated)
    setReflections(updated)
    setSaved(true)
    toastSuccess('Reflection saved!')
  }

  const displayed = filterCat ? reflections.filter(r => r.category === filterCat) : reflections

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-teal-400" />
            Deep Reflection
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Thought-provoking prompts for self-discovery</p>
        </div>
        <div className="flex gap-1">
          {(['write', 'history'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${view === v ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'write' && (
        <div className="space-y-4">
          {/* Prompt card */}
          <div className="game-card p-6 space-y-4" style={{ borderTop: `3px solid ${currentPromptData.color}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentPromptData.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: currentPromptData.color }}>
                  {currentPromptData.category}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prev} className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={shuffle} className="p-1.5 text-slate-600 hover:text-teal-400 transition-colors" title="Random prompt">
                  <Shuffle className="w-4 h-4" />
                </button>
                <button onClick={next} className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white leading-snug">"{currentPromptData.prompt}"</h2>
            <div className="text-xs text-slate-600">{currentPromptIdx + 1} / {ALL_PROMPTS.length} prompts</div>
          </div>

          {/* Response area */}
          <div className="space-y-3">
            <textarea value={response} onChange={e => { setResponse(e.target.value); setSaved(false) }}
              placeholder="Take your time. Write freely, without editing yourself. There are no wrong answers here..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm leading-relaxed placeholder-slate-700 focus:outline-none focus:border-teal-500/30 resize-none h-52"
            />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Mood:</span>
                <div className="flex gap-1">
                  {['😢', '😕', '😐', '🙂', '😄'].map((e, i) => (
                    <button key={i} onClick={() => setMood(i + 1)}
                      className={`text-xl transition-all ${mood === i + 1 ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={save} disabled={!response.trim() || saved}
                className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-teal-600 hover:bg-teal-500 text-white'} disabled:opacity-50`}>
                <Save className="w-4 h-4" />
                {saved ? 'Saved ✓' : 'Save Reflection'}
              </button>
            </div>
          </div>

          {/* Category pick */}
          <div className="game-card p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Browse by Category</h3>
            <div className="grid grid-cols-3 gap-2">
              {PROMPT_SETS.map(s => (
                <button key={s.category}
                  onClick={() => {
                    const idx = ALL_PROMPTS.findIndex(p => p.category === s.category)
                    if (idx >= 0) { setCurrentPromptIdx(idx); setResponse(''); setSaved(false) }
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-center transition-colors">
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="text-xs text-slate-400">{s.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{reflections.length} reflections saved</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterCat(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!filterCat ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              All
            </button>
            {PROMPT_SETS.filter(s => reflections.some(r => r.category === s.category)).map(s => (
              <button key={s.category} onClick={() => setFilterCat(filterCat === s.category ? null : s.category)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={filterCat === s.category
                  ? { background: s.color + '33', color: s.color, border: `1px solid ${s.color}` }
                  : { background: '#1e293b', color: '#94a3b8' }
                }>
                {s.emoji} {s.category}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayed.map(r => {
              const ps = PROMPT_SETS.find(s => s.category === r.category)
              const moodEmojis = ['😢', '😕', '😐', '🙂', '😄']
              return (
                <div key={r.id} className="game-card p-4 space-y-2" style={{ borderLeft: `3px solid ${ps?.color || '#94a3b8'}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{ps?.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: ps?.color }}>{r.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      {r.mood && <span>{moodEmojis[r.mood - 1]}</span>}
                      <span>{r.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{r.prompt}"</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{r.response}</p>
                </div>
              )
            })}
          </div>

          {displayed.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>No reflections yet. Start writing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

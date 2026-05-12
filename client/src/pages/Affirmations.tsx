import { useEffect, useState, useCallback } from 'react'
import { Sparkles, RefreshCw, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react'

const AFFIRMATIONS = [
  // Identity
  "I am the architect of my own life — every day I build something greater.",
  "I am disciplined, focused, and committed to my growth.",
  "I am exactly where I need to be, moving exactly where I want to go.",
  "I am becoming the best version of myself, one habit at a time.",
  "I am worthy of the success I am working toward.",
  // Action
  "Every small action I take is compounding into something extraordinary.",
  "I show up even when it's hard — that's what separates me from the rest.",
  "I do what others won't today, so I can have what others can't tomorrow.",
  "My consistency is my superpower. I don't stop.",
  "I take one step forward every single day, no matter what.",
  // Mindset
  "Challenges sharpen me. Resistance builds me. Setbacks teach me.",
  "I am in a war with yesterday's version of myself — and I'm winning.",
  "I don't negotiate with excuses. I get things done.",
  "My mind is clear, my goals are set, my focus is unbreakable.",
  "Progress, not perfection — I celebrate every step forward.",
  // Wellbeing
  "I fuel my body like the high-performance machine it is.",
  "Rest is part of my growth, not the absence of it.",
  "I am grateful for this body that allows me to pursue my dreams.",
  "I protect my energy for what truly matters.",
  "I sleep, recover, and return stronger every single day.",
  // Relationships
  "I invest in the people who make me better — and I make them better too.",
  "I lead by example: in discipline, in kindness, in character.",
  "My presence adds value to every room I enter.",
  // Vision
  "I can see the future version of me — and I'm becoming that person now.",
  "Success is inevitable when you're consistent. I am consistent.",
  "I am building a life that will make my future self proud.",
  "Every log entry, every habit checked, every intention set — it all matters.",
  "The gap between who I am and who I want to be closes every single day.",
  "I play the long game. I am patient, persistent, and unstoppable.",
  "I don't just dream about my best life. I live it deliberately, daily.",
]

const CATEGORIES = [
  { label: 'All',        filter: null },
  { label: 'Identity',   filter: 0 },
  { label: 'Action',     filter: 1 },
  { label: 'Mindset',    filter: 2 },
  { label: 'Wellbeing',  filter: 3 },
  { label: 'Vision',     filter: 4 },
]

const CAT_RANGES = [[0, 5], [5, 10], [10, 15], [15, 20], [25, 30]]

function getDayAffirmations(date: string): string[] {
  const seed = date.split('-').reduce((s, p) => s + parseInt(p), 0)
  const shuffled = [...AFFIRMATIONS]
  // Deterministic Fisher-Yates using seed
  let s = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 5)
}

function today() { return new Date().toISOString().split('T')[0] }

export default function Affirmations() {
  const todayStr = today()
  const [dayAffirmations] = useState(() => getDayAffirmations(todayStr))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('affirmation_favorites') ?? '[]') } catch { return [] }
  })
  const [spoken, setSpoken] = useState(false)
  const [catFilter, setCatFilter] = useState<number | null>(null)

  const allFiltered = catFilter !== null
    ? AFFIRMATIONS.slice(...CAT_RANGES[catFilter])
    : AFFIRMATIONS
  const browsingAll = true

  const saveFavorites = (favs: string[]) => {
    setFavorites(favs)
    localStorage.setItem('affirmation_favorites', JSON.stringify(favs))
  }

  const toggleFavorite = (text: string) => {
    if (favorites.includes(text)) saveFavorites(favorites.filter(f => f !== text))
    else saveFavorites([...favorites, text])
  }

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.85
    utter.pitch = 1.0
    utter.volume = 1
    window.speechSynthesis.speak(utter)
    setSpoken(true)
    setTimeout(() => setSpoken(false), 3000)
  }, [])

  // Auto-speak current affirmation when changed
  const current = dayAffirmations[currentIdx]

  const QUOTE_COLORS = [
    'from-violet-900/30 to-slate-900 border-violet-500/30',
    'from-cyan-900/30 to-slate-900 border-cyan-500/30',
    'from-orange-900/30 to-slate-900 border-orange-500/30',
    'from-green-900/30 to-slate-900 border-green-500/30',
    'from-pink-900/30 to-slate-900 border-pink-500/30',
  ]

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sparkles className="w-8 h-8 text-yellow-400" />
          Affirmations
        </h1>
        <p className="text-slate-400 mt-1">5 affirmations selected just for today — speak them aloud</p>
      </div>

      {/* Today's featured affirmation */}
      <div className={`game-card p-7 bg-gradient-to-br ${QUOTE_COLORS[currentIdx]} border text-center relative min-h-[180px] flex flex-col items-center justify-center`}>
        <div className="text-4xl mb-4 opacity-20 absolute top-4 left-5 font-serif">"</div>
        <p className="text-lg font-medium text-slate-100 leading-relaxed z-10 px-4">
          {current}
        </p>
        <div className="text-4xl mb-4 opacity-20 absolute bottom-2 right-5 font-serif">"</div>

        <div className="flex items-center gap-3 mt-6 z-10">
          <button
            onClick={() => toggleFavorite(current)}
            className={`transition-colors ${favorites.includes(current) ? 'text-pink-400' : 'text-slate-600 hover:text-pink-400'}`}
            title="Save to favorites"
          >
            <Heart className="w-5 h-5" fill={favorites.includes(current) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => speak(current)}
            disabled={spoken}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${spoken ? 'bg-green-700 text-green-200' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            {spoken ? '🎤 Speaking…' : '🔊 Read Aloud'}
          </button>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {dayAffirmations.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIdx ? 'bg-violet-500 scale-125' : 'bg-slate-600 hover:bg-slate-400'}`}
          />
        ))}
        <button
          onClick={() => setCurrentIdx(i => Math.min(dayAffirmations.length - 1, i + 1))}
          disabled={currentIdx === dayAffirmations.length - 1}
          className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* All 5 for today */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-3 text-sm uppercase tracking-wider">Today's Set</h3>
        <div className="space-y-3">
          {dayAffirmations.map((aff, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                idx === currentIdx ? 'bg-violet-900/20 border border-violet-500/30' : 'hover:bg-slate-800'
              }`}
            >
              <span className={`text-sm font-bold mt-0.5 w-5 text-center ${idx === currentIdx ? 'text-violet-400' : 'text-slate-600'}`}>
                {idx + 1}
              </span>
              <p className={`text-sm flex-1 ${idx === currentIdx ? 'text-slate-200' : 'text-slate-400'}`}>{aff}</p>
              <button
                onClick={e => { e.stopPropagation(); toggleFavorite(aff) }}
                className={`flex-shrink-0 transition-colors ${favorites.includes(aff) ? 'text-pink-400' : 'text-slate-700 hover:text-pink-400'}`}
              >
                <Heart className="w-4 h-4" fill={favorites.includes(aff) ? 'currentColor' : 'none'} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Your Favorites ({favorites.length})
          </h3>
          <div className="space-y-2">
            {favorites.map((fav, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-pink-900/10 border border-pink-500/20 rounded-xl">
                <p className="text-sm text-slate-300 flex-1">{fav}</p>
                <button
                  onClick={() => toggleFavorite(fav)}
                  className="text-pink-400 hover:text-slate-500 transition-colors flex-shrink-0"
                >
                  <Heart className="w-4 h-4" fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Morning ritual tip */}
      <div className="text-center text-xs text-slate-700 space-y-1 pb-4">
        <p>💡 Read each affirmation aloud 3 times for maximum effect</p>
        <p>New set of 5 every morning — build the ritual</p>
      </div>
    </div>
  )
}

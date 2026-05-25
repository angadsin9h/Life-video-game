import { useState, useEffect } from 'react'
import { Flame, Brain, Zap, Star, ArrowRight, TrendingUp, Hash, Sparkles } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'emotional_alchemy_log'

const RAW_EMOTIONS = [
  'Anger', 'Fear', 'Sadness', 'Shame', 'Guilt', 'Jealousy',
  'Resentment', 'Anxiety', 'Loneliness', 'Grief', 'Boredom', 'Confusion', 'Overwhelm',
]

const AFTER_EMOTIONS = [
  'Clarity', 'Strength', 'Compassion', 'Motivation', 'Acceptance',
  'Gratitude', 'Peace', 'Determination', 'Wisdom', 'Release',
]

const EMOTION_COLORS: Record<string, string> = {
  Anger: 'red', Fear: 'purple', Sadness: 'blue', Shame: 'rose',
  Guilt: 'orange', Jealousy: 'yellow', Resentment: 'amber',
  Anxiety: 'violet', Loneliness: 'indigo', Grief: 'slate',
  Boredom: 'gray', Confusion: 'teal', Overwhelm: 'pink',
}

const AFTER_COLORS: Record<string, string> = {
  Clarity: 'sky', Strength: 'green', Compassion: 'pink', Motivation: 'orange',
  Acceptance: 'teal', Gratitude: 'amber', Peace: 'blue', Determination: 'violet',
  Wisdom: 'purple', Release: 'emerald',
}

interface AlchemyEntry {
  id: string
  date: string
  rawEmotion: string
  intensity: number
  trigger: string
  bodyLocation: string
  whatItNeeds: string
  hiddenGift: string
  alchemyAction: string
  emotionAfterAlchemy: string
  alchemyScore: number
}

function calcScore(intensity: number, hiddenGift: string): number {
  const raw = (10 - intensity) + hiddenGift.length / 10
  return Math.round(Math.min(10, Math.max(1, raw)) * 10)
}

function loadLog(): AlchemyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AlchemyEntry[]
  } catch {
    return []
  }
}

function saveLog(entries: AlchemyEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function topWords(texts: string[]): [string, number][] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'it', 'i', 'my', 'me', 'this', 'that', 'it', 'its'])
  const freq: Record<string, number> = {}
  texts.forEach(t => {
    t.toLowerCase().split(/\s+/).forEach(w => {
      const clean = w.replace(/[^a-z]/g, '')
      if (clean.length > 3 && !stopWords.has(clean)) {
        freq[clean] = (freq[clean] || 0) + 1
      }
    })
  })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

function mostCommon(arr: string[]): string {
  if (!arr.length) return '-'
  const freq: Record<string, number> = {}
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
}

export default function EmotionalAlchemy() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<AlchemyEntry[]>([])

  const [rawEmotion, setRawEmotion] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [trigger, setTrigger] = useState('')
  const [bodyLocation, setBodyLocation] = useState('')
  const [whatItNeeds, setWhatItNeeds] = useState('')
  const [hiddenGift, setHiddenGift] = useState('')
  const [alchemyAction, setAlchemyAction] = useState('')
  const [emotionAfterAlchemy, setEmotionAfterAlchemy] = useState('')

  useEffect(() => {
    setLog(loadLog())
  }, [])

  const score = calcScore(intensity, hiddenGift)

  function handleSave() {
    if (!rawEmotion || !hiddenGift.trim() || !alchemyAction.trim()) return
    const entry: AlchemyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      rawEmotion, intensity, trigger, bodyLocation,
      whatItNeeds, hiddenGift, alchemyAction, emotionAfterAlchemy,
      alchemyScore: score,
    }
    const updated = [entry, ...log]
    saveLog(updated)
    setLog(updated)
    toastSuccess('Alchemy Complete', `Score: ${score}/100`)
    setRawEmotion('')
    setIntensity(5)
    setTrigger('')
    setBodyLocation('')
    setWhatItNeeds('')
    setHiddenGift('')
    setAlchemyAction('')
    setEmotionAfterAlchemy('')
  }

  const mostAlchemized = mostCommon(log.map(e => e.rawEmotion))
  const giftWords = topWords(log.map(e => e.hiddenGift))
  const last5 = log.slice(0, 5)
  const colorKey = EMOTION_COLORS[rawEmotion] || 'violet'

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Emotional Alchemy</h1>
            <p className="text-slate-400 text-sm">Transform difficult emotions into wisdom and fuel</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="game-card text-center">
            <Flame className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{log.length}</div>
            <div className="text-xs text-slate-400">Sessions</div>
          </div>
          <div className="game-card text-center">
            <Brain className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-violet-300 truncate">{mostAlchemized}</div>
            <div className="text-xs text-slate-400">Most Alchemized</div>
          </div>
          <div className="game-card text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-300">
              {log.length ? Math.round(log.reduce((s, e) => s + e.alchemyScore, 0) / log.length) : 0}
            </div>
            <div className="text-xs text-slate-400">Avg Score</div>
          </div>
        </div>

        {/* Form */}
        <div className="game-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> New Alchemy Session
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Raw Emotion</label>
                <select
                  className="game-input w-full"
                  value={rawEmotion}
                  onChange={e => setRawEmotion(e.target.value)}
                >
                  <option value="">Select emotion...</option>
                  {RAW_EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Intensity: {intensity}/10</label>
                <input
                  type="range" min={1} max={10}
                  className="w-full mt-2 accent-violet-500"
                  value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Mild</span><span>Intense</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">What triggered this?</label>
              <input
                className="game-input w-full"
                placeholder="What caused this emotion?"
                value={trigger}
                onChange={e => setTrigger(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Where do you feel it in your body?</label>
              <input
                className="game-input w-full"
                placeholder="Chest, throat, stomach..."
                value={bodyLocation}
                onChange={e => setBodyLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">What is this emotion asking for?</label>
              <input
                className="game-input w-full"
                placeholder="What does it need?"
                value={whatItNeeds}
                onChange={e => setWhatItNeeds(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Hidden Gift Inside This Emotion *</label>
              <input
                className="game-input w-full"
                placeholder="What wisdom or strength lives inside this?"
                value={hiddenGift}
                onChange={e => setHiddenGift(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Alchemy Action *</label>
              <input
                className="game-input w-full"
                placeholder="How will you transform this into something useful?"
                value={alchemyAction}
                onChange={e => setAlchemyAction(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Emotion After Alchemy</label>
              <select
                className="game-input w-full"
                value={emotionAfterAlchemy}
                onChange={e => setEmotionAfterAlchemy(e.target.value)}
              >
                <option value="">Select transformed state...</option>
                {AFTER_EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>

            {/* Score preview */}
            {(rawEmotion || hiddenGift) && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2">
                  {rawEmotion && (
                    <span className={`px-2 py-1 rounded-full text-xs bg-${colorKey}-500/20 text-${colorKey}-300`}>
                      {rawEmotion}
                    </span>
                  )}
                  {rawEmotion && emotionAfterAlchemy && <ArrowRight className="w-4 h-4 text-slate-500" />}
                  {emotionAfterAlchemy && (
                    <span className={`px-2 py-1 rounded-full text-xs bg-${AFTER_COLORS[emotionAfterAlchemy] || 'green'}-500/20 text-${AFTER_COLORS[emotionAfterAlchemy] || 'green'}-300`}>
                      {emotionAfterAlchemy}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-violet-300">{score}</div>
                  <div className="text-xs text-slate-400">Alchemy Score</div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!rawEmotion || !hiddenGift.trim() || !alchemyAction.trim()}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Complete Alchemy
            </button>
          </div>
        </div>

        {/* Top hidden gifts */}
        {giftWords.length > 0 && (
          <div className="game-card mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" /> Top Hidden Gifts Discovered
            </h3>
            <div className="flex flex-wrap gap-2">
              {giftWords.map(([word, count]) => (
                <span key={word} className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-sm">
                  {word} <span className="text-xs text-amber-500">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last 5 entries */}
        {last5.length > 0 && (
          <div className="game-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Recent Alchemies
            </h3>
            <div className="space-y-3">
              {last5.map(entry => (
                <div key={entry.id} className="p-3 rounded-lg bg-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-300">{entry.rawEmotion}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-sm font-medium text-green-300">{entry.emotionAfterAlchemy || '?'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">intensity {entry.intensity}/10</span>
                      <span className="text-xs font-bold text-violet-300">Score: {entry.alchemyScore}</span>
                    </div>
                  </div>
                  {entry.hiddenGift && (
                    <p className="text-xs text-slate-300 italic">"{entry.hiddenGift}"</p>
                  )}
                  <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

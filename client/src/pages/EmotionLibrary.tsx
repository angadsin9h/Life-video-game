import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EmotionValence = 'positive' | 'negative' | 'neutral' | 'complex'
type EmotionCategory = 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'surprise' | 'trust' | 'anticipation' | 'shame' | 'pride' | 'love' | 'other'

interface EmotionEntry {
  id: string
  emotion: string
  category: EmotionCategory
  valence: EmotionValence
  definition: string
  bodySensation: string
  triggers: string
  needs: string
  healthyExpression: string
  unhealthyPattern: string
  intensity: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<EmotionCategory, { label: string; emoji: string; color: string }> = {
  joy:          { label: 'Joy',          emoji: '😊', color: '#f59e0b' },
  sadness:      { label: 'Sadness',      emoji: '😢', color: '#3b82f6' },
  anger:        { label: 'Anger',        emoji: '😠', color: '#ef4444' },
  fear:         { label: 'Fear',         emoji: '😰', color: '#8b5cf6' },
  disgust:      { label: 'Disgust',      emoji: '🤢', color: '#84cc16' },
  surprise:     { label: 'Surprise',     emoji: '😲', color: '#f97316' },
  trust:        { label: 'Trust',        emoji: '🤝', color: '#22c55e' },
  anticipation: { label: 'Anticipation', emoji: '🤩', color: '#eab308' },
  shame:        { label: 'Shame',        emoji: '😔', color: '#94a3b8' },
  pride:        { label: 'Pride',        emoji: '🦁', color: '#a855f7' },
  love:         { label: 'Love',         emoji: '❤️', color: '#ec4899' },
  other:        { label: 'Other',        emoji: '💭', color: '#6366f1' },
}

const EMOTION_EXAMPLES = ['Serenity', 'Ecstasy', 'Vigilance', 'Rage', 'Loathing', 'Grief', 'Terror', 'Amazement', 'Admiration', 'Contempt', 'Annoyance', 'Boredom', 'Anticipation', 'Apprehension', 'Pensiveness', 'Disgust', 'Melancholy', 'Longing', 'Nostalgia', 'Awe', 'Envy', 'Gratitude', 'Contentment']

const STORAGE_KEY = 'emotion_library'

export default function EmotionLibrary() {
  const { toastSuccess } = useToast()
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<EmotionEntry, 'id' | 'createdAt'>>({
    emotion: '', category: 'joy', valence: 'positive', definition: '',
    bodySensation: '', triggers: '', needs: '', healthyExpression: '',
    unhealthyPattern: '', intensity: 5, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEmotions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EmotionEntry[]) => { setEmotions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.emotion.trim()) return
    const e: EmotionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...emotions])
    setForm(f => ({ ...f, emotion: '', definition: '', bodySensation: '', triggers: '', needs: '', healthyExpression: '', unhealthyPattern: '' }))
    setShowForm(false)
    toastSuccess('Emotion added to library ❤️')
  }

  const filteredEmos = emotions
    .filter(e => filterCat === 'all' || e.category === filterCat)
    .filter(e => !search || e.emotion.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Emotion Library
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your personal emotional vocabulary and awareness.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{emotions.length}</div>
          <div className="text-xs text-slate-500">Emotions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{emotions.filter(e => e.valence === 'positive').length}</div>
          <div className="text-xs text-slate-500">Positive</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{emotions.filter(e => e.valence === 'negative').length}</div>
          <div className="text-xs text-slate-500">Challenging</div>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search emotions..." className="game-input w-full" />

      {!showForm && emotions.length === 0 && (
        <div className="game-card p-3">
          <p className="text-xs text-slate-500 mb-2">Start with common emotions:</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_EXAMPLES.map(em => (
              <button key={em} onClick={() => { setForm(f => ({ ...f, emotion: em })); setShowForm(true) }}
                className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs hover:bg-slate-600">
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [EmotionCategory, typeof CAT_CONFIG.joy][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Emotion to Library</h3>
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Emotion name (e.g., Melancholy) *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EmotionCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [EmotionCategory, typeof CAT_CONFIG.joy][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.valence} onChange={e => setForm(f => ({ ...f, valence: e.target.value as EmotionValence }))} className="game-input text-sm flex-1">
              <option value="positive">Positive</option>
              <option value="negative">Challenging</option>
              <option value="neutral">Neutral</option>
              <option value="complex">Complex</option>
            </select>
          </div>
          <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
            placeholder="Your personal definition of this emotion..." className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.bodySensation} onChange={e => setForm(f => ({ ...f, bodySensation: e.target.value }))}
            placeholder="Where do you feel it in your body?" className="game-input w-full text-sm" />
          <input value={form.triggers} onChange={e => setForm(f => ({ ...f, triggers: e.target.value }))}
            placeholder="What triggers this emotion for you?" className="game-input w-full text-sm" />
          <input value={form.needs} onChange={e => setForm(f => ({ ...f, needs: e.target.value }))}
            placeholder="What need does it signal?" className="game-input w-full text-sm" />
          <input value={form.healthyExpression} onChange={e => setForm(f => ({ ...f, healthyExpression: e.target.value }))}
            placeholder="Healthy way to express it" className="game-input w-full text-sm" />
          <input value={form.unhealthyPattern} onChange={e => setForm(f => ({ ...f, unhealthyPattern: e.target.value }))}
            placeholder="Unhealthy pattern to watch for" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Current intensity: {form.intensity}/10</p>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredEmos.map(e => {
          const c = CAT_CONFIG[e.category]
          const isExp = expanded === e.id
          const valenceColor = e.valence === 'positive' ? '#22c55e' : e.valence === 'negative' ? '#ef4444' : e.valence === 'complex' ? '#a855f7' : '#94a3b8'
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{e.emotion}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: valenceColor + '20', color: valenceColor }}>{e.valence}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · intensity {e.intensity}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.definition && <p className="text-xs text-slate-300 italic">"{e.definition}"</p>}
                  {e.bodySensation && <p className="text-xs text-blue-300">🫁 Body: {e.bodySensation}</p>}
                  {e.triggers && <p className="text-xs text-orange-300">⚡ Triggers: {e.triggers}</p>}
                  {e.needs && <p className="text-xs text-yellow-300">💡 Signals need for: {e.needs}</p>}
                  {e.healthyExpression && <p className="text-xs text-green-300">✅ Express: {e.healthyExpression}</p>}
                  {e.unhealthyPattern && <p className="text-xs text-red-300">⚠️ Watch: {e.unhealthyPattern}</p>}
                  <button onClick={() => save(emotions.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filteredEmos.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The more emotions you can name, the better you can navigate them.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EmotionType = 'joy' | 'anger' | 'fear' | 'sadness' | 'disgust' | 'surprise' | 'love' | 'shame' | 'guilt' | 'anxiety'
type MasteryLevel = 'reactive' | 'aware' | 'pausing' | 'regulating' | 'mastered'

interface EmotionMasteryEntry {
  id: string
  emotion: EmotionType
  mastery: MasteryLevel
  trigger: string
  bodySensation: string
  thoughtPattern: string
  regulationUsed: string
  outcome: string
  lessonsLearned: string
  intensityBefore: number
  intensityAfter: number
  date: string
  createdAt: string
}

const EMOTION_CONFIG: Record<EmotionType, { label: string; emoji: string; color: string }> = {
  joy:      { label: 'Joy',      emoji: '😊', color: '#f59e0b' },
  anger:    { label: 'Anger',    emoji: '😠', color: '#ef4444' },
  fear:     { label: 'Fear',     emoji: '😨', color: '#6366f1' },
  sadness:  { label: 'Sadness',  emoji: '😢', color: '#3b82f6' },
  disgust:  { label: 'Disgust',  emoji: '🤢', color: '#22c55e' },
  surprise: { label: 'Surprise', emoji: '😲', color: '#a855f7' },
  love:     { label: 'Love',     emoji: '❤️', color: '#ec4899' },
  shame:    { label: 'Shame',    emoji: '😳', color: '#f97316' },
  guilt:    { label: 'Guilt',    emoji: '😔', color: '#94a3b8' },
  anxiety:  { label: 'Anxiety',  emoji: '😰', color: '#8b5cf6' },
}

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string }> = {
  reactive:   { label: 'Reactive',   color: '#ef4444' },
  aware:      { label: 'Aware',      color: '#f97316' },
  pausing:    { label: 'Pausing',    color: '#f59e0b' },
  regulating: { label: 'Regulating', color: '#3b82f6' },
  mastered:   { label: 'Mastered',   color: '#22c55e' },
}

const STORAGE_KEY = 'emotion_mastery_log'

export default function EmotionMastery() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EmotionMasteryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EmotionMasteryEntry, 'id' | 'createdAt'>>({
    emotion: 'anger', mastery: 'aware', trigger: '',
    bodySensation: '', thoughtPattern: '', regulationUsed: '',
    outcome: '', lessonsLearned: '', intensityBefore: 7, intensityAfter: 3,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EmotionMasteryEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.trigger.trim()) return
    const e: EmotionMasteryEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, trigger: '', bodySensation: '', thoughtPattern: '', regulationUsed: '', outcome: '', lessonsLearned: '' }))
    setShowForm(false)
    toastSuccess('Emotion mastery logged — every regulated emotion builds your EQ armor ❤️')
  }

  const mastered = entries.filter(e => e.mastery === 'mastered' || e.mastery === 'regulating').length
  const avgReduction = entries.length
    ? Math.round(entries.reduce((s, e) => s + (e.intensityBefore - e.intensityAfter), 0) / entries.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Emotion Mastery
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Master your emotional responses and build true EQ.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Episodes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{mastered}</div>
          <div className="text-xs text-slate-500">Regulated</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">-{avgReduction}</div>
          <div className="text-xs text-slate-500">Avg Reduction</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Emotion Episode</h3>
          <div className="flex gap-2">
            <select value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value as EmotionType }))} className="game-input text-sm flex-1">
              {(Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG.anger][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.mastery} onChange={e => setForm(f => ({ ...f, mastery: e.target.value as MasteryLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(MASTERY_CONFIG) as [MasteryLevel, typeof MASTERY_CONFIG.aware][]).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggered this emotion? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.bodySensation} onChange={e => setForm(f => ({ ...f, bodySensation: e.target.value }))}
            placeholder="Where did you feel it in your body?" className="game-input w-full text-sm" />
          <input value={form.thoughtPattern} onChange={e => setForm(f => ({ ...f, thoughtPattern: e.target.value }))}
            placeholder="What thoughts arose?" className="game-input w-full text-sm" />
          <input value={form.regulationUsed} onChange={e => setForm(f => ({ ...f, regulationUsed: e.target.value }))}
            placeholder="Regulation strategy you used" className="game-input w-full text-sm" />
          <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="How did it resolve?" className="game-input w-full text-sm" />
          <input value={form.lessonsLearned} onChange={e => setForm(f => ({ ...f, lessonsLearned: e.target.value }))}
            placeholder="Key lesson from this episode" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity before: {form.intensityBefore}/10</p>
              <input type="range" min={1} max={10} value={form.intensityBefore}
                onChange={e => setForm(f => ({ ...f, intensityBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity after: {form.intensityAfter}/10</p>
              <input type="range" min={1} max={10} value={form.intensityAfter}
                onChange={e => setForm(f => ({ ...f, intensityAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-rose-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const ec = EMOTION_CONFIG[e.emotion]
          const m = MASTERY_CONFIG[e.mastery]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${ec.color}` }}>
              <span className="text-2xl">{ec.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{ec.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: m.color + '20', color: m.color }}>{m.label}</span>
                  <span className="text-xs text-rose-400">{e.intensityBefore}→{e.intensityAfter}/10</span>
                </div>
                {e.trigger && <p className="text-xs text-slate-400 mt-1 line-clamp-1">Trigger: {e.trigger}</p>}
                {e.lessonsLearned && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.lessonsLearned}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Between stimulus and response is your freedom. Master that space.</p>
          </div>
        )}
      </div>
    </div>
  )
}

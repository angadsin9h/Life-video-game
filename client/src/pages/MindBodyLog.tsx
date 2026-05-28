import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BodySignal = 'tension' | 'tightness' | 'pain' | 'lightness' | 'warmth' | 'tingling' | 'heaviness' | 'openness' | 'constriction' | 'expansion'
type EmotionSource = 'anger' | 'fear' | 'sadness' | 'joy' | 'shame' | 'grief' | 'anxiety' | 'love' | 'excitement' | 'disgust'
type BodyArea = 'head' | 'throat' | 'chest' | 'stomach' | 'shoulders' | 'back' | 'hands' | 'legs' | 'whole-body' | 'heart-area'

interface MindBodyEntry {
  id: string
  bodySignal: BodySignal
  emotionSource: EmotionSource
  bodyArea: BodyArea
  whatHappened: string
  bodyDescription: string
  emotionalLink: string
  somaAction: string
  howItShifted: string
  awarenessScore: number
  date: string
  createdAt: string
}

const SIGNAL_CONFIG: Record<BodySignal, { label: string; emoji: string; color: string }> = {
  tension:     { label: 'Tension',     emoji: '😤', color: '#ef4444' },
  tightness:   { label: 'Tightness',   emoji: '🔒', color: '#f97316' },
  pain:        { label: 'Pain',        emoji: '💢', color: '#dc2626' },
  lightness:   { label: 'Lightness',   emoji: '🌤️', color: '#22c55e' },
  warmth:      { label: 'Warmth',      emoji: '☀️', color: '#f59e0b' },
  tingling:    { label: 'Tingling',    emoji: '✨', color: '#a855f7' },
  heaviness:   { label: 'Heaviness',   emoji: '⬇️', color: '#94a3b8' },
  openness:    { label: 'Openness',    emoji: '🌸', color: '#ec4899' },
  constriction:{ label: 'Constriction',emoji: '🌀', color: '#6366f1' },
  expansion:   { label: 'Expansion',   emoji: '🌊', color: '#3b82f6' },
}

const EMOTION_CONFIG: Record<EmotionSource, { label: string; emoji: string }> = {
  anger:     { label: 'Anger',     emoji: '😠' },
  fear:      { label: 'Fear',      emoji: '😨' },
  sadness:   { label: 'Sadness',   emoji: '😢' },
  joy:       { label: 'Joy',       emoji: '😊' },
  shame:     { label: 'Shame',     emoji: '😳' },
  grief:     { label: 'Grief',     emoji: '💔' },
  anxiety:   { label: 'Anxiety',   emoji: '😰' },
  love:      { label: 'Love',      emoji: '❤️' },
  excitement:{ label: 'Excitement',emoji: '🤩' },
  disgust:   { label: 'Disgust',   emoji: '😒' },
}

const AREA_CONFIG: Record<BodyArea, { label: string }> = {
  head:        { label: 'Head' },
  throat:      { label: 'Throat' },
  chest:       { label: 'Chest' },
  stomach:     { label: 'Stomach' },
  shoulders:   { label: 'Shoulders' },
  back:        { label: 'Back' },
  hands:       { label: 'Hands' },
  legs:        { label: 'Legs' },
  'whole-body':{ label: 'Whole Body' },
  'heart-area':{ label: 'Heart Area' },
}

const STORAGE_KEY = 'mind_body_log'

export default function MindBodyLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindBodyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MindBodyEntry, 'id' | 'createdAt'>>({
    bodySignal: 'tension', emotionSource: 'anxiety', bodyArea: 'chest',
    whatHappened: '', bodyDescription: '', emotionalLink: '',
    somaAction: '', howItShifted: '', awarenessScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindBodyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.bodyDescription.trim()) return
    const e: MindBodyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatHappened: '', bodyDescription: '', emotionalLink: '', somaAction: '', howItShifted: '' }))
    setShowForm(false)
    toastSuccess('Mind-body connection logged — your body knows the truth 🌿')
  }

  const avgAwareness = entries.length ? Math.round(entries.reduce((s, e) => s + e.awarenessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-teal-400" />
            Mind-Body Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track somatic signals and the mind-body connection.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Check-ins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{avgAwareness}/10</div>
          <div className="text-xs text-slate-500">Avg Awareness</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.howItShifted).length}</div>
          <div className="text-xs text-slate-500">Shifts Made</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Somatic Check-In</h3>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.bodySignal} onChange={e => setForm(f => ({ ...f, bodySignal: e.target.value as BodySignal }))} className="game-input text-sm">
              {(Object.entries(SIGNAL_CONFIG) as [BodySignal, typeof SIGNAL_CONFIG.tension][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.emotionSource} onChange={e => setForm(f => ({ ...f, emotionSource: e.target.value as EmotionSource }))} className="game-input text-sm">
              {(Object.entries(EMOTION_CONFIG) as [EmotionSource, typeof EMOTION_CONFIG.anxiety][]).map(([k, em]) => (
                <option key={k} value={k}>{em.emoji} {em.label}</option>
              ))}
            </select>
            <select value={form.bodyArea} onChange={e => setForm(f => ({ ...f, bodyArea: e.target.value as BodyArea }))} className="game-input text-sm">
              {(Object.entries(AREA_CONFIG) as [BodyArea, typeof AREA_CONFIG.chest][]).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What event / thought triggered this?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.bodyDescription} onChange={e => setForm(f => ({ ...f, bodyDescription: e.target.value }))}
            placeholder="Describe the physical sensation in detail *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.emotionalLink} onChange={e => setForm(f => ({ ...f, emotionalLink: e.target.value }))}
            placeholder="What emotion or memory might this connect to?" className="game-input w-full text-sm" />
          <input value={form.somaAction} onChange={e => setForm(f => ({ ...f, somaAction: e.target.value }))}
            placeholder="What did you do to work with this sensation?" className="game-input w-full text-sm" />
          <input value={form.howItShifted} onChange={e => setForm(f => ({ ...f, howItShifted: e.target.value }))}
            placeholder="How did the sensation shift afterward?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Body awareness: {form.awarenessScore}/10</p>
            <input type="range" min={1} max={10} value={form.awarenessScore}
              onChange={e => setForm(f => ({ ...f, awarenessScore: Number(e.target.value) }))}
              className="w-full h-1 accent-teal-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const sig = SIGNAL_CONFIG[e.bodySignal]
          const em = EMOTION_CONFIG[e.emotionSource]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${sig.color}` }}>
              <span className="text-2xl">{sig.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{sig.label}</span>
                  <span className="text-xs">{em.emoji} {em.label}</span>
                  <span className="text-xs text-slate-500">{AREA_CONFIG[e.bodyArea].label}</span>
                  <span className="text-xs text-teal-400">🌿 {e.awarenessScore}/10</span>
                </div>
                {e.bodyDescription && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.bodyDescription}</p>}
                {e.howItShifted && <p className="text-xs text-green-300/70 mt-0.5">Shift: {e.howItShifted}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your body holds wisdom your mind hasn't processed yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

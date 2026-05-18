import { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TriggerCategory = 'social' | 'work' | 'family' | 'financial' | 'health' | 'past' | 'failure' | 'uncertainty' | 'rejection' | 'other'
type TriggerEmotion = 'anger' | 'anxiety' | 'shame' | 'sadness' | 'fear' | 'jealousy' | 'overwhelm' | 'loneliness' | 'frustration' | 'other'

interface EmotionalTrigger {
  id: string
  category: TriggerCategory
  emotion: TriggerEmotion
  trigger: string
  bodyResponse: string
  typicalResponse: string
  betterResponse: string
  rootCause: string
  intensity: number
  frequency: number
  isHealing: boolean
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<TriggerCategory, { label: string; emoji: string; color: string }> = {
  social:      { label: 'Social',      emoji: '👥', color: '#22c55e' },
  work:        { label: 'Work',        emoji: '💼', color: '#3b82f6' },
  family:      { label: 'Family',      emoji: '🏠', color: '#f59e0b' },
  financial:   { label: 'Financial',   emoji: '💸', color: '#ef4444' },
  health:      { label: 'Health',      emoji: '💪', color: '#f97316' },
  past:        { label: 'Past',        emoji: '⏰', color: '#6366f1' },
  failure:     { label: 'Failure',     emoji: '📉', color: '#a855f7' },
  uncertainty: { label: 'Uncertainty', emoji: '🌫️', color: '#0ea5e9' },
  rejection:   { label: 'Rejection',   emoji: '💔', color: '#ec4899' },
  other:       { label: 'Other',       emoji: '⚡', color: '#94a3b8' },
}

const EMOTION_CONFIG: Record<TriggerEmotion, { label: string; color: string }> = {
  anger:       { label: 'Anger',       color: '#ef4444' },
  anxiety:     { label: 'Anxiety',     color: '#f97316' },
  shame:       { label: 'Shame',       color: '#a855f7' },
  sadness:     { label: 'Sadness',     color: '#3b82f6' },
  fear:        { label: 'Fear',        color: '#f59e0b' },
  jealousy:    { label: 'Jealousy',    color: '#22c55e' },
  overwhelm:   { label: 'Overwhelm',   color: '#6366f1' },
  loneliness:  { label: 'Loneliness',  color: '#0ea5e9' },
  frustration: { label: 'Frustration', color: '#ec4899' },
  other:       { label: 'Other',       color: '#94a3b8' },
}

const STORAGE_KEY = 'emotional_triggers'

export default function EmotionalTriggers() {
  const { toastSuccess } = useToast()
  const [triggers, setTriggers] = useState<EmotionalTrigger[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EmotionalTrigger, 'id' | 'createdAt'>>({
    category: 'social', emotion: 'anxiety', trigger: '', bodyResponse: '',
    typicalResponse: '', betterResponse: '', rootCause: '', intensity: 7,
    frequency: 5, isHealing: false, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setTriggers(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EmotionalTrigger[]) => { setTriggers(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.trigger.trim()) return
    const t: EmotionalTrigger = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([t, ...triggers])
    setForm(f => ({ ...f, trigger: '', bodyResponse: '', typicalResponse: '', betterResponse: '', rootCause: '' }))
    setShowForm(false)
    toastSuccess('Trigger mapped 🗺️')
  }

  const healing = triggers.filter(t => t.isHealing).length
  const avgIntensity = triggers.length ? Math.round(triggers.reduce((s, t) => s + t.intensity, 0) / triggers.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertCircle className="w-7 h-7 text-orange-400" />
            Emotional Triggers
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your triggers and build healthier response patterns.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{triggers.length}</div>
          <div className="text-xs text-slate-500">Mapped</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{healing}</div>
          <div className="text-xs text-slate-500">Healing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Trigger</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TriggerCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [TriggerCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value as TriggerEmotion }))} className="game-input text-sm flex-1">
              {(Object.entries(EMOTION_CONFIG) as [TriggerEmotion, typeof EMOTION_CONFIG.anger][]).map(([k, em]) => (
                <option key={k} value={k}>{em.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggers this emotional response? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.bodyResponse} onChange={e => setForm(f => ({ ...f, bodyResponse: e.target.value }))}
            placeholder="Body sensations (tense shoulders, tight chest...)" className="game-input w-full text-sm" />
          <input value={form.typicalResponse} onChange={e => setForm(f => ({ ...f, typicalResponse: e.target.value }))}
            placeholder="Typical unhealthy response" className="game-input w-full text-sm" />
          <input value={form.betterResponse} onChange={e => setForm(f => ({ ...f, betterResponse: e.target.value }))}
            placeholder="Healthy / desired response" className="game-input w-full text-sm" />
          <input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="What might be the root cause or wound?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
              <input type="range" min={1} max={10} value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Frequency: {form.frequency}/10</p>
              <input type="range" min={1} max={10} value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isHealing} onChange={e => setForm(f => ({ ...f, isHealing: e.target.checked }))} />
              Healing
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {triggers.map(t => {
          const c = CAT_CONFIG[t.category]
          const em = EMOTION_CONFIG[t.emotion]
          return (
            <div key={t.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${em.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: em.color + '20', color: em.color }}>{em.label}</span>
                  {t.isHealing && <span className="text-xs text-green-400">🌱 Healing</span>}
                </div>
                <p className="text-xs text-slate-300 mt-1">{t.trigger}</p>
                {t.betterResponse && <p className="text-xs text-green-300 mt-0.5">→ {t.betterResponse}</p>}
                {t.rootCause && <p className="text-xs text-slate-500 mt-0.5">Root: {t.rootCause}</p>}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={t.isHealing}
                    onChange={ev => save(triggers.map(x => x.id === t.id ? { ...x, isHealing: ev.target.checked } : x))} />
                  Healing
                </label>
                <button onClick={() => save(triggers.filter(x => x.id !== t.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {triggers.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Know your triggers. They hold the keys to your emotional freedom.</p>
          </div>
        )}
      </div>
    </div>
  )
}

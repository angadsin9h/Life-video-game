import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ShadowTheme = 'anger' | 'shame' | 'envy' | 'fear' | 'rejection' | 'abandonment' | 'inadequacy' | 'control' | 'betrayal' | 'other'
type ShadowPromptType = 'trigger' | 'projection' | 'dream' | 'pattern' | 'wound' | 'gift'

interface ShadowEntry {
  id: string
  theme: ShadowTheme
  promptType: ShadowPromptType
  observation: string
  whatItReveals: string
  integratedGift: string
  compassionNote: string
  depthLevel: number
  date: string
  createdAt: string
}

const THEME_CONFIG: Record<ShadowTheme, { label: string; emoji: string; color: string }> = {
  anger:       { label: 'Anger',       emoji: '🔥', color: '#ef4444' },
  shame:       { label: 'Shame',       emoji: '🫥', color: '#a855f7' },
  envy:        { label: 'Envy',        emoji: '💚', color: '#22c55e' },
  fear:        { label: 'Fear',        emoji: '😨', color: '#f59e0b' },
  rejection:   { label: 'Rejection',   emoji: '💔', color: '#ec4899' },
  abandonment: { label: 'Abandonment', emoji: '🌑', color: '#6366f1' },
  inadequacy:  { label: 'Inadequacy',  emoji: '🪞', color: '#0ea5e9' },
  control:     { label: 'Control',     emoji: '🔗', color: '#f97316' },
  betrayal:    { label: 'Betrayal',    emoji: '⚔️', color: '#64748b' },
  other:       { label: 'Other',       emoji: '🌒', color: '#94a3b8' },
}

const PROMPT_CONFIG: Record<ShadowPromptType, { label: string; prompt: string; color: string }> = {
  trigger:    { label: 'Trigger',     prompt: 'What triggered a strong reaction in you today?',     color: '#ef4444' },
  projection: { label: 'Projection',  prompt: 'What annoys you most in others that lives in you?',  color: '#f97316' },
  dream:      { label: 'Dream/Image', prompt: 'What dream image or symbol is speaking to you?',     color: '#6366f1' },
  pattern:    { label: 'Pattern',     prompt: 'What recurring pattern keeps showing up in your life?', color: '#a855f7' },
  wound:      { label: 'Old Wound',   prompt: 'What childhood wound is asking for attention?',       color: '#ec4899' },
  gift:       { label: 'Shadow Gift', prompt: 'What strength is hidden inside this shadow part?',    color: '#22c55e' },
}

const STORAGE_KEY = 'shadow_work'

export default function ShadowWork() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ShadowEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ShadowEntry, 'id' | 'createdAt'>>({
    theme: 'anger', promptType: 'trigger', observation: '', whatItReveals: '',
    integratedGift: '', compassionNote: '', depthLevel: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ShadowEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.observation.trim()) return
    const e: ShadowEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, observation: '', whatItReveals: '', integratedGift: '', compassionNote: '' }))
    setShowForm(false)
    toastSuccess('Shadow work recorded — integration is healing 🌑')
  }

  const themes = [...new Set(entries.map(e => e.theme))].length
  const avgDepth = entries.length ? Math.round(entries.reduce((s, e) => s + e.depthLevel, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Shadow Work
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Integrate your shadow — the parts of yourself you've hidden away.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Explore
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{themes}</div>
          <div className="text-xs text-slate-500">Themes Explored</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Shadow Work Session</h3>
          <div className="flex gap-2">
            <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value as ShadowTheme }))} className="game-input text-sm flex-1">
              {(Object.entries(THEME_CONFIG) as [ShadowTheme, typeof THEME_CONFIG.anger][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.promptType} onChange={e => setForm(f => ({ ...f, promptType: e.target.value as ShadowPromptType }))} className="game-input text-sm flex-1">
              {(Object.entries(PROMPT_CONFIG) as [ShadowPromptType, typeof PROMPT_CONFIG.trigger][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="p-2 rounded-lg bg-indigo-900/20 border border-indigo-500/20">
            <p className="text-xs text-indigo-300 italic">{PROMPT_CONFIG[form.promptType].prompt}</p>
          </div>
          <textarea value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
            placeholder="Write freely without judgment *" className="game-input w-full h-20 resize-none text-sm" autoFocus />
          <textarea value={form.whatItReveals} onChange={e => setForm(f => ({ ...f, whatItReveals: e.target.value }))}
            placeholder="What does this reveal about you?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.integratedGift} onChange={e => setForm(f => ({ ...f, integratedGift: e.target.value }))}
            placeholder="Hidden gift or strength within this shadow" className="game-input w-full text-sm" />
          <input value={form.compassionNote} onChange={e => setForm(f => ({ ...f, compassionNote: e.target.value }))}
            placeholder="A compassionate note to this part of yourself" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Depth of exploration: {form.depthLevel}/10</p>
            <input type="range" min={1} max={10} value={form.depthLevel}
              onChange={e => setForm(f => ({ ...f, depthLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Record</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = THEME_CONFIG[e.theme]
          const p = PROMPT_CONFIG[e.promptType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-indigo-400">🌊 {e.depthLevel}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3">{e.observation}</p>
                {e.integratedGift && <p className="text-xs text-green-300 mt-0.5">💎 {e.integratedGift}</p>}
                {e.compassionNote && <p className="text-xs text-purple-300/70 mt-0.5 italic">"{e.compassionNote}"</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Until you make the unconscious conscious, it will run your life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

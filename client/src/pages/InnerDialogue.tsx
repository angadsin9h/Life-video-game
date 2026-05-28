import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VoiceType = 'inner-critic' | 'inner-champion' | 'inner-sage' | 'inner-child' | 'inner-rebel' | 'inner-perfectionist' | 'inner-protector' | 'higher-self'
type DialoguePurpose = 'healing' | 'guidance' | 'integration' | 'challenge' | 'clarity' | 'comfort' | 'motivation' | 'forgiveness'

interface InnerDialogueEntry {
  id: string
  voice: VoiceType
  purpose: DialoguePurpose
  triggerSituation: string
  whatItSaid: string
  yourResponse: string
  insight: string
  integration: string
  shiftScore: number
  date: string
  createdAt: string
}

const VOICE_CONFIG: Record<VoiceType, { label: string; emoji: string; color: string }> = {
  'inner-critic':      { label: 'Inner Critic',      emoji: '👺', color: '#ef4444' },
  'inner-champion':    { label: 'Inner Champion',    emoji: '🏆', color: '#f59e0b' },
  'inner-sage':        { label: 'Inner Sage',        emoji: '🦉', color: '#6366f1' },
  'inner-child':       { label: 'Inner Child',       emoji: '👶', color: '#ec4899' },
  'inner-rebel':       { label: 'Inner Rebel',       emoji: '🔥', color: '#f97316' },
  'inner-perfectionist':{ label: 'Inner Perfectionist',emoji: '⚖️',color: '#3b82f6' },
  'inner-protector':   { label: 'Inner Protector',   emoji: '🛡️', color: '#22c55e' },
  'higher-self':       { label: 'Higher Self',       emoji: '✨', color: '#a855f7' },
}

const PURPOSE_CONFIG: Record<DialoguePurpose, { label: string; color: string }> = {
  healing:     { label: 'Healing',     color: '#ec4899' },
  guidance:    { label: 'Guidance',    color: '#6366f1' },
  integration: { label: 'Integration', color: '#22c55e' },
  challenge:   { label: 'Challenge',   color: '#f97316' },
  clarity:     { label: 'Clarity',     color: '#3b82f6' },
  comfort:     { label: 'Comfort',     color: '#f59e0b' },
  motivation:  { label: 'Motivation',  color: '#84cc16' },
  forgiveness: { label: 'Forgiveness', color: '#a855f7' },
}

const STORAGE_KEY = 'inner_dialogue_log'

export default function InnerDialogue() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<InnerDialogueEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<InnerDialogueEntry, 'id' | 'createdAt'>>({
    voice: 'higher-self', purpose: 'guidance', triggerSituation: '',
    whatItSaid: '', yourResponse: '', insight: '', integration: '',
    shiftScore: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InnerDialogueEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatItSaid.trim()) return
    const e: InnerDialogueEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, triggerSituation: '', whatItSaid: '', yourResponse: '', insight: '', integration: '' }))
    setShowForm(false)
    toastSuccess('Inner dialogue logged — know thyself deeply 🧠')
  }

  const higherSelf = entries.filter(e => e.voice === 'higher-self').length
  const avgShift = entries.length ? Math.round(entries.reduce((s, e) => s + e.shiftScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Inner Dialogue
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Explore and integrate the different voices within you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Dialogues</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{higherSelf}</div>
          <div className="text-xs text-slate-500">Higher Self</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgShift}/10</div>
          <div className="text-xs text-slate-500">Avg Shift</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Inner Dialogue Entry</h3>
          <div className="flex gap-2">
            <select value={form.voice} onChange={e => setForm(f => ({ ...f, voice: e.target.value as VoiceType }))} className="game-input text-sm flex-1">
              {(Object.entries(VOICE_CONFIG) as [VoiceType, typeof VOICE_CONFIG['higher-self']][]).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value as DialoguePurpose }))} className="game-input text-sm flex-1">
              {(Object.entries(PURPOSE_CONFIG) as [DialoguePurpose, typeof PURPOSE_CONFIG.guidance][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <input value={form.triggerSituation} onChange={e => setForm(f => ({ ...f, triggerSituation: e.target.value }))}
            placeholder="What situation triggered this inner voice?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whatItSaid} onChange={e => setForm(f => ({ ...f, whatItSaid: e.target.value }))}
            placeholder="What did this inner voice say? *" className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.yourResponse} onChange={e => setForm(f => ({ ...f, yourResponse: e.target.value }))}
            placeholder="How did you respond to it?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="What insight emerged from this dialogue?" className="game-input w-full text-sm" />
          <input value={form.integration} onChange={e => setForm(f => ({ ...f, integration: e.target.value }))}
            placeholder="How will you integrate this voice or message?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Shift / growth from this: {form.shiftScore}/10</p>
            <input type="range" min={1} max={10} value={form.shiftScore}
              onChange={e => setForm(f => ({ ...f, shiftScore: Number(e.target.value) }))}
              className="w-full h-1 accent-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save Dialogue</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const v = VOICE_CONFIG[e.voice]
          const p = PURPOSE_CONFIG[e.purpose]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${v.color}` }}>
              <span className="text-2xl">{v.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{v.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-purple-400">🧠 {e.shiftScore}/10</span>
                </div>
                {e.whatItSaid && <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic">"{e.whatItSaid}"</p>}
                {e.insight && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.insight}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The most important conversation is the one you have with yourself.</p>
          </div>
        )}
      </div>
    </div>
  )
}

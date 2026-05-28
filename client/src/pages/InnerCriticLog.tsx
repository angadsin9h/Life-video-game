import { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CriticTrigger = 'failure' | 'comparison' | 'rejection' | 'mistake' | 'criticism' | 'vulnerability' | 'success' | 'change' | 'uncertainty' | 'other'

interface InnerCriticEntry {
  id: string
  trigger: CriticTrigger
  criticVoice: string
  compassionateResponse: string
  situation: string
  emotion: string
  intensity: number
  isSilenced: boolean
  date: string
  createdAt: string
}

const TRIGGER_CONFIG: Record<CriticTrigger, { label: string; emoji: string; color: string }> = {
  failure:       { label: 'Failure',       emoji: '😞', color: '#ef4444' },
  comparison:    { label: 'Comparison',    emoji: '👀', color: '#f97316' },
  rejection:     { label: 'Rejection',     emoji: '💔', color: '#ec4899' },
  mistake:       { label: 'Mistake',       emoji: '❌', color: '#f59e0b' },
  criticism:     { label: 'Criticism',     emoji: '🗣️', color: '#a855f7' },
  vulnerability: { label: 'Vulnerability', emoji: '😰', color: '#6366f1' },
  success:       { label: 'Success',       emoji: '🏆', color: '#22c55e' },
  change:        { label: 'Change',        emoji: '🔄', color: '#3b82f6' },
  uncertainty:   { label: 'Uncertainty',   emoji: '❓', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '💭', color: '#94a3b8' },
}

const COMPASSION_PROMPTS = [
  'What would I say to a friend in this situation?',
  'Is this thought 100% true, or just a fear?',
  'What evidence contradicts this self-criticism?',
  'What would a loving mentor say to me right now?',
  'Is this helpful or just painful?',
]

const STORAGE_KEY = 'inner_critic_log'

export default function InnerCriticLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<InnerCriticEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterTrigger, setFilterTrigger] = useState<string>('all')
  const [form, setForm] = useState<Omit<InnerCriticEntry, 'id' | 'createdAt'>>({
    trigger: 'failure', criticVoice: '', compassionateResponse: '', situation: '',
    emotion: '', intensity: 6, isSilenced: false, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InnerCriticEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.criticVoice.trim()) return
    const e: InnerCriticEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, criticVoice: '', compassionateResponse: '', situation: '', emotion: '' }))
    setShowForm(false)
    toastSuccess('Inner critic logged 🛡️')
  }

  const filtered = entries.filter(e => filterTrigger === 'all' || e.trigger === filterTrigger)
  const silenced = entries.filter(e => e.isSilenced).length
  const avgIntensity = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.intensity, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertCircle className="w-7 h-7 text-orange-400" />
            Inner Critic Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Hear the critic, then replace it with compassion.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{silenced}</div>
          <div className="text-xs text-slate-500">Silenced</div>
        </div>
      </div>

      <div className="game-card p-3">
        <p className="text-xs text-slate-500 mb-2">Compassion prompts:</p>
        <div className="space-y-1">
          {COMPASSION_PROMPTS.map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, compassionateResponse: p }))}
              className="w-full text-left text-xs text-slate-400 p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-lg">
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTrigger('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTrigger === 'all' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TRIGGER_CONFIG) as [CriticTrigger, typeof TRIGGER_CONFIG.failure][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTrigger(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTrigger === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterTrigger === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Inner Critic</h3>
          <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as CriticTrigger }))} className="game-input w-full text-sm">
            {(Object.entries(TRIGGER_CONFIG) as [CriticTrigger, typeof TRIGGER_CONFIG.failure][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label}</option>
            ))}
          </select>
          <input value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="What happened?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-red-400 mb-1">Critic's voice</p>
            <textarea value={form.criticVoice} onChange={e => setForm(f => ({ ...f, criticVoice: e.target.value }))}
              placeholder='What is the critic saying? e.g. "You always fail" *' className="game-input w-full h-14 resize-none text-sm" autoFocus />
          </div>
          <div>
            <p className="text-xs text-green-400 mb-1">Compassionate response</p>
            <textarea value={form.compassionateResponse} onChange={e => setForm(f => ({ ...f, compassionateResponse: e.target.value }))}
              placeholder="What would you say to a friend?" className="game-input w-full h-14 resize-none text-sm" />
          </div>
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="How do you feel right now?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
              <input type="range" min={1} max={10} value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isSilenced} onChange={e => setForm(f => ({ ...f, isSilenced: e.target.checked }))} />
              Silenced it
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TRIGGER_CONFIG[e.trigger]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{e.criticVoice}</span>
                    {e.isSilenced && <span className="text-green-400 text-xs">✅</span>}
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {e.date} · intensity {e.intensity}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.situation && <p className="text-xs text-slate-400">📍 {e.situation}</p>}
                  <div className="p-2 bg-red-950/20 rounded-lg">
                    <p className="text-xs text-red-400 mb-0.5">Critic</p>
                    <p className="text-xs text-slate-300">{e.criticVoice}</p>
                  </div>
                  {e.compassionateResponse && (
                    <div className="p-2 bg-green-950/20 rounded-lg">
                      <p className="text-xs text-green-400 mb-0.5">Compassion</p>
                      <p className="text-xs text-slate-300">{e.compassionateResponse}</p>
                    </div>
                  )}
                  {e.emotion && <p className="text-xs text-pink-300">💗 {e.emotion}</p>}
                  <div className="flex gap-2 items-center">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, isSilenced: !x.isSilenced } : x))}
                      className="text-xs text-green-600 hover:text-green-400">
                      {e.isSilenced ? 'Unmark silenced' : 'Mark silenced'}
                    </button>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The inner critic speaks loudest when you're growing. Start listening — and responding with compassion.</p>
          </div>
        )}
      </div>
    </div>
  )
}

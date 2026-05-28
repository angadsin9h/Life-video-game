import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TalkType = 'negative' | 'positive' | 'neutral' | 'critical' | 'compassionate' | 'catastrophizing' | 'encouraging'
type TalkSituation = 'work' | 'relationships' | 'appearance' | 'ability' | 'social' | 'future' | 'past' | 'other'

interface SelfTalkEntry {
  id: string
  type: TalkType
  situation: TalkSituation
  originalThought: string
  reframe: string
  emotion: string
  intensity: number
  wasHelpful: boolean
  notes: string
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<TalkType, { label: string; emoji: string; color: string }> = {
  negative:         { label: 'Negative',       emoji: '😔', color: '#ef4444' },
  positive:         { label: 'Positive',        emoji: '😊', color: '#22c55e' },
  neutral:          { label: 'Neutral',          emoji: '😐', color: '#94a3b8' },
  critical:         { label: 'Critical',         emoji: '😤', color: '#f97316' },
  compassionate:    { label: 'Compassionate',    emoji: '🤗', color: '#ec4899' },
  catastrophizing:  { label: 'Catastrophizing',  emoji: '😱', color: '#a855f7' },
  encouraging:      { label: 'Encouraging',      emoji: '💪', color: '#3b82f6' },
}

const SITUATION_CONFIG: Record<TalkSituation, { label: string; emoji: string }> = {
  work:          { label: 'Work',          emoji: '💼' },
  relationships: { label: 'Relationships', emoji: '❤️' },
  appearance:    { label: 'Appearance',    emoji: '🪞' },
  ability:       { label: 'Ability',       emoji: '⚡' },
  social:        { label: 'Social',        emoji: '👥' },
  future:        { label: 'Future',        emoji: '🔭' },
  past:          { label: 'Past',          emoji: '⏮️' },
  other:         { label: 'Other',         emoji: '💭' },
}

const STORAGE_KEY = 'self_talk_log'

export default function SelfTalk() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SelfTalkEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<SelfTalkEntry, 'id' | 'createdAt'>>({
    type: 'negative', situation: 'work', originalThought: '', reframe: '',
    emotion: '', intensity: 5, wasHelpful: false, notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SelfTalkEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.originalThought.trim()) return
    const e: SelfTalkEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, originalThought: '', reframe: '', emotion: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Self-talk entry logged 🧠')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const negative = entries.filter(e => e.type === 'negative' || e.type === 'critical' || e.type === 'catastrophizing').length
  const positive = entries.filter(e => e.type === 'positive' || e.type === 'encouraging' || e.type === 'compassionate').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-pink-400" />
            Self-Talk Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and reframe how you talk to yourself.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{negative}</div>
          <div className="text-xs text-slate-500">Negative</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{positive}</div>
          <div className="text-xs text-slate-500">Positive</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [TalkType, typeof TYPE_CONFIG.negative][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Self-Talk</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TalkType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [TalkType, typeof TYPE_CONFIG.negative][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value as TalkSituation }))} className="game-input text-sm flex-1">
              {(Object.entries(SITUATION_CONFIG) as [TalkSituation, typeof SITUATION_CONFIG.work][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.originalThought} onChange={e => setForm(f => ({ ...f, originalThought: e.target.value }))}
            placeholder="What did you say to yourself? *" className="game-input w-full h-14 resize-none" autoFocus />
          <textarea value={form.reframe} onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
            placeholder="Healthier reframe / alternative thought..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="How did it make you feel?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
              <input type="range" min={1} max={10} value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                className="w-full h-1 accent-pink-400" />
            </div>
            <div className="flex flex-col gap-1">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs" />
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={form.wasHelpful} onChange={e => setForm(f => ({ ...f, wasHelpful: e.target.checked }))} />
                Helpful
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const s = SITUATION_CONFIG[e.situation]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{e.originalThought}</p>
                  <p className="text-xs text-slate-500">{s.emoji} {s.label} · {t.label} · {e.date}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <div className="p-2 bg-red-950/20 rounded-lg">
                    <p className="text-xs text-red-400 mb-0.5">Thought</p>
                    <p className="text-xs text-slate-300">{e.originalThought}</p>
                  </div>
                  {e.reframe && (
                    <div className="p-2 bg-green-950/20 rounded-lg">
                      <p className="text-xs text-green-400 mb-0.5">Reframe</p>
                      <p className="text-xs text-slate-300">{e.reframe}</p>
                    </div>
                  )}
                  {e.emotion && <p className="text-xs text-pink-300">💗 Felt: {e.emotion}</p>}
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>Intensity: {e.intensity}/10</span>
                    {e.wasHelpful && <span className="text-green-400">✓ helpful</span>}
                  </div>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You'd never talk to a friend the way you talk to yourself. Notice and shift it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

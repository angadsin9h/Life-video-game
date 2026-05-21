import { useState, useEffect } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CreativeMedium = 'writing' | 'music' | 'visual-art' | 'dance' | 'photography' | 'film' | 'code' | 'design' | 'cooking' | 'speaking'
type FlowQuality = 'blocked' | 'trickling' | 'flowing' | 'surging' | 'transcendent'

interface CreativeFlowEntry {
  id: string
  medium: CreativeMedium
  flowQuality: FlowQuality
  whatYouCreated: string
  inspirationSource: string
  blocksFaced: string
  howYouUnblocked: string
  bestMomentOf: string
  whatSurprisedYou: string
  nextCreativeAct: string
  flowScore: number
  date: string
  createdAt: string
}

const MEDIUM_CONFIG: Record<CreativeMedium, { label: string; emoji: string; color: string }> = {
  writing:      { label: 'Writing',     emoji: '✍️', color: '#6366f1' },
  music:        { label: 'Music',       emoji: '🎵', color: '#ec4899' },
  'visual-art': { label: 'Visual Art',  emoji: '🎨', color: '#f59e0b' },
  dance:        { label: 'Dance',       emoji: '💃', color: '#a855f7' },
  photography:  { label: 'Photography', emoji: '📸', color: '#3b82f6' },
  film:         { label: 'Film',        emoji: '🎬', color: '#ef4444' },
  code:         { label: 'Code',        emoji: '💻', color: '#22c55e' },
  design:       { label: 'Design',      emoji: '🖌️', color: '#f97316' },
  cooking:      { label: 'Cooking',     emoji: '👨‍🍳', color: '#84cc16' },
  speaking:     { label: 'Speaking',    emoji: '🎤', color: '#94a3b8' },
}

const FLOW_CONFIG: Record<FlowQuality, { label: string; color: string }> = {
  blocked:      { label: 'Blocked',      color: '#ef4444' },
  trickling:    { label: 'Trickling',    color: '#f97316' },
  flowing:      { label: 'Flowing',      color: '#f59e0b' },
  surging:      { label: 'Surging',      color: '#3b82f6' },
  transcendent: { label: 'Transcendent', color: '#a855f7' },
}

const STORAGE_KEY = 'creative_flow_log'

export default function CreativeFlow() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CreativeFlowEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CreativeFlowEntry, 'id' | 'createdAt'>>({
    medium: 'writing', flowQuality: 'flowing', whatYouCreated: '',
    inspirationSource: '', blocksFaced: '', howYouUnblocked: '',
    bestMomentOf: '', whatSurprisedYou: '', nextCreativeAct: '', flowScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CreativeFlowEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouCreated.trim()) return
    const e: CreativeFlowEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouCreated: '', inspirationSource: '', blocksFaced: '', howYouUnblocked: '', bestMomentOf: '', whatSurprisedYou: '', nextCreativeAct: '' }))
    setShowForm(false)
    toastSuccess('Creative session logged — creativity is intelligence having fun ✍️')
  }

  const transcendent = entries.filter(e => e.flowQuality === 'transcendent' || e.flowQuality === 'surging').length
  const avgFlow = entries.length ? Math.round(entries.reduce((s, e) => s + e.flowScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Pencil className="w-7 h-7 text-purple-400" />
            Creative Flow
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your creative sessions and cultivate inspired flow.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{transcendent}</div>
          <div className="text-xs text-slate-500">Deep Flow</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgFlow}/10</div>
          <div className="text-xs text-slate-500">Avg Flow</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Creative Session</h3>
          <div className="flex gap-2">
            <select value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value as CreativeMedium }))} className="game-input text-sm flex-1">
              {(Object.entries(MEDIUM_CONFIG) as [CreativeMedium, typeof MEDIUM_CONFIG.writing][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.flowQuality} onChange={e => setForm(f => ({ ...f, flowQuality: e.target.value as FlowQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(FLOW_CONFIG) as [FlowQuality, typeof FLOW_CONFIG.flowing][]).map(([k, fl]) => (
                <option key={k} value={k}>{fl.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouCreated} onChange={e => setForm(f => ({ ...f, whatYouCreated: e.target.value }))}
            placeholder="What did you create? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.inspirationSource} onChange={e => setForm(f => ({ ...f, inspirationSource: e.target.value }))}
            placeholder="Source of inspiration" className="game-input w-full text-sm" />
          <input value={form.blocksFaced} onChange={e => setForm(f => ({ ...f, blocksFaced: e.target.value }))}
            placeholder="Blocks or resistances faced" className="game-input w-full text-sm" />
          <input value={form.howYouUnblocked} onChange={e => setForm(f => ({ ...f, howYouUnblocked: e.target.value }))}
            placeholder="How you moved through blocks" className="game-input w-full text-sm" />
          <input value={form.bestMomentOf} onChange={e => setForm(f => ({ ...f, bestMomentOf: e.target.value }))}
            placeholder="Best moment of this session" className="game-input w-full text-sm" />
          <input value={form.whatSurprisedYou} onChange={e => setForm(f => ({ ...f, whatSurprisedYou: e.target.value }))}
            placeholder="What surprised you creatively?" className="game-input w-full text-sm" />
          <input value={form.nextCreativeAct} onChange={e => setForm(f => ({ ...f, nextCreativeAct: e.target.value }))}
            placeholder="Your next creative act" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Flow quality: {form.flowScore}/10</p>
            <input type="range" min={1} max={10} value={form.flowScore}
              onChange={e => setForm(f => ({ ...f, flowScore: Number(e.target.value) }))}
              className="w-full h-1 accent-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const m = MEDIUM_CONFIG[e.medium]
          const fl = FLOW_CONFIG[e.flowQuality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{m.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: fl.color + '20', color: fl.color }}>{fl.label}</span>
                  <span className="text-xs text-purple-400">✍️ {e.flowScore}/10</span>
                </div>
                {e.whatYouCreated && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatYouCreated}</p>}
                {e.whatSurprisedYou && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.whatSurprisedYou}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Pencil className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You are always creating. The question is whether it is intentional.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ThinkingChallenge = 'catastrophizing' | 'black-white' | 'mind-reading' | 'overgeneralization' | 'personalization' | 'filtering' | 'should-statements' | 'emotional-reasoning' | 'jumping-conclusions' | 'magnification'
type ResilienceLevel = 'fragile' | 'developing' | 'steady' | 'resilient' | 'antifragile'

interface ResilientThinkingEntry {
  id: string
  challenge: ThinkingChallenge
  resilience: ResilienceLevel
  distortedThought: string
  evidenceFor: string
  evidenceAgainst: string
  balancedThought: string
  whatItCostYou: string
  coreBeliefUnderneath: string
  reframingTool: string
  resultingAction: string
  resilienceScore: number
  date: string
  createdAt: string
}

const CHALLENGE_CONFIG: Record<ThinkingChallenge, { label: string; emoji: string; color: string }> = {
  catastrophizing:       { label: 'Catastrophizing',    emoji: '💥', color: '#ef4444' },
  'black-white':         { label: 'Black & White',      emoji: '⚖️', color: '#6366f1' },
  'mind-reading':        { label: 'Mind Reading',       emoji: '🔮', color: '#a855f7' },
  overgeneralization:    { label: 'Overgeneralization',  emoji: '🌊', color: '#3b82f6' },
  personalization:       { label: 'Personalization',    emoji: '🎯', color: '#f97316' },
  filtering:             { label: 'Mental Filtering',   emoji: '🔍', color: '#94a3b8' },
  'should-statements':   { label: 'Should Statements',  emoji: '📜', color: '#f59e0b' },
  'emotional-reasoning': { label: 'Emotional Reasoning',emoji: '❤️', color: '#ec4899' },
  'jumping-conclusions': { label: 'Jumping Conclusions', emoji: '🦘', color: '#22c55e' },
  magnification:         { label: 'Magnification',      emoji: '🔭', color: '#10b981' },
}

const RESILIENCE_CONFIG: Record<ResilienceLevel, { label: string; color: string }> = {
  fragile:     { label: 'Fragile',     color: '#ef4444' },
  developing:  { label: 'Developing',  color: '#f97316' },
  steady:      { label: 'Steady',      color: '#f59e0b' },
  resilient:   { label: 'Resilient',   color: '#3b82f6' },
  antifragile: { label: 'Antifragile', color: '#22c55e' },
}

const STORAGE_KEY = 'resilient_thinking_log'

export default function ResilientThinking() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ResilientThinkingEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ResilientThinkingEntry, 'id' | 'createdAt'>>({
    challenge: 'catastrophizing', resilience: 'developing', distortedThought: '',
    evidenceFor: '', evidenceAgainst: '', balancedThought: '',
    whatItCostYou: '', coreBeliefUnderneath: '', reframingTool: '', resultingAction: '', resilienceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ResilientThinkingEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.distortedThought.trim()) return
    const e: ResilientThinkingEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, distortedThought: '', evidenceFor: '', evidenceAgainst: '', balancedThought: '', whatItCostYou: '', coreBeliefUnderneath: '', reframingTool: '', resultingAction: '' }))
    setShowForm(false)
    toastSuccess('Resilient thinking logged — your mind is your greatest battlefield and your greatest ally 🛡️')
  }

  const antifragile = entries.filter(e => e.resilience === 'antifragile' || e.resilience === 'resilient').length
  const avgResilience = entries.length ? Math.round(entries.reduce((s, e) => s + e.resilienceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Resilient Thinking
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify cognitive distortions and build antifragile thinking patterns.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reframes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{antifragile}</div>
          <div className="text-xs text-slate-500">Resilient+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgResilience}/10</div>
          <div className="text-xs text-slate-500">Avg Resilience</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Thinking Reframe</h3>
          <div className="flex gap-2">
            <select value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value as ThinkingChallenge }))} className="game-input text-sm flex-1">
              {(Object.entries(CHALLENGE_CONFIG) as [ThinkingChallenge, typeof CHALLENGE_CONFIG.catastrophizing][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.resilience} onChange={e => setForm(f => ({ ...f, resilience: e.target.value as ResilienceLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(RESILIENCE_CONFIG) as [ResilienceLevel, typeof RESILIENCE_CONFIG.resilient][]).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.distortedThought} onChange={e => setForm(f => ({ ...f, distortedThought: e.target.value }))}
            placeholder="The distorted thought you noticed *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.evidenceFor} onChange={e => setForm(f => ({ ...f, evidenceFor: e.target.value }))}
            placeholder="Evidence supporting this thought" className="game-input w-full text-sm" />
          <input value={form.evidenceAgainst} onChange={e => setForm(f => ({ ...f, evidenceAgainst: e.target.value }))}
            placeholder="Evidence against this thought" className="game-input w-full text-sm" />
          <input value={form.balancedThought} onChange={e => setForm(f => ({ ...f, balancedThought: e.target.value }))}
            placeholder="The balanced, resilient thought" className="game-input w-full text-sm" />
          <input value={form.whatItCostYou} onChange={e => setForm(f => ({ ...f, whatItCostYou: e.target.value }))}
            placeholder="What did this distortion cost you?" className="game-input w-full text-sm" />
          <input value={form.coreBeliefUnderneath} onChange={e => setForm(f => ({ ...f, coreBeliefUnderneath: e.target.value }))}
            placeholder="Core belief underneath this pattern" className="game-input w-full text-sm" />
          <input value={form.reframingTool} onChange={e => setForm(f => ({ ...f, reframingTool: e.target.value }))}
            placeholder="Tool or technique used to reframe" className="game-input w-full text-sm" />
          <input value={form.resultingAction} onChange={e => setForm(f => ({ ...f, resultingAction: e.target.value }))}
            placeholder="Action taken from the new thought" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Resilience demonstrated: {form.resilienceScore}/10</p>
            <input type="range" min={1} max={10} value={form.resilienceScore}
              onChange={e => setForm(f => ({ ...f, resilienceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CHALLENGE_CONFIG[e.challenge]
          const r = RESILIENCE_CONFIG[e.resilience]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  <span className="text-xs text-blue-400">🛡️ {e.resilienceScore}/10</span>
                </div>
                {e.distortedThought && <p className="text-xs text-red-300/70 mt-1 line-clamp-1">❌ {e.distortedThought}</p>}
                {e.balancedThought && <p className="text-xs text-green-300/70 mt-0.5 line-clamp-1">✓ {e.balancedThought}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Resilient thinking is not optimism. It is clear-eyed truth that refuses to be defeated.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HealingArea = 'emotional' | 'relational' | 'physical' | 'spiritual' | 'childhood' | 'trauma' | 'grief' | 'addiction' | 'self-image' | 'career'
type HealingPhase = 'denial' | 'awareness' | 'processing' | 'integrating' | 'healed' | 'helping-others'

interface HealingJournalEntry {
  id: string
  area: HealingArea
  phase: HealingPhase
  whatNeededHealing: string
  rootCause: string
  toolsUsed: string
  breakthroughMoment: string
  whatYouLetGo: string
  giftOfHealing: string
  messageToSelf: string
  healingScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<HealingArea, { label: string; emoji: string; color: string }> = {
  emotional:   { label: 'Emotional',   emoji: '💙', color: '#3b82f6' },
  relational:  { label: 'Relational',  emoji: '🤝', color: '#ec4899' },
  physical:    { label: 'Physical',    emoji: '🩺', color: '#22c55e' },
  spiritual:   { label: 'Spiritual',   emoji: '✨', color: '#a855f7' },
  childhood:   { label: 'Childhood',   emoji: '🧸', color: '#f59e0b' },
  trauma:      { label: 'Trauma',      emoji: '🌊', color: '#6366f1' },
  grief:       { label: 'Grief',       emoji: '🌧️', color: '#94a3b8' },
  addiction:   { label: 'Addiction',   emoji: '🔗', color: '#ef4444' },
  'self-image': { label: 'Self-Image', emoji: '🪞', color: '#f97316' },
  career:      { label: 'Career',      emoji: '💼', color: '#10b981' },
}

const PHASE_CONFIG: Record<HealingPhase, { label: string; color: string }> = {
  denial:          { label: 'Denial',          color: '#94a3b8' },
  awareness:       { label: 'Awareness',       color: '#f97316' },
  processing:      { label: 'Processing',      color: '#f59e0b' },
  integrating:     { label: 'Integrating',     color: '#3b82f6' },
  healed:          { label: 'Healed',          color: '#22c55e' },
  'helping-others': { label: 'Helping Others', color: '#a855f7' },
}

const STORAGE_KEY = 'healing_journal_log'

export default function HealingJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<HealingJournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<HealingJournalEntry, 'id' | 'createdAt'>>({
    area: 'emotional', phase: 'processing', whatNeededHealing: '',
    rootCause: '', toolsUsed: '', breakthroughMoment: '',
    whatYouLetGo: '', giftOfHealing: '', messageToSelf: '', healingScore: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HealingJournalEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatNeededHealing.trim()) return
    const e: HealingJournalEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatNeededHealing: '', rootCause: '', toolsUsed: '', breakthroughMoment: '', whatYouLetGo: '', giftOfHealing: '', messageToSelf: '' }))
    setShowForm(false)
    toastSuccess('Healing logged — every wound that heals becomes a gift to give 💙')
  }

  const healed = entries.filter(e => e.phase === 'healed' || e.phase === 'helping-others').length
  const avgHealing = entries.length ? Math.round(entries.reduce((s, e) => s + e.healingScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-blue-400" />
            Healing Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your healing journey and honor your progress.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{healed}</div>
          <div className="text-xs text-slate-500">Healed+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgHealing}/10</div>
          <div className="text-xs text-slate-500">Avg Healing</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Healing Entry</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as HealingArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [HealingArea, typeof AREA_CONFIG.emotional][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as HealingPhase }))} className="game-input text-sm flex-1">
              {(Object.entries(PHASE_CONFIG) as [HealingPhase, typeof PHASE_CONFIG.processing][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whatNeededHealing} onChange={e => setForm(f => ({ ...f, whatNeededHealing: e.target.value }))}
            placeholder="What needed healing? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="Root cause you discovered" className="game-input w-full text-sm" />
          <input value={form.toolsUsed} onChange={e => setForm(f => ({ ...f, toolsUsed: e.target.value }))}
            placeholder="Healing tools / practices used" className="game-input w-full text-sm" />
          <input value={form.breakthroughMoment} onChange={e => setForm(f => ({ ...f, breakthroughMoment: e.target.value }))}
            placeholder="Key breakthrough moment" className="game-input w-full text-sm" />
          <input value={form.whatYouLetGo} onChange={e => setForm(f => ({ ...f, whatYouLetGo: e.target.value }))}
            placeholder="What did you let go of?" className="game-input w-full text-sm" />
          <input value={form.giftOfHealing} onChange={e => setForm(f => ({ ...f, giftOfHealing: e.target.value }))}
            placeholder="The gift this healing brought" className="game-input w-full text-sm" />
          <input value={form.messageToSelf} onChange={e => setForm(f => ({ ...f, messageToSelf: e.target.value }))}
            placeholder="Message to your healing self" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Healing progress: {form.healingScore}/10</p>
            <input type="range" min={1} max={10} value={form.healingScore}
              onChange={e => setForm(f => ({ ...f, healingScore: Number(e.target.value) }))}
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
          const a = AREA_CONFIG[e.area]
          const p = PHASE_CONFIG[e.phase]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-blue-400">💙 {e.healingScore}/10</span>
                </div>
                {e.giftOfHealing && <p className="text-xs text-yellow-300/70 mt-1">🎁 {e.giftOfHealing}</p>}
                {e.messageToSelf && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">"{e.messageToSelf}"</p>}
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
            <p className="text-sm">Healing is not linear. Honor every step of your sacred journey.</p>
          </div>
        )}
      </div>
    </div>
  )
}

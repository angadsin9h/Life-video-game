import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type NarrativeType = 'victim' | 'hero' | 'villain' | 'witness' | 'student' | 'creator' | 'warrior' | 'sage'
type NarrativeDomain = 'childhood' | 'relationships' | 'career' | 'health' | 'finances' | 'identity' | 'failures' | 'successes' | 'traumas' | 'future'

interface NarrativeEntry {
  id: string
  domain: NarrativeDomain
  oldNarrative: string
  currentRole: NarrativeType
  newNarrative: string
  newRole: NarrativeType
  whatChanged: string
  evidenceForNew: string
  howItFeels: string
  empowermentScore: number
  date: string
  createdAt: string
}

const NARRATIVE_CONFIG: Record<NarrativeType, { label: string; emoji: string; color: string }> = {
  victim:   { label: 'Victim',   emoji: '😔', color: '#ef4444' },
  hero:     { label: 'Hero',     emoji: '⚔️', color: '#f59e0b' },
  villain:  { label: 'Villain',  emoji: '😈', color: '#6366f1' },
  witness:  { label: 'Witness',  emoji: '👁️', color: '#94a3b8' },
  student:  { label: 'Student',  emoji: '📚', color: '#3b82f6' },
  creator:  { label: 'Creator',  emoji: '🎨', color: '#a855f7' },
  warrior:  { label: 'Warrior',  emoji: '🔥', color: '#f97316' },
  sage:     { label: 'Sage',     emoji: '🦉', color: '#22c55e' },
}

const DOMAIN_CONFIG: Record<NarrativeDomain, { label: string; emoji: string }> = {
  childhood:    { label: 'Childhood',    emoji: '👶' },
  relationships:{ label: 'Relationships',emoji: '❤️' },
  career:       { label: 'Career',       emoji: '💼' },
  health:       { label: 'Health',       emoji: '💪' },
  finances:     { label: 'Finances',     emoji: '💰' },
  identity:     { label: 'Identity',     emoji: '🪞' },
  failures:     { label: 'Failures',     emoji: '💔' },
  successes:    { label: 'Successes',    emoji: '🏆' },
  traumas:      { label: 'Traumas',      emoji: '🌧️' },
  future:       { label: 'Future',       emoji: '🔮' },
}

const STORAGE_KEY = 'narrative_reframe_log'

export default function NarrativeReframe() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<NarrativeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<NarrativeEntry, 'id' | 'createdAt'>>({
    domain: 'identity', oldNarrative: '', currentRole: 'victim',
    newNarrative: '', newRole: 'hero', whatChanged: '',
    evidenceForNew: '', howItFeels: '', empowermentScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NarrativeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.newNarrative.trim()) return
    const e: NarrativeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, oldNarrative: '', newNarrative: '', whatChanged: '', evidenceForNew: '', howItFeels: '' }))
    setShowForm(false)
    toastSuccess('Story reframed — you are the author of your own life 📖')
  }

  const avgEmpowerment = entries.length ? Math.round(entries.reduce((s, e) => s + e.empowermentScore, 0) / entries.length) : 0
  const heroStories = entries.filter(e => e.newRole === 'hero' || e.newRole === 'sage' || e.newRole === 'creator').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-green-400" />
            Narrative Reframe
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Rewrite your life stories from disempowering to empowering.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Reframe
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reframes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{heroStories}</div>
          <div className="text-xs text-slate-500">Empowered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgEmpowerment}/10</div>
          <div className="text-xs text-slate-500">Empowerment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Reframe Your Story</h3>
          <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as NarrativeDomain }))} className="game-input w-full text-sm">
            {(Object.entries(DOMAIN_CONFIG) as [NarrativeDomain, typeof DOMAIN_CONFIG.identity][]).map(([k, d]) => (
              <option key={k} value={k}>{d.emoji} {d.label}</option>
            ))}
          </select>
          <textarea value={form.oldNarrative} onChange={e => setForm(f => ({ ...f, oldNarrative: e.target.value }))}
            placeholder="The old story / limiting narrative" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <div className="flex gap-2 items-center">
            <select value={form.currentRole} onChange={e => setForm(f => ({ ...f, currentRole: e.target.value as NarrativeType }))} className="game-input text-sm flex-1">
              {(Object.entries(NARRATIVE_CONFIG) as [NarrativeType, typeof NARRATIVE_CONFIG.hero][]).map(([k, n]) => (
                <option key={k} value={k}>{n.emoji} {n.label} (old role)</option>
              ))}
            </select>
            <span className="text-slate-500">→</span>
            <select value={form.newRole} onChange={e => setForm(f => ({ ...f, newRole: e.target.value as NarrativeType }))} className="game-input text-sm flex-1">
              {(Object.entries(NARRATIVE_CONFIG) as [NarrativeType, typeof NARRATIVE_CONFIG.hero][]).map(([k, n]) => (
                <option key={k} value={k}>{n.emoji} {n.label} (new role)</option>
              ))}
            </select>
          </div>
          <textarea value={form.newNarrative} onChange={e => setForm(f => ({ ...f, newNarrative: e.target.value }))}
            placeholder="The empowering new story *" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.whatChanged} onChange={e => setForm(f => ({ ...f, whatChanged: e.target.value }))}
            placeholder="What perspective shift made this possible?" className="game-input w-full text-sm" />
          <input value={form.evidenceForNew} onChange={e => setForm(f => ({ ...f, evidenceForNew: e.target.value }))}
            placeholder="Evidence that supports the new narrative" className="game-input w-full text-sm" />
          <input value={form.howItFeels} onChange={e => setForm(f => ({ ...f, howItFeels: e.target.value }))}
            placeholder="How does the new story feel?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Empowerment: {form.empowermentScore}/10</p>
            <input type="range" min={1} max={10} value={form.empowermentScore}
              onChange={e => setForm(f => ({ ...f, empowermentScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save Reframe</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const oldR = NARRATIVE_CONFIG[e.currentRole]
          const newR = NARRATIVE_CONFIG[e.newRole]
          const d = DOMAIN_CONFIG[e.domain]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${newR.color}` }}>
              <div className="text-lg">{oldR.emoji}→{newR.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{d.emoji} {d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: newR.color + '20', color: newR.color }}>{newR.label}</span>
                  <span className="text-xs text-green-400">⚡ {e.empowermentScore}/10</span>
                </div>
                {e.newNarrative && <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.newNarrative}</p>}
                {e.evidenceForNew && <p className="text-xs text-green-300/70 mt-0.5">✓ {e.evidenceForNew}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Change the story, change the life. You are the author.</p>
          </div>
        )}
      </div>
    </div>
  )
}

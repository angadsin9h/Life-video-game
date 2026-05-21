import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GratitudeTier = 'surface' | 'medium' | 'deep' | 'profound' | 'transcendent'
type GratitudeCategory = 'people' | 'experiences' | 'qualities' | 'possessions' | 'lessons' | 'body' | 'nature' | 'opportunities' | 'struggles' | 'simple-things'

interface GratitudeDepthEntry {
  id: string
  item: string
  tier: GratitudeTier
  category: GratitudeCategory
  whyGrateful: string
  howItImpacts: string
  whatItTeaches: string
  ifIDidntHaveIt: string
  depthScore: number
  date: string
  createdAt: string
}

const TIER_CONFIG: Record<GratitudeTier, { label: string; emoji: string; color: string; description: string }> = {
  surface:     { label: 'Surface',     emoji: '🌊', color: '#94a3b8', description: 'Things you quickly notice' },
  medium:      { label: 'Medium',      emoji: '🌿', color: '#22c55e', description: 'Things you reflect on' },
  deep:        { label: 'Deep',        emoji: '💧', color: '#3b82f6', description: 'Things that move you' },
  profound:    { label: 'Profound',    emoji: '🌌', color: '#6366f1', description: 'Life-shaping blessings' },
  transcendent:{ label: 'Transcendent',emoji: '✨', color: '#a855f7', description: 'Beyond words' },
}

const CAT_CONFIG: Record<GratitudeCategory, { label: string; emoji: string }> = {
  people:           { label: 'People',          emoji: '❤️' },
  experiences:      { label: 'Experiences',     emoji: '🌟' },
  qualities:        { label: 'Qualities',       emoji: '💎' },
  possessions:      { label: 'Possessions',     emoji: '🏠' },
  lessons:          { label: 'Lessons',         emoji: '📚' },
  body:             { label: 'Body',            emoji: '💪' },
  nature:           { label: 'Nature',          emoji: '🌿' },
  opportunities:    { label: 'Opportunities',   emoji: '🚪' },
  struggles:        { label: 'Struggles',       emoji: '🔥' },
  'simple-things':  { label: 'Simple Things',   emoji: '☕' },
}

const STORAGE_KEY = 'gratitude_depth'

export default function GratitudeDepth() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeDepthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GratitudeDepthEntry, 'id' | 'createdAt'>>({
    item: '', tier: 'deep', category: 'people', whyGrateful: '',
    howItImpacts: '', whatItTeaches: '', ifIDidntHaveIt: '',
    depthScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratitudeDepthEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.item.trim()) return
    const e: GratitudeDepthEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, item: '', whyGrateful: '', howItImpacts: '', whatItTeaches: '', ifIDidntHaveIt: '' }))
    setShowForm(false)
    toastSuccess('Deep gratitude captured — abundance multiplies when noticed 🙏')
  }

  const transcendent = entries.filter(e => e.tier === 'transcendent').length
  const avgDepth = entries.length ? Math.round(entries.reduce((s, e) => s + e.depthScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-violet-400" />
            Gratitude Depth
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Move beyond surface gratitude into profound appreciation.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Blessings</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{transcendent}</div>
          <div className="text-xs text-slate-500">Transcendent</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Deep Gratitude Entry</h3>
          <input value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
            placeholder="What are you grateful for? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as GratitudeTier }))} className="game-input text-sm flex-1">
              {(Object.entries(TIER_CONFIG) as [GratitudeTier, typeof TIER_CONFIG.deep][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GratitudeCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [GratitudeCategory, typeof CAT_CONFIG.people][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whyGrateful} onChange={e => setForm(f => ({ ...f, whyGrateful: e.target.value }))}
            placeholder="Why exactly are you grateful for this?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howItImpacts} onChange={e => setForm(f => ({ ...f, howItImpacts: e.target.value }))}
            placeholder="How does it positively impact your life?" className="game-input w-full text-sm" />
          <input value={form.whatItTeaches} onChange={e => setForm(f => ({ ...f, whatItTeaches: e.target.value }))}
            placeholder="What does it teach you about life?" className="game-input w-full text-sm" />
          <input value={form.ifIDidntHaveIt} onChange={e => setForm(f => ({ ...f, ifIDidntHaveIt: e.target.value }))}
            placeholder="What would life be like without it?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Depth: {form.depthScore}/10</p>
            <input type="range" min={1} max={10} value={form.depthScore}
              onChange={e => setForm(f => ({ ...f, depthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Capture Gratitude</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TIER_CONFIG[e.tier]
          const c = CAT_CONFIG[e.category]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.item}</span>
                  <span className="text-xs">{c.emoji} {c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-violet-400">🙏 {e.depthScore}/10</span>
                </div>
                {e.whyGrateful && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.whyGrateful}</p>}
                {e.whatItTeaches && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.whatItTeaches}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Gratitude at depth transforms ordinary life into extraordinary.</p>
          </div>
        )}
      </div>
    </div>
  )
}

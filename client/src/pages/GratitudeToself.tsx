import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SelfAppreciationArea = 'resilience' | 'growth' | 'kindness' | 'creativity' | 'courage' | 'discipline' | 'wisdom' | 'love-given' | 'perseverance' | 'authenticity'
type SelfLoveDepth = 'surface' | 'warming' | 'genuine' | 'deep' | 'unconditional'

interface GratitudeToSelfEntry {
  id: string
  area: SelfAppreciationArea
  depth: SelfLoveDepth
  whatYouAppreciate: string
  whyItMatters: string
  howFarYouHaveCome: string
  momentOfPride: string
  whatYouForgive: string
  affirmationGiven: string
  letterToSelf: string
  selfLoveScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<SelfAppreciationArea, { label: string; emoji: string; color: string }> = {
  resilience:    { label: 'Resilience',    emoji: '🛡️', color: '#3b82f6' },
  growth:        { label: 'Growth',        emoji: '🌱', color: '#22c55e' },
  kindness:      { label: 'Kindness',      emoji: '🕊️', color: '#94a3b8' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#f59e0b' },
  courage:       { label: 'Courage',       emoji: '🦁', color: '#f97316' },
  discipline:    { label: 'Discipline',    emoji: '⚔️', color: '#6366f1' },
  wisdom:        { label: 'Wisdom',        emoji: '🦉', color: '#a855f7' },
  'love-given':  { label: 'Love Given',    emoji: '❤️', color: '#ec4899' },
  perseverance:  { label: 'Perseverance',  emoji: '🔥', color: '#ef4444' },
  authenticity:  { label: 'Authenticity',  emoji: '💎', color: '#10b981' },
}

const DEPTH_CONFIG: Record<SelfLoveDepth, { label: string; color: string }> = {
  surface:       { label: 'Surface',       color: '#94a3b8' },
  warming:       { label: 'Warming',       color: '#f59e0b' },
  genuine:       { label: 'Genuine',       color: '#3b82f6' },
  deep:          { label: 'Deep',          color: '#a855f7' },
  unconditional: { label: 'Unconditional', color: '#22c55e' },
}

const STORAGE_KEY = 'gratitude_to_self_log'

export default function GratitudeToself() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeToSelfEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GratitudeToSelfEntry, 'id' | 'createdAt'>>({
    area: 'resilience', depth: 'genuine', whatYouAppreciate: '',
    whyItMatters: '', howFarYouHaveCome: '', momentOfPride: '',
    whatYouForgive: '', affirmationGiven: '', letterToSelf: '', selfLoveScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratitudeToSelfEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouAppreciate.trim()) return
    const e: GratitudeToSelfEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouAppreciate: '', whyItMatters: '', howFarYouHaveCome: '', momentOfPride: '', whatYouForgive: '', affirmationGiven: '', letterToSelf: '' }))
    setShowForm(false)
    toastSuccess('Self-gratitude logged — you cannot pour from an empty cup. Fill yours first ❤️')
  }

  const deep = entries.filter(e => e.depth === 'deep' || e.depth === 'unconditional').length
  const avgLove = entries.length ? Math.round(entries.reduce((s, e) => s + e.selfLoveScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Gratitude to Self
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate deep appreciation, forgiveness, and love for yourself.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reflections</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{deep}</div>
          <div className="text-xs text-slate-500">Deep+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgLove}/10</div>
          <div className="text-xs text-slate-500">Avg Self-Love</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Self-Appreciation</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as SelfAppreciationArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [SelfAppreciationArea, typeof AREA_CONFIG.resilience][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as SelfLoveDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [SelfLoveDepth, typeof DEPTH_CONFIG.genuine][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouAppreciate} onChange={e => setForm(f => ({ ...f, whatYouAppreciate: e.target.value }))}
            placeholder="What about yourself are you grateful for? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this quality matter?" className="game-input w-full text-sm" />
          <input value={form.howFarYouHaveCome} onChange={e => setForm(f => ({ ...f, howFarYouHaveCome: e.target.value }))}
            placeholder="How far you have come with this" className="game-input w-full text-sm" />
          <input value={form.momentOfPride} onChange={e => setForm(f => ({ ...f, momentOfPride: e.target.value }))}
            placeholder="A moment you are proud of" className="game-input w-full text-sm" />
          <input value={form.whatYouForgive} onChange={e => setForm(f => ({ ...f, whatYouForgive: e.target.value }))}
            placeholder="Something you forgive yourself for" className="game-input w-full text-sm" />
          <input value={form.affirmationGiven} onChange={e => setForm(f => ({ ...f, affirmationGiven: e.target.value }))}
            placeholder="Affirmation you give yourself today" className="game-input w-full text-sm" />
          <textarea value={form.letterToSelf} onChange={e => setForm(f => ({ ...f, letterToSelf: e.target.value }))}
            placeholder="Short letter to yourself..." className="game-input w-full h-16 resize-none text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Self-love level: {form.selfLoveScore}/10</p>
            <input type="range" min={1} max={10} value={form.selfLoveScore}
              onChange={e => setForm(f => ({ ...f, selfLoveScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-pink-400">❤️ {e.selfLoveScore}/10</span>
                </div>
                {e.whatYouAppreciate && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatYouAppreciate}</p>}
                {e.affirmationGiven && <p className="text-xs text-rose-300/70 mt-0.5 line-clamp-1">💬 {e.affirmationGiven}</p>}
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
            <p className="text-sm">Self-love is the foundation. Everything else grows from it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MomentType = 'peak' | 'meaningful' | 'funny' | 'tender' | 'brave' | 'gratitude' | 'surprise' | 'milestone' | 'ordinary' | 'bittersweet'
type MomentWith = 'alone' | 'partner' | 'family' | 'friends' | 'strangers' | 'colleagues' | 'nature' | 'community'

interface MomentEntry {
  id: string
  title: string
  momentType: MomentType
  momentWith: MomentWith
  description: string
  whatMadeItSpecial: string
  emotion: string
  sensoryDetails: string
  lesson: string
  magicScore: number
  date: string
  createdAt: string
}

const MOMENT_CONFIG: Record<MomentType, { label: string; emoji: string; color: string }> = {
  peak:        { label: 'Peak',        emoji: '🏔️', color: '#f59e0b' },
  meaningful:  { label: 'Meaningful',  emoji: '💎', color: '#6366f1' },
  funny:       { label: 'Funny',       emoji: '😂', color: '#22c55e' },
  tender:      { label: 'Tender',      emoji: '🌸', color: '#ec4899' },
  brave:       { label: 'Brave',       emoji: '⚔️', color: '#ef4444' },
  gratitude:   { label: 'Gratitude',   emoji: '🙏', color: '#84cc16' },
  surprise:    { label: 'Surprise',    emoji: '✨', color: '#a855f7' },
  milestone:   { label: 'Milestone',   emoji: '🚩', color: '#3b82f6' },
  ordinary:    { label: 'Ordinary',    emoji: '☕', color: '#94a3b8' },
  bittersweet: { label: 'Bittersweet', emoji: '🌅', color: '#f97316' },
}

const WITH_CONFIG: Record<MomentWith, { label: string; emoji: string }> = {
  alone:      { label: 'Alone',      emoji: '🧘' },
  partner:    { label: 'Partner',    emoji: '💑' },
  family:     { label: 'Family',     emoji: '👨‍👩‍👧' },
  friends:    { label: 'Friends',    emoji: '😊' },
  strangers:  { label: 'Strangers',  emoji: '👥' },
  colleagues: { label: 'Colleagues', emoji: '🤝' },
  nature:     { label: 'Nature',     emoji: '🌿' },
  community:  { label: 'Community',  emoji: '🌍' },
}

const STORAGE_KEY = 'life_moments'

export default function LifeMoments() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MomentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MomentEntry, 'id' | 'createdAt'>>({
    title: '', momentType: 'meaningful', momentWith: 'alone', description: '',
    whatMadeItSpecial: '', emotion: '', sensoryDetails: '', lesson: '',
    magicScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MomentEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: MomentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', whatMadeItSpecial: '', emotion: '', sensoryDetails: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Life moment preserved — memories are forever ⭐')
  }

  const peakMoments = entries.filter(e => e.momentType === 'peak').length
  const avgMagic = entries.length ? Math.round(entries.reduce((s, e) => s + e.magicScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Life Moments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Preserve the magic moments that make up a great life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Capture
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{peakMoments}</div>
          <div className="text-xs text-slate-500">Peak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgMagic}/10</div>
          <div className="text-xs text-slate-500">Avg Magic</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Life Moment</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Name this moment *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.momentType} onChange={e => setForm(f => ({ ...f, momentType: e.target.value as MomentType }))} className="game-input text-sm flex-1">
              {(Object.entries(MOMENT_CONFIG) as [MomentType, typeof MOMENT_CONFIG.meaningful][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.momentWith} onChange={e => setForm(f => ({ ...f, momentWith: e.target.value as MomentWith }))} className="game-input text-sm flex-1">
              {(Object.entries(WITH_CONFIG) as [MomentWith, typeof WITH_CONFIG.alone][]).map(([k, w]) => (
                <option key={k} value={k}>{w.emoji} {w.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the moment in detail" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="How did you feel in this moment?" className="game-input w-full text-sm" />
          <input value={form.sensoryDetails} onChange={e => setForm(f => ({ ...f, sensoryDetails: e.target.value }))}
            placeholder="Sensory details (sights, sounds, smells, touch)" className="game-input w-full text-sm" />
          <input value={form.whatMadeItSpecial} onChange={e => setForm(f => ({ ...f, whatMadeItSpecial: e.target.value }))}
            placeholder="What made this moment special?" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson or gift from this moment" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Magic score: {form.magicScore}/10</p>
            <input type="range" min={1} max={10} value={form.magicScore}
              onChange={e => setForm(f => ({ ...f, magicScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Preserve Moment</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const m = MOMENT_CONFIG[e.momentType]
          const w = WITH_CONFIG[e.momentWith]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.title}</span>
                  <span className="text-xs">{w.emoji} {w.label}</span>
                  <span className="text-xs text-slate-500">{e.date}</span>
                  <span className="text-xs text-yellow-400">✨ {e.magicScore}/10</span>
                </div>
                {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>}
                {e.emotion && <p className="text-xs text-pink-300/70 mt-0.5">Felt: {e.emotion}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life is made of moments. The trick is to notice them.</p>
          </div>
        )}
      </div>
    </div>
  )
}

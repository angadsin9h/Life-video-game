import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WisdomSource = 'experience' | 'mentor' | 'book' | 'failure' | 'nature' | 'meditation' | 'conversation' | 'suffering' | 'joy' | 'silence'
type WisdomCategory = 'life' | 'relationships' | 'work' | 'money' | 'health' | 'mindset' | 'spirituality' | 'leadership' | 'creativity' | 'character'

interface WisdomEntry {
  id: string
  source: WisdomSource
  category: WisdomCategory
  wisdomStatement: string
  theStory: string
  howItChanged: string
  whenToApply: string
  whyItIsTrue: string
  depthScore: number
  date: string
  createdAt: string
}

const SOURCE_CONFIG: Record<WisdomSource, { label: string; emoji: string; color: string }> = {
  experience:   { label: 'Experience',   emoji: '🌍', color: '#3b82f6' },
  mentor:       { label: 'Mentor',       emoji: '🎓', color: '#f59e0b' },
  book:         { label: 'Book',         emoji: '📚', color: '#6366f1' },
  failure:      { label: 'Failure',      emoji: '🔥', color: '#ef4444' },
  nature:       { label: 'Nature',       emoji: '🌿', color: '#22c55e' },
  meditation:   { label: 'Meditation',   emoji: '🧘', color: '#a855f7' },
  conversation: { label: 'Conversation', emoji: '💬', color: '#ec4899' },
  suffering:    { label: 'Suffering',    emoji: '💧', color: '#94a3b8' },
  joy:          { label: 'Joy',          emoji: '✨', color: '#eab308' },
  silence:      { label: 'Silence',      emoji: '🤫', color: '#84cc16' },
}

const CAT_CONFIG: Record<WisdomCategory, { label: string; emoji: string }> = {
  life:         { label: 'Life',         emoji: '🌱' },
  relationships:{ label: 'Relationships',emoji: '❤️' },
  work:         { label: 'Work',         emoji: '💼' },
  money:        { label: 'Money',        emoji: '💰' },
  health:       { label: 'Health',       emoji: '💪' },
  mindset:      { label: 'Mindset',      emoji: '🧠' },
  spirituality: { label: 'Spirituality', emoji: '🙏' },
  leadership:   { label: 'Leadership',   emoji: '👑' },
  creativity:   { label: 'Creativity',   emoji: '🎨' },
  character:    { label: 'Character',    emoji: '⚔️' },
}

const STORAGE_KEY = 'wisdom_archive'

export default function WisdomArchive() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WisdomEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<WisdomEntry, 'id' | 'createdAt'>>({
    source: 'experience', category: 'life', wisdomStatement: '',
    theStory: '', howItChanged: '', whenToApply: '',
    whyItIsTrue: '', depthScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WisdomEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.wisdomStatement.trim()) return
    const e: WisdomEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, wisdomStatement: '', theStory: '', howItChanged: '', whenToApply: '', whyItIsTrue: '' }))
    setShowForm(false)
    toastSuccess('Wisdom preserved — become wiser by capturing what life teaches 📖')
  }

  const avgDepth = entries.length ? Math.round(entries.reduce((s, e) => s + e.depthScore, 0) / entries.length) : 0
  const fromSuffering = entries.filter(e => e.source === 'suffering' || e.source === 'failure').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-amber-400" />
            Wisdom Archive
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Preserve and distill the deep wisdom you've earned through life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Preserve
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Wisdom Pieces</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{fromSuffering}</div>
          <div className="text-xs text-slate-500">From Pain</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Preserve Wisdom</h3>
          <div className="flex gap-2">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as WisdomSource }))} className="game-input text-sm flex-1">
              {(Object.entries(SOURCE_CONFIG) as [WisdomSource, typeof SOURCE_CONFIG.experience][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WisdomCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [WisdomCategory, typeof CAT_CONFIG.life][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.wisdomStatement} onChange={e => setForm(f => ({ ...f, wisdomStatement: e.target.value }))}
            placeholder="State the wisdom in one clear sentence *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <textarea value={form.theStory} onChange={e => setForm(f => ({ ...f, theStory: e.target.value }))}
            placeholder="The experience or story that taught this" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howItChanged} onChange={e => setForm(f => ({ ...f, howItChanged: e.target.value }))}
            placeholder="How has this wisdom changed you?" className="game-input w-full text-sm" />
          <input value={form.whenToApply} onChange={e => setForm(f => ({ ...f, whenToApply: e.target.value }))}
            placeholder="When should you apply or remember this?" className="game-input w-full text-sm" />
          <input value={form.whyItIsTrue} onChange={e => setForm(f => ({ ...f, whyItIsTrue: e.target.value }))}
            placeholder="Why do you believe this is true?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Depth of wisdom: {form.depthScore}/10</p>
            <input type="range" min={1} max={10} value={form.depthScore}
              onChange={e => setForm(f => ({ ...f, depthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Archive Wisdom</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SOURCE_CONFIG[e.source]
          const c = CAT_CONFIG[e.category]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{c.emoji} {c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-amber-400">📖 {e.depthScore}/10</span>
                </div>
                <p className="text-xs text-white mt-1 font-medium line-clamp-2">{e.wisdomStatement}</p>
                {e.whenToApply && <p className="text-xs text-blue-300/70 mt-0.5">Apply: {e.whenToApply}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Wisdom not written down is wisdom lost. Archive what life teaches you.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WinCategory = 'career' | 'health' | 'mindset' | 'relationships' | 'financial' | 'creative' | 'learning' | 'personal' | 'spiritual' | 'other'
type WinScale = 'tiny' | 'small' | 'medium' | 'big' | 'epic'

interface WinEntry {
  id: string
  category: WinCategory
  scale: WinScale
  win: string
  howItHappened: string
  skillsUsed: string
  whoHelped: string
  feeling: string
  impact: number
  isPublicWin: boolean
  date: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<WinCategory, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  financial:     { label: 'Financial',     emoji: '💰', color: '#22c55e' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  personal:      { label: 'Personal',      emoji: '⭐', color: '#f59e0b' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '🏆', color: '#94a3b8' },
}

const SCALE_CONFIG: Record<WinScale, { label: string; color: string; emoji: string; stars: number }> = {
  tiny:  { label: 'Tiny Win',  color: '#94a3b8', emoji: '✨', stars: 1 },
  small: { label: 'Small Win', color: '#22c55e', emoji: '🌟', stars: 2 },
  medium:{ label: 'Medium Win',color: '#3b82f6', emoji: '⭐', stars: 3 },
  big:   { label: 'Big Win',   color: '#f59e0b', emoji: '🏆', stars: 4 },
  epic:  { label: 'EPIC Win!', color: '#a855f7', emoji: '🚀', stars: 5 },
}

const STORAGE_KEY = 'win_journal'

export default function WinJournal() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<WinEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<WinEntry, 'id' | 'createdAt'>>({
    category: 'personal', scale: 'medium', win: '', howItHappened: '',
    skillsUsed: '', whoHelped: '', feeling: '', impact: 7, isPublicWin: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setWins(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WinEntry[]) => { setWins(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.win.trim()) return
    const w: WinEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([w, ...wins])
    setForm(f => ({ ...f, win: '', howItHappened: '', skillsUsed: '', whoHelped: '', feeling: '', isPublicWin: false }))
    setShowForm(false)
    toastSuccess('Win logged! Keep building momentum 🏆')
  }

  const epicWins = wins.filter(w => w.scale === 'epic').length
  const thisMonth = wins.filter(w => w.date.startsWith(new Date().toISOString().slice(0, 7))).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Win Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Celebrate every win. Your evidence board of competence.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Win
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{wins.length}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{thisMonth}</div>
          <div className="text-xs text-slate-500">This Month</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{epicWins}</div>
          <div className="text-xs text-slate-500">Epic Wins</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log a Win</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WinCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CATEGORY_CONFIG) as [WinCategory, typeof CATEGORY_CONFIG.career][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.scale} onChange={e => setForm(f => ({ ...f, scale: e.target.value as WinScale }))} className="game-input text-sm flex-1">
              {(Object.entries(SCALE_CONFIG) as [WinScale, typeof SCALE_CONFIG.medium][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.win} onChange={e => setForm(f => ({ ...f, win: e.target.value }))}
            placeholder="What did you win / achieve / accomplish? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.howItHappened} onChange={e => setForm(f => ({ ...f, howItHappened: e.target.value }))}
            placeholder="How did it happen?" className="game-input w-full text-sm" />
          <input value={form.skillsUsed} onChange={e => setForm(f => ({ ...f, skillsUsed: e.target.value }))}
            placeholder="Skills or strengths you used" className="game-input w-full text-sm" />
          <input value={form.whoHelped} onChange={e => setForm(f => ({ ...f, whoHelped: e.target.value }))}
            placeholder="Who helped or supported you?" className="game-input w-full text-sm" />
          <input value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
            placeholder="How does this win feel?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Impact: {form.impact}/10</p>
              <input type="range" min={1} max={10} value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isPublicWin} onChange={e => setForm(f => ({ ...f, isPublicWin: e.target.checked }))} />
              Share-worthy
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Log Win!</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {wins.map(w => {
          const c = CATEGORY_CONFIG[w.category]
          const s = SCALE_CONFIG[w.scale]
          return (
            <div key={w.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs">{c.emoji} {c.label}</span>
                  <span className="text-xs text-yellow-400">⚡ {w.impact}/10</span>
                  {w.isPublicWin && <span className="text-xs text-green-400">📢</span>}
                </div>
                <p className="text-xs font-medium text-white mt-1">{w.win}</p>
                {w.skillsUsed && <p className="text-xs text-blue-300/80 mt-0.5">Skills: {w.skillsUsed}</p>}
                {w.feeling && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{w.feeling}"</p>}
                <div className="flex mt-0.5">
                  {Array.from({ length: s.stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <button onClick={() => save(wins.filter(x => x.id !== w.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {wins.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every win counts. Celebrate them all.</p>
          </div>
        )}
      </div>
    </div>
  )
}

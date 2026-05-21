import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PeacePractice = 'acceptance' | 'letting-go' | 'forgiveness' | 'stillness' | 'surrender' | 'non-attachment' | 'equanimity' | 'contentment' | 'presence' | 'prayer'
type PeaceDepth = 'restless' | 'calming' | 'settled' | 'peaceful' | 'serene'

interface InnerPeaceEntry {
  id: string
  practice: PeacePractice
  depth: PeaceDepth
  whatDisturbed: string
  howYouFound: string
  bodyFeeling: string
  whatYouReleased: string
  insightGained: string
  dailyAnchor: string
  peaceScore: number
  date: string
  createdAt: string
}

const PRACTICE_CONFIG: Record<PeacePractice, { label: string; emoji: string; color: string }> = {
  acceptance:       { label: 'Acceptance',      emoji: '🌊', color: '#3b82f6' },
  'letting-go':     { label: 'Letting Go',      emoji: '🍃', color: '#22c55e' },
  forgiveness:      { label: 'Forgiveness',     emoji: '🕊️', color: '#6366f1' },
  stillness:        { label: 'Stillness',       emoji: '🧊', color: '#94a3b8' },
  surrender:        { label: 'Surrender',       emoji: '🙏', color: '#a855f7' },
  'non-attachment': { label: 'Non-Attachment',  emoji: '🌸', color: '#ec4899' },
  equanimity:       { label: 'Equanimity',      emoji: '⚖️', color: '#f59e0b' },
  contentment:      { label: 'Contentment',     emoji: '😌', color: '#10b981' },
  presence:         { label: 'Presence',        emoji: '👁️', color: '#f97316' },
  prayer:           { label: 'Prayer',          emoji: '✨', color: '#eab308' },
}

const DEPTH_CONFIG: Record<PeaceDepth, { label: string; color: string }> = {
  restless: { label: 'Restless', color: '#ef4444' },
  calming:  { label: 'Calming',  color: '#f97316' },
  settled:  { label: 'Settled',  color: '#f59e0b' },
  peaceful: { label: 'Peaceful', color: '#3b82f6' },
  serene:   { label: 'Serene',   color: '#22c55e' },
}

const STORAGE_KEY = 'inner_peace_log'

export default function InnerPeaceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<InnerPeaceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<InnerPeaceEntry, 'id' | 'createdAt'>>({
    practice: 'acceptance', depth: 'settled', whatDisturbed: '',
    howYouFound: '', bodyFeeling: '', whatYouReleased: '',
    insightGained: '', dailyAnchor: '', peaceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InnerPeaceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.howYouFound.trim()) return
    const e: InnerPeaceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatDisturbed: '', howYouFound: '', bodyFeeling: '', whatYouReleased: '', insightGained: '', dailyAnchor: '' }))
    setShowForm(false)
    toastSuccess('Inner peace logged — peace is not the absence of conflict, it is presence within it 🌊')
  }

  const serene = entries.filter(e => e.depth === 'serene' || e.depth === 'peaceful').length
  const avgPeace = entries.length ? Math.round(entries.reduce((s, e) => s + e.peaceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-sky-400" />
            Inner Peace Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate the deep stillness beneath life's surface.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-sky-400">{serene}</div>
          <div className="text-xs text-slate-500">Serene+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgPeace}/10</div>
          <div className="text-xs text-slate-500">Avg Peace</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-sky-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Peace Moment</h3>
          <div className="flex gap-2">
            <select value={form.practice} onChange={e => setForm(f => ({ ...f, practice: e.target.value as PeacePractice }))} className="game-input text-sm flex-1">
              {(Object.entries(PRACTICE_CONFIG) as [PeacePractice, typeof PRACTICE_CONFIG.acceptance][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as PeaceDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [PeaceDepth, typeof DEPTH_CONFIG.settled][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatDisturbed} onChange={e => setForm(f => ({ ...f, whatDisturbed: e.target.value }))}
            placeholder="What disturbed your peace?" className="game-input w-full text-sm" autoFocus />
          <input value={form.howYouFound} onChange={e => setForm(f => ({ ...f, howYouFound: e.target.value }))}
            placeholder="How did you find peace again? *" className="game-input w-full text-sm" />
          <input value={form.bodyFeeling} onChange={e => setForm(f => ({ ...f, bodyFeeling: e.target.value }))}
            placeholder="How did peace feel in your body?" className="game-input w-full text-sm" />
          <input value={form.whatYouReleased} onChange={e => setForm(f => ({ ...f, whatYouReleased: e.target.value }))}
            placeholder="What did you release or let go?" className="game-input w-full text-sm" />
          <input value={form.insightGained} onChange={e => setForm(f => ({ ...f, insightGained: e.target.value }))}
            placeholder="Insight gained in stillness" className="game-input w-full text-sm" />
          <input value={form.dailyAnchor} onChange={e => setForm(f => ({ ...f, dailyAnchor: e.target.value }))}
            placeholder="Daily anchor for returning to peace" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Peace quality: {form.peaceScore}/10</p>
            <input type="range" min={1} max={10} value={form.peaceScore}
              onChange={e => setForm(f => ({ ...f, peaceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-sky-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PRACTICE_CONFIG[e.practice]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{p.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-sky-400">🌊 {e.peaceScore}/10</span>
                </div>
                {e.insightGained && <p className="text-xs text-yellow-300/70 mt-1">💡 {e.insightGained}</p>}
                {e.dailyAnchor && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">⚓ {e.dailyAnchor}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Wind className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Peace is not something you find. It is something you return to.</p>
          </div>
        )}
      </div>
    </div>
  )
}

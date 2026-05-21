import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MindsetTrigger = 'failure' | 'criticism' | 'comparison' | 'challenge' | 'plateau' | 'feedback' | 'setback' | 'learning' | 'success' | 'unknown'
type MindsetShift = 'fixed' | 'wavering' | 'shifting' | 'growth' | 'expanded'

interface GrowthMindsetEntry {
  id: string
  trigger: MindsetTrigger
  shift: MindsetShift
  fixedThought: string
  growthReframe: string
  whatItTeaching: string
  actionFromGrowth: string
  evidenceOfGrowth: string
  identityShift: string
  growthScore: number
  date: string
  createdAt: string
}

const TRIGGER_CONFIG: Record<MindsetTrigger, { label: string; emoji: string; color: string }> = {
  failure:    { label: 'Failure',    emoji: '💔', color: '#ef4444' },
  criticism:  { label: 'Criticism',  emoji: '🗣️', color: '#f97316' },
  comparison: { label: 'Comparison', emoji: '⚖️', color: '#f59e0b' },
  challenge:  { label: 'Challenge',  emoji: '🏔️', color: '#3b82f6' },
  plateau:    { label: 'Plateau',    emoji: '📊', color: '#94a3b8' },
  feedback:   { label: 'Feedback',   emoji: '💬', color: '#22c55e' },
  setback:    { label: 'Setback',    emoji: '🌊', color: '#6366f1' },
  learning:   { label: 'Learning',   emoji: '📚', color: '#a855f7' },
  success:    { label: 'Success',    emoji: '🏆', color: '#ec4899' },
  unknown:    { label: 'Unknown',    emoji: '❓', color: '#10b981' },
}

const SHIFT_CONFIG: Record<MindsetShift, { label: string; color: string }> = {
  fixed:    { label: 'Fixed',    color: '#ef4444' },
  wavering: { label: 'Wavering', color: '#f97316' },
  shifting: { label: 'Shifting', color: '#f59e0b' },
  growth:   { label: 'Growth',   color: '#3b82f6' },
  expanded: { label: 'Expanded', color: '#22c55e' },
}

const STORAGE_KEY = 'growth_mindset_log'

export default function GrowthMindset() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GrowthMindsetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GrowthMindsetEntry, 'id' | 'createdAt'>>({
    trigger: 'failure', shift: 'shifting', fixedThought: '',
    growthReframe: '', whatItTeaching: '', actionFromGrowth: '',
    evidenceOfGrowth: '', identityShift: '', growthScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GrowthMindsetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.fixedThought.trim()) return
    const e: GrowthMindsetEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, fixedThought: '', growthReframe: '', whatItTeaching: '', actionFromGrowth: '', evidenceOfGrowth: '', identityShift: '' }))
    setShowForm(false)
    toastSuccess('Mindset shift logged — yet is the most powerful word in your vocabulary 📈')
  }

  const expanded = entries.filter(e => e.shift === 'expanded' || e.shift === 'growth').length
  const avgGrowth = entries.length ? Math.round(entries.reduce((s, e) => s + e.growthScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Growth Mindset
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Catch fixed thinking and reframe it into growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{expanded}</div>
          <div className="text-xs text-slate-500">Growth Mode</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgGrowth}/10</div>
          <div className="text-xs text-slate-500">Avg Growth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Mindset Shift</h3>
          <div className="flex gap-2">
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as MindsetTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [MindsetTrigger, typeof TRIGGER_CONFIG.failure][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value as MindsetShift }))} className="game-input text-sm flex-1">
              {(Object.entries(SHIFT_CONFIG) as [MindsetShift, typeof SHIFT_CONFIG.shifting][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.fixedThought} onChange={e => setForm(f => ({ ...f, fixedThought: e.target.value }))}
            placeholder="The fixed mindset thought *" className="game-input w-full text-sm" autoFocus />
          <input value={form.growthReframe} onChange={e => setForm(f => ({ ...f, growthReframe: e.target.value }))}
            placeholder="Growth mindset reframe" className="game-input w-full text-sm" />
          <input value={form.whatItTeaching} onChange={e => setForm(f => ({ ...f, whatItTeaching: e.target.value }))}
            placeholder="What is this situation teaching you?" className="game-input w-full text-sm" />
          <input value={form.actionFromGrowth} onChange={e => setForm(f => ({ ...f, actionFromGrowth: e.target.value }))}
            placeholder="Action you'll take from growth perspective" className="game-input w-full text-sm" />
          <input value={form.evidenceOfGrowth} onChange={e => setForm(f => ({ ...f, evidenceOfGrowth: e.target.value }))}
            placeholder="Evidence that you can grow in this area" className="game-input w-full text-sm" />
          <input value={form.identityShift} onChange={e => setForm(f => ({ ...f, identityShift: e.target.value }))}
            placeholder="Identity shift: I am becoming..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Growth achieved: {form.growthScore}/10</p>
            <input type="range" min={1} max={10} value={form.growthScore}
              onChange={e => setForm(f => ({ ...f, growthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TRIGGER_CONFIG[e.trigger]
          const s = SHIFT_CONFIG[e.shift]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-green-400">📈 {e.growthScore}/10</span>
                </div>
                {e.growthReframe && <p className="text-xs text-slate-300 mt-1 line-clamp-1">→ {e.growthReframe}</p>}
                {e.identityShift && <p className="text-xs text-yellow-300/70 mt-0.5">👤 {e.identityShift}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The word "yet" transforms failure into the beginning of growth.</p>
          </div>
        )}
      </div>
    </div>
  )
}

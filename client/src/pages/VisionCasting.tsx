import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VisionTimeframe = 'week' | 'month' | 'quarter' | 'year' | 'three-years' | 'ten-years' | 'lifetime'
type VisionClarity = 'vague' | 'blurry' | 'emerging' | 'clear' | 'vivid'

interface VisionCastingEntry {
  id: string
  timeframe: VisionTimeframe
  clarity: VisionClarity
  visionStatement: string
  howItLooksFeelsSounds: string
  whyItMatters: string
  whoIsPresent: string
  dayInThatLife: string
  firstDominoBrick: string
  beliefBarrier: string
  believabilityScore: number
  date: string
  createdAt: string
}

const TIMEFRAME_CONFIG: Record<VisionTimeframe, { label: string; emoji: string; color: string }> = {
  week:         { label: '1 Week',    emoji: '📅', color: '#94a3b8' },
  month:        { label: '1 Month',   emoji: '🗓️', color: '#3b82f6' },
  quarter:      { label: '3 Months',  emoji: '📊', color: '#22c55e' },
  year:         { label: '1 Year',    emoji: '🎯', color: '#f59e0b' },
  'three-years': { label: '3 Years',  emoji: '🔭', color: '#f97316' },
  'ten-years':  { label: '10 Years',  emoji: '🌟', color: '#a855f7' },
  lifetime:     { label: 'Lifetime',  emoji: '♾️', color: '#ec4899' },
}

const CLARITY_CONFIG: Record<VisionClarity, { label: string; color: string }> = {
  vague:    { label: 'Vague',    color: '#94a3b8' },
  blurry:   { label: 'Blurry',   color: '#6366f1' },
  emerging: { label: 'Emerging', color: '#3b82f6' },
  clear:    { label: 'Clear',    color: '#f59e0b' },
  vivid:    { label: 'Vivid',    color: '#22c55e' },
}

const STORAGE_KEY = 'vision_casting_log'

export default function VisionCasting() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VisionCastingEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<VisionCastingEntry, 'id' | 'createdAt'>>({
    timeframe: 'year', clarity: 'clear', visionStatement: '',
    howItLooksFeelsSounds: '', whyItMatters: '', whoIsPresent: '',
    dayInThatLife: '', firstDominoBrick: '', beliefBarrier: '', believabilityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: VisionCastingEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.visionStatement.trim()) return
    const e: VisionCastingEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, visionStatement: '', howItLooksFeelsSounds: '', whyItMatters: '', whoIsPresent: '', dayInThatLife: '', firstDominoBrick: '', beliefBarrier: '' }))
    setShowForm(false)
    toastSuccess('Vision cast — where attention goes, energy flows, and life grows 👁️')
  }

  const vivid = entries.filter(e => e.clarity === 'vivid' || e.clarity === 'clear').length
  const avgBelief = entries.length ? Math.round(entries.reduce((s, e) => s + e.believabilityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-indigo-400" />
            Vision Casting
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cast vivid visions that pull you toward your greatest life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Cast
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Visions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{vivid}</div>
          <div className="text-xs text-slate-500">Vivid+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgBelief}/10</div>
          <div className="text-xs text-slate-500">Avg Belief</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Cast Your Vision</h3>
          <div className="flex gap-2">
            <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value as VisionTimeframe }))} className="game-input text-sm flex-1">
              {(Object.entries(TIMEFRAME_CONFIG) as [VisionTimeframe, typeof TIMEFRAME_CONFIG.year][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.clarity} onChange={e => setForm(f => ({ ...f, clarity: e.target.value as VisionClarity }))} className="game-input text-sm flex-1">
              {(Object.entries(CLARITY_CONFIG) as [VisionClarity, typeof CLARITY_CONFIG.clear][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.visionStatement} onChange={e => setForm(f => ({ ...f, visionStatement: e.target.value }))}
            placeholder="Your vision statement (present tense) *" className="game-input w-full h-16 resize-none text-sm" autoFocus />
          <textarea value={form.howItLooksFeelsSounds} onChange={e => setForm(f => ({ ...f, howItLooksFeelsSounds: e.target.value }))}
            placeholder="How it looks, feels, sounds, smells..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why this vision matters deeply to you" className="game-input w-full text-sm" />
          <input value={form.whoIsPresent} onChange={e => setForm(f => ({ ...f, whoIsPresent: e.target.value }))}
            placeholder="Who is present in this future?" className="game-input w-full text-sm" />
          <input value={form.dayInThatLife} onChange={e => setForm(f => ({ ...f, dayInThatLife: e.target.value }))}
            placeholder="Describe one ordinary day in that life" className="game-input w-full text-sm" />
          <input value={form.firstDominoBrick} onChange={e => setForm(f => ({ ...f, firstDominoBrick: e.target.value }))}
            placeholder="The first domino action to start this" className="game-input w-full text-sm" />
          <input value={form.beliefBarrier} onChange={e => setForm(f => ({ ...f, beliefBarrier: e.target.value }))}
            placeholder="Main belief barrier to this vision" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Believability: {form.believabilityScore}/10</p>
            <input type="range" min={1} max={10} value={form.believabilityScore}
              onChange={e => setForm(f => ({ ...f, believabilityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TIMEFRAME_CONFIG[e.timeframe]
          const c = CLARITY_CONFIG[e.clarity]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                  <span className="text-xs text-indigo-400">👁️ {e.believabilityScore}/10</span>
                </div>
                {e.visionStatement && <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">"{e.visionStatement}"</p>}
                {e.firstDominoBrick && <p className="text-xs text-green-300/70 mt-0.5">→ {e.firstDominoBrick}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A vivid vision of your future is more powerful than any plan.</p>
          </div>
        )}
      </div>
    </div>
  )
}

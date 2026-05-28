import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MindfulnessType = 'breath' | 'body-scan' | 'loving-kindness' | 'open-awareness' | 'walking' | 'eating' | 'visualization' | 'noting' | 'choiceless' | 'insight'
type InsightDepth = 'surface' | 'calm' | 'absorbed' | 'insight' | 'equanimity' | 'dissolution'

interface MindfulnessDepthEntry {
  id: string
  practiceType: MindfulnessType
  depth: InsightDepth
  durationMinutes: number
  whatYouNoticed: string
  mainInsight: string
  bodyState: string
  mindState: string
  challenges: string
  willRepeat: boolean
  qualityScore: number
  date: string
  createdAt: string
}

const PRACTICE_CONFIG: Record<MindfulnessType, { label: string; emoji: string; color: string }> = {
  breath:         { label: 'Breath Awareness', emoji: '💨', color: '#3b82f6' },
  'body-scan':    { label: 'Body Scan',         emoji: '🌿', color: '#22c55e' },
  'loving-kindness':{ label: 'Loving-Kindness', emoji: '❤️', color: '#ec4899' },
  'open-awareness':{ label: 'Open Awareness',   emoji: '👁️', color: '#6366f1' },
  walking:        { label: 'Walking',           emoji: '🚶', color: '#f59e0b' },
  eating:         { label: 'Mindful Eating',    emoji: '🥗', color: '#84cc16' },
  visualization:  { label: 'Visualization',     emoji: '🔮', color: '#a855f7' },
  noting:         { label: 'Noting',            emoji: '📝', color: '#f97316' },
  choiceless:     { label: 'Choiceless Awareness',emoji: '🌊',color: '#10b981' },
  insight:        { label: 'Insight Practice',  emoji: '💡', color: '#eab308' },
}

const DEPTH_CONFIG: Record<InsightDepth, { label: string; color: string }> = {
  surface:     { label: 'Surface',     color: '#94a3b8' },
  calm:        { label: 'Calm',        color: '#3b82f6' },
  absorbed:    { label: 'Absorbed',    color: '#6366f1' },
  insight:     { label: 'Insight',     color: '#a855f7' },
  equanimity:  { label: 'Equanimity',  color: '#22c55e' },
  dissolution: { label: 'Dissolution', color: '#eab308' },
}

const STORAGE_KEY = 'mindfulness_depth_log'

export default function MindfulnessDepth() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindfulnessDepthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MindfulnessDepthEntry, 'id' | 'createdAt'>>({
    practiceType: 'breath', depth: 'calm', durationMinutes: 20, whatYouNoticed: '',
    mainInsight: '', bodyState: '', mindState: '', challenges: '',
    willRepeat: true, qualityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindfulnessDepthEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouNoticed.trim()) return
    const e: MindfulnessDepthEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouNoticed: '', mainInsight: '', bodyState: '', mindState: '', challenges: '' }))
    setShowForm(false)
    toastSuccess('Mindfulness session logged — presence is the ultimate practice 🧘')
  }

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0)
  const deepSessions = entries.filter(e => e.depth === 'absorbed' || e.depth === 'insight' || e.depth === 'equanimity' || e.depth === 'dissolution').length
  const avgQuality = entries.length ? Math.round(entries.reduce((s, e) => s + e.qualityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-sky-400" />
            Mindfulness Depth
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track the depth and quality of your mindfulness practice.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{Math.round(totalMinutes / 60)}h</div>
          <div className="text-xs text-slate-500">Total Practice</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-sky-400">{deepSessions}</div>
          <div className="text-xs text-slate-500">Deep Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgQuality}/10</div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-sky-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Mindfulness Session</h3>
          <div className="flex gap-2">
            <select value={form.practiceType} onChange={e => setForm(f => ({ ...f, practiceType: e.target.value as MindfulnessType }))} className="game-input text-sm flex-1">
              {(Object.entries(PRACTICE_CONFIG) as [MindfulnessType, typeof PRACTICE_CONFIG.breath][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as InsightDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [InsightDepth, typeof DEPTH_CONFIG.calm][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Duration: {form.durationMinutes} minutes</p>
            <input type="range" min={5} max={120} step={5} value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
              className="w-full h-1 accent-sky-400" />
          </div>
          <textarea value={form.whatYouNoticed} onChange={e => setForm(f => ({ ...f, whatYouNoticed: e.target.value }))}
            placeholder="What did you notice in this session? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.mainInsight} onChange={e => setForm(f => ({ ...f, mainInsight: e.target.value }))}
            placeholder="Main insight or realization" className="game-input w-full text-sm" />
          <input value={form.bodyState} onChange={e => setForm(f => ({ ...f, bodyState: e.target.value }))}
            placeholder="Body state during practice" className="game-input w-full text-sm" />
          <input value={form.mindState} onChange={e => setForm(f => ({ ...f, mindState: e.target.value }))}
            placeholder="Mind state — busy, calm, focused, scattered?" className="game-input w-full text-sm" />
          <input value={form.challenges} onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))}
            placeholder="Main challenges during this session" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={form.willRepeat}
              onChange={e => setForm(f => ({ ...f, willRepeat: e.target.checked }))} className="accent-sky-400" />
            Will practice again tomorrow
          </label>
          <div>
            <p className="text-xs text-slate-500 mb-1">Session quality: {form.qualityScore}/10</p>
            <input type="range" min={1} max={10} value={form.qualityScore}
              onChange={e => setForm(f => ({ ...f, qualityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-sky-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PRACTICE_CONFIG[e.practiceType]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{p.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-sky-400">🧘 {e.qualityScore}/10</span>
                  <span className="text-xs text-slate-500">{e.durationMinutes}min</span>
                </div>
                {e.whatYouNoticed && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.whatYouNoticed}</p>}
                {e.mainInsight && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.mainInsight}</p>}
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
            <p className="text-sm">The present moment is all you have. Practice being here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

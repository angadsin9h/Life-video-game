import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WellbeingDimension = 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'financial' | 'purpose' | 'creative' | 'environmental' | 'cognitive'
type WellbeingTrend = 'declining' | 'stable' | 'improving' | 'thriving'

interface WellbeingEntry {
  id: string
  overallMood: number
  physicalEnergy: number
  mentalClarity: number
  emotionalBalance: number
  socialConnection: number
  spiritualWellness: number
  mainChallenge: string
  biggestWin: string
  gratitude: string
  oneImprovement: string
  selfCare: string
  trend: WellbeingTrend
  date: string
  createdAt: string
}

const TREND_CONFIG: Record<WellbeingTrend, { label: string; emoji: string; color: string }> = {
  declining:  { label: 'Declining',  emoji: '📉', color: '#ef4444' },
  stable:     { label: 'Stable',     emoji: '➡️', color: '#f59e0b' },
  improving:  { label: 'Improving',  emoji: '📈', color: '#22c55e' },
  thriving:   { label: 'Thriving',   emoji: '🚀', color: '#a855f7' },
}

const STORAGE_KEY = 'wellbeing_check'

export default function WellbeingCheck() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WellbeingEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<WellbeingEntry, 'id' | 'createdAt'>>({
    overallMood: 7, physicalEnergy: 7, mentalClarity: 7, emotionalBalance: 7,
    socialConnection: 7, spiritualWellness: 7, mainChallenge: '', biggestWin: '',
    gratitude: '', oneImprovement: '', selfCare: '', trend: 'stable',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WellbeingEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    const e: WellbeingEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, mainChallenge: '', biggestWin: '', gratitude: '', oneImprovement: '', selfCare: '' }))
    setShowForm(false)
    toastSuccess('Wellbeing check complete — self-awareness is self-care 💙')
  }

  const avgMood = entries.length ? Math.round(entries.reduce((s, e) => s + e.overallMood, 0) / entries.length) : 0
  const thriving = entries.filter(e => e.trend === 'thriving').length

  const scoreColor = (score: number) => score >= 8 ? '#22c55e' : score >= 6 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Wellbeing Check
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Holistic wellbeing check across all life dimensions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Check
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Check-Ins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgMood}/10</div>
          <div className="text-xs text-slate-500">Avg Mood</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{thriving}</div>
          <div className="text-xs text-slate-500">Thriving Days</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Wellbeing Check-In</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Overall mood: {form.overallMood}/10</p>
              <input type="range" min={1} max={10} value={form.overallMood}
                onChange={e => setForm(f => ({ ...f, overallMood: Number(e.target.value) }))}
                className="w-full h-1 accent-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Physical: {form.physicalEnergy}/10</p>
              <input type="range" min={1} max={10} value={form.physicalEnergy}
                onChange={e => setForm(f => ({ ...f, physicalEnergy: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mental: {form.mentalClarity}/10</p>
              <input type="range" min={1} max={10} value={form.mentalClarity}
                onChange={e => setForm(f => ({ ...f, mentalClarity: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Emotional: {form.emotionalBalance}/10</p>
              <input type="range" min={1} max={10} value={form.emotionalBalance}
                onChange={e => setForm(f => ({ ...f, emotionalBalance: Number(e.target.value) }))}
                className="w-full h-1 accent-pink-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Social: {form.socialConnection}/10</p>
              <input type="range" min={1} max={10} value={form.socialConnection}
                onChange={e => setForm(f => ({ ...f, socialConnection: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Spiritual: {form.spiritualWellness}/10</p>
              <input type="range" min={1} max={10} value={form.spiritualWellness}
                onChange={e => setForm(f => ({ ...f, spiritualWellness: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <select value={form.trend} onChange={e => setForm(f => ({ ...f, trend: e.target.value as WellbeingTrend }))} className="game-input w-full text-sm">
            {(Object.entries(TREND_CONFIG) as [WellbeingTrend, typeof TREND_CONFIG.stable][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label}</option>
            ))}
          </select>
          <input value={form.biggestWin} onChange={e => setForm(f => ({ ...f, biggestWin: e.target.value }))}
            placeholder="Biggest win or bright spot today" className="game-input w-full text-sm" autoFocus />
          <input value={form.mainChallenge} onChange={e => setForm(f => ({ ...f, mainChallenge: e.target.value }))}
            placeholder="Main challenge or drain" className="game-input w-full text-sm" />
          <input value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
            placeholder="What are you grateful for?" className="game-input w-full text-sm" />
          <input value={form.selfCare} onChange={e => setForm(f => ({ ...f, selfCare: e.target.value }))}
            placeholder="Self-care act today" className="game-input w-full text-sm" />
          <input value={form.oneImprovement} onChange={e => setForm(f => ({ ...f, oneImprovement: e.target.value }))}
            placeholder="One thing to improve tomorrow" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">Save Check-In</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TREND_CONFIG[e.trend]
          const avgScore = Math.round((e.overallMood + e.physicalEnergy + e.mentalClarity + e.emotionalBalance + e.socialConnection + e.spiritualWellness) / 6)
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">{e.date}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs font-bold" style={{ color: scoreColor(avgScore) }}>Avg: {avgScore}/10</span>
                </div>
                <div className="flex gap-2 mt-1 flex-wrap text-xs text-slate-500">
                  <span>💪{e.physicalEnergy}</span>
                  <span>🧠{e.mentalClarity}</span>
                  <span>❤️{e.emotionalBalance}</span>
                  <span>👥{e.socialConnection}</span>
                </div>
                {e.biggestWin && <p className="text-xs text-green-300/70 mt-0.5">✨ {e.biggestWin}</p>}
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
            <p className="text-sm">Wellbeing is the foundation of everything. Check in daily.</p>
          </div>
        )}
      </div>
    </div>
  )
}

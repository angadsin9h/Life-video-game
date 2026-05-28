import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import CrossPageInsights from '../components/CrossPageInsights'

type SleepChallenge = 'racing-mind' | 'anxiety' | 'phone-use' | 'late-night-eating' | 'noise' | 'temperature' | 'stress' | 'irregular-schedule' | 'caffeine' | 'overthinking'
type SleepQuality = 'terrible' | 'poor' | 'okay' | 'good' | 'restorative'

interface MindfulSleepEntry {
  id: string
  challenge: SleepChallenge
  quality: SleepQuality
  hoursSlept: number
  bedtimeRitual: string
  mindStateAtBed: string
  techniqueUsed: string
  dreamFragment: string
  wakeupFeeling: string
  morningEnergy: string
  improvementPlan: string
  sleepScore: number
  date: string
  createdAt: string
}

const CHALLENGE_CONFIG: Record<SleepChallenge, { label: string; emoji: string; color: string }> = {
  'racing-mind':          { label: 'Racing Mind',        emoji: '🌪️', color: '#6366f1' },
  anxiety:                { label: 'Anxiety',            emoji: '😰', color: '#ef4444' },
  'phone-use':            { label: 'Phone Use',          emoji: '📱', color: '#3b82f6' },
  'late-night-eating':    { label: 'Late Night Eating',  emoji: '🍕', color: '#f97316' },
  noise:                  { label: 'Noise',              emoji: '🔊', color: '#94a3b8' },
  temperature:            { label: 'Temperature',        emoji: '🌡️', color: '#f59e0b' },
  stress:                 { label: 'Stress',             emoji: '⚡', color: '#dc2626' },
  'irregular-schedule':   { label: 'Irregular Schedule', emoji: '⏰', color: '#a855f7' },
  caffeine:               { label: 'Caffeine',           emoji: '☕', color: '#92400e' },
  overthinking:           { label: 'Overthinking',       emoji: '🧠', color: '#ec4899' },
}

const QUALITY_CONFIG: Record<SleepQuality, { label: string; color: string }> = {
  terrible:    { label: 'Terrible',    color: '#ef4444' },
  poor:        { label: 'Poor',        color: '#f97316' },
  okay:        { label: 'Okay',        color: '#f59e0b' },
  good:        { label: 'Good',        color: '#3b82f6' },
  restorative: { label: 'Restorative', color: '#22c55e' },
}

const STORAGE_KEY = 'mindful_sleep_log'

export default function MindfulSleep() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindfulSleepEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MindfulSleepEntry, 'id' | 'createdAt'>>({
    challenge: 'racing-mind', quality: 'good', hoursSlept: 7,
    bedtimeRitual: '', mindStateAtBed: '', techniqueUsed: '',
    dreamFragment: '', wakeupFeeling: '', morningEnergy: '', improvementPlan: '', sleepScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindfulSleepEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.mindStateAtBed.trim()) return
    const e: MindfulSleepEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, bedtimeRitual: '', mindStateAtBed: '', techniqueUsed: '', dreamFragment: '', wakeupFeeling: '', morningEnergy: '', improvementPlan: '' }))
    setShowForm(false)
    toastSuccess('Sleep reflection logged — rest is the foundation of everything you will build 🌙')
  }

  const restorative = entries.filter(e => e.quality === 'restorative' || e.quality === 'good').length
  const avgSleep = entries.length ? Math.round(entries.reduce((s, e) => s + e.sleepScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Mindful Sleep
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Optimize your sleep through mindful reflection and intention.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Nights</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{restorative}</div>
          <div className="text-xs text-slate-500">Restorative</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgSleep}/10</div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Sleep Reflection</h3>
          <div className="flex gap-2">
            <select value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value as SleepChallenge }))} className="game-input text-sm flex-1">
              {(Object.entries(CHALLENGE_CONFIG) as [SleepChallenge, typeof CHALLENGE_CONFIG['racing-mind']][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as SleepQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [SleepQuality, typeof QUALITY_CONFIG.good][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          <input type="number" min={0} max={24} value={form.hoursSlept} onChange={e => setForm(f => ({ ...f, hoursSlept: Number(e.target.value) }))}
            className="game-input w-full text-sm" placeholder="Hours slept" />
          <input value={form.mindStateAtBed} onChange={e => setForm(f => ({ ...f, mindStateAtBed: e.target.value }))}
            placeholder="Your mind state at bedtime *" className="game-input w-full text-sm" autoFocus />
          <input value={form.bedtimeRitual} onChange={e => setForm(f => ({ ...f, bedtimeRitual: e.target.value }))}
            placeholder="Bedtime ritual you followed" className="game-input w-full text-sm" />
          <input value={form.techniqueUsed} onChange={e => setForm(f => ({ ...f, techniqueUsed: e.target.value }))}
            placeholder="Sleep technique you used (breathing, etc.)" className="game-input w-full text-sm" />
          <input value={form.dreamFragment} onChange={e => setForm(f => ({ ...f, dreamFragment: e.target.value }))}
            placeholder="Dream fragment or image recalled" className="game-input w-full text-sm" />
          <input value={form.wakeupFeeling} onChange={e => setForm(f => ({ ...f, wakeupFeeling: e.target.value }))}
            placeholder="How you felt waking up" className="game-input w-full text-sm" />
          <input value={form.morningEnergy} onChange={e => setForm(f => ({ ...f, morningEnergy: e.target.value }))}
            placeholder="Your morning energy level" className="game-input w-full text-sm" />
          <input value={form.improvementPlan} onChange={e => setForm(f => ({ ...f, improvementPlan: e.target.value }))}
            placeholder="One change to improve tonight's sleep" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Overall sleep quality: {form.sleepScore}/10</p>
            <input type="range" min={1} max={10} value={form.sleepScore}
              onChange={e => setForm(f => ({ ...f, sleepScore: Number(e.target.value) }))}
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
          const c = CHALLENGE_CONFIG[e.challenge]
          const q = QUALITY_CONFIG[e.quality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{c.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-slate-400">{e.hoursSlept}h</span>
                  <span className="text-xs text-indigo-400">🌙 {e.sleepScore}/10</span>
                </div>
                {e.wakeupFeeling && <p className="text-xs text-slate-300 mt-1 line-clamp-1">☀️ {e.wakeupFeeling}</p>}
                {e.improvementPlan && <p className="text-xs text-violet-300/70 mt-0.5 line-clamp-1">→ {e.improvementPlan}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sleep is the single most powerful thing you can do for brain and body health.</p>
          </div>
        )}
        <CrossPageInsights contextKey="sleep" compact />
      </div>
    </div>
  )
}

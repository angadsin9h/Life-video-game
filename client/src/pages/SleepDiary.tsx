import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SleepQuality = 1 | 2 | 3 | 4 | 5
type DreamType = 'none' | 'vivid' | 'nightmare' | 'lucid' | 'recurring' | 'pleasant'

interface SleepEntry {
  id: string
  date: string
  bedtime: string
  wakeTime: string
  hoursSlept: number
  quality: SleepQuality
  dreamType: DreamType
  wakeUps: number
  notes: string
  mood: number
  energyLevel: number
  createdAt: string
}

const QUALITY_LABELS: Record<SleepQuality, { label: string; color: string; emoji: string }> = {
  1: { label: 'Terrible',  color: '#ef4444', emoji: '😫' },
  2: { label: 'Poor',      color: '#f97316', emoji: '😔' },
  3: { label: 'Okay',      color: '#f59e0b', emoji: '😐' },
  4: { label: 'Good',      color: '#22c55e', emoji: '😊' },
  5: { label: 'Great',     color: '#3b82f6', emoji: '😄' },
}

const DREAM_CONFIG: Record<DreamType, { label: string; emoji: string }> = {
  none:      { label: 'No dreams',  emoji: '💤' },
  vivid:     { label: 'Vivid',      emoji: '🌈' },
  nightmare: { label: 'Nightmare',  emoji: '😱' },
  lucid:     { label: 'Lucid',      emoji: '✨' },
  recurring: { label: 'Recurring',  emoji: '🔄' },
  pleasant:  { label: 'Pleasant',   emoji: '🌸' },
}

const STORAGE_KEY = 'sleep_diary'

function calcHours(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 60) * 10) / 10
}

export default function SleepDiary() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<SleepEntry, 'id' | 'createdAt' | 'hoursSlept'>>({
    date: new Date().toISOString().split('T')[0],
    bedtime: '23:00', wakeTime: '07:00',
    quality: 3, dreamType: 'none', wakeUps: 0, notes: '', mood: 7, energyLevel: 7,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SleepEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.date) return
    const hoursSlept = calcHours(form.bedtime, form.wakeTime)
    const e: SleepEntry = { id: Date.now().toString(), ...form, hoursSlept, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], bedtime: '23:00', wakeTime: '07:00', quality: 3, dreamType: 'none', wakeUps: 0, notes: '', mood: 7, energyLevel: 7 })
    setShowForm(false)
    toastSuccess('Sleep entry logged 🌙')
  }

  const avgHours = entries.length ? Math.round(entries.slice(0, 7).reduce((s, e) => s + e.hoursSlept, 0) / Math.min(entries.length, 7) * 10) / 10 : 0
  const avgQuality = entries.length ? Math.round(entries.slice(0, 7).reduce((s, e) => s + e.quality, 0) / Math.min(entries.length, 7) * 10) / 10 : 0
  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (entries.find(e => e.date === ds)) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Sleep Diary
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your sleep patterns for better rest.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgHours}h</div>
          <div className="text-xs text-slate-500">Avg Sleep</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgQuality}/5</div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Sleep</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Bedtime</p>
              <input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} className="game-input text-sm w-full" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Wake time</p>
              <input type="time" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} className="game-input text-sm w-full" />
            </div>
            <div className="text-center pt-5">
              <p className="text-lg font-bold text-indigo-400">{calcHours(form.bedtime, form.wakeTime)}h</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Sleep quality:</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as SleepQuality[]).map(q => {
                const ql = QUALITY_LABELS[q]
                return (
                  <button key={q} onClick={() => setForm(f => ({ ...f, quality: q }))}
                    className={`flex-1 py-1.5 rounded-xl text-xs ${form.quality === q ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                    style={form.quality === q ? { background: ql.color + '30', color: ql.color } : {}}>
                    {ql.emoji}
                  </button>
                )
              })}
            </div>
          </div>
          <select value={form.dreamType} onChange={e => setForm(f => ({ ...f, dreamType: e.target.value as DreamType }))} className="game-input text-sm w-full">
            {(Object.entries(DREAM_CONFIG) as [DreamType, typeof DREAM_CONFIG.none][]).map(([k, d]) => (
              <option key={k} value={k}>{d.emoji} {d.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Wake-ups: {form.wakeUps}</p>
              <input type="range" min={0} max={10} value={form.wakeUps}
                onChange={e => setForm(f => ({ ...f, wakeUps: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Morning mood: {form.mood}/10</p>
              <input type="range" min={1} max={10} value={form.mood}
                onChange={e => setForm(f => ({ ...f, mood: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes, dreams, observations..." className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const ql = QUALITY_LABELS[e.quality]
          const dr = DREAM_CONFIG[e.dreamType]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${ql.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{ql.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.date}</span>
                    <span className="text-xs font-bold text-indigo-400">{e.hoursSlept}h</span>
                    <span className="text-xs" style={{ color: ql.color }}>{ql.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{e.bedtime} → {e.wakeTime}{e.wakeUps > 0 && ` · ${e.wakeUps} wake-ups`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-400">{dr.emoji} {dr.label} · Mood: {e.mood}/10</p>
                  {e.notes && <p className="text-xs text-slate-300">{e.notes}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start logging your sleep for better insights.</p>
          </div>
        )}
      </div>
    </div>
  )
}

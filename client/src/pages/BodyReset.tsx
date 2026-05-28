import { useState, useCallback } from 'react'
import { Heart, Zap, Droplets, Moon, Sun, Plus, Save, TrendingUp, CheckCircle, Circle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'body_reset_log'

interface ResetDay {
  id: string
  date: string
  sleep: number           // hours
  water: number           // glasses (8oz)
  movement: string        // e.g. "30 min walk"
  nutrition: 1|2|3|4|5   // 1=poor to 5=excellent
  alcohol: boolean
  caffeine: number        // cups
  screenTime: number      // hours before bed
  supplements: string[]
  energy: 1|2|3|4|5
  mood: 1|2|3|4|5
  notes: string
}

interface ResetProtocol {
  targetSleep: number
  targetWater: number
  targetMovement: string
  supplements: string[]
  avoidList: string[]
  resetIntention: string
}

function loadLog(): ResetDay[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } }
function loadProtocol(): ResetProtocol {
  try {
    return JSON.parse(localStorage.getItem('body_reset_protocol') ?? 'null') ?? {
      targetSleep: 8, targetWater: 8, targetMovement: '30 min walk', supplements: ['Vitamin D', 'Magnesium'],
      avoidList: ['alcohol', 'processed sugar', 'late screens'], resetIntention: '',
    }
  } catch {
    return { targetSleep: 8, targetWater: 8, targetMovement: '30 min walk', supplements: ['Vitamin D', 'Magnesium'], avoidList: ['alcohol', 'processed sugar', 'late screens'], resetIntention: '' }
  }
}

function today() { return new Date().toISOString().slice(0, 10) }

export default function BodyReset() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<ResetDay[]>(loadLog)
  const [protocol, setProtocol] = useState<ResetProtocol>(loadProtocol)
  const [activeTab, setActiveTab] = useState<'log' | 'protocol' | 'trends'>('log')
  const [entry, setEntry] = useState<Omit<ResetDay, 'id'>>(() => {
    const existing = loadLog().find(d => d.date === today())
    return existing ? { ...existing } : {
      date: today(), sleep: 0, water: 0, movement: '', nutrition: 3, alcohol: false,
      caffeine: 0, screenTime: 0, supplements: [], energy: 3, mood: 3, notes: '',
    }
  })
  const [newSupplement, setNewSupplement] = useState('')

  const saveLog = useCallback((l: ResetDay[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(l))
    setLog(l)
  }, [])

  function saveEntry() {
    const existing = log.findIndex(d => d.date === entry.date)
    const updated = existing >= 0
      ? log.map((d, i) => i === existing ? { ...entry, id: d.id } : d)
      : [...log, { ...entry, id: Date.now().toString() }]
    saveLog(updated)
    toastSuccess('Body reset logged!')
  }

  function saveProtocol() {
    localStorage.setItem('body_reset_protocol', JSON.stringify(protocol))
    toastSuccess('Protocol saved!')
  }

  function resetScore(d: ResetDay): number {
    let score = 0
    if (d.sleep >= protocol.targetSleep) score += 25
    else if (d.sleep >= protocol.targetSleep - 1) score += 15
    if (d.water >= protocol.targetWater) score += 20
    else if (d.water >= protocol.targetWater - 2) score += 10
    score += (d.nutrition / 5) * 20
    score += (d.energy / 5) * 20
    if (!d.alcohol) score += 15
    return Math.round(score)
  }

  const recent = [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)
  const avg7 = log.slice(-7)
  const avgScore = avg7.length ? Math.round(avg7.reduce((s, d) => s + resetScore(d), 0) / avg7.length) : 0

  const WaterButtons = () => (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => (
        <button key={i} onClick={() => setEntry(e => ({ ...e, water: i + 1 }))}
          className={`w-8 h-8 rounded-lg text-sm transition-colors ${entry.water > i ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
          💧
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Body Reset</h1>
          <p className="text-slate-400 text-sm mt-1">Daily fundamentals tracker — sleep, water, movement, nutrition</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${avgScore >= 75 ? 'text-green-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{avgScore}</div>
          <div className="text-xs text-slate-500">7d avg score</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['log', 'protocol', 'trends'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-4">
            <h3 className="font-semibold text-white">Log Today</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">😴 Sleep (hours)</label>
                <input type="number" step="0.5" className="game-input w-full" value={entry.sleep || ''}
                  onChange={e => setEntry(d => ({ ...d, sleep: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">☕ Caffeine (cups)</label>
                <input type="number" className="game-input w-full" value={entry.caffeine || ''}
                  onChange={e => setEntry(d => ({ ...d, caffeine: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">💧 Water ({entry.water}/{protocol.targetWater} glasses)</label>
              <WaterButtons />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">🏃 Movement</label>
              <input className="game-input w-full" placeholder={protocol.targetMovement} value={entry.movement}
                onChange={e => setEntry(d => ({ ...d, movement: e.target.value }))} />
            </div>

            {[
              { key: 'nutrition' as const, label: '🥦 Nutrition quality', colors: ['text-red-400','text-orange-400','text-yellow-400','text-lime-400','text-green-400'] },
              { key: 'energy' as const, label: '⚡ Energy level', colors: ['text-red-400','text-orange-400','text-yellow-400','text-lime-400','text-green-400'] },
              { key: 'mood' as const, label: '😊 Mood', colors: ['text-red-400','text-orange-400','text-yellow-400','text-lime-400','text-green-400'] },
            ].map(({ key, label, colors }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setEntry(d => ({ ...d, [key]: n as 1|2|3|4|5 }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${entry[key] === n ? `${colors[n-1]} bg-slate-700 ring-1 ring-current` : 'text-slate-600 bg-slate-800 hover:text-slate-400'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button onClick={() => setEntry(d => ({ ...d, alcohol: !d.alcohol }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${entry.alcohol ? 'bg-red-900/40 text-red-300 border border-red-700/40' : 'bg-green-900/30 text-green-300 border border-green-700/30'}`}>
                {entry.alcohol ? '🍺 Had alcohol' : '✅ Alcohol-free'}
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Moon className="w-3.5 h-3.5" />
                <span>Screen before bed (h):</span>
                <input type="number" step="0.5" className="game-input w-16 text-xs py-1" value={entry.screenTime || ''}
                  onChange={e => setEntry(d => ({ ...d, screenTime: Number(e.target.value) }))} />
              </div>
            </div>

            <textarea className="game-input w-full text-sm" rows={2} placeholder="Notes..."
              value={entry.notes} onChange={e => setEntry(d => ({ ...d, notes: e.target.value }))} />

            <button onClick={saveEntry}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
              <Save className="w-4 h-4" /> Save Today's Log
            </button>
          </div>
        </div>
      )}

      {activeTab === 'protocol' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Reset Protocol</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Target sleep (hours)</label>
                <input type="number" step="0.5" className="game-input w-full" value={protocol.targetSleep}
                  onChange={e => setProtocol(p => ({ ...p, targetSleep: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Target water (glasses)</label>
                <input type="number" className="game-input w-full" value={protocol.targetWater}
                  onChange={e => setProtocol(p => ({ ...p, targetWater: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Daily movement target</label>
              <input className="game-input w-full" placeholder="e.g. 30 min walk" value={protocol.targetMovement}
                onChange={e => setProtocol(p => ({ ...p, targetMovement: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reset intention</label>
              <textarea className="game-input w-full text-sm" rows={2} placeholder="Why are you doing this reset?"
                value={protocol.resetIntention} onChange={e => setProtocol(p => ({ ...p, resetIntention: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Supplements</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {protocol.supplements.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
                    {s}
                    <button onClick={() => setProtocol(p => ({ ...p, supplements: p.supplements.filter((_, j) => j !== i) }))} className="text-slate-500 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="game-input flex-1 text-sm" placeholder="Add supplement..." value={newSupplement}
                  onChange={e => setNewSupplement(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newSupplement) { setProtocol(p => ({ ...p, supplements: [...p.supplements, newSupplement] })); setNewSupplement('') }}} />
                <button onClick={() => { if (newSupplement) { setProtocol(p => ({ ...p, supplements: [...p.supplements, newSupplement] })); setNewSupplement('') }}}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button onClick={saveProtocol}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
              <Save className="w-3.5 h-3.5" /> Save Protocol
            </button>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {log.length ? (log.slice(-7).reduce((s, d) => s + d.sleep, 0) / Math.min(7, log.length)).toFixed(1) : '—'}h
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg Sleep (7d)</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {log.length ? Math.round(log.slice(-7).reduce((s, d) => s + d.water, 0) / Math.min(7, log.length)) : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg Water (7d)</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{avgScore}</div>
              <div className="text-xs text-slate-500 mt-1">Reset Score (7d)</div>
            </div>
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">14-Day Log</h3>
            <div className="space-y-1.5">
              {recent.map(d => {
                const score = resetScore(d)
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20">{d.date.slice(5)}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8">{score}</span>
                    <span className="text-xs text-slate-500">{d.sleep}h 💧{d.water}</span>
                  </div>
                )
              })}
              {log.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No logs yet. Start tracking today.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

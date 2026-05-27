import { useState, useEffect, useCallback } from 'react'
import { Moon, Sun, Star, Save, Plus, Trash2, Clock, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'evening_ritual_design'
const LOG_KEY = 'evening_ritual_log'

interface RitualStep {
  id: string
  time: string        // "21:00"
  duration: number    // minutes
  activity: string
  category: 'wind-down' | 'reflection' | 'prep' | 'relaxation' | 'connection' | 'spiritual'
  notes: string
}

interface RitualDesign {
  startTime: string
  endTime: string
  steps: RitualStep[]
  intention: string
  screenCutoff: string
  lastUpdated: string
}

interface RitualLog {
  id: string
  date: string
  completedSteps: string[]   // step IDs
  quality: number            // 1-5
  bedtime: string
  notes: string
}

const CAT_COLORS: Record<string, string> = {
  'wind-down': 'text-blue-400',
  'reflection': 'text-violet-400',
  'prep': 'text-yellow-400',
  'relaxation': 'text-green-400',
  'connection': 'text-pink-400',
  'spiritual': 'text-cyan-400',
}
const CAT_EMOJIS: Record<string, string> = {
  'wind-down': '🌙', 'reflection': '📔', 'prep': '🎒', 'relaxation': '🛁', 'connection': '💑', 'spiritual': '🙏',
}

function loadDesign(): RitualDesign {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? {
      startTime: '21:00', endTime: '22:30', steps: [], intention: '', screenCutoff: '21:30', lastUpdated: '',
    }
  } catch {
    return { startTime: '21:00', endTime: '22:30', steps: [], intention: '', screenCutoff: '21:30', lastUpdated: '' }
  }
}

function loadLog(): RitualLog[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') } catch { return [] }
}

function today() { return new Date().toISOString().slice(0, 10) }

export default function EveningRitualDesigner() {
  const { toastSuccess } = useToast()
  const [design, setDesign] = useState<RitualDesign>(loadDesign)
  const [logs, setLogs] = useState<RitualLog[]>(loadLog)
  const [activeTab, setActiveTab] = useState<'design' | 'track' | 'history'>('design')
  const [newStep, setNewStep] = useState<Omit<RitualStep, 'id'>>({
    time: '21:00', duration: 15, activity: '', category: 'wind-down', notes: '',
  })
  const [todayLog, setTodayLog] = useState<RitualLog>(() => {
    const existing = loadLog().find(l => l.date === today())
    return existing ?? { id: Date.now().toString(), date: today(), completedSteps: [], quality: 3, bedtime: '', notes: '' }
  })

  const saveDesign = useCallback((d: RitualDesign) => {
    const updated = { ...d, lastUpdated: today() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setDesign(updated)
  }, [])

  const saveLogs = useCallback((l: RitualLog[]) => {
    localStorage.setItem(LOG_KEY, JSON.stringify(l))
    setLogs(l)
  }, [])

  function addStep() {
    if (!newStep.activity.trim()) return
    const updated = { ...design, steps: [...design.steps, { ...newStep, id: Date.now().toString() }] }
    saveDesign(updated)
    setNewStep({ time: '21:00', duration: 15, activity: '', category: 'wind-down', notes: '' })
    toastSuccess('Step added!')
  }

  function removeStep(id: string) { saveDesign({ ...design, steps: design.steps.filter(s => s.id !== id) }) }

  function toggleStep(stepId: string) {
    setTodayLog(l => ({
      ...l,
      completedSteps: l.completedSteps.includes(stepId)
        ? l.completedSteps.filter(s => s !== stepId)
        : [...l.completedSteps, stepId],
    }))
  }

  function saveTodayLog() {
    const existing = logs.findIndex(l => l.date === today())
    const updated = existing >= 0
      ? logs.map((l, i) => i === existing ? todayLog : l)
      : [...logs, todayLog]
    saveLogs(updated)
    toastSuccess('Evening ritual logged!')
  }

  const totalDuration = design.steps.reduce((s, st) => s + st.duration, 0)
  const completionPct = design.steps.length > 0
    ? Math.round((todayLog.completedSteps.length / design.steps.length) * 100)
    : 0

  const avgQuality = logs.length > 0
    ? (logs.reduce((s, l) => s + l.quality, 0) / logs.length).toFixed(1)
    : '—'
  const streak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (logs.find(l => l.date === ds && l.completedSteps.length >= (design.steps.length * 0.5))) {
        s++; d.setDate(d.getDate() - 1)
      } else break
    }
    return s
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Evening Ritual Designer</h1>
          <p className="text-slate-400 text-sm mt-1">Design and track your perfect wind-down routine</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">🌙 {streak}d</div>
          <div className="text-xs text-slate-500">streak</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['design', 'track', 'history'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'design' && (
        <div className="space-y-4">
          {/* Protocol settings */}
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2"><Moon className="w-4 h-4 text-blue-400" /> Ritual Settings</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start time</label>
                <input type="time" className="game-input w-full" value={design.startTime}
                  onChange={e => saveDesign({ ...design, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">End / Bedtime</label>
                <input type="time" className="game-input w-full" value={design.endTime}
                  onChange={e => saveDesign({ ...design, endTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Screen cutoff</label>
                <input type="time" className="game-input w-full" value={design.screenCutoff}
                  onChange={e => saveDesign({ ...design, screenCutoff: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Evening intention</label>
              <input className="game-input w-full" placeholder="How do you want to feel as you fall asleep?" value={design.intention}
                onChange={e => saveDesign({ ...design, intention: e.target.value })} />
            </div>
            <div className="text-xs text-slate-500">Total ritual duration: {totalDuration} min</div>
          </div>

          {/* Add step */}
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white">Add Step</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="game-input w-full" placeholder="Activity name" value={newStep.activity}
                onChange={e => setNewStep(s => ({ ...s, activity: e.target.value }))} />
              <select className="game-input w-full" value={newStep.category}
                onChange={e => setNewStep(s => ({ ...s, category: e.target.value as RitualStep['category'] }))}>
                {Object.entries(CAT_EMOJIS).map(([v, emoji]) => (
                  <option key={v} value={v}>{emoji} {v.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="time" className="game-input w-full" value={newStep.time}
                onChange={e => setNewStep(s => ({ ...s, time: e.target.value }))} />
              <div className="flex items-center gap-2">
                <input type="number" className="game-input w-full" placeholder="Mins" value={newStep.duration || ''}
                  onChange={e => setNewStep(s => ({ ...s, duration: Number(e.target.value) }))} />
              </div>
              <input className="game-input w-full" placeholder="Notes" value={newStep.notes}
                onChange={e => setNewStep(s => ({ ...s, notes: e.target.value }))} />
            </div>
            <button onClick={addStep}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          {/* Steps list */}
          <div className="space-y-2">
            {design.steps.sort((a, b) => a.time.localeCompare(b.time)).map(step => (
              <div key={step.id} className="game-card p-3 flex items-center gap-3">
                <div className="text-2xl">{CAT_EMOJIS[step.category]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{step.activity}</span>
                    <span className={`text-xs ${CAT_COLORS[step.category]}`}>{step.category}</span>
                  </div>
                  <div className="text-xs text-slate-500">{step.time} · {step.duration} min{step.notes ? ` · ${step.notes}` : ''}</div>
                </div>
                <button onClick={() => removeStep(step.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {design.steps.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Moon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No steps yet. Add your wind-down activities above.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Tonight — {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</h3>
              <div className="text-right">
                <div className={`text-lg font-bold ${completionPct >= 80 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {completionPct}%
                </div>
                <div className="text-xs text-slate-500">{todayLog.completedSteps.length}/{design.steps.length} steps</div>
              </div>
            </div>

            <div className="h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>

            <div className="space-y-2">
              {design.steps.sort((a, b) => a.time.localeCompare(b.time)).map(step => {
                const done = todayLog.completedSteps.includes(step.id)
                return (
                  <button key={step.id} onClick={() => toggleStep(step.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${done ? 'bg-blue-900/30 border border-blue-700/40' : 'bg-slate-800 border border-slate-700 hover:border-slate-600'}`}>
                    <span className="text-xl">{CAT_EMOJIS[step.category]}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${done ? 'text-blue-300 line-through' : 'text-white'}`}>{step.activity}</div>
                      <div className="text-xs text-slate-500">{step.time} · {step.duration} min</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                      {done && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-700 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Actual bedtime</label>
                  <input type="time" className="game-input w-full" value={todayLog.bedtime}
                    onChange={e => setTodayLog(l => ({ ...l, bedtime: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ritual quality (1-5)</label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setTodayLog(l => ({ ...l, quality: n }))}
                        className={`flex-1 py-1.5 rounded-lg text-sm transition-colors ${todayLog.quality >= n ? 'bg-yellow-500/30 text-yellow-400' : 'bg-slate-700 text-slate-500'}`}>
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea className="game-input w-full text-sm" rows={2} placeholder="Evening notes..."
                value={todayLog.notes} onChange={e => setTodayLog(l => ({ ...l, notes: e.target.value }))} />
              <button onClick={saveTodayLog}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                <Save className="w-4 h-4" /> Save Tonight's Log
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{streak}</div>
              <div className="text-xs text-slate-500 mt-1">Day streak</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{avgQuality}⭐</div>
              <div className="text-xs text-slate-500 mt-1">Avg quality</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{logs.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total nights</div>
            </div>
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Nights</h3>
            <div className="space-y-2">
              {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-400 w-24 flex-shrink-0">{l.date}</div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{
                        width: `${design.steps.length > 0 ? Math.round((l.completedSteps.length / design.steps.length) * 100) : 0}%`
                      }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{l.completedSteps.length}/{design.steps.length} steps{l.bedtime ? ` · bed ${l.bedtime}` : ''}</div>
                  </div>
                  <div className="text-yellow-400 text-xs">{'⭐'.repeat(l.quality)}</div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No ritual logs yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

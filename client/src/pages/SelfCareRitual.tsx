import { useState, useCallback } from 'react'
import { Heart, Plus, Trash2, Save, Star, TrendingUp, Calendar, Zap, CheckCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'self_care_ritual_log'

interface SelfCareActivity {
  id: string
  name: string
  category: 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'creative'
  duration: number     // minutes
  frequency: 'daily' | 'weekly' | 'as-needed'
  lastDone: string     // YYYY-MM-DD
  streak: number
  totalSessions: number
  notes: string
}

interface SelfCareLog {
  id: string
  date: string
  activitiesCompleted: string[]  // activity IDs
  selfCareScore: number          // 1-10
  bodyFeeling: string
  emotionalState: string
  notes: string
}

const CAT_CONFIG = {
  physical:  { emoji: '💪', color: 'text-green-400',  bg: 'bg-green-900/20'  },
  mental:    { emoji: '🧠', color: 'text-blue-400',   bg: 'bg-blue-900/20'   },
  emotional: { emoji: '❤️', color: 'text-pink-400',   bg: 'bg-pink-900/20'   },
  social:    { emoji: '👥', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  spiritual: { emoji: '🙏', color: 'text-violet-400', bg: 'bg-violet-900/20' },
  creative:  { emoji: '🎨', color: 'text-orange-400', bg: 'bg-orange-900/20' },
}

const PRESET_ACTIVITIES: Omit<SelfCareActivity, 'id' | 'lastDone' | 'streak' | 'totalSessions'>[] = [
  { name: 'Morning stretch', category: 'physical', duration: 10, frequency: 'daily', notes: '' },
  { name: 'Meditation', category: 'mental', duration: 10, frequency: 'daily', notes: '' },
  { name: 'Journaling', category: 'emotional', duration: 15, frequency: 'daily', notes: '' },
  { name: 'Nature walk', category: 'physical', duration: 30, frequency: 'daily', notes: '' },
  { name: 'Hot bath/shower', category: 'physical', duration: 20, frequency: 'weekly', notes: '' },
  { name: 'Call a friend', category: 'social', duration: 30, frequency: 'weekly', notes: '' },
]

function loadActivities(): SelfCareActivity[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + '_activities') ?? 'null')
    return saved ?? PRESET_ACTIVITIES.map((a, i) => ({ ...a, id: String(i + 1), lastDone: '', streak: 0, totalSessions: 0 }))
  } catch {
    return PRESET_ACTIVITIES.map((a, i) => ({ ...a, id: String(i + 1), lastDone: '', streak: 0, totalSessions: 0 }))
  }
}

function loadLog(): SelfCareLog[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } }
function today() { return new Date().toISOString().slice(0, 10) }

export default function SelfCareRitual() {
  const { toastSuccess } = useToast()
  const [activities, setActivities] = useState<SelfCareActivity[]>(loadActivities)
  const [log, setLog] = useState<SelfCareLog[]>(loadLog)
  const [activeTab, setActiveTab] = useState<'today' | 'rituals' | 'history'>('today')
  const [todayEntry, setTodayEntry] = useState<SelfCareLog>(() => {
    const existing = loadLog().find(l => l.date === today())
    return existing ?? { id: Date.now().toString(), date: today(), activitiesCompleted: [], selfCareScore: 5, bodyFeeling: '', emotionalState: '', notes: '' }
  })
  const [newActivity, setNewActivity] = useState<Omit<SelfCareActivity, 'id' | 'lastDone' | 'streak' | 'totalSessions'>>({
    name: '', category: 'physical', duration: 15, frequency: 'daily', notes: '',
  })
  const [showAddActivity, setShowAddActivity] = useState(false)

  const persistActivities = useCallback((a: SelfCareActivity[]) => {
    localStorage.setItem(STORAGE_KEY + '_activities', JSON.stringify(a))
    setActivities(a)
  }, [])

  const persistLog = useCallback((l: SelfCareLog[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(l))
    setLog(l)
  }, [])

  function toggleActivity(actId: string) {
    const done = todayEntry.activitiesCompleted.includes(actId)
    setTodayEntry(e => ({
      ...e,
      activitiesCompleted: done ? e.activitiesCompleted.filter(id => id !== actId) : [...e.activitiesCompleted, actId],
    }))
  }

  function saveTodayEntry() {
    const existing = log.findIndex(l => l.date === today())
    const updated = existing >= 0 ? log.map((l, i) => i === existing ? todayEntry : l) : [...log, todayEntry]
    persistLog(updated)
    // Update activity stats
    persistActivities(activities.map(a => {
      if (!todayEntry.activitiesCompleted.includes(a.id)) return a
      return { ...a, lastDone: today(), totalSessions: a.totalSessions + 1 }
    }))
    toastSuccess('Self-care logged!')
  }

  function addActivity() {
    if (!newActivity.name.trim()) return
    const created: SelfCareActivity = { ...newActivity, id: Date.now().toString(), lastDone: '', streak: 0, totalSessions: 0 }
    persistActivities([...activities, created])
    setNewActivity({ name: '', category: 'physical', duration: 15, frequency: 'daily', notes: '' })
    setShowAddActivity(false)
    toastSuccess('Activity added!')
  }

  const completedToday = todayEntry.activitiesCompleted.length
  const totalToday = activities.filter(a => a.frequency === 'daily').length
  const selfCareScore = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  const streak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (log.find(l => l.date === ds && l.activitiesCompleted.length > 0)) {
        s++; d.setDate(d.getDate() - 1)
      } else break
    }
    return s
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Self-Care Ritual</h1>
          <p className="text-slate-400 text-sm mt-1">Your daily investment in yourself</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pink-400">❤️ {streak}d</div>
          <div className="text-xs text-slate-500">care streak</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['today', 'rituals', 'history'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'today' && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="game-card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">Today's Care</span>
              <span className={`text-sm font-bold ${selfCareScore >= 75 ? 'text-green-400' : selfCareScore >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                {completedToday}/{totalToday} daily rituals
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${selfCareScore}%` }} />
            </div>
          </div>

          {/* Activity checklist */}
          <div className="space-y-2">
            {activities.map(act => {
              const done = todayEntry.activitiesCompleted.includes(act.id)
              const cfg = CAT_CONFIG[act.category]
              return (
                <button key={act.id} onClick={() => toggleActivity(act.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${done ? 'bg-pink-900/30 border border-pink-700/40' : 'bg-slate-800 border border-slate-700 hover:border-slate-600'}`}>
                  <span className="text-xl">{cfg.emoji}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-white'}`}>{act.name}</div>
                    <div className="text-xs text-slate-500">{act.duration} min · {act.frequency} · {act.totalSessions} sessions done</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-pink-500 border-pink-500' : 'border-slate-600'}`}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Self-care score + notes */}
          <div className="game-card p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">How well did you take care of yourself today? (1-10)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setTodayEntry(e => ({ ...e, selfCareScore: n }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${todayEntry.selfCareScore >= n ? 'bg-pink-500/40 text-pink-300' : 'bg-slate-700 text-slate-500'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <input className="game-input w-full" placeholder="How does your body feel?" value={todayEntry.bodyFeeling}
              onChange={e => setTodayEntry(x => ({ ...x, bodyFeeling: e.target.value }))} />
            <input className="game-input w-full" placeholder="Emotional state?" value={todayEntry.emotionalState}
              onChange={e => setTodayEntry(x => ({ ...x, emotionalState: e.target.value }))} />
            <button onClick={saveTodayEntry}
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
              <Save className="w-4 h-4" /> Save Today's Self-Care
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rituals' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddActivity(!showAddActivity)}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors border border-slate-600">
            <Plus className="w-4 h-4" /> Add Custom Ritual
          </button>

          {showAddActivity && (
            <div className="game-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="game-input w-full" placeholder="Activity name" value={newActivity.name}
                  onChange={e => setNewActivity(a => ({ ...a, name: e.target.value }))} />
                <select className="game-input w-full" value={newActivity.category}
                  onChange={e => setNewActivity(a => ({ ...a, category: e.target.value as SelfCareActivity['category'] }))}>
                  {Object.entries(CAT_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.emoji} {v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="game-input w-full" placeholder="Duration (min)" value={newActivity.duration || ''}
                  onChange={e => setNewActivity(a => ({ ...a, duration: Number(e.target.value) }))} />
                <select className="game-input w-full" value={newActivity.frequency}
                  onChange={e => setNewActivity(a => ({ ...a, frequency: e.target.value as SelfCareActivity['frequency'] }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As needed</option>
                </select>
              </div>
              <button onClick={addActivity}
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
                <Save className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          )}

          <div className="space-y-2">
            {activities.map(a => {
              const cfg = CAT_CONFIG[a.category]
              return (
                <div key={a.id} className={`game-card p-3 flex items-center gap-3 ${cfg.bg}`}>
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.duration} min · {a.frequency} · {a.totalSessions} done{a.lastDone ? ` · last: ${a.lastDone}` : ''}</div>
                  </div>
                  <button onClick={() => persistActivities(activities.filter(x => x.id !== a.id))}
                    className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{streak}</div>
              <div className="text-xs text-slate-500 mt-1">Day streak</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {log.length ? (log.reduce((s, l) => s + l.selfCareScore, 0) / log.length).toFixed(1) : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg self-care score</div>
            </div>
          </div>
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Days</h3>
            <div className="space-y-2">
              {[...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-xl">
                  <span className="text-xs text-slate-500 w-20">{l.date}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${l.selfCareScore * 10}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{l.activitiesCompleted.length} rituals</span>
                  <span className="text-xs font-bold text-pink-400">{l.selfCareScore}/10</span>
                </div>
              ))}
              {log.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No logs yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

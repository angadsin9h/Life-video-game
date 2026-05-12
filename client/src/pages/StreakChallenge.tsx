import { useEffect, useState } from 'react'
import { Flame, Plus, Check, X, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface StreakItem {
  id: string
  name: string
  emoji: string
  color: string
  startDate: string
  checkIns: string[]
  currentStreak: number
  bestStreak: number
  totalDays: number
  category: string
  why: string
}

const PRESET_STREAKS = [
  { name: 'No Alcohol', emoji: '🚫🍺', color: '#3b82f6', category: 'health', why: 'Clearer mind, better sleep, more control' },
  { name: 'Daily Exercise', emoji: '💪', color: '#22c55e', category: 'fitness', why: 'Build the strongest version of my body' },
  { name: 'Cold Shower', emoji: '🧊', color: '#06b6d4', category: 'discipline', why: 'Mental toughness and alertness' },
  { name: 'Meditation', emoji: '🧘', color: '#8b5cf6', category: 'mindset', why: 'Inner calm and clarity' },
  { name: 'No Junk Food', emoji: '🥗', color: '#22c55e', category: 'health', why: 'Energy and optimal performance' },
  { name: 'Reading', emoji: '📚', color: '#f97316', category: 'learning', why: 'Continuous growth and knowledge' },
  { name: 'Journaling', emoji: '📓', color: '#eab308', category: 'reflection', why: 'Process thoughts and track growth' },
  { name: 'No Social Media', emoji: '📵', color: '#ec4899', category: 'focus', why: 'Protect attention and time' },
  { name: 'Sleep by 10pm', emoji: '🌙', color: '#6366f1', category: 'health', why: 'Optimize recovery and energy' },
  { name: 'Daily Walk', emoji: '🚶', color: '#84cc16', category: 'health', why: 'Movement and mental clarity' },
]

const STORAGE_KEY = 'streak_challenge'

const calcStreak = (checkIns: string[]) => {
  if (checkIns.length === 0) return 0
  const sorted = [...checkIns].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let streak = 0
  let current = sorted[0] === today ? today : yesterday
  for (const date of sorted) {
    if (date === current) {
      streak++
      const d = new Date(current + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      current = d.toISOString().split('T')[0]
    } else break
  }
  return streak
}

export default function StreakChallenge() {
  const { toastSuccess } = useToast()
  const [streaks, setStreaks] = useState<StreakItem[]>([])
  const [showPresets, setShowPresets] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', emoji: '⭐', color: '#8b5cf6', category: 'habit', why: '' })
  const [expanded, setExpanded] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setStreaks(JSON.parse(saved))
  }, [])

  const persist = (updated: StreakItem[]) => {
    setStreaks(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addPreset = (p: typeof PRESET_STREAKS[0]) => {
    if (streaks.find(s => s.name === p.name)) return
    const item: StreakItem = {
      id: Date.now().toString(),
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      category: p.category,
      why: p.why,
      startDate: today,
      checkIns: [],
      currentStreak: 0,
      bestStreak: 0,
      totalDays: 0,
    }
    persist([...streaks, item])
    setShowPresets(false)
    toastSuccess(`${p.name} streak started!`)
  }

  const addCustom = () => {
    if (!customForm.name.trim()) return
    const item: StreakItem = {
      id: Date.now().toString(),
      ...customForm,
      startDate: today,
      checkIns: [],
      currentStreak: 0,
      bestStreak: 0,
      totalDays: 0,
    }
    persist([...streaks, item])
    setCustomForm({ name: '', emoji: '⭐', color: '#8b5cf6', category: 'habit', why: '' })
    setShowCustom(false)
    toastSuccess('Custom streak started!')
  }

  const checkIn = (id: string) => {
    const updated = streaks.map(s => {
      if (s.id !== id || s.checkIns.includes(today)) return s
      const newCheckIns = [...s.checkIns, today]
      const streak = calcStreak(newCheckIns)
      return { ...s, checkIns: newCheckIns, currentStreak: streak, bestStreak: Math.max(streak, s.bestStreak), totalDays: newCheckIns.length }
    })
    persist(updated)
    toastSuccess('Checked in! Keep the streak alive! 🔥')
  }

  const miss = (id: string) => {
    const updated = streaks.map(s => {
      if (s.id !== id) return s
      return { ...s, currentStreak: 0 }
    })
    persist(updated)
  }

  const deleteStreak = (id: string) => persist(streaks.filter(s => s.id !== id))

  const bestStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.bestStreak)) : 0
  const totalCheckIns = streaks.reduce((sum, s) => sum + s.totalDays, 0)

  const getCalendar = (s: StreakItem) => {
    return Array.from({ length: 21 }, (_, i) => {
      const d = new Date(Date.now() - (20 - i) * 86400000)
      return { date: d.toISOString().split('T')[0], done: s.checkIns.includes(d.toISOString().split('T')[0]) }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Streak Challenge
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build powerful daily habits with streak tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowPresets(true); setShowCustom(false) }} className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Presets
          </button>
          <button onClick={() => { setShowCustom(true); setShowPresets(false) }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Custom
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{bestStreak}</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <Check className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{totalCheckIns}</div>
          <div className="text-xs text-slate-500">Total Check-ins</div>
        </div>
        <div className="game-card p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{streaks.length}</div>
          <div className="text-xs text-slate-500">Active Streaks</div>
        </div>
      </div>

      {/* Preset picker */}
      {showPresets && (
        <div className="game-card p-4 space-y-2 border border-orange-500/20">
          <h3 className="font-semibold text-slate-300 mb-3">Choose a Streak to Start</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_STREAKS.map(p => {
              const exists = streaks.some(s => s.name === p.name)
              return (
                <button key={p.name} onClick={() => !exists && addPreset(p)} disabled={exists}
                  className="p-3 rounded-xl text-left transition-all hover:bg-slate-700/50 disabled:opacity-40"
                  style={{ background: p.color + '11', border: `1px solid ${p.color}33` }}>
                  <div className="text-lg mb-1">{p.emoji}</div>
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-slate-500">{exists ? '✓ Active' : p.category}</div>
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowPresets(false)} className="text-xs text-slate-500 hover:text-slate-400">Close</button>
        </div>
      )}

      {/* Custom form */}
      {showCustom && (
        <div className="game-card p-5 space-y-4 border border-orange-500/20">
          <h3 className="font-semibold text-slate-300">Custom Streak</h3>
          <div className="flex gap-2">
            <input value={customForm.emoji} onChange={e => setCustomForm(f => ({ ...f, emoji: e.target.value }))}
              className="game-input w-16 text-center text-lg" maxLength={2} />
            <input value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Streak name" className="game-input flex-1" autoFocus />
          </div>
          <input value={customForm.why} onChange={e => setCustomForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this matter to you?" className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={addCustom} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Start Streak
            </button>
            <button onClick={() => setShowCustom(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Streaks */}
      <div className="space-y-3">
        {streaks.sort((a, b) => b.currentStreak - a.currentStreak).map(s => {
          const checkedToday = s.checkIns.includes(today)
          const calendar = getCalendar(s)

          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{s.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="text-orange-400 font-semibold">🔥 {s.currentStreak}d</span>
                        <span>Best: {s.bestStreak}d</span>
                        <span>{s.totalDays} total</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkedToday ? (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); checkIn(s.id) }}
                          className="px-3 py-1.5 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors">
                          ✓
                        </button>
                        <button onClick={e => { e.stopPropagation(); miss(s.id) }}
                          className="px-2 py-1.5 bg-slate-700 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg text-xs transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {expanded === s.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
              </div>

              {expanded === s.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                  {s.why && <p className="text-xs text-slate-500 italic">Why: {s.why}</p>}
                  <div className="flex gap-0.5">
                    {calendar.map((day, i) => (
                      <div key={i} className="flex-1 h-5 rounded-sm" title={`${day.date}: ${day.done ? '✓' : '✗'}`}
                        style={{ background: day.done ? s.color : '#1e293b', opacity: day.done ? 1 : 0.3 }} />
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 text-center">Last 21 days</div>
                  <button onClick={() => deleteStreak(s.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">
                    Delete streak
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {streaks.length === 0 && !showPresets && !showCustom && (
        <div className="text-center py-16 text-slate-500">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-5">Start a streak. Don't break it.</p>
          <button onClick={() => setShowPresets(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Start a Streak
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Swords, Plus, TrendingUp, Star, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface XPEvent {
  id: number
  date: string
  source: string
  amount: number
  category: string
  description: string
  created_at: string
}

interface XPSummary {
  totals: Array<{ category: string; total: number; count: number }>
  grandTotal: number
}

const CATEGORIES = [
  { name: 'health', emoji: '💪', color: '#22c55e' },
  { name: 'learning', emoji: '📚', color: '#3b82f6' },
  { name: 'work', emoji: '💼', color: '#f59e0b' },
  { name: 'mindset', emoji: '🧠', color: '#a855f7' },
  { name: 'social', emoji: '❤️', color: '#ec4899' },
  { name: 'habits', emoji: '🔥', color: '#f97316' },
  { name: 'creativity', emoji: '🎨', color: '#6366f1' },
  { name: 'general', emoji: '⭐', color: '#64748b' },
]

const QUICK_SOURCES = [
  { source: 'Habit completed', amount: 10, category: 'habits' },
  { source: 'Workout done', amount: 25, category: 'health' },
  { source: 'Book chapter read', amount: 15, category: 'learning' },
  { source: 'Meditation', amount: 20, category: 'mindset' },
  { source: 'Deep work session', amount: 30, category: 'work' },
  { source: 'Journaled', amount: 10, category: 'mindset' },
  { source: 'Helped someone', amount: 20, category: 'social' },
  { source: 'Goal milestone', amount: 50, category: 'general' },
]

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

function totalXPForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += xpForLevel(l)
  return total
}

function getLevelFromXP(xp: number): { level: number; progress: number; needed: number } {
  let level = 1
  let remaining = xp
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level++
  }
  return { level, progress: remaining, needed: xpForLevel(level) }
}

const LEVEL_TITLES = ['', 'Novice', 'Apprentice', 'Seeker', 'Warrior', 'Champion', 'Hero', 'Legend', 'Master', 'Grandmaster', 'Ascendant']

export default function XPCenter() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<XPEvent[]>([])
  const [summary, setSummary] = useState<XPSummary>({ totals: [], grandTotal: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ source: '', amount: 10, category: 'general', description: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [eventsRes, summaryRes] = await Promise.all([
        axios.get('/api/xp-events?limit=50'),
        axios.get('/api/xp-events/summary'),
      ])
      setEvents(eventsRes.data as XPEvent[])
      setSummary(summaryRes.data as XPSummary)
    } finally {
      setLoading(false)
    }
  }

  const addXP = async () => {
    if (!form.source.trim() || form.amount <= 0) return
    await axios.post('/api/xp-events', {
      date: new Date().toISOString().split('T')[0],
      source: form.source.trim(),
      amount: form.amount,
      category: form.category,
      description: form.description,
    })
    toastSuccess(`+${form.amount} XP earned! 🎮`)
    setForm({ source: '', amount: 10, category: 'general', description: '' })
    setShowForm(false)
    load()
  }

  const quickAdd = async (item: typeof QUICK_SOURCES[0]) => {
    await axios.post('/api/xp-events', {
      date: new Date().toISOString().split('T')[0],
      source: item.source,
      amount: item.amount,
      category: item.category,
      description: '',
    })
    toastSuccess(`+${item.amount} XP — ${item.source}! 🔥`)
    load()
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const { level, progress, needed } = getLevelFromXP(summary.grandTotal)
  const levelTitle = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Ascendant'

  // Today's XP
  const today = new Date().toISOString().split('T')[0]
  const todayXP = events.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)
  const thisWeekXP = events.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7
  }).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Swords className="w-7 h-7 text-violet-400" />
            XP Center
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track experience points across all life categories</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log XP
        </button>
      </div>

      {/* Level card */}
      <div className="game-card p-5 border border-violet-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-violet-400 uppercase tracking-wider mb-0.5">Current Level</div>
            <div className="text-4xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{level}</div>
            <div className="text-sm text-violet-300 font-medium">{levelTitle}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{summary.grandTotal.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total XP</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{progress} / {needed} XP to Level {level + 1}</span>
            <span>{Math.round((progress / needed) * 100)}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${(progress / needed) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{todayXP}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{thisWeekXP}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3 text-center">
          <Star className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-violet-400">{events.length}</div>
          <div className="text-xs text-slate-500">Actions</div>
        </div>
      </div>

      {/* Quick add */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Add</h3>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_SOURCES.map(item => {
            const cat = CATEGORIES.find(c => c.name === item.category) || CATEGORIES[7]
            return (
              <button key={item.source} onClick={() => quickAdd(item)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors group">
                <span className="text-base">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{item.source}</div>
                </div>
                <div className="text-xs font-bold flex-shrink-0" style={{ color: cat.color }}>+{item.amount}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <h3 className="font-semibold text-slate-300">Log Custom XP</h3>
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Source of XP (e.g. Completed project milestone)" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">XP Amount</label>
              <input type="number" min="1" max="1000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="game-input w-full">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addXP} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Swords className="w-4 h-4 inline mr-1.5" />Log XP
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {summary.totals.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">XP by Category</h3>
          <div className="space-y-2">
            {summary.totals.map(t => {
              const cat = CATEGORIES.find(c => c.name === t.category) || CATEGORIES[7]
              return (
                <div key={t.category} className="flex items-center gap-3">
                  <span className="text-sm w-6 text-center">{cat.emoji}</span>
                  <div className="text-xs text-slate-400 w-20 capitalize">{t.category}</div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(t.total / summary.grandTotal) * 100}%`, background: cat.color }} />
                  </div>
                  <div className="text-xs font-bold w-16 text-right" style={{ color: cat.color }}>{t.total.toLocaleString()} XP</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent events */}
      {events.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent XP Log</h3>
          <div className="space-y-2">
            {events.slice(0, 10).map(e => {
              const cat = CATEGORIES.find(c => c.name === e.category) || CATEGORIES[7]
              return (
                <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-sm">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{e.source}</div>
                    <div className="text-xs text-slate-600">{e.date}</div>
                  </div>
                  <div className="text-sm font-bold flex-shrink-0" style={{ color: cat.color }}>+{e.amount}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

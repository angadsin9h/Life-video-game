import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Swords, Plus, Trash2, Check, X, Flame, Trophy, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Challenge {
  id: number
  name: string
  description: string | null
  duration_days: number
  category: string
  start_date: string
  end_date: string
  status: string
  streak: number
  totalCompleted: number
  daysSinceStart: number
  progressPct: number
  checkedToday: boolean
}

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth', 'creative']
const CAT_COLORS: Record<string, string> = {
  health: '#22c55e', mind: '#06b6d4', work: '#8b5cf6', social: '#eab308', growth: '#f97316', creative: '#ec4899',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀', creative: '🎨' }

const CHALLENGE_TEMPLATES = [
  { name: '30 Days of Exercise', description: 'Move your body every single day', duration_days: 30, category: 'health' },
  { name: 'No Sugar Challenge', description: 'Eliminate added sugar for 21 days', duration_days: 21, category: 'health' },
  { name: '30-Day Reading Challenge', description: 'Read at least 20 pages every day', duration_days: 30, category: 'mind' },
  { name: '21 Days of Meditation', description: 'Meditate for at least 10 minutes daily', duration_days: 21, category: 'mind' },
  { name: 'No Social Media', description: 'Disconnect for better focus', duration_days: 7, category: 'mind' },
  { name: '30 Days Gratitude', description: 'Write 3 things you\'re grateful for daily', duration_days: 30, category: 'growth' },
  { name: 'Cold Shower Challenge', description: 'Start every day with cold water', duration_days: 30, category: 'health' },
  { name: 'Daily Journaling', description: 'Write in your journal every day', duration_days: 30, category: 'growth' },
]

function ChallengeCard({ challenge, onCheckin, onDelete }: {
  challenge: Challenge
  onCheckin: (id: number) => void
  onDelete: (id: number) => void
}) {
  const color = CAT_COLORS[challenge.category] || '#8b5cf6'
  const isCompleted = challenge.status === 'completed'
  const daysLeft = challenge.duration_days - challenge.totalCompleted

  return (
    <div className={`game-card p-4 border-l-4 ${isCompleted ? 'opacity-75' : ''}`} style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-100">{challenge.name}</span>
            {isCompleted && <span className="text-xs text-green-400 font-semibold">✓ Completed!</span>}
          </div>
          {challenge.description && <p className="text-xs text-slate-500 mt-0.5">{challenge.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span>{CAT_ICONS[challenge.category]} {challenge.category}</span>
            <span><Calendar className="w-3 h-3 inline" /> {challenge.duration_days} days</span>
            {challenge.streak > 0 && (
              <span className="text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> {challenge.streak} day streak
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!isCompleted && !challenge.checkedToday && (
            <button onClick={() => onCheckin(challenge.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
              style={{ backgroundColor: color }}>
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          )}
          {challenge.checkedToday && !isCompleted && (
            <span className="text-xs text-green-400 font-semibold flex items-center gap-1 px-2">
              <Check className="w-3.5 h-3.5" /> Today ✓
            </span>
          )}
          <button onClick={() => onDelete(challenge.id)}
            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{challenge.totalCompleted}/{challenge.duration_days} days</span>
          <span>{isCompleted ? '🏆 Done!' : `${daysLeft} left`}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${challenge.progressPct}%`, backgroundColor: color }} />
        </div>
      </div>

      {/* Mini calendar - last 7 days */}
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const ds = d.toISOString().split('T')[0]
          const isInChallenge = ds >= challenge.start_date
          return (
            <div key={i} className="flex-1 text-center">
              <div className={`w-full aspect-square rounded-sm ${isInChallenge ? '' : 'opacity-20'}`}
                style={{ backgroundColor: isInChallenge ? color + '60' : '#1e293b' }}
                title={ds} />
              <span className="text-[8px] text-slate-700">
                {new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HabitChallenges() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', duration_days: 30, category: 'health', start_date: today })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')

  const load = useCallback(async () => {
    const res = await axios.get<Challenge[]>('/api/habit-challenges')
    setChallenges(res.data)
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const createChallenge = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/habit-challenges', form)
      setForm({ name: '', description: '', duration_days: 30, category: 'health', start_date: today })
      setShowCreate(false)
      await load()
      toastSuccess('Challenge started! 🔥')
    } finally { setSaving(false) }
  }

  const useTemplate = (t: typeof CHALLENGE_TEMPLATES[0]) => {
    setForm({ ...t, start_date: today })
    setShowTemplates(false)
    setShowCreate(true)
  }

  const checkin = async (id: number) => {
    await axios.post(`/api/habit-challenges/${id}/checkin`, { date: today })
    setChallenges(prev => prev.map(c => c.id === id ? {
      ...c,
      checkedToday: true,
      streak: c.streak + 1,
      totalCompleted: c.totalCompleted + 1,
      progressPct: Math.min(100, Math.round(((c.totalCompleted + 1) / c.duration_days) * 100))
    } : c))
    toastSuccess('Day checked! Keep going! 🔥')
  }

  const deleteChallenge = async (id: number) => {
    await axios.delete(`/api/habit-challenges/${id}`)
    setChallenges(prev => prev.filter(c => c.id !== id))
  }

  const filtered = challenges.filter(c =>
    filter === 'all' ? true : filter === 'active' ? c.status === 'active' : c.status === 'completed'
  )
  const activeCount = challenges.filter(c => c.status === 'active').length
  const checkedToday = challenges.filter(c => c.checkedToday && c.status === 'active').length

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Swords className="w-7 h-7 text-orange-400" />
            Habit Challenges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {activeCount > 0 ? `${checkedToday}/${activeCount} checked in today` : 'Start a 30-day challenge'}
          </p>
        </div>
        <button onClick={() => { setShowCreate(s => !s); setShowTemplates(false) }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showCreate ? 'bg-slate-700 text-slate-300' : 'bg-orange-600 hover:bg-orange-500 text-white'
          }`}>
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Challenge'}
        </button>
      </div>

      {/* Templates */}
      {!showCreate && !showTemplates && (
        <button onClick={() => setShowTemplates(true)}
          className="w-full game-card p-3 text-center text-sm text-slate-500 hover:text-slate-300 hover:border-orange-500/30 transition-all">
          Browse {CHALLENGE_TEMPLATES.length} challenge templates →
        </button>
      )}

      {showTemplates && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Challenge Templates</span>
            <button onClick={() => setShowTemplates(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHALLENGE_TEMPLATES.map(t => (
              <button key={t.name} onClick={() => useTemplate(t)}
                className="game-card p-3 text-left hover:border-orange-500/40 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CAT_ICONS[t.category]}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-600">{t.duration_days} days · {t.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <input autoFocus placeholder="Challenge name…" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="game-input w-full font-semibold" />
          <textarea rows={2} placeholder="Description (optional)…" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <div className="grid grid-cols-3 gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
            <div className="flex gap-1 col-span-1">
              {[7, 21, 30, 60].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, duration_days: d }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    form.duration_days === d ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}>
                  {d}d
                </button>
              ))}
            </div>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="game-input text-sm" />
          </div>
          <button onClick={createChallenge} disabled={saving || !form.name.trim()}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Starting…' : `Start ${form.duration_days}-Day Challenge 🔥`}
          </button>
        </div>
      )}

      {/* Filter */}
      {challenges.length > 0 && (
        <div className="flex gap-1.5">
          {(['active', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-orange-600/30 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
              }`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Challenges list */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(c => (
          <ChallengeCard key={c.id} challenge={c} onCheckin={checkin} onDelete={deleteChallenge} />
        )) : (
          <div className="text-center py-16 text-slate-600">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{filter === 'completed' ? 'No completed challenges yet' : 'No active challenges'}</p>
            <p className="text-xs mt-1">Pick a 21 or 30-day challenge to level up a habit</p>
          </div>
        )}
      </div>
    </div>
  )
}

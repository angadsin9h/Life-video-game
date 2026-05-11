import { useState, useMemo } from 'react'
import axios from 'axios'
import { CheckCircle2, Loader2, Zap } from 'lucide-react'
import TaskForm, { Task } from '../components/TaskForm'
import { useToast } from '../contexts/ToastContext'

const CAT_MAX: Record<string, number> = { health: 25, mind: 25, work: 25, social: 10, growth: 15 }
const CAT_COLORS: Record<string, string> = {
  health: 'bar-health', mind: 'bar-mind', work: 'bar-work', social: 'bar-social', growth: 'bar-growth',
}
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

function calcPreviewScore(tasks: Task[]): { total: number; breakdown: Record<string, number> } {
  const catScores: Record<string, number> = {}
  for (const task of tasks) {
    if (!task.task_name.trim()) continue
    const cat = task.category
    const max = CAT_MAX[cat] ?? 0
    let pts = task.duration_minutes >= 30 ? max : task.duration_minutes >= 15 ? max * 0.75 : max * 0.5
    catScores[cat] = Math.min(max, (catScores[cat] ?? 0) + pts)
  }
  const total = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0))
  const breakdown: Record<string, number> = {}
  for (const [cat, pts] of Object.entries(catScores)) breakdown[cat] = Math.round(pts)
  return { total, breakdown }
}

function ScoreGauge({ score, animated = false }: { score: number; animated?: boolean }) {
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : score >= 40 ? 'text-orange-400' : 'text-violet-400'
  const barColor = score >= 80 ? 'bar-health' : score >= 60 ? 'bar-growth' : score >= 40 ? 'bar-social' : 'bar-work'
  return (
    <div className={`text-center ${animated ? 'animate-bounce-once' : ''}`}>
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
        {animated ? 'Final Score' : 'Live Preview'}
      </div>
      <div className={`text-5xl font-bold neon-text ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
        {score}
      </div>
      <div className="text-slate-500 text-sm">/ 100 pts</div>
      <div className="stat-bar h-2 mt-2">
        <div className={`stat-bar-fill ${barColor} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function LogTasks() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tasks, setTasks] = useState<Task[]>([{ category: 'health', task_name: '', duration_minutes: 30, notes: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; xp_earned?: number } | null>(null)
  const [error, setError] = useState('')
  const { toastXP, toastSuccess } = useToast()

  const preview = useMemo(() => calcPreviewScore(tasks), [tasks])

  const handleSubmit = async () => {
    const valid = tasks.filter(t => t.task_name.trim())
    if (!valid.length) { setError('Add at least one task with a name.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await axios.post<{ score: number; xp_earned?: number }>('/api/logs', { date, tasks: valid })
      setResult(res.data)
      const xp = res.data.xp_earned ?? res.data.score * 2
      toastXP(xp, `Score: ${res.data.score}/100`)
      if (res.data.score >= 80) toastSuccess('Legendary Day! 🔥', 'You scored 80+ today')
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Log Tasks</h1>
        <p className="text-slate-400 mt-1">Record what you accomplished — watch your score grow</p>
      </div>

      <div className="game-card p-5">
        <label className="block text-sm text-slate-400 mb-1">Date</label>
        <input
          type="date"
          className="game-input"
          value={date}
          onChange={e => { setDate(e.target.value); setResult(null) }}
        />
      </div>

      {/* Live score preview */}
      {!result && (
        <div className="game-card p-5 glowing-border">
          <ScoreGauge score={preview.total} />
          {Object.keys(preview.breakdown).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(preview.breakdown).map(([cat, pts]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-slate-400">{CAT_ICONS[cat]} {cat}</span>
                  <div className="flex-1 stat-bar h-1.5">
                    <div
                      className={`stat-bar-fill ${CAT_COLORS[cat]} transition-all duration-500`}
                      style={{ width: `${(pts / (CAT_MAX[cat] ?? 25)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {pts}<span className="text-slate-600">/{CAT_MAX[cat]}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {Object.keys(preview.breakdown).length === 0 && (
            <p className="text-xs text-slate-600 text-center mt-2">Fill in tasks below to see your score</p>
          )}
        </div>
      )}

      <TaskForm tasks={tasks} onChange={setTasks} />

      {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</div>}

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="game-btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {submitting ? 'Saving...' : 'Save Log & Earn XP'}
        </button>
      )}

      {result && (
        <div className="game-card p-6 text-center border-violet-500/50 glowing-border space-y-3">
          <div className="text-2xl">
            {result.score >= 80 ? '🔥' : result.score >= 60 ? '⚡' : result.score >= 40 ? '💪' : '🌱'}
          </div>
          <ScoreGauge score={result.score} animated />
          <p className="text-slate-300 text-sm">
            {result.score >= 80 ? 'Legendary performance! You crushed it today!' :
             result.score >= 60 ? 'Great work! Keep the streak alive!' :
             result.score >= 40 ? 'Solid effort! Tomorrow aim higher!' :
             'Good start! Every logged day counts!'}
          </p>
          <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm font-semibold">
            <Zap className="w-4 h-4" />
            <span>XP awarded — check your Profile!</span>
          </div>
          <button
            onClick={() => { setResult(null); setTasks([{ category: 'health', task_name: '', duration_minutes: 30, notes: '' }]) }}
            className="game-btn-secondary text-sm"
          >
            Log Another Day
          </button>
        </div>
      )}
    </div>
  )
}

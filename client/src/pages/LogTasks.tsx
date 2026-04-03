import { useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Loader2 } from 'lucide-react'
import TaskForm, { Task } from '../components/TaskForm'

export default function LogTasks() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tasks, setTasks] = useState<Task[]>([{ category: 'health', task_name: '', duration_minutes: 30, notes: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const valid = tasks.filter(t => t.task_name.trim())
    if (!valid.length) { setError('Add at least one task with a name.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await axios.post<{ score: number }>('/api/logs', { date, tasks: valid })
      setResult(res.data)
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
        <p className="text-slate-400 mt-1">Record what you accomplished today</p>
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

      <TaskForm tasks={tasks} onChange={setTasks} />

      {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="game-btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        {submitting ? 'Saving...' : 'Save Today\'s Log'}
      </button>

      {result && (
        <div className="game-card p-6 text-center border-violet-500/50 glowing-border animate-pulse-glow">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Score Earned</p>
          <div className="text-6xl font-bold text-violet-400 neon-text" style={{ fontFamily: 'Orbitron, monospace' }}>
            {result.score}
          </div>
          <p className="text-slate-300 mt-2">/ 100 points</p>
          <p className="text-sm text-slate-400 mt-3">
            {result.score >= 80 ? '🔥 Amazing day! Legendary performance!' :
             result.score >= 60 ? '⚡ Great work! Keep the streak alive!' :
             result.score >= 40 ? '💪 Solid effort! Tomorrow aim higher!' :
             '🌱 Good start! Every logged day counts!'}
          </p>
        </div>
      )}
    </div>
  )
}

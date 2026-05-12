import { useEffect, useState } from 'react'
import axios from 'axios'
import { Shield, Plus, Check, X, Flame, Trash2, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Commitment {
  id: number
  title: string
  description: string
  category: string
  deadline?: string
  public_stake: string
  status: string
  streak: number
  totalDone: number
  checkins: { date: string; status: string; notes: string }[]
}

const CATEGORIES = [
  { value: 'health', label: 'Health', emoji: '💪', color: '#22c55e' },
  { value: 'work', label: 'Work', emoji: '💼', color: '#3b82f6' },
  { value: 'habit', label: 'Habit', emoji: '🔄', color: '#8b5cf6' },
  { value: 'goal', label: 'Goal', emoji: '🎯', color: '#f97316' },
  { value: 'learning', label: 'Learning', emoji: '📚', color: '#14b8a6' },
  { value: 'social', label: 'Social', emoji: '👥', color: '#ec4899' },
]

export default function Accountability() {
  const { toastSuccess } = useToast()
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'habit', deadline: '', public_stake: '' })
  const [checkingIn, setCheckingIn] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  const load = async () => {
    const r = await axios.get('/api/accountability')
    setCommitments(r.data as Commitment[])
    setLoading(false)
  }

  const addCommitment = async () => {
    if (!form.title.trim()) return
    await axios.post('/api/accountability', form)
    setForm({ title: '', description: '', category: 'habit', deadline: '', public_stake: '' })
    setShowForm(false)
    toastSuccess('Commitment added!')
    load()
  }

  const checkIn = async (id: number, status: 'done' | 'missed' | 'partial') => {
    await axios.post(`/api/accountability/${id}/checkin`, { date: today, status, notes: note })
    setCheckingIn(null)
    setNote('')
    toastSuccess(status === 'done' ? 'Checked in! ✅' : 'Logged.')
    load()
  }

  const deleteCommitment = async (id: number) => {
    await axios.delete(`/api/accountability/${id}`)
    load()
  }

  const daysUntil = (deadline: string) => Math.ceil((new Date(deadline + 'T12:00:00').getTime() - Date.now()) / 86400000)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Accountability
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Make commitments and keep them</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Commit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{commitments.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{Math.max(...commitments.map(c => c.streak), 0)}d</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <Check className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{commitments.reduce((s, c) => s + c.totalDone, 0)}</div>
          <div className="text-xs text-slate-500">Total Check-ins</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-300">New Commitment</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What are you committing to?" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the commitment in detail..." className="game-input w-full h-20 resize-none" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={form.category === c.value ? { background: c.color + '33', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Deadline (optional)</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Stakes (optional)</label>
              <input value={form.public_stake} onChange={e => setForm(f => ({ ...f, public_stake: e.target.value }))}
                placeholder='e.g. "Tell 3 friends"' className="game-input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addCommitment} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Make Commitment
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Commitments */}
      <div className="space-y-4">
        {commitments.map(c => {
          const cat = CATEGORIES.find(cat => cat.value === c.category)
          const todayCheckin = c.checkins.find(ci => ci.date === today)
          const days = c.deadline ? daysUntil(c.deadline) : null

          return (
            <div key={c.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${cat?.color || '#3b82f6'}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      {c.streak > 0 && <span className="text-orange-400">🔥 {c.streak}d streak</span>}
                      <span>{c.totalDone} check-ins</span>
                      {days !== null && (
                        <span className={days < 0 ? 'text-red-400' : days < 7 ? 'text-yellow-400' : ''}>
                          <Clock className="w-3 h-3 inline mr-0.5" />{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteCommitment(c.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
              {c.public_stake && <p className="text-xs text-blue-400 italic">Stakes: {c.public_stake}</p>}

              {/* Last 7 days */}
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i))
                  const ds = d.toISOString().split('T')[0]
                  const ci = c.checkins.find(ch => ch.date === ds)
                  return (
                    <div key={i} className="flex-1 h-6 rounded-sm flex items-center justify-center text-xs"
                      style={{
                        background: ci?.status === 'done' ? '#22c55e33' : ci?.status === 'partial' ? '#eab30833' : ci?.status === 'missed' ? '#ef444433' : '#1e293b',
                      }}
                      title={`${ds}: ${ci?.status || 'no data'}`}>
                      {ci?.status === 'done' ? '✓' : ci?.status === 'missed' ? '✗' : ci?.status === 'partial' ? '~' : ''}
                    </div>
                  )
                })}
              </div>

              {/* Today's check-in */}
              {!todayCheckin ? (
                checkingIn === c.id ? (
                  <div className="space-y-2 pt-1">
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Notes (optional)" className="game-input w-full text-xs" />
                    <div className="flex gap-2">
                      <button onClick={() => checkIn(c.id, 'done')} className="flex-1 py-1.5 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        ✅ Done
                      </button>
                      <button onClick={() => checkIn(c.id, 'partial')} className="flex-1 py-1.5 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        ～ Partial
                      </button>
                      <button onClick={() => checkIn(c.id, 'missed')} className="flex-1 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        ✗ Missed
                      </button>
                      <button onClick={() => setCheckingIn(null)} className="px-2 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setCheckingIn(c.id)}
                    className="w-full py-2 border border-dashed border-slate-700 hover:border-blue-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-medium transition-all">
                    + Check in for today
                  </button>
                )
              ) : (
                <div className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold ${
                  todayCheckin.status === 'done' ? 'bg-green-900/20 text-green-400' :
                  todayCheckin.status === 'partial' ? 'bg-yellow-900/20 text-yellow-400' :
                  'bg-red-900/20 text-red-400'
                }`}>
                  {todayCheckin.status === 'done' ? '✅' : todayCheckin.status === 'partial' ? '～' : '✗'}
                  Today: {todayCheckin.status}
                  {todayCheckin.notes && <span className="text-slate-500 font-normal ml-1">· {todayCheckin.notes}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {commitments.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-3">No active commitments.</p>
          <p className="text-sm max-w-xs mx-auto mb-5">Make a commitment to something that matters. Daily check-ins keep you honest.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Make a Commitment
          </button>
        </div>
      )}
    </div>
  )
}

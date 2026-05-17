import { useState, useEffect } from 'react'
import { GraduationCap, Plus, Trash2, Check, Star, Users } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ActionItem {
  id: string
  text: string
  done: boolean
}

interface MentorshipSession {
  id: string
  personName: string
  role: 'Mentor' | 'Mentee'
  date: string
  topic: string
  keyLearnings: string
  actionItems: ActionItem[]
  rating: number
  createdAt: string
}

const STORAGE_KEY = 'mentorship_log'

const defaultForm = {
  personName: '',
  role: 'Mentee' as 'Mentor' | 'Mentee',
  date: new Date().toISOString().split('T')[0],
  topic: '',
  keyLearnings: '',
  actionItemsText: '',
  rating: 5,
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange ? setHover(i) : undefined}
          onMouseLeave={() => onChange ? setHover(0) : undefined}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-4 h-4 ${i <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function MentorshipLog() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]

  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [activeTab, setActiveTab] = useState<'Mentee' | 'Mentor'>('Mentee')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setSessions(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: MentorshipSession[]) => {
    setSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addSession = () => {
    if (!form.personName.trim() || !form.topic.trim()) return
    const actionItems: ActionItem[] = form.actionItemsText
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .map(text => ({ id: Date.now().toString() + Math.random(), text, done: false }))

    const session: MentorshipSession = {
      id: Date.now().toString(),
      personName: form.personName.trim(),
      role: form.role,
      date: form.date,
      topic: form.topic.trim(),
      keyLearnings: form.keyLearnings.trim(),
      actionItems,
      rating: form.rating,
      createdAt: today,
    }
    save([session, ...sessions])
    setForm(defaultForm)
    setShowForm(false)
    toastSuccess(`Session with ${session.personName} logged!`)
  }

  const deleteSession = (id: string) => {
    save(sessions.filter(s => s.id !== id))
    toastSuccess('Session removed.')
  }

  const toggleActionItem = (sessionId: string, itemId: string) => {
    save(sessions.map(s => {
      if (s.id !== sessionId) return s
      return {
        ...s,
        actionItems: s.actionItems.map(item =>
          item.id === itemId ? { ...item, done: !item.done } : item
        ),
      }
    }))
  }

  const filtered = sessions.filter(s => s.role === activeTab)

  // Stats
  const totalSessions = sessions.length
  const avgRating = totalSessions > 0
    ? Math.round((sessions.reduce((acc, s) => acc + s.rating, 0) / totalSessions) * 10) / 10
    : 0
  const uniqueMentors = new Set(sessions.filter(s => s.role === 'Mentee').map(s => s.personName)).size
  const uniqueMentees = new Set(sessions.filter(s => s.role === 'Mentor').map(s => s.personName)).size
  const allItems = sessions.flatMap(s => s.actionItems)
  const completionRate = allItems.length > 0
    ? Math.round((allItems.filter(i => i.done).length / allItems.length) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <GraduationCap className="w-7 h-7 text-purple-400" />
            Mentorship Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track growth through teaching and learning</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalSessions}</div>
          <div className="text-xs text-slate-400 mt-1">Total Sessions</div>
        </div>
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgRating}</div>
          <div className="text-xs text-slate-400 mt-1">Avg Rating</div>
        </div>
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{uniqueMentors + uniqueMentees}</div>
          <div className="text-xs text-slate-400 mt-1">
            <span className="text-cyan-400">{uniqueMentors}</span> Mentors / <span className="text-green-400">{uniqueMentees}</span> Mentees
          </div>
        </div>
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{completionRate}%</div>
          <div className="text-xs text-slate-400 mt-1">Action Completion</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="game-card space-y-4">
          <h2 className="text-lg font-bold text-white">Log New Session</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Person Name *</label>
              <input
                className="game-input w-full"
                placeholder="Name"
                value={form.personName}
                onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Your Role</label>
              <div className="flex gap-2">
                {(['Mentee', 'Mentor'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      form.role === role
                        ? role === 'Mentee'
                          ? 'bg-cyan-700 border-cyan-500 text-cyan-200'
                          : 'bg-green-700 border-green-500 text-green-200'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {role === 'Mentee' ? 'Mentee (Learning)' : 'Mentor (Teaching)'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                className="game-input w-full"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Topic *</label>
              <input
                className="game-input w-full"
                placeholder="What was discussed?"
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Key Learnings</label>
              <textarea
                className="game-input w-full resize-none"
                rows={2}
                placeholder="What did you learn or teach?"
                value={form.keyLearnings}
                onChange={e => setForm(f => ({ ...f, keyLearnings: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Action Items (one per line)</label>
              <textarea
                className="game-input w-full resize-none"
                rows={3}
                placeholder={"Read chapter 5\nPractice the technique\nSchedule follow-up"}
                value={form.actionItemsText}
                onChange={e => setForm(f => ({ ...f, actionItemsText: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Session Rating</label>
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSession}
              disabled={!form.personName.trim() || !form.topic.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Log Session
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(defaultForm) }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {(['Mentee', 'Mentor'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? tab === 'Mentee'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-green-400 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'Mentee' ? <GraduationCap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            As {tab}
            <span className="text-xs bg-slate-700 rounded-full px-1.5 py-0.5 text-slate-300">
              {sessions.filter(s => s.role === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Session List */}
      {filtered.length === 0 ? (
        <div className="game-card text-center py-12">
          {activeTab === 'Mentee' ? (
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          ) : (
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          )}
          <p className="text-slate-400">
            {activeTab === 'Mentee'
              ? 'No mentee sessions yet. Log a session where you were learning!'
              : 'No mentor sessions yet. Log a session where you were teaching!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(session => (
            <div key={session.id} className="game-card space-y-3">
              {/* Session Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base">{session.personName}</h3>
                    <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${
                      session.role === 'Mentee'
                        ? 'text-cyan-400 border-cyan-500/30 bg-cyan-900/20'
                        : 'text-green-400 border-green-500/30 bg-green-900/20'
                    }`}>
                      {session.role === 'Mentee' ? 'Learning from' : 'Teaching'}
                    </span>
                    <StarRating value={session.rating} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-400">{new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-sm font-semibold text-slate-300">{session.topic}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Key Learnings */}
              {session.keyLearnings && (
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Key Learnings</p>
                  <p className="text-sm text-slate-300 line-clamp-3">{session.keyLearnings}</p>
                </div>
              )}

              {/* Action Items */}
              {session.actionItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Action Items</p>
                    <span className="text-xs text-slate-500">
                      {session.actionItems.filter(i => i.done).length}/{session.actionItems.length} done
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {session.actionItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleActionItem(session.id, item.id)}
                        className="flex items-start gap-2 w-full text-left group"
                      >
                        <div className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          item.done
                            ? 'bg-green-600 border-green-500'
                            : 'border-slate-500 group-hover:border-slate-400'
                        }`}>
                          {item.done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm transition-colors ${
                          item.done ? 'text-slate-500 line-through' : 'text-slate-300'
                        }`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Users, Plus, Check, X, Trash2, Search, ChevronDown, ChevronUp, Calendar, Target, Zap, TrendingUp, BookOpen, Shield } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Frequency = 'weekly' | 'bi-weekly' | 'monthly'

type MastermindGroup = {
  id: string
  name: string
  members: string[]
  frequency: Frequency
  focus: string
  active: boolean
}

type Commitment = {
  id: string
  action: string
  dueDate: string
  completed: boolean
}

type MastermindSession = {
  id: string
  groupId: string
  date: string
  attendees: string[]
  hotSeat: string
  challenge: string
  insights: string[]
  commitments: Commitment[]
  energyRating: number
  notes: string
}

const STORAGE_KEY = 'lq-mastermind'

type StoredData = {
  groups: MastermindGroup[]
  sessions: MastermindSession[]
}

const BLANK_GROUP: Omit<MastermindGroup, 'id'> = {
  name: '',
  members: [],
  frequency: 'bi-weekly',
  focus: '',
  active: true,
}

const BLANK_SESSION: Omit<MastermindSession, 'id'> = {
  groupId: '',
  date: new Date().toISOString().split('T')[0],
  attendees: [],
  hotSeat: '',
  challenge: '',
  insights: [''],
  commitments: [],
  energyRating: 8,
  notes: '',
}

const FREQ_LABELS: Record<Frequency, string> = {
  'weekly': 'Weekly',
  'bi-weekly': 'Bi-weekly',
  'monthly': 'Monthly',
}

function AccountabilityLineChart({ sessions }: { sessions: MastermindSession[] }) {
  const W = 420
  const H = 100
  const pad = { top: 12, right: 10, bottom: 20, left: 32 }

  const now = new Date()
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }) }
  })

  const monthlyRates = months.map(({ year, month }) => {
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const allCommitments = sessions
      .filter(s => s.date >= monthStart && s.date <= monthEnd)
      .flatMap(s => s.commitments)
    if (!allCommitments.length) return null
    const onTime = allCommitments.filter(c => c.completed && c.dueDate >= monthStart && c.dueDate <= monthEnd).length
    return Math.round((onTime / allCommitments.length) * 100)
  })

  const validPoints = monthlyRates.filter((v): v is number => v !== null)
  if (validPoints.length < 2) {
    return <p className="text-slate-500 text-xs text-center py-4">Need data from 2+ months</p>
  }

  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const points = monthlyRates.map((v, i) => ({
    x: pad.left + (i / (months.length - 1)) * innerW,
    y: v !== null ? pad.top + innerH - (v / 100) * innerH : null,
    label: months[i].label,
    value: v,
  }))

  const linePoints = points.filter((p): p is typeof p & { y: number } => p.y !== null)
  const polyline = linePoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {[0, 50, 100].map(v => {
        const y = pad.top + innerH - (v / 100) * innerH
        return (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#1e3a5f" strokeWidth={0.5} />
            <text x={pad.left - 4} y={y + 4} textAnchor="end" fill="#475569" fontSize={9}>{v}%</text>
          </g>
        )
      })}
      {polyline && <polyline points={polyline} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinejoin="round" />}
      {points.map((p, i) => (
        <g key={i}>
          {p.y !== null && (
            <>
              <circle cx={p.x} cy={p.y} r={4} fill="#f59e0b" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                {p.value}%
              </text>
            </>
          )}
          <text x={p.x} y={H - pad.bottom + 12} textAnchor="middle" fill="#64748b" fontSize={10}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function GroupCard({ group, onEdit, onDelete }: {
  group: MastermindGroup
  onEdit: (g: MastermindGroup) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="game-card p-4 space-y-2 border-l-2" style={{ borderLeftColor: group.active ? '#f59e0b' : '#475569' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-white text-sm">{group.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{FREQ_LABELS[group.frequency]} · {group.members.length} members</div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onEdit(group)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={() => onDelete(group.id)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/40 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>
      {group.focus && <p className="text-xs text-blue-300/80 italic">"{group.focus}"</p>}
      {group.members.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {group.members.map((m, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{m}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function CommitmentRow({ commitment, onToggle, groupName }: {
  commitment: Commitment & { sessionDate: string; groupId: string }
  onToggle: (commitmentId: string, sessionId: string) => void
  sessionId: string
  groupName: string
}) {
  const overdue = !commitment.completed && commitment.dueDate < new Date().toISOString().split('T')[0]
  return (
    <div className={`game-card p-3 flex items-center gap-3 border-l-2 transition-all ${commitment.completed ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: overdue ? '#ef4444' : commitment.completed ? '#22c55e' : '#f59e0b' }}>
      <button onClick={() => onToggle(commitment.id, commitment.id)}
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
        style={commitment.completed
          ? { background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e' }
          : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)' }}>
        {commitment.completed && <Check className="w-3 h-3 text-green-400" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${commitment.completed ? 'line-through text-slate-500' : 'text-white'}`}>
          {commitment.action}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{groupName}</span>
          <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
            Due {commitment.dueDate}
            {overdue && ' — OVERDUE'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function MastermindLog() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StoredData>({ groups: [], sessions: [] })
  const [view, setView] = useState<'commitments' | 'sessions' | 'groups' | 'insights' | 'add-session'>('commitments')
  const [groupForm, setGroupForm] = useState<Omit<MastermindGroup, 'id'>>(BLANK_GROUP)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [memberInput, setMemberInput] = useState('')
  const [sessionForm, setSessionForm] = useState<Omit<MastermindSession, 'id'>>(BLANK_SESSION)
  const [attendeeInput, setAttendeeInput] = useState('')
  const [insightSearch, setInsightSearch] = useState('')
  const [insightGroupFilter, setInsightGroupFilter] = useState('all')

  useEffect(() => {
    try { setData(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"groups":[],"sessions":[]}')) } catch { /**/ }
  }, [])

  const persist = (updated: StoredData) => {
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveGroup = () => {
    if (!groupForm.name.trim()) return
    if (editingGroupId) {
      persist({ ...data, groups: data.groups.map(g => g.id === editingGroupId ? { ...groupForm, id: editingGroupId } : g) })
      toastSuccess(`Group "${groupForm.name}" updated`)
    } else {
      const g: MastermindGroup = { id: Date.now().toString(), ...groupForm }
      persist({ ...data, groups: [...data.groups, g] })
      toastSuccess(`Group "${g.name}" created`)
    }
    setGroupForm(BLANK_GROUP)
    setEditingGroupId(null)
    setShowGroupForm(false)
  }

  const deleteGroup = (id: string) => {
    persist({ ...data, groups: data.groups.filter(g => g.id !== id) })
  }

  const startEditGroup = (g: MastermindGroup) => {
    setGroupForm({ name: g.name, members: g.members, frequency: g.frequency, focus: g.focus, active: g.active })
    setEditingGroupId(g.id)
    setShowGroupForm(true)
  }

  const addMember = () => {
    const m = memberInput.trim()
    if (!m || groupForm.members.includes(m)) return
    setGroupForm(f => ({ ...f, members: [...f.members, m] }))
    setMemberInput('')
  }

  const removeMember = (m: string) => {
    setGroupForm(f => ({ ...f, members: f.members.filter(x => x !== m) }))
  }

  const addAttendee = () => {
    const a = attendeeInput.trim()
    if (!a || sessionForm.attendees.includes(a)) return
    setSessionForm(f => ({ ...f, attendees: [...f.attendees, a] }))
    setAttendeeInput('')
  }

  const updateInsight = (idx: number, val: string) => {
    setSessionForm(f => {
      const insights = [...f.insights]
      insights[idx] = val
      return { ...f, insights }
    })
  }

  const addInsightField = () => {
    setSessionForm(f => ({ ...f, insights: [...f.insights, ''] }))
  }

  const removeInsightField = (idx: number) => {
    setSessionForm(f => ({ ...f, insights: f.insights.filter((_, i) => i !== idx) }))
  }

  const addCommitmentField = () => {
    const c: Commitment = { id: Date.now().toString(), action: '', dueDate: '', completed: false }
    setSessionForm(f => ({ ...f, commitments: [...f.commitments, c] }))
  }

  const updateCommitment = (idx: number, field: keyof Commitment, value: string | boolean) => {
    setSessionForm(f => {
      const commitments = f.commitments.map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      )
      return { ...f, commitments }
    })
  }

  const removeCommitmentField = (idx: number) => {
    setSessionForm(f => ({ ...f, commitments: f.commitments.filter((_, i) => i !== idx) }))
  }

  const saveSession = () => {
    if (!sessionForm.groupId || !sessionForm.challenge.trim()) return
    const s: MastermindSession = {
      id: Date.now().toString(),
      ...sessionForm,
      insights: sessionForm.insights.filter(i => i.trim()),
      commitments: sessionForm.commitments.filter(c => c.action.trim()),
    }
    persist({ ...data, sessions: [s, ...data.sessions] })
    setSessionForm(BLANK_SESSION)
    setView('commitments')
    toastSuccess('Session logged! Commitments tracked.')
  }

  const toggleCommitment = (commitmentId: string) => {
    const sessions = data.sessions.map(s => ({
      ...s,
      commitments: s.commitments.map(c =>
        c.id === commitmentId ? { ...c, completed: !c.completed } : c
      ),
    }))
    const updated = { ...data, sessions }
    persist(updated)
    const allC = sessions.flatMap(s => s.commitments).find(c => c.id === commitmentId)
    if (allC?.completed) toastSuccess('Commitment completed! 💪')
  }

  const allCommitments = data.sessions.flatMap(s =>
    s.commitments.map(c => ({ ...c, sessionDate: s.date, groupId: s.groupId, sessionId: s.id }))
  )

  const openCommitments = allCommitments
    .filter(c => !c.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const overdueCount = openCommitments.filter(c => c.dueDate < new Date().toISOString().split('T')[0]).length

  const totalCommitments = allCommitments.length
  const completedCommitments = allCommitments.filter(c => c.completed).length
  const accountabilityPct = totalCommitments > 0
    ? Math.round((completedCommitments / totalCommitments) * 100)
    : 0

  const allInsights = data.sessions.flatMap(s =>
    s.insights.map(ins => ({ text: ins, date: s.date, groupId: s.groupId }))
  )

  const filteredInsights = allInsights.filter(ins => {
    const matchText = !insightSearch || ins.text.toLowerCase().includes(insightSearch.toLowerCase())
    const matchGroup = insightGroupFilter === 'all' || ins.groupId === insightGroupFilter
    return matchText && matchGroup
  })

  const groupName = (id: string) => data.groups.find(g => g.id === id)?.name ?? 'Unknown Group'

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-yellow-400" />
            Mastermind
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Groups · Sessions · Accountability</p>
        </div>
        <button
          onClick={() => setView(view === 'add-session' ? 'commitments' : 'add-session')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
        >
          {view === 'add-session' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {view === 'add-session' ? 'Cancel' : 'Log Session'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="game-card p-3 text-center" style={{ background: 'rgba(30,58,95,0.5)' }}>
          <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{data.groups.filter(g => g.active).length}</div>
          <div className="text-xs text-slate-500">Groups</div>
        </div>
        <div className="game-card p-3 text-center" style={{ background: 'rgba(30,58,95,0.5)' }}>
          <BookOpen className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{data.sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3 text-center" style={{ background: 'rgba(30,58,95,0.5)' }}>
          <Target className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-400">{overdueCount}</div>
          <div className="text-xs text-slate-500">Overdue</div>
        </div>
        <div className="game-card p-3 text-center" style={{ background: 'rgba(30,58,95,0.5)' }}>
          <Shield className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{accountabilityPct}%</div>
          <div className="text-xs text-slate-500">On-time</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['commitments', 'sessions', 'groups', 'insights'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={view === v
              ? { background: '#f59e0b', color: '#000' }
              : { background: '#0f172a', color: '#64748b', border: '1px solid #1e3a5f' }}>
            {v === 'commitments' ? `Open (${openCommitments.length})` : v}
          </button>
        ))}
      </div>

      {view === 'add-session' && (
        <div className="game-card p-5 space-y-4" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="font-bold text-yellow-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Log Session
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Group</div>
              <select
                value={sessionForm.groupId}
                onChange={e => setSessionForm(f => ({ ...f, groupId: e.target.value }))}
                className="game-input w-full"
              >
                <option value="">Select group...</option>
                {data.groups.filter(g => g.active).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Date</div>
              <input type="date" value={sessionForm.date}
                onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full" />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1">Attendees</div>
            <div className="flex gap-2 mb-2">
              <input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAttendee()}
                placeholder="Name + Enter" className="game-input flex-1" />
              <button onClick={addAttendee}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                Add
              </button>
            </div>
            {sessionForm.attendees.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sessionForm.attendees.map((a, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {a}
                    <button onClick={() => setSessionForm(f => ({ ...f, attendees: f.attendees.filter((_, j) => j !== i) }))}>
                      <X className="w-2.5 h-2.5 text-slate-500 hover:text-red-400" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <input value={sessionForm.hotSeat}
            onChange={e => setSessionForm(f => ({ ...f, hotSeat: e.target.value }))}
            placeholder="Hot seat (name or 'all')" className="game-input w-full" />

          <textarea value={sessionForm.challenge}
            onChange={e => setSessionForm(f => ({ ...f, challenge: e.target.value }))}
            placeholder="Main challenge discussed..." className="game-input w-full h-20 resize-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-400">Key Insights</div>
              <button onClick={addInsightField}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>
                + Add insight
              </button>
            </div>
            {sessionForm.insights.map((ins, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={ins} onChange={e => updateInsight(i, e.target.value)}
                  placeholder={`Insight ${i + 1}...`} className="game-input flex-1" />
                {sessionForm.insights.length > 1 && (
                  <button onClick={() => removeInsightField(i)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-red-900/40 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-400">Commitments</div>
              <button onClick={addCommitmentField}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                + Add commitment
              </button>
            </div>
            {sessionForm.commitments.map((c, i) => (
              <div key={c.id} className="flex gap-2 mb-2">
                <input value={c.action} onChange={e => updateCommitment(i, 'action', e.target.value)}
                  placeholder="What will you do?" className="game-input flex-1" />
                <input type="date" value={c.dueDate} onChange={e => updateCommitment(i, 'dueDate', e.target.value)}
                  className="game-input w-36" />
                <button onClick={() => removeCommitmentField(i)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-red-900/40 transition-colors">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">Energy Rating</span>
              <span className="text-xs font-bold text-yellow-400">{sessionForm.energyRating}/10</span>
            </div>
            <input type="range" min={1} max={10} value={sessionForm.energyRating}
              onChange={e => setSessionForm(f => ({ ...f, energyRating: Number(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#f59e0b' }} />
          </div>

          <textarea value={sessionForm.notes}
            onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes..." className="game-input w-full h-16 resize-none" />

          <button onClick={saveSession}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #f59e0b)', color: '#000' }}>
            Save Session
          </button>
        </div>
      )}

      {view === 'commitments' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Open Commitments</h3>
          </div>

          {openCommitments.length === 0 ? (
            <div className="game-card p-10 text-center" style={{ background: 'rgba(15,23,42,0.8)' }}>
              <Shield className="w-10 h-10 text-yellow-400/30 mx-auto mb-3" />
              <p className="text-slate-500">All commitments complete. Log a new session to add more.</p>
            </div>
          ) : (
            openCommitments.map(c => (
              <CommitmentRow
                key={c.id}
                commitment={c}
                onToggle={toggleCommitment}
                sessionId={c.sessionId}
                groupName={groupName(c.groupId)}
              />
            ))
          )}

          {data.sessions.length > 0 && (
            <div className="game-card p-4 mt-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" /> Accountability Trend
              </h4>
              <AccountabilityLineChart sessions={data.sessions} />
            </div>
          )}
        </div>
      )}

      {view === 'sessions' && (
        <div className="space-y-3">
          {data.sessions.length === 0 ? (
            <div className="game-card p-10 text-center" style={{ background: 'rgba(15,23,42,0.8)' }}>
              <BookOpen className="w-10 h-10 text-blue-400/30 mx-auto mb-3" />
              <p className="text-slate-500">No sessions yet. Log your first one!</p>
            </div>
          ) : (
            data.sessions.map(s => {
              const g = data.groups.find(gr => gr.id === s.groupId)
              return <SessionCard key={s.id} session={s} groupName={g?.name ?? 'Unknown'} />
            })
          )}
        </div>
      )}

      {view === 'groups' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-400" /> Mastermind Groups
            </h3>
            <button onClick={() => { setGroupForm(BLANK_GROUP); setEditingGroupId(null); setShowGroupForm(v => !v) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
              {showGroupForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showGroupForm ? 'Cancel' : 'New Group'}
            </button>
          </div>

          {showGroupForm && (
            <div className="game-card p-4 space-y-3" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
              <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Group name" className="game-input w-full" autoFocus />
              <input value={groupForm.focus} onChange={e => setGroupForm(f => ({ ...f, focus: e.target.value }))}
                placeholder="What does this group focus on?" className="game-input w-full" />
              <div className="flex gap-2">
                {(['weekly', 'bi-weekly', 'monthly'] as Frequency[]).map(fr => (
                  <button key={fr} onClick={() => setGroupForm(f => ({ ...f, frequency: fr }))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-1"
                    style={groupForm.frequency === fr
                      ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }
                      : { background: '#0f172a', color: '#64748b', border: '1px solid #1e3a5f' }}>
                    {FREQ_LABELS[fr]}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  <input value={memberInput} onChange={e => setMemberInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addMember()}
                    placeholder="Add member + Enter" className="game-input flex-1" />
                  <button onClick={addMember}
                    className="px-3 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {groupForm.members.map(m => (
                    <span key={m} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {m}
                      <button onClick={() => removeMember(m)}><X className="w-2.5 h-2.5 hover:text-red-400" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active-toggle" checked={groupForm.active}
                  onChange={e => setGroupForm(f => ({ ...f, active: e.target.checked }))}
                  className="rounded" />
                <label htmlFor="active-toggle" className="text-xs text-slate-400">Active group</label>
              </div>
              <button onClick={saveGroup}
                className="w-full py-2 rounded-xl font-bold text-sm transition-all"
                style={{ background: '#f59e0b', color: '#000' }}>
                {editingGroupId ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          )}

          {data.groups.length === 0 ? (
            <div className="game-card p-10 text-center" style={{ background: 'rgba(15,23,42,0.8)' }}>
              <Users className="w-10 h-10 text-yellow-400/30 mx-auto mb-3" />
              <p className="text-slate-500">No groups yet. Create your first mastermind group!</p>
            </div>
          ) : (
            data.groups.map(g => (
              <GroupCard key={g.id} group={g} onEdit={startEditGroup} onDelete={deleteGroup} />
            ))
          )}
        </div>
      )}

      {view === 'insights' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={insightSearch} onChange={e => setInsightSearch(e.target.value)}
                placeholder="Search insights..." className="game-input w-full pl-9" />
            </div>
            <select value={insightGroupFilter} onChange={e => setInsightGroupFilter(e.target.value)}
              className="game-input w-36">
              <option value="all">All groups</option>
              {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="text-xs text-slate-500">{filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''}</div>

          {filteredInsights.length === 0 ? (
            <div className="game-card p-10 text-center" style={{ background: 'rgba(15,23,42,0.8)' }}>
              <BookOpen className="w-10 h-10 text-purple-400/30 mx-auto mb-3" />
              <p className="text-slate-500">No insights match. Log sessions to build your library.</p>
            </div>
          ) : (
            filteredInsights.map((ins, i) => (
              <div key={i} className="game-card p-4 border-l-2" style={{ borderLeftColor: '#a855f7', background: 'rgba(168,85,247,0.05)' }}>
                <p className="text-sm text-slate-200">{ins.text}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs text-purple-400">{groupName(ins.groupId)}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{ins.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, groupName }: { session: MastermindSession; groupName: string }) {
  const [expanded, setExpanded] = useState(false)
  const openCount = session.commitments.filter(c => !c.completed).length

  return (
    <div className="game-card p-4 space-y-2" style={{ background: 'rgba(15,23,42,0.8)', borderLeft: '2px solid #1e3a5f' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-white text-sm">{groupName}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">{session.date}</span>
            {session.hotSeat && (
              <>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-yellow-400">Hot seat: {session.hotSeat}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-bold">{session.energyRating}/10</span>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {session.challenge && (
        <p className="text-xs text-slate-300 italic">"{session.challenge}"</p>
      )}

      <div className="flex gap-3 text-xs text-slate-500">
        <span>{session.insights.length} insights</span>
        <span>{session.commitments.length} commitments ({openCount} open)</span>
        {session.attendees.length > 0 && <span>{session.attendees.length} attended</span>}
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-slate-700/50 pt-3">
          {session.insights.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-purple-400 mb-1">Insights</div>
              {session.insights.map((ins, i) => (
                <div key={i} className="text-xs text-slate-300 flex gap-2 mb-1">
                  <span className="text-purple-600">▸</span> {ins}
                </div>
              ))}
            </div>
          )}
          {session.commitments.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-yellow-400 mb-1">Commitments</div>
              {session.commitments.map(c => (
                <div key={c.id} className="text-xs flex gap-2 mb-1">
                  <span style={{ color: c.completed ? '#22c55e' : '#f59e0b' }}>{c.completed ? '✓' : '○'}</span>
                  <span className={c.completed ? 'line-through text-slate-600' : 'text-slate-300'}>{c.action}</span>
                  {c.dueDate && <span className="text-slate-600 ml-auto">{c.dueDate}</span>}
                </div>
              ))}
            </div>
          )}
          {session.notes && (
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Notes</div>
              <p className="text-xs text-slate-400">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

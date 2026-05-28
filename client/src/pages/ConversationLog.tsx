import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Check, Calendar, ChevronDown, ChevronUp, Star, X, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EmotionalTone = 'Positive' | 'Neutral' | 'Tense' | 'Inspiring' | 'Challenging'

interface Conversation {
  id: string
  person: string
  date: string
  context: string
  keyPoints: string
  myCommitments: string
  theirCommitments: string
  takeaway: string
  tone: EmotionalTone
  followUpNeeded: boolean
  followUpDate: string
  createdAt: string
}

const TONES: EmotionalTone[] = ['Positive', 'Neutral', 'Tense', 'Inspiring', 'Challenging']

const TONE_STYLES: Record<EmotionalTone, string> = {
  Positive: 'text-green-400 border-green-500/30 bg-green-900/20',
  Neutral: 'text-slate-400 border-slate-500/30 bg-slate-800/60',
  Tense: 'text-red-400 border-red-500/30 bg-red-900/20',
  Inspiring: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
  Challenging: 'text-orange-400 border-orange-500/30 bg-orange-900/20',
}

const STORAGE_KEY = 'conversation_log'

const defaultForm = {
  person: '',
  date: new Date().toISOString().split('T')[0],
  context: '',
  keyPoints: '',
  myCommitments: '',
  theirCommitments: '',
  takeaway: '',
  tone: 'Neutral' as EmotionalTone,
  followUpNeeded: false,
  followUpDate: '',
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 9999
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function isOverdue(conv: Conversation): boolean {
  if (!conv.followUpNeeded || !conv.followUpDate) return false
  return getDaysUntil(conv.followUpDate) < 0
}

function isDueOrOverdue(conv: Conversation): boolean {
  if (!conv.followUpNeeded || !conv.followUpDate) return false
  return getDaysUntil(conv.followUpDate) <= 0
}

interface ConversationCardProps {
  conv: Conversation
  onDelete: (id: string) => void
  onMarkFollowUpDone: (id: string) => void
}

function ConversationCard({ conv, onDelete, onMarkFollowUpDone }: ConversationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const overdue = isOverdue(conv)

  return (
    <div className={`game-card ${overdue ? 'border-red-500/30 bg-red-900/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-200 font-semibold">{conv.person}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />{conv.date}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TONE_STYLES[conv.tone]}`}>
              {conv.tone}
            </span>
            {conv.followUpNeeded && conv.followUpDate && (
              <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-yellow-400'}`}>
                <AlertCircle className="w-3 h-3" />
                Follow-up {overdue ? 'overdue' : `due ${conv.followUpDate}`}
              </span>
            )}
          </div>
          {conv.context && (
            <div className="text-xs text-slate-500 mt-0.5">{conv.context}</div>
          )}
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{conv.keyPoints}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-slate-400"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(conv.id)}
            className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 transition-colors text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
          {conv.takeaway && (
            <div>
              <div className="text-xs text-yellow-400 font-semibold flex items-center gap-1 mb-1">
                <Star className="w-3 h-3" /> Key Takeaway
              </div>
              <p className="text-sm text-slate-300">{conv.takeaway}</p>
            </div>
          )}
          {conv.myCommitments && (
            <div>
              <div className="text-xs text-cyan-400 font-semibold mb-1">My Commitments</div>
              <p className="text-sm text-slate-300 whitespace-pre-line">{conv.myCommitments}</p>
            </div>
          )}
          {conv.theirCommitments && (
            <div>
              <div className="text-xs text-purple-400 font-semibold mb-1">Their Commitments</div>
              <p className="text-sm text-slate-300 whitespace-pre-line">{conv.theirCommitments}</p>
            </div>
          )}
          {conv.keyPoints && (
            <div>
              <div className="text-xs text-slate-400 font-semibold mb-1">Key Points</div>
              <p className="text-sm text-slate-300 whitespace-pre-line">{conv.keyPoints}</p>
            </div>
          )}
          {conv.followUpNeeded && conv.followUpDate && (
            <div className="flex items-center justify-between">
              <span className={`text-sm ${overdue ? 'text-red-400' : 'text-yellow-400'}`}>
                Follow-up due: {conv.followUpDate}
              </span>
              <button
                onClick={() => onMarkFollowUpDone(conv.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition-colors"
              >
                <Check className="w-3 h-3" /> Mark Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConversationLog() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setConversations(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: Conversation[]) => {
    setConversations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addConversation = () => {
    if (!form.person.trim() || !form.keyPoints.trim()) return
    const conv: Conversation = {
      id: Date.now().toString(),
      person: form.person.trim(),
      date: form.date,
      context: form.context.trim(),
      keyPoints: form.keyPoints.trim(),
      myCommitments: form.myCommitments.trim(),
      theirCommitments: form.theirCommitments.trim(),
      takeaway: form.takeaway.trim(),
      tone: form.tone,
      followUpNeeded: form.followUpNeeded,
      followUpDate: form.followUpNeeded ? form.followUpDate : '',
      createdAt: today,
    }
    save([conv, ...conversations])
    setForm(defaultForm)
    setShowForm(false)
    toastSuccess(`Conversation with ${conv.person} logged!`)
  }

  const deleteConversation = (id: string) => {
    save(conversations.filter(c => c.id !== id))
    toastSuccess('Conversation removed.')
  }

  const markFollowUpDone = (id: string) => {
    const updated = conversations.map(c =>
      c.id === id ? { ...c, followUpNeeded: false, followUpDate: '' } : c
    )
    save(updated)
    toastSuccess('Follow-up marked as done!')
  }

  // Stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStart = weekAgo.toISOString().split('T')[0]
  const thisWeekCount = conversations.filter(c => c.date >= weekStart).length
  const pendingFollowUps = conversations.filter(c => c.followUpNeeded && c.followUpDate).length
  const dueFollowUps = conversations.filter(isDueOrOverdue)

  // Sorted + filtered
  const sorted = [...conversations].sort((a, b) => b.date.localeCompare(a.date))
  const filtered = sorted.filter(c =>
    !search || c.person.toLowerCase().includes(search.toLowerCase())
  )
  // Main list excludes due follow-ups to avoid duplication in section
  const mainList = filtered.filter(c => !isDueOrOverdue(c))
  const dueFiltered = dueFollowUps.filter(c =>
    !search || c.person.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Users className="w-7 h-7 text-cyan-400" />
            Conversation Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Log and reflect on important conversations</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Log Conversation'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {conversations.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total Logged</div>
        </div>
        <div className="game-card text-center">
          <div
            className={`text-2xl font-bold ${pendingFollowUps > 0 ? 'text-yellow-400' : 'text-green-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {pendingFollowUps}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending Follow-ups</div>
        </div>
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {thisWeekCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">This Week</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="game-card space-y-4">
          <h2 className="text-lg font-bold text-white">New Conversation</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Person *</label>
              <input
                className="game-input w-full"
                placeholder="Who did you talk to?"
                value={form.person}
                onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              />
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
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Context / Setting</label>
              <input
                className="game-input w-full"
                placeholder="e.g. coffee catch-up, 1-on-1, phone call..."
                value={form.context}
                onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Key Points Discussed *</label>
              <textarea
                className="game-input w-full min-h-[80px] resize-none"
                placeholder="What were the main topics and discussions?"
                value={form.keyPoints}
                onChange={e => setForm(f => ({ ...f, keyPoints: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">What I Said I'd Do</label>
              <textarea
                className="game-input w-full min-h-[64px] resize-none"
                placeholder="Your commitments from this conversation..."
                value={form.myCommitments}
                onChange={e => setForm(f => ({ ...f, myCommitments: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">What They Said They'd Do</label>
              <textarea
                className="game-input w-full min-h-[64px] resize-none"
                placeholder="Their commitments..."
                value={form.theirCommitments}
                onChange={e => setForm(f => ({ ...f, theirCommitments: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Takeaway / Insight</label>
              <input
                className="game-input w-full"
                placeholder="What's the most important thing you're taking away?"
                value={form.takeaway}
                onChange={e => setForm(f => ({ ...f, takeaway: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Emotional Tone</label>
              <select
                className="game-input w-full"
                value={form.tone}
                onChange={e => setForm(f => ({ ...f, tone: e.target.value as EmotionalTone }))}
              >
                {TONES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Follow-up Needed?</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, followUpNeeded: !f.followUpNeeded }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    form.followUpNeeded
                      ? 'bg-yellow-600/20 border-yellow-500/40 text-yellow-400'
                      : 'bg-slate-700/50 border-slate-600/40 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {form.followUpNeeded ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {form.followUpNeeded ? 'Yes' : 'No'}
                </button>
              </div>
            </div>
            {form.followUpNeeded && (
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.followUpDate}
                  min={today}
                  onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={addConversation}
              disabled={!form.person.trim() || !form.keyPoints.trim()}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              <Check className="w-4 h-4" /> Save Conversation
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(defaultForm) }}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {conversations.length > 0 && (
        <div>
          <input
            className="game-input w-full"
            placeholder="Search by person name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Due for Follow-up Section */}
      {dueFiltered.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Due for Follow-up ({dueFiltered.length})
          </h2>
          {dueFiltered.map(conv => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              onDelete={deleteConversation}
              onMarkFollowUpDone={markFollowUpDone}
            />
          ))}
        </div>
      )}

      {/* Main Conversation List */}
      {(mainList.length > 0 || dueFiltered.length === 0) && (
        <div className="space-y-3">
          {mainList.length > 0 && (
            <h2 className="text-base font-bold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              All Conversations ({filtered.length})
            </h2>
          )}
          {mainList.map(conv => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              onDelete={deleteConversation}
              onMarkFollowUpDone={markFollowUpDone}
            />
          ))}
        </div>
      )}

      {conversations.length === 0 && !showForm && (
        <div className="game-card text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <div className="text-slate-400 font-semibold">No conversations logged yet</div>
          <div className="text-slate-500 text-sm mt-1">Start tracking your important conversations and commitments</div>
        </div>
      )}

      {conversations.length > 0 && filtered.length === 0 && (
        <div className="game-card text-center py-8">
          <div className="text-slate-400">No conversations found for "{search}"</div>
        </div>
      )}
    </div>
  )
}

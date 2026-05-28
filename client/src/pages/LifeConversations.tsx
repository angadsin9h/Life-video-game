import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConversationType = 'breakthrough' | 'mentorship' | 'conflict' | 'love' | 'inspiration' | 'healing' | 'learning' | 'support'
type ImpactDuration = 'hours' | 'days' | 'weeks' | 'months' | 'life-changing'

interface ConversationEntry {
  id: string
  conversationType: ConversationType
  impact: ImpactDuration
  person: string
  topic: string
  keyInsight: string
  howItChanged: string
  action: string
  followUp: string
  impactScore: number
  date: string
  createdAt: string
}

const CONV_CONFIG: Record<ConversationType, { label: string; emoji: string; color: string }> = {
  breakthrough:{ label: 'Breakthrough', emoji: '💥', color: '#f59e0b' },
  mentorship:  { label: 'Mentorship',   emoji: '🎓', color: '#3b82f6' },
  conflict:    { label: 'Conflict',     emoji: '⚡', color: '#ef4444' },
  love:        { label: 'Love',         emoji: '❤️', color: '#ec4899' },
  inspiration: { label: 'Inspiration',  emoji: '🌟', color: '#a855f7' },
  healing:     { label: 'Healing',      emoji: '🌿', color: '#22c55e' },
  learning:    { label: 'Learning',     emoji: '📚', color: '#6366f1' },
  support:     { label: 'Support',      emoji: '🤗', color: '#f97316' },
}

const IMPACT_CONFIG: Record<ImpactDuration, { label: string; color: string }> = {
  hours:          { label: 'Hours',         color: '#94a3b8' },
  days:           { label: 'Days',          color: '#f59e0b' },
  weeks:          { label: 'Weeks',         color: '#22c55e' },
  months:         { label: 'Months',        color: '#3b82f6' },
  'life-changing':{ label: 'Life-Changing', color: '#a855f7' },
}

const STORAGE_KEY = 'life_conversations'

export default function LifeConversations() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ConversationEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ConversationEntry, 'id' | 'createdAt'>>({
    conversationType: 'inspiration', impact: 'days', person: '', topic: '',
    keyInsight: '', howItChanged: '', action: '', followUp: '',
    impactScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ConversationEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.person.trim() || !form.topic.trim()) return
    const e: ConversationEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, person: '', topic: '', keyInsight: '', howItChanged: '', action: '', followUp: '' }))
    setShowForm(false)
    toastSuccess('Life conversation captured — words shape worlds 💬')
  }

  const lifePeople = new Set(entries.map(e => e.person)).size
  const lifeChanging = entries.filter(e => e.impact === 'life-changing').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <MessageSquare className="w-7 h-7 text-teal-400" />
            Life Conversations
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture the conversations that change you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Convos</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{lifePeople}</div>
          <div className="text-xs text-slate-500">People</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{lifeChanging}</div>
          <div className="text-xs text-slate-500">Life-Changing</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Life Conversation</h3>
          <div className="flex gap-2">
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="Who did you talk with? *" className="game-input text-sm flex-1" autoFocus />
            <select value={form.conversationType} onChange={e => setForm(f => ({ ...f, conversationType: e.target.value as ConversationType }))} className="game-input text-sm flex-1">
              {(Object.entries(CONV_CONFIG) as [ConversationType, typeof CONV_CONFIG.inspiration][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            placeholder="Topic / what it was about *" className="game-input w-full text-sm" />
          <textarea value={form.keyInsight} onChange={e => setForm(f => ({ ...f, keyInsight: e.target.value }))}
            placeholder="Key insight or takeaway" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howItChanged} onChange={e => setForm(f => ({ ...f, howItChanged: e.target.value }))}
            placeholder="How did this conversation change you?" className="game-input w-full text-sm" />
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Action you're taking because of it" className="game-input w-full text-sm" />
          <input value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))}
            placeholder="Follow-up needed?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Impact duration</p>
              <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as ImpactDuration }))} className="game-input w-full text-sm">
                {(Object.entries(IMPACT_CONFIG) as [ImpactDuration, typeof IMPACT_CONFIG.days][]).map(([k, i]) => (
                  <option key={k} value={k}>{i.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Impact: {form.impactScore}/10</p>
              <input type="range" min={1} max={10} value={form.impactScore}
                onChange={e => setForm(f => ({ ...f, impactScore: Number(e.target.value) }))}
                className="w-full h-1 accent-teal-400 mt-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Log Conversation</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CONV_CONFIG[e.conversationType]
          const i = IMPACT_CONFIG[e.impact]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.person}</span>
                  <span className="text-xs text-slate-500">{e.topic}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.label}</span>
                  <span className="text-xs text-teal-400">💥 {e.impactScore}/10</span>
                </div>
                {e.keyInsight && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.keyInsight}</p>}
                {e.action && <p className="text-xs text-green-300/70 mt-0.5">→ {e.action}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Some conversations change everything. Don't let them fade.</p>
          </div>
        )}
      </div>
    </div>
  )
}

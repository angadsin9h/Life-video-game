import { useState, useEffect } from 'react'
import { Users, Network, Plus, Trash2, Save, Star, Target, TrendingUp, ChevronDown, ChevronUp, RefreshCw, Globe } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'network_strength_log'

type NetworkDomain = 'professional' | 'creative' | 'spiritual' | 'academic' | 'social' | 'mentorship' | 'family'
type ContactGoal = 'monthly' | 'quarterly' | 'yearly' | 'as-needed'
type ActionType = 'reached-out' | 'met-in-person' | 'helped' | 'collaborated' | 'referred' | 'introduced' | 'supported'

interface NetworkContact {
  id: string
  name: string
  domain: NetworkDomain
  strength: 1 | 2 | 3 | 4 | 5
  lastContact: string
  contactGoal: ContactGoal
  value: string
  notes: string
}

interface NetworkAction {
  id: string
  date: string
  contactId: string
  type: ActionType
  description: string
  outcome: string
  strengthDelta: -1 | 0 | 1
}

interface StoredData {
  contacts: NetworkContact[]
  actions: NetworkAction[]
}

const DOMAIN_CONFIG: Record<NetworkDomain, { label: string; emoji: string; color: string }> = {
  professional: { label: 'Professional', emoji: '💼', color: '#6366f1' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#a855f7' },
  spiritual:    { label: 'Spiritual',    emoji: '🕊️', color: '#f59e0b' },
  academic:     { label: 'Academic',     emoji: '📚', color: '#3b82f6' },
  social:       { label: 'Social',       emoji: '🎉', color: '#ec4899' },
  mentorship:   { label: 'Mentorship',   emoji: '🧭', color: '#22c55e' },
  family:       { label: 'Family',       emoji: '🏠', color: '#f97316' },
}

const GOAL_DAYS: Record<ContactGoal, number> = {
  monthly:    30,
  quarterly:  90,
  yearly:     365,
  'as-needed': 999,
}

const GOAL_LABELS: Record<ContactGoal, string> = {
  monthly:    'Monthly',
  quarterly:  'Quarterly',
  yearly:     'Yearly',
  'as-needed': 'As Needed',
}

const ACTION_CONFIG: Record<ActionType, { label: string; emoji: string }> = {
  'reached-out':   { label: 'Reached out',   emoji: '📞' },
  'met-in-person': { label: 'Met in person',  emoji: '🤝' },
  'helped':        { label: 'Helped',         emoji: '🙌' },
  'collaborated':  { label: 'Collaborated',   emoji: '🔗' },
  'referred':      { label: 'Referred',       emoji: '👉' },
  'introduced':    { label: 'Introduced',     emoji: '🌐' },
  'supported':     { label: 'Supported',      emoji: '💪' },
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysSince(dateStr: string): number {
  const diff = new Date().getTime() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function isOverdue(contact: NetworkContact): boolean {
  if (contact.contactGoal === 'as-needed') return false
  return daysSince(contact.lastContact) > GOAL_DAYS[contact.contactGoal]
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredData
  } catch { /* ignore */ }
  return { contacts: [], actions: [] }
}

function saveData(data: StoredData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

const DEFAULT_CONTACT_FORM: Omit<NetworkContact, 'id'> = {
  name: '',
  domain: 'professional',
  strength: 3,
  lastContact: todayStr(),
  contactGoal: 'monthly',
  value: '',
  notes: '',
}

const DEFAULT_ACTION_FORM: Omit<NetworkAction, 'id' | 'contactId'> = {
  date: todayStr(),
  type: 'reached-out',
  description: '',
  outcome: '',
  strengthDelta: 0,
}

export default function NetworkStrengthLog() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StoredData>(loadData)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState<NetworkContact | null>(null)
  const [contactForm, setContactForm] = useState<Omit<NetworkContact, 'id'>>({ ...DEFAULT_CONTACT_FORM })
  const [loggingActionFor, setLoggingActionFor] = useState<string | null>(null)
  const [actionForm, setActionForm] = useState<Omit<NetworkAction, 'id' | 'contactId'>>({ ...DEFAULT_ACTION_FORM })
  const [showRecentActions, setShowRecentActions] = useState(true)
  const [showOverdue, setShowOverdue] = useState(true)

  useEffect(() => { saveData(data) }, [data])

  // ---- Stats ----
  const totalContacts = data.contacts.length
  const avgStrength = totalContacts > 0
    ? (data.contacts.reduce((s, c) => s + c.strength, 0) / totalContacts).toFixed(1)
    : '—'
  const overdueContacts = data.contacts.filter(isOverdue)
  const domainCounts: Partial<Record<NetworkDomain, number>> = {}
  for (const c of data.contacts) {
    domainCounts[c.domain] = (domainCounts[c.domain] ?? 0) + c.strength
  }
  const strongestDomain = (Object.entries(domainCounts) as [NetworkDomain, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  // ---- Contact CRUD ----
  function openAddContact() {
    setEditingContact(null)
    setContactForm({ ...DEFAULT_CONTACT_FORM, lastContact: todayStr() })
    setShowContactForm(true)
  }

  function openEditContact(c: NetworkContact) {
    setEditingContact(c)
    setContactForm({
      name: c.name, domain: c.domain, strength: c.strength,
      lastContact: c.lastContact, contactGoal: c.contactGoal,
      value: c.value, notes: c.notes,
    })
    setShowContactForm(true)
  }

  function saveContact() {
    if (!contactForm.name.trim()) return
    if (editingContact) {
      setData(d => ({
        ...d,
        contacts: d.contacts.map(c => c.id === editingContact.id ? { ...contactForm, id: editingContact.id } : c),
      }))
    } else {
      const c: NetworkContact = { ...contactForm, id: Date.now().toString() }
      setData(d => ({ ...d, contacts: [...d.contacts, c] }))
    }
    setShowContactForm(false)
    setEditingContact(null)
    toastSuccess(editingContact ? 'Contact updated!' : 'Contact added to your network!')
  }

  function deleteContact(id: string) {
    setData(d => ({
      contacts: d.contacts.filter(c => c.id !== id),
      actions: d.actions.filter(a => a.contactId !== id),
    }))
  }

  // ---- Action Logging ----
  function openLogAction(contactId: string) {
    setLoggingActionFor(contactId)
    setActionForm({ ...DEFAULT_ACTION_FORM, date: todayStr() })
  }

  function saveAction() {
    if (!actionForm.description.trim() || !loggingActionFor) return
    const action: NetworkAction = {
      ...actionForm,
      id: Date.now().toString(),
      contactId: loggingActionFor,
    }
    setData(d => {
      const updatedContacts = d.contacts.map(c => {
        if (c.id !== loggingActionFor) return c
        const newStrength = Math.max(1, Math.min(5, c.strength + action.strengthDelta)) as 1 | 2 | 3 | 4 | 5
        return { ...c, lastContact: action.date, strength: newStrength }
      })
      return { contacts: updatedContacts, actions: [action, ...d.actions] }
    })
    setLoggingActionFor(null)
    toastSuccess('Network action logged! 🌐')
  }

  // ---- SVG domain bars ----
  const domainAvgStrengths = (Object.keys(DOMAIN_CONFIG) as NetworkDomain[]).map(domain => {
    const cs = data.contacts.filter(c => c.domain === domain)
    const avg = cs.length > 0 ? cs.reduce((s, c) => s + c.strength, 0) / cs.length : 0
    return { domain, avg, count: cs.length }
  }).filter(d => d.count > 0)

  const recentActions = data.actions.slice(0, 10)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Network className="w-7 h-7 text-indigo-400" />
            Network Strength Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map and strengthen your personal and professional network.</p>
        </div>
        <button
          onClick={openAddContact}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalContacts}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total Contacts</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgStrength}</div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Strength</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>{overdueContacts.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Overdue</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-emerald-400 truncate" style={{ fontFamily: 'Orbitron, monospace' }}>
            {strongestDomain ? DOMAIN_CONFIG[strongestDomain].emoji : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {strongestDomain ? DOMAIN_CONFIG[strongestDomain].label : 'No domain'}
          </div>
        </div>
      </div>

      {/* Add/Edit contact form */}
      {showContactForm && (
        <div className="game-card p-5 space-y-4 border border-indigo-500/20">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            {editingContact ? 'Edit Contact' : 'Add Contact'}
          </h3>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
            <input
              className="game-input w-full"
              placeholder="Contact name"
              value={contactForm.name}
              onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Domain</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(DOMAIN_CONFIG) as [NetworkDomain, typeof DOMAIN_CONFIG.professional][]).map(([k, d]) => (
                <button
                  key={k}
                  onClick={() => setContactForm(f => ({ ...f, domain: k }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={
                    contactForm.domain === k
                      ? { background: d.color + '30', color: d.color, border: `1px solid ${d.color}` }
                      : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                  }
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Strength (1–5)</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setContactForm(f => ({ ...f, strength: n }))}
                    className="flex-1 py-1.5 rounded-lg text-sm transition-all border"
                    style={
                      contactForm.strength >= n
                        ? { background: '#f59e0b30', borderColor: '#f59e0b', color: '#f59e0b' }
                        : { background: '#1e293b', borderColor: '#334155', color: '#475569' }
                    }
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contact Goal</label>
              <select
                className="game-input w-full text-sm"
                value={contactForm.contactGoal}
                onChange={e => setContactForm(f => ({ ...f, contactGoal: e.target.value as ContactGoal }))}
              >
                {(Object.entries(GOAL_LABELS) as [ContactGoal, string][]).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Last Contact Date</label>
            <input
              type="date"
              className="game-input w-full"
              value={contactForm.lastContact}
              onChange={e => setContactForm(f => ({ ...f, lastContact: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">What you appreciate about them</label>
            <textarea
              className="game-input w-full resize-none"
              rows={2}
              placeholder="What value do they bring to your life?"
              value={contactForm.value}
              onChange={e => setContactForm(f => ({ ...f, value: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <input
              className="game-input w-full"
              placeholder="Optional notes..."
              value={contactForm.notes}
              onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveContact}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => { setShowContactForm(false); setEditingContact(null) }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact cards */}
      {data.contacts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Your Network ({totalContacts})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.contacts.map(contact => {
              const d = DOMAIN_CONFIG[contact.domain]
              const days = daysSince(contact.lastContact)
              const overdue = isOverdue(contact)

              return (
                <div key={contact.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${d.color}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-sm">{contact.name}</span>
                        <span className="text-base">{d.emoji}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>
                          {d.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {([1, 2, 3, 4, 5] as const).map(n => (
                          <Star
                            key={n}
                            className="w-3 h-3"
                            style={{ color: contact.strength >= n ? '#f59e0b' : '#334155', fill: contact.strength >= n ? '#f59e0b' : 'none' }}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-1">strength</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditContact(contact)}
                        className="p-1 text-slate-600 hover:text-indigo-400 transition-colors"
                        title="Edit contact"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Health bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500">Connection strength</span>
                      <span className="text-[10px] text-slate-400">{contact.strength}/5</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(contact.strength / 5) * 100}%`, background: d.color }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span>Last: {contact.lastContact}</span>
                    <span>·</span>
                    <span>{days}d ago</span>
                    {overdue && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">OVERDUE</span>
                    )}
                    <span className="ml-auto text-slate-600">{GOAL_LABELS[contact.contactGoal]}</span>
                  </div>

                  {contact.value && (
                    <p className="text-xs text-slate-400 line-clamp-1 italic">"{contact.value}"</p>
                  )}

                  {/* Log action inline */}
                  {loggingActionFor === contact.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <p className="text-xs font-semibold text-slate-300">Log an action</p>

                      <div className="flex flex-wrap gap-1">
                        {(Object.entries(ACTION_CONFIG) as [ActionType, typeof ACTION_CONFIG['reached-out']][]).map(([k, a]) => (
                          <button
                            key={k}
                            onClick={() => setActionForm(f => ({ ...f, type: k }))}
                            className="px-2 py-1 rounded-lg text-[10px] transition-all"
                            style={
                              actionForm.type === k
                                ? { background: '#6366f130', color: '#818cf8', border: '1px solid #6366f1' }
                                : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                            }
                          >
                            {a.emoji} {a.label}
                          </button>
                        ))}
                      </div>

                      <input
                        className="game-input w-full text-xs"
                        placeholder="What happened? *"
                        value={actionForm.description}
                        onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
                        autoFocus
                      />
                      <input
                        className="game-input w-full text-xs"
                        placeholder="Outcome (optional)"
                        value={actionForm.outcome}
                        onChange={e => setActionForm(f => ({ ...f, outcome: e.target.value }))}
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 flex-shrink-0">Strength:</span>
                        {([-1, 0, 1] as const).map(delta => (
                          <button
                            key={delta}
                            onClick={() => setActionForm(f => ({ ...f, strengthDelta: delta }))}
                            className="px-2 py-1 rounded text-[10px] transition-all border"
                            style={
                              actionForm.strengthDelta === delta
                                ? {
                                    background: delta > 0 ? '#22c55e30' : delta < 0 ? '#ef444430' : '#33415530',
                                    borderColor: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#475569',
                                    color: delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8',
                                  }
                                : { background: '#1e293b', borderColor: '#334155', color: '#64748b' }
                            }
                          >
                            {delta > 0 ? '+1' : delta < 0 ? '-1' : '±0'}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveAction}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          Save Action
                        </button>
                        <button
                          onClick={() => setLoggingActionFor(null)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openLogAction(contact.id)}
                      className="w-full py-1.5 flex items-center justify-center gap-1.5 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Action
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Network strength by domain SVG */}
      {domainAvgStrengths.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Strength by Domain
          </h3>
          <svg viewBox={`0 0 360 ${domainAvgStrengths.length * 30 + 10}`} width="100%" style={{ display: 'block' }}>
            {domainAvgStrengths.map((item, i) => {
              const d = DOMAIN_CONFIG[item.domain]
              const y = i * 30 + 5
              const barW = (item.avg / 5) * 200
              return (
                <g key={item.domain}>
                  <text x={80} y={y + 11} textAnchor="end" dominantBaseline="middle"
                    fontSize={11} fill="#94a3b8" fontFamily="sans-serif">
                    {d.emoji} {d.label}
                  </text>
                  <rect x={86} y={y} width={barW} height={20} rx={4} fill={d.color} opacity={0.85} />
                  <text x={92 + barW} y={y + 10} dominantBaseline="middle"
                    fontSize={10} fill={d.color} fontFamily="monospace">
                    {item.avg.toFixed(1)} ({item.count})
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Recent actions */}
      {recentActions.length > 0 && (
        <div className="game-card p-4">
          <button
            className="w-full flex items-center justify-between mb-3"
            onClick={() => setShowRecentActions(v => !v)}
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" /> Recent Actions
            </h3>
            {showRecentActions ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showRecentActions && (
            <div className="space-y-2">
              {recentActions.map(action => {
                const contact = data.contacts.find(c => c.id === action.contactId)
                const a = ACTION_CONFIG[action.type]
                return (
                  <div key={action.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-700/30">
                    <span className="text-base flex-shrink-0">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{contact?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{a.label}</span>
                        {action.strengthDelta !== 0 && (
                          <span className={`text-xs font-bold ${action.strengthDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {action.strengthDelta > 0 ? '+1' : '-1'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{action.description}</p>
                      {action.outcome && <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{action.outcome}</p>}
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">{action.date}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Overdue contacts */}
      {overdueContacts.length > 0 && (
        <div className="game-card p-4 border border-red-500/20">
          <button
            className="w-full flex items-center justify-between mb-3"
            onClick={() => setShowOverdue(v => !v)}
          >
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Overdue ({overdueContacts.length})
            </h3>
            {showOverdue ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showOverdue && (
            <div className="space-y-2">
              {overdueContacts.map(contact => {
                const d = DOMAIN_CONFIG[contact.domain]
                const days = daysSince(contact.lastContact)
                const goalDays = GOAL_DAYS[contact.contactGoal]
                const overBy = days - goalDays
                return (
                  <div key={contact.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-900/10 border border-red-500/20">
                    <span className="text-base">{d.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{contact.name}</span>
                      <p className="text-xs text-slate-500">{days}d since contact · {overBy}d overdue</p>
                    </div>
                    <span className="text-[10px] text-slate-600">{GOAL_LABELS[contact.contactGoal]}</span>
                    <button
                      onClick={() => openLogAction(contact.id)}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      Reach out
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {data.contacts.length === 0 && !showContactForm && (
        <div className="text-center py-14 text-slate-500">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1 text-sm">Your network map is empty.</p>
          <p className="text-xs text-slate-600 mb-4">Add the people who matter to start tracking your relationships.</p>
          <button
            onClick={openAddContact}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Add First Contact
          </button>
        </div>
      )}
    </div>
  )
}

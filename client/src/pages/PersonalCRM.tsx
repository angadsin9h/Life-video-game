import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Phone, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Contact {
  id: string
  name: string
  relationship: RelationshipType
  lastContact: string
  frequencyGoal: FrequencyGoal
  notes: string
  tags: string[]
  createdAt: string
}

type RelationshipType = 'Friend' | 'Mentor' | 'Colleague' | 'Family' | 'Acquaintance' | 'Professional'
type FrequencyGoal = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

const RELATIONSHIP_TYPES: RelationshipType[] = ['Friend', 'Mentor', 'Colleague', 'Family', 'Acquaintance', 'Professional']

const FREQUENCY_GOALS: { value: FrequencyGoal; label: string; days: number }[] = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
]

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  Friend: 'text-cyan-400 border-cyan-500/30 bg-cyan-900/20',
  Mentor: 'text-purple-400 border-purple-500/30 bg-purple-900/20',
  Colleague: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
  Family: 'text-green-400 border-green-500/30 bg-green-900/20',
  Acquaintance: 'text-slate-400 border-slate-500/30 bg-slate-800/60',
  Professional: 'text-orange-400 border-orange-500/30 bg-orange-900/20',
}

const STORAGE_KEY = 'personal_crm'

const defaultForm = {
  name: '',
  relationship: 'Friend' as RelationshipType,
  lastContact: new Date().toISOString().split('T')[0],
  frequencyGoal: 'monthly' as FrequencyGoal,
  notes: '',
  tags: '',
}

function getDaysAgo(dateStr: string): number {
  if (!dateStr) return 9999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function isOverdue(contact: Contact): boolean {
  const freqDays = FREQUENCY_GOALS.find(f => f.value === contact.frequencyGoal)?.days ?? 30
  return getDaysAgo(contact.lastContact) > freqDays
}

function daysAgoLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days >= 9999) return 'Never'
  return `${days} days ago`
}

export default function PersonalCRM() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]

  const [contacts, setContacts] = useState<Contact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [filterType, setFilterType] = useState<RelationshipType | 'All'>('All')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setContacts(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: Contact[]) => {
    setContacts(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addContact = () => {
    if (!form.name.trim()) return
    const contact: Contact = {
      id: Date.now().toString(),
      name: form.name.trim(),
      relationship: form.relationship,
      lastContact: form.lastContact,
      frequencyGoal: form.frequencyGoal,
      notes: form.notes.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: today,
    }
    save([contact, ...contacts])
    setForm(defaultForm)
    setShowForm(false)
    toastSuccess(`${contact.name} added to your network!`)
  }

  const logContact = (id: string) => {
    const updated = contacts.map(c => c.id === id ? { ...c, lastContact: today } : c)
    save(updated)
    const name = contacts.find(c => c.id === id)?.name ?? 'Contact'
    toastSuccess(`Logged contact with ${name}!`)
  }

  const deleteContact = (id: string) => {
    save(contacts.filter(c => c.id !== id))
    toastSuccess('Contact removed.')
  }

  const filtered = filterType === 'All' ? contacts : contacts.filter(c => c.relationship === filterType)

  const totalContacts = contacts.length
  const overdueCount = contacts.filter(isOverdue).length
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)
  const contactsThisMonth = contacts.filter(c => c.lastContact && new Date(c.lastContact) >= thisMonthStart).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-cyan-400" />
            Personal CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and nurture your important relationships</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalContacts}</div>
          <div className="text-xs text-slate-400 mt-1">Total Contacts</div>
        </div>
        <div className="game-card text-center">
          <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-green-400'}`} style={{ fontFamily: 'Orbitron, monospace' }}>{overdueCount}</div>
          <div className="text-xs text-slate-400 mt-1">Overdue</div>
        </div>
        <div className="game-card text-center">
          <div className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>{contactsThisMonth}</div>
          <div className="text-xs text-slate-400 mt-1">Contacted This Month</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="game-card space-y-4">
          <h2 className="text-lg font-bold text-white">New Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input
                className="game-input w-full"
                placeholder="Full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Relationship Type</label>
              <select
                className="game-input w-full"
                value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value as RelationshipType }))}
              >
                {RELATIONSHIP_TYPES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Frequency Goal</label>
              <select
                className="game-input w-full"
                value={form.frequencyGoal}
                onChange={e => setForm(f => ({ ...f, frequencyGoal: e.target.value as FrequencyGoal }))}
              >
                {FREQUENCY_GOALS.map(fg => (
                  <option key={fg.value} value={fg.value}>{fg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Last Contact Date</label>
              <input
                type="date"
                className="game-input w-full"
                value={form.lastContact}
                onChange={e => setForm(f => ({ ...f, lastContact: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
              <input
                className="game-input w-full"
                placeholder="e.g. gym, startup, coffee"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea
                className="game-input w-full resize-none"
                rows={2}
                placeholder="Birthday, interests, how you met..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addContact}
              disabled={!form.name.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Add Contact
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

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['All', ...RELATIONSHIP_TYPES] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              filterType === type
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Contact List */}
      {filtered.length === 0 ? (
        <div className="game-card text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {filterType === 'All' ? 'No contacts yet. Add your first one!' : `No ${filterType} contacts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contact => {
            const daysAgo = getDaysAgo(contact.lastContact)
            const overdue = isOverdue(contact)
            const freqLabel = FREQUENCY_GOALS.find(f => f.value === contact.frequencyGoal)?.label ?? 'Monthly'

            return (
              <div
                key={contact.id}
                className={`game-card border ${overdue ? 'border-red-500/40 bg-red-950/10' : 'border-slate-700/50'} transition-colors`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg">{contact.name}</h3>
                      <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${RELATIONSHIP_COLORS[contact.relationship]}`}>
                        {contact.relationship}
                      </span>
                      {overdue && (
                        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Last contact: <span className={`font-semibold ml-1 ${overdue ? 'text-red-400' : 'text-slate-300'}`}>{daysAgoLabel(daysAgo)}</span>
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        Goal: {freqLabel}
                      </span>
                    </div>

                    {contact.notes && (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{contact.notes}</p>
                    )}

                    {contact.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {contact.tags.map(tag => (
                          <span key={tag} className="text-xs bg-slate-700 text-slate-300 rounded px-2 py-0.5">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => logContact(contact.id)}
                      className="flex items-center gap-1 bg-cyan-700/50 hover:bg-cyan-600/70 text-cyan-300 text-xs px-3 py-1.5 rounded-lg transition-colors font-semibold whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Log Contact
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="flex items-center gap-1 bg-slate-700/50 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

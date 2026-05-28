import { useState, useEffect } from 'react'
import { User, Plus, Trash2, Edit2, Check, X, Flame, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface IdentityStatement {
  id: string
  statement: string
  category: string
  evidence: string[]
  streak: number
  lastAffirmed: string
  createdAt: string
}

interface DailyAffirmation {
  date: string
  affirmedIds: string[]
}

const CATEGORIES = [
  { name: 'Health', color: '#22c55e', emoji: '💪' },
  { name: 'Mindset', color: '#a855f7', emoji: '🧠' },
  { name: 'Character', color: '#3b82f6', emoji: '⚡' },
  { name: 'Skills', color: '#f59e0b', emoji: '🎯' },
  { name: 'Relationships', color: '#ec4899', emoji: '❤️' },
  { name: 'Finance', color: '#10b981', emoji: '💰' },
  { name: 'Spirit', color: '#8b5cf6', emoji: '✨' },
  { name: 'Purpose', color: '#f97316', emoji: '🌟' },
]

const EXAMPLES = [
  'I am someone who exercises every day',
  'I am a calm and patient person',
  'I am a continuous learner',
  'I am financially disciplined',
  'I am a great listener',
  'I am someone who keeps promises to myself',
  'I am a person of deep focus and concentration',
  'I am kind and generous by default',
]

const STORAGE_KEY = 'identity_builder'
const AFFIRM_KEY = 'identity_affirmations'

export default function IdentityBuilder() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [identities, setIdentities] = useState<IdentityStatement[]>([])
  const [affirmation, setAffirmation] = useState<DailyAffirmation>({ date: today, affirmedIds: [] })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ statement: '', category: 'Mindset', evidence: '' })
  const [view, setView] = useState<'affirm' | 'manage'>('affirm')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setIdentities(saved ? JSON.parse(saved) : [])
      const savedAffirm = localStorage.getItem(AFFIRM_KEY)
      const affirms: DailyAffirmation[] = savedAffirm ? JSON.parse(savedAffirm) : []
      const todayAffirm = affirms.find(a => a.date === today) || { date: today, affirmedIds: [] }
      setAffirmation(todayAffirm)
    } catch { /**/ }
  }, [])

  const saveIdentities = (updated: IdentityStatement[]) => {
    setIdentities(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveAffirmation = (updated: DailyAffirmation) => {
    setAffirmation(updated)
    try {
      const savedAffirm = localStorage.getItem(AFFIRM_KEY)
      const affirms: DailyAffirmation[] = savedAffirm ? JSON.parse(savedAffirm) : []
      const idx = affirms.findIndex(a => a.date === today)
      if (idx >= 0) affirms[idx] = updated
      else affirms.unshift(updated)
      localStorage.setItem(AFFIRM_KEY, JSON.stringify(affirms.slice(0, 30)))
    } catch { /**/ }
  }

  const addIdentity = () => {
    if (!form.statement.trim()) return
    if (editId) {
      saveIdentities(identities.map(i => i.id === editId ? {
        ...i,
        statement: form.statement.trim(),
        category: form.category,
        evidence: form.evidence ? [...i.evidence, form.evidence.trim()].filter(Boolean) : i.evidence,
      } : i))
      setEditId(null)
    } else {
      const identity: IdentityStatement = {
        id: Date.now().toString(),
        statement: form.statement.trim(),
        category: form.category,
        evidence: form.evidence ? [form.evidence.trim()] : [],
        streak: 0,
        lastAffirmed: '',
        createdAt: new Date().toISOString(),
      }
      saveIdentities([identity, ...identities])
      toastSuccess('Identity statement added! 🌟')
    }
    setForm({ statement: '', category: 'Mindset', evidence: '' })
    setShowForm(false)
  }

  const affirm = (id: string) => {
    if (affirmation.affirmedIds.includes(id)) return
    const newAffirmedIds = [...affirmation.affirmedIds, id]
    saveAffirmation({ date: today, affirmedIds: newAffirmedIds })

    // Update streak
    const updated = identities.map(i => {
      if (i.id !== id) return i
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const newStreak = i.lastAffirmed === yesterday || i.lastAffirmed === today ? i.streak + 1 : 1
      return { ...i, streak: newStreak, lastAffirmed: today }
    })
    saveIdentities(updated)

    if (newAffirmedIds.length === identities.length) {
      toastSuccess(`All identities affirmed! 🔥 You're living your best self!`)
    }
  }

  const addEvidence = (id: string, text: string) => {
    if (!text.trim()) return
    saveIdentities(identities.map(i => i.id === id ? { ...i, evidence: [text.trim(), ...i.evidence].slice(0, 20) } : i))
    toastSuccess('Evidence added! 💪')
  }

  const del = (id: string) => {
    saveIdentities(identities.filter(i => i.id !== id))
  }

  const affirmedToday = affirmation.affirmedIds.length
  const totalStreak = identities.length > 0 ? Math.floor(identities.reduce((s, i) => s + i.streak, 0) / identities.length) : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <User className="w-7 h-7 text-blue-400" />
            Identity Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Become who you want to be, one affirmation at a time</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Identity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{identities.length}</div>
          <div className="text-xs text-slate-500">Identities</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{affirmedToday}/{identities.length}</div>
          <div className="text-xs text-slate-500">Affirmed Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{totalStreak}d</div>
          <div className="text-xs text-slate-500">Avg Streak</div>
        </div>
      </div>

      {/* Progress for today */}
      {identities.length > 0 && (
        <div className="game-card p-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Today's Affirmation Progress</span>
            <span>{Math.round((affirmedToday / identities.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${(affirmedToday / identities.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView('affirm')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'affirm' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          Daily Affirmation
        </button>
        <button onClick={() => setView('manage')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'manage' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          Manage Identities
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300">{editId ? 'Edit Identity' : 'New Identity Statement'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Statement (start with "I am...")</label>
            <input value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
              placeholder="I am someone who..." className="game-input w-full" autoFocus />
            <div className="mt-1 flex flex-wrap gap-1">
              {EXAMPLES.slice(0, 4).map(ex => (
                <button key={ex} onClick={() => setForm(f => ({ ...f, statement: ex }))}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors">"{ex.slice(0, 30)}…"</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.name} onClick={() => setForm(f => ({ ...f, category: c.name }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.category === c.name ? { background: c.color + '30', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#64748b' }}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Evidence (proof this is true)</label>
            <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
              placeholder="e.g. I went to gym 3x this week" className="game-input w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={addIdentity} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Star className="w-4 h-4 inline mr-1.5" />{editId ? 'Update' : 'Add Identity'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Affirm view */}
      {view === 'affirm' && (
        <div className="space-y-3">
          {identities.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="mb-2">No identity statements yet.</p>
              <p className="text-sm">Add statements about who you are becoming.</p>
            </div>
          )}
          {identities.map(id => {
            const cat = CATEGORIES.find(c => c.name === id.category) || CATEGORIES[0]
            const affirmedToday = affirmation.affirmedIds.includes(id.id)
            return (
              <div key={id.id} className={`game-card p-4 transition-all duration-300 ${affirmedToday ? 'opacity-70' : ''}`}
                style={affirmedToday ? { borderColor: cat.color + '50' } : {}}>
                <div className="flex items-start gap-3">
                  <button onClick={() => affirm(id.id)} disabled={affirmedToday}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${affirmedToday ? 'border-transparent' : 'border-slate-600 hover:border-green-400'}`}
                    style={affirmedToday ? { background: cat.color + '30', borderColor: cat.color } : {}}>
                    {affirmedToday ? <Check className="w-4 h-4" style={{ color: cat.color }} /> : <span className="text-lg">{cat.emoji}</span>}
                  </button>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{id.statement}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.color + '20', color: cat.color }}>{id.category}</span>
                      {id.streak > 0 && <span className="text-xs text-orange-400">🔥 {id.streak}d streak</span>}
                    </div>
                    {id.evidence.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500 italic">
                        Evidence: "{id.evidence[id.evidence.length - 1]}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manage view */}
      {view === 'manage' && (
        <div className="space-y-3">
          {identities.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No identities yet. Add your first one!</div>
          )}
          {identities.map(id => {
            const cat = CATEGORIES.find(c => c.name === id.category) || CATEGORIES[0]
            const [addEvid, setAddEvid] = useState('')
            return (
              <div key={id.id} className="game-card p-4">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{id.statement}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{id.category} · Created {id.createdAt.split('T')[0]}</div>
                    {id.evidence.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Evidence:</div>
                        {id.evidence.slice(0, 3).map((e, i) => (
                          <div key={i} className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="text-green-400">✓</span> {e}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <input value={addEvid} onChange={e => setAddEvid(e.target.value)}
                        placeholder="Add evidence..." className="game-input flex-1 text-xs py-1"
                        onKeyDown={e => { if (e.key === 'Enter') { addEvidence(id.id, addEvid); setAddEvid('') }}} />
                      <button onClick={() => { addEvidence(id.id, addEvid); setAddEvid('') }}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs">Add</button>
                    </div>
                  </div>
                  <button onClick={() => del(id.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

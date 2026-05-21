import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelType = 'romantic' | 'family' | 'friend' | 'mentor' | 'colleague' | 'community' | 'spiritual' | 'other'
type NurtureAction = 'reached-out' | 'quality-time' | 'gift' | 'support' | 'celebration' | 'apology' | 'gratitude' | 'shared-experience'
type RelHealth = 'struggling' | 'distant' | 'okay' | 'good' | 'thriving'

interface NurtureEntry {
  id: string
  personName: string
  relType: RelType
  action: NurtureAction
  health: RelHealth
  whatDid: string
  howItWent: string
  howTheyFelt: string
  nextNurture: string
  connectionScore: number
  date: string
  createdAt: string
}

const REL_CONFIG: Record<RelType, { label: string; emoji: string; color: string }> = {
  romantic:   { label: 'Romantic',   emoji: '💑', color: '#ec4899' },
  family:     { label: 'Family',     emoji: '👨‍👩‍👧', color: '#ef4444' },
  friend:     { label: 'Friend',     emoji: '😊', color: '#22c55e' },
  mentor:     { label: 'Mentor',     emoji: '🎓', color: '#f59e0b' },
  colleague:  { label: 'Colleague',  emoji: '🤝', color: '#3b82f6' },
  community:  { label: 'Community',  emoji: '🌍', color: '#84cc16' },
  spiritual:  { label: 'Spiritual',  emoji: '✨', color: '#a855f7' },
  other:      { label: 'Other',      emoji: '👥', color: '#94a3b8' },
}

const ACTION_CONFIG: Record<NurtureAction, { label: string; emoji: string }> = {
  'reached-out':       { label: 'Reached Out',        emoji: '📞' },
  'quality-time':      { label: 'Quality Time',        emoji: '⏰' },
  gift:                { label: 'Gift',                emoji: '🎁' },
  support:             { label: 'Support',             emoji: '🤗' },
  celebration:         { label: 'Celebration',         emoji: '🎉' },
  apology:             { label: 'Apology',             emoji: '🙏' },
  gratitude:           { label: 'Gratitude',           emoji: '💛' },
  'shared-experience': { label: 'Shared Experience',   emoji: '🌟' },
}

const HEALTH_CONFIG: Record<RelHealth, { label: string; color: string }> = {
  struggling: { label: 'Struggling', color: '#ef4444' },
  distant:    { label: 'Distant',    color: '#f97316' },
  okay:       { label: 'Okay',       color: '#f59e0b' },
  good:       { label: 'Good',       color: '#22c55e' },
  thriving:   { label: 'Thriving',   color: '#a855f7' },
}

const STORAGE_KEY = 'relationship_nurture'

export default function RelationshipNurture() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<NurtureEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<NurtureEntry, 'id' | 'createdAt'>>({
    personName: '', relType: 'friend', action: 'reached-out', health: 'good',
    whatDid: '', howItWent: '', howTheyFelt: '', nextNurture: '', connectionScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NurtureEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.personName.trim()) return
    const e: NurtureEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, personName: '', whatDid: '', howItWent: '', howTheyFelt: '', nextNurture: '' }))
    setShowForm(false)
    toastSuccess('Relationship nurture logged — love is a verb ❤️')
  }

  const thriving = entries.filter(e => e.health === 'thriving').length
  const uniquePeople = new Set(entries.map(e => e.personName)).size

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-pink-400" />
            Relationship Nurture
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Intentionally invest in your most important relationships.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Actions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{uniquePeople}</div>
          <div className="text-xs text-slate-500">People</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{thriving}</div>
          <div className="text-xs text-slate-500">Thriving</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Relationship Nurture</h3>
          <input value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
            placeholder="Person's name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.relType} onChange={e => setForm(f => ({ ...f, relType: e.target.value as RelType }))} className="game-input text-sm flex-1">
              {(Object.entries(REL_CONFIG) as [RelType, typeof REL_CONFIG.friend][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value as RelHealth }))} className="game-input text-sm flex-1">
              {(Object.entries(HEALTH_CONFIG) as [RelHealth, typeof HEALTH_CONFIG.good][]).map(([k, h]) => (
                <option key={k} value={k}>{h.label}</option>
              ))}
            </select>
          </div>
          <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value as NurtureAction }))} className="game-input w-full text-sm">
            {(Object.entries(ACTION_CONFIG) as [NurtureAction, typeof ACTION_CONFIG['reached-out']][]).map(([k, a]) => (
              <option key={k} value={k}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <textarea value={form.whatDid} onChange={e => setForm(f => ({ ...f, whatDid: e.target.value }))}
            placeholder="What did you do to nurture this relationship?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howItWent} onChange={e => setForm(f => ({ ...f, howItWent: e.target.value }))}
            placeholder="How did it go?" className="game-input w-full text-sm" />
          <input value={form.howTheyFelt} onChange={e => setForm(f => ({ ...f, howTheyFelt: e.target.value }))}
            placeholder="How did they seem / feel?" className="game-input w-full text-sm" />
          <input value={form.nextNurture} onChange={e => setForm(f => ({ ...f, nextNurture: e.target.value }))}
            placeholder="Next nurture action planned" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Connection score: {form.connectionScore}/10</p>
            <input type="range" min={1} max={10} value={form.connectionScore}
              onChange={e => setForm(f => ({ ...f, connectionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = REL_CONFIG[e.relType]
          const a = ACTION_CONFIG[e.action]
          const h = HEALTH_CONFIG[e.health]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.personName}</span>
                  <span className="text-xs">{a.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: h.color + '20', color: h.color }}>{h.label}</span>
                  <span className="text-xs text-pink-400">💛 {e.connectionScore}/10</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.whatDid}</p>
                {e.nextNurture && <p className="text-xs text-blue-300/70 mt-0.5">Next: {e.nextNurture}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Relationships are the greatest investment you'll ever make.</p>
          </div>
        )}
      </div>
    </div>
  )
}

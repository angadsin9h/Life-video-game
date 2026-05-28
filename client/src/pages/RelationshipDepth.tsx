import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelationshipType = 'romantic' | 'family' | 'friendship' | 'mentor' | 'colleague' | 'community' | 'spiritual' | 'adversary'
type RelationshipDepthLevel = 'acquaintance' | 'familiar' | 'friend' | 'close' | 'deep' | 'soulmate'

interface RelationshipDepthEntry {
  id: string
  personName: string
  relationshipType: RelationshipType
  depthLevel: RelationshipDepthLevel
  howTheyShapeYou: string
  bestMemory: string
  whatYouLearnFromThem: string
  howToGoDeeper: string
  gratitudeForThem: string
  unsaidThing: string
  connectionScore: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<RelationshipType, { label: string; emoji: string; color: string }> = {
  romantic:   { label: 'Romantic',    emoji: '💑', color: '#ec4899' },
  family:     { label: 'Family',      emoji: '👨‍👩‍👧', color: '#f59e0b' },
  friendship: { label: 'Friendship',  emoji: '🤝', color: '#22c55e' },
  mentor:     { label: 'Mentor',      emoji: '🎓', color: '#3b82f6' },
  colleague:  { label: 'Colleague',   emoji: '💼', color: '#6366f1' },
  community:  { label: 'Community',   emoji: '🌆', color: '#84cc16' },
  spiritual:  { label: 'Spiritual',   emoji: '🙏', color: '#a855f7' },
  adversary:  { label: 'Adversary',   emoji: '⚔️', color: '#94a3b8' },
}

const DEPTH_CONFIG: Record<RelationshipDepthLevel, { label: string; color: string }> = {
  acquaintance: { label: 'Acquaintance', color: '#94a3b8' },
  familiar:     { label: 'Familiar',     color: '#6366f1' },
  friend:       { label: 'Friend',       color: '#3b82f6' },
  close:        { label: 'Close',        color: '#22c55e' },
  deep:         { label: 'Deep',         color: '#f59e0b' },
  soulmate:     { label: 'Soulmate',     color: '#ec4899' },
}

const STORAGE_KEY = 'relationship_depth_log'

export default function RelationshipDepth() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RelationshipDepthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<RelationshipDepthEntry, 'id' | 'createdAt'>>({
    personName: '', relationshipType: 'friendship', depthLevel: 'close',
    howTheyShapeYou: '', bestMemory: '', whatYouLearnFromThem: '',
    howToGoDeeper: '', gratitudeForThem: '', unsaidThing: '', connectionScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RelationshipDepthEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.personName.trim()) return
    const e: RelationshipDepthEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, personName: '', howTheyShapeYou: '', bestMemory: '', whatYouLearnFromThem: '', howToGoDeeper: '', gratitudeForThem: '', unsaidThing: '' }))
    setShowForm(false)
    toastSuccess('Relationship depth captured — quality of life equals quality of connection ❤️')
  }

  const soulmates = entries.filter(e => e.depthLevel === 'soulmate' || e.depthLevel === 'deep').length
  const avgConnection = entries.length ? Math.round(entries.reduce((s, e) => s + e.connectionScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-pink-400" />
            Relationship Depth
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Explore the depth and impact of your most important relationships.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">People</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{soulmates}</div>
          <div className="text-xs text-slate-500">Deep Bonds</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgConnection}/10</div>
          <div className="text-xs text-slate-500">Avg Connection</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Explore Relationship Depth</h3>
          <input value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
            placeholder="Person's name (or initials) *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.relationshipType} onChange={e => setForm(f => ({ ...f, relationshipType: e.target.value as RelationshipType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [RelationshipType, typeof TYPE_CONFIG.friendship][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.depthLevel} onChange={e => setForm(f => ({ ...f, depthLevel: e.target.value as RelationshipDepthLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [RelationshipDepthLevel, typeof DEPTH_CONFIG.close][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.howTheyShapeYou} onChange={e => setForm(f => ({ ...f, howTheyShapeYou: e.target.value }))}
            placeholder="How does this person shape who you are?" className="game-input w-full text-sm" />
          <input value={form.bestMemory} onChange={e => setForm(f => ({ ...f, bestMemory: e.target.value }))}
            placeholder="A defining or treasured memory with them" className="game-input w-full text-sm" />
          <input value={form.whatYouLearnFromThem} onChange={e => setForm(f => ({ ...f, whatYouLearnFromThem: e.target.value }))}
            placeholder="What do you uniquely learn from them?" className="game-input w-full text-sm" />
          <input value={form.howToGoDeeper} onChange={e => setForm(f => ({ ...f, howToGoDeeper: e.target.value }))}
            placeholder="How could you go deeper with this person?" className="game-input w-full text-sm" />
          <input value={form.gratitudeForThem} onChange={e => setForm(f => ({ ...f, gratitudeForThem: e.target.value }))}
            placeholder="What are you most grateful for about them?" className="game-input w-full text-sm" />
          <input value={form.unsaidThing} onChange={e => setForm(f => ({ ...f, unsaidThing: e.target.value }))}
            placeholder="Something you've never said to them" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Connection score: {form.connectionScore}/10</p>
            <input type="range" min={1} max={10} value={form.connectionScore}
              onChange={e => setForm(f => ({ ...f, connectionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.relationshipType]
          const d = DEPTH_CONFIG[e.depthLevel]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.personName}</span>
                  <span className="text-xs">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-pink-400">❤️ {e.connectionScore}/10</span>
                </div>
                {e.howTheyShapeYou && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.howTheyShapeYou}</p>}
                {e.gratitudeForThem && <p className="text-xs text-yellow-300/70 mt-0.5">🙏 {e.gratitudeForThem}</p>}
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
            <p className="text-sm">You are the average of the people you go deepest with.</p>
          </div>
        )}
      </div>
    </div>
  )
}

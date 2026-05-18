import { useState, useEffect } from 'react'
import { Gift, Plus, Trash2, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Occasion = 'birthday' | 'christmas' | 'anniversary' | 'graduation' | 'wedding' | 'babyshower' | 'valentines' | 'random' | 'other'
type GiftStatus = 'idea' | 'planned' | 'purchased' | 'given'

interface GiftIdea {
  id: string
  person: string
  occasion: Occasion
  occasionDate: string
  idea: string
  link: string
  budget: number
  status: GiftStatus
  notes: string
  createdAt: string
}

const OCC_CONFIG: Record<Occasion, { label: string; emoji: string; color: string }> = {
  birthday:    { label: 'Birthday',    emoji: '🎂', color: '#f59e0b' },
  christmas:   { label: 'Christmas',   emoji: '🎄', color: '#22c55e' },
  anniversary: { label: 'Anniversary', emoji: '💑', color: '#ec4899' },
  graduation:  { label: 'Graduation',  emoji: '🎓', color: '#6366f1' },
  wedding:     { label: 'Wedding',     emoji: '💍', color: '#a855f7' },
  babyshower:  { label: 'Baby Shower', emoji: '👶', color: '#3b82f6' },
  valentines:  { label: "Valentine's", emoji: '💝', color: '#ef4444' },
  random:      { label: 'Just Because',emoji: '✨', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '🎁', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<GiftStatus, { label: string; color: string }> = {
  idea:      { label: 'Idea',      color: '#6366f1' },
  planned:   { label: 'Planned',   color: '#f59e0b' },
  purchased: { label: 'Purchased', color: '#3b82f6' },
  given:     { label: 'Given!',    color: '#22c55e' },
}

const STORAGE_KEY = 'gift_ideas'

export default function GiftIdeas() {
  const { toastSuccess } = useToast()
  const [gifts, setGifts] = useState<GiftIdea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterPerson, setFilterPerson] = useState<string>('all')
  const [form, setForm] = useState<Omit<GiftIdea, 'id' | 'createdAt'>>({
    person: '', occasion: 'birthday', occasionDate: '', idea: '', link: '',
    budget: 0, status: 'idea', notes: '',
  })

  useEffect(() => {
    try { setGifts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GiftIdea[]) => { setGifts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.person.trim() || !form.idea.trim()) return
    const g: GiftIdea = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...gifts])
    setForm({ person: '', occasion: 'birthday', occasionDate: '', idea: '', link: '', budget: 0, status: 'idea', notes: '' })
    setShowForm(false)
    toastSuccess(`Gift idea saved for ${form.person} 🎁`)
  }

  const people = [...new Set(gifts.map(g => g.person))].filter(Boolean)
  const upcoming = gifts.filter(g => {
    if (!g.occasionDate) return false
    const d = new Date(g.occasionDate)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30 && g.status !== 'given'
  })

  const filtered = gifts.filter(g => filterPerson === 'all' || g.person === filterPerson)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Gift className="w-7 h-7 text-pink-400" />
            Gift Ideas
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Never run out of gift ideas for the people you love.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {upcoming.length > 0 && (
        <div className="game-card p-3 border border-yellow-500/30 bg-yellow-500/5">
          <p className="text-sm font-medium text-yellow-400 mb-1">⏰ Upcoming in 30 days:</p>
          {upcoming.map(g => {
            const o = OCC_CONFIG[g.occasion]
            return (
              <p key={g.id} className="text-xs text-slate-300">{o.emoji} {g.person} — {g.occasion} on {g.occasionDate}</p>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{gifts.length}</div>
          <div className="text-xs text-slate-500">Total Ideas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{gifts.filter(g => g.status === 'given').length}</div>
          <div className="text-xs text-slate-500">Gifted</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{people.length}</div>
          <div className="text-xs text-slate-500">People</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterPerson('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterPerson === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {people.map(p => (
          <button key={p} onClick={() => setFilterPerson(p)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterPerson === p ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {p}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Gift Idea</h3>
          <div className="flex gap-2">
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="Person's name *" className="game-input flex-1" autoFocus />
            <select value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value as Occasion }))} className="game-input text-sm">
              {(Object.entries(OCC_CONFIG) as [Occasion, typeof OCC_CONFIG.birthday][]).map(([k, o]) => (
                <option key={k} value={k}>{o.emoji} {o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.occasionDate} onChange={e => setForm(f => ({ ...f, occasionDate: e.target.value }))}
              className="game-input text-sm flex-1" title="Occasion date" />
            <input type="number" value={form.budget || ''} min={0}
              onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
              placeholder="Budget $" className="game-input w-24 text-sm" />
          </div>
          <input value={form.idea} onChange={e => setForm(f => ({ ...f, idea: e.target.value }))}
            placeholder="Gift idea *" className="game-input w-full" />
          <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder="Link (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [GiftStatus, typeof STATUS_CONFIG.idea][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.status === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.status === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(g => {
          const o = OCC_CONFIG[g.occasion]
          const s = STATUS_CONFIG[g.status]
          return (
            <div key={g.id} className="game-card p-3 flex items-center gap-3"
              style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-xl">{o.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{g.person}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{g.idea}</p>
                <p className="text-xs text-slate-600">{o.label}{g.occasionDate && ` · ${g.occasionDate}`}{g.budget > 0 && ` · $${g.budget}`}</p>
              </div>
              <div className="flex gap-1">
                {g.status !== 'given' && (
                  <button onClick={() => save(gifts.map(x => x.id === g.id ? { ...x, status: 'given' } : x))}
                    className="p-1 text-green-600 hover:text-green-400">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => save(gifts.filter(x => x.id !== g.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start collecting gift ideas year-round.</p>
          </div>
        )}
      </div>
    </div>
  )
}

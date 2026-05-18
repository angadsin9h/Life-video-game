import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Relation = 'parent' | 'sibling' | 'child' | 'grandparent' | 'grandchild' | 'aunt-uncle' | 'cousin' | 'spouse' | 'in-law' | 'other'

interface FamilyMember {
  id: string
  name: string
  relation: Relation
  birthdate: string
  birthplace: string
  currentLocation: string
  occupation: string
  personality: string
  sharedMemories: string
  relationship: string
  isDeceased: boolean
  contactFrequency: string
  createdAt: string
}

const RELATION_CONFIG: Record<Relation, { label: string; emoji: string; color: string }> = {
  parent:      { label: 'Parent',       emoji: '👩', color: '#f59e0b' },
  sibling:     { label: 'Sibling',      emoji: '👫', color: '#3b82f6' },
  child:       { label: 'Child',        emoji: '👶', color: '#22c55e' },
  grandparent: { label: 'Grandparent',  emoji: '👴', color: '#a855f7' },
  grandchild:  { label: 'Grandchild',   emoji: '🧒', color: '#ec4899' },
  'aunt-uncle':{ label: 'Aunt/Uncle',   emoji: '🧑', color: '#f97316' },
  cousin:      { label: 'Cousin',       emoji: '🧑', color: '#6366f1' },
  spouse:      { label: 'Spouse',       emoji: '💑', color: '#ef4444' },
  'in-law':    { label: 'In-Law',       emoji: '🤝', color: '#0ea5e9' },
  other:       { label: 'Other',        emoji: '👤', color: '#94a3b8' },
}

const STORAGE_KEY = 'family_tree'

export default function FamilyTree() {
  const { toastSuccess } = useToast()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterRelation, setFilterRelation] = useState<string>('all')
  const [form, setForm] = useState<Omit<FamilyMember, 'id' | 'createdAt'>>({
    name: '', relation: 'parent', birthdate: '', birthplace: '',
    currentLocation: '', occupation: '', personality: '', sharedMemories: '',
    relationship: '', isDeceased: false, contactFrequency: '',
  })

  useEffect(() => {
    try { setMembers(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FamilyMember[]) => { setMembers(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const m: FamilyMember = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...members])
    setForm({ name: '', relation: 'parent', birthdate: '', birthplace: '', currentLocation: '', occupation: '', personality: '', sharedMemories: '', relationship: '', isDeceased: false, contactFrequency: '' })
    setShowForm(false)
    toastSuccess(`${form.name} added to family tree 👨‍👩‍👧`)
  }

  const filtered = members.filter(m => filterRelation === 'all' || m.relation === filterRelation)
  const usedRelations = [...new Set(members.map(m => m.relation))]

  const getAge = (birthdate: string) => {
    if (!birthdate) return ''
    const diff = new Date().getFullYear() - new Date(birthdate).getFullYear()
    return `${diff}y`
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-amber-400" />
            Family Tree
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your family members and connections.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{members.length}</div>
          <div className="text-xs text-slate-500">Members</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{usedRelations.length}</div>
          <div className="text-xs text-slate-500">Relations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{members.filter(m => m.isDeceased).length}</div>
          <div className="text-xs text-slate-500">Ancestors</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterRelation('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterRelation === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {usedRelations.map(r => {
          const c = RELATION_CONFIG[r as Relation]
          return (
            <button key={r} onClick={() => setFilterRelation(r)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterRelation === r ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterRelation === r ? { background: c.color + '30', color: c.color } : {}}>
              {c.emoji} {c.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Family Member</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name *" className="game-input flex-1" autoFocus />
            <select value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value as Relation }))} className="game-input text-sm">
              {(Object.entries(RELATION_CONFIG) as [Relation, typeof RELATION_CONFIG.parent][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.birthdate} onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} className="game-input text-sm flex-1" />
            <input value={form.birthplace} onChange={e => setForm(f => ({ ...f, birthplace: e.target.value }))}
              placeholder="Birthplace" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
            placeholder="Occupation" className="game-input w-full text-sm" />
          <textarea value={form.personality} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))}
            placeholder="Personality / description..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.sharedMemories} onChange={e => setForm(f => ({ ...f, sharedMemories: e.target.value }))}
            placeholder="Shared memories / stories..." className="game-input w-full h-12 resize-none text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isDeceased} onChange={e => setForm(f => ({ ...f, isDeceased: e.target.checked }))} className="accent-purple-400" />
            Deceased (ancestor)
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(m => {
          const r = RELATION_CONFIG[m.relation]
          const isExp = expanded === m.id
          return (
            <div key={m.id} className={`game-card overflow-hidden ${m.isDeceased ? 'opacity-70' : ''}`} style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{m.isDeceased ? '🕊️' : r.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{m.name}</span>
                    {m.birthdate && <span className="text-xs text-slate-500">{getAge(m.birthdate)}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{r.label}{m.occupation && ` · ${m.occupation}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {m.birthplace && <p className="text-xs text-slate-400">🏠 Born: {m.birthdate} in {m.birthplace}</p>}
                  {m.personality && <p className="text-xs text-slate-300">{m.personality}</p>}
                  {m.sharedMemories && <p className="text-xs text-indigo-400 italic">"{m.sharedMemories}"</p>}
                  <button onClick={() => save(members.filter(x => x.id !== m.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Document your family history and connections.</p>
          </div>
        )}
      </div>
    </div>
  )
}

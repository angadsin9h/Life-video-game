import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ArmorType = 'belief' | 'mantra' | 'framework' | 'story' | 'question' | 'reference' | 'anchor' | 'principle'
type ToughDomain = 'failure' | 'rejection' | 'loss' | 'uncertainty' | 'fear' | 'pain' | 'change' | 'criticism'

interface ArmorEntry {
  id: string
  armorType: ArmorType
  domain: ToughDomain
  armor: string
  howItHelps: string
  when: string
  evidence: string
  strengthens: string
  powerLevel: number
  date: string
  createdAt: string
}

const ARMOR_CONFIG: Record<ArmorType, { label: string; emoji: string; color: string }> = {
  belief:    { label: 'Belief',     emoji: '💎', color: '#6366f1' },
  mantra:    { label: 'Mantra',     emoji: '🔮', color: '#a855f7' },
  framework: { label: 'Framework',  emoji: '🏗️', color: '#3b82f6' },
  story:     { label: 'Story',      emoji: '📖', color: '#f59e0b' },
  question:  { label: 'Question',   emoji: '❓', color: '#22c55e' },
  reference: { label: 'Reference',  emoji: '🎯', color: '#ec4899' },
  anchor:    { label: 'Anchor',     emoji: '⚓', color: '#f97316' },
  principle: { label: 'Principle',  emoji: '⚖️', color: '#84cc16' },
}

const DOMAIN_CONFIG: Record<ToughDomain, { label: string; emoji: string }> = {
  failure:     { label: 'Failure',     emoji: '❌' },
  rejection:   { label: 'Rejection',   emoji: '💔' },
  loss:        { label: 'Loss',        emoji: '😢' },
  uncertainty: { label: 'Uncertainty', emoji: '🌫️' },
  fear:        { label: 'Fear',        emoji: '😨' },
  pain:        { label: 'Pain',        emoji: '🔥' },
  change:      { label: 'Change',      emoji: '🌀' },
  criticism:   { label: 'Criticism',   emoji: '🗣️' },
}

const STORAGE_KEY = 'mindset_armor'

export default function MindsetArmor() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ArmorEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ArmorEntry, 'id' | 'createdAt'>>({
    armorType: 'belief', domain: 'failure', armor: '', howItHelps: '',
    when: '', evidence: '', strengthens: '', powerLevel: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ArmorEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.armor.trim()) return
    const e: ArmorEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, armor: '', howItHelps: '', when: '', evidence: '', strengthens: '' }))
    setShowForm(false)
    toastSuccess('Mindset armor forged — your shield grows stronger 🛡️')
  }

  const avgPower = entries.length ? Math.round(entries.reduce((s, e) => s + e.powerLevel, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-indigo-400" />
            Mindset Armor
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your mental frameworks for navigating tough times.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Forge
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Armor Pieces</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{new Set(entries.map(e => e.domain)).size}</div>
          <div className="text-xs text-slate-500">Domains</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgPower}/10</div>
          <div className="text-xs text-slate-500">Avg Power</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Forge Mindset Armor</h3>
          <textarea value={form.armor} onChange={e => setForm(f => ({ ...f, armor: e.target.value }))}
            placeholder="The belief, mantra, framework, or story *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.armorType} onChange={e => setForm(f => ({ ...f, armorType: e.target.value as ArmorType }))} className="game-input text-sm flex-1">
              {(Object.entries(ARMOR_CONFIG) as [ArmorType, typeof ARMOR_CONFIG.belief][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ToughDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ToughDomain, typeof DOMAIN_CONFIG.failure][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.howItHelps} onChange={e => setForm(f => ({ ...f, howItHelps: e.target.value }))}
            placeholder="How does this help in tough moments?" className="game-input w-full text-sm" />
          <input value={form.when} onChange={e => setForm(f => ({ ...f, when: e.target.value }))}
            placeholder="When exactly do you use this?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence that this armor works" className="game-input w-full text-sm" />
          <input value={form.strengthens} onChange={e => setForm(f => ({ ...f, strengthens: e.target.value }))}
            placeholder="How does using it strengthen you?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Power level: {form.powerLevel}/10</p>
            <input type="range" min={1} max={10} value={form.powerLevel}
              onChange={e => setForm(f => ({ ...f, powerLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Forge Armor</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = ARMOR_CONFIG[e.armorType]
          const d = DOMAIN_CONFIG[e.domain]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{d.emoji} {d.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-yellow-400">⚡ {e.powerLevel}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.armor}</p>
                {e.howItHelps && <p className="text-xs text-blue-300/70 mt-0.5">{e.howItHelps}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your mindset is your armor. Forge it deliberately.</p>
          </div>
        )}
      </div>
    </div>
  )
}

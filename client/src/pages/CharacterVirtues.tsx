import { useState, useEffect } from 'react'
import { Award, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VirtueType = 'courage' | 'temperance' | 'justice' | 'wisdom' | 'compassion' | 'honesty' | 'humility' | 'gratitude' | 'patience' | 'generosity'
type VirtueStatus = 'aspiring' | 'developing' | 'practicing' | 'embodied' | 'tested'

interface CharacterVirtueEntry {
  id: string
  virtue: VirtueType
  status: VirtueStatus
  definition: string
  howYouPractice: string
  recentExample: string
  whenYouFail: string
  nextLevelLooks: string
  strengthScore: number
  date: string
  createdAt: string
}

const VIRTUE_CONFIG: Record<VirtueType, { label: string; emoji: string; color: string; description: string }> = {
  courage:     { label: 'Courage',     emoji: '⚔️', color: '#ef4444', description: 'Acting despite fear' },
  temperance:  { label: 'Temperance',  emoji: '⚖️', color: '#3b82f6', description: 'Self-control and moderation' },
  justice:     { label: 'Justice',     emoji: '🏛️', color: '#6366f1', description: 'Fairness and moral rightness' },
  wisdom:      { label: 'Wisdom',      emoji: '🦉', color: '#f59e0b', description: 'Applied knowledge' },
  compassion:  { label: 'Compassion',  emoji: '❤️', color: '#ec4899', description: 'Empathy in action' },
  honesty:     { label: 'Honesty',     emoji: '🔍', color: '#22c55e', description: 'Truth in all forms' },
  humility:    { label: 'Humility',    emoji: '🙏', color: '#84cc16', description: 'Freedom from pride' },
  gratitude:   { label: 'Gratitude',   emoji: '✨', color: '#a855f7', description: 'Appreciating what is' },
  patience:    { label: 'Patience',    emoji: '🌊', color: '#10b981', description: 'Calm endurance' },
  generosity:  { label: 'Generosity',  emoji: '🎁', color: '#f97316', description: 'Giving freely' },
}

const STATUS_CONFIG: Record<VirtueStatus, { label: string; color: string }> = {
  aspiring:   { label: 'Aspiring',   color: '#94a3b8' },
  developing: { label: 'Developing', color: '#6366f1' },
  practicing: { label: 'Practicing', color: '#3b82f6' },
  embodied:   { label: 'Embodied',   color: '#22c55e' },
  tested:     { label: 'Tested',     color: '#f59e0b' },
}

const STORAGE_KEY = 'character_virtues_log'

export default function CharacterVirtues() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CharacterVirtueEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CharacterVirtueEntry, 'id' | 'createdAt'>>({
    virtue: 'courage', status: 'developing', definition: '',
    howYouPractice: '', recentExample: '', whenYouFail: '',
    nextLevelLooks: '', strengthScore: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CharacterVirtueEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.howYouPractice.trim()) return
    const e: CharacterVirtueEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, definition: '', howYouPractice: '', recentExample: '', whenYouFail: '', nextLevelLooks: '' }))
    setShowForm(false)
    toastSuccess('Virtue tracked — character is built one choice at a time ⚔️')
  }

  const embodied = entries.filter(e => e.status === 'embodied' || e.status === 'tested').length
  const avgStrength = entries.length ? Math.round(entries.reduce((s, e) => s + e.strengthScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Award className="w-7 h-7 text-gold-400 text-yellow-500" />
            Character Virtues
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate and track the virtues that define who you become.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Virtues</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{embodied}</div>
          <div className="text-xs text-slate-500">Embodied</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgStrength}/10</div>
          <div className="text-xs text-slate-500">Avg Strength</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Track Virtue</h3>
          <div className="flex gap-2">
            <select value={form.virtue} onChange={e => setForm(f => ({ ...f, virtue: e.target.value as VirtueType }))} className="game-input text-sm flex-1">
              {(Object.entries(VIRTUE_CONFIG) as [VirtueType, typeof VIRTUE_CONFIG.courage][]).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as VirtueStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [VirtueStatus, typeof STATUS_CONFIG.developing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          {form.virtue && <p className="text-xs text-slate-500 italic">{VIRTUE_CONFIG[form.virtue].description}</p>}
          <input value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
            placeholder="How do YOU personally define this virtue?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.howYouPractice} onChange={e => setForm(f => ({ ...f, howYouPractice: e.target.value }))}
            placeholder="How do you specifically practice this? *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.recentExample} onChange={e => setForm(f => ({ ...f, recentExample: e.target.value }))}
            placeholder="Recent example of you demonstrating this" className="game-input w-full text-sm" />
          <input value={form.whenYouFail} onChange={e => setForm(f => ({ ...f, whenYouFail: e.target.value }))}
            placeholder="When / how do you tend to fail at this?" className="game-input w-full text-sm" />
          <input value={form.nextLevelLooks} onChange={e => setForm(f => ({ ...f, nextLevelLooks: e.target.value }))}
            placeholder="What does the next level of this virtue look like?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Current strength: {form.strengthScore}/10</p>
            <input type="range" min={1} max={10} value={form.strengthScore}
              onChange={e => setForm(f => ({ ...f, strengthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save Virtue</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const v = VIRTUE_CONFIG[e.virtue]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${v.color}` }}>
              <span className="text-2xl">{v.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{v.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">⚔️ {e.strengthScore}/10</span>
                </div>
                {e.howYouPractice && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.howYouPractice}</p>}
                {e.nextLevelLooks && <p className="text-xs text-yellow-300/70 mt-0.5">↑ {e.nextLevelLooks}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Character is destiny. Cultivate your virtues deliberately.</p>
          </div>
        )}
      </div>
    </div>
  )
}

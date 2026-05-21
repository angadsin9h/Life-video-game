import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SpiritualType = 'prayer' | 'meditation' | 'gratitude' | 'service' | 'study' | 'nature' | 'ritual' | 'community' | 'contemplation' | 'other'
type SpiritualTradition = 'universal' | 'christian' | 'buddhist' | 'hindu' | 'islamic' | 'jewish' | 'stoic' | 'secular' | 'eclectic' | 'other'

interface SpiritualEntry {
  id: string
  practiceType: SpiritualType
  tradition: SpiritualTradition
  practice: string
  insight: string
  feeling: string
  question: string
  duration: number
  depth: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<SpiritualType, { label: string; emoji: string; color: string }> = {
  prayer:        { label: 'Prayer',        emoji: '🙏', color: '#a855f7' },
  meditation:    { label: 'Meditation',    emoji: '🧘', color: '#6366f1' },
  gratitude:     { label: 'Gratitude',     emoji: '💛', color: '#f59e0b' },
  service:       { label: 'Service',       emoji: '🤝', color: '#22c55e' },
  study:         { label: 'Sacred Study',  emoji: '📖', color: '#3b82f6' },
  nature:        { label: 'Nature',        emoji: '🌿', color: '#84cc16' },
  ritual:        { label: 'Ritual',        emoji: '🕯️', color: '#f97316' },
  community:     { label: 'Community',     emoji: '👥', color: '#ec4899' },
  contemplation: { label: 'Contemplation', emoji: '✨', color: '#0ea5e9' },
  other:         { label: 'Other',         emoji: '🌟', color: '#94a3b8' },
}

const TRADITION_CONFIG: Record<SpiritualTradition, { label: string }> = {
  universal:  { label: 'Universal'  },
  christian:  { label: 'Christian'  },
  buddhist:   { label: 'Buddhist'   },
  hindu:      { label: 'Hindu'      },
  islamic:    { label: 'Islamic'    },
  jewish:     { label: 'Jewish'     },
  stoic:      { label: 'Stoic'      },
  secular:    { label: 'Secular'    },
  eclectic:   { label: 'Eclectic'  },
  other:      { label: 'Other'      },
}

const STORAGE_KEY = 'spiritual_practice_log'

export default function SpiritualPractice() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SpiritualEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SpiritualEntry, 'id' | 'createdAt'>>({
    practiceType: 'meditation', tradition: 'universal', practice: '', insight: '',
    feeling: '', question: '', duration: 20, depth: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SpiritualEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.practice.trim()) return
    const e: SpiritualEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, practice: '', insight: '', feeling: '', question: '' }))
    setShowForm(false)
    toastSuccess('Spiritual practice logged — connection deepens ✨')
  }

  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)
  const avgDepth = entries.length ? Math.round(entries.reduce((s, e) => s + e.depth, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-purple-400" />
            Spiritual Practice
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your inner journey and sacred practices.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{totalMinutes}m</div>
          <div className="text-xs text-slate-500">Total Time</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Practice</h3>
          <div className="flex gap-2">
            <select value={form.practiceType} onChange={e => setForm(f => ({ ...f, practiceType: e.target.value as SpiritualType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [SpiritualType, typeof TYPE_CONFIG.prayer][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.tradition} onChange={e => setForm(f => ({ ...f, tradition: e.target.value as SpiritualTradition }))} className="game-input text-sm flex-1">
              {(Object.entries(TRADITION_CONFIG) as [SpiritualTradition, typeof TRADITION_CONFIG.universal][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.practice} onChange={e => setForm(f => ({ ...f, practice: e.target.value }))}
            placeholder="Describe your practice today *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="Insight or revelation received" className="game-input w-full text-sm" />
          <input value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
            placeholder="How did you feel during / after?" className="game-input w-full text-sm" />
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Question that arose for you" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
              <input type="range" min={5} max={120} step={5} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Depth: {form.depth}/10</p>
              <input type="range" min={1} max={10} value={form.depth}
                onChange={e => setForm(f => ({ ...f, depth: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Log Practice</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.practiceType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">{t.label}</span>
                  <span className="text-xs text-purple-400">✨ {e.depth}/10</span>
                  <span className="text-xs text-slate-500">{e.duration}min</span>
                  <span className="text-xs text-slate-600">{e.date}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.practice}</p>
                {e.insight && <p className="text-xs text-yellow-300/80 mt-0.5 italic">💡 {e.insight}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The inner life is the foundation of the outer life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

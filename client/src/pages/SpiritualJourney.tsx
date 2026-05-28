import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PracticeType = 'meditation' | 'prayer' | 'gratitude' | 'reading' | 'nature' | 'ritual' | 'reflection' | 'community'

interface SpiritualEntry {
  id: string
  date: string
  practice: PracticeType
  duration: number
  insight: string
  feeling: string
  mantra: string
  createdAt: string
}

interface SpiritualPrinciple {
  id: string
  principle: string
  source: string
}

const PRACTICES: Record<PracticeType, { label: string; emoji: string; color: string }> = {
  meditation:  { label: 'Meditation',  emoji: '🧘', color: '#a855f7' },
  prayer:      { label: 'Prayer',      emoji: '🙏', color: '#f59e0b' },
  gratitude:   { label: 'Gratitude',   emoji: '✨', color: '#22c55e' },
  reading:     { label: 'Sacred Reading', emoji: '📖', color: '#3b82f6' },
  nature:      { label: 'Nature',      emoji: '🌿', color: '#10b981' },
  ritual:      { label: 'Ritual',      emoji: '🕯️', color: '#f97316' },
  reflection:  { label: 'Reflection',  emoji: '🪞', color: '#6366f1' },
  community:   { label: 'Community',   emoji: '👥', color: '#ec4899' },
}

const STORAGE_KEY = 'spiritual_journey'
const PRINCIPLES_KEY = 'spiritual_principles'

export default function SpiritualJourney() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SpiritualEntry[]>([])
  const [principles, setPrinciples] = useState<SpiritualPrinciple[]>([])
  const [tab, setTab] = useState<'log' | 'principles'>('log')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], practice: 'meditation' as PracticeType, duration: 10, insight: '', feeling: '', mantra: '' })
  const [pForm, setPForm] = useState({ principle: '', source: '' })
  const [showPForm, setShowPForm] = useState(false)

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setPrinciples(JSON.parse(localStorage.getItem(PRINCIPLES_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveEntries = (u: SpiritualEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const savePrinciples = (u: SpiritualPrinciple[]) => { setPrinciples(u); localStorage.setItem(PRINCIPLES_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.insight.trim() && !form.feeling.trim()) return
    const e: SpiritualEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveEntries([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], practice: 'meditation', duration: 10, insight: '', feeling: '', mantra: '' })
    setShowForm(false)
    toastSuccess(`${PRACTICES[form.practice].emoji} Practice logged`)
  }

  const addPrinciple = () => {
    if (!pForm.principle.trim()) return
    const p: SpiritualPrinciple = { id: Date.now().toString(), ...pForm }
    savePrinciples([...principles, p])
    setPForm({ principle: '', source: '' })
    setShowPForm(false)
    toastSuccess('Principle added ✨')
  }

  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)
  const streak = (() => {
    let s = 0
    const today = new Date().toISOString().split('T')[0]
    let d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (entries.some(e => e.date === ds)) { s++; d.setDate(d.getDate() - 1) } else break
    }
    return s
  })()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Sparkles className="w-7 h-7 text-purple-400" />
          Spiritual Journey
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track practices, insights, and guiding principles.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{totalMinutes}</div>
          <div className="text-xs text-slate-500">Minutes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['log', 'principles'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {t === 'log' ? `Practice Log (${entries.length})` : `Principles (${principles.length})`}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <>
          <button onClick={() => setShowForm(true)}
            className="w-full py-2.5 border border-dashed border-purple-700/50 rounded-xl text-purple-400 hover:border-purple-600 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Log practice
          </button>

          {showForm && (
            <div className="game-card p-4 border border-purple-500/20 space-y-3">
              <div className="flex gap-2">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
                <input type="number" value={form.duration} min={1}
                  onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="game-input w-20 text-sm text-center" placeholder="min" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(PRACTICES) as [PracticeType, typeof PRACTICES.meditation][]).map(([k, p]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, practice: k }))}
                    className={`p-2 rounded-lg text-center text-xs transition-all ${form.practice === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                    style={form.practice === k ? { background: p.color + '30', color: p.color } : {}}>
                    {p.emoji}<br />{p.label}
                  </button>
                ))}
              </div>
              <textarea value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
                placeholder="How did you feel during/after?" className="game-input w-full h-16 resize-none text-sm" autoFocus />
              <textarea value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
                placeholder="Any insight or realization?" className="game-input w-full h-16 resize-none text-sm" />
              <input value={form.mantra} onChange={e => setForm(f => ({ ...f, mantra: e.target.value }))}
                placeholder="Mantra or intention (optional)" className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {entries.map(e => {
              const p = PRACTICES[e.practice]
              const isExp = expanded === e.id
              return (
                <div key={e.id} className="game-card overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{p.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{e.duration}m</span>
                      </div>
                      <span className="text-xs text-slate-600">{e.date}</span>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      {e.feeling && <p className="text-sm text-slate-300">{e.feeling}</p>}
                      {e.insight && <p className="text-sm text-slate-300 italic">💡 {e.insight}</p>}
                      {e.mantra && <p className="text-xs text-purple-400 italic">"{e.mantra}"</p>}
                      <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {entries.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Begin your spiritual practice log.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'principles' && (
        <div className="space-y-3">
          <button onClick={() => setShowPForm(true)}
            className="w-full py-2.5 border border-dashed border-yellow-700/50 rounded-xl text-yellow-500 hover:border-yellow-600 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add guiding principle
          </button>
          {showPForm && (
            <div className="game-card p-4 border border-yellow-500/20 space-y-2">
              <input value={pForm.principle} onChange={e => setPForm(f => ({ ...f, principle: e.target.value }))}
                placeholder="The principle (e.g., 'Live fully in this moment')" className="game-input w-full" autoFocus />
              <input value={pForm.source} onChange={e => setPForm(f => ({ ...f, source: e.target.value }))}
                placeholder="Source (e.g., Stoicism, Tao Te Ching, personal)" className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={addPrinciple} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Add</button>
                <button onClick={() => setShowPForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {principles.map((p, i) => (
            <div key={p.id} className="game-card p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-sm flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <div className="flex-1">
                <p className="text-white text-sm">{p.principle}</p>
                {p.source && <p className="text-xs text-slate-500 mt-0.5">— {p.source}</p>}
              </div>
              <button onClick={() => savePrinciples(principles.filter(x => x.id !== p.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {principles.length === 0 && !showPForm && (
            <div className="text-center py-10 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Add guiding principles that anchor your life.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

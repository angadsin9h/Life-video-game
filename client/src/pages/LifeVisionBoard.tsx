import { useState, useCallback } from 'react'
import { Star, Plus, Trash2, Save, Eye, Target, Zap, Heart, Brain, DollarSign, Users, Compass } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'life_vision_board_v2'

interface VisionItem {
  id: string
  area: 'health' | 'wealth' | 'relationships' | 'career' | 'growth' | 'adventure' | 'spirit' | 'impact'
  title: string
  description: string
  emotion: string        // "I feel..." when I have this
  deadline: string       // YYYY or YYYY-MM
  affirmation: string    // present-tense "I am..." statement
  priority: 1 | 2 | 3   // 1=urgent, 2=important, 3=someday
  achieved: boolean
}

interface VisionBoard {
  headline: string       // "My 5-Year Vision"
  timeframe: '1year' | '3years' | '5years' | '10years'
  overallVision: string  // big paragraph vision
  items: VisionItem[]
  lastUpdated: string
}

const AREA_CONFIG = {
  health:        { emoji: '💪', color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-700/40',  label: 'Health & Body'    },
  wealth:        { emoji: '💰', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/40', label: 'Wealth & Finance' },
  relationships: { emoji: '❤️', color: 'text-pink-400',   bg: 'bg-pink-900/20',   border: 'border-pink-700/40',   label: 'Relationships'    },
  career:        { emoji: '🚀', color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-700/40',   label: 'Career & Work'    },
  growth:        { emoji: '🧠', color: 'text-cyan-400',   bg: 'bg-cyan-900/20',   border: 'border-cyan-700/40',   label: 'Learning & Growth'},
  adventure:     { emoji: '🌍', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/40', label: 'Adventure & Joy'  },
  spirit:        { emoji: '🙏', color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-700/40', label: 'Spirit & Purpose' },
  impact:        { emoji: '🌟', color: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-700/40',  label: 'Legacy & Impact'  },
}

function load(): VisionBoard {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? {
      headline: 'My 5-Year Vision', timeframe: '5years', overallVision: '', items: [], lastUpdated: '',
    }
  } catch {
    return { headline: 'My 5-Year Vision', timeframe: '5years', overallVision: '', items: [], lastUpdated: '' }
  }
}

export default function LifeVisionBoard() {
  const { toastSuccess } = useToast()
  const [board, setBoard] = useState<VisionBoard>(load)
  const [activeTab, setActiveTab] = useState<'board' | 'add' | 'affirmations'>('board')
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<VisionItem, 'id' | 'achieved'>>({
    area: 'health', title: '', description: '', emotion: '', deadline: '', affirmation: '', priority: 2,
  })
  const [editId, setEditId] = useState<string | null>(null)

  const persist = useCallback((b: VisionBoard) => {
    const updated = { ...b, lastUpdated: new Date().toISOString().slice(0, 10) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setBoard(updated)
  }, [])

  function submitItem() {
    if (!form.title.trim()) return
    if (editId) {
      persist({ ...board, items: board.items.map(i => i.id === editId ? { ...form, id: editId, achieved: false } : i) })
    } else {
      persist({ ...board, items: [...board.items, { ...form, id: Date.now().toString(), achieved: false }] })
    }
    setForm({ area: 'health', title: '', description: '', emotion: '', deadline: '', affirmation: '', priority: 2 })
    setEditId(null)
    setActiveTab('board')
    toastSuccess('Vision item saved!')
  }

  function toggleAchieved(id: string) {
    persist({ ...board, items: board.items.map(i => i.id === id ? { ...i, achieved: !i.achieved } : i) })
  }

  function deleteItem(id: string) { persist({ ...board, items: board.items.filter(i => i.id !== id) }) }

  function editItem(item: VisionItem) {
    setForm({ ...item })
    setEditId(item.id)
    setActiveTab('add')
  }

  const filtered = filterArea === 'all' ? board.items : board.items.filter(i => i.area === filterArea)
  const achievedCount = board.items.filter(i => i.achieved).length
  const byArea = Object.keys(AREA_CONFIG) as (keyof typeof AREA_CONFIG)[]

  const PRIORITY_LABELS: Record<number, string> = { 1: 'Urgent', 2: 'Important', 3: 'Someday' }
  const PRIORITY_COLORS: Record<number, string> = { 1: 'text-red-400', 2: 'text-yellow-400', 3: 'text-slate-500' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Life Vision Board</h1>
          <p className="text-slate-400 text-sm mt-1">Your future self, designed intentionally</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{achievedCount}/{board.items.length}</div>
          <div className="text-xs text-slate-500">achieved</div>
        </div>
      </div>

      {/* Vision header */}
      {board.overallVision && (
        <div className="game-card p-5 bg-gradient-to-r from-violet-900/30 to-cyan-900/20 border-violet-700/40">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-violet-300">{board.headline}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{board.overallVision}</p>
        </div>
      )}

      {/* Config row */}
      <div className="game-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="game-input w-full" placeholder="Vision headline" value={board.headline}
            onChange={e => persist({ ...board, headline: e.target.value })} />
          <select className="game-input w-full" value={board.timeframe}
            onChange={e => persist({ ...board, timeframe: e.target.value as VisionBoard['timeframe'] })}>
            <option value="1year">1 Year Vision</option>
            <option value="3years">3 Year Vision</option>
            <option value="5years">5 Year Vision</option>
            <option value="10years">10 Year Vision</option>
          </select>
        </div>
        <textarea className="game-input w-full text-sm" rows={3} placeholder="Describe your overall life vision in a paragraph. Where are you? What have you built? How do you feel?"
          value={board.overallVision} onChange={e => persist({ ...board, overallVision: e.target.value })} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['board', 'add', 'affirmations'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'add' ? (editId ? 'Edit Item' : '+ Add Item') : t}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Area filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterArea('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterArea === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              All ({board.items.length})
            </button>
            {byArea.map(a => {
              const count = board.items.filter(i => i.area === a).length
              if (!count) return null
              const cfg = AREA_CONFIG[a]
              return (
                <button key={a} onClick={() => setFilterArea(a)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterArea === a ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                  {cfg.emoji} {count}
                </button>
              )
            })}
          </div>

          {/* Grid of vision items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.sort((a, b) => a.priority - b.priority).map(item => {
              const cfg = AREA_CONFIG[item.area]
              return (
                <div key={item.id} className={`game-card p-4 border ${cfg.border} ${item.achieved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.emoji}</span>
                      <div>
                        <div className={`text-sm font-semibold ${item.achieved ? 'line-through text-slate-500' : 'text-white'}`}>{item.title}</div>
                        <div className="text-xs text-slate-500">{cfg.label}</div>
                      </div>
                    </div>
                    <span className={`text-xs ${PRIORITY_COLORS[item.priority]}`}>{PRIORITY_LABELS[item.priority]}</span>
                  </div>
                  {item.description && <p className="text-xs text-slate-400 mb-2">{item.description}</p>}
                  {item.emotion && <p className="text-xs text-slate-300 italic mb-2">"{item.emotion}"</p>}
                  {item.deadline && <div className="text-xs text-slate-500 mb-2">Target: {item.deadline}</div>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toggleAchieved(item.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.achieved ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400 hover:text-green-400'}`}>
                      {item.achieved ? '✓ Achieved!' : 'Mark achieved'}
                    </button>
                    <button onClick={() => editItem(item)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                      ✏️
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {board.items.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Your vision board is empty. Add your first vision item.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="game-card p-5 space-y-4">
          <h3 className="font-semibold text-white">{editId ? 'Edit Vision Item' : 'Add Vision Item'}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Life Area</label>
              <select className="game-input w-full" value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value as VisionItem['area'] }))}>
                {byArea.map(a => <option key={a} value={a}>{AREA_CONFIG[a].emoji} {AREA_CONFIG[a].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority</label>
              <select className="game-input w-full" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) as 1|2|3 }))}>
                <option value={1}>🔴 Urgent</option>
                <option value={2}>🟡 Important</option>
                <option value={3}>⚫ Someday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Vision Title *</label>
            <input className="game-input w-full" placeholder="e.g. Run a marathon" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea className="game-input w-full text-sm" rows={2} placeholder="What does this look like in detail?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">How you feel when you have this</label>
            <input className="game-input w-full" placeholder="I feel strong, free, and proud of myself" value={form.emotion}
              onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Present-tense affirmation</label>
            <input className="game-input w-full" placeholder="I am a strong, healthy athlete" value={form.affirmation}
              onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target date (year or year-month)</label>
            <input className="game-input w-full" placeholder="2027 or 2027-06" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>

          <button onClick={submitItem}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
            <Save className="w-4 h-4" />
            {editId ? 'Update Vision Item' : 'Add to Vision Board'}
          </button>
        </div>
      )}

      {activeTab === 'affirmations' && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Read these present-tense statements daily to program your subconscious.</p>
          {board.items.filter(i => i.affirmation && !i.achieved).map(item => {
            const cfg = AREA_CONFIG[item.area]
            return (
              <div key={item.id} className={`game-card p-4 ${cfg.bg} border ${cfg.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{cfg.emoji}</span>
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-white font-medium text-sm leading-relaxed">✨ {item.affirmation}</p>
                {item.emotion && <p className="text-xs text-slate-400 mt-1 italic">{item.emotion}</p>}
              </div>
            )
          })}
          {board.items.filter(i => i.affirmation).length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">
              Add affirmations to your vision items to see them here.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

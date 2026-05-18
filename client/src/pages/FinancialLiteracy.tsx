import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TopicCategory = 'investing' | 'budgeting' | 'taxes' | 'insurance' | 'retirement' | 'debt' | 'real-estate' | 'crypto' | 'business' | 'other'
type LearningStatus = 'learning' | 'mastered' | 'want-to-learn'

interface FinancialTopic {
  id: string
  title: string
  category: TopicCategory
  status: LearningStatus
  summary: string
  keyLessons: string
  actionsTaken: string
  source: string
  confidence: number
  createdAt: string
}

const CAT_CONFIG: Record<TopicCategory, { label: string; emoji: string; color: string }> = {
  investing:    { label: 'Investing',    emoji: '📈', color: '#22c55e' },
  budgeting:    { label: 'Budgeting',   emoji: '💰', color: '#f59e0b' },
  taxes:        { label: 'Taxes',       emoji: '🧾', color: '#ef4444' },
  insurance:    { label: 'Insurance',   emoji: '🛡️', color: '#3b82f6' },
  retirement:   { label: 'Retirement',  emoji: '🏖️', color: '#a855f7' },
  debt:         { label: 'Debt',        emoji: '💳', color: '#f97316' },
  'real-estate':{ label: 'Real Estate', emoji: '🏠', color: '#6366f1' },
  crypto:       { label: 'Crypto',      emoji: '₿', color: '#f59e0b' },
  business:     { label: 'Business',    emoji: '💼', color: '#0ea5e9' },
  other:        { label: 'Other',       emoji: '📚', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<LearningStatus, { label: string; color: string }> = {
  learning:       { label: 'Learning',       color: '#3b82f6' },
  mastered:       { label: 'Mastered',       color: '#22c55e' },
  'want-to-learn':{ label: 'Want to Learn',  color: '#a855f7' },
}

const STORAGE_KEY = 'financial_literacy'

export default function FinancialLiteracy() {
  const { toastSuccess } = useToast()
  const [topics, setTopics] = useState<FinancialTopic[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<FinancialTopic, 'id' | 'createdAt'>>({
    title: '', category: 'investing', status: 'learning',
    summary: '', keyLessons: '', actionsTaken: '', source: '', confidence: 5,
  })

  useEffect(() => {
    try { setTopics(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FinancialTopic[]) => { setTopics(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const t: FinancialTopic = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([t, ...topics])
    setForm({ title: '', category: 'investing', status: 'learning', summary: '', keyLessons: '', actionsTaken: '', source: '', confidence: 5 })
    setShowForm(false)
    toastSuccess('Financial topic saved 📈')
  }

  const filtered = topics.filter(t => filterCat === 'all' || t.category === filterCat)
  const mastered = topics.filter(t => t.status === 'mastered').length
  const avgConf = topics.length ? Math.round(topics.reduce((s, t) => s + t.confidence, 0) / topics.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Financial Literacy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what you know and are learning about money.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{topics.length}</div>
          <div className="text-xs text-slate-500">Topics</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgConf}/10</div>
          <div className="text-xs text-slate-500">Avg Confidence</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(CAT_CONFIG).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Topic</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Topic title *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TopicCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [TopicCategory, typeof CAT_CONFIG.investing][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LearningStatus }))} className="game-input text-sm">
              {(Object.entries(STATUS_CONFIG) as [LearningStatus, typeof STATUS_CONFIG.learning][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="What is this about?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.keyLessons} onChange={e => setForm(f => ({ ...f, keyLessons: e.target.value }))}
            placeholder="Key lessons learned..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.actionsTaken} onChange={e => setForm(f => ({ ...f, actionsTaken: e.target.value }))}
            placeholder="Actions taken based on this knowledge..." className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Source (book, course, person...)" className="game-input w-full text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-36">Confidence: {form.confidence}/10</span>
            <input type="range" min={1} max={10} value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
              className="flex-1 h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(t => {
          const c = CAT_CONFIG[t.category]
          const s = STATUS_CONFIG[t.status]
          const isExp = expanded === t.id
          return (
            <div key={t.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{t.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · Confidence: {t.confidence}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {t.summary && <p className="text-xs text-slate-300">{t.summary}</p>}
                  {t.keyLessons && <p className="text-xs text-yellow-300">💡 {t.keyLessons}</p>}
                  {t.actionsTaken && <p className="text-xs text-green-300">✅ {t.actionsTaken}</p>}
                  {t.source && <p className="text-xs text-slate-500">📚 {t.source}</p>}
                  <button onClick={() => save(topics.filter(x => x.id !== t.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your financial knowledge base.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Trophy, Star, Plus, Trash2, ChevronDown, ChevronUp, Zap, Target, BookOpen, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Domain = 'career' | 'health' | 'relationships' | 'finance' | 'learning' | 'creativity' | 'personal'

type SuccessEntry = {
  id: string
  date: string
  title: string
  domain: Domain
  impactLevel: number
  conditions: string[]
  keyActions: string[]
  mindset: string
  obstacles: string
  luck: number
  replicable: boolean
  formula: string
  lessons: string[]
}

const STORAGE_KEY = 'lq-success-autopsy'

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string; bg: string }> = {
  career:        { label: 'Career',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  health:        { label: 'Health',        color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  relationships: { label: 'Relationships', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  finance:       { label: 'Finance',       color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  learning:      { label: 'Learning',      color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  creativity:    { label: 'Creativity',    color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  personal:      { label: 'Personal',      color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
}

const DOMAINS: Domain[] = ['career', 'health', 'relationships', 'finance', 'learning', 'creativity', 'personal']

const emptyForm = (): Omit<SuccessEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  title: '',
  domain: 'career',
  impactLevel: 7,
  conditions: [],
  keyActions: [],
  mindset: '',
  obstacles: '',
  luck: 30,
  replicable: true,
  formula: '',
  lessons: [],
})

export default function SuccessAutopsy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SuccessEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SuccessEntry, 'id'>>(emptyForm())
  const [conditionInput, setConditionInput] = useState('')
  const [actionInput, setActionInput] = useState('')
  const [lessonInput, setLessonInput] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entries' | 'patterns' | 'map' | 'formulas' | 'domains'>('entries')

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: SuccessEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addEntry = () => {
    if (!form.title.trim()) return
    const entry: SuccessEntry = { ...form, id: Date.now().toString() }
    save([entry, ...entries])
    setForm(emptyForm())
    setConditionInput('')
    setActionInput('')
    setLessonInput('')
    setShowForm(false)
    toastSuccess('Success autopsy logged', 'Your pattern has been recorded')
  }

  const removeEntry = (id: string) => {
    save(entries.filter(e => e.id !== id))
  }

  const addToList = (
    field: 'conditions' | 'keyActions' | 'lessons',
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return
    setForm(f => ({ ...f, [field]: [...f[field], value.trim()] }))
    setter('')
  }

  const removeFromList = (field: 'conditions' | 'keyActions' | 'lessons', idx: number) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))
  }

  const getTopPatterns = (field: 'conditions' | 'keyActions') => {
    const counts: Record<string, number> = {}
    entries.forEach(e => e[field].forEach(item => {
      const key = item.toLowerCase().trim()
      counts[key] = (counts[key] || 0) + 1
    }))
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }

  const getDomainStats = () => {
    return DOMAINS.map(d => {
      const domainEntries = entries.filter(e => e.domain === d)
      const avgImpact = domainEntries.length
        ? domainEntries.reduce((s, e) => s + e.impactLevel, 0) / domainEntries.length
        : 0
      return { domain: d, count: domainEntries.length, avgImpact }
    }).filter(d => d.count > 0)
  }

  const getTopFormulas = () => {
    const counts: Record<string, number> = {}
    entries.forEach(e => {
      if (e.formula.trim()) {
        const key = e.formula.trim()
        counts[key] = (counts[key] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }

  const avgImpact = entries.length
    ? (entries.reduce((s, e) => s + e.impactLevel, 0) / entries.length).toFixed(1)
    : '0'
  const avgSkill = entries.length
    ? Math.round(entries.reduce((s, e) => s + (100 - e.luck), 0) / entries.length)
    : 0
  const replicableCount = entries.filter(e => e.replicable).length
  const topDomain = (() => {
    if (!entries.length) return '—'
    const counts: Record<string, number> = {}
    entries.forEach(e => { counts[e.domain] = (counts[e.domain] || 0) + 1 })
    return DOMAIN_CONFIG[Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Domain].label
  })()

  const topConditions = getTopPatterns('conditions')
  const topActions = getTopPatterns('keyActions')
  const domainStats = getDomainStats()
  const maxDomainCount = Math.max(...domainStats.map(d => d.count), 1)
  const topFormulas = getTopFormulas()

  const svgW = 480
  const svgH = 260
  const padL = 36
  const padB = 28
  const plotW = svgW - padL - 16
  const plotH = svgH - padB - 16

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #0f0a00 0%, #1a1100 50%, #0a0f00 100%)' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <Trophy className="w-7 h-7" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Orbitron, monospace' }}>Success Autopsy</h1>
              <p className="text-sm" style={{ color: '#a3825a' }}>Dissect your wins. Extract the formula.</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Plus className="w-4 h-4" />
            Log Success
          </button>
        </div>

        <div className="game-card p-5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5" style={{ color: '#f59e0b' }} />
            <span className="font-bold text-lg" style={{ color: '#f59e0b' }}>Your Success DNA</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Successes Logged', value: entries.length.toString() },
              { label: 'Avg Impact Score', value: `${avgImpact}/10` },
              { label: 'Skill-Driven', value: `${avgSkill}%` },
              { label: 'Replicable', value: `${replicableCount}/${entries.length}` },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Orbitron, monospace' }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: '#a3825a' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          {entries.length > 0 && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <span className="text-sm" style={{ color: '#a3825a' }}>Top domain: </span>
              <span className="font-semibold" style={{ color: '#f59e0b' }}>{topDomain}</span>
              {topConditions.length > 0 && (
                <>
                  <span className="text-sm mx-2" style={{ color: '#a3825a' }}>•</span>
                  <span className="text-sm" style={{ color: '#a3825a' }}>Key pattern: </span>
                  <span className="font-semibold text-sm" style={{ color: '#fbbf24' }}>{topConditions[0][0]}</span>
                </>
              )}
            </div>
          )}
        </div>

        {showForm && (
          <div className="game-card p-5 space-y-4" style={{ border: '1px solid rgba(245,158,11,0.35)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="font-bold" style={{ color: '#f59e0b' }}>New Success Autopsy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Title</label>
                <input
                  className="game-input w-full"
                  placeholder="What was the success?"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Domain</label>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map(d => (
                    <button
                      key={d}
                      onClick={() => setForm(f => ({ ...f, domain: d }))}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: form.domain === d ? DOMAIN_CONFIG[d].bg : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${form.domain === d ? DOMAIN_CONFIG[d].color : 'rgba(255,255,255,0.1)'}`,
                        color: form.domain === d ? DOMAIN_CONFIG[d].color : '#888',
                      }}
                    >
                      {DOMAIN_CONFIG[d].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#a3825a' }}>Impact Level: {form.impactLevel}/10</label>
                <input
                  type="range" min={1} max={10}
                  value={form.impactLevel}
                  onChange={e => setForm(f => ({ ...f, impactLevel: +e.target.value }))}
                  className="w-full accent-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Conditions That Made It Possible</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="game-input flex-1"
                    placeholder="Add a condition..."
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addToList('conditions', conditionInput, setConditionInput)}
                  />
                  <button
                    onClick={() => addToList('conditions', conditionInput, setConditionInput)}
                    className="px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.conditions.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {c}
                      <button onClick={() => removeFromList('conditions', i)} className="ml-1 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Key Actions</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="game-input flex-1"
                    placeholder="Add an action..."
                    value={actionInput}
                    onChange={e => setActionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addToList('keyActions', actionInput, setActionInput)}
                  />
                  <button
                    onClick={() => addToList('keyActions', actionInput, setActionInput)}
                    className="px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.keyActions.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                      {a}
                      <button onClick={() => removeFromList('keyActions', i)} className="ml-1 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Mindset You Were In</label>
                <textarea
                  className="game-input w-full h-20 resize-none"
                  placeholder="Describe your mental state..."
                  value={form.mindset}
                  onChange={e => setForm(f => ({ ...f, mindset: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Obstacles You Overcame</label>
                <textarea
                  className="game-input w-full h-20 resize-none"
                  placeholder="What was in your way?"
                  value={form.obstacles}
                  onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2" style={{ color: '#a3825a' }}>
                Luck vs Skill: {form.luck}% luck / {100 - form.luck}% skill
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#888' }}>Pure Luck</span>
                <input
                  type="range" min={0} max={100}
                  value={form.luck}
                  onChange={e => setForm(f => ({ ...f, luck: +e.target.value }))}
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-xs" style={{ color: '#888' }}>Pure Skill</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Extracted Success Formula</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. Deep focus + clear goal + accountability = win"
                  value={form.formula}
                  onChange={e => setForm(f => ({ ...f, formula: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs" style={{ color: '#a3825a' }}>Replicable?</label>
                <button
                  onClick={() => setForm(f => ({ ...f, replicable: !f.replicable }))}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: form.replicable ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${form.replicable ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    color: form.replicable ? '#4ade80' : '#888',
                  }}
                >
                  {form.replicable ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: '#a3825a' }}>Lessons Learned</label>
              <div className="flex gap-2 mb-2">
                <input
                  className="game-input flex-1"
                  placeholder="Add a lesson..."
                  value={lessonInput}
                  onChange={e => setLessonInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addToList('lessons', lessonInput, setLessonInput)}
                />
                <button
                  onClick={() => addToList('lessons', lessonInput, setLessonInput)}
                  className="px-3 py-1 rounded-lg"
                  style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {form.lessons.map((l, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
                    <span>{l}</span>
                    <button onClick={() => removeFromList('lessons', i)} className="hover:text-red-400 ml-2"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={addEntry}
                className="px-6 py-2 rounded-xl font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
              >
                Save Autopsy
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm()) }}
                className="px-6 py-2 rounded-xl font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(['entries', 'patterns', 'map', 'formulas', 'domains'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                background: activeTab === tab ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab ? '#f59e0b' : '#888',
              }}
            >
              {tab === 'entries' ? 'All Autopsies' : tab === 'patterns' ? 'Pattern Library' : tab === 'map' ? 'Success Map' : tab === 'formulas' ? 'Formula Bank' : 'By Domain'}
            </button>
          ))}
        </div>

        {activeTab === 'entries' && (
          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="game-card p-12 text-center" style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(245,158,11,0.3)' }} />
                <p style={{ color: '#a3825a' }}>No successes logged yet. Start your first autopsy.</p>
              </div>
            )}
            {entries.map(entry => (
              <div key={entry.id} className="game-card p-4" style={{ border: `1px solid ${DOMAIN_CONFIG[entry.domain].color}33` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: DOMAIN_CONFIG[entry.domain].bg, color: DOMAIN_CONFIG[entry.domain].color }}>
                      {entry.impactLevel}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: '#f5e6c8' }}>{entry.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: DOMAIN_CONFIG[entry.domain].bg, color: DOMAIN_CONFIG[entry.domain].color }}>
                          {DOMAIN_CONFIG[entry.domain].label}
                        </span>
                        <span className="text-xs" style={{ color: '#a3825a' }}>{entry.date}</span>
                        {entry.replicable && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>Replicable</span>
                        )}
                        <span className="text-xs" style={{ color: '#888' }}>{100 - entry.luck}% skill</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} style={{ color: '#888' }}>
                      {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removeEntry(entry.id)} className="hover:text-red-400" style={{ color: '#666' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedId === entry.id && (
                  <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {entry.formula && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>FORMULA: </span>
                        <span className="text-sm" style={{ color: '#fde68a' }}>{entry.formula}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.conditions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#a3825a' }}>Conditions</p>
                          <div className="flex flex-wrap gap-1">{entry.conditions.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>{c}</span>)}</div>
                        </div>
                      )}
                      {entry.keyActions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#a3825a' }}>Key Actions</p>
                          <div className="flex flex-wrap gap-1">{entry.keyActions.map((a, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>{a}</span>)}</div>
                        </div>
                      )}
                    </div>
                    {entry.mindset && <div><p className="text-xs font-semibold mb-1" style={{ color: '#a3825a' }}>Mindset</p><p className="text-sm" style={{ color: '#d4c5a0' }}>{entry.mindset}</p></div>}
                    {entry.obstacles && <div><p className="text-xs font-semibold mb-1" style={{ color: '#a3825a' }}>Obstacles Overcome</p><p className="text-sm" style={{ color: '#d4c5a0' }}>{entry.obstacles}</p></div>}
                    {entry.lessons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#a3825a' }}>Lessons</p>
                        <ul className="space-y-1">{entry.lessons.map((l, i) => <li key={i} className="text-sm" style={{ color: '#c084fc' }}>• {l}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="game-card p-5" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" style={{ color: '#f59e0b' }} />
                <span className="font-bold" style={{ color: '#f59e0b' }}>Top Success Conditions</span>
              </div>
              {topConditions.length === 0 ? (
                <p className="text-sm" style={{ color: '#888' }}>Log 2+ successes with overlapping conditions to see patterns.</p>
              ) : (
                <div className="space-y-2">
                  {topConditions.map(([cond, count]) => (
                    <div key={cond} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <span className="text-sm capitalize" style={{ color: '#f5e6c8' }}>{cond}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>{count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="game-card p-5" style={{ border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" style={{ color: '#22c55e' }} />
                <span className="font-bold" style={{ color: '#22c55e' }}>Recurring Key Actions</span>
              </div>
              {topActions.length === 0 ? (
                <p className="text-sm" style={{ color: '#888' }}>Log 2+ successes with overlapping actions to see patterns.</p>
              ) : (
                <div className="space-y-2">
                  {topActions.map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)' }}>
                      <span className="text-sm capitalize" style={{ color: '#f5e6c8' }}>{action}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>{count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="font-bold" style={{ color: '#f59e0b' }}>Success Map — Impact vs Skill</span>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#888' }}>No entries to map yet.</p>
            ) : (
              <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
                <line x1={padL} y1={16} x2={padL} y2={svgH - padB} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                <line x1={padL} y1={svgH - padB} x2={svgW - 16} y2={svgH - padB} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                {[0, 25, 50, 75, 100].map(v => {
                  const x = padL + (v / 100) * plotW
                  return <text key={v} x={x} y={svgH - 8} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={9}>{v}% skill</text>
                })}
                {[2, 4, 6, 8, 10].map(v => {
                  const y = 16 + ((10 - v) / 9) * plotH
                  return <text key={v} x={padL - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={9}>{v}</text>
                })}
                {entries.map(entry => {
                  const cx = padL + ((100 - entry.luck) / 100) * plotW
                  const cy = 16 + ((10 - entry.impactLevel) / 9) * plotH
                  const r = 4 + entry.impactLevel * 1.5
                  const color = DOMAIN_CONFIG[entry.domain].color
                  return (
                    <g key={entry.id}>
                      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.55} stroke={color} strokeWidth={1.5} />
                      <title>{entry.title} ({DOMAIN_CONFIG[entry.domain].label})</title>
                    </g>
                  )
                })}
                <text x={padL + plotW / 2} y={svgH} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>Skill-driven →</text>
              </svg>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              {DOMAINS.filter(d => entries.some(e => e.domain === d)).map(d => (
                <div key={d} className="flex items-center gap-1.5 text-xs" style={{ color: DOMAIN_CONFIG[d].color }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: DOMAIN_CONFIG[d].color }} />
                  {DOMAIN_CONFIG[d].label}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="font-bold" style={{ color: '#f59e0b' }}>Formula Bank</span>
            </div>
            {topFormulas.length === 0 ? (
              <p className="text-sm" style={{ color: '#888' }}>No formulas extracted yet. Fill the "formula" field when logging a success.</p>
            ) : (
              <div className="space-y-3">
                {topFormulas.map(([formula, count], i) => (
                  <div key={formula} className="p-4 rounded-xl" style={{ background: i === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
                    {i === 0 && <div className="text-xs font-bold mb-1" style={{ color: '#f59e0b' }}>MY SUCCESS FORMULA</div>}
                    <p className="font-semibold" style={{ color: '#fde68a' }}>{formula}</p>
                    {count > 1 && <p className="text-xs mt-1" style={{ color: '#a3825a' }}>Seen {count} times</p>}
                  </div>
                ))}
                <div className="mt-4 space-y-2">
                  {entries.filter(e => e.formula && !topFormulas.slice(0, topFormulas.length).map(([f]) => f).includes(e.formula)).map(e => (
                    <div key={e.id} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: DOMAIN_CONFIG[e.domain].bg, color: DOMAIN_CONFIG[e.domain].color }}>{DOMAIN_CONFIG[e.domain].label}</span>
                      <span className="text-sm" style={{ color: '#d4c5a0' }}>{e.formula}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="font-bold" style={{ color: '#f59e0b' }}>Domain Breakdown</span>
            </div>
            {domainStats.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#888' }}>No entries yet.</p>
            ) : (
              <svg width="100%" viewBox={`0 0 ${svgW} 200`}>
                {domainStats.map((stat, i) => {
                  const barW = Math.max((plotW / domainStats.length) - 8, 20)
                  const x = padL + i * (plotW / domainStats.length) + (plotW / domainStats.length - barW) / 2
                  const barH = (stat.count / maxDomainCount) * 140
                  const y = 155 - barH
                  const color = DOMAIN_CONFIG[stat.domain].color
                  return (
                    <g key={stat.domain}>
                      <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} fillOpacity={0.7} />
                      <text x={x + barW / 2} y={155 + 14} textAnchor="middle" fill={color} fontSize={8}>
                        {DOMAIN_CONFIG[stat.domain].label.slice(0, 7)}
                      </text>
                      <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={color} fontSize={9} fontWeight="bold">{stat.count}</text>
                      <text x={x + barW / 2} y={155 + 24} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>
                        avg {stat.avgImpact.toFixed(1)}
                      </text>
                    </g>
                  )
                })}
                <line x1={padL} y1={155} x2={svgW - 16} y2={155} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

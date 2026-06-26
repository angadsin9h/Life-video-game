import React, { useState, useEffect } from 'react'
import { Brain, Plus, ChevronRight, X, Tag, Lightbulb, Globe, Cpu, TrendingUp, HeartPulse, Users, Palette, FlaskConical, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IdeaDomain = 'technology' | 'philosophy' | 'business' | 'health' | 'society' | 'creativity' | 'science' | 'relationships'
type IdeaType = 'insight' | 'framework' | 'prediction' | 'question' | 'contrarian-view' | 'synthesis'
type IdeaStatus = 'seed' | 'developing' | 'refined' | 'published'

type Idea = {
  id: string
  created: string
  title: string
  domain: IdeaDomain
  type: IdeaType
  summary: string
  elaboration: string
  evidence: string
  implications: string
  originality: number
  confidence: number
  status: IdeaStatus
  tags: string[]
}

type Tab = 'landscape' | 'pipeline' | 'domains' | 'fingerprint'
type CaptureMode = 'quick' | 'full'

const DOMAIN_CONFIG: Record<IdeaDomain, { label: string; color: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  technology:    { label: 'Technology',    color: '#06b6d4', Icon: Cpu },
  philosophy:    { label: 'Philosophy',    color: '#8b5cf6', Icon: BookOpen },
  business:      { label: 'Business',      color: '#f59e0b', Icon: TrendingUp },
  health:        { label: 'Health',        color: '#22c55e', Icon: HeartPulse },
  society:       { label: 'Society',       color: '#f97316', Icon: Globe },
  creativity:    { label: 'Creativity',    color: '#ec4899', Icon: Palette },
  science:       { label: 'Science',       color: '#3b82f6', Icon: FlaskConical },
  relationships: { label: 'Relationships', color: '#10b981', Icon: Users },
}

const TYPE_CONFIG: Record<IdeaType, { label: string; color: string }> = {
  insight:          { label: 'Insight',          color: '#f59e0b' },
  framework:        { label: 'Framework',         color: '#06b6d4' },
  prediction:       { label: 'Prediction',        color: '#a855f7' },
  question:         { label: 'Question',          color: '#3b82f6' },
  'contrarian-view':{ label: 'Contrarian View',   color: '#ef4444' },
  synthesis:        { label: 'Synthesis',         color: '#10b981' },
}

const STATUS_ORDER: IdeaStatus[] = ['seed', 'developing', 'refined', 'published']
const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string; next: IdeaStatus | null }> = {
  seed:       { label: 'Seed',       color: '#475569', next: 'developing' },
  developing: { label: 'Developing', color: '#f59e0b', next: 'refined' },
  refined:    { label: 'Refined',    color: '#06b6d4', next: 'published' },
  published:  { label: 'Published',  color: '#22c55e', next: null },
}

const DOMAINS = Object.keys(DOMAIN_CONFIG) as IdeaDomain[]
const TYPES = Object.keys(TYPE_CONFIG) as IdeaType[]
const STORAGE_KEY = 'lq-thoughtleadershiplog'

const emptyIdea = (): Omit<Idea, 'id' | 'created'> => ({
  title: '',
  domain: 'technology',
  type: 'insight',
  summary: '',
  elaboration: '',
  evidence: '',
  implications: '',
  originality: 7,
  confidence: 6,
  status: 'seed',
  tags: [],
})

function IdeaScatterPlot({ ideas, onSelect }: { ideas: Idea[]; onSelect: (id: string) => void }) {
  const W = 340
  const H = 260
  const PAD = 30

  if (ideas.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-slate-500 text-sm">
        Capture ideas to populate the landscape
      </div>
    )
  }

  const toX = (conf: number) => PAD + ((conf - 1) / 9) * (W - PAD * 2)
  const toY = (orig: number) => H - PAD - ((orig - 1) / 9) * (H - PAD * 2)
  const toR = (elab: number) => Math.max(4, Math.min(10, 4 + Math.sqrt(elab) * 0.25))

  return (
    <svg width={W} height={H} className="block w-full" viewBox={`0 0 ${W} ${H}`}>
      {[2, 4, 6, 8, 10].map(v => (
        <g key={v}>
          <line x1={toX(v)} y1={PAD} x2={toX(v)} y2={H - PAD} stroke="#1e293b" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="#1e293b" strokeWidth={1} strokeDasharray="3 3" />
        </g>
      ))}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#334155" strokeWidth={1} />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#334155" strokeWidth={1} />
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="#475569" fontSize={9}>Confidence →</text>
      <text x={8} y={H / 2} textAnchor="middle" fill="#475569" fontSize={9} transform={`rotate(-90, 8, ${H / 2})`}>Originality →</text>

      {ideas.map(idea => {
        const x = toX(idea.confidence)
        const y = toY(idea.originality)
        const r = toR(idea.elaboration.length)
        const color = DOMAIN_CONFIG[idea.domain].color
        return (
          <g key={idea.id} className="cursor-pointer" onClick={() => onSelect(idea.id)}>
            <circle cx={x} cy={y} r={r + 3} fill={color} opacity={0.15} />
            <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} />
            <title>{idea.title} ({DOMAIN_CONFIG[idea.domain].label})</title>
          </g>
        )
      })}
    </svg>
  )
}

function DomainBars({ ideas }: { ideas: Idea[] }) {
  const data = DOMAINS.map(d => ({
    domain: d,
    count: ideas.filter(i => i.domain === d).length,
    avgOriginality: (() => {
      const group = ideas.filter(i => i.domain === d)
      return group.length ? group.reduce((s, i) => s + i.originality, 0) / group.length : 0
    })(),
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)

  if (data.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-4">No ideas yet</div>
  }

  const maxCount = Math.max(...data.map(d => d.count))
  const W = 300
  const barH = 18
  const PAD_LEFT = 90

  return (
    <svg width={W} height={data.length * (barH + 8) + 20} className="block w-full" viewBox={`0 0 ${W} ${data.length * (barH + 8) + 20}`}>
      {data.map((d, i) => {
        const y = i * (barH + 8)
        const barW = ((d.count / maxCount) * (W - PAD_LEFT - 50))
        const color = DOMAIN_CONFIG[d.domain].color
        return (
          <g key={d.domain}>
            <text x={PAD_LEFT - 6} y={y + barH * 0.7} textAnchor="end" fill="#94a3b8" fontSize={10}>{DOMAIN_CONFIG[d.domain].label}</text>
            <rect x={PAD_LEFT} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.8} />
            <text x={PAD_LEFT + barW + 4} y={y + barH * 0.7} fill="#cbd5e1" fontSize={10}>{d.count}</text>
            <text x={W - 2} y={y + barH * 0.7} textAnchor="end" fill={color} fontSize={9}>{d.avgOriginality.toFixed(1)} orig</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ThoughtLeadershipLog() {
  const { toastSuccess } = useToast()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [tab, setTab] = useState<Tab>('landscape')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('quick')
  const [showCapture, setShowCapture] = useState(false)
  const [form, setForm] = useState<Omit<Idea, 'id' | 'created'>>(emptyIdea())
  const [tagInput, setTagInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<IdeaDomain | 'all'>('all')

  useEffect(() => {
    try { setIdeas(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: Idea[]) => {
    setIdeas(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addIdea = () => {
    if (!form.title.trim()) return
    const idea: Idea = { id: Date.now().toString(), created: new Date().toISOString().split('T')[0], ...form }
    persist([idea, ...ideas])
    setForm(emptyIdea())
    setTagInput('')
    setShowCapture(false)
    toastSuccess('Idea captured — let it develop')
  }

  const advanceStatus = (id: string) => {
    const idea = ideas.find(i => i.id === id)
    if (!idea) return
    const next = STATUS_CONFIG[idea.status].next
    if (!next) return
    persist(ideas.map(i => i.id === id ? { ...i, status: next } : i))
  }

  const deleteIdea = (id: string) => {
    persist(ideas.filter(i => i.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput('')
  }

  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))

  const selectedIdea = ideas.find(i => i.id === selectedId) || null
  const visibleIdeas = filterDomain === 'all' ? ideas : ideas.filter(i => i.domain === filterDomain)

  const topDomains = DOMAINS
    .map(d => ({ domain: d, count: ideas.filter(i => i.domain === d).length }))
    .sort((a, b) => b.count - a.count)
    .filter(d => d.count > 0)
    .slice(0, 3)

  const typeCounts = TYPES.map(t => ({ type: t, count: ideas.filter(i => i.type === t).length }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-6 h-6 text-cyan-400" />
            Thought Leadership Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Develop your unique ideas, perspectives, and intellectual contributions</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => { setCaptureMode('quick'); setShowCapture(true) }} className="px-3 py-1.5 text-xs font-medium rounded-md text-cyan-400 hover:bg-slate-700 transition-colors">Quick</button>
          <button onClick={() => { setCaptureMode('full'); setShowCapture(true) }} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-md text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Full
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{ideas.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Ideas</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {ideas.length ? (ideas.reduce((s, i) => s + i.originality, 0) / ideas.length).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Avg Originality</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{ideas.filter(i => i.status === 'published').length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Published</div>
        </div>
      </div>

      {showCapture && (
        <div className="game-card p-5 space-y-4 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="text-cyan-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              {captureMode === 'quick' ? 'Quick Capture' : 'Full Capture'}
            </div>
            <button onClick={() => setShowCapture(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What's the core idea?" className="game-input w-full text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as IdeaDomain }))} className="game-input w-full text-sm">
                {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_CONFIG[d].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as IdeaType }))} className="game-input w-full text-sm">
                {TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Summary</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="One paragraph summary of the idea" className="game-input w-full text-sm h-20 resize-none" />
          </div>

          {captureMode === 'full' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Elaboration</label>
                <textarea value={form.elaboration} onChange={e => setForm(f => ({ ...f, elaboration: e.target.value }))} placeholder="Develop the idea further..." className="game-input w-full text-sm h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Evidence / Examples</label>
                  <textarea value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} placeholder="What supports this?" className="game-input w-full text-sm h-16 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Implications</label>
                  <textarea value={form.implications} onChange={e => setForm(f => ({ ...f, implications: e.target.value }))} placeholder="What follows from this?" className="game-input w-full text-sm h-16 resize-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tags</label>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="Add tag and press Enter" className="game-input flex-1 text-sm" />
                  <button onClick={addTag} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(t => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs">
                        <Tag className="w-2.5 h-2.5" />
                        {t}
                        <button onClick={() => removeTag(t)} className="hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Originality: <span className="text-cyan-400 font-semibold">{form.originality}/10</span></label>
              <input type="range" min={1} max={10} value={form.originality} onChange={e => setForm(f => ({ ...f, originality: Number(e.target.value) }))} className="w-full accent-cyan-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Confidence: <span className="text-amber-400 font-semibold">{form.confidence}/10</span></label>
              <input type="range" min={1} max={10} value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))} className="w-full accent-amber-400" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCapture(false)} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
            <button onClick={addIdea} className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg text-sm font-semibold">Capture Idea</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl overflow-x-auto">
        {(['landscape', 'pipeline', 'domains', 'fingerprint'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-w-max py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${tab === t ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t === 'landscape' ? 'Idea Landscape' : t === 'pipeline' ? 'Pipeline' : t === 'domains' ? 'Domains' : 'Fingerprint'}
          </button>
        ))}
      </div>

      {tab === 'landscape' && (
        <div className="space-y-4">
          <div className="game-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold text-sm uppercase tracking-wider">Idea Landscape</div>
              <select value={filterDomain} onChange={e => setFilterDomain(e.target.value as IdeaDomain | 'all')} className="game-input text-xs py-1">
                <option value="all">All domains</option>
                {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_CONFIG[d].label}</option>)}
              </select>
            </div>
            <IdeaScatterPlot ideas={visibleIdeas} onSelect={setSelectedId} />
            <div className="flex flex-wrap gap-2 mt-3">
              {DOMAINS.filter(d => ideas.some(i => i.domain === d)).map(d => (
                <div key={d} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: DOMAIN_CONFIG[d].color }} />
                  <span className="text-xs text-slate-400">{DOMAIN_CONFIG[d].label}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedIdea && (
            <div className="game-card p-5 border border-cyan-500/30">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: DOMAIN_CONFIG[selectedIdea.domain].color + '22', color: DOMAIN_CONFIG[selectedIdea.domain].color }}>{DOMAIN_CONFIG[selectedIdea.domain].label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: TYPE_CONFIG[selectedIdea.type].color + '22', color: TYPE_CONFIG[selectedIdea.type].color }}>{TYPE_CONFIG[selectedIdea.type].label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: STATUS_CONFIG[selectedIdea.status].color + '22', color: STATUS_CONFIG[selectedIdea.status].color }}>{STATUS_CONFIG[selectedIdea.status].label}</span>
                  </div>
                  <div className="text-white font-semibold mt-1">{selectedIdea.title}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-slate-300 text-sm">{selectedIdea.summary}</div>
              {selectedIdea.elaboration && <div className="text-slate-400 text-sm mt-2">{selectedIdea.elaboration}</div>}
              <div className="flex gap-4 mt-3 text-xs">
                <span className="text-slate-400">Originality: <span className="text-cyan-400 font-semibold">{selectedIdea.originality}/10</span></span>
                <span className="text-slate-400">Confidence: <span className="text-amber-400 font-semibold">{selectedIdea.confidence}/10</span></span>
                <span className="text-slate-400">Created: <span className="text-slate-200">{selectedIdea.created}</span></span>
              </div>
              {selectedIdea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedIdea.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-xs">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {STATUS_CONFIG[selectedIdea.status].next && (
                  <button onClick={() => advanceStatus(selectedIdea.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors">
                    Advance to {STATUS_CONFIG[selectedIdea.status].next} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => deleteIdea(selectedIdea.id)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">Delete</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_ORDER.map(status => {
            const statusIdeas = ideas.filter(i => i.status === status)
            const conf = STATUS_CONFIG[status]
            return (
              <div key={status} className="game-card p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: conf.color }}>{conf.label}</span>
                  <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">{statusIdeas.length}</span>
                </div>
                <div className="space-y-2">
                  {statusIdeas.length === 0 && (
                    <div className="text-slate-600 text-xs text-center py-3">Empty</div>
                  )}
                  {statusIdeas.map(idea => (
                    <div key={idea.id} className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                      <div className="text-xs text-white font-medium leading-snug mb-1">{idea.title}</div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_CONFIG[idea.domain].color }} />
                        <span className="text-xs text-slate-500">{DOMAIN_CONFIG[idea.domain].label}</span>
                      </div>
                      {conf.next && (
                        <button onClick={() => advanceStatus(idea.id)} className="mt-1.5 w-full text-xs py-0.5 rounded bg-slate-600 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-0.5">
                          <ChevronRight className="w-3 h-3" /> Advance
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'domains' && (
        <div className="space-y-4">
          <div className="game-card p-5">
            <div className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Domain Breakdown</div>
            <DomainBars ideas={ideas} />
          </div>
          <div className="game-card p-5">
            <div className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Idea Types</div>
            <div className="space-y-2">
              {typeCounts.filter(t => t.count > 0).map(tc => (
                <div key={tc.type} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-400 text-right">{TYPE_CONFIG[tc.type].label}</div>
                  <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(tc.count / ideas.length) * 100}%`, background: TYPE_CONFIG[tc.type].color }}
                    />
                  </div>
                  <div className="w-6 text-xs text-slate-400 text-right">{tc.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'fingerprint' && (
        <div className="game-card p-6 space-y-5">
          <div className="text-white font-semibold text-base uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Your Intellectual Fingerprint
          </div>

          {ideas.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">Capture ideas to generate your fingerprint</div>
          ) : (
            <>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Domains</div>
                <div className="flex flex-wrap gap-2">
                  {topDomains.map(td => {
                    const conf = DOMAIN_CONFIG[td.domain]
                    const Icon = conf.Icon
                    return (
                      <div key={td.domain} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: conf.color + '20', border: `1px solid ${conf.color}40` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: conf.color }} />
                        <span className="text-sm font-medium" style={{ color: conf.color }}>{conf.label}</span>
                        <span className="text-xs text-slate-500">({td.count})</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Thinking Style</div>
                <div className="flex flex-wrap gap-2">
                  {typeCounts.filter(t => t.count > 0).slice(0, 3).map(tc => (
                    <span key={tc.type} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: TYPE_CONFIG[tc.type].color + '20', color: TYPE_CONFIG[tc.type].color, border: `1px solid ${TYPE_CONFIG[tc.type].color}40` }}>
                      {TYPE_CONFIG[tc.type].label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Intellectual Profile</div>
                <div className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  {topDomains.length > 0 && typeCounts.filter(t => t.count > 0).length > 0 ? (
                    <>
                      You think primarily in <span className="text-cyan-400 font-medium">{topDomains.map(d => DOMAIN_CONFIG[d.domain].label).join(', ')}</span>.
                      {' '}Your dominant thinking mode is <span className="text-amber-400 font-medium">{TYPE_CONFIG[typeCounts.filter(t => t.count > 0)[0].type].label.toLowerCase()}</span>—
                      {' '}you tend to {typeCounts.filter(t => t.count > 0)[0].type === 'insight' ? 'extract deep patterns from experience' :
                        typeCounts.filter(t => t.count > 0)[0].type === 'framework' ? 'build mental models that organize complexity' :
                        typeCounts.filter(t => t.count > 0)[0].type === 'prediction' ? 'anticipate where things are heading' :
                        typeCounts.filter(t => t.count > 0)[0].type === 'question' ? 'challenge assumptions others overlook' :
                        typeCounts.filter(t => t.count > 0)[0].type === 'contrarian-view' ? 'hold positions against the grain' :
                        'integrate ideas across domains'}.
                      {' '}With {ideas.length} ideas captured, average originality of <span className="text-green-400 font-medium">{(ideas.reduce((s, i) => s + i.originality, 0) / ideas.length).toFixed(1)}/10</span> signals {ideas.reduce((s, i) => s + i.originality, 0) / ideas.length >= 7 ? 'highly distinctive thinking' : 'solid intellectual output'}.
                    </>
                  ) : 'Add more ideas to generate your profile.'}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

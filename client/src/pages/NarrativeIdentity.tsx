import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, BookOpen, User, ChevronDown, ChevronUp, X, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LifeChapter = {
  id: string
  title: string
  ageRange: string
  theme: string
  protagonist: string
  conflict: string
  growth: string
  treasures: string[]
  wounds: string[]
  turningPoint: string
  color: string
}

type IdentityStatement = {
  id: string
  category: 'core' | 'emerging' | 'releasing' | 'aspiring'
  statement: string
  evidence: string
  lastUpdated: string
}

const STORAGE_KEY = 'lq-narrativeidentity'

const PRESET_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f97316']

const CATEGORY_CONFIG: Record<IdentityStatement['category'], { label: string; color: string; description: string }> = {
  core:      { label: 'Core',      color: '#f59e0b', description: 'Confirmed — who you are' },
  emerging:  { label: 'Emerging',  color: '#10b981', description: 'Developing — who you are becoming' },
  releasing: { label: 'Releasing', color: '#ef4444', description: 'Letting go — who you are shedding' },
  aspiring:  { label: 'Aspiring',  color: '#8b5cf6', description: 'Becoming — who you are choosing' },
}

const EMPTY_CHAPTER: Omit<LifeChapter, 'id'> = {
  title: '',
  ageRange: '',
  theme: '',
  protagonist: '',
  conflict: '',
  growth: '',
  treasures: [],
  wounds: [],
  turningPoint: '',
  color: '#f59e0b',
}

type StoredData = {
  chapters: LifeChapter[]
  statements: IdentityStatement[]
}

function parseAgeRange(range: string): [number, number] {
  const parts = range.split('-').map(s => parseInt(s.trim(), 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]]
  }
  const single = parseInt(range.trim(), 10)
  if (!isNaN(single)) return [single, single + 4]
  return [0, 0]
}

function chapterWidth(chapter: LifeChapter): number {
  const [start, end] = parseAgeRange(chapter.ageRange)
  const span = Math.max(end - start, 1)
  return Math.max(span * 12, 60)
}

function wellbeingScore(chapter: LifeChapter): number {
  const t = chapter.treasures.length
  const w = chapter.wounds.length
  if (t + w === 0) return 5
  return Math.round(((t / (t + w)) * 9) + 1)
}

type ChapterFormProps = {
  initial: Omit<LifeChapter, 'id'>
  onSave: (data: Omit<LifeChapter, 'id'>) => void
  onCancel: () => void
}

function ChapterForm({ initial, onSave, onCancel }: ChapterFormProps) {
  const [form, setForm] = useState<Omit<LifeChapter, 'id'>>(initial)
  const [treasureInput, setTreasureInput] = useState('')
  const [woundInput, setWoundInput] = useState('')

  function set<K extends keyof Omit<LifeChapter, 'id'>>(key: K, value: Omit<LifeChapter, 'id'>[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addTreasure() {
    if (treasureInput.trim()) {
      set('treasures', [...form.treasures, treasureInput.trim()])
      setTreasureInput('')
    }
  }

  function addWound() {
    if (woundInput.trim()) {
      set('wounds', [...form.wounds, woundInput.trim()])
      setWoundInput('')
    }
  }

  return (
    <div className="game-card p-6 space-y-4" style={{ background: 'rgba(20,15,5,0.95)', border: '1px solid #92400e' }}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-amber-400 mb-1">Chapter Title</label>
          <input className="game-input w-full" value={form.title} onChange={e => set('title', e.target.value)} placeholder="The Wandering Years" />
        </div>
        <div>
          <label className="block text-xs text-amber-400 mb-1">Age Range (e.g. 18-22)</label>
          <input className="game-input w-full" value={form.ageRange} onChange={e => set('ageRange', e.target.value)} placeholder="18-22" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-1">Defining Theme</label>
        <input className="game-input w-full" value={form.theme} onChange={e => set('theme', e.target.value)} placeholder="Searching for identity" />
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-1">Protagonist (who were you then?)</label>
        <input className="game-input w-full" value={form.protagonist} onChange={e => set('protagonist', e.target.value)} placeholder="A restless dreamer..." />
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-1">Main Conflict</label>
        <textarea className="game-input w-full" rows={2} value={form.conflict} onChange={e => set('conflict', e.target.value)} placeholder="Describe the central struggle..." />
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-1">How You Grew</label>
        <textarea className="game-input w-full" rows={2} value={form.growth} onChange={e => set('growth', e.target.value)} placeholder="What this chapter taught you..." />
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-1">Turning Point</label>
        <input className="game-input w-full" value={form.turningPoint} onChange={e => set('turningPoint', e.target.value)} placeholder="The pivotal moment..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-amber-400 mb-1">Treasures (gifts &amp; wisdom)</label>
          <div className="flex gap-2 mb-2">
            <input className="game-input flex-1" value={treasureInput} onChange={e => setTreasureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTreasure()} placeholder="Add treasure..." />
            <button onClick={addTreasure} className="px-3 py-2 rounded-lg text-amber-400 hover:text-amber-300" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div className="space-y-1">
            {form.treasures.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 rounded text-xs text-amber-200" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <span>{t}</span>
                <button onClick={() => set('treasures', form.treasures.filter((_, j) => j !== i))}><X style={{ width: 12, height: 12 }} /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-red-400 mb-1">Wounds (losses &amp; scars)</label>
          <div className="flex gap-2 mb-2">
            <input className="game-input flex-1" value={woundInput} onChange={e => setWoundInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWound()} placeholder="Add wound..." />
            <button onClick={addWound} className="px-3 py-2 rounded-lg text-red-400 hover:text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div className="space-y-1">
            {form.wounds.map((w, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 rounded text-xs text-red-200" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <span>{w}</span>
                <button onClick={() => set('wounds', form.wounds.filter((_, j) => j !== i))}><X style={{ width: 12, height: 12 }} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs text-amber-400 mb-2">Chapter Color</label>
        <div className="flex gap-3">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => set('color', c)}
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                background: c,
                transform: form.color === c ? 'scale(1.3)' : 'scale(1)',
                boxShadow: form.color === c ? `0 0 0 2px #fff4` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm"
          style={{ background: '#92400e', color: '#fef3c7' }}
        >
          <Check style={{ width: 14, height: 14 }} /> Save Chapter
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
      </div>
    </div>
  )
}

type ChapterCardProps = {
  chapter: LifeChapter
  onEdit: () => void
  onDelete: () => void
}

function ChapterCard({ chapter, onEdit, onDelete }: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="game-card" style={{ border: `1px solid ${chapter.color}44` }}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: chapter.color }} />
          <div>
            <div className="font-semibold text-amber-100">{chapter.title || 'Untitled Chapter'}</div>
            <div className="text-xs text-slate-400">Age {chapter.ageRange} · {chapter.theme}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); onEdit() }} className="p-1.5 rounded text-slate-400 hover:text-amber-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Edit2 style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1.5 rounded text-slate-400 hover:text-red-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
          {expanded ? <ChevronUp style={{ width: 16, height: 16, color: '#94a3b8' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#94a3b8' }} />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t" style={{ borderColor: `${chapter.color}33` }}>
          {chapter.protagonist && (
            <div className="pt-3">
              <span className="text-xs text-amber-500 uppercase tracking-wider">Protagonist</span>
              <p className="text-slate-300 mt-1">{chapter.protagonist}</p>
            </div>
          )}
          {chapter.conflict && (
            <div>
              <span className="text-xs text-red-400 uppercase tracking-wider">Conflict</span>
              <p className="text-slate-300 mt-1">{chapter.conflict}</p>
            </div>
          )}
          {chapter.growth && (
            <div>
              <span className="text-xs text-green-400 uppercase tracking-wider">Growth</span>
              <p className="text-slate-300 mt-1">{chapter.growth}</p>
            </div>
          )}
          {chapter.turningPoint && (
            <div>
              <span className="text-xs text-amber-400 uppercase tracking-wider">Turning Point</span>
              <p className="text-slate-300 mt-1">{chapter.turningPoint}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {chapter.treasures.length > 0 && (
              <div>
                <span className="text-xs text-amber-400 uppercase tracking-wider">Treasures</span>
                <ul className="mt-1 space-y-1">
                  {chapter.treasures.map((t, i) => (
                    <li key={i} className="text-xs text-amber-200 flex items-start gap-1">
                      <span style={{ color: chapter.color }}>◆</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {chapter.wounds.length > 0 && (
              <div>
                <span className="text-xs text-red-400 uppercase tracking-wider">Wounds</span>
                <ul className="mt-1 space-y-1">
                  {chapter.wounds.map((w, i) => (
                    <li key={i} className="text-xs text-red-200 flex items-start gap-1">
                      <span className="text-red-500">◆</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NarrativeIdentity() {
  const { toastSuccess } = useToast()
  const [chapters, setChapters] = useState<LifeChapter[]>([])
  const [statements, setStatements] = useState<IdentityStatement[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'identity' | 'summary'>('timeline')
  const [newStatement, setNewStatement] = useState<Omit<IdentityStatement, 'id' | 'lastUpdated'>>({
    category: 'core',
    statement: '',
    evidence: '',
  })
  const [showStatementForm, setShowStatementForm] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as StoredData
      setChapters(data.chapters ?? [])
      setStatements(data.statements ?? [])
    }
  }, [])

  function save(c: LifeChapter[], s: IdentityStatement[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chapters: c, statements: s }))
    setChapters(c)
    setStatements(s)
  }

  function addChapter(data: Omit<LifeChapter, 'id'>) {
    const chapter: LifeChapter = { ...data, id: crypto.randomUUID() }
    const sorted = [...chapters, chapter].sort((a, b) => parseAgeRange(a.ageRange)[0] - parseAgeRange(b.ageRange)[0])
    save(sorted, statements)
    setShowChapterForm(false)
    toastSuccess('Chapter added', data.title)
  }

  function updateChapter(id: string, data: Omit<LifeChapter, 'id'>) {
    const updated = chapters.map(c => c.id === id ? { ...data, id } : c)
    save(updated, statements)
    setEditingChapterId(null)
    toastSuccess('Chapter updated')
  }

  function deleteChapter(id: string) {
    save(chapters.filter(c => c.id !== id), statements)
    toastSuccess('Chapter removed')
  }

  function addStatement() {
    if (!newStatement.statement.trim()) return
    const s: IdentityStatement = {
      ...newStatement,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    save(chapters, [...statements, s])
    setNewStatement({ category: 'core', statement: '', evidence: '' })
    setShowStatementForm(false)
    toastSuccess('Identity statement added')
  }

  function deleteStatement(id: string) {
    save(chapters, statements.filter(s => s.id !== id))
  }

  const totalWidth = chapters.reduce((sum, c) => sum + chapterWidth(c) + 8, 0)

  const arcPoints = chapters.map((c, i) => {
    const x = chapters.slice(0, i).reduce((sum, ch) => sum + chapterWidth(ch) + 8, 0) + chapterWidth(c) / 2
    const score = wellbeingScore(c)
    return { x, y: score, chapter: c }
  })

  const svgW = Math.max(totalWidth, 400)
  const svgH = 80
  const padX = 20
  const padY = 10
  const chartW = svgW - padX * 2
  const chartH = svgH - padY * 2

  function toSvgY(score: number) {
    return padY + chartH - ((score - 1) / 9) * chartH
  }

  const pathD = arcPoints.length > 1
    ? arcPoints.map((p, i) => {
        const sx = padX + (p.x / svgW) * chartW
        const sy = toSvgY(p.y)
        return i === 0 ? `M ${sx} ${sy}` : `L ${sx} ${sy}`
      }).join(' ')
    : ''

  const coreCats = (['core', 'emerging', 'releasing', 'aspiring'] as IdentityStatement['category'][])

  function generateSummary(): string {
    if (chapters.length === 0) return 'Begin adding chapters to generate your narrative summary.'
    const themes = chapters.map(c => c.theme).filter(Boolean)
    const coreStatements = statements.filter(s => s.category === 'core').map(s => s.statement)
    let text = `Your story is one of ${themes.slice(0, 3).join(', ')}${themes.length > 3 ? ', and more' : ''}.`
    if (chapters.length > 0) {
      const first = chapters[0]
      const last = chapters[chapters.length - 1]
      text += ` You began as ${first.protagonist || 'a younger version of yourself'}`
      if (first.id !== last.id) text += `, and through the years you evolved — emerging from "${last.theme}" as someone transformed.`
      else text += '.'
    }
    if (coreStatements.length > 0) {
      text += ` At your core, ${coreStatements[0]}.`
    }
    const totalTreasures = chapters.reduce((n, c) => n + c.treasures.length, 0)
    const totalWounds = chapters.reduce((n, c) => n + c.wounds.length, 0)
    if (totalTreasures > 0) text += ` You have gathered ${totalTreasures} treasure${totalTreasures !== 1 ? 's' : ''} and carried ${totalWounds} wound${totalWounds !== 1 ? 's' : ''} — each a teacher.`
    return text
  }

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: 'linear-gradient(135deg, #0c0a04 0%, #1a1006 50%, #0c0a04 100%)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-300" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 20px #f59e0b55' }}>
            Narrative Identity
          </h1>
          <p className="text-amber-700 text-sm mt-1">Author your life story — shape the narrative that defines who you are</p>
        </div>
        <BookOpen style={{ width: 40, height: 40, color: '#92400e' }} />
      </div>

      <div className="flex gap-2">
        {(['timeline', 'identity', 'summary'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
            style={{
              background: activeTab === tab ? '#92400e' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fef3c7' : '#94a3b8',
            }}
          >
            {tab === 'timeline' ? 'Timeline' : tab === 'identity' ? 'Identity' : 'My Story'}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="game-card p-4" style={{ background: 'rgba(20,15,5,0.9)', border: '1px solid #92400e44' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-amber-200">Life Timeline</h2>
              <button
                onClick={() => setShowChapterForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#92400e', color: '#fef3c7' }}
              >
                <Plus style={{ width: 14, height: 14 }} /> Add Chapter
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No chapters yet. Add your first life chapter to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-3">
                <div style={{ minWidth: svgW + 40 }}>
                  <svg width={svgW} height={40} style={{ display: 'block' }}>
                    {chapters.map((c, i) => {
                      const x = chapters.slice(0, i).reduce((sum, ch) => sum + chapterWidth(ch) + 8, 0)
                      const w = chapterWidth(c)
                      return (
                        <g key={c.id}>
                          <rect
                            x={x} y={4} width={w} height={32} rx={6}
                            fill={c.color}
                            fillOpacity={selectedChapterId === c.id ? 0.9 : 0.55}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedChapterId(selectedChapterId === c.id ? null : c.id)}
                          />
                          {w >= 50 && (
                            <text x={x + w / 2} y={24} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="600" style={{ pointerEvents: 'none' }}>
                              {c.ageRange}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </svg>
                  <svg width={svgW} height={svgH} style={{ display: 'block', marginTop: 4 }}>
                    <defs>
                      <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    {[2, 4, 6, 8, 10].map(v => (
                      <line key={v} x1={padX} x2={svgW - padX} y1={toSvgY(v)} y2={toSvgY(v)} stroke="#ffffff08" strokeWidth={1} />
                    ))}
                    {pathD && <path d={pathD} fill="none" stroke="url(#arcGrad)" strokeWidth={2} strokeLinejoin="round" />}
                    {arcPoints.map((p, i) => {
                      const sx = padX + (p.x / svgW) * chartW
                      const sy = toSvgY(p.y)
                      return (
                        <circle key={i} cx={sx} cy={sy} r={4} fill={p.chapter.color} />
                      )
                    })}
                    <text x={padX} y={svgH - 2} fontSize={9} fill="#64748b">Wellbeing Arc</text>
                  </svg>
                </div>
              </div>
            )}

            {selectedChapterId && (() => {
              const c = chapters.find(ch => ch.id === selectedChapterId)
              if (!c) return null
              return (
                <div className="mt-4 p-4 rounded-xl space-y-2" style={{ background: `${c.color}11`, border: `1px solid ${c.color}44` }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-amber-100 text-lg">{c.title}</h3>
                    <button onClick={() => setSelectedChapterId(null)}><X style={{ width: 16, height: 16, color: '#94a3b8' }} /></button>
                  </div>
                  <p className="text-sm text-slate-400">Age {c.ageRange} · <em className="text-amber-300">{c.theme}</em></p>
                  {c.protagonist && <p className="text-sm text-slate-300"><span className="text-amber-500 font-medium">You were:</span> {c.protagonist}</p>}
                  {c.turningPoint && <p className="text-sm text-slate-300"><span className="text-amber-500 font-medium">Turning point:</span> {c.turningPoint}</p>}
                </div>
              )
            })()}
          </div>

          {showChapterForm && (
            <ChapterForm
              initial={EMPTY_CHAPTER}
              onSave={addChapter}
              onCancel={() => setShowChapterForm(false)}
            />
          )}

          <div className="space-y-3">
            {chapters.map(c =>
              editingChapterId === c.id ? (
                <ChapterForm
                  key={c.id}
                  initial={c}
                  onSave={data => updateChapter(c.id, data)}
                  onCancel={() => setEditingChapterId(null)}
                />
              ) : (
                <ChapterCard
                  key={c.id}
                  chapter={c}
                  onEdit={() => setEditingChapterId(c.id)}
                  onDelete={() => deleteChapter(c.id)}
                />
              )
            )}
          </div>
        </div>
      )}

      {activeTab === 'identity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-amber-200">Identity Statements</h2>
            <button
              onClick={() => setShowStatementForm(s => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#92400e', color: '#fef3c7' }}
            >
              <Plus style={{ width: 14, height: 14 }} /> Add Statement
            </button>
          </div>

          {showStatementForm && (
            <div className="game-card p-5 space-y-4" style={{ background: 'rgba(20,15,5,0.95)', border: '1px solid #92400e' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-amber-400 mb-1">Category</label>
                  <select
                    className="game-input w-full"
                    value={newStatement.category}
                    onChange={e => setNewStatement(s => ({ ...s, category: e.target.value as IdentityStatement['category'] }))}
                  >
                    {coreCats.map(c => (
                      <option key={c} value={c}>{CATEGORY_CONFIG[c].label} — {CATEGORY_CONFIG[c].description}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-amber-400 mb-1">Statement ("I am a person who...")</label>
                <input className="game-input w-full" value={newStatement.statement} onChange={e => setNewStatement(s => ({ ...s, statement: e.target.value }))} placeholder="...chooses courage over comfort" />
              </div>
              <div>
                <label className="block text-xs text-amber-400 mb-1">Evidence</label>
                <textarea className="game-input w-full" rows={2} value={newStatement.evidence} onChange={e => setNewStatement(s => ({ ...s, evidence: e.target.value }))} placeholder="Concrete evidence this is true..." />
              </div>
              <div className="flex gap-3">
                <button onClick={addStatement} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#92400e', color: '#fef3c7' }}>
                  <Check style={{ width: 14, height: 14 }} /> Add
                </button>
                <button onClick={() => setShowStatementForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
              </div>
            </div>
          )}

          {coreCats.map(cat => {
            const catStatements = statements.filter(s => s.category === cat)
            const cfg = CATEGORY_CONFIG[cat]
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  <h3 className="font-semibold text-sm" style={{ color: cfg.color }}>{cfg.label}</h3>
                  <span className="text-xs text-slate-500">{cfg.description}</span>
                </div>
                {catStatements.length === 0 ? (
                  <p className="text-xs text-slate-600 italic pl-5">No statements yet</p>
                ) : (
                  <div className="space-y-2 pl-5">
                    {catStatements.map(s => (
                      <div key={s.id} className="game-card p-3" style={{ border: `1px solid ${cfg.color}33` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-amber-100 font-medium">I am a person who {s.statement}</p>
                            {s.evidence && <p className="text-xs text-slate-400 mt-1 italic">{s.evidence}</p>}
                            <p className="text-xs text-slate-600 mt-1">Updated {s.lastUpdated}</p>
                          </div>
                          <button onClick={() => deleteStatement(s.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0">
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="game-card p-6" style={{ background: 'rgba(20,15,5,0.9)', border: '1px solid #92400e55' }}>
            <div className="flex items-center gap-2 mb-4">
              <User style={{ width: 20, height: 20, color: '#f59e0b' }} />
              <h2 className="text-lg font-semibold text-amber-200">Your Story So Far</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-base italic" style={{ fontFamily: 'Georgia, serif' }}>
              "{generateSummary()}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {coreCats.map(cat => {
              const count = statements.filter(s => s.category === cat).length
              const cfg = CATEGORY_CONFIG[cat]
              return (
                <div key={cat} className="game-card p-4 text-center" style={{ border: `1px solid ${cfg.color}33` }}>
                  <div className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</div>
                  <div className="text-xs text-slate-400 mt-1">{cfg.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="game-card p-4 text-center" style={{ border: '1px solid #f59e0b33' }}>
              <div className="text-2xl font-bold text-amber-400">{chapters.length}</div>
              <div className="text-xs text-slate-400 mt-1">Chapters</div>
            </div>
            <div className="game-card p-4 text-center" style={{ border: '1px solid #10b98133' }}>
              <div className="text-2xl font-bold text-green-400">{chapters.reduce((n, c) => n + c.treasures.length, 0)}</div>
              <div className="text-xs text-slate-400 mt-1">Treasures</div>
            </div>
            <div className="game-card p-4 text-center" style={{ border: '1px solid #ef444433' }}>
              <div className="text-2xl font-bold text-red-400">{chapters.reduce((n, c) => n + c.wounds.length, 0)}</div>
              <div className="text-xs text-slate-400 mt-1">Wounds</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

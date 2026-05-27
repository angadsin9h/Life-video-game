import { useState, useEffect } from 'react'
import { Heart, Users, Star, Plus, Trash2, Save, Edit3, TrendingUp, Calendar, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'relationship_health_log'

type RelationshipType = 'partner' | 'family' | 'friend' | 'mentor' | 'colleague' | 'other'

interface RelationshipScores {
  communication: number
  trust: number
  'quality_time': number
  support: number
  growth: number
}

interface Relationship {
  id: string
  name: string
  type: RelationshipType
  scores: RelationshipScores
  lastContact: string
  nextAction: string
  notes: string
  updatedAt: string
}

const TYPE_CONFIG: Record<RelationshipType, { label: string; emoji: string; color: string }> = {
  partner:   { label: 'Partner',   emoji: '💑', color: '#ec4899' },
  family:    { label: 'Family',    emoji: '👨‍👩‍👧', color: '#f59e0b' },
  friend:    { label: 'Friend',    emoji: '👯', color: '#3b82f6' },
  mentor:    { label: 'Mentor',    emoji: '🧑‍🏫', color: '#a855f7' },
  colleague: { label: 'Colleague', emoji: '🤝', color: '#06b6d4' },
  other:     { label: 'Other',     emoji: '💫', color: '#94a3b8' },
}

const DIMENSION_LABELS: (keyof RelationshipScores)[] = [
  'communication', 'trust', 'quality_time', 'support', 'growth',
]

const DIMENSION_DISPLAY: Record<keyof RelationshipScores, { label: string; emoji: string }> = {
  communication: { label: 'Communication', emoji: '💬' },
  trust:         { label: 'Trust',         emoji: '🤝' },
  'quality_time':{ label: 'Quality Time',  emoji: '⏰' },
  support:       { label: 'Support',       emoji: '🫂' },
  growth:        { label: 'Growth',        emoji: '🌱' },
}

function avgScore(scores: RelationshipScores): number {
  const vals = DIMENSION_LABELS.map(k => scores[k])
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
}

function healthColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

function healthLabel(score: number): string {
  if (score >= 8) return 'Thriving'
  if (score >= 6) return 'Stable'
  return 'Needs Care'
}

function daysAgo(dateStr: string): number {
  if (!dateStr) return 9999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d: string): string {
  if (!d) return 'Never'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Pentagon SVG ───────────────────────────────────────────────────────────────
function PentagonChart({ scores, size = 80, color }: { scores: RelationshipScores; size?: number; color: string }) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 8
  const n = 5

  function pointAt(index: number, radius: number): [number, number] {
    // start from top (-90°), going clockwise
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  // outer boundary
  const outerPts = Array.from({ length: n }, (_, i) => pointAt(i, maxR))
  const outerPath = outerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'

  // background rings
  const rings = [0.25, 0.5, 0.75, 1]

  // data polygon
  const dataPts = DIMENSION_LABELS.map((k, i) => pointAt(i, (scores[k] / 10) * maxR))
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Rings */}
      {rings.map(r => {
        const pts = Array.from({ length: n }, (_, i) => pointAt(i, maxR * r))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'
        return <path key={r} d={path} fill="none" stroke="#334155" strokeWidth={0.8} />
      })}
      {/* Axes */}
      {outerPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0].toFixed(2)} y2={p[1].toFixed(2)} stroke="#334155" strokeWidth={0.8} />
      ))}
      {/* Outer boundary */}
      <path d={outerPath} fill="none" stroke="#475569" strokeWidth={1} />
      {/* Data fill */}
      <path d={dataPath} fill={color + '40'} stroke={color} strokeWidth={1.5} />
      {/* Data points */}
      {dataPts.map((p, i) => (
        <circle key={i} cx={p[0].toFixed(2)} cy={p[1].toFixed(2)} r={2.5} fill={color} />
      ))}
    </svg>
  )
}

// ── Form State ────────────────────────────────────────────────────────────────
type FormState = {
  name: string
  type: RelationshipType
  scores: RelationshipScores
  lastContact: string
  nextAction: string
  notes: string
}

const DEFAULT_SCORES: RelationshipScores = {
  communication: 5,
  trust: 5,
  'quality_time': 5,
  support: 5,
  growth: 5,
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'friend',
  scores: { ...DEFAULT_SCORES },
  lastContact: today(),
  nextAction: '',
  notes: '',
}

function sliderEmoji(val: number): string {
  if (val >= 9) return '🌟'
  if (val >= 7) return '😊'
  if (val >= 5) return '😐'
  if (val >= 3) return '😟'
  return '😔'
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RelationshipHealth() {
  const { toastSuccess } = useToast()
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRelationships(JSON.parse(raw) as Relationship[])
    } catch { /**/ }
  }, [])

  const persist = (updated: Relationship[]) => {
    setRelationships(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, scores: { ...DEFAULT_SCORES } })
    setShowForm(true)
  }

  const openEdit = (rel: Relationship) => {
    setEditingId(rel.id)
    setForm({
      name: rel.name,
      type: rel.type,
      scores: { ...rel.scores },
      lastContact: rel.lastContact,
      nextAction: rel.nextAction,
      notes: rel.notes,
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingId) {
      persist(relationships.map(r =>
        r.id === editingId
          ? { ...r, ...form, name: form.name.trim(), updatedAt: new Date().toISOString() }
          : r
      ))
      toastSuccess(`${form.name} updated!`)
    } else {
      const rel: Relationship = {
        id: Date.now().toString(),
        name: form.name.trim(),
        type: form.type,
        scores: { ...form.scores },
        lastContact: form.lastContact,
        nextAction: form.nextAction.trim(),
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      }
      persist([rel, ...relationships])
      toastSuccess(`${rel.name} added to your relationship tracker!`)
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, scores: { ...DEFAULT_SCORES } })
  }

  const handleDelete = (id: string) => {
    persist(relationships.filter(r => r.id !== id))
    toastSuccess('Relationship removed.')
  }

  const setScore = (dim: keyof RelationshipScores, val: number) => {
    setForm(f => ({ ...f, scores: { ...f.scores, [dim]: val } }))
  }

  // Stats
  const total = relationships.length
  const avgHealth = total > 0
    ? parseFloat((relationships.reduce((s, r) => s + avgScore(r.scores), 0) / total).toFixed(1))
    : 0
  const needAttention = relationships.filter(r => avgScore(r.scores) < 7).length
  const pctNeedAttention = total > 0 ? Math.round((needAttention / total) * 100) : 0
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const contactedThisWeek = relationships.filter(r => r.lastContact >= weekAgo).length

  // Priority list (sorted by health ascending)
  const priorityList = [...relationships].sort((a, b) => avgScore(a.scores) - avgScore(b.scores))

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Relationship Health
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Score and track the health of your key relationships.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Relationships</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: healthColor(avgHealth) }}>{avgHealth || '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Health</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{pctNeedAttention}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Need Attention</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{contactedThisWeek}</div>
          <div className="text-xs text-slate-500 mt-0.5">Contacted This Week</div>
        </div>
      </div>

      {/* Overall health bar */}
      {total > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Overall Relationship Health
            </span>
            <span className="text-sm font-bold" style={{ color: healthColor(avgHealth) }}>
              {avgHealth}/10 · {healthLabel(avgHealth)}
            </span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(avgHealth / 10) * 100}%`, background: healthColor(avgHealth) }}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="game-card p-5 border border-pink-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              {editingId ? 'Edit Relationship' : 'Add Relationship'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Person's name"
                className="game-input w-full"
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Relationship Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as RelationshipType }))}
                className="game-input w-full"
              >
                {(Object.entries(TYPE_CONFIG) as [RelationshipType, typeof TYPE_CONFIG.friend][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>

            {/* Last contact */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Last Contact</label>
              <input
                type="date"
                value={form.lastContact}
                onChange={e => setForm(f => ({ ...f, lastContact: e.target.value }))}
                className="game-input w-full"
              />
            </div>
          </div>

          {/* Dimension sliders */}
          <div>
            <label className="block text-xs text-slate-400 mb-3">Health Dimensions (1–10)</label>
            <div className="space-y-3">
              {DIMENSION_LABELS.map(dim => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{DIMENSION_DISPLAY[dim].emoji}</span>
                  <span className="text-xs text-slate-300 w-28 flex-shrink-0">{DIMENSION_DISPLAY[dim].label}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.scores[dim]}
                    onChange={e => setScore(dim, parseInt(e.target.value))}
                    className="flex-1 accent-pink-500"
                  />
                  <span className="text-sm w-6 text-center">{sliderEmoji(form.scores[dim])}</span>
                  <span className="text-sm font-bold text-white w-5 text-right">{form.scores[dim]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next action */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Next Action to Improve This Relationship</label>
            <input
              value={form.nextAction}
              onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
              placeholder="e.g. Schedule a coffee chat this week"
              className="game-input w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Context, shared experiences, anything important..."
              className="game-input w-full resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-pink-700 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Relationship Cards */}
      {relationships.length === 0 && !showForm ? (
        <div className="game-card py-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
          <p className="text-slate-500 text-sm">No relationships tracked yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4" /> Your Relationships
          </h2>
          {relationships.map(rel => {
            const typeConf = TYPE_CONFIG[rel.type]
            const score = avgScore(rel.scores)
            const color = healthColor(score)
            const days = daysAgo(rel.lastContact)
            const contactColor = days > 30 ? '#ef4444' : days > 14 ? '#f59e0b' : '#22c55e'

            return (
              <div key={rel.id} className="game-card p-4" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-start gap-4">
                  {/* Pentagon */}
                  <div className="flex-shrink-0">
                    <PentagonChart scores={rel.scores} size={80} color={color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base">{rel.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                        style={{
                          background: typeConf.color + '20',
                          borderColor: typeConf.color + '40',
                          color: typeConf.color,
                        }}
                      >
                        {typeConf.emoji} {typeConf.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: color + '20', color }}
                      >
                        {score}/10 {healthLabel(score)}
                      </span>
                    </div>

                    {/* Dimension mini-bars */}
                    <div className="mt-2 grid grid-cols-5 gap-1">
                      {DIMENSION_LABELS.map(dim => (
                        <div key={dim} className="text-center">
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-0.5">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(rel.scores[dim] / 10) * 100}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <div className="text-slate-600" style={{ fontSize: '9px' }}>{DIMENSION_DISPLAY[dim].label.slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs flex items-center gap-1" style={{ color: contactColor }}>
                        <Calendar className="w-3 h-3" />
                        {days === 0 ? 'Today' : days >= 9999 ? 'Never' : `${days}d ago`}
                        {days > 30 && <span className="text-red-400 ml-0.5">· Overdue</span>}
                      </span>
                      {rel.nextAction && (
                        <span className="text-xs flex items-center gap-1 text-slate-400 max-w-xs truncate">
                          <Target className="w-3 h-3 flex-shrink-0 text-pink-400" />
                          <span className="truncate">{rel.nextAction}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(rel)}
                      className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rel.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {rel.notes && (
                  <p className="text-xs text-slate-500 mt-2 pl-0 line-clamp-2">{rel.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Priority List */}
      {relationships.length > 1 && (
        <div className="game-card p-4 border border-orange-500/20 bg-orange-900/5">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Priority — Needs Most Investment
          </h3>
          <div className="space-y-2">
            {priorityList.slice(0, 5).map((rel, i) => {
              const score = avgScore(rel.scores)
              const color = healthColor(score)
              return (
                <div key={rel.id} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-4 text-right">{i + 1}.</span>
                  <span className="text-slate-300 text-sm flex-1">{rel.name}</span>
                  <span className="text-xs" style={{ color: TYPE_CONFIG[rel.type].color }}>
                    {TYPE_CONFIG[rel.type].emoji} {TYPE_CONFIG[rel.type].label}
                  </span>
                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(score / 10) * 100}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
                </div>
              )
            })}
          </div>
          {needAttention > 0 && (
            <p className="text-xs text-orange-300/70 mt-3">
              {needAttention} relationship{needAttention > 1 ? 's' : ''} ({pctNeedAttention}%) score below 7 and need attention.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

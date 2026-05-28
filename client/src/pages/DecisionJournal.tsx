import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, X, ChevronDown, ChevronUp, Star, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Decision {
  id: number
  title: string
  context: string | null
  options_considered: string | null
  chosen_option: string | null
  reasoning: string | null
  expected_outcome: string | null
  actual_outcome: string | null
  outcome_rating: number
  category: string
  date: string
  review_date: string | null
  reviewed: number
}

const CATEGORIES = ['general', 'career', 'health', 'relationships', 'finance', 'personal', 'creative']
const CAT_COLORS: Record<string, string> = {
  general: 'text-slate-400', career: 'text-violet-400', health: 'text-green-400',
  relationships: 'text-yellow-400', finance: 'text-blue-400', personal: 'text-pink-400', creative: 'text-orange-400',
}
const OUTCOME_LABELS = ['', '😞 Very Bad', '😕 Bad', '😐 Mixed', '🙂 Good', '😄 Great']

function DecisionCard({ d, onDelete, onUpdate }: {
  d: Decision
  onDelete: (id: number) => void
  onUpdate: (id: number, data: Partial<Decision>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [outcome, setOutcome] = useState(d.actual_outcome || '')
  const [rating, setRating] = useState(d.outcome_rating || 0)

  const isPendingReview = d.review_date && !d.reviewed && d.review_date <= new Date().toISOString().split('T')[0]

  const submitReview = async () => {
    await onUpdate(d.id, { actual_outcome: outcome, outcome_rating: rating, reviewed: 1 })
    setReviewMode(false)
  }

  return (
    <div className={`game-card p-4 ${isPendingReview ? 'border-yellow-500/30 bg-yellow-900/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold capitalize ${CAT_COLORS[d.category] || 'text-slate-400'}`}>
              {d.category}
            </span>
            <span className="text-xs text-slate-600">{d.date}</span>
            {isPendingReview && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Review due
              </span>
            )}
            {d.reviewed ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Reviewed
              </span>
            ) : null}
          </div>
          <div className="text-slate-200 font-semibold mt-1">{d.title}</div>
          {d.chosen_option && (
            <div className="text-xs text-slate-500 mt-0.5">Chose: <span className="text-slate-400">{d.chosen_option}</span></div>
          )}
          {d.outcome_rating > 0 && (
            <div className="text-xs mt-1">{OUTCOME_LABELS[d.outcome_rating]}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!d.reviewed && (
            <button onClick={() => setReviewMode(r => !r)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors">
              <Clock className="w-3 h-3" /> Review
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(d.id)}
            className="p-1 text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-sm border-t border-slate-800 pt-3">
          {d.context && (
            <div><span className="text-slate-500 text-xs uppercase tracking-wider">Context</span>
              <p className="text-slate-400 mt-0.5">{d.context}</p></div>
          )}
          {d.options_considered && (
            <div><span className="text-slate-500 text-xs uppercase tracking-wider">Options Considered</span>
              <p className="text-slate-400 mt-0.5">{d.options_considered}</p></div>
          )}
          {d.reasoning && (
            <div><span className="text-slate-500 text-xs uppercase tracking-wider">Reasoning</span>
              <p className="text-slate-400 mt-0.5">{d.reasoning}</p></div>
          )}
          {d.expected_outcome && (
            <div><span className="text-slate-500 text-xs uppercase tracking-wider">Expected Outcome</span>
              <p className="text-slate-400 mt-0.5">{d.expected_outcome}</p></div>
          )}
          {d.actual_outcome && (
            <div><span className="text-slate-500 text-xs uppercase tracking-wider">Actual Outcome</span>
              <p className="text-green-400 mt-0.5">{d.actual_outcome}</p></div>
          )}
          {d.review_date && (
            <div className="text-xs text-slate-600">Review date: {d.review_date}</div>
          )}
        </div>
      )}

      {reviewMode && !d.reviewed && (
        <div className="mt-3 space-y-3 border-t border-yellow-500/20 pt-3">
          <div className="text-sm font-semibold text-yellow-400">Record Outcome</div>
          <textarea rows={2} placeholder="What actually happened?" value={outcome}
            onChange={e => setOutcome(e.target.value)}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-slate-500 mt-1">Outcome rating:</span>
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} onClick={() => setRating(r)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                  rating === r ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                }`}>
                {OUTCOME_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={submitReview} disabled={!outcome.trim() || !rating}
              className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
              Save Review
            </button>
            <button onClick={() => setReviewMode(false)}
              className="px-3 py-2 bg-slate-700 text-slate-400 text-sm rounded-xl hover:bg-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  title: '', context: '', options_considered: '', chosen_option: '',
  reasoning: '', expected_outcome: '', category: 'general', date: '', review_date: '',
}

export default function DecisionJournal() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, date: today })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const load = useCallback(async () => {
    const res = await axios.get<Decision[]>('/api/decisions')
    setDecisions(res.data)
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/decisions', form)
      setForm({ ...EMPTY_FORM, date: today })
      setShowForm(false)
      await load()
      toastSuccess('Decision logged!')
    } finally { setSaving(false) }
  }

  const deleteDecision = async (id: number) => {
    await axios.delete(`/api/decisions/${id}`)
    setDecisions(prev => prev.filter(d => d.id !== id))
  }

  const updateDecision = async (id: number, data: Partial<Decision>) => {
    await axios.patch(`/api/decisions/${id}`, data)
    await load()
    toastSuccess('Outcome recorded!')
  }

  const filtered = filter === 'all' ? decisions
    : filter === 'pending' ? decisions.filter(d => !d.reviewed && d.review_date && d.review_date <= today)
    : filter === 'reviewed' ? decisions.filter(d => d.reviewed)
    : decisions.filter(d => d.category === filter)

  const pendingCount = decisions.filter(d => !d.reviewed && d.review_date && d.review_date <= today).length

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Decision Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {decisions.length} decisions logged
            {pendingCount > 0 && <span className="ml-2 text-yellow-400">· {pendingCount} pending review</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm ? 'bg-slate-700 text-slate-300' : 'bg-yellow-600 hover:bg-yellow-500 text-white'
          }`}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Log Decision'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <input autoFocus placeholder="What decision did you make?" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="game-input w-full font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm" />
          </div>
          <textarea rows={2} placeholder="Context / background…" value={form.context}
            onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <textarea rows={2} placeholder="Options you considered…" value={form.options_considered}
            onChange={e => setForm(f => ({ ...f, options_considered: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <input placeholder="What did you choose?" value={form.chosen_option}
            onChange={e => setForm(f => ({ ...f, chosen_option: e.target.value }))}
            className="game-input w-full text-sm" />
          <textarea rows={2} placeholder="Reasoning…" value={form.reasoning}
            onChange={e => setForm(f => ({ ...f, reasoning: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <textarea rows={2} placeholder="Expected outcome…" value={form.expected_outcome}
            onChange={e => setForm(f => ({ ...f, expected_outcome: e.target.value }))}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 flex-shrink-0">Review on:</span>
            <input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Log Decision'}
          </button>
        </div>
      )}

      {/* Filters */}
      {decisions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'All' }, { id: 'pending', label: `Review (${pendingCount})` }, { id: 'reviewed', label: 'Reviewed' }, ...CATEGORIES.map(c => ({ id: c, label: c }))].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f.id ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(d => (
            <DecisionCard key={d.id} d={d} onDelete={deleteDecision} onUpdate={updateDecision} />
          ))
        ) : (
          <div className="text-center py-16 text-slate-600">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No decisions logged yet</p>
            <p className="text-xs mt-1">Track decisions and review outcomes over time</p>
          </div>
        )}
      </div>
    </div>
  )
}

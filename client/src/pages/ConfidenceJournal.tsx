import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConfidenceArea = 'social' | 'public-speaking' | 'professional' | 'physical' | 'creative' | 'romantic' | 'intellectual' | 'leadership' | 'financial' | 'other'
type EntryType = 'win' | 'affirmation' | 'evidence' | 'fear-faced' | 'compliment' | 'milestone'

interface ConfidenceEntry {
  id: string
  area: ConfidenceArea
  entryType: EntryType
  title: string
  details: string
  confidenceLevel: number
  beforeConfidence: number
  emotion: string
  date: string
  isMajor: boolean
  createdAt: string
}

const AREA_CONFIG: Record<ConfidenceArea, { label: string; emoji: string; color: string }> = {
  social:          { label: 'Social',          emoji: '👥', color: '#22c55e' },
  'public-speaking': { label: 'Public Speaking', emoji: '🎤', color: '#ef4444' },
  professional:    { label: 'Professional',    emoji: '💼', color: '#3b82f6' },
  physical:        { label: 'Physical',        emoji: '💪', color: '#f97316' },
  creative:        { label: 'Creative',        emoji: '🎨', color: '#ec4899' },
  romantic:        { label: 'Romantic',        emoji: '❤️', color: '#f59e0b' },
  intellectual:    { label: 'Intellectual',    emoji: '🧠', color: '#a855f7' },
  leadership:      { label: 'Leadership',      emoji: '👑', color: '#6366f1' },
  financial:       { label: 'Financial',       emoji: '💰', color: '#84cc16' },
  other:           { label: 'Other',           emoji: '✨', color: '#94a3b8' },
}

const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; color: string }> = {
  win:          { label: 'Win',         color: '#22c55e' },
  affirmation:  { label: 'Affirmation', color: '#a855f7' },
  evidence:     { label: 'Evidence',    color: '#3b82f6' },
  'fear-faced': { label: 'Fear Faced',  color: '#ef4444' },
  compliment:   { label: 'Compliment',  color: '#ec4899' },
  milestone:    { label: 'Milestone',   color: '#f59e0b' },
}

const AFFIRMATIONS = [
  'I am capable of more than I believe',
  'I trust my instincts',
  'I grow stronger through challenges',
  'I deserve success and happiness',
  'My voice matters and deserves to be heard',
  'I am becoming more confident every day',
]

const STORAGE_KEY = 'confidence_journal'

export default function ConfidenceJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ConfidenceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ConfidenceEntry, 'id' | 'createdAt'>>({
    area: 'social', entryType: 'win', title: '', details: '',
    confidenceLevel: 7, beforeConfidence: 5, emotion: '',
    date: new Date().toISOString().split('T')[0], isMajor: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ConfidenceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: ConfidenceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', details: '', emotion: '' }))
    setShowForm(false)
    toastSuccess('Confidence entry logged ⭐')
  }

  const fearFaced = entries.filter(e => e.entryType === 'fear-faced').length
  const avgConfidence = entries.length ? Math.round(entries.reduce((s, e) => s + e.confidenceLevel, 0) / entries.length) : 0
  const major = entries.filter(e => e.isMajor).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Confidence Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your confidence by documenting every win and fear faced.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{fearFaced}</div>
          <div className="text-xs text-slate-500">Fears Faced</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgConfidence}/10</div>
          <div className="text-xs text-slate-500">Avg Confidence</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Confidence Entry</h3>
          <p className="text-xs text-slate-500">Daily affirmation:</p>
          <div className="flex flex-wrap gap-1.5">
            {AFFIRMATIONS.map(a => (
              <button key={a} onClick={() => setForm(f => ({ ...f, title: a, entryType: 'affirmation' }))}
                className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-lg text-xs text-left">{a}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ConfidenceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ConfidenceArea, typeof AREA_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value as EntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(ENTRY_TYPE_CONFIG) as [EntryType, typeof ENTRY_TYPE_CONFIG.win][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
            placeholder="Details — what happened, how did you show up?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Emotion you felt" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Confidence level: {form.confidenceLevel}/10</p>
              <input type="range" min={1} max={10} value={form.confidenceLevel}
                onChange={e => setForm(f => ({ ...f, confidenceLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isMajor} onChange={e => setForm(f => ({ ...f, isMajor: e.target.checked }))} />
              Major
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = ENTRY_TYPE_CONFIG[e.entryType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.title}</span>
                  {e.isMajor && <span className="text-xs text-yellow-400">★ Major</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                </div>
                {e.details && <p className="text-xs text-slate-400 mt-0.5">{e.details}</p>}
                <p className="text-xs text-slate-600">{a.label} · confidence {e.confidenceLevel}/10 · {e.date}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Confidence is built through small wins, logged and remembered. Start now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

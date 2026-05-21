import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ThinkingType = 'systems' | 'first-principles' | 'inversion' | 'second-order' | 'probabilistic' | 'mental-model' | 'lateral' | 'critical' | 'creative' | 'intuitive'
type ThinkingQuality = 'confused' | 'developing' | 'competent' | 'sharp' | 'masterful'

interface ThinkingEntry {
  id: string
  thinkingType: ThinkingType
  quality: ThinkingQuality
  problem: string
  howYouThoughtAboutIt: string
  keyInsight: string
  whatYouMissed: string
  betterFramework: string
  practiceAction: string
  clarityScore: number
  date: string
  createdAt: string
}

const THINKING_CONFIG: Record<ThinkingType, { label: string; emoji: string; color: string; description: string }> = {
  systems:          { label: 'Systems Thinking',   emoji: '🌐', color: '#3b82f6', description: 'See the whole, not just parts' },
  'first-principles':{ label: 'First Principles',  emoji: '⚗️', color: '#f59e0b', description: 'Break down to fundamentals' },
  inversion:        { label: 'Inversion',          emoji: '🔄', color: '#ef4444', description: 'Think backwards to avoid failure' },
  'second-order':   { label: '2nd Order Effects',  emoji: '♟️', color: '#6366f1', description: 'What happens after what happens' },
  probabilistic:    { label: 'Probabilistic',      emoji: '🎲', color: '#f97316', description: 'Think in probabilities not certainties' },
  'mental-model':   { label: 'Mental Models',      emoji: '🗺️', color: '#22c55e', description: 'Apply existing frameworks' },
  lateral:          { label: 'Lateral Thinking',   emoji: '↔️', color: '#a855f7', description: 'Creative sideways approaches' },
  critical:         { label: 'Critical Thinking',  emoji: '🔍', color: '#ec4899', description: 'Evaluate logic and evidence' },
  creative:         { label: 'Creative Thinking',  emoji: '🎨', color: '#eab308', description: 'Generate novel ideas' },
  intuitive:        { label: 'Intuitive',          emoji: '💫', color: '#10b981', description: 'Trust and develop gut wisdom' },
}

const QUALITY_CONFIG: Record<ThinkingQuality, { label: string; color: string }> = {
  confused:   { label: 'Confused',   color: '#94a3b8' },
  developing: { label: 'Developing', color: '#6366f1' },
  competent:  { label: 'Competent',  color: '#3b82f6' },
  sharp:      { label: 'Sharp',      color: '#22c55e' },
  masterful:  { label: 'Masterful',  color: '#f59e0b' },
}

const STORAGE_KEY = 'thinking_styles_log'

export default function ThinkingStyles() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ThinkingEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ThinkingEntry, 'id' | 'createdAt'>>({
    thinkingType: 'first-principles', quality: 'competent', problem: '',
    howYouThoughtAboutIt: '', keyInsight: '', whatYouMissed: '',
    betterFramework: '', practiceAction: '', clarityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ThinkingEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.problem.trim()) return
    const e: ThinkingEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, problem: '', howYouThoughtAboutIt: '', keyInsight: '', whatYouMissed: '', betterFramework: '', practiceAction: '' }))
    setShowForm(false)
    toastSuccess('Thinking session logged — upgrade your mental software 🧠')
  }

  const masterful = entries.filter(e => e.quality === 'masterful' || e.quality === 'sharp').length
  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-blue-400" />
            Thinking Styles
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Practice and develop your diverse thinking frameworks.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{masterful}</div>
          <div className="text-xs text-slate-500">Sharp+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Thinking Session</h3>
          <div className="flex gap-2">
            <select value={form.thinkingType} onChange={e => setForm(f => ({ ...f, thinkingType: e.target.value as ThinkingType }))} className="game-input text-sm flex-1">
              {(Object.entries(THINKING_CONFIG) as [ThinkingType, typeof THINKING_CONFIG['first-principles']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as ThinkingQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [ThinkingQuality, typeof QUALITY_CONFIG.competent][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          {form.thinkingType && <p className="text-xs text-slate-500 italic">{THINKING_CONFIG[form.thinkingType].description}</p>}
          <input value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))}
            placeholder="Problem or question you applied this to *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.howYouThoughtAboutIt} onChange={e => setForm(f => ({ ...f, howYouThoughtAboutIt: e.target.value }))}
            placeholder="How did you apply this thinking style?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.keyInsight} onChange={e => setForm(f => ({ ...f, keyInsight: e.target.value }))}
            placeholder="Key insight from this approach" className="game-input w-full text-sm" />
          <input value={form.whatYouMissed} onChange={e => setForm(f => ({ ...f, whatYouMissed: e.target.value }))}
            placeholder="What did you initially miss?" className="game-input w-full text-sm" />
          <input value={form.betterFramework} onChange={e => setForm(f => ({ ...f, betterFramework: e.target.value }))}
            placeholder="A better framework you could have used?" className="game-input w-full text-sm" />
          <input value={form.practiceAction} onChange={e => setForm(f => ({ ...f, practiceAction: e.target.value }))}
            placeholder="How will you practice this more?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Clarity achieved: {form.clarityScore}/10</p>
            <input type="range" min={1} max={10} value={form.clarityScore}
              onChange={e => setForm(f => ({ ...f, clarityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = THINKING_CONFIG[e.thinkingType]
          const q = QUALITY_CONFIG[e.quality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-blue-400">🧠 {e.clarityScore}/10</span>
                </div>
                {e.problem && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.problem}</p>}
                {e.keyInsight && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.keyInsight}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The quality of your thinking determines the quality of your life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

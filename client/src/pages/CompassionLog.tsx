import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CompassionTarget = 'self' | 'partner' | 'family' | 'friend' | 'colleague' | 'stranger' | 'enemy' | 'all-beings'
type CompassionType = 'understanding' | 'forgiveness' | 'kindness' | 'patience' | 'empathy' | 'service' | 'acceptance'

interface CompassionLogEntry {
  id: string
  target: CompassionTarget
  compassionType: CompassionType
  situation: string
  whatTheyNeeded: string
  howYouShowed: string
  whatBlockedYou: string
  howItFeltToGive: string
  rippleEffect: string
  opennessScore: number
  date: string
  createdAt: string
}

const TARGET_CONFIG: Record<CompassionTarget, { label: string; emoji: string; color: string }> = {
  self:       { label: 'Self',         emoji: '🪞', color: '#6366f1' },
  partner:    { label: 'Partner',      emoji: '💑', color: '#ec4899' },
  family:     { label: 'Family',       emoji: '👨‍👩‍👧', color: '#f59e0b' },
  friend:     { label: 'Friend',       emoji: '🤝', color: '#22c55e' },
  colleague:  { label: 'Colleague',    emoji: '👔', color: '#3b82f6' },
  stranger:   { label: 'Stranger',     emoji: '👤', color: '#94a3b8' },
  enemy:      { label: 'Adversary',    emoji: '⚡', color: '#ef4444' },
  'all-beings': { label: 'All Beings', emoji: '🌍', color: '#a855f7' },
}

const TYPE_CONFIG: Record<CompassionType, { label: string; color: string }> = {
  understanding: { label: 'Understanding', color: '#3b82f6' },
  forgiveness:   { label: 'Forgiveness',   color: '#6366f1' },
  kindness:      { label: 'Kindness',      color: '#ec4899' },
  patience:      { label: 'Patience',      color: '#f59e0b' },
  empathy:       { label: 'Empathy',       color: '#22c55e' },
  service:       { label: 'Service',       color: '#f97316' },
  acceptance:    { label: 'Acceptance',    color: '#a855f7' },
}

const STORAGE_KEY = 'compassion_log'

export default function CompassionLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CompassionLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CompassionLogEntry, 'id' | 'createdAt'>>({
    target: 'self', compassionType: 'kindness', situation: '',
    whatTheyNeeded: '', howYouShowed: '', whatBlockedYou: '',
    howItFeltToGive: '', rippleEffect: '', opennessScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CompassionLogEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: CompassionLogEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', whatTheyNeeded: '', howYouShowed: '', whatBlockedYou: '', howItFeltToGive: '', rippleEffect: '' }))
    setShowForm(false)
    toastSuccess('Compassion logged — a heart open to suffering has room to heal everything ❤️')
  }

  const selfCompassion = entries.filter(e => e.target === 'self').length
  const avgOpenness = entries.length ? Math.round(entries.reduce((s, e) => s + e.opennessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Compassion Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate compassion for self, others, and all of life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Acts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{selfCompassion}</div>
          <div className="text-xs text-slate-500">Self-Compassion</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgOpenness}/10</div>
          <div className="text-xs text-slate-500">Avg Openness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Compassion Act</h3>
          <div className="flex gap-2">
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as CompassionTarget }))} className="game-input text-sm flex-1">
              {(Object.entries(TARGET_CONFIG) as [CompassionTarget, typeof TARGET_CONFIG.self][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.compassionType} onChange={e => setForm(f => ({ ...f, compassionType: e.target.value as CompassionType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CompassionType, typeof TYPE_CONFIG.kindness][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="Describe the situation *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whatTheyNeeded} onChange={e => setForm(f => ({ ...f, whatTheyNeeded: e.target.value }))}
            placeholder="What did they (or you) truly need?" className="game-input w-full text-sm" />
          <input value={form.howYouShowed} onChange={e => setForm(f => ({ ...f, howYouShowed: e.target.value }))}
            placeholder="How did you show compassion?" className="game-input w-full text-sm" />
          <input value={form.whatBlockedYou} onChange={e => setForm(f => ({ ...f, whatBlockedYou: e.target.value }))}
            placeholder="What blocked full compassion?" className="game-input w-full text-sm" />
          <input value={form.howItFeltToGive} onChange={e => setForm(f => ({ ...f, howItFeltToGive: e.target.value }))}
            placeholder="How did giving compassion feel?" className="game-input w-full text-sm" />
          <input value={form.rippleEffect} onChange={e => setForm(f => ({ ...f, rippleEffect: e.target.value }))}
            placeholder="What was the ripple effect?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Heart openness: {form.opennessScore}/10</p>
            <input type="range" min={1} max={10} value={form.opennessScore}
              onChange={e => setForm(f => ({ ...f, opennessScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TARGET_CONFIG[e.target]
          const ct = TYPE_CONFIG[e.compassionType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ct.color + '20', color: ct.color }}>{ct.label}</span>
                  <span className="text-xs text-pink-400">❤️ {e.opennessScore}/10</span>
                </div>
                {e.howYouShowed && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.howYouShowed}</p>}
                {e.rippleEffect && <p className="text-xs text-teal-300/70 mt-0.5">↪ {e.rippleEffect}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Compassion is not weakness. It is the greatest form of strength.</p>
          </div>
        )}
      </div>
    </div>
  )
}

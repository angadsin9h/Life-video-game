import { useState, useEffect } from 'react'
import { BarChart3, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AuditArea = 'health' | 'finance' | 'career' | 'relationships' | 'mindset' | 'environment' | 'skills' | 'spirituality' | 'purpose' | 'other'

interface AuditEntry {
  id: string
  area: AuditArea
  currentState: string
  desiredState: string
  gap: string
  score: number
  actions: string[]
  deadline: string
  priority: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<AuditArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',       emoji: '💪', color: '#ef4444' },
  finance:       { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  career:        { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  mindset:       { label: 'Mindset',      emoji: '🧠', color: '#a855f7' },
  environment:   { label: 'Environment',  emoji: '🏠', color: '#22c55e' },
  skills:        { label: 'Skills',       emoji: '⚡', color: '#6366f1' },
  spirituality:  { label: 'Spirituality', emoji: '✨', color: '#84cc16' },
  purpose:       { label: 'Purpose',      emoji: '🎯', color: '#f97316' },
  other:         { label: 'Other',        emoji: '🔍', color: '#94a3b8' },
}

const STORAGE_KEY = 'personal_audit_v2'

export default function PersonalAudit() {
  const { toastSuccess } = useToast()
  const [audits, setAudits] = useState<AuditEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAction, setNewAction] = useState('')
  const [form, setForm] = useState<Omit<AuditEntry, 'id' | 'createdAt'>>({
    area: 'health', currentState: '', desiredState: '', gap: '', score: 5,
    actions: [], deadline: '', priority: 5, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setAudits(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AuditEntry[]) => { setAudits(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.currentState.trim()) return
    const a: AuditEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([a, ...audits])
    setForm(f => ({ ...f, currentState: '', desiredState: '', gap: '', actions: [] }))
    setNewAction('')
    setShowForm(false)
    toastSuccess('Audit entry saved 🔍')
  }

  const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0
  const urgent = audits.filter(a => a.priority >= 8).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Personal Audit
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Audit every area of life: current state, desired state, the gap.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Audit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{audits.length}</div>
          <div className="text-xs text-slate-500">Areas Audited</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{urgent}</div>
          <div className="text-xs text-slate-500">High Priority</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Audit Life Area</h3>
          <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as AuditArea }))} className="game-input w-full text-sm">
            {(Object.entries(AREA_CONFIG) as [AuditArea, typeof AREA_CONFIG.health][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <textarea value={form.currentState} onChange={e => setForm(f => ({ ...f, currentState: e.target.value }))}
            placeholder="Current state — be brutally honest *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <textarea value={form.desiredState} onChange={e => setForm(f => ({ ...f, desiredState: e.target.value }))}
            placeholder="Desired state — what would ideal look like?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.gap} onChange={e => setForm(f => ({ ...f, gap: e.target.value }))}
            placeholder="The gap — what's standing in the way?" className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newAction} onChange={e => setNewAction(e.target.value)}
              placeholder="Action to close the gap..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newAction.trim()) { setForm(f => ({ ...f, actions: [...f.actions, newAction.trim()] })); setNewAction('') } }} />
            <button onClick={() => { if (newAction.trim()) { setForm(f => ({ ...f, actions: [...f.actions, newAction.trim()] })); setNewAction('') } }}
              className="px-3 py-1.5 bg-blue-700/30 text-blue-400 rounded-xl text-xs">+</button>
          </div>
          {form.actions.length > 0 && (
            <div className="space-y-0.5">
              {form.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-blue-300">
                  <span>→</span><span className="flex-1">{a}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, actions: fo.actions.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current score: {form.score}/10</p>
              <input type="range" min={1} max={10} value={form.score}
                onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Priority: {form.priority}/10</p>
              <input type="range" min={1} max={10} value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
          </div>
          <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {audits.sort((a, b) => b.priority - a.priority).map(a => {
          const c = AREA_CONFIG[a.area]
          return (
            <div key={a.id} className="game-card p-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{c.label}</span>
                    <span className="text-xs text-blue-400">Score {a.score}/10</span>
                    {a.priority >= 8 && <span className="text-xs text-red-400">🔴 High Priority</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.currentState}</p>
                  {a.desiredState && <p className="text-xs text-green-300 mt-0.5">→ {a.desiredState}</p>}
                  {a.actions.length > 0 && <p className="text-xs text-slate-600 mt-0.5">{a.actions.length} action(s)</p>}
                </div>
                <button onClick={() => save(audits.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {audits.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Audit every dimension of your life. Truth is the starting point.</p>
          </div>
        )}
      </div>
    </div>
  )
}

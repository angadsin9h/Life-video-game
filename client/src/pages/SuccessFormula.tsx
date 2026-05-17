import { useState, useEffect } from 'react'
import { Trophy, Edit2, Save, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FormulaSection {
  id: string
  title: string
  content: string
  examples: string[]
}

interface SuccessFormulaData {
  northStar: string
  dailyNonNegotiables: string[]
  morningRoutine: FormulaSection
  eveningRoutine: FormulaSection
  weeklyRhythm: FormulaSection
  deepWorkRules: string[]
  energyManagement: FormulaSection
  mindsetPrinciples: string[]
  peakPerformanceTriggers: string[]
  recoveryProtocol: string
  updatedAt: string
}

const DEFAULT: SuccessFormulaData = {
  northStar: '',
  dailyNonNegotiables: ['', '', '', '', ''],
  morningRoutine: { id: 'morning', title: 'Morning Routine', content: '', examples: [] },
  eveningRoutine: { id: 'evening', title: 'Evening Routine', content: '', examples: [] },
  weeklyRhythm: { id: 'weekly', title: 'Weekly Rhythm', content: '', examples: [] },
  deepWorkRules: ['', '', '', ''],
  energyManagement: { id: 'energy', title: 'Energy Management', content: '', examples: [] },
  mindsetPrinciples: ['', '', '', '', ''],
  peakPerformanceTriggers: ['', '', '', ''],
  recoveryProtocol: '',
  updatedAt: '',
}

const STORAGE_KEY = 'success_formula'

const NON_NEG_EXAMPLES = [
  '7h+ sleep', '30 min exercise', '1h deep work', 'No social media before noon',
  'Meditation', 'Journaling', 'Healthy breakfast', 'Cold shower',
]

export default function SuccessFormula() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<SuccessFormulaData>(DEFAULT)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<SuccessFormulaData>(DEFAULT)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SuccessFormulaData
        setData(parsed)
        setDraft(parsed)
      }
    } catch { /**/ }
  }, [])

  const startEdit = () => { setDraft({ ...data }); setEditMode(true) }
  const save = () => {
    const updated = { ...draft, updatedAt: new Date().toISOString() }
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setEditMode(false)
    toastSuccess('Success formula saved!')
  }

  const d = editMode ? draft : data
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const updateList = (key: keyof SuccessFormulaData, i: number, val: string) => {
    const arr = [...(draft[key] as string[])]
    arr[i] = val
    setDraft(prev => ({ ...prev, [key]: arr }))
  }

  const updateSection = (key: keyof SuccessFormulaData, field: keyof FormulaSection, val: string) => {
    setDraft(prev => ({ ...prev, [key]: { ...(prev[key] as FormulaSection), [field]: val } }))
  }

  const hasContent = (data: SuccessFormulaData) => data.northStar.trim() || data.dailyNonNegotiables.some(n => n.trim())

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Success Formula
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your personal operating system for peak performance</p>
        </div>
        {!editMode ? (
          <button onClick={startEdit} className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setEditMode(false)} className="p-2 bg-slate-700 text-slate-400 rounded-xl"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* North Star */}
      <div className="game-card p-5 border border-yellow-500/30">
        <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">⭐ North Star</h3>
        <p className="text-xs text-slate-500 mb-3">Your ultimate goal / life purpose in one sentence</p>
        {editMode ? (
          <textarea value={draft.northStar} onChange={e => setDraft(d => ({ ...d, northStar: e.target.value }))}
            placeholder="The single most important goal/purpose that guides all decisions..."
            className="game-input w-full h-16 resize-none" />
        ) : d.northStar ? (
          <div className="text-white font-medium text-center py-2">"{d.northStar}"</div>
        ) : (
          <div className="text-slate-600 text-sm text-center py-2">Not set — click Edit to define your north star</div>
        )}
      </div>

      {/* Daily Non-Negotiables */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-300">Daily Non-Negotiables</h3>
          <button onClick={() => toggle('nonneg')} className="text-slate-500">
            {collapsed['nonneg'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">Things you do every day without exception, no matter what</p>
        {!collapsed['nonneg'] && (
          <div className="space-y-2">
            {d.dailyNonNegotiables.map((nn, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-green-400 font-bold text-sm w-4">{i + 1}.</span>
                {editMode ? (
                  <input value={(draft.dailyNonNegotiables)[i] || ''} onChange={e => updateList('dailyNonNegotiables', i, e.target.value)}
                    placeholder={`Non-negotiable ${i + 1} (e.g. ${NON_NEG_EXAMPLES[i]})`} className="game-input flex-1" />
                ) : nn ? (
                  <span className="text-slate-300 text-sm">{nn}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      {[
        { key: 'morningRoutine' as const, emoji: '☀️', color: 'text-yellow-400', placeholder: 'Describe your ideal morning routine step by step...' },
        { key: 'eveningRoutine' as const, emoji: '🌙', color: 'text-indigo-400', placeholder: 'Describe your evening wind-down routine...' },
        { key: 'weeklyRhythm' as const, emoji: '📅', color: 'text-blue-400', placeholder: 'How you structure each week: review day, deep work days, recovery...' },
        { key: 'energyManagement' as const, emoji: '⚡', color: 'text-green-400', placeholder: 'How you manage and protect your energy throughout the day...' },
      ].map(({ key, emoji, color, placeholder }) => {
        const section = d[key] as FormulaSection
        const draftSection = draft[key] as FormulaSection
        return (
          <div key={key} className="game-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${color}`}>{emoji} {section.title}</h3>
              <button onClick={() => toggle(key)} className="text-slate-500">
                {collapsed[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {!collapsed[key] && (
              editMode ? (
                <textarea value={draftSection.content} onChange={e => updateSection(key, 'content', e.target.value)}
                  placeholder={placeholder} className="game-input w-full h-24 resize-none" />
              ) : section.content ? (
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
              ) : (
                <div className="text-slate-600 text-sm">Not defined yet</div>
              )
            )}
          </div>
        )
      })}

      {/* Deep Work Rules */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-3">🎯 Deep Work Rules</h3>
        <div className="space-y-2">
          {d.deepWorkRules.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {editMode ? (
                <input value={(draft.deepWorkRules)[i] || ''} onChange={e => updateList('deepWorkRules', i, e.target.value)}
                  placeholder={`Rule ${i + 1} (e.g. Phone in another room during sessions)`} className="game-input flex-1" />
              ) : r ? (
                <>
                  <span className="text-blue-400 text-xs">→</span>
                  <span className="text-slate-300 text-sm">{r}</span>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Mindset Principles */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-3">💭 Mindset Principles</h3>
        <div className="space-y-2">
          {d.mindsetPrinciples.map((p, i) => (
            <div key={i}>
              {editMode ? (
                <input value={(draft.mindsetPrinciples)[i] || ''} onChange={e => updateList('mindsetPrinciples', i, e.target.value)}
                  placeholder={`Principle ${i + 1} (e.g. I control effort, not outcomes)`} className="game-input w-full" />
              ) : p ? (
                <div className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold text-sm">•</span>
                  <span className="text-slate-300 text-sm">{p}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Protocol */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-2">🔄 Recovery Protocol</h3>
        <p className="text-xs text-slate-500 mb-2">What you do when you fall off track, feel burnt out, or miss a day</p>
        {editMode ? (
          <textarea value={draft.recoveryProtocol} onChange={e => setDraft(d => ({ ...d, recoveryProtocol: e.target.value }))}
            placeholder="My bounce-back protocol: when I fall off, I will..." className="game-input w-full h-20 resize-none" />
        ) : d.recoveryProtocol ? (
          <p className="text-slate-300 text-sm leading-relaxed">{d.recoveryProtocol}</p>
        ) : (
          <div className="text-slate-600 text-sm">Not defined yet</div>
        )}
      </div>

      {!hasContent(data) && !editMode && (
        <div className="text-center py-10 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">Your success formula is your personal operating system.</p>
          <button onClick={startEdit} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Build Your Formula
          </button>
        </div>
      )}
    </div>
  )
}

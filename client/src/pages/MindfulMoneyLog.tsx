import React, { useState, useEffect } from 'react'
import { DollarSign, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MoneyMoment = {
  id: string
  date: string
  type: 'spend' | 'earn' | 'save' | 'invest' | 'give'
  amount: number
  description: string
  needOrWant: 'need' | 'want' | 'investment' | 'gift'
  valueAligned: boolean
  emotionTriggered: 'fear' | 'joy' | 'guilt' | 'pride' | 'anxiety' | 'gratitude' | 'excitement' | 'neutral'
  impulse: boolean
  regret: boolean
  lesson: string
}

type MoneyValue = {
  id: string
  value: string
  description: string
}

const DEFAULT_VALUES: MoneyValue[] = [
  { id: 'dv1', value: 'Experiences over things', description: 'Spend on memories, not possessions' },
  { id: 'dv2', value: 'Long-term security', description: 'Future-self comes first' },
  { id: 'dv3', value: 'Generosity', description: 'Give freely and often' },
]

const EMOTION_CONFIG: Record<MoneyMoment['emotionTriggered'], { label: string; icon: string; color: string }> = {
  fear:       { label: 'Fear',       icon: '😰', color: '#ef4444' },
  joy:        { label: 'Joy',        icon: '😄', color: '#f59e0b' },
  guilt:      { label: 'Guilt',      icon: '😔', color: '#8b5cf6' },
  pride:      { label: 'Pride',      icon: '😤', color: '#3b82f6' },
  anxiety:    { label: 'Anxiety',    icon: '😬', color: '#f97316' },
  gratitude:  { label: 'Gratitude',  icon: '🙏', color: '#10b981' },
  excitement: { label: 'Excitement', icon: '🤩', color: '#06b6d4' },
  neutral:    { label: 'Neutral',    icon: '😐', color: '#64748b' },
}

const TYPE_CONFIG: Record<MoneyMoment['type'], { label: string; color: string; sign: '+' | '-' }> = {
  spend:  { label: 'Spend',  color: '#ef4444', sign: '-' },
  earn:   { label: 'Earn',   color: '#22c55e', sign: '+' },
  save:   { label: 'Save',   color: '#3b82f6', sign: '+' },
  invest: { label: 'Invest', color: '#a855f7', sign: '+' },
  give:   { label: 'Give',   color: '#f59e0b', sign: '-' },
}

const STORAGE_KEY = 'lq-mindfulmoneylog'
const VALUES_KEY = 'lq-mindfulmoneylog-values'

const EMPTY_FORM: Omit<MoneyMoment, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  type: 'spend',
  amount: 0,
  description: '',
  needOrWant: 'want',
  valueAligned: false,
  emotionTriggered: 'neutral',
  impulse: false,
  regret: false,
  lesson: '',
}

function MindfulnessGauge({ score }: { score: number }) {
  const r = 54
  const cx = 80
  const cy = 80
  const circumference = Math.PI * r
  const progress = (score / 100) * circumference
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <svg width="160" height="100" viewBox="0 0 160 100">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#1e293b"
        strokeWidth={10}
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize={22} fontWeight="bold" fill={color} fontFamily="Orbitron, monospace">
        {score}
      </text>
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={9} fill="#94a3b8">
        Mindfulness Score
      </text>
    </svg>
  )
}

function EmotionRegretHeatmap({ moments }: { moments: MoneyMoment[] }) {
  const emotions = Object.keys(EMOTION_CONFIG) as MoneyMoment['emotionTriggered'][]
  const cellW = 30
  const cellH = 22

  return (
    <svg width="100%" viewBox={`0 0 ${cellW * 2 + 100} ${emotions.length * cellH + 30}`}>
      <text x={105} y={14} textAnchor="middle" fontSize={8} fill="#94a3b8">No Regret</text>
      <text x={135} y={14} textAnchor="middle" fontSize={8} fill="#94a3b8">Regret</text>
      {emotions.map((em, i) => {
        const cfg = EMOTION_CONFIG[em]
        const noRegret = moments.filter(m => m.emotionTriggered === em && !m.regret).length
        const withRegret = moments.filter(m => m.emotionTriggered === em && m.regret).length
        const maxVal = Math.max(...emotions.flatMap(e => [
          moments.filter(m => m.emotionTriggered === e && !m.regret).length,
          moments.filter(m => m.emotionTriggered === e && m.regret).length,
        ]), 1)
        const y = 20 + i * cellH
        return (
          <g key={em}>
            <text x={0} y={y + cellH / 2 + 3} fontSize={8} fill="#94a3b8">
              {cfg.icon} {cfg.label.slice(0, 7)}
            </text>
            <rect x={90} y={y + 2} width={cellW - 2} height={cellH - 4} rx={2}
              fill={noRegret > 0 ? '#10b981' : '#1e293b'}
              opacity={noRegret > 0 ? 0.3 + (noRegret / maxVal) * 0.7 : 1}
            />
            {noRegret > 0 && (
              <text x={90 + (cellW - 2) / 2} y={y + cellH / 2 + 3} textAnchor="middle" fontSize={8} fill="#e2e8f0">
                {noRegret}
              </text>
            )}
            <rect x={90 + cellW} y={y + 2} width={cellW - 2} height={cellH - 4} rx={2}
              fill={withRegret > 0 ? '#ef4444' : '#1e293b'}
              opacity={withRegret > 0 ? 0.3 + (withRegret / maxVal) * 0.7 : 1}
            />
            {withRegret > 0 && (
              <text x={90 + cellW + (cellW - 2) / 2} y={y + cellH / 2 + 3} textAnchor="middle" fontSize={8} fill="#e2e8f0">
                {withRegret}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function ValueAlignmentTrend({ moments }: { moments: MoneyMoment[] }) {
  if (moments.length < 2) return <p className="text-xs text-slate-500 text-center py-4">Need more transactions for trend</p>

  const sorted = [...moments].sort((a, b) => a.date.localeCompare(b.date))
  const weeks: Record<string, { total: number; aligned: number }> = {}

  sorted.forEach(m => {
    const d = new Date(m.date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { total: 0, aligned: 0 }
    weeks[key].total++
    if (m.valueAligned) weeks[key].aligned++
  })

  const weekData = Object.entries(weeks).map(([k, v]) => ({
    week: k,
    pct: Math.round((v.aligned / v.total) * 100),
  }))

  if (weekData.length < 2) return <p className="text-xs text-slate-500 text-center py-4">Need data across multiple weeks</p>

  const W = 300
  const H = 70
  const stepX = W / (weekData.length - 1)

  const points = weekData.map((w, i) => ({
    x: i * stepX,
    y: H - (w.pct / 100) * H,
  }))

  const areaPath =
    `M ${points[0].x} ${H} ` +
    points.map(p => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${H} Z`

  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendGrad)" />
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#10b981" />
          <text x={p.x} y={H + 14} textAnchor="middle" fontSize={7} fill="#64748b">
            W{i + 1}
          </text>
        </g>
      ))}
      <text x={0} y={8} fontSize={8} fill="#94a3b8">100%</text>
      <text x={0} y={H} fontSize={8} fill="#94a3b8">0%</text>
    </svg>
  )
}

export default function MindfulMoneyLog() {
  const { toastSuccess } = useToast()
  const [moments, setMoments] = useState<MoneyMoment[]>([])
  const [values, setValues] = useState<MoneyValue[]>(DEFAULT_VALUES)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MoneyMoment, 'id'>>(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState<'log' | 'values' | 'score' | 'patterns' | 'trend'>('log')
  const [editingValueId, setEditingValueId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<MoneyValue | null>(null)
  const [newValueForm, setNewValueForm] = useState({ value: '', description: '' })
  const [showNewValue, setShowNewValue] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setMoments(JSON.parse(stored))
      const storedV = localStorage.getItem(VALUES_KEY)
      if (storedV) setValues(JSON.parse(storedV))
    } catch {
      /**/
    }
  }, [])

  const persistMoments = (data: MoneyMoment[]) => {
    setMoments(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const persistValues = (data: MoneyValue[]) => {
    setValues(data)
    localStorage.setItem(VALUES_KEY, JSON.stringify(data))
  }

  const submit = () => {
    if (!form.description.trim() || form.amount <= 0) return
    const moment: MoneyMoment = { id: Date.now().toString(), ...form }
    persistMoments([moment, ...moments])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Money moment logged mindfully')
  }

  const removeMoment = (id: string) => persistMoments(moments.filter(m => m.id !== id))

  const saveValue = () => {
    if (!newValueForm.value.trim()) return
    const v: MoneyValue = { id: Date.now().toString(), ...newValueForm }
    persistValues([...values, v])
    setNewValueForm({ value: '', description: '' })
    setShowNewValue(false)
    toastSuccess('Value added')
  }

  const updateValue = () => {
    if (!editingValue) return
    persistValues(values.map(v => (v.id === editingValue.id ? editingValue : v)))
    setEditingValueId(null)
    setEditingValue(null)
  }

  const removeValue = (id: string) => persistValues(values.filter(v => v.id !== id))

  const mindfulnessScore = (() => {
    if (moments.length === 0) return 0
    let score = 0
    moments.forEach(m => {
      if (m.valueAligned) score += 34
      if (!m.impulse) score += 33
      if (!m.regret) score += 33
    })
    return Math.round(score / moments.length)
  })()

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'log', label: 'Log' },
    { key: 'values', label: 'Values' },
    { key: 'score', label: 'Score' },
    { key: 'patterns', label: 'Patterns' },
    { key: 'trend', label: 'Trend' },
  ]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #0d9488, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <DollarSign className="w-7 h-7 text-teal-400" style={{ WebkitTextFillColor: 'initial' }} />
            Mindful Money Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Connect every financial decision to your values.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #0f766e, #92400e)' }}
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3" style={{ borderColor: '#0d948830' }}>
          <div className="text-xl font-bold text-teal-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {moments.length}
          </div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: '#d9770630' }}>
          <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {mindfulnessScore}%
          </div>
          <div className="text-xs text-slate-500">Mindfulness</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: '#22c55e30' }}>
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {moments.filter(m => m.valueAligned).length}
          </div>
          <div className="text-xs text-slate-500">Aligned</div>
        </div>
      </div>

      {showForm && (
        <div
          className="game-card p-4 space-y-3"
          style={{ borderColor: '#0d948840', boxShadow: '0 0 30px #0d948815' }}
        >
          <h3 className="text-sm font-semibold text-white">Log a Money Moment</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as MoneyMoment['type'] }))}
              className="game-input text-sm flex-1"
            >
              {(Object.entries(TYPE_CONFIG) as [MoneyMoment['type'], (typeof TYPE_CONFIG)[MoneyMoment['type']]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              placeholder="Amount *"
              className="game-input text-sm w-28"
              min={0}
            />
            <select
              value={form.needOrWant}
              onChange={e => setForm(f => ({ ...f, needOrWant: e.target.value as MoneyMoment['needOrWant'] }))}
              className="game-input text-sm flex-1"
            >
              <option value="need">Need</option>
              <option value="want">Want</option>
              <option value="investment">Investment</option>
              <option value="gift">Gift</option>
            </select>
          </div>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What was this for? *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">How did this feel?</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(EMOTION_CONFIG) as [MoneyMoment['emotionTriggered'], (typeof EMOTION_CONFIG)[MoneyMoment['emotionTriggered']]][]).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, emotionTriggered: k }))}
                  className="py-1.5 rounded-lg text-xs transition-all"
                  style={
                    form.emotionTriggered === k
                      ? { background: v.color + '30', border: `1px solid ${v.color}`, color: v.color }
                      : { background: '#1e293b', border: '1px solid #334155', color: '#64748b' }
                  }
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.valueAligned}
                onChange={e => setForm(f => ({ ...f, valueAligned: e.target.checked }))}
                className="accent-teal-400"
              />
              Value aligned
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.impulse}
                onChange={e => setForm(f => ({ ...f, impulse: e.target.checked }))}
                className="accent-amber-400"
              />
              Impulse
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.regret}
                onChange={e => setForm(f => ({ ...f, regret: e.target.checked }))}
                className="accent-red-400"
              />
              Regret
            </label>
          </div>
          <input
            value={form.lesson}
            onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What's the lesson or insight?"
            className="game-input w-full text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 py-2 text-white rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #0f766e, #92400e)' }}
            >
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={
              activeTab === t.key
                ? { background: 'linear-gradient(135deg, #0f766e50, #92400e50)', color: '#5eead4', border: '1px solid #0d948840' }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'log' && (
        <div className="space-y-2">
          {moments.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Your money story begins with awareness.</p>
            </div>
          ) : (
            moments.map(m => {
              const tc = TYPE_CONFIG[m.type]
              const ec = EMOTION_CONFIG[m.emotionTriggered]
              return (
                <div
                  key={m.id}
                  className="game-card p-3 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${tc.color}` }}
                >
                  <div className="text-xl leading-none mt-0.5">{ec.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: tc.color }}>
                        {tc.sign}${m.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">{m.description}</span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: tc.color + '20', color: tc.color }}>
                        {tc.label}
                      </span>
                      {m.valueAligned && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400">Aligned</span>
                      )}
                      {m.impulse && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Impulse</span>
                      )}
                      {m.regret && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Regret</span>
                      )}
                    </div>
                    {m.lesson && <p className="text-xs text-slate-500 mt-1 italic">{m.lesson}</p>}
                    <p className="text-xs text-slate-600 mt-0.5">{m.date}</p>
                  </div>
                  <button onClick={() => removeMoment(m.id)} className="text-slate-700 hover:text-red-400 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'values' && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-amber-300 px-1">Your Money Values</h3>
          {values.map(v => (
            <div key={v.id} className="game-card p-3" style={{ borderColor: '#d9770630' }}>
              {editingValueId === v.id && editingValue ? (
                <div className="space-y-2">
                  <input
                    value={editingValue.value}
                    onChange={e => setEditingValue(ev => ev ? { ...ev, value: e.target.value } : ev)}
                    className="game-input w-full text-sm"
                  />
                  <input
                    value={editingValue.description}
                    onChange={e => setEditingValue(ev => ev ? { ...ev, description: e.target.value } : ev)}
                    className="game-input w-full text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={updateValue} className="text-teal-400 hover:text-teal-300">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingValueId(null); setEditingValue(null) }} className="text-slate-500 hover:text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{v.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditingValueId(v.id); setEditingValue({ ...v }) }}
                      className="text-slate-600 hover:text-amber-400"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeValue(v.id)} className="text-slate-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {showNewValue ? (
            <div className="game-card p-3 space-y-2" style={{ borderColor: '#0d948840' }}>
              <input
                value={newValueForm.value}
                onChange={e => setNewValueForm(f => ({ ...f, value: e.target.value }))}
                placeholder="Value statement"
                className="game-input w-full text-sm"
                autoFocus
              />
              <input
                value={newValueForm.description}
                onChange={e => setNewValueForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                className="game-input w-full text-sm"
              />
              <div className="flex gap-2">
                <button onClick={saveValue} className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs">Save</button>
                <button onClick={() => setShowNewValue(false)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewValue(true)}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 px-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add value
            </button>
          )}
        </div>
      )}

      {activeTab === 'score' && (
        <div className="game-card p-4 space-y-4" style={{ borderColor: '#0d948840' }}>
          <h3 className="text-xs font-semibold text-teal-300">Money Mindfulness Score</h3>
          <div className="flex justify-center">
            <MindfulnessGauge score={mindfulnessScore} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="space-y-1">
              <div className="text-teal-400 font-semibold">
                {moments.length ? Math.round((moments.filter(m => m.valueAligned).length / moments.length) * 100) : 0}%
              </div>
              <div className="text-slate-500">Value aligned</div>
            </div>
            <div className="space-y-1">
              <div className="text-amber-400 font-semibold">
                {moments.length ? Math.round((moments.filter(m => !m.impulse).length / moments.length) * 100) : 0}%
              </div>
              <div className="text-slate-500">Non-impulsive</div>
            </div>
            <div className="space-y-1">
              <div className="text-green-400 font-semibold">
                {moments.length ? Math.round((moments.filter(m => !m.regret).length / moments.length) * 100) : 0}%
              </div>
              <div className="text-slate-500">No regret</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Score = avg of aligned + non-impulsive + no-regret rates
          </p>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="game-card p-4 space-y-3" style={{ borderColor: '#a855f730' }}>
          <h3 className="text-xs font-semibold text-purple-300">Emotion × Regret Patterns</h3>
          {moments.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No data yet</p>
          ) : (
            <EmotionRegretHeatmap moments={moments} />
          )}
          <p className="text-xs text-slate-500 text-center">Green = no regret · Red = regret · Darker = more transactions</p>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="game-card p-4 space-y-3" style={{ borderColor: '#0d948840' }}>
          <h3 className="text-xs font-semibold text-teal-300">Value Alignment Trend (Weekly)</h3>
          <ValueAlignmentTrend moments={moments} />
        </div>
      )}
    </div>
  )
}

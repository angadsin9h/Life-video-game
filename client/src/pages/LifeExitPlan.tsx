import React, { useState, useEffect } from 'react'
import { Flame, Plus, Trash2, CheckCircle, Circle, Clock, AlertTriangle, Star, BookOpen, RotateCcw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-lifeexitplan'

type LifeExitReflection = {
  id: string
  date: string
  prompt: string
  response: string
  insight: string
  action: string
  depth: number
}

type FuneralEulogyDraft = {
  id: string
  updated: string
  whatYouStoodFor: string
  howYouLovedPeople: string
  whatYouBuilt: string
  howYouFacedHardship: string
  whatYouWantPeopleTo: string
}

type LifeRegretAudit = {
  id: string
  date: string
  potentialRegret: string
  likelihood: number
  reversible: boolean
  action: string
  committed: boolean
}

type StorageData = {
  reflections: LifeExitReflection[]
  eulogy: FuneralEulogyDraft | null
  regrets: LifeRegretAudit[]
}

const PROMPTS = [
  'If I had exactly 1 year left to live, how would my priorities change today?',
  'What would I deeply regret not doing, saying, or becoming?',
  'What do I want people to genuinely feel when they remember me?',
  'What am I tolerating in my life that I know I shouldn\'t be?',
  'If death came tonight, what conversation would I wish I\'d had?',
  'What version of myself am I failing to live up to, and why?',
  'What would I do differently if I knew this was my last decade?',
  'What am I waiting for that I could start or finish today?',
  'Who needs to hear from me before it\'s too late?',
  'What does a life well-lived look like — and how close am I to living it?',
]

const Candle: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
    <path d="M9 21h6M10 21V9M14 21V9" strokeLinecap="round" />
    <path d="M10 9h4" strokeLinecap="round" />
    <path d="M12 9V5" strokeLinecap="round" />
    <path d="M12 5C12 5 10 3.5 10 2.5C10 1.7 10.9 1 12 1C13.1 1 14 1.7 14 2.5C14 3.5 12 5 12 5Z" fill="currentColor" stroke="none" />
  </svg>
)

type Tab = 'meditate' | 'eulogy' | 'regrets' | 'timeline'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StorageData
  } catch { /**/ }
  return { reflections: [], eulogy: null, regrets: [] }
}

function saveData(data: StorageData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /**/ }
}

function getPromptForToday(reflections: LifeExitReflection[]): string {
  const usedToday = reflections.find(r => r.date === todayStr())
  if (usedToday) return usedToday.prompt
  const idx = new Date().getDate() % PROMPTS.length
  return PROMPTS[idx]
}

export default function LifeExitPlan() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StorageData>({ reflections: [], eulogy: null, regrets: [] })
  const [tab, setTab] = useState<Tab>('meditate')

  const [reflForm, setReflForm] = useState({
    response: '',
    insight: '',
    action: '',
    depth: 7,
    prompt: '',
  })
  const [showReflForm, setShowReflForm] = useState(false)

  const [eulogyForm, setEulogyForm] = useState<Omit<FuneralEulogyDraft, 'id' | 'updated'>>({
    whatYouStoodFor: '',
    howYouLovedPeople: '',
    whatYouBuilt: '',
    howYouFacedHardship: '',
    whatYouWantPeopleTo: '',
  })
  const [editingEulogy, setEditingEulogy] = useState(false)

  const [regretForm, setRegretForm] = useState({
    potentialRegret: '',
    likelihood: 6,
    reversible: true,
    action: '',
  })
  const [showRegretForm, setShowRegretForm] = useState(false)

  useEffect(() => {
    const d = loadData()
    setData(d)
    if (d.eulogy) {
      setEulogyForm({
        whatYouStoodFor: d.eulogy.whatYouStoodFor,
        howYouLovedPeople: d.eulogy.howYouLovedPeople,
        whatYouBuilt: d.eulogy.whatYouBuilt,
        howYouFacedHardship: d.eulogy.howYouFacedHardship,
        whatYouWantPeopleTo: d.eulogy.whatYouWantPeopleTo,
      })
    }
  }, [])

  function update(next: StorageData): void {
    setData(next)
    saveData(next)
  }

  function submitReflection(): void {
    if (!reflForm.response.trim()) return
    const prompt = reflForm.prompt || getPromptForToday(data.reflections)
    const entry: LifeExitReflection = {
      id: Date.now().toString(),
      date: todayStr(),
      prompt,
      response: reflForm.response,
      insight: reflForm.insight,
      action: reflForm.action,
      depth: reflForm.depth,
    }
    update({ ...data, reflections: [entry, ...data.reflections] })
    setReflForm({ response: '', insight: '', action: '', depth: 7, prompt: '' })
    setShowReflForm(false)
    toastSuccess('Reflection saved')
  }

  function deleteReflection(id: string): void {
    update({ ...data, reflections: data.reflections.filter(r => r.id !== id) })
  }

  function saveEulogy(): void {
    const e: FuneralEulogyDraft = {
      id: data.eulogy?.id ?? Date.now().toString(),
      updated: new Date().toISOString(),
      ...eulogyForm,
    }
    update({ ...data, eulogy: e })
    setEditingEulogy(false)
    toastSuccess('Eulogy draft saved')
  }

  function submitRegret(): void {
    if (!regretForm.potentialRegret.trim()) return
    const r: LifeRegretAudit = {
      id: Date.now().toString(),
      date: todayStr(),
      ...regretForm,
      committed: false,
    }
    update({ ...data, regrets: [r, ...data.regrets] })
    setRegretForm({ potentialRegret: '', likelihood: 6, reversible: true, action: '' })
    setShowRegretForm(false)
    toastSuccess('Regret logged')
  }

  function toggleCommit(id: string): void {
    update({
      ...data,
      regrets: data.regrets.map(r => r.id === id ? { ...r, committed: !r.committed } : r),
    })
  }

  function deleteRegret(id: string): void {
    update({ ...data, regrets: data.regrets.filter(r => r.id !== id) })
  }

  const todayPrompt = getPromptForToday(data.reflections)
  const todayReflection = data.reflections.find(r => r.date === todayStr())
  const committedCount = data.regrets.filter(r => r.committed).length
  const urgencyScore = data.regrets.length > 0
    ? Math.round((committedCount / data.regrets.length) * 100)
    : 0

  const TABS: { id: Tab; label: string }[] = [
    { id: 'meditate', label: 'Meditate' },
    { id: 'eulogy', label: 'Eulogy' },
    { id: 'regrets', label: 'Regrets' },
    { id: 'timeline', label: 'Insights' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace', color: '#f5f0e8' }}>
            <Candle className="w-7 h-7" style={{ color: '#d4a853' }} />
            Life Exit Plan
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9a8f7e' }}>
            Memento mori — let mortality clarify what matters.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: '#d4a853', fontFamily: 'Orbitron, monospace' }}>
            {urgencyScore}%
          </div>
          <div className="text-xs" style={{ color: '#9a8f7e' }}>Life Urgency Score</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3" style={{ borderColor: 'rgba(212,168,83,0.15)' }}>
          <div className="text-xl font-bold" style={{ color: '#f5f0e8' }}>{data.reflections.length}</div>
          <div className="text-xs" style={{ color: '#9a8f7e' }}>Reflections</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: 'rgba(212,168,83,0.15)' }}>
          <div className="text-xl font-bold" style={{ color: '#d4a853' }}>{committedCount}</div>
          <div className="text-xs" style={{ color: '#9a8f7e' }}>Committed Actions</div>
        </div>
        <div className="game-card p-3" style={{ borderColor: 'rgba(212,168,83,0.15)' }}>
          <div className="text-xl font-bold" style={{ color: '#c0a080' }}>{data.regrets.length}</div>
          <div className="text-xs" style={{ color: '#9a8f7e' }}>Regrets Audited</div>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.1)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(212,168,83,0.2)' : 'transparent',
              color: tab === t.id ? '#d4a853' : '#9a8f7e',
              border: tab === t.id ? '1px solid rgba(212,168,83,0.3)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'meditate' && (
        <div className="space-y-4">
          <div className="game-card p-5 space-y-3" style={{ borderColor: 'rgba(212,168,83,0.2)', background: 'rgba(20,16,12,0.6)' }}>
            <div className="flex items-start gap-3">
              <Flame className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#d4a853' }} />
              <p className="text-base italic leading-relaxed" style={{ color: '#f5f0e8' }}>
                "{todayPrompt}"
              </p>
            </div>
            {todayReflection ? (
              <div className="mt-2 pt-3" style={{ borderTop: '1px solid rgba(212,168,83,0.1)' }}>
                <p className="text-xs mb-1" style={{ color: '#9a8f7e' }}>Today's reflection completed</p>
                <p className="text-sm" style={{ color: '#c0b090' }}>{todayReflection.response}</p>
                {todayReflection.insight && (
                  <p className="text-xs mt-2" style={{ color: '#d4a853' }}>
                    <span className="font-semibold">Insight:</span> {todayReflection.insight}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setShowReflForm(true); setReflForm(f => ({ ...f, prompt: todayPrompt })) }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.3)' }}
              >
                Reflect on this
              </button>
            )}
          </div>

          {showReflForm && (
            <div className="game-card p-4 space-y-3" style={{ borderColor: 'rgba(212,168,83,0.25)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4a853' }}>Your Reflection</p>
              <textarea
                value={reflForm.response}
                onChange={e => setReflForm(f => ({ ...f, response: e.target.value }))}
                placeholder="Write freely and honestly..."
                rows={4}
                className="game-input w-full text-sm resize-none"
                style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
              />
              <input
                value={reflForm.insight}
                onChange={e => setReflForm(f => ({ ...f, insight: e.target.value }))}
                placeholder="Key insight — distilled to one sentence"
                className="game-input w-full text-sm"
                style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
              />
              <input
                value={reflForm.action}
                onChange={e => setReflForm(f => ({ ...f, action: e.target.value }))}
                placeholder="What does this change about how you live?"
                className="game-input w-full text-sm"
                style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
              />
              <div>
                <p className="text-xs mb-1" style={{ color: '#9a8f7e' }}>Depth of reflection: {reflForm.depth}/10</p>
                <input
                  type="range" min={1} max={10} value={reflForm.depth}
                  onChange={e => setReflForm(f => ({ ...f, depth: Number(e.target.value) }))}
                  className="w-full h-1" style={{ accentColor: '#d4a853' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={submitReflection}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(212,168,83,0.2)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.35)' }}>
                  Save Reflection
                </button>
                <button onClick={() => setShowReflForm(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9a8f7e' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9a8f7e' }}>All Prompts</p>
              <button
                onClick={() => {
                  const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
                  setReflForm(f => ({ ...f, prompt: p }))
                  setShowReflForm(true)
                }}
                className="flex items-center gap-1 text-xs"
                style={{ color: '#d4a853' }}
              >
                <RotateCcw className="w-3 h-3" /> Random prompt
              </button>
            </div>
            <div className="space-y-1.5">
              {PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setReflForm(f => ({ ...f, prompt: p })); setShowReflForm(true) }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.1)', color: '#c0b090' }}
                >
                  <span className="opacity-40 mr-2">{i + 1}.</span>{p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'eulogy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#f5f0e8' }}>Your Eulogy Draft</p>
              <p className="text-xs mt-0.5" style={{ color: '#9a8f7e' }}>
                {data.eulogy ? `Last updated ${data.eulogy.updated.slice(0, 10)}` : 'Not yet written — start now.'}
              </p>
            </div>
            <button
              onClick={() => setEditingEulogy(!editingEulogy)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.3)' }}
            >
              <BookOpen className="w-4 h-4" />
              {editingEulogy ? 'View' : data.eulogy ? 'Edit' : 'Write'}
            </button>
          </div>

          {editingEulogy ? (
            <div className="game-card p-4 space-y-4" style={{ borderColor: 'rgba(212,168,83,0.2)' }}>
              {([
                { field: 'whatYouStoodFor', label: 'What you stood for', placeholder: 'The values and principles that defined you...' },
                { field: 'howYouLovedPeople', label: 'How you loved people', placeholder: 'The way you showed up for the people who mattered...' },
                { field: 'whatYouBuilt', label: 'What you built', placeholder: 'The things you created, grew, or left behind...' },
                { field: 'howYouFacedHardship', label: 'How you faced hardship', placeholder: 'Your character under pressure...' },
                { field: 'whatYouWantPeopleTo', label: 'I want people to remember that...', placeholder: 'The lasting impression you hope to leave...' },
              ] as { field: keyof typeof eulogyForm; label: string; placeholder: string }[]).map(({ field, label, placeholder }) => (
                <div key={field}>
                  <p className="text-xs mb-1.5 font-medium" style={{ color: '#d4a853' }}>{label}</p>
                  <textarea
                    value={eulogyForm[field]}
                    onChange={e => setEulogyForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                    className="game-input w-full text-sm resize-none"
                    style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
                  />
                </div>
              ))}
              <button
                onClick={saveEulogy}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(212,168,83,0.2)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.35)' }}
              >
                Save Eulogy Draft
              </button>
            </div>
          ) : data.eulogy ? (
            <div className="space-y-3">
              {([
                { label: 'What you stood for', value: data.eulogy.whatYouStoodFor },
                { label: 'How you loved people', value: data.eulogy.howYouLovedPeople },
                { label: 'What you built', value: data.eulogy.whatYouBuilt },
                { label: 'How you faced hardship', value: data.eulogy.howYouFacedHardship },
                { label: 'I want people to remember that...', value: data.eulogy.whatYouWantPeopleTo },
              ]).filter(s => s.value).map(section => (
                <div key={section.label} className="game-card p-4" style={{ borderColor: 'rgba(212,168,83,0.12)', background: 'rgba(20,16,12,0.5)' }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: '#d4a853' }}>{section.label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#d8cfc0' }}>{section.value}</p>
                </div>
              ))}
              {!data.eulogy.whatYouStoodFor && !data.eulogy.howYouLovedPeople && (
                <div className="text-center py-8" style={{ color: '#9a8f7e' }}>
                  <p className="text-sm">The eulogy is empty. Write something worth being remembered for.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: '#9a8f7e' }}>
              <Candle className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#d4a853' }} />
              <p className="text-sm">No eulogy drafted yet.</p>
              <p className="text-xs mt-1">Writing your own eulogy is one of the most clarifying acts you can do.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'regrets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#f5f0e8' }}>Regret Audit</p>
              <p className="text-xs" style={{ color: '#9a8f7e' }}>Surface future regrets — then prevent them.</p>
            </div>
            <button
              onClick={() => setShowRegretForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.3)' }}
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {data.regrets.length > 0 && (
            <div className="game-card p-3" style={{ borderColor: 'rgba(212,168,83,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: '#9a8f7e' }}>Life Urgency Score</p>
                <p className="text-sm font-bold" style={{ color: '#d4a853' }}>{urgencyScore}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(212,168,83,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${urgencyScore}%`, background: urgencyScore >= 70 ? '#22c55e' : urgencyScore >= 40 ? '#d4a853' : '#ef4444' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#9a8f7e' }}>
                {committedCount} of {data.regrets.length} potential regrets have committed actions
              </p>
            </div>
          )}

          {showRegretForm && (
            <div className="game-card p-4 space-y-3" style={{ borderColor: 'rgba(212,168,83,0.25)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4a853' }}>New Potential Regret</p>
              <input
                value={regretForm.potentialRegret}
                onChange={e => setRegretForm(f => ({ ...f, potentialRegret: e.target.value }))}
                placeholder='I might regret not...'
                className="game-input w-full text-sm"
                style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
              />
              <div>
                <p className="text-xs mb-1" style={{ color: '#9a8f7e' }}>Likelihood if I don't act: {regretForm.likelihood}/10</p>
                <input
                  type="range" min={1} max={10} value={regretForm.likelihood}
                  onChange={e => setRegretForm(f => ({ ...f, likelihood: Number(e.target.value) }))}
                  className="w-full h-1" style={{ accentColor: '#ef4444' }}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRegretForm(f => ({ ...f, reversible: true }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                  style={{
                    background: regretForm.reversible ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                    color: regretForm.reversible ? '#22c55e' : '#9a8f7e',
                    border: `1px solid ${regretForm.reversible ? 'rgba(34,197,94,0.3)' : 'transparent'}`,
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reversible
                </button>
                <button
                  onClick={() => setRegretForm(f => ({ ...f, reversible: false }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                  style={{
                    background: !regretForm.reversible ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                    color: !regretForm.reversible ? '#ef4444' : '#9a8f7e',
                    border: `1px solid ${!regretForm.reversible ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Irreversible
                </button>
              </div>
              <input
                value={regretForm.action}
                onChange={e => setRegretForm(f => ({ ...f, action: e.target.value }))}
                placeholder="What action would prevent this regret?"
                className="game-input w-full text-sm"
                style={{ background: 'rgba(212,168,83,0.04)', borderColor: 'rgba(212,168,83,0.15)', color: '#f5f0e8' }}
              />
              <div className="flex gap-2">
                <button onClick={submitRegret}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(212,168,83,0.2)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.35)' }}>
                  Log Regret
                </button>
                <button onClick={() => setShowRegretForm(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9a8f7e' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {data.regrets.map(r => (
              <div
                key={r.id}
                className="game-card p-4"
                style={{
                  borderColor: r.committed ? 'rgba(34,197,94,0.2)' : r.reversible ? 'rgba(212,168,83,0.15)' : 'rgba(239,68,68,0.2)',
                  background: 'rgba(20,16,12,0.4)',
                }}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleCommit(r.id)} className="mt-0.5 flex-shrink-0">
                    {r.committed
                      ? <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                      : <Circle className="w-5 h-5" style={{ color: '#9a8f7e' }} />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: r.committed ? '#9a8f7e' : '#f5f0e8', textDecoration: r.committed ? 'line-through' : 'none' }}>
                      I might regret not {r.potentialRegret}
                    </p>
                    {r.action && (
                      <p className="text-xs mt-1" style={{ color: '#d4a853' }}>
                        → {r.action}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs" style={{ color: r.likelihood >= 7 ? '#ef4444' : '#9a8f7e' }}>
                        {r.likelihood}/10 likely
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: r.reversible ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: r.reversible ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {r.reversible ? 'reversible' : 'irreversible'}
                      </span>
                      <span className="text-xs" style={{ color: '#6b6358' }}>{r.date}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteRegret(r.id)} style={{ color: '#6b6358' }} className="hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {data.regrets.length === 0 && !showRegretForm && (
              <div className="text-center py-12" style={{ color: '#9a8f7e' }}>
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No regrets audited yet.</p>
                <p className="text-xs mt-1">Most people only realize their regrets too late. Start now.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#f5f0e8' }}>Insights Timeline</p>
          {data.reflections.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#9a8f7e' }}>
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No reflections yet. Begin meditating on mortality.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'rgba(212,168,83,0.15)' }} />
              {data.reflections.map(r => (
                <div key={r.id} className="relative">
                  <div
                    className="absolute -left-4 w-2.5 h-2.5 rounded-full border-2 mt-1.5"
                    style={{ background: '#1a150e', borderColor: '#d4a853', top: '0' }}
                  />
                  <div className="game-card p-4" style={{ borderColor: 'rgba(212,168,83,0.12)', background: 'rgba(20,16,12,0.5)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs" style={{ color: '#6b6358' }}>{r.date}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3"
                            style={{ color: i < Math.round(r.depth / 2) ? '#d4a853' : '#3a3028' }}
                            fill={i < Math.round(r.depth / 2) ? '#d4a853' : 'none'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs italic mb-2" style={{ color: '#9a8f7e' }}>"{r.prompt}"</p>
                    {r.insight && (
                      <p className="text-sm" style={{ color: '#d8cfc0' }}>
                        <span className="font-semibold" style={{ color: '#d4a853' }}>Insight:</span> {r.insight}
                      </p>
                    )}
                    {r.action && (
                      <p className="text-sm mt-1.5" style={{ color: '#c0b090' }}>
                        <span className="font-semibold" style={{ color: '#a0c878' }}>Action:</span> {r.action}
                      </p>
                    )}
                    <button
                      onClick={() => deleteReflection(r.id)}
                      className="mt-2 text-xs hover:text-red-400 transition-colors"
                      style={{ color: '#4a4038' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

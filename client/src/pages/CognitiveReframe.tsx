import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronRight, Check, X, Archive } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ThoughtRecord {
  id: string
  date: string
  situation: string
  automaticThought: string
  emotion: string
  emotionBefore: number
  cognitiveDistortions: string[]
  evidence_for: string
  evidence_against: string
  reframe: string
  emotionAfter: number
  insight: string
  createdAt: string
}

const COGNITIVE_DISTORTIONS = [
  'All-or-Nothing', 'Overgeneralization', 'Mental Filter', 'Disqualifying the positive',
  'Mind Reading', 'Fortune Telling', 'Catastrophizing', 'Emotional Reasoning',
  'Should Statements', 'Labeling', 'Personalization', 'Magnification',
]

const EMOTIONS = [
  'Anxious', 'Sad', 'Angry', 'Ashamed', 'Guilty', 'Frustrated',
  'Overwhelmed', 'Hopeless', 'Jealous', 'Lonely', 'Embarrassed', 'Scared',
]

const STEPS = [
  { id: 0, title: 'Situation', desc: 'What happened?' },
  { id: 1, title: 'Automatic Thought', desc: 'What went through your mind?' },
  { id: 2, title: 'Emotion', desc: 'How did it make you feel?' },
  { id: 3, title: 'Distortions', desc: 'Which thinking errors apply?' },
  { id: 4, title: 'Evidence', desc: 'For and against this thought' },
  { id: 5, title: 'Reframe', desc: 'A more balanced perspective' },
]

const STORAGE_KEY = 'cognitive_reframe'

export default function CognitiveReframe() {
  const { toastSuccess } = useToast()
  const [records, setRecords] = useState<ThoughtRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    situation: '', automaticThought: '', emotion: '', emotionBefore: 5,
    cognitiveDistortions: [] as string[], evidence_for: '', evidence_against: '',
    reframe: '', emotionAfter: 5, insight: '',
  })
  const [viewId, setViewId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setRecords(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const saveRecords = (updated: ThoughtRecord[]) => {
    setRecords(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const startNew = () => {
    setForm({
      situation: '', automaticThought: '', emotion: '', emotionBefore: 5,
      cognitiveDistortions: [], evidence_for: '', evidence_against: '',
      reframe: '', emotionAfter: 5, insight: '',
    })
    setStep(0)
    setShowForm(true)
  }

  const complete = () => {
    const record: ThoughtRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      situation: form.situation,
      automaticThought: form.automaticThought,
      emotion: form.emotion,
      emotionBefore: form.emotionBefore,
      cognitiveDistortions: form.cognitiveDistortions,
      evidence_for: form.evidence_for,
      evidence_against: form.evidence_against,
      reframe: form.reframe,
      emotionAfter: form.emotionAfter,
      insight: form.insight,
      createdAt: new Date().toISOString(),
    }
    saveRecords([record, ...records])
    setShowForm(false)
    const relief = form.emotionBefore - form.emotionAfter
    toastSuccess(`Thought reframed! ${relief > 0 ? `${relief} point relief 🧠` : 'Well done for working through it!'}`)
  }

  const del = (id: string) => saveRecords(records.filter(r => r.id !== id))

  const toggleDistortion = (d: string) => {
    setForm(f => ({
      ...f,
      cognitiveDistortions: f.cognitiveDistortions.includes(d)
        ? f.cognitiveDistortions.filter(x => x !== d)
        : [...f.cognitiveDistortions, d],
    }))
  }

  const canNext = () => {
    if (step === 0) return form.situation.trim().length > 0
    if (step === 1) return form.automaticThought.trim().length > 0
    if (step === 2) return form.emotion.trim().length > 0
    if (step === 3) return true
    if (step === 4) return form.evidence_against.trim().length > 0
    if (step === 5) return form.reframe.trim().length > 0
    return false
  }

  const avgRelief = records.length > 0
    ? +(records.reduce((s, r) => s + Math.max(0, r.emotionBefore - r.emotionAfter), 0) / records.length).toFixed(1)
    : 0

  const topDistortions = (() => {
    const counts: Record<string, number> = {}
    records.forEach(r => r.cognitiveDistortions.forEach(d => { counts[d] = (counts[d] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  })()

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Cognitive Reframe
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">CBT thought records to challenge negative thinking</p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{records.length}</div>
          <div className="text-xs text-slate-500">Records</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{avgRelief > 0 ? `-${avgRelief}` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Relief</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{topDistortions[0]?.[0]?.split('-')[0] || '—'}</div>
          <div className="text-xs text-slate-500">Top Pattern</div>
        </div>
      </div>

      {/* Multi-step form */}
      {showForm && (
        <div className="game-card p-5 space-y-5 border border-violet-500/20">
          {/* Step indicator */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= step ? '#a855f7' : '#1e293b' }} />
            ))}
          </div>
          <div>
            <div className="text-xs text-violet-400 uppercase tracking-wider mb-0.5">Step {step + 1} of {STEPS.length}</div>
            <div className="font-semibold text-white">{STEPS[step].title}</div>
            <div className="text-xs text-slate-400">{STEPS[step].desc}</div>
          </div>

          {step === 0 && (
            <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
              placeholder="Describe the situation: when, where, with whom, what happened..."
              className="game-input w-full h-24 resize-none" autoFocus />
          )}

          {step === 1 && (
            <div className="space-y-3">
              <textarea value={form.automaticThought} onChange={e => setForm(f => ({ ...f, automaticThought: e.target.value }))}
                placeholder="What's the exact thought that went through your mind? (e.g. 'I'm a failure', 'Nobody likes me')"
                className="game-input w-full h-20 resize-none" autoFocus />
              <div className="text-xs text-slate-500 italic">
                Tip: Be specific. Automatic thoughts are often absolute — "always", "never", "everyone", "I am..."
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Emotion</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emotion: e }))}
                      className="px-2 py-1 rounded-lg text-xs transition-all"
                      style={form.emotion === e ? { background: '#a855f730', color: '#a855f7', border: '1px solid #a855f7' } : { background: '#1e293b', color: '#64748b' }}>
                      {e}
                    </button>
                  ))}
                </div>
                <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
                  placeholder="Or type your emotion..." className="game-input w-full mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Intensity before reframe</span>
                  <span className="text-violet-400 font-bold">{form.emotionBefore}/10</span>
                </div>
                <input type="range" min="1" max="10" value={form.emotionBefore}
                  onChange={e => setForm(f => ({ ...f, emotionBefore: +e.target.value }))}
                  className="w-full accent-violet-400" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">Select all cognitive distortions that apply to your automatic thought:</div>
              <div className="flex flex-wrap gap-1.5">
                {COGNITIVE_DISTORTIONS.map(d => (
                  <button key={d} onClick={() => toggleDistortion(d)}
                    className="px-2 py-1 rounded-lg text-xs transition-all"
                    style={form.cognitiveDistortions.includes(d) ? { background: '#ef444430', color: '#ef4444', border: '1px solid #ef4444' } : { background: '#1e293b', color: '#64748b' }}>
                    {d}
                  </button>
                ))}
              </div>
              {form.cognitiveDistortions.length === 0 && (
                <div className="text-xs text-slate-500 italic">You can skip this step if none apply, or select "None" and continue.</div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Evidence FOR the thought</label>
                <textarea value={form.evidence_for} onChange={e => setForm(f => ({ ...f, evidence_for: e.target.value }))}
                  placeholder="Facts that support this thought (not feelings, just facts)..."
                  className="game-input w-full h-16 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Evidence AGAINST the thought *</label>
                <textarea value={form.evidence_against} onChange={e => setForm(f => ({ ...f, evidence_against: e.target.value }))}
                  placeholder="Facts that contradict this thought, exceptions, alternative explanations..."
                  className="game-input w-full h-20 resize-none" autoFocus />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Balanced/Reframed Thought *</label>
                <textarea value={form.reframe} onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
                  placeholder="A more realistic, balanced perspective that considers all the evidence..."
                  className="game-input w-full h-20 resize-none" autoFocus />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Intensity after reframe</span>
                  <span className="text-green-400 font-bold">{form.emotionAfter}/10</span>
                </div>
                <input type="range" min="1" max="10" value={form.emotionAfter}
                  onChange={e => setForm(f => ({ ...f, emotionAfter: +e.target.value }))}
                  className="w-full accent-green-400" />
                {form.emotionBefore - form.emotionAfter > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    🧠 {form.emotionBefore - form.emotionAfter} point reduction
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Key Insight (optional)</label>
                <input value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
                  placeholder="What did you learn about this pattern?" className="game-input w-full" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
            )}
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-800 text-slate-500 rounded-xl text-sm">
              <X className="w-4 h-4" />
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={complete} disabled={!canNext()}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                <Check className="w-4 h-4" />Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top distortions */}
      {topDistortions.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Common Patterns</h3>
          {topDistortions.map(([d, count]) => (
            <div key={d} className="flex items-center gap-3 mb-2">
              <div className="text-xs text-red-400 flex-1">{d}</div>
              <div className="text-xs text-slate-500">{count}×</div>
            </div>
          ))}
        </div>
      )}

      {/* Records list */}
      {records.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Thought Records</h3>
          {records.map(r => {
            const relief = r.emotionBefore - r.emotionAfter
            return (
              <div key={r.id} className="game-card p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">{r.date}</span>
                      {relief > 0 && <span className="text-xs text-green-400">-{relief} relief</span>}
                    </div>
                    <div className="font-medium text-white text-sm mb-1">"{r.automaticThought}"</div>
                    <div className="text-xs text-slate-500 mb-1">{r.emotion} — {r.situation.slice(0, 60)}...</div>
                    {r.reframe && (
                      <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20 mt-2">
                        → {r.reframe.slice(0, 100)}{r.reframe.length > 100 ? '...' : ''}
                      </div>
                    )}
                    {r.cognitiveDistortions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.cognitiveDistortions.map(d => (
                          <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => del(r.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No thought records yet.</p>
          <p className="text-sm">Use this when you notice a negative thought or emotion to work through it with CBT.</p>
        </div>
      )}
    </div>
  )
}

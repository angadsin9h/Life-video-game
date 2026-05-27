import { useState, useCallback } from 'react'
import { Brain, Plus, Trash2, Save, TrendingUp, Target, Zap, CheckCircle, Star, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'mental_model_lab'

interface MentalModel {
  id: string
  name: string
  category: 'thinking' | 'decision' | 'problem-solving' | 'bias' | 'psychology' | 'systems' | 'economics'
  description: string
  example: string
  whenToUse: string
  mastery: number       // 1-5
  timesApplied: number
  lastApplied: string   // YYYY-MM-DD
  notes: string
  tags: string[]
}

interface ApplicationLog {
  id: string
  date: string
  modelId: string
  situation: string
  insight: string
  outcome: string
}

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

const PRESET_MODELS: Omit<MentalModel, 'id' | 'timesApplied' | 'lastApplied' | 'notes'>[] = [
  { name: 'First Principles Thinking', category: 'thinking', description: 'Break down complex problems to their fundamental truths and build up from there.', example: 'Elon Musk used this to reduce rocket costs by 10x.', whenToUse: 'When conventional wisdom is limiting you or costs seem fixed.', mastery: 1, tags: ['reasoning', 'innovation'] },
  { name: 'Inversion', category: 'problem-solving', description: 'Instead of asking how to succeed, ask how to avoid failure. Think backwards.', example: 'Instead of "how do I get healthy?" ask "what makes me unhealthy?"', whenToUse: 'When you\'re stuck on a problem or want to stress-test a plan.', mastery: 1, tags: ['stoic', 'planning'] },
  { name: 'Pareto Principle (80/20)', category: 'systems', description: '80% of results come from 20% of causes.', example: '20% of clients generate 80% of revenue.', whenToUse: 'When you need to prioritize and focus your energy.', mastery: 1, tags: ['productivity', 'focus'] },
  { name: 'Circle of Competence', category: 'decision', description: 'Know what you know, know what you don\'t know, and operate within your circle.', example: 'Warren Buffett only invests in businesses he understands deeply.', whenToUse: 'Before making a high-stakes decision.', mastery: 1, tags: ['self-awareness', 'investing'] },
  { name: 'Second-Order Thinking', category: 'thinking', description: 'Think about the consequences of consequences. What happens after the obvious result?', example: 'Antibiotics cure infections but create resistant bacteria.', whenToUse: 'Before making changes that affect complex systems.', mastery: 1, tags: ['systems', 'long-term'] },
  { name: 'Occam\'s Razor', category: 'problem-solving', description: 'Among competing hypotheses, the simplest one is usually correct.', example: 'If your car won\'t start, check the battery before calling a mechanic.', whenToUse: 'When explaining an event or choosing between solutions.', mastery: 1, tags: ['simplicity', 'reasoning'] },
  { name: 'Confirmation Bias', category: 'bias', description: 'We tend to search for and favor information that confirms our existing beliefs.', example: 'Reading only news sources that agree with your politics.', whenToUse: 'Recognize it to make better decisions. Actively seek disconfirming evidence.', mastery: 1, tags: ['bias', 'self-awareness'] },
  { name: 'Opportunity Cost', category: 'economics', description: 'Every choice has a cost — what you give up by not choosing the next best alternative.', example: 'Going to university costs not just tuition but 4 years of earnings.', whenToUse: 'When evaluating tradeoffs between options.', mastery: 1, tags: ['economics', 'decision'] },
]

const CAT_COLORS: Record<string, string> = {
  'thinking': 'text-blue-400', 'decision': 'text-violet-400', 'problem-solving': 'text-green-400',
  'bias': 'text-red-400', 'psychology': 'text-pink-400', 'systems': 'text-cyan-400', 'economics': 'text-yellow-400',
}

export default function MentalModelLab() {
  const { toastSuccess } = useToast()
  const [models, setModels] = useState<MentalModel[]>(() =>
    load<MentalModel[]>(STORAGE_KEY, PRESET_MODELS.map((m, i) => ({
      ...m, id: String(i + 1), timesApplied: 0, lastApplied: '', notes: '',
    })))
  )
  const [appLog, setAppLog] = useState<ApplicationLog[]>(() => load<ApplicationLog[]>('mental_model_applications', []))
  const [activeTab, setActiveTab] = useState<'library' | 'apply' | 'insights'>('library')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [applyForm, setApplyForm] = useState({ modelId: '', situation: '', insight: '', outcome: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newModel, setNewModel] = useState<Omit<MentalModel, 'id' | 'timesApplied' | 'lastApplied'>>({
    name: '', category: 'thinking', description: '', example: '', whenToUse: '', mastery: 1, notes: '', tags: [],
  })

  const persist = useCallback((m: MentalModel[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
    setModels(m)
  }, [])

  function updateMastery(id: string, mastery: number) {
    persist(models.map(m => m.id === id ? { ...m, mastery } : m))
  }

  function addModel() {
    if (!newModel.name.trim()) return
    const created: MentalModel = { ...newModel, id: Date.now().toString(), timesApplied: 0, lastApplied: '' }
    persist([...models, created])
    setNewModel({ name: '', category: 'thinking', description: '', example: '', whenToUse: '', mastery: 1, notes: '', tags: [] })
    setShowAddForm(false)
    toastSuccess('Mental model added!')
  }

  function logApplication() {
    if (!applyForm.modelId || !applyForm.situation.trim()) return
    const entry: ApplicationLog = { ...applyForm, id: Date.now().toString(), date: new Date().toISOString().slice(0, 10) }
    const updated = [...appLog, entry]
    localStorage.setItem('mental_model_applications', JSON.stringify(updated))
    setAppLog(updated)
    persist(models.map(m => m.id === applyForm.modelId
      ? { ...m, timesApplied: m.timesApplied + 1, lastApplied: entry.date }
      : m))
    setApplyForm({ modelId: '', situation: '', insight: '', outcome: '' })
    toastSuccess('Application logged!')
  }

  const filteredModels = filterCat === 'all' ? models : models.filter(m => m.category === filterCat)
  const masteredCount = models.filter(m => m.mastery >= 4).length
  const totalApplied = models.reduce((s, m) => s + m.timesApplied, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Mental Model Lab</h1>
          <p className="text-slate-400 text-sm mt-1">Build your cognitive toolkit for better thinking</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">{masteredCount}/{models.length}</div>
          <div className="text-xs text-slate-500">mastered</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['library', 'apply', 'insights'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'thinking', 'decision', 'problem-solving', 'bias', 'psychology', 'systems', 'economics'].map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${filterCat === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Add custom model */}
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors border border-slate-600">
            <Plus className="w-4 h-4" /> Add Custom Model
          </button>

          {showAddForm && (
            <div className="game-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="game-input w-full" placeholder="Model name" value={newModel.name}
                  onChange={e => setNewModel(m => ({ ...m, name: e.target.value }))} />
                <select className="game-input w-full" value={newModel.category}
                  onChange={e => setNewModel(m => ({ ...m, category: e.target.value as MentalModel['category'] }))}>
                  {['thinking','decision','problem-solving','bias','psychology','systems','economics'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <textarea className="game-input w-full text-sm" rows={2} placeholder="Description"
                value={newModel.description} onChange={e => setNewModel(m => ({ ...m, description: e.target.value }))} />
              <input className="game-input w-full" placeholder="Real-world example" value={newModel.example}
                onChange={e => setNewModel(m => ({ ...m, example: e.target.value }))} />
              <input className="game-input w-full" placeholder="When to use" value={newModel.whenToUse}
                onChange={e => setNewModel(m => ({ ...m, whenToUse: e.target.value }))} />
              <button onClick={addModel}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" /> Save Model
              </button>
            </div>
          )}

          {/* Model cards */}
          <div className="space-y-2">
            {filteredModels.map(model => (
              <div key={model.id} className="game-card overflow-hidden">
                <button className="w-full text-left p-4" onClick={() => setExpandedId(expandedId === model.id ? null : model.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{model.name}</span>
                        <span className={`text-xs ${CAT_COLORS[model.category]} capitalize`}>{model.category}</span>
                        {model.timesApplied > 0 && <span className="text-xs text-slate-500">Applied {model.timesApplied}×</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">{model.description}</p>
                    </div>
                    {/* Mastery stars */}
                    <div className="flex gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => updateMastery(model.id, s)}>
                          <Star className={`w-4 h-4 transition-colors ${model.mastery >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </button>
                {expandedId === model.id && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-700 pt-3">
                    <div className="text-sm text-slate-300">{model.description}</div>
                    {model.example && <div className="text-xs text-slate-400"><span className="text-slate-500">Example:</span> {model.example}</div>}
                    {model.whenToUse && <div className="text-xs text-slate-400"><span className="text-slate-500">Use when:</span> {model.whenToUse}</div>}
                    <textarea className="game-input w-full text-xs" rows={2} placeholder="Your personal notes..."
                      value={model.notes}
                      onChange={e => persist(models.map(m => m.id === model.id ? { ...m, notes: e.target.value } : m))} />
                    <button onClick={() => {
                      persist(models.map(m => m.id === model.id ? { ...m, notes: model.notes } : m))
                      toastSuccess('Notes saved!')
                    }} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <Save className="w-3 h-3" /> Save notes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <div className="space-y-4">
          <div className="game-card p-4 space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400" /> Log an Application</h3>
            <select className="game-input w-full" value={applyForm.modelId}
              onChange={e => setApplyForm(f => ({ ...f, modelId: e.target.value }))}>
              <option value="">Select a mental model...</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <textarea className="game-input w-full text-sm" rows={2} placeholder="What situation did you apply it to?"
              value={applyForm.situation} onChange={e => setApplyForm(f => ({ ...f, situation: e.target.value }))} />
            <textarea className="game-input w-full text-sm" rows={2} placeholder="What insight did you gain?"
              value={applyForm.insight} onChange={e => setApplyForm(f => ({ ...f, insight: e.target.value }))} />
            <input className="game-input w-full" placeholder="What was the outcome?" value={applyForm.outcome}
              onChange={e => setApplyForm(f => ({ ...f, outcome: e.target.value }))} />
            <button onClick={logApplication}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
              <Zap className="w-4 h-4" /> Log Application
            </button>
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Applications</h3>
            <div className="space-y-3">
              {[...appLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(log => {
                const model = models.find(m => m.id === log.modelId)
                return (
                  <div key={log.id} className="p-3 bg-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-400">{model?.name ?? 'Unknown model'}</span>
                      <span className="text-xs text-slate-500">{log.date}</span>
                    </div>
                    <p className="text-xs text-slate-300">{log.situation}</p>
                    {log.insight && <p className="text-xs text-slate-400 italic">💡 {log.insight}</p>}
                    {log.outcome && <p className="text-xs text-green-400">→ {log.outcome}</p>}
                  </div>
                )
              })}
              {appLog.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No applications logged yet.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Models', value: models.length, color: 'text-violet-400' },
              { label: 'Mastered (4-5★)', value: masteredCount, color: 'text-yellow-400' },
              { label: 'Times Applied', value: totalApplied, color: 'text-cyan-400' },
              { label: 'Applications Logged', value: appLog.length, color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="game-card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Most Applied Models</h3>
            <div className="space-y-2">
              {[...models].sort((a, b) => b.timesApplied - a.timesApplied).slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 flex-1 truncate">{m.name}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${m.mastery >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />)}
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">{m.timesApplied}× applied</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Mastery by Category</h3>
            <div className="space-y-2">
              {['thinking','decision','problem-solving','bias','psychology','systems','economics'].map(cat => {
                const catModels = models.filter(m => m.category === cat)
                if (!catModels.length) return null
                const avgMastery = catModels.reduce((s, m) => s + m.mastery, 0) / catModels.length
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className={`text-xs capitalize w-28 ${CAT_COLORS[cat]}`}>{cat}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(avgMastery / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-16 text-right">{catModels.length} models</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

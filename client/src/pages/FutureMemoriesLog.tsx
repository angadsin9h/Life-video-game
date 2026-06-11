import React, { useState, useEffect } from 'react'
import { Star, Plus, Shuffle, CheckCircle, Clock, Sparkles, BarChart2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MemoryCategory = 'achievement' | 'experience' | 'relationship' | 'health' | 'creative' | 'spiritual' | 'financial'

type FutureMemory = {
  id: string
  created: string
  title: string
  targetDate: string
  category: MemoryCategory
  vivid: string
  sensoryDetails: string
  emotionalState: string
  whoIsThere: string
  rehearsalCount: number
  lastRehearsed: string
  realized: boolean
  realityNotes: string
}

const STORAGE_KEY = 'lq-futurememories'

const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string; glow: string }> = {
  achievement: { label: 'Achievement', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  experience:  { label: 'Experience',  color: '#a78bfa', glow: 'rgba(167,139,250,0.25)' },
  relationship:{ label: 'Relationship',color: '#ec4899', glow: 'rgba(236,72,153,0.25)' },
  health:      { label: 'Health',      color: '#34d399', glow: 'rgba(52,211,153,0.25)' },
  creative:    { label: 'Creative',    color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
  spiritual:   { label: 'Spiritual',   color: '#c4b5fd', glow: 'rgba(196,181,253,0.25)' },
  financial:   { label: 'Financial',   color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
}

const EMPTY_FORM: Omit<FutureMemory, 'id' | 'created' | 'rehearsalCount' | 'lastRehearsed' | 'realized' | 'realityNotes'> = {
  title: '',
  targetDate: '',
  category: 'experience',
  vivid: '',
  sensoryDetails: '',
  emotionalState: '',
  whoIsThere: '',
}

type View = 'rehearse' | 'create' | 'timeline' | 'vault' | 'stats'

export default function FutureMemoriesLog() {
  const { toastSuccess } = useToast()
  const [memories, setMemories] = useState<FutureMemory[]>([])
  const [view, setView] = useState<View>('rehearse')
  const [form, setForm] = useState<Omit<FutureMemory, 'id' | 'created' | 'rehearsalCount' | 'lastRehearsed' | 'realized' | 'realityNotes'>>(EMPTY_FORM)
  const [rehearsalMemory, setRehearsalMemory] = useState<FutureMemory | null>(null)
  const [realizeId, setRealizeId] = useState<string | null>(null)
  const [realityNote, setRealityNote] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try { setMemories(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (next: FutureMemory[]) => {
    setMemories(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const pickRandom = (list: FutureMemory[]): FutureMemory | null => {
    const unrealized = list.filter(m => !m.realized)
    if (!unrealized.length) return null
    return unrealized[Math.floor(Math.random() * unrealized.length)]
  }

  useEffect(() => {
    if (memories.length && !rehearsalMemory) {
      setRehearsalMemory(pickRandom(memories))
    }
  }, [memories])

  const submit = () => {
    if (!form.title.trim() || !form.vivid.trim()) return
    const m: FutureMemory = {
      id: Date.now().toString(),
      created: new Date().toISOString(),
      rehearsalCount: 0,
      lastRehearsed: '',
      realized: false,
      realityNotes: '',
      ...form,
    }
    const next = [m, ...memories]
    persist(next)
    setForm(EMPTY_FORM)
    setView('rehearse')
    if (!rehearsalMemory) setRehearsalMemory(m)
    toastSuccess('Future memory created', 'Begin rehearsing your vision')
  }

  const rehearse = () => {
    if (!rehearsalMemory) return
    const now = new Date().toISOString()
    const next = memories.map(m =>
      m.id === rehearsalMemory.id
        ? { ...m, rehearsalCount: m.rehearsalCount + 1, lastRehearsed: now }
        : m
    )
    persist(next)
    const updated = next.find(m => m.id === rehearsalMemory.id)!
    setRehearsalMemory(updated)
    toastSuccess('Rehearsal complete', `${updated.rehearsalCount} total rehearsals`)
  }

  const shuffleRehearsal = () => {
    const next = pickRandom(memories)
    setRehearsalMemory(next)
  }

  const markRealized = (id: string) => {
    const next = memories.map(m =>
      m.id === id ? { ...m, realized: true, realityNotes: realityNote } : m
    )
    persist(next)
    setRealizeId(null)
    setRealityNote('')
    toastSuccess('Memory realized!', 'Vision became reality')
  }

  const deleteMemory = (id: string) => {
    persist(memories.filter(m => m.id !== id))
    if (rehearsalMemory?.id === id) setRehearsalMemory(pickRandom(memories.filter(m => m.id !== id)))
  }

  const sortedByDate = [...memories].filter(m => !m.realized && m.targetDate).sort((a, b) => a.targetDate.localeCompare(b.targetDate))
  const realized = memories.filter(m => m.realized)
  const totalRehearsals = memories.reduce((s, m) => s + m.rehearsalCount, 0)
  const topRehearsed = [...memories].sort((a, b) => b.rehearsalCount - a.rehearsalCount).slice(0, 5)

  const catCounts = (Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map(cat => ({
    cat,
    count: memories.filter(m => m.category === cat).length,
  }))
  const total = memories.length || 1

  const donutRadius = 54
  const circumference = 2 * Math.PI * donutRadius
  let offset = 0
  const donutSlices = catCounts
    .filter(c => c.count > 0)
    .map(c => {
      const frac = c.count / total
      const dash = frac * circumference
      const slice = { cat: c.cat, dash, gap: circumference - dash, offset, frac }
      offset += dash
      return slice
    })

  const tabs: { id: View; label: string }[] = [
    { id: 'rehearse', label: 'Rehearse' },
    { id: 'create',   label: 'Create' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'vault',    label: 'Vault' },
    { id: 'stats',    label: 'Stats' },
  ]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace', color: '#f8c96b' }}>
          <Star className="w-7 h-7" style={{ color: '#f8c96b' }} />
          Future Memories
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#a78bfa' }}>Pre-live your future through vivid mental rehearsal.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3" style={{ background: 'rgba(20,10,40,0.8)' }}>
          <div className="text-xl font-bold" style={{ color: '#f8c96b' }}>{memories.length}</div>
          <div className="text-xs" style={{ color: '#7c6b9e' }}>Visions</div>
        </div>
        <div className="game-card p-3" style={{ background: 'rgba(20,10,40,0.8)' }}>
          <div className="text-xl font-bold" style={{ color: '#a78bfa' }}>{totalRehearsals}</div>
          <div className="text-xs" style={{ color: '#7c6b9e' }}>Rehearsals</div>
        </div>
        <div className="game-card p-3" style={{ background: 'rgba(20,10,40,0.8)' }}>
          <div className="text-xl font-bold" style={{ color: '#34d399' }}>{realized.length}</div>
          <div className="text-xs" style={{ color: '#7c6b9e' }}>Realized</div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-semibold transition-all"
            style={view === t.id
              ? { background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }
              : { background: 'rgba(30,20,50,0.6)', color: '#7c6b9e', border: '1px solid transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'rehearse' && (
        <div>
          {rehearsalMemory ? (
            <div className="game-card p-6 space-y-5 relative overflow-hidden" style={{
              background: 'radial-gradient(ellipse at top, rgba(30,10,60,0.95) 0%, rgba(10,5,25,0.98) 100%)',
              border: '1px solid rgba(167,139,250,0.3)',
              boxShadow: `0 0 40px ${CATEGORY_CONFIG[rehearsalMemory.category].glow}`,
            }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 70% 20%, rgba(167,139,250,0.06) 0%, transparent 60%)',
              }} />
              <div className="flex items-start justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: CATEGORY_CONFIG[rehearsalMemory.category].glow, color: CATEGORY_CONFIG[rehearsalMemory.category].color }}>
                  {CATEGORY_CONFIG[rehearsalMemory.category].label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#7c6b9e' }}>{rehearsalMemory.rehearsalCount}x rehearsed</span>
                  <button onClick={shuffleRehearsal} title="Pick another">
                    <Shuffle className="w-4 h-4" style={{ color: '#7c6b9e' }} />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold leading-tight" style={{ color: '#f8c96b', fontFamily: 'Georgia, serif' }}>
                  {rehearsalMemory.title}
                </h2>
                {rehearsalMemory.targetDate && (
                  <p className="text-xs mt-1" style={{ color: '#7c6b9e' }}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(rehearsalMemory.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              {rehearsalMemory.vivid && (
                <div>
                  <p className="text-xs mb-1 font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>The Vision</p>
                  <p className="text-sm leading-relaxed italic" style={{ color: '#e2d9f3' }}>{rehearsalMemory.vivid}</p>
                </div>
              )}

              {rehearsalMemory.sensoryDetails && (
                <div>
                  <p className="text-xs mb-1 font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>What You Sense</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#c4b5fd' }}>{rehearsalMemory.sensoryDetails}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {rehearsalMemory.emotionalState && (
                  <div>
                    <p className="text-xs mb-1 font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>How You Feel</p>
                    <p className="text-sm" style={{ color: '#e2d9f3' }}>{rehearsalMemory.emotionalState}</p>
                  </div>
                )}
                {rehearsalMemory.whoIsThere && (
                  <div>
                    <p className="text-xs mb-1 font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Who's There</p>
                    <p className="text-sm" style={{ color: '#e2d9f3' }}>{rehearsalMemory.whoIsThere}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={rehearse}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                  <Sparkles className="w-4 h-4 inline mr-1.5" />
                  I Rehearsed This
                </button>
                <button onClick={() => setRealizeId(rehearsalMemory.id)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Realized
                </button>
              </div>

              {realizeId === rehearsalMemory.id && (
                <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'rgba(52,211,153,0.2)' }}>
                  <p className="text-xs" style={{ color: '#34d399' }}>How did reality compare to the vision?</p>
                  <textarea value={realityNote} onChange={e => setRealityNote(e.target.value)}
                    placeholder="Describe what actually happened..."
                    className="game-input w-full h-16 resize-none text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => markRealized(rehearsalMemory.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                      Confirm Realized
                    </button>
                    <button onClick={() => setRealizeId(null)}
                      className="px-4 py-2 rounded-xl text-sm" style={{ color: '#7c6b9e' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card p-12 text-center" style={{ background: 'rgba(20,10,40,0.8)' }}>
              <Star className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#f8c96b' }} />
              <p className="text-sm" style={{ color: '#7c6b9e' }}>No future memories yet. Create your first vision.</p>
              <button onClick={() => setView('create')}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                Create Vision
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="game-card p-4 space-y-3" style={{ background: 'rgba(20,10,40,0.9)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <h3 className="text-sm font-bold" style={{ color: '#f8c96b' }}>Craft Your Future Memory</h3>

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title — what is this memory?" className="game-input w-full" autoFocus />

          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MemoryCategory }))}
              className="game-input flex-1 text-sm">
              {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map(c => (
                <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
            <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              className="game-input flex-1 text-sm" />
          </div>

          <div>
            <p className="text-xs mb-1 font-semibold" style={{ color: '#a78bfa' }}>Vivid Description</p>
            <textarea value={form.vivid} onChange={e => setForm(f => ({ ...f, vivid: e.target.value }))}
              placeholder="Write as if you're already there — present tense, first person, full detail..."
              className="game-input w-full h-24 resize-none text-sm" />
          </div>

          <div>
            <p className="text-xs mb-1 font-semibold" style={{ color: '#a78bfa' }}>Sensory Details</p>
            <textarea value={form.sensoryDetails} onChange={e => setForm(f => ({ ...f, sensoryDetails: e.target.value }))}
              placeholder="What do you see, hear, smell, touch, taste in this moment?"
              className="game-input w-full h-16 resize-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#a78bfa' }}>Emotional State</p>
              <input value={form.emotionalState} onChange={e => setForm(f => ({ ...f, emotionalState: e.target.value }))}
                placeholder="How do you feel?" className="game-input w-full text-sm" />
            </div>
            <div>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#a78bfa' }}>Who Is There</p>
              <input value={form.whoIsThere} onChange={e => setForm(f => ({ ...f, whoIsThere: e.target.value }))}
                placeholder="Who shares this moment?" className="game-input w-full text-sm" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={submit}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff' }}>
              <Plus className="w-4 h-4 inline mr-1" />
              Create Memory
            </button>
            <button onClick={() => setView('rehearse')}
              className="px-4 py-2 rounded-xl text-sm" style={{ color: '#7c6b9e', background: 'rgba(30,20,50,0.5)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === 'timeline' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#f8c96b' }}>Timeline</h3>
          {sortedByDate.length === 0 ? (
            <div className="game-card p-8 text-center">
              <p className="text-sm" style={{ color: '#7c6b9e' }}>No dated visions yet. Add target dates to your memories.</p>
            </div>
          ) : (
            <div className="game-card p-4" style={{ background: 'rgba(20,10,40,0.9)', overflowX: 'auto' }}>
              <svg width={Math.max(360, sortedByDate.length * 100)} height={140}>
                <line x1={20} y1={70} x2={Math.max(340, sortedByDate.length * 100 - 20)} y2={70}
                  stroke="rgba(124,107,158,0.3)" strokeWidth={2} />
                {sortedByDate.map((m, i) => {
                  const x = 20 + (i / Math.max(1, sortedByDate.length - 1)) * (Math.max(340, sortedByDate.length * 100 - 40))
                  const cat = CATEGORY_CONFIG[m.category]
                  const isTop = i % 2 === 0
                  return (
                    <g key={m.id}>
                      <line x1={x} y1={isTop ? 50 : 70} x2={x} y2={isTop ? 70 : 90} stroke={cat.color} strokeWidth={1.5} />
                      <circle cx={x} cy={70} r={7} fill={cat.color} style={{ filter: `drop-shadow(0 0 6px ${cat.color})` }} />
                      <text x={x} y={isTop ? 40 : 108} textAnchor="middle" fontSize={9} fill={cat.color}
                        style={{ fontFamily: 'Georgia, serif' }}>
                        {m.title.length > 12 ? m.title.slice(0, 12) + '…' : m.title}
                      </text>
                      <text x={x} y={isTop ? 30 : 118} textAnchor="middle" fontSize={8} fill="rgba(124,107,158,0.8)">
                        {m.targetDate ? new Date(m.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}
                      </text>
                    </g>
                  )
                })}
              </svg>
              <div className="flex flex-wrap gap-2 mt-2">
                {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).filter(c => memories.some(m => m.category === c)).map(c => (
                  <span key={c} className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: CATEGORY_CONFIG[c].color }} />
                    <span style={{ color: '#7c6b9e' }}>{CATEGORY_CONFIG[c].label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {sortedByDate.map(m => {
              const cat = CATEGORY_CONFIG[m.category]
              const isExp = expanded === m.id
              return (
                <div key={m.id} className="game-card overflow-hidden cursor-pointer"
                  style={{ borderLeft: `3px solid ${cat.color}`, background: 'rgba(20,10,40,0.8)' }}
                  onClick={() => setExpanded(isExp ? null : m.id)}>
                  <div className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: '#e2d9f3' }}>{m.title}</div>
                      <div className="text-xs" style={{ color: '#7c6b9e' }}>
                        {m.targetDate} · {m.rehearsalCount}x rehearsed
                      </div>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: cat.glow, color: cat.color }}>{cat.label}</span>
                    {isExp ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#7c6b9e' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#7c6b9e' }} />}
                  </div>
                  {isExp && (
                    <div className="px-3 pb-3 space-y-1.5 border-t" style={{ borderColor: 'rgba(124,107,158,0.15)' }}>
                      {m.vivid && <p className="text-xs mt-2 italic leading-relaxed" style={{ color: '#c4b5fd' }}>{m.vivid}</p>}
                      <button onClick={e => { e.stopPropagation(); deleteMemory(m.id) }}
                        className="mt-1" style={{ color: '#4a3a6e' }}>
                        <Trash2 className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'vault' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#34d399' }}>Realized Vault</h3>
          {realized.length === 0 ? (
            <div className="game-card p-8 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#34d399' }} />
              <p className="text-sm" style={{ color: '#7c6b9e' }}>No memories realized yet. Keep rehearsing your visions.</p>
            </div>
          ) : (
            realized.map(m => {
              const cat = CATEGORY_CONFIG[m.category]
              return (
                <div key={m.id} className="game-card p-4 space-y-3"
                  style={{ background: 'rgba(10,30,20,0.8)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold leading-snug" style={{ color: '#f8c96b', fontFamily: 'Georgia, serif' }}>{m.title}</h4>
                    <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0" style={{ background: cat.glow, color: cat.color }}>{cat.label}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#a78bfa' }}>The Vision</p>
                    <p className="text-xs italic leading-relaxed" style={{ color: '#c4b5fd' }}>{m.vivid}</p>
                  </div>
                  {m.realityNotes && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#34d399' }}>Reality</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#a7f3d0' }}>{m.realityNotes}</p>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: '#4a6e5e' }}>{m.rehearsalCount} rehearsals · Realized {new Date(m.created).toLocaleDateString()}</p>
                </div>
              )
            })
          )}
        </div>
      )}

      {view === 'stats' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold" style={{ color: '#f8c96b' }}>Rehearsal Stats</h3>

          <div className="game-card p-4 flex items-center gap-6" style={{ background: 'rgba(20,10,40,0.9)' }}>
            <div className="shrink-0">
              <svg width={130} height={130} viewBox="0 0 130 130">
                <circle cx={65} cy={65} r={donutRadius} fill="none" stroke="rgba(124,107,158,0.15)" strokeWidth={16} />
                {donutSlices.map((s, i) => (
                  <circle key={i} cx={65} cy={65} r={donutRadius} fill="none"
                    stroke={CATEGORY_CONFIG[s.cat].color}
                    strokeWidth={16}
                    strokeDasharray={`${s.dash} ${s.gap}`}
                    strokeDashoffset={-s.offset}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 4px ${CATEGORY_CONFIG[s.cat].color})` }}
                  />
                ))}
                <text x={65} y={62} textAnchor="middle" fontSize={20} fill="#f8c96b" fontWeight="bold">{memories.length}</text>
                <text x={65} y={76} textAnchor="middle" fontSize={9} fill="#7c6b9e">visions</text>
              </svg>
            </div>
            <div className="space-y-1.5">
              {catCounts.filter(c => c.count > 0).map(c => (
                <div key={c.cat} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_CONFIG[c.cat].color }} />
                  <span className="text-xs" style={{ color: '#c4b5fd' }}>{CATEGORY_CONFIG[c.cat].label}</span>
                  <span className="text-xs font-bold ml-auto" style={{ color: '#f8c96b' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-card p-4 space-y-2" style={{ background: 'rgba(20,10,40,0.9)' }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <p className="text-sm font-bold" style={{ color: '#e2d9f3' }}>Most Rehearsed</p>
            </div>
            {topRehearsed.filter(m => m.rehearsalCount > 0).length === 0 ? (
              <p className="text-xs" style={{ color: '#7c6b9e' }}>No rehearsals yet. Start rehearsing your visions!</p>
            ) : (
              topRehearsed.filter(m => m.rehearsalCount > 0).map((m, i) => {
                const maxCount = topRehearsed[0].rehearsalCount || 1
                const cat = CATEGORY_CONFIG[m.category]
                return (
                  <div key={m.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#c4b5fd' }}>
                        #{i + 1} {m.title.length > 28 ? m.title.slice(0, 28) + '…' : m.title}
                      </span>
                      <span className="text-xs font-bold" style={{ color: cat.color }}>{m.rehearsalCount}x</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(124,107,158,0.15)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(m.rehearsalCount / maxCount) * 100}%`,
                        background: cat.color,
                        boxShadow: `0 0 6px ${cat.color}`,
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

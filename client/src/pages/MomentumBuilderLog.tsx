import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Zap, TrendingUp, Star, Sun, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FactorType = 'builder' | 'killer'
type FactorCategory = 'morning' | 'habits' | 'environment' | 'mindset' | 'social' | 'body' | 'work'

type MomentumFactor = {
  id: string
  name: string
  type: FactorType
  category: FactorCategory
  impact: number
  description: string
  actionable: string
}

type MomentumEntry = {
  id: string
  date: string
  momentumScore: number
  buildersActive: string[]
  killersActive: string[]
  bigWin: string
  bigBlock: string
  morningScore: number
  endScore: number
}

type ActiveTab = 'library' | 'checkin' | 'chart' | 'patterns' | 'protocol'

const STORAGE_KEY = 'lq-momentum-builder-log'

const CATEGORY_COLORS: Record<FactorCategory, string> = {
  morning: '#f59e0b',
  habits: '#22c55e',
  environment: '#a78bfa',
  mindset: '#60a5fa',
  social: '#f472b6',
  body: '#fb923c',
  work: '#34d399',
}

const defaultFactor: Omit<MomentumFactor, 'id'> = {
  name: '',
  type: 'builder',
  category: 'habits',
  impact: 7,
  description: '',
  actionable: '',
}

const defaultEntry: Omit<MomentumEntry, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  momentumScore: 7,
  buildersActive: [],
  killersActive: [],
  bigWin: '',
  bigBlock: '',
  morningScore: 7,
  endScore: 7,
}

function currentStreak(entries: MomentumEntry[]): number {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let prev: string | null = null
  for (const entry of sorted) {
    if (entry.momentumScore < 7) break
    if (prev !== null) {
      const prevDate = new Date(prev)
      const currDate = new Date(entry.date)
      const diff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      if (diff > 1.5) break
    }
    streak++
    prev = entry.date
  }
  return streak
}

function last30Days(entries: MomentumEntry[]): MomentumEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  return entries
    .filter(e => new Date(e.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function trendLine(data: number[]): { x1: number; y1: number; x2: number; y2: number } {
  const n = data.length
  if (n < 2) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  const xMean = (n - 1) / 2
  const yMean = data.reduce((s, v) => s + v, 0) / n
  const slope = data.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0) /
    data.reduce((s, _, i) => s + Math.pow(i - xMean, 2), 0)
  const intercept = yMean - slope * xMean
  return { x1: 0, y1: intercept, x2: n - 1, y2: slope * (n - 1) + intercept }
}

export default function MomentumBuilderLog() {
  const { toastSuccess } = useToast()
  const [factors, setFactors] = useState<MomentumFactor[]>([])
  const [entries, setEntries] = useState<MomentumEntry[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('library')
  const [showFactorForm, setShowFactorForm] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [factorForm, setFactorForm] = useState<Omit<MomentumFactor, 'id'>>(defaultFactor)
  const [entryForm, setEntryForm] = useState<Omit<MomentumEntry, 'id'>>(defaultEntry)
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { factors: MomentumFactor[]; entries: MomentumEntry[] }
      setFactors(parsed.factors ?? [])
      setEntries(parsed.entries ?? [])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ factors, entries }))
  }, [factors, entries])

  function saveFactor() {
    if (!factorForm.name.trim()) return
    const newFactor: MomentumFactor = { ...factorForm, id: Date.now().toString() }
    setFactors(prev => [...prev, newFactor])
    setFactorForm(defaultFactor)
    setShowFactorForm(false)
    toastSuccess(factorForm.type === 'builder' ? 'Builder added!' : 'Killer identified!', factorForm.name)
  }

  function toggleFactorInEntry(factorId: string, factorType: FactorType) {
    if (factorType === 'builder') {
      setEntryForm(p => ({
        ...p,
        buildersActive: p.buildersActive.includes(factorId)
          ? p.buildersActive.filter(id => id !== factorId)
          : [...p.buildersActive, factorId],
      }))
    } else {
      setEntryForm(p => ({
        ...p,
        killersActive: p.killersActive.includes(factorId)
          ? p.killersActive.filter(id => id !== factorId)
          : [...p.killersActive, factorId],
      }))
    }
  }

  function saveEntry() {
    const existing = entries.find(e => e.date === entryForm.date)
    if (existing) {
      setEntries(prev => prev.map(e => e.id === existing.id ? { ...entryForm, id: existing.id } : e))
      toastSuccess('Momentum entry updated', entryForm.date)
    } else {
      const newEntry: MomentumEntry = { ...entryForm, id: Date.now().toString() }
      setEntries(prev => [...prev, newEntry])
      toastSuccess('Momentum logged!', `Score: ${entryForm.momentumScore}/10`)
    }
    setEntryForm({ ...defaultEntry, date: new Date().toISOString().slice(0, 10) })
    setShowEntryForm(false)
  }

  const streak = currentStreak(entries)
  const recent = last30Days(entries)
  const avgMomentum = entries.length > 0
    ? (entries.reduce((s, e) => s + e.momentumScore, 0) / entries.length).toFixed(1)
    : '—'

  const builders = factors.filter(f => f.type === 'builder')
  const killers = factors.filter(f => f.type === 'killer')

  const topBuilders = [...builders]
    .sort((a, b) => {
      const aCorr = entries.filter(e => e.buildersActive.includes(a.id) && e.momentumScore >= 7).length
      const bCorr = entries.filter(e => e.buildersActive.includes(b.id) && e.momentumScore >= 7).length
      return bCorr - aCorr
    })
    .slice(0, 5)

  const chartW = 600
  const chartH = 200
  const padL = 30
  const padR = 20
  const padT = 20
  const padB = 20
  const innerW = chartW - padL - padR
  const innerH = chartH - padT - padB

  function scoreToY(score: number): number {
    return padT + innerH - ((score - 1) / 9) * innerH
  }

  function indexToX(i: number, total: number): number {
    if (total <= 1) return padL + innerW / 2
    return padL + (i / (total - 1)) * innerW
  }

  const chartData = recent.map(e => e.momentumScore)
  const tl = chartData.length >= 2 ? trendLine(chartData) : null

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #051020 100%)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', borderRadius: '12px', padding: '0.75rem' }}>
            <TrendingUp size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace' }}>
              Momentum Builder
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Design systems for unstoppable forward motion</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Zap size={20} color="#f59e0b" />
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Orbitron, monospace' }}>{streak}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Day Streak (≥7)</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#22c55e' }}>{builders.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Builders</div>
          </div>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{killers.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Killers</div>
          </div>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa' }}>{entries.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Check-ins</div>
          </div>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa' }}>{avgMomentum}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Avg Momentum</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(['library', 'checkin', 'chart', 'patterns', 'protocol'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: activeTab === tab ? 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#fff' : '#94a3b8',
              }}
            >
              {tab === 'library' ? 'Factor Library' : tab === 'checkin' ? 'Daily Check-in' : tab === 'chart' ? 'Trajectory' : tab === 'patterns' ? 'Patterns' : 'Protocol'}
            </button>
          ))}
        </div>

        {activeTab === 'library' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Momentum Factors</h2>
              <button
                onClick={() => setShowFactorForm(!showFactorForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus size={16} /> Add Factor
              </button>
            </div>

            {showFactorForm && (
              <div className="game-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(29,78,216,0.4)' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#60a5fa' }}>New Momentum Factor</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Name</label>
                    <input className="game-input" value={factorForm.name} onChange={e => setFactorForm(p => ({ ...p, name: e.target.value }))} placeholder="What is this factor?" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Type</label>
                    <select className="game-input" value={factorForm.type} onChange={e => setFactorForm(p => ({ ...p, type: e.target.value as FactorType }))} style={{ width: '100%' }}>
                      <option value="builder">Builder</option>
                      <option value="killer">Killer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Category</label>
                    <select className="game-input" value={factorForm.category} onChange={e => setFactorForm(p => ({ ...p, category: e.target.value as FactorCategory }))} style={{ width: '100%' }}>
                      {(['morning', 'habits', 'environment', 'mindset', 'social', 'body', 'work'] as FactorCategory[]).map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Impact: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{factorForm.impact}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={factorForm.impact} onChange={e => setFactorForm(p => ({ ...p, impact: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Description</label>
                    <input className="game-input" value={factorForm.description} onChange={e => setFactorForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe this factor..." style={{ width: '100%' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>What to do with it</label>
                    <input className="game-input" value={factorForm.actionable} onChange={e => setFactorForm(p => ({ ...p, actionable: e.target.value }))} placeholder="Actionable step..." style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={saveFactor} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Save Factor
                  </button>
                  <button onClick={() => setShowFactorForm(false)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {factors.length === 0 && (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <TrendingUp size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No factors yet. Add what builds or kills your momentum.</p>
              </div>
            )}

            {builders.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#22c55e', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Builders ({builders.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {builders.map(factor => {
                    const isExpanded = expandedFactor === factor.id
                    return (
                      <div key={factor.id} className="game-card" style={{ borderLeft: '3px solid #22c55e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#fff' }}>{factor.name}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${CATEGORY_COLORS[factor.category]}20`, color: CATEGORY_COLORS[factor.category] }}>{factor.category}</span>
                              <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Impact: {factor.impact}/10</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setExpandedFactor(isExpanded ? null : factor.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button onClick={() => setFactors(prev => prev.filter(f => f.id !== factor.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            {factor.description && <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>{factor.description}</p>}
                            {factor.actionable && <p style={{ margin: 0, fontSize: '0.85rem', color: '#22c55e' }}>Action: {factor.actionable}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {killers.length > 0 && (
              <div>
                <h3 style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Killers ({killers.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {killers.map(factor => {
                    const isExpanded = expandedFactor === factor.id
                    return (
                      <div key={factor.id} className="game-card" style={{ borderLeft: '3px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#fff' }}>{factor.name}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${CATEGORY_COLORS[factor.category]}20`, color: CATEGORY_COLORS[factor.category] }}>{factor.category}</span>
                              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Impact: {factor.impact}/10</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setExpandedFactor(isExpanded ? null : factor.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button onClick={() => setFactors(prev => prev.filter(f => f.id !== factor.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            {factor.description && <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>{factor.description}</p>}
                            {factor.actionable && <p style={{ margin: 0, fontSize: '0.85rem', color: '#f59e0b' }}>Action: {factor.actionable}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Daily Momentum Check-in</h2>
              <button
                onClick={() => setShowEntryForm(!showEntryForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus size={16} /> Log Today
              </button>
            </div>

            {showEntryForm && (
              <div className="game-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(14,165,233,0.4)' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#60a5fa' }}>Momentum Check-in</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Date</label>
                    <input type="date" className="game-input" value={entryForm.date} onChange={e => setEntryForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Overall Momentum: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{entryForm.momentumScore}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={entryForm.momentumScore} onChange={e => setEntryForm(p => ({ ...p, momentumScore: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Morning Quality: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{entryForm.morningScore}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={entryForm.morningScore} onChange={e => setEntryForm(p => ({ ...p, morningScore: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      End of Day: <span style={{ color: '#34d399', fontWeight: 700 }}>{entryForm.endScore}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={entryForm.endScore} onChange={e => setEntryForm(p => ({ ...p, endScore: +e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {builders.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', color: '#22c55e', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Active Builders Today</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {builders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => toggleFactorInEntry(f.id, 'builder')}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: entryForm.buildersActive.includes(f.id) ? '#22c55e' : 'rgba(255,255,255,0.1)',
                              background: entryForm.buildersActive.includes(f.id) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.03)',
                              color: entryForm.buildersActive.includes(f.id) ? '#22c55e' : '#64748b',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              fontWeight: entryForm.buildersActive.includes(f.id) ? 700 : 400,
                            }}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {killers.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Active Killers Today</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {killers.map(f => (
                          <button
                            key={f.id}
                            onClick={() => toggleFactorInEntry(f.id, 'killer')}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: entryForm.killersActive.includes(f.id) ? '#ef4444' : 'rgba(255,255,255,0.1)',
                              background: entryForm.killersActive.includes(f.id) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.03)',
                              color: entryForm.killersActive.includes(f.id) ? '#ef4444' : '#64748b',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              fontWeight: entryForm.killersActive.includes(f.id) ? 700 : 400,
                            }}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Biggest Win Today</label>
                    <input className="game-input" value={entryForm.bigWin} onChange={e => setEntryForm(p => ({ ...p, bigWin: e.target.value }))} placeholder="What moved you forward most?" style={{ width: '100%' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Biggest Block</label>
                    <input className="game-input" value={entryForm.bigBlock} onChange={e => setEntryForm(p => ({ ...p, bigBlock: e.target.value }))} placeholder="What slowed you down most?" style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={saveEntry} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Save Check-in
                  </button>
                  <button onClick={() => setShowEntryForm(false)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {entries.length === 0 && (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No check-ins yet. Log your first momentum entry.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
                const scoreColor = entry.momentumScore >= 8 ? '#22c55e' : entry.momentumScore >= 6 ? '#60a5fa' : entry.momentumScore >= 4 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={entry.id} className="game-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{entry.date}</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor, fontFamily: 'Orbitron, monospace' }}>{entry.momentumScore}/10</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Morning: {entry.morningScore} · EOD: {entry.endScore}</span>
                        </div>
                        {entry.bigWin && <div style={{ fontSize: '0.85rem', color: '#22c55e', marginBottom: '0.25rem' }}>Win: {entry.bigWin}</div>}
                        {entry.bigBlock && <div style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: '0.25rem' }}>Block: {entry.bigBlock}</div>}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {entry.buildersActive.map(id => {
                            const f = factors.find(fa => fa.id === id)
                            return f ? <span key={id} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{f.name}</span> : null
                          })}
                          {entry.killersActive.map(id => {
                            const f = factors.find(fa => fa.id === id)
                            return f ? <span key={id} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{f.name}</span> : null
                          })}
                        </div>
                      </div>
                      <button onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.1rem' }}>Momentum Trajectory — Last 30 Days</h2>

            {recent.length < 2 ? (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <TrendingUp size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Log at least 2 entries to see your trajectory.</p>
              </div>
            ) : (
              <div className="game-card">
                <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="momGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[2, 4, 6, 8, 10].map(v => {
                    const y = scoreToY(v)
                    return (
                      <g key={v}>
                        <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <text x={padL - 4} y={y} fill="#64748b" fontSize="10" textAnchor="end" dominantBaseline="middle">{v}</text>
                      </g>
                    )
                  })}

                  <line x1={padL} y1={scoreToY(7)} x2={chartW - padR} y2={scoreToY(7)} stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={chartW - padR + 4} y={scoreToY(7)} fill="#22c55e" fontSize="9" dominantBaseline="middle">7</text>

                  {tl && (
                    <line
                      x1={indexToX(tl.x1, recent.length)}
                      y1={scoreToY(Math.max(1, Math.min(10, tl.y1)))}
                      x2={indexToX(tl.x2, recent.length)}
                      y2={scoreToY(Math.max(1, Math.min(10, tl.y2)))}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                      opacity="0.7"
                    />
                  )}

                  <polyline
                    points={recent.map((e, i) => `${indexToX(i, recent.length)},${scoreToY(e.momentumScore)}`).join(' ')}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  <polygon
                    points={[
                      ...recent.map((e, i) => `${indexToX(i, recent.length)},${scoreToY(e.momentumScore)}`),
                      `${indexToX(recent.length - 1, recent.length)},${scoreToY(1)}`,
                      `${indexToX(0, recent.length)},${scoreToY(1)}`,
                    ].join(' ')}
                    fill="url(#momGradient)"
                  />

                  {recent.map((e, i) => {
                    const cx = indexToX(i, recent.length)
                    const cy = scoreToY(e.momentumScore)
                    const color = e.momentumScore >= 7 ? '#22c55e' : '#ef4444'
                    return (
                      <circle key={e.id} cx={cx} cy={cy} r={4} fill={color} stroke="#0f172a" strokeWidth="2" />
                    )
                  })}

                  {recent.map((e, i) => {
                    if (recent.length > 14 && i % 3 !== 0) return null
                    const cx = indexToX(i, recent.length)
                    const label = e.date.slice(5)
                    return (
                      <text key={e.id} x={cx} y={chartH - 4} fill="#64748b" fontSize="9" textAnchor="middle">{label}</text>
                    )
                  })}
                </svg>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '20px', height: '2px', background: '#0ea5e9' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Momentum</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '20px', height: '2px', background: '#f59e0b', borderTop: '2px dashed #f59e0b' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Trend</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '20px', height: '2px', background: '#22c55e', borderTop: '2px dashed #22c55e' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Score 7 threshold</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.1rem' }}>Pattern Analysis</h2>

            {entries.length < 3 ? (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Star size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Log at least 3 entries to see patterns.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="game-card">
                  <h3 style={{ margin: '0 0 1rem', color: '#22c55e', fontSize: '0.95rem' }}>Top Builders on High Days (≥7)</h3>
                  {builders.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No builders defined yet.</p>}
                  {builders.map(f => {
                    const highDays = entries.filter(e => e.momentumScore >= 7)
                    const activeOnHighDays = highDays.filter(e => e.buildersActive.includes(f.id)).length
                    const pct = highDays.length > 0 ? Math.round((activeOnHighDays / highDays.length) * 100) : 0
                    return (
                      <div key={f.id} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{f.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #22c55e, #0ea5e9)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="game-card">
                  <h3 style={{ margin: '0 0 1rem', color: '#ef4444', fontSize: '0.95rem' }}>Top Killers on Low Days ({'<'}6)</h3>
                  {killers.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No killers defined yet.</p>}
                  {killers.map(f => {
                    const lowDays = entries.filter(e => e.momentumScore < 6)
                    const activeOnLowDays = lowDays.filter(e => e.killersActive.includes(f.id)).length
                    const pct = lowDays.length > 0 ? Math.round((activeOnLowDays / lowDays.length) * 100) : 0
                    return (
                      <div key={f.id} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{f.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="game-card" style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#60a5fa', fontSize: '0.95rem' }}>Morning vs Momentum Correlation</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {[
                      { label: 'High Morning\nHigh Momentum', count: entries.filter(e => e.morningScore >= 7 && e.momentumScore >= 7).length, color: '#22c55e' },
                      { label: 'High Morning\nLow Momentum', count: entries.filter(e => e.morningScore >= 7 && e.momentumScore < 6).length, color: '#f59e0b' },
                      { label: 'Low Morning\nHigh Momentum', count: entries.filter(e => e.morningScore < 6 && e.momentumScore >= 7).length, color: '#60a5fa' },
                      { label: 'Low Morning\nLow Momentum', count: entries.filter(e => e.morningScore < 6 && e.momentumScore < 6).length, color: '#ef4444' },
                      { label: 'Mixed', count: entries.filter(e => (e.morningScore >= 6 && e.morningScore < 7) || (e.momentumScore >= 6 && e.momentumScore < 7)).length, color: '#94a3b8' },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.count}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.4, marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'protocol' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.1rem' }}>Momentum Protocol</h2>

            <div className="game-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(14,165,233,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Sun size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '0.95rem' }}>Recommended Morning Routine</h3>
              </div>
              {topBuilders.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add builders to generate your protocol.</p>
              ) : (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                    Based on your top {topBuilders.length} momentum builders:
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topBuilders
                      .filter(f => f.category === 'morning' || f.category === 'body' || f.category === 'habits')
                      .slice(0, 5)
                      .map((f, i) => (
                        <li key={f.id} style={{ color: '#94a3b8' }}>
                          <span style={{ fontWeight: 700, color: '#60a5fa' }}>{f.name}</span>
                          {f.actionable && <span style={{ fontSize: '0.85rem', color: '#64748b' }}> — {f.actionable}</span>}
                        </li>
                      ))}
                    {topBuilders.filter(f => !['morning', 'body', 'habits'].includes(f.category)).slice(0, 3).map(f => (
                      <li key={f.id} style={{ color: '#94a3b8' }}>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{f.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}> ({f.category})</span>
                        {f.actionable && <span style={{ fontSize: '0.85rem', color: '#64748b' }}> — {f.actionable}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="game-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Zap size={20} color="#ef4444" />
                <h3 style={{ margin: 0, color: '#ef4444', fontSize: '0.95rem' }}>Momentum Killers to Avoid</h3>
              </div>
              {killers.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add killers to see your avoidance list.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[...killers].sort((a, b) => b.impact - a.impact).slice(0, 5).map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', borderLeft: '3px solid rgba(239,68,68,0.5)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, color: '#f87171', fontSize: '0.875rem' }}>{f.name}</span>
                        {f.actionable && <span style={{ fontSize: '0.8rem', color: '#64748b' }}> — {f.actionable}</span>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Impact {f.impact}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="game-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Star size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '0.95rem' }}>Your Momentum Stats</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>
                    {entries.filter(e => e.momentumScore >= 7).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>High Momentum Days</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>
                    {entries.length > 0 ? Math.round((entries.filter(e => e.momentumScore >= 7).length / entries.length) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Win Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                    {streak}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Streak</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

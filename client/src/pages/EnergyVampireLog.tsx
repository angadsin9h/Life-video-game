import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Zap, Shield, TrendingDown, Activity, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DrainType = 'person' | 'situation' | 'habit' | 'environment' | 'thought' | 'obligation'
type DrainFrequency = 'daily' | 'weekly' | 'occasionally' | 'rarely'
type DrainStatus = 'active' | 'managed' | 'eliminated'

type EnergyDrain = {
  id: string
  name: string
  type: DrainType
  drainLevel: number
  frequency: DrainFrequency
  avoidable: boolean
  strategy: string
  status: DrainStatus
  notes: string
}

type EnergyEvent = {
  id: string
  date: string
  drainId: string
  energyBefore: number
  energyAfter: number
  context: string
  coping: string
}

type ActiveTab = 'catalog' | 'log' | 'analysis' | 'strategies'

const STORAGE_KEY = 'lq-energy-vampire-log'

const FREQUENCY_MULTIPLIER: Record<DrainFrequency, number> = {
  daily: 7,
  weekly: 1,
  occasionally: 0.5,
  rarely: 0.1,
}

const TYPE_COLORS: Record<DrainType, string> = {
  person: '#f87171',
  situation: '#fb923c',
  habit: '#facc15',
  environment: '#a78bfa',
  thought: '#60a5fa',
  obligation: '#f472b6',
}

const STATUS_CONFIG: Record<DrainStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  managed: { label: 'Managed', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  eliminated: { label: 'Eliminated', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
}

const COMMON_STRATEGIES = [
  'Set firm boundaries',
  'Limit exposure time',
  'Reframe perspective',
  'Delegate to others',
  'Eliminate completely',
  'Accept and release',
  'Communicate needs',
  'Create distance',
]

function drainSeverityColor(level: number): string {
  if (level >= 8) return '#dc2626'
  if (level >= 6) return '#ef4444'
  if (level >= 4) return '#f97316'
  return '#fbbf24'
}

function weeklyImpact(drain: EnergyDrain): number {
  return drain.drainLevel * FREQUENCY_MULTIPLIER[drain.frequency]
}

const defaultDrain: Omit<EnergyDrain, 'id'> = {
  name: '',
  type: 'situation',
  drainLevel: 5,
  frequency: 'weekly',
  avoidable: true,
  strategy: '',
  status: 'active',
  notes: '',
}

const defaultEvent: Omit<EnergyEvent, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  drainId: '',
  energyBefore: 7,
  energyAfter: 4,
  context: '',
  coping: '',
}

export default function EnergyVampireLog() {
  const { toastSuccess } = useToast()
  const [drains, setDrains] = useState<EnergyDrain[]>([])
  const [events, setEvents] = useState<EnergyEvent[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog')
  const [showDrainForm, setShowDrainForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [drainForm, setDrainForm] = useState<Omit<EnergyDrain, 'id'>>(defaultDrain)
  const [eventForm, setEventForm] = useState<Omit<EnergyEvent, 'id'>>(defaultEvent)
  const [expandedDrain, setExpandedDrain] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { drains: EnergyDrain[]; events: EnergyEvent[] }
      setDrains(parsed.drains ?? [])
      setEvents(parsed.events ?? [])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ drains, events }))
  }, [drains, events])

  function saveDrain() {
    if (!drainForm.name.trim()) return
    const newDrain: EnergyDrain = { ...drainForm, id: Date.now().toString() }
    setDrains(prev => [...prev, newDrain])
    setDrainForm(defaultDrain)
    setShowDrainForm(false)
    toastSuccess('Energy vampire cataloged', drainForm.name)
  }

  function updateDrainStatus(id: string, status: DrainStatus) {
    setDrains(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    if (status === 'eliminated') toastSuccess('Energy vampire eliminated!', 'Reclaim your energy')
    else if (status === 'managed') toastSuccess('Drain managed', 'Strategy is working')
  }

  function deleteDrain(id: string) {
    setDrains(prev => prev.filter(d => d.id !== id))
    setEvents(prev => prev.filter(e => e.drainId !== id))
  }

  function saveEvent() {
    if (!eventForm.drainId) return
    const newEvent: EnergyEvent = { ...eventForm, id: Date.now().toString() }
    setEvents(prev => [...prev, newEvent])
    setEventForm({ ...defaultEvent, date: new Date().toISOString().slice(0, 10) })
    setShowEventForm(false)
    const diff = eventForm.energyAfter - eventForm.energyBefore
    toastSuccess('Encounter logged', `Energy delta: ${diff > 0 ? '+' : ''}${diff}`)
  }

  const protectionScore = drains.length === 0
    ? 0
    : Math.round((drains.filter(d => d.status !== 'active').length / drains.length) * 100)

  const sortedByImpact = [...drains].sort((a, b) => weeklyImpact(b) - weeklyImpact(a))
  const totalWeeklyLoss = drains
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + weeklyImpact(d), 0)

  const maxImpact = sortedByImpact.length > 0 ? weeklyImpact(sortedByImpact[0]) : 1

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0000 0%, #0f172a 50%, #1a0a00 100%)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)', borderRadius: '12px', padding: '0.75rem' }}>
            <Zap size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace' }}>
              Energy Vampire Log
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Identify and eliminate what drains your life force</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: protectionScore >= 70 ? '#22c55e' : protectionScore >= 40 ? '#f59e0b' : '#ef4444', fontFamily: 'Orbitron, monospace' }}>
              {protectionScore}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Protection Score</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{drains.filter(d => d.status === 'active').length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active Drains</div>
          </div>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{totalWeeklyLoss.toFixed(1)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Energy Lost / Week</div>
          </div>
          <div className="game-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#22c55e' }}>{drains.filter(d => d.status === 'eliminated').length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Eliminated</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(['catalog', 'log', 'analysis', 'strategies'] as ActiveTab[]).map(tab => (
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
                background: activeTab === tab ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#fff' : '#94a3b8',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'analysis' ? 'Impact Analysis' : tab === 'strategies' ? 'Strategy Vault' : tab === 'log' ? 'Event Log' : 'Drain Catalog'}
            </button>
          ))}
        </div>

        {activeTab === 'catalog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Energy Drains</h2>
              <button
                onClick={() => setShowDrainForm(!showDrainForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus size={16} /> Add Drain
              </button>
            </div>

            {showDrainForm && (
              <div className="game-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(220,38,38,0.4)' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#f87171' }}>New Energy Drain</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Name</label>
                    <input className="game-input" value={drainForm.name} onChange={e => setDrainForm(p => ({ ...p, name: e.target.value }))} placeholder="What drains you?" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Type</label>
                    <select className="game-input" value={drainForm.type} onChange={e => setDrainForm(p => ({ ...p, type: e.target.value as DrainType }))} style={{ width: '100%' }}>
                      {(['person', 'situation', 'habit', 'environment', 'thought', 'obligation'] as DrainType[]).map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Drain Level: <span style={{ color: drainSeverityColor(drainForm.drainLevel), fontWeight: 700 }}>{drainForm.drainLevel}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={drainForm.drainLevel} onChange={e => setDrainForm(p => ({ ...p, drainLevel: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Frequency</label>
                    <select className="game-input" value={drainForm.frequency} onChange={e => setDrainForm(p => ({ ...p, frequency: e.target.value as DrainFrequency }))} style={{ width: '100%' }}>
                      {(['daily', 'weekly', 'occasionally', 'rarely'] as DrainFrequency[]).map(f => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Status</label>
                    <select className="game-input" value={drainForm.status} onChange={e => setDrainForm(p => ({ ...p, status: e.target.value as DrainStatus }))} style={{ width: '100%' }}>
                      <option value="active">Active</option>
                      <option value="managed">Managed</option>
                      <option value="eliminated">Eliminated</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Avoidable?</label>
                    <button onClick={() => setDrainForm(p => ({ ...p, avoidable: !p.avoidable }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {drainForm.avoidable ? <ToggleRight size={28} color="#22c55e" /> : <ToggleLeft size={28} color="#64748b" />}
                    </button>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Management Strategy</label>
                    <input className="game-input" value={drainForm.strategy} onChange={e => setDrainForm(p => ({ ...p, strategy: e.target.value }))} placeholder="How will you handle this?" style={{ width: '100%' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {COMMON_STRATEGIES.map(s => (
                        <button key={s} onClick={() => setDrainForm(p => ({ ...p, strategy: s }))} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: drainForm.strategy === s ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Notes</label>
                    <textarea className="game-input" value={drainForm.notes} onChange={e => setDrainForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Additional context..." style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={saveDrain} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Save Drain
                  </button>
                  <button onClick={() => setShowDrainForm(false)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {drains.length === 0 && (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Zap size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No energy drains cataloged yet. Add what is stealing your energy.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {drains.map(drain => {
                const statusCfg = STATUS_CONFIG[drain.status]
                const isExpanded = expandedDrain === drain.id
                return (
                  <div key={drain.id} className="game-card" style={{ border: `1px solid ${drainSeverityColor(drain.drainLevel)}30` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '4px', borderRadius: '4px', alignSelf: 'stretch', background: drainSeverityColor(drain.drainLevel), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{drain.name}</span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${TYPE_COLORS[drain.type]}20`, color: TYPE_COLORS[drain.type], fontWeight: 600 }}>
                            {drain.type}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 600 }}>
                            {statusCfg.label}
                          </span>
                          {drain.avoidable && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 600 }}>
                              Avoidable
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: drainSeverityColor(drain.drainLevel) }}>Level: {drain.drainLevel}/10</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{drain.frequency}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Weekly impact: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{weeklyImpact(drain).toFixed(1)}</span></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={drain.status}
                          onChange={e => updateDrainStatus(drain.id, e.target.value as DrainStatus)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          <option value="active">Active</option>
                          <option value="managed">Managed</option>
                          <option value="eliminated">Eliminated</option>
                        </select>
                        <button onClick={() => setExpandedDrain(isExpanded ? null : drain.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button onClick={() => deleteDrain(drain.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {drain.strategy && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Strategy: </span>
                            <span style={{ fontSize: '0.875rem', color: '#22c55e' }}>{drain.strategy}</span>
                          </div>
                        )}
                        {drain.notes && (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Notes: </span>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{drain.notes}</span>
                          </div>
                        )}
                        <div style={{ marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Encounters: {events.filter(e => e.drainId === drain.id).length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Energy Events</h2>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus size={16} /> Log Encounter
              </button>
            </div>

            {showEventForm && (
              <div className="game-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(220,38,38,0.4)' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#f87171' }}>Log Energy Encounter</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Date</label>
                    <input type="date" className="game-input" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Energy Drain</label>
                    <select className="game-input" value={eventForm.drainId} onChange={e => setEventForm(p => ({ ...p, drainId: e.target.value }))} style={{ width: '100%' }}>
                      <option value="">Select drain...</option>
                      {drains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Energy Before: <span style={{ color: '#22c55e', fontWeight: 700 }}>{eventForm.energyBefore}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={eventForm.energyBefore} onChange={e => setEventForm(p => ({ ...p, energyBefore: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Energy After: <span style={{ color: '#ef4444', fontWeight: 700 }}>{eventForm.energyAfter}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={eventForm.energyAfter} onChange={e => setEventForm(p => ({ ...p, energyAfter: +e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Context</label>
                    <input className="game-input" value={eventForm.context} onChange={e => setEventForm(p => ({ ...p, context: e.target.value }))} placeholder="What happened?" style={{ width: '100%' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Coping Strategy Used</label>
                    <input className="game-input" value={eventForm.coping} onChange={e => setEventForm(p => ({ ...p, coping: e.target.value }))} placeholder="What did you do to cope or recover?" style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={saveEvent} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Log Event
                  </button>
                  <button onClick={() => setShowEventForm(false)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No encounters logged yet.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...events].reverse().map(event => {
                const drain = drains.find(d => d.id === event.drainId)
                const delta = event.energyAfter - event.energyBefore
                return (
                  <div key={event.id} className="game-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{drain?.name ?? 'Unknown drain'}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                          <span style={{ color: '#22c55e' }}>Before: {event.energyBefore}</span>
                          <span style={{ color: '#ef4444' }}>After: {event.energyAfter}</span>
                          <span style={{ color: delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                            Delta: {delta > 0 ? '+' : ''}{delta}
                          </span>
                        </div>
                        {event.context && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>{event.context}</div>}
                        {event.coping && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Coping: {event.coping}</div>}
                      </div>
                      <button onClick={() => setEvents(prev => prev.filter(e => e.id !== event.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.1rem' }}>Drain Impact Analysis</h2>

            {drains.length === 0 ? (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <TrendingDown size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Add drains to see impact analysis.</p>
              </div>
            ) : (
              <div className="game-card">
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Weekly energy cost by drain (active only)</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'Orbitron, monospace' }}>
                    Total: {totalWeeklyLoss.toFixed(1)} pts/week
                  </span>
                </div>
                <svg width="100%" viewBox={`0 0 640 ${Math.max(sortedByImpact.length * 44 + 20, 80)}`} style={{ display: 'block' }}>
                  {sortedByImpact.map((drain, i) => {
                    const impact = weeklyImpact(drain)
                    const barWidth = maxImpact > 0 ? (impact / maxImpact) * 440 : 0
                    const y = i * 44 + 10
                    const color = drain.status === 'eliminated' ? '#22c55e' : drain.status === 'managed' ? '#f59e0b' : drainSeverityColor(drain.drainLevel)
                    return (
                      <g key={drain.id}>
                        <text x="0" y={y + 16} fill="#94a3b8" fontSize="12" dominantBaseline="middle">
                          {drain.name.length > 18 ? drain.name.slice(0, 16) + '…' : drain.name}
                        </text>
                        <rect x="160" y={y + 4} width={barWidth} height={24} rx="4" fill={color} opacity={drain.status === 'eliminated' ? 0.5 : 0.9} />
                        <text x={164 + barWidth} y={y + 16} fill={color} fontSize="11" dominantBaseline="middle" dx="4">
                          {impact.toFixed(1)}
                        </text>
                        <text x="620" y={y + 16} fill={STATUS_CONFIG[drain.status].color} fontSize="10" dominantBaseline="middle" textAnchor="end">
                          {STATUS_CONFIG[drain.status].label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="game-card">
                <h3 style={{ margin: '0 0 1rem', color: '#f87171', fontSize: '0.95rem' }}>Top Drains by Type</h3>
                {(['person', 'situation', 'habit', 'environment', 'thought', 'obligation'] as DrainType[]).map(type => {
                  const count = drains.filter(d => d.type === type).length
                  const totalImpact = drains.filter(d => d.type === type).reduce((s, d) => s + weeklyImpact(d), 0)
                  if (count === 0) return null
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: TYPE_COLORS[type] }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{count} drains · {totalImpact.toFixed(1)} pts</span>
                    </div>
                  )
                })}
              </div>
              <div className="game-card">
                <h3 style={{ margin: '0 0 1rem', color: '#f87171', fontSize: '0.95rem' }}>Recovery Stats</h3>
                {drains.map(drain => {
                  const drainEvents = events.filter(e => e.drainId === drain.id)
                  if (drainEvents.length === 0) return null
                  const avgDelta = drainEvents.reduce((s, e) => s + (e.energyAfter - e.energyBefore), 0) / drainEvents.length
                  return (
                    <div key={drain.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{drain.name}</span>
                      <span style={{ fontSize: '0.8rem', color: avgDelta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        avg {avgDelta > 0 ? '+' : ''}{avgDelta.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
                {events.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Log encounters to see recovery stats.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.1rem' }}>Strategy Vault</h2>

            {drains.length === 0 ? (
              <div className="game-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Add drains with strategies to build your vault.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {drains.filter(d => d.strategy).map(drain => (
                  <div key={drain.id} className="game-card" style={{ borderLeft: `3px solid ${STATUS_CONFIG[drain.status].color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{drain.name}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${TYPE_COLORS[drain.type]}20`, color: TYPE_COLORS[drain.type] }}>{drain.type}</span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Level {drain.drainLevel}/10</span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: STATUS_CONFIG[drain.status].bg, color: STATUS_CONFIG[drain.status].color }}>{drain.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <Shield size={14} color="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.9rem', color: '#22c55e' }}>{drain.strategy}</span>
                        </div>
                        {drain.notes && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{drain.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {drains.filter(d => !d.strategy).length > 0 && (
                  <div className="game-card" style={{ background: 'rgba(220,38,38,0.05)' }}>
                    <p style={{ margin: 0, color: '#f87171', fontSize: '0.875rem', fontWeight: 600 }}>
                      {drains.filter(d => !d.strategy).length} drain(s) have no strategy yet:
                    </p>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {drains.filter(d => !d.strategy).map(d => <li key={d.id}>{d.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

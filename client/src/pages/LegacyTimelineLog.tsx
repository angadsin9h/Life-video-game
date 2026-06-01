import { useState, useEffect, useMemo } from 'react'
import { Star, Plus, Trash2, Save, ChevronDown, ChevronUp, Sparkles, Target, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LegacyEvent {
  id: string
  date: string
  loggedDate: string
  title: string
  description: string
  category: 'achievement' | 'turning-point' | 'relationship' | 'challenge-overcome' | 'skill-gained' | 'adventure' | 'contribution' | 'realization' | 'loss' | 'creation'
  impact: 1 | 2 | 3 | 4 | 5
  emotion: string
  lesson: string
  legacy: string
  photo: string
  starred: boolean
}

const STORAGE_KEY = 'legacy_timeline_log'

const CATEGORY_CONFIG: Record<LegacyEvent['category'], { label: string; emoji: string; color: string }> = {
  achievement:         { label: 'Achievement',       emoji: '🏆', color: '#fbbf24' },
  'turning-point':     { label: 'Turning Point',     emoji: '🔀', color: '#818cf8' },
  relationship:        { label: 'Relationship',      emoji: '💝', color: '#f472b6' },
  'challenge-overcome':{ label: 'Challenge',         emoji: '💪', color: '#f97316' },
  'skill-gained':      { label: 'Skill Gained',      emoji: '🎓', color: '#34d399' },
  adventure:           { label: 'Adventure',         emoji: '🗺️', color: '#60a5fa' },
  contribution:        { label: 'Contribution',      emoji: '🤝', color: '#4ade80' },
  realization:         { label: 'Realization',       emoji: '💡', color: '#fde047' },
  loss:                { label: 'Loss',              emoji: '🌑', color: '#94a3b8' },
  creation:            { label: 'Creation',          emoji: '🎨', color: '#c084fc' },
}

const PRESET_PHOTOS = ['🌟', '⭐', '🏔️', '🌊', '🌸', '🦋', '🔥', '💎']

const BLANK_FORM: Omit<LegacyEvent, 'id' | 'loggedDate'> = {
  date: '',
  title: '',
  description: '',
  category: 'achievement',
  impact: 3,
  emotion: '',
  lesson: '',
  legacy: '',
  photo: '🌟',
  starred: false,
}

export default function LegacyTimelineLog() {
  const { toastSuccess } = useToast()
  const [events, setEvents] = useState<LegacyEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LegacyEvent, 'id' | 'loggedDate'>>({ ...BLANK_FORM })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<LegacyEvent['category'] | 'all'>('all')

  useEffect(() => {
    try { setEvents(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: LegacyEvent[]) => {
    setEvents(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.title.trim() || !form.date) return
    const ev: LegacyEvent = {
      id: Date.now().toString(),
      loggedDate: new Date().toISOString().split('T')[0],
      ...form,
    }
    persist([ev, ...events])
    setForm({ ...BLANK_FORM })
    setShowForm(false)
    toastSuccess('Legacy event recorded! ✨')
  }

  // Filtered + sorted by date ascending for timeline (oldest first = bottom, newest = top)
  const filtered = useMemo(() => {
    const base = filterCategory === 'all' ? events : events.filter(e => e.category === filterCategory)
    return [...base].sort((a, b) => b.date.localeCompare(a.date))
  }, [events, filterCategory])

  // Life chapters (group by year)
  const chapters = useMemo(() => {
    const yearMap: Record<string, LegacyEvent[]> = {}
    const base = filterCategory === 'all' ? events : events.filter(e => e.category === filterCategory)
    base.forEach(e => {
      const yr = e.date.slice(0, 4)
      if (!yearMap[yr]) yearMap[yr] = []
      yearMap[yr].push(e)
    })
    return Object.entries(yearMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, evs]) => ({
        year,
        events: evs.sort((a, b) => b.date.localeCompare(a.date)),
      }))
  }, [events, filterCategory])

  // Stats
  const stats = useMemo(() => {
    const total = events.length
    const starred = events.filter(e => e.starred).length
    const catSet = new Set(events.map(e => e.category))
    const dates = events.map(e => e.date).sort()
    const earliest = dates[0]?.slice(0, 4) ?? '—'
    const latest = dates[dates.length - 1]?.slice(0, 4) ?? '—'
    return { total, starred, categoriesUsed: catSet.size, earliest, latest }
  }, [events])

  // Category distribution
  const catDist = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as LegacyEvent['category'][]).map(c => ({
      category: c,
      count: events.filter(e => e.category === c).length,
    })).sort((a, b) => b.count - a.count)
  }, [events])

  const maxCatCount = Math.max(...catDist.map(c => c.count), 1)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Legacy Timeline
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">The key events that define who you are becoming.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-500">Events</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{stats.starred}</div>
          <div className="text-xs text-slate-500">Milestones</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{stats.categoriesUsed}</div>
          <div className="text-xs text-slate-500">Categories</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.earliest}</div>
          <div className="text-xs text-slate-500">Earliest</div>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="text-sm font-semibold text-yellow-300">Record Legacy Event</h3>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Event Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What happened?"
                className="game-input w-full text-sm"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Tell the full story..."
              className="game-input w-full resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Category chips */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [LegacyEvent['category'], typeof CATEGORY_CONFIG.achievement][]).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, category: k }))}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={form.category === k
                    ? { background: c.color + '25', color: c.color, border: `1px solid ${c.color}60` }
                    : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Impact stars */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Impact (personal significance)</label>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as LegacyEvent['impact'][]).map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, impact: n }))}
                  className="text-2xl transition-all hover:scale-110"
                  style={{ opacity: n <= form.impact ? 1 : 0.25 }}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Emotion — what did you feel?</label>
            <input
              value={form.emotion}
              onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
              placeholder="e.g. proud, heartbroken, electrified, peaceful..."
              className="game-input w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Lesson</label>
              <textarea
                value={form.lesson}
                onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
                placeholder="What did this teach you?"
                className="game-input w-full resize-none text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Legacy</label>
              <textarea
                value={form.legacy}
                onChange={e => setForm(f => ({ ...f, legacy: e.target.value }))}
                placeholder="How did it shape who you are?"
                className="game-input w-full resize-none text-sm"
                rows={2}
              />
            </div>
          </div>

          {/* Emoji photo picker */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Photo Emoji</label>
            <div className="flex gap-2">
              {PRESET_PHOTOS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm(f => ({ ...f, photo: emoji }))}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                  style={form.photo === emoji ? { background: '#fbbf2430', border: '2px solid #fbbf2460' } : { background: '#1e293b', border: '2px solid transparent' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Star toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={() => setForm(f => ({ ...f, starred: !f.starred }))}
              className="text-2xl transition-all hover:scale-110"
              style={{ opacity: form.starred ? 1 : 0.3 }}
            >
              ⭐
            </button>
            <span className="text-sm text-slate-400">Mark as milestone event</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!form.title.trim() || !form.date}
              className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Event
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...BLANK_FORM }) }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${filterCategory === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}
        >
          All
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [LegacyEvent['category'], typeof CATEGORY_CONFIG.achievement][]).map(([k, c]) => (
          <button
            key={k}
            onClick={() => setFilterCategory(k)}
            className="px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all"
            style={filterCategory === k
              ? { background: c.color + '25', color: c.color, border: `1px solid ${c.color}50` }
              : { background: '#1e293b', color: '#64748b' }}
          >
            {c.emoji}
          </button>
        ))}
      </div>

      {/* Timeline by life chapters */}
      {chapters.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Your legacy timeline is empty.</p>
          <p className="text-sm">Record the moments that made you who you are.</p>
        </div>
      )}

      {chapters.map(({ year, events: chapterEvents }) => (
        <div key={year} className="space-y-0">
          {/* Year header */}
          <div className="flex items-center gap-3 py-3">
            <div className="h-px flex-1 bg-slate-700" />
            <div className="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-sm font-bold text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
              {year}
              <span className="text-xs text-slate-500 font-normal">{chapterEvents.length} event{chapterEvents.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Timeline events */}
          <div className="relative space-y-4 pl-8">
            {/* vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-700" />

            {chapterEvents.map((e, idx) => {
              const cc = CATEGORY_CONFIG[e.category]
              const isExp = expanded === e.id
              const isStarred = e.starred
              const side = idx % 2 === 0

              return (
                <div key={e.id} className="relative">
                  {/* dot */}
                  <div
                    className="absolute -left-5 top-4 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center"
                    style={{ background: isStarred ? '#fbbf24' : cc.color }}
                  >
                    {isStarred && <span style={{ fontSize: '8px' }}>★</span>}
                  </div>

                  <div
                    className={`game-card overflow-hidden transition-all ${isStarred ? 'border-yellow-500/30' : ''}`}
                    style={isStarred ? { boxShadow: '0 0 15px rgba(251,191,36,0.12)' } : {}}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpanded(isExp ? null : e.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Photo emoji */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: cc.color + '20' }}
                        >
                          {e.photo}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {isStarred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                            <span className="font-semibold text-white text-sm">{e.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">{e.date}</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: cc.color + '20', color: cc.color }}
                            >
                              {cc.emoji} {cc.label}
                            </span>
                            <span className="text-xs text-yellow-400">
                              {'★'.repeat(e.impact)}{'☆'.repeat(5 - e.impact)}
                            </span>
                          </div>
                          {e.emotion && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{e.emotion}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                          <button
                            onClick={ev => { ev.stopPropagation(); persist(events.filter(x => x.id !== e.id)) }}
                            className="p-1 text-slate-700 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExp && (
                      <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-3">
                        {e.description && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Story</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{e.description}</p>
                          </div>
                        )}
                        {e.lesson && (
                          <div>
                            <p className="text-xs text-blue-400 uppercase font-medium mb-1">Lesson</p>
                            <p className="text-sm text-blue-200">{e.lesson}</p>
                          </div>
                        )}
                        {e.legacy && (
                          <div>
                            <p className="text-xs text-yellow-500 uppercase font-medium mb-1">Legacy</p>
                            <p className="text-sm text-yellow-200">{e.legacy}</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-600">Logged: {e.loggedDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Category distribution */}
      {events.length > 0 && (
        <div className="game-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-yellow-400" /> Category Distribution
          </h2>
          <div className="space-y-2">
            {catDist.filter(c => c.count > 0).map(c => {
              const cc = CATEGORY_CONFIG[c.category]
              const pct = Math.round((c.count / maxCatCount) * 100)
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="w-5 text-center">{cc.emoji}</span>
                  <span className="text-xs text-slate-400 w-28 truncate">{cc.label}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: cc.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">{c.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Trash2, Edit2, Check, Globe,
  BarChart3, ChevronLeft, ChevronRight, X, Save,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── Types ──────────────────────────────────────────────────────────────────

type Platform = 'Blog' | 'YouTube' | 'Twitter/X' | 'Instagram' | 'LinkedIn' | 'TikTok' | 'Newsletter' | 'Podcast' | 'Other'
type ContentType = 'Tutorial' | 'Story' | 'Opinion' | 'Review' | 'How-To' | 'Announcement' | 'Other'
type ContentStatus = 'Idea' | 'Draft' | 'Filming' | 'Editing' | 'Scheduled' | 'Published'

interface ContentItem {
  id: string
  title: string
  platform: Platform
  contentType: ContentType
  scheduledDate: string
  status: ContentStatus
  notes: string
  createdAt: string
  publishedAt?: string
}

type ViewMode = 'calendar' | 'list' | 'kanban'

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'content_calendar'

const PLATFORMS: Platform[] = ['Blog', 'YouTube', 'Twitter/X', 'Instagram', 'LinkedIn', 'TikTok', 'Newsletter', 'Podcast', 'Other']
const CONTENT_TYPES: ContentType[] = ['Tutorial', 'Story', 'Opinion', 'Review', 'How-To', 'Announcement', 'Other']
const STATUSES: ContentStatus[] = ['Idea', 'Draft', 'Filming', 'Editing', 'Scheduled', 'Published']

const STATUS_GROUPS: { label: string; statuses: ContentStatus[] }[] = [
  { label: 'Idea', statuses: ['Idea'] },
  { label: 'Draft', statuses: ['Draft'] },
  { label: 'In Progress', statuses: ['Filming', 'Editing', 'Scheduled'] },
  { label: 'Published', statuses: ['Published'] },
]

const STATUS_COLORS: Record<ContentStatus, string> = {
  Idea:      'bg-slate-600 text-slate-200',
  Draft:     'bg-blue-900/60 text-blue-300 border border-blue-700/40',
  Filming:   'bg-orange-900/60 text-orange-300 border border-orange-700/40',
  Editing:   'bg-yellow-900/60 text-yellow-300 border border-yellow-700/40',
  Scheduled: 'bg-violet-900/60 text-violet-300 border border-violet-700/40',
  Published: 'bg-green-900/60 text-green-300 border border-green-700/40',
}

const PLATFORM_COLORS: Record<Platform, string> = {
  Blog:        '#f97316',
  YouTube:     '#ef4444',
  'Twitter/X': '#38bdf8',
  Instagram:   '#ec4899',
  LinkedIn:    '#3b82f6',
  TikTok:      '#a855f7',
  Newsletter:  '#10b981',
  Podcast:     '#f59e0b',
  Other:       '#94a3b8',
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function avgDaysToPublish(items: ContentItem[]): number {
  const published = items.filter(i => i.status === 'Published' && i.publishedAt)
  if (published.length === 0) return 0
  const total = published.reduce((sum, i) => {
    const created = new Date(i.createdAt).getTime()
    const pub = new Date(i.publishedAt!).getTime()
    return sum + (pub - created) / 86400000
  }, 0)
  return Math.round(total / published.length)
}

function getStatusNextStep(status: ContentStatus): ContentStatus | null {
  const order: ContentStatus[] = ['Idea', 'Draft', 'Filming', 'Editing', 'Scheduled', 'Published']
  const idx = order.indexOf(status)
  return idx < order.length - 1 ? order[idx + 1] : null
}

// ── Blank form ─────────────────────────────────────────────────────────────

const BLANK_FORM = {
  title: '',
  platform: 'Blog' as Platform,
  contentType: 'Tutorial' as ContentType,
  scheduledDate: todayStr(),
  status: 'Idea' as ContentStatus,
  notes: '',
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ContentCalendar() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<ContentItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'All'>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /**/ }
  }, [])

  const persist = (updated: ContentItem[]) => {
    setItems(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // ── Form helpers ──

  const openAdd = () => {
    setForm({ ...BLANK_FORM })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (item: ContentItem) => {
    setForm({
      title: item.title,
      platform: item.platform,
      contentType: item.contentType,
      scheduledDate: item.scheduledDate,
      status: item.status,
      notes: item.notes,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const submitForm = () => {
    if (!form.title.trim()) return
    if (editingId) {
      const wasPublished = items.find(i => i.id === editingId)?.status === 'Published'
      const nowPublished = form.status === 'Published'
      const updated = items.map(i =>
        i.id === editingId
          ? {
              ...i,
              ...form,
              title: form.title.trim(),
              publishedAt: nowPublished && !wasPublished ? todayStr() : i.publishedAt,
            }
          : i
      )
      persist(updated)
      toastSuccess('Content item updated!')
    } else {
      const newItem: ContentItem = {
        id: uid(),
        title: form.title.trim(),
        platform: form.platform,
        contentType: form.contentType,
        scheduledDate: form.scheduledDate,
        status: form.status,
        notes: form.notes,
        createdAt: todayStr(),
        publishedAt: form.status === 'Published' ? todayStr() : undefined,
      }
      persist([...items, newItem])
      toastSuccess('Content item added!')
    }
    closeForm()
  }

  const deleteItem = (id: string) => {
    persist(items.filter(i => i.id !== id))
    toastSuccess('Content item deleted.')
  }

  const advanceStatus = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const next = getStatusNextStep(item.status)
    if (!next) return
    const updated = items.map(i =>
      i.id === id
        ? { ...i, status: next, publishedAt: next === 'Published' ? todayStr() : i.publishedAt }
        : i
    )
    persist(updated)
    toastSuccess(`Moved to ${next}!`)
  }

  // ── Filtered items ──

  const filtered = platformFilter === 'All'
    ? items
    : items.filter(i => i.platform === platformFilter)

  const sortedByDate = [...filtered].sort(
    (a, b) => a.scheduledDate.localeCompare(b.scheduledDate)
  )

  // ── Stats ──

  const thisMonth = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
  const thisMonthCount = items.filter(
    i => i.status === 'Published' && i.scheduledDate.startsWith(thisMonth)
  ).length
  const publishedCount = items.filter(i => i.status === 'Published').length
  const avgDays = avgDaysToPublish(items)

  // ── Calendar grid ──

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfWeek(calYear, calMonth)
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (calDays.length % 7 !== 0) calDays.push(null)

  const dayKey = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const itemsForDay = (day: number) =>
    filtered.filter(i => i.scheduledDate === dayKey(day))

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }
  const goToday = () => {
    setCalYear(new Date().getFullYear())
    setCalMonth(new Date().getMonth())
  }

  // ── Kanban grouping ──

  const kanbanGroups = STATUS_GROUPS.map(group => ({
    ...group,
    items: filtered.filter(i => group.statuses.includes(i.status))
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
  }))

  const todayFull = todayStr()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Calendar className="w-7 h-7 text-violet-400" />
            Content Calendar
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Plan, track, and publish your content.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-600"
          >
            <BarChart3 className="w-4 h-4" /> Stats
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Content
          </button>
        </div>
      </div>

      {/* Stats panel */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: items.length, color: 'text-violet-400' },
            { label: 'Published', value: publishedCount, color: 'text-green-400' },
            { label: 'This Month', value: thisMonthCount, color: 'text-cyan-400' },
            { label: 'Avg Days to Publish', value: avgDays > 0 ? `${avgDays}d` : '—', color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="game-card p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                {s.value}
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls: view toggle + platform filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          {(['calendar', 'list', 'kanban'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Platform filter */}
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...PLATFORMS] as (Platform | 'All')[]).map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                platformFilter === p
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <div className="game-card p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-lg">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                onClick={goToday}
                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
              >
                Today
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[80px]" />
              }
              const dk = dayKey(day)
              const dayItems = itemsForDay(day)
              const isToday = dk === todayFull
              const isExpanded = expandedDay === dk
              return (
                <div
                  key={dk}
                  className={`min-h-[80px] rounded-lg p-1.5 border transition-colors cursor-pointer ${
                    isToday
                      ? 'border-violet-500/60 bg-violet-900/10'
                      : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/30'
                  }`}
                  onClick={() => setExpandedDay(isExpanded ? null : dk)}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {(isExpanded ? dayItems : dayItems.slice(0, 2)).map(item => (
                      <div
                        key={item.id}
                        className="rounded px-1 py-0.5 text-[10px] font-medium truncate"
                        style={{
                          backgroundColor: PLATFORM_COLORS[item.platform] + '33',
                          color: PLATFORM_COLORS[item.platform],
                          borderLeft: `2px solid ${PLATFORM_COLORS[item.platform]}`,
                        }}
                        title={`${item.title} — ${item.platform}`}
                      >
                        {item.title}
                      </div>
                    ))}
                    {!isExpanded && dayItems.length > 2 && (
                      <div className="text-[10px] text-slate-500 pl-1">+{dayItems.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Expanded day detail */}
          {expandedDay && (() => {
            const dayItems = filtered.filter(i => i.scheduledDate === expandedDay)
            if (dayItems.length === 0) return null
            return (
              <div className="mt-4 border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  {expandedDay} — {dayItems.length} item{dayItems.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                  {dayItems.map(item => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onEdit={openEdit}
                      onDelete={deleteItem}
                      onAdvance={advanceStatus}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {sortedByDate.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            sortedByDate.map(item => (
              <ContentCard
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={deleteItem}
                onAdvance={advanceStatus}
              />
            ))
          )}
        </div>
      )}

      {/* ── Kanban View ── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanGroups.map(group => (
            <div key={group.label} className="game-card p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300">{group.label}</h3>
                <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map(item => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    onAdvance={advanceStatus}
                  />
                ))}
                {group.items.length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-slate-700 rounded-lg">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="game-card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Content' : 'Add Content'}
              </h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                <input
                  className="game-input w-full text-sm"
                  placeholder="Content title…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                  <select
                    className="game-input w-full text-sm"
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Content Type</label>
                  <select
                    className="game-input w-full text-sm"
                    value={form.contentType}
                    onChange={e => setForm(f => ({ ...f, contentType: e.target.value as ContentType }))}
                  >
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    className="game-input w-full text-sm"
                    value={form.scheduledDate}
                    onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                  <select
                    className="game-input w-full text-sm"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentStatus }))}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  className="game-input w-full text-sm resize-none"
                  rows={3}
                  placeholder="Any notes or ideas…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submitForm}
                disabled={!form.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex-1 justify-center"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Add Item'}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface CardProps {
  item: ContentItem
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onAdvance: (id: string) => void
}

function ContentCard({ item, onEdit, onDelete, onAdvance }: CardProps) {
  const next = getStatusNextStep(item.status)
  return (
    <div className="game-card p-3 flex items-start gap-3">
      {/* Platform color bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{item.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: PLATFORM_COLORS[item.platform] + '33',
                  color: PLATFORM_COLORS[item.platform],
                }}
              >
                <Globe className="w-2.5 h-2.5 inline mr-0.5" />
                {item.platform}
              </span>
              <span className="text-[10px] text-slate-500">{item.contentType}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[item.status]}`}>
                {item.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <Calendar className="w-3 h-3 inline mr-0.5" />
              {item.scheduledDate}
            </p>
            {item.notes && (
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {next && (
              <button
                onClick={() => onAdvance(item.id)}
                title={`Move to ${next}`}
                className="p-1.5 bg-slate-700 hover:bg-violet-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanCard({ item, onEdit, onDelete, onAdvance }: CardProps) {
  const next = getStatusNextStep(item.status)
  return (
    <div className="bg-slate-750 border border-slate-700 rounded-lg p-2.5 space-y-1.5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold text-slate-200 leading-snug flex-1">{item.title}</p>
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: PLATFORM_COLORS[item.platform] + '33',
            color: PLATFORM_COLORS[item.platform],
          }}
        >
          {item.platform}
        </span>
        <span className="text-[10px] text-slate-500">{item.scheduledDate}</span>
      </div>
      {next && (
        <button
          onClick={() => onAdvance(item.id)}
          className="w-full text-[10px] py-1 bg-slate-700 hover:bg-violet-700 rounded text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <Check className="w-2.5 h-2.5" /> Move to {next}
        </button>
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="game-card p-12 flex flex-col items-center justify-center text-center gap-3">
      <Calendar className="w-10 h-10 text-slate-600" />
      <p className="text-slate-400 font-medium">No content items yet</p>
      <p className="text-slate-600 text-sm">Start planning your content output.</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors mt-1"
      >
        <Plus className="w-4 h-4" /> Add First Item
      </button>
    </div>
  )
}

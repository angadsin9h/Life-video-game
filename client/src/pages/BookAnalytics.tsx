import { useEffect, useState } from 'react'
import axios from 'axios'
import { BookOpen, TrendingUp, Star, Calendar, Trophy, Clock } from 'lucide-react'

interface Book {
  id: number
  title: string
  author: string
  status: 'reading' | 'completed' | 'want' | 'abandoned'
  rating?: number
  genre?: string
  pages?: number
  current_page?: number
  start_date?: string
  finish_date?: string
  notes?: string
}

const GENRE_COLORS: Record<string, string> = {
  fiction: '#8b5cf6',
  nonfiction: '#3b82f6',
  biography: '#f97316',
  self_help: '#22c55e',
  science: '#14b8a6',
  history: '#eab308',
  philosophy: '#ec4899',
  business: '#94a3b8',
  other: '#64748b',
}

export default function BookAnalytics() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/books').then(r => {
      setBooks(r.data as Book[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const completed = books.filter(b => b.status === 'completed')
  const reading = books.filter(b => b.status === 'reading')
  const wantToRead = books.filter(b => b.status === 'want')
  const avgRating = completed.filter(b => b.rating).length > 0
    ? (completed.filter(b => b.rating).reduce((s, b) => s + (b.rating || 0), 0) / completed.filter(b => b.rating).length).toFixed(1)
    : '—'
  const totalPages = completed.filter(b => b.pages).reduce((s, b) => s + (b.pages || 0), 0)

  // Monthly reading (books finished per month — last 12)
  const monthlyFinished: Record<string, number> = {}
  for (const b of completed) {
    if (b.finish_date) {
      const m = b.finish_date.slice(0, 7)
      monthlyFinished[m] = (monthlyFinished[m] || 0) + 1
    }
  }
  const months: { label: string; key: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    months.push({ key, count: monthlyFinished[key] || 0, label: d.toLocaleDateString('en', { month: 'short' }) })
  }
  const maxMonthBooks = Math.max(...months.map(m => m.count), 1)

  // Books per year
  const thisYear = new Date().getFullYear()
  const thisYearCount = completed.filter(b => b.finish_date?.startsWith(String(thisYear))).length
  const lastYearCount = completed.filter(b => b.finish_date?.startsWith(String(thisYear - 1))).length

  // Genre breakdown
  const byGenre: Record<string, number> = {}
  for (const b of completed) {
    const g = b.genre || 'other'
    byGenre[g] = (byGenre[g] || 0) + 1
  }
  const genreList = Object.entries(byGenre).sort((a, b) => b[1] - a[1])

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map(r => ({
    rating: r,
    count: completed.filter(b => Math.round(b.rating || 0) === r).length,
  }))
  const maxRatingCount = Math.max(...ratingDist.map(r => r.count), 1)

  // Currently reading progress
  const inProgress = reading.filter(b => b.pages && b.current_page)

  // Reading speed estimate (avg days per book)
  const booksWithDates = completed.filter(b => b.start_date && b.finish_date)
  const avgDays = booksWithDates.length > 0
    ? Math.round(booksWithDates.reduce((s, b) => {
        const start = new Date(b.start_date!).getTime()
        const end = new Date(b.finish_date!).getTime()
        return s + (end - start) / 86400000
      }, 0) / booksWithDates.length)
    : 0

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <BookOpen className="w-7 h-7 text-violet-400" />
          Book Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Your reading journey at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Books Read', value: completed.length, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-yellow-400' },
          { label: 'Pages Read', value: totalPages > 1000 ? `${(totalPages / 1000).toFixed(1)}k` : totalPages, icon: Clock, color: 'text-blue-400' },
          { label: `${thisYear} Books`, value: thisYearCount, icon: Trophy, color: 'text-green-400' },
        ].map(t => (
          <div key={t.label} className="game-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span className="text-xs text-slate-400">{t.label}</span>
            </div>
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Year comparison */}
      {lastYearCount > 0 && (
        <div className="game-card p-3 flex items-center justify-between">
          <span className="text-sm text-slate-400">vs {thisYear - 1}</span>
          <div className={`text-sm font-bold ${thisYearCount >= lastYearCount ? 'text-green-400' : 'text-slate-400'}`}>
            {thisYear}: {thisYearCount} books · {thisYear - 1}: {lastYearCount} books
            {thisYearCount > lastYearCount && ` · +${thisYearCount - lastYearCount} more!`}
          </div>
        </div>
      )}

      {/* Currently reading */}
      {reading.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Currently Reading</h3>
          <div className="space-y-3">
            {reading.map(b => {
              const pct = b.pages && b.current_page ? Math.round((b.current_page / b.pages) * 100) : 0
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 truncate flex-1 mr-2">{b.title}</span>
                    <span className="text-slate-500 flex-shrink-0">{pct > 0 ? `${pct}%` : 'started'}</span>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">{b.author}</div>
                  {pct > 0 && (
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Books Finished (12 months)
        </h3>
        <div className="flex items-end gap-1.5 h-24">
          {months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              {m.count > 0 && <div className="text-[10px] text-slate-500">{m.count}</div>}
              <div className="w-full rounded-t-sm bg-violet-500/70"
                style={{ height: `${(m.count / maxMonthBooks) * 80}%`, minHeight: m.count > 0 ? '4px' : '2px', opacity: m.count > 0 ? 1 : 0.2 }} />
              <div className="text-[10px] text-slate-600">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre breakdown */}
      {genreList.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Genre</h3>
          <div className="space-y-2">
            {genreList.map(([genre, count]) => (
              <div key={genre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{genre.replace('_', ' ')}</span>
                  <span className="text-slate-500">{count} {count === 1 ? 'book' : 'books'}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / completed.length) * 100}%`, background: GENRE_COLORS[genre] || '#64748b' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {completed.filter(b => b.rating).length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Rating Distribution</h3>
          <div className="flex items-end gap-2 h-20">
            {ratingDist.reverse().map(r => (
              <div key={r.rating} className="flex-1 flex flex-col items-center gap-1">
                {r.count > 0 && <div className="text-[10px] text-slate-500">{r.count}</div>}
                <div className="w-full rounded-t-sm bg-yellow-500/70"
                  style={{ height: `${(r.count / maxRatingCount) * 70}%`, minHeight: r.count > 0 ? '4px' : '2px', opacity: r.count > 0 ? 1 : 0.1 }} />
                <div className="text-[10px] text-slate-500">{'★'.repeat(r.rating)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-slate-300">{wantToRead.length}</div>
          <div className="text-xs text-slate-500">Want to Read</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-slate-300">{avgDays > 0 ? `${avgDays}d` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Days/Book</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-slate-300">{books.length}</div>
          <div className="text-xs text-slate-500">Total in Library</div>
        </div>
      </div>

      {books.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No books tracked yet. Add some in the Books page.</p>
        </div>
      )}
    </div>
  )
}

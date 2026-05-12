import { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Heart, AlertCircle, Calendar, TrendingUp, Gift } from 'lucide-react'

interface Relationship {
  id: number
  name: string
  type: string
  contact_frequency: number
  last_contact?: string
  birthday?: string
  notes?: string
  daysSince?: number
  overdueDays?: number
  isBirthdayUpcoming?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  family: '#ec4899',
  friend: '#3b82f6',
  partner: '#ef4444',
  colleague: '#eab308',
  mentor: '#8b5cf6',
  acquaintance: '#94a3b8',
  other: '#64748b',
}

const FREQ_LABELS: Record<number, string> = {
  1: 'Daily', 3: 'Every 3 days', 7: 'Weekly', 14: 'Biweekly',
  30: 'Monthly', 60: 'Every 2 months', 90: 'Quarterly', 180: 'Every 6 months', 365: 'Yearly',
}

export default function RelationshipAnalytics() {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/relationships').then(r => {
      setRelationships(r.data as Relationship[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const overdue = relationships.filter(r => r.overdueDays && r.overdueDays > 0)
    .sort((a, b) => (b.overdueDays || 0) - (a.overdueDays || 0))
  const upcomingBirthdays = relationships.filter(r => r.isBirthdayUpcoming)
  const healthy = relationships.filter(r => !r.overdueDays || r.overdueDays <= 0)

  // By type breakdown
  const byType: Record<string, number> = {}
  for (const r of relationships) {
    const t = r.type || 'other'
    byType[t] = (byType[t] || 0) + 1
  }
  const typeList = Object.entries(byType).sort((a, b) => b[1] - a[1])

  // Health score (% of relationships not overdue)
  const healthScore = relationships.length > 0
    ? Math.round((healthy.length / relationships.length) * 100)
    : 0

  // Contact frequency distribution
  const freqGroups: Record<string, number> = {}
  for (const r of relationships) {
    const label = FREQ_LABELS[r.contact_frequency] || `Every ${r.contact_frequency}d`
    freqGroups[label] = (freqGroups[label] || 0) + 1
  }

  // Days since last contact distribution
  const daysSinceBuckets = { '0-7': 0, '8-30': 0, '31-90': 0, '90+': 0 }
  for (const r of relationships) {
    const d = r.daysSince || 0
    if (d <= 7) daysSinceBuckets['0-7']++
    else if (d <= 30) daysSinceBuckets['8-30']++
    else if (d <= 90) daysSinceBuckets['31-90']++
    else daysSinceBuckets['90+']++
  }

  // Next month birthdays
  const now = new Date()
  const upcomingBdayDetails = relationships
    .filter(r => r.birthday)
    .map(r => {
      const bday = new Date(now.getFullYear() + '-' + r.birthday!.slice(5))
      if (bday < now) bday.setFullYear(bday.getFullYear() + 1)
      const daysUntil = Math.ceil((bday.getTime() - now.getTime()) / 86400000)
      return { ...r, daysUntil, bdayStr: r.birthday!.slice(5) }
    })
    .filter(r => r.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Users className="w-7 h-7 text-pink-400" />
          Relationship Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Stay connected with the people who matter</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total People', value: relationships.length, icon: Users, color: 'text-pink-400' },
          { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-red-400' },
          { label: 'Healthy', value: healthy.length, icon: Heart, color: 'text-green-400' },
          { label: 'Health Score', value: `${healthScore}%`, icon: TrendingUp, color: 'text-teal-400' },
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

      {/* Health meter */}
      <div className="game-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Relationship Health</span>
          <span className={`font-bold ${healthScore >= 80 ? 'text-green-400' : healthScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {healthScore}%
          </span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${healthScore}%`,
              background: healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#eab308' : '#ef4444',
            }} />
        </div>
        <div className="text-xs text-slate-600 mt-1">
          {healthScore >= 80 ? 'Excellent — most relationships are well-maintained' :
           healthScore >= 60 ? 'Good — a few people need attention' :
           'Needs work — many relationships overdue'}
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="game-card p-4 border border-red-500/20 bg-red-900/5">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Overdue Contacts ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[r.type] || '#94a3b8' }} />
                  <span className="text-sm text-slate-300">{r.name}</span>
                  <span className="text-xs text-slate-600 capitalize">{r.type}</span>
                </div>
                <span className="text-sm font-medium text-red-400">{r.overdueDays}d overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming birthdays */}
      {upcomingBdayDetails.length > 0 && (
        <div className="game-card p-4 border border-pink-500/20 bg-pink-900/5">
          <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Upcoming Birthdays
          </h3>
          <div className="space-y-2">
            {upcomingBdayDetails.map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎂</span>
                  <div>
                    <span className="text-sm text-slate-300">{r.name}</span>
                    <div className="text-xs text-slate-600">{r.bdayStr}</div>
                  </div>
                </div>
                <span className={`text-sm font-medium ${r.daysUntil <= 7 ? 'text-pink-400' : r.daysUntil <= 14 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {r.daysUntil === 0 ? 'Today!' : `in ${r.daysUntil}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By type */}
      {typeList.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">By Type</h3>
          <div className="space-y-2">
            {typeList.map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{type}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / relationships.length) * 100}%`, background: TYPE_COLORS[type] || '#64748b' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact recency */}
      {relationships.some(r => r.daysSince !== undefined) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Contact Recency
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(daysSinceBuckets).map(([bucket, count]) => (
              <div key={bucket} className="text-center p-3 bg-slate-800 rounded-lg">
                <div className="text-xl font-bold text-white">{count}</div>
                <div className="text-xs text-slate-500 mt-0.5">{bucket} days</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {relationships.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No relationships tracked yet. Add some in the Relationships page.</p>
        </div>
      )}
    </div>
  )
}

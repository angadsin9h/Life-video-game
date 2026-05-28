import { useEffect, useState } from 'react'
import axios from 'axios'
import { Brain, Loader2, RefreshCw, BookOpen, Lightbulb, TrendingUp, Heart } from 'lucide-react'

interface JournalEntry {
  id: number
  date: string
  content: string
  mood: number | null
  created_at: string
}

interface InsightSection {
  title: string
  icon: React.ElementType
  color: string
  content: string[]
}

const ANALYSIS_PROMPTS = [
  'themes and recurring topics',
  'emotional patterns and mood trends',
  'personal growth and progress',
  'challenges and concerns',
  'gratitude and positive experiences',
]

export default function JournalInsights() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wordFreq, setWordFreq] = useState<Array<{ word: string; count: number }>>([])
  const [moodTrend, setMoodTrend] = useState<Array<{ date: string; mood: number }>>([])

  useEffect(() => {
    axios.get<JournalEntry[]>('/api/journal?limit=30')
      .then(res => {
        const data = res.data
        setEntries(data)

        // Local analysis: word frequency
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'i', 'me', 'my', 'was', 'is', 'are', 'were', 'it', 'this', 'that', 'have', 'had', 'be', 'been', 'do', 'did', 'not', 'so', 'as', 'we', 'you', 'he', 'she', 'they', 'his', 'her', 'its', 'our', 'your', 'their'])
        const freq: Record<string, number> = {}
        data.forEach(e => {
          e.content.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
            if (w.length > 3 && !stopWords.has(w)) freq[w] = (freq[w] || 0) + 1
          })
        })
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20)
        setWordFreq(sorted.map(([word, count]) => ({ word, count })))

        // Mood trend
        const moods = data.filter(e => e.mood !== null).map(e => ({ date: e.date, mood: e.mood! })).slice(0, 14).reverse()
        setMoodTrend(moods)
      })
      .finally(() => setFetching(false))
  }, [])

  const generateInsights = async () => {
    if (entries.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const recentEntries = entries.slice(0, 15).map(e =>
        `[${e.date}] ${e.content.slice(0, 300)}`
      ).join('\n\n')

      const prompt = `Analyze these journal entries and provide brief insights on: ${ANALYSIS_PROMPTS.join(', ')}.

Journal entries:
${recentEntries}

Respond with a structured analysis in this format:
**Key Themes:** [2-3 sentences]
**Emotional Patterns:** [2-3 sentences]
**Growth Areas:** [2-3 sentences]
**Positive Highlights:** [1-2 sentences]
**Suggestions:** [2-3 actionable suggestions]`

      const res = await axios.post<{ reply: string }>('/api/ai/chat', {
        message: prompt,
        messages: [],
      })
      setInsights(res.data.reply)
    } catch (err) {
      setError('Could not generate insights. Make sure the AI is configured.')
    } finally {
      setLoading(false)
    }
  }

  const parseInsights = (text: string): InsightSection[] => {
    const sections: InsightSection[] = []
    const lines = text.split('\n')
    const sectionMap: Record<string, InsightSection> = {
      'Key Themes': { title: 'Key Themes', icon: BookOpen, color: 'text-violet-400', content: [] },
      'Emotional Patterns': { title: 'Emotional Patterns', icon: Heart, color: 'text-pink-400', content: [] },
      'Growth Areas': { title: 'Growth Areas', icon: TrendingUp, color: 'text-green-400', content: [] },
      'Positive Highlights': { title: 'Positive Highlights', icon: Lightbulb, color: 'text-yellow-400', content: [] },
      'Suggestions': { title: 'Suggestions', icon: Brain, color: 'text-cyan-400', content: [] },
    }

    let current: InsightSection | null = null
    for (const line of lines) {
      const headerMatch = line.match(/\*\*(.+?):\*\*\s*(.*)/)
      if (headerMatch) {
        const [, key, content] = headerMatch
        if (sectionMap[key]) {
          current = sectionMap[key]
          if (content.trim()) current.content.push(content.trim())
        }
      } else if (current && line.trim()) {
        current.content.push(line.trim())
      }
    }

    Object.values(sectionMap).forEach(s => {
      if (s.content.length > 0) sections.push(s)
    })
    return sections.length > 0 ? sections : [{ title: 'Analysis', icon: Brain, color: 'text-violet-400', content: [text] }]
  }

  if (fetching) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const maxWordCount = wordFreq[0]?.count || 1

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Journal Insights
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {entries.length} entries analyzed
          </p>
        </div>
        <button onClick={generateInsights} disabled={loading || entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Analyzing…' : 'Generate Insights'}
        </button>
      </div>

      {/* Mood trend */}
      {moodTrend.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Mood Trend (14 days)</h3>
          <div className="flex items-end gap-1 h-14">
            {moodTrend.map(m => {
              const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4']
              return (
                <div key={m.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm"
                    style={{ height: `${(m.mood / 5) * 48}px`, backgroundColor: colors[m.mood] || '#334155' }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-600">{moodTrend[0]?.date}</span>
            <span className="text-xs text-slate-600">{moodTrend[moodTrend.length - 1]?.date}</span>
          </div>
          <div className="text-xs text-slate-600 text-center mt-1">
            Avg mood: {(moodTrend.reduce((s, m) => s + m.mood, 0) / moodTrend.length).toFixed(1)}/5
          </div>
        </div>
      )}

      {/* Word cloud */}
      {wordFreq.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Most Used Words</h3>
          <div className="flex flex-wrap gap-2">
            {wordFreq.map(({ word, count }) => {
              const size = 0.7 + (count / maxWordCount) * 0.8
              const opacity = 0.4 + (count / maxWordCount) * 0.6
              return (
                <span key={word}
                  className="text-violet-400 font-semibold cursor-default transition-all hover:text-white"
                  style={{ fontSize: `${size}rem`, opacity }}>
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {error && (
        <div className="game-card p-4 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {insights ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Analysis</h3>
          {parseInsights(insights).map((section, i) => {
            const Icon = section.icon
            return (
              <div key={i} className="game-card p-4">
                <div className={`flex items-center gap-2 mb-2 font-semibold text-sm ${section.color}`}>
                  <Icon className="w-4 h-4" />
                  {section.title}
                </div>
                {section.content.map((line, j) => (
                  <p key={j} className="text-slate-300 text-sm leading-relaxed">{line}</p>
                ))}
              </div>
            )
          })}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No journal entries yet</p>
          <p className="text-xs mt-1">Start journaling to unlock insights</p>
        </div>
      ) : (
        <div className="game-card p-6 text-center border border-violet-500/20">
          <Brain className="w-12 h-12 text-violet-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 text-sm">Click "Generate Insights" to analyze your journal with AI</p>
          <p className="text-xs text-slate-600 mt-1">Analyzes your last {Math.min(15, entries.length)} entries</p>
        </div>
      )}
    </div>
  )
}

import { useState, useRef } from 'react'
import {
  Download, Upload, Share2, Link, ExternalLink,
  BarChart3, CheckCircle2, AlertCircle, Globe, FileText
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { DIMS } from '../hooks/useLifeData'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id?: string
  date?: string
  createdAt?: string
  [key: string]: unknown
}

interface ImportResult {
  entries: number
  dimensions: number
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function safeParseArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function getAllKnownKeys(): string[] {
  return Array.from(new Set(DIMS.map(d => d.key)))
}

function getAllLocalStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    try {
      const raw = localStorage.getItem(key)
      if (raw) data[key] = JSON.parse(raw)
    } catch {
      // skip non-JSON
    }
  }
  return data
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

interface StorageStats {
  totalEntries: number
  storageKB: number
  oldestDate: string | null
  healthPercent: number
}

function computeStats(): StorageStats {
  const keys = getAllKnownKeys()
  let totalEntries = 0
  let oldestDate: string | null = null
  let dimensionsWithData = 0

  keys.forEach(key => {
    const entries = safeParseArray<LogEntry>(key)
    if (entries.length > 0) {
      totalEntries += entries.length
      dimensionsWithData++
      entries.forEach(e => {
        const d = (e.date ?? e.createdAt ?? '') as string
        if (d && (!oldestDate || d < oldestDate)) {
          oldestDate = d.split('T')[0]
        }
      })
    }
  })

  let storageKB = 0
  try {
    storageKB = Math.round(JSON.stringify(getAllLocalStorageData()).length / 1024)
  } catch {
    storageKB = 0
  }

  const healthPercent = Math.round((dimensionsWithData / keys.length) * 100)

  return { totalEntries, storageKB, oldestDate, healthPercent }
}

// ─── Integration tile config ──────────────────────────────────────────────────

type TileStatus = 'export' | 'coming-soon' | 'share' | 'guide'

interface IntegrationTile {
  emoji: string
  name: string
  description: string
  status: TileStatus
  statusLabel: string
}

const INTEGRATIONS: IntegrationTile[] = [
  { emoji: '📱', name: 'Apple Health',         description: 'Sync sleep, steps, heart rate',         status: 'export',      statusLabel: 'Export Available'  },
  { emoji: '🤖', name: 'Google Fit',           description: 'Sync workouts and activity',             status: 'export',      statusLabel: 'Export Available'  },
  { emoji: '📓', name: 'Notion',               description: 'Export journal entries to Notion',       status: 'coming-soon', statusLabel: 'Coming Soon'       },
  { emoji: '📊', name: 'Google Sheets',        description: 'Export scores to Sheets',                status: 'export',      statusLabel: 'Export Available'  },
  { emoji: '🎵', name: 'Spotify',              description: 'Track music and mood correlation',       status: 'coming-soon', statusLabel: 'Coming Soon'       },
  { emoji: '💬', name: 'WhatsApp',             description: 'Share daily summary',                    status: 'share',       statusLabel: 'Share Available'   },
  { emoji: '🌙', name: 'Oura / WHOOP',         description: 'Import sleep data',                      status: 'guide',       statusLabel: 'Manual Import'     },
  { emoji: '📲', name: 'iOS Shortcuts',        description: 'Automate data entry via shortcuts',      status: 'guide',       statusLabel: 'Guide Available'   },
]

// ─── iOS Shortcuts guide ──────────────────────────────────────────────────────

const SHORTCUTS_GUIDE = [
  'Open the iOS Shortcuts app on your iPhone.',
  'Tap "+" to create a new shortcut.',
  'Add a "Text" action and paste your daily summary template.',
  'Add a "URL" action pointing to your LifeQuest web URL.',
  'Add an "Open URLs" action to open the app.',
  'Use "Set Variable" to store today\'s date for prefilling log entries.',
  'Add the shortcut to your home screen for one-tap access.',
  'Optionally use "Automation" to trigger the shortcut every morning.',
]

const OURA_GUIDE = [
  'In the Oura / WHOOP app, navigate to your sleep data export section.',
  'Export as CSV for the date range you want to import.',
  'Use the "Import Data" section above and upload the exported JSON (convert CSV to JSON first if needed).',
  'The import will merge your sleep entries with existing data, avoiding duplicates.',
  'For ongoing sync, export weekly and re-import — duplicate protection keeps data clean.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: TileStatus; label: string }) {
  const styles: Record<TileStatus, string> = {
    export:       'bg-green-500/20 text-green-300 border-green-500/30',
    'coming-soon':'bg-slate-600/50 text-slate-400 border-slate-500/30',
    share:        'bg-blue-500/20 text-blue-300 border-blue-500/30',
    guide:        'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DataHub() {
  const { toastSuccess } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showGuide, setShowGuide] = useState<string | null>(null)
  const stats = computeStats()

  // ── Export All JSON ──────────────────────────────────────────────────────────
  function handleExportJSON() {
    const data = getAllLocalStorageData()
    const json = JSON.stringify(data, null, 2)
    triggerDownload(json, `lifequest-backup-${todayStr()}.json`, 'application/json')
    toastSuccess('Backup exported', 'All data saved as JSON')
  }

  // ── Export CSV Summary ────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows: string[] = ['Date,Dimension,Score,Notes']
    const keys = getAllKnownKeys()
    const seen = new Set<string>()

    keys.forEach(key => {
      const dim = DIMS.find(d => d.key === key)
      if (!dim || seen.has(key)) return
      seen.add(key)

      const entries = safeParseArray<LogEntry>(key)
      entries.forEach(e => {
        const date = ((e.date ?? e.createdAt ?? '') as string).split('T')[0]
        const score = (e[dim.scoreField as string] ?? '') as string | number
        const notes = ((e.notes ?? e.note ?? e.reflection ?? '') as string).replace(/,/g, ';').replace(/\n/g, ' ')
        rows.push(`${date},${dim.label},${score},"${notes}"`)
      })
    })

    triggerDownload(rows.join('\n'), `lifequest-scores-${todayStr()}.csv`, 'text/csv')
    toastSuccess('CSV exported', 'Scores exported as CSV')
  }

  // ── Export Today ─────────────────────────────────────────────────────────────
  function handleExportToday() {
    const today = todayStr()
    const todayData: Record<string, LogEntry[]> = {}
    const keys = getAllKnownKeys()
    const seen = new Set<string>()

    keys.forEach(key => {
      if (seen.has(key)) return
      seen.add(key)
      const entries = safeParseArray<LogEntry>(key)
      const todayEntries = entries.filter(e => {
        const d = (e.date ?? e.createdAt ?? '') as string
        return d.startsWith(today)
      })
      if (todayEntries.length > 0) todayData[key] = todayEntries
    })

    const json = JSON.stringify(todayData, null, 2)
    triggerDownload(json, `lifequest-today-${today}.json`, 'application/json')
    toastSuccess("Today's data exported")
  }

  // ── Import ────────────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string
        const parsed: unknown = JSON.parse(text)
        if (typeof parsed !== 'object' || parsed === null) {
          toastSuccess('Import failed — invalid JSON structure')
          return
        }

        let totalImported = 0
        let dimensionsImported = 0
        const incoming = parsed as Record<string, unknown>

        Object.entries(incoming).forEach(([key, value]) => {
          if (!Array.isArray(value)) return
          const existing = safeParseArray<LogEntry>(key)
          const existingIds = new Set(existing.map(e => e.id ?? `${e.date ?? ''}__${e.createdAt ?? ''}`))

          const newEntries: LogEntry[] = []
          ;(value as LogEntry[]).forEach(entry => {
            const entryId = entry.id ?? `${entry.date ?? ''}__${entry.createdAt ?? ''}`
            if (!existingIds.has(entryId)) {
              newEntries.push(entry)
            }
          })

          if (newEntries.length > 0) {
            localStorage.setItem(key, JSON.stringify([...existing, ...newEntries]))
            totalImported += newEntries.length
            dimensionsImported++
          }
        })

        setImportResult({ entries: totalImported, dimensions: dimensionsImported })
        toastSuccess(`Imported ${totalImported} entries across ${dimensionsImported} dimensions`)
      } catch {
        toastSuccess('Import failed — could not parse file')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  // ── Share summary ─────────────────────────────────────────────────────────────
  async function handleShare() {
    const text = `LifeQuest Daily Summary — ${todayStr()}\nTotal entries: ${stats.totalEntries}\nStorage: ${stats.storageKB} KB\nData health: ${stats.healthPercent}%`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'LifeQuest Summary', text })
        toastSuccess('Shared successfully')
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        toastSuccess('Copied to clipboard')
      } catch {
        toastSuccess('Share not available')
      }
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Data Hub</h1>
        <p className="text-slate-400 text-sm">Export, import, and connect your LifeQuest data to other platforms.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <BarChart3 className="w-4 h-4 text-violet-400" />, label: 'Total Entries',   value: stats.totalEntries.toString()        },
          { icon: <FileText  className="w-4 h-4 text-blue-400"   />, label: 'Storage Used',    value: `${stats.storageKB} KB`              },
          { icon: <Globe     className="w-4 h-4 text-green-400"  />, label: 'Oldest Entry',    value: stats.oldestDate ?? '—'              },
          { icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />, label: 'Data Health',   value: `${stats.healthPercent}%`            },
        ].map(({ icon, label, value }) => (
          <div key={label} className="game-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {icon}
              <span>{label}</span>
            </div>
            <span className="text-lg font-bold text-slate-100 font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div className="game-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Download className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-slate-100">Export Data</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Export All JSON */}
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-start gap-2 p-4 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-violet-500/50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Export All Data (JSON)</p>
              <p className="text-xs text-slate-400 mt-0.5">Full backup of all logs</p>
            </div>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex flex-col items-start gap-2 p-4 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-green-500/50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Export as CSV (Summary)</p>
              <p className="text-xs text-slate-400 mt-0.5">Date, Dimension, Score, Notes</p>
            </div>
          </button>

          {/* Export Today */}
          <button
            onClick={handleExportToday}
            className="flex flex-col items-start gap-2 p-4 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-amber-500/50 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Export Today's Entry</p>
              <p className="text-xs text-slate-400 mt-0.5">Just today's logs as JSON</p>
            </div>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="game-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Upload className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-slate-100">Import Data</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Upload a previously exported JSON file. New entries will be merged — no duplicates will be created.
        </p>

        <div
          className="border-2 border-dashed border-slate-600 hover:border-blue-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Click to choose a <span className="text-blue-400">.json</span> file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {importResult && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-200 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Imported <strong>{importResult.entries}</strong> entries across{' '}
              <strong>{importResult.dimensions}</strong> dimensions.
            </span>
          </div>
        )}
      </div>

      {/* Connected Apps */}
      <div className="game-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link className="w-5 h-5 text-green-400" />
          <h2 className="text-base font-semibold text-slate-100">Connected Apps</h2>
          <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Integrations</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {INTEGRATIONS.map(tile => (
            <div
              key={tile.name}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-700/60 border border-slate-600 hover:border-slate-500 transition-all"
            >
              {/* Emoji logo */}
              <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center text-xl shrink-0">
                {tile.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-200">{tile.name}</span>
                  <StatusBadge status={tile.status} label={tile.statusLabel} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 mb-2">{tile.description}</p>

                {/* Action button */}
                {tile.status === 'export' && (
                  <button
                    onClick={tile.name === 'Google Sheets' ? handleExportCSV : handleExportJSON}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export to {tile.name.split(' ')[0]}
                  </button>
                )}

                {tile.status === 'share' && (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    Share Summary
                  </button>
                )}

                {tile.status === 'guide' && (
                  <button
                    onClick={() => setShowGuide(showGuide === tile.name ? null : tile.name)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {showGuide === tile.name ? 'Hide Guide' : 'View Guide'}
                  </button>
                )}

                {tile.status === 'coming-soon' && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <AlertCircle className="w-3 h-3" />
                    Integration coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Inline guide panels */}
        {showGuide === 'iOS Shortcuts' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-medium text-amber-200 mb-3">iOS Shortcuts — Step-by-step</p>
            <ol className="space-y-2">
              {SHORTCUTS_GUIDE.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-amber-100">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center shrink-0 font-bold text-amber-300">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {showGuide === 'Oura / WHOOP' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-medium text-amber-200 mb-3">Oura / WHOOP — Manual Import Guide</p>
            <ol className="space-y-2">
              {OURA_GUIDE.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-amber-100">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center shrink-0 font-bold text-amber-300">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

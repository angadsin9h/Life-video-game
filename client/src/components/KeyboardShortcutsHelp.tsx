import { X, Keyboard } from 'lucide-react'
import { SHORTCUT_LABELS } from '../hooks/useKeyboardShortcuts'

interface Props {
  show: boolean
  onClose: () => void
  pendingKey: string | null
}

export default function KeyboardShortcutsHelp({ show, onClose, pendingKey }: Props) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {pendingKey && (
          <div className="mb-4 px-3 py-2 bg-violet-600/20 border border-violet-500/40 rounded-lg text-sm text-violet-300">
            Waiting for second key… (press a letter or Escape to cancel)
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {SHORTCUT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
              <span className="text-slate-300 text-sm">{label}</span>
              <div className="flex items-center gap-1">
                {key.split(' ').map((k, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-600 border border-slate-500 rounded text-xs font-mono text-slate-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs">?</kbd> to toggle this panel · <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs">Esc</kbd> to close
        </p>
      </div>
    </div>
  )
}

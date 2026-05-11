import { useState } from 'react'
import { Plus, X, Zap, RefreshCw, Target, BookOpen, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const QUICK_ACTIONS = [
  { icon: <Zap className="w-4 h-4" />, label: 'Log Tasks', route: '/log', color: 'bg-violet-600 hover:bg-violet-500' },
  { icon: <Clock className="w-4 h-4" />, label: 'Focus Timer', route: '/timer', color: 'bg-cyan-600 hover:bg-cyan-500' },
  { icon: <RefreshCw className="w-4 h-4" />, label: 'Habits', route: '/habits', color: 'bg-green-600 hover:bg-green-500' },
  { icon: <Target className="w-4 h-4" />, label: 'Goals', route: '/goals', color: 'bg-orange-600 hover:bg-orange-500' },
  { icon: <BookOpen className="w-4 h-4" />, label: 'Journal', route: '/journal', color: 'bg-blue-600 hover:bg-blue-500' },
]

export default function QuickLogFAB() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const go = (route: string) => {
    navigate(route)
    setOpen(false)
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <>
          <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
          {QUICK_ACTIONS.map((action, i) => (
            <div
              key={action.route}
              className="flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap shadow">
                {action.label}
              </span>
              <button
                onClick={() => go(action.route)}
                className={`w-10 h-10 rounded-full text-white shadow-lg transition-all ${action.color} flex items-center justify-center`}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-slate-700 rotate-45' : 'bg-violet-600 hover:bg-violet-500 hover:scale-110'
        } text-white`}
        aria-label="Quick actions"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  )
}

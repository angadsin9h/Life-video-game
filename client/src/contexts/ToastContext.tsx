import { createContext, useContext, useState, useCallback, ReactNode, JSX } from 'react'
import { CheckCircle, AlertCircle, Info, Star, Zap } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'xp' | 'achievement'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  xp?: number
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void
  toastXP: (xp: number, label?: string) => void
  toastSuccess: (title: string, message?: string) => void
  toastError: (title: string, message?: string) => void
  toastAchievement: (name: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + nextId++
    setToasts(prev => [...prev, { ...toast, id }])
    const duration = toast.type === 'xp' ? 2500 : toast.type === 'achievement' ? 5000 : 3500
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const toastXP = useCallback((xp: number, label = 'Tasks logged') => {
    addToast({ type: 'xp', title: label, xp })
  }, [addToast])

  const toastSuccess = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const toastError = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const toastAchievement = useCallback((name: string) => {
    addToast({ type: 'achievement', title: 'Achievement Unlocked!', message: name })
  }, [addToast])

  const ICONS: Record<ToastType, JSX.Element> = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    xp: <Zap className="w-5 h-5 text-yellow-400" />,
    achievement: <Star className="w-5 h-5 text-yellow-400" />,
  }

  const BG: Record<ToastType, string> = {
    success: 'bg-slate-800 border-green-500/40',
    error: 'bg-slate-800 border-red-500/40',
    info: 'bg-slate-800 border-blue-500/40',
    xp: 'bg-slate-800 border-yellow-500/40',
    achievement: 'bg-slate-800 border-yellow-500/60 shadow-yellow-500/20 shadow-lg',
  }

  return (
    <ToastContext.Provider value={{ addToast, toastXP, toastSuccess, toastError, toastAchievement }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '320px' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${BG[toast.type]} animate-slide-in-right pointer-events-auto`}
          >
            <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-200 text-sm">{toast.title}</div>
              {toast.message && <div className="text-xs text-slate-400 mt-0.5">{toast.message}</div>}
              {toast.xp !== undefined && (
                <div className="text-sm font-bold text-yellow-400 mt-0.5" style={{ fontFamily: 'Orbitron, monospace' }}>
                  +{toast.xp} XP
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

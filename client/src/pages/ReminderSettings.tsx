import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, Clock, Moon, Sun, Zap, Star, RefreshCw, Plus, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Reminder {
  id: string
  label: string
  time: string       // "HH:MM" 24h
  enabled: boolean
  url: string
  emoji: string
}

const STORAGE_KEY = 'lifequest_reminders'

const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'morning', label: 'Morning Powerup',   time: '07:00', enabled: false, url: '/morning-powerup',  emoji: '🌅' },
  { id: 'midday',  label: 'Midday Check-In',   time: '12:30', enabled: false, url: '/daily-driver',     emoji: '⚡' },
  { id: 'evening', label: 'Nightly Debrief',   time: '21:00', enabled: false, url: '/nightly-debrief',  emoji: '🌙' },
  { id: 'sleep',   label: 'Sleep Log',          time: '22:30', enabled: false, url: '/mindful-sleep',    emoji: '💤' },
]

function msUntil(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

function scheduleReminder(r: Reminder, swReg: ServiceWorkerRegistration) {
  const delay = msUntil(r.time)
  swReg.active?.postMessage({
    type: 'SCHEDULE_REMINDER',
    title: `LifeQuest – ${r.emoji} ${r.label}`,
    body: 'Time to level up. Tap to log now.',
    url: r.url,
    delay,
  })
}

export default function ReminderSettings() {
  const { toastSuccess } = useToast()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [swReady, setSwReady] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newTime, setNewTime] = useState('08:00')
  const [newEmoji, setNewEmoji] = useState('⭐')

  useEffect(() => {
    // Load saved reminders
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      setReminders(saved ?? DEFAULT_REMINDERS)
    } catch {
      setReminders(DEFAULT_REMINDERS)
    }

    // Check notification permission
    if ('Notification' in window) setPermission(Notification.permission)

    // Check SW registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwReady(true))
    }
  }, [])

  function save(updated: Reminder[]) {
    setReminders(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  async function requestPermission() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') toastSuccess('Notifications enabled! Reminders will fire at your set times.')
  }

  async function toggleReminder(id: string) {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    save(updated)

    const r = updated.find(x => x.id === id)
    if (!r) return

    if (r.enabled && permission === 'granted' && swReady) {
      const swReg = await navigator.serviceWorker.ready
      scheduleReminder(r, swReg)
      toastSuccess(`${r.emoji} ${r.label} reminder set for ${r.time}`)
    }
  }

  async function scheduleAll() {
    if (permission !== 'granted') {
      await requestPermission()
      return
    }
    const swReg = await navigator.serviceWorker.ready
    const active = reminders.filter(r => r.enabled)
    active.forEach(r => scheduleReminder(r, swReg))
    toastSuccess(`${active.length} reminders scheduled for today!`)
  }

  function addCustom() {
    if (!newLabel.trim()) return
    const r: Reminder = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      time: newTime,
      enabled: true,
      url: '/command-center',
      emoji: newEmoji,
    }
    save([...reminders, r])
    setNewLabel('')
    setNewTime('08:00')
    setAdding(false)
    toastSuccess(`${r.emoji} ${r.label} reminder added`)
  }

  function remove(id: string) {
    save(reminders.filter(r => r.id !== id))
  }

  const enabledCount = reminders.filter(r => r.enabled).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}>
          <Bell className="w-7 h-7 text-violet-400" />
          Daily Reminders
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Never miss a log. Set push notifications for your most important check-ins.
        </p>
      </div>

      {/* Permission card */}
      {permission !== 'granted' ? (
        <div className="game-card p-4 border border-violet-500/30">
          <div className="flex items-start gap-3">
            <BellOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Notifications are {permission === 'denied' ? 'blocked' : 'not enabled'}</p>
              {permission === 'denied' ? (
                <p className="text-xs text-slate-500 mt-1">
                  Go to your browser settings → Notifications → allow for this site to enable reminders.
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mt-1">Enable push notifications to get daily reminders to log your life dimensions.</p>
                  <button onClick={requestPermission}
                    className="mt-3 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    Enable Notifications
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="game-card p-3 flex items-center gap-3">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400 font-semibold">Notifications enabled</span>
          <span className="text-xs text-slate-500 ml-auto">{enabledCount} active</span>
        </div>
      )}

      {/* Schedule all */}
      {permission === 'granted' && enabledCount > 0 && (
        <button onClick={scheduleAll}
          className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <RefreshCw className="w-4 h-4" />
          Schedule Today's {enabledCount} Reminder{enabledCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Reminders list */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 uppercase tracking-widest px-1">Your Reminders</div>
        {reminders.map(r => (
          <div key={r.id} className={`game-card p-4 flex items-center gap-3 transition-all ${r.enabled ? 'border-violet-500/30' : 'opacity-60'}`}>
            <span className="text-2xl flex-shrink-0">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{r.label}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-500">{r.time}</span>
              </div>
            </div>
            <button onClick={() => remove(r.id)} className="p-1 text-slate-700 hover:text-slate-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => toggleReminder(r.id)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${r.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Add custom */}
      {adding ? (
        <div className="game-card p-4 space-y-3 border border-violet-500/20">
          <div className="text-sm font-semibold text-white">New Reminder</div>
          <div className="flex gap-2">
            <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
              className="game-input w-14 text-center text-xl" maxLength={2} />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Workout log)"
              className="game-input flex-1 text-sm" />
          </div>
          <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={addCustom}
              className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Add Reminder
            </button>
            <button onClick={() => setAdding(false)}
              className="px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 hover:border-violet-500/40 hover:text-violet-400 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Custom Reminder
        </button>
      )}

      {/* Install PWA */}
      <div className="game-card p-4 border border-slate-700">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Install as App</div>
        <p className="text-sm text-slate-400 mb-3">
          Add LifeQuest to your home screen for instant access — no browser chrome, works offline.
        </p>
        <div className="space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-base">📱</span>
            <span><strong className="text-slate-400">iPhone/iPad:</strong> Tap Share → Add to Home Screen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <span><strong className="text-slate-400">Android:</strong> Tap ⋮ menu → Install App / Add to Home Screen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💻</span>
            <span><strong className="text-slate-400">Desktop Chrome:</strong> Click the install icon in the address bar</span>
          </div>
        </div>
      </div>

      {/* Quick reminder presets */}
      <div className="game-card p-4">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Suggested Schedule</div>
        <div className="space-y-1.5 text-xs text-slate-400">
          {[
            { t: '07:00', e: '🌅', l: 'Morning Powerup — start with intention' },
            { t: '12:30', e: '⚡', l: 'Midday energy check — stay on track' },
            { t: '17:00', e: '🎯', l: 'Afternoon review — course-correct if needed' },
            { t: '21:00', e: '🌙', l: 'Nightly Debrief — close the day with reflection' },
            { t: '22:30', e: '💤', l: 'Sleep log — track your rest quality' },
          ].map(({ t, e, l }) => (
            <div key={t} className="flex items-center gap-2.5">
              <span className="text-slate-600 font-mono w-10 flex-shrink-0">{t}</span>
              <span>{e}</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-700 pb-2">
        <Star className="w-3.5 h-3.5" />
        <span>Consistent logging compounds — every entry is data that makes you better.</span>
      </div>
    </div>
  )
}

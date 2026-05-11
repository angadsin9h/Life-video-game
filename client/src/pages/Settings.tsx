import { useEffect, useState } from 'react'
import axios from 'axios'
import { Settings as SettingsIcon, User, Palette, Target, Volume2, VolumeX, Check, Save, Download } from 'lucide-react'

interface UserSettings {
  username: string
  avatar: string
  dailyGoal: string
  accentColor: string
  showClassBanner: string
  soundEnabled: string
}

const AVATAR_EMOJIS = [
  '⚔️','🧙','🏹','🛡️','🔥','⚡','🌙','☀️','🦁','🐉',
  '🦅','🐺','🌊','🏔️','🌿','🧊','💎','👑','🚀','🌌',
  '🎯','⚙️','🔮','🪄','💫','🧬','🎭','🦋','🌸','🍀',
]

const ACCENT_COLORS = [
  { name: 'violet', label: 'Violet', class: 'bg-violet-500', text: 'text-violet-400' },
  { name: 'cyan',   label: 'Cyan',   class: 'bg-cyan-500',   text: 'text-cyan-400'   },
  { name: 'green',  label: 'Green',  class: 'bg-green-500',  text: 'text-green-400'  },
  { name: 'orange', label: 'Orange', class: 'bg-orange-500', text: 'text-orange-400' },
  { name: 'red',    label: 'Red',    class: 'bg-red-500',    text: 'text-red-400'    },
  { name: 'pink',   label: 'Pink',   class: 'bg-pink-500',   text: 'text-pink-400'   },
]

const DAILY_GOALS = [50, 75, 100, 125, 150]

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    username: 'Hero',
    avatar: '⚔️',
    dailyGoal: '100',
    accentColor: 'violet',
    showClassBanner: 'true',
    soundEnabled: 'true',
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<UserSettings>('/api/settings').then(r => {
      setSettings(r.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    await axios.put('/api/settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = (key: keyof UserSettings, value: string) =>
    setSettings(s => ({ ...s, [key]: value }))

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <SettingsIcon className="w-8 h-8 text-violet-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Personalize your LifeQuest experience</p>
      </div>

      {/* Identity */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Identity
        </h3>

        {/* Preview card */}
        <div className="bg-slate-800 rounded-xl p-4 mb-5 flex items-center gap-4 border border-slate-700">
          <div className="w-16 h-16 rounded-xl bg-slate-700 border-2 border-violet-500/50 flex items-center justify-center text-4xl">
            {settings.avatar}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Hero Name</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {settings.username || 'Hero'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Display Name</label>
            <input
              type="text"
              className="game-input w-full"
              maxLength={24}
              value={settings.username}
              onChange={e => update('username', e.target.value)}
              placeholder="Enter your hero name"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">Avatar</label>
            <div className="grid grid-cols-10 gap-1.5">
              {AVATAR_EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => update('avatar', em)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${
                    settings.avatar === em
                      ? 'bg-violet-600/40 border-2 border-violet-500 scale-110'
                      : 'bg-slate-700 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Display */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Goals & Display
        </h3>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Daily Score Goal</label>
            <div className="flex gap-2 flex-wrap">
              {DAILY_GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => update('dailyGoal', String(g))}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.dailyGoal === String(g)
                      ? 'bg-green-600 text-white border border-green-500'
                      : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {g} pts
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Daily score goal affects the XP bar on your dashboard (max score is always 100).
            </p>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">Show Class Banner on Dashboard</label>
            <button
              onClick={() => update('showClassBanner', settings.showClassBanner === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showClassBanner === 'true' ? 'bg-violet-600' : 'bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                settings.showClassBanner === 'true' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-400" />
          Accent Color
        </h3>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map(c => (
            <button
              key={c.name}
              onClick={() => update('accentColor', c.name)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                settings.accentColor === c.name
                  ? 'border-white/40 bg-slate-700'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${c.class}`} />
              <span className={`text-sm font-medium ${settings.accentColor === c.name ? c.text : 'text-slate-400'}`}>
                {c.label}
              </span>
              {settings.accentColor === c.name && <Check className="w-3 h-3 text-white" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Full theme switching coming soon — this saves your preference.</p>
      </div>

      {/* Sound */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          {settings.soundEnabled === 'true'
            ? <Volume2 className="w-5 h-5 text-yellow-400" />
            : <VolumeX className="w-5 h-5 text-slate-500" />}
          Sound
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300">Timer completion sound</div>
            <div className="text-xs text-slate-500">Play a chime when a focus session ends</div>
          </div>
          <button
            onClick={() => update('soundEnabled', settings.soundEnabled === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.soundEnabled === 'true' ? 'bg-yellow-600' : 'bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              settings.soundEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Data export */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          Data
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300">Export all data</div>
            <div className="text-xs text-slate-500">Download logs, habits, goals, journal and more as JSON</div>
          </div>
          <a
            href="/api/settings/export"
            download="lifequest-export.json"
            className="game-btn-secondary text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </a>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
          saved ? 'bg-green-600 border border-green-500' : 'bg-violet-600 hover:bg-violet-500 border border-violet-500'
        }`}
      >
        {saved ? <><Check className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Settings</>}
      </button>
    </div>
  )
}

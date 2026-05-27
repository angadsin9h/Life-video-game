import { useState } from 'react'
import { LogOut, Cloud, CloudOff, RefreshCw, User, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { SYNC_KEYS } from '../contexts/SyncContext'

const STATUS_CONFIG = {
  idle:    { label: 'Up to date',   color: 'text-slate-400', icon: <Cloud className="w-4 h-4" /> },
  syncing: { label: 'Syncing…',     color: 'text-blue-400',  icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  saved:   { label: 'Saved to cloud', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  error:   { label: 'Sync error',   color: 'text-red-400',   icon: <AlertCircle className="w-4 h-4" /> },
  offline: { label: 'Offline',      color: 'text-yellow-400', icon: <CloudOff className="w-4 h-4" /> },
}

function storageStats() {
  let total = 0
  let synced = 0
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key)
    if (val) { synced++; total += val.length }
  }
  return { synced, total: Math.round(total / 1024 * 10) / 10 }
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const { syncStatus, lastSynced, forcePush, forcePull } = useSync()
  const [signingOut, setSigningOut] = useState(false)
  const stats = storageStats()
  const cfg = STATUS_CONFIG[syncStatus]

  async function handleLogout() {
    setSigningOut(true)
    await logout()
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
          Account
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and cloud sync</p>
      </div>

      {/* Profile card */}
      <div className="game-card p-5 flex items-center gap-4">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'User'}
            className="w-16 h-16 rounded-full border-2 border-violet-500/50"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-900 flex items-center justify-center">
            <User className="w-8 h-8 text-violet-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-white truncate">
            {user.displayName ?? 'LifeQuest Player'}
          </div>
          <div className="text-sm text-slate-400 truncate">{user.email}</div>
          <div className="text-xs text-slate-500 mt-1">
            Member since {user.metadata.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'Unknown'}
          </div>
        </div>
      </div>

      {/* Sync status */}
      <div className="game-card p-5 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-400" />
          Cloud Sync
        </h2>

        <div className={`flex items-center gap-2 text-sm font-medium ${cfg.color}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </div>

        {lastSynced && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            Last synced {lastSynced.toLocaleTimeString()}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Database className="w-3.5 h-3.5" />
          {stats.synced} logs synced · {stats.total} KB local data
        </div>

        <div className="flex gap-3">
          <button
            onClick={forcePush}
            disabled={syncStatus === 'syncing'}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Push to cloud
          </button>
          <button
            onClick={forcePull}
            disabled={syncStatus === 'syncing'}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Pull from cloud
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Data auto-syncs whenever you log anything. Use "Pull from cloud" to restore data on a new device.
        </p>
      </div>

      {/* Sign out */}
      <div className="game-card p-5">
        <h2 className="font-semibold text-white mb-3">Sign Out</h2>
        <p className="text-sm text-slate-400 mb-4">
          Your data stays in the cloud and will be restored next time you sign in.
        </p>
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/40 text-red-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

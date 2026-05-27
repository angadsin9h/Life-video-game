import { useState } from 'react'
import { Zap, Shield, Star, TrendingUp, Heart, Brain } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed'
      if (!msg.includes('popup-closed')) setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-violet-600 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-violet-900/50">
            ⚔️
          </div>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            LifeQuest
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Level up your life — one day at a time
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <TrendingUp className="w-5 h-5 text-green-400" />, label: 'Track Progress' },
            { icon: <Brain className="w-5 h-5 text-cyan-400" />, label: '80+ Life Tools' },
            { icon: <Heart className="w-5 h-5 text-pink-400" />, label: 'Cloud Sync' },
          ].map(f => (
            <div key={f.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">{f.icon}</div>
              <div className="text-xs text-slate-400">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Sign-in card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1">Get Started</h2>
          <p className="text-slate-400 text-sm mb-6">
            Sign in with Google to sync your data across all your devices. Your progress is automatically saved to the cloud.
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            By signing in, you agree to store your life data securely in Firestore.
            Only you can access your data.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500">
          {[
            { icon: <Shield className="w-3.5 h-3.5 text-green-500" />, text: 'Private & secure' },
            { icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, text: 'Free forever' },
            { icon: <Zap className="w-3.5 h-3.5 text-violet-400" />, text: 'Works offline' },
          ].map(s => (
            <div key={s.text} className="flex items-center gap-1">
              {s.icon}
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

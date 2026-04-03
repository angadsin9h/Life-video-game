import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, BarChart3, Bot, Target, Gamepad2 } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/log', icon: ClipboardList, label: 'Log Tasks' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { to: '/goals', icon: Target, label: 'Goals' },
]

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700 flex-col z-50">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <Gamepad2 className="text-violet-400 w-7 h-7" />
          <span className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            LifeQuest
          </span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">Level up your life ⚔️</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-violet-400' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

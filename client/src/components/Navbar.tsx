import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, BarChart3, Bot, Target,
  Gamepad2, Trophy, RefreshCw, Sword, BookOpen, Calendar, FileText,
  Timer, User, Settings, Zap, Scroll, Medal, Swords, Brain, Heart, Keyboard, Search,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Daily',
    items: [
      { to: '/',           icon: LayoutDashboard, label: 'Dashboard'   },
      { to: '/log',        icon: ClipboardList,   label: 'Log Tasks'   },
      { to: '/timer',      icon: Timer,           label: 'Focus Timer' },
      { to: '/quests',     icon: Scroll,          label: 'Quests'      },
      { to: '/mood',       icon: Heart,           label: 'Mood'        },
    ],
  },
  {
    label: 'RPG',
    items: [
      { to: '/profile',      icon: User,  label: 'Profile'      },
      { to: '/skills',       icon: Zap,   label: 'Skill Tree'   },
      { to: '/milestones',   icon: Medal, label: 'Milestones'   },
      { to: '/achievements', icon: Trophy, label: 'Achievements'},
      { to: '/boss',         icon: Sword, label: 'Boss Battle'  },
      { to: '/challenges',   icon: Swords,label: 'Challenges'   },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/habits',   icon: RefreshCw, label: 'Habits'    },
      { to: '/goals',    icon: Target,    label: 'Goals'     },
      { to: '/journal',  icon: BookOpen,  label: 'Journal'   },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/progress',  icon: BarChart3, label: 'Progress'  },
      { to: '/weekly',    icon: FileText,  label: 'Weekly'    },
      { to: '/activity',  icon: Calendar,  label: 'Activity'  },
      { to: '/insights',  icon: Brain,     label: 'Insights'  },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/ai-coach', icon: Bot,      label: 'AI Coach' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const mobileItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Home'    },
  { to: '/log',        icon: ClipboardList,   label: 'Log'     },
  { to: '/timer',      icon: Timer,           label: 'Timer'   },
  { to: '/boss',       icon: Sword,           label: 'Boss'    },
  { to: '/profile',    icon: User,            label: 'Profile' },
]

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-slate-900 border-r border-slate-700 flex-col z-50">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700">
          <Gamepad2 className="text-violet-400 w-6 h-6" />
          <span className="text-lg font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            LifeQuest
          </span>
        </div>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          className="mx-3 mt-2 mb-1 flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] bg-slate-700 px-1 rounded">⌘K</kbd>
        </button>

        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-1">
              <div className="px-4 pt-3 pb-1">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                  {group.label}
                </span>
              </div>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-600">Level up your life ⚔️</p>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50">
        <div className="flex justify-around py-2">
          {mobileItems.map(({ to, icon: Icon, label }) => (
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

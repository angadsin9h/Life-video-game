import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, BarChart3, Bot, Target,
  Gamepad2, Trophy, RefreshCw, Sword, BookOpen, Calendar, FileText,
  Timer, User, Users, Settings, Zap, Scroll, Medal, Swords, Brain, Heart, Keyboard, Search, StickyNote, Star, Activity, CalendarDays, Sparkles, Flag, Wind, Moon, TrendingUp, Dumbbell, Sun, Apple, Clock, Flame, GraduationCap, Headphones, Droplets, FolderOpen, Layers, Shield, AlertCircle, Network, PiggyBank, ListChecks, Presentation, FlaskConical, List,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Daily',
    items: [
      { to: '/',           icon: LayoutDashboard, label: 'Dashboard'   },
      { to: '/life-os',    icon: Zap,             label: 'Life OS'     },
      { to: '/productivity', icon: Zap,           label: 'Productivity'},
      { to: '/checkin',    icon: Sparkles,        label: 'Check In'    },
      { to: '/briefing',   icon: Sun,             label: 'Briefing'    },
      { to: '/morning-pages', icon: Sun,          label: 'Morning Pages'},
      { to: '/winddown',   icon: Moon,            label: 'Wind Down'   },
      { to: '/nightly-review', icon: Moon,        label: 'Nightly Review'},
      { to: '/power-hour', icon: Zap,             label: 'Power Hour'  },
      { to: '/daily-check-in', icon: Zap,         label: 'Day Check-In' },
      { to: '/log',        icon: ClipboardList,   label: 'Log Tasks'   },
      { to: '/taskboard',  icon: Zap,             label: 'Task Board'  },
      { to: '/routines',   icon: RefreshCw,       label: 'Routines'    },
      { to: '/timer',      icon: Timer,           label: 'Focus Timer' },
      { to: '/pomodoro',   icon: Timer,           label: 'Pomodoro'    },
      { to: '/time-blocking', icon: Clock,        label: 'Time Blocks' },
      { to: '/ambient',    icon: Headphones,      label: 'Focus Sounds'},
      { to: '/focus-log',  icon: Zap,             label: 'Focus Log'   },
      { to: '/focus-stats', icon: TrendingUp,     label: 'Focus Stats' },
      { to: '/deep-work',   icon: Clock,          label: 'Deep Work'   },
      { to: '/quests',     icon: Scroll,          label: 'Quests'      },
      { to: '/mood',       icon: Heart,           label: 'Mood'        },
      { to: '/emotions',   icon: Heart,           label: 'Emotions'    },
      { to: '/anxiety-journal', icon: Brain,      label: 'Anxiety Log' },
      { to: '/stress',     icon: AlertCircle,     label: 'Stress Log'  },
      { to: '/gratitude-chain', icon: Sparkles,   label: 'Gratitude Chain'},
      { to: '/mood-stats', icon: BarChart3,       label: 'Mood Stats'  },
      { to: '/mood-patterns', icon: TrendingUp,  label: 'Mood Patterns'},
      { to: '/task-analytics', icon: BarChart3,  label: 'Task Stats'  },
      { to: '/sleep-stats', icon: Moon,           label: 'Sleep Stats' },
      { to: '/review',     icon: Star,            label: 'Daily Review'},
      { to: '/daily-wins', icon: Trophy,          label: 'Daily Wins'  },
      { to: '/metrics',    icon: Activity,        label: 'Body Metrics'},
      { to: '/body-composition', icon: Activity,  label: 'Body Comp.'  },
      { to: '/daily-intentions', icon: Target,    label: 'Intentions+' },
      { to: '/metrics-analytics', icon: TrendingUp, label: 'Metrics Stats'},
      { to: '/sleep',        icon: Moon,            label: 'Sleep'       },
      { to: '/sleep-optimizer', icon: Moon,         label: 'Sleep Optimizer'},
      { to: '/energy',          icon: Zap,           label: 'Energy Tracker' },
      { to: '/focus-rituals',   icon: Flame,         label: 'Focus Rituals'  },
      { to: '/life-metrics',    icon: Activity,      label: 'Life Metrics'   },
      { to: '/planner',    icon: CalendarDays,    label: 'Day Planner' },
      { to: '/gratitude',  icon: Sparkles,        label: 'Gratitude'   },
      { to: '/gratitude-analytics', icon: Sparkles, label: 'Gratitude Stats'},
      { to: '/breathing',  icon: Wind,            label: 'Breathing'   },
      { to: '/intentions',   icon: Target,           label: 'Intentions'  },
      { to: '/priority-matrix', icon: Target,       label: 'Priority Matrix'},
      { to: '/affirmations', icon: Star,             label: 'Affirmations'},
      { to: '/vision-board', icon: Star,            label: 'Vision Board'},
      { to: '/standup',      icon: ListChecks,      label: 'Daily Standup'},
      { to: '/okr',          icon: Presentation,    label: 'OKRs'         },
      { to: '/identity',        icon: User,   label: 'Identity'       },
      { to: '/weekly-wins',     icon: Trophy, label: 'Weekly Wins'    },
      { to: '/personal-brand',  icon: Star,   label: 'Personal Brand' },
      { to: '/cognitive-reframe', icon: Brain, label: 'Reframe'       },
    ],
  },
  {
    label: 'RPG',
    items: [
      { to: '/profile',      icon: User,  label: 'Profile'      },
      { to: '/skills',       icon: Zap,   label: 'Skill Tree'   },
      { to: '/milestones',   icon: Medal, label: 'Milestones'   },
      { to: '/achievements', icon: Trophy, label: 'Achievements'},
      { to: '/records',      icon: Medal, label: 'Trophy Room'  },
      { to: '/xp-log',      icon: Swords, label: 'XP Log'       },
      { to: '/xp-center',   icon: Swords, label: 'XP Center'    },
      { to: '/boss',         icon: Sword, label: 'Boss Battle'  },
      { to: '/challenges',      icon: Swords,     label: 'Challenges'   },
      { to: '/daily-challenge', icon: Swords,     label: 'Daily Dare'   },
      { to: '/habit-challenges', icon: Swords,   label: 'Challenges'   },
      { to: '/challenge-mode',  icon: Swords,    label: 'Challenge Mode'},
      { to: '/skill-progress',  icon: Brain,     label: 'Skill Progress'},
      { to: '/meditation',   icon: Wind,          label: 'Meditation'   },
      { to: '/wellness',     icon: Activity,      label: 'Wellness'     },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/habits',       icon: RefreshCw,  label: 'Habits'         },
      { to: '/habit-wizard', icon: Zap,        label: 'Habit Builder'  },
      { to: '/habit-stats',  icon: BarChart3,  label: 'Habit Stats'    },
      { to: '/habit-insights', icon: BarChart3, label: 'Habit Insights' },
      { to: '/streaks',      icon: Flame,      label: 'Streaks'        },
      { to: '/streak-challenge', icon: Flame, label: 'Streak Challenge'},
      { to: '/goals',        icon: Target,  label: 'Goals'          },
      { to: '/goal-analytics', icon: TrendingUp, label: 'Goal Stats'  },
      { to: '/accountability', icon: Shield,  label: 'Accountability'},
      { to: '/weekly-goals', icon: Flag,    label: 'Weekly Big 3'   },
      { to: '/cat-goals', icon: Zap,        label: 'Category Goals' },
      { to: '/habit-designer', icon: Layers, label: 'Habit Designer'},
      { to: '/journal',   icon: BookOpen,   label: 'Journal'        },
      { to: '/growth-log', icon: TrendingUp, label: 'Growth Log'    },
      { to: '/morning-pages', icon: Sun,    label: 'Morning Pages'  },
      { to: '/mindset-journal', icon: Brain, label: 'Mindset Journal'},
      { to: '/reflection', icon: BookOpen,  label: 'Deep Reflection'},
      { to: '/habit-stacking', icon: Layers, label: 'Habit Stacking'},
      { to: '/journal-insights', icon: Brain, label: 'J. Insights' },
      { to: '/notes',     icon: StickyNote, label: 'Notes'          },
      { to: '/quotes',    icon: BookOpen,   label: 'Quotes'         },
      { to: '/decisions',     icon: Star,   label: 'Decisions'      },
      { to: '/values',        icon: Heart,  label: 'Values'         },
      { to: '/manifesto',     icon: Scroll, label: 'Manifesto'      },
      { to: '/relationships', icon: Users,  label: 'Relationships'  },
      { to: '/relationship-analytics', icon: Users, label: 'Rel. Stats'   },
      { to: '/week-plan', icon: CalendarDays, label: 'Week Plan'    },
      { to: '/water',     icon: Droplets,    label: 'Water'        },
      { to: '/books',        icon: BookOpen,   label: 'Books'          },
      { to: '/content-library', icon: BookOpen, label: 'Content Library'},
      { to: '/book-analytics',  icon: TrendingUp, label: 'Book Stats'   },
      { to: '/reading-notes', icon: BookOpen,  label: 'Book Notes'     },
      { to: '/learning',     icon: GraduationCap, label: 'Learning'      },
      { to: '/learning-analytics', icon: TrendingUp, label: 'Learning Stats' },
      { to: '/workouts',     icon: Dumbbell,   label: 'Workouts'       },
      { to: '/fitness-goals', icon: Dumbbell, label: 'Fitness Goals'  },
      { to: '/social-battery', icon: Users,   label: 'Social Battery' },
      { to: '/workout-analytics', icon: TrendingUp, label: 'Workout Stats' },
      { to: '/nutrition',    icon: Apple,      label: 'Nutrition'      },
      { to: '/nutrition-analytics', icon: TrendingUp, label: 'Nutrition Stats' },
      { to: '/meal-plan',    icon: Apple,      label: 'Meal Planner'   },
      { to: '/projects',     icon: FolderOpen, label: 'Projects'       },
      { to: '/project-analytics', icon: TrendingUp, label: 'Project Stats' },
      { to: '/expenses',     icon: TrendingUp, label: 'Expenses'       },
      { to: '/expense-analytics', icon: TrendingUp, label: 'Expense Stats' },
      { to: '/financial-goals', icon: PiggyBank,  label: 'Financial Goals'},
      { to: '/mind-map',        icon: Network,   label: 'Mind Maps'     },
      { to: '/streaks-calendar',  icon: Flame,      label: 'Streaks Cal.' },
      { to: '/study',             icon: FlaskConical, label: 'Study Tracker'},
      { to: '/kpis',              icon: List,         label: 'Personal KPIs'},
      { to: '/bucket-list',       icon: Star,         label: 'Bucket List'  },
      { to: '/time-audit',        icon: Clock,        label: 'Time Audit'   },
      { to: '/habit-coach',       icon: Brain,        label: 'Habit Coach'  },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/timeline',       icon: Clock,     label: 'Timeline'      },
      { to: '/life-events',    icon: Calendar,  label: 'Life Events'   },
      { to: '/life-calendar',  icon: Calendar,  label: 'Life Calendar' },
      { to: '/progress',       icon: BarChart3, label: 'Progress'      },
      { to: '/weekly',    icon: FileText,  label: 'Weekly'        },
      { to: '/weekly-review', icon: Star, label: 'Weekly Review' },
      { to: '/mind-map',  icon: Brain,     label: 'Mind Maps'     },
      { to: '/weekly-scorecard', icon: Trophy, label: 'Weekly Scorecard'},
      { to: '/activity',  icon: Calendar,  label: 'Activity'      },
      { to: '/insights',  icon: Brain,     label: 'Insights'      },
      { to: '/year',      icon: Calendar,  label: 'Year View'     },
      { to: '/lifescore', icon: Sparkles,  label: 'Life Score'    },
      { to: '/life-wheel', icon: Target,   label: 'Life Wheel'    },
      { to: '/life-audit', icon: BarChart3, label: 'Life Audit'   },
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

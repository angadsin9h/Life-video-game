import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, BarChart3, Bot, Target,
  Gamepad2, Trophy, RefreshCw, Sword, BookOpen, Calendar, FileText,
  Timer, User, Users, Settings, Zap, Scroll, Medal, Swords, Brain, Heart, Keyboard, Search, StickyNote, Star, Activity, CalendarDays, Sparkles, Flag, Wind, Moon, TrendingUp, Dumbbell, Sun, Apple, Clock, Flame, GraduationCap, Headphones, Droplets, FolderOpen, Layers, Shield, AlertCircle, Network, PiggyBank, ListChecks, Presentation, FlaskConical, List, Gift, Globe, Smartphone, Phone, MapPin, AlertTriangle, Briefcase, Lightbulb, Pencil, Eye, Home, Leaf, Utensils, Package, Pill, Mail, Lock, Compass, AlertOctagon, BookMarked, CreditCard, Feather, Coffee,
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
      { to: '/focus-stats',   icon: TrendingUp, label: 'Focus Stats'   },
      { to: '/focus-journal', icon: Brain,      label: 'Focus Journal' },
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
      { to: '/cognitive-reframe', icon: Brain,    label: 'Reframe'       },
      { to: '/daily-script',      icon: Pencil,   label: 'Daily Script'  },
      { to: '/life-vision',       icon: Eye,      label: 'Life Vision'   },
      { to: '/win-streak',        icon: Trophy,   label: 'Win Streak'    },
      { to: '/fear-log',          icon: Shield,   label: 'Fear Log'      },
      { to: '/flow-state',        icon: Zap,      label: 'Flow State'    },
      { to: '/creative-journal',  icon: Pencil,   label: 'Creative Write'},
      { to: '/idea-vault',        icon: Lightbulb, label: 'Idea Vault'   },
      { to: '/idea-incubator',    icon: Lightbulb, label: 'Idea Incubator'},
      { to: '/project-retro',     icon: BarChart3,  label: 'Project Retro' },
      { to: '/health-metrics',    icon: Activity,  label: 'Health Metrics'},
      { to: '/mental-health',     icon: Brain,     label: 'Mental Health' },
      { to: '/weekly-sprint',     icon: Flag,      label: 'Weekly Sprint' },
      { to: '/personal-okr',      icon: Target,    label: 'Personal OKR'  },
      { to: '/life-legacy',       icon: Star,      label: 'Life Legacy'   },
      { to: '/decision-matrix',   icon: Target,    label: 'Decision Matrix'},
      { to: '/challenge-calendar', icon: Flame,    label: 'Chain Calendar' },
      { to: '/finance-tracker',   icon: TrendingUp, label: 'Finance'       },
      { to: '/life-theme',        icon: Sparkles,  label: 'Life Theme'     },
      { to: '/net-worth',         icon: TrendingUp, label: 'Net Worth'     },
      { to: '/sleep-score',       icon: Moon,      label: 'Sleep Score'    },
      { to: '/flashcards',        icon: BookOpen,  label: 'Flashcards'     },
      { to: '/recovery',          icon: Activity,  label: 'Recovery'       },
      { to: '/skill-roadmap',     icon: TrendingUp, label: 'Skill Roadmap' },
      { to: '/quick-capture',    icon: Zap,       label: 'Quick Capture'  },
      { to: '/evening-review',   icon: Moon,      label: 'Evening Review' },
      { to: '/year-review',      icon: Trophy,    label: 'Year Review'    },
      { to: '/morning-routine',  icon: Sun,       label: 'Morning Routine'},
      { to: '/conversation-log', icon: Users,     label: 'Conversations'  },
      { to: '/fitness-log',      icon: Dumbbell,  label: 'Fitness Log'    },
      { to: '/life-chapters',    icon: BookOpen,  label: 'Life Chapters'  },
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
      { to: '/goals',          icon: Target,      label: 'Goals'          },
      { to: '/goal-analytics', icon: TrendingUp,  label: 'Goal Stats'     },
      { to: '/goal-hierarchy', icon: Target,      label: 'Goal Hierarchy' },
      { to: '/accountability', icon: Shield,  label: 'Accountability'},
      { to: '/weekly-goals', icon: Flag,    label: 'Weekly Big 3'   },
      { to: '/cat-goals', icon: Zap,        label: 'Category Goals' },
      { to: '/habit-designer',  icon: Layers,  label: 'Habit Designer' },
      { to: '/micro-habits',    icon: Zap,     label: 'Micro-Habits'   },
      { to: '/success-formula', icon: Trophy,  label: 'Success Formula'},
      { to: '/anti-habits',     icon: Shield,  label: 'Anti-Habits'    },
      { to: '/life-rules',      icon: Shield,  label: 'Life Rules'     },
      { to: '/reward-system',    icon: Gift,          label: 'Rewards'         },
      { to: '/content-calendar', icon: Globe,         label: 'Content Calendar'},
      { to: '/digital-detox',    icon: Smartphone, label: 'Digital Detox'   },
      { to: '/emotional-iq',     icon: Brain,         label: 'Emotional IQ'    },
      { to: '/gratitude-letter', icon: Sparkles,      label: 'Gratitude Letter'},
      { to: '/health-dashboard', icon: Activity,      label: 'Health Dashboard'},
      { to: '/savings-challenge', icon: PiggyBank,    label: 'Savings Challenge'},
      { to: '/skill-challenge',   icon: Zap,          label: 'Skill Challenge'  },
      { to: '/podcast',           icon: Headphones,   label: 'Podcasts'         },
      { to: '/personal-crm',      icon: Phone,        label: 'Contacts CRM'     },
      { to: '/mentorship',        icon: GraduationCap, label: 'Mentorship'      },
      { to: '/today-focus',     icon: Target,   label: 'Today Focus'    },
      { to: '/daily-scorecard', icon: Star,     label: 'Daily Scorecard'},
      { to: '/breathwork',      icon: Wind,     label: 'Breathwork'     },
      { to: '/gratitude-jar',   icon: Sparkles, label: 'Gratitude Jar'  },
      { to: '/sleep-rituals',   icon: Moon,    label: 'Sleep Rituals'  },
      { to: '/money-mindset',   icon: TrendingUp, label: 'Money Mindset'},
      { to: '/obstacle-log',    icon: AlertTriangle, label: 'Obstacles' },
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
      { to: '/nutrition-goals',      icon: Target,     label: 'Nutrition Goals'},
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
      { to: '/career',            icon: Briefcase,    label: 'Career'       },
      { to: '/project-sprint',   icon: Zap,          label: 'Sprints'      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/timeline',       icon: Clock,     label: 'Timeline'      },
      { to: '/life-events',    icon: Calendar,  label: 'Life Events'   },
      { to: '/life-calendar',  icon: Calendar,  label: 'Life Calendar' },
      { to: '/progress',       icon: BarChart3, label: 'Progress'      },
      { to: '/weekly',         icon: FileText,  label: 'Weekly'        },
      { to: '/weekly-review',  icon: Star,      label: 'Weekly Review' },
      { to: '/monthly-review', icon: BarChart3, label: 'Monthly Review'},
      { to: '/mind-map',  icon: Brain,     label: 'Mind Maps'     },
      { to: '/weekly-scorecard', icon: Trophy, label: 'Weekly Scorecard'},
      { to: '/activity',  icon: Calendar,  label: 'Activity'      },
      { to: '/insights',  icon: Brain,     label: 'Insights'      },
      { to: '/year',      icon: Calendar,  label: 'Year View'     },
      { to: '/lifescore', icon: Sparkles,  label: 'Life Score'    },
      { to: '/life-wheel', icon: Target,   label: 'Life Wheel'    },
      { to: '/life-audit', icon: BarChart3, label: 'Life Audit'   },
      { to: '/life-map',      icon: Target,  label: 'Life Map'      },
      { to: '/life-timeline', icon: MapPin,  label: 'Life Timeline' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/ai-coach', icon: Bot,      label: 'AI Coach' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
  {
    label: 'Life',
    items: [
      { to: '/network-map',    icon: Network,    label: 'Network Map'    },
      { to: '/training-plan',  icon: Dumbbell,   label: 'Training Plan'  },
      { to: '/grief-journal',  icon: Heart,      label: 'Grief Journal'  },
      { to: '/spiritual',      icon: Sparkles,   label: 'Spiritual'      },
      { to: '/parenting',      icon: Users,      label: 'Parenting Log'  },
      { to: '/side-projects',  icon: Lightbulb,  label: 'Side Projects'  },
      { to: '/volunteer',      icon: Heart,      label: 'Volunteer Log'  },
      { to: '/travel',         icon: Globe,      label: 'Travel Log'     },
      { to: '/languages',        icon: BookOpen,   label: 'Languages'      },
      { to: '/diet',             icon: Apple,      label: 'Diet Tracker'   },
      { to: '/pet-care',         icon: Heart,      label: 'Pet Care'       },
      { to: '/home-improvement', icon: Home,       label: 'Home Projects'  },
      { to: '/mentoring',          icon: Users,        label: 'Mentoring'       },
      { to: '/public-speaking',    icon: Presentation, label: 'Public Speaking' },
      { to: '/coffee-log',         icon: Flame,        label: 'Coffee Log'      },
      { to: '/creative-projects',  icon: Pencil,        label: 'Creative Work'    },
      { to: '/health-symptoms',    icon: Activity,      label: 'Symptoms Log'     },
      { to: '/investments',        icon: TrendingUp,    label: 'Investments'      },
      { to: '/weight',             icon: Activity,      label: 'Weight Tracker'   },
      { to: '/charity',            icon: Heart,         label: 'Charity'          },
      { to: '/mood-board',         icon: Sparkles,      label: 'Mood Board'       },
      { to: '/lessons',            icon: BookOpen,      label: 'Lessons Learned'  },
      { to: '/conflict-log',       icon: Users,         label: 'Conflict Log'     },
      { to: '/garden',             icon: Leaf,          label: 'Gardening'        },
      { to: '/reading-challenge',  icon: BookOpen,      label: 'Reading Challenge' },
      { to: '/negotiation-log',    icon: Briefcase,     label: 'Negotiations'      },
      { to: '/love-languages',     icon: Heart,         label: 'Love Languages'    },
      { to: '/recipes',            icon: Utensils,      label: 'Recipe Journal'    },
      { to: '/social-calendar',    icon: Users,         label: 'Social Calendar'   },
      { to: '/inventory',          icon: Package,       label: 'Inventory'         },
      { to: '/dreams',             icon: Moon,          label: 'Dreams Journal'    },
      { to: '/therapy',            icon: Brain,         label: 'Therapy Log'       },
      { to: '/supplements',        icon: Pill,          label: 'Supplements'       },
      { to: '/screen-time',        icon: Smartphone,    label: 'Screen Time'       },
      { to: '/family-gratitude',   icon: Heart,         label: 'Family Gratitude'  },
      { to: '/future-letters',     icon: Mail,          label: 'Future Letters'    },
      { to: '/personal-policies',  icon: Shield,        label: 'Personal Policies' },
      { to: '/monthly-retro',      icon: BarChart3,     label: 'Monthly Retro'     },
      { to: '/mindful-eating',     icon: Apple,         label: 'Mindful Eating'    },
      { to: '/forgiveness',        icon: Heart,         label: 'Forgiveness Log'   },
      { to: '/eco',                icon: Leaf,          label: 'Eco Tracker'       },
      { to: '/life-regrets',       icon: AlertCircle,   label: 'Life Regrets'      },
      { to: '/hobbies',            icon: Gamepad2,      label: 'Hobbies Tracker'   },
      { to: '/allergies',          icon: AlertTriangle, label: 'Allergy Log'       },
      { to: '/account-vault',      icon: Lock,          label: 'Account Vault'     },
      { to: '/sport-stats',        icon: Trophy,        label: 'Sport Stats'       },
      { to: '/skincare',           icon: Droplets,      label: 'Skin Care Log'     },
      { to: '/career-skills',      icon: Briefcase,     label: 'Career Skills'     },
      { to: '/morning-mindset',    icon: Sun,           label: 'Morning Mindset'   },
      { to: '/gift-ideas',         icon: Gift,          label: 'Gift Ideas'        },
      { to: '/appointments',       icon: CalendarDays,  label: 'Appointments'      },
      { to: '/wish-list',          icon: Star,          label: 'Wish List'         },
      { to: '/memories',           icon: Sparkles,      label: 'Memories Vault'    },
      { to: '/budget',             icon: PiggyBank,     label: 'Budget Planner'    },
      { to: '/sleep-diary',        icon: Moon,          label: 'Sleep Diary'       },
      { to: '/philosophy',         icon: BookOpen,      label: 'Life Philosophy'   },
      { to: '/music-log',          icon: Headphones,    label: 'Music Log'         },
      { to: '/movies',             icon: Eye,           label: 'Movies & Shows'    },
      { to: '/family-tree',        icon: Users,         label: 'Family Tree'       },
      { to: '/comm-log',           icon: Phone,         label: 'Comm. Log'         },
      { to: '/personal-challenges', icon: Swords,       label: 'Challenges+'       },
      { to: '/health-vitals',      icon: Activity,      label: 'Health Vitals'     },
      { to: '/personal-research',  icon: Search,        label: 'My Research'       },
      { to: '/daily-affirmations', icon: Sun,           label: 'Affirmations+'     },
      { to: '/body-scan',          icon: Wind,          label: 'Body Scan'         },
      { to: '/financial-literacy', icon: TrendingUp,    label: 'Financial Literacy'},
      { to: '/private-journal',    icon: FileText,      label: 'Private Journal'   },
      { to: '/rel-goals',          icon: Heart,         label: 'Relationship Goals'},
      { to: '/life-experiences',   icon: Globe,         label: 'Life Experiences'  },
      { to: '/money-tracker',      icon: PiggyBank,     label: 'Money Tracker'     },
      { to: '/creativity-log',     icon: Pencil,        label: 'Creativity Log'    },
      { to: '/brand-builder',      icon: Zap,           label: 'Brand Builder'     },
      { to: '/food-diary',         icon: Apple,         label: 'Food Diary'        },
      { to: '/exercise-log',       icon: Dumbbell,      label: 'Exercise Log'      },
      { to: '/career-journey',     icon: Briefcase,     label: 'Career Journey'    },
      { to: '/mental-models',      icon: Brain,         label: 'Mental Models'     },
      { to: '/travel-planner',     icon: Globe,         label: 'Travel Planner'    },
      { to: '/language-journal',   icon: BookOpen,      label: 'Language Journal'  },
      { to: '/vision-journal',     icon: Eye,           label: 'Vision Journal'    },
      { to: '/constitution',       icon: Scroll,        label: 'Constitution'      },
      { to: '/friendships',        icon: Users,         label: 'Friendships'       },
      { to: '/digital-footprint',  icon: Globe,         label: 'Digital Footprint' },
      { to: '/life-letters',       icon: Mail,          label: 'Life Letters'      },
      { to: '/mindfulness-log',    icon: Wind,          label: 'Mindfulness Log'   },
      { to: '/anger-log',          icon: AlertCircle,   label: 'Anger Log'         },
      { to: '/curiosity-journal',  icon: Lightbulb,     label: 'Curiosity Journal' },
      { to: '/time-capsule',       icon: Clock,         label: 'Time Capsule'      },
      { to: '/workplace-log',      icon: Briefcase,     label: 'Workplace Log'     },
      { to: '/success-stories',    icon: Trophy,        label: 'Success Stories'   },
      { to: '/confidence',         icon: Zap,           label: 'Confidence Builder'},
      { to: '/social-skills',      icon: Users,         label: 'Social Skills'     },
      { to: '/life-numbers',       icon: Activity,      label: 'Life Numbers'      },
      { to: '/personal-mythology', icon: Scroll,        label: 'Personal Mythology'},
      { to: '/daily-questions',    icon: Star,          label: 'Daily Questions'   },
      { to: '/energy-audit',       icon: Zap,           label: 'Energy Audit'      },
      { to: '/moral-compass',      icon: Shield,        label: 'Moral Compass'     },
      { to: '/sabbatical',         icon: Calendar,      label: 'Sabbatical Planner'},
      { to: '/adventure-log',      icon: MapPin,        label: 'Adventure Log'     },
      { to: '/dating-journal',     icon: Heart,         label: 'Dating Journal'    },
      { to: '/breakup-journal',    icon: Heart,         label: 'Healing Journal'   },
      { to: '/self-care',          icon: Heart,         label: 'Self-Care Plan'    },
      { to: '/monthly-intentions', icon: Target,        label: 'Monthly Intentions'},
      { to: '/personal-legacy',    icon: Star,          label: 'Personal Legacy'   },
      { to: '/climate-log',        icon: Leaf,          label: 'Climate Log'        },
      { to: '/joy-log',            icon: Sun,           label: 'Joy Log'            },
      { to: '/learning-goals',     icon: GraduationCap, label: 'Learning Goals'     },
      { to: '/life-purpose',       icon: Compass,       label: 'Life Purpose'       },
      { to: '/thought-patterns',   icon: Brain,         label: 'Thought Patterns'   },
      { to: '/finance-ratios',     icon: TrendingUp,    label: 'Finance Ratios'     },
      { to: '/mindset-shifts',     icon: RefreshCw,     label: 'Mindset Shifts'     },
      { to: '/grateful-moments',   icon: Sparkles,      label: 'Grateful Moments'   },
      { to: '/skill-inventory',    icon: Zap,           label: 'Skill Inventory'    },
      { to: '/weekly-reflection',  icon: Calendar,      label: 'Weekly Reflection'  },
      { to: '/mantra-log',         icon: Sparkles,      label: 'Mantra Log'         },
      { to: '/personal-swot',      icon: BarChart3,     label: 'Personal SWOT'      },
      { to: '/goal-post-mortem',   icon: Target,        label: 'Goal Post-Mortem'   },
      { to: '/self-talk',          icon: Brain,         label: 'Self-Talk Log'      },
      { to: '/vulnerability-log',  icon: Shield,        label: 'Vulnerability Log'  },
      { to: '/micro-wins',         icon: Trophy,        label: 'Micro Wins'         },
      { to: '/rel-values',         icon: Heart,         label: 'Rel. Values'        },
      { to: '/focus-batteries',    icon: Zap,           label: 'Focus Batteries'    },
      { to: '/rituals-log',        icon: RefreshCw,     label: 'Rituals Log'        },
      { to: '/inner-critic',       icon: AlertCircle,   label: 'Inner Critic'       },
      { to: '/peak-performance',   icon: Flame,         label: 'Peak Performance'   },
      { to: '/breathwork-log',     icon: Wind,          label: 'Breathwork Log'     },
      { to: '/personal-prs',       icon: Trophy,        label: 'Personal Records'   },
      { to: '/emotion-library',    icon: Heart,         label: 'Emotion Library'    },
      { to: '/social-projects',   icon: Users,         label: 'Social Projects'    },
      { to: '/digital-minimalism', icon: Smartphone,   label: 'Digital Minimalism' },
      { to: '/nutrition-wins',    icon: Apple,         label: 'Nutrition Wins'     },
      { to: '/crisis-log',       icon: AlertOctagon,  label: 'Crisis Log'         },
      { to: '/boundaries',       icon: Shield,        label: 'Boundaries Log'     },
      { to: '/philosophy-notes', icon: BookMarked,    label: 'Philosophy Notes'   },
      { to: '/sleep-goals',      icon: Moon,          label: 'Sleep Goals'        },
      { to: '/challenge-tracker', icon: Swords,       label: 'Challenge Tracker'  },
      { to: '/debt-tracker',     icon: CreditCard,    label: 'Debt Tracker'       },
      { to: '/strengths-log',   icon: Zap,           label: 'Strengths Log'      },
      { to: '/time-wasters',    icon: Clock,         label: 'Time Wasters'       },
      { to: '/health-habits',   icon: Activity,      label: 'Health Habits'      },
      { to: '/wisdom-log',      icon: Scroll,        label: 'Wisdom Log'         },
      { to: '/gratitude-practice', icon: Sparkles,   label: 'Gratitude Practice' },
      { to: '/mindful-movement',  icon: Wind,        label: 'Mindful Movement'   },
      { to: '/experience-ledger', icon: Globe,       label: 'Experience Ledger'  },
      { to: '/confidence-journal', icon: Star,       label: 'Confidence Journal' },
      { to: '/monthly-goals',     icon: Flag,        label: 'Monthly Goals'      },
      { to: '/body-language',     icon: User,        label: 'Body Language Log'  },
      { to: '/reading-list',     icon: BookOpen,    label: 'Reading List'       },
      { to: '/core-values',      icon: Heart,       label: 'Core Values'        },
      { to: '/annual-review',    icon: Calendar,    label: 'Annual Review'      },
      { to: '/goal-review',      icon: Target,      label: 'Goal Reviews'       },
      { to: '/neg-visualization', icon: Eye,        label: 'Neg. Visualization' },
      { to: '/relapse-log',      icon: RefreshCw,   label: 'Relapse Log'        },
      { to: '/energy-food',      icon: Zap,         label: 'Energy Food Log'    },
      { to: '/life-interests',   icon: Layers,      label: 'Life Interests'     },
      { to: '/personal-audit',   icon: BarChart3,   label: 'Personal Audit'     },
      { to: '/legacy-letters',   icon: Mail,        label: 'Legacy Letters'     },
      { to: '/emotional-triggers', icon: AlertCircle, label: 'Emotional Triggers'},
      { to: '/stoic-practice',   icon: Feather,     label: 'Stoic Practice'     },
      { to: '/courage-log',      icon: Shield,      label: 'Courage Log'        },
      { to: '/ego-journal',      icon: Brain,       label: 'Ego Journal'        },
      { to: '/intention-setter', icon: Target,      label: 'Intention Setter'   },
      { to: '/motivation-log',   icon: Flame,       label: 'Motivation Log'     },
      { to: '/habit-autopsy',   icon: FlaskConical, label: 'Habit Autopsy'     },
      { to: '/procrastination', icon: Clock,        label: 'Procrastination'    },
      { to: '/mentor-quotes',   icon: GraduationCap, label: 'Mentor Quotes'    },
      { to: '/personal-credo',  icon: Scroll,       label: 'Personal Credo'     },
      { to: '/growth-edges',    icon: TrendingUp,   label: 'Growth Edges'       },
      { to: '/shadow-work',     icon: Moon,         label: 'Shadow Work'        },
      { to: '/life-design',     icon: Compass,      label: 'Life Design'        },
      { to: '/power-beliefs',   icon: Zap,          label: 'Power Beliefs'      },
      { to: '/family-goals',    icon: Home,         label: 'Family Goals'       },
      { to: '/micro-journal',   icon: StickyNote,   label: 'Micro Journal'      },
      { to: '/exercise-library', icon: Dumbbell,   label: 'Exercise Library'   },
      { to: '/meal-log',        icon: Utensils,    label: 'Meal Log'           },
      { to: '/mindset-shifts-v2', icon: Brain,     label: 'Mindset Shifts+'    },
      { to: '/fi-tracker',      icon: TrendingUp,  label: 'Financial Freedom'  },
      { to: '/social-circle',   icon: Users,       label: 'Social Circle'      },
      { to: '/career-milestones', icon: Briefcase, label: 'Career Milestones'  },
      { to: '/personal-rituals', icon: RefreshCw,  label: 'Personal Rituals'   },
      { to: '/skill-gaps',      icon: GraduationCap, label: 'Skill Gaps'       },
      { to: '/pain-points',     icon: AlertTriangle, label: 'Pain Points'       },
      { to: '/discipline-log',  icon: Sword,      label: 'Discipline Log'     },
      { to: '/win-journal',        icon: Trophy,       label: 'Win Journal'        },
      { to: '/gratitude-map',      icon: Heart,        label: 'Gratitude Map'      },
      { to: '/life-contracts',     icon: FileText,     label: 'Life Contracts'     },
      { to: '/focus-modes',        icon: Target,       label: 'Focus Modes'        },
      { to: '/spiritual-practice', icon: Sparkles,     label: 'Spiritual Practice' },
      { to: '/performance-log',    icon: TrendingUp,   label: 'Performance Log'    },
      { to: '/obstacle-map',       icon: AlertOctagon, label: 'Obstacle Map'       },
      { to: '/resilience-log',     icon: Shield,       label: 'Resilience Log'     },
      { to: '/break-log',          icon: Coffee,       label: 'Break Log'          },
      { to: '/character-sheet',    icon: User,         label: 'Character Sheet'    },
      { to: '/debt-free',          icon: CreditCard,   label: 'Debt-Free Journey'  },
      { to: '/life-experiments',   icon: FlaskConical, label: 'Life Experiments'   },
      { to: '/mindfulness-timer',  icon: Wind,         label: 'Mindfulness Timer'  },
      { to: '/health-protocols',   icon: Activity,     label: 'Health Protocols'   },
      { to: '/network-builder',    icon: Network,      label: 'Network Builder'    },
      { to: '/learning-roadmap',       icon: BookOpen,   label: 'Learning Roadmap'     },
      { to: '/morning-mindfulness',    icon: Sun,        label: 'Morning Journal+'     },
      { to: '/evening-wind-down',      icon: Moon,       label: 'Evening Wind Down'    },
      { to: '/values-alignment',       icon: Heart,      label: 'Values Alignment'     },
      { to: '/body-budget',            icon: Activity,   label: 'Body Budget'          },
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

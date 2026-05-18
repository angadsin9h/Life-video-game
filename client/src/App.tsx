import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppShell from './components/AppShell'
import { ToastProvider } from './contexts/ToastContext'
import Dashboard from './pages/Dashboard'
import LogTasks from './pages/LogTasks'
import Progress from './pages/Progress'
import AICoach from './pages/AICoach'
import Goals from './pages/Goals'
import Achievements from './pages/Achievements'
import Habits from './pages/Habits'
import BossBattle from './pages/BossBattle'
import Journal from './pages/Journal'
import Heatmap from './pages/Heatmap'
import WeeklyReport from './pages/WeeklyReport'
import Timer from './pages/Timer'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import SkillTree from './pages/SkillTree'
import Quests from './pages/Quests'
import Milestones from './pages/Milestones'
import Challenges from './pages/Challenges'
import Insights from './pages/Insights'
import MoodTracker from './pages/MoodTracker'
import Notes from './pages/Notes'
import DailyReview from './pages/DailyReview'
import BodyMetrics from './pages/BodyMetrics'
import Planner from './pages/Planner'
import Gratitude from './pages/Gratitude'
import Records from './pages/Records'
import Intentions from './pages/Intentions'
import LifeScore from './pages/LifeScore'
import CategoryGoals from './pages/CategoryGoals'
import FocusSessions from './pages/FocusSessions'
import YearView from './pages/YearView'
import Affirmations from './pages/Affirmations'
import MoodAnalytics from './pages/MoodAnalytics'
import WeeklyGoals from './pages/WeeklyGoals'
import Breathing from './pages/Breathing'
import SleepTracker from './pages/SleepTracker'
import HabitAnalytics from './pages/HabitAnalytics'
import DailyChallenge from './pages/DailyChallenge'
import Books from './pages/Books'
import Workouts from './pages/Workouts'
import Expenses from './pages/Expenses'
import Briefing from './pages/Briefing'
import Nutrition from './pages/Nutrition'
import Timeline from './pages/Timeline'
import LifeCalendar from './pages/LifeCalendar'
import Streaks from './pages/Streaks'
import CheckIn from './pages/CheckIn'
import WindDown from './pages/WindDown'
import Learning from './pages/Learning'
import AmbientFocus from './pages/AmbientFocus'
import TaskBoard from './pages/TaskBoard'
import Routines from './pages/Routines'
import LifeWheel from './pages/LifeWheel'
import DecisionJournal from './pages/DecisionJournal'
import Values from './pages/Values'
import WeeklyPlanning from './pages/WeeklyPlanning'
import XPLog from './pages/XPLog'
import WaterTracker from './pages/WaterTracker'
import FocusStats from './pages/FocusStats'
import JournalInsights from './pages/JournalInsights'
import MealPlanner from './pages/MealPlanner'
import ReadingNotes from './pages/ReadingNotes'
import Projects from './pages/Projects'
import WellnessCheck from './pages/WellnessCheck'
import MeditationTimer from './pages/MeditationTimer'
import HabitChallenges from './pages/HabitChallenges'
import LifeOS from './pages/LifeOS'
import QuoteJournal from './pages/QuoteJournal'
import Relationships from './pages/Relationships'
import SleepAnalytics from './pages/SleepAnalytics'
import MorningPages from './pages/MorningPages'
import ExpenseAnalytics from './pages/ExpenseAnalytics'
import StreaksCalendar from './pages/StreaksCalendar'
import GoalAnalytics from './pages/GoalAnalytics'
import WorkoutAnalytics from './pages/WorkoutAnalytics'
import NutritionAnalytics from './pages/NutritionAnalytics'
import BookAnalytics from './pages/BookAnalytics'
import ProductivityDashboard from './pages/ProductivityDashboard'
import LearningAnalytics from './pages/LearningAnalytics'
import ProjectAnalytics from './pages/ProjectAnalytics'
import MetricsAnalytics from './pages/MetricsAnalytics'
import GratitudeAnalytics from './pages/GratitudeAnalytics'
import RelationshipAnalytics from './pages/RelationshipAnalytics'
import TimeBlocking from './pages/TimeBlocking'
import EmotionCheck from './pages/EmotionCheck'
import VisionBoard from './pages/VisionBoard'
import PriorityMatrix from './pages/PriorityMatrix'
import HabitWizard from './pages/HabitWizard'
import MindsetJournal from './pages/MindsetJournal'
import HabitStacking from './pages/HabitStacking'
import DailyWins from './pages/DailyWins'
import ReflectionPrompts from './pages/ReflectionPrompts'
import WeeklyScorecard from './pages/WeeklyScorecard'
import Accountability from './pages/Accountability'
import SleepOptimizer from './pages/SleepOptimizer'
import FinancialGoals from './pages/FinancialGoals'
import EnergyTracker from './pages/EnergyTracker'
import ChallengeMode from './pages/ChallengeMode'
import SkillProgress from './pages/SkillProgress'
import LifeMetricsDashboard from './pages/LifeMetricsDashboard'
import FocusRituals from './pages/FocusRituals'
import HabitInsights from './pages/HabitInsights'
import PersonalManifesto from './pages/PersonalManifesto'
import MoodPatterns from './pages/MoodPatterns'
import TaskAnalytics from './pages/TaskAnalytics'
import BodyComposition from './pages/BodyComposition'
import DailyIntentions from './pages/DailyIntentions'
import GrowthLog from './pages/GrowthLog'
import PomodoroTracker from './pages/PomodoroTracker'
import WeeklyReview from './pages/WeeklyReview'
import MindMapPage from './pages/MindMap'
import LifeAudit from './pages/LifeAudit'
import AnxietyJournal from './pages/AnxietyJournal'
import FitnessGoals from './pages/FitnessGoals'
import SocialBattery from './pages/SocialBattery'
import ContentLibrary from './pages/ContentLibrary'
import DeepWorkPlanner from './pages/DeepWorkPlanner'
import StreakChallenge from './pages/StreakChallenge'
import LifeEvents from './pages/LifeEvents'
import StressTracker from './pages/StressTracker'
import GratitudeChain from './pages/GratitudeChain'
import OKRTracker from './pages/OKRTracker'
import DailyStandup from './pages/DailyStandup'
import StudyTracker from './pages/StudyTracker'
import PersonalKPIs from './pages/PersonalKPIs'
import BucketList from './pages/BucketList'
import HabitCoach from './pages/HabitCoach'
import TimeAudit from './pages/TimeAudit'
import IdentityBuilder from './pages/IdentityBuilder'
import WeeklyWins from './pages/WeeklyWins'
import NightlyReview from './pages/NightlyReview'
import PowerHour from './pages/PowerHour'
import HabitDesigner from './pages/HabitDesigner'
import DailyCheckIn from './pages/DailyCheckIn'
import XPCenter from './pages/XPCenter'
import CognitiveReframe from './pages/CognitiveReframe'
import PersonalBrand from './pages/PersonalBrand'
import MicroHabits from './pages/MicroHabits'
import SuccessFormula from './pages/SuccessFormula'
import GoalHierarchy from './pages/GoalHierarchy'
import PerformanceReview from './pages/PerformanceReview'
import FocusJournal from './pages/FocusJournal'
import LifeMap from './pages/LifeMap'
import AntiHabits from './pages/AntiHabits'
import LifeRules from './pages/LifeRules'
import RewardSystem from './pages/RewardSystem'
import ContentCalendar from './pages/ContentCalendar'
import SkillChallenge from './pages/SkillChallenge'
import PodcastTracker from './pages/PodcastTracker'
import DigitalDetox from './pages/DigitalDetox'
import EmotionalIntelligence from './pages/EmotionalIntelligence'
import GratitudeLetter from './pages/GratitudeLetter'
import HealthDashboard from './pages/HealthDashboard'
import SavingsChallenge from './pages/SavingsChallenge'
import LifeTimeline from './pages/LifeTimeline'
import ObstacleLog from './pages/ObstacleLog'
import SleepRituals from './pages/SleepRituals'
import TodayFocus from './pages/TodayFocus'
import GratitudeJar from './pages/GratitudeJar'
import DailyScorecard from './pages/DailyScorecard'
import BreathworkTimer from './pages/BreathworkTimer'
import IdeaIncubator from './pages/IdeaIncubator'
import ProjectRetro from './pages/ProjectRetro'
import HealthMetrics from './pages/HealthMetrics'
import MentalHealthLog from './pages/MentalHealthLog'
import WeeklySprint from './pages/WeeklySprint'
import PersonalOKR from './pages/PersonalOKR'
import LifeLegacy from './pages/LifeLegacy'
import DecisionMatrix from './pages/DecisionMatrix'
import ChallengeCalendar from './pages/ChallengeCalendar'
import FinanceTracker from './pages/FinanceTracker'
import LifeTheme from './pages/LifeTheme'
import NetWorthTracker from './pages/NetWorthTracker'
import SleepScore from './pages/SleepScore'
import StudyFlashcards from './pages/StudyFlashcards'
import RecoveryTracker from './pages/RecoveryTracker'
import SkillRoadmap from './pages/SkillRoadmap'
import QuickCapture from './pages/QuickCapture'
import ConversationLog from './pages/ConversationLog'
import FitnessLog from './pages/FitnessLog'
import EveningReview from './pages/EveningReview'
import YearInReview from './pages/YearInReview'
import MorningRoutine from './pages/MorningRoutine'
import MoneyMindset from './pages/MoneyMindset'
import NutritionGoals from './pages/NutritionGoals'
import CareerTracker from './pages/CareerTracker'
import IdeaVault from './pages/IdeaVault'
import ProjectSprint from './pages/ProjectSprint'
import CreativeJournal from './pages/CreativeJournal'
import FlowState from './pages/FlowState'
import FearLog from './pages/FearLog'
import WinStreak from './pages/WinStreak'
import DailyScript from './pages/DailyScript'
import LifeVision from './pages/LifeVision'
import LifeChapters from './pages/LifeChapters'
import NetworkMap from './pages/NetworkMap'
import TrainingPlan from './pages/TrainingPlan'
import GriefJournal from './pages/GriefJournal'
import SpiritualJourney from './pages/SpiritualJourney'
import ParentingLog from './pages/ParentingLog'
import SideProjects from './pages/SideProjects'
import VolunteerLog from './pages/VolunteerLog'
import TravelLog from './pages/TravelLog'
import LanguageLearning from './pages/LanguageLearning'
import DietTracker from './pages/DietTracker'
import PetCare from './pages/PetCare'
import HomeImprovement from './pages/HomeImprovement'
import MentoringJournal from './pages/MentoringJournal'
import PublicSpeaking from './pages/PublicSpeaking'
import CoffeeLog from './pages/CoffeeLog'
import CreativeProjects from './pages/CreativeProjects'
import HealthSymptoms from './pages/HealthSymptoms'
import InvestmentTracker from './pages/InvestmentTracker'
import WeightTracker from './pages/WeightTracker'
import CharityTracker from './pages/CharityTracker'
import MoodBoard from './pages/MoodBoard'
import LessonLearned from './pages/LessonLearned'
import ConflictLog from './pages/ConflictLog'
import GardeningLog from './pages/GardeningLog'
import ReadingChallenge from './pages/ReadingChallenge'
import NegotiationLog from './pages/NegotiationLog'
import LoveLanguages from './pages/LoveLanguages'
import DreamsJournal from './pages/DreamsJournal'
import GratitudeToParents from './pages/GratitudeToParents'
import MindfulEating from './pages/MindfulEating'
import HobbiesTracker from './pages/HobbiesTracker'
import SkinCareLog from './pages/SkinCareLog'
import CareerSkills from './pages/CareerSkills'
import MorningMindset from './pages/MorningMindset'
import AllergyLog from './pages/AllergyLog'
import PasswordVault from './pages/PasswordVault'
import SportStats from './pages/SportStats'
import ForgivenessLog from './pages/ForgivenessLog'
import EcoTracker from './pages/EcoTracker'
import LifeRegrets from './pages/LifeRegrets'
import FutureLetters from './pages/FutureLetters'
import PersonalPolicies from './pages/PersonalPolicies'
import MonthlyRetro from './pages/MonthlyRetro'
import TherapyLog from './pages/TherapyLog'
import SupplementLog from './pages/SupplementLog'
import ScreenTimeLog from './pages/ScreenTimeLog'
import RecipeJournal from './pages/RecipeJournal'
import SocialCalendar from './pages/SocialCalendar'
import PersonalInventory from './pages/PersonalInventory'
import GiftIdeas from './pages/GiftIdeas'
import AppointmentsLog from './pages/AppointmentsLog'
import WishList from './pages/WishList'
import MemoriesVault from './pages/MemoriesVault'
import PersonalChallenges from './pages/PersonalChallenges'
import HealthVitals from './pages/HealthVitals'
import PersonalResearch from './pages/PersonalResearch'
import DailyAffirmations from './pages/DailyAffirmations'
import BodyScanLog from './pages/BodyScanLog'
import ExerciseLog from './pages/ExerciseLog'
import CareerJourney from './pages/CareerJourney'
import MentalModels from './pages/MentalModels'
import TravelPlanner from './pages/TravelPlanner'
import MoneyTracker from './pages/MoneyTracker'
import CreativityLog from './pages/CreativityLog'
import PersonalBrandBuilder from './pages/PersonalBrandBuilder'
import FoodDiary from './pages/FoodDiary'
import FinancialLiteracy from './pages/FinancialLiteracy'
import PasswordJournal from './pages/PasswordJournal'
import RelationshipGoals from './pages/RelationshipGoals'
import LifeExperiences from './pages/LifeExperiences'
import BudgetPlanner from './pages/BudgetPlanner'
import SleepDiary from './pages/SleepDiary'
import LifePhilosophy from './pages/LifePhilosophy'
import MusicLog from './pages/MusicLog'
import MoviesLog from './pages/MoviesLog'
import FamilyTree from './pages/FamilyTree'
import CommunicationLog from './pages/CommunicationLog'
import LanguageJournal from './pages/LanguageJournal'
import VisionJournal from './pages/VisionJournal'
import PersonalConstitution from './pages/PersonalConstitution'
import FriendshipTracker from './pages/FriendshipTracker'
import DigitalFootprint from './pages/DigitalFootprint'
import LifeLetters from './pages/LifeLetters'
import MindfulnessLog from './pages/MindfulnessLog'
import AngerLog from './pages/AngerLog'
import CuriosityJournal from './pages/CuriosityJournal'
import PersonalTimeCapsule from './pages/PersonalTimeCapsule'
import WorkplaceLog from './pages/WorkplaceLog'
import SuccessStories from './pages/SuccessStories'
import ConfidenceBuilder from './pages/ConfidenceBuilder'
import SocialSkillsLog from './pages/SocialSkillsLog'
import LifeNumbersTracker from './pages/LifeNumbersTracker'
import PersonalMythology from './pages/PersonalMythology'
import DailyQuestions from './pages/DailyQuestions'
import EnergyAudit from './pages/EnergyAudit'
import MoralCompass from './pages/MoralCompass'
import SabbaticalPlanner from './pages/SabbaticalPlanner'
import AdventureLog from './pages/AdventureLog'
import DatingJournal from './pages/DatingJournal'
import BreakupJournal from './pages/BreakupJournal'
import SelfCarePlan from './pages/SelfCarePlan'
import MonthlyIntentions from './pages/MonthlyIntentions'
import PersonalLegacy from './pages/PersonalLegacy'
import ClimateLog from './pages/ClimateLog'
import JoyLog from './pages/JoyLog'
import LearningGoals from './pages/LearningGoals'
import LifePurpose from './pages/LifePurpose'
import ThoughtPatterns from './pages/ThoughtPatterns'
import PersonalFinanceRatios from './pages/PersonalFinanceRatios'
import HabitMindsetShift from './pages/HabitMindsetShift'
import GratefulMoments from './pages/GratefulMoments'
import SkillInventory from './pages/SkillInventory'
import WeeklyReflection from './pages/WeeklyReflection'
import MantraLog from './pages/MantraLog'
import PersonalSWOT from './pages/PersonalSWOT'
import GoalPostMortem from './pages/GoalPostMortem'
import SelfTalk from './pages/SelfTalk'
import VulnerabilityLog from './pages/VulnerabilityLog'
import MicroWins from './pages/MicroWins'
import RelationshipValues from './pages/RelationshipValues'
import FocusBatteries from './pages/FocusBatteries'
import RitualsLog from './pages/RitualsLog'
import InnerCriticLog from './pages/InnerCriticLog'
import PeakPerformance from './pages/PeakPerformance'
import BreathworkLog from './pages/BreathworkLog'
import PersonalPRs from './pages/PersonalPRs'
import EmotionLibrary from './pages/EmotionLibrary'
import SocialProjects from './pages/SocialProjects'
import DigitalMinimalism from './pages/DigitalMinimalism'
import NutritionWins from './pages/NutritionWins'
import CrisisLog from './pages/CrisisLog'
import StrengthsLog from './pages/StrengthsLog'
import TimeWasters from './pages/TimeWasters'
import HealthHabits from './pages/HealthHabits'
import WisdomLog from './pages/WisdomLog'
import GratitudePractice from './pages/GratitudePractice'
import MindfulMovement from './pages/MindfulMovement'
import ExperienceLedger from './pages/ExperienceLedger'
import ConfidenceJournal from './pages/ConfidenceJournal'
import MonthlyGoals from './pages/MonthlyGoals'
import BodyLanguageLog from './pages/BodyLanguageLog'
import BoundariesLog from './pages/BoundariesLog'
import PhilosophyNotes from './pages/PhilosophyNotes'
import SleepGoals from './pages/SleepGoals'
import ChallengeTracker from './pages/ChallengeTracker'
import PersonalDebts from './pages/PersonalDebts'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AppShell>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <main className="pb-20 md:pb-0 md:pl-56">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/"             element={<Dashboard />}    />
              <Route path="/log"          element={<LogTasks />}     />
              <Route path="/progress"     element={<Progress />}     />
              <Route path="/activity"     element={<Heatmap />}      />
              <Route path="/journal"      element={<Journal />}      />
              <Route path="/ai-coach"     element={<AICoach />}      />
              <Route path="/goals"        element={<Goals />}        />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/habits"       element={<Habits />}       />
              <Route path="/boss"         element={<BossBattle />}   />
              <Route path="/weekly"       element={<WeeklyReport />} />
              <Route path="/timer"        element={<Timer />}        />
              <Route path="/profile"      element={<Profile />}      />
              <Route path="/settings"     element={<Settings />}     />
              <Route path="/skills"       element={<SkillTree />}    />
              <Route path="/quests"       element={<Quests />}       />
              <Route path="/milestones"   element={<Milestones />}   />
              <Route path="/challenges"   element={<Challenges />}   />
              <Route path="/insights"     element={<Insights />}     />
              <Route path="/mood"         element={<MoodTracker />}  />
              <Route path="/notes"        element={<Notes />}        />
              <Route path="/review"       element={<DailyReview />}  />
              <Route path="/metrics"      element={<BodyMetrics />}  />
              <Route path="/planner"      element={<Planner />}      />
              <Route path="/gratitude"    element={<Gratitude />}    />
              <Route path="/records"      element={<Records />}      />
              <Route path="/intentions"   element={<Intentions />}   />
              <Route path="/lifescore"    element={<LifeScore />}    />
              <Route path="/cat-goals"    element={<CategoryGoals />}/>
              <Route path="/focus-log"    element={<FocusSessions />}/>
              <Route path="/year"         element={<YearView />}     />
              <Route path="/affirmations"  element={<Affirmations />}  />
              <Route path="/mood-stats"    element={<MoodAnalytics />} />
              <Route path="/weekly-goals"  element={<WeeklyGoals />}   />
              <Route path="/breathing"     element={<Breathing />}     />
              <Route path="/sleep"         element={<SleepTracker />}  />
              <Route path="/habit-stats"     element={<HabitAnalytics />}/>
              <Route path="/daily-challenge" element={<DailyChallenge />}/>
              <Route path="/books"          element={<Books />}          />
              <Route path="/workouts"       element={<Workouts />}       />
              <Route path="/expenses"       element={<Expenses />}       />
              <Route path="/briefing"       element={<Briefing />}       />
              <Route path="/nutrition"      element={<Nutrition />}      />
              <Route path="/timeline"       element={<Timeline />}       />
              <Route path="/life-calendar"  element={<LifeCalendar />}   />
              <Route path="/streaks"        element={<Streaks />}        />
              <Route path="/checkin"         element={<CheckIn />}        />
              <Route path="/winddown"        element={<WindDown />}       />
              <Route path="/learning"        element={<Learning />}       />
              <Route path="/ambient"         element={<AmbientFocus />}   />
              <Route path="/taskboard"       element={<TaskBoard />}      />
              <Route path="/routines"        element={<Routines />}       />
              <Route path="/life-wheel"      element={<LifeWheel />}      />
              <Route path="/decisions"       element={<DecisionJournal />}/>
              <Route path="/values"          element={<Values />}         />
              <Route path="/week-plan"       element={<WeeklyPlanning />} />
              <Route path="/xp-log"          element={<XPLog />}          />
              <Route path="/water"           element={<WaterTracker />}   />
              <Route path="/focus-stats"     element={<FocusStats />}     />
              <Route path="/journal-insights" element={<JournalInsights />}/>
              <Route path="/meal-plan"       element={<MealPlanner />}    />
              <Route path="/reading-notes"   element={<ReadingNotes />}   />
              <Route path="/projects"        element={<Projects />}       />
              <Route path="/wellness"        element={<WellnessCheck />}  />
              <Route path="/meditation"      element={<MeditationTimer />}/>
              <Route path="/habit-challenges" element={<HabitChallenges />}/>
              <Route path="/life-os"         element={<LifeOS />}         />
              <Route path="/quotes"          element={<QuoteJournal />}   />
              <Route path="/relationships"   element={<Relationships />}  />
              <Route path="/sleep-stats"     element={<SleepAnalytics />} />
              <Route path="/morning-pages"   element={<MorningPages />}   />
              <Route path="/expense-analytics" element={<ExpenseAnalytics />} />
              <Route path="/streaks-calendar"  element={<StreaksCalendar />}  />
              <Route path="/goal-analytics"    element={<GoalAnalytics />}    />
              <Route path="/workout-analytics" element={<WorkoutAnalytics />} />
              <Route path="/nutrition-analytics" element={<NutritionAnalytics />} />
              <Route path="/book-analytics"      element={<BookAnalytics />}      />
              <Route path="/productivity"        element={<ProductivityDashboard />} />
              <Route path="/learning-analytics"  element={<LearningAnalytics />}     />
              <Route path="/project-analytics"   element={<ProjectAnalytics />}      />
              <Route path="/metrics-analytics"  element={<MetricsAnalytics />}     />
              <Route path="/gratitude-analytics"    element={<GratitudeAnalytics />}    />
              <Route path="/relationship-analytics" element={<RelationshipAnalytics />} />
              <Route path="/time-blocking"          element={<TimeBlocking />}          />
              <Route path="/emotions"               element={<EmotionCheck />}          />
              <Route path="/vision-board"          element={<VisionBoard />}           />
              <Route path="/priority-matrix"       element={<PriorityMatrix />}        />
              <Route path="/habit-wizard"          element={<HabitWizard />}           />
              <Route path="/mindset-journal"       element={<MindsetJournal />}        />
              <Route path="/habit-stacking"        element={<HabitStacking />}         />
              <Route path="/daily-wins"            element={<DailyWins />}             />
              <Route path="/reflection"            element={<ReflectionPrompts />}     />
              <Route path="/weekly-scorecard"      element={<WeeklyScorecard />}       />
              <Route path="/accountability"        element={<Accountability />}        />
              <Route path="/sleep-optimizer"      element={<SleepOptimizer />}        />
              <Route path="/financial-goals"      element={<FinancialGoals />}        />
              <Route path="/energy"               element={<EnergyTracker />}         />
              <Route path="/challenge-mode"       element={<ChallengeMode />}         />
              <Route path="/skill-progress"       element={<SkillProgress />}         />
              <Route path="/life-metrics"         element={<LifeMetricsDashboard />}  />
              <Route path="/focus-rituals"        element={<FocusRituals />}          />
              <Route path="/habit-insights"       element={<HabitInsights />}         />
              <Route path="/manifesto"            element={<PersonalManifesto />}     />
              <Route path="/mood-patterns"        element={<MoodPatterns />}          />
              <Route path="/task-analytics"       element={<TaskAnalytics />}         />
              <Route path="/body-composition"     element={<BodyComposition />}       />
              <Route path="/daily-intentions"     element={<DailyIntentions />}       />
              <Route path="/growth-log"           element={<GrowthLog />}             />
              <Route path="/pomodoro"             element={<PomodoroTracker />}       />
              <Route path="/weekly-review"        element={<WeeklyReview />}          />
              <Route path="/mind-map"             element={<MindMapPage />}           />
              <Route path="/life-audit"           element={<LifeAudit />}             />
              <Route path="/anxiety-journal"      element={<AnxietyJournal />}        />
              <Route path="/fitness-goals"        element={<FitnessGoals />}          />
              <Route path="/social-battery"       element={<SocialBattery />}         />
              <Route path="/content-library"      element={<ContentLibrary />}        />
              <Route path="/deep-work"            element={<DeepWorkPlanner />}       />
              <Route path="/streak-challenge"     element={<StreakChallenge />}        />
              <Route path="/life-events"          element={<LifeEvents />}            />
              <Route path="/stress"               element={<StressTracker />}         />
              <Route path="/gratitude-chain"      element={<GratitudeChain />}        />
              <Route path="/okr"                  element={<OKRTracker />}            />
              <Route path="/standup"              element={<DailyStandup />}          />
              <Route path="/study"                element={<StudyTracker />}          />
              <Route path="/kpis"                 element={<PersonalKPIs />}          />
              <Route path="/bucket-list"          element={<BucketList />}            />
              <Route path="/habit-coach"          element={<HabitCoach />}            />
              <Route path="/time-audit"           element={<TimeAudit />}             />
              <Route path="/identity"             element={<IdentityBuilder />}       />
              <Route path="/weekly-wins"          element={<WeeklyWins />}            />
              <Route path="/nightly-review"       element={<NightlyReview />}         />
              <Route path="/power-hour"           element={<PowerHour />}             />
              <Route path="/habit-designer"       element={<HabitDesigner />}         />
              <Route path="/daily-check-in"       element={<DailyCheckIn />}          />
              <Route path="/xp-center"            element={<XPCenter />}              />
              <Route path="/cognitive-reframe"    element={<CognitiveReframe />}      />
              <Route path="/personal-brand"       element={<PersonalBrand />}         />
              <Route path="/micro-habits"         element={<MicroHabits />}           />
              <Route path="/success-formula"      element={<SuccessFormula />}        />
              <Route path="/goal-hierarchy"       element={<GoalHierarchy />}         />
              <Route path="/monthly-review"       element={<PerformanceReview />}     />
              <Route path="/focus-journal"        element={<FocusJournal />}          />
              <Route path="/life-map"             element={<LifeMap />}               />
              <Route path="/anti-habits"          element={<AntiHabits />}            />
              <Route path="/life-rules"           element={<LifeRules />}             />
              <Route path="/reward-system"        element={<RewardSystem />}          />
              <Route path="/content-calendar"     element={<ContentCalendar />}       />
              <Route path="/digital-detox"        element={<DigitalDetox />}          />
              <Route path="/emotional-iq"         element={<EmotionalIntelligence />} />
              <Route path="/gratitude-letter"     element={<GratitudeLetter />}       />
              <Route path="/health-dashboard"     element={<HealthDashboard />}       />
              <Route path="/savings-challenge"    element={<SavingsChallenge />}      />
              <Route path="/skill-challenge"      element={<SkillChallenge />}        />
              <Route path="/podcast"              element={<PodcastTracker />}        />
              <Route path="/life-timeline"        element={<LifeTimeline />}          />
              <Route path="/obstacle-log"         element={<ObstacleLog />}           />
              <Route path="/sleep-rituals"        element={<SleepRituals />}          />
              <Route path="/today-focus"          element={<TodayFocus />}            />
              <Route path="/gratitude-jar"        element={<GratitudeJar />}          />
              <Route path="/daily-scorecard"      element={<DailyScorecard />}        />
              <Route path="/breathwork"           element={<BreathworkTimer />}       />
              <Route path="/idea-incubator"       element={<IdeaIncubator />}         />
              <Route path="/project-retro"        element={<ProjectRetro />}          />
              <Route path="/health-metrics"       element={<HealthMetrics />}         />
              <Route path="/mental-health"        element={<MentalHealthLog />}       />
              <Route path="/weekly-sprint"        element={<WeeklySprint />}          />
              <Route path="/personal-okr"         element={<PersonalOKR />}           />
              <Route path="/life-legacy"          element={<LifeLegacy />}            />
              <Route path="/decision-matrix"      element={<DecisionMatrix />}        />
              <Route path="/challenge-calendar"   element={<ChallengeCalendar />}     />
              <Route path="/finance-tracker"      element={<FinanceTracker />}        />
              <Route path="/life-theme"           element={<LifeTheme />}             />
              <Route path="/net-worth"            element={<NetWorthTracker />}       />
              <Route path="/sleep-score"          element={<SleepScore />}            />
              <Route path="/flashcards"           element={<StudyFlashcards />}       />
              <Route path="/recovery"             element={<RecoveryTracker />}       />
              <Route path="/skill-roadmap"        element={<SkillRoadmap />}          />
              <Route path="/quick-capture"        element={<QuickCapture />}          />
              <Route path="/evening-review"       element={<EveningReview />}         />
              <Route path="/year-review"          element={<YearInReview />}          />
              <Route path="/morning-routine"      element={<MorningRoutine />}        />
              <Route path="/conversation-log"     element={<ConversationLog />}       />
              <Route path="/fitness-log"          element={<FitnessLog />}            />
              <Route path="/money-mindset"        element={<MoneyMindset />}          />
              <Route path="/nutrition-goals"      element={<NutritionGoals />}        />
              <Route path="/career"               element={<CareerTracker />}         />
              <Route path="/idea-vault"           element={<IdeaVault />}             />
              <Route path="/project-sprint"       element={<ProjectSprint />}         />
              <Route path="/creative-journal"     element={<CreativeJournal />}       />
              <Route path="/flow-state"           element={<FlowState />}             />
              <Route path="/fear-log"             element={<FearLog />}               />
              <Route path="/win-streak"           element={<WinStreak />}             />
              <Route path="/daily-script"         element={<DailyScript />}           />
              <Route path="/life-vision"          element={<LifeVision />}            />
              <Route path="/life-chapters"        element={<LifeChapters />}          />
              <Route path="/network-map"          element={<NetworkMap />}            />
              <Route path="/training-plan"        element={<TrainingPlan />}          />
              <Route path="/grief-journal"        element={<GriefJournal />}          />
              <Route path="/spiritual"            element={<SpiritualJourney />}      />
              <Route path="/parenting"            element={<ParentingLog />}          />
              <Route path="/side-projects"        element={<SideProjects />}          />
              <Route path="/volunteer"            element={<VolunteerLog />}          />
              <Route path="/travel"               element={<TravelLog />}             />
              <Route path="/languages"            element={<LanguageLearning />}      />
              <Route path="/diet"                 element={<DietTracker />}           />
              <Route path="/pet-care"             element={<PetCare />}               />
              <Route path="/home-improvement"     element={<HomeImprovement />}       />
              <Route path="/mentoring"            element={<MentoringJournal />}      />
              <Route path="/public-speaking"      element={<PublicSpeaking />}        />
              <Route path="/coffee-log"           element={<CoffeeLog />}             />
              <Route path="/creative-projects"    element={<CreativeProjects />}      />
              <Route path="/health-symptoms"      element={<HealthSymptoms />}        />
              <Route path="/investments"          element={<InvestmentTracker />}     />
              <Route path="/weight"               element={<WeightTracker />}         />
              <Route path="/charity"              element={<CharityTracker />}        />
              <Route path="/mood-board"           element={<MoodBoard />}             />
              <Route path="/lessons"              element={<LessonLearned />}         />
              <Route path="/conflict-log"         element={<ConflictLog />}           />
              <Route path="/garden"               element={<GardeningLog />}          />
              <Route path="/reading-challenge"   element={<ReadingChallenge />}      />
              <Route path="/negotiation-log"     element={<NegotiationLog />}        />
              <Route path="/love-languages"      element={<LoveLanguages />}         />
              <Route path="/recipes"             element={<RecipeJournal />}         />
              <Route path="/social-calendar"     element={<SocialCalendar />}        />
              <Route path="/inventory"           element={<PersonalInventory />}     />
              <Route path="/dreams"             element={<DreamsJournal />}         />
              <Route path="/therapy"            element={<TherapyLog />}            />
              <Route path="/supplements"        element={<SupplementLog />}         />
              <Route path="/screen-time"        element={<ScreenTimeLog />}         />
              <Route path="/family-gratitude"   element={<GratitudeToParents />}    />
              <Route path="/future-letters"     element={<FutureLetters />}         />
              <Route path="/personal-policies"  element={<PersonalPolicies />}      />
              <Route path="/monthly-retro"      element={<MonthlyRetro />}          />
              <Route path="/mindful-eating"     element={<MindfulEating />}         />
              <Route path="/forgiveness"        element={<ForgivenessLog />}        />
              <Route path="/eco"                element={<EcoTracker />}            />
              <Route path="/life-regrets"       element={<LifeRegrets />}           />
              <Route path="/hobbies"            element={<HobbiesTracker />}        />
              <Route path="/allergies"          element={<AllergyLog />}            />
              <Route path="/account-vault"      element={<PasswordVault />}         />
              <Route path="/sport-stats"        element={<SportStats />}            />
              <Route path="/skincare"           element={<SkinCareLog />}           />
              <Route path="/career-skills"      element={<CareerSkills />}          />
              <Route path="/morning-mindset"    element={<MorningMindset />}        />
              <Route path="/gift-ideas"         element={<GiftIdeas />}             />
              <Route path="/appointments"       element={<AppointmentsLog />}       />
              <Route path="/wish-list"          element={<WishList />}              />
              <Route path="/memories"           element={<MemoriesVault />}         />
              <Route path="/budget"             element={<BudgetPlanner />}         />
              <Route path="/sleep-diary"        element={<SleepDiary />}            />
              <Route path="/philosophy"         element={<LifePhilosophy />}        />
              <Route path="/music-log"          element={<MusicLog />}              />
              <Route path="/movies"             element={<MoviesLog />}             />
              <Route path="/family-tree"        element={<FamilyTree />}            />
              <Route path="/comm-log"           element={<CommunicationLog />}      />
              <Route path="/personal-challenges" element={<PersonalChallenges />}   />
              <Route path="/health-vitals"      element={<HealthVitals />}          />
              <Route path="/personal-research"  element={<PersonalResearch />}      />
              <Route path="/daily-affirmations" element={<DailyAffirmations />}     />
              <Route path="/body-scan"          element={<BodyScanLog />}           />
              <Route path="/financial-literacy" element={<FinancialLiteracy />}     />
              <Route path="/private-journal"    element={<PasswordJournal />}       />
              <Route path="/rel-goals"          element={<RelationshipGoals />}     />
              <Route path="/life-experiences"   element={<LifeExperiences />}       />
              <Route path="/money-tracker"      element={<MoneyTracker />}          />
              <Route path="/creativity-log"     element={<CreativityLog />}         />
              <Route path="/brand-builder"      element={<PersonalBrandBuilder />}  />
              <Route path="/food-diary"         element={<FoodDiary />}             />
              <Route path="/exercise-log"       element={<ExerciseLog />}           />
              <Route path="/career-journey"     element={<CareerJourney />}         />
              <Route path="/mental-models"      element={<MentalModels />}          />
              <Route path="/travel-planner"     element={<TravelPlanner />}         />
              <Route path="/language-journal"    element={<LanguageJournal />}        />
              <Route path="/vision-journal"     element={<VisionJournal />}         />
              <Route path="/constitution"       element={<PersonalConstitution />}  />
              <Route path="/friendships"        element={<FriendshipTracker />}     />
              <Route path="/digital-footprint"  element={<DigitalFootprint />}      />
              <Route path="/life-letters"       element={<LifeLetters />}           />
              <Route path="/mindfulness-log"    element={<MindfulnessLog />}        />
              <Route path="/anger-log"          element={<AngerLog />}              />
              <Route path="/curiosity-journal"  element={<CuriosityJournal />}      />
              <Route path="/time-capsule"       element={<PersonalTimeCapsule />}   />
              <Route path="/workplace-log"      element={<WorkplaceLog />}          />
              <Route path="/success-stories"    element={<SuccessStories />}        />
              <Route path="/confidence"         element={<ConfidenceBuilder />}     />
              <Route path="/social-skills"      element={<SocialSkillsLog />}       />
              <Route path="/life-numbers"       element={<LifeNumbersTracker />}    />
              <Route path="/personal-mythology" element={<PersonalMythology />}     />
              <Route path="/daily-questions"    element={<DailyQuestions />}        />
              <Route path="/energy-audit"       element={<EnergyAudit />}           />
              <Route path="/moral-compass"      element={<MoralCompass />}          />
              <Route path="/sabbatical"         element={<SabbaticalPlanner />}     />
              <Route path="/adventure-log"      element={<AdventureLog />}          />
              <Route path="/dating-journal"     element={<DatingJournal />}         />
              <Route path="/breakup-journal"    element={<BreakupJournal />}        />
              <Route path="/self-care"          element={<SelfCarePlan />}          />
              <Route path="/monthly-intentions" element={<MonthlyIntentions />}     />
              <Route path="/personal-legacy"    element={<PersonalLegacy />}        />
              <Route path="/climate-log"        element={<ClimateLog />}            />
              <Route path="/joy-log"            element={<JoyLog />}                />
              <Route path="/learning-goals"     element={<LearningGoals />}         />
              <Route path="/life-purpose"       element={<LifePurpose />}           />
              <Route path="/thought-patterns"   element={<ThoughtPatterns />}       />
              <Route path="/finance-ratios"     element={<PersonalFinanceRatios />} />
              <Route path="/mindset-shifts"     element={<HabitMindsetShift />}     />
              <Route path="/grateful-moments"   element={<GratefulMoments />}       />
              <Route path="/skill-inventory"    element={<SkillInventory />}        />
              <Route path="/weekly-reflection"  element={<WeeklyReflection />}      />
              <Route path="/mantra-log"         element={<MantraLog />}             />
              <Route path="/personal-swot"      element={<PersonalSWOT />}          />
              <Route path="/goal-post-mortem"   element={<GoalPostMortem />}        />
              <Route path="/self-talk"          element={<SelfTalk />}              />
              <Route path="/vulnerability-log"  element={<VulnerabilityLog />}      />
              <Route path="/micro-wins"         element={<MicroWins />}             />
              <Route path="/rel-values"         element={<RelationshipValues />}    />
              <Route path="/focus-batteries"    element={<FocusBatteries />}        />
              <Route path="/rituals-log"        element={<RitualsLog />}            />
              <Route path="/inner-critic"       element={<InnerCriticLog />}        />
              <Route path="/peak-performance"   element={<PeakPerformance />}       />
              <Route path="/breathwork-log"     element={<BreathworkLog />}         />
              <Route path="/personal-prs"       element={<PersonalPRs />}           />
              <Route path="/emotion-library"    element={<EmotionLibrary />}        />
              <Route path="/social-projects"   element={<SocialProjects />}        />
              <Route path="/digital-minimalism" element={<DigitalMinimalism />}   />
              <Route path="/nutrition-wins"    element={<NutritionWins />}         />
              <Route path="/crisis-log"       element={<CrisisLog />}             />
              <Route path="/boundaries"       element={<BoundariesLog />}         />
              <Route path="/philosophy-notes" element={<PhilosophyNotes />}       />
              <Route path="/sleep-goals"      element={<SleepGoals />}            />
              <Route path="/challenge-tracker" element={<ChallengeTracker />}    />
              <Route path="/debt-tracker"     element={<PersonalDebts />}         />
              <Route path="/strengths-log"   element={<StrengthsLog />}          />
              <Route path="/time-wasters"    element={<TimeWasters />}           />
              <Route path="/health-habits"   element={<HealthHabits />}          />
              <Route path="/wisdom-log"      element={<WisdomLog />}             />
              <Route path="/gratitude-practice" element={<GratitudePractice />} />
              <Route path="/mindful-movement" element={<MindfulMovement />}    />
              <Route path="/experience-ledger" element={<ExperienceLedger />}  />
              <Route path="/confidence-journal" element={<ConfidenceJournal />}/>
              <Route path="/monthly-goals"    element={<MonthlyGoals />}       />
              <Route path="/body-language"    element={<BodyLanguageLog />}    />
            </Routes>
          </div>
        </main>
      </div>
      </AppShell>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App

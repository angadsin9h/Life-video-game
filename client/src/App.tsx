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
import ReadingList from './pages/ReadingList'
import PersonalValues2 from './pages/PersonalValues2'
import AnnualReview from './pages/AnnualReview'
import GoalReview from './pages/GoalReview'
import NegativeVisualization from './pages/NegativeVisualization'
import RelapseLog from './pages/RelapseLog'
import EnergyFood from './pages/EnergyFood'
import LifeInterests from './pages/LifeInterests'
import BoundariesLog from './pages/BoundariesLog'
import PhilosophyNotes from './pages/PhilosophyNotes'
import SleepGoals from './pages/SleepGoals'
import ChallengeTracker from './pages/ChallengeTracker'
import PersonalDebts from './pages/PersonalDebts'
import PersonalAudit from './pages/PersonalAudit'
import LegacyLetters from './pages/LegacyLetters'
import EmotionalTriggers from './pages/EmotionalTriggers'
import StoicPractice from './pages/StoicPractice'
import CourageLog from './pages/CourageLog'
import EgoJournal from './pages/EgoJournal'
import IntentionSetter from './pages/IntentionSetter'
import MotivationLog from './pages/MotivationLog'
import HabitAutopsy from './pages/HabitAutopsy'
import ProcrastinationLog from './pages/ProcrastinationLog'
import MentorQuotes from './pages/MentorQuotes'
import PersonalCredo from './pages/PersonalCredo'
import GrowthEdges from './pages/GrowthEdges'
import ShadowWork from './pages/ShadowWork'
import LifeDesign from './pages/LifeDesign'
import PowerBeliefs from './pages/PowerBeliefs'
import FamilyGoals from './pages/FamilyGoals'
import MicroJournal from './pages/MicroJournal'
import ExerciseLibrary from './pages/ExerciseLibrary'
import MealLog from './pages/MealLog'
import MindsetShifts from './pages/MindsetShifts'
import FinancialIndependence from './pages/FinancialIndependence'
import SocialCircle from './pages/SocialCircle'
import CareerMilestones from './pages/CareerMilestones'
import PersonalRituals from './pages/PersonalRituals'
import SkillGaps from './pages/SkillGaps'
import PainPoints from './pages/PainPoints'
import DisciplineLog from './pages/DisciplineLog'
import WinJournal from './pages/WinJournal'
import GratitudeMap from './pages/GratitudeMap'
import LifeContracts from './pages/LifeContracts'
import FocusModes from './pages/FocusModes'
import SpiritualPractice from './pages/SpiritualPractice'
import PerformanceLog from './pages/PerformanceLog'
import ObstacleMap from './pages/ObstacleMap'
import ResilienceLog from './pages/ResilienceLog'
import BreakLog from './pages/BreakLog'
import CharacterSheet from './pages/CharacterSheet'
import DebtFreeJourney from './pages/DebtFreeJourney'
import LifeExperiments from './pages/LifeExperiments'
import MindfulnessTimer from './pages/MindfulnessTimer'
import HealthProtocols from './pages/HealthProtocols'
import NetworkBuilder from './pages/NetworkBuilder'
import LearningRoadmap from './pages/LearningRoadmap'
import MorningMindfulnessJournal from './pages/MorningMindfulnessJournal'
import EveningWindDown from './pages/EveningWindDown'
import ValuesAlignment from './pages/ValuesAlignment'
import BodyBudget from './pages/BodyBudget'
import GoalSprint from './pages/GoalSprint'
import ThoughtLeadership from './pages/ThoughtLeadership'
import FearInventory from './pages/FearInventory'
import InvestmentPortfolio from './pages/InvestmentPortfolio'
import HabitStacks from './pages/HabitStacks'
import IdentityLog from './pages/IdentityLog'
import RelationshipNurture from './pages/RelationshipNurture'
import LifePhilosophyLog from './pages/LifePhilosophyLog'
import SuccessRituals from './pages/SuccessRituals'
import AntifragileLog from './pages/AntifragileLog'
import DeepWorkSession from './pages/DeepWorkSession'
import ClarityJournal from './pages/ClarityJournal'
import MindsetArmor from './pages/MindsetArmor'
import LifeConversations from './pages/LifeConversations'
import PersonalBoardroom from './pages/PersonalBoardroom'
import FlowTriggers from './pages/FlowTriggers'
import GrowthChallenges from './pages/GrowthChallenges'
import StrategicVision from './pages/StrategicVision'
import EmotionalRegulation from './pages/EmotionalRegulation'
import PurposeAlignment from './pages/PurposeAlignment'
import LifeMoments from './pages/LifeMoments'
import BeliefSystem from './pages/BeliefSystem'
import SocialContributions from './pages/SocialContributions'
import MoneyBeliefs from './pages/MoneyBeliefs'
import CognitiveLoad from './pages/CognitiveLoad'
import SkillMastery from './pages/SkillMastery'
import HealthOptimization from './pages/HealthOptimization'
import CreativeProcess from './pages/CreativeProcess'
import LifeBalance from './pages/LifeBalance'
import MortalityLog from './pages/MortalityLog'
import DecisionArchive from './pages/DecisionArchive'
import PersonalAlgorithm from './pages/PersonalAlgorithm'
import WellbeingCheck from './pages/WellbeingCheck'
import GratitudeDepth from './pages/GratitudeDepth'
import AbundanceMindset from './pages/AbundanceMindset'
import PowerMoments from './pages/PowerMoments'
import IntegrityLog from './pages/IntegrityLog'
import SoulPurpose from './pages/SoulPurpose'
import LifeCurriculum from './pages/LifeCurriculum'
import FutureSelfLog from './pages/FutureSelfLog'
import PeakStateLog from './pages/PeakStateLog'
import InnerDialogue from './pages/InnerDialogue'
import ContributionLog from './pages/ContributionLog'
import MindBodyLog from './pages/MindBodyLog'
import WisdomArchive from './pages/WisdomArchive'
import GratitudeForChallenges from './pages/GratitudeForChallenges'
import LifeExitStrategy from './pages/LifeExitStrategy'
import CharacterVirtues from './pages/CharacterVirtues'
import LifeExperimentLog from './pages/LifeExperimentLog'
import LifePhases from './pages/LifePhases'
import RelationshipDepth from './pages/RelationshipDepth'
import NarrativeReframe from './pages/NarrativeReframe'
import ValueHierarchy from './pages/ValueHierarchy'
import MindfulnessDepth from './pages/MindfulnessDepth'
import SuccessDNA from './pages/SuccessDNA'
import LifeInvestments from './pages/LifeInvestments'
import ThinkingStyles from './pages/ThinkingStyles'
import LifeOptimizer from './pages/LifeOptimizer'
import DeepListening from './pages/DeepListening'
import EmotionMastery from './pages/EmotionMastery'
import PresenceLog from './pages/PresenceLog'
import CompassionLog from './pages/CompassionLog'
import LegacyBuilder from './pages/LegacyBuilder'
import LifeAlchemy from './pages/LifeAlchemy'
import ExistentialLog from './pages/ExistentialLog'
import InnerPeaceLog from './pages/InnerPeaceLog'
import ServiceLog from './pages/ServiceLog'
import CreativeFlow from './pages/CreativeFlow'
import GrowthMindset from './pages/GrowthMindset'
import WealthMindset from './pages/WealthMindset'
import BoundaryBuilder from './pages/BoundaryBuilder'
import HealingJournal from './pages/HealingJournal'
import VisionCasting from './pages/VisionCasting'
import PurposeLog from './pages/PurposeLog'
import SelfMasteryLog from './pages/SelfMasteryLog'
import TimePhilosophy from './pages/TimePhilosophy'
import JoyDesign from './pages/JoyDesign'
import EnergyBudget from './pages/EnergyBudget'
import InspiredAction from './pages/InspiredAction'
import MindfulCommunication from './pages/MindfulCommunication'
import PhysicalPeak from './pages/PhysicalPeak'
import SocialIntelligence from './pages/SocialIntelligence'
import DailyExcellence from './pages/DailyExcellence'
import LifeReview from './pages/LifeReview'
import ResilientThinking from './pages/ResilientThinking'
import DigitalWellness from './pages/DigitalWellness'
import NeuroplasticityLog from './pages/NeuroplasticityLog'
import IntuitiveDecision from './pages/IntuitiveDecision'
import BodyWisdom from './pages/BodyWisdom'
import GratitudeToself from './pages/GratitudeToself'
import WillpowerLog from './pages/WillpowerLog'
import MindfulSleep from './pages/MindfulSleep'

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
              <Route path="/reading-list"    element={<ReadingList />}        />
              <Route path="/core-values"     element={<PersonalValues2 />}   />
              <Route path="/annual-review"   element={<AnnualReview />}      />
              <Route path="/goal-review"     element={<GoalReview />}        />
              <Route path="/neg-visualization" element={<NegativeVisualization />} />
              <Route path="/relapse-log"     element={<RelapseLog />}        />
              <Route path="/energy-food"     element={<EnergyFood />}        />
              <Route path="/life-interests"  element={<LifeInterests />}     />
              <Route path="/personal-audit"  element={<PersonalAudit />}    />
              <Route path="/legacy-letters"  element={<LegacyLetters />}    />
              <Route path="/emotional-triggers" element={<EmotionalTriggers />} />
              <Route path="/stoic-practice"    element={<StoicPractice />}     />
              <Route path="/courage-log"       element={<CourageLog />}        />
              <Route path="/ego-journal"       element={<EgoJournal />}        />
              <Route path="/intention-setter"  element={<IntentionSetter />}   />
              <Route path="/motivation-log"    element={<MotivationLog />}     />
              <Route path="/habit-autopsy"    element={<HabitAutopsy />}      />
              <Route path="/procrastination"  element={<ProcrastinationLog />}/>
              <Route path="/mentor-quotes"    element={<MentorQuotes />}      />
              <Route path="/personal-credo"   element={<PersonalCredo />}     />
              <Route path="/growth-edges"     element={<GrowthEdges />}       />
              <Route path="/shadow-work"      element={<ShadowWork />}        />
              <Route path="/life-design"      element={<LifeDesign />}        />
              <Route path="/power-beliefs"    element={<PowerBeliefs />}      />
              <Route path="/family-goals"     element={<FamilyGoals />}       />
              <Route path="/micro-journal"    element={<MicroJournal />}      />
              <Route path="/exercise-library" element={<ExerciseLibrary />}  />
              <Route path="/meal-log"         element={<MealLog />}          />
              <Route path="/mindset-shifts-v2" element={<MindsetShifts />}  />
              <Route path="/fi-tracker"       element={<FinancialIndependence />} />
              <Route path="/social-circle"    element={<SocialCircle />}      />
              <Route path="/career-milestones" element={<CareerMilestones />} />
              <Route path="/personal-rituals" element={<PersonalRituals />}   />
              <Route path="/skill-gaps"       element={<SkillGaps />}         />
              <Route path="/pain-points"      element={<PainPoints />}        />
              <Route path="/discipline-log"   element={<DisciplineLog />}     />
              <Route path="/win-journal"       element={<WinJournal />}        />
              <Route path="/gratitude-map"     element={<GratitudeMap />}      />
              <Route path="/life-contracts"    element={<LifeContracts />}     />
              <Route path="/focus-modes"       element={<FocusModes />}        />
              <Route path="/spiritual-practice" element={<SpiritualPractice />}/>
              <Route path="/performance-log"   element={<PerformanceLog />}    />
              <Route path="/obstacle-map"      element={<ObstacleMap />}       />
              <Route path="/resilience-log"    element={<ResilienceLog />}     />
              <Route path="/break-log"         element={<BreakLog />}          />
              <Route path="/character-sheet"   element={<CharacterSheet />}    />
              <Route path="/debt-free"         element={<DebtFreeJourney />}   />
              <Route path="/life-experiments"   element={<LifeExperiments />}    />
              <Route path="/mindfulness-timer" element={<MindfulnessTimer />}  />
              <Route path="/health-protocols"  element={<HealthProtocols />}   />
              <Route path="/network-builder"   element={<NetworkBuilder />}    />
              <Route path="/learning-roadmap"       element={<LearningRoadmap />}          />
              <Route path="/morning-mindfulness"     element={<MorningMindfulnessJournal />}/>
              <Route path="/evening-wind-down"       element={<EveningWindDown />}          />
              <Route path="/values-alignment"        element={<ValuesAlignment />}          />
              <Route path="/body-budget"             element={<BodyBudget />}               />
              <Route path="/goal-sprint"            element={<GoalSprint />}               />
              <Route path="/thought-leadership"     element={<ThoughtLeadership />}        />
              <Route path="/fear-inventory"         element={<FearInventory />}            />
              <Route path="/investment-portfolio"   element={<InvestmentPortfolio />}      />
              <Route path="/habit-stacks-v2"        element={<HabitStacks />}              />
              <Route path="/identity-log"           element={<IdentityLog />}              />
              <Route path="/relationship-nurture"   element={<RelationshipNurture />}      />
              <Route path="/philosophy-log"         element={<LifePhilosophyLog />}        />
              <Route path="/success-rituals"        element={<SuccessRituals />}           />
              <Route path="/antifragile-log"        element={<AntifragileLog />}           />
              <Route path="/deep-work-sessions"     element={<DeepWorkSession />}          />
              <Route path="/clarity-journal"        element={<ClarityJournal />}           />
              <Route path="/mindset-armor"          element={<MindsetArmor />}             />
              <Route path="/life-conversations"     element={<LifeConversations />}        />
              <Route path="/personal-boardroom"     element={<PersonalBoardroom />}        />
              <Route path="/flow-triggers"          element={<FlowTriggers />}             />
              <Route path="/growth-challenges"      element={<GrowthChallenges />}         />
              <Route path="/strategic-vision"       element={<StrategicVision />}          />
              <Route path="/emotional-regulation"   element={<EmotionalRegulation />}      />
              <Route path="/purpose-alignment"      element={<PurposeAlignment />}         />
              <Route path="/life-moments"           element={<LifeMoments />}              />
              <Route path="/belief-system"          element={<BeliefSystem />}             />
              <Route path="/social-contributions"   element={<SocialContributions />}      />
              <Route path="/money-beliefs"          element={<MoneyBeliefs />}             />
              <Route path="/cognitive-load"         element={<CognitiveLoad />}            />
              <Route path="/skill-mastery"          element={<SkillMastery />}             />
              <Route path="/health-optimization"    element={<HealthOptimization />}       />
              <Route path="/creative-process"       element={<CreativeProcess />}          />
              <Route path="/life-balance"           element={<LifeBalance />}              />
              <Route path="/mortality-log"          element={<MortalityLog />}             />
              <Route path="/decision-archive"       element={<DecisionArchive />}          />
              <Route path="/personal-algorithm"     element={<PersonalAlgorithm />}        />
              <Route path="/wellbeing-check"        element={<WellbeingCheck />}           />
              <Route path="/gratitude-depth"        element={<GratitudeDepth />}           />
              <Route path="/abundance-mindset"      element={<AbundanceMindset />}         />
              <Route path="/power-moments"          element={<PowerMoments />}             />
              <Route path="/integrity-log"          element={<IntegrityLog />}             />
              <Route path="/soul-purpose"           element={<SoulPurpose />}              />
              <Route path="/life-curriculum"        element={<LifeCurriculum />}           />
              <Route path="/future-self"            element={<FutureSelfLog />}            />
              <Route path="/peak-state"             element={<PeakStateLog />}             />
              <Route path="/inner-dialogue"         element={<InnerDialogue />}            />
              <Route path="/contribution-log"       element={<ContributionLog />}          />
              <Route path="/mind-body-log"          element={<MindBodyLog />}              />
              <Route path="/wisdom-archive"         element={<WisdomArchive />}            />
              <Route path="/gratitude-challenges"   element={<GratitudeForChallenges />}   />
              <Route path="/life-exit-strategy"     element={<LifeExitStrategy />}         />
              <Route path="/character-virtues"      element={<CharacterVirtues />}         />
              <Route path="/life-experiment-log"    element={<LifeExperimentLog />}        />
              <Route path="/life-phases"            element={<LifePhases />}               />
              <Route path="/relationship-depth"     element={<RelationshipDepth />}        />
              <Route path="/narrative-reframe"      element={<NarrativeReframe />}         />
              <Route path="/value-hierarchy"        element={<ValueHierarchy />}           />
              <Route path="/mindfulness-depth"      element={<MindfulnessDepth />}         />
              <Route path="/success-dna"            element={<SuccessDNA />}               />
              <Route path="/life-investments"       element={<LifeInvestments />}          />
              <Route path="/thinking-styles"        element={<ThinkingStyles />}           />
              <Route path="/life-optimizer"         element={<LifeOptimizer />}            />
              <Route path="/deep-listening"         element={<DeepListening />}            />
              <Route path="/emotion-mastery"        element={<EmotionMastery />}           />
              <Route path="/presence-log"           element={<PresenceLog />}              />
              <Route path="/compassion-log"         element={<CompassionLog />}            />
              <Route path="/legacy-builder"         element={<LegacyBuilder />}            />
              <Route path="/life-alchemy"           element={<LifeAlchemy />}              />
              <Route path="/existential-log"        element={<ExistentialLog />}           />
              <Route path="/inner-peace-log"        element={<InnerPeaceLog />}            />
              <Route path="/service-log"            element={<ServiceLog />}               />
              <Route path="/creative-flow"          element={<CreativeFlow />}             />
              <Route path="/growth-mindset"         element={<GrowthMindset />}            />
              <Route path="/wealth-mindset"         element={<WealthMindset />}            />
              <Route path="/boundary-builder"       element={<BoundaryBuilder />}          />
              <Route path="/healing-journal"        element={<HealingJournal />}           />
              <Route path="/vision-casting"         element={<VisionCasting />}            />
              <Route path="/purpose-log"            element={<PurposeLog />}               />
              <Route path="/self-mastery-log"       element={<SelfMasteryLog />}           />
              <Route path="/time-philosophy"        element={<TimePhilosophy />}           />
              <Route path="/joy-design"             element={<JoyDesign />}                />
              <Route path="/energy-budget"          element={<EnergyBudget />}             />
              <Route path="/inspired-action"        element={<InspiredAction />}           />
              <Route path="/mindful-communication"  element={<MindfulCommunication />}     />
              <Route path="/physical-peak"          element={<PhysicalPeak />}             />
              <Route path="/social-intelligence"    element={<SocialIntelligence />}       />
              <Route path="/daily-excellence"       element={<DailyExcellence />}          />
              <Route path="/life-review"            element={<LifeReview />}               />
              <Route path="/resilient-thinking"     element={<ResilientThinking />}        />
              <Route path="/digital-wellness"       element={<DigitalWellness />}          />
              <Route path="/neuroplasticity"        element={<NeuroplasticityLog />}       />
              <Route path="/intuitive-decision"     element={<IntuitiveDecision />}        />
              <Route path="/body-wisdom"            element={<BodyWisdom />}               />
              <Route path="/gratitude-to-self"      element={<GratitudeToself />}          />
              <Route path="/willpower-log"          element={<WillpowerLog />}             />
              <Route path="/mindful-sleep"          element={<MindfulSleep />}             />
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

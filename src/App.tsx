/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldAlert, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Search,
  Activity,
  Waves,
  Flame,
  AlertTriangle,
  History,
  CloudSun,
  Lock,
  Fingerprint,
  Smartphone,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, UserRole, User, Alert, QuizQuestion } from './types';
import { DISASTER_MODULES, INITIAL_ALERTS, EMERGENCY_PLANS } from './constants';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

import { generateQuizForModule } from './services/geminiService';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from './services/firebase';

// --- Quiz Component ---
function Quiz({ moduleTitle, moduleContent, onClose }: { moduleTitle: string; moduleContent: string; onClose: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      const q = await generateQuizForModule(moduleTitle, moduleContent);
      setQuestions(q);
      setLoading(false);
    }
    loadQuiz();
  }, [moduleTitle, moduleContent]);

  const handleAnswer = (idx: number) => {
    setSelectedOption(idx);
    setTimeout(() => {
      if (idx === questions[currentStep].correctAnswer) {
        setScore(score + 1);
      }
      
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedOption(null);
      } else {
        setIsFinished(true);
      }
    }, 1000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="h-12 w-12 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
      <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Intel Quizzes...</p>
    </div>
  );

  if (isFinished) return (
    <div className="text-center py-12">
      <div className="h-24 w-24 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-black border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        {Math.round((score / questions.length) * 100)}%
      </div>
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Deployment Ready</h2>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">Intel verification complete for {moduleTitle}. You are now certified for this protocol.</p>
      <button 
        onClick={onClose}
        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-cyan-500/20"
      >
        Acknowledge & Close
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-10">
        <div className="h-1 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <span>Intel Query {currentStep + 1} / {questions.length}</span>
          <span>Threshold: 70%</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-10 leading-tight tracking-tight">
        {questions[currentStep].text}
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {questions[currentStep].options.map((option, idx) => (
          <button
            key={idx}
            disabled={selectedOption !== null}
            onClick={() => handleAnswer(idx)}
            className={cn(
              "p-5 text-left rounded-xl border transition-all font-bold text-sm",
              selectedOption === null 
                ? "bg-white/5 border-white/5 hover:border-cyan-500/50 hover:bg-white/10 text-slate-300" 
                : selectedOption === idx 
                  ? idx === questions[currentStep].correctAnswer ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-red-500/10 border-red-500/50 text-red-400"
                  : idx === questions[currentStep].correctAnswer ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 opacity-80" : "bg-white/2 border-white/2 opacity-30 text-slate-600"
            )}
          >
            <span className="mr-4 opacity-30 text-[10px] font-mono">0{idx + 1}</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ user, alerts, weather }: { user: User; alerts: Alert[]; weather: { temp: number; status: string } }) {
  const recentAlerts = alerts.slice(0, 3);
  
  const drillData = [
    { name: 'Jan', performance: 65 },
    { name: 'Feb', performance: 72 },
    { name: 'Mar', performance: 85 },
    { name: 'Apr', performance: 78 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1">
            System Overview $ <span className="text-slate-500 font-normal underline decoration-slate-800 underline-offset-4">{user?.name?.split(' ')[0] || 'Operator'}</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Network Status: Nominal • {user?.institution || 'SafeGuard Node'}
          </p>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 bg-cyan-500/5">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <CloudSun size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-tight">{weather.temp}°C • {weather.status}</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-0.5">Live Weather Telemetry</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Preparedness', value: '82%', trend: '+5%', color: 'cyan' },
          { label: 'Modules Completed', value: '12 / 15', trend: '+2', color: 'indigo' },
          { label: 'Active Alerts', value: alerts.length.toString(), trend: 'Alert Level 1', color: 'red' },
          { label: 'System Uptime', value: '99.9%', trend: 'Stable', color: 'emerald' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-5 group hover:bg-white/5 transition-colors"
          >
            <div className="card-title-sm">
              {stat.label}
            </div>
            <div className="flex items-end justify-between">
              <div className="stat-val">{stat.value}</div>
              <div className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                stat.color === 'red' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
              )}>
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 flex flex-direction-column">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" /> Performance Metrics
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drillData}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569'}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569'}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorPerf)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Bell size={16} className="text-red-400" /> Active Intel
          </h3>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex gap-4 group cursor-pointer hover:bg-white/5 p-3 -mx-3 rounded-xl transition-all border border-transparent hover:border-white/5">
                <div className={cn(
                  "mt-1 shrink-0 p-2 rounded-lg h-10 w-10 flex items-center justify-center border",
                  alert.type === 'CRITICAL' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  alert.type === 'WARNING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  alert.type === 'DRILL' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  {alert.type === 'CRITICAL' ? <AlertTriangle size={16} /> : 
                   alert.type === 'DRILL' ? <Activity size={16} /> : <Bell size={16} />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-white line-clamp-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                    {alert.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal font-medium">
                    {alert.message}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-2 uppercase tracking-widest flex items-center justify-between">
                    <span>{alert.sender}</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-[0.2em]">
            Archived Intel Feed
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Education Component ---
function EducationView({ user }: { user: User }) {
  const [selectedModule, setSelectedModule] = useState(DISASTER_MODULES[0]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  if (isQuizOpen) {
    return (
      <div className="glass-card p-10 h-full relative">
        <button 
          onClick={() => setIsQuizOpen(false)}
          className="mb-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px]"
        >
          <X size={14} /> Abort Certification
        </button>
        <Quiz 
          moduleTitle={selectedModule.title} 
          moduleContent={selectedModule.content} 
          onClose={() => setIsQuizOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">Intel Repository</h2>
          <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest mt-1">Hazard Response Curriculum</p>
        </div>
        
        {DISASTER_MODULES.map((module) => (
          <button
            key={module.id}
            onClick={() => setSelectedModule(module)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden",
              selectedModule.id === module.id 
                ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10" 
                : "bg-white/5 border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "p-3 rounded-lg border",
                selectedModule.id === module.id ? "bg-cyan-400 text-bg-dark border-cyan-400" : "bg-white/5 text-slate-400 border-white/10 group-hover:bg-white/10"
              )}>
                {module.type === 'Earthquake' && <Activity size={18} />}
                {module.type === 'Flood' && <Waves size={18} />}
                {module.type === 'Fire' && <Flame size={18} />}
              </div>
              <div>
                <div className={cn(
                  "font-black text-xs uppercase tracking-tight",
                  selectedModule.id === module.id ? "text-cyan-400" : "text-slate-300"
                )}>
                  {module.title}
                </div>
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                  selectedModule.id === module.id ? "text-cyan-400/60" : "text-slate-500"
                )}>
                  Core Intel • {module.type}
                </div>
              </div>
            </div>
          </button>
        ))}

        <div className="p-6 bg-cyan-950/20 rounded-xl border border-cyan-500/10 mt-8 relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="font-black text-xs text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <History size={14} className="text-cyan-400" /> Progression Analytics
            </h4>
            <div className="text-[11px] text-slate-500 font-medium mb-4 leading-relaxed">Compliance status: <span className="text-emerald-400 font-black tracking-widest">VERIFIED</span></div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
              <span>Score: 92%</span>
              <span>Lvl 08</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-cyan-500 w-[92%]"></div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
            <ShieldAlert size={120} />
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 glass-card p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedModule.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-[0.2em] rounded border border-cyan-500/20">
                Protocol {selectedModule.id}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-700"></div>
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
                Operational Intel
              </span>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-6 uppercase italic">
              {selectedModule.title}
            </h1>

            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10 border-l-2 border-cyan-500/50 pl-6 py-1 italic">
              {selectedModule.description}
            </p>

            <div className="prose prose-invert prose-cyan max-w-none mb-12">
              <p className="text-slate-300 leading-relaxed text-lg font-medium opacity-90">
                {selectedModule.content}
              </p>
            </div>

            <div className="bg-white/3 rounded-xl p-8 mb-10 border border-white/5">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <ShieldAlert className="text-cyan-400" size={16} /> Technical Execution Steps
              </h3>
              <div className="space-y-3">
                {selectedModule.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-cyan-500/20 transition-colors group">
                    <div className="h-8 w-8 shrink-0 bg-white/5 text-slate-400 rounded flex items-center justify-center font-mono text-[10px] group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all border border-white/5">
                      0{idx + 1}
                    </div>
                    <div className="text-slate-300 font-bold text-sm tracking-tight">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsQuizOpen(true)}
                className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-cyan-500/20"
              >
                Launch Skill Verification
              </button>
              <button className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all">
                Download Protocol Schema
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Emergency Plans Component ---
function PlansView({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Battle Cards</h2>
          <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest mt-1">Operational Response Protocols</p>
        </div>
        {user.role === 'ADMIN' && (
          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20">
            <Settings size={14} /> Update Schema
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EMERGENCY_PLANS.map((plan) => (
          <div key={plan.id} className="glass-card p-8 hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  {plan.disasterType === 'Fire' && <Flame size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white leading-tight">{plan.title}</h3>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Classification: {plan.disasterType}</div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-600 uppercase border border-white/5 px-2 py-1 rounded bg-white/2">v2.4_PROD</span>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="card-title-sm">Execution Sequence</h4>
                <div className="space-y-3">
                  {plan.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-center group">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] group-hover:scale-150 transition-transform"></div>
                      <span className="text-sm text-slate-300 font-bold tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h4 className="card-title-sm">Assigned Units</h4>
                <div className="grid grid-cols-1 gap-2">
                  {plan.assignedRoles.map((role, idx) => (
                    <div key={idx} className="p-4 bg-white/3 rounded-lg border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-colors">
                      <span className="font-black text-xs text-white uppercase tracking-tight">{role.role}</span>
                      <span className="text-[10px] text-slate-500 italic font-medium opacity-60 group-hover:opacity-100 group-hover:text-cyan-400 transition-all">{role.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em] pt-4 border-t border-white/5">
              <span>Updated: {plan.lastUpdated}</span>
              <button className="text-cyan-400 font-black hover:text-cyan-300 transition-colors border-b border-cyan-400/20 hover:border-cyan-300">Structural Schematic</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Standard Auth Component removed as it was consolidated into App ---

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [systemAlert, setSystemAlert] = useState<Alert | null>(null);
  const [weatherData, setWeatherData] = useState({ temp: 24, status: 'Mostly Sunny' });
  const [loading, setLoading] = useState(true);

  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setCurrentUser(fbUser);
        try {
          const docRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          } else {
            console.warn('Profile not found - creating default');
            const defaultProfile: User = {
              id: fbUser.uid,
              name: fbUser.displayName || 'Rescue Personnel',
              email: fbUser.email || '',
              role: 'STUDENT',
              institution: 'SafeGuard Institute'
            };
            await setDoc(docRef, defaultProfile);
            setUser(defaultProfile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setAuthError('Profile synchronization failed.');
        }
      } else {
        setCurrentUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherData(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() > 0.5 ? 1 : -1)
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (!name.trim()) throw new Error('Name is required');
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const profile: User = {
          id: res.user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role,
          institution: 'SafeGuard Institute'
        };
        await setDoc(doc(db, 'users', res.user.uid), profile);
        setUser(profile);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let msg = 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you haven\'t signed up yet, please register below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already registered';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password too weak';
      } else {
        msg = err.message || msg;
      }
      setAuthError(msg);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const triggerAlert = () => {
    const newAlert: Alert = {
      id: Math.random().toString(),
      type: 'CRITICAL',
      title: 'EMERGENCY ALERT: SEVERE WEATHER',
      message: 'Flash flood warning issued for the campus area. Please move to higher floors and stay away from basement levels. Follow building marshals for evacuation if necessary.',
      timestamp: new Date().toISOString(),
      sender: 'National Command Center'
    };
    setAlerts([newAlert, ...alerts]);
    setSystemAlert(newAlert);
  };

  const toggleRole = async () => {
    if (!user) return;
    const roles: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];
    const nextRole = roles[(roles.indexOf(user.role) + 1) % roles.length];
    
    // Update local state and Firestore
    const updatedUser = { ...user, role: nextRole };
    setUser(updatedUser);
    await updateDoc(doc(db, 'users', updatedUser.id), { role: nextRole });
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'education', label: 'Training', icon: BookOpen },
    { id: 'plans', label: 'Protocols', icon: ShieldAlert },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
  ];

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="atmosphere" />
        <div className="text-center relative z-10">
          <div className="h-12 w-12 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full mb-4 mx-auto" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">establishing secure link...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !user) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 sm:p-8 overflow-hidden relative">
        <div className="atmosphere" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card max-w-md w-full p-10 sm:p-12 relative z-10"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="h-12 w-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20 rotate-3">
              <ShieldAlert size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">SafeGuard<span className="text-cyan-400">Ed</span></h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Protocol Access Terminal</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6 text-left">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors uppercase font-bold tracking-tight"
                    placeholder="Enter Responder Name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Responder ID (Email)</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors uppercase font-bold tracking-tight"
                  placeholder="ID@SAFEGUARD.GOV"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['STUDENT', 'TEACHER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        role === r 
                          ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {authError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-black text-red-300 uppercase tracking-wide leading-relaxed">{authError}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] italic"
            >
              {loading ? 'Processing...' : isLogin ? 'Bridge Connection' : 'Register Sentinel'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors"
            >
              {isLogin ? "Need a new clearance? REGISTER" : "Already have intel? LOGIN"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-slate-50 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="atmosphere" />
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white">
              <ShieldAlert size={18} strokeWidth={2.5} />
            </div>
            <span className="font-black text-xs tracking-tighter uppercase">SafeGuard<span className="text-cyan-400">Ed</span></span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[55] md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 h-full bg-slate-950/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 z-[60]",
          sidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0",
          "md:bg-slate-950/40"
        )}>
          <div className="p-6 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 bg-cyan-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldAlert size={22} strokeWidth={2.5} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg tracking-tighter text-white uppercase">
                  SafeGuard<span className="text-cyan-400">Ed</span>
                </span>
                <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">Emergency Response</span>
              </div>
            )}
          </div>

          <nav className="mt-8 px-4 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg font-bold text-[13px] transition-all relative overflow-hidden group",
                  activeTab === item.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {sidebarOpen && <span className="tracking-tight">{item.label}</span>}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-5 bg-cyan-400 rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-6 left-0 w-full px-4 space-y-1.5">
            <button 
              onClick={toggleRole}
              className="w-full flex items-center gap-3 p-3 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 rounded-lg transition-all text-[13px] font-bold border border-emerald-400/10"
            >
              <UserIcon size={18} />
              {sidebarOpen && <div className="text-left leading-none"><span className="block mb-1">Switch Role</span><span className="text-[9px] uppercase font-mono opacity-50">{user?.role}</span></div>}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-red-400/10 hover:text-red-400 rounded-lg transition-all text-[13px] font-bold"
            >
              <LogOut size={18} />
              {sidebarOpen && <span>Terminate Session</span>}
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex w-full items-center gap-3 p-3 text-slate-600 hover:text-white transition-all text-[13px] font-bold"
            >
              <Menu size={18} />
              {sidebarOpen && <span>Collapse Rail</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "transition-all duration-500 min-h-screen",
          "md:pl-20",
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        )}>
          {/* Top Navbar (Desktop) */}
          <header className="hidden md:flex h-[72px] bg-slate-950/20 backdrop-blur-xl border-b border-white/5 px-8 sticky top-0 z-40 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-full bg-white/5">
                SEC_ZONE_NORTH
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-white tracking-tight">{user?.name}</span>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded leading-none uppercase tracking-widest border border-cyan-400/20">{user?.role}</span>
                </div>
                <div className="h-10 w-10 glass-card p-1 flex items-center justify-center text-slate-400 font-bold border-cyan-500/20">
                  <UserIcon size={18} />
                </div>
              </div>
              <button 
                onClick={triggerAlert}
                className="p-2 text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-lg border border-red-500/20 transition-all group"
              >
                <AlertTriangle size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </header>

          {/* Alert Overlay */}
          <AnimatePresence>
            {systemAlert && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed inset-x-0 bottom-8 z-[100] px-4 md:px-8 pointer-events-none"
              >
                <div className="max-w-2xl mx-auto bg-red-600/30 backdrop-blur-2xl text-white p-5 md:p-6 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] flex items-center gap-4 md:gap-6 pointer-events-auto border border-red-500/50">
                  <div className="h-12 w-12 md:h-16 md:w-16 shrink-0 bg-red-500/20 rounded-xl flex items-center justify-center animate-pulse border border-red-500/30">
                    <AlertTriangle size={24} className="md:w-10 md:h-10 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Critical System Broadcast</div>
                    <h3 className="text-lg md:text-xl font-black tracking-tight mb-1">{systemAlert.title}</h3>
                    <p className="text-xs md:text-sm font-medium opacity-90 text-red-50 line-clamp-2 md:line-clamp-none">{systemAlert.message}</p>
                  </div>
                  <button 
                    onClick={() => setSystemAlert(null)}
                    className="h-10 w-10 md:h-12 md:w-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && user && <Dashboard user={user} alerts={alerts} weather={weatherData} />}
                {activeTab === 'education' && user && <EducationView user={user} />}
                {activeTab === 'plans' && user && <PlansView user={user} />}
                {activeTab === 'reports' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="glass-card p-8">
                      <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <BarChart3 size={16} className="text-cyan-400" /> Dept Proficiency Matrix
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Eng', val: 85 },
                            { name: 'Sci', val: 78 },
                            { name: 'Arts', val: 92 },
                            { name: 'Bus', val: 65 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569'}} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569'}} />
                            <Tooltip 
                               cursor={{fill: '#ffffff05'}} 
                               contentStyle={{ 
                                 backgroundColor: '#0f172a', 
                                 border: '1px solid rgba(255,255,255,0.1)',
                                 fontSize: '11px' 
                               }}
                            />
                            <Bar dataKey="val" radius={[2, 2, 0, 0]} barSize={32}>
                              { [85, 78, 92, 65].map((_, idx) => (
                                <Cell key={idx} fill={['#06b6d4', '#0891b2', '#0e7490', '#164e63'][idx % 4]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="glass-card p-8">
                      <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Activity size={16} className="text-red-400" /> Regional Incident Vectors
                      </h3>
                      <div className="space-y-5">
                        {[
                          { type: 'Hazard Gamma (Flood)', count: 12, color: 'cyan' },
                          { type: 'Hazard Beta (Quake)', count: 4, color: 'slate' },
                          { type: 'Hazard Alpha (Fire)', count: 28, color: 'red' },
                          { type: 'HazMat Sigma', count: 1, color: 'amber' },
                        ].map((item) => (
                          <div key={item.type}>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                              <span className="text-slate-500">{item.type}</span>
                              <span className="text-white">{item.count} Detected</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / 30) * 100}%` }}
                                className={cn(
                                  "h-full rounded-full shadow-[0_0_8px]",
                                  item.color === 'cyan' ? 'bg-cyan-500 shadow-cyan-500/50' :
                                  item.color === 'red' ? 'bg-red-500 shadow-red-500/50' :
                                  item.color === 'amber' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-500 shadow-slate-500/50'
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={16} className="text-cyan-400" /> Historical Ops Log
                      </h3>
                      <button className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-[0.2em] border-b border-cyan-400/20">Sync Archive</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="pb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Timestamp</th>
                            <th className="pb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Hazard ID</th>
                            <th className="pb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Sector</th>
                            <th className="pb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Threat Lvl</th>
                            <th className="pb-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Resolution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/2">
                          {[
                            { date: '2025.11.12', type: 'FIRE_01', loc: 'SEC_E_LAB', sev: 'HIGH', status: 'RESOLVED' },
                            { date: '2025.08.04', type: 'FLOD_01', loc: 'SEC_B_PK', sev: 'MED', status: 'MITIGATED' },
                            { date: '2025.05.20', type: 'QUAK_DRL', loc: 'CAMP_GLB', sev: 'LOW', status: 'SIM_OK' },
                            { date: '2025.02.14', type: 'FIRE_02', loc: 'SEC_CAF', sev: 'CRIT', status: 'RESOLVED' },
                          ].map((log, idx) => (
                            <tr key={idx} className="hover:bg-white/2 transition-colors group">
                              <td className="py-4 text-xs font-mono text-slate-500">{log.date}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "h-1.5 w-1.5 rounded-full shadow-[0_0_5px]",
                                    log.type.includes('FIRE') ? 'bg-red-500 shadow-red-500' :
                                    log.type.includes('FLOD') ? 'bg-cyan-500 shadow-cyan-500' : 'bg-slate-500 shadow-slate-500'
                                  )} />
                                  <span className="text-xs font-black text-slate-300 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{log.type}</span>
                                </div>
                              </td>
                              <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{log.loc}</td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest",
                                  log.sev === 'CRIT' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  log.sev === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-white/5 text-slate-500 border-white/10'
                                )}>
                                  {log.sev}
                                </span>
                              </td>
                              <td className="py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest">{log.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      </div>
  );
}

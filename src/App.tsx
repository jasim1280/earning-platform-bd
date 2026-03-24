/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Play, LogIn, LogOut, Trophy, History, 
  AlertCircle, CheckCircle2, Gift, ArrowUpRight, 
  User as UserIcon, LayoutDashboard, Send, TrendingUp,
  Smartphone, ShieldCheck, ChevronRight, Plus, Trash2, MessageCircle, Megaphone
} from 'lucide-react';

interface UserProfile {
  username: string;
  balance: number;
  totalEarned: number;
  hasDeposited: boolean;
  lastDailyBonus?: number;
  joinedAt: string;
  referralCode: string;
  referredBy?: string;
  referralCount?: number;
}

interface Transaction {
  id: string;
  type: 'reward' | 'bonus' | 'withdrawal' | 'referral' | 'deposit';
  amount: number;
  timestamp: number;
  status: 'completed' | 'pending';
  method?: string;
  phone?: string;
  trxId?: string;
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'leaderboard' | 'withdraw' | 'deposit' | 'admin'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<{username: string, balance: number}[]>([]);
  const [withdrawMethod, setWithdrawMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | null>(null);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [depositMethod, setDepositMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskType, setNewTaskType] = useState<'subscribe' | 'follow' | 'watch'>('subscribe');
  const [isAdminTaskLoading, setIsAdminTaskLoading] = useState(false);
  
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [taskScreenshot, setTaskScreenshot] = useState<string>('');

  const [adminSettings, setAdminSettings] = useState({
    Bkash: '01700000000',
    Nagad: '01800000000',
    Rocket: '01900000000',
    telegramLink: 'https://t.me/your_support_link',
    depositNotice: '৩০০ টাকা সেন্ড মানি করলে টাস্ক আনলক হবে।',
    withdrawNotice: 'উইথড্র করার আগে ব্যালেন্স চেক করুন।',
    taskNotice: 'ডিপোজিট না করলে টাস্ক পাবেন না।'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File is too large (max 2MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin settings", err);
    }
  };

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchCompletedTasks = async (username: string) => {
    try {
      const res = await fetch(`/api/user/${username}/completed-tasks`);
      if (res.ok) {
        const data = await res.json();
        setCompletedTasks(data);
      }
      
      const resPending = await fetch(`/api/user/${username}/pending-tasks`);
      if (resPending.ok) {
        const data = await resPending.json();
        setPendingTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch task status", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminTaskLoading(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          reward: newTaskReward,
          link: newTaskLink,
          type: newTaskType
        })
      });
      if (res.ok) {
        showToast('Task added successfully!');
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskReward('');
        setNewTaskLink('');
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to add task', 'error');
    } finally {
      setIsAdminTaskLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Task deleted');
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  const handleCompleteTask = async (taskId: string, link: string) => {
    if (!user) return;
    if (completedTasks.includes(taskId)) {
      showToast('Task already completed', 'error');
      return;
    }
    if (pendingTasks.includes(taskId)) {
      showToast('Proof already submitted', 'error');
      return;
    }

    // Open link in new tab
    if (link) {
      window.open(link, '_blank');
    }

    setSubmittingTaskId(taskId);
    showToast('লিঙ্ক ওপেন হয়েছে! কাজ শেষ করে স্ক্রিনশট দিন।', 'success');
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !submittingTaskId || !taskScreenshot) return;

    try {
      const res = await fetch('/api/user/submit-task-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          taskId: submittingTaskId,
          screenshot: taskScreenshot
        })
      });
      if (res.ok) {
        showToast('প্রুফ জমা দেওয়া হয়েছে! এডমিন চেক করবে।');
        setSubmittingTaskId(null);
        setTaskScreenshot('');
        fetchCompletedTasks(user.username);
      } else {
        const data = await res.json();
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const [adminRequests, setAdminRequests] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      const resSettings = await fetch('/api/admin/settings');
      if (resSettings.ok) setAdminSettings(await resSettings.json());

      const resRequests = await fetch('/api/admin/requests');
      if (resRequests.ok) setAdminRequests(await resRequests.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const refreshData = async (username: string) => {
    try {
      const res = await fetch(`/api/user/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTransactions(data.transactions);
        if (data.totalUsers) {
          setTotalUsers(data.totalUsers);
        }
      }
      
      // Always fetch settings to ensure numbers are up to date
      fetchAdminSettings();

      if (username === 'admin') {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('earn_rewards_user_session');
    if (savedUser) {
      const username = JSON.parse(savedUser);
      refreshData(username);
      fetchCompletedTasks(username);
    }
    
    // Auto-fill referral from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralInput(ref.toUpperCase());
      setIsSignUp(true);
    }

    fetchLeaderboard();
    fetchTasks();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const body = isSignUp 
      ? { username: loginInput, password: passwordInput, referralCode: referralInput }
      : { username: loginInput, password: passwordInput };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        setUser(data);
        localStorage.setItem('earn_rewards_user_session', JSON.stringify(data.username));
        showToast(isSignUp ? 'Account created!' : 'Welcome back!');
        setLoginInput('');
        setPasswordInput('');
        setReferralInput('');
        setIsSignUp(false);
        refreshData(data.username);
        fetchCompletedTasks(data.username);
      } else {
        showToast(data.error || 'Something went wrong', 'error');
      }
    } catch (err) {
      showToast('Server connection failed', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('earn_rewards_user_session');
    setLoginInput('');
    setPasswordInput('');
    setReferralInput('');
    setIsSignUp(false);
    showToast('Logged out');
  };

  const handleDailyBonus = async () => {
    if (!user) return;
    const res = await fetch('/api/user/reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, amount: 50, type: 'bonus' })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setTransactions(data.transactions);
      showToast('Daily Bonus claimed!');
    }
  };

  const startWatchingAd = () => {
    if (!user || isWatching) return;
    setIsWatching(true);
    setAdTimer(15);
    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishAd = async () => {
    setIsWatching(false);
    if (user) {
      const res = await fetch('/api/user/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, amount: 10, type: 'reward' })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTransactions(data.transactions);
        showToast('Reward claimed: +10 PTS');
      }
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!user || user.balance < amount) {
      showToast('Insufficient balance', 'error');
      return;
    }
    if (!withdrawMethod || !withdrawPhone) {
      showToast('Please select method and enter phone', 'error');
      return;
    }

    const res = await fetch('/api/user/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: user.username, 
        amount, 
        method: withdrawMethod, 
        phone: withdrawPhone 
      })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setTransactions(data.transactions);
      setWithdrawMethod(null);
      setWithdrawPhone('');
      showToast(`Withdrawal request sent!`);
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositMethod || !depositAmount || !depositTrxId || !depositScreenshot) {
      showToast('Please fill all fields', 'error');
      return;
    }

    if (parseInt(depositAmount) < 300) {
      showToast('Minimum deposit is 300 Taka', 'error');
      return;
    }

    const res = await fetch('/api/user/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: user.username, 
        amount: parseInt(depositAmount), 
        method: depositMethod, 
        trxId: depositTrxId,
        screenshot: depositScreenshot
      })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setTransactions(data.transactions);
      setDepositMethod(null);
      setDepositAmount('');
      setDepositTrxId('');
      setDepositScreenshot('');
      showToast(`Deposit request submitted!`);
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleAdminAction = async (action: 'approve' | 'reject', username: string, txId?: string, requestId?: string, requestType?: string) => {
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, txId, requestId, requestType })
      });
      if (res.ok) {
        showToast(`Request ${action}ed!`);
        fetchAdminData();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const updateAdminSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSettings)
      });
      if (res.ok) {
        showToast('Settings updated!');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-violet-500 selection:text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-[32px] shadow-2xl max-w-md w-full border border-white/5"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="w-16 h-16 accent-gradient rounded-2xl flex items-center justify-center glow-shadow"
            >
              <Trophy className="text-white w-8 h-8" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-1 text-white tracking-tight">EarnRewards</h1>
          <p className="text-white/40 text-center mb-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            {isSignUp ? 'নতুন অ্যাকাউন্ট খুলুন (Sign Up)' : 'লগইন করুন (Login)'}
          </p>
          
          <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1">ইউজারনেম (Username)</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
                  <input 
                    type="text" 
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1">পাসওয়ার্ড (Password)</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] ml-1">রেফার কোড (Referral Code - Optional)</label>
                  <div className="relative group">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400/40 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
                    <input 
                      type="text" 
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value)}
                      placeholder="কোড থাকলে দিন"
                      className="w-full pl-11 pr-4 py-3.5 bg-violet-500/5 border border-violet-500/30 rounded-xl text-white placeholder:text-violet-400/20 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <button 
                type="submit"
                className="w-full accent-gradient text-white py-4 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg glow-shadow"
              >
                {isSignUp ? 'অ্যাকাউন্ট খুলুন' : 'লগইন করুন'}
              </button>
              
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                {isSignUp ? 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন' : "অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Toast Notification for Login Screen */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-10 left-1/2 z-[110]"
            >
              <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border ${
                message.type === 'success' 
                ? 'bg-white text-black border-white' 
                : 'bg-red-500 text-white border-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white pb-24 selection:bg-violet-500 selection:text-white">
      {/* Header */}
      <header className="bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 accent-gradient rounded-xl flex items-center justify-center glow-shadow">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">TakaIncome</h1>
            <p className="text-[9px] text-violet-400 uppercase tracking-widest mt-1 font-bold">Pro Member</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all p-2.5 rounded-xl border border-white/5"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-xl mx-auto p-5 space-y-6">
        
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Welcome Message */}
            <div className="px-1 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">স্বাগতম, {user.username}! 👋</h1>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">আজকের কাজগুলো সম্পন্ন করুন</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                title="লগ আউট"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Main Balance Card */}
            <div className="accent-gradient p-8 rounded-[32px] shadow-2xl relative overflow-hidden group glow-shadow">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    <Wallet className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">আপনার ব্যালেন্স (Balance)</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-white/60" />
                </div>
                
                <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-6xl font-bold tracking-tighter">{user.balance}</span>
                  <span className="text-xl font-medium text-white/40 uppercase tracking-widest">পয়েন্ট (Pts)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleDailyBonus}
                    className="bg-white text-violet-600 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 text-sm"
                  >
                    <Gift className="w-4 h-4" />
                    ডেইলি বোনাস
                  </button>
                  <button 
                    onClick={() => setActiveTab('withdraw')}
                    className="bg-black/20 backdrop-blur-md border border-white/10 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/30 transition-all active:scale-95 text-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    টাকা তুলুন
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button 
                    onClick={() => setActiveTab('deposit')}
                    className="bg-white/10 backdrop-blur-md border border-white/10 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    ডিপোজিট
                  </button>
                  <button 
                    onClick={() => window.open(adminSettings.telegramLink, '_blank')}
                    className="bg-sky-500/20 backdrop-blur-md border border-sky-500/30 text-sky-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-500/30 transition-all active:scale-95 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    সাপোর্ট (Telegram)
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: 'TakaIncome',
                          text: 'TakaIncome এ জয়েন করুন এবং টাকা আয় করুন!',
                          url: window.location.origin
                        });
                      } catch (err) {
                        await navigator.clipboard.writeText(window.location.origin);
                        showToast('সাইট লিঙ্ক কপি হয়েছে!');
                      }
                    }}
                    className="bg-white/10 backdrop-blur-md border border-white/10 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95 text-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    শেয়ার করুন
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 rounded-3xl border border-white/5 inner-glow"
              >
                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">মোট আয় (Total Earned)</p>
                <p className="text-2xl font-bold tracking-tight">{user.totalEarned} <span className="text-[10px] font-medium text-white/10">PTS</span></p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 rounded-3xl border border-white/5 inner-glow"
              >
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">মোট রেফার (Referrals)</p>
                <p className="text-2xl font-bold tracking-tight">{user.referralCount || 0} <span className="text-[10px] font-medium text-white/10">জন</span></p>
              </motion.div>
              {user.username === 'admin' && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-6 rounded-3xl border border-white/5 inner-glow col-span-2"
                >
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">মোট ইউজার (Total Users)</p>
                  <p className="text-2xl font-bold tracking-tight">{totalUsers} <span className="text-[10px] font-medium text-white/10">জন</span></p>
                </motion.div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">সাম্প্রতিক লেনদেন (Recent Activity)</h2>
                <History className="w-3.5 h-3.5 text-white/10" />
              </div>
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <div className="glass-card p-8 rounded-2xl text-center">
                    <p className="text-white/10 text-xs">কোন লেনদেন নেই (No transactions)</p>
                  </div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 
                          tx.type === 'deposit' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-violet-500/10 text-violet-400'
                        }`}>
                          {tx.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> : 
                           tx.type === 'deposit' ? <Send className="w-4 h-4" /> :
                           <TrendingUp className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs capitalize">{tx.type} {tx.type === 'deposit' || tx.type === 'withdrawal' ? 'Request' : 'Reward'}</p>
                          <p className="text-[9px] text-white/20">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          tx.type === 'withdrawal' ? 'text-red-400' : 
                          tx.type === 'deposit' ? 'text-blue-400' :
                          'text-violet-400'
                        }`}>
                          {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount}
                        </p>
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${
                          tx.status === 'pending' ? 'text-amber-400/60' : 'text-white/20'
                        }`}>{tx.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {adminSettings.taskNotice && (
              <div className="glass-card p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-violet-400 shrink-0" />
                <p className="text-[11px] text-white/80 font-medium">{adminSettings.taskNotice}</p>
              </div>
            )}

            {!user.hasDeposited && (
              <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1 text-red-400">টাস্ক লক করা আছে!</p>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      টাস্ক সম্পন্ন করতে আপনাকে কমপক্ষে <span className="text-white font-bold">৩০০ টাকা</span> ডিপোজিট করতে হবে। 
                      ডিপোজিট করার পর এডমিন সেটি অ্যাপ্রুভ করলে আপনি টাস্ক করতে পারবেন।
                    </p>
                    <button 
                      onClick={() => setActiveTab('deposit')}
                      className="mt-3 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all"
                    >
                      এখনই ডিপোজিট করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`glass-card p-6 rounded-[32px] border border-white/5 ${!user.hasDeposited ? 'opacity-40 pointer-events-none' : ''}`}>
              <h2 className="text-lg font-bold mb-1">প্রতিদিনের কাজ (Daily Tasks)</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">নিচের কাজগুলো সম্পন্ন করে পয়েন্ট আয় করুন</p>
              
              <div className="space-y-4">
                {/* Video Ad Task (Built-in) */}
                <button 
                  onClick={startWatchingAd}
                  disabled={isWatching}
                  className="w-full glass-card p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center glow-shadow">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">ভিডিও বিজ্ঞাপন দেখুন</p>
                      <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">
                        {isWatching ? `দেখছেন (${adTimer}s)` : 'পুরস্কার (Reward): 10 Pts'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                </button>

                {/* Custom Admin Tasks */}
                {tasks.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No more tasks for today</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="space-y-3">
                      <button 
                        onClick={() => handleCompleteTask(task.id, task.link)}
                        disabled={completedTasks.includes(task.id) || pendingTasks.includes(task.id)}
                        className={`w-full glass-card p-5 rounded-2xl flex items-center justify-between transition-all group border ${
                          completedTasks.includes(task.id) 
                          ? 'opacity-50 grayscale border-white/5' 
                          : pendingTasks.includes(task.id)
                          ? 'border-violet-500/30 bg-violet-500/5'
                          : 'hover:bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center glow-shadow ${
                            completedTasks.includes(task.id) ? 'bg-white/5' : 
                            pendingTasks.includes(task.id) ? 'bg-violet-500/20' : 'bg-blue-500/20'
                          }`}>
                            {completedTasks.includes(task.id) ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : 
                             pendingTasks.includes(task.id) ? <History className="w-5 h-5 text-violet-400" /> :
                             <Plus className="w-5 h-5 text-blue-400" />}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm">{task.title}</p>
                            <p className="text-[10px] text-white/40 mb-1">{task.description}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                              completedTasks.includes(task.id) ? 'text-green-400' : 
                              pendingTasks.includes(task.id) ? 'text-violet-400' : 'text-blue-400'
                            }`}>
                              {completedTasks.includes(task.id) ? 'Completed' : 
                               pendingTasks.includes(task.id) ? 'Pending Review' : `Reward: ${task.reward} Pts`}
                            </p>
                          </div>
                        </div>
                        {!completedTasks.includes(task.id) && !pendingTasks.includes(task.id) && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />}
                      </button>

                      {submittingTaskId === task.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="glass-card p-5 rounded-2xl border border-violet-500/30 bg-violet-500/5 space-y-4"
                        >
                          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">স্ক্রিনশট জমা দিন (Submit Proof)</p>
                          <div className="space-y-3">
                            <input 
                              type="file" 
                              onChange={(e) => handleFileChange(e, setTaskScreenshot)}
                              accept="image/*"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-500 file:text-white hover:file:bg-violet-600"
                            />
                            {taskScreenshot && (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img src={taskScreenshot} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button 
                                  onClick={() => setTaskScreenshot('')}
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button 
                                onClick={handleSubmitProof}
                                className="flex-1 accent-gradient text-white py-3 rounded-xl font-bold text-xs shadow-lg glow-shadow"
                              >
                                জমা দিন (Submit)
                              </button>
                              <button 
                                onClick={() => setSubmittingTaskId(null)}
                                className="px-4 py-3 bg-white/5 text-white/40 rounded-xl font-bold text-xs"
                              >
                                বাতিল
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h2 className="text-lg font-bold mb-1">রেফার করুন এবং আয় করুন</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">বন্ধুদের ইনভাইট করুন এবং ১০০ পয়েন্ট বোনাস পান</p>
              
              <div className="bg-violet-500/5 p-6 rounded-2xl border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1.5">আপনার রেফার লিঙ্ক (Referral Link)</p>
                  <p className="font-mono text-xs font-bold text-white/60 truncate max-w-[200px]">{window.location.origin}?ref={user.referralCode}</p>
                </div>
                <button 
                  onClick={async () => {
                    const refLink = `${window.location.origin}?ref=${user.referralCode}`;
                    try {
                      await navigator.clipboard.writeText(refLink);
                      showToast('লিঙ্ক কপি হয়েছে!');
                    } catch (err) {
                      const textArea = document.createElement("textarea");
                      textArea.value = refLink;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      showToast('লিঙ্ক কপি হয়েছে!');
                    }
                  }}
                  className="w-full sm:w-auto accent-gradient text-white px-8 py-3.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg glow-shadow active:scale-95"
                >
                  লিঙ্ক কপি করুন
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && user.username === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h2 className="text-lg font-bold">সেরা উপার্জনকারী (Top Earners)</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">এই মাসের গ্লোবাল র‍্যাঙ্কিং</p>
                </div>
                <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                {leaderboard.map((entry, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={entry.username} 
                    className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                      entry.username === user.username 
                      ? 'accent-gradient border-transparent glow-shadow scale-[1.02]' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-400/20 text-amber-400' : 
                          index === 1 ? 'bg-slate-300/20 text-slate-300' : 
                          index === 2 ? 'bg-amber-600/20 text-amber-600' : 
                          'bg-white/5 text-white/40'
                        }`}>
                          {entry.username[0].toUpperCase()}
                        </div>
                        <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ${
                          index === 0 ? 'bg-amber-400 text-black' : 
                          index === 1 ? 'bg-slate-300 text-black' : 
                          index === 2 ? 'bg-amber-600 text-white' : 
                          'bg-white/10 text-white/60'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{entry.username}</p>
                        {entry.username === user.username && <p className="text-[8px] uppercase tracking-widest font-bold opacity-60">আপনার র‍্যাঙ্ক (Your Rank)</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm tracking-tight">{entry.balance.toLocaleString()}</p>
                      <p className="text-[8px] uppercase tracking-widest font-bold opacity-20">পয়েন্ট (Points)</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'deposit' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {adminSettings.depositNotice && (
              <div className="glass-card p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-white/80 font-medium">{adminSettings.depositNotice}</p>
              </div>
            )}

            <div className="glass-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h2 className="text-lg font-bold mb-1">পয়েন্ট ডিপোজিট (Deposit)</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">আপনার ওয়ালেটে পয়েন্ট যোগ করুন</p>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">পেমেন্ট মেথড সিলেক্ট করুন</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Bkash', 'Nagad', 'Rocket'].map(method => (
                      <button 
                        key={method}
                        onClick={() => setDepositMethod(method as any)}
                        className={`py-4 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-2 ${
                          depositMethod === method 
                          ? 'accent-gradient border-transparent glow-shadow text-white' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {depositMethod && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-violet-500/5 border border-violet-500/20 p-6 rounded-2xl relative group"
                  >
                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Smartphone className="w-12 h-12" />
                    </div>
                    <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-2">এই নাম্বারে সেন্ড মানি করুন (Personal)</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-mono font-bold tracking-widest text-white">{adminSettings[depositMethod as keyof typeof adminSettings]}</p>
                      <button 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(adminSettings[depositMethod as keyof typeof adminSettings]);
                            showToast('নাম্বার কপি হয়েছে!');
                          } catch (err) {
                            const textArea = document.createElement("textarea");
                            textArea.value = adminSettings[depositMethod as keyof typeof adminSettings];
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            showToast('নাম্বার কপি হয়েছে!');
                          }
                        }}
                        className="bg-violet-500/20 text-violet-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-violet-500/30 transition-all"
                      >
                        কপি করুন
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">ডিপোজিট পরিমাণ (Amount)</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                      <input 
                        type="number" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="কমপক্ষে ৩০০ টাকা"
                        className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">ট্রানজেকশন আইডি (TrxID)</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                      <input 
                        type="text" 
                        value={depositTrxId}
                        onChange={(e) => setDepositTrxId(e.target.value)}
                        placeholder="SMS থেকে TrxID দিন"
                        className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">পেমেন্ট স্ক্রিনশট (Screenshot Proof)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, setDepositScreenshot)}
                        accept="image/*"
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-500 file:text-white hover:file:bg-violet-600"
                      />
                    </div>
                    {depositScreenshot && (
                      <div className="mt-3 relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                        <img src={depositScreenshot} alt="Deposit Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setDepositScreenshot('')}
                          className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleDeposit}
                  className="w-full accent-gradient text-white py-4.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg glow-shadow mt-2 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Send className="w-5 h-5" />
                  ডিপোজিট নিশ্চিত করুন
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'withdraw' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {adminSettings.withdrawNotice && (
              <div className="glass-card p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-[11px] text-white/80 font-medium">{adminSettings.withdrawNotice}</p>
              </div>
            )}

            <div className="glass-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h2 className="text-lg font-bold mb-1">টাকা তুলুন (Withdraw)</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">আপনার পয়েন্টকে টাকায় রূপান্তর করুন</p>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Bkash', 'Nagad', 'Rocket'].map(method => (
                      <button 
                        key={method}
                        onClick={() => setWithdrawMethod(method as any)}
                        className={`py-4 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-2 ${
                          withdrawMethod === method 
                          ? 'accent-gradient border-transparent glow-shadow text-white' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                      <input 
                        type="text" 
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">উত্তোলনের পরিমাণ (Amount)</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                      <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="কমপক্ষে ৫০০ পয়েন্ট"
                        className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleWithdraw(Number(withdrawAmount))}
                  className="w-full accent-gradient text-white py-4.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg glow-shadow mt-2 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  উত্তোলন রিকোয়েস্ট পাঠান
                </button>
              </div>
            </div>

            {/* Withdrawal Info */}
            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-violet-500/[0.02]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">উত্তোলন নিয়মাবলী (Policy)</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    পেমেন্ট <span className="text-violet-400 font-bold">২৪-৪৮ ঘণ্টার</span> মধ্যে সম্পন্ন করা হয়। 
                    সর্বনিম্ন উত্তোলন <span className="text-white font-bold">৫০০ পয়েন্ট</span>। 
                    রিকোয়েস্ট পাঠানোর আগে আপনার নাম্বারটি ভালো করে চেক করে নিন।
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && user.username === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 rounded-[32px] border border-white/5">
              <h2 className="text-lg font-bold mb-1">Admin Settings</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">Update payment numbers</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Bkash', 'Nagad', 'Rocket'].map(method => (
                    <div key={method} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{method} Number</label>
                      <input 
                        type="text" 
                        value={adminSettings[method as keyof typeof adminSettings]}
                        onChange={(e) => setAdminSettings({...adminSettings, [method]: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm font-mono"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Telegram Support Link</label>
                    <input 
                      type="text" 
                      value={adminSettings.telegramLink}
                      onChange={(e) => setAdminSettings({...adminSettings, telegramLink: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Deposit Notice</label>
                    <textarea 
                      value={adminSettings.depositNotice}
                      onChange={(e) => setAdminSettings({...adminSettings, depositNotice: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Withdraw Notice</label>
                    <textarea 
                      value={adminSettings.withdrawNotice}
                      onChange={(e) => setAdminSettings({...adminSettings, withdrawNotice: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Task Notice</label>
                    <textarea 
                      value={adminSettings.taskNotice}
                      onChange={(e) => setAdminSettings({...adminSettings, taskNotice: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm min-h-[80px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={updateAdminSettings}
                  className="w-full accent-gradient text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 text-sm shadow-lg glow-shadow"
                >
                  Save Settings
                </button>
              </div>
            </div>

            {/* Admin Tasks Management */}
            <div className="glass-card p-6 rounded-[32px] border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Manage Tasks</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Add or remove daily tasks</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/10">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1">Task Title</label>
                    <input 
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Subscribe Channel"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1">Task Type</label>
                    <select 
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="subscribe" className="bg-[#141414]">YouTube Subscribe</option>
                      <option value="follow" className="bg-[#141414]">Facebook Follow</option>
                      <option value="watch" className="bg-[#141414]">Video Watch</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1">Reward Points</label>
                    <input 
                      type="number" 
                      value={newTaskReward}
                      onChange={(e) => setNewTaskReward(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1">Task Link</label>
                    <input 
                      type="url" 
                      value={newTaskLink}
                      onChange={(e) => setNewTaskLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1">Task Description</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Describe the task instructions..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500/50 min-h-[60px]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isAdminTaskLoading}
                  className="w-full accent-gradient text-white py-3.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {isAdminTaskLoading ? 'Adding...' : 'Add New Task'}
                </button>
              </form>

              <div className="space-y-3">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1 mb-2">Active Tasks</p>
                {tasks.length === 0 ? (
                  <p className="text-center py-8 text-white/10 text-xs italic">No tasks added yet</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{task.title}</p>
                        <p className="text-[10px] text-white/40">{task.reward} Points</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Pending Requests</h2>
                <span className="bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full text-[9px] font-bold">{adminRequests.length}</span>
              </div>
              <div className="space-y-3">
                {adminRequests.length === 0 ? (
                  <div className="glass-card p-8 rounded-2xl text-center">
                    <p className="text-white/10 text-xs">No pending requests</p>
                  </div>
                ) : (
                  adminRequests.map(req => (
                    <div key={req.id} className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            req.requestType === 'task' ? 'bg-violet-500/10 text-violet-400' :
                            req.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {req.requestType === 'task' ? <Play className="w-5 h-5" /> :
                             req.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm capitalize">{req.requestType === 'task' ? 'Task Proof' : `${req.type} Request`}</p>
                            <p className="text-[10px] text-white/40">User: <span className="text-white">{req.username}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            req.requestType === 'task' ? 'text-violet-400' :
                            req.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {req.amount} <span className="text-[10px] opacity-40">PTS</span>
                          </p>
                        </div>
                      </div>

                      {req.requestType === 'task' ? (
                        <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Task: {req.title}</p>
                          {req.screenshot && req.screenshot.startsWith('data:image') ? (
                            <div className="rounded-lg overflow-hidden border border-white/10">
                              <img src={req.screenshot} alt="Task Proof" className="w-full h-auto" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                              <p className="text-xs text-white/80 break-all">Proof: {req.screenshot}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 flex flex-col gap-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-3.5 h-3.5 text-white/20" />
                              <span className="text-white/40 font-bold uppercase tracking-widest">{req.method}</span>
                            </div>
                            <p className="font-mono text-white/80">{req.phone || req.trxId}</p>
                          </div>
                          {req.screenshot && (
                            <div className="mt-2">
                              <p className="text-[9px] text-white/20 uppercase mb-2">Screenshot Proof:</p>
                              {req.screenshot.startsWith('data:image') ? (
                                <div className="rounded-lg overflow-hidden border border-white/10">
                                  <img src={req.screenshot} alt="Deposit Proof" className="w-full h-auto" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                                  <p className="text-[10px] text-white/60 break-all">{req.screenshot}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleAdminAction('approve', req.username, req.id, req.id, req.requestType)}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2.5 rounded-xl font-bold text-xs transition-all border border-green-500/10"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAdminAction('reject', req.username, req.id, req.id, req.requestType)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl font-bold text-xs transition-all border border-red-500/10"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard />} 
            label="হোম" 
          />
          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={<Play />} 
            label="কাজ" 
          />
          {user.username === 'admin' && (
            <NavButton 
              active={activeTab === 'leaderboard'} 
              onClick={() => { setActiveTab('leaderboard'); fetchLeaderboard(); }} 
              icon={<Trophy />} 
              label="সেরা" 
            />
          )}
          <NavButton 
            active={activeTab === 'deposit'} 
            onClick={() => setActiveTab('deposit')} 
            icon={<Send />} 
            label="ডিপোজিট" 
          />
          <NavButton 
            active={activeTab === 'withdraw'} 
            onClick={() => setActiveTab('withdraw')} 
            icon={<Wallet />} 
            label="ওয়ালেট" 
          />
          {user.username === 'admin' && (
            <NavButton 
              active={activeTab === 'admin'} 
              onClick={() => { setActiveTab('admin'); fetchAdminData(); }} 
              icon={<ShieldCheck />} 
              label="এডমিন" 
            />
          )}
        </div>
      </nav>

      {/* Ad Simulation Overlay */}
      <AnimatePresence>
        {isWatching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8"
          >
            <div className="w-full max-w-lg aspect-video bg-[#141414] rounded-[40px] flex items-center justify-center relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="z-10 flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                  <Play className="w-10 h-10 text-black fill-black" />
                </div>
                <p className="text-white font-bold tracking-[0.3em] uppercase text-xs">Premium Ad Content</p>
              </motion.div>
              
              <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-white text-4xl font-bold tracking-tighter mb-3">{adTimer}s</p>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Reward processing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-28 left-1/2 z-[110]"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border ${
              message.type === 'success' 
              ? 'bg-white text-black border-white' 
              : 'bg-red-500 text-white border-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all relative py-1 ${active ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-violet-500/10 scale-110' : 'scale-100'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${active ? 'text-violet-400' : ''}` })}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-glow" 
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-violet-500/20 blur-xl rounded-full" 
        />
      )}
    </button>
  );
}

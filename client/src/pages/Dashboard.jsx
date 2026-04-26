import { useAuth, getDepartmentByCode } from '../context/AuthContext';
import ElectionStatus from '../components/ElectionStatus';
import CountdownTimer from '../components/CountdownTimer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, isElectionActive } = useAuth();
  const deptInfo = getDepartmentByCode(user?.department);

  const roleCards = {
    student: [
      {
        title: 'Cast Your Vote',
        description: 'Securely vote for your preferred candidates in all positions',
        icon: '🗳️',
        link: '/vote',
        action: 'Enter Booth',
        disabled: !isElectionActive,
        color: 'from-coop-green to-emerald-700'
      },
      {
        title: 'Election Results',
        description: 'Monitor live election counts and transparency data',
        icon: '📊',
        link: '/results',
        action: 'View Stats',
        disabled: false,
        color: 'from-blue-600 to-indigo-700'
      }
    ],
    aspirant: [
      {
        title: 'My Campaign',
        description: 'Monitor your real-time performance and vote tally',
        icon: '📈',
        link: '/aspirant',
        action: 'View Metrics',
        disabled: false,
        color: 'from-orange-500 to-red-600'
      },
      {
        title: 'Global Results',
        description: 'View overall election performance and turnout',
        icon: '🏆',
        link: '/results',
        action: 'View All',
        disabled: false,
        color: 'from-coop-gold to-yellow-600'
      }
    ],
    admin: [
      {
        title: 'Command Center',
        description: 'Manage candidates, elections, and system security',
        icon: '⚙️',
        link: '/admin',
        action: 'Manage System',
        disabled: false,
        color: 'from-gray-800 to-slate-900'
      },
      {
        title: 'Master Results',
        description: 'Comprehensive data analysis and export tools',
        icon: '📋',
        link: '/results',
        action: 'View Analytics',
        disabled: false,
        color: 'from-purple-600 to-fuchsia-700'
      }
    ]
  };

  const cards = roleCards[user?.role] || roleCards.student;

  const getVoteProgress = () => {
    if (user?.role !== 'student') return null;
    const required = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
    const voted = user?.votedPositions || [];
    const completed = required.filter(pos => voted.includes(pos));
    const percentage = Math.round((completed.length / required.length) * 100);

    return { required, voted, completed, percentage };
  };

  const progress = getVoteProgress();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10"
      >
        <div className="flex items-center space-x-4 mb-2">
          <div className="h-1.5 w-12 bg-coop-green rounded-full"></div>
          <span className="text-xs font-black text-coop-green uppercase tracking-[0.3em]">Student Dashboard</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">
          Hello, {user?.email?.split('@')[0]}!
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center">
            <span className="text-sm font-black text-gray-700">{user?.regNumber}</span>
          </div>
          <div className="px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center">
            <span className="text-sm font-bold text-gray-600">{deptInfo?.name || 'N/A'}</span>
          </div>
          <div className="px-4 py-2 bg-coop-green text-white rounded-2xl shadow-lg shadow-green-900/10 flex items-center">
            <span className="text-xs font-black uppercase tracking-widest">Year {user?.yearOfStudy}</span>
          </div>
        </div>
      </motion.div>

      {/* Election Status Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 grid lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <ElectionStatus />
        </div>
        <div>
          <CountdownTimer />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Left Column: Actions */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center">
            <span className="mr-3">⚡</span> Quick Actions
          </h2>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 gap-6"
          >
            {cards.map((card, index) => (
              <motion.div key={index} variants={item}>
                <Link
                  to={card.disabled ? '#' : card.link}
                  className={`
                    group relative block overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2
                    ${card.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${card.color}`}></div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-5xl bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {card.icon}
                      </div>
                      {!card.disabled && (
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-coop-green group-hover:bg-green-50 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-coop-green transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                      {card.description}
                    </p>
                    
                    <div className={`
                      inline-flex items-center px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                      ${card.disabled 
                        ? 'bg-gray-100 text-gray-400' 
                        : `bg-gradient-to-br ${card.color} text-white shadow-lg group-hover:px-8`}
                    `}>
                      {card.action}
                    </div>
                  </div>
                  
                  {card.disabled && !isElectionActive && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-white border border-red-100 px-4 py-2 rounded-full shadow-xl">
                        <span className="text-red-600 text-[10px] font-black uppercase tracking-widest">Election Inactive</span>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Guidelines */}
          <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <span className="text-9xl font-black">?</span>
            </div>
            <h3 className="text-2xl font-black mb-6 flex items-center">
              <span className="w-8 h-8 bg-coop-gold text-black rounded-lg flex items-center justify-center text-sm mr-4">ℹ️</span>
              Voting Guidelines
            </h3>
            <ul className="space-y-4 relative z-10">
              {[
                'Your vote is encrypted and completely confidential.',
                'You can only vote once per each position.',
                'Ensure you have a stable internet connection while voting.',
                'Departmental positions are restricted to your registered faculty.'
              ].map((text, i) => (
                <li key={i} className="flex items-start space-x-4 group">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black group-hover:bg-coop-green transition-colors">{i+1}</span>
                  <span className="text-gray-400 group-hover:text-white transition-colors font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Progress & Stats */}
        <div className="space-y-8">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center">
            <span className="mr-3">📊</span> Your Activity
          </h2>

          {/* Voting Progress Card */}
          {user?.role === 'student' && progress && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-8 border-t-8 border-coop-green shadow-xl"
            >
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Completion</p>
                  <h3 className="text-3xl font-black text-gray-900 tabular-nums">{progress.percentage}%</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${progress.percentage === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 animate-pulse'}`}>
                  {progress.percentage === 100 ? 'Finished' : 'In Progress'}
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${progress.percentage === 100 ? 'bg-green-500' : 'bg-coop-green shadow-[0_0_15px_rgba(0,107,63,0.4)]'}`}
                />
              </div>

              <div className="space-y-3">
                {progress.required.map(pos => {
                  const isDone = progress.voted.includes(pos);
                  return (
                    <div key={pos} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isDone ? 'bg-green-50/50 border-green-100' : 'bg-gray-50/50 border-gray-100 opacity-60'}`}>
                      <span className={`text-xs font-black uppercase tracking-wider ${isDone ? 'text-green-700' : 'text-gray-500'}`}>{pos}</span>
                      {isDone ? (
                        <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-900/20">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {progress.percentage === 100 && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-8 p-4 bg-green-600 text-white rounded-2xl text-center shadow-xl shadow-green-900/20"
                >
                  <p className="text-xs font-black uppercase tracking-widest">✅ All Votes Cast</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'System Status', value: 'Encrypted', icon: '🛡️', color: 'text-green-600' },
              { label: 'Server Region', value: 'Nairobi-East', icon: '📍', color: 'text-blue-600' },
              { label: 'Security Level', value: 'AES-256', icon: '🔒', color: 'text-coop-gold' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="bg-white border border-gray-100 p-6 rounded-[2rem] flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

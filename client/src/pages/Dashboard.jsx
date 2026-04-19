import { useAuth } from '../context/AuthContext';
import { getDepartmentName } from '../utils/helpers';
import ElectionStatus from '../components/ElectionStatus';
import CountdownTimer from '../components/CountdownTimer';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isElectionActive } = useAuth();

  const roleCards = {
    student: [
      {
        title: 'Cast Your Vote',
        description: 'Vote for your preferred candidates in all positions',
        icon: '🗳️',
        link: '/vote',
        action: 'Vote Now',
        disabled: !isElectionActive
      },
      {
        title: 'View Results',
        description: 'See live election results and vote counts',
        icon: '📊',
        link: '/results',
        action: 'View Results',
        disabled: false
      }
    ],
    aspirant: [
      {
        title: 'My Campaign',
        description: 'View your vote tally and campaign performance',
        icon: '📈',
        link: '/aspirant',
        action: 'View Stats',
        disabled: false
      },
      {
        title: 'Election Results',
        description: 'See overall election results',
        icon: '🏆',
        link: '/results',
        action: 'View Results',
        disabled: false
      }
    ],
    admin: [
      {
        title: 'Admin Panel',
        description: 'Manage candidates, elections, and offline votes',
        icon: '⚙️',
        link: '/admin',
        action: 'Manage',
        disabled: false
      },
      {
        title: 'Election Results',
        description: 'View and export election results',
        icon: '📋',
        link: '/results',
        action: 'View Results',
        disabled: false
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.email?.split('@')[0]}!
        </h1>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <p className="text-gray-600">
            {user?.regNumber} • {getDepartmentName(user?.department)} • Year {user?.yearOfStudy}
          </p>
          <ElectionStatus compact />
        </div>
      </div>

      {/* Election Status & Countdown Banner */}
      <div className="mb-8 grid md:grid-cols-2 gap-4">
        <ElectionStatus />
        <CountdownTimer />
      </div>

      {/* Student Voting Progress */}
      {user?.role === 'student' && progress && (
        <div className="glass-panel p-6 mb-8 border-l-4 border-coop-green">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Voting Progress</h2>
            <span className={`font-bold text-lg ${progress.percentage === 100 ? 'text-coop-green' : 'text-blue-600'}`}>
              {progress.percentage}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${progress.percentage === 100 ? 'bg-coop-green' : 'bg-blue-500'}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {progress.required.map(pos => {
              const isDone = progress.voted.includes(pos);
              return (
                <div key={pos} className={`p-3 rounded-xl border ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{pos}</span>
                    {isDone ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-1 rounded-full">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {progress.percentage === 100 && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center justify-center animate-slide-up">
              🎉 You have completed voting! Thank you for participating.
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-5 border-t-4 border-t-coop-gold hover:border-t-coop-green">
          <p className="text-sm text-gray-500 font-medium">Department</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{user?.department}</p>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-blue-400 hover:border-t-blue-600">
          <p className="text-sm text-gray-500 font-medium">Year of Study</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{user?.yearOfStudy}</p>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-emerald-400 hover:border-t-emerald-600">
          <p className="text-sm text-gray-500 font-medium">Role</p>
          <p className="text-xl font-bold text-gray-900 mt-1 capitalize">{user?.role}</p>
        </div>
        <div className="glass-card p-5 border-t-4 border-t-purple-400 hover:border-t-purple-600">
          <p className="text-sm text-gray-500 font-medium">Election</p>
          <p className={`text-xl font-bold mt-1 ${isElectionActive ? 'text-green-600' : 'text-gray-400'}`}>
            {isElectionActive ? 'Active' : 'Closed'}
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <Link
            key={index}
            to={card.disabled ? '#' : card.link}
            className={`
              glass-card block group
              ${card.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-300
            `}
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{card.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-coop-green transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{card.description}</p>
                <div className="mt-4">
                  <span className={`
                    inline-block px-4 py-2 rounded-lg text-sm font-medium
                    ${card.disabled
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-coop-green text-white group-hover:bg-green-700'}
                    transition-colors
                  `}>
                    {card.action}
                    {!card.disabled && (
                      <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            </div>
            {card.disabled && !isElectionActive && (
              <p className="text-xs text-red-500 mt-2">
                Election is not currently active
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          {user?.role === 'student' && 'Voting Information'}
          {user?.role === 'aspirant' && 'Candidate Information'}
          {user?.role === 'admin' && 'Administrator Information'}
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {user?.role === 'student' && (
            <>
              <li>• You can vote once per position</li>
              <li>• Department positions can only be voted by students in that department</li>
              <li>• President is elected by all students university-wide</li>
              <li>• Your vote is confidential and cannot be changed once submitted</li>
            </>
          )}
          {user?.role === 'aspirant' && (
            <>
              <li>• Monitor your vote count in real-time</li>
              <li>• Results include both online and offline votes</li>
              <li>• Contact admin if you notice any discrepancies</li>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <li>• Manage candidates and approve new aspirants</li>
              <li>• Record offline votes manually</li>
              <li>• Start and end elections</li>
              <li>• Export results for official records</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;

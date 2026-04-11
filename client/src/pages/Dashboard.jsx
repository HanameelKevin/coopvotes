import { useAuth } from '../context/AuthContext';
import { getDepartmentName } from '../utils/helpers';
import ElectionStatus from '../components/ElectionStatus';
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

      {/* Election Status Banner */}
      <div className="mb-8">
        <ElectionStatus />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-500">Department</p>
          <p className="text-lg font-semibold text-gray-900">{user?.department}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-500">Year of Study</p>
          <p className="text-lg font-semibold text-gray-900">{user?.yearOfStudy}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-500">Role</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">{user?.role}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-500">Election</p>
          <p className={`text-lg font-semibold ${isElectionActive ? 'text-green-600' : 'text-gray-400'}`}>
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
              card block group
              ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1'}
              transition-all duration-200
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

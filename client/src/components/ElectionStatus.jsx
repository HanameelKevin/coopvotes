import { useAuth } from '../context/AuthContext';

const ElectionStatus = ({ compact = false }) => {
  const { electionStatus, isElectionActive } = useAuth();

  if (compact) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isElectionActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-600'
      }`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${
          isElectionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        {isElectionActive ? 'Voting Active' : 'Voting Closed'}
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${
      isElectionActive
        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Election Status</h3>
          <p className="text-sm opacity-90 mt-1">
            {electionStatus?.election?.name || 'No active election'}
          </p>
          {electionStatus?.election && (
            <div className="mt-3 flex items-center space-x-4 text-sm opacity-90">
              <span>
                {electionStatus.election.totalVotes || 0} votes cast
              </span>
              {electionStatus.election.turnout > 0 && (
                <span>
                  {Math.round(electionStatus.election.turnout)}% turnout
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`px-4 py-2 rounded-lg font-semibold ${
          isElectionActive ? 'bg-white/20' : 'bg-white/10'
        }`}>
          {isElectionActive ? (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>ACTIVE</span>
            </div>
          ) : (
            'CLOSED'
          )}
        </div>
      </div>
    </div>
  );
};

export default ElectionStatus;

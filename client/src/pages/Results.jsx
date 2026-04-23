import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { VoteBarChart } from '../components/VoteChart';
import { getDepartmentName } from '../utils/helpers';
import ElectionStatus from '../components/ElectionStatus';
import confetti from 'canvas-confetti';

const POSITIONS = ['President', 'Congress Person'];
const DEPARTMENTS = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU', 'MATHS', 'CATER', 'SCI'];

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPosition, setSelectedPosition] = useState('President');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const confettiShownRef = useRef(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Fetch results
  const { data: resultsData, isLoading, refetch, error } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await api.get('/vote/results');
      return response.data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    onError: (err) => {
      // If user gets 403, they haven't voted yet
      if (err.response?.status === 403) {
        setShowAccessDenied(true);
      }
    }
  });

   // Launch confetti once when results first arrive (only if user has access)
   useEffect(() => {
     const shouldCelebrate = resultsData?.results && !confettiShownRef.current && !showAccessDenied;
     if (!shouldCelebrate) return;

     confettiShownRef.current = true;

     const timeoutId = window.setTimeout(() => {
       confetti({
         particleCount: 150,
         spread: 70,
         origin: { y: 0.6 }
       });
     }, 300);

     return () => window.clearTimeout(timeoutId);
   }, [resultsData, showAccessDenied]);

  const activeDepartment = selectedDepartment || user?.department;

  const positionResults = useMemo(() => {
    if (!resultsData?.results) return [];

    const results = resultsData.results[selectedPosition];
    if (!results) return [];

    if (results.global) {
      return results.global;
    }

    return results[activeDepartment] || [];
  }, [activeDepartment, resultsData, selectedPosition]);

  const chartData = useMemo(
    () =>
      positionResults.map((candidate) => ({
        name: candidate.name.split('@')[0],
        totalVotes: candidate.totalVotes
      })),
    [positionResults]
  );

  const totalVotes = useMemo(
    () => positionResults.reduce((sum, candidate) => sum + candidate.totalVotes, 0),
    [positionResults]
  );

  const winner = positionResults[0];
  const hasWinner = Boolean(winner && winner.totalVotes > 0);
  const winnerLabel = selectedPosition === 'President'
    ? 'University-wide Winner'
    : `${getDepartmentName(activeDepartment)} Winner`;

   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-center">
           <div className="spinner w-12 h-12 border-4" />
           <p className="mt-4 text-gray-600">Loading results...</p>
         </div>
       </div>
     );
   }

   if (showAccessDenied) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
           <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Required</h2>
           <p className="text-gray-600 mb-6">
             You must cast your vote before viewing election results.
           </p>
           <button
             onClick={() => navigate('/voting')}
             className="btn-primary w-full"
           >
             Go to Voting Booth
           </button>
         </div>
       </div>
     );
   }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
          <div className="flex items-center space-x-4">
            <ElectionStatus compact />
            <button
              onClick={refetch}
              className="p-2 text-gray-600 hover:text-coop-green hover:bg-green-50 rounded-lg transition-colors"
              title="Refresh results"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Election Summary */}
        {resultsData?.election && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up">
            <div className="glass-card p-5 border-t-4 border-coop-green stagger-1">
              <p className="text-xs text-gray-400 font-bold uppercase">Total Votes</p>
              <p className="text-2xl font-black text-coop-green mt-1">{resultsData.election.totalVotes}</p>
            </div>
            <div className="glass-card p-5 border-t-4 border-blue-500 stagger-2">
              <p className="text-xs text-gray-400 font-bold uppercase">Eligible Voters</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{resultsData.election.totalVoters}</p>
            </div>
            <div className="glass-card p-5 border-t-4 border-purple-500 stagger-3">
              <p className="text-xs text-gray-400 font-bold uppercase">Turnout</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{Math.round(resultsData.election.turnout)}%</p>
            </div>
            <div className="glass-card p-5 border-t-4 border-gray-700 stagger-4">
              <p className="text-xs text-gray-400 font-bold uppercase">Year</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{resultsData.election.year}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel p-5 mb-8 flex items-center border border-gray-100/50">
        <div className="flex flex-wrap items-center gap-4">
          {/* Position Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value);
                if (e.target.value === 'President') {
                  setSelectedDepartment(null);
                }
              }}
              className="input min-w-[200px]"
            >
              {POSITIONS.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          {/* Department Filter (only for non-President positions) */}
          {selectedPosition !== 'President' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={activeDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input min-w-[200px]"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{getDepartmentName(dept)}</option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'cards'
                  ? 'bg-coop-green text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'chart'
                  ? 'bg-coop-green text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Chart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Spotlight */}
      {hasWinner && (
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 p-[1px] shadow-xl">
          <div className="rounded-2xl bg-white/95 backdrop-blur px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
                  Official Winner Announcement
                </p>
                 <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-gray-900">
                   🏆 {winner.name.split('@')[0]} wins {selectedPosition}
                 </h2>
                 <p className="mt-2 text-sm md:text-base text-gray-600">
                   {winnerLabel}
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Votes</p>
                  <p className="mt-1 text-2xl font-black text-amber-900">{winner.totalVotes}</p>
                </div>
                <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Share</p>
                  <p className="mt-1 text-2xl font-black text-green-800">
                    {totalVotes > 0 ? Math.round((winner.totalVotes / totalVotes) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-900">
                Winner announced
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                Live results board
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {positionResults.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-dashed border-gray-200 p-12 text-center animate-entrance">
          <div className="text-6xl mb-4 animate-float">📭</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Results Pending</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            There are no candidates recorded for <span className="text-coop-green font-bold">{selectedPosition}</span>
            {selectedPosition !== 'President' && ` in the ${getDepartmentName(activeDepartment)} department`}.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positionResults.map((candidate, index) => {
            const isWinner = index === 0 && candidate.totalVotes > 0;
            return (
              <div key={candidate.id} className="relative">
                {isWinner && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🏆 Winner
                    </div>
                  </div>
                )}
                <div className="glass-card h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-200">#{index + 1}</span>
                    {isWinner && (
                      <span className="text-2xl">🏆</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {candidate.name.split('@')[0]}
                   </h3>
                   <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Votes</span>
                      <span className="text-2xl font-bold text-coop-green">{candidate.totalVotes}</span>
                    </div>
                    {totalVotes > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isWinner ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ width: `${(candidate.totalVotes / totalVotes) * 100}%` }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {totalVotes > 0 ? Math.round((candidate.totalVotes / totalVotes) * 100) : 0}% of votes
                    </p>
                    {candidate.offlineVotes > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Online: {candidate.votes} | Offline: {candidate.offlineVotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-6">
          <div className="h-80">
            <VoteBarChart
              data={chartData}
              title={`${selectedPosition} ${selectedPosition !== 'President' ? `- ${getDepartmentName(activeDepartment)}` : ''}`}
            />
          </div>
        </div>
      )}

      {/* All Positions Summary */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Positions Summary</h2>
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Position</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Candidates</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Total Votes</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Winner</th>
                </tr>
              </thead>
              <tbody>
                {POSITIONS.map(position => {
                  if (position === 'President') {
                    const candidates = resultsData?.results?.President?.global || [];
                    const leader = candidates[0];
                    return (
                      <tr key={position} className="border-t">
                        <td className="px-4 py-3 font-medium">{position}</td>
                        <td className="px-4 py-3 text-gray-500">University-wide</td>
                        <td className="px-4 py-3 text-center">{candidates.length}</td>
                        <td className="px-4 py-3 text-center">
                          {candidates.reduce((sum, c) => sum + c.totalVotes, 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {leader && leader.totalVotes > 0 ? (
                            <span className="text-green-600 font-medium">
                              {leader.name.split('@')[0]} ({leader.totalVotes})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return DEPARTMENTS.map(dept => {
                    const candidates = resultsData?.results?.[position]?.[dept] || [];
                    const leader = candidates[0];
                    if (candidates.length === 0) return null;
                    return (
                      <tr key={`${position}-${dept}`} className="border-t">
                        <td className="px-4 py-3 font-medium">{position}</td>
                        <td className="px-4 py-3 text-gray-500">{getDepartmentName(dept)}</td>
                        <td className="px-4 py-3 text-center">{candidates.length}</td>
                        <td className="px-4 py-3 text-center">
                          {candidates.reduce((sum, c) => sum + c.totalVotes, 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {leader && leader.totalVotes > 0 ? (
                            <span className="text-green-600 font-medium">
                              {leader.name.split('@')[0]} ({leader.totalVotes})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Results update automatically every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Results;

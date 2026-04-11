import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { VoteBarChart } from '../components/VoteChart';
import { getDepartmentName } from '../utils/helpers';
import ElectionStatus from '../components/ElectionStatus';

const POSITIONS = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
const DEPARTMENTS = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU'];

const Results = () => {
  const { user } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState('President');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const confettiShownRef = useRef(false);

  // Fetch results
  const { data: resultsData, isLoading, refetch } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await api.get('/vote/results');
      return response.data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false
  });

  // Launch confetti once when results first arrive
  useEffect(() => {
    const shouldCelebrate = resultsData?.results && !confettiShownRef.current;
    if (!shouldCelebrate) return;

    confettiShownRef.current = true;

    const launchConfetti = async () => {
      const { default: confetti } = await import('confetti');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    };

    const timeoutId = window.setTimeout(() => {
      launchConfetti().catch(() => {
        // Ignore confetti failures so results still render normally
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [resultsData]);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-500">Total Votes</p>
              <p className="text-2xl font-bold text-coop-green">{resultsData.election.totalVotes}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-500">Eligible Voters</p>
              <p className="text-2xl font-bold text-blue-600">{resultsData.election.totalVoters}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-500">Turnout</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(resultsData.election.turnout)}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-500">Election Year</p>
              <p className="text-2xl font-bold text-gray-900">{resultsData.election.year}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
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
                  {winnerLabel} • {winner.regNumber}
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
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Candidates</h2>
          <p className="text-gray-500">
            There are no candidates for this position
            {selectedPosition !== 'President' && ` in ${getDepartmentName(activeDepartment)}`}.
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
                <div className="card h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-200">#{index + 1}</span>
                    {isWinner && (
                      <span className="text-2xl">🏆</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {candidate.name.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{candidate.regNumber}</p>
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
        <div className="bg-white rounded-xl shadow-md p-6">
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
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

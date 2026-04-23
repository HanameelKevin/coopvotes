import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { VoteBarChart, VotePieChart } from '../components/VoteChart';
import { getDepartmentName, formatDate } from '../utils/helpers';
import ElectionStatus from '../components/ElectionStatus';

const AspirantDashboard = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('bar');

  // Fetch results
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await api.get('/vote/results');
      return response.data.data;
    },
    refetchInterval: 30000 // Poll every 30 seconds
  });

  // Find user's candidacies
  const findMyCandidacies = () => {
    if (!resultsData?.results) return [];

    const myCandidacies = [];
    const positions = Object.keys(resultsData.results);

    for (const position of positions) {
      const positionData = resultsData.results[position];
      if (!positionData) continue;

      if (positionData.global) {
        // President or other university-wide results
        const myCandidacy = positionData.global.find(c => c.name === user?.email);
        if (myCandidacy) {
          myCandidacies.push({
            position,
            department: 'University-wide',
            ...myCandidacy
          });
        }
      } else {
        // Department results
        const departments = Object.keys(positionData);
        for (const dept of departments) {
          const myCandidacy = positionData[dept].find(c => c.name === user?.email);
          if (myCandidacy) {
            myCandidacies.push({
              position,
              department: getDepartmentName(dept),
              departmentCode: dept,
              ...myCandidacy
            });
          }
        }
      }
    }

    return myCandidacies;
  };

  const myCandidacies = findMyCandidacies();

  // Prepare chart data
  const getChartData = (position, departmentCode) => {
    if (!resultsData?.results?.[position]) return [];

    if (position === 'President') {
      return resultsData.results.President.map(c => ({
        name: c.name.split('@')[0],
        totalVotes: c.totalVotes
      }));
    }

    const deptData = resultsData.results[position]?.[departmentCode] || [];
    return deptData.map(c => ({
      name: c.name.split('@')[0],
      totalVotes: c.totalVotes
    }));
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Campaign Dashboard</h1>
          <ElectionStatus compact />
        </div>
        <p className="text-gray-600">
          Track your vote tally and campaign performance in real-time
        </p>
      </div>

      {myCandidacies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Candidacies Found</h2>
          <p className="text-gray-500">
            You are not registered as a candidate for any position.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contact the admin to be added as a candidate.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Candidacy Cards */}
          {myCandidacies.map((candidacy, index) => {
            const chartData = getChartData(candidacy.position, candidacy.departmentCode);
            const isLeading = chartData.length > 0 && chartData[0].name === user?.email.split('@')[0];

            return (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Card Header */}
                <div className={`px-6 py-4 ${isLeading ? 'bg-green-50' : 'bg-gray-50'} border-b`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{candidacy.position}</h2>
                      <p className="text-sm text-gray-600">{candidacy.department}</p>
                    </div>
                    {isLeading && (
                      <div className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
                        🏆 Leading
                      </div>
                    )}
                  </div>
                </div>

                {/* Vote Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600">Online Votes</p>
                      <p className="text-3xl font-bold text-green-600">{candidacy.votes}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600">Offline Votes</p>
                      <p className="text-3xl font-bold text-blue-600">{candidacy.offlineVotes}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-gray-600">Total Votes</p>
                      <p className="text-3xl font-bold text-purple-600">{candidacy.totalVotes}</p>
                    </div>
                  </div>

                  {/* Vote Breakdown */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Vote Breakdown</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewMode('bar')}
                          className={`px-3 py-1 text-sm rounded ${
                            viewMode === 'bar' ? 'bg-coop-green text-white' : 'bg-gray-100'
                          }`}
                        >
                          Bar Chart
                        </button>
                        <button
                          onClick={() => setViewMode('pie')}
                          className={`px-3 py-1 text-sm rounded ${
                            viewMode === 'pie' ? 'bg-coop-green text-white' : 'bg-gray-100'
                          }`}
                        >
                          Pie Chart
                        </button>
                      </div>
                    </div>
                    {chartData.length > 0 && (
                      <div className="h-64">
                        {viewMode === 'bar' ? (
                          <VoteBarChart
                            data={chartData}
                            title={`${candidacy.position} - ${candidacy.department}`}
                          />
                        ) : (
                          <VotePieChart
                            data={chartData}
                            title={`${candidacy.position} - ${candidacy.department}`}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Competitors Table */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">All Candidates</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Rank</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Candidate</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Online</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Offline</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((candidate, idx) => {
                            const isMe = candidate.name === user?.email?.split('@')[0];
                            return (
                              <tr
                                key={idx}
                                className={`border-t ${isMe ? 'bg-green-50' : ''}`}
                              >
                                <td className="px-4 py-3">
                                  <span className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                    ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}
                                  `}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {candidate.name}
                                  {isMe && <span className="ml-2 text-green-600">(You)</span>}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                  {candidacy.position === 'President'
                                    ? '-'
                                    : resultsData?.results?.[candidacy.position]?.[candidacy.departmentCode]?.[idx]?.votes || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                  {candidacy.position === 'President'
                                    ? '-'
                                    : resultsData?.results?.[candidacy.position]?.[candidacy.departmentCode]?.[idx]?.offlineVotes || 0}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-900">
                                  {candidate.totalVotes}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Results update automatically every 30 seconds
      </div>
    </div>
  );
};

export default AspirantDashboard;

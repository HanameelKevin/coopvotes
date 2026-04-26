import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth, FACULTIES, getAllDepartments } from '../context/AuthContext';
import Toast from '../components/Toast';
import AdminCharts from '../components/AdminCharts';
import { formatDate, getDepartmentName } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    email: '',
    position: 'Congress Person',
    department: '',
    manifesto: ''
  });
  const [offlineVoteData, setOfflineVoteData] = useState({
    candidateId: '',
    votes: ''
  });

  const allDepts = getAllDepartments();

  // Fetch data
  const { data: electionData } = useQuery({
    queryKey: ['election'],
    queryFn: async () => {
      const response = await api.get('/election');
      return response.data.data;
    }
  });

  const { data: candidatesData } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const response = await api.get('/candidates');
      return response.data.data;
    }
  });

  const { data: resultsData } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await api.get('/vote/results');
      return response.data.data;
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.data;
    }
  });

  const { data: securityAlertsData } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: async () => {
      const response = await api.get('/admin/security/alerts?hours=24');
      return response.data.data;
    }
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const response = await api.get('/admin/audit-logs?limit=10');
      return response.data.data;
    }
  });

  // Mutations
  const startElectionMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/election/start', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['election']);
      setToast({ message: 'Election started successfully!', type: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.response?.data?.message || 'Failed to start election', type: 'error' });
    }
  });

  const endElectionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/election/end');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['election']);
      setToast({ message: 'Election ended successfully!', type: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.response?.data?.message || 'Failed to end election', type: 'error' });
    }
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/candidates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']);
      setShowCandidateModal(false);
      setToast({ message: 'Candidate created successfully!', type: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.response?.data?.message || 'Failed to create candidate', type: 'error' });
    }
  });

  const updateOfflineVotesMutation = useMutation({
    mutationFn: async ({ id, votes }) => {
      const response = await api.patch(`/candidates/${id}/offlineVotes`, { offlineVotes: votes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']);
      queryClient.invalidateQueries(['results']);
      setToast({ message: 'Offline votes updated!', type: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.response?.data?.message || 'Failed to update votes', type: 'error' });
    }
  });

  const handleStartElection = () => {
    startElectionMutation.mutate(electionData);
  };

  const handleEndElection = () => {
    if (window.confirm('Are you sure you want to end the election? This cannot be undone.')) {
      endElectionMutation.mutate();
    }
  };

  const handleCreateCandidate = (e) => {
    e.preventDefault();
    // First we need to find the user by email - this would need a backend endpoint
    // For now, we'll just show a message
    setToast({ message: 'Use the API or seed script to add candidates with user accounts', type: 'info' });
  };

  const handleUpdateOfflineVotes = () => {
    if (!offlineVoteData.candidateId || !offlineVoteData.votes) {
      setToast({ message: 'Please select a candidate and enter vote count', type: 'error' });
      return;
    }
    updateOfflineVotesMutation.mutate({
      id: offlineVoteData.candidateId,
      votes: parseInt(offlineVoteData.votes, 10)
    });
  };

  const handleExportResults = async () => {
    try {
      const response = await api.get('/vote/results/export', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `election-results-${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Results exported successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to export results', type: 'error' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'offline', label: 'Offline Votes' },
    { id: 'export', label: 'Export' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-5 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Total Voters</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statsData?.users?.total || 0}</p>
          </div>
          <div className="glass-card p-5 border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Total Votes Cast</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{resultsData?.election?.totalVotes || 0}</p>
          </div>
          <div className="glass-card p-5 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500">Current Turnout</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(resultsData?.election?.turnout) || 0}%</p>
          </div>
          <div className="glass-card p-5 border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{electionData?.isActive ? 'Active' : 'Paused'}</p>
          </div>
        </div>

      {/* Election Control */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-4">Create New Election</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Current Status:{' '}
              <span className={`font-semibold ${electionData?.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                {electionData?.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
            {electionData?.election && (
              <p className="text-sm text-gray-500 mt-1">
                {electionData.election.totalVotes} votes cast • {Math.round(electionData.election.turnout)}% turnout
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            {!electionData?.isActive ? (
              <button
                onClick={handleStartElection}
                disabled={startElectionMutation.isPending}
                className="btn-primary"
              >
                {startElectionMutation.isPending ? 'Starting...' : 'Start Election'}
              </button>
            ) : (
              <button
                onClick={handleEndElection}
                disabled={endElectionMutation.isPending}
                className="btn-danger"
              >
                {endElectionMutation.isPending ? 'Ending...' : 'End Election'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex space-x-1 p-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'bg-coop-green text-white'
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-green-600">{candidatesData?.length || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-blue-600">{resultsData?.election?.totalVotes || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Turnout</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(resultsData?.election?.turnout) || 0}%</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Positions</p>
                  <p className="text-2xl font-bold text-yellow-600">4</p>
                </div>
              </div>

              {/* Render Admin Charts (Live Analytics) */}
              <div className="mt-8">
                <AdminCharts statsData={statsData} resultsData={resultsData} />
              </div>

              {/* Election Info */}
              <div className="bg-gray-50 rounded-xl p-4 mt-8">
                <h3 className="font-semibold text-gray-900 mb-2">Election Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{electionData?.election?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Year:</span>
                    <span className="ml-2 text-gray-900">{electionData?.election?.year || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Started:</span>
                    <span className="ml-2 text-gray-900">{electionData?.election?.startTime ? formatDate(electionData.election.startTime) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 font-medium ${electionData?.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {electionData?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
           </div>
         </div>
       )}

       {/* Monitoring Tab */}
       {activeTab === 'monitoring' && (
         <div className="space-y-6">
           {/* System Stats Summary */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-green-50 rounded-xl p-4">
               <p className="text-sm text-gray-600">Total Users</p>
               <p className="text-2xl font-bold text-green-600">{statsData?.users?.total || 0}</p>
             </div>
             <div className="bg-blue-50 rounded-xl p-4">
               <p className="text-sm text-gray-600">Voted</p>
               <p className="text-2xl font-bold text-blue-600">{statsData?.users?.voted || 0}</p>
             </div>
             <div className="bg-purple-50 rounded-xl p-4">
               <p className="text-sm text-gray-600">Turnout</p>
               <p className="text-2xl font-bold text-purple-600">{statsData?.users?.turnout ? Math.round(statsData.users.turnout) : 0}%</p>
             </div>
             <div className="bg-red-50 rounded-xl p-4">
               <p className="text-sm text-gray-600">Failed Logins (24h)</p>
               <p className="text-2xl font-bold text-red-600">{statsData?.security?.failedLogins || 0}</p>
             </div>
           </div>

           {/* Security Alerts */}
           <div className="bg-white rounded-xl shadow-md overflow-hidden">
             <div className="px-6 py-4 border-b bg-red-50">
               <h3 className="font-semibold text-red-900">Security Alerts (Last 24 Hours)</h3>
             </div>
             <div className="p-6">
               {securityAlertsData?.criticalEvents?.length > 0 ? (
                 <div className="space-y-3">
                   {securityAlertsData.criticalEvents.slice(0, 5).map((event, idx) => (
                     <div key={idx} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                       <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                       <div className="ml-3">
                         <p className="text-sm font-medium text-red-900">{event.action}</p>
                         <p className="text-xs text-red-700 mt-1">
                           {event.userId?.email || 'Unknown user'} • {formatDate(event.timestamp)}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-gray-500 text-center py-4">No critical security alerts in the last 24 hours.</p>
               )}
               <div className="mt-4 flex justify-between items-center text-sm">
                 <span className="text-gray-600">
                   Total alerts: <strong>{securityAlertsData?.totalAlerts || 0}</strong>
                 </span>
                 <span className="text-gray-500">
                   Time window: {securityAlertsData?.timeWindow || '24 hours'}
                 </span>
               </div>
             </div>
           </div>

           {/* Recent Audit Logs */}
           <div className="bg-white rounded-xl shadow-md overflow-hidden">
             <div className="px-6 py-4 border-b">
               <h3 className="font-semibold text-gray-900">Recent Audit Logs</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-700">Severity</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                   </tr>
                 </thead>
                 <tbody>
                   {auditLogsData?.logs?.map((log) => (
                     <tr key={log._id} className="border-t">
                       <td className="px-4 py-3 font-medium">{log.action}</td>
                       <td className="px-4 py-3">{log.userId?.email || 'System'}</td>
                       <td className="px-4 py-3">
                         <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                           log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                           log.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                           log.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                           'bg-green-100 text-green-700'
                         }`}>
                           {log.severity}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-gray-500">{formatDate(log.timestamp)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       )}

       {/* Candidates Tab */}
          {activeTab === 'candidates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">All Candidates</h3>
                <button
                  onClick={() => setShowCandidateModal(true)}
                  className="btn-primary text-sm py-2"
                >
                  + Add Candidate
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Candidate</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Position</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Votes</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Offline</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatesData?.map((candidate) => (
                      <tr key={candidate._id} className="border-t">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{candidate.userId?.email?.split('@')[0]}</p>
                            <p className="text-xs text-gray-500">{candidate.userId?.regNumber}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{candidate.position}</td>
                        <td className="px-4 py-3">{candidate.department ? getDepartmentName(candidate.department) : 'University-wide'}</td>
                        <td className="px-4 py-3 text-center">{candidate.votes}</td>
                        <td className="px-4 py-3 text-center">{candidate.offlineVotes}</td>
                        <td className="px-4 py-3 text-center font-bold">{candidate.totalVotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Offline Votes Tab */}
          {activeTab === 'offline' && (
            <div className="max-w-md">
              <h3 className="font-semibold text-gray-900 mb-4">Record Offline Votes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Candidate
                  </label>
                  <select
                    value={offlineVoteData.candidateId}
                    onChange={(e) => setOfflineVoteData({ ...offlineVoteData, candidateId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- Select Candidate --</option>
                    {candidatesData?.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.userId?.email?.split('@')[0]} - {candidate.position} ({candidate.department || 'Global'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offline Votes Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offlineVoteData.votes}
                    onChange={(e) => setOfflineVoteData({ ...offlineVoteData, votes: e.target.value })}
                    className="input"
                    placeholder="Enter number of offline votes"
                  />
                </div>
                <button
                  onClick={handleUpdateOfflineVotes}
                  disabled={updateOfflineVotesMutation.isPending}
                  className="btn-primary w-full"
                >
                  {updateOfflineVotesMutation.isPending ? 'Updating...' : 'Update Offline Votes'}
                </button>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Export Results</h3>
              <p className="text-gray-600 mb-6">
                Download election results as a CSV file for official records and analysis.
              </p>
              <button
                onClick={handleExportResults}
                className="btn-primary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">Add Candidate</h3>
            <form onSubmit={handleCreateCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University Email
                </label>
                <input
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="input"
                  placeholder="candidate@coop.ac.ke"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={newCandidate.position}
                  onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                  className="input"
                >
                  <option value="President">President</option>
                  <option value="Congress Person">Congress Person</option>
                  <option value="Male Delegate">Male Delegate</option>
                  <option value="Female Delegate">Female Delegate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={newCandidate.department}
                  onChange={(e) => setNewCandidate({ ...newCandidate, department: e.target.value })}
                  className="input"
                  disabled={newCandidate.position === 'President'}
                  required={newCandidate.position !== 'President'}
                >
                  <option value="">-- Select Department --</option>
                  {allDepts.map(dept => (
                    <option key={dept.code} value={dept.code}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manifesto
                </label>
                <textarea
                  value={newCandidate.manifesto}
                  onChange={(e) => setNewCandidate({ ...newCandidate, manifesto: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Candidate's manifesto..."
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowCandidateModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

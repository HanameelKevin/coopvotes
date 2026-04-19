import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const VerifyVote = () => {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hash.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await api.get(`/vote/verify?hash=${hash.trim()}`);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed or hash invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back navigation */}
        <Link to="/login" className="text-coop-green text-sm font-medium hover:underline mb-6 inline-block">
          &larr; Back to Platform
        </Link>

        {/* Verification Card */}
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Verify Election Vote</h1>
            <p className="text-sm text-gray-500 mt-2">
              The blockchain ledger ensures your vote is immutable. Paste your receipt hash below.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="hash" className="block text-sm font-semibold text-gray-700 mb-2">
                Receipt Hash
              </label>
              <input
                type="text"
                id="hash"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="e.g. 5d41402abc4b2a76b9719d911017c592..."
                className="input bg-white/50 font-mono text-sm shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !hash.trim()}
              className="premium-btn w-full flex justify-center"
            >
              {loading ? 'Verifying on Ledger...' : 'Verify Receipt'}
            </button>
          </form>

          {/* Results Section */}
          <div className="mt-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-slide-up flex items-start gap-3">
                <span className="text-2xl leading-none">❌</span>
                <div>
                  <h4 className="font-bold text-sm">Verification Failed</h4>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="p-6 bg-green-50 text-green-800 rounded-xl border border-green-200 animate-slide-up shadow-sm">
                <div className="flex items-center gap-3 border-b border-green-200 pb-4 mb-4">
                  <span className="text-3xl leading-none">✅</span>
                  <div>
                    <h4 className="font-bold text-lg text-green-900">Vote Recorded</h4>
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Valid Receipt</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                    <span className="font-semibold text-green-900">Position</span>
                    <span className="text-green-700">{result.position}</span>
                  </div>
                  {result.department && (
                    <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                      <span className="font-semibold text-green-900">Department</span>
                      <span className="text-green-700">{result.department}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                    <span className="font-semibold text-green-900">Timestamp</span>
                    <span className="text-green-700 font-mono text-xs">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[10px] text-green-600 uppercase font-bold tracking-widest bg-green-200/50 inline-block py-1 px-3 rounded-full">
                    Candidate Identity Protected
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyVote;

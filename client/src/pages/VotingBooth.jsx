import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CandidateCard from '../components/CandidateCard';
import ElectionStatus from '../components/ElectionStatus';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const POSITIONS = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];

const VotingBooth = () => {
  const { user, isElectionActive } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [finalReceipt, setFinalReceipt] = useState(null);

  // Fetch candidates
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const responses = await Promise.all(
        POSITIONS.map(async (position) => {
          let url = `/candidates?position=${position}&approved=true`;
          if (position !== 'President') {
            url += `&department=${user?.department}`;
          }
          const response = await api.get(url);
          return { position, candidates: response.data.data };
        })
      );
      return responses;
    }
  });

  // Fetch voted status
  const { data: voteStatusData } = useQuery({
    queryKey: ['voteStatus'],
    queryFn: async () => {
      const response = await api.get('/vote/status');
      return response.data.data;
    }
  });

   // Cast vote mutation
   const voteMutation = useMutation({
     mutationFn: async ({ candidateId, position, department }) => {
       const response = await api.post('/vote', {
         candidateId,
         position,
         department: position === 'President' ? null : department
       });
       return response.data;
     },
     onSuccess: (data, variables) => {
       queryClient.invalidateQueries(['voteStatus']);
       queryClient.invalidateQueries(['candidates']);
       
       // Trigger confetti on final vote
       if (currentPositionIndex === POSITIONS.length - 1) {
         setFinalReceipt(data.receiptHash || data.data?.receiptHash);
         confetti({
           particleCount: 200,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#006B3F', '#F4C430', '#10b981', '#ffffff']
         });
       }
     }
   });

  // Check if election is active
  useEffect(() => {
    if (!isElectionActive && !isLoading) {
      setToast({ message: 'Voting is not currently active', type: 'error' });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [isElectionActive, navigate, isLoading]);

  // Get voted positions
  const votedPositions = voteStatusData?.votedPositions?.map(v => v.position) || [];

  // Get candidates for current position
  const currentPosition = POSITIONS[currentPositionIndex];
  const currentCandidates = candidatesData?.find(p => p.position === currentPosition)?.candidates || [];

  // Filter out already voted for positions
  const hasVotedForPosition = votedPositions.includes(currentPosition);

  const handleSelectCandidate = (candidate) => {
    if (hasVotedForPosition) return;
    setSelectedCandidates(prev => ({
      ...prev,
      [currentPosition]: candidate
    }));
  };

  const handleSubmitVote = async () => {
    const candidate = selectedCandidates[currentPosition];
    if (!candidate) return;

    setSubmitting(true);
    try {
      await voteMutation.mutateAsync({
        candidateId: candidate._id,
        position: currentPosition,
        department: currentPosition === 'President' ? null : user.department
      });
      setToast({ message: `Vote for ${currentPosition} cast!`, type: 'success' });

      // Move to next position or show final receipt
      if (currentPositionIndex < POSITIONS.length - 1) {
        setTimeout(() => {
          setCurrentPositionIndex(prev => prev + 1);
          setSubmitting(false);
        }, 1000);
      } else {
        setSubmitting(false);
      }
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to cast vote', type: 'error' });
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentPositionIndex < POSITIONS.length - 1) {
      setCurrentPositionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-12">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-[2.5rem]" />
      </div>
    );
  }

  if (finalReceipt) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto px-4 py-12"
      >
        <div className="glass-panel p-10 text-center border-t-8 border-coop-green shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <img src="/logo.png" alt="" className="h-24 w-auto" />
          </div>
          
          <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-200">
             <motion.svg 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: 'spring', damping: 12 }}
               className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
             >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
             </motion.svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter uppercase">Ballot Signed</h1>
          <p className="text-gray-500 mb-8 font-black uppercase tracking-[0.2em] text-[10px]">Your cryptographic receipt is ready</p>
          
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-coop-green/20 to-coop-gold/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 select-all font-mono text-xs break-all text-coop-green font-black shadow-inner">
              {finalReceipt}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(finalReceipt);
                setToast({ message: 'Receipt copied to clipboard!', type: 'info' });
              }}
              className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copy Proof
            </button>
            <button 
              onClick={() => navigate('/results')}
              className="premium-btn"
            >
              View Live Results
            </button>
          </div>
          <p className="mt-8 text-[10px] text-gray-400 font-black uppercase tracking-widest">
            🔒 END-TO-END VERIFIABLE • SECURED BY AES-256
          </p>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">Voting Booth</h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">The Co-operative University of Kenya</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm">
             <CountdownTimer />
             <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
             <ElectionStatus compact />
          </div>
        </div>

        {/* Improved Progress Indicator */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-coop-green"
              initial={{ width: 0 }}
              animate={{ width: `${(votedPositions.length / POSITIONS.length) * 100}%` }}
            />
          </div>
          <div className="relative flex items-center justify-between">
            {POSITIONS.map((position, index) => {
              const isVoted = votedPositions.includes(position);
              const isCurrent = index === currentPositionIndex;
              const isPast = index < currentPositionIndex;

              return (
                <div key={position} className="flex flex-col items-center group">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg z-10 transition-all duration-500 border-4
                      ${isVoted ? 'bg-green-600 border-green-100 text-white' :
                        isCurrent ? 'bg-coop-green border-green-100 text-white shadow-xl shadow-green-900/20' :
                        'bg-white border-gray-50 text-gray-300'}
                    `}
                  >
                    {isVoted ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  <span className={`mt-3 text-[10px] font-black uppercase tracking-widest hidden sm:block ${isCurrent ? 'text-coop-green' : 'text-gray-400'}`}>
                    {position}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentPosition}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-panel p-6 sm:p-10 mb-8 border-b-8 border-coop-green relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="text-9xl font-black italic">{currentPositionIndex + 1}</span>
          </div>

          <div className="mb-10 relative z-10">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">{currentPosition}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Position {currentPositionIndex + 1} of {POSITIONS.length}
              </span>
              {currentPosition !== 'President' && (
                <span className="px-3 py-1 bg-coop-green/10 text-coop-green rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {user?.department} ONLY
                </span>
              )}
            </div>
          </div>

          {hasVotedForPosition ? (
            <div className="text-center py-16 bg-green-50/50 rounded-[2rem] border border-green-100 border-dashed">
              <div className="w-20 h-20 bg-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Vote Recorded</h3>
              <p className="text-gray-500 mt-2 font-medium">You have already cast your ballot for this position.</p>
              <button onClick={handleNext} disabled={currentPositionIndex === POSITIONS.length - 1} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Proceed to Next →
              </button>
            </div>
          ) : currentCandidates.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-gray-100 border-dashed">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">No Aspirants Found</h3>
              <p className="text-gray-500 mt-2 font-medium max-w-sm mx-auto">There are no approved candidates for this position in your department.</p>
              <button onClick={handleNext} disabled={currentPositionIndex === POSITIONS.length - 1} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Skip Position →
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 relative z-10">
              {currentCandidates.map(candidate => (
                <CandidateCard
                  key={candidate._id}
                  candidate={candidate}
                  onSelect={handleSelectCandidate}
                  isSelected={selectedCandidates[currentPosition]?._id === candidate._id}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky Navigation Footer */}
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl">
        <button
          onClick={handlePrevious}
          disabled={currentPositionIndex === 0 || submitting}
          className={`
            px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all
            ${currentPositionIndex === 0
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'}
          `}
        >
          ← Back
        </button>

        {!hasVotedForPosition && currentCandidates.length > 0 && (
          <button
            onClick={handleSubmitVote}
            disabled={!selectedCandidates[currentPosition] || submitting}
            className="premium-btn min-w-[200px]"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="spinner w-5 h-5 !border-white !border-t-transparent mr-3"></div>
                <span className="uppercase tracking-widest text-xs">Encrypting...</span>
              </div>
            ) : (
              <span className="uppercase tracking-widest text-xs">
                {currentPositionIndex === POSITIONS.length - 1 ? 'Finalize Vote 🔒' : 'Confirm Vote & Next'}
              </span>
            )}
          </button>
        )}

        {(hasVotedForPosition || currentCandidates.length === 0) && (
          <button
            onClick={handleNext}
            disabled={currentPositionIndex === POSITIONS.length - 1}
            className={`
              px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all
              ${currentPositionIndex === POSITIONS.length - 1
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-black shadow-lg'}
            `}
          >
            {currentPositionIndex === POSITIONS.length - 1 ? 'End of Ballot' : 'Next →'}
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default VotingBooth;

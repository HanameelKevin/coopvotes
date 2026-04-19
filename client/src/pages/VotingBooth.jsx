import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CandidateCard from '../components/CandidateCard';
import ElectionStatus from '../components/ElectionStatus';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import confetti from 'canvas-confetti';

const POSITIONS = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
const DEPARTMENTS = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU'];

const VotingBooth = () => {
  const { user, isElectionActive } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);

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
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries(['voteStatus']);
       queryClient.invalidateQueries(['candidates']);
       
       // Trigger confetti on final vote
       if (currentPositionIndex === POSITIONS.length - 1) {
         confetti({
           particleCount: 200,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#22c55e', '#3b82f6', '#eab308', '#a855f7']
         });
       }
     }
   });

  // Check if election is active
  useEffect(() => {
    if (!isElectionActive) {
      setToast({ message: 'Voting is not currently active', type: 'error' });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [isElectionActive, navigate]);

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
      setToast({ message: 'Vote cast successfully!', type: 'success' });

      // Move to next position or finish
      if (currentPositionIndex < POSITIONS.length - 1) {
        setTimeout(() => {
          setCurrentPositionIndex(prev => prev + 1);
          setSubmitting(false);
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/results');
        }, 1500);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4" />
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!isElectionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voting Closed</h1>
          <p className="text-gray-600">The election is not currently active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Voting Booth</h1>
          <div className="flex items-center gap-4">
             <CountdownTimer />
             <ElectionStatus compact />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          {POSITIONS.map((position, index) => {
            const isVoted = votedPositions.includes(position);
            const isCurrent = index === currentPositionIndex;
            const isPast = index < currentPositionIndex;

            return (
              <div key={position} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${isVoted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-coop-green text-white' :
                      isPast ? 'bg-gray-300 text-gray-600' :
                        'bg-gray-200 text-gray-400'}
                `}>
                  {isVoted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < POSITIONS.length - 1 && (
                  <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${isPast || isVoted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Position Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          {POSITIONS.map(position => (
            <span key={position} className="hidden sm:block text-center flex-1">
              {position}
            </span>
          ))}
        </div>
      </div>

      {/* Current Position */}
      <div className="glass-panel p-8 mb-8">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentPosition}</h2>
          {currentPosition !== 'President' && (
            <p className="text-gray-500 font-medium mt-1">
              Departmental Representation: <span className="text-coop-green">{user?.department}</span>
            </p>
          )}
        </div>

        {hasVotedForPosition ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">You have voted for this position</h3>
            <p className="text-gray-500 mt-1">Continue to the next position</p>
          </div>
        ) : currentCandidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No candidates for this position in your department.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
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
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentPositionIndex === 0}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors
            ${currentPositionIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'btn-secondary'}
          `}
        >
          Previous
        </button>

        {!hasVotedForPosition && currentCandidates.length > 0 && (
          <button
            onClick={handleSubmitVote}
            disabled={!selectedCandidates[currentPosition] || submitting}
            className="premium-btn flex items-center"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Securely Casting...
              </>
            ) : currentPositionIndex === POSITIONS.length - 1 ? (
              'Cast Final Vote 🎉'
            ) : (
              'Cast Vote & Next'
            )}
          </button>
        )}

        {hasVotedForPosition && (
          <button
            onClick={handleNext}
            disabled={currentPositionIndex === POSITIONS.length - 1}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${currentPositionIndex === POSITIONS.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'btn-primary'}
            `}
          >
            Next
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

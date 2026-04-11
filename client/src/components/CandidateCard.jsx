import { getInitials, getAvatarColor, truncate } from '../utils/helpers';

const CandidateCard = ({ candidate, onSelect, isSelected, showVotes = false, disabled = false }) => {
  const { userId, position, manifesto, votes, offlineVotes, totalVotes } = candidate;

  const candidateName = userId?.email?.split('@')[0] || 'Unknown';
  const regNumber = userId?.regNumber || '';
  const avatarUrl = candidate.image?.startsWith('http')
    ? candidate.image
    : null;

  return (
    <div
      className={`
        card relative overflow-hidden cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-coop-green bg-green-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'}
      `}
      onClick={() => !disabled && onSelect && onSelect(candidate)}
    >
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={candidateName}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className={`w-16 h-16 rounded-full ${getAvatarColor(userId?.email)} flex items-center justify-center text-white font-bold text-xl`}>
            {getInitials(userId?.email)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{candidateName}</h3>
          <p className="text-sm text-gray-500">{regNumber}</p>
          <p className="text-xs text-coop-green font-medium mt-1">{position}</p>
        </div>
      </div>

      {/* Manifesto */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {truncate(manifesto, 150)}
      </p>

      {/* Vote Count */}
      {showVotes && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Votes</span>
            <span className="text-2xl font-bold text-coop-green">{totalVotes || 0}</span>
          </div>
          {offlineVotes > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Online: {votes} | Offline: {offlineVotes}
            </p>
          )}
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-coop-green rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 opacity-50" />
      )}
    </div>
  );
};

export default CandidateCard;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CountdownTimer = () => {
  const { isElectionActive, electionStatus } = useAuth();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const endTime = electionStatus?.election?.endTime ? new Date(electionStatus.election.endTime).getTime() : null;
  const isOver = !isElectionActive || !endTime || new Date().getTime() > endTime;

  useEffect(() => {
    if (isOver || !endTime) return;

    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(intervalId);
        // Force refresh via window or context if needed
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime, isOver]);

  if (!isElectionActive) return null;
  if (!endTime) return <div className="text-sm text-gray-500 bg-white/80 p-3 rounded-lg shadow-sm border">Active Election: End Time Not Set</div>;

  return (
    <div className="glass-panel p-4 flex flex-col items-center justify-center animate-fade-in shadow-md border-t-2 border-coop-green bg-gradient-to-br from-green-50 to-white">
      <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">Time Remaining to Vote</h3>
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center text-xl font-black text-gray-800 border">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-semibold text-gray-500 mt-1 uppercase">Days</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center text-xl font-black text-gray-800 border">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-semibold text-gray-500 mt-1 uppercase">Hours</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center text-xl font-black text-coop-green border">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-semibold text-coop-green mt-1 uppercase">Mins</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-900 rounded-lg shadow flex items-center justify-center text-xl font-black text-white border">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-semibold text-gray-600 mt-1 uppercase">Secs</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

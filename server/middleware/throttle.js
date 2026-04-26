/**
 * Simple request throttling middleware to prevent memory spikes
 * and basic DDoS protection
 */
const throttle = (options = {}) => {
  const { 
    delay = 100, 
    maxConcurrent = 50 
  } = options;

  let concurrent = 0;
  const queue = [];

  const processQueue = () => {
    if (queue.length > 0 && concurrent < maxConcurrent) {
      const next = queue.shift();
      concurrent++;
      next();
    }
  };

  return (req, res, next) => {
    if (concurrent >= maxConcurrent) {
      if (queue.length > 100) {
        return res.status(503).json({
          success: false,
          message: 'Server is currently under heavy load. Please try again in a few seconds.'
        });
      }
      
      queue.push(() => {
        setTimeout(next, delay);
      });
    } else {
      concurrent++;
      next();
    }

    // Decrement concurrent count when request finishes
    res.on('finish', () => {
      concurrent--;
      processQueue();
    });

    res.on('close', () => {
      // In case connection is closed before finish
      if (res.finished) return;
      concurrent--;
      processQueue();
    });
  };
};

module.exports = throttle;

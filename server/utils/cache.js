const NodeCache = require('node-cache');

// Standard TTL is 15 seconds
const cache = new NodeCache({ stdTTL: 15, checkperiod: 20 });

module.exports = cache;

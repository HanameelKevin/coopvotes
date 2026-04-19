/**
 * Vote Encryption Service
 * Uses AES-256-GCM for end-to-end encryption
 * NEVER hardcode encryption keys - use environment variables only
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * Throws error if key is not properly configured
 */
function getEncryptionKey() {
  const key = process.env.VOTE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'VOTE_ENCRYPTION_KEY is not set in environment variables. ' +
      'Generate a secure key using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Convert hex string to Buffer
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid VOTE_ENCRYPTION_KEY length: ${keyBuffer.length} bytes. ` +
      `Expected ${KEY_LENGTH} bytes (64 hex characters).`
    );
  }

  return keyBuffer;
}

/**
 * Generate a secure encryption key
 * Use this to generate a new key for .env file
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt vote data using AES-256-GCM
 * @param {Object} voteData - Vote data to encrypt
 * @returns {Object} Encrypted vote with IV and auth tag
 */
function encryptVote(voteData) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const dataString = JSON.stringify(voteData);
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm: ALGORITHM
  };
}

/**
 * Decrypt vote data
 * @param {Object} encryptedVote - Encrypted vote object
 * @returns {Object} Decrypted vote data
 */
function decryptVote(encryptedVote) {
  const key = getEncryptionKey();

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedVote.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedVote.authTag, 'hex'));

    let decrypted = decipher.update(encryptedVote.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt vote: ' + error.message);
  }
}

/**
 * Hash data using SHA-256
 * Used for vote receipts and integrity verification
 * @param {...any} data - Data to hash
 * @returns {string} SHA-256 hash
 */
function generateHash(...data) {
  const hash = crypto.createHash('sha256');
  data.forEach(item => {
    if (typeof item === 'object') {
      hash.update(JSON.stringify(item));
    } else {
      hash.update(String(item));
    }
  });
  return hash.digest('hex');
}

/**
 * Generate vote receipt hash
 * @param {string} userId - User ID
 * @param {string} positionId - Position ID
 * @param {string} candidateId - Candidate ID
 * @param {Date} timestamp - Vote timestamp
 * @returns {string} SHA-256 receipt hash
 */
function generateVoteReceiptHash(userId, positionId, candidateId, timestamp) {
  return generateHash(userId, positionId, candidateId, timestamp.toISOString());
}

/**
 * Generate chained hash for anti-tampering
 * Each vote links to the previous vote's hash
 * @param {Object} voteData - Current vote data
 * @param {string} previousHash - Previous vote's hash
 * @returns {string} Chained hash
 */
function generateChainedHash(voteData, previousHash) {
  const dataString = JSON.stringify(voteData);
  return generateHash(dataString, previousHash || 'genesis');
}

/**
 * Verify vote integrity by checking chained hashes
 * @param {Array} voteChain - Array of votes with hash and previousHash
 * @returns {boolean} True if chain is valid
 */
function verifyVoteChain(voteChain) {
  for (let i = 0; i < voteChain.length; i++) {
    const vote = voteChain[i];
    const expectedPreviousHash = i === 0 ? 'genesis' : voteChain[i - 1].chainedHash;

    if (vote.previousHash !== expectedPreviousHash) {
      return false;
    }

    // Recalculate hash to verify
    const recalculatedHash = generateChainedHash(vote.data, vote.previousHash);
    if (recalculatedHash !== vote.chainedHash) {
      return false;
    }
  }
  return true;
}

module.exports = {
  encryptVote,
  decryptVote,
  generateHash,
  generateVoteReceiptHash,
  generateChainedHash,
  verifyVoteChain,
  generateEncryptionKey,
  ALGORITHM
};

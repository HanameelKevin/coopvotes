/**
 * Email Validator for Co-operative University of Kenya
 * Accepts official student email domains
 */

const UNIVERSITY_DOMAINS = ['student.cuk.ac.ke'];
const PRIMARY_UNIVERSITY_DOMAIN = UNIVERSITY_DOMAINS[0];

/**
 * Validate university email
 * @param {string} email
 * @returns {Object} Validation result
 */
function validateUniversityEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  // Check university domain
  const domain = normalizedEmail.split('@')[1];
  if (!UNIVERSITY_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: `Email must be one of: ${UNIVERSITY_DOMAINS.map((allowedDomain) => `@${allowedDomain}`).join(' or ')}`
    };
  }

  return {
    isValid: true,
    email: normalizedEmail,
    domain,
    localPart: normalizedEmail.split('@')[0]
  };
}

/**
 * Check if email is from university domain
 * @param {string} email
 * @returns {boolean}
 */
function isUniversityEmail(email) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return UNIVERSITY_DOMAINS.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}

/**
 * Extract username from university email
 * @param {string} email
 * @returns {string|null}
 */
function getEmailUsername(email) {
  const validation = validateUniversityEmail(email);
  if (validation.isValid) {
    return validation.localPart;
  }
  return null;
}

module.exports = {
  validateUniversityEmail,
  isUniversityEmail,
  getEmailUsername,
  UNIVERSITY_DOMAIN: PRIMARY_UNIVERSITY_DOMAIN,
  UNIVERSITY_DOMAINS,
  PRIMARY_UNIVERSITY_DOMAIN
};

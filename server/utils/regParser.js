/**
 * Registration Number Parser
 *
 * Parses registration numbers in STRICT format: "CXXX/XXXXXX/XXXX"
 * Example: "C026/405411/2024"
 * - C026 → Department code (C followed by 3 digits)
 * - 405411 → Student sequence number (6 digits)
 * - 2024 → Year of admission (4 digits)
 *
 * STRICT REGEX: ^C[0-9]{3}/[0-9]{6}/[0-9]{4}$
 */

// Department code mapping (based on C-code system)
const DEPARTMENT_MAP = {
  'C026': 'BIT',       // Business Information Technology
  'C027': 'BBM',       // Business Management
  'C028': 'CS',        // Computer Science
  'C029': 'COMM',      // Commerce
  'C030': 'LAW',       // Law
  'C031': 'EDU',       // Education
  'C032': 'ADMIN',     // Administration
  'C033': 'BSC',       // Bachelor of Science
  'C034': 'BA',        // Bachelor of Arts
  'C035': 'BCOM',      // Business Commerce
  'ADMIN': 'ADMIN'     // Admin accounts
};

// Full department names
const DEPARTMENT_NAMES = {
  'BIT': 'Business Information Technology',
  'BBM': 'Business Management',
  'CS': 'Computer Science',
  'COMM': 'Commerce',
  'LAW': 'Law',
  'EDU': 'Education',
  'ADMIN': 'Administration',
  'BSC': 'Bachelor of Science',
  'BA': 'Bachelor of Arts',
  'BCOM': 'Business Commerce',
  'BITM': 'Business IT & Management',
  'DBM': 'Diploma Business Management',
  'DIT': 'Diploma Information Technology',
  'DCS': 'Diploma Computer Science'
};

// STRICT REGEX for registration number format
const STRICT_REG_NUMBER_REGEX = /^C[0-9]{3}\/[0-9]{6}\/[0-9]{4}$/;

/**
 * Validate registration number format
 * @param {string} regNumber - Registration number to validate
 * @returns {Object} Validation result
 */
function validateRegNumberFormat(regNumber) {
  if (!regNumber || typeof regNumber !== 'string') {
    return {
      isValid: false,
      error: 'Registration number is required'
    };
  }

  const normalized = regNumber.trim().toUpperCase();

  // STRICT FORMAT CHECK: C[0-9]{3}/[0-9]{6}/[0-9]{4}
  if (!STRICT_REG_NUMBER_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Invalid registration number format. Expected format: CXXX/XXXXXX/XXXX (e.g., C026/405411/2024)'
    };
  }

  return { isValid: true, normalized };
}

/**
 * Parse registration number and extract components
 * STRICT FORMAT: CXXX/XXXXXX/XXXX (e.g., C026/405411/2024)
 * @param {string} regNumber - Registration number
 * @returns {Object} Parsed components
 */
function parseRegNumber(regNumber) {
  // Validate format first
  const validation = validateRegNumberFormat(regNumber);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const normalized = validation.normalized;

  // Handle admin accounts (special format)
  if (normalized.startsWith('ADMIN')) {
    return {
      department: 'ADMIN',
      departmentName: 'Administration',
      admissionYear: new Date().getFullYear(),
      sequence: '001',
      yearOfStudy: 0,
      isValid: true,
      isAdmin: true,
      normalized: 'ADMIN/0000/0000'
    };
  }

  // Parse STRICT format: CXXX/XXXXXX/XXXX
  const parts = normalized.split('/');
  const [deptCode, sequence, admissionYearStr] = parts;

  // Map C-code to department
  const department = DEPARTMENT_MAP[deptCode];
  if (!department) {
    throw new Error(`Unknown department code: ${deptCode}. Valid codes: ${Object.keys(DEPARTMENT_MAP).join(', ')}`);
  }

  // Parse admission year
  const admissionYear = parseInt(admissionYearStr, 10);
  if (isNaN(admissionYear) || admissionYear < 2000 || admissionYear > new Date().getFullYear() + 1) {
    throw new Error(`Invalid admission year: ${admissionYearStr}`);
  }

  // Calculate year of study
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

  let yearOfStudy = academicYear - admissionYear + 1;
  yearOfStudy = Math.min(Math.max(yearOfStudy, 1), 6);

  return {
    deptCode,
    department,
    departmentName: DEPARTMENT_NAMES[department] || department,
    admissionYear,
    sequence,
    yearOfStudy,
    isValid: true,
    isAdmin: false,
    normalized
  };
}

/**
 * Get department code from registration number
 * @param {string} regNumber
 * @returns {string} Department code
 */
function getDepartmentFromRegNumber(regNumber) {
  const parsed = parseRegNumber(regNumber);
  return parsed.department;
}

/**
 * Calculate year of study dynamically
 * @param {string} regNumber
 * @returns {number} Year of study (1-6)
 */
function calculateYearOfStudy(regNumber) {
  const parsed = parseRegNumber(regNumber);
  return parsed.yearOfStudy;
}

/**
 * Get all valid department codes
 * @returns {string[]} Array of department codes
 */
function getValidDepartments() {
  return Object.keys(DEPARTMENT_MAP);
}

/**
 * Get department name from code
 * @param {string} code
 * @returns {string} Department name
 */
function getDepartmentName(code) {
  return DEPARTMENT_NAMES[code.toUpperCase()] || code;
}

/**
 * Check if registration number matches strict format
 * @param {string} regNumber
 * @returns {boolean}
 */
function isValidRegNumberFormat(regNumber) {
  if (!regNumber || typeof regNumber !== 'string') return false;
  return STRICT_REG_NUMBER_REGEX.test(regNumber.trim().toUpperCase());
}

/**
 * Normalize registration number (uppercase, trim)
 * @param {string} regNumber
 * @returns {string} Normalized registration number
 */
function normalizeRegNumber(regNumber) {
  if (!regNumber || typeof regNumber !== 'string') return '';
  return regNumber.trim().toUpperCase();
}

/**
 * Add new department mapping (extensibility for future C-codes)
 * @param {string} cCode - C-code (e.g., C026)
 * @param {string} deptCode - Department code (e.g., BIT)
 * @param {string} deptName - Full department name
 */
function addDepartment(cCode, deptCode, deptName) {
  const upperCCode = cCode.toUpperCase();
  const upperDeptCode = deptCode.toUpperCase();

  DEPARTMENT_MAP[upperCCode] = upperDeptCode;
  DEPARTMENT_NAMES[upperDeptCode] = deptName;
}

module.exports = {
  parseRegNumber,
  getDepartmentFromRegNumber,
  calculateYearOfStudy,
  getValidDepartments,
  getDepartmentName,
  addDepartment,
  isValidRegNumberFormat,
  normalizeRegNumber,
  validateRegNumberFormat,
  DEPARTMENT_MAP,
  DEPARTMENT_NAMES,
  STRICT_REG_NUMBER_REGEX
};

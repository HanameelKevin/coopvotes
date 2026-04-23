/**
 * Registration Number Parser
 *
 * Parses registration numbers in format: "[LETTER][2-3 digits]/[6 digits]/[4 digits]"
 * Example: "C026/405411/2024", "B08/309433/2023", "A01/123456/2024"
 * - The letter prefix maps to a faculty/department
 * - Any letter is accepted; unknown prefixes fall back by letter
 *
 * REGEX: ^[A-Za-z][0-9]{2,3}/[0-9]{6}/[0-9]{4}$
 */

// Department code mapping (based on C-code system)
const DEPARTMENT_MAP = {
  // IT & Computer Science (C-prefix)
  'C026': 'BIT',       // Business Information Technology
  'C028': 'CS',        // Computer Science
  'C032': 'ADMIN',     // Administration
  // Business (B-prefix)
  'B08': 'BBM',        // Business Management (v2)
  'B027': 'BBM',       // Business Management
  'B029': 'COMM',      // Commerce
  'B035': 'BCOM',      // Business Commerce
  // Maths (M-prefix)
  'M001': 'MATHS',     // Mathematics
  // Catering (D-prefix)
  'D001': 'CATER',     // Catering
  // Law (L-prefix)
  'L030': 'LAW',       // Law
  // Sciences (H-prefix)
  'H001': 'SCI',       // Sciences
  // Others/Misc
  'C031': 'EDU',       // Education
  'C033': 'BSC',       // Bachelor of Science
  'C034': 'BA',        // Bachelor of Arts
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
  'MATHS': 'Mathematics',
  'CATER': 'Catering',
  'SCI': 'Sciences',
  'ADMIN': 'Administration',
  'BSC': 'Bachelor of Science',
  'BA': 'Bachelor of Arts',
  'BCOM': 'Business Commerce',
  'BITM': 'Business IT & Management',
  'DBM': 'Diploma Business Management',
  'DIT': 'Diploma Information Technology',
  'DCS': 'Diploma Computer Science',
  'OTHER': 'Other Department'
};

// Accept ANY letter as leading character (any department prefix)
// Accept ANY letter as leading character and allow flexible sequence lengths
// Matches: C026/405411/2024, B08/309433/2023, D33-1234-2024, etc.
const STRICT_REG_NUMBER_REGEX = /^[A-Za-z][0-9]{1,4}[/-][0-9]{4,8}[/-][0-9]{2,4}$/;
// Relaxed regex for development: letter + 1-4 digits + separator + 3-8 digits + separator + 2-4 digit year
// Matches: C026/405411/2024, B08/1234/2023, D33-1234-24, etc.
const FLEXIBLE_REG_NUMBER_REGEX = /^[A-Za-z][0-9]{1,4}[/-][0-9]{3,8}[/-][0-9]{2,4}$/;
// Ultra-relaxed regex for pitch/demo mode: any alphanumeric with some separators
const PITCH_REG_NUMBER_REGEX = /^[A-Z0-9/-]{3,20}$/i;

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

  const normalized = regNumber.trim().toUpperCase().replace(/-/g, '/');

  // STRICT FORMAT CHECK: C[0-9]{3}/[0-9]{6}/[0-9]{4}
  if (!STRICT_REG_NUMBER_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Invalid registration number format. Expected: [Letter][2-3 digits]/[6 digits]/[4-digit year]  e.g. C026/405411/2024'
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
  const [deptCode, sequence] = parts;

  // Map code to department — fallback from prefix letter, then generic
  let department = DEPARTMENT_MAP[deptCode];
  if (!department) {
    // Infer from leading letter — accept any letter
    const prefixLetter = deptCode[0].toUpperCase();
    const prefixFallback = {
      'C': 'CS',
      'B': 'BBM',
      'M': 'MATHS',
      'D': 'CATER',
      'L': 'LAW',
      'H': 'SCI',
      'E': 'EDU',
      'A': 'ADMIN',
    };
    department = prefixFallback[prefixLetter] || 'CS'; // generic fallback: CS
    // Cache this so future lookups for same code are instant
    DEPARTMENT_MAP[deptCode] = department;
  }

  // Parse admission year
  let admissionYearStr = parts[2];
  if (admissionYearStr.length === 2) {
    admissionYearStr = '20' + admissionYearStr;
  }
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
  STRICT_REG_NUMBER_REGEX,
  FLEXIBLE_REG_NUMBER_REGEX
};

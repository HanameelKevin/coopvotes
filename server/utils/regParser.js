/**
 * Registration Number Parser
 *
 * Parses registration numbers in format: "DEPT/YEAR/SEQUENCE"
 * Example: "BIT/2022/12345"
 * - BIT → Department code
 * - 2022 → Year of admission
 * - 12345 → Student sequence number
 */

// Department code mapping
const DEPARTMENT_MAP = {
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

// Valid department codes
const VALID_DEPARTMENTS = Object.keys(DEPARTMENT_MAP);

/**
 * Parse registration number and extract components
 * @param {string} regNumber - Registration number (e.g., "BIT/2022/12345")
 * @returns {Object} Parsed components
 */
function parseRegNumber(regNumber) {
  if (!regNumber || typeof regNumber !== 'string') {
    throw new Error('Registration number is required');
  }

  // Normalize: uppercase and trim
  const normalized = regNumber.trim().toUpperCase();

  // Handle admin accounts (different format)
  if (normalized.startsWith('ADMIN')) {
    return {
      department: 'ADMIN',
      admissionYear: new Date().getFullYear(),
      sequence: '001',
      yearOfStudy: 0,
      isValid: true,
      isAdmin: true
    };
  }

  // Parse standard format: DEPT/YEAR/SEQUENCE
  const parts = normalized.split('/');

  if (parts.length < 2) {
    throw new Error('Invalid registration number format. Expected: DEPT/YEAR/SEQUENCE');
  }

  const [deptCode, admissionYearStr, sequence] = parts;

  // Validate department
  if (!VALID_DEPARTMENTS.includes(deptCode)) {
    throw new Error(`Unknown department code: ${deptCode}. Valid codes: ${VALID_DEPARTMENTS.join(', ')}`);
  }

  // Parse admission year
  const admissionYear = parseInt(admissionYearStr, 10);
  if (isNaN(admissionYear) || admissionYear < 2000 || admissionYear > new Date().getFullYear()) {
    throw new Error(`Invalid admission year: ${admissionYearStr}`);
  }

  // Calculate year of study
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1; // Academic year starts in September

  let yearOfStudy = academicYear - admissionYear + 1;

  // Cap at 6 (max years for most programs)
  yearOfStudy = Math.min(Math.max(yearOfStudy, 1), 6);

  return {
    department: deptCode,
    departmentName: DEPARTMENT_MAP[deptCode],
    admissionYear,
    sequence: sequence || '000',
    yearOfStudy,
    isValid: true,
    isAdmin: false
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
  return VALID_DEPARTMENTS;
}

/**
 * Get department name from code
 * @param {string} code
 * @returns {string} Department name
 */
function getDepartmentName(code) {
  return DEPARTMENT_MAP[code.toUpperCase()] || code;
}

/**
 * Add new department mapping (extensibility)
 * @param {string} code - Department code
 * @param {string} name - Full department name
 */
function addDepartment(code, name) {
  const upperCode = code.toUpperCase();
  if (!VALID_DEPARTMENTS.includes(upperCode)) {
    VALID_DEPARTMENTS.push(upperCode);
  }
  DEPARTMENT_MAP[upperCode] = name;
}

module.exports = {
  parseRegNumber,
  getDepartmentFromRegNumber,
  calculateYearOfStudy,
  getValidDepartments,
  getDepartmentName,
  addDepartment,
  DEPARTMENT_MAP
};

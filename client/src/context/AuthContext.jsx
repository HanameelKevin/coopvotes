import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// Co-operative University of Kenya faculties and departments
export const FACULTIES = [
  {
    name: 'School of Business',
    code: 'BUS',
    departments: [
      { code: 'BBM', name: 'Business Management' },
      { code: 'BCOM', name: 'Business Commerce' },
      { code: 'COMM', name: 'Commerce' },
      { code: 'ADMIN', name: 'Administration' }
    ]
  },
  {
    name: 'School of Computing & Mathematics',
    code: 'SCM',
    departments: [
      { code: 'CS', name: 'Computer Science' },
      { code: 'BIT', name: 'Business Information Technology' },
      { code: 'MATHS', name: 'Mathematics' }
    ]
  },
  {
    name: 'School of Co-operative & Community Development',
    code: 'SCCD',
    departments: [
      { code: 'CATER', name: 'Co-operative and Community Development' }
    ]
  },
  {
    name: 'School of Agriculture & Environmental Sciences',
    code: 'SAES',
    departments: [
      { code: 'AGRI', name: 'Agriculture' },
      { code: 'ENV', name: 'Environmental Sciences' }
    ]
  },
  {
    name: 'School of Education & Social Sciences',
    code: 'SESS',
    departments: [
      { code: 'EDU', name: 'Education' },
      { code: 'BA', name: 'Bachelor of Arts' }
    ]
  },
  {
    name: 'School of Science',
    code: 'SSCI',
    departments: [
      { code: 'BSC', name: 'Bachelor of Science' },
      { code: 'SCI', name: 'Sciences' }
    ]
  },
  {
    name: 'School of Law',
    code: 'SL',
    departments: [
      { code: 'LAW', name: 'Law' }
    ]
  }
];

// Get all departments flattened
export const getAllDepartments = () => {
  return FACULTIES.flatMap(faculty =>
    faculty.departments.map(dept => ({
      ...dept,
      facultyCode: faculty.code,
      facultyName: faculty.name
    }))
  );
};

// Get department by code
export const getDepartmentByCode = (code) => {
  for (const faculty of FACULTIES) {
    const dept = faculty.departments.find(d => d.code === code);
    if (dept) {
      return {
        ...dept,
        facultyCode: faculty.code,
        facultyName: faculty.name
      };
    }
  }
  return null;
};

// Get faculty by department code
export const getFacultyByDeptCode = (deptCode) => {
  return FACULTIES.find(f => f.departments.some(d => d.code === deptCode)) || null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [electionStatus, setElectionStatus] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    // Restore department from sessionStorage if available
    return sessionStorage.getItem('selectedDepartment') || null;
  });

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Persist department selection
  useEffect(() => {
    if (selectedDepartment) {
      sessionStorage.setItem('selectedDepartment', selectedDepartment);
    } else {
      sessionStorage.removeItem('selectedDepartment');
    }
  }, [selectedDepartment]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        if (response.data && response.data.data) {
          setUser(response.data.data);
          // Also fetch election status
          fetchElectionStatus().catch(err => console.error("Election status fetch failed:", err));
        } else {
          throw new Error("Invalid response format");
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionStatus = async () => {
    try {
      const response = await api.get('/auth/election-status');
      setElectionStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch election status:', error);
    }
  };

  const login = async (email, regNumber) => {
    const response = await api.post('/auth/login', { email, regNumber, department: selectedDepartment });
    // If it requires OTP, just return the data to the component
    if (response.data.data && response.data.data.requiresOtp) {
      return response.data.data;
    }
    
    // Fallback if no OTP (shouldn't happen with new flow, but safe)
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setUser(userData);
    fetchElectionStatus().catch(() => {});
    return userData;
  };

  const verifyOtp = async (userId, otp) => {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setUser(userData);
    fetchElectionStatus().catch(() => {});
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
    setElectionStatus(null);
  };

  const refreshElectionStatus = async () => {
    await fetchElectionStatus();
  };

  const clearDepartmentSelection = useCallback(() => {
    setSelectedDepartment(null);
    sessionStorage.removeItem('selectedDepartment');
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    electionStatus,
    isElectionActive: electionStatus?.isActive || false,
    selectedDepartment,
    setSelectedDepartment: (dept) => {
      setSelectedDepartment(dept);
    },
    clearDepartmentSelection,
    login,
    verifyOtp,
    logout,
    refreshElectionStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

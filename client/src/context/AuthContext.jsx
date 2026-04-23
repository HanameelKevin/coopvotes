import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

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

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

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
    const response = await api.post('/auth/login', { email, regNumber });
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

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    electionStatus,
    isElectionActive: electionStatus?.isActive || false,
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

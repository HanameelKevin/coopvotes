import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUniversityEmail } from '../utils/helpers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !regNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (!isUniversityEmail(email)) {
      setError('Please use your university email (@student.cuk.ac.ke)');
      return;
    }

    setLoading(true);

    try {
      await login(email.toLowerCase().trim(), regNumber.toUpperCase().trim());
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-coop-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">CV</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CoopVotes</h1>
          <p className="text-gray-600 mt-2">
            The Co-operative University of Kenya
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Student Voting Management System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Student Login
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                University Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@coop.ac.ke"
                className="input"
                autoComplete="email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use @student.cuk.ac.ke email
              </p>
            </div>

            {/* Registration Number Field */}
            <div>
              <label htmlFor="regNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                id="regNumber"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="BIT/2022/12345"
                className="input uppercase"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: DEPT/YEAR/NUMBER (e.g., BIT/2022/12345)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              First time logging in? Your account will be created automatically
              using your registration number.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} The Co-operative University of Kenya. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;

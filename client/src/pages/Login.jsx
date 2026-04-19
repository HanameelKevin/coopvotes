import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUniversityEmail } from '../utils/helpers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const { login, verifyOtp } = useAuth();
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
      if (!otpStep) {
        const data = await login(email.toLowerCase().trim(), regNumber.toUpperCase().trim());
        if (data.requiresOtp) {
          setTempUserId(data.userId);
          setUserEmail(data.email);
          setOtpStep(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        if (otp.length !== 6) {
          setError('OTP must be 6 digits');
          setLoading(false);
          return;
        }
        await verifyOtp(tempUserId, otp);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
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
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coop-green to-coop-gold"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center tracking-tight">
            Student Login
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-xl text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!otpStep ? (
              <>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    University Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@coop.ac.ke"
                    className="input bg-white/50 backdrop-blur-sm shadow-inner"
                    autoComplete="email"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    Use @student.cuk.ac.ke email
                  </p>
                </div>

                {/* Registration Number Field */}
                <div>
                  <label htmlFor="regNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number
                  </label>
                   <input
                    type="text"
                    id="regNumber"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="C026/405411/2024"
                    className="input uppercase bg-white/50 backdrop-blur-sm shadow-inner tracking-wider"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    Format: CXXX/XXXXXX/XXXX (e.g., C026/405411/2024)
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* OTP Field */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    An OTP has been sent to <strong>{userEmail}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Please check your email and enter the 6-digit code below to securely log in.
                  </p>
                </div>
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    id="otp"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="input text-center text-2xl tracking-[0.5em] font-mono bg-white/50 backdrop-blur-sm shadow-inner h-14"
                    autoComplete="one-time-code"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="premium-btn w-full flex items-center justify-center mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {otpStep ? 'Verifying OTP...' : 'Authenticating...'}
                </>
              ) : (
                otpStep ? 'Verify Securely' : 'Secure Sign In'
              )}
            </button>
            {otpStep && (
              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2 font-medium"
              >
                ← Back to Login
              </button>
            )}
          </form>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              First time logging in? Your account will be created automatically
              using your registration number.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8 font-medium">
          &copy; {new Date().getFullYear()} The Co-operative University of Kenya. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;

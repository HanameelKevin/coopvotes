import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDepartmentByCode } from '../context/AuthContext';
import { isUniversityEmail, getEmailHelpMessage } from '../utils/helpers';
import { motion } from 'framer-motion';

const Login = () => {
  const { login, verifyOtp, selectedDepartment } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [devOtp, setDevOtp] = useState(null);

  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  // Redirect to department selection if no department selected
  useEffect(() => {
    if (!selectedDepartment) {
      navigate('/');
    }
  }, [selectedDepartment, navigate]);

  // Get department info
  const deptInfo = getDepartmentByCode(selectedDepartment);

  // Pre-fill test credentials in development
  useEffect(() => {
    if (isDevMode && !email && !regNumber && !otpStep) {
      setEmail('test@gmail.com');
      setRegNumber('B08/1234/2023');
    }
  }, [isDevMode, otpStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !regNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (!isUniversityEmail(email) && !isDevMode) {
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
          if (data.devOtp) {
            setDevOtp(data.devOtp);
            // In dev mode, we can auto-fill if we want, but user requested "OTP should: Be displayed in UI (for testers)"
            // setOtp(data.devOtp);
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        if (otp.length !== 6 && !isDevMode) {
          setError('OTP must be 6 digits');
          setLoading(false);
          return;
        }
        await verifyOtp(tempUserId, otp);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-0 overflow-hidden bg-slate-50">
      <div className="tech-grid opacity-30"></div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col lg:flex-row w-full max-w-6xl bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden z-10"
      >

        {/* Left Side: Branding / Info (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-coop-green to-emerald-900 p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-coop-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <img src="/logo.png" alt="CUK Logo" className="h-20 w-auto shadow-2xl mb-8" />
            <h1 className="text-5xl font-black text-white leading-tight mb-4 font-outfit">
              Secure <br /> University <br /> Voting.
            </h1>
            <div className="w-20 h-1.5 bg-coop-gold rounded-full mb-8"></div>
            <p className="text-white/80 text-xl font-medium tracking-wide">
              The Co-operative University of Kenya <br /> Main Campus — Karen.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4 text-white/90 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">🗳️</div>
              <div>
                <p className="font-bold">Encrypted Ballots</p>
                <p className="text-sm text-white/60 font-medium">AES-256 Military Grade Security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-white/90 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">🔐</div>
              <div>
                <p className="font-bold">Immutable Ledger</p>
                <p className="text-sm text-white/60 font-medium">Transparent & Verifiable Results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center bg-white/30">
          <div className="max-w-md mx-auto w-full">
            <div className="flex justify-center mb-10 lg:hidden">
              <img src="/logo.png" alt="CUK Logo" className="h-16 w-auto" />
            </div>

            <div className="text-left mb-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Student Login</h2>
              <p className="text-gray-500 font-medium">Authenticate to access your secure ballot.</p>
              
              {deptInfo && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-2xl bg-coop-green/5 border border-coop-green/10"
                >
                  <span className="w-2.5 h-2.5 bg-coop-green rounded-full mr-3 animate-pulse"></span>
                  <span className="text-sm font-bold text-coop-green/80 uppercase tracking-wider">{deptInfo.code}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="text-sm font-bold text-gray-700">{deptInfo.name}</span>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-start shadow-sm"
              >
                <span className="text-xl mr-3 mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">Login Error</p>
                  <p className="text-sm font-medium opacity-90">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!otpStep ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                      University Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-coop-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. j.doe@student.cuk.ac.ke"
                        className="input pl-12"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[11px] text-coop-green/70 mt-2 font-bold flex items-center ml-1">
                      <svg className="w-3.5 h-3.5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      {getEmailHelpMessage()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="regNumber" className="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                      Registration Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-coop-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="regNumber"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder="e.g. C026/405411/2024"
                        className="input pl-12 uppercase tracking-widest font-bold"
                        autoComplete="off"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner border border-green-100">🔑</div>
                    <h3 className="text-2xl font-black text-gray-900">Verify Identity</h3>
                    <p className="text-sm text-gray-500 mt-2 font-medium">A secure code has been dispatched to <br /> <span className="text-coop-green font-bold">{userEmail}</span></p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="otp" className="block text-xs font-black uppercase tracking-[0.3em] text-gray-400 text-center">
                      6-DIGIT SECURITY CODE
                    </label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••••"
                      className="input text-center text-4xl font-black tracking-[0.4em] py-6"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={loading}
                    />
                  </div>

                  {isDevMode && devOtp && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm"
                    >
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <span className="text-amber-600 text-sm font-black uppercase tracking-tighter">Developer Bypass Mode</span>
                      </div>
                      <p className="text-xs text-amber-700 text-center font-bold">
                        OTP: <span className="text-2xl font-black ml-2 text-amber-900 tabular-nums">{devOtp}</span>
                      </p>
                      <button 
                        type="button"
                        onClick={() => setOtp(devOtp)}
                        className="w-full mt-3 py-2 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 transition-colors uppercase tracking-widest"
                      >
                        Auto-Fill Dev OTP
                      </button>
                    </motion.div>
                  )}
                  
                  <button 
                    type="button" 
                    onClick={() => setOtpStep(false)}
                    className="w-full text-sm font-bold text-gray-400 hover:text-coop-green transition-colors py-2"
                  >
                    ← Back to Login
                  </button>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="premium-btn w-full flex items-center justify-center py-5 group"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="spinner w-5 h-5 !border-white !border-t-transparent"></div>
                      <span className="font-black uppercase tracking-widest text-sm">Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg font-black uppercase tracking-tighter">{otpStep ? 'Verify & Enter' : 'Get Secure OTP'}</span>
                      <svg className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-2">
                Certified Secure System
              </p>
              <div className="flex justify-center space-x-4 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                <img src="/logo.png" alt="CUK Logo" className="h-6 w-auto" />
                <div className="h-6 w-px bg-gray-300"></div>
                <span className="text-[10px] font-black self-center">COOPVOTES v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

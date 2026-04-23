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
  const [devOtp, setDevOtp] = useState(null);
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Pre-fill test credentials in development
  if (import.meta.env.MODE === 'development' && !email && !regNumber && !otpStep) {
    setEmail('test@gmail.com');
    setRegNumber('B08/1234/2023');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !regNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (!isUniversityEmail(email)) {
      const devMsg = import.meta.env.MODE === 'development'
        ? 'Only university emails (@student.cuk.ac.ke) are allowed in production. Development mode bypass.'
        : 'Please use your university email (@student.cuk.ac.ke)';
      setError(devMsg);
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
            setOtp(data.devOtp);
            setDevOtp(data.devOtp);
          }
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
      const msg = err.response?.data?.message || 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-0 overflow-hidden">
      <div className="tech-grid opacity-50"></div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden z-10 animate-entrance">

        {/* Left Side: Branding / Info (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-coop-green to-emerald-900 p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

          <div className="relative z-10">
            <img src="/logo.png" alt="CUK Logo" className="h-20 w-auto brightness-0 invert shadow-2xl mb-8" />
            <h1 className="text-5xl font-black text-white leading-tight mb-4 font-outfit">
              Secure <br /> University <br /> Voting.
            </h1>
            <div className="w-20 h-1.5 bg-coop-gold rounded-full mb-8"></div>
            <p className="text-white/80 text-xl font-medium tracking-wide">
              The Co-operative University of Kenya <br /> Main Campus — Karen.
            </p>
            <p className="text-white/50 text-xs mt-4 font-bold uppercase tracking-[0.2em]">
              Ushirika Road, Nairobi
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4 text-white/90">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">🗳️</div>
              <div>
                <p className="font-bold">Encrypted Ballots</p>
                <p className="text-sm text-white/60">AES-256 Military Grade Security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-white/90">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">🔐</div>
              <div>
                <p className="font-bold">Immutable Ledger</p>
                <p className="text-sm text-white/60">Blockchain-inspired Transparency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="flex justify-center mb-10 lg:hidden">
              <img src="/logo.png" alt="CUK Logo" className="h-16 w-auto" />
            </div>

            <div className="text-left mb-10">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Student Login</h2>
              <p className="text-gray-500 font-medium">Please enter your credentials to proceed to the voting booth.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-2xl border border-red-100 flex items-center animate-slide-up">
                <span className="text-xl mr-3">⚠️</span>
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!otpStep ? (
                <>
                  <div className="animate-slide-up stagger-1">
                    <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                      Student Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. j.doe@student.cuk.ac.ke"
                      className="input bg-white"
                      autoComplete="email"
                    />
                    <p className="text-[10px] text-coop-green mt-2 font-bold flex items-center ml-1">
                      <span className="w-1.5 h-1.5 bg-coop-green rounded-full mr-2"></span>
                      USE YOUR STUDENT EMAIL
                    </p>
                  </div>

                  <div className="animate-slide-up stagger-2">
                    <label htmlFor="regNumber" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      id="regNumber"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. C026/405411/2024"
                      className="input uppercase bg-white tracking-widest"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-coop-gold mt-2 font-bold flex items-center ml-1">
                      <span className="w-1.5 h-1.5 bg-coop-gold rounded-full mr-2"></span>
                      USE STUDENT REGISTRATION NUMBER
                    </p>
                  </div>
                </>
              ) : (
                <div className="animate-slide-up">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔑</div>
                    <h3 className="text-xl font-bold text-gray-900">One-Time Password</h3>
                    <p className="text-sm text-gray-500 mt-1">We've sent a 6-digit code to <br /> <span className="text-coop-green font-bold">{userEmail}</span></p>
                  </div>

                  <label htmlFor="otp" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 text-center">
                    ENTER SECURE OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="input text-center text-3xl font-black tracking-[0.5em] bg-white"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  {devOtp && (
                    <p className="text-xs text-amber-600 mt-4 text-center bg-amber-50 py-2 rounded-lg border border-amber-100 font-bold">
                      Dev Mode: Auto-filled OTP <span className="text-lg underline ml-1">{devOtp}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 animate-slide-up stagger-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="premium-btn w-full flex items-center justify-center group py-5"
                >
                  {loading ? (
                    <div className="spinner w-6 h-6 !border-white !border-t-transparent"></div>
                  ) : (
                    <>
                      <span className="text-lg font-black tracking-tighter">{otpStep ? 'VERIFY & ENTER' : 'START VOTING'}</span>
                      <svg className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-8 font-medium">
              &copy; {new Date().getFullYear()} The Co-operative University of Kenya. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, FACULTIES, getDepartmentByCode } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';

const DepartmentSelection = () => {
  const { selectedDepartment, setSelectedDepartment } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('faculty'); // 'faculty' or 'department'
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter faculties based on search
  const filteredFaculties = useMemo(() => {
    if (!debouncedSearchTerm) return FACULTIES;
    const term = debouncedSearchTerm.toLowerCase();
    return FACULTIES.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.departments.some(d => d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term))
    );
  }, [debouncedSearchTerm]);

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setStep('department');
  };

  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept.code);
    setTimeout(() => navigate('/login'), 400);
  };

  const handleBack = () => {
    if (step === 'department') {
      setStep('faculty');
      setSelectedFaculty(null);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-0 overflow-hidden bg-slate-50">
      <div className="tech-grid opacity-30"></div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row w-full max-w-6xl bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden z-10"
      >

        {/* Left Side: Branding / Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-coop-green to-emerald-900 p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-coop-gold/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <img src="/logo.png" alt="CUK Logo" className="h-20 w-auto shadow-2xl mb-8" />
            <h1 className="text-5xl font-black text-white leading-tight mb-4 font-outfit">
              Select Your <br /> Department.
            </h1>
            <div className="w-20 h-1.5 bg-coop-gold rounded-full mb-8"></div>
            <p className="text-white/80 text-xl font-medium tracking-wide">
              The Co-operative University of Kenya <br /> Main Campus — Karen.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4 text-white/90 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">🎓</div>
              <div>
                <p className="font-bold">Faculty Segmented</p>
                <p className="text-sm text-white/60 font-medium">Department-based Voting</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-white/90 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">🗳️</div>
              <div>
                <p className="font-bold">Verified Ballots</p>
                <p className="text-sm text-white/60 font-medium">End-to-end Verifiable Results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Department Selection */}
        <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center bg-white/30">
          <div className="max-w-md mx-auto w-full">

            {/* Breadcrumb / Progress */}
            <div className="flex items-center mb-10">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm ${step === 'faculty' ? 'bg-coop-green text-white shadow-green-200 scale-110' : 'bg-green-100 text-coop-green'}`}>
                    {step === 'faculty' ? '1' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${step === 'department' ? 'bg-coop-green' : 'bg-gray-100'}`}></div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm ${step === 'department' ? 'bg-coop-green text-white shadow-green-200 scale-110' : 'bg-gray-100 text-gray-400'}`}>2</div>
                </div>
                <div className="flex justify-between mt-3 px-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'faculty' ? 'text-coop-green' : 'text-gray-400'}`}>Choose Faculty</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'department' ? 'text-coop-green' : 'text-gray-400'}`}>Specify Dept</span>
                </div>
              </div>
            </div>

            <div className="text-left mb-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                {step === 'faculty' ? 'Where do you study?' : `Select Department`}
              </h2>
              <p className="text-gray-500 font-medium">
                {step === 'faculty'
                  ? 'Identify your faculty to narrow down the department list.'
                  : `Currently viewing departments in ${selectedFaculty?.name}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'faculty' ? (
                <motion.div
                  key="faculty-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Search */}
                  <div className="relative group mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-coop-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search schools or programs..."
                      className="input pl-12"
                    />
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredFaculties.map((faculty) => (
                      <button
                        key={faculty.code}
                        onClick={() => handleFacultySelect(faculty)}
                        className="w-full text-left p-5 rounded-2xl border border-white bg-white/40 hover:bg-white/80 hover:border-coop-green/30 hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300 group relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <h3 className="font-black text-gray-900 group-hover:text-coop-green transition-colors tracking-tight">
                              {faculty.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-wider">
                              {faculty.departments.length} SPECIALIZATIONS
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase tracking-widest group-hover:bg-coop-green/10 group-hover:text-coop-green">
                              {faculty.code}
                            </span>
                            <svg className="w-5 h-5 text-gray-300 group-hover:text-coop-green group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="dept-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleBack}
                    className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-coop-green transition-colors mb-6"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Change Faculty
                  </button>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedFaculty?.departments.map((dept) => (
                      <button
                        key={dept.code}
                        onClick={() => handleDepartmentSelect(dept)}
                        className={`w-full text-left p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                          selectedDepartment === dept.code
                            ? 'border-coop-green bg-coop-green/5 shadow-xl shadow-green-900/10'
                            : 'border-white bg-white/40 hover:bg-white/80 hover:border-coop-green/30 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <h3 className="font-black text-gray-900 tracking-tight">{dept.name}</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedFaculty.name}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                              selectedDepartment === dept.code ? 'bg-coop-green text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {dept.code}
                            </span>
                            {selectedDepartment === dept.code && (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }}
                                className="w-6 h-6 bg-coop-green rounded-full flex items-center justify-center text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-2">
                The Co-operative University of Kenya
              </p>
              <div className="flex justify-center items-center space-x-4">
                <span className="text-[10px] font-black text-gray-300">EST. 1952</span>
                <div className="h-4 w-px bg-gray-100"></div>
                <span className="text-[10px] font-black text-gray-300">VOTING PORTAL</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default DepartmentSelection;


import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDepartmentByCode } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, selectedDepartment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const deptInfo = getDepartmentByCode(selectedDepartment || user?.department);

  const navLinks = {
    student: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/vote', label: 'Vote', icon: '🗳️' },
      { to: '/results', label: 'Results', icon: '📈' },
      { to: '/verify', label: 'Audit', icon: '🛡️' }
    ],
    aspirant: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/aspirant', label: 'My Campaign', icon: '📣' },
      { to: '/results', label: 'Results', icon: '📈' },
      { to: '/verify', label: 'Audit', icon: '🛡️' }
    ],
    admin: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/admin', label: 'Admin Panel', icon: '⚙️' },
      { to: '/results', label: 'Results', icon: '📈' },
      { to: '/verify', label: 'Audit', icon: '🛡️' }
    ],
  };

  const links = navLinks[user?.role] || navLinks.student;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Department */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="flex items-center group">
              <img 
                src="/logo.png" 
                alt="CoopVotes Logo" 
                className="h-12 w-auto transition-transform group-hover:scale-110 duration-500"
              />
              <div className="ml-3 hidden lg:block">
                <span className="block text-xl font-black text-gray-900 leading-none tracking-tighter">COOPVOTES</span>
                <span className="block text-[10px] font-black text-coop-green uppercase tracking-[0.2em]">Secure Election System</span>
              </div>
            </Link>

            {deptInfo && (
              <div className="hidden md:flex items-center px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="w-2 h-2 bg-coop-green rounded-full mr-3 animate-pulse"></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Your Department</p>
                  <p className="text-xs font-bold text-gray-700 leading-none">{deptInfo.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            {links.map(link => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center
                    ${isActive 
                      ? 'text-coop-green bg-white shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}
                  `}
                >
                  <span className="mr-2 opacity-80">{link.icon}</span>
                  {link.label}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-coop-green rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 p-1.5 pr-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
              >
                <div className={`w-10 h-10 rounded-xl ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                  {getInitials(user?.email)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">
                    {user?.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-coop-green rounded-full mr-1.5"></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role}</span>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 mb-2 border-b border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Registration</p>
                      <p className="text-sm font-black text-gray-700">{user?.regNumber || 'N/A'}</p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold text-sm group"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-100 bg-white/50 backdrop-blur-lg px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {links.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex flex-col items-center py-2 rounded-xl transition-all
                  ${isActive ? 'bg-coop-green/10 text-coop-green' : 'text-gray-400'}
                `}
              >
                <span className="text-xl mb-1">{link.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tighter">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

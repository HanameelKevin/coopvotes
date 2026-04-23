import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../utils/helpers';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = {
    student: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/vote', label: 'Vote' },
      { to: '/results', label: 'Results' },
      { to: '/verify', label: 'Audit Portal' }
    ],
    aspirant: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/aspirant', label: 'My Campaign' },
      { to: '/results', label: 'Results' },
      { to: '/verify', label: 'Audit Portal' }
    ],
    admin: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/admin', label: 'Admin Panel' },
      { to: '/results', label: 'Results' },
      { to: '/verify', label: 'Audit Portal' }
    ],
  };

  const links = navLinks[user?.role] || navLinks.student;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="CoopVotes Logo" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 text-gray-700 hover:text-coop-green hover:bg-green-50 rounded-lg transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-medium text-sm`}>
                {getInitials(user?.email)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="flex justify-around py-2">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-3 text-sm text-gray-700 hover:text-coop-green hover:bg-green-50 rounded-lg transition-colors duration-200 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

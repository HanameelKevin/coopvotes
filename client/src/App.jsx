import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';
import PageTransition from './components/PageTransition';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const DepartmentSelection = lazy(() => import('./pages/DepartmentSelection'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VotingBooth = lazy(() => import('./pages/VotingBooth'));
const AspirantDashboard = lazy(() => import('./pages/AspirantDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Results = lazy(() => import('./pages/Results'));
const VerifyVote = lazy(() => import('./pages/VerifyVote'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PageTransition>{children}</PageTransition>;
};

// Department Required Route - Redirects to department selection if not selected
const DepartmentRequiredRoute = ({ children }) => {
  const { user, loading, selectedDepartment } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  // If user is authenticated, go to dashboard
  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  // If no department selected and NOT at root, redirect to department selection
  if (!selectedDepartment && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  return <PageTransition>{children}</PageTransition>;
};

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Navbar />}
      <main className={`flex-grow ${user ? 'pt-16' : ''}`}>
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route 
                path="/" 
                element={
                  <DepartmentRequiredRoute>
                    <DepartmentSelection />
                  </DepartmentRequiredRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <DepartmentRequiredRoute>
                    <Login />
                  </DepartmentRequiredRoute>
                } 
              />
              <Route path="/verify" element={<PageTransition><VerifyVote /></PageTransition>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vote"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <VotingBooth />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aspirant"
                element={
                  <ProtectedRoute allowedRoles={['aspirant', 'admin']}>
                    <AspirantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {user && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

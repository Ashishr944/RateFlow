import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { LogOut, Star, User } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  
  // Custom screen routing state when not authenticated: 'login' | 'signup'
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#07090e'
      }}>
        <span className="loading-spinner" style={{ width: '2.5rem', height: '2.5rem' }}></span>
      </div>
    );
  }

  // Render navigation bar for authenticated users
  const renderNavbar = () => {
    if (!isAuthenticated || !user) return null;
    return (
      <header className="navbar">
        <div className="logo">
          <Star size={20} fill="#6366f1" />
          <span>RateFlow</span>
        </div>
        <div className="nav-links">
          <div className="user-badge">
            <User size={14} />
            <span style={{ fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
            <span className={`role-tag ${user.role.toLowerCase()}`}>{user.role}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>
    );
  };

  // Render correct dashboard screen based on role
  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'USER':
        return <UserDashboard />;
      case 'OWNER':
        return <OwnerDashboard />;
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Unknown system role. Please contact support.</h2>
            <button className="btn-primary" onClick={logout}>Log Out</button>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {renderNavbar()}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isAuthenticated ? (
          renderDashboard()
        ) : authScreen === 'login' ? (
          <Login onNavigateToSignup={() => setAuthScreen('signup')} />
        ) : (
          <Signup onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </main>
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

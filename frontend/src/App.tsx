// File: frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import MyApplications from './pages/MyApplications';
import JobDetails from './pages/JobDetails';
import EmployerJobs from './pages/EmployerJobs';
import EmployerJobApplications from './pages/EmployerJobApplications';

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ 
      padding: '1rem', 
      borderBottom: '1px solid #ccc', 
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/subscription">Subscription</Link>
        {user && user.role === 'jobseeker' && (
          <Link to="/my-applications">My Applications</Link>
        )}
        {user && user.role === 'employer' && (
          <Link to="/employer/jobs">Employer</Link>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span>
              Logged in as {user.email} ({user.role}
              {user.role === 'jobseeker' && user.isSubscribed && ', subscribed'})
            </span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <div style={{ padding: '0 2rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/employer/jobs" element={<EmployerJobs />} />
            <Route path="/employer/jobs/:id/applications" element={<EmployerJobApplications />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
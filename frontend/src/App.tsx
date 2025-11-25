import { Link, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import EmployerJobs from './pages/EmployerJobs';
import EmployerJobApplications from './pages/EmployerJobApplications';
import Login from './pages/Login';
import Register from './pages/Register';
import JobDetails from './pages/JobDetails';
import MyApplications from './pages/MyApplications';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="App">
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderBottom: '1px solid #ddd',
          marginBottom: '1rem'
        }}
      >
        {/* Left side: navigation links */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Home</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/subscription">Subscription</Link>
          {user && user.role === 'jobseeker' && (
            <Link to="/my-applications">My Applications</Link>
          )}
          <Link to="/employer/jobs">Employer</Link>
        </div>

        {/* Right side: auth status */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span>
                Logged in as <strong>{user.email}</strong>{' '}
                ({user.role}
                {user.role === 'jobseeker' && user.isSubscribed ? ', subscribed' : ''}
                )
              </span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/employer/jobs" element={<EmployerJobs />} />
          <Route
            path="/employer/jobs/:id/applications"
            element={<EmployerJobApplications />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

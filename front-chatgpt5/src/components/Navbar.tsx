import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkStyle: React.CSSProperties = {
  marginRight: "1rem",
  textDecoration: "none",
  color: "#1f2933",
};

const activeStyle: React.CSSProperties = {
  fontWeight: 600,
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isJobseeker = user?.role === "jobseeker";
  const isEmployer = user?.role === "employer";

  return (
    <header
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "0.75rem 1.5rem",
        marginBottom: "1rem",
        backgroundColor: "#f9fafb",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <div>
          <Link to="/" style={linkStyle}>
            <strong style={activeStyle}>Job Portal</strong>
          </Link>
          <Link to="/" style={linkStyle}>
            Home
          </Link>
          <Link to="/profile" style={linkStyle}>
            Profile
          </Link>
          <Link to="/subscription" style={linkStyle}>
            Subscription
          </Link>
          {isJobseeker && (
            <Link to="/my-applications" style={linkStyle}>
              My Applications
            </Link>
          )}
          {isEmployer && (
            <Link to="/employer/jobs" style={linkStyle}>
              Employer
            </Link>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {!user && (
            <>
              <Link to="/login" style={linkStyle}>
                Login
              </Link>
              <Link to="/register" style={linkStyle}>
                Register
              </Link>
            </>
          )}
          {user && (
            <>
              <span style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                Logged in as <strong>{user.email}</strong> ({user.role}
                {user.role === "jobseeker" && user.isSubscribed ? ", subscribed" : ""})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

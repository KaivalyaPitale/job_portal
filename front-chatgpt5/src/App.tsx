import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import MyApplications from "./pages/MyApplications";
import JobDetails from "./pages/JobDetails";
import EmployerJobs from "./pages/EmployerJobs";
import EmployerJobApplications from "./pages/EmployerJobApplications";

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
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
          <Route
            path="*"
            element={
              <div>
                <h2>Page not found</h2>
                <p>The page you requested does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;

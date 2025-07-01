import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentShifts, setRecentShifts] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    api.get('/dashboard')
      .then(res => {
        setStats(res.data.stats);
        setRecentShifts(res.data.recentShifts);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="dashboard">
      {/* Header with Logo */}
      <header className="dashboard-header">
        <img src="/logo.png" alt="Nurse Duty Manager" className="logo" />
        <h1>Welcome, {user?.name || 'Admin'}!</h1>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          icon="👩⚕️" 
          title="Active Nurses" 
          value={stats?.activeNurses || 0} 
        />
        <StatCard 
          icon="🛌" 
          title="Patients Today" 
          value={stats?.currentPatients || 0} 
        />
        <StatCard 
          icon="📅" 
          title="Shifts Today" 
          value={stats?.todaysShifts || 0} 
        />
      </div>

      {/* Recent Shifts Table */}
      <div className="recent-shifts">
        <h2>Recent Shifts</h2>
        <ShiftTable shifts={recentShifts} />
      </div>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

// Component: Stat Card
const StatCard = ({ icon, title, value }) => (
  <div className="stat-card">
    <span className="stat-icon">{icon}</span>
    <h3>{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
);

// Component: Footer
const DashboardFooter = () => (
  <footer className="dashboard-footer">
    <p>Last updated: {new Date().toLocaleString()}</p>
    <div className="social-links">
      <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer"></a>
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { IconButton } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeNurses: 0,
    currentPatients: 0,
    todaysShifts: 0
  });
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
          value={stats.activeNurses} 
        />
        <StatCard 
          icon="🛌" 
          title="Patients Today" 
          value={stats.currentPatients} 
        />
        <StatCard 
          icon="📅" 
          title="Shifts Today" 
          value={stats.todaysShifts} 
        />
      </div>

      {/* Recent Shifts Table */}
      <div className="recent-shifts">
        <h2>Recent Shifts</h2>
        <ShiftTable shifts={recentShifts} />
      </div>

      {/* Single Footer Section - Clean Implementation */}
      <footer style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <IconButton 
            href="https://wa.me/1234567890" 
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            size="small"
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
          <IconButton 
            href="mailto:contact@example.com"
            aria-label="Email"
            size="small"
          >
            <EmailIcon fontSize="small" />
          </IconButton>
        </div>
        <p style={{ margin: '5px 0', color: '#6c757d' }}>
          © {new Date().getFullYear()} Nurse Duty Manager • v1.0.0
        </p>
        <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '0.9em' }}>
          Last updated: {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
}

// StatCard Component
const StatCard = ({ icon, title, value }) => (
  <div className="stat-card">
    <span className="stat-icon">{icon}</span>
    <h3>{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
);

// ShiftTable Component (simplified)
const ShiftTable = ({ shifts }) => {
  return (
    <div className="shift-table">
      {shifts.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift Type</th>
              <th>Assigned Nurse</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift._id}>
                <td>{new Date(shift.date).toLocaleDateString()}</td>
                <td>{shift.shiftType}</td>
                <td>{shift.assignedNurse?.name || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No shifts scheduled</p>
      )}
    </div>
  );
};
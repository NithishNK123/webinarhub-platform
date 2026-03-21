import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Users from './Users';
import Webinars from './Webinars';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const navItemStyle = (path: string) => ({
    padding: '1rem',
    display: 'block',
    textDecoration: 'none',
    color: location.pathname.includes(path) ? '#6200EA' : '#333',
    backgroundColor: location.pathname.includes(path) ? '#f0f0f0' : 'transparent',
    fontWeight: location.pathname.includes(path) ? 'bold' : 'normal',
    borderLeft: location.pathname.includes(path) ? '4px solid #6200EA' : '4px solid transparent'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, color: '#6200EA' }}>Webinar HUB</h3>
          <small style={{ color: '#666' }}>Admin Portal</small>
        </div>
        
        <nav style={{ flex: 1, marginTop: '1rem' }}>
          <Link to="/dashboard/users" style={navItemStyle('users')}>👥 Users</Link>
          <Link to="/dashboard/webinars" style={navItemStyle('webinars')}>🎥 Webinars</Link>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, backgroundColor: '#fafafa', overflowY: 'auto', padding: '2rem' }}>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/webinars" element={<Webinars />} />
        </Routes>
      </div>
    </div>
  );
}

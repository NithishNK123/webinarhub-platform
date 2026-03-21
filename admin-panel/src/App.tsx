import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Users, Video, LogOut } from 'lucide-react';
import api from './services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        setError('Unauthorized: Admin access required.');
        setLoading(false);
        return;
      }
      localStorage.setItem('adminToken', data.tokens.accessToken);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Invalid credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        <h1>WebinarHub Admin</h1>
        <p>Enter your credentials to manage the platform</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@webinarhub.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

const DashboardData = ({ view }: { view: 'users' | 'webinars' }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = view === 'users' ? '/v1/admin/users' : '/v1/admin/webinars';
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  const toggleBan = async (id: string, currentlyBlocked: boolean) => {
    try {
      const endpoint = currentlyBlocked ? `/v1/admin/users/${id}/unban` : `/v1/admin/users/${id}/ban`;
      await api.post(endpoint);
      fetchData(); // refresh list
    } catch (error) {
      alert('Action failed');
    }
  };

  const deleteWebinar = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this webinar?')) return;
    try {
      await api.delete(`/v1/admin/webinars/${id}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete webinar');
    }
  };

  if (loading) return <div className="loader">Loading cloud data...</div>;

  return (
    <div className="glass-panel table-container">
      {view === 'users' ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                    {user.isBlocked ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td>
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => toggleBan(user.id, user.isBlocked)}
                      className={user.isBlocked ? 'btn-success' : 'btn-danger'}
                    >
                      {user.isBlocked ? 'Unban User' : 'Ban User'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Host Email</th>
              <th>Domain</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(webinar => (
              <tr key={webinar.id}>
                <td style={{ fontWeight: 500 }}>{webinar.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{webinar.host?.email || 'Unknown'}</td>
                <td><span className="badge active">{webinar.domain || 'Global'}</span></td>
                <td>
                  <button onClick={() => deleteWebinar(webinar.id)} className="btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>No webinars scheduled</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [view, setView] = useState<'users' | 'webinars'>('users');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <h2>HUB Admin</h2>
        <div className={`nav-item ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
          <Users size={20} /> Users Management
        </div>
        <div className={`nav-item ${view === 'webinars' ? 'active' : ''}`} onClick={() => setView('webinars')}>
          <Video size={20} /> Webinars
        </div>
        <div className="nav-item logout" onClick={handleLogout}>
          <LogOut size={20} /> Secure Logout
        </div>
      </div>
      <div className="main-content">
        <div className="header">
          <h1>{view === 'users' ? 'Platform Users' : 'Active Webinars'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Manage the global scale of the WebinarHub platform.
          </p>
        </div>
        <DashboardData view={view} />
      </div>
    </div>
  );
};

const App = () => {
  const isAuthenticated = !!localStorage.getItem('adminToken');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

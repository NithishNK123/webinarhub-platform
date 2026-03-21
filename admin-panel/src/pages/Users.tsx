import { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/v1/admin/users');
      setUsers(res.data);
    } catch (err) {
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (user: User) => {
    if (user.role === 'admin') {
      alert('Cannot modify another an administrator');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ${user.isBlocked ? 'unban' : 'ban'} ${user.name}?`)) return;

    try {
      if (user.isBlocked) {
        await api.patch(`/v1/admin/users/${user.id}/unban`);
      } else {
        await api.patch(`/v1/admin/users/${user.id}/ban`);
      }
      fetchUsers(); // Refresh
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Manage Users</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>{u.name}</td>
                <td style={{ padding: '1rem' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ backgroundColor: u.role === 'admin' ? '#ffe0e0' : '#e0e0ff', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: u.isBlocked ? 'red' : 'green', fontWeight: 'bold' }}>
                  {u.isBlocked ? 'BANNED' : 'ACTIVE'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => toggleBan(u)}
                    disabled={u.role === 'admin'}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: u.isBlocked ? '#4caf50' : '#ff4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                      opacity: u.role === 'admin' ? 0.5 : 1
                    }}
                  >
                    {u.isBlocked ? 'UNBAN' : 'BAN'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No users found</div>}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';

interface Webinar {
  id: string;
  title: string;
  status: string;
  host: {
    name: string;
    email: string;
  };
}

export default function Webinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebinars = async () => {
    try {
      const res = await api.get('/v1/admin/webinars');
      setWebinars(res.data);
    } catch (err) {
      alert('Failed to fetch webinars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebinars();
  }, []);

  const deleteWebinar = async (webinar: Webinar) => {
    if (!window.confirm(`SEVERE WARNING: Are you sure you want to permanently delete "${webinar.title}"?`)) return;

    try {
      await api.delete(`/v1/admin/webinars/${webinar.id}`);
      fetchWebinars(); // Refresh list after successful wipe
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete webinar');
    }
  };

  if (loading) return <div>Loading webinars...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Manage Hosted Webinars</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Host Details</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {webinars.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{w.title}</td>
                <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: '#e0f7fa', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', color: '#006064', fontWeight: 'bold' }}>
                        {w.status.toUpperCase()}
                    </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div>{w.host.name}</div>
                  <small style={{ color: '#666' }}>{w.host.email}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => deleteWebinar(w)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#ff4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Delete Content
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {webinars.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No webinars found</div>}
      </div>
    </div>
  );
}

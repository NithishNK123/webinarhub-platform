import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Normal Login (Assuming admin credentials just log in through normal auth, 
      // but only pass through API calls if role='admin' in DB)
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data;
      
      // Step 2: Store token securely
      localStorage.setItem('adminToken', accessToken);
      
      // Step 3: Redirect to Admin Dashboard
      navigate('/dashboard/users');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
      <form onSubmit={handleLogin} style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Admin Portal</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        
        <input 
          type="email" 
          placeholder="Admin Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ width: '100%', padding: '0.8rem', marginBottom: '1.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '0.8rem', backgroundColor: '#6200EA', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Authenticating...' : 'LOGIN'}
        </button>
      </form>
    </div>
  );
}

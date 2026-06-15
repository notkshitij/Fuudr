import React, { useState } from 'react';

export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'Fuudr@2718') {
      setIsAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#fff',
      flexDirection: 'column',
      fontFamily: 'var(--sans)'
    }}>
      <h2 style={{ fontFamily: 'var(--xl)', fontSize: '32px', marginBottom: '8px' }}>Admin Access</h2>
      <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>Please enter the portal password.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
        <input 
          type="password" 
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Enter Password"
          autoFocus
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: error ? '1px solid red' : '1px solid #333',
            background: '#111',
            color: '#fff',
            outline: 'none',
            fontSize: '16px',
            textAlign: 'center',
            letterSpacing: '2px'
          }}
        />
        {error && <span style={{ color: 'red', fontSize: '13px', textAlign: 'center' }}>Incorrect password</span>}
        <button type="submit" style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'var(--acc)',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          Enter Portal
        </button>
      </form>
    </div>
  );
}

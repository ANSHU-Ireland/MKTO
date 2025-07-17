import React from 'react';

const App = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      color: '#f0f6fc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: '#58a6ff',
          marginBottom: '1rem'
        }}>
          MKTO Portfolio Optimization
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#8b949e',
          marginBottom: '2rem'
        }}>
          🚀 AI-Powered Portfolio Optimization Platform
        </p>
        <div style={{
          background: '#21262d',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            ✅ Frontend Application Loaded<br/>
            ✅ React + Vite Development Server<br/>
            ✅ Ready for Portfolio Optimization<br/>
            🔄 Loading full application...
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;

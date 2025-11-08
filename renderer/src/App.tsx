import React from 'react';

// Simple test component to verify React is working
const App: React.FC = () => {
  console.log('🍌 App component rendered!');
  console.log('window.electron available:', !!window.electron);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      color: 'white'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>
        🍌
      </div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
        Banana4U
      </h1>
      <p style={{ fontSize: '16px', marginBottom: '20px', textAlign: 'center' }}>
        Your AI companion is ready!
      </p>

      <div style={{
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          ✅ React is working
        </p>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          ✅ Electron is running
        </p>
        <p style={{ fontSize: '14px' }}>
          {window.electron ? '✅' : '❌'} window.electron available
        </p>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
        <p>Open Developer Tools (View → Toggle Developer Tools)</p>
        <p>to see console logs and debug further</p>
      </div>
    </div>
  );
};

export default App;

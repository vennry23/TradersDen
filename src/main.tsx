import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './app/AuthWrapper';
import { AnalyticsInitializer } from './utils/analytics';
import './styles/index.scss';

const ToolSelector = () => {
  const [currentTool, setCurrentTool] = useState('ai');

  const buttonStyle = {
    padding: '10px 20px',
    margin: '0 10px',
    cursor: 'pointer'
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          style={buttonStyle}
          onClick={() => setCurrentTool('ai')}
        >
          A Tool
        </button>
        <button 
          style={buttonStyle}
          onClick={() => setCurrentTool('ldp')}
        >
          LDP Tool
        </button>
      </div>
      <iframe 
        src={currentTool === 'ai' ? '/ai/index.html' : '/Market Analyzer 2025/index.html'}
        style={{
          width: '100%',
          height: 'calc(100vh - 80px)',
          border: 'none'
        }}
      />
    </div>
  );
};

AnalyticsInitializer();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ToolSelector />
    <AuthWrapper />
  </>
);

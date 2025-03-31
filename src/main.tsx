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
    cursor: 'pointer',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={{textAlign: 'center', marginBottom: '20px'}}>
      <button 
        style={{
          ...buttonStyle,
          backgroundColor: currentTool === 'ai' ? '#1976d2' : '#2196f3'
        }}
        onClick={() => setCurrentTool('ai')}
      >
        AI Tool
      </button>
      <button 
        style={{
          ...buttonStyle,
          backgroundColor: currentTool === 'ldp' ? '#1976d2' : '#2196f3'
        }}
        onClick={() => setCurrentTool('ldp')}
      >
        Market Analyzer
      </button>

      <div style={{marginTop: '20px'}}>
        <iframe 
          src={currentTool === 'ai' ? '/ai/index.html' : '/Market Analyzer 2025/index.html'}
          style={{
            width: '100%',
            height: 'calc(100vh - 120px)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>
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

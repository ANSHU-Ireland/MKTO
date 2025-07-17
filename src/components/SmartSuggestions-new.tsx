import React from 'react';
import { useStore } from '../store/useStore';

const SmartSuggestions: React.FC = () => {
  const { suggestions, addStock, isLoadingSuggestions } = useStore();

  if (isLoadingSuggestions) {
    return (
      <div className="suggestions-header">
        <h3>Smart Suggestions</h3>
        <div className="suggestions-scroll">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="suggestion-card" style={{ opacity: 0.6 }}>
              <div className="suggestion-ticker">Loading...</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="suggestions-header">
        <h3>Smart Suggestions</h3>
      </div>
      <div className="suggestions-scroll">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.ticker} className="suggestion-card">
            <div className="suggestion-ticker">{suggestion.ticker}</div>
            <div className="suggestion-name">{suggestion.name}</div>
            <div className="suggestion-score">Score: {suggestion.score}/100</div>
            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '8px' }}>
              {suggestion.reason}
            </div>
            <button 
              className="suggestion-add-btn"
              onClick={() => addStock(suggestion.ticker)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default SmartSuggestions;

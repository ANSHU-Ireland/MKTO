import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, TrendingUp, DollarSign, BarChart3, Star, Zap } from 'lucide-react';

interface Suggestion {
  ticker: string;
  name: string;
  sector: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  reason: string;
  momentum: number;
  volatility: number;
  expectedReturn: number;
}

interface SmartSuggestionsProps {
  className?: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ className }) => {
  const { selectedStocks, budget, riskLevel, addStock, suggestions, fetchSuggestions } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoading(true);
      await fetchSuggestions();
      setIsLoading(false);
    };

    loadSuggestions();
  }, [selectedStocks, budget, riskLevel, fetchSuggestions]);

  const handleAddStock = (ticker: string) => {
    addStock(ticker);
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <BarChart3 size={16} className="text-green-400" />;
      case 'medium': return <TrendingUp size={16} className="text-yellow-400" />;
      case 'high': return <Zap size={16} className="text-red-400" />;
      default: return <BarChart3 size={16} />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className={`suggestions ${className || ''}`}>
        <div className="suggestions-header">
          <h3>Smart Suggestions</h3>
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
          </div>
        </div>
        <div className="suggestions-scroll">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="suggestion-card skeleton">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-subtitle"></div>
              <div className="skeleton-line skeleton-score"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`suggestions ${className || ''}`}>
      <div className="suggestions-header">
        <h3>Smart Suggestions</h3>
        <div className="suggestions-meta">
          <span className="suggestions-count">{suggestions.length} recommendations</span>
          <button 
            className="refresh-btn"
            onClick={() => fetchSuggestions()}
            aria-label="Refresh suggestions"
          >
            <Star size={16} />
          </button>
        </div>
      </div>
      
      <div className="suggestions-scroll" ref={scrollRef}>
        {suggestions.map((suggestion, index) => (
          <div 
            key={suggestion.ticker} 
            className="suggestion-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="suggestion-header">
              <div className="suggestion-ticker-info">
                <span className="suggestion-ticker">{suggestion.ticker}</span>
                <span className="suggestion-name">{suggestion.name}</span>
              </div>
              <button
                className="suggestion-add-btn"
                onClick={() => handleAddStock(suggestion.ticker)}
                disabled={selectedStocks.includes(suggestion.ticker)}
                aria-label={`Add ${suggestion.ticker} to portfolio`}
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="suggestion-metrics">
              <div className="metric">
                <span className="metric-label">Score</span>
                <span className={`metric-value ${getScoreColor(suggestion.score)}`}>
                  {suggestion.score}/100
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Return</span>
                <span className="metric-value text-green-400">
                  +{suggestion.expectedReturn.toFixed(1)}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Risk</span>
                <div className="metric-value-with-icon">
                  {getRiskIcon(suggestion.risk)}
                  <span className={getRiskColor(suggestion.risk)}>
                    {suggestion.risk}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="suggestion-reason">
              {suggestion.reason}
            </div>
            
            <div className="suggestion-sector">
              {suggestion.sector}
            </div>
            
            <div className="suggestion-indicators">
              <div className="indicator">
                <div className="indicator-bar">
                  <div 
                    className="indicator-fill momentum-fill"
                    style={{ width: `${Math.min(suggestion.momentum, 100)}%` }}
                  ></div>
                </div>
                <span className="indicator-label">Momentum</span>
              </div>
              <div className="indicator">
                <div className="indicator-bar">
                  <div 
                    className="indicator-fill volatility-fill"
                    style={{ width: `${Math.min(suggestion.volatility, 100)}%` }}
                  ></div>
                </div>
                <span className="indicator-label">Volatility</span>
              </div>
            </div>
          </div>
        ))}
        
        {suggestions.length === 0 && (
          <div className="no-suggestions">
            <Star size={48} className="no-suggestions-icon" />
            <h4>No suggestions available</h4>
            <p>Select some assets or adjust your budget to get personalized recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSuggestions;

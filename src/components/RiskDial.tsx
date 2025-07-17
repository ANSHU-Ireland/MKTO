import React from 'react';
import { useStore } from '../store/useStore';
import { Shield, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

interface RiskDialProps {
  className?: string;
}

const RiskDial: React.FC<RiskDialProps> = ({ className }) => {
  const { riskLevel, setRiskLevel } = useStore();

  const riskOptions = [
    {
      level: 'low' as const,
      label: 'Conservative',
      icon: Shield,
      description: 'Lower risk, stable returns',
      color: '#22c55e',
      position: { top: '15%', left: '50%', transform: 'translate(-50%, -50%)' },
      expectedReturn: '5-8%',
      volatility: 'Low'
    },
    {
      level: 'medium' as const,
      label: 'Balanced',
      icon: TrendingUp,
      description: 'Moderate risk, balanced portfolio',
      color: '#eab308',
      position: { bottom: '15%', left: '25%', transform: 'translate(-50%, 50%)' },
      expectedReturn: '8-12%',
      volatility: 'Medium'
    },
    {
      level: 'high' as const,
      label: 'Aggressive',
      icon: Zap,
      description: 'Higher risk, potential for high returns',
      color: '#ef4444',
      position: { bottom: '15%', right: '25%', transform: 'translate(50%, 50%)' },
      expectedReturn: '12-20%',
      volatility: 'High'
    }
  ];

  const selectedOption = riskOptions.find(opt => opt.level === riskLevel);

  const handleRiskSelect = (level: 'low' | 'medium' | 'high') => {
    setRiskLevel(level);
  };

  return (
    <div className={`risk-dial ${className || ''}`}>
      <div className="risk-header">
        <AlertTriangle size={24} className="risk-icon" />
        <h3>Risk Tolerance</h3>
      </div>
      
      <div className="risk-dial-container">
        <svg width="240" height="240" viewBox="0 0 240 240" className="risk-dial-bg">
          {/* Background circle */}
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="#30363d"
            strokeWidth="2"
            strokeDasharray="8 4"
            className="risk-dial-circle"
          />
          
          {/* Risk zones */}
          <defs>
            <linearGradient id="lowRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="mediumRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="highRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Risk zone arcs */}
          <path
            d="M 60 120 A 60 60 0 0 1 120 60"
            fill="none"
            stroke="url(#lowRiskGradient)"
            strokeWidth="40"
            className="risk-zone low-risk-zone"
          />
          <path
            d="M 120 180 A 60 60 0 0 1 75.26 164.74"
            fill="none"
            stroke="url(#mediumRiskGradient)"
            strokeWidth="40"
            className="risk-zone medium-risk-zone"
          />
          <path
            d="M 164.74 164.74 A 60 60 0 0 1 180 120"
            fill="none"
            stroke="url(#highRiskGradient)"
            strokeWidth="40"
            className="risk-zone high-risk-zone"
          />
        </svg>
        
        {riskOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = option.level === riskLevel;
          
          return (
            <button
              key={option.level}
              className={`risk-option ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                ...option.position,
                backgroundColor: isSelected ? option.color : '#21262d',
                borderColor: option.color,
                color: isSelected ? '#0d1117' : 'white',
                boxShadow: isSelected ? `0 0 20px ${option.color}` : 'none',
                transform: isSelected 
                  ? 'translate(-50%, -50%) scale(1.2)' 
                  : option.position.transform
              }}
              onClick={() => handleRiskSelect(option.level)}
              aria-label={`Select ${option.label} risk level`}
            >
              <IconComponent size={isSelected ? 28 : 24} />
            </button>
          );
        })}
        
        {/* Center info display */}
        {selectedOption && (
          <div className="risk-center-info">
            <div className="risk-selected-label">{selectedOption.label}</div>
            <div className="risk-selected-description">{selectedOption.description}</div>
            <div className="risk-metrics">
              <div className="risk-metric">
                <span className="metric-label">Expected Return</span>
                <span className="metric-value" style={{ color: selectedOption.color }}>
                  {selectedOption.expectedReturn}
                </span>
              </div>
              <div className="risk-metric">
                <span className="metric-label">Volatility</span>
                <span className="metric-value" style={{ color: selectedOption.color }}>
                  {selectedOption.volatility}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="risk-legend">
        {riskOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = option.level === riskLevel;
          
          return (
            <div
              key={option.level}
              className={`risk-legend-item ${isSelected ? 'active' : ''}`}
              onClick={() => handleRiskSelect(option.level)}
            >
              <div 
                className="risk-legend-color"
                style={{ backgroundColor: option.color }}
              >
                <IconComponent size={16} />
              </div>
              <div className="risk-legend-text">
                <div className="risk-legend-label">{option.label}</div>
                <div className="risk-legend-desc">{option.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskDial;

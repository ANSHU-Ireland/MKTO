import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DollarSign, TrendingUp, Minus, Plus } from 'lucide-react';

interface BudgetControlProps {
  className?: string;
}

const BudgetControl: React.FC<BudgetControlProps> = ({ className }) => {
  const { budget, setBudget } = useStore();
  const [inputValue, setInputValue] = useState(budget.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  const minBudget = 1000;
  const maxBudget = 1000000;

  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(budget.toString());
    }
  }, [budget, isInputFocused]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBudget(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    const numericValue = parseInt(inputValue) || minBudget;
    const clampedValue = Math.max(minBudget, Math.min(maxBudget, numericValue));
    setBudget(clampedValue);
    setInputValue(clampedValue.toString());
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const adjustBudget = (delta: number) => {
    const newBudget = Math.max(minBudget, Math.min(maxBudget, budget + delta));
    setBudget(newBudget);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSliderPercentage = () => {
    return ((budget - minBudget) / (maxBudget - minBudget)) * 100;
  };

  const getGaugeStroke = () => {
    const percentage = getSliderPercentage();
    if (percentage < 25) return '#ef4444'; // red
    if (percentage < 50) return '#f97316'; // orange  
    if (percentage < 75) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <div className={`budget-control ${className || ''}`}>
      <div className="budget-header">
        <DollarSign size={24} className="budget-icon" />
        <h3>Investment Budget</h3>
      </div>
      
      <div className="budget-gauge">
        <svg width="200" height="200" viewBox="0 0 200 200" className="gauge-svg">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#30363d"
            strokeWidth="12"
            className="gauge-bg"
          />
          
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={getGaugeStroke()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${getSliderPercentage() * 5.03} 503`}
            transform="rotate(-90 100 100)"
            className="gauge-progress"
          />
          
          {/* Center content */}
          <foreignObject x="50" y="75" width="100" height="50">
            <div className="gauge-center">
              <div className="budget-amount">
                {formatCurrency(budget)}
              </div>
              <div className="budget-percentage">
                {Math.round(getSliderPercentage())}% of max
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>
      
      <div className="budget-controls">
        <div className="budget-input-group">
          <button
            className="budget-adjust-btn"
            onClick={() => adjustBudget(-1000)}
            disabled={budget <= minBudget}
          >
            <Minus size={16} />
          </button>
          
          <div className="budget-input-wrapper">
            <span className="budget-currency">$</span>
            <input
              type="text"
              className="budget-input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputBlur();
                }
              }}
              placeholder="Enter amount"
            />
          </div>
          
          <button
            className="budget-adjust-btn"
            onClick={() => adjustBudget(1000)}
            disabled={budget >= maxBudget}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="budget-slider-wrapper">
          <input
            type="range"
            min={minBudget}
            max={maxBudget}
            value={budget}
            onChange={handleSliderChange}
            className="budget-slider"
            step="1000"
          />
          <div className="budget-range-labels">
            <span>{formatCurrency(minBudget)}</span>
            <span>{formatCurrency(maxBudget)}</span>
          </div>
        </div>
        
        <div className="budget-presets">
          {[5000, 10000, 25000, 50000, 100000].map((preset) => (
            <button
              key={preset}
              className={`budget-preset ${budget === preset ? 'active' : ''}`}
              onClick={() => setBudget(preset)}
            >
              {formatCurrency(preset)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetControl;

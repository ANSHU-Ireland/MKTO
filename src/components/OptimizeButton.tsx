import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Zap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizeButtonProps {
  className?: string;
}

const OptimizeButton: React.FC<OptimizeButtonProps> = ({ className }) => {
  const { 
    selectedStocks, 
    budget, 
    riskLevel, 
    optimizationState, 
    optimizationProgress,
    startOptimization 
  } = useStore();
  
  const [localOptimizing, setLocalOptimizing] = useState(false);

  const isDisabled = selectedStocks.length === 0 || budget <= 0 || optimizationState === 'optimizing';
  
  const handleOptimize = async () => {
    if (isDisabled) return;
    
    setLocalOptimizing(true);
    
    try {
      await startOptimization();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLocalOptimizing(false);
    }
  };

  const getButtonContent = () => {
    if (optimizationState === 'optimizing' || localOptimizing) {
      return (
        <>
          <Loader2 size={20} className="optimize-btn-icon animate-spin" />
          Optimizing Portfolio...
        </>
      );
    }
    
    if (optimizationState === 'complete') {
      return (
        <>
          <CheckCircle size={20} className="optimize-btn-icon" />
          Optimize Again
        </>
      );
    }
    
    if (optimizationState === 'error') {
      return (
        <>
          <AlertCircle size={20} className="optimize-btn-icon" />
          Retry Optimization
        </>
      );
    }
    
    return (
      <>
        <Zap size={20} className="optimize-btn-icon" />
        Optimize Portfolio
      </>
    );
  };

  const getStatusMessage = () => {
    if (selectedStocks.length === 0) {
      return "Select at least one asset to begin optimization";
    }
    
    if (budget <= 0) {
      return "Set a budget greater than $0 to optimize";
    }
    
    if (optimizationState === 'optimizing') {
      return `Optimizing... ${Math.round(optimizationProgress)}% complete`;
    }
    
    if (optimizationState === 'complete') {
      return "Optimization complete! View results below or optimize again with different parameters.";
    }
    
    if (optimizationState === 'error') {
      return "Optimization failed. Please try again or adjust your parameters.";
    }
    
    return `Ready to optimize ${selectedStocks.length} assets with $${budget.toLocaleString()} budget at ${riskLevel} risk`;
  };

  const getStatusClass = () => {
    if (optimizationState === 'optimizing') return 'optimizing';
    if (optimizationState === 'complete') return 'complete';
    if (optimizationState === 'error') return 'error';
    return '';
  };

  return (
    <div className={`optimize-section ${className || ''}`}>
      <button
        className="optimize-btn"
        onClick={handleOptimize}
        disabled={isDisabled}
        aria-label="Optimize portfolio"
      >
        {getButtonContent()}
      </button>
      
      <div className={`optimize-status ${getStatusClass()}`}>
        {optimizationState === 'optimizing' && (
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${optimizationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default OptimizeButton;

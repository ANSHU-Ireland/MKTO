import React, { useState } from 'react';
import { 
  Menu, 
  User, 
  Moon, 
  Sun,
  Home,
  TrendingUp,
  Settings,
  BarChart3,
  Download,
  X
} from 'lucide-react';
import StockPicker from './components/StockPicker';
import SmartSuggestions from './components/SmartSuggestions';
import BudgetControl from './components/BudgetControl';
import RiskDial from './components/RiskDial';
import OptimizeButton from './components/OptimizeButton';
import { useStore } from './store/useStore';
import './styles/main.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { optimizationResults, optimizationState } = useStore();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen(!isMobileDrawerOpen);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'portfolio', label: 'Portfolio', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarButtons = [
    { icon: Home, label: 'Dashboard', active: activeTab === 'dashboard' },
    { icon: TrendingUp, label: 'Portfolio', active: activeTab === 'portfolio' },
    { icon: BarChart3, label: 'Analytics', active: activeTab === 'analytics' },
    { icon: Settings, label: 'Settings', active: activeTab === 'settings' },
  ];

  return (
    <div className="app" data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header */}
      <header>
        <button
          className="hamburger"
          onClick={toggleMobileDrawer}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="header-logo">
          <TrendingUp size={32} />
        </div>
        
        <nav className="header-nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeTab === item.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        
        <div className="header-actions">
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <div className="user-avatar">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
                setIsMobileDrawerOpen(false);
              }}
            >
              <IconComponent size={20} />
              {item.label}
            </a>
          );
        })}
      </div>

      {/* Sidebar */}
      <aside>
        {sidebarButtons.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <button
              key={index}
              className={`sidebar-btn ${button.active ? 'active' : ''}`}
              onClick={() => setActiveTab(button.label.toLowerCase())}
              title={button.label}
              aria-label={button.label}
            >
              <IconComponent size={24} />
            </button>
          );
        })}
      </aside>

      {/* Main Content */}
      <main>
        {/* Stock Picker */}
        <StockPicker />
        
        {/* Smart Suggestions */}
        <SmartSuggestions />
        
        {/* Budget & Risk Controls */}
        <div className="controls">
          <BudgetControl />
          <RiskDial />
        </div>
        
        {/* Optimize Button */}
        <OptimizeButton />
        
        {/* Results Header */}
        <div className="results-header">
          <h3>
            {optimizationState === 'complete' 
              ? `Optimization Results (${optimizationResults.length} portfolios)` 
              : 'Portfolio Results'
            }
          </h3>
          {optimizationResults.length > 0 && (
            <button className="export-btn" aria-label="Export results">
              <Download size={24} />
            </button>
          )}
        </div>
        
        {/* Results Grid */}
        <div className="results-grid">
          {optimizationResults.length > 0 ? (
            optimizationResults.map((result, index) => (
              <div key={index} className="result-card">
                <div className="card-inner">
                  <div className="card-front">
                    <div className="result-header">
                      <h4>Portfolio {index + 1}</h4>
                      <div className="result-score">
                        Score: {result.score}/100
                      </div>
                    </div>
                    <div className="result-metrics">
                      <div className="metric">
                        <span className="metric-label">Expected Return</span>
                        <span className="metric-value">
                          {result.expectedReturn?.toFixed(1) || 'N/A'}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Risk Level</span>
                        <span className="metric-value">
                          {result.riskLevel || 'Medium'}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Total Value</span>
                        <span className="metric-value">
                          ${result.totalValue?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="result-assets">
                      {result.allocations?.slice(0, 3).map((allocation, i) => (
                        <div key={i} className="asset-allocation">
                          <span className="asset-symbol">{allocation.symbol}</span>
                          <span className="asset-weight">
                            {allocation.weight?.toFixed(1) || '0'}%
                          </span>
                        </div>
                      )) || (
                        <div className="no-allocations">No allocations available</div>
                      )}
                    </div>
                  </div>
                  <div className="card-back">
                    <div className="detailed-allocations">
                      <h5>Detailed Allocations</h5>
                      {result.allocations?.map((allocation, i) => (
                        <div key={i} className="detailed-allocation">
                          <div className="allocation-info">
                            <span className="allocation-symbol">{allocation.symbol}</span>
                            <span className="allocation-name">
                              {allocation.name || allocation.symbol}
                            </span>
                          </div>
                          <div className="allocation-metrics">
                            <span className="allocation-weight">
                              {allocation.weight?.toFixed(1) || '0'}%
                            </span>
                            <span className="allocation-value">
                              ${allocation.value?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <div className="no-detailed-allocations">
                          No detailed allocations available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <BarChart3 size={64} className="no-results-icon" />
              <h4>No optimization results yet</h4>
              <p>
                Select assets, set your budget and risk preference, then click 
                "Optimize Portfolio" to see personalized portfolio recommendations.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about" aria-label="About">
              <TrendingUp size={20} />
            </a>
            <a href="#help" aria-label="Help">
              <Settings size={20} />
            </a>
            <a href="#contact" aria-label="Contact">
              <User size={20} />
            </a>
          </div>
          <div className="footer-version">
            MKTO Portfolio Optimizer v2.0.0
          </div>
        </div>
        
        {/* Animated Background */}
        <div className="footer-animation">
          <div className="floating-particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

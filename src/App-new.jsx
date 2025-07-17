import React, { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiSettings, FiList, FiZap, FiX, FiMenu, FiDownload, FiTrendingUp, FiTarget, FiDollarSign } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:8000';

const App = () => {
  // ---- app‑level state ----
  const [selected, setSelected] = useState(['AAPL', 'MSFT']);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(['NVDA', 'GOOGL', 'TSLA', 'AMZN']);
  const [budget, setBudget] = useState(10000);
  const [risk, setRisk] = useState('balanced'); // conservative | balanced | aggressive
  const [results, setResults] = useState([]);
  const [optimizedPortfolio, setOptimizedPortfolio] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('optimize'); // optimize | analytics | settings
  const [darkMode, setDarkMode] = useState(true);

  // ---- API functions ----
  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/assets`);
      const data = await response.json();
      setAvailableAssets(data.assets);
      const symbols = data.assets.map(asset => asset.symbol);
      setSuggestions(symbols.slice(0, 6)); // First 6 as suggestions
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Use fallback suggestions if API fails
      setSuggestions(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA']);
    }
  };

  const optimizePortfolio = async () => {
    if (selected.length === 0) {
      alert('Please select at least one asset');
      return;
    }

    setIsOptimizing(true);
    try {
      const riskMapping = { conservative: 0.2, balanced: 0.5, aggressive: 0.8 };
      const response = await fetch(`${API_BASE_URL}/api/v1/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget: budget,
          assets: selected,
          risk_tolerance: riskMapping[risk]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOptimizedPortfolio(data.data);
          setResults(data.data.selected_assets.map(asset => asset.symbol));
        } else {
          alert('Optimization failed');
        }
      } else {
        // Fallback to mock optimization if backend not available
        const mockOptimization = {
          selected_assets: selected.map(symbol => ({
            symbol,
            price: Math.random() * 500 + 50,
            expected_return: Math.random() * 0.3 + 0.05,
            risk: Math.random() * 0.4 + 0.1,
            weight: 1 / selected.length
          })),
          total_value: budget,
          expected_return: Math.random() * 0.2 + 0.08,
          total_risk: Math.random() * 0.3 + 0.1,
          allocation: selected.reduce((acc, symbol) => {
            acc[symbol] = budget / selected.length;
            return acc;
          }, {})
        };
        setOptimizedPortfolio(mockOptimization);
        setResults(selected);
      }
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      // Fallback to mock data
      const mockOptimization = {
        selected_assets: selected.map(symbol => ({
          symbol,
          price: Math.random() * 500 + 50,
          expected_return: Math.random() * 0.3 + 0.05,
          risk: Math.random() * 0.4 + 0.1,
          weight: 1 / selected.length
        })),
        total_value: budget,
        expected_return: Math.random() * 0.2 + 0.08,
        total_risk: Math.random() * 0.3 + 0.1,
        allocation: selected.reduce((acc, symbol) => {
          acc[symbol] = budget / selected.length;
          return acc;
        }, {})
      };
      setOptimizedPortfolio(mockOptimization);
      setResults(selected);
    } finally {
      setIsOptimizing(false);
    }
  };

  // ---- load assets on component mount ----
  useEffect(() => {
    fetchAssets();
  }, []);

  // ---- handlers ----
  const addStock = (sym) => {
    if (!selected.includes(sym)) setSelected([...selected, sym]);
  };
  
  const removeStock = (sym) => setSelected(selected.filter((s) => s !== sym));

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !selected.includes(query.toUpperCase())) {
      addStock(query.toUpperCase());
      setQuery('');
    }
  };

  // ---- ripple util ----
  const btnRef = useRef();
  const launchRipple = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = `${d}px`;
    span.style.left = `${e.clientX - rect.left - d / 2}px`;
    span.style.top = `${e.clientY - rect.top - d / 2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  };

  // ---- render functions ----
  const renderOptimizeTab = () => (
    <div className="space-y-6">
      {/* Asset Selection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiList className="text-blue-400" />
          Select Assets
        </h2>
        
        {/* Selected Assets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((sym) => (
            <div key={sym} className="flex items-center bg-blue-600 rounded-full px-3 py-1 text-sm">
              {sym}
              <button className="ml-2 hover:text-red-300" onClick={() => removeStock(sym)}>
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Asset Form */}
        <form onSubmit={handleQuerySubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol (e.g., AAPL)"
              className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Suggestions:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {suggestions.map((sym) => {
              const asset = availableAssets.find(a => a.symbol === sym);
              return (
                <button
                  key={sym}
                  onClick={() => addStock(sym)}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-center transition-colors group"
                >
                  <div className="font-bold text-sm">{sym}</div>
                  {asset && (
                    <>
                      <div className="text-xs text-gray-400">${asset.price?.toFixed(2) || '---'}</div>
                      <div className="text-xs text-green-400">+{((asset.expected_return || 0.1) * 100).toFixed(1)}%</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget and Risk Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Budget Control */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiDollarSign className="text-green-400" />
            Investment Budget
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">${budget.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Investment</div>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$1K</span>
              <span>$100K</span>
            </div>
          </div>
        </div>

        {/* Risk Tolerance */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiTarget className="text-orange-400" />
            Risk Tolerance
          </h3>
          <div className="space-y-3">
            {[
              { key: 'conservative', label: 'Conservative', desc: 'Low risk, stable returns', color: 'green' },
              { key: 'balanced', label: 'Balanced', desc: 'Moderate risk and returns', color: 'yellow' },
              { key: 'aggressive', label: 'Aggressive', desc: 'High risk, high returns', color: 'red' }
            ].map(({ key, label, desc, color }) => (
              <button
                key={key}
                onClick={() => setRisk(key)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  risk === key
                    ? `border-${color}-500 bg-${color}-500/20`
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-400">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optimize Button */}
      <div className="text-center">
        <button
          ref={btnRef}
          onClick={(e) => {
            if (!isOptimizing) {
              launchRipple(e);
              optimizePortfolio();
            }
          }}
          disabled={isOptimizing || selected.length === 0}
          className={`px-8 py-4 rounded-lg font-bold text-lg transition-all relative overflow-hidden ${
            isOptimizing || selected.length === 0
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isOptimizing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Optimizing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FiZap />
              Optimize Portfolio
            </div>
          )}
        </button>
      </div>

      {/* Results */}
      {optimizedPortfolio && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FiTrendingUp className="text-green-400" />
              Optimized Portfolio
            </h3>
            <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded">
              <FiDownload />
            </button>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {(optimizedPortfolio.expected_return * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Expected Return</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {(optimizedPortfolio.total_risk * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Portfolio Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {optimizedPortfolio.selected_assets.length}
              </div>
              <div className="text-sm text-gray-400">Assets Selected</div>
            </div>
          </div>

          {/* Asset Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimizedPortfolio.selected_assets.map((asset) => (
              <div key={asset.symbol} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">{asset.symbol}</div>
                  <div className="text-sm text-gray-400">{(asset.weight * 100).toFixed(1)}%</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span>${asset.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Return:</span>
                    <span className="text-green-400">{(asset.expected_return * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk:</span>
                    <span className="text-red-400">{(asset.risk * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Allocation:</span>
                    <span className="font-medium">${optimizedPortfolio.allocation[asset.symbol]?.toFixed(0) || '0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Portfolio Analytics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">$25,840</div>
            <div className="text-sm text-gray-400">Total Value</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">+12.4%</div>
            <div className="text-sm text-gray-400">Total Return</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">1.8</div>
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-400">15.2%</div>
            <div className="text-sm text-gray-400">Volatility</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Performance Chart</h3>
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-gray-400">Chart visualization would go here</div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-gray-400">Toggle dark/light theme</div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <div className="font-medium mb-2">Risk Preferences</div>
            <div className="space-y-2 text-sm">
              <div>Maximum allocation per asset: 25%</div>
              <div>Rebalancing frequency: Weekly</div>
              <div>Portfolio benchmark: S&P 500</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---- main UI ----
  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <h1 className="text-xl font-bold">MKTO</h1>
              <span className="text-sm text-gray-400 hidden sm:block">Portfolio Optimization</span>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {[
                { key: 'optimize', label: 'Optimize', icon: FiZap },
                { key: 'analytics', label: 'Analytics', icon: FiTrendingUp },
                { key: 'settings', label: 'Settings', icon: FiSettings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {activeTab === 'optimize' && 'Portfolio Optimization'}
            {activeTab === 'analytics' && 'Portfolio Analytics'}
            {activeTab === 'settings' && 'Settings & Preferences'}
          </h2>
          <p className="text-gray-400">
            {activeTab === 'optimize' && 'Create and optimize your investment portfolio using advanced algorithms'}
            {activeTab === 'analytics' && 'Analyze your portfolio performance and risk metrics'}
            {activeTab === 'settings' && 'Configure your preferences and optimization parameters'}
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'optimize' && renderOptimizeTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              © 2025 MKTO Portfolio Optimization Platform
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                API Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

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
  const addStock = (sym) => {
    if (!selected.includes(sym)) setSelected([...selected, sym]);
  };
  const removeStock = (sym) => setSelected(selected.filter((s) => s !== sym));

  // ---- ripple util ----
  const btnRef = useRef();
  const launchRipple = (e) => {
    const btn = btnRef.current;
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

  // ---- UI ----
  return (
    <div className="grid grid-cols-[64px_1fr] grid-rows-[60px_1fr_120px] h-full">
      {/* HEADER */}
      <header className="col-span-2 row-start-1 row-end-2 fixed w-full h-[60px] bg-[#0d1117e6] backdrop-blur-md flex items-center z-50">
        <div className="w-8 h-8 ml-6 bg-accent rounded-full rotate-0 hover:rotate-180 transition-transform" />
        <nav className="absolute left-[720px] w-[480px] flex justify-between text-sm font-semibold">
          {['Dashboard', 'Portfolio', 'Analytics', 'Settings'].map((l) => (
            <a key={l} href="#" className="w-[120px] h-[60px] flex items-center justify-center hover:text-accent relative">
              {l}
              {l === 'Analytics' && (
                <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-accent" />
              )}
            </a>
          ))}
        </nav>
        {/* right controls */}
        <FiSun className="absolute left-[1840px] top-[18px] text-xl cursor-pointer" />
        <div className="absolute left-[1874px] top-[14px] w-8 h-8 rounded-full bg-gray-400 hover:shadow-neon cursor-pointer" />
        {/* hamburger for <1024 */}
        <FiMenu className="absolute left-[24px] top-[18px] text-xl lg:hidden" />
      </header>

      {/* SIDEBAR */}
      <aside className="row-start-2 row-end-3 bg-[#0f131a] flex flex-col items-center pt-20 gap-6">
        {[FiList, FiSettings, FiZap].map((Icon, i) => (
          <button key={i} className="w-12 h-12 text-fgBase hover:scale-110 hover:shadow-neon transition-all">
            <Icon className="w-full h-full" />
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="row-start-2 row-end-3 col-start-2 p-6 grid grid-rows-[80px_200px_240px_100px_60px_1fr] gap-4 overflow-hidden">
        {/* Row A: Stock Picker */}
        <section className="relative">
          <h2 className="absolute left-0 top-[22px] text-xl font-bold">Select Assets</h2>
          <div className="absolute left-[160px] top-[20px] right-0 h-10 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {selected.map((sym) => (
              <div key={sym} className="flex items-center bg-bgPanel rounded-full px-3 h-10 text-sm">
                {sym}
                <button className="ml-2" onClick={() => removeStock(sym)}>
                  <FiX />
                </button>
              </div>
            ))}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Ticker..."
              className="w-[300px] h-10 bg-[#202631] rounded-full px-4 text-sm focus:outline-none"
            />
          </div>
        </section>

        {/* Row B: Suggestions */}
        <section className="relative">
          <h3 className="absolute left-0 top-0 font-semibold">Smart Suggestions</h3>
          <div className="absolute left-0 top-9 right-0 h-[164px] flex gap-4 overflow-x-auto hide-scrollbar">
            {suggestions.map((sym) => (
              <div
                key={sym}
                className="w-[160px] h-[160px] bg-bgPanel rounded-lg p-4 relative hover:scale-105 hover:shadow-xl transition-transform cursor-pointer"
              >
                <div className="text-lg font-bold mb-1">{sym}</div>
                <div className="text-xs text-fgMuted">Score 87/100</div>
                <div className="text-xs text-fgMuted">Risk low</div>
                <button
                  onClick={() => addStock(sym)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#202631] flex items-center justify-center text-accent"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Row C: Budget & Risk */}
        <section className="grid grid-cols-2 gap-8">
          {/* Budget gauge placeholder */}
          <div className="relative w-full h-[240px] flex flex-col items-center justify-center">
            <svg width="240" height="240" className="absolute top-0">
              <path
                d="M10 120 A110 110 0 0 1 230 120"
                fill="none"
                stroke="#283043"
                strokeWidth="6"
              />
              <path
                d="M10 120 A110 110 0 0 1 230 120"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="6"
                strokeDasharray="345"
                strokeDashoffset={345 - (budget / 1000000) * 345}
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#58a6ff" />
                  <stop offset="100%" stopColor="#58ffc8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-[140px] w-full text-center text-2xl font-semibold">{budget.toLocaleString()}</div>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(+e.target.value)}
              className="absolute top-[200px] w-[150px] h-10 bg-[#202631] rounded-md text-center"
            />
          </div>

          {/* Risk Dial */}
          <div className="relative w-full h-[240px] flex items-center justify-center">
            {/* Plate */}
            <div className="w-[240px] h-[240px] relative">
              {[
                { key: 'low', x: 96, y: 24 },
                { key: 'mid', x: 20, y: 152 },
                { key: 'high', x: 152, y: 152 },
              ].map(({ key, x, y }) => (
                <button
                  key={key}
                  onClick={() => setRisk(key)}
                  style={{ left: x, top: y }}
                  className={`absolute w-16 h-16 rounded-full flex items-center justify-center bg-[#202631] transition-all ${
                    risk === key ? 'w-20 h-20 shadow-neon text-neon' : ''
                  }`}
                >
                  {key === 'low' ? 'C' : key === 'mid' ? 'B' : 'A'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Row D: Optimize button */}
        <section className="relative">
          <button
            ref={btnRef}
            className="absolute left-1/2 -translate-x-1/2 top-5 w-[300px] h-[60px] rounded-full bg-gradient-to-r from-accent to-neon text-[#0d1117] font-semibold hover:shadow-neon focus:outline-none overflow-hidden"
            onClick={launchRipple}
          >
            Optimize
          </button>
        </section>

        {/* Row E: Results header */}
        <section className="flex justify-between items-center px-4">
          <h3 className="text-2xl font-bold">Your Optimized Portfolio</h3>
          <button className="w-8 h-8 bg-[#202631] rounded-md flex items-center justify-center">
            <FiDownload />
          </button>
        </section>

        {/* Row F: Results Grid */}
        <section className="resultsGrid overflow-y-auto hide-scrollbar">
          {results.map((sym) => (
            <div key={sym} className="card w-[280px] h-[200px] bg-bgPanel rounded-lg flip-perspective">
              <div className="flip-inner">
                <div className="card-face flex flex-col p-4">
                  <div className="text-xl font-bold mb-2">{sym}</div>
                  <div className="text-sm text-fgMuted mb-auto">lots 29</div>
                  <div className="mt-auto text-sm">Return 5.2 %</div>
                </div>
                <div className="card-face card-back bg-bgPanel p-4 flex flex-col">
                  <div className="text-fgMuted text-xs mb-2">VaR 1.2 %</div>
                  <div className="text-fgMuted text-xs mb-2">Weight 1.8 %</div>
                  <div className="text-fgMuted text-xs">Sharpe 1.4</div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="col-span-2 row-start-3 row-end-4 relative bg-[#0b0f14] flex items-center justify-center">
        <svg viewBox="0 0 1920 120" className="absolute bottom-0 w-[3840px] h-[120px] animate-wave">
          <path
            d="M0 60 Q 480 120, 960 60 T 1920 60 L1920 120 L0 120 Z"
            fill="#161b22"
          />
        </svg>
        <div className="relative flex gap-6">
          <FiZap className="w-8 h-8" />
          <FiList className="w-8 h-8" />
          <FiSettings className="w-8 h-8" />
        </div>
      </footer>
    </div>
  );
};

export default App;
